import { expect, test } from '@playwright/test';

test.describe('landing page', () => {
  test('renders hero content and the way in', async ({ page }) => {
    await page.goto('/?lng=en');

    // Skip-link present and focusable.
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeAttached();

    // Hero H1 (the project name) is the single H1 on the page.
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();

    // The house mark sits top-left and leads home. It replaced the
    // wordmark, and the "Star on GitHub" call to action left with it —
    // the primary control on this page is the one that opens the
    // simulator.
    const brand = page.getByRole('link', { name: 'BayranLab Software' });
    await expect(brand).toBeVisible();
    await expect(brand).toHaveAttribute('href', /bayranlabsoftware/);

    const enter = page.getByRole('button', { name: /Try the simulator|Prova il simulatore/ });
    await expect(enter).toBeVisible();
  });

  test('language switch flips EN ↔ IT and updates <html lang>', async ({ page }) => {
    await page.goto('/?lng=en');

    // Start in English. The tagline carries the language.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Simulation of natural and human-made')).toBeVisible();

    // Button is labelled for screen readers regardless of language.
    const button = page.getByRole('button', { name: /Switch language|Cambia lingua/ });
    await button.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.getByText('Simulazione degli eventi catastrofici')).toBeVisible();

    // Flip back.
    await button.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has a single H1 and the four section headings', async ({ page }) => {
    await page.goto('/?lng=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    for (const name of [
      'Physical models and sources',
      'Mapping at true geographic scale',
      'Validation against recorded events',
      'Citing the software',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    }
  });

  test('the validation section reads the report it links to', async ({ page }) => {
    await page.goto('/?lng=en');
    // The section loads on its own chunk. Its figures come from
    // docs/VALIDATION_REPORT.json, the same file the validation page reads,
    // so the landing page cannot show a number that page does not.
    const figure = page.getByText(/Death tolls for \d+ events/);
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toBeVisible();
    await expect(page.getByRole('table', { name: 'Data of figure 2' })).toBeAttached();

    await page.getByRole('button', { name: 'Full report →' }).click();
    await expect(page).toHaveURL(/m=validation/);
  });
});
