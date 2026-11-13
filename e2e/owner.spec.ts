import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

// A fresh owner per run, so the shared review account (1234567890) keeps its role.
// The local stack has no SMS provider: we fake the send-otp response and store a known OTP
// in the e2e database the same way the backend does (see gymmigo-backend tests/e2e).
const DIGITS = `9${String(Date.now()).slice(-9)}`;
const PHONE = `+91${DIGITS}`;
const OTP = '246810';
const DB = {
  host: process.env.E2E_DB_HOST ?? '127.0.0.1',
  port: process.env.E2E_DB_PORT ?? '55432',
  user: process.env.E2E_DB_USER ?? 'postgres',
  name: process.env.E2E_DB_NAME ?? 'gymmigo_e2e',
  password: process.env.E2E_DB_PASSWORD ?? 'postgres',
};

function seedOtp(): boolean {
  const hash = createHmac('sha256', process.env.JWT_SECRET_KEY ?? 'e2e-secret').update(OTP).digest('hex');
  const sql = `INSERT INTO otp_sessions (id, phone, otp_hash, is_used, attempts, expires_at, created_at)
    VALUES ('${randomUUID()}', '${PHONE}', '${hash}', false, 0, now() + interval '5 minutes', now() + interval '1 second')`;
  try {
    execFileSync('psql', ['-h', DB.host, '-p', DB.port, '-U', DB.user, DB.name, '-qc', sql], {
      env: { ...process.env, PGPASSWORD: DB.password },
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

async function signInAsNewOwner(page: Page) {
  await page.route('**/auth/send-otp', route =>
    route.fulfill({ json: { success: true, data: { phone: PHONE, expires_in: 300, resend_after: 60 } } }),
  );
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill(DIGITS);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('group', { name: 'One-time code' })).toBeVisible();
  await page.getByLabel('Digit 1').click();
  await page.keyboard.type(OTP);

  await page.waitForURL(/\/onboarding\/role/);
  await page.getByRole('radio', { name: /Gym Owner/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/\/onboarding\/profile/);
  await page.getByLabel('Full name').fill('E2E Owner');
  await page.getByLabel('Business name').fill('E2E Fitness Pvt Ltd');
  await page.getByRole('button', { name: /Done|Continue/ }).click();
}

const SECTIONS = ['Members', 'Plans', 'Schedule', 'Finance', 'Stats', 'Clubs', 'Leads', 'Team', 'Reviews', 'Gallery', 'Equipment', 'Amenities', 'Settings'];

test('a new owner lists a gym, then every manage section renders', async ({ page }) => {
  test.skip(!seedOtp(), 'needs the local e2e database (gymmigo-backend scripts/e2e.sh)');
  test.setTimeout(120_000);
  await signInAsNewOwner(page);

  // Onboarding hands owners straight to Add gym.
  await page.waitForURL(/\/app\/gym-owner\/add-gym/);
  const gymName = `E2E Iron House ${DIGITS.slice(-4)}`;
  await page.getByPlaceholder('e.g. Iron Paradise Gym').fill(gymName);
  await page.getByPlaceholder(/Tell your future members/).fill('Strength floor, cardio deck and friendly coaches.');
  await page.getByPlaceholder('10-digit number').fill('9876543210');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByPlaceholder('50').fill('60');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'List my gym' }).click();

  // Owner home lists the new gym.
  await page.waitForURL(/\/app\/dashboard/);
  const card = page.getByRole('button', { name: `Open ${gymName}` }).or(page.getByLabel(`Open ${gymName}`));
  await expect(card.first()).toBeVisible();
  await card.first().click();

  await page.waitForURL(/\/app\/gym-owner\/gyms\/[^/]+$/);
  await expect(page.getByRole('heading', { name: gymName })).toBeVisible();
  const base = page.url();

  for (const section of SECTIONS) {
    await page.goto(`${base}/${section.toLowerCase()}`);
    await expect(page.getByRole('heading', { name: gymName }), section).toBeVisible();
    await expect(page.getByText('Gym not found'), section).toHaveCount(0);
    await expect(page.getByText(/Something went wrong/i), section).toHaveCount(0);
  }
});
