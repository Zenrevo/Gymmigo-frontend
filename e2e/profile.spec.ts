import { expect, test, type Page } from '@playwright/test';

// Runs against the backend's local E2E stack (fixed OTP for the review account).
const PHONE = '1234567890';
const OTP = '123456';

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
