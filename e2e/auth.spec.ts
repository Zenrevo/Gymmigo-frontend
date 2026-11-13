import { expect, test, type Page } from '@playwright/test';

// Test account seeded by the backend's local E2E stack (OTP is fixed in that mode).
const PHONE = '1234567890';
const OTP = '123456';

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill(PHONE);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('group', { name: 'One-time code' })).toBeVisible();
  await page.getByLabel('Digit 1').click();
  await page.keyboard.type(OTP);
}

test('phone + OTP sign-in lands on the dashboard, finishing onboarding without loops', async ({ page }) => {
  await signIn(page);
  await page.waitForURL(/\/(app\/dashboard|onboarding\/role)/);

  if (page.url().includes('/onboarding/role')) {
    await page.getByRole('radio', { name: /Member/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL(/\/onboarding\/profile/);
    await page.getByLabel('Full name').fill('E2E Member');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.waitForURL(/\/onboarding\/location/);
    await page.getByRole('button', { name: 'Skip for now' }).click();
  }

  await page.waitForURL(/\/app\/dashboard/);
  // Reload proves the guard doesn't bounce a finished user back to onboarding.
  await page.reload();
  await expect(page).toHaveURL(/\/app\/dashboard/);
});

test('signed-out visitors are sent to login', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
