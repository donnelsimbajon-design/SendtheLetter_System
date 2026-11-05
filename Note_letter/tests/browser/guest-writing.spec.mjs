import { test, expect } from '@playwright/test';

test('visitor can write and preview a letter without an account or letter API requests', async ({ page }) => {
  const letterRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/letters')) letterRequests.push(request.url()); });
  await page.goto('/try');
  await expect(page.getByRole('heading', { name: 'Write before you sign up.' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Letter title' }).fill('For my friend');
  await page.getByRole('textbox', { name: 'Who is this for? (optional)' }).fill('Sam');
  await page.getByRole('textbox', { name: 'Your letter' }).fill('I am grateful we met.');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('article', { name: 'Practice letter preview' })).toContainText('I am grateful we met.');
  await page.reload();
  await page.getByRole('button', { name: 'Write', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your letter' })).toHaveValue('I am grateful we met.');
  expect(letterRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Continue to save or send' }).click();
  await expect(page).toHaveURL(/\/signup\?returnTo=/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/dashboard/notes?compose=1&guest=1');
});

test('guest writing moves into the authenticated editor and clears after a successful draft save', async ({ page }) => {
  const user = { id: 91, username: 'pilot', email: 'pilot@example.test', role: 'user', isActive: true };
  await page.goto('/try?template=gratitude');
  await page.getByRole('textbox', { name: 'Your letter' }).fill('A real sentence from the guest.');
  await page.getByRole('textbox', { name: 'Letter title' }).fill('A guest letter');
  await page.getByRole('button', { name: 'Continue to save or send' }).click();
  await page.addInitScript(account => {
    localStorage.setItem('token', 'guest-flow-test-token');
    localStorage.setItem('user', JSON.stringify(account));
  }, user);
  const saved = [];
  await page.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    let body = [];
    if (pathname === '/api/auth/session') body = { user };
    if (pathname === '/api/letters' && route.request().method() === 'POST') {
      saved.push(route.request().postDataJSON());
      body = { letter: { id: 998, status: 'draft' } };
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
  await page.goto('/dashboard/notes?compose=1&guest=1');
  await expect(page.getByRole('dialog', { name: 'Write a letter' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Letter title' })).toHaveValue('A guest letter');
  await expect(page.getByRole('textbox', { name: 'Your letter' })).toHaveValue('A real sentence from the guest.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0].isPublic).toBe(false);
  expect(saved[0].content).toContain('A real sentence from the guest.');
  // The draft POST is observed before the asynchronous success handler finishes.
  // Wait for the UI to acknowledge success and clear the guest handoff.
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('sendtheletter:guest-letter:v1'))).toBeNull();
});

test('a new visitor can clear practice words from the tab', async ({ page }) => {
  await page.goto('/try');
  await page.getByRole('textbox', { name: 'Your letter' }).fill('Temporary thoughts.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear practice letter' }).click();
  await expect(page.getByRole('textbox', { name: 'Your letter' })).toHaveValue('');
});
