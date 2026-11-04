import { test, expect } from '@playwright/test';

const account = {
  id: 7, username: 'sample-writer', email: 'sample@example.test',
  role: 'user', isActive: true,
};
const contact = { id: 19, username: 'friendly-writer' };

async function mockInbox(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'inbox-browser-mock');
    localStorage.setItem('user', JSON.stringify(user));
  }, account);

  let unread = 5;
  let sent = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let body = [];
    if (path === '/api/auth/session') body = { user: account };
    if (path === '/api/messages/conversations') body = [{
      user: contact, lastMessage: sent ? 'Thanks for writing!' : 'Hello from the community!',
      lastMessageTime: '2026-11-04T01:00:00.000Z', unreadCount: unread,
    }];
    if (path === '/api/messages/history/19') body = { messages: [{
      id: 30, senderId: 19, receiverId: 7, content: 'Hello from the community!',
      createdAt: '2026-11-04T01:00:00.000Z', isRead: false,
    }], nextBeforeId: null };
    if (path === '/api/messages/read') { unread = 0; body = { message: 'Messages marked as read' }; }
    if (path === '/api/messages/send') {
      sent = true;
      status = 201;
      body = {
        id: 31, senderId: 7, receiverId: 19, content: 'Thanks for writing!',
        createdAt: '2026-11-04T01:05:00.000Z', isRead: false,
      };
    }
    await route.fulfill({
      status, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('desktop shows actual unread count and opens a floating conversation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop only');
  await mockInbox(page);
  await page.goto('/dashboard');

  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  const messagesLink = navigation.getByRole('link', { name: 'Messages' });
  await expect(messagesLink.locator('[aria-label="5 unread messages"]')).toBeVisible();

  await page.getByRole('button', { name: 'Messages, 5 unread' }).click();
  await expect(page.getByRole('region', { name: 'Recent messages' })).toBeVisible();
  await page.getByRole('button', { name: /friendly-writer/ }).click();
  await expect(page.getByRole('region', { name: 'Chat with friendly-writer' })).toBeVisible();
  await expect(page.getByText('Hello from the community!').first()).toBeVisible();
  await expect(messagesLink.locator('[aria-label="5 unread messages"]')).toHaveCount(0);

  await page.getByRole('textbox', { name: 'Write a message' }).fill('Thanks for writing!');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Thanks for writing!').last()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open full inbox' })).toHaveAttribute('href', '/dashboard/messages?userId=19');
});

test('mobile messages shortcut shows unread count without changing the bottom bar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile only');
  await mockInbox(page);
  await page.goto('/dashboard');
  const nav = page.getByRole('navigation', { name: 'Mobile workspace navigation' });
  const link = nav.getByRole('link', { name: 'Messages' });
  await expect(link.locator('[aria-label="5 unread messages"]')).toBeVisible();
  await link.click();
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
});
