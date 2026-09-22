import { describe, expect, it } from 'vitest';
import {
  ATAP_PATH_STEP,
  ATAP_RADIUS_CAP,
  ATAP_TOP_KM,
  atapFlux,
  radiantHeatField,
  type AirburstRadiation,
} from '../effects/atapRadiation.js';
import { atmosphericEntry, entryPath } from '../effects/atmosphericEntry.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { ATAP_HELD_OUT_SEED } from './atapRadiationRules.js';

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

/** Rules 772 to 779: an airburst's flash from the field's model of it (B-095). */

type Result = ReturnType<typeof simulateImpact>;
const run = (input: ImpactScenarioInput, law: AirburstRadiation): Result =>
  simulateImpact({ ...input, airburstRadiation: law });
const RINGS = (r: Result): number[] => [
  Number(r.damage.thirdDegreeBurn),
  Number(r.damage.secondDegreeBurn),
  Number(r.firestorm.ignitionRadius),
  Number(r.firestorm.sustainRadius),
];
const body = (
  diameter: number,
  speedKmS: number,
  angleDeg: number,
  density = 3_000,
  strength?: number
): ImpactScenarioInput =>
  ({
    impactorDiameter: diameter,
    impactVelocity: speedKmS * 1_000,
    impactorDensity: density,
    targetDensity: 2_500,
    impactAngle: (angleDeg * Math.PI) / 180,
    ...(strength === undefined ? {} : { impactorStrength: strength }),
  }) as unknown as ImpactScenarioInput;

/** Johnston & Stern's Figs. 15 to 17: the correlation's lines, read off the
 *  figures at L = 10 km — [V km/s, H km, R m, ϕ degrees, W/cm²]. */
const FIGURE_POINTS: readonly (readonly [number, number, number, number, number])[] = [
  [15, 10, 100, 120, 322],
  [15, 10, 100, 60, 130],
  [15, 20, 100, 120, 88],
  [15, 20, 100, 60, 71],
  [10, 10, 100, 120, 40],
  [10, 10, 100, 60, 27],
  [10, 20, 100, 60, 9],
  [17, 10, 140, 60, 338],
  [15, 10, 140, 60, 237],
  [17, 10, 100, 60, 185],
  [15, 10, 100, 60, 132],
  [10, 10, 140, 60, 47],
  [8, 10, 140, 60, 12],
  [17, 20, 100, 60, 111],
  [17, 30, 100, 60, 66],
  [15, 20, 100, 60, 62],
  [15, 30, 100, 60, 32],
  [10, 20, 100, 60, 8],
  [17, 10, 25, 60, 17],
  [17, 20, 25, 60, 7],
];

/** The length (km) along the path over which the heat load reaches 40 J/cm²,
 *  for Johnston & Stern's body: 3 000 kg/m³, 2 MPa. */
const chargedLength = (speedKmS: number, angleDeg: number, radius: number): number => {
  const diameter = 2 * radius;
  const angle = (angleDeg * Math.PI) / 180;
  const entry = atmosphericEntry(
    diameter as never,
    (speedKmS * 1_000) as never,
    2e6 as never,
    3_000 as never,
    undefined,
    angle as never
  );
  const path = entryPath(
    diameter as never,
    (speedKmS * 1_000) as never,
    2e6 as never,
    3_000 as never,
    angle as never,
    { top: ATAP_TOP_KM * 1_000, step: ATAP_PATH_STEP, radiusCap: ATAP_RADIUS_CAP }
  );
  const field = radiantHeatField(
    path,
    angle,
    entry.regime === 'COMPLETE_AIRBURST' ? Number(entry.burstAltitude) : 0
  );
  if (field === null) return 0;
  let length = 0;
  for (let x = -100; x <= 40; x += 0.1) if (field(x, 0) >= 4e5) length += 0.1;
  return length;
};

