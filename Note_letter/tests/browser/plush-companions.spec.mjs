import { test, expect } from '@playwright/test';

// These tests run with isolated mocked user data; they never modify production.
const writer = { id: 42, username: 'test-writer', email: 'writer@example.test', role: 'user', isActive: true };
const note = { id: 51, title: 'Thank you for being you', authorId: 99, authorName: 'friend',
  content: 'A sweet note.', type:'Gratitude', category:'Gratitude',
  createdAt: '2026-10-20T08:00:00.000Z', status:'published',
  isPublic:true, isArchived:false, isAnonymous:false, likeCount:0, commentCount:0 };
async function setup(page) {
  await page.addInitScript(u => {
    localStorage.setItem('token', 'plush-test-token');
    localStorage.setItem('user', JSON.stringify(u));
  }, writer);
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    if (path === '/api/auth/session') body = {user:writer};
    if (path === '/api/letters/public') body = [note];
    if (path.endsWith('/repost/status')) body = {reposted:false,count:0};
    return route.fulfill({status:200, contentType:'application/json',
      headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}, body:JSON.stringify(body)});
  });
}

test('the Messages dock keeps Alexis seated and reacts without starting a chat', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Floating dock is desktop only');
  await setup(page);
  await page.goto('/dashboard');
  await page.getByRole('button', {name:'Open messages'}).click();
  const dock = page.getByRole('region', {name:'Recent messages'});
  await expect(dock).toBeVisible();
  await expect(dock.getByText('No conversations yet')).toBeVisible();
  const alexis = dock.getByRole('button',{name:'Tap Alexis for a reaction'}).last();
  await expect(alexis).toBeVisible();
  await expect(dock.locator('img[src="/characters/alexis.webp"]').first()).toBeVisible();
  await alexis.click();
  await expect(dock.locator('[data-character="alexis"][data-reaction="happy"]')).toHaveCount(1);
  await alexis.click();
  await expect(dock.locator('[data-character="alexis"][data-reaction="grumpy"]')).toHaveCount(1);
  await expect(dock.getByText('No conversations yet')).toBeVisible();
});

test('Iver sits on the opening envelope and reacts without opening the letter', async ({page}) => {
  await setup(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button',{name:'Read letter: Thank you for being you'}).click();
  const dialog = page.getByRole('dialog',{name:'Letter from friend'});
  const iver = dialog.getByRole('button',{name:'Tap Iver for a reaction'});
  await expect(iver).toBeVisible();
  await expect(dialog.locator('img[src="/characters/iver.webp"]')).toBeVisible();
  await iver.click();
  await expect(dialog.locator('[data-character="iver"][data-reaction="happy"]')).toBeVisible();
  await iver.click();
  await expect(dialog.locator('[data-character="iver"][data-reaction="grumpy"]')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Open envelope'})).toBeVisible();
  await dialog.getByRole('button',{name:'Open envelope'}).click();
  await expect(dialog.getByRole('button',{name:'Read full letter'})).toBeVisible();
});
