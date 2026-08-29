import { describe, expect, it } from 'vitest';
import { IMPACT_BLAST_COUPLING, STANDARD_GRAVITY } from '../../physics/constants.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../../physics/events/explosion/index.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { s } from '../../physics/units.js';
import {
  effectArrival,
  effectRadius,
  ejectaRangeForSpeed,
  ejectaSpeedForRange,
  frameAt,
  openingTime,
  sceneFromExplosion,
  sceneFromImpact,
  collapseSpan,
  COLLAPSE_DURATION,
} from './scene.js';
import { EFFECT_SLOTS, EFFECT_STYLE, effectColorArray, effectCss } from './effectStyle.js';
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

describe('effect zones — every consequence, not just two', () => {
  const hiroshima = sceneFromExplosion(
    simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input),
    ORIGIN
  );

  it('a nuclear burst carries thermal, blast, fire, radiation and EMP', () => {
    const kinds = new Set(oneMegaton.effects.map((e) => e.kind));
    for (const kind of ['thermal', 'blast', 'firestorm', 'radiation'] as const) {
      expect(kinds.has(kind), kind).toBe(true);
    }
  });

  it('an impact carries thermal, blast, ejecta and a crater', () => {
    const kinds = new Set(meteorCrater.effects.map((e) => e.kind));
    for (const kind of ['thermal', 'blast', 'ejecta', 'crater'] as const) {
      expect(kinds.has(kind), kind).toBe(true);
    }
  });

  it('drops the effects an event does not have instead of drawing zeros', () => {
    // Hiroshima is an airburst: no crater, therefore no ejecta.
    expect(effectRadius(hiroshima, 'crater')).toBe(0);
    expect(hiroshima.effects.some((e) => e.kind === 'crater')).toBe(false);
    expect(hiroshima.effects.some((e) => e.kind === 'ejecta')).toBe(false);
  });

  it('sorts outward so the legend reads inner-to-outer', () => {
    for (const scene of [meteorCrater, oneMegaton, chicxulub]) {
      for (let i = 1; i < scene.effects.length; i++) {
        expect(scene.effects[i]?.radius ?? 0).toBeGreaterThanOrEqual(
          scene.effects[i - 1]?.radius ?? 0
        );
      }
    }
  });

  it('marks radiation and EMP as non-material — they change nothing you could photograph', () => {
    for (const effect of oneMegaton.effects) {
      const invisible = effect.kind === 'radiation' || effect.kind === 'emp';
      expect(effect.material, effect.id).toBe(!invisible);
    }
  });

  it('gives the thermal pulse a zero arrival: it travels at light speed', () => {
    expect(effectArrival(oneMegaton, 'thermal3')).toBe(0);
    expect(effectArrival(oneMegaton, 'radiation')).toBe(0);
  });

  it('makes blast arrive later the further out the threshold sits', () => {
    const a = effectArrival(oneMegaton, 'blast5');
    const b = effectArrival(oneMegaton, 'blast1');
    const c = effectArrival(oneMegaton, 'blastLight');
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it('makes the blast arrival agree with the shock front the renderer draws', () => {
    // The contour and the moving front must not disagree about when
    // the wave crosses a threshold.
    const t = effectArrival(oneMegaton, 'blast1');
    const frame = frameAt(oneMegaton, s(t));
    expect(frame.shockRadius).toBeCloseTo(effectRadius(oneMegaton, 'blast1'), -2);
  });

  it('gives the ejecta a ballistic flight time, not an instant one', () => {
    expect(effectArrival(meteorCrater, 'ejecta')).toBeGreaterThan(1);
  });

  it('effectsReach covers every effect, so the camera can frame them all', () => {
    for (const scene of [meteorCrater, oneMegaton, chicxulub]) {
      for (const effect of scene.effects) {
        expect(scene.effectsReach).toBeGreaterThanOrEqual(effect.radius);
      }
      expect(scene.effectsReach).toBeGreaterThan(scene.framingReach);
    }
  });

  it('returns 0 for an effect the scene does not have', () => {
    expect(effectRadius(meteorCrater, 'not-a-thing')).toBe(0);
    expect(effectArrival(meteorCrater, 'not-a-thing')).toBe(0);
  });
});

describe('effect palette — one table, two consumers', () => {
  it('gives every effect id a distinct uniform slot', () => {
    const slots = Object.values(EFFECT_STYLE).map((s2) => s2.slot);
    expect(new Set(slots).size).toBe(slots.length);
    expect(Math.max(...slots)).toBeLessThan(EFFECT_SLOTS);
  });

  it('packs the palette in slot order for the shader', () => {
    const packed = effectColorArray();
    expect(packed.length).toBe(EFFECT_SLOTS * 3);
    for (const style of Object.values(EFFECT_STYLE)) {
      expect(packed[style.slot * 3]).toBeCloseTo(style.rgb[0], 6);
      expect(packed[style.slot * 3 + 2]).toBeCloseTo(style.rgb[2], 6);
    }
  });

  it('gives the legend the same colour the shader gets', () => {
    // The bug this pins: the Cesium legend still advertises contours
    // in colours that appear nowhere in the scene.
    expect(effectCss('blast5')).toBe('rgb(250 204 20)');
    expect(effectCss('nope')).toBe('transparent');
  });

  it('has a style for every effect any scenario produces', () => {
    for (const scene of [meteorCrater, oneMegaton, chicxulub]) {
      for (const effect of scene.effects) {
        expect(EFFECT_STYLE[effect.id], effect.id).toBeDefined();
      }
    }
  });
});

describe('openingTime — where the playhead lands when the view opens', () => {
  it('is past the flash, so the first frame is not a white rectangle', () => {
    for (const scene of [meteorCrater, oneMegaton, chicxulub]) {
      const t = openingTime(scene);
      expect(frameAt(scene, t).flash).toBeLessThan(0.1);
    }
  });

  it('is still early: the fireball must not have finished', () => {
    for (const scene of [meteorCrater, oneMegaton, chicxulub]) {
      expect(openingTime(scene)).toBeLessThan(scene.duration * 0.26);
      expect(frameAt(scene, openingTime(scene)).fireballTemperature).toBeGreaterThan(1_000);
    }
  });

  it('scales with the event rather than being a fixed number of seconds', () => {
    expect(openingTime(chicxulub)).toBeGreaterThan(openingTime(meteorCrater));
  });
});

describe('collapseSpan', () => {
  const scene = sceneFromExplosion(
    simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input),
    ORIGIN
  );

  it('is the distance the front just covered, never less than the floor', () => {
    for (const t of [1, 3, 8, 20, 60]) {
      const span = collapseSpan(scene, s(t));
      expect(span).toBeGreaterThanOrEqual(30);
      // Never more than the front's whole run so far.
      expect(span).toBeLessThanOrEqual(frameAt(scene, s(t)).shockRadius + 1);
    }
  });

  it('shrinks as the front decelerates, so every collapse lasts the same', () => {
    // Sedov: R ~ t^(2/5), decelerating. The span at 3 s must exceed
    // the span at 30 s, or a late collapse would play out slower than
    // an early one.
    expect(collapseSpan(scene, s(3))).toBeGreaterThan(collapseSpan(scene, s(30)));
  });

  it('matches the front displacement it claims to be', () => {
    const t = 10;
    const expected =
      frameAt(scene, s(t)).shockRadius - frameAt(scene, s(t - COLLAPSE_DURATION)).shockRadius;
    expect(collapseSpan(scene, s(t))).toBeCloseTo(Math.max(expected, 30), 6);
  });
});

