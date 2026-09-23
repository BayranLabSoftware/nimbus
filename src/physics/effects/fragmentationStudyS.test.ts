import { describe, expect, it } from 'vitest';
import { J, kgPerM3, m, mps, Pa, rad } from '../units.js';
import { atmosphericEntry, FIRST_STAGE_STRENGTH } from './atmosphericEntry.js';
import { DRAG_COEFFICIENT, H_SCALE, RHO_0 } from './entryConstants.js';
import { carrySolid, studyS, type StudyBody } from './fragmentationStudyS.js';

/**
 * The study of S verified before its run (rules 1018, 1020, 1023 (c), 1025 to
 * 1027), on bodies that are none of the development cases.
 */
const GRID: StudyBody[] = [];
for (const diameter of [0.3, 1, 3, 10, 30])
  for (const velocity of [12_000, 18_000, 25_000])
    for (const density of [3_000, 3_500])
      for (const angle of [20, 45, 80])
        GRID.push({ diameter, velocity, density, sinTheta: Math.sin((angle * Math.PI) / 180) });

const S1 = FIRST_STAGE_STRENGTH as number;
const run = (b: StudyBody, shares = 64) => studyS(b, { f1: 0.5, firstStrength: S1, shares });

describe('the study of S, verified before its run', () => {
  it('rule 1023 (c): no share outside 0 to m0, and the shares plus the core are the body', () => {
    for (const b of GRID) {
      const r = run(b);
      for (const s of r.shares) {
        expect(s.mass).toBeGreaterThanOrEqual(0);
        expect(s.mass).toBeLessThanOrEqual(r.mass);
      }
      const total = r.shares.reduce((a, s) => a + s.mass, 0) + r.core.mass;
      expect(Math.abs(total / r.mass - 1), JSON.stringify(b)).toBeLessThan(1e-12);
      expect(r.budget.ablatedMass).toBe(0);
    }
  });

  it('rule 1023 (c): a component made as the core follows its path until a rule parts them', () => {
    // A solid carried in one piece, and the same carried to a node of its step
    // and handed on as a copy of itself: one path.
    for (const b of GRID) {
      const whole = carrySolid(40_000, b.velocity, 0, 5, b.diameter, b.density, b.sinTheta);
      const first = carrySolid(40_000, b.velocity, 20_000, 5, b.diameter, b.density, b.sinTheta);
      const copy = carrySolid(20_000, first, 0, 5, b.diameter, b.density, b.sinTheta);
      expect(copy).toBe(whole);
    }
    // A core no share of which breaks keeps Eq. 8's path to the ground.
    let checked = 0;
    for (const b of GRID) {
      const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * b.density * b.diameter * b.sinTheta);
      const peak =
        Math.min(RHO_0, 1 / (2 * a)) *
        b.velocity ** 2 *
        Math.exp(-2 * a * Math.min(RHO_0, 1 / (2 * a)));
      const r = studyS(b, { f1: 0.5, firstStrength: S1, range: [peak * 0.999, peak * 1_000] });
      if (r.shares.length > 0 || r.core.floorActed) continue;
      const eq8 = b.velocity * Math.exp(-a * RHO_0);
      expect(Math.abs(r.core.groundSpeed / eq8 - 1), JSON.stringify(b)).toBeLessThan(1e-8);
      checked++;
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('rule 1020: energy and momentum close to 1e-9 of what entered', () => {
    for (const b of GRID) {
      const r = run(b);
      expect(Math.abs(r.budget.energyResidual), JSON.stringify(b)).toBeLessThan(1e-9);
      expect(Math.abs(r.budget.momentumResidual), JSON.stringify(b)).toBeLessThan(1e-9);
    }
  });

  it("rule 1025: one strength is today's model, the breakup within Eq. 11's 50 m", () => {
    let checked = 0;
    for (const b of GRID)
      for (const Y of [1e6, 2.12e6, 4e6]) {
        const s = studyS(b, { f1: 0.5, firstStrength: S1, range: [Y, Y] });
        const ke = 0.5 * b.density * (Math.PI / 6) * b.diameter ** 3 * b.velocity ** 2;
        const t = atmosphericEntry(
          m(b.diameter),
          mps(b.velocity),
          Pa(Y),
          kgPerM3(b.density),
          J(ke),
          rad(Math.asin(b.sinTheta))
        );
        const [share] = s.shares;
        if (share === undefined) {
          expect(t.regime).toBe('INTACT');
          expect(s.core.groundSpeed).toBe(t.endVelocity);
          continue;
        }
        checked++;
        expect(Math.abs(share.breakAltitude - (t.breakupAltitude as number))).toBeLessThan(50);
        expect(s.ends.burst > 0 ? 'COMPLETE_AIRBURST' : 'PARTIAL_AIRBURST').toBe(t.regime);
        if (share.burstAltitude !== null)
          expect(Math.abs(share.burstAltitude - (t.burstAltitude as number))).toBeLessThan(50);
      }
    expect(checked).toBeGreaterThan(100);
  });

  it('rules 1018 and 1027: 64 shares agree with 128 within 1 %', () => {
    const summary = (r: ReturnType<typeof studyS>) => {
      const air = r.energyPerKm.slice(0, 150);
      const total = air.reduce((x, y) => x + y, 0);
      return {
        fractions: [
          r.ends.burst / r.mass,
          r.ends.swarm / r.mass,
          r.ends.surviving / r.mass,
          r.budget.energyToGround / r.budget.energyIn,
          r.budget.energyToAir / r.budget.energyIn,
        ],
        altitude: total > 0 ? air.reduce((x, e, i) => x + e * (i + 0.5), 0) / total : 0,
      };
    };
    for (const b of GRID) {
      const at64 = summary(run(b, 64));
      const at128 = summary(run(b, 128));
      at64.fractions.forEach((f, i) =>
        expect(Math.abs(f - (at128.fractions[i] ?? 0)), JSON.stringify(b)).toBeLessThan(0.01)
      );
      if (at64.altitude > 0)
        expect(Math.abs(at64.altitude / at128.altitude - 1), JSON.stringify(b)).toBeLessThan(0.01);
      // Rule 1027: 32 shares step the mass by 1/32 — within that of 64.
      const at32 = summary(run(b, 32));
      at32.fractions.forEach((f, i) =>
        expect(Math.abs(f - (at64.fractions[i] ?? 0))).toBeLessThanOrEqual(1 / 32 + 1e-12)
      );
    }
  });
});
