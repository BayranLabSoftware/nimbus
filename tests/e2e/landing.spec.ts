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

    // Start in English. The tagline carries the language now that the
    // "Coming soon" eyebrow is gone.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Catastrophic events simulated')).toBeVisible();

    // Button is labelled for screen readers regardless of language.
    const button = page.getByRole('button', { name: /Switch language|Cambia lingua/ });
    await button.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.getByText('Eventi catastrofici simulati')).toBeVisible();

    // Flip back.
    await button.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has a single H1 and a features section heading', async ({ page }) => {
    await page.goto('/?lng=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    // The features heading. It said "What's coming" while all five of
    // those things were already shipped; the copy pass of 9 September
    // renamed it and this suite is what noticed.
    await expect(page.getByRole('heading', { level: 2, name: 'What it does' })).toBeVisible();
  });
});
