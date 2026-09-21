import { describe, expect, it } from 'vitest';
import { groundFireballShare, type LowBurstCrater } from '../effects/atmosphericEntry.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { m } from '../units.js';
import { LOW_BURST_CRATER_HELD_OUT_SEED } from './lowBurstCraterRules.js';

/** Rules 756 to 763: a low airburst digs where its kept energy strikes the
 *  ground (B-097). */

type Result = ReturnType<typeof simulateImpact>;
const craterOf = (r: Result): number[] => [
  Number(r.crater.transientDiameter),
  Number(r.crater.finalDiameter),
  Number(r.damage.craterRim),
  Number(r.ejecta.blanketEdge1m),
];

/** B-097's body. */
const B097 = {
  impactorDiameter: 28.257487707727098,
  impactVelocity: 36782.142758369446,
  impactorDensity: 9746.603165986016,
  targetDensity: 1896.8349443748593,
  impactAngle: 0.8228827580155595,
} as unknown as ImpactScenarioInput;

const run = (input: ImpactScenarioInput, size: number, law: LowBurstCrater): Result =>
  simulateImpact({
    ...input,
    impactorDiameter: m(Number(input.impactorDiameter) * size),
    lowBurstCrater: law,
  });

/** Bodies of every entry regime the form draws, the presets, and B-097's
 *  body as its burst climbs from the ground past its fireball. */
