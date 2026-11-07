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
test('expired JWT is cleared locally without requesting a doomed /session', async ({ page }) => {
  let sessionRequests = 0;
  await page.addInitScript(profile => {
    const jwt = [
      btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
      btoa(JSON.stringify({ id: profile.id, exp: 1 })),
      'test-signature',
    ].join('.');
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(profile));
  }, user);
  await page.route('**/api/auth/session', route => {
    sessionRequests++;
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Expired token' }) });
  });
  await page.goto('/world');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fworld/);
  await expect(page.getByText('Your sign-in expired. Please sign in again to continue.')).toBeVisible();
  expect(sessionRequests).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('user'))).toBeNull();
});

test('signing in from the protected world returns to the actual 3D scene', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'POST, OPTIONS' },
    body: JSON.stringify({ token: 'apo-world-browser-test', user }),
  }));
  await page.goto('/world');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fworld/);
  await page.getByRole('textbox', { name: 'Email address' }).fill('apo@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/world$/);
  await expect(page.getByTestId('apo-3d-canvas')).toBeVisible();
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
  // A silent switch to the old white-tree/T-pose renderer is not an acceptable pass.
  await expect(canvas).toHaveAttribute('data-apo-renderer','three',{timeout:20000});
  expect(await canvas.evaluate(el => Boolean(el.getContext('webgl2') || el.getContext('webgl')))).toBeTruthy();
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
test('W release and lost browser focus never leave the character moving forever', async ({ page }) => {
  test.setTimeout(75_000);
  await signedIn(page);
  await page.goto('/world');
  await expect(page.getByText('Mt. Apo-inspired Highlands')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Start exploring' }).click();
  const position = () => page.getByTestId('world-position').textContent();
  await page.keyboard.down('w');
  await page.waitForTimeout(750);
  await page.keyboard.up('w');
  await page.waitForTimeout(240); // allow pending position update to settle
  const afterRelease = await position();
  await page.waitForTimeout(680);
  expect(await position()).toBe(afterRelease);
  await page.keyboard.down('w');
  await page.waitForTimeout(420);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('w');
  await page.waitForTimeout(230);
  const afterBlur = await position();
  await page.waitForTimeout(650);
  expect(await position()).toBe(afterBlur);
});

test('three original 3D avatar models can be selected and persist across reloads', async ({ page }) => {
  await signedIn(page);
  await page.goto('/world');
  const picker = page.getByRole('group', { name: 'Select 3D character model' });
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: 'Highland Ranger' }).click();
  await expect(picker.getByRole('button', { name: 'Highland Ranger' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('apo-world:avatar:v1'))).toBe('ranger');
  await page.reload();
  await expect(picker.getByRole('button', { name: 'Highland Ranger' })).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', { name: 'Story Traveler' }).click();
  expect(await page.evaluate(() => localStorage.getItem('apo-world:avatar:v1'))).toBe('traveler');
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
  await expect(page.getByRole('button', { name: 'Jump' })).toBeVisible();
  await page.getByRole('button', { name: 'Jump' }).click();
  await expect(page.getByRole('button', { name: 'Interact with nearby landmark' })).toBeVisible();
});
