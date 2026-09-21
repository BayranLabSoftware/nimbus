import { describe, expect, it } from 'vitest';
import {
  airburstMagnitude,
  DEFAULT_AIRBURST_SEISMIC,
  harkriderMs,
} from '../events/impact/airburstSeismic.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { m } from '../units.js';
import { AIRBURST_SEISMIC_HELD_OUT_SEED } from './airburstSeismicRules.js';
import { explainMagnitudeFall } from './magnitudeSource.js';

/** Rules 730 to 738: an airburst's seismic magnitude from the air that
 *  carries it (B-092). */

type Result = ReturnType<typeof simulateImpact>;
const seismicOf = (r: Result) => r.seismic;

/** Bodies of every entry regime the form draws. */
const BODIES: ImpactScenarioInput[] = [
  ...Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput),
  ...[3, 8, 20, 45, 90, 180, 400, 1_500].flatMap((d) =>
    [11_000, 20_000, 45_000].flatMap((v) =>
      [1_500, 3_000, 7_800].map(
        (rho) =>
          ({
            impactorDiameter: d,
            impactVelocity: v,
            impactorDensity: rho,
            targetDensity: 2_500,
            impactAngle: Math.PI / 4,
          }) as unknown as ImpactScenarioInput
      )
    )
  ),
];

describe('rules 730 to 738: an airburst’s magnitude from the air that carries it', () => {
  it('reads its unseen seed from the rules, and keeps the program’s law by default', () => {
    expect(AIRBURST_SEISMIC_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-seismic');
    expect(DEFAULT_AIRBURST_SEISMIC).toBe('program');
  });

  it('(a) moves nothing of a body that is not a complete airburst', () => {
    let checked = 0;
    for (const input of BODIES) {
      const program = simulateImpact({ ...input, airburstSeismic: 'program' });
      if (program.entry.regime === 'COMPLETE_AIRBURST') continue;
      const candidate = simulateImpact({ ...input, airburstSeismic: 'harkrider' });
      expect(seismicOf(candidate)).toEqual(seismicOf(program));
      checked += 1;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('(a) gives a complete airburst the larger term, or none', () => {
    let air = 0;
    let none = 0;
    for (const input of BODIES) {
      const r = simulateImpact({ ...input, airburstSeismic: 'harkrider' });
      if (r.entry.regime !== 'COMPLETE_AIRBURST') continue;
      const v0 = Number(input.impactVelocity);
      const kept = Number(r.impactor.kineticEnergy) * Math.min(1, (r.entry.endVelocity / v0) ** 2);
      const expected = airburstMagnitude({
        blastYieldKt: r.entry.blastYieldMegatons * 1_000,
        burstAltitude: r.entry.burstAltitude,
        keptEnergy: kept,
        overWater: false,
      });
      expect(r.seismic.magnitude).toBe(expected?.magnitude ?? null);
      expect(r.seismic.magnitudeSource).toBe(expected?.term ?? null);
      if (expected === null) {
        none += 1;
        expect(r.seismic.magnitudeRange).toBeNull();
        expect(Number(r.seismic.liquefactionRadius)).toBe(0);
      } else if (expected.term === 'air') {
        air += 1;
        expect(r.seismic.magnitude).toBe(
          harkriderMs(r.entry.blastYieldMegatons * 1_000, r.entry.burstAltitude / 1_000)
        );
      }
    }
    expect(air).toBeGreaterThan(3);
    expect(none).toBeGreaterThan(0);
  });

  it('(a) is continuous where a complete airburst becomes a partial one', () => {
    // B-093's body, which rules 714 to 721 tapered at the same switch.
    const body = {
      impactorDiameter: 115.54168333676154,
      impactVelocity: 71577.55170948803,
      impactorDensity: 8060.689800418913,
      targetDensity: 1841.2443483248353,
      impactAngle: 0.28660277114121135,
      waterDepth: 35.313907257168985,
    } as unknown as ImpactScenarioInput;
    const run = (k: number): Result =>
      simulateImpact({
        ...body,
        impactorDiameter: m(Number(body.impactorDiameter) * k),
        airburstSeismic: 'harkrider',
      });
    let below = 1;
    let above = 1.01;
    expect(run(below).entry.regime).toBe('COMPLETE_AIRBURST');
    expect(run(above).entry.regime).not.toBe('COMPLETE_AIRBURST');
    for (let n = 0; n < 60; n++) {
      const mid = (below + above) / 2;
      if (run(mid).entry.regime === 'COMPLETE_AIRBURST') below = mid;
      else above = mid;
    }
    const before = run(below).seismic.magnitude ?? Number.NaN;
    const after = run(above).seismic.magnitude ?? Number.NaN;
    expect(Math.abs(after - before)).toBeLessThan(1e-6);
  });

  it('(c) moves the presets as rule 733 lists them', () => {
    const at = (id: keyof typeof IMPACT_PRESETS): number | null =>
      simulateImpact({ ...IMPACT_PRESETS[id].input, airburstSeismic: 'harkrider' }).seismic
        .magnitude;
    expect(at('TUNGUSKA')).toBeCloseTo(4.31, 2);
    expect(at('CHELYABINSK')).toBeCloseTo(4.0, 2);
    expect(at('SIKHOTE_ALIN_1947')).toBeCloseTo(2.48, 2);
    for (const id of [
      'CHICXULUB',
      'CHICXULUB_OCEAN',
      'METEOR_CRATER',
      'POPIGAI',
      'BOLTYSH',
    ] as const) {
      expect(at(id)).toBe(simulateImpact(IMPACT_PRESETS[id].input).seismic.magnitude);
    }
  });
});

describe('rule 735: what makes an airburst’s magnitude fall', () => {
  const KT = 4.184e12;
  const source = (kt: number, km: number) => ({ energy: kt * KT, altitude: km * 1_000 });
  const along = (from: ReturnType<typeof source>, to: ReturnType<typeof source>) => (k: number) => {
    const f = (k - 1) / 0.01;
    return {
      energy: from.energy + f * (to.energy - from.energy),
      altitude: from.altitude + f * (to.altitude - from.altitude),
    };
  };

  it('names the altitude where the held altitude keeps the term', () => {
    // 1 MT from 18.6 km down to 12 km: the table is lower at 12 km than at 18.6.
    const before = source(1_000, 18.6);
    const after = source(1_010, 12);
    const m0 = harkriderMs(1_000, 18.6) ?? NaN;
    expect(harkriderMs(1_010, 12) ?? NaN).toBeLessThan(m0);
    expect(explainMagnitudeFall(m0, before, after, 'continental', along(before, after), 1.01)).toBe(
      'the source altitude'
    );
  });

  it('names the table where it falls with the yield at a held altitude', () => {
    const before = source(1_800, 4.6);
    const after = source(1_860, 4.58);
    const m0 = harkriderMs(1_800, 4.6) ?? NaN;
    expect(explainMagnitudeFall(m0, before, after, 'continental', along(before, after), 1.01)).toBe(
      "the table's period"
    );
  });

  it('names nothing where the magnitude is not the air’s, or the source jumps', () => {
    const before = source(1_000, 18.6);
    const after = source(1_010, 12);
    expect(
      explainMagnitudeFall(3.0, before, after, 'continental', along(before, after), 1.01)
    ).toBe(null);
    const jumping = (k: number) => (k < 1.005 ? before : after);
    expect(
      explainMagnitudeFall(
        harkriderMs(1_000, 18.6) ?? NaN,
        before,
        after,
        'continental',
        jumping,
        1.01
      )
    ).toBeNull();
  });
});
