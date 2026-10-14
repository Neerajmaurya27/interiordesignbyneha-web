import { expect, test, type Page } from '@playwright/test';

const PAGE = '/dev/layout';
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 600;

/** Collects console errors/warnings so each test can assert a clean console. */
function watchConsole(page: Page) {
  const messages: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
  });
  page.on('pageerror', (e) => messages.push(e.message));
  return messages;
}

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(400); // IntersectionObserver callbacks + 240ms transitions
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
  const messages = watchConsole(page);
  await page.goto(PAGE);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
  expect(messages).toEqual([]);
});

test('header is transparent over the hero and solid after scrolling', async ({ page }) => {
  await page.goto(PAGE);
  const header = page.locator('[data-site-header]');
  await expect(header).not.toHaveAttribute('data-solid');
  await scrollTo(page, 300);
  await expect(header).toHaveAttribute('data-solid', '');
  await expect(header).toHaveCSS('position', 'sticky');
  await scrollTo(page, 0);
  await expect(header).not.toHaveAttribute('data-solid');
});

test('desktop nav vs mobile menu control by breakpoint', async ({ page }) => {
  await page.goto(PAGE);
  const mainNav = page.getByRole('navigation', { name: 'Main', exact: true });
  const menu = page.getByRole('button', { name: 'Menu' });
  if (isMobile(page)) {
    await expect(mainNav).toBeHidden();
    await expect(menu).toBeVisible();
  } else {
    await expect(mainNav).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(menu).toBeHidden();
  }
});

test('mobile menu traps focus, closes on Escape and returns focus', async ({ page }) => {
  test.skip(!isMobile(page), 'mobile only');
  await page.goto(PAGE);
  const menuButton = page.getByRole('button', { name: 'Menu' });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await menuButton.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  // Tab through more stops than the dialog has; focus must never leave it.
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[data-mobile-menu]'),
    );
    expect(inside, `tab ${i + 1} stayed in the dialog`).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  // Space also opens it (role="button"), and the Close button works.
  await page.keyboard.press(' ');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

test('sticky enquiry bar shows after the hero and hides near the footer', async ({ page }) => {
  test.skip(!isMobile(page), 'mobile only');
  await page.goto(PAGE);
  const bar = page.locator('[data-enquiry-bar]');
  await expect(bar).not.toHaveAttribute('data-visible');
  await expect(bar).toBeHidden();

  const heroHeight = await page
    .locator('[data-enquiry-bar-start]')
    .evaluate((el) => el.clientHeight);
  await scrollTo(page, heroHeight + 100);
  await expect(bar).toHaveAttribute('data-visible', '');
  await expect(bar.getByRole('link', { name: 'Discuss your project' })).toBeVisible();

  await page.locator('#site-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(bar).not.toHaveAttribute('data-visible');
});

test('sticky enquiry bar never shows from 600px up', async ({ page }) => {
  test.skip(isMobile(page), 'tablet/desktop only');
  await page.goto(PAGE);
  await scrollTo(page, 1200);
  await expect(page.locator('[data-enquiry-bar]')).toBeHidden();
});

test('transparent header has no visible bottom edge over the hero', async ({ page }) => {
  await page.goto(PAGE);
  const header = page.locator('[data-site-header]');
  await expect(header).toHaveCSS('background-origin', 'border-box');
  await expect(header).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
});

test('focused elements are never hidden behind the header or the enquiry bar', async ({ page }) => {
  await page.goto(PAGE);
  // Start below the hero so the header is solid and the bar is active on mobile.
  const heroHeight = await page
    .locator('[data-enquiry-bar-start]')
    .evaluate((el) => el.clientHeight);
  await scrollTo(page, heroHeight + 50);
  // Clicking inside <main> (tabindex=-1) sets the sequential focus start point there.
  await page.locator('#section-1 h2').click();

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('[data-site-header]')!.getBoundingClientRect();
      const bar = document.querySelector('[data-enquiry-bar][data-visible]');
      const barTop =
        bar && bar.checkVisibility() ? bar.getBoundingClientRect().top : window.innerHeight;
      const inHeaderOrBar = !!el.closest('[data-site-header], [data-enquiry-bar]');
      return {
        label: el.textContent?.trim().slice(0, 40) ?? el.tagName,
        ok: inHeaderOrBar || (rect.top >= header.bottom - 1 && rect.bottom <= barTop + 1),
      };
    });
    if (result) expect(result.ok, `"${result.label}" obscured`).toBe(true);
  }
});

for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('menu link falls back to footer navigation and header scrolls away', async ({ page }) => {
    await page.goto(PAGE);
    const header = page.locator('[data-site-header]');
    await expect(header).toHaveCSS('position', 'relative');
    if (isMobile(page)) {
      const menu = page.getByRole('link', { name: 'Menu' });
      await expect(menu).toHaveAttribute('href', '#site-footer-nav');
      await menu.click();
      await expect(page.locator('#site-footer-nav')).toBeInViewport();
    }
    await expect(page.locator('[data-enquiry-bar]')).toBeHidden();
  });
});

test('404 page renders with one h1', async ({ page }) => {
  const response = await page.goto('/this-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('This page isn’t here');
});
