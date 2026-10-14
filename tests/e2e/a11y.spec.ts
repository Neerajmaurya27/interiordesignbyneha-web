import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** WCAG 2.2 AA on every route (brief §15, §16): zero violations allowed. */
const PAGES = [
  '/',
  '/projects',
  '/projects/fixture-a',
  '/projects/fixture-b',
  '/approach',
  '/studio',
  '/enquire',
  '/enquire/thank-you',
  '/privacy',
  '/missing-page',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    // The development-only preview tag is not part of the site.
    .exclude('[data-dev-only]')
    .analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(800); // let reveals settle so contrast is measured at full opacity
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await scrollThrough(page);
    expect(await audit(page)).toEqual([]);
  });
}

test('axe: open mobile menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  expect(await audit(page)).toEqual([]);
});

test('axe: open lightbox', async ({ page }) => {
  await page.goto('/projects/fixture-a');
  await page.locator('[data-lightbox-trigger]').first().click();
  await expect(page.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test('axe: enquiry form showing errors', async ({ page }) => {
  await page.goto('/enquire');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.getByRole('region', { name: 'There is a problem' })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});
