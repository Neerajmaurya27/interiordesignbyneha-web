import { expect, test } from '@playwright/test';

/**
 * Cross-document view transitions (brief §6): card image → case-study hero, only when the
 * visitor accepts motion. Chromium reports the transition on the incoming page's pagereveal event.
 */
async function trackReveal(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      const vt = (event as Event & { viewTransition?: unknown }).viewTransition;
      (window as unknown as { __vt: boolean }).__vt = !!vt;
    });
  });
}

test.describe('view transitions', () => {
  test.skip(({ isMobile }) => isMobile, 'navigation behaviour is the same on both projects');

  test('run between the projects index and a case study, carrying the image', async ({ page }) => {
    await trackReveal(page);
    await page.goto('/projects');
    const card = page.locator('[data-project-card] a').first();
    const name = await card
      .locator('.card-media')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(name).toBe('project-fixture-a');
    await card.click();
    await expect(page).toHaveURL(/\/projects\/fixture-a$/);
    expect(await page.evaluate(() => (window as unknown as { __vt: boolean }).__vt)).toBe(true);
    // The case-study hero carries the same name, so the image morphs into place.
    expect(
      await page.locator('.project-hero').evaluate((el) => getComputedStyle(el).viewTransitionName),
    ).toBe('project-fixture-a');
  });

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('do not run, and nothing is named for morphing', async ({ page }) => {
      await trackReveal(page);
      await page.goto('/projects');
      expect(
        await page
          .locator('.card-media')
          .first()
          .evaluate((el) => getComputedStyle(el).viewTransitionName),
      ).toBe('none');
      await page.locator('[data-project-card] a').first().click();
      await expect(page).toHaveURL(/\/projects\/fixture-a$/);
      // No transition was offered (false), or none reached the page at all (undefined).
      expect(await page.evaluate(() => (window as unknown as { __vt?: boolean }).__vt)).not.toBe(
        true,
      );
    });
  });
});

test.describe('reduced motion across pages', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const path of ['/', '/projects', '/projects/fixture-a', '/studio']) {
    test(`${path}: no transforms on revealed content or hover targets`, async ({ page }) => {
      await page.goto(path);
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 600) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(400);
      const transformed = await page
        .locator('[data-reveal]')
        .evaluateAll(
          (els) =>
            els.filter((el) => el.checkVisibility() && getComputedStyle(el).transform !== 'none')
              .length,
        );
      expect(transformed).toBe(0);
    });
  }
});
