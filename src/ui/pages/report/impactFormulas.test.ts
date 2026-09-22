import { describe, expect, it } from 'vitest';
import itLocale from '../../../i18n/locales/it.json';
import { IMPACT_PRESETS, simulateImpact } from '../../../physics/simulate.js';
import { m } from '../../../physics/units.js';
import { METHODOLOGY_SECTIONS } from '../methodologyContent.js';
import { FORMULA_BY_ID, IMPACT_FORMULA_USES, impactFormulaBlocks } from './impactFormulas.js';

const italianFormulas = (
  itLocale as { methodologyFormula: Record<string, { name: string; formula: string }> }
).methodologyFormula;

/** The numbers of a formula in the order they are written, the decimal
 *  comma read as a point: a translation may change every word, not one of
 *  these. Digits in superscripts and subscripts are part of the symbols. */
function numbersOf(formula: string, decimalComma: boolean): string[] {
  const text = decimalComma ? formula.replace(/(\d),(\d)/g, '$1.$2') : formula;
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

describe('the formulas an impact runs (B-108)', () => {
  it('names every formula once, each one of the catalogue', () => {
    const ids = IMPACT_FORMULA_USES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(FORMULA_BY_ID.has(id), id).toBe(true);
  });

  it('takes from the explosions only the thresholds and the fire table it reads', () => {
    const explosion = METHODOLOGY_SECTIONS.find((s) => s.id === 'explosion');
    const fromExplosions = IMPACT_FORMULA_USES.map((f) => f.id).filter((id) =>
      explosion?.entries.some((e) => e.id === id)
    );
    expect(fromExplosions.sort()).toEqual(['blast-thresholds', 'firestorm']);
  });

  it('has every formula in Italian, with the same numbers in the same order', () => {
    for (const { id } of IMPACT_FORMULA_USES) {
      const english = FORMULA_BY_ID.get(id);
      const italian = italianFormulas[id];
      expect(italian, id).toBeDefined();
      if (english === undefined || italian === undefined) continue;
      expect(italian.name.length).toBeGreaterThan(0);
      expect(numbersOf(italian.formula, true), id).toEqual(numbersOf(english.formula, false));
      // No decimal point left between digits in the Italian: a table's
      // number ("Tabella 7.40") and a section's ("§2.127") excepted.
      const pointed = /\d\.\d/.exec(italian.formula.replace(/(Tabella|§)\s?\d+\.\d+/g, ''));
      expect(pointed, id).toBeNull();
    }
  });

  it('groups a run’s formulas under their sources, in the order of first use', () => {
    const none = { bathymetricTsunami: false, monteCarlo: false, predictiveBand: true };
    const blocks = impactFormulaBlocks(simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input), none);
    expect(blocks[0]?.citation.authors).toMatch(/^Collins, G\. S\., Melosh/);
    const citations = blocks.map((b) => b.citation);
    expect(new Set(citations).size).toBe(citations.length);
    const ids = blocks.flatMap((b) => b.entries.map((e) => e.id));
    expect(ids).toContain('toll-band');
    expect(ids).not.toContain('percentile-band');
    // A kilometre of stone in four kilometres of sea raises the wave.
    const ocean = impactFormulaBlocks(
      simulateImpact({
        ...IMPACT_PRESETS.CHICXULUB.input,
        impactorDiameter: m(1_000),
        waterDepth: m(4_000),
        meanOceanDepth: m(4_000),
      }),
      none
    );
    const waveIds = ocean.flatMap((b) => b.entries.map((e) => e.id));
    for (const id of [
      'impact-tsunami-cavity',
      'celerity',
      'synolakis-runup',
      'casualties-tsunami',
    ]) {
      expect(waveIds).toContain(id);
    }
  });
});
