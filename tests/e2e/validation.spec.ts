import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import report from '../../docs/VALIDATION_REPORT.json' with { type: 'json' };

/**
 * The public validation page: the model against real events, misses
 * included. It is read from the same generated report CI keeps in step
 * with the code, so what this checks is that the page shows all of it
 * — and that a visitor can find it.
 */
test.describe('validation page', () => {
  test('shows every counted event, and the misses with their causes', async ({ page }) => {
    await page.goto('/?lng=en&m=validation');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Validation: the model against real events' })
    ).toBeVisible();

    const tolls = page.getByTestId('validation-tolls').locator('tbody tr');
    await expect(tolls).toHaveCount(report.calibration.tolls.length);
    const misses = report.calibration.tolls.filter((r) => !r.contains).length;
    await expect(
      page.getByTestId('validation-tolls').getByText('misses', { exact: true })
    ).toHaveCount(misses);
    await expect(page.getByTestId('validation-waves').locator('tbody tr')).toHaveCount(
      report.calibration.waves.length
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Why a row misses' })).toBeVisible();

    // Which rows the model was set on, beside each row and in their own
    // section: a count of passes means nothing without it.
    const heldOutTolls = report.calibration.tolls.filter((r) => r.role === 'heldOut').length;
    await expect(
      page.getByTestId('validation-tolls').getByText('held out', { exact: true })
    ).toHaveCount(heldOutTolls);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Which checks are validation' })
    ).toBeVisible();
    await expect(page.getByTestId('validation-roles').getByText('tuned on it')).toBeVisible();
  });

  test('is one click from the landing page', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'How the model is checked' }).click();
    await expect(page.getByTestId('validation-page')).toBeVisible();
  });

  test('passes WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/?lng=en&m=validation');
    await expect(page.getByTestId('validation-page')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `[${v.id}] ${v.help} (${v.nodes.length.toString()})`).join('\n')
    ).toEqual([]);
  });
});
