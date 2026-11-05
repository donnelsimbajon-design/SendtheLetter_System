import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const viewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 797, height: 790 }, // user screenshot width
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1767, height: 864 },
];

for (const viewport of viewports) {
  test('home envelope layout fits ' + viewport.width + 'px without clipping', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Viewport matrix runs on desktop Chromium');
    await page.setViewportSize(viewport);
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /Some things are better in a letter/i });
    const hero = page.getByTestId('home-letter-hero');
    const envelope = hero.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' });
    await expect(heading).toBeVisible();
    await expect(hero).toBeVisible();
    await expect(envelope).toBeVisible();
    await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(0);
    await expect(hero.locator('.stl-real-envelope-paper-lines')).toHaveCount(0);
    const frame = await hero.locator('.stl-real-envelope-scene').evaluate(element => ({
      border: getComputedStyle(element).borderTopWidth,
      background: getComputedStyle(element).backgroundColor,
    }));
    expect(frame.border, 'No nested card border around homepage envelope').toBe('0px');
    expect(frame.background, 'Envelope scene is unboxed and transparent').toBe('rgba(0, 0, 0, 0)');
    const iver = await hero.locator('.stl-home-iver').boundingBox();
    const actualEnvelope = await hero.locator('.stl-real-envelope').boundingBox();
    expect(iver).not.toBeNull();
    expect(actualEnvelope).not.toBeNull();
    expect(iver.x + iver.width / 2, 'Iver must be to the left, not on top of the letter').toBeLessThan(actualEnvelope.x + actualEnvelope.width / 2 - 18);
    const { documentWidth, viewportWidth, headingBox, heroBox } = await page.evaluate(() => {
      const h = document.querySelector('h1');
      const visual = document.querySelector('[data-testid="home-letter-hero"]');
      const asBox = element => {
        const r = element.getBoundingClientRect();
        return { x: r.x, width: r.width, right: r.right };
      };
      return {
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        viewportWidth: document.documentElement.clientWidth,
        headingBox: asBox(h),
        heroBox: asBox(visual),
      };
    });
    expect.soft(documentWidth, 'Horizontal document overflow at ' + viewport.width).toBeLessThanOrEqual(viewportWidth + 2);
    expect.soft(headingBox.x, 'Heading clipped on left at ' + viewport.width).toBeGreaterThanOrEqual(-2);
    expect.soft(headingBox.right, 'Heading clipped on right at ' + viewport.width).toBeLessThanOrEqual(viewportWidth + 2);
    expect.soft(heroBox.x, 'Envelope clipped on left at ' + viewport.width).toBeGreaterThanOrEqual(-2);
    expect.soft(heroBox.right, 'Envelope clipped on right at ' + viewport.width).toBeLessThanOrEqual(viewportWidth + 2);
    await hero.scrollIntoViewIfNeeded();
    await mkdir('layout-snapshots', { recursive: true });
    await page.screenshot({ path: 'layout-snapshots/home-envelope-' + viewport.width + '.png', fullPage: false });
  });
}

test('home envelope opens and recloses on mobile viewport with motion disabled', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Real mobile emulation only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.getByTestId('home-letter-hero');
  await hero.getByRole('button', { name: 'Open demo envelope' }).click();
  await expect(hero.getByRole('img', { name: 'The envelope is open and a letter is emerging' })).toHaveAttribute('data-opened', 'true');
  await hero.getByRole('button', { name: 'Seal demo envelope' }).click();
  await expect(hero.getByRole('img', { name: 'A sealed paper envelope waiting to be opened' })).toHaveAttribute('data-opened', 'false');
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(docWidth).toBeLessThanOrEqual(viewportWidth + 2);
});
