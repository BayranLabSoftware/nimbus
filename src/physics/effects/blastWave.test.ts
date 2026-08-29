import { describe, expect, it } from 'vitest';
import { SEA_LEVEL_PRESSURE, SEA_LEVEL_SOUND_SPEED } from '../constants.js';
import { J, m as meters, Mt, Pa, s as secs, megatonsToJoules } from '../units.js';
import {
  blastWaveStateAt,
  breakawayTime,
  buildShockArrival,
  buoyantRiseSpeed,
  fireballTemperature,
  impactFireballRadius,
  joulesToKilotons,
  nuclearFireballRadius,
  sedovShockRadius,
  sedovTimeToRadius,
  shockArrivalAt,
  shockMachNumber,
  shockRadiusAt,
} from './blastWave.js';

/** Trinity, 16 July 1945. Modern accepted yield ≈ 21 kt. */
const TRINITY = J(21 * 4.184e12);
/** 20 kt — the yield Glasstone tabulates fireball growth against. */
const TWENTY_KT = J(20 * 4.184e12);
const ONE_MEGATON = megatonsToJoules(Mt(1));
/** Chicxulub kinetic energy used by the impact presets. */
const CHICXULUB = J(1.06e24);

describe('sedovShockRadius — Taylor (1950) Trinity reconstruction', () => {
  it('puts the front at ≈ 80 m at t = 6 ms, the value Taylor read off the photographs', () => {
    // Taylor, Proc. R. Soc. A 201 (1950), Table 1: the Mack photographs
    // give a fireball radius of about 80 m six milliseconds after
    // detonation. This is THE historical validation of the solution.
    const r = sedovShockRadius(TRINITY, secs(0.006)) as number;
    expect(r).toBeGreaterThan(70);
    expect(r).toBeLessThan(90);
  });

  it('follows the t^(2/5) similarity law exactly', () => {
    const r1 = sedovShockRadius(TRINITY, secs(0.01)) as number;
    const r2 = sedovShockRadius(TRINITY, secs(0.32)) as number; // 32x the time
    // R ∝ t^(2/5) ⇒ 32^(2/5) = 4 exactly.
    expect(r2 / r1).toBeCloseTo(4, 6);
  });

  it('follows the E^(1/5) similarity law exactly', () => {
    const rA = sedovShockRadius(J(1e14), secs(0.05)) as number;
    const rB = sedovShockRadius(J(3.2e15), secs(0.05)) as number; // 32x the energy
    expect(rB / rA).toBeCloseTo(2, 6);
  });

  it('round-trips against its own inverse', () => {
    const t = secs(0.037);
    const r = sedovShockRadius(ONE_MEGATON, t);
    expect(sedovTimeToRadius(ONE_MEGATON, r) as number).toBeCloseTo(t, 9);
  });

  it('returns zero for non-physical inputs instead of NaN', () => {
    expect(sedovShockRadius(J(0), secs(1)) as number).toBe(0);
    expect(sedovShockRadius(TRINITY, secs(-1)) as number).toBe(0);
    expect(sedovTimeToRadius(J(Number.NaN), meters(10)) as number).toBe(0);
  });
});

describe('shockMachNumber — Rankine-Hugoniot normal shock, γ = 1.4', () => {
  it('is exactly sonic for a vanished front', () => {
    expect(shockMachNumber(Pa(0))).toBe(1);
  });

  it('gives M = √(1 + 6/7) at one atmosphere of overpressure', () => {
    expect(shockMachNumber(SEA_LEVEL_PRESSURE)).toBeCloseTo(Math.sqrt(1 + 6 / 7), 12);
  });

  it('gives M ≈ 1.14 at the 5 psi building-collapse threshold', () => {
    expect(shockMachNumber(Pa(34_474))).toBeCloseTo(1.1365, 3);
  });

  it('is strictly increasing in overpressure', () => {
    const ms = [1e3, 1e4, 1e5, 1e6, 1e7].map((p) => shockMachNumber(Pa(p)));
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i] ?? 0).toBeGreaterThan(ms[i - 1] ?? 0);
    }
  });
});

