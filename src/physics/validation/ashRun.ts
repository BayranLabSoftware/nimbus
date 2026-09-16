import { readFileSync } from 'node:fs';
import { ashfallMassLoading, type AshSpreadLaw } from '../events/volcano/ashfall.js';
import { plumeHeight } from '../events/volcano/plumeHeight.js';
import {
  ASH_CANDIDATE,
  ASH_IN_PLACE,
  ASH_INVARIANTS_MEASURED,
  chooseAshSpread,
  type AshReading,
} from './ashRules.js';

/**
 * Rules 106 to 109 of ashRules.ts, run: Nimbus's tephra loading against
 * Tephra2's on the seventy eruptions of the matrix, under the law in place and
 * under the book's own closure, and rule 108's choice.
 *
 * The reference is handed in as a path rather than shipped, because it takes a
 * binary to make; `scripts/benchmark/ash.ts` passes the file that
 * `tephra2-reference.ts` wrote.
 */

export interface AshCase {
  id: string;
  volumeEruptionRate: number;
  totalEjectaVolume: number;
  windSpeed: number;
}

interface ReferenceCase {
  id: string;
  points: { xKm: number; yKm: number; massLoadingKgM2: number }[];
}

function reading(logs: readonly number[]): AshReading {
  if (logs.length === 0) return { pairs: 0, bias: Number.NaN, sigmaLn: Number.NaN, withinTwo: 0 };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance =
    logs.length < 2 ? 0 : logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1);
  return {
    pairs: logs.length,
    bias: Math.exp(mean),
    sigmaLn: Math.sqrt(variance),
    withinTwo: logs.filter((x) => Math.abs(x) <= Math.log(2)).length / logs.length,
  };
}

export interface AshLawResult {
  law: AshSpreadLaw;
  axis: AshReading;
  crosswind: AshReading;
}

/** Nimbus against the reference under one law. */
export function scoreAsh(
  cases: readonly AshCase[],
  reference: readonly ReferenceCase[],
  law: AshSpreadLaw
): AshLawResult {
  const byId = new Map(cases.map((c) => [c.id, c]));
  const axis: number[] = [];
  const crosswind: number[] = [];
  for (const t of reference) {
    const c = byId.get(t.id);
    if (c === undefined) continue;
    const H = plumeHeight({ volumeEruptionRate: c.volumeEruptionRate });
    for (const p of t.points) {
      if (!(p.massLoadingKgM2 > 0)) continue;
      const nimbus = ashfallMassLoading({
        plumeHeight: H,
        totalEjectaVolume: c.totalEjectaVolume,
        downwindDistance: p.xKm * 1_000,
        crosswindDistance: p.yKm * 1_000,
        windSpeed: c.windSpeed,
        spreadLaw: law,
      });
      if (!(nimbus > 0)) continue;
      (p.yKm === 0 ? axis : crosswind).push(Math.log(nimbus / p.massLoadingKgM2));
    }
  }
  return { law, axis: reading(axis), crosswind: reading(crosswind) };
}

export interface AshRunResult {
  cases: number;
  inPlace: AshLawResult;
  candidate: AshLawResult;
  decision: ReturnType<typeof chooseAshSpread>;
}

export function runAsh(
  matrixPath: string,
  referencePath: string,
  gatePasses = true,
  /** What rule 19's sweep gives. Omitted, the reading of 16 September 2026
   *  under the law in place — the one that refused the candidate. */
  invariantFailures: number = ASH_INVARIANTS_MEASURED
): AshRunResult {
  const cases = JSON.parse(readFileSync(matrixPath, 'utf8')) as AshCase[];
  const reference = (JSON.parse(readFileSync(referencePath, 'utf8')) as { cases: ReferenceCase[] })
    .cases;
  const inPlace = scoreAsh(cases, reference, ASH_IN_PLACE);
  const candidate = scoreAsh(cases, reference, ASH_CANDIDATE);
  return {
    cases: reference.length,
    inPlace,
    candidate,
    decision: chooseAshSpread({
      axis: { before: inPlace.axis, after: candidate.axis },
      crosswind: { before: inPlace.crosswind, after: candidate.crosswind },
      gatePasses,
      invariantFailures,
    }),
  };
}
