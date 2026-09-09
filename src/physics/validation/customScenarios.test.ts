import { describe, expect, it } from 'vitest';
import { simulateExplosion } from '../events/explosion/simulate.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { simulateVolcano } from '../events/volcano/simulate.js';
import { simulateLandslide } from '../events/landslide/simulate.js';
import { simulateImpact } from '../simulate.js';
import { computeSeaCoupling } from '../effects/seaCoupling.js';
import { dispersionDecay, dispersionParameter } from '../tsunami/dispersion.js';
import { directivityFactor } from '../tsunami/directivity.js';
import { waveCouplingEfficiency } from '../events/explosion/underwaterBurst.js';
import { blastCasualtyPlan, estimateCasualties, thermalHorizonRadius } from '../casualties.js';
import { J, kgPerM3, m, mps, rad } from '../units.js';

/**
 * The eleven events with a recorded outcome pin eleven points. A user
 * with the custom fields open covers the whole space, and most of what
 * they can ask for has never happened: a two-hundred-kilotonne charge
 * a kilometre under the Adriatic, a thirty-kilometre stone at eleven
 * kilometres a second, a magnitude nine and a half under Lisbon.
 *
 * These tests do not check that such answers are right — nothing can,
 * because nobody has measured them. They check that the laws behave
 * like laws across the whole range: finite everywhere, monotone where
 * physics says they must be, continuous across the boundaries the code
 * draws for its own convenience, and bounded by what is physically
 * possible. A model that satisfies all four can be wrong; one that
 * fails any of them is broken, and only a sweep finds out.
 */

const finite = (x: unknown): boolean => typeof x === 'number' && Number.isFinite(x);

/** Every number anywhere in a result, however deep. */
function numbersIn(value: unknown, depth = 0): number[] {
  if (depth > 6) return [];
  if (typeof value === 'number') return [value];
  if (Array.isArray(value)) return value.flatMap((v) => numbersIn(v, depth + 1));
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap((v) => numbersIn(v, depth + 1));
  }
  return [];
}

describe('a custom scenario produces numbers, never NaN', () => {
  it('explosions from a tonne to a gigatonne, in the air, on the ground and under the sea', () => {
    for (const mt of [1e-6, 1e-4, 0.001, 0.02, 1, 50, 1_000]) {
      for (const hob of [-5_000, -400, -40, 0, 30, 500, 30_000]) {
        for (const water of [0, 15, 200, 4_000, 11_000]) {
          const r = simulateExplosion({
            yieldMegatons: mt,
            groundType: 'WET_SOIL',
            heightOfBurst: m(hob),
            waterDepth: m(water),
          });
          const bad = numbersIn(r).filter((n) => !Number.isFinite(n));
          expect(
            bad,
            `Mt=${mt.toString()} hob=${hob.toString()} water=${water.toString()}`
          ).toHaveLength(0);
        }
      }
    }
  });

  it('impactors from a metre to a hundred kilometres, at every angle', () => {
    for (const d of [1, 50, 1_000, 15_000, 100_000]) {
      for (const v of [11_000, 20_000, 72_000]) {
        for (const angleDeg of [5, 45, 90]) {
          const r = simulateImpact({
            impactorDiameter: m(d),
            impactVelocity: mps(v),
            impactorDensity: kgPerM3(3_000),
            targetDensity: kgPerM3(2_700),
            impactAngle: rad((angleDeg * Math.PI) / 180),
          });
          const bad = numbersIn(r).filter((n) => !Number.isFinite(n));
          expect(
            bad,
            `d=${d.toString()} v=${v.toString()} angle=${angleDeg.toString()}`
          ).toHaveLength(0);
        }
      }
    }
  });

  it('earthquakes from four to ten, shallow and deep, on and off a subduction interface', () => {
    for (const magnitude of [4, 5.5, 7, 8.5, 9.5, 10]) {
      for (const depth of [1_000, 30_000, 300_000]) {
        for (const sub of [true, false]) {
          const r = simulateEarthquake({
            magnitude,
            depth: m(depth),
            faultType: 'reverse',
            subductionInterface: sub,
          });
          const bad = numbersIn(r).filter((n) => !Number.isFinite(n));
          expect(
            bad,
            `M=${magnitude.toString()} depth=${depth.toString()} sub=${String(sub)}`
          ).toHaveLength(0);
        }
      }
    }
  });
});

