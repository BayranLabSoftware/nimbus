/**
 * What round 1 of the FCM branch's scripts share (rules 1148 to 1159,
 * src/physics/validation/fcmRound1Rules.ts): the draws of rule 1152's priors
 * and structures, the decisional quantities of rule 1141 (c) with rule 1151's
 * peaks, and their comparison under the tolerances of gate 1.
 */

import {
  fcmEntry,
  fcmPeaks,
  type FcmBody,
  type FcmOptions,
  type FcmResult,
} from '../src/physics/effects/fcmBranch.js';
import { FCM_GATE1, FCM_PRIORS } from '../src/physics/validation/fcmRoundRules.js';
import { FCM_DEV_PRIORS, FCM_PEAKS } from '../src/physics/validation/fcmRound1Rules.js';

export type Structure = 'M1' | 'M2';
export type Cloud = 'unlimited' | 'capped';
export const CONFIGURATIONS: readonly { structure: Structure; cloud: Cloud }[] = [
  { structure: 'M1', cloud: 'unlimited' },
  { structure: 'M1', cloud: 'capped' },
  { structure: 'M2', cloud: 'unlimited' },
  { structure: 'M2', cloud: 'capped' },
];

/** The body's inputs, as every case and every point of the map gives them. */
export interface EntryInputs {
  diameterM: number;
  speedMS: number;
  densityKgM3: number;
  angleRad: number;
}

/** The parameters one draw of rule 1152 fixed, kept beside its result. */
export interface DrawnParameters {
  s1Pa: number | null;
  s2Pa: number;
  alpha: number;
  larger: number;
  cloudShare: number;
  sigma: number;
  cDispersion: number;
  m2: {
    rubble: number;
    strong: number;
    debris: number;
    rubbleFactor: number;
    strongFactor: number;
  } | null;
}

const uniform = (u: () => number, r: readonly [number, number]): number =>
  r[0] + (r[1] - r[0]) * u();
const logUniform = (u: () => number, r: readonly [number, number]): number =>
  r[0] * (r[1] / r[0]) ** u();

/**
 * Rule 1152: one draw of the priors under a structure and a cloud, on the
 * stream `u`, in a fixed order — the strengths, the fragmentation, the
 * ablation and spreading, then M2's shares and factors.
 */
export function drawFcm(
  x: EntryInputs,
  structure: Structure,
  cloud: Cloud,
  u: () => number
): { body: FcmBody; options: FcmOptions; parameters: DrawnParameters } {
  const p = FCM_DEV_PRIORS;
  const s1 = logUniform(u, p.firstStagePa);
  const s2 = logUniform(u, p.secondStagePa);
  const alpha = uniform(u, FCM_PRIORS.alpha);
  const larger = uniform(u, FCM_PRIORS.largerShare);
  const cloudShare = uniform(u, FCM_PRIORS.cloudShare);
  const sigma = logUniform(u, p.sigma);
  const cDispersion = logUniform(u, p.cDispersion);
  const body: FcmBody = {
    diameter: x.diameterM,
    velocity: x.speedMS,
    density: x.densityKgM3,
    angle: x.angleRad,
    strength: s2,
  };
  let m2: DrawnParameters['m2'] = null;
  if (structure === 'M2') {
    const rubble = uniform(u, p.m2.rubble);
    const strong = uniform(u, p.m2.strong);
    const debris = uniform(u, p.m2.debris);
    const rubbleFactor = uniform(u, p.m2.rubbleFactor);
    const strongFactor = uniform(u, p.m2.strongFactor);
    m2 = { rubble, strong, debris, rubbleFactor, strongFactor };
    body.structure = {
      initialStrength: s1,
      groups: [
        { massShare: 1 - rubble - strong - debris, pieces: 1, strength: s2 },
        { massShare: rubble, pieces: p.m2.rubblePieces, strength: s2 * rubbleFactor },
        { massShare: strong, pieces: 1, strength: s2 * strongFactor },
      ],
    };
  }
  const options: FcmOptions = {
    ablation: sigma,
    cloudDispersion: cDispersion,
    cloudCapRadii: cloud === 'capped' ? p.cloudCapRadii : null,
    alpha,
    split: { kind: 'mass', fragments: FCM_PRIORS.fragmentsPerBreak, larger, cloud: cloudShare },
  };
  return {
    body,
    options,
    parameters: {
      s1Pa: structure === 'M2' ? s1 : null,
      s2Pa: s2,
      alpha,
      larger,
      cloudShare,
      sigma,
      cDispersion,
      m2,
    },
  };
}

