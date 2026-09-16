/**
 * The wave a landslide raises, held to the field's own tool: the impulse wave
 * manual (Evers, Heller, Fuchs, Hager & Boes 2019, 2nd edition, version 2.1 of
 * June 2023) and the spreadsheet its authors publish to compute it. L1 and L2
 * of docs/GOLD_STANDARD.md. Class A: the tool is the reference (G1).
 *
 * The rules, numbered after the hundred and sixty-one before them, fixed on
 * 17 September 2026 and pushed before the tool is run on one case they draw:
 *
 *  162. **What was read, and what it showed.** At Andrea's word of
 *       16 September — the reference may be read to understand what it
 *       computes, and Nimbus's code is written anew, never transcribed — and
 *       with the downloads Andrea approved on the night of 16 September:
 *
 *       - The manual, `3768-BFE_VAW_Impulse_Wave_Manual_2023.pdf` from the
 *         Swiss Federal Office of Energy (SHA-256 {@link IMPULSE_WAVE_MANUAL_SHA256}),
 *         the same file the benchmark campaign read on 14 September: §3.2 in
 *         full, Tables 3-2 and 3-3, the four worked examples, §5.5 and the
 *         addendum on shallow impact angles. It showed two defects of this
 *         project, both in `effects/impulseWave.ts` and neither on a default
 *         path: the slide's speed from a drop height was low by √(sin α)
 *         against Eq. 3.5 (B-042), and the module credited the first edition
 *         of 2009, whose three-dimensional method is not these equations, and
 *         left out two of Table 3-3's limits, V and D (B-043). Both are fixed
 *         in the commit that carries these rules, with the tests that hold
 *         them. Examples 1 and 2 are the manual's worked cases of the
 *         three-dimensional generation; 3 and 4 work the two-dimensional one.
 *       - The tool, `BFE_VAW_Impulse_Wave_Manual_Computational_Tool_v1-0.xlsm`
 *         from Zenodo (record 3492000, CC-BY-4.0; MD5
 *         {@link IMPULSE_WAVE_TOOL_MD5}, as Zenodo publishes it; SHA-256
 *         {@link IMPULSE_WAVE_TOOL_SHA256}). Its sheet
 *         "Generation | Propagation (3D)" was read cell by cell to know which
 *         cell holds which quantity and which range colours which cell. A copy
 *         was made with its VBA project removed — the manual says the macros
 *         only clear the input cells — and opened in Microsoft Excel, driven by
 *         AppleScript. It was run on the manual's Example 1, and printed
 *         P = 0.637264636438, a first crest of 14.395899127923 m, a trough of
 *         22.715679542628 m and a second crest of 10.087925671364 m: what
 *         `impulseWave.test.ts` already pinned. Then, to try the script that
 *         drives it, on Examples 1 and 2 together: every number of both,
 *         dimensionless ones included, came back within 10⁻¹² of the module's
 *         (`benchmark/results/impulse-wave-looked-at-2026-09-16.json`), on the
 *         night of 16 September. No case of rule 164 or 165 was run. Nothing
 *         of the tool was
 *         transcribed; the module was written from the manual's equations
 *         during the campaign of 14 and 15 September, before the tool was
 *         read.
 *       - Watts, Grilli, Kirby, Fryer & Tappin (2003), NHESS 3:391, read for a
 *         submarine relation and set aside: its equations 3b and 4b do not give
 *         the amplitudes of its own Tables 1 and 2 (they are 0.34 to 1.43 times
 *         them), so no test could hold a relation to that paper within 1 %.
 *       - The per-row model outputs committed for rules 122 to 125
 *         (`benchmark/results/slide-wave-2026-09-16-1.json`) were read to count
 *         where the source ceiling cut the old crest: 4 of 37 rows. No record
 *         column was read.
 *
 *  163. **The candidate.** A scenario's wave law is `impulseWaveManual`. For a
 *       subaerial slide in open water — no confined basin — with water under
 *       it, the wave at the source is the manual's first crest a₀,c₁
 *       (Eq. 3.26) on the impulse product parameter P (Eq. 3.12), with the
 *       slide's bulk density as the form gives it or 2 500 kg/m³; its thickness
 *       and width as given, or V^(1/3); its impact speed as given, or from a
 *       drop height by Eq. 3.5 with tan δ = 0.3, or from a drop of
 *       V^(1/3)·sin α. **No ceiling** is put on the crest: the 0.4 of the
 *       depth has no source (B-039), and the manual gives up to 0.94 of it
 *       inside its own experiments. Where Eq. 3.5 gives no speed (α ≤ δ) there
 *       is no wave, and the result says why. The result names each limit of
 *       Table 3-3 the slide falls outside of — F, S, M, V, D in the extended
 *       range of §3.2.4.3, B, P, and α from 30°, or from 15° where P is inside
 *       its range, as the addendum allows — and which of the three unknowns
 *       were closed; adopted, the panel and the report print both. A submarine
 *       slide and a confined basin keep the project's relations, and the
 *       propagation beyond the source is unchanged.
 *
 *  164. **The held-out check.** {@link impulseWaveHeldOutCases} draws, with seed
 *       {@link IMPULSE_WAVE_SEED}, sixty slides across the tool's own inputs —
 *       the impact speed from 0.5 to 150 m/s, the volume from 10² to 10¹¹ m³,
 *       the depth from 1 to 1 000 m, the thickness from 0.03 to 3 times the
 *       depth and the width from 0.2 to 20 times it, the bulk density from 300
 *       to 3 000 kg/m³, the porosity from 20 to 50 %, the angle from 5° to 90°
 *       — and forty of Nimbus's own scenarios under the candidate: the volume
 *       from 10⁴ to 10¹³ m³, the slope from 5° to 89°, the depth from 1 to
 *       11 000 m; the density, the thickness and the width each given half
 *       the time, the speed a third of the time and a drop height another
 *       third, and closed otherwise.
 *       The tool is fed the slide — for Nimbus's scenarios, the speed,
 *       thickness, width and density the candidate used — and run once on each.
 *       Compared, on the tool's sixty: F, S, M, D, V, B and P, the first crest,
 *       the trough and the second crest; on Nimbus's forty: the source
 *       amplitude the product prints against the tool's first crest, and the
 *       trough, the second crest, P and F. A number **agrees** when it is
 *       within 1 % of the tool's, both zero counting as agreement. A **limit
 *       agrees** when the candidate names it outside exactly where the tool's
 *       own value lies outside the range the tool colours — for α, the range as
 *       the addendum reads it, which the tool's version 1.0 predates. A case
 *       the tool does not answer is counted apart.
 *
 *  165. **L2's rows.** The forty-three landslides of rules 122 to 125, run as
 *       the head-to-head of the amendment of 16 September runs them — subaerial,
 *       in open water, at the slope, width and drop height the catalogue gives
 *       and the closures otherwise — and the tool fed the slide the candidate
 *       used for each. The product's source amplitude must agree with the tool's
 *       first crest on every row, as rule 164 says. **No record is read**: this
 *       checks that the model is the reference on those rows, not how either
 *       stands against the water that was measured, and rule 125 closed the set
 *       to that.
 *
 *  166. **What decides.** Adopted when the tool answers at least 55 of its sixty
 *       slides, 36 of Nimbus's forty scenarios and all forty-three of L2's rows;
 *       every number and every limit compared agrees; the manual's Examples 1
 *       and 2 and the speeds of Eq. 3.5 hold within 1 % in CI; and the
 *       validation report regenerated with the candidate keeps the release gate
 *       at PASS. Otherwise refused. Adopted, the landslide family's sweep is run
 *       in the same session under both laws and printed; it does not decide.
 *
 *  167. **How the verdicts are read, fixed now so they cannot be read kindly
 *       afterwards.** Adopted, **L1 stays not met**: it asks that *the* relation
 *       that makes the wave be held to its source, and a submarine slide and a
 *       confined basin still draw the project's — the scorecard says what holds
 *       and what does not. **L2** is read under the amendment of 16 September:
 *       met when the model implements the reference exactly on the same rows,
 *       which rule 165 checks. Its printed reading of the field stays the one
 *       committed on 16 September — Heller 1.282× at σ_ln 1.776 — with the note
 *       that it was computed before B-042 corrected the speed, and the set is
 *       not read again to replace it.
 *
 * What these rules cannot settle. Whether the closures are the slide's: a cube
 * of side V^(1/3) and a drop of V^(1/3)·sin α are this project's, and the
 * manual wants a measured thickness, width and speed. Whether a wave in the
 * sea is a wave in a reservoir: the manual's experiments are a basin with a
 * flat floor, and a coast is not one. And the propagation: beyond the source
 * the product keeps its own 1/r decay, which no rule here holds.
 */