describe('rules 772 to 779: an airburst’s flash from the field’s model of it', () => {
  it('reads its unseen seed from the rules', () => {
    expect(ATAP_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-atap');
  });

  it('(a) transcribes Eq. (9): within 10 % of the lines of Figs. 15 to 17', () => {
    for (const [v, h, r, phi, read] of FIGURE_POINTS) {
      const q = atapFlux(v, h, r, phi, 10);
      expect(
        Math.abs(q / read - 1),
        `${String(v)} km/s, ${String(h)} km, ${String(r)} m, ${String(phi)}°`
      ).toBeLessThanOrEqual(0.1);
    }
  });

  it('(a) gives Johnston & Stern’s optimal radii of Fig. 24 within 12 %, inside 30 to 45 m', () => {
    const theirs: Record<string, number> = {
      '30,15': 40.5,
      '30,17': 36.8,
      '30,19': 33.5,
      '45,15': 40.5,
      '45,17': 37.5,
      '45,19': 35.0,
    };
    for (const [key, radius] of Object.entries(theirs)) {
      const [angle, speed] = key.split(',').map(Number) as [number, number];
      let short = 20;
      let long = 70;
      expect(chargedLength(speed, angle, long)).toBeGreaterThanOrEqual(20);
      for (let n = 0; n < 12; n++) {
        const mid = (short + long) / 2;
        if (chargedLength(speed, angle, mid) >= 20) long = mid;
        else short = mid;
      }
      expect(Math.abs(long / radius - 1), key).toBeLessThanOrEqual(0.12);
      expect(long, key).toBeGreaterThanOrEqual(30);
      expect(long, key).toBeLessThanOrEqual(45);
    }
  }, 120_000);

  it('(a) is never fainter than the luminous efficiency’s flash', () => {
    for (const d of [20, 45, 60, 90, 150, 400])
      for (const v of [12, 17, 25])
        for (const angle of [20, 45, 80]) {
          const input = body(d, v, angle);
          const atap = run(input, 'atap');
          const today = run(input, 'efficiency');
          RINGS(atap).forEach((ring, i) => {
            expect(ring).toBeGreaterThanOrEqual((RINGS(today)[i] ?? 0) * (1 - 1e-9));
          });
          for (const [key, value] of Object.entries(today.field)) {
            if (!key.startsWith('thermalExposure')) continue;
            expect(atap.field[key]).toBeGreaterThanOrEqual(value * (1 - 1e-9));
          }
        }
  }, 120_000);

  it('(a) keeps every number of a body none of whose path is read', () => {
    // Slower than 6 km/s all the way down.
    const slow = body(80, 5.5, 45);
    const atap = run(slow, 'atap');
    expect(atap.radiantHeat).toBeNull();
    const today = run(slow, 'efficiency');
    expect(RINGS(atap)).toEqual(RINGS(today));
    expect(atap.field).toEqual(today.field);
    expect(atap.entry.flashBurnRadii).toEqual(today.entry.flashBurnRadii);
  });

  it('(a) draws no burn or fire ring smaller as a body grows through the fitted range’s edges', async () => {
    for (const v of [12, 17, 22])
      for (const angle of [30, 60])
        for (const strength of [3e5, 2e6]) {
          await breathe();
          let previous: number[] | null = null;
          for (let d = 30; d < 260; d *= 1.02) {
            const rings = RINGS(run(body(d, v, angle, 3_000, strength), 'atap'));
            if (previous !== null) {
              rings.forEach((ring, i) => {
                expect(
                  ring,
                  `${String(v)} km/s, ${String(angle)}°, ${String(strength)} Pa, ${d.toFixed(1)} m`
                ).toBeGreaterThanOrEqual((previous?.[i] ?? 0) * (1 - 1e-9) - 1e-9);
              });
            }
            previous = rings;
          }
        }
  }, 240_000);

  it('(c) moves the presets rule 775 lists, and no other', () => {
    const moved = Object.entries(IMPACT_PRESETS)
      .filter(([, preset]) => {
        const input = preset.input as ImpactScenarioInput;
        const a = run(input, 'atap');
        const b = run(input, 'efficiency');
        return (
          JSON.stringify([RINGS(a), a.field, a.entry.flashBurnRadii]) !==
          JSON.stringify([RINGS(b), b.field, b.entry.flashBurnRadii])
        );
      })
      .map(([id]) => id)
      .sort();
    expect(moved).toEqual(['CHELYABINSK', 'METEOR_CRATER', 'SIKHOTE_ALIN_1947', 'TUNGUSKA']);
    // Tunguska's preset still chars nothing, and draws a first-degree flash.
    const tunguska = run(IMPACT_PRESETS.TUNGUSKA.input, 'atap');
    expect(Number(tunguska.damage.thirdDegreeBurn)).toBe(0);
    expect(Number(tunguska.entry.flashBurnRadii.firstDegree)).toBeGreaterThan(10_000);
  });
});
