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

test('community uses screenshot-style 72px near-black rail and three-column public feed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop layout only');
  await page.setViewportSize({ width: 1540, height: 950 });
  await mockWorkspace(page);
  await page.goto('/dashboard/community');
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
  const rail = page.getByRole('complementary', { name: 'SendTheLetter sidebar' });
  await expect(rail).toBeVisible();
  await expect(page.getByRole('banner')).toBeHidden();
  const railLayout = await rail.evaluate(element => ({
    width: Math.round(element.getBoundingClientRect().width),
    left: Math.round(element.getBoundingClientRect().left),
    position: getComputedStyle(element).position,
    background: getComputedStyle(element).backgroundColor,
  }));
  expect(railLayout).toMatchObject({ width: 72, left: 0, position: 'fixed', background: 'rgba(11, 15, 18, 0.95)' });
  await expect(page.getByRole('heading', { name: 'Discover words that matter' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Writer recommendations and community links' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Community letter feed' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Community topics and spotlights' })).toBeVisible();
  const count = await page.getByRole('complementary', { name: 'Community topics and spotlights' })
    .evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(count).toBe(3);
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  await expect(navigation.getByRole('link')).toHaveCount(7);
  const expectedLabels = ['Overview', 'My library', 'Community', 'Messages', 'My profile'];
  for (const label of expectedLabels) {
    const link = navigation.getByRole('link', { name: label });
    await expect(link).toBeVisible();
    await expect(link.locator('svg[role="presentation"]')).toBeVisible();
    // Visually icon-only, while the destination name remains accessible.
    await expect(link).toHaveAttribute('aria-label', label);
    await expect(link).toHaveAttribute('title', label);
    expect((await link.innerText()).trim()).toBe('');
  }
  const current = navigation.getByRole('link', { name: 'Community' });
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(navigation.getByRole('link', { name: 'Write a new letter' })).toBeVisible();
  const main = page.locator('main#main-content');
  const mainBox = await main.boundingBox();
  expect(mainBox.x).toBeGreaterThanOrEqual(72);
  // The rail's account and notification popovers must open on its right.
  const accountButton = rail.getByRole('button', { name: 'Account, settings and appearance' });
  await accountButton.click();
  const accountMenu = page.getByRole('menu', { name: 'Account menu' });
  await expect(accountMenu).toBeVisible();
  const menuBox = await accountMenu.boundingBox();
  expect(menuBox.x).toBeGreaterThanOrEqual(72);
  await page.keyboard.press('Escape');
  await expect(accountMenu).toHaveCount(0);
  await rail.getByRole('button', { name: /Notifications/ }).click();
  await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible();
  const notifBox = await page.getByRole('dialog', { name: 'Notifications' }).boundingBox();
  expect(notifBox.x).toBeGreaterThanOrEqual(72);
  await page.getByRole('button', { name: 'Close notifications' }).click();
  await current.hover();
  const brand = rail.getByRole('link', { name: 'SendTheLetter home' });
  const first = navigation.getByRole('link', { name: 'Overview' });
  const logoBox = await brand.boundingBox();
  const firstBox = await first.boundingBox();
  expect(firstBox.y - (logoBox.y + logoBox.height)).toBeGreaterThan(70);
  const moreButton = rail.getByRole('button', { name: 'Account, settings and appearance' });
  const moreBox = await moreButton.boundingBox();
  expect(moreBox.y).toBeGreaterThan(firstBox.y + 300);
  const dimensions = await current.evaluate(el => {
    const box = el.getBoundingClientRect();
    return {
      hitWidth: el.offsetWidth, hitHeight: el.offsetHeight,
      animatedWidth: Math.round(box.width),
    };
  });
  expect(dimensions.hitWidth).toBe(48);
  expect(dimensions.hitHeight).toBe(48);
  // Visual grow-on-hover is intentional; the accessible hit target stays stable.
  expect(dimensions.animatedWidth).toBeGreaterThanOrEqual(48);
  const searchShortcut = navigation.getByRole('link', { name: 'Search public letters' });
  await expect(searchShortcut.locator('svg[role="presentation"]')).toBeVisible();
  await searchShortcut.click();
  await expect(page).toHaveURL(/\/dashboard\/community\?focus=search$/);
  await expect(page.getByRole('textbox', { name: 'Search public letters' })).toBeFocused();
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
  await expect(page.getByRole('complementary', { name: 'SendTheLetter sidebar' })).toBeHidden();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile workspace navigation' });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('link')).toHaveCount(6);
  for (const label of ['Overview', 'My library', 'Community', 'Write a new letter', 'Messages', 'My profile']) {
    await expect(mobileNav.getByRole('link', { name: label })).toBeVisible();
  }
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
