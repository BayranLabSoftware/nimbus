import { expect, test, type Page } from '@playwright/test';

/**
 * An impact's report (ROADMAP IMP-7c), opened as a recipient opens it: from
 * the link alone, with no globe behind it. It must draw every map the globe
 * draws, speak one language only (B-110), print every word dark on white
 * (B-109) and fit A4 pages.
 */
const METEOR = '/?t=impact&p=METEOR_CRATER&lat=35.0275&lon=-111.0225&m=report';

async function openReport(page: Page, lng: 'it' | 'en'): Promise<void> {
  await page.goto(`${METEOR}&lng=${lng}`);
  await expect(page.getByTestId('impact-report')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const maps = [...document.querySelectorAll('svg[data-report-map]')];
      return maps.length > 0 && maps.every((m) => m.getAttribute('data-ready') === 'true');
    },
    null,
    { timeout: 60_000 }
  );
}

async function worstContrast(page: Page, root: string): Promise<{ lowest: number; where: string }> {
  return page.evaluate((rootSelector) => {
    const parse = (css: string): [number, number, number, number] => {
      const m = /rgba?\(([^)]+)\)/.exec(css);
      if (m === null) return [0, 0, 0, 1];
      const [r = 0, g = 0, b = 0, a = 1] = (m[1] ?? '')
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
      return [r, g, b, a];
    };
    const luminance = ([r, g, b]: number[]): number => {
      const lin = (c: number): number => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(r ?? 0) + 0.7152 * lin(g ?? 0) + 0.0722 * lin(b ?? 0);
    };
    let lowest = Number.POSITIVE_INFINITY;
    let where = '';
    for (const el of document.querySelectorAll(`${rootSelector} *`)) {
      const own = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0
      );
      if (!own || el.closest('svg') !== null) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      let [r, g, b, a] = parse(style.color);
      for (let p: Element | null = el; p !== null; p = p.parentElement) {
        a *= Number(getComputedStyle(p).opacity);
      }
      let bg: [number, number, number] = [255, 255, 255];
      for (let p: Element | null = el; p !== null; p = p.parentElement) {
        const [br, bgc, bb, ba] = parse(getComputedStyle(p).backgroundColor);
        if (ba > 0.5) {
          bg = [br, bgc, bb];
          break;
        }
      }
      r = r * a + bg[0] * (1 - a);
      g = g * a + bg[1] * (1 - a);
      b = b * a + bg[2] * (1 - a);
      const l1 = luminance([r, g, b]);
      const l2 = luminance(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio < lowest) {
        lowest = ratio;
        where = `${el.tagName} "${el.textContent.trim().slice(0, 40)}"`;
      }
    }
    return { lowest, where };
  }, root);
}

test.describe('the impact report', () => {
  test('opens from a link in Italian with every map, and no English on it', async ({ page }) => {
    await openReport(page, 'it');
    await expect(page.locator('svg[data-report-map]')).toHaveCount(6);
    const text = await page.getByTestId('impact-report').innerText();
    expect(text).toContain('Report di simulazione');
    expect(text).toContain('Impatto cosmico · Meteor Crater (Barringer)');
    expect(text).toContain('12,8 km/s');
    for (const english of [
      'Cosmic impact',
      'Impactor diameter',
      'Kinetic energy',
      'partial airburst',
      'Crater morphology',
      'Stratospheric dust',
      'Figure 1',
      'Nearest sea',
    ]) {
      expect(text).not.toContain(english);
    }
    // No photograph of the globe: none was behind this link, and it says so.
    await expect(page.locator('svg[data-report-map] image')).toHaveCount(6);
  });

  test('reads the same scenario in English, the sender’s language switchable', async ({ page }) => {
    await openReport(page, 'en');
    const text = await page.getByTestId('impact-report').innerText();
    expect(text).toContain('Simulation report');
    expect(text).toContain('12.8 km/s');
    expect(text).not.toContain('Impatto cosmico');
    await page.getByRole('button', { name: 'IT' }).click();
    await expect(page.getByTestId('impact-report')).toContainText('Impatto cosmico');
    expect(new URL(page.url()).searchParams.get('lng')).toBe('it');
  });

  test('B-109 every word of the printed report is dark on white', async ({ page }) => {
    await openReport(page, 'it');
    await page.emulateMedia({ media: 'print' });
    const worst = await worstContrast(page, '[data-report-sheet]');
    // White on white is 1; the old band column read 1.1.
    expect(worst.lowest, worst.where).toBeGreaterThan(3);
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('B-109 the other modules print their toll and timeline in ink too', async ({
    page,
  }) => {
    await page.goto('/?t=earthquake&p=NORTHRIDGE_1994&lat=34.213&lon=-118.537&m=report&lng=it');
    await expect(page.getByTestId('casualties')).toBeVisible({ timeout: 60_000 });
    await page.emulateMedia({ media: 'print' });
    const worst = await worstContrast(page, 'main');
    expect(worst.lowest, worst.where).toBeGreaterThan(3);
  });

  test('rule 1037: prints every map’s provenance card, and the fixed note', async ({ page }) => {
    await openReport(page, 'it');
    // Each figure's card: the quantity heading its rows, and four fields on
    // every row — the field's and each mark's.
    const ids = await page
      .locator('[data-report-card]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-report-card') ?? ''));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      await expect(page.locator(`[data-report-card="${id}"] [data-card="quantity"]`)).toHaveCount(
        1
      );
      const rows = page.locator(`tr[data-report-row="${id}"]`);
      const n = await rows.count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) await expect(rows.nth(i).locator('[data-card]')).toHaveCount(4);
    }
    await expect(page.getByTestId('rendering-note')).toHaveText(
      'La resa cartografica non estende il dominio fisico del modello.'
    );
    // Past the overpressure's last isoline the field goes on below it: the
    // band's key and card are printed with the map's.
    await expect(
      page.locator('tr[data-report-row="overpressure"][data-report-mark="belowThreshold"]')
    ).toHaveCount(1);
    await openReport(page, 'en');
    await expect(page.getByTestId('rendering-note')).toHaveText(
      "The map's rendering does not extend the model's physical domain."
    );
  });

  test('prints to A4, a sheet a page', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium prints to PDF.');
    await openReport(page, 'it');
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBeGreaterThanOrEqual(7);
    // Rule 1037 (b): the maps' provenance cards take a sheet of their own.
    expect(pages).toBeLessThanOrEqual(12);
  });
});
