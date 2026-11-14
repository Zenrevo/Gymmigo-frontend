import { expect, test, type Page } from '@playwright/test';

// Runs against the backend's local E2E stack. Serial: parallel first sign-ins race through onboarding.
test.describe.configure({ mode: 'serial' });
const PHONE = '1234567890';
const OTP = '123456';

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill(PHONE);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('Digit 1').click();
  await page.keyboard.type(OTP);
  await page.waitForURL(/\/(app\/dashboard|onboarding\/role)/);
  if (page.url().includes('/onboarding/role')) {
    await page.getByRole('radio', { name: /Member/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Full name').fill('E2E Member');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await page.waitForURL(/\/app\/dashboard/);
  }
}

test('run together: create a live room and land in its lobby', async ({ page }) => {
  await signIn(page);
  await page.goto('/app/run-together');
  await expect(page.getByRole('heading', { name: 'Run together' })).toBeVisible();

  await page.getByRole('link', { name: 'Create a room' }).click();
  await page.waitForURL(/\/app\/run-together\/new/);
  await page.getByLabel('Room name').fill('E2E tempo run');
  await page.getByRole('button', { name: 'Create live run' }).click();

  await page.waitForURL(/\/app\/run-room\/[0-9a-f-]{36}/);
  await expect(page.getByText('E2E tempo run').first()).toBeVisible();
  await expect(page.getByText('Room code')).toBeVisible();
  await expect(page.getByText('Track your run with the Gymmigo app')).toBeVisible();

  // The hub lists the room.
  await page.goto('/app/run-together');
  await expect(page.getByRole('button', { name: /E2E tempo run/ }).first()).toBeVisible();
});

test('run together: a bad code shows the not-found state', async ({ page }) => {
  await signIn(page);
  await page.goto('/app/run-room/ZZZZZZ');
  await expect(page.getByText(/not found|no room/i).first()).toBeVisible();
});

test('people: search finds members and opens a profile', async ({ page }) => {
  await signIn(page);
  await page.goto('/app/people');
  await expect(page.getByRole('heading', { name: 'Find people' })).toBeVisible();
  await page.getByLabel('Search people').fill('ar');
  const row = page.locator('div[role="button"]').filter({ hasText: /\w/ }).first();
  await expect(row).toBeVisible();
  await row.click();
  await page.waitForURL(/\/app\/u\//);
  await expect(page.getByText('Followers')).toBeVisible();
});