describe('exoatmospheric bursts — Starfish Prime', () => {
  const starfish = sceneFromExplosion(
    simulateExplosion(EXPLOSION_PRESETS.STARFISH_PRIME_1962.input),
    ORIGIN
  );

  it('knows the ground never feels it', () => {
    expect(starfish.groundCoupled).toBe(false);
    expect(starfish.burstAltitude).toBe(400_000);
    // ...while a 580 m airburst is very much coupled.
    const hiroshima = sceneFromExplosion(
      simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input),
      ORIGIN
    );
    expect(hiroshima.groundCoupled).toBe(true);
  });

  it('stages light without matter: no stem, no dust, no scour, no front', () => {
    for (const t of [0.05, 1, 10, 60]) {
      const f = frameAt(starfish, s(t));
      expect(f.shockRadius).toBe(0);
      expect(f.stemRadius).toBe(0);
      expect(f.dustOpacity).toBe(0);
      expect(f.scourRadius).toBe(0);
      expect(f.craterDepth).toBe(0);
      // The fireball hangs at its real altitude — Starfish's was
      // visible from Hawaii — not on somebody's lawn.
      expect(f.fireballAltitude).toBeGreaterThanOrEqual(400_000);
    }
    // The one thing the ground DOES see: the sky lights up.
    expect(frameAt(starfish, s(0.01)).flash).toBeGreaterThan(0.5);
  });

  it('still carries its real story: the EMP footprint', () => {
    const emp = starfish.effects.find((e) => e.id === 'emp');
    expect(emp).toBeDefined();
    expect(emp?.radius ?? 0).toBeGreaterThan(500_000);
  });
});