/** Rule 1149 (b): the reference of every run. */
export const REFERENCE: Partial<FcmOptions> = {
  stepM: 10,
  binM: 10,
  floorKg: 1e-3,
  maxComponents: 100_000,
};

/** The decisional quantities of rule 1141 (c), with rule 1151's peaks. */
export interface Quantities {
  peakKtKm: number;
  peakAltitudeKm: number;
  secondaryAltitudeKm: number | null;
  secondaryShare: number | null;
  robust: boolean;
  gridKtKm: number;
  finestRatio: number;
  firstBreakKm: number | null;
  depositedShare: number;
  groundEnergyShare: number;
  survivalShare: number;
  largestShare: number;
  landedKg: number;
  largestKg: number;
  /** A piece at the ground at 5 km/s or more (rule 1116). */
  lawSpeedArrival: boolean;
  anyPiece: boolean;
}

export function quantities(r: FcmResult): Quantities {
  const p = fcmPeaks(r, FCM_PEAKS);
  const landed = r.pieces.reduce((a, x) => a + x.count * x.mass, 0);
  const largest = r.pieces.reduce((a, x) => Math.max(a, x.mass), 0);
  const swarmSpeed = r.swarm.mass > 0 ? Math.sqrt((2 * r.swarm.energy) / r.swarm.mass) : 0;
  return {
    peakKtKm: p.ktPerKm,
    peakAltitudeKm: p.altitudeKm,
    secondaryAltitudeKm: p.secondary?.altitudeKm ?? null,
    secondaryShare: p.secondary?.share ?? null,
    robust: p.robust,
    gridKtKm: p.gridKtKm,
    finestRatio: p.finestRatio,
    firstBreakKm: r.firstBreakAltitude === null ? null : r.firstBreakAltitude / 1_000,
    depositedShare: r.ledger.deposited / r.energy,
    groundEnergyShare: r.ledger.groundEnergy / r.energy,
    survivalShare: landed / r.mass,
    largestShare: largest / r.mass,
    landedKg: landed,
    largestKg: largest,
    lawSpeedArrival: r.pieces.some((x) => x.speed >= 5_000) || swarmSpeed >= 5_000,
    anyPiece: r.pieces.length > 0,
  };
}

export type Key =
  | 'peakKtKm'
  | 'peakAltitudeKm'
  | 'depositedShare'
  | 'groundEnergyShare'
  | 'survivalShare'
  | 'largestShare';
export const KEYS: readonly Key[] = [
  'peakKtKm',
  'peakAltitudeKm',
  'depositedShare',
  'groundEnergyShare',
  'survivalShare',
  'largestShare',
];

/** Rule 1141 (c): within 2 %, or within the near-zero bound. */
export function passes(key: Key, ref: number, x: number, entryKt: number): boolean {
  const d = Math.abs(x - ref);
  if (d <= FCM_GATE1.convergence * Math.abs(ref)) return true;
  const z = FCM_GATE1.nearZero;
  switch (key) {
    case 'peakKtKm':
      return d <= z.energyShare * entryKt;
    case 'peakAltitudeKm':
      return d * 1_000 <= z.altitudeM;
    case 'depositedShare':
    case 'groundEnergyShare':
      return d <= z.energyShare;
    case 'survivalShare':
    case 'largestShare':
      return d <= z.share;
  }
}

/** The quantities that fail against a reference; the peak's altitude is left
 *  out where the reference is not robust (rule 1151). */
export function failing(ref: Quantities, x: Quantities, entryKt: number): Key[] {
  return KEYS.filter(
    (k) => !(k === 'peakAltitudeKm' && !ref.robust) && !passes(k, ref[k], x[k], entryKt)
  );
}

export const run = (
  d: { body: FcmBody; options: FcmOptions },
  extra: Partial<FcmOptions> = {}
): FcmResult => fcmEntry(d.body, { ...d.options, ...REFERENCE, ...extra });

export const KT = 4.184e12;
export const round = (x: number, digits = 4): number => Number(x.toPrecision(digits));