describe('fireball radius', () => {
  it('reproduces the Glasstone 20 kt maximum fireball radius (≈ 220 m)', () => {
    const r = nuclearFireballRadius(20) as number;
    expect(r).toBeGreaterThan(190);
    expect(r).toBeLessThan(260);
  });

  it('reproduces the Glasstone 1 Mt maximum fireball radius (≈ 1.1 km)', () => {
    const r = nuclearFireballRadius(1_000) as number;
    expect(r).toBeGreaterThan(900);
    expect(r).toBeLessThan(1_300);
  });

  it('gives Chicxulub a ≈ 200 km fireball via Collins 2005 Eq. 33', () => {
    const r = (impactFireballRadius(CHICXULUB) as number) / 1_000;
    expect(r).toBeGreaterThan(180);
    expect(r).toBeLessThan(230);
  });

  it('converts joules to kilotonnes on the NIST definition', () => {
    expect(joulesToKilotons(J(4.184e12))).toBeCloseTo(1, 12);
    expect(joulesToKilotons(ONE_MEGATON)).toBeCloseTo(1_000, 9);
  });
});

describe('breakawayTime — calibrated on Glasstone §2.117–§2.120', () => {
  it('breaks away at ≈ 15 ms for 20 kt', () => {
    const t = breakawayTime(TWENTY_KT, nuclearFireballRadius(20)) as number;
    expect(t).toBeGreaterThan(0.008);
    expect(t).toBeLessThan(0.03);
  });

  it('breaks away at ≈ 0.1 s for 1 Mt — the scaling, not a second fit', () => {
    const t = breakawayTime(ONE_MEGATON, nuclearFireballRadius(1_000)) as number;
    expect(t).toBeGreaterThan(0.05);
    expect(t).toBeLessThan(0.25);
  });

  it('is monotone in yield', () => {
    const ts = [1, 10, 100, 1_000, 10_000].map(
      (kt) => breakawayTime(J(kt * 4.184e12), nuclearFireballRadius(kt)) as number
    );
    for (let i = 1; i < ts.length; i++) expect(ts[i] ?? 0).toBeGreaterThan(ts[i - 1] ?? 0);
  });
});

describe('buildShockArrival — Sedov joined to the acoustic limit', () => {
  const arrival = buildShockArrival(ONE_MEGATON, meters(1_100), meters(30_000));

  it('is strictly increasing in both radius and time', () => {
    for (let i = 1; i < arrival.radii.length; i++) {
      expect(arrival.radii[i] ?? 0).toBeGreaterThan(arrival.radii[i - 1] ?? 0);
      expect(arrival.times[i] ?? 0).toBeGreaterThan(arrival.times[i - 1] ?? 0);
    }
  });

  it('never travels slower than sound', () => {
    // Every segment's speed must be ≥ c₀: M ≥ 1 by Rankine-Hugoniot.
    const c0 = SEA_LEVEL_SOUND_SPEED as number;
    for (let i = 1; i < arrival.radii.length; i++) {
      const dr = (arrival.radii[i] ?? 0) - (arrival.radii[i - 1] ?? 0);
      const dt = (arrival.times[i] ?? 0) - (arrival.times[i - 1] ?? 0);
      expect(dr / dt).toBeGreaterThanOrEqual(c0 * 0.999);
    }
  });

  it('decays toward the sound speed in the far field', () => {
    const c0 = SEA_LEVEL_SOUND_SPEED as number;
    const n = arrival.radii.length;
    const dr = (arrival.radii[n - 1] ?? 0) - (arrival.radii[n - 2] ?? 0);
    const dt = (arrival.times[n - 1] ?? 0) - (arrival.times[n - 2] ?? 0);
    // At 30 km from 1 Mt the front is weak: within 12 % of acoustic.
    expect(dr / dt).toBeLessThan(c0 * 1.12);
  });

  it('r(t) and t(r) invert each other', () => {
    const r = shockRadiusAt(arrival, secs(20));
    expect(shockArrivalAt(arrival, r) as number).toBeCloseTo(20, 2);
  });

  it('clamps outside the tabulated range instead of extrapolating', () => {
    expect(shockRadiusAt(arrival, secs(-5)) as number).toBeCloseTo(1_100, 6);
    const far = shockRadiusAt(arrival, secs(1e6)) as number;
    expect(far).toBeCloseTo(30_000, 3);
  });

  it('agrees with the closed-form Sedov solution in the strong-shock regime', () => {
    // Close to the source the front is strongly supersonic and the
    // integral must reproduce the similarity solution it is bridging
    // from. Compare at 2x the fireball radius.
    const near = buildShockArrival(ONE_MEGATON, meters(1_100), meters(2_200), 4_096);
    const tIntegral = near.totalTime as number;
    const tSedov =
      (sedovTimeToRadius(ONE_MEGATON, meters(2_200)) as number) -
      (sedovTimeToRadius(ONE_MEGATON, meters(1_100)) as number);
    // Two independent routes to the same interval: within a factor 2.
    expect(tIntegral).toBeGreaterThan(tSedov * 0.5);
    expect(tIntegral).toBeLessThan(tSedov * 2.0);
  });
});

