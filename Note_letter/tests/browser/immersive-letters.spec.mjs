import { test, expect } from '@playwright/test';

const account = { id: 7, username: 'storybook-writer', email: 'writer@example.test', role: 'user', isActive: true };
const published = {
  id: 42, title: 'A note worth keeping', content: 'These are words from my own private letter.',
  authorId: 7, authorName: 'storybook-writer', category: 'Reflection', type: 'Reflection',
  createdAt: '2026-11-02T08:00:00.000Z', status: 'published', isArchived: false,
  isPublic: false, reactions: {}, likeCount: 0, commentCount: 0,
};
const releasedCapsule = {
  ...published, id: 43, title: 'A letter from the past', isTimeCapsule: true,
  openDate: '2026-01-02T08:00:00.000Z',
};
const sealed = {
  ...published, id: 44, title: 'For my future self',
  content: 'A private thought that must not be shown on the capsule cover.',
  isTimeCapsule: true, openDate: '2030-11-04T08:00:00.000Z', status: 'scheduled',
};

async function mockLibrary(page) {
  await page.addInitScript(user => {
    localStorage.setItem('token', 'immersive-test-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, account);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    if (path === '/api/auth/session') body = { user: account };
    if (path === '/api/letters/mine') body = [published, releasedCapsule];
    if (path === '/api/letters/scheduled') body = [sealed];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

test('library can opt into a 3D shelf, open the envelope, and use the existing reader', async ({ page }) => {
  await mockLibrary(page);
  await page.goto('/dashboard/notes');
  await expect(page.getByRole('button', { name: 'Normal view' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '3D library' }).click();
  const shelf = page.getByRole('region', { name: '3D memory library' });
  await expect(shelf).toBeVisible();
  await expect(shelf.getByRole('button', { name: 'Open A note worth keeping with 3D envelope' })).toBeVisible();
  await expect(shelf.getByText('Opened time capsule')).toBeVisible();

  await shelf.getByRole('button', { name: 'Open A note worth keeping with 3D envelope' }).click();
  const scene = page.getByRole('dialog', { name: 'A letter for you' });
  await expect(scene).toBeVisible();
  await expect(scene.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' })).toBeVisible();
  await expect(scene.getByText('These are words from my own private letter.')).toHaveCount(0);
  await scene.getByRole('button', { name: 'Open envelope' }).click();
  await expect(scene.getByText('Envelope opened. Your letter is ready.')).toBeVisible();
  await scene.getByRole('button', { name: 'Read the letter' }).click();
  await expect(page.getByRole('dialog', { name: /Letter from/ })).toBeVisible();
  await expect(page.getByText('These are words from my own private letter.')).toBeVisible();
});

test('scheduled time capsule stays sealed and does not show its content', async ({ page }) => {
  await mockLibrary(page);
  await page.goto('/dashboard/notes?tab=scheduled');
  const card = page.getByRole('article').filter({ hasText: 'For my future self' });
  await expect(card.getByText('Sealed time capsule')).toBeVisible();
  await expect(card.getByText('Opens on:')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Manage scheduled capsule' })).toBeVisible();
  await expect(card.getByText('A private thought that must not be shown on the capsule cover.')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Open time capsule' })).toHaveCount(0);
});

test('overview uses the original SVG mascot and respects reduced-motion preference', async ({ page }) => {
  await mockLibrary(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dashboard');
  const lumi = page.getByRole('button', { name: 'Wave to Lumi' });
  await expect(lumi.locator('img[src="/mascots/lumi.svg"]')).toBeVisible();
  await lumi.click();
  await expect(lumi).toHaveAttribute('aria-pressed', 'true');
  const duration = await lumi.evaluate(element => getComputedStyle(element).transitionDuration);
  expect(duration.split(',').every(part => parseFloat(part) === 0)).toBeTruthy();
  await expect(page.getByRole('link', { name: /My time capsules/ })).toHaveAttribute('href', '/dashboard/notes?tab=scheduled');
});

test('normal library view remains available without 3D interaction', async ({ page }) => {
  await mockLibrary(page);
  await page.goto('/dashboard/notes');
  await page.getByRole('button', { name: '3D library' }).click();
  await page.getByRole('button', { name: 'Normal view' }).click();
  await expect(page.getByRole('region', { name: '3D memory library' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Read letter: A note worth keeping' })).toBeVisible();
});