import type { ImpulseWaveDimensionless } from '../effects/impulseWave.js';
import { LANDSLIDE_DEFAULT_SLOPE_DEG } from '../events/landslide/simulate.js';
import { SLIDE_WAVE_EVENTS, type SlideWaveEvent } from './slideWaveSetData.js';

/** Rule 162. */
export const IMPULSE_WAVE_MANUAL_SHA256 =
  'ea1968816dc8b1c077c62716954158f2dfc17abd985bfbc267595ce006c75286';
export const IMPULSE_WAVE_TOOL_SHA256 =
  '4310c603b3c425877ec0f24090a6efa3a6aa6bcef53e0848111a7ff88f6c8344';
export const IMPULSE_WAVE_TOOL_MD5 = 'a0b1c78f6ec282207e653f277d8d8a84';
export const IMPULSE_WAVE_TOOL_DOI = '10.5281/zenodo.3492000';

/** Rule 164: G1's tolerance. */
export const IMPULSE_WAVE_TOLERANCE = 0.01;
export const IMPULSE_WAVE_SEED = 1_709_026;
/** Rule 166. */
export const IMPULSE_WAVE_MIN_TOOL_CASES = 55;
export const IMPULSE_WAVE_MIN_NIMBUS_CASES = 36;

/** Rule 164: the ranges the tool's sheet colours, as its conditional formats
 *  hold them (cells M18 to M29), and the addendum's reading of the angle. */
