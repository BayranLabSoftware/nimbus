import { describe, expect, it } from 'vitest';
import { J, kgPerM3, m, mps, Pa, rad } from '../units.js';
import { ATAP_PATH_STEP, ATAP_RADIUS_CAP, ATAP_TOP_KM } from './atapRadiation.js';
import {
  atmosphericEntry,
  collinsStrength,
  entryPath,
  FIRST_STAGE_STRENGTH,
  firstFragmentationAltitude,
  MAIN_STAGE_STRENGTH,
  MAIN_STAGE_STRENGTH_RANGE,
  swarmSpreadAtGround,
  twoStageCovers,
  type AtmosphericEntryResult,
} from './atmosphericEntry.js';
import {
  COLLINS_EXPONENTIAL_PROFILE,
  entryTable,
  integratedBreakup,
  integratedFirstCrossing,
  integratedPath,
  integratedSpreadAtGround,
  type EntryBody,
} from './entryIntegrated.js';
import { USSA_1976_PROFILE } from './ussa1976Entry.js';
import {
  ENTRY_ATMOSPHERE_ALTITUDE_TOLERANCE_M,
  ENTRY_ATMOSPHERE_FINE_STEP_M,
  ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE,
  ENTRY_ATMOSPHERE_RK_STEP_M,
  ENTRY_ATMOSPHERE_SPEED_FLOOR_MS,
  ENTRY_ATMOSPHERE_STEP_M,
} from '../validation/entryAtmosphereRules.js';
import { EIEP_GRID } from '../validation/eiepGrid.js';
import { FIREBALL_EVENTS } from '../validation/fireballSetData.js';
import { fireballDiameterM, fireballEntryAngle } from '../validation/fireballRules.js';

/**
 * Rule 910 of validation/entryAtmosphereRules.ts: the integrated model on
 * Collins's exponential against his closed forms at Eq. 10's exact root (A*,
 * written here apart from both), on every case of rule 911; its convergence
 * at 5 m; and the speed after the breakup integrated by Runge–Kutta, apart
 * from the tables.
 */

const C_D = 2;
const H = 8_000;
const RHO0 = 1;
const FP = 7;
const ALPHA = Math.sqrt(FP * FP - 1);
const G = 9.81;

const breathe = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

interface Case {
  name: string;
  diameter: number;
  velocity: number;
  density: number;
  angle: number;
  strength: number;
}

/** Rule 911: level A's wide grid under both laws, and I2's bodies. */
function cases(): Case[] {
  const out: Case[] = [];
  for (const row of EIEP_GRID) {
    const base = {
      diameter: row.diameterM,
      velocity: row.velocityKmS * 1_000,
      density: row.densityKgM3,
      angle: (row.angleDeg * Math.PI) / 180,
    };
    out.push({
      name: `grid ${String(row.index)} Eq. 9`,
      ...base,
      strength: collinsStrength(kgPerM3(row.densityKgM3)),
    });
    if (twoStageCovers(row.densityKgM3)) {
      for (const s of [MAIN_STAGE_STRENGTH, ...MAIN_STAGE_STRENGTH_RANGE]) {
        out.push({ name: `grid ${String(row.index)} S2 ${String(s)}`, ...base, strength: s });
      }
    }
  }
  for (const event of FIREBALL_EVENTS) {
    const base = {
      diameter: fireballDiameterM(event.energyKt, event.speedKmS, 3_000),
      velocity: event.speedKmS * 1_000,
      density: 3_000,
      angle: fireballEntryAngle(event),
    };
    out.push({
      name: `I2 ${event.date} Eq. 9`,
      ...base,
      strength: collinsStrength(kgPerM3(3_000)),
    });
    out.push({ name: `I2 ${event.date} S2`, ...base, strength: MAIN_STAGE_STRENGTH });
  }
  return out;
}

/** A*: the closed forms at Eq. 10's exact root. */
interface Closed {
  intact: boolean;
  /** How far from its edge the regime stands (relative, and in metres). */
  intactMargin: number;
  breakup: number;
  burst: number;
  endVelocity: number;
  path: (z: number) => number;
}

