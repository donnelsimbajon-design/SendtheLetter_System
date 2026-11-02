import { test, expect } from '@playwright/test';

// Isolated UI contract checks. These mocks do NOT prove live backend behavior.
const sampleUser = {
  id: 7,
  username: 'sample-writer',
  email: 'sample@example.test',
  role: 'user',
  isActive: true,
};

const sampleLetters = [
  { id: 20, authorId: 22, authorName: 'kind-writer', title: 'Thank you for showing up',
    content: 'Small acts of kindness matter.', category: 'Gratitude', type: 'Gratitude',
    createdAt: '2026-10-28T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: false, isAnonymous: false, likeCount: 4, commentCount: 0,
  },
  { id: 21, authorId: 23, authorName: 'letter-friend', title: 'A hello from afar',
    content: 'I hope you are having a good day.', category: 'Friendship', type: 'Friendship',
    createdAt: '2026-10-27T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: false, isAnonymous: false, likeCount: 1, commentCount: 0,
  },
];

async function fakeAuthenticatedApi(page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem('token', 'ui-smoke-test-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, sampleUser);

  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body = [];
    if (url.pathname === '/api/auth/session') {
      body = { user: sampleUser };
    } else if (url.pathname === '/api/letters/public') {
      body = sampleLetters;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('signed-in writer can open the selected native template and focus mode', async ({ page }) => {
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard/notes?compose=1&template=future-self');

  const editor = page.getByRole('dialog');
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel('Letter title')).toHaveValue('Dear future me');
  await expect(editor.getByLabel('Your letter')).toHaveValue(/Right now, life looks like/);

  await editor.getByRole('button', { name: 'Focus mode' }).click();
  await expect(editor.getByRole('button', { name: 'Exit focus' })).toBeVisible();
  await expect(editor.getByRole('complementary', { name: 'Letter customization' })).toBeHidden();
  await editor.getByRole('button', { name: 'Exit focus' }).click();
  await expect(editor.getByRole('complementary', { name: 'Letter customization' })).toBeVisible();
});

test('community filters published letters by their actual categories', async ({ page }) => {
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard/community');

  await expect(page.getByRole('heading', { name: 'Discover words that matter' })).toBeVisible();
  await expect(page.getByText('Showing 2 of 2 public letters')).toBeVisible();
  await page.getByRole('button', { name: 'Gratitude', exact: true }).click();
  await expect(page.getByText('Showing 1 of 2 public letters')).toBeVisible();
  await expect(page.getByText('Thank you for showing up')).toBeVisible();
  await expect(page.getByText('A hello from afar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('Showing 2 of 2 public letters')).toBeVisible();
});

test('signed-in mobile user can find the native Write shortcut', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile only');
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard');
  const write = page.getByRole('navigation', { name: 'Mobile workspace navigation' })
    .getByRole('link', { name: 'Write a new letter' });
  await expect(write).toBeVisible();
  await write.click();
  await expect(page.getByRole('dialog').getByLabel('Letter title')).toBeVisible();
});