export const IMPULSE_WAVE_TOOL_RANGES = {
  F: [0.4, 3.4],
  S: [0.15, 0.6],
  M: [0.25, 1],
  D: [0.59, 1.72],
  V: [0.187, 0.75],
  B: [0.83, 5],
  P: [0.13, 2.08],
} as const;

/** One slide as the tool takes it: its input cells F6 to F13. */
export interface ImpulseWaveToolSlide {
  impactVelocityMS: number;
  volumeM3: number;
  thicknessM: number;
  widthM: number;
  densityKgM3: number;
  porosityPct: number;
  angleDeg: number;
  depthM: number;
}

/** A Nimbus scenario of rule 164, as `simulateLandslide` takes it under the
 *  candidate. */
export interface ImpulseWaveNimbusScenario {
  volumeM3: number;
  slopeAngleDeg: number;
  meanOceanDepth: number;
  regime: 'subaerial';
  waveLaw: 'impulseWaveManual';
  slideDensity?: number;
  slideThicknessM?: number;
  slideWidthM?: number;
  impactVelocityMS?: number;
  dropHeightM?: number;
}

export interface ImpulseWaveHeldOut {
  tool: { key: string; slide: ImpulseWaveToolSlide }[];
  nimbus: { key: string; scenario: ImpulseWaveNimbusScenario }[];
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

/** Rule 164: the hundred cases, the same at every call. */
export function impulseWaveHeldOutCases(): ImpulseWaveHeldOut {
  const random = generator(IMPULSE_WAVE_SEED);
  const lin = (lo: number, hi: number): number => lo + random() * (hi - lo);
  const logU = (lo: number, hi: number): number => 10 ** lin(Math.log10(lo), Math.log10(hi));

  const tool: ImpulseWaveHeldOut['tool'] = [];
  for (let c = 0; c < 60; c++) {
    const depthM = logU(1, 1_000);
    tool.push({
      key: `tool ${(c + 1).toString()}`,
      slide: {
        impactVelocityMS: logU(0.5, 150),
        volumeM3: logU(1e2, 1e11),
        depthM,
        thicknessM: logU(0.03, 3) * depthM,
        widthM: logU(0.2, 20) * depthM,
        densityKgM3: lin(300, 3_000),
        porosityPct: lin(20, 50),
        angleDeg: lin(5, 90),
      },
    });
  }

  const nimbus: ImpulseWaveHeldOut['nimbus'] = [];
  for (let c = 0; c < 40; c++) {
    const scenario: ImpulseWaveNimbusScenario = {
      volumeM3: logU(1e4, 1e13),
      slopeAngleDeg: lin(5, 89),
      meanOceanDepth: logU(1, 11_000),
      regime: 'subaerial',
      waveLaw: 'impulseWaveManual',
    };
    if (random() < 0.5) scenario.slideDensity = lin(500, 3_000);
    if (random() < 0.5) scenario.slideThicknessM = logU(1, 500);
    if (random() < 0.5) scenario.slideWidthM = logU(10, 10_000);
    const speed = random();
    if (speed < 1 / 3) scenario.impactVelocityMS = lin(1, 120);
    else if (speed < 2 / 3) scenario.dropHeightM = logU(10, 3_000);
    nimbus.push({ key: `nimbus ${(c + 1).toString()}`, scenario });
  }
  return { tool, nimbus };
}

/** Rule 165: L2's rows, run as the amendment's head-to-head runs them — the
 *  slope the catalogue gives, else the default; its width and drop height
 *  where it gives them. Only the inputs of each event are used. */
export function impulseWaveL2Scenarios(
  events: readonly SlideWaveEvent[] = SLIDE_WAVE_EVENTS
): { key: string; scenario: ImpulseWaveNimbusScenario }[] {
  return events.map((e) => {
    let slope = LANDSLIDE_DEFAULT_SLOPE_DEG;
    if (e.dropHeightM > 0 && e.slidingDistanceM > 0) {
      const deg = (Math.atan(e.dropHeightM / e.slidingDistanceM) * 180) / Math.PI;
      if (deg > 0 && deg < 90) slope = deg;
    }
    return {
      key: e.event,
      scenario: {
        volumeM3: e.volumeM3,
        slopeAngleDeg: slope,
        meanOceanDepth: e.depthM,
        regime: 'subaerial',
        waveLaw: 'impulseWaveManual',
        ...(e.widthM > 0 && { slideWidthM: e.widthM }),
        ...(e.dropHeightM > 0 && { dropHeightM: e.dropHeightM }),
      },
    };
  });
}

/** Rule 164, for one number. */
export function impulseWaveAgrees(model: number, tool: number): boolean {
  if (!Number.isFinite(model) || !Number.isFinite(tool)) return false;
  if (model === 0 && tool === 0) return true;
  return Math.abs(model - tool) <= IMPULSE_WAVE_TOLERANCE * Math.abs(tool);
}

/** The dimensionless numbers the tool prints for a slide (cells M18 to M29),
 *  and the angle it checks (M25). */
export interface ImpulseWaveToolNumbers extends ImpulseWaveDimensionless {
  angleDeg: number;
}

/** Rule 164: the limits the tool's own values fall outside of, named as
 *  `outsideTestedRange` names them, with the angle as the addendum reads it. */
export function impulseWaveToolOutside(n: ImpulseWaveToolNumbers): string[] {
  const inside = (v: number, r: readonly [number, number]): boolean => v >= r[0] && v <= r[1];
  const R = IMPULSE_WAVE_TOOL_RANGES;
  const pInside = inside(n.P, R.P);
  const angle = inside(n.angleDeg, [30, 90]) || (pInside && inside(n.angleDeg, [15, 90]));
  const checks: readonly (readonly [string, boolean])[] = [
    ['F', inside(n.F, R.F)],
    ['S', inside(n.S, R.S)],
    ['M', inside(n.M, R.M)],
    ['V', inside(n.V, R.V)],
    ['D', inside(n.D, R.D)],
    ['B', inside(n.B, R.B)],
    ['α', angle],
    ['P', pInside],
  ];
  return checks.filter(([, ok]) => !ok).map(([name]) => name);
}

export interface ImpulseWaveVerdict {
  toolCases: number;
  nimbusCases: number;
  l2Rows: number;
  l2RowsExpected: number;
  numbers: number;
  numbersDepart: number;
  limits: number;
  limitsDepart: number;
  heldOutPasses: boolean;
}

/** Rule 166, the held-out part: per case, the agreement of each number and
 *  each limit, or null for a case the tool did not answer. */
export function impulseWaveVerdict(input: {
  tool: readonly ({ numbers: readonly boolean[]; limits: boolean } | null)[];
  nimbus: readonly ({ numbers: readonly boolean[]; limits: boolean } | null)[];
  l2: readonly ({ numbers: readonly boolean[]; limits: boolean } | null)[];
  l2RowsExpected: number;
}): ImpulseWaveVerdict {
  const answered = <T>(xs: readonly (T | null)[]): T[] => xs.filter((x): x is T => x !== null);
  const tool = answered(input.tool);
  const nimbus = answered(input.nimbus);
  const l2 = answered(input.l2);
  const all = [...tool, ...nimbus, ...l2];
  const numbers = all.flatMap((c) => c.numbers);
  const numbersDepart = numbers.filter((a) => !a).length;
  const limitsDepart = all.filter((c) => !c.limits).length;
  return {
    toolCases: tool.length,
    nimbusCases: nimbus.length,
    l2Rows: l2.length,
    l2RowsExpected: input.l2RowsExpected,
    numbers: numbers.length,
    numbersDepart,
    limits: all.length,
    limitsDepart,
    heldOutPasses:
      tool.length >= IMPULSE_WAVE_MIN_TOOL_CASES &&
      nimbus.length >= IMPULSE_WAVE_MIN_NIMBUS_CASES &&
      l2.length === input.l2RowsExpected &&
      numbersDepart === 0 &&
      limitsDepart === 0,
  };
}
