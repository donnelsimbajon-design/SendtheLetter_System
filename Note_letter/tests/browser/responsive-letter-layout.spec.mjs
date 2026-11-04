import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const member = {
  id: 77,
  username: 'writer.with-a-long-personal-handle',
  email: 'long-address@example.test',
  role: 'user',
  isActive: true,
};
const note = {
  id: 412,
  title: 'A long letter to keep forever',
  authorId: 88,
  authorName: 'a-friend',
  content: 'Opening a letter is a personal experience. This letter should have all the available width and the comments should never cover it until I choose to open them.',
  category: 'Gratitude',
  type: 'Gratitude',
  createdAt: '2026-10-20T08:00:00.000Z',
  status: 'published',
  isPublic: true,
  isArchived: false,
  isAnonymous: false,
  commentCount: 2,
  likeCount: 3,
  letterPages: null,
  shareToken: 'a'.repeat(48),
};

async function setup(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'responsive-layout-test-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, member);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    if (path === '/api/auth/session') body = { user: member };
    if (path === '/api/letters/public') body = [note];
    if (path === '/api/letters/mine') body = [note];
    if (path.includes('/comments') || path.endsWith('/thread')) body = { entries: [], totals: [], comments: [] };
    if (path.endsWith('/repost/status')) body = { count: 0, reposted: false };
    if (path === '/api/letters/public/' + 'a'.repeat(48)) body = note;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body),
    });
  });
}

async function geometry(page, label, width) {
  const sizes = await page.evaluate(() => {
    const main = document.querySelector('main');
    const root = document.documentElement;
    const b = main?.getBoundingClientRect();
    return {
      screen: innerWidth,
      docWidth: root.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      mainLeft: Math.round(b?.left ?? 0),
      mainRight: Math.round(b?.right ?? 0),
      mainWidth: Math.round(b?.width ?? 0),
    };
  });
  console.log('DEVICE_LAYOUT ' + label + ' ' + width + ' ' + JSON.stringify(sizes));
  expect(sizes.docWidth, label + ' document overflow at ' + width).toBeLessThanOrEqual(width + 3);
  expect(sizes.bodyWidth, label + ' body overflow at ' + width).toBeLessThanOrEqual(width + 3);
  expect(sizes.mainLeft, label + ' left outside viewport').toBeGreaterThanOrEqual(-3);
  expect(sizes.mainRight, label + ' main outside viewport').toBeLessThanOrEqual(width + 3);
}

const phoneTabletDesktop = [320, 360, 390, 430, 768, 1024, 1440];

for (const width of phoneTabletDesktop) {
  test('responsive route audit at ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Viewport sweep runs once; mobile engine has its own regression');
    await page.setViewportSize({ width, height: width < 600 ? 740 : 900 });
    await setup(page);
    const screens = [
      ['overview', '/dashboard'],
      ['library', '/dashboard/notes'],
      ['community', '/dashboard/community'],
      ['messages', '/dashboard/messages'],
      ['settings', '/dashboard/settings?tab=appearance'],
    ];
    for (const [name, route] of screens) {
      await page.goto(route);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Interactive 3D SendTheLetter workspace' })).toHaveCount(0);
      await geometry(page, name, width);
      if ((width === 320 || width === 390 || width === 768 || width === 1440) && ['overview','community','messages'].includes(name)) {
        await mkdir('layout-snapshots', { recursive: true });
        await page.screenshot({ path: 'layout-snapshots/' + name + '-' + width + '.png', fullPage: false });
      }
    }
  });
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test('3D open, read first, then comments drawer at ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Viewport sweep runs once; mobile device smoke runs separately');
    await page.setViewportSize({ width, height: width < 600 ? 740 : 900 });
    await setup(page);
    await page.goto('/dashboard/community');
    await page.getByRole('button', { name: 'Read letter: A long letter to keep forever' }).click();

    const modal = page.getByRole('dialog', { name: 'Letter from a-friend' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('region', { name: 'Open the 3D letter' })).toBeVisible();
    const envelope = modal.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' });
    await expect(envelope).toBeVisible();
    await expect(envelope).toHaveAttribute('data-opened', 'false');
    await expect(modal.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
    const envelopeRect = await envelope.boundingBox();
    expect(envelopeRect).not.toBeNull();
    expect(envelopeRect.x).toBeGreaterThanOrEqual(-2);
    expect(envelopeRect.x + envelopeRect.width).toBeLessThanOrEqual(width + 2);
    await mkdir('layout-snapshots', { recursive: true });
    await page.screenshot({ path: 'layout-snapshots/paper-envelope-closed-' + width + '.png', fullPage: false });
    await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toHaveCount(0);

    await modal.getByRole('button', { name: 'Open envelope' }).click();
    await expect(modal.getByRole('img', { name: 'The envelope is open and a letter is emerging' })).toHaveAttribute('data-opened', 'true');
    await page.screenshot({ path: 'layout-snapshots/paper-envelope-open-' + width + '.png', fullPage: false });
    await modal.getByRole('button', { name: 'Read full letter' }).click();
    await expect(modal.getByTestId('full-letter-scroll')).toBeVisible();
    await expect(modal.getByText(/Opening a letter is a personal experience/)).toBeVisible();
    await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toHaveCount(0);
    const before = await modal.locator('.stl-reading-book').boundingBox();
    expect(before).not.toBeNull();
    await mkdir('layout-snapshots', { recursive: true });
    await page.screenshot({ path: 'layout-snapshots/letter-reading-' + width + '.png', fullPage: false });

    await modal.getByRole('group', { name: 'Letter actions' }).getByRole('button', { name: 'View comments' }).click();
    await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toBeVisible();
    const after = await modal.locator('.stl-reading-book').boundingBox();
    expect(Math.abs(after.width - before.width)).toBeLessThan(1.5);
    await page.screenshot({ path: 'layout-snapshots/comments-on-demand-' + width + '.png', fullPage: false });
    await modal.getByRole('group', { name: 'Letter actions' }).getByRole('button', { name: 'Hide comments' }).click();
    await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toHaveCount(0);
    await geometry(page, 'reader', width);
  });
}

