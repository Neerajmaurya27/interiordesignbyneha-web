import { expect, test } from '@playwright/test';

test.describe('/approach', () => {
  test('renders philosophy, services, process, FAQ and the enquiry band', async ({ page }) => {
    await page.goto('/approach');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.prose p').first()).toBeVisible();

    const table = page.getByRole('table', { name: 'Services offered in each city' });
    await expect(table.getByRole('columnheader')).toHaveText(['Service', 'Mumbai', 'Dubai']);
    await expect(table.getByRole('rowheader', { name: 'Full design and execution' })).toBeVisible();

    // The process here does not link back to /approach.
    await expect(page.getByRole('link', { name: 'See the full process and services' })).toHaveCount(
      0,
    );
  });

  test('FAQ answers open and close by keyboard', async ({ page }) => {
    await page.goto('/approach');
    const first = page.locator('details.faq').first();
    const answer = first.locator('p');
    await expect(answer).toBeHidden();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(answer).toBeVisible();
    await page.keyboard.press('Space');
    await expect(answer).toBeHidden();
  });
});

test.describe('/studio', () => {
  test('renders founder, team, studios, partners and press', async ({ page }) => {
    await page.goto('/studio');
    await expect(page.locator('h1')).toHaveCount(1);
    const headings = (await page.locator('main h2').allTextContents()).map((h) =>
      h.replace(/Fixture · unverified/g, '').trim(),
    );
    expect(headings.slice(1)).toEqual([
      'Team',
      'Where we work',
      'Craft partners',
      'Press and recognition',
      'Planning a home in Mumbai, Dubai or between the two?',
    ]);
    await expect(page.getByText('By appointment').first()).toBeVisible();
  });

  test('every image is sized and described', async ({ page }) => {
    await page.goto('/studio');
    const problems = await page
      .locator('main img')
      .evaluateAll(
        (imgs) =>
          imgs.filter(
            (i) => !i.getAttribute('width') || !i.getAttribute('height') || !i.getAttribute('alt'),
          ).length,
      );
    expect(problems).toBe(0);
  });
});
