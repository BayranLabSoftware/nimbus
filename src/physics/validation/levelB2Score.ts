/**
 * Level B's second round, step 4: the score of the committed predictions
 * (levelB2Predictions.json, aaec9bf) against the observed values
 * (levelB2Targets.ts), as rules 868, 870 and 927 to 931 fix it. A pure
 * reading of committed files: nothing here runs the model, so the test beside
 * it recomputes the outcome on every commit.
 */

import predictions from './levelB2Predictions.json';
import { LEVEL_B_BARS } from './levelBProtocolRules.js';
import { LEVEL_B_OBSERVED, type LevelBObservation } from './levelBTargets.js';
import { LEVEL_B2_DIAGNOSTIC_OBSERVED, LEVEL_B2_OBSERVED } from './levelB2Targets.js';

interface Band {
  n: number;
  p5: number;
  median: number;
  p95: number;
}

interface Summary {
  regime: Record<string, number>;
  craterOrigin: Record<string, number>;
  morphology: Record<string, number>;
  firstFragmentationAltitudeM: Band | null;
  breakupAltitudeM: Band | null;
  burstAltitudeM: Band | null;
  noCraterDraws: number;
  burstAltitudeNoCraterM: Band | null;
  finalDiameterM: Band | null;
  depthM: Band | null;
  depthOverDiameter: Band | null;
}

type Events = Record<
  string,
  {
    role: string;
    operative?: Summary;
    standardAtmosphere?: Summary;
    grounds?: Record<string, Summary>;
  }
>;
const EVENTS = predictions.events as unknown as Events;

export interface LevelB2Check {
  event: string;
  target: LevelBObservation['target'];
  pass: boolean;
  logRatio: number | null;
  detail: string;
}

const fmt = (x: number): string => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toPrecision(3));

/** One target against one summary: rule 868's bars, rule 930 for E3, rule
 *  921 for E2 (the first stage). */
export function checkTarget(o: LevelBObservation, run: Summary): LevelB2Check {
  const base = { event: o.event, target: o.target };
  if (o.observed.kind === 'outcome') {
    const share = run.craterOrigin[o.observed.origin] ?? 0;
    return {
      ...base,
      pass: share >= LEVEL_B_BARS.outcomeShare,
      logRatio: null,
      detail: `${(share * 100).toFixed(1)} % of the draws answer "${o.observed.origin}" (bar ${String(LEVEL_B_BARS.outcomeShare * 100)} %)`,
    };
  }
  if (o.observed.kind === 'morphology') {
    const withCrater = 1 - (run.craterOrigin.none ?? 0);
    const share = withCrater * (run.morphology[o.observed.value] ?? 0);
    return {
      ...base,
      pass: share >= LEVEL_B_BARS.morphologyShare,
      logRatio: null,
      detail: `${(share * 100).toFixed(1)} % of the draws dig a ${o.observed.value} crater`,
    };
  }
  const { low, high } = o.observed;
  const mid = (low + high) / 2;
  const band =
    o.target === 'E2'
      ? (run.firstFragmentationAltitudeM ?? run.breakupAltitudeM)
      : o.target === 'E3'
        ? run.burstAltitudeNoCraterM
        : o.target === 'K3'
          ? run.depthOverDiameter
          : null;
  if (band === null) {
    return {
      ...base,
      pass: false,
      logRatio: null,
      detail:
        o.target === 'E3'
          ? 'no draw digs no crater: nothing to read the flares on (rule 930)'
          : 'the model gives no value here',
    };
  }
  const logRatio = Math.log(band.median / mid);
  const overlaps = band.p5 <= high && band.p95 >= low;
  const shown = `median ${fmt(band.median)}, band ${fmt(band.p5)}–${fmt(band.p95)} against ${fmt(low)}–${fmt(high)}`;
  if (o.target === 'E3') {
    const w = LEVEL_B_BARS.flareWideningM;
    const meets = band.p5 <= high + w && band.p95 >= low - w;
    return {
      ...base,
      pass: meets,
      logRatio,
      detail: `${shown}, on the ${String(run.noCraterDraws)} draws that dig no crater: band ${meets ? 'meets' : 'misses'} the flares ±${fmt(w)}`,
    };
  }
  const w =
    o.target === 'E2'
      ? Math.max(LEVEL_B_BARS.fragmentationRelative * mid, LEVEL_B_BARS.fragmentationMinimumM)
      : LEVEL_B_BARS.depthRatioRelative * mid;
  const inside = band.median >= low - w && band.median <= high + w;
  return {
    ...base,
    pass: overlaps && inside,
    logRatio,
    detail: `${shown}: band ${overlaps ? 'overlaps' : 'misses'}, median ${inside ? 'inside' : 'outside'} ±${fmt(w)}`,
  };
}

/** Rule 927's words. */
export type LevelB2Verdict =
  | 'compatible with 2022 WJ1 in one independent case'
  | 'incompatible with 2022 WJ1; no class B';

export interface LevelB2Result {
  counted: LevelB2Check[];
  verdict: LevelB2Verdict;
  /** Rule 924: the same targets on the standard atmosphere, never deciding. */
  standardAtmosphere: LevelB2Check[];
  /** Rule 931: Sterlitamak on each ground, never scored. */
  sterlitamak: Record<string, LevelB2Check[]>;
  /** Rule 877: the first round's bodies on the new model, reported. */
  regression: LevelB2Check[];
}

function summaryOf(event: string, key: 'operative' | 'standardAtmosphere'): Summary {
  const run = EVENTS[event]?.[key];
  if (run === undefined) throw new Error(`${event} has no ${key} prediction`);
  return run;
}

/** Rule 870 on the counted body, worded by rule 927. */
function verdictOf(checks: readonly LevelB2Check[]): LevelB2Verdict {
  const primary = checks.filter((c) => c.target === 'E1');
  const secondary = checks.filter((c) => c.target === 'E3');
  const continuous = checks.filter((c) => c.logRatio !== null);
  const bias =
    continuous.length === 0
      ? 0
      : continuous.reduce((s, c) => s + (c.logRatio ?? 0), 0) / continuous.length;
  const secondaryShare =
    secondary.length === 0 ? 1 : secondary.filter((c) => c.pass).length / secondary.length;
  const ok =
    primary.length > 0 &&
    primary.every((c) => c.pass) &&
    secondaryShare >= LEVEL_B_BARS.secondaryShare &&
    Math.abs(bias) <= LEVEL_B_BARS.biasLogRatio;
  return ok
    ? 'compatible with 2022 WJ1 in one independent case'
    : 'incompatible with 2022 WJ1; no class B';
}

export function scoreLevelB2(): LevelB2Result {
  const counted = LEVEL_B2_OBSERVED.map((o) => checkTarget(o, summaryOf(o.event, 'operative')));
  const standardAtmosphere = LEVEL_B2_OBSERVED.map((o) =>
    checkTarget(o, summaryOf(o.event, 'standardAtmosphere'))
  );
  const grounds = EVENTS.Sterlitamak?.grounds ?? {};
  const sterlitamak = Object.fromEntries(
    Object.entries(grounds).map(([g, run]) => [
      g,
      LEVEL_B2_DIAGNOSTIC_OBSERVED.map((o) => checkTarget(o, run)),
    ])
  );
  const regression = LEVEL_B_OBSERVED.filter((o) => EVENTS[o.event]?.role === 'regression').map(
    (o) => checkTarget(o, summaryOf(o.event, 'operative'))
  );
  return {
    counted,
    verdict: verdictOf(counted),
    standardAtmosphere,
    sterlitamak,
    regression,
  };
}
