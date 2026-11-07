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

test('Iver shares the unboxed opening scene and still reacts independently', async ({page}) => {
  await setup(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button',{name:'Read letter: Thank you for being you'}).click();
  const dialog = page.getByRole('dialog',{name:'Letter from friend'});
  const iver = dialog.getByRole('button',{name:'Tap Iver for a reaction'});
  await expect(iver).toBeVisible();
  await expect(dialog.locator('img[src="/characters/iver.webp"]')).toBeVisible();
  const companion = dialog.getByRole('complementary', {name:'Iver, your letter-opening companion'});
  await expect(companion).toBeVisible();
  const envelopeScene = dialog.getByRole('img',{name:'A sealed paper envelope waiting to be opened'});
  await expect(envelopeScene).toBeVisible();
  const layout = dialog.locator('.stl-opening-layout');
  await expect(layout.locator('.stl-opening-iver')).toHaveCount(1);
  const sceneStyle = await envelopeScene.evaluate(el => getComputedStyle(el));
  expect(sceneStyle.borderTopWidth).toBe('0px');
  expect(sceneStyle.backgroundImage).toBe('none');
  const mascot = await companion.boundingBox(), envelope = await envelopeScene.boundingBox();
  expect(mascot).not.toBeNull();
  expect(envelope).not.toBeNull();
  expect(mascot.x).toBeLessThan(envelope.x + envelope.width / 2);
  expect(mascot.y + mascot.height).toBeGreaterThan(envelope.y + envelope.height / 2);
  await iver.click();
  await expect(dialog.locator('[data-character="iver"][data-reaction="happy"]')).toBeVisible();
  await expect(dialog.locator('[data-character="iver"] [data-testid="plush-mood-sticker"]')).toContainText('💗');
  await iver.click();
  await expect(dialog.locator('[data-character="iver"][data-reaction="grumpy"]')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Open envelope'})).toBeVisible();
  await dialog.getByRole('button',{name:'Open envelope'}).click();
  await expect(dialog.getByRole('button',{name:'Read full letter'})).toBeVisible();
});

test('Alexis explains Messages and offers real navigation actions, not chatbot promises', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Floating dock is desktop only');
  await setup(page);
  await page.goto('/dashboard');
  await page.getByRole('button',{name:'Open messages'}).click();
  const dock = page.getByRole('region',{name:'Recent messages'});
  await expect(dock.getByText('Meet Alexis ✨')).toBeVisible();
  await expect(dock.getByRole('link',{name:'Find writers'})).toHaveAttribute('href','/dashboard/community');
  await expect(dock.getByRole('link',{name:'Open inbox'})).toHaveAttribute('href','/dashboard/messages');
  const how = dock.getByRole('button',{name:'How it works'});
  await how.click();
  await expect(how).toHaveAttribute('aria-expanded','true');
  await expect(dock.getByText('Alexis is a friendly guide, not an AI chatbot.',{exact:false})).toBeVisible();
  await how.click();
  await expect(how).toHaveAttribute('aria-expanded','false');
  await dock.getByRole('link',{name:'Find writers'}).click();
  await expect(page).toHaveURL(/\/dashboard\/community$/);
});

test('the single envelope scene stays within compact phone and tablet viewports', async ({page}) => {
  await setup(page);
  await page.goto('/dashboard/community');
  await page.getByRole('button',{name:'Read letter: Thank you for being you'}).click();
  const dialog = page.getByRole('dialog',{name:'Letter from friend'});
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:820});
    const mascot = dialog.getByRole('complementary',{name:'Iver, your letter-opening companion'});
    const envelope = dialog.getByRole('img',{name:'A sealed paper envelope waiting to be opened'});
    await expect(mascot).toBeVisible();
    await expect(envelope).toBeVisible();
    const scene = await envelope.boundingBox(), character = await mascot.boundingBox();
    expect(scene).not.toBeNull();
    expect(character).not.toBeNull();
    expect(character.x + character.width).toBeLessThanOrEqual(scene.x + scene.width + 2);
    const doc = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(doc.scroll).toBeLessThanOrEqual(doc.width + 2);
  }
});
