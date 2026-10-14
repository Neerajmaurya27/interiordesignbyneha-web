import { expect, test, type Page } from '@playwright/test';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test.describe('projects index', () => {
  test('lists every project in the HTML and offers only filters with 3+ projects', async ({
    page,
  }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toHaveText('Projects');
    await expect(page.locator('[data-project-card]')).toHaveCount(7);
    const filters = page.getByRole('navigation', { name: 'Filter projects' });
    await expect(filters.getByRole('link', { name: 'Dubai' })).toBeVisible();
    await expect(filters.getByRole('link', { name: 'Residences' })).toBeVisible();
    // Only one hospitality fixture: that option is not offered.
    await expect(filters.getByRole('link', { name: 'Hospitality & commercial' })).toHaveCount(0);
    // Facts are visible on every card without hover.
    await expect(page.locator('[data-project-card] p.text-caption').first()).toBeVisible();
  });

  test('filters update the URL, announce the count and survive Back', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: 'Dubai', exact: true }).click();
    await expect(page).toHaveURL(/\/projects\?city=dubai$/);
    await expect(page.locator('[data-filter-status]')).toHaveText('Showing 4 of 7 projects');
    await expect(page.locator('[data-project-card]:visible')).toHaveCount(4);
    await expect(page.getByRole('link', { name: 'Dubai', exact: true })).toHaveAttribute(
      'aria-current',
      'true',
    );
    // The first visible card restarts the grid rhythm.
    await expect(page.locator('[data-project-card]:visible').first()).toHaveAttribute(
      'data-shape',
      'full',
    );

    await page.locator('[data-project-card]:visible a').first().click();
    await expect(page).toHaveURL(/\/projects\/fixture-/);
    await page.goBack();
    await expect(page).toHaveURL(/\/projects\?city=dubai$/);
    await expect(page.locator('[data-project-card]:visible')).toHaveCount(4);
  });

  test('combined filters apply straight from the URL', async ({ page }) => {
    await page.goto('/projects?city=mumbai&type=residences');
    await expect(page.locator('[data-project-card]:visible')).toHaveCount(3);
    await page.goto('/projects?city=dubai&type=residences');
    await expect(page.locator('[data-project-card]:visible')).toHaveCount(3);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('shows every project and keeps the filter links', async ({ page }) => {
      await page.goto('/projects?city=dubai');
      await expect(page.locator('[data-project-card]:visible')).toHaveCount(7);
      await expect(page.getByRole('link', { name: 'Mumbai', exact: true })).toHaveAttribute(
        'href',
        '/projects?city=mumbai',
      );
    });
  });
});

test.describe('case study', () => {
  test('a full project renders every block in order', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    await expect(page.locator('h1')).toHaveCount(1);
    const hero = page.locator('main img').first();
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    await expect(hero).toHaveAttribute('loading', 'eager');
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.map((h) => h.trim())).toEqual([
      'The brief',
      'Concept',
      'Photographs',
      'Materials and craft',
      'Plan',
      'Execution',
      'Before and after',
      'Credits',
      'Planning a similar home in Mumbai?',
      'Related projects',
    ]);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Projects');
    await expect(page.getByRole('link', { name: 'Discuss your project' }).last()).toHaveAttribute(
      'href',
      '/enquire?type=apartment&city=mumbai&project=fixture-a',
    );
    await expect(page.getByText('Next project')).toBeVisible();
  });

  test('a minimal project omits optional blocks without leaving gaps', async ({ page }) => {
    await page.goto('/projects/fixture-b');
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.map((h) => h.trim())).toEqual([
      'The brief',
      'Concept',
      'Credits',
      'Planning a similar home in Dubai?',
      'Related projects',
    ]);
    await expect(
      page.locator('[data-plan], [data-before-after], [data-lightbox-trigger]'),
    ).toHaveCount(0);
  });

  test('facts: sticky panel on desktop, disclosure on mobile', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    if (isDesktop(page)) {
      await expect(page.getByRole('complementary', { name: 'Project facts' })).toBeVisible();
    } else {
      const details = page.locator('details').filter({ hasText: 'Project details' });
      await expect(details).toBeVisible();
      await details.locator('summary').click();
      await expect(details.getByText('Photography')).toBeVisible();
    }
  });

  test('lightbox: keyboard, counter, Escape, Back and focus return', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    const trigger = page.locator('[data-lightbox-trigger]').nth(1);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Image viewer' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-lightbox-count]')).toHaveText('2 of 17');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('[data-lightbox-count]')).toHaveText('3 of 17');
    await dialog.getByRole('button', { name: 'Previous image' }).click();
    await expect(dialog.locator('[data-lightbox-count]')).toHaveText('2 of 17');
    await expect(dialog.locator('[data-lightbox-image]')).toHaveAttribute('alt', /Fixture/);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(/\/projects\/fixture-a$/);

    // The browser Back button closes it without leaving the page.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/projects\/fixture-a$/);
  });

  test('before/after works with keyboard and buttons, not only drag', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    const figure = page.locator('[data-before-after]');
    const range = figure.getByRole('slider');
    const before = figure.locator('[data-ba-before]');
    await range.focus();
    await page.keyboard.press('ArrowRight');
    await expect(before).toHaveAttribute('style', /--ba: 55%/);
    await figure.getByRole('button', { name: 'Show before' }).click();
    await expect(range).toHaveValue('100');
    await figure.getByRole('button', { name: 'Show after' }).click();
    await expect(before).toHaveAttribute('style', /--ba: 0%/);
  });

  test('no horizontal scroll and every image is sized', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    const unsized = await page
      .locator('main img, [data-lightbox] img')
      .evaluateAll(
        (imgs) =>
          imgs.filter(
            (i) => !i.getAttribute('width') || !i.getAttribute('height') || !i.hasAttribute('alt'),
          ).length,
      );
    expect(unsized).toBe(0);
  });
});
