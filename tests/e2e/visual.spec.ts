import { expect, test, type Page } from '@playwright/test';

/**
 * Visual regression (brief §16): full-page screenshots at phone, tablet and desktop widths.
 * Baselines live in tests/e2e/visual.spec.ts-snapshots and are generated on Linux (CI) with
 * `pnpm test:visual:update`. Motion is reduced and every reveal settled before capture.
 */
const PAGES = ['/', '/projects', '/projects/fixture-a', '/enquire'];
const SIZES = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle');
  // Every image that is rendered must have finished loading (the scroll triggered the lazy ones).
  await page.waitForFunction(
    () =>
      [...document.images]
        .filter((img) => img.checkVisibility())
        .every((img) => img.complete && img.naturalWidth > 0),
    undefined,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(500);
}

test.describe('visual', () => {
  test.skip(({ isMobile }) => isMobile, 'runs once, in the desktop project, at each size');
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const size of SIZES) {
    for (const path of PAGES) {
      test(`${path} @ ${size.name}`, async ({ page }) => {
        test.setTimeout(60_000);
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto(path);
        await settle(page);
        const name = `${path === '/' ? 'home' : path.slice(1).replaceAll('/', '-')}-${size.name}.png`;
        await expect(page).toHaveScreenshot(name, {
          fullPage: true,
          animations: 'disabled',
          mask: [page.locator('[data-dev-only]'), page.locator('[data-enquiry-bar]')],
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});