function closedExact(c: Case): Closed {
  const { diameter: L0, velocity: v0, density: rhoI, strength: Y } = c;
  const sinT = Math.sin(c.angle);
  const a = (3 * C_D * H) / (4 * rhoI * L0 * sinT);
  const rho = (z: number): number => RHO0 * Math.exp(-z / H);
  const whole = (z: number): number => v0 * Math.exp(-a * rho(z));
  const pressure = (x: number): number => x * v0 * v0 * Math.exp(-2 * a * x);
  const top = Math.min(RHO0, 1 / (2 * a));
  const intactMargin = Math.abs(pressure(top) - Y) / Y;
  if (pressure(top) < Y) {
    const terminal = Math.sqrt((4 * rhoI * L0 * G) / (3 * RHO0 * C_D));
    return {
      intact: true,
      intactMargin,
      breakup: 0,
      burst: 0,
      endVelocity: Math.max(whole(0), Math.min(terminal, v0)),
      path: whole,
    };
  }
  let lo = 0;
  let hi = top;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pressure(mid) < Y) lo = mid;
    else hi = mid;
  }
  const rhoStar = hi;
  const zStar = -H * Math.log(rhoStar / RHO0);
  const vStar = whole(zStar);
  const l = L0 * sinT * Math.sqrt(rhoI / (C_D * rhoStar));
  const zb = zStar - 2 * H * Math.log(1 + (l / (2 * H)) * ALPHA);
  const k = (0.75 * C_D * rhoStar) / (rhoI * L0 ** 3 * sinT);
  const cc = (2 * H) / l;
  const integral = (z: number): number => {
    const w = Math.exp((zStar - z) / (2 * H));
    return (
      2 *
      H *
      L0 *
      L0 *
      ((w * w - 1) / 2 + cc * cc * (w ** 4 / 4 - (2 * w ** 3) / 3 + (w * w) / 2 - 1 / 12))
    );
  };
  const end = zb > 0 ? zb : 0;
  const endVelocity = vStar * Math.exp(-k * integral(end));
  const cloud = (3 * C_D * FP * FP * H) / (4 * rhoI * L0 * sinT);
  return {
    intact: false,
    intactMargin,
    breakup: zStar,
    burst: zb,
    endVelocity,
    path: (z) => {
      if (z >= zStar) return whole(z);
      if (zb <= 0 || z >= zb) return vStar * Math.exp(-k * integral(z));
      return endVelocity * Math.exp(-cloud * (rho(z) - rho(zb)));
    },
  };
}

const speedClose = (a: number, b: number): boolean =>
  Math.abs(a - b) <=
  Math.max(ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE * Math.abs(b), ENTRY_ATMOSPHERE_SPEED_FLOOR_MS);
const altitudeClose = (a: number, b: number): boolean =>
  Math.abs(a - b) <= ENTRY_ATMOSPHERE_ALTITUDE_TOLERANCE_M;

function integrated(c: Case): AtmosphericEntryResult {
  const mass = (Math.PI / 6) * c.density * c.diameter ** 3;
  return atmosphericEntry(
    m(c.diameter),
    mps(c.velocity),
    Pa(c.strength),
    kgPerM3(c.density),
    J(0.5 * mass * c.velocity ** 2),
    rad(c.angle),
    undefined,
    undefined,
    undefined,
    undefined,
    'integratedExponential'
  );
}

const bodyOf = (c: Case): EntryBody => ({
  diameter: c.diameter,
  velocity: c.velocity,
  density: c.density,
  sinTheta: Math.sin(c.angle),
});

