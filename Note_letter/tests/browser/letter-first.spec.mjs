import { test, expect } from '@playwright/test';

test('first-time visitor can choose a writing prompt and carry it into signup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Some things are better in a letter/i })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Lumi, the SendTheLetter letter companion' })).toBeVisible();

  await page.getByRole('button', { name: /Say thank you/i }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for being you' })).toBeVisible();
  await page.getByRole('link', { name: /Open this writing template/i }).click();

  await expect(page).toHaveURL(/\/signup\?returnTo=/);
  const returnTo = new URL(page.url()).searchParams.get('returnTo');
  expect(returnTo).toBe('/dashboard/notes?compose=1&template=gratitude');
  await expect(page.getByRole('heading', { name: /Create your space/i })).toBeVisible();

  const password = page.locator('#password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('public features page shows implemented writing choices', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByRole('heading', { name: 'A little more room for what matters.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose what you share' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keep a letter for later' })).toBeVisible();
  await page.getByRole('link', { name: /Start a letter/ }).click();
  await expect(page).toHaveURL(/\/signup\?returnTo=/);
});

test('keyboard users can skip to the main landing content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator('main#main-content')).toBeVisible();
});

test('no horizontal page overflow on a compact mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile project only');
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['/', '/services', '/signup', '/login']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(sizes.page, 'Horizontal overflow at ' + path).toBeLessThanOrEqual(sizes.viewport + 2);
  }
});