describe('a law stays a law across the whole range', () => {
  it('sea coupling never rises with distance, whatever the crater', () => {
    for (const rim of [0, 60, 1_000, 82_000]) {
      for (const ejecta of [0, 1_000, 1_800_000]) {
        let previous = Number.POSITIVE_INFINITY;
        for (let shore = 0; shore <= 3_000_000; shore += 25_000) {
          const f = computeSeaCoupling({
            shoreDistanceM: shore,
            craterRimRadiusM: rim,
            cavityAtFullCouplingM: 0,
            ejectaReachM: ejecta,
          }).fraction;
          expect(
            f,
            `rim=${rim.toString()} ejecta=${ejecta.toString()} shore=${shore.toString()}`
          ).toBeLessThanOrEqual(previous + 1e-12);
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThanOrEqual(1);
          previous = f;
        }
      }
    }
  });

  it('the burst curve has one maximum and no cliffs, from the air to the abyss', () => {
    const values: number[] = [];
    for (let lambda = -50; lambda <= 200; lambda += 0.25) {
      const e = waveCouplingEfficiency(lambda);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
      values.push(e);
    }
    // One rise and one fall: the sign of the difference changes once.
    let turns = 0;
    for (let i = 2; i < values.length; i++) {
      const a = (values[i - 1] ?? 0) - (values[i - 2] ?? 0);
      const b = (values[i] ?? 0) - (values[i - 1] ?? 0);
      if (a > 1e-12 && b < -1e-12) turns += 1;
    }
    expect(turns).toBeLessThanOrEqual(1);
  });

  it('dispersion and directivity stay between nothing and everything', () => {
    for (const r of [0, 1, 1e3, 1e6, 2e7]) {
      for (const h of [0, 1, 100, 11_000]) {
        for (const lam of [1, 1_000, 1e6]) {
          const f = dispersionDecay(
            dispersionParameter({ rangeM: r, depthM: h, wavelengthM: lam })
          );
          expect(finite(f)).toBe(true);
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThanOrEqual(1);
        }
      }
    }
    for (const L of [0, 1_000, 700_000, 5_000_000]) {
      for (let b = 0; b < 360; b += 7) {
        const f = directivityFactor({
          bearingDeg: b,
          strikeDeg: 200,
          ruptureLengthM: L,
          wavelengthM: 200_000,
        });
        expect(finite(f)).toBe(true);
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1);
      }
    }
  });

  it('the thermal horizon grows with the fireball and never passes the antipode', () => {
    let previous = 0;
    for (const rf of [1, 100, 10_000, 200_000, 5_000_000, 1e9]) {
      const d = thermalHorizonRadius(m(rf));
      expect(finite(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(previous);
      expect(d).toBeLessThanOrEqual(Math.PI * 6_371_000 + 1);
      previous = d;
    }
  });

  it('a bigger blast never kills fewer people in the same city', () => {
    const uniform = (radiusM: number): number => 3_000 * Math.PI * (radiusM / 1_000) ** 2;
    let previous = 0;
    for (const kt of [1, 15, 100, 1_000, 15_000, 100_000]) {
      const energy = J(kt * 4.184e12);
      const plan = blastCasualtyPlan({
        blastEnergy: energy,
        overpressure5psiRadius: m(1_600 * Math.cbrt(kt / 15)),
        overpressure1psiRadius: m(4_500 * Math.cbrt(kt / 15)),
      });
      if (plan === null) continue;
      const deaths = estimateCasualties(
        plan,
        plan.bands.map((b) => uniform(b.outerRadiusM))
      ).deaths;
      expect(deaths, `kt=${kt.toString()}`).toBeGreaterThanOrEqual(previous);
      previous = deaths;
    }
  });
});

describe('the boundaries the code draws for itself are not cliffs', () => {
  it('a burst crossing the water surface changes smoothly, not in a step', () => {
    const amplitude = (hobM: number): number => {
      const r = simulateExplosion({
        yieldMegatons: 0.02,
        groundType: 'WET_SOIL',
        heightOfBurst: m(hobM),
        waterDepth: m(60),
        meanOceanDepth: m(1_000),
      });
      return r.tsunami === undefined ? 0 : r.tsunami.sourceAmplitude;
    };
    // The property is continuity, not gentleness. The wave does climb
    // steeply as the charge goes under — that is the venting regime,
    // and half a metre of water over a fireball is the difference
    // between coupling and not — but it must climb, not step. So the
    // gap across the surface has to close as the interval does, which
    // a threshold's would not.
    const gap = (eps: number): number => Math.abs(amplitude(eps) - amplitude(-eps));
    expect(gap(0.5)).toBeGreaterThan(gap(0.1));
    expect(gap(0.1)).toBeGreaterThan(gap(0.01));
    expect(gap(0.001)).toBeLessThan(0.01);
    // Nothing above the water makes a wave, at any height.
    for (const above of [0, 0.5, 1, 30, 5_000]) expect(amplitude(above)).toBe(0);
    // Below it, deeper is stronger up to the optimum — 4·W^(1/3) is
    // 11 m for twenty kilotonnes — and weaker past it.
    expect(amplitude(-2)).toBeLessThan(amplitude(-11));
    expect(amplitude(-60)).toBeLessThan(amplitude(-11));
  });

  it('a volcano and a landslide survive their own extremes', () => {
    for (const vei of [0, 3, 8]) {
      const r = simulateVolcano({
        volumeEruptionRate: 10 ** (2 + vei),
        totalEjectaVolume: 10 ** (5 + 2 * vei),
      });
      expect(numbersIn(r).filter((n) => !Number.isFinite(n))).toHaveLength(0);
    }
    for (const volume of [1e4, 1e9, 1e13]) {
      const r = simulateLandslide({
        volumeM3: volume,
        slopeAngleDeg: 30,
        meanOceanDepth: m(1_000),
      });
      expect(numbersIn(r).filter((n) => !Number.isFinite(n))).toHaveLength(0);
    }
  });
});
