import { expect, test } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('1234567890');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('Digit 1').click();
  await page.keyboard.type('123456');
  await page.waitForURL(/\/app\//);
}

const bg = (page: import('@playwright/test').Page, sel: string) =>
  page.locator(sel).first().evaluate(el => getComputedStyle(el).backgroundColor);

// rgb(241, 241, 243) is the light background token; dark is rgb(19, 19, 21).
test('theme switch applies to the whole shell and persists across reloads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await signIn(page);
  await page.goto('/app/dashboard');

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('tab', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bg(page, 'main >> xpath=..')).not.toBe('rgb(241, 241, 243)');

  await page.getByRole('tab', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('Escape');

  for (const path of ['/app/dashboard', '/app/clubs', '/app/profile']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // No subtree may force the page dark any more.
    await expect(page.locator('main [data-theme="dark"], body > #root > div[data-theme="dark"]')).toHaveCount(0);
    expect(await bg(page, 'body')).toBe('rgb(241, 241, 243)');
    expect(await bg(page, 'aside[aria-label="Sidebar"]')).not.toBe('rgb(32, 31, 34)');
  }

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('sidebar collapses to a rail and remembers it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/app/dashboard');
  const aside = page.locator('aside[aria-label="Sidebar"]');
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect.poll(async () => Math.round((await aside.boundingBox())!.width)).toBe(72);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).press('Enter');
  await expect.poll(async () => Math.round((await aside.boundingBox())!.width)).toBe(248);
});
