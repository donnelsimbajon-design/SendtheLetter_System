import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const member = { id: 77, username: 'sticky-reader', email: 'sticky@example.test', role: 'user', isActive: true };
const letters = Array.from({ length: 18 }, (_, index) => ({
  id: 900 + index,
  authorId: member.id,
  authorName: member.username,
  title: 'A little letter ' + (index + 1),
  content: 'A thoughtful letter to keep. '.repeat(14),
  category: 'Gratitude',
  type: 'Gratitude',
  createdAt: new Date(Date.UTC(2026, 9, 22 - index)).toISOString(),
  status: 'published',
  isPublic: true,
  isArchived: false,
  isAnonymous: false,
  commentCount: 0,
  likeCount: 0,
}));

async function mockWorkspace(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'sticky-header-browser-test');
    localStorage.setItem('user', JSON.stringify(user));
  }, member);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/auth/session' ? { user: member } :
      (path === '/api/letters/public' || path === '/api/letters/mine') ? letters : [];
    await route.fulfill({
      status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test('frozen community and library headers stay readable at ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop Chromium viewport matrix');
    await page.setViewportSize({ width, height: width < 800 ? 740 : 900 });
    await mockWorkspace(page);
    for (const { path, testId, heading } of [
      { path: '/dashboard/community', testId: 'community-frozen-header', heading: 'Discover words that matter' },
      { path: '/dashboard/notes', testId: 'library-frozen-header', heading: 'My letters' },
    ]) {
      await page.goto(path);
      const header = page.getByTestId(testId);
      await expect(header).toBeVisible();
      await expect(header.getByRole('heading', { name: heading })).toBeVisible();
      await expect(header.getByText(/Write a Letter/i)).toBeVisible();
      // The workspace mobile brand is fixed at 64px; desktop has only a side rail.
      const top = width < 1024 ? 64 : 0;
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 420);
      });
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 7000 }).toBeGreaterThan(300);
      await expect.poll(async () => (await header.boundingBox())?.y ?? -100, { timeout: 7000 }).toBeGreaterThanOrEqual(top - 2);
      const box = await header.boundingBox();
      expect(box).not.toBeNull();
      expect(box.y, testId + ' pinned to the right offset').toBeLessThanOrEqual(top + 3);
      expect(box.x, testId + ' not cut off at left').toBeGreaterThanOrEqual(-3);
      expect(box.x + box.width, testId + ' not cut off at right').toBeLessThanOrEqual(width + 3);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, 'No page overflow at ' + width).toBeLessThanOrEqual(width + 3);
      if (width === 320 || width === 768 || width === 1440) {
        await mkdir('layout-snapshots', { recursive: true });
        await page.screenshot({ path: 'layout-snapshots/' + testId + '-' + width + '.png', fullPage: false });
      }
    }
  });
}

test('mobile frozen community header stays below the fixed brand navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile Chrome only');
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  const header = page.getByTestId('community-frozen-header');
  await expect(header).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 450);
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  const pinned = await header.boundingBox();
  expect(pinned.y).toBeGreaterThanOrEqual(62);
  expect(pinned.y).toBeLessThanOrEqual(67);
  await expect(header.getByRole('link', { name: /Write a letter/i })).toBeVisible();
});
