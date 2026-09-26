import { describe, expect, it } from 'vitest';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { ATAP_AGAIN_HELD_OUT_SEED } from './atapRadiationAgainRules.js';

/**
 * Hands the worker's event loop back between heavy steps. A synchronous test
 * that runs past a minute on a slow CI runner keeps vitest's worker from
 * answering its own runner, which reports "Timeout calling onTaskUpdate" as
 * an unhandled error and fails the run with every test passed (the CI of
 * da51c86, 23 September 2026).
 */
const breathe = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

/** Rules 780 to 787: an airburst's flash from the field's model of it, asked
 *  again (B-095). */

type Result = ReturnType<typeof simulateImpact>;
const RINGS = (r: Result): number[] => [
  Number(r.damage.thirdDegreeBurn),
  Number(r.damage.secondDegreeBurn),
  Number(r.firestorm.ignitionRadius),
  Number(r.firestorm.sustainRadius),
];
const atap = (input: Record<string, unknown>): Result =>
  simulateImpact({ ...input, airburstRadiation: 'atap' } as unknown as ImpactScenarioInput);

/** Rules 772 to 779's two own-seed scenarios the watchdog stopped. */
const STOPPED = [
  {
    impactAngle: 0.726963466145058,
    impactAzimuthDeg: 118.82033077557571,
    impactVelocity: 17482.55038820207,
    impactorDensity: 6511.305416119285,
    impactorDiameter: 47.35992566134249,
    targetDensity: 2552.866343408823,
  },
  {
    impactAngle: 1.0279763229743375,
    impactAzimuthDeg: 268.194623490097,
    impactVelocity: 14653.696974506602,
    impactorDensity: 4816.325002349913,
    impactorDiameter: 48.016639130815854,
    targetDensity: 3811.047882772982,
    waterDepth: 2231.67745103408,
  },
];

describe('rules 780 to 787: an airburst’s flash from the field’s model of it, asked again', () => {
  it('reads its unseen seed from the rules', () => {
    expect(ATAP_AGAIN_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-atap-2');
  });

  it('(a) draws no burn or fire ring smaller as a body grows, at shallow entries too', async () => {
    for (const speed of [12, 17, 25])
      for (const angleDeg of [8, 20, 45])
        for (const density of [3_000, 7_000]) {
          await breathe();
          let previous: number[] | null = null;
          for (let d = 10; d < 260; d *= 1.03) {
            const rings = RINGS(
              atap({
                impactorDiameter: d,
                impactVelocity: speed * 1_000,
                impactorDensity: density,
                impactorStrength: 2e6,
                targetDensity: 2_500,
                impactAngle: (angleDeg * Math.PI) / 180,
              })
            );
            if (previous !== null) {
              rings.forEach((ring, i) => {
                expect(
                  ring,
                  `${String(speed)} km/s, ${String(angleDeg)}°, ${String(density)} kg/m³, ${d.toFixed(1)} m`
                ).toBeGreaterThanOrEqual((previous?.[i] ?? 0) * (1 - 1e-9) - 1e-9);
              });
            }
            previous = rings;
          }
        }
  }, 300_000);

  it('(a) grows the rings of the body whose footprint lay far from its burst', () => {
    const body = {
      impactAngle: 0.30638545297756964,
      impactVelocity: 14303.967189742252,
      impactorDensity: 6956.186719005927,
      impactorDiameter: 56.51911497706393,
      targetDensity: 1592.4036726355553,
    };
    const before = RINGS(atap(body));
    const after = RINGS(atap({ ...body, impactorDiameter: body.impactorDiameter * 1.01 }));
    after.forEach((ring, i) => {
      expect(ring).toBeGreaterThanOrEqual(before[i] ?? 0);
    });
  });

  it('(a) reads a blast ring’s cause from runs without the integral as with it', async () => {
    const { HAZARDS, checkScenario } = await import('../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    if (impact === undefined) throw new Error('no impact hazard');
    const run = (input: Record<string, unknown>) =>
      atap(input) as unknown as Record<string, unknown>;
    for (const scenario of STOPPED) {
      await breathe();
      const lean = { ...impact, run };
      // The causes read from the full run, as rules 772 to 779 read them.
      const full = { ...impact, run, runSource: run };
      const started = performance.now();
      const read = checkScenario(lean, scenario);
      expect(performance.now() - started).toBeLessThan(2_000);
      await breathe();
      expect(read).toEqual(checkScenario(full, scenario));
    }
  }, 240_000);
});
