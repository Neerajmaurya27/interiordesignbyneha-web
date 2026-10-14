import { expect, test, type Page } from '@playwright/test';

/**
 * Responsive sweep (brief §15, §18): every page at every reference width. Runs once (desktop
 * project) and sets the viewport itself.
 */
const PAGES = [
  '/',
  '/projects',
  '/projects/fixture-a',
  '/projects/fixture-b',
  '/approach',
  '/studio',
  '/enquire',
  '/enquire/thank-you',
  '/missing-page',
];
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(20);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe('responsive sweep', () => {
  test.skip(({ isMobile }) => isMobile, 'runs once, in the desktop project');

  for (const width of WIDTHS) {
    test(`all pages at ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await scrollThrough(page);
        const report = await page.evaluate((vwIsMobile) => {
          const vw = document.documentElement.clientWidth;
          const visible = (el: Element) =>
            el.checkVisibility() &&
            !el.closest('.sr-only, [aria-hidden="true"], dialog:not([open])');

          const overflowing = [...document.querySelectorAll('body *')]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return visible(el) && r.width > 0 && (r.right > vw + 1 || r.left < -1);
            })
            .map((el) => el.outerHTML.slice(0, 80));

          // Tap targets: at least 24×24 on phones, except links inside running text.
          const small = vwIsMobile
            ? [...document.querySelectorAll('a[href], button, select, textarea, summary, input')]
                .filter((el) => {
                  if (!visible(el) || el.closest('p, label, .prose, [hidden]')) return false;
                  if (el.matches('input[type=radio], input[type=checkbox], input[type=hidden]'))
                    return false;
                  const r = el.getBoundingClientRect();
                  return r.height < 24 || r.width < 24;
                })
                .map((el) => el.outerHTML.slice(0, 80))
            : [];

          const names = [...document.querySelectorAll('*')]
            .map((el) => getComputedStyle(el).viewTransitionName)
            .filter((n) => n && n !== 'none');
          const duplicates = names.filter((n, i) => names.indexOf(n) !== i);

          return {
            horizontalScroll: document.documentElement.scrollWidth > vw,
            overflowing,
            small,
            duplicates,
          };
        }, width < 600);

        expect.soft(report.horizontalScroll, `${path} @${width}: horizontal scroll`).toBe(false);
        expect
          .soft(report.overflowing, `${path} @${width}: elements beyond the viewport`)
          .toEqual([]);
        expect.soft(report.small, `${path} @${width}: tap targets under 24px`).toEqual([]);
        expect
          .soft(report.duplicates, `${path} @${width}: duplicate view-transition names`)
          .toEqual([]);
      }
    });
  }

  test('sticky elements are sticky on desktop only', async ({ page }) => {
    const stickyPositions = () =>
      page.evaluate(() =>
        ['.facts-sticky', '.craft-caption', '.plan-figure'].map((sel) => {
          const el = document.querySelector(sel);
          return el && el.checkVisibility() ? getComputedStyle(el).position : 'hidden';
        }),
      );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects/fixture-a');
    expect(await stickyPositions()).toEqual(['sticky', 'sticky', 'sticky']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/fixture-a');
    expect((await stickyPositions()).filter((p) => p === 'sticky')).toEqual([]);
  });
});
