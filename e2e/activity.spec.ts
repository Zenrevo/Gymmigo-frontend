import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// Runs against the backend's local E2E stack (fixed OTP for the review account).
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:8765/api/v1';
const PHONE = '1234567890';
const OTP = '123456';

async function apiToken(request: APIRequestContext) {
  await request.post(`${API}/auth/send-otp`, { data: { phone: `+91${PHONE}` } });
  const res = await request.post(`${API}/auth/verify-otp`, { data: { phone: `+91${PHONE}`, otp: OTP } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.tokens.access_token as string;
}

/** A 3 km loop on Marine Drive, recorded "now" so it lands in this week and today. */
async function seedRun(request: APIRequestContext, token: string, title: string) {
  const start = new Date(Date.now() - 40 * 60_000);
  const n = 60;
  const coords = Array.from({ length: n + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [72.8235 + 0.007 * Math.cos(a), 18.944 + 0.003 * Math.sin(a)];
  });
  const res = await request.post(`${API}/runs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      client_id: crypto.randomUUID(),
      activity_type: 'run',
      source: 'gps',
      surface: 'road',
      started_at: start.toISOString(),
      ended_at: new Date(start.getTime() + 1_000_000).toISOString(),
      duration_seconds: 990,
      elapsed_seconds: 1000,
      distance_meters: 3000,
      avg_pace_sec_per_km: 330,
      best_pace_sec_per_km: 310,
      calories_kcal: 190,
      elevation_gain_meters: 6,
      title,
      route: { type: 'LineString', coordinates: coords },
      route_meta: { t: coords.map((_, i) => i * 16), timestamps: coords.map((_, i) => start.getTime() + i * 16_000), segments: coords.map(() => 0), accuracy: coords.map(() => 5) },
      splits: [1, 2, 3].map(km => ({ km, distance_meters: 1000, duration_seconds: 330, pace_sec_per_km: 330, elevation_gain_meters: 2 })),
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.id as string;
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

test('member home Sports mode, activity hub, detail, share studio and delete', async ({ page, request }) => {
  const title = `E2E web run ${Date.now()}`;
  const id = await seedRun(request, await apiToken(request), title);

  await signIn(page);
  await page.getByRole('tab', { name: 'Sports' }).click();
  await expect(page.getByText('Gymmigo Run Club')).toBeVisible();
  await expect(page.getByText('Track with the Gymmigo app')).toBeVisible();
  // The mode sticks across reloads.
  await page.reload();
  await expect(page.getByText('Gymmigo Run Club')).toBeVisible();

  await page.goto('/app/activity');
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  await page.getByText(title).click();
  await expect(page).toHaveURL(new RegExp(`/app/activity/${id}`));
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Kilometre splits')).toBeVisible();

  await page.getByRole('link', { name: 'Share' }).click();
  await expect(page.getByRole('heading', { name: 'Share activity' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();

  await page.goto(`/app/activity/${id}`);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/app\/activity$/);
  await expect(page.getByText(title)).toHaveCount(0);
});
