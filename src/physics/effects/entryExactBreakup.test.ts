import { describe, expect, it } from 'vitest';
import { atmosphericEntry, collinsStrength, type EntryEquations } from './atmosphericEntry.js';
import { IMPACT_PRESETS } from '../simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps, rad } from '../units.js';
import { EIEP_REFERENCE } from '../validation/eiepReference.js';
import {
  ENTRY_EXACT_TOLERANCE_M,
  ENTRY_FOLD_IF,
  ENTRY_FOLD_TOLERANCE_M,
  PRINTED_OVER_EXACT_IF,
} from '../validation/entryPaperRules.js';
import { ENTRY_PROGRAM_BODIES } from '../validation/entryProgramRules.js';

/**
 * Rules 668 and 673 (d) of `validation/entryPaperRules.ts`: the breakup
 * altitude against the exact answer of the equations it comes from.
 *
 * Collins et al.'s Eqs. 8 to 10: a whole body slows as v(z) = v₀ exp(−a ρ(z))
 * with a = 3 C_D H / (4 ρ_i L₀ sin θ) and ρ(z) = ρ₀ e^(−z/H), and it breaks
 * where its ram pressure ρ(z) v(z)² first reaches its strength. That
 * altitude is found here by bisection on Eq. 8 itself, with the paper's
 * constants (H = 8 km, C_D = 2, ρ₀ = 1 kg/m³) — no fit, no I_f.
 *
 * It holds the paper's equations explicitly: rule 668 is a property of them
 * whichever entry is the default, and rules 667 to 675 were refused.
 */

const H = 8_000;
const C_D = 2;
const RHO_0 = 1;

interface Body {
  name: string;
  diameterM: number;
  velocityMs: number;
  densityKgM3: number;
  angleRad: number;
  strengthPa: number;
}

/** Where the ram pressure of Eq. 8 first reaches the strength (m), or null
 *  where it never does above the ground. */
