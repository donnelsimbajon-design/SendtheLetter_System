import { test, expect } from '@playwright/test';

const user = { id: 27, username: 'webgl-writer', email: 'writer@example.test', role: 'user', isActive: true };

async function mockedSession(page) {
  await page.addInitScript(account => {
    localStorage.setItem('token', 'webgl-browser-test');
    localStorage.setItem('user', JSON.stringify(account));
  }, user);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(url.pathname === '/api/auth/session' ? { user } : []),
    });
  });
}

test('homepage renders an actual perspective WebGL world, not a flat CSS shadow', async ({ page }) => {
  await page.goto('/');
  const world = page.getByRole('region', { name: 'Explore the 3D SendTheLetter story world' });
  await expect(world).toBeVisible();
  const canvas = world.locator('canvas[data-renderer="webgl"]');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => canvas.evaluate(c => c.width)).toBeGreaterThan(0);
  const renderer = await canvas.evaluate(canvas => {
    const context = canvas.getContext('webgl');
    return Boolean(context && context.getParameter(context.VERSION) && context.drawingBufferWidth > 0);
  });
  expect(renderer).toBe(true);
  await expect(world.getByRole('button', { name: 'Open 3D letter' })).toBeVisible();
  await world.getByRole('button', { name: 'Open 3D letter' }).click();
  await expect(world.getByRole('button', { name: 'Close 3D letter' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('img[src="/sendtheletter-logo.svg"]')).toBeVisible();
});

test('member sections show content without decorative 3D banners', async ({ page }) => {
  await mockedSession(page);
  const screens = [
    ['/dashboard','overview'],
    ['/dashboard/notes','library'],
    ['/dashboard/community','community'],
    ['/dashboard/messages','messages'],
    ['/dashboard/profile','profile'],
    ['/dashboard/settings?tab=appearance','settings'],
  ];
  for (const [path, kind] of screens) {
    await page.goto(path);
    // Dashboard pages should not push their actual content below a 3D banner.
    await expect(page.getByRole('region', { name: 'Interactive 3D SendTheLetter workspace' })).toHaveCount(0);
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'on');
  }
});

test('public pages and sign-in show a real 3D scene while forms remain accessible', async ({ page }) => {
  for (const path of ['/about', '/services', '/contact', '/creator', '/login', '/signup', '/forgot-password']) {
    await page.goto(path);
    const activeCanvas = page.locator('canvas[data-renderer="webgl"]:visible').first();
    await expect(activeCanvas).toBeVisible();
  }
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('turning off 3D removes WebGL rendering and keeps the writing workspace', async ({ page }) => {
  await mockedSession(page);
  await page.goto('/dashboard/settings?tab=appearance');
  const toggle = page.getByRole('switch', { name: '3D website surfaces' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'off');
  await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
  await page.goto('/dashboard/notes');
  await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Normal view' })).toBeVisible();
});

test('reduced motion uses a static 3D frame and keeps interactive controls readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const world = page.getByRole('region', { name: 'Explore the 3D SendTheLetter story world' });
  await expect(world.locator('canvas[data-renderer="webgl"]')).toBeVisible();
  await expect(world.getByRole('button', { name: 'Open 3D letter' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Write your first letter/ })).toBeVisible();
});