describe('blastWaveStateAt — the renderer-facing snapshot', () => {
  const fireball = nuclearFireballRadius(1_000);
  const arrival = buildShockArrival(ONE_MEGATON, fireball, meters(30_000));
  const input = { blastEnergy: ONE_MEGATON, fireballRadius: fireball, arrival };

  it('has not broken away at t = 0 and has by t = 1 s', () => {
    expect(blastWaveStateAt(input, secs(0)).brokenAway).toBe(false);
    expect(blastWaveStateAt(input, secs(1)).brokenAway).toBe(true);
  });

  it('keeps the shock front ahead of the fireball once broken away', () => {
    for (const t of [1, 3, 10, 30, 60]) {
      const st = blastWaveStateAt(input, secs(t));
      expect(st.shockRadius as number).toBeGreaterThan(st.fireballRadius);
    }
  });

  it('cools monotonically and never below ambient', () => {
    let prev = Infinity;
    for (const t of [0, 0.1, 1, 5, 20, 90]) {
      const T = blastWaveStateAt(input, secs(t)).fireballTemperature as number;
      expect(T).toBeLessThanOrEqual(prev);
      expect(T).toBeGreaterThan(250);
      prev = T;
    }
  });

  it('lifts the fireball only after breakaway', () => {
    const early = blastWaveStateAt(input, secs(0.01)).fireballAltitude as number;
    const late = blastWaveStateAt(input, secs(60)).fireballAltitude as number;
    expect(late).toBeGreaterThan(early * 3);
  });

  it('caps buoyant rise below escape-velocity nonsense at any scale', () => {
    // The bug this pins: rise speed scaled linearly with fireball
    // radius, so a Chicxulub-class bubble left the atmosphere.
    expect(buoyantRiseSpeed(impactFireballRadius(CHICXULUB))).toBeLessThanOrEqual(150);
    expect(buoyantRiseSpeed(nuclearFireballRadius(20))).toBeGreaterThan(0);
  });

  it('reports the overpressure the front is actually carrying', () => {
    const st = blastWaveStateAt(input, secs(5));
    expect(st.overpressureAtFront as number).toBeGreaterThan(0);
    // and it must fall as the front expands
    const later = blastWaveStateAt(input, secs(40));
    expect(later.overpressureAtFront as number).toBeLessThan(st.overpressureAtFront);
  });
});

describe('fireballTemperature — declared illustrative, still bounded', () => {
  it('peaks near the Glasstone second-maximum and decays', () => {
    const peak = fireballTemperature(secs(0), secs(0.015)) as number;
    expect(peak).toBeGreaterThan(6_000);
    expect(peak).toBeLessThan(8_500);
    expect(fireballTemperature(secs(60), secs(0.015)) as number).toBeLessThan(peak);
  });
});
