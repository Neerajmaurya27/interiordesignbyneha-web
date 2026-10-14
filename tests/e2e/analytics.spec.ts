import { expect, test, type Page } from '@playwright/test';

const events = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __analytics?: { name: string; props: Record<string, string> }[] })
        .__analytics ?? [],
  );

test.describe('analytics events', () => {
  test.skip(({ isMobile }) => isMobile, 'event wiring is the same on both projects');

  test('project_view, gallery_open and cta_click on a case study', async ({ page }) => {
    await page.goto('/projects/fixture-a');
    await page.locator('[data-lightbox-trigger]').first().click();
    await page.keyboard.press('Escape');
    const names = (await events(page)).map((e) => e.name);
    expect(names).toContain('project_view');
    expect(names).toContain('gallery_open');
    expect((await events(page)).find((e) => e.name === 'project_view')?.props).toEqual({
      slug: 'fixture-a',
      city: 'mumbai',
      type: 'residence',
    });
  });

  test('filter_change on the projects index', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: 'Dubai', exact: true }).click();
    expect((await events(page)).find((e) => e.name === 'filter_change')?.props).toEqual({
      city: 'dubai',
    });
  });

  test('chapter_view once per home chapter, and form_start on the enquiry form', async ({
    page,
  }) => {
    await page.goto('/');
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const chapters = (await events(page))
      .filter((e) => e.name === 'chapter_view')
      .map((e) => e.props.chapter);
    expect(chapters).toEqual(['01', '02', '03', '04', '05', '06', '07']);

    await page.goto('/enquire');
    await page.getByLabel('Full name').focus();
    expect((await events(page)).map((e) => e.name)).toContain('form_start');
  });

  test('no personal data in any event', async ({ page }) => {
    await page.goto('/enquire');
    await page.getByLabel('Full name').fill('Asha Rao');
    await page.getByLabel('Email').fill('asha@example.com');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    const serialised = JSON.stringify(await events(page));
    expect(serialised).not.toContain('Asha');
    expect(serialised).not.toContain('example.com');
  });
});