function exactBreakup(b: Body): number | null {
  const a = (3 * C_D * H) / (4 * b.densityKgM3 * b.diameterM * Math.sin(b.angleRad));
  const ram = (z: number): number => {
    const rho = RHO_0 * Math.exp(-z / H);
    return rho * (b.velocityMs * Math.exp(-a * rho)) ** 2;
  };
  // The ram pressure peaks where ρ = 1/(2a); above that it only rises as the
  // body descends, so the first crossing is the one above the peak.
  const peak = Math.max(H * Math.log(2 * a * RHO_0), 0);
  if (ram(peak) < b.strengthPa) return null;
  let lo = peak;
  let hi = 300_000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (ram(mid) >= b.strengthPa) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Eq. 12 as printed. */
const printedIf = (b: Body): number =>
  (4.07 * C_D * H * b.strengthPa) /
  (b.densityKgM3 * b.diameterM * b.velocityMs ** 2 * Math.sin(b.angleRad));

function modelBreakup(b: Body, equations: EntryEquations = 'paper'): number {
  const mass = (Math.PI / 6) * b.densityKgM3 * b.diameterM ** 3;
  return Number(
    atmosphericEntry(
      m(b.diameterM),
      mps(b.velocityMs),
      b.strengthPa as never,
      kgPerM3(b.densityKgM3),
      J(0.5 * mass * b.velocityMs ** 2),
      rad(b.angleRad),
      equations
    ).breakupAltitude
  );
}

const fromRow = (
  name: string,
  r: { diameterM: number; velocityKmS: number; densityKgM3: number; angleDeg: number }
): Body => ({
  name,
  diameterM: r.diameterM,
  velocityMs: r.velocityKmS * 1_000,
  densityKgM3: r.densityKgM3,
  angleRad: degreesToRadians(deg(r.angleDeg)),
  strengthPa: Number(collinsStrength(kgPerM3(r.densityKgM3))),
});

const GRID = EIEP_REFERENCE.filter((r) => r.error === null).map((r, i) =>
  fromRow(`grid row ${String(i + 1)}`, r)
);
const HELD_OUT = ENTRY_PROGRAM_BODIES.map((r, i) => fromRow(`rule 143 body ${String(i + 1)}`, r));
const PRESETS = Object.entries(IMPACT_PRESETS).map(([name, p]): Body => {
  const input = p.input as Record<string, unknown>;
  const density = Number(input.impactorDensity);
  return {
    name,
    diameterM: Number(input.impactorDiameter),
    velocityMs: Number(input.impactVelocity),
    densityKgM3: density,
    angleRad: Number(input.impactAngle),
    strengthPa: Number(input.impactorStrength ?? collinsStrength(kgPerM3(density))),
  };
});
/** Irons of 1 to 120 m at 13 km/s and 30°: I_f from about 3 down to 0.02,
 *  through the old seam at ½. */
const SCAN = Array.from(
  { length: 60 },
  (_, i): Body => ({
    name: `iron scan ${String(i)}`,
    diameterM: 10 ** (i / 28.8),
    velocityMs: 13_000,
    densityKgM3: 7_800,
    angleRad: Math.PI / 6,
    strengthPa: 5e7,
  })
);

/** Irons placed at chosen I_f through the fold, from 0.9 to 0.999, where
 *  the altitude goes as the square root of 1 − I_f. */
const FOLD = [0.9, 0.95, 0.98, 0.985, 0.99, 0.995, 0.997, 0.998, 0.9985, 0.999].map(
  (target, i): Body => {
    const base = { velocityMs: 13_000, densityKgM3: 7_800, angleRad: Math.PI / 6, strengthPa: 5e7 };
    const diameterM =
      (4.07 * C_D * H * base.strengthPa) /
      (base.densityKgM3 * base.velocityMs ** 2 * Math.sin(base.angleRad) * target);
    return { name: `iron at I_f ${String(target)} (${String(i)})`, diameterM, ...base };
  }
);

describe('rule 673 (d): the breakup where the equations put it', () => {
  it('fixes its tolerances, and the printed constant', () => {
    expect(ENTRY_EXACT_TOLERANCE_M).toBe(50);
    expect(ENTRY_FOLD_IF).toBe(0.98);
    expect(ENTRY_FOLD_TOLERANCE_M).toBe(500);
    expect(PRINTED_OVER_EXACT_IF).toBeCloseTo(0.99818, 5);
  });

  it('holds the paper’s equations to the exact root on every body', () => {
    let compared = 0;
    let atTheFold = 0;
    for (const body of [...GRID, ...HELD_OUT, ...PRESETS, ...SCAN, ...FOLD]) {
      const exact = exactBreakup(body);
      const model = modelBreakup(body);
      const If = printedIf(body);
      if (exact === null) {
        // Never reaches its strength above the ground: the body does not
        // break, or it lies in the sliver the printed 4.07 leaves.
        if (model > 0) expect(If, body.name).toBeGreaterThanOrEqual(PRINTED_OVER_EXACT_IF);
        continue;
      }
      compared += 1;
      if (If > ENTRY_FOLD_IF) atTheFold += 1;
      const tolerance = If <= ENTRY_FOLD_IF ? ENTRY_EXACT_TOLERANCE_M : ENTRY_FOLD_TOLERANCE_M;
      expect(Math.abs(model - exact), body.name).toBeLessThanOrEqual(tolerance);
    }
    expect(compared).toBeGreaterThanOrEqual(140);
    expect(atTheFold).toBeGreaterThan(0);
  });

  it('does not hold the program’s arm to it, which fails it', () => {
    const fifth = HELD_OUT[4];
    const meteor = PRESETS.find((p) => p.name === 'METEOR_CRATER');
    if (fifth === undefined || meteor === undefined) throw new Error('bodies missing');
    for (const [body, below] of [
      [fifth, 350],
      [meteor, 230],
    ] as const) {
      const exact = exactBreakup(body);
      if (exact === null) throw new Error(`${body.name} never breaks`);
      expect(exact - modelBreakup(body, 'program'), body.name).toBeGreaterThan(below);
      expect(Math.abs(exact - modelBreakup(body, 'paper')), body.name).toBeLessThan(40);
    }
  });
});
