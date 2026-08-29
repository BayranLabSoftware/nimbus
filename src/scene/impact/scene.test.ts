import { describe, expect, it } from 'vitest';
import { IMPACT_BLAST_COUPLING, STANDARD_GRAVITY } from '../../physics/constants.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../../physics/events/explosion/index.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { s } from '../../physics/units.js';
import {
  ejectaRangeForSpeed,
  ejectaSpeedForRange,
  frameAt,
  sceneFromExplosion,
  sceneFromImpact,
} from './scene.js';
import { m } from '../../physics/units.js';

const ORIGIN = { latitude: 35.0272, longitude: -111.0225 };
const meteorCrater = sceneFromImpact(simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input), ORIGIN);
const chicxulub = sceneFromImpact(simulateImpact(IMPACT_PRESETS.CHICXULUB.input), ORIGIN);
const oneMegaton = sceneFromExplosion(
  simulateExplosion(EXPLOSION_PRESETS.ONE_MEGATON.input),
  ORIGIN
);

describe('ejecta ballistics — the constraint that keeps the debris honest', () => {
  it('round-trips speed and range at the optimal launch angle', () => {
    for (const range of [500, 5_000, 640_000]) {
      const v = ejectaSpeedForRange(m(range));
      expect(ejectaRangeForSpeed(v)).toBeCloseTo(range, 6);
    }
  });

  it('is the textbook R = v²/g at 45°', () => {
    const v = 300;
    expect(ejectaRangeForSpeed(v)).toBeCloseTo((v * v) / STANDARD_GRAVITY, 9);
  });

  it('makes the rendered debris land where the ejecta module says it should', () => {
    // The particle fountain is not eyeballed: its launch speed is
    // derived from the blanket edge the physics already computed, so
    // the two cannot drift apart.
    const result = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    const scene = sceneFromImpact(result, ORIGIN);
    expect(ejectaRangeForSpeed(scene.ejectaLaunchSpeed)).toBeCloseTo(
      result.ejecta.blanketEdge1mm,
      3
    );
  });

  it('rejects nonsense instead of returning NaN', () => {
    expect(ejectaSpeedForRange(m(0))).toBe(0);
    expect(ejectaSpeedForRange(m(Number.NaN))).toBe(0);
    expect(ejectaRangeForSpeed(-5)).toBe(0);
  });
});

describe('sceneFromImpact', () => {
  it('drives the air shock with the coupled energy, not the raw kinetic energy', () => {
    // Same choice impactDamageRadii makes. If these ever diverge the
    // front will cross the 5 psi ring at the wrong moment.
    const result = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    expect(meteorCrater.blastEnergy).toBeCloseTo(
      result.impactor.kineticEnergy * IMPACT_BLAST_COUPLING,
      -6
    );
  });

  it('takes the crater from the final rim diameter', () => {
    const result = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    expect(meteorCrater.craterRadius).toBeCloseTo(result.crater.finalDiameter / 2, 6);
    // Barringer: ≈ 1.2 km across.
    expect(meteorCrater.craterRadius).toBeGreaterThan(400);
    expect(meteorCrater.craterRadius).toBeLessThan(900);
  });

  it('gives Chicxulub a fireball far larger than its crater', () => {
    expect(chicxulub.fireballRadius).toBeGreaterThan(chicxulub.craterRadius);
    expect(chicxulub.fireballRadius / 1_000).toBeGreaterThan(150);
  });

  it('frames the fireball and the crater, never the outer contour', () => {
    // The failure mode this pins: framing on the 0.5 psi ring reduced
    // the event to a dot and made the whole view unreadable.
    for (const scene of [meteorCrater, chicxulub, oneMegaton]) {
      expect(scene.framingReach).toBeLessThan(scene.outerRadius);
      expect(scene.framingReach).toBeGreaterThanOrEqual(scene.fireballRadius * 2);
    }
  });

  it('bounds the sequence duration so a Chicxulub front does not run for hours', () => {
    expect(chicxulub.duration).toBeLessThanOrEqual(900);
    expect(meteorCrater.duration).toBeGreaterThan(20);
  });
});

