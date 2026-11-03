import { test, expect } from '@playwright/test';

const writer = { id: 7, username: 'sample-writer', email: 'writer@example.test', role: 'user', isActive: true };
const fixedLetters = [
  { id: 50, authorId: 21, authorName: 'kind-writer', title: 'Thank you for showing up',
    content: 'The smallest kindness can stay with us.', category: 'Gratitude', type: 'Gratitude',
    createdAt: '2026-10-28T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: false, isAnonymous: false, likeCount: 7, commentCount: 2,
  },
  { id: 51, authorId: 22, authorName: 'letter-friend', title: 'A hello from afar',
    content: 'I hope your day is gentle and bright.', category: 'Friendship', type: 'Friendship',
    createdAt: '2026-10-27T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: false, isAnonymous: false, likeCount: 2, commentCount: 0,
  },
  { id: 52, authorId: 23, authorName: 'secret-writer', title: 'A quiet feeling',
    content: 'I needed a place to leave these words.', category: 'Gratitude', type: 'Gratitude',
    createdAt: '2026-10-26T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: false, isAnonymous: true, likeCount: 0, commentCount: 0,
  },
  { id: 53, authorId: 24, authorName: 'hidden-person', title: 'Never public',
    content: 'Private data should stay private.', category: 'Secret', type: 'Secret',
    createdAt: '2026-10-25T08:00:00.000Z', isPublic: false, status: 'published',
    isArchived: false, isAnonymous: false, likeCount: 100, commentCount: 0,
  },
  { id: 54, authorId: 25, authorName: 'future-person', title: 'Still sealed',
    content: 'Not available until release.', category: 'Future', type: 'Future',
    createdAt: '2026-10-24T08:00:00.000Z', isPublic: true, status: 'published',
    openDate: '2030-11-02T08:00:00.000Z', isArchived: false, isAnonymous: false,
    likeCount: 42, commentCount: 0,
  },
  { id: 55, authorId: 26, authorName: 'archived-person', title: 'Archived note',
    content: 'This should not be in the feed.', category: 'Notes', type: 'Notes',
    createdAt: '2026-10-23T08:00:00.000Z', isPublic: true, status: 'published',
    isArchived: true, isAnonymous: false, likeCount: 33, commentCount: 0,
  },
];

async function mockWorkspace(page, letters = fixedLetters) {
  await page.addInitScript(account => {
    localStorage.setItem('token', 'community-browser-mock-token');
    localStorage.setItem('user', JSON.stringify(account));
  }, writer);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body = [];
    if (url.pathname === '/api/auth/session') body = { user: writer };
    if (url.pathname === '/api/letters/public') body = letters;
    if (url.pathname.endsWith('/like') && route.request().method() === 'POST') body = { liked: true, likeCount: 8 };
    if (url.pathname.endsWith('/repost/status')) body = { reposted: false, count: 0 };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('community uses original header icons and a three-column desktop feed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop layout only');
  await page.setViewportSize({ width: 1540, height: 950 });
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Discover words that matter' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Writer recommendations and community links' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Community letter feed' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Community topics and spotlights' })).toBeVisible();
  const count = await page.getByRole('complementary', { name: 'Community topics and spotlights' })
    .evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(count).toBe(3);
  await expect(page.locator('nav[aria-label="Workspace navigation"] img[src^="/mascots/"]').first()).toBeVisible();
});

test('recommendations and popular topics use public data and preserve anonymity', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  await expect(page.getByText('Showing 3 of 3 public letters')).toBeVisible();
  const writers = page.getByRole('complementary', { name: 'Writer recommendations and community links' });
  await expect(writers.getByRole('link', { name: /kind-writer/ })).toBeVisible();
  await expect(writers.getByRole('link', { name: /letter-friend/ })).toBeVisible();
  await expect(writers.getByText('secret-writer')).toHaveCount(0);
  await expect(page.getByText('Never public')).toHaveCount(0);
  await expect(page.getByText('Still sealed')).toHaveCount(0);
  await expect(page.getByText('Archived note')).toHaveCount(0);

  const discovery = page.getByRole('complementary', { name: 'Community topics and spotlights' });
  await expect(discovery.getByRole('heading', { name: 'Popular topics' })).toBeVisible();
  await expect(discovery.getByRole('heading', { name: 'Most appreciated' })).toBeVisible();
  await expect(discovery.getByText('7 appreciations')).toBeVisible();
});

test('filters the central feed and relevant spotlight without leaked hidden titles', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  await page.getByRole('group', { name: 'Filter public letters by topic' })
    .getByRole('button', { name: 'Gratitude' }).click();
  await expect(page.getByText('Showing 2 of 3 public letters')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A hello from afar' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('Showing 3 of 3 public letters')).toBeVisible();

  await page.getByRole('textbox', { name: 'Search public letters' }).fill('there is no matching story');
  await expect(page.getByText('Showing 0 of 3 public letters')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No stories match yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page.getByText('Showing 3 of 3 public letters')).toBeVisible();
});

test('writer can open the full letter and use real appreciation actions', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  const read = page.getByRole('button', { name: 'Read letter: Thank you for showing up' });
  await read.focus();
  await expect(read).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Like letter: Thank you for showing up' }).click();
  await expect(page.getByRole('button', { name: 'Unlike letter: Thank you for showing up' })).toBeVisible();
});

test('loads more public letter cards without inventing extra recommendations', async ({ page }) => {
  const more = Array.from({ length: 8 }, (_, index) => ({
    ...fixedLetters[0], id: 100 + index, title: 'Community letter ' + index,
    createdAt: new Date(Date.UTC(2026, 9, 15 + index)).toISOString(),
  }));
  await mockWorkspace(page, more);
  await page.goto('/dashboard/community');
  await expect(page.getByText('Showing 5 of 8 public letters')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read letter: Community letter 0' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show more letters' }).click();
  await expect(page.getByText('Showing 8 of 8 public letters')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read letter: Community letter 0' })).toBeVisible();
});

test('mobile presents composer, topics, feed and then discovery sidebars without page overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile only');
  await page.setViewportSize({ width: 320, height: 720 });
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  await expect(page.getByRole('heading', { name: 'Discover words that matter' })).toBeVisible();
  await expect(page.getByRole('link', { name: /What would you like to write today/ })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Filter public letters by topic' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read letter: Thank you for showing up' })).toBeVisible();
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport + 2);
  const feed = await page.getByRole('region', { name: 'Community letter feed' }).boundingBox();
  const recs = await page.getByRole('complementary', { name: 'Writer recommendations and community links' }).boundingBox();
  expect(feed.y).toBeLessThan(recs.y);
});
