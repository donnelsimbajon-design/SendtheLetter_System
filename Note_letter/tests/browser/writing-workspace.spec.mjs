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

async function fakeAuthenticatedApi(page, letters = sampleLetters) {
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
      body = letters;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('signed-in writer can open the selected native template and focus mode', async ({ page }, testInfo) => {
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
  // On mobile, the customization panel is intentionally collapsed by default.
  if (testInfo.project.name === 'mobile-chromium') {
    await editor.getByRole('button', { name: 'Customize' }).click();
  }
  await expect(editor.getByRole('complementary', { name: 'Letter customization' })).toBeVisible();
});

test('community filters published letters by their actual categories', async ({ page }) => {
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard/community');

  await expect(page.getByRole('heading', { name: 'Discover words that matter' })).toBeVisible();
  await expect(page.getByText('Showing 2 of 2 public letters')).toBeVisible();
  await page.getByRole('button', { name: 'Gratitude', exact: true }).click();
  await expect(page.getByText('Showing 1 of 2 public letters')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Community letter feed' }).getByRole('heading', { name: 'Thank you for showing up' })).toBeVisible();
  await expect(page.getByText('A hello from afar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('Showing 2 of 2 public letters')).toBeVisible();
});

test('keyboard readers can open a public letter card', async ({ page }) => {
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard/community');
  const read = page.getByRole('button', { name: 'Read letter: Thank you for showing up' });
  await expect(read).toBeVisible();
  await read.focus();
  await expect(read).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
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

test('letter soundtrack follows Spotify playback, countdown, pause and modal cleanup', async ({ page }) => {
  const musicLetter = {
    ...sampleLetters[0],
    spotifyLink: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
  };
  await fakeAuthenticatedApi(page, [musicLetter]);
  await page.route('https://open.spotify.com/embed/iframe-api/v1', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: `
      window.__spotifyDestroyed = 0;
      window.onSpotifyIframeApiReady({
        createController(mount, options, done) {
          const listeners = {};
          let paused = true;
          let position = 60000;
          let duration = 180000;
          const emit = () => listeners.playback_update?.({ data: {
            position, duration, isPaused: paused, isBuffering: false, playingURI: options.uri,
          } });
          const controller = {
            addListener(name, callback) { listeners[name] = callback; },
            play() { paused = false; listeners.playback_started?.({data: {playingURI: options.uri}}); emit(); },
            pause() { paused = true; emit(); },
            seek(seconds) { window.__spotifyLastSeek = seconds; position = seconds * 1000; emit(); },
            destroy() { window.__spotifyDestroyed++; mount.replaceChildren(); },
          };
          mount.appendChild(document.createElement('div'));
          done(controller);
          setTimeout(() => listeners.ready?.({ data: {} }), 0);
        }
      });
    `,
  }));

  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  const reader = page.getByRole('dialog');
  await expect(reader.getByRole('region', { name: 'Letter soundtrack' })).toBeVisible();
  await expect(reader.getByRole('button', { name: 'Pause letter soundtrack' })).toBeVisible();
  await expect(reader.getByLabel('Soundtrack time remaining')).toContainText(/-[12]:[0-5][0-9]/);
  await reader.getByRole('button', { name: 'Pause letter soundtrack' }).click();
  await expect(reader.getByRole('button', { name: 'Play letter soundtrack' })).toBeVisible();
  await reader.getByRole('button', { name: 'Play letter soundtrack' }).click();
  await expect(reader.getByRole('button', { name: 'Pause letter soundtrack' })).toBeVisible();
  await reader.getByRole('button', { name: 'Restart soundtrack' }).click();
  await expect.poll(() => page.evaluate(() => window.__spotifyLastSeek)).toBe(0);
  await expect(reader.getByLabel('Soundtrack time remaining')).toContainText(/-2:[0-5][0-9]|-3:00/);
  await reader.getByRole('button', { name: 'Close' }).click();
  await expect(reader).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__spotifyDestroyed)).toBe(1);
});

test('untrusted Spotify-looking links never become an embedded media player', async ({ page }) => {
  await fakeAuthenticatedApi(page, [{ ...sampleLetters[0],
    spotifyLink: 'https://open.spotify.com.bad-domain.example/track/4uLU6hMCjMI75M1A2tKUQC' }]);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  await expect(page.getByRole('region', { name: 'Letter soundtrack' })).toHaveCount(0);
});

test('letter reader wraps text around anchored photos with no duplicated paragraph', async ({ page }, testInfo) => {
  const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N2u8AAAAASUVORK5CYII=';
  const paragraph = 'Thank you for joining our special celebration. Your presence made the day brighter and brought so much joy.';
  await fakeAuthenticatedApi(page, [{
    ...sampleLetters[0],
    content: paragraph,
    letterPages: [{ text: paragraph, imageData: photo, imagePlacement: 'right', imageAnchor: 0, imageWidth: 42 }],
  }]);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  const flow = page.getByTestId('letter-reader-flow');
  await expect(flow).toBeVisible();
  await expect(flow.locator('figure[data-letter-photo]')).toHaveCount(1);
  await expect(flow.locator('img')).toHaveCount(1);
  const rendered = await flow.innerText();
  expect(rendered.match(/Your presence made the day brighter/g)).toHaveLength(1);
  const float = await flow.locator('figure').evaluate(node => getComputedStyle(node).float);
  expect(float).toBe(testInfo.project.name === 'mobile-chromium' ? 'none' : 'right');
});

test('letter editor inserts a single inline photo and lets text wrap beside it', async ({ page }, testInfo) => {
  await fakeAuthenticatedApi(page);
  await page.goto('/dashboard/notes?compose=1');
  const editor = page.getByRole('dialog');
  const words = 'Thank you for sharing this special moment. We will remember the joy and kindness from this day.';
  await editor.getByLabel('Your letter').fill(words);
  if (testInfo.project.name === 'mobile-chromium') await editor.getByRole('button', { name: 'Customize' }).click();
  const input = editor.locator('#letter-page-image');
  await input.setInputFiles({
    name: 'memory.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N2u8AAAAASUVORK5CYII=', 'base64'),
  });
  const textbox = editor.getByTestId('letter-flow-editor');
  await expect(textbox).toBeVisible();
  await expect(textbox.locator('[data-editable-letter-photo]')).toHaveCount(1);
  await expect(textbox).toContainText('Thank you for sharing this special moment.');
  await editor.getByLabel('Photo position').selectOption('left');
  const float = await textbox.locator('figure').evaluate(node => getComputedStyle(node).float);
  expect(float).toBe(testInfo.project.name === 'mobile-chromium' ? 'none' : 'left');
  await editor.getByLabel('Photo width as percentage of page').fill('55');
  await expect(editor.getByRole('region', { name: 'Photo layout controls' })).toContainText('55%');
  const text = await textbox.innerText();
  expect(text.match(/Thank you for sharing this special moment/g)).toHaveLength(1);
});

test('photo import in left sidebar autosaves image-only draft without requiring title or text', async ({ page }, testInfo) => {
  await fakeAuthenticatedApi(page);
  let saved = null;
  await page.route('**/api/letters', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    saved = route.request().postDataJSON();
    await route.fulfill({
      status: 201, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ letter: { id: 452, status: 'draft' } }),
    });
  });
  await page.goto('/dashboard/notes?compose=1');
  const editor = page.getByRole('dialog');
  if (testInfo.project.name === 'mobile-chromium') await editor.getByRole('button', { name: 'Customize' }).click();
  await expect(editor.getByRole('region', { name: 'Add images to letter' })).toBeVisible();
  await editor.locator('#letter-page-image').setInputFiles({
    name: 'memory.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N2u8AAAAASUVORK5CYII=', 'base64'),
  });
  await expect(editor.getByTestId('letter-flow-editor')).toBeVisible();
  await expect.poll(() => saved, { timeout: 10000 }).not.toBeNull();
  expect(saved.status).toBe('draft');
  expect(saved.title).toBe('Untitled letter');
  expect(saved.letterPages[0].imageData).toMatch(/^data:image\/jpeg;base64,/);
  expect(saved.letterPages[0].imagePlacement).toBe('right');
  await expect(editor.getByRole('status').filter({ hasText: 'Saved at' })).toBeVisible();
});

test('YouTube link is an external music reference, not a hidden video player', async ({ page }) => {
  await fakeAuthenticatedApi(page, [{
    ...sampleLetters[0], spotifyLink: 'https://youtu.be/M7lc1UVf-VE',
  }]);
  await page.goto('/dashboard/community');
  await page.getByRole('button', { name: 'Read letter: Thank you for showing up' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('link', { name: 'Open YouTube' })).toHaveAttribute(
    'href', 'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  await expect(modal.getByText(/YouTube soundtrack reference/)).toBeVisible();
  await expect(modal.getByRole('region', { name: 'Letter soundtrack' })).toHaveCount(0);
  await expect(modal.locator('iframe[src*="youtube"]')).toHaveCount(0);
});