describe('sceneFromExplosion', () => {
  it('uses the full yield for the air shock', () => {
    const result = simulateExplosion(EXPLOSION_PRESETS.ONE_MEGATON.input);
    expect(oneMegaton.blastEnergy).toBeCloseTo(result.yield.joules, -3);
  });

  it('gives a 1 Mt surface burst a ≈ 1.1 km fireball', () => {
    expect(oneMegaton.fireballRadius).toBeGreaterThan(900);
    expect(oneMegaton.fireballRadius).toBeLessThan(1_300);
  });

  it('gives an airburst no crater and therefore no ejecta', () => {
    const hiroshima = sceneFromExplosion(
      simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input),
      ORIGIN
    );
    expect(hiroshima.craterRadius).toBe(0);
    expect(hiroshima.ejectaRange).toBe(0);
    expect(hiroshima.ejectaLaunchSpeed).toBe(0);
  });
});

describe('frameAt — the per-frame snapshot', () => {
  const scenes = { meteorCrater, chicxulub, oneMegaton };

  it('is pure: the same time always gives the same frame', () => {
    expect(frameAt(meteorCrater, s(4.2))).toEqual(frameAt(meteorCrater, s(4.2)));
  });

  it('starts with a full flash that has faded by the end', () => {
    for (const [name, scene] of Object.entries(scenes)) {
      expect(frameAt(scene, s(0)).flash, name).toBeCloseTo(1, 6);
      expect(frameAt(scene, s(scene.duration)).flash, name).toBeLessThan(0.01);
    }
  });

  it('expands the shock front monotonically', () => {
    for (const scene of Object.values(scenes)) {
      let prev = -1;
      for (let i = 0; i <= 20; i++) {
        const r = frameAt(scene, s((i / 20) * scene.duration)).shockRadius;
        expect(r).toBeGreaterThanOrEqual(prev);
        prev = r;
      }
    }
  });

  it('keeps the front ahead of the fireball after breakaway', () => {
    for (const scene of Object.values(scenes)) {
      const f = frameAt(scene, s(scene.duration * 0.5));
      expect(f.brokenAway).toBe(true);
      expect(f.shockRadius).toBeGreaterThan(f.fireballRadius);
    }
  });

  it('excavates the crater early and then holds it', () => {
    const early = frameAt(meteorCrater, s(0.001)).craterDepth;
    const late = frameAt(meteorCrater, s(meteorCrater.duration)).craterDepth;
    expect(early).toBeLessThan(late);
    expect(late).toBeCloseTo(meteorCrater.craterDepth, 6);
  });

  it('never scours further than the front has travelled', () => {
    for (const scene of Object.values(scenes)) {
      for (let i = 0; i <= 10; i++) {
        const f = frameAt(scene, s((i / 10) * scene.duration));
        expect(f.scourRadius).toBeLessThanOrEqual(f.shockRadius + 1e-6);
      }
    }
  });

  it('lifts the column for the whole sequence', () => {
    const a = frameAt(chicxulub, s(chicxulub.duration * 0.1));
    const b = frameAt(chicxulub, s(chicxulub.duration * 0.9));
    expect(b.fireballAltitude).toBeGreaterThan(a.fireballAltitude);
  });

  it('establishes the dust column early and then holds it', () => {
    // The column builds over the first tens of seconds and persists;
    // it does not keep thickening for the whole sequence. Assert the
    // ramp where the ramp actually is.
    const t0 = frameAt(chicxulub, s(0)).dustOpacity;
    const t1 = frameAt(chicxulub, s(5)).dustOpacity;
    const t2 = frameAt(chicxulub, s(40)).dustOpacity;
    expect(t0).toBeLessThan(t1);
    expect(t1).toBeLessThan(t2);
    expect(t2).toBeLessThanOrEqual(1);
    expect(frameAt(chicxulub, s(chicxulub.duration)).dustOpacity).toBeLessThanOrEqual(1);
  });

  it('produces only finite values across the whole sequence', () => {
    for (const scene of Object.values(scenes)) {
      for (let i = 0; i <= 40; i++) {
        const f = frameAt(scene, s((i / 40) * scene.duration));
        for (const [key, value] of Object.entries(f)) {
          if (typeof value === 'number') expect(Number.isFinite(value), key).toBe(true);
        }
      }
    }
  });

  it('clamps a negative time to the instant of contact', () => {
    expect(frameAt(meteorCrater, s(-10)).time).toBe(0);
  });
});
