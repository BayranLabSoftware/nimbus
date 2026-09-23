import { describe, expect, it } from 'vitest';
import { swarmSpreadAtGround } from '../effects/atmosphericEntry.js';
import { DEFAULT_CRATER_FIELD } from '../events/impact/craterField.js';
import { simulateImpact as simulateModel, type ImpactScenarioInput } from '../simulate.js';
/** Rule 951: a record of an earlier round, read on the crater it was measured
 *  on — Eq. 21 at any speed; under the domain of rules 945 to 952 its slow
 *  swarms are not resolved. */
const simulateImpact = (input: ImpactScenarioInput): ReturnType<typeof simulateModel> =>
  simulateModel({ ...input, craterDomain: 'legacy' });
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';
import { CRATER_FIELD_LARGEST_FRAGMENT } from './craterFieldRules.js';
import { eiepRowInput, simulateEiepRow } from './eiepComparison.js';
import { EIEP_GRID } from './eiepGrid.js';

/**
 * Rules 838 to 845 (B-123): the candidate, verified before any score is
 * computed — the swarm's spread against the program's own, the law doing
 * nothing unless asked, and doing only what rule 838 says when it is.
 */

// The case the program's page names a crater field for (rule 841).
const SCATTERED: ImpactScenarioInput = {
  impactorDiameter: m(100),
  impactorDensity: kgPerM3(1_500),
  impactVelocity: mps(12_000),
  impactAngle: degreesToRadians(deg(60)),
  targetDensity: kgPerM3(2_500),
};

// The two readings of the whole grid run the model 1 782 and 450 times: they
// hand the worker's event loop back every 25 rows, or a slow runner's worker
// misses its runner (the CI of d58bd77).
const breathe = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('rules 838 to 845: a scattered body digs a crater field', () => {
  it('spreads the swarm as the program does: every printed dispersion of the wide grid, on its equations', async () => {
    // Eq. 15* at the ground with Eq. 16*, on the program's own entry: the
    // minor axis of the ellipse it prints, within the interval its two printed
    // figures stand for.
    let read = 0;
    for (const [i, row] of EIEP_GRID.entries()) {
      if (i % 25 === 0) await breathe();
      const minor = row.fragmentEllipseM?.[1];
      if (row.error !== null || minor === undefined) continue;
      const r = simulateImpact({ ...eiepRowInput(row), entryEquations: 'program' });
      if (r.entry.regime !== 'PARTIAL_AIRBURST') continue;
      const spread = swarmSpreadAtGround({
        impactorDiameter: row.diameterM,
        impactorDensity: row.densityKgM3,
        impactAngle: (row.angleDeg * Math.PI) / 180,
        breakupAltitude: r.entry.breakupAltitude,
      }) as number;
      const half = 0.5 * 10 ** (Math.floor(Math.log10(minor)) - 1);
      expect(Math.abs(spread - minor), String(row.index)).toBeLessThanOrEqual(half * 1.000_001);
      read++;
    }
    expect(read).toBeGreaterThan(800);
  }, 120_000);

  it('does nothing when asked for a single crater (the default until rules 846 to 853)', () => {
    expect(DEFAULT_CRATER_FIELD).toBe('joined');
    const single = simulateImpact({ ...SCATTERED, craterField: 'single' });
    expect(single.crater.origin).toBe('impact');
  });

  it('under `field`, halves the scattered swarm’s crater and names it', () => {
    const single = simulateImpact({ ...SCATTERED, craterField: 'single' });
    const field = simulateImpact({ ...SCATTERED, craterField: 'field' });
    expect(field.crater.origin).toBe('craterField');
    expect(field.crater.transientDiameter as number).toBeCloseTo(
      (single.crater.transientDiameter as number) * CRATER_FIELD_LARGEST_FRAGMENT,
      9
    );
    expect(field.crater.finalDiameter as number).toBeLessThan(single.crater.finalDiameter);
    // The consequences are the whole swarm's.
    expect(field.impactor.kineticEnergy).toBe(single.impactor.kineticEnergy);
    expect(field.entry).toEqual(single.entry);
    expect(field.damage.overpressure1psi).toBe(single.damage.overpressure1psi);
    expect(field.seismic.magnitude).toBe(single.seismic.magnitude);
  });

  it('leaves a single crater where the swarm is narrower than it', () => {
    // The same body straight down: the program's own single crater (rule 840).
    const vertical = simulateImpact({
      ...SCATTERED,
      impactAngle: degreesToRadians(deg(90)),
      craterField: 'field',
    });
    expect(vertical.entry.regime).toBe('PARTIAL_AIRBURST');
    expect(vertical.crater.origin).toBe('impact');
  });

  it('does not reach the sea, nor an iron', async () => {
    const sea = simulateImpact({ ...SCATTERED, waterDepth: m(50), craterField: 'field' });
    expect(sea.crater.origin).not.toBe('craterField');
    for (const [i, row] of EIEP_GRID.entries()) {
      if (i % 25 === 0) await breathe();
      if (row.error !== null || row.densityKgM3 < 7_000) continue;
      const r = simulateEiepRow(row, { craterField: 'field' });
      expect(r.crater.origin, String(row.index)).not.toBe('craterField');
    }
  }, 60_000);

  it('is no longer read by the harness as a regime switch (rule 846 (iv))', async () => {
    const { HAZARDS } = await import('../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    const regime = impact?.regime;
    expect(regime).toBeDefined();
    if (regime === undefined) return;
    const field = simulateImpact({ ...SCATTERED, craterField: 'field' });
    const single = simulateImpact({ ...SCATTERED, craterField: 'single' });
    const json = (r: unknown): Record<string, unknown> =>
      JSON.parse(JSON.stringify(r)) as Record<string, unknown>;
    // Rule 838 added `|field` to the regime; rule 846 (iv) withdrew it.
    expect(regime(json(field))).toBe(regime(json(single)));
  });
});
