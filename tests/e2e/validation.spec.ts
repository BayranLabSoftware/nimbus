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
  test("shows the impacts' own evidence, and what has never been measured", async ({ page }) => {
    await page.goto('/?lng=en&m=validation');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Validation: the impacts against what has been measured',
      })
    ).toBeVisible();

    // A row per quantity of the comparison against the reference program. The
    // figure above the table carries the same rows again for screen readers,
    // so the table is the last one of the section.
    const quantities = report.verification.eiep.summaries.length;
    await expect(
      page.getByTestId('validation-program').getByRole('table').last().locator('tbody tr')
    ).toHaveCount(quantities);

    // The entry: three readings of the same bolides, then the cells.
    const cells = report.calibration.entryCells.length;
    await expect(page.getByTestId('validation-entry').locator('tbody tr')).toHaveCount(3 + cells);

    // The domain's own rules, the one that does not hold included.
    const impacts = report.goldStandard.domains.find((d) => d.domain === 'Impacts');
    expect(impacts, 'the report has no Impacts domain').toBeDefined();
    const rules = impacts?.rules ?? [];
    await expect(page.getByTestId('validation-rules').locator('tbody tr')).toHaveCount(
      rules.length
    );
    await expect(
      page.getByTestId('validation-rules').getByText('does not hold', { exact: true })
    ).toHaveCount(rules.filter((r) => !r.holds).length);

    // The half of the page that says what cannot be checked at all.
    await expect(
      page.getByRole('heading', { level: 2, name: 'What has never been measured' })
    ).toBeVisible();
    await expect(
      page.getByTestId('validation-unmeasured').getByText('No impact death toll exists')
    ).toBeVisible();

    // And the tables of the modules the site has hidden are gone with them
    // (store/visibleEvents.ts): the recorded tolls, the wave heights, the
    // ShakeMap footprints and the sets chosen by rule. A hidden module's event
    // may still be named in a gap — Tōhoku is the evidence that a warning on a
    // timer over-counts the drowned, which is an impact's wave too — so what
    // is asserted here is the sections, not the words.
    await expect(page.getByTestId('validation-tolls')).toHaveCount(0);
    await expect(page.getByTestId('validation-waves')).toHaveCount(0);
    await expect(page.getByTestId('validation-by-rule')).toHaveCount(0);
    await expect(page.getByTestId('validation-roles')).toHaveCount(0);
  });

  test('is one click from the landing page', async ({ page }) => {
    await page.goto('/?lng=en');
    // The landing page calls it by the name of the thing it opens; the
    // copy pass of 16 September renamed the button and this test is what
    // noticed.
    await page.getByRole('button', { name: 'Validation report' }).click();
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
