/**
 * The ash of an eruption held to Tephra2, the field's program for tephra fall:
 * V1's ash clause. Class A: the program is the reference (G1).
 *
 * The rules, numbered after the hundred and fifty-seven before them:
 *
 *  158. **What was read, and what it showed.** On 16 September 2026, at
 *       Andrea's word — the reference's source may be read to understand what
 *       it computes, and Nimbus's code is written anew, never transcribed —
 *       Tephra2's forward model was read at commit ff621c6 (GPL-3.0) and
 *       written for Nimbus from its equations and its behaviour:
 *       `events/volcano/tephra2Fallout.ts`, whose header says the model in
 *       words and the program's behaviours it keeps. Run against the program
 *       before this was written, it gave all 50 328 points of the program's own
 *       Colima example within its printing, the worst 5.0 × 10⁻⁶, and all
 *       1 000 points of forty eruptions drawn across its inputs — 666 above
 *       zero, from 10⁻³⁰³ to 5 × 10³ kg/m² — within the same
 *       (`benchmark/results/tephra2-looked-at-2026-09-16.json`). It is
 *       `AshDepositModel` `program` in events/volcano/ashfall.ts, not the
 *       default.
 *
 *  159. **The candidate.** A scenario's ash deposit is the program's, given
 *       the parameters the campaign's reference run gave Tephra2 for Nimbus's
 *       eruptions (`programEruption` in ashfall.ts): the plume top at Mastin
 *       et al.'s height, the mass at the deposit density, Nimbus's grain
 *       classes as a normal distribution in φ, the rest Tephra2's own example
 *       with a hundred steps each way, a wind constant with height. The
 *       footprint keeps ashfall.ts's definitions — the farthest point above the
 *       threshold on the axis, the widest half-width, their ellipse — read off
 *       that deposit.
 *
 *  160. **The held-out check.** Forty eruptions nobody has run the program on,
 *       drawn by `tephra2HeldOutCases` below (seed 1 580 916): twenty-four
 *       across the program's own inputs — the vent from 1 m to 5 km, the
 *       column from 500 m to 45 km above it, the mass from 10⁶ to 10¹³ kg, the
 *       coarsest size from −10 to 0 φ and the finest up to 20 φ finer, the
 *       median from −4 to 6 φ, the deviation from 0.3 to 5 φ, α and β from 0.2
 *       to 8, the eddy constant from 10⁻³ to 1, the diffusion coefficient
 *       from 0.5 to 50 000 m²/s, the fall-time threshold from 18 to 18 000 s,
 *       the densities, 1 to 150 column steps and 1 to 100 grain steps, one to
 *       eight wind readings and one above the plume top, one eruption in five
 *       calm, forty points out to 500 km and up to 3 km above the vent — and
 *       sixteen of Nimbus's own, the volume rate from 10³ to 10¹⁰ m³/s, the
 *       volume from 10⁷ to 10¹⁴ m³, the wind from 0.5 to 60 m/s, under the
 *       candidate's parameters, forty points out to 2 000 km downwind and
 *       300 km across. The program is run once on each. A point **agrees** when
 *       the candidate's loading is within 1 % of the program's, or within the
 *       six significant figures it prints. An eruption the program does not
 *       run is counted apart.
 *
 *  161. **What decides.** Adopted when at least 30 eruptions and 1 200 points
 *       are compared, every point agrees, and the validation report
 *       regenerated with the candidate keeps the release gate at PASS.
 *       Otherwise refused. Adopted, the volcano family's sweep is run in the
 *       same session under both and printed; it does not decide.
 *
 * What these rules cannot settle. Whether the parameters are the eruption's:
 * a grain-size distribution, a release shape and a diffusion coefficient
 * fitted at Colima are not those of every eruption, and V3 reads the isopachs
 * of real eruptions against the program on the same eruptions for that. And
 * the footprint: Tephra2 prints loadings at points, not a reach or an area.
 */

import { programEruption } from '../events/volcano/ashfall.js';
import { plumeHeight } from '../events/volcano/plumeHeight.js';
import type { Tephra2Eruption, WindReading } from '../events/volcano/tephra2Fallout.js';

/** Rule 160: G1's tolerance, and the program's printing (six significant figures). */
export const TEPHRA2_TOLERANCE = 0.01;
export const TEPHRA2_PRINTING = 5e-6;
/** Rule 161. */
export const TEPHRA2_MIN_ERUPTIONS = 30;
export const TEPHRA2_MIN_POINTS = 1_200;
export const TEPHRA2_SEED = 1_580_916;

