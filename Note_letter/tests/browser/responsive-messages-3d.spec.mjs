import { test, expect } from '@playwright/test';

const account = { id: 7, username: 'responsive-writer', email: 'reader@example.test', role: 'user', isActive: true };
const contact = { id: 23, username: 'WriterWithAReallyLongDisplayNameForResponsiveChecks', avatar: null };
const conversation = {
  user: contact,
  lastMessage: 'An extremely long conversation preview that should wrap or truncate and never expand the width of the inbox columns.',
  lastMessageTime: '2026-11-03T11:00:00.000Z',
  unreadCount: 2,
};

const viewports = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 900 },
  { width: 1767, height: 864 },
];

async function mockMessages(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'responsive-messages-test-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, account);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let data = [];
    if (path === '/api/auth/session') data = { user: account };
    if (path === '/api/messages/conversations') data = [conversation];
    if (path === '/api/messages/history/23') data = {
      messages: [{
        id: 100, senderId: 23, receiverId: 7,
        content: 'The first message should remain fully readable even on narrow phones.',
        createdAt: '2026-11-04T08:00:00.000Z',
        isRead: false,
      }],
      nextBeforeId: null,
    };
    if (path === '/api/messages/read' && method === 'POST') data = { success: true };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(data),
    });
  });
}

async function checkViewportFit(page, width, name) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect.soft(size.doc, name + ' document overflow at ' + width).toBeLessThanOrEqual(size.viewport + 2);
  expect.soft(size.body, name + ' body overflow at ' + width).toBeLessThanOrEqual(size.viewport + 2);
}

test('responsive Messages 3D scene stays compact and exposes the inbox on six device widths', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await mockMessages(page);
  await page.goto('/dashboard/messages');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const world = page.getByRole('region', { name: 'Interactive 3D SendTheLetter workspace' });
    await expect(world).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    const tile = await world.boundingBox();
    const inbox = await page.getByRole('complementary', { name: 'Conversations' }).boundingBox();
    expect(tile).not.toBeNull();
    expect(inbox).not.toBeNull();
    expect.soft(tile.height, '3D tile too tall at ' + viewport.width).toBeLessThanOrEqual(150);
    expect.soft(tile.width, '3D tile too wide at ' + viewport.width).toBeLessThanOrEqual(350);
    expect.soft(tile.x, '3D tile off left at ' + viewport.width).toBeGreaterThanOrEqual(-2);
    expect.soft(tile.x + tile.width, '3D tile off right at ' + viewport.width).toBeLessThanOrEqual(viewport.width + 2);
    expect.soft(inbox.x + inbox.width, 'Inbox off right at ' + viewport.width).toBeLessThanOrEqual(viewport.width + 2);
    expect.soft(inbox.y, 'Inbox pushed off the first screen at ' + viewport.width).toBeLessThan(viewport.height - 130);
    if (viewport.width >= 1024) {
      expect.soft(inbox.y, 'Desktop inbox starts too far down').toBeLessThan(345);
    }
    const canvas = world.locator('canvas[data-renderer="webgl"]');
    if (await canvas.count()) {
      const rect = await canvas.boundingBox();
      expect(rect).not.toBeNull();
      expect.soft(rect.height, 'WebGL canvas clips compact scene at ' + viewport.width).toBeLessThanOrEqual(tile.height + 2);
    }
    await checkViewportFit(page, viewport.width, 'Messages');
    if (testInfo.project.name === 'desktop-chromium') {
      await page.screenshot({ path: 'layout-snapshots/messages-compact-' + viewport.width + '.png', fullPage: false });
    }
  }
});

test('conversation bubbles and composer do not overflow on phone, tablet or desktop', async ({ page }) => {
  test.setTimeout(90_000);
  await mockMessages(page);
  await page.goto('/dashboard/messages');
  for (const viewport of [viewports[0], viewports[1], viewports[2], viewports[4]]) {
    await page.setViewportSize(viewport);
    // Selecting the same conversation again works on narrow screens after using Back.
    await page.getByRole('button', { name: /WriterWithAReallyLongDisplayNameForResponsiveChecks/ }).first().click();
    const thread = page.getByRole('region', { name: 'Conversation thread' });
    await expect(thread).toBeVisible();
    const input = thread.getByRole('textbox', { name: 'Your message' });
    await expect(input).toBeVisible();
    await expect(thread.getByText('The first message should remain fully readable even on narrow phones.')).toBeVisible();
    const inputRect = await input.boundingBox();
    expect(inputRect).not.toBeNull();
    expect.soft(inputRect.x, 'Composer x at ' + viewport.width).toBeGreaterThanOrEqual(-2);
    expect.soft(inputRect.x + inputRect.width, 'Composer right at ' + viewport.width).toBeLessThanOrEqual(viewport.width + 2);
    await checkViewportFit(page, viewport.width, 'Conversation');
    if (viewport.width < 768) {
      await thread.getByRole('button', { name: 'Back to conversations' }).click();
      await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    }
  }
});
