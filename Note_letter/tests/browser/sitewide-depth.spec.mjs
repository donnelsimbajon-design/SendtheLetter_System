import { test, expect } from '@playwright/test';

const account = { id: 27, username: 'depth-writer', email: 'depth@example.test', role: 'user', isActive: true };

async function mockAuthenticatedSite(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'three-dimensional-test-session');
    localStorage.setItem('user', JSON.stringify(user));
  }, account);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const body = path === '/api/auth/session' ? { user: account } : [];
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('public home, features, contact and sign-in use the 3D paper language without replacing branding', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'on');
  const hero = page.locator('.stl-depth-hero').first();
  await expect(hero).toBeVisible();
  expect(await hero.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await expect(page.locator('img[src="/sendtheletter-logo.svg"]')).toBeVisible();

  await page.goto('/services');
  await expect(page.locator('main .stl-depth-card').first()).toBeVisible();
  await page.goto('/contact');
  await expect(page.locator('main .stl-depth-card').first()).toBeVisible();
  await page.goto('/login');
  await expect(page.locator('main .stl-depth-paper')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
});

test('overview, community and messages share dimensional UI while preserving the inbox', async ({ page }, testInfo) => {
  await mockAuthenticatedSite(page);
  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'on');
  await expect(page.locator('#main-content .stl-depth-card').first()).toBeVisible();

  if (testInfo.project.name === 'desktop-chromium') {
    const rail = page.getByRole('navigation', { name: 'Workspace navigation' });
    await expect(rail.locator('.stl-depth-nav').first()).toBeVisible();
    await expect(page.locator('.stl-depth-rail')).toHaveCount(1);
  }

  await page.goto('/dashboard/community');
  await expect(page.locator('section[aria-label="Community letter feed"] .stl-depth-card').first()).toBeVisible();

  await page.goto('/dashboard/messages');
  const inbox = page.locator('#main-content .stl-depth-card.stl-depth-static').first();
  await expect(inbox).toBeVisible();
  expect(await inbox.evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
});

test('3D surfaces can be disabled and re-enabled in Settings and persist after reload', async ({ page }) => {
  await mockAuthenticatedSite(page);
  await page.goto('/dashboard/settings?tab=appearance');
  const threeD = page.getByRole('switch', { name: '3D website surfaces' });
  await expect(threeD).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'on');
  await threeD.click();
  await expect(threeD).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'off');

  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'off');
  const card = page.locator('#main-content .stl-depth-card').first();
  await expect(card).toBeVisible();
  expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'off');
  await page.goto('/dashboard/settings?tab=appearance');
  await page.getByRole('switch', { name: '3D website surfaces' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-stl-depth', 'on');
});

test('reduced-motion setting keeps cards static while leaving pages navigable', async ({ page }) => {
  await mockAuthenticatedSite(page);
  await page.goto('/dashboard/settings?tab=appearance');
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  await page.goto('/dashboard');
  const card = page.locator('#main-content .stl-depth-card').first();
  await expect(card).toBeVisible();
  expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await expect(page.getByRole('link', { name: /My library/ }).first()).toBeVisible();
});
