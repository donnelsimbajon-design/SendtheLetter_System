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

test('homepage presents a recognizable paper envelope instead of the broken low-poly 3D scene', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByTestId('home-letter-hero');
  await expect(hero).toBeVisible();
  const envelope = hero.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' });
  await expect(envelope).toHaveAttribute('data-opened', 'false');
  await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
  await hero.getByRole('button', { name: 'Open demo envelope' }).click();
  await expect(hero.getByRole('img', { name: 'The envelope is open and a letter is emerging' })).toHaveAttribute('data-opened', 'true');
  await hero.getByRole('button', { name: 'Seal demo envelope' }).click();
  await expect(envelope).toHaveAttribute('data-opened', 'false');
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

test('public pages and authentication screens show content without obstructive WebGL banners', async ({ page }) => {
  for (const path of ['/about', '/services', '/contact', '/creator', '/login', '/signup', '/forgot-password']) {
    await page.goto(path);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
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

test('reduced motion preserves an accessible static paper envelope and writing link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.getByTestId('home-letter-hero');
  await expect(hero.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' })).toBeVisible();
  await expect(hero.getByRole('button', { name: 'Open demo envelope' })).toBeVisible();
  await hero.getByRole('button', { name: 'Open demo envelope' }).click();
  await expect(hero.getByRole('img', { name: 'The envelope is open and a letter is emerging' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Write your first letter/ })).toBeVisible();
});
