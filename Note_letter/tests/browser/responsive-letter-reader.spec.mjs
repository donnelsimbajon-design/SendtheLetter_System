import { test, expect } from '@playwright/test';

const writer = { id: 7, username: 'test-reader', email: 'test.reader@example.test', role: 'user', isActive: true };
const shareToken = 'a'.repeat(48);
const publicLetter = {
  id: 50, title: 'Thank you for showing up', content: 'The smallest kindness can stay with us.',
  letterPages: [
    { text: 'First page of the story. This should be readable before comments.' },
    { text: 'Second page of the story. The 3D book should let us turn the page.' },
  ],
  authorId: 21, authorName: 'kind-writer', category: 'Gratitude', type: 'Gratitude',
  createdAt: '2026-10-28T08:00:00.000Z', isPublic: true, status: 'published',
  isArchived: false, isAnonymous: false, likeCount: 7, commentCount: 2,
  shareToken,
};

const viewports = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 900 },
  { width: 1767, height: 864 },
];

async function mockLetters(page) {
  await page.addInitScript(account => {
    localStorage.setItem('token', 'layout-browser-test-token');
    localStorage.setItem('user', JSON.stringify(account));
  }, writer);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body = [];
    if (path === '/api/auth/session') body = { user: writer };
    if (path === '/api/letters/public') body = [publicLetter];
    if (path === '/api/letters/public/' + shareToken) body = publicLetter;
    if (path.endsWith('/repost/status')) body = { reposted: false, count: 0 };
    if (path === '/api/letters/public/' + shareToken + '/thread') body = { entries: [], totals: [] };
    await route.fulfill({
      status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body),
    });
  });
}

async function checkHorizontalFit(page, label) {
  const fit = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect.soft(fit.document, label + ' document overflow').toBeLessThanOrEqual(fit.viewport + 2);
  expect.soft(fit.body, label + ' body overflow').toBeLessThanOrEqual(fit.viewport + 2);
}

test('open letter with 3D animation, read the full book, then optionally open comments', async ({ page }) => {
  await mockLetters(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  const modal = page.getByRole('dialog', { name: /Letter from kind-writer/ });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('region', { name: 'Open the 3D letter' })).toBeVisible();
  await expect(modal.getByTestId('letter-comments-overlay')).toHaveCount(0);
  await expect(modal.getByTestId('3d-letter-book')).toHaveCount(0);

  await modal.getByRole('button', { name: 'Open envelope' }).click();
  await modal.getByRole('button', { name: 'Read full letter' }).click();
  const book = modal.getByTestId('3d-letter-book');
  await expect(book).toBeVisible();
  await expect(book.getByText('First page of the story. This should be readable before comments.')).toBeVisible();
  await expect(modal.getByTestId('letter-comments-overlay')).toHaveCount(0);
  await book.getByRole('button', { name: /Next/ }).click();
  await expect(book.getByText('Second page of the story. The 3D book should let us turn the page.')).toBeVisible();
  await expect(book.locator('[data-turn="next"]')).toBeVisible();

  await modal.getByRole('button', { name: 'View comments', exact: true }).click();
  const drawer = modal.getByRole('complementary', { name: 'Letter comments drawer' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'Comments' })).toBeVisible();
  await modal.getByRole('complementary', { name: 'Letter comments drawer' }).getByRole('button', { name: 'Hide comments' }).click();
  await expect(drawer).toHaveCount(0);
  await expect(book.getByText('Second page of the story. The 3D book should let us turn the page.')).toBeVisible();
});

test('community comment icon skips the envelope and opens only the requested drawer', async ({ page }) => {
  await mockLetters(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'View comments for Thank you for showing up' }).click();
  const modal = page.getByRole('dialog', { name: /Letter from kind-writer/ });
  await expect(modal.getByTestId('3d-letter-book')).toBeVisible();
  await expect(modal.getByRole('region', { name: 'Open the 3D letter' })).toHaveCount(0);
  await expect(modal.getByTestId('letter-comments-overlay')).toBeVisible();
  await modal.getByRole('complementary', { name: 'Letter comments drawer' }).getByRole('button', { name: 'Hide comments' }).click();
  await expect(modal.getByTestId('3d-letter-book')).toBeVisible();
});

