import { test, expect } from '@playwright/test';

const user = { id: 112, username: 'apo-tester', email: 'apo@example.test', role: 'user', isActive: true };
async function signedIn(page) {
  await page.addInitScript(profile => {
    localStorage.setItem('token', 'apo-world-browser-test');
    localStorage.setItem('user', JSON.stringify(profile));
  }, user);
  await page.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname === '/api/auth/session' ? { user } : [];
    await route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body) });
  });
}
test('Apo world is protected behind the existing sign-in', async ({ page }) => {
  await page.goto('/world');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.getByRole('heading', { name: 'Your space is waiting.' })).toBeVisible();
});
test('3D village loads and offers real controls, landmarks and writing links', async ({ page }) => {
  // Software WebGL on shared CI runners can initialize more slowly than hardware GPUs.
  test.setTimeout(75_000);
  await signedIn(page);
  await page.goto('/world');
  const canvas = page.getByTestId('apo-3d-canvas');
  await expect(canvas).toBeVisible();
  // On CI Chromium SwiftShader provides WebGL; failure must be visible, not a fake 2D screenshot.
  await expect(page.getByText('Mt. Apo-inspired Highlands')).toBeVisible({ timeout: 15000 });
  expect(await canvas.evaluate(el => Boolean(el.getContext('webgl')))).toBeTruthy();
  await page.getByRole('button', { name: 'Start exploring' }).click();
  const before = await page.getByTestId('world-position').textContent();
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  await page.keyboard.up('w');
  await expect.poll(() => page.getByTestId('world-position').textContent()).not.toBe(before);
  // The plaza is near spawn, and its 3D proximity action must work.
  await page.getByRole('button', { name: 'Return to start' }).click();
  await expect(page.getByRole('button', { name: /Interact with Letter Plaza/ })).toBeVisible();
  await page.getByRole('button', { name: /Interact with Letter Plaza/ }).click();
  await expect(page.getByRole('heading', { name: 'Letter Plaza' })).toBeVisible();
  await expect(page.getByText('1 / 6')).toBeVisible();
  await page.getByRole('button', { name: 'Close location details' }).click();
  await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible();
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('heading', { name: 'Walk into a world of letters.' })).toBeVisible();
});
test('mobile virtual controls keep 3D world within the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Touch controls are covered on mobile');
  await signedIn(page);
  await page.goto('/world');
  await expect(page.getByText('Mt. Apo-inspired Highlands')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Start exploring' }).click();
  const before = await page.getByTestId('world-position').textContent();
  const move = page.getByRole('button', { name: 'Move forward' });
  await move.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch' });
  await page.waitForTimeout(600);
  await move.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
  await expect.poll(() => page.getByTestId('world-position').textContent()).not.toBe(before);
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport + 2);
  await expect(page.getByRole('button', { name: 'Interact with nearby landmark' })).toBeVisible();
});