export interface Tephra2Case {
  key: string;
  eruption: Tephra2Eruption;
  wind: WindReading[];
  points: { northM: number; eastM: number; elevationM: number }[];
}

// mulberry32
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rule 160: the forty eruptions, the same at every call. */
export function tephra2HeldOutCases(): Tephra2Case[] {
  const random = generator(TEPHRA2_SEED);
  const lin = (lo: number, hi: number): number => lo + random() * (hi - lo);
  const logU = (lo: number, hi: number): number => 10 ** lin(Math.log10(lo), Math.log10(hi));
  const cases: Tephra2Case[] = [];

  for (let c = 0; c < 24; c++) {
    const vent = logU(1, 5_000);
    const top = vent + logU(500, 45_000);
    const coarsest = lin(-10, 0);
    const eruption: Tephra2Eruption = {
      ventElevationM: vent,
      plumeTopElevationM: top,
      massKg: logU(1e6, 1e13),
      coarsestPhi: coarsest,
      finestPhi: coarsest + lin(0.5, 20),
      medianPhi: lin(-4, 6),
      sigmaPhi: lin(0.3, 5),
      releaseAlpha: logU(0.2, 8),
      releaseBeta: logU(0.2, 8),
      eddyConstant: logU(1e-3, 1),
      diffusionCoefficientM2S: logU(0.5, 50_000),
      fallTimeThresholdS: logU(18, 18_000),
      lithicDensityKgM3: lin(2_000, 3_000),
      pumiceDensityKgM3: lin(300, 1_500),
      columnSteps: 1 + Math.floor(random() * 150),
      grainSteps: 1 + Math.floor(random() * 100),
    };
    const readings = 1 + Math.floor(random() * 8);
    const heights = Array.from({ length: readings }, () => lin(0, top)).sort((a, b) => a - b);
    heights.push(top + lin(1, 10_000));
    const calm = random() < 0.2;
    const wind = heights.map((heightM) => ({
      heightM,
      speedMS: calm ? 0 : lin(0, 60),
      towardDeg: lin(-360, 720),
    }));
    const points = Array.from({ length: 40 }, () => {
      const near = random() < 1 / 3;
      const reach = near ? 25_000 : 500_000;
      return {
        northM: lin(-reach, reach),
        eastM: lin(-reach, reach),
        elevationM: lin(0, vent + 3_000),
      };
    });
    cases.push({ key: `program ${(c + 1).toString()}`, eruption, wind, points });
  }

  for (let c = 0; c < 16; c++) {
    const rate = logU(1e3, 1e10);
    const volume = logU(1e7, 1e14);
    const speed = lin(0.5, 60);
    const eruption = programEruption({
      plumeHeight: plumeHeight({ volumeEruptionRate: rate }),
      totalEjectaVolume: volume,
    });
    const wind = [
      { heightM: 0, speedMS: speed, towardDeg: 90 },
      { heightM: eruption.plumeTopElevationM + 1_000, speedMS: speed, towardDeg: 90 },
    ];
    const points = Array.from({ length: 40 }, () => {
      const near = random() < 1 / 3;
      return {
        northM: lin(-1, 1) * (near ? 20_000 : 300_000),
        eastM: lin(0, near ? 50_000 : 2_000_000),
        elevationM: eruption.ventElevationM,
      };
    });
    cases.push({ key: `nimbus ${(c + 1).toString()}`, eruption, wind, points });
  }
  return cases;
}

/** Rule 160, for one point. */
export function tephra2PointAgrees(model: number, program: number): boolean {
  if (!Number.isFinite(model) || !Number.isFinite(program)) return false;
  const bound = Math.max(TEPHRA2_TOLERANCE, TEPHRA2_PRINTING) * Math.abs(program);
  return Math.abs(model - program) <= bound;
}

export interface Tephra2Verdict {
  eruptions: number;
  points: number;
  departs: number;
  heldOutPasses: boolean;
}

/** Rule 161, the held-out part: per eruption the agreement of each point, or
 *  null for one the program did not run. */
export function tephra2Verdict(cases: readonly (readonly boolean[] | null)[]): Tephra2Verdict {
  const answered = cases.filter((c): c is readonly boolean[] => c !== null);
  const points = answered.flat();
  const departs = points.filter((a) => !a).length;
  return {
    eruptions: answered.length,
    points: points.length,
    departs,
    heldOutPasses:
      answered.length >= TEPHRA2_MIN_ERUPTIONS &&
      points.length >= TEPHRA2_MIN_POINTS &&
      departs === 0,
  };
}
