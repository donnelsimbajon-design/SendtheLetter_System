import { test, expect } from '@playwright/test';

test('first-time visitor can choose a writing prompt and carry it into signup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Some things are better in a letter/i })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Lumi, the SendTheLetter letter companion' })).toBeVisible();

  await page.getByRole('button', { name: /Say thank you/i }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for being you' })).toBeVisible();
  await page.getByRole('link', { name: /Open this writing template/i }).click();

  await expect(page).toHaveURL(/\/try\?template=gratitude/);
  await expect(page.getByRole('heading', { name: 'Write before you sign up.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Letter title' })).toHaveValue('Thank you for being you');
  await page.getByRole('textbox', { name: 'Your letter' }).fill('Thank you for all the little things.');
  await page.getByRole('button', { name: 'Continue to save or send' }).click();
  await expect(page).toHaveURL(/\/signup\?returnTo=/);
  const returnTo = new URL(page.url()).searchParams.get('returnTo');
  expect(returnTo).toBe('/dashboard/notes?compose=1&guest=1');
  await expect(page.getByRole('heading', { name: /Create your space/i })).toBeVisible();

  const password = page.locator('#password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('public features page shows implemented writing choices', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByRole('heading', { name: 'A little more room for what matters.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose what you share' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keep a letter for later' })).toBeVisible();
  await page.getByRole('link', { name: /Start a letter/ }).click();
  await expect(page).toHaveURL(/\/try$/);
  await expect(page.getByRole('heading', { name: 'Write before you sign up.' })).toBeVisible();
});

test('keyboard users can skip to the main landing content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator('main#main-content')).toBeVisible();
});

test('no horizontal page overflow on a compact mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile project only');
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['/', '/services', '/try', '/signup', '/login']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(sizes.page, 'Horizontal overflow at ' + path).toBeLessThanOrEqual(sizes.viewport + 2);
  }
});

test('private invitation opens for a guest without signup and accepts one optional reply', async ({ page }) => {
  const token = 'a'.repeat(48);
  const seen = [];
  await page.route('**/api/letters/recipient/**', async route => {
    if (new URL(route.request().url()).pathname.endsWith('/reply')) {
      seen.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ sent: true }) });
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        expiresAt: '2026-11-11T12:00:00Z',
        letter: {
          id: '27', title: 'For a special person', content: 'You are appreciated every day.',
          type: 'Gratitude', letterPages: [{ text: 'You are appreciated every day.' }],
          authorName: 'A Writer', isAnonymous: true, isPublic: false, status: 'published',
        },
      }),
    });
  });
  await page.goto('/open#' + token);
  await expect(page.getByRole('heading', { name: 'For a special person' })).toBeVisible();
  await expect(page.getByText('No account or payment needed')).toBeVisible();
  await expect(page.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Your private letter' })).toHaveCount(0);
  await expect(page.locator('a[href*="/signup"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open envelope' }).click();
  await expect(page.getByRole('img', { name: 'The envelope is open and a letter is emerging' })).toBeVisible();
  await page.getByRole('button', { name: 'Read full letter' }).click();
  await expect(page.getByRole('article', { name: 'Your private letter' })).toContainText('You are appreciated every day.');
  await page.getByLabel('Your name (optional)').fill('A friend');
  await page.getByLabel('Your message (optional)').fill('Thanks for thinking of me!');
  await page.getByRole('button', { name: 'Send private reply' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Your reply has been delivered' })).toBeVisible();
  expect(seen).toEqual([{ token, reaction: 'heart', displayName: 'A friend', message: 'Thanks for thinking of me!' }]);
});

test('expired private letter invitation does not reveal letter content or prompt for login', async ({ page }) => {
  await page.route('**/api/letters/recipient/**', route => route.fulfill({
    status: 404, contentType: 'application/json',
    body: JSON.stringify({ message: 'Invitation expired or revoked.' }),
  }));
  await page.goto('/open#' + 'b'.repeat(48));
  await expect(page.getByRole('heading', { name: 'This letter is unavailable.' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Invitation expired or revoked.');
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await expect(page.getByText('For a special person')).toHaveCount(0);
});
