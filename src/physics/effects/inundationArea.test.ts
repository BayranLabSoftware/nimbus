import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  INUNDATION_COEFFICIENTS,
  inundatedCrossSection,
  inundatedPlanimetricArea,
  swathWidth,
} from './inundationArea.js';
import { laharRunout } from '../events/volcano/extendedEffects.js';

/**
 * The area laws, held to the report they were transcribed from and to the
 * events behind it.
 *
 * Griswold & Iverson (2008), USGS SIR 2007-5276, Table 6. The coefficients are
 * not ours and nothing here is fitted: what these checks do is refuse to let a
 * transcription drift, and keep the one number that made the round necessary —
 * that a disc of a lahar's runout claims two hundred times the ground the law
 * gives — where a reader will trip over it.
 */

const SET = fileURLToPath(
  new URL('../../../benchmark/flows/griswold-appendix-a.json', import.meta.url)
);
interface Row {
  kind: 'DF' | 'RA';
  ref: number;
  V: number | null;
  A: number | null;
  B: number | null;
}
const rows = JSON.parse(readFileSync(SET, 'utf8')) as Row[];

/** log10 of the ratio between what an event did and what the law says. */
function residuals(kind: 'DF' | 'RA', field: 'A' | 'B'): number[] {
  const flow = kind === 'DF' ? 'debrisFlow' : 'rockAvalanche';
  const alpha =
    field === 'A'
      ? INUNDATION_COEFFICIENTS[flow].crossSection
      : INUNDATION_COEFFICIENTS[flow].planimetric;
  return rows
    .filter((r) => r.kind === kind && r.V !== null && r[field] !== null)
    .map((r) => Math.log10(r[field]! / (alpha * Math.cbrt(r.V! ** 2))));
}

describe('how much ground a flow covers', () => {
  it('carries the report’s own coefficients, and a lahar covers ten times a rock avalanche', () => {
    expect(INUNDATION_COEFFICIENTS.lahar).toEqual({ crossSection: 0.05, planimetric: 200 });
    expect(INUNDATION_COEFFICIENTS.debrisFlow).toEqual({ crossSection: 0.1, planimetric: 20 });
    expect(INUNDATION_COEFFICIENTS.rockAvalanche).toEqual({ crossSection: 0.2, planimetric: 20 });
    const V = 5e7;
    expect(
      inundatedPlanimetricArea(V, 'lahar') / inundatedPlanimetricArea(V, 'rockAvalanche')
    ).toBe(10);
  });

  it('is the two-thirds power, so eight times the volume is four times the ground', () => {
    const small = inundatedPlanimetricArea(1e6, 'lahar');
    expect(inundatedPlanimetricArea(8e6, 'lahar') / small).toBeCloseTo(4, 10);
    expect(inundatedCrossSection(8e6, 'lahar') / inundatedCrossSection(1e6, 'lahar')).toBeCloseTo(
      4,
      10
    );
  });

  it('gives nothing for a flow that is not there', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(inundatedPlanimetricArea(bad, 'lahar')).toBe(0);
      expect(inundatedCrossSection(bad, 'lahar')).toBe(0);
    }
    expect(swathWidth(1e7, 0, 'lahar')).toBe(0);
  });

  it('matches the 207 events it was fitted on, with the scatter the round declared', () => {
    // The bias is the geometric mean of event over law: a transcribed
    // coefficient sitting on its own data reads one.
    for (const [kind, field, minCount] of [
      ['DF', 'A', 50],
      ['DF', 'B', 44],
      ['RA', 'B', 142],
    ] as const) {
      const rs = residuals(kind, field);
      expect(rs.length, `${kind} ${field}`).toBe(minCount);
      const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
      const sd = Math.sqrt(rs.reduce((a, b) => a + (b - mean) ** 2, 0) / (rs.length - 1));
      expect(Math.abs(10 ** mean - 1), `${kind} ${field} bias`).toBeLessThan(0.15);
      // Rule 205: σ(log10) between 0.3 and 0.45, a factor of about two and a
      // half at one sigma. In sample, and the round says so.
      expect(sd, `${kind} ${field} sigma`).toBeGreaterThan(0.3);
      expect(sd, `${kind} ${field} sigma`).toBeLessThan(0.45);
    }
  });

  it('is why a disc of the runout is the wrong picture', () => {
    // The number that made the round: a lahar of 5 × 10⁷ m³ runs 42.1 km by
    // the project's recast, and a disc of that radius covers two hundred times
    // the ground the field's own relation gives it.
    const V = 5e7;
    const runoutM = laharRunout(V) as number;
    const disc = Math.PI * runoutM * runoutM;
    const law = inundatedPlanimetricArea(V, 'lahar');
    expect(runoutM / 1_000).toBeCloseTo(42.1, 1);
    expect(law / 1e6).toBeCloseTo(27.1, 1);
    expect(disc / law).toBeGreaterThan(150);
    // And the two together give the swath: a ribbon a few hundred metres wide.
    expect(swathWidth(V, runoutM, 'lahar')).toBeCloseTo(law / runoutM, 6);
    expect(swathWidth(V, runoutM, 'lahar')).toBeGreaterThan(500);
    expect(swathWidth(V, runoutM, 'lahar')).toBeLessThan(800);
  });
});