const BODIES: ImpactScenarioInput[] = [
  ...Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput),
  ...[0.9, 0.95, 0.97, 0.98, 0.99, 0.995, 1, 1.01].map((size) => ({
    ...B097,
    impactorDiameter: m(Number(B097.impactorDiameter) * size),
  })),
  ...[10, 25, 40, 70, 120, 400].flatMap((d) =>
    [12_000, 25_000, 50_000].flatMap((v) =>
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

describe('rules 756 to 763: a low airburst digs where its kept energy strikes the ground', () => {
  it('reads its unseen seed from the rules', () => {
    expect(LOW_BURST_CRATER_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-crater');
  });

  it('(a) moves no crater but a complete airburst’s below its fireball', () => {
    let moved = 0;
    for (const input of BODIES) {
      const none = run(input, 1, 'none');
      const share = run(input, 1, 'share');
      const v0 = Number(input.impactVelocity);
      const kept =
        none.entry.regime === 'COMPLETE_AIRBURST'
          ? Number(none.impactor.kineticEnergy) * Math.min(1, (none.entry.endVelocity / v0) ** 2)
          : 0;
      const below = kept > 0 && groundFireballShare(none.entry.burstAltitude, kept) > 0;
      const iron = Number(input.impactorDensity) >= 6_000 && Number(input.impactorDiameter) < 20;
      if (!below || iron) {
        expect(craterOf(share)).toEqual(craterOf(none));
        // A burst at or above its fireball digs nothing.
        if (none.entry.regime === 'COMPLETE_AIRBURST' && !iron) {
          expect(Number(share.crater.finalDiameter)).toBe(0);
        }
      } else {
        moved += 1;
        expect(Number(share.crater.finalDiameter)).toBeGreaterThan(0);
      }
    }
    expect(moved).toBeGreaterThan(0);
  });

  it('(a) keeps B-097’s crater across its switch, and grows it in below the fireball', () => {
    let below = 1;
    let above = 1.01;
    expect(run(B097, below, 'share').entry.regime).toBe('COMPLETE_AIRBURST');
    expect(run(B097, above, 'share').entry.regime).not.toBe('COMPLETE_AIRBURST');
    for (let n = 0; n < 60; n++) {
      const mid = (below + above) / 2;
      if (run(B097, mid, 'share').entry.regime === 'COMPLETE_AIRBURST') below = mid;
      else above = mid;
    }
    const before = Number(run(B097, below, 'share').crater.finalDiameter);
    const after = Number(run(B097, above, 'share').crater.finalDiameter);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(1e-6 * after);
    // The law before: nothing, then the whole crater.
    expect(Number(run(B097, below, 'none').crater.finalDiameter)).toBe(0);
    expect(after).toBeCloseTo(1_183.5, 0);
    // Higher up, less; above its fireball, none.
    expect(Number(run(B097, 0.99, 'share').crater.finalDiameter)).toBeLessThan(after);
    expect(Number(run(B097, 0.95, 'share').crater.finalDiameter)).toBe(0);
  });

  describe('(a) the harness reads the birth as a contour’s, and nothing else', () => {
    /** The impact hazard of the sweep under one law. */
    const sweepUnder = async (law: LowBurstCrater) => {
      const { HAZARDS, checkScenario } = await import('../../../scripts/benchmark/invariants.js');
      const impact = HAZARDS.find((h) => h.name === 'impact');
      if (impact === undefined) throw new Error('no impact hazard');
      const hazard = {
        ...impact,
        run: (input: Record<string, unknown>) =>
          simulateImpact({ ...input, lowBurstCrater: law } as never) as unknown as Record<
            string,
            unknown
          >,
      };
      return (size: number, body: ImpactScenarioInput = B097) =>
        checkScenario(hazard, {
          ...body,
          impactorDiameter: Number(body.impactorDiameter) * size,
        });
    };
    const craterKeys = (found: { key: string; detail: string }[]) =>
      found.filter((f) => f.key.endsWith(': crater.finalDiameter'));

    /** Where B-097's crater is born under `share`, as a share of its size. */
    const birth = (): number => {
      let none = 0.9;
      let some = 0.99;
      for (let n = 0; n < 80; n++) {
        const mid = (none + some) / 2;
        if (Number(run(B097, mid, 'share').crater.finalDiameter) > 0) some = mid;
        else none = mid;
      }
      return some;
    };

    it('reads B-097’s birth under `share` only as it was', async () => {
      const found = craterKeys((await sweepUnder('share'))(birth() / 1.0005));
      expect(found.map((f) => f.key)).toEqual(['continuous, as it was: crater.finalDiameter']);
    }, 30_000);

    it('prints the step just past that birth as steep', async () => {
      const found = craterKeys((await sweepUnder('share'))(birth() * 1.0002));
      expect(found.map((f) => f.key)).toEqual([
        'continuous, as it was: crater.finalDiameter',
        'steep, not a jump (crater): crater.finalDiameter',
      ]);
    }, 30_000);

    it('counts B-097’s switch under `none` as a jump at a regime switch, and not under `share`', async () => {
      let below = 1;
      let above = 1.01;
      for (let n = 0; n < 80; n++) {
        const mid = (below + above) / 2;
        if (run(B097, mid, 'none').entry.regime === 'COMPLETE_AIRBURST') below = mid;
        else above = mid;
      }
      const none = craterKeys((await sweepUnder('none'))(above / 1.0005));
      const counted = none.find((f) => f.key === 'continuous: crater.finalDiameter');
      expect(counted?.detail).toMatch(/\(regime switch\), a jump at ×/);
      const share = craterKeys((await sweepUnder('share'))(above / 1.0005));
      expect(share).toEqual([]);
    }, 30_000);

    it('counts B-098’s cut at 20 m as a jump under both laws', async () => {
      const B098 = {
        impactorDiameter: 20 / 1.0005,
        impactVelocity: 39435.23839209229,
        impactorDensity: 9776.086683617905,
        targetDensity: 4006.4838798716664,
        impactAngle: 1.2670616969611002,
      } as unknown as ImpactScenarioInput;
      for (const law of ['none', 'share'] as const) {
        const found = craterKeys((await sweepUnder(law))(1, B098));
        const counted = found.find((f) => f.key === 'continuous: crater.finalDiameter');
        expect(counted?.detail, law).toMatch(/^190\.\d+ → 0\.0+, a jump at ×1\.0005/);
      }
    }, 30_000);
  });

  it('(c) moves no preset', () => {
    for (const preset of Object.values(IMPACT_PRESETS)) {
      const input = preset.input as ImpactScenarioInput;
      expect(craterOf(run(input, 1, 'share'))).toEqual(craterOf(run(input, 1, 'none')));
    }
  });
});