describe('rule 910: the integrated entry on Collins’s exponential', () => {
  const all = cases();

  it('rule 911: the grid holds every case it names', () => {
    // 1 782 inputs, the 524 of 3 000 kg/m³ three more times; 357 fireballs twice.
    expect(EIEP_GRID).toHaveLength(1_782);
    expect(all).toHaveLength(1_782 + 3 * 524 + 2 * 357);
  });

  it('(a) gives the closed forms at Eq. 10’s exact root, within 1 m and 1e-5', async () => {
    const failures: string[] = [];
    const edges: string[] = [];
    for (const [index, c] of all.entries()) {
      if (index % 200 === 0) await breathe();
      const ref = closedExact(c);
      const got = integrated(c);
      const onEdge =
        ref.intactMargin <= ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE ||
        (!ref.intact && Math.abs(ref.burst) <= ENTRY_ATMOSPHERE_ALTITUDE_TOLERANCE_M);
      const refRegime = ref.intact
        ? 'INTACT'
        : ref.burst > 0
          ? 'COMPLETE_AIRBURST'
          : 'PARTIAL_AIRBURST';
      if (got.regime !== refRegime) {
        (onEdge ? edges : failures).push(`${c.name}: regime ${got.regime} against ${refRegime}`);
        continue;
      }
      const bad = (what: string, a: number, b: number): void => {
        failures.push(`${c.name}: ${what} ${String(a)} against ${String(b)}`);
      };
      if (!ref.intact) {
        if (!altitudeClose(got.breakupAltitude, ref.breakup))
          bad('breakup', got.breakupAltitude, ref.breakup);
        if (!altitudeClose(got.virtualBurstAltitude, ref.burst))
          bad('burst', got.virtualBurstAltitude, ref.burst);
        if (refRegime === 'PARTIAL_AIRBURST') {
          const spreadN = swarmSpreadAtGround({
            impactorDiameter: m(c.diameter),
            impactorDensity: kgPerM3(c.density),
            impactAngle: rad(c.angle),
            breakupAltitude: got.breakupAltitude,
            atmosphere: 'integratedExponential',
          });
          const spreadA = swarmSpreadAtGround({
            impactorDiameter: m(c.diameter),
            impactorDensity: kgPerM3(c.density),
            impactAngle: rad(c.angle),
            breakupAltitude: m(ref.breakup),
          });
          if (Math.abs(spreadN - spreadA) > ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE * spreadA)
            bad('spread', spreadN, spreadA);
        }
      }
      if (!speedClose(got.endVelocity, ref.endVelocity))
        bad('speed', got.endVelocity, ref.endVelocity);
      const share =
        ref.intact || ref.burst <= 0 ? Math.min(1, (ref.endVelocity / c.velocity) ** 2) : 0;
      if (Math.abs(got.energyFractionToGround - share) > ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE)
        bad('share', got.energyFractionToGround, share);
      const firstN = firstFragmentationAltitude({
        diameter: c.diameter,
        velocity: c.velocity,
        density: c.density,
        angle: c.angle,
        strength: FIRST_STAGE_STRENGTH,
        atmosphere: 'integratedExponential',
      });
      const firstA = firstFragmentationAltitude({
        diameter: c.diameter,
        velocity: c.velocity,
        density: c.density,
        angle: c.angle,
        strength: FIRST_STAGE_STRENGTH,
      });
      if (!altitudeClose(firstN, firstA)) bad('first fragmentation', firstN, firstA);
      const path = entryPath(
        m(c.diameter),
        mps(c.velocity),
        Pa(c.strength),
        kgPerM3(c.density),
        rad(c.angle),
        {
          top: ATAP_TOP_KM * 1_000,
          step: ATAP_PATH_STEP,
          radiusCap: ATAP_RADIUS_CAP,
          atmosphere: 'integratedExponential',
        }
      );
      for (const sample of path) {
        const want = ref.path(sample.altitude);
        if (!speedClose(sample.velocity, want)) {
          bad(`path at ${String(sample.altitude)} m`, sample.velocity, want);
          break;
        }
      }
    }
    console.log(
      `rule 910(a): ${String(all.length)} cases, ${String(edges.length)} on an edge`,
      edges.slice(0, 20)
    );
    expect(failures.slice(0, 20)).toEqual([]);
    expect(failures).toHaveLength(0);
  }, 300_000);

  it.each([COLLINS_EXPONENTIAL_PROFILE, USSA_1976_PROFILE])(
    '(b) converges on $name: the grid at 5 m moves nothing by the tolerance',
    async (profile) => {
      const coarse = entryTable(profile, ENTRY_ATMOSPHERE_STEP_M);
      const fine = entryTable(profile, ENTRY_ATMOSPHERE_FINE_STEP_M);
      const failures: string[] = [];
      const altitudes: number[] = [];
      for (let z = ATAP_TOP_KM * 1_000; z > 0; z -= ATAP_PATH_STEP) altitudes.push(z);
      altitudes.push(0);
      for (const [index, c] of all.entries()) {
        if (index % 200 === 0) await breathe();
        const b = bodyOf(c);
        const x = integratedBreakup(coarse, b, c.strength);
        const y = integratedBreakup(fine, b, c.strength);
        if ((x.breakup === null) !== (y.breakup === null)) {
          failures.push(`${c.name}: breaks under one grid only`);
          continue;
        }
        if (x.breakup !== null && y.breakup !== null) {
          if (!altitudeClose(x.breakup, y.breakup)) failures.push(`${c.name}: breakup`);
          if (!altitudeClose(x.burst, y.burst)) failures.push(`${c.name}: burst`);
          const sx = integratedSpreadAtGround(coarse, b, x.breakup);
          const sy = integratedSpreadAtGround(fine, b, y.breakup);
          if (Math.abs(sx - sy) > ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE * sy)
            failures.push(`${c.name}: spread`);
        }
        if (!speedClose(x.endVelocity, y.endVelocity)) failures.push(`${c.name}: speed`);
        const fx = integratedFirstCrossing(coarse, b, FIRST_STAGE_STRENGTH) ?? 0;
        const fy = integratedFirstCrossing(fine, b, FIRST_STAGE_STRENGTH) ?? 0;
        if (!altitudeClose(fx, fy)) failures.push(`${c.name}: first fragmentation`);
        const px = integratedPath(coarse, b, c.strength, altitudes);
        const py = integratedPath(fine, b, c.strength, altitudes);
        for (const [i, p] of px.entries()) {
          const q = py[i];
          if (q === undefined || !speedClose(p.velocity, q.velocity)) {
            failures.push(`${c.name}: path at ${String(p.altitude)} m`);
            break;
          }
        }
      }
      expect(failures.slice(0, 20)).toEqual([]);
    },
    300_000
  );

  it('(c) the speed after the breakup, by Runge–Kutta apart from the tables', async () => {
    const table = entryTable(COLLINS_EXPONENTIAL_PROFILE);
    const rho = COLLINS_EXPONENTIAL_PROFILE.density;
    const failures: string[] = [];
    let run = 0;
    for (const [index, c] of all.entries()) {
      if (index % 100 === 0) await breathe();
      const b = bodyOf(c);
      const x = integratedBreakup(table, b, c.strength);
      if (x.breakup === null) continue;
      run += 1;
      const K = Math.sqrt(C_D / c.density) / b.sinTheta;
      const k = (3 * C_D) / (4 * c.density * c.diameter ** 3 * b.sinTheta);
      const L0 = c.diameter;
      // y = [ln v, τ], in altitude, downward from the breakup.
      const deriv = (z: number, tau: number): [number, number] => [
        k * rho(z) * (L0 * L0 + tau * tau),
        -K * Math.sqrt(rho(z)),
      ];
      const end = Math.max(x.burst, 0);
      let z = x.breakup;
      let lnV = Math.log(x.speedAtBreakup);
      let tau = 0;
      while (z > end) {
        const h = -Math.min(ENTRY_ATMOSPHERE_RK_STEP_M, z - end);
        const [a1, b1] = deriv(z, tau);
        const [a2, b2] = deriv(z + h / 2, tau + (h / 2) * b1);
        const [a3, b3] = deriv(z + h / 2, tau + (h / 2) * b2);
        const [a4, b4] = deriv(z + h, tau + h * b3);
        lnV += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
        tau += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        z += h;
      }
      const v = Math.exp(lnV);
      if (!speedClose(x.endVelocity, v))
        failures.push(`${c.name}: ${String(x.endVelocity)} against ${String(v)}`);
      if (
        x.burst > 0 &&
        Math.abs(tau - L0 * ALPHA) > ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE * L0 * ALPHA
      )
        failures.push(
          `${c.name}: spread at the burst ${String(tau)} against ${String(L0 * ALPHA)}`
        );
    }
    expect(run).toBeGreaterThan(1_000);
    expect(failures.slice(0, 20)).toEqual([]);
  }, 300_000);
});
