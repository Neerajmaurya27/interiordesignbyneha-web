import { expect, test, type Page } from '@playwright/test';

/** Scroll the whole page so lazy images load and reveals fire. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(800);
}

test('home renders seven chapters in order with one h1 and a clean console', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
  });
  page.on('pageerror', (e) => messages.push(e.message));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const chapters = await page
    .locator('[data-chapter]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.chapter));
  expect(chapters).toEqual(['01', '02', '03', '04', '05', '06', '07']);
  expect(messages).toEqual([]);
});

test('hero image is the eager, high-priority LCP image and is not animated', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-chapter="01"] img').first();
  await expect(hero).toHaveAttribute('fetchpriority', 'high');
  await expect(hero).toHaveAttribute('loading', 'eager');
  await expect(hero).toHaveAttribute('width', /\d+/);
  await expect(hero).toHaveAttribute('height', /\d+/);
  expect(await hero.evaluate((el) => !!el.closest('[data-reveal]'))).toBe(false);
  // Only the hero is eager; everything else waits.
  const eager = await page.locator('main img[loading="eager"]').count();
  expect(eager).toBe(1);
});

test('every image has width, height and alt', async ({ page }) => {
  await page.goto('/');
  const problems = await page
    .locator('main img')
    .evaluateAll((imgs) =>
      imgs
        .filter(
          (img) =>
            !img.getAttribute('width') || !img.getAttribute('height') || !img.hasAttribute('alt'),
        )
        .map((img) => img.outerHTML.slice(0, 80)),
    );
  expect(problems).toEqual([]);
});

test('project facts are visible without hover', async ({ page }) => {
  await page.goto('/');
  const facts = page.locator('#selected-work article p.text-caption');
  await expect(facts.first()).toBeVisible();
  expect(await facts.count()).toBeGreaterThanOrEqual(3);
});

test('reveals settle once and content is visible after scrolling', async ({ page }) => {
  await page.goto('/');
  await scrollThrough(page);
  const stillHidden = await page
    .locator('[data-reveal]')
    .evaluateAll(
      (els) =>
        els.filter((el) => el.checkVisibility() && getComputedStyle(el).opacity !== '1').length,
    );
  expect(stillHidden).toBe(0);
  // Scrolling back up does not replay the animation.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const reset = await page.locator('[data-reveal][data-revealed]').count();
  expect(reset).toBeGreaterThan(0);
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('no transforms are applied to revealed content', async ({ page }) => {
    await page.goto('/');
    await scrollThrough(page);
    const transformed = await page
      .locator('[data-reveal]')
      .evaluateAll(
        (els) =>
          els.filter((el) => el.checkVisibility() && getComputedStyle(el).transform !== 'none')
            .length,
      );
    expect(transformed).toBe(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all chapter content is visible', async ({ page }) => {
    await page.goto('/');
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll(
        (els) =>
          els.filter((el) => el.checkVisibility() && getComputedStyle(el).opacity !== '1').length,
      );
    expect(hidden).toBe(0);
    // Captions are shown under each close-up when the sticky column cannot run.
    await expect(page.locator('[data-chapter="03"] figcaption').first()).toBeVisible();
  });
});

test('sticky caption follows the close-up in view (desktop)', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'desktop only');
  await page.goto('/');
  const figures = page.locator('[data-caption-item]');
  const third = figures.nth(2);
  await third.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    window.scrollTo(0, rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2);
  });
  await page.waitForTimeout(600);
  const expected = await third.getAttribute('data-caption');
  await expect(page.locator('[data-sticky-caption]')).toHaveText(expected!);
  await expect(page.locator('[data-sticky-caption]')).toBeInViewport();
  // The per-figure caption remains in the DOM for assistive technology.
  await expect(third.locator('figcaption')).toHaveText(expected!);
});