test('letter reading and comments drawer fit small phones, tablets, and large desktops', async ({ page }) => {
  test.setTimeout(70_000);
  await mockLetters(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  const modal = page.getByRole('dialog', { name: /Letter from kind-writer/ });
  await modal.getByRole('button', { name: 'Skip 3D & read' }).click();
  const book = modal.getByTestId('3d-letter-book');
  await expect(book).toBeVisible();

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    // Radix modal recalculates its centered geometry during viewport rotation.
    // Wait for the transform transition to settle before measuring actual fit.
    await expect.poll(async () => {
      const rect = await modal.boundingBox();
      if (!rect) return Infinity;
      return Math.max(-rect.x, rect.x + rect.width - vp.width, rect.height - vp.height);
    }, { timeout: 6000, intervals: [80, 150, 250, 500] }).toBeLessThanOrEqual(2);
    await checkHorizontalFit(page, 'Letter ' + vp.width);
    const rect = await modal.boundingBox();
    expect(rect, 'Modal should stay mounted at ' + vp.width).not.toBeNull();
    expect.soft(rect.x, 'Left edge at ' + vp.width).toBeGreaterThanOrEqual(-2);
    expect.soft(rect.x + rect.width, 'Right edge at ' + vp.width).toBeLessThanOrEqual(vp.width + 2);
    expect.soft(rect.height, 'Height at ' + vp.width).toBeLessThanOrEqual(vp.height + 2);
    const readerRect = await book.boundingBox();
    expect(readerRect).not.toBeNull();
    expect.soft(readerRect.width, 'Book must remain readable at ' + vp.width).toBeGreaterThan(Math.min(vp.width * .69, 500));

    await modal.getByRole('button', { name: 'View comments', exact: true }).click();
    const comments = modal.getByRole('complementary', { name: 'Letter comments drawer' });
    await expect(comments).toBeVisible();
    const drawerRect = await comments.boundingBox();
    expect(drawerRect).not.toBeNull();
    expect.soft(drawerRect.x, 'Drawer x at ' + vp.width).toBeGreaterThanOrEqual(-2);
    expect.soft(drawerRect.x + drawerRect.width, 'Drawer right at ' + vp.width).toBeLessThanOrEqual(vp.width + 2);
    await modal.getByRole('complementary', { name: 'Letter comments drawer' }).getByRole('button', { name: 'Hide comments' }).click();
    await expect(book).toBeVisible();
  }
});

test('public share shows full-width book first, comments only on demand, across devices', async ({ page }) => {
  await mockLetters(page);
  await page.goto('/?s=' + shareToken);
  const book = page.getByTestId('3d-letter-book');
  await expect(book).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Comments drawer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View comments' })).toBeVisible();

  for (const vp of [viewports[0], viewports[2], viewports[4]]) {
    await page.setViewportSize(vp);
    await checkHorizontalFit(page, 'Public ' + vp.width);
    const bookRect = await book.boundingBox();
    expect(bookRect).not.toBeNull();
    expect.soft(bookRect.width, 'Public book width at ' + vp.width).toBeGreaterThan(Math.min(vp.width * .68, 600));
  }
  await page.getByRole('button', { name: 'View comments' }).click();
  await expect(page.getByRole('dialog', { name: 'Comments drawer' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Comments drawer' })).toHaveCount(0);
});

test('Messages keeps compact 3D preview and an accessible inbox at six viewport sizes', async ({ page }) => {
  test.setTimeout(70_000);
  await mockLetters(page);
  await page.goto('/dashboard/messages');
  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await checkHorizontalFit(page, 'Messages ' + vp.width);
    const world = page.getByRole('region', { name: 'Interactive 3D SendTheLetter workspace' });
    const rect = await world.boundingBox();
    expect(rect).not.toBeNull();
    expect.soft(rect.width, '3D tile width at ' + vp.width).toBeLessThanOrEqual(400);
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    const inbox = page.getByRole('complementary', { name: 'Conversations' });
    await expect(inbox).toBeVisible();
    const inboxRect = await inbox.boundingBox();
    expect(inboxRect).not.toBeNull();
    expect.soft(inboxRect.x + inboxRect.width, 'Inbox right at ' + vp.width).toBeLessThanOrEqual(vp.width + 2);
    if (vp.width >= 1024) expect.soft(inboxRect.y, 'Inbox too far down at ' + vp.width).toBeLessThan(470);
  }
});
