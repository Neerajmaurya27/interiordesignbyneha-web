import { expect, test, type Page } from '@playwright/test';

/** The server rejects submissions made within 3 seconds of rendering; wait like a person. */
async function settle(page: Page) {
  await page.waitForTimeout(3200);
}

async function fillValid(page: Page, name = 'Asha Rao') {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill('asha@example.com');
  await page.getByLabel('Apartment or penthouse').check();
  await page.getByLabel('Mumbai', { exact: true }).check();
  // Choosing Mumbai prefills the country code into the empty phone field.
  await expect(page.getByLabel('Phone or WhatsApp')).toHaveValue('+91 ');
  await page.getByLabel('Phone or WhatsApp').fill('+91 98765 43210');
  await page.getByLabel('3–6 months').check();
  await page.getByLabel('Tell us about your project').fill('A family home with a study.');
  await page.getByRole('checkbox', { name: /I agree to/ }).check();
}

test('one h1, labelled fields and no animation-driven content', async ({ page }) => {
  await page.goto('/enquire');
  await expect(page.locator('h1')).toHaveText('Discuss your project');
  for (const label of ['Full name', 'Email', 'Phone or WhatsApp']) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
  await expect(page.getByLabel('Phone or WhatsApp')).toHaveAttribute('type', 'tel');
  await expect(page.locator('[data-reveal]')).toHaveCount(0);
  await expect(page.locator('[data-enquiry-bar]')).toHaveCount(0);
});

test('empty submission explains each problem in words and focuses the summary', async ({
  page,
}) => {
  await page.goto('/enquire');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  const summary = page.getByRole('region', { name: 'There is a problem' });
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('link', { name: 'Enter your full name' })).toBeVisible();
  await expect(summary.getByRole('link', { name: /country code/ })).toBeVisible();
  await expect(summary.getByRole('link', { name: 'Choose where the project is' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Full name')).toHaveAccessibleDescription(/Enter your full name/);
  // Summary links move focus to the field.
  await summary.getByRole('link', { name: 'Enter your full name' }).click();
  await expect(page.getByLabel('Full name')).toBeFocused();
});

test('prefills from a case-study link', async ({ page }) => {
  await page.goto('/enquire?type=villa&city=dubai&project=fixture-b');
  await expect(page.getByLabel('Villa', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Dubai', { exact: true })).toBeChecked();
  await expect(page.locator('input[name="project"]')).toHaveValue('fixture-b');
});

test('conditional questions follow the chosen city', async ({ page }) => {
  await page.goto('/enquire');
  const other = page.getByLabel('City and country');
  await expect(other).toBeHidden();
  await page.getByLabel('Elsewhere').check();
  await expect(other).toBeVisible();

  await page.getByLabel('Dubai', { exact: true }).check();
  await expect(page.locator('[data-budget-currency="aed"]')).toBeVisible();
  await expect(page.locator('[data-budget-currency="inr"]')).toBeHidden();
  // Only services offered in Dubai are listed (the dev sample offers design only there).
  await expect(page.getByLabel('Full design and execution')).toBeHidden();
  await expect(page.getByLabel('Design only')).toBeVisible();
  await expect(page.getByLabel('Not sure yet')).toBeVisible();
});

test('a valid enquiry goes to the thank-you page', async ({ page }) => {
  await page.goto('/enquire');
  await fillValid(page);
  await settle(page);
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page).toHaveURL(/\/enquire\/thank-you$/);
  await expect(page.locator('h1')).toHaveText('Thank you');
});

test('a provider failure keeps everything typed and offers other ways to reach us', async ({
  page,
}) => {
  await page.goto('/enquire');
  await fillValid(page, 'Simulate failure');
  await settle(page);
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  const summary = page.getByRole('region', { name: 'There is a problem' });
  await expect(summary).toBeFocused();
  await expect(summary).toContainText('Nothing you typed has been lost');
  await expect(page.getByLabel('Full name')).toHaveValue('Simulate failure');
  await expect(page.getByLabel('Tell us about your project')).toHaveValue(
    'A family home with a study.',
  );
  await expect(page.getByRole('complementary', { name: 'Prefer to talk?' })).toBeVisible();
});

test('submitting too quickly asks to send again, keeping the values', async ({ page }) => {
  await page.goto('/enquire');
  await fillValid(page);
  // No wait: under the minimum time-to-submit.
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="renderedAt"]')!;
    input.value = String(Date.now());
  });
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.getByRole('region', { name: 'There is a problem' })).toContainText(
    'Please check your details and send the form again.',
  );
  await expect(page.getByLabel('Email')).toHaveValue('asha@example.com');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('errors re-render with the typed values', async ({ page }) => {
    await page.goto('/enquire');
    await page.getByLabel('Full name').fill('Asha Rao');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Tell us about your project').fill('Keep this text.');
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByRole('region', { name: 'There is a problem' })).toBeVisible();
    await expect(
      page.getByText('Error: Enter an email address in the format name@example.com'),
    ).toBeVisible();
    await expect(page.getByLabel('Full name')).toHaveValue('Asha Rao');
    await expect(page.getByLabel('Tell us about your project')).toHaveValue('Keep this text.');
  });

  test('a valid enquiry is accepted with a plain POST', async ({ page }) => {
    await page.goto('/enquire');
    await page.getByLabel('Full name').fill('Asha Rao');
    await page.getByLabel('Email').fill('asha@example.com');
    await page.getByLabel('Phone or WhatsApp').fill('+971 50 123 4567');
    await page.getByLabel('Villa', { exact: true }).check();
    await page.getByLabel('Dubai', { exact: true }).check();
    await page.getByLabel('Exploring').check();
    await page.getByRole('checkbox', { name: /I agree to/ }).check();
    await settle(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page).toHaveURL(/\/enquire\/thank-you$/);
  });
});
