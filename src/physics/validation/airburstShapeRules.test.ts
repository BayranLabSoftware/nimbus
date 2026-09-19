import { describe, expect, it } from 'vitest';
import {
  ISOTROPIC_RING,
  obliqueImpactCentreOffset,
  obliqueImpactRingAsymmetry,
} from '../effects/asymmetry.js';
import { simulateImpact } from '../simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';
import { SHAPE_SWEEP_ANGLES_DEG, TUNGUSKA_FELLED_AREA_M2 } from './airburstShapeRules.js';

/**
 * Rules 237 and 238: what the candidate did, checked exactly.
 *
 * The rules were fixed and pushed (commit d3f566e) before the candidate was
 * written.
 */

/** What the envelope gave before the round, at the same α, γ and θ: the
 *  arithmetic of effects/asymmetry.ts as it stood, kept here so the printout
 *  can say what moved without reading a deleted file. */
function beforeShape(angleDeg: number, variant: 'overpressure' | 'thermal') {
  const alpha = variant === 'thermal' ? 0.4 : 0.3;
  const obliquity = Math.max(0, 1 - Math.sin((angleDeg * Math.PI) / 180));
  const major = 1 + alpha * obliquity;
  const minor = Math.max(0.5, 1 - 0.5 * alpha * obliquity);
  const scale = 1 / Math.sqrt(major * minor);
  return { major: major * scale, minor: minor * scale, offsetPerR: 0.2 * obliquity };
}

const airburst = (diameterM: number, velocityKmS: number, angleDeg: number) =>
  simulateImpact({
    impactorDiameter: m(diameterM),
    impactorDensity: kgPerM3(3_300),
    impactVelocity: mps(velocityKmS * 1_000),
    targetDensity: kgPerM3(2_500),
    impactAngle: degreesToRadians(deg(angleDeg)),
    impactAzimuthDeg: 45,
  });

describe('rules 235 to 240 — a burst that never lands has no downrange', () => {
  it('rule 237(a): every ring of a complete airburst is a circle, at every angle', () => {
    for (const angle of SHAPE_SWEEP_ANGLES_DEG) {
      for (const variant of ['overpressure', 'thermal'] as const) {
        const ring = obliqueImpactRingAsymmetry(angle, 45, variant, false);
        expect(ring.semiMajorMultiplier, `${variant} at ${angle.toString()}°`).toBe(1);
        expect(ring.semiMinorMultiplier, `${variant} at ${angle.toString()}°`).toBe(1);
        expect(ring.centerOffsetMeters).toBe(0);
        // The track is still a fact about the event, and is kept.
        expect(ring.azimuthDeg).toBe(45);
      }
      expect(obliqueImpactCentreOffset(angle, 100_000, false)).toBe(0);
    }
  });

  it('rule 237(b): nothing changes for an event that reaches the ground', () => {
    for (const angle of SHAPE_SWEEP_ANGLES_DEG) {
      for (const variant of ['overpressure', 'thermal'] as const) {
        const ring = obliqueImpactRingAsymmetry(angle, 45, variant, true);
        const was = beforeShape(angle, variant);
        expect(ring.semiMajorMultiplier, `${variant} at ${angle.toString()}°`).toBeCloseTo(
          was.major,
          12
        );
        expect(ring.semiMinorMultiplier, `${variant} at ${angle.toString()}°`).toBeCloseTo(
          was.minor,
          12
        );
      }
      expect(obliqueImpactCentreOffset(angle, 100_000, true)).toBeCloseTo(
        beforeShape(angle, 'thermal').offsetPerR * 100_000,
        9
      );
    }
  });

  it('rule 237(c): the shape moved and no radius did', () => {
    // The four bodies of the finding, all of which burst in the air.
    const km = (x: unknown): string => `${((x as number) / 1_000).toFixed(2)} km`;
    const rows: string[] = [
      '',
      '| body | regime | burst | b/a before | b/a after | offset before | offset after |',
      '| --- | --- | --: | --: | --: | --: | --: |',
    ];
    for (const [label, d, v, a] of [
      ['20 m, 19.2 km/s, 18°', 20, 19.2, 18],
      ['40 m, 17 km/s, 10°', 40, 17, 10],
      ['30 m, 20 km/s, 45°', 30, 20, 45],
      ['60 m, 20 km/s, 35°', 60, 20, 35],
    ] as const) {
      const r = airburst(d, v, a);
      expect(r.entry.regime, label).toBe('COMPLETE_AIRBURST');
      expect(r.crater.finalDiameter as number, label).toBe(0);
      const ring = r.damageAsymmetry.overpressure1psi;
      const was = beforeShape(a, 'overpressure');
      const R = r.damage.overpressure1psi as number;
      rows.push(
        `| ${label} | ${r.entry.regime} | ${km(r.entry.burstAltitude)} | ${(was.minor / was.major).toFixed(3)} | ${(ring.semiMinorMultiplier / ring.semiMajorMultiplier).toFixed(3)} | ${km(was.offsetPerR * R)} | ${km(ring.centerOffsetMeters)} |`
      );
      // Every ring of the event, and every shape of it.
      for (const key of [
        'thirdDegreeBurn',
        'secondDegreeBurn',
        'overpressure5psi',
        'overpressure1psi',
        'lightDamage',
      ] as const) {
        const shape = r.damageAsymmetry[key];
        expect(shape.semiMajorMultiplier, `${label} ${key}`).toBe(1);
        expect(shape.semiMinorMultiplier, `${label} ${key}`).toBe(1);
        expect(shape.centerOffsetMeters, `${label} ${key}`).toBe(0);
      }
    }
    rows.push(
      '',
      `Tunguska felled about ${(TUNGUSKA_FELLED_AREA_M2 / 1e6).toFixed(0)} km² of forest, and not in a disc:`,
      'a circle is the reference source’s shape, not nature’s, and rule 240 says which way out of that is open.'
    );
    console.log(rows.join('\n'));
  });

  it('rule 237(c): a body that reaches the ground keeps its ellipse', () => {
    const r = simulateImpact({
      impactorDiameter: m(1_000),
      impactorDensity: kgPerM3(3_000),
      impactVelocity: mps(20_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(15)),
      impactAzimuthDeg: 45,
    });
    expect(r.entry.regime).not.toBe('COMPLETE_AIRBURST');
    const ring = r.damageAsymmetry.overpressure1psi;
    expect(ring.semiMajorMultiplier).toBeGreaterThan(1);
    expect(ring.semiMinorMultiplier).toBeLessThan(1);
    expect(ring.centerOffsetMeters).toBeGreaterThan(0);
    // And the crater keeps its own envelope, which is about a crater.
    expect(r.damageAsymmetry.craterRim).not.toEqual(ISOTROPIC_RING);
  });

  it('an airburst’s ellipse covers exactly the ground its radius names', () => {
    // A circle is the one shape for which the drawn area and π r² cannot
    // disagree, which is the check B-059 left behind.
    const r = airburst(20, 19.2, 18);
    for (const key of ['thirdDegreeBurn', 'secondDegreeBurn'] as const) {
      const shape = r.damageAsymmetry[key];
      expect(shape.semiMajorMultiplier * shape.semiMinorMultiplier).toBe(1);
    }
  });
});
