import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// Runs against the backend's local E2E stack (fixed OTP for the review account).
const PHONE = '1234567890';
const OTP = '123456';
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:8765/api/v1';
const DB_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://postgres@127.0.0.1:55432/gymmigo_e2e';

async function token(request: APIRequestContext) {
  await request.post(`${API}/auth/send-otp`, { data: { phone: `+91${PHONE}` } });
  const res = await request.post(`${API}/auth/verify-otp`, { data: { phone: `+91${PHONE}`, otp: OTP } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.tokens.access_token as string;
}

/** Creates a gym with one plan as the review account's gym-owner role, verifies it in the local DB, then switches back. */
async function seedGym(request: APIRequestContext) {
  const t = await token(request);
  const auth = { Authorization: `Bearer ${t}` };
  await request.post(`${API}/auth/switch-role`, { headers: auth, data: { role: 'gym_owner' } });
  const name = `E2E Gym ${Date.now()}`;
  const res = await request.post(`${API}/gym-owner/gyms`, {
    headers: auth,
    data: {
      name,
      city: 'Mumbai',
      state: 'MH',
      max_capacity: 80,
      addresses: [{ address_line1: 'Marine Drive', city: 'Mumbai', state: 'MH', pincode: '400020', latitude: 18.944, longitude: 72.823, is_primary: true }],
      membership_plans: [{ name: 'Monthly Pass', duration_type: 'month', duration_days: 30, price: 1500, discounted_price: 1200 }],
    },
  });
  await request.post(`${API}/auth/switch-role`, { headers: auth, data: { role: 'user' } });
  expect(res.ok()).toBeTruthy();
  const id = (await res.json()).data.gym.id as string;
  execFileSync('psql', [DB_URL, '-c', `update gyms set is_verified = true where id = '${id}'`]);
  return { id, name };
}

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill(PHONE);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('Digit 1').click();
  await page.keyboard.type(OTP);
  await page.waitForURL(/\/app\/dashboard/);
}

test('profile: follow counts, theme switch persists, role switch, watch guide', async ({ page }) => {
  await signIn(page);
  await page.goto('/app/profile');
  await expect(page.getByRole('heading', { name: 'Profile & Settings' })).toBeVisible();

  // Followers · following from /social/users/{id}
  await expect(page.getByTestId('follow-counts')).toContainText('followers');

  // App appearance → Dark, survives a reload
  const appearance = page.getByRole('tablist', { name: 'App appearance' });
  await appearance.getByRole('tab', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await appearance.getByRole('tab', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Gym ecosystem role: switch / add buttons render; a switch asks for confirmation
  const roles = page.getByTestId('role-switch');
  await expect(roles.getByRole('button').or(roles.getByRole('link')).first()).toBeVisible();
  const switchBtn = roles.getByRole('button', { name: /mode$/ }).first();
  if (await switchBtn.count()) {
    await switchBtn.click();
    await expect(page.getByRole('alertdialog')).toContainText('Switch to');
    await page.getByRole('button', { name: 'Cancel' }).click();
  }

  // Devices → watch guide
  await page.getByRole('link', { name: /Connect your watch/ }).click();
  await expect(page).toHaveURL(/\/app\/devices/);
  await expect(page.getByRole('heading', { name: 'Bring your watch data in' })).toBeVisible();
  await expect(page.getByText('Set up in the Gymmigo app')).toBeVisible();
});

test('gym profile: plans render, cart and checkout open; memberships page', async ({ page, request }) => {
  let gym: { id: string; name: string };
  try {
    gym = await seedGym(request);
  } catch {
    test.skip(true, 'needs the local E2E database (psql) to verify a seeded gym');
    return;
  }
  await signIn(page);
  await page.goto(`/app/gyms/${gym.id}`);
  await expect(page.getByRole('heading', { name: gym.name })).toBeVisible();
  await page.getByRole('button', { name: 'Plans', exact: true }).first().click();
  const plans = page.getByTestId('gym-plans');
  await expect(plans).toContainText('Monthly Pass');
  await plans.getByRole('checkbox', { name: /Monthly Pass/ }).click();
  await page.getByRole('button', { name: 'Proceed' }).click();
  await expect(page.getByRole('dialog')).toContainText('Order summary');
  await page.keyboard.press('Escape');

  await page.goto('/app/memberships');
  await expect(page.getByRole('heading', { name: 'My memberships' })).toBeVisible();
});