test('mobile device opens and closes comments without shrinking the letter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Real mobile device project only');
  await setup(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'View comments for A long letter to keep forever' }).click();
  const modal = page.getByRole('dialog', { name: 'Letter from a-friend' });
  await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toBeVisible();
  await modal.getByRole('complementary', { name: 'Letter comments drawer' }).getByRole('button', { name: 'Hide comments' }).click();
  await expect(modal.getByRole('complementary', { name: 'Letter comments drawer' })).toHaveCount(0);
  await expect(modal.getByTestId('full-letter-scroll')).toBeVisible();
  await geometry(page, 'mobile-reader', page.viewportSize().width);
});

test('public share URL keeps the letter full width and its comments behind a button', async ({ page }) => {
  await setup(page);
  await page.goto('/letters/' + 'a'.repeat(48));
  await expect(page.getByRole('button', { name: 'View comments' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Comments drawer' })).toHaveCount(0);
  const sheet = await page.locator('article.public-letter-sheet').boundingBox();
  expect(sheet).not.toBeNull();
  await page.getByRole('button', { name: 'View comments' }).click();
  await expect(page.getByRole('dialog', { name: 'Comments drawer' })).toBeVisible();
  const after = await page.locator('article.public-letter-sheet').boundingBox();
  expect(Math.abs(after.width - sheet.width)).toBeLessThan(1.5);
});


for (const width of [320, 390, 768, 1024, 1440]) {
  test('public, authentication and shared-letter pages fit ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Width matrix runs in desktop Chromium; mobile project is tested separately');
    await page.setViewportSize({ width, height: width < 600 ? 740 : 900 });
    await setup(page);
    const paths = [
      ['home', '/'],
      ['about', '/about'],
      ['features', '/services'],
      ['contact', '/contact'],
      ['login', '/login'],
      ['signup', '/signup'],
      ['shared-letter', '/letters/' + 'a'.repeat(48)],
    ];
    for (const [name, path] of paths) {
      await page.goto(path);
      await expect(page.locator('main').first()).toBeVisible();
      await geometry(page, name, width);
      if ((width === 320 || width === 768 || width === 1440) && ['home', 'login', 'shared-letter'].includes(name)) {
        await mkdir('layout-snapshots', { recursive: true });
        await page.screenshot({ path: 'layout-snapshots/' + name + '-' + width + '.png', fullPage: false });
      }
    }
  });
}

test('small 320x568 display keeps the 3D letter modal entirely inside the screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Small-phone viewport is covered in the width sweep');
  await page.setViewportSize({ width: 320, height: 568 });
  await setup(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: A long letter to keep forever' }).click();
  const dialog = page.getByRole('dialog', { name: 'Letter from a-friend' });
  await expect(dialog).toBeVisible();
  const rect = await dialog.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect.x).toBeGreaterThanOrEqual(-1);
  expect(rect.y).toBeGreaterThanOrEqual(-1);
  expect(rect.x + rect.width).toBeLessThanOrEqual(321);
  expect(rect.y + rect.height).toBeLessThanOrEqual(569);
  await dialog.getByRole('button', { name: 'Skip 3D & read' }).click();
  await expect(dialog.getByTestId('full-letter-scroll')).toBeVisible();
  await dialog.getByRole('group', { name: 'Letter actions' }).getByRole('button', { name: 'View comments' }).click();
  await expect(dialog.getByRole('complementary', { name: 'Letter comments drawer' })).toBeVisible();
});
