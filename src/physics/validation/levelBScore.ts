/**
 * Level B, step 4: the score, as rules 868 and 870 fix it, of the committed
 * predictions (levelBPredictions.json, ad08138) against the observed values
 * (levelBTargets.ts). A pure reading of two committed files: nothing here runs
 * the model, so the test beside it recomputes the outcome on every commit.
 */

import predictions from './levelBPredictions.json';
import { LEVEL_B_BARS, LEVEL_B_EVENTS } from './levelBProtocolRules.js';
import {
  LEVEL_B_CONSISTENCY_EVENTS,
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  LEVEL_B_SEEN_EVENTS,
} from './levelBSources.js';
import { LEVEL_B_OBSERVED, type LevelBObservation } from './levelBTargets.js';

interface Band {
  n: number;
  p5: number;
  median: number;
  p95: number;
}

interface RunSummary {
  regime: Record<string, number>;
  craterOrigin: Record<string, number>;
  morphology: Record<string, number>;
  breakupAltitudeM: Band | null;
  burstAltitudeM: Band | null;
  finalDiameterM: Band | null;
  depthM: Band | null;
  depthOverDiameter: Band | null;
}

const RUNS = predictions.events as unknown as Record<string, { scored: RunSummary }>;

export interface LevelBTargetScore {
  event: string;
  target: LevelBObservation['target'];
  /** Counted for level B (rule 867): not a seen row, not circular. */
  counted: boolean;
  priority: 'primary' | 'secondary' | null;
  pass: boolean;
  /** ln(median / observed midpoint), for a continuous target. */
  logRatio: number | null;
  detail: string;
}

const ALL_EVENTS = [
  ...LEVEL_B_ENTRY_EVENTS,
  ...LEVEL_B_SEEN_EVENTS,
  ...LEVEL_B_CRATER_EVENTS,
  ...LEVEL_B_CONSISTENCY_EVENTS,
];

function bandOf(run: RunSummary, target: LevelBObservation['target']): Band | null {
  switch (target) {
    case 'E2':
      return run.breakupAltitudeM;
    case 'E3':
      return run.burstAltitudeM;
    case 'K2':
    case 'D1':
      return run.finalDiameterM;
    case 'K3':
      return run.depthOverDiameter;
    case 'D2':
      return run.depthM;
    default:
      return null;
  }
}

const fmt = (x: number): string => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toPrecision(3));

export function scoreTarget(o: LevelBObservation): LevelBTargetScore {
  const event = ALL_EVENTS.find((e) => e.event === o.event);
  const pinned = event?.targets.find((t) => t.id === o.target);
  const run = RUNS[o.event]?.scored;
  if (event === undefined || pinned === undefined || run === undefined)
    throw new Error(`${o.event} ${o.target} is not pinned or not predicted`);
  const counted = pinned.scored && LEVEL_B_EVENTS[o.event] !== 'seen';
  const priority = counted ? (pinned.priority ?? null) : null;
  const base = { event: o.event, target: o.target, counted, priority };

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
      detail: `${(share * 100).toFixed(1)} % of the draws dig a ${o.observed.value} crater (bar ${String(LEVEL_B_BARS.morphologyShare * 100)} %)`,
    };
  }

  const { low, high } = o.observed;
  const mid = (low + high) / 2;
  const band = bandOf(run, o.target);
  if (band === null)
    return { ...base, pass: false, logRatio: null, detail: 'the model gives no value here' };
  const logRatio = Math.log(band.median / mid);
  const overlaps = band.p5 <= high && band.p95 >= low;
  const shown = `median ${fmt(band.median)}, band ${fmt(band.p5)}–${fmt(band.p95)} against ${fmt(low)}–${fmt(high)}`;

  switch (o.target) {
    case 'E2': {
      const w = Math.max(
        LEVEL_B_BARS.fragmentationRelative * mid,
        LEVEL_B_BARS.fragmentationMinimumM
      );
      const inside = band.median >= low - w && band.median <= high + w;
      return {
        ...base,
        pass: overlaps && inside,
        logRatio,
        detail: `${shown}: band ${overlaps ? 'overlaps' : 'misses'}, median ${inside ? 'inside' : 'outside'} ±${fmt(w)}`,
      };
    }
    case 'E3': {
      const w = LEVEL_B_BARS.flareWideningM;
      const meets = band.p5 <= high + w && band.p95 >= low - w;
      return {
        ...base,
        pass: meets,
        logRatio,
        detail: `${shown}: band ${meets ? 'meets' : 'misses'} the flare ±${fmt(w)}`,
      };
    }
    case 'K2':
    case 'K3': {
      const w = LEVEL_B_BARS.depthRatioRelative * mid;
      const inside = band.median >= low - w && band.median <= high + w;
      return {
        ...base,
        pass: overlaps && inside,
        logRatio,
        detail: `${shown}: band ${overlaps ? 'overlaps' : 'misses'}, median ${inside ? 'inside' : 'outside'} ±${fmt(w)}`,
      };
    }
    default: {
      // D1, D2: class D — the observed interval inside the band; the median
      // against the interval widened by 30 % reported beside it.
      const within = band.p5 <= low && band.p95 >= high;
      const w = LEVEL_B_BARS.consistencyRelative * mid;
      const inside = band.median >= low - w && band.median <= high + w;
      return {
        ...base,
        pass: within,
        logRatio,
        detail: `${shown}: observed ${within ? 'inside' : 'outside'} the band; median ${inside ? 'inside' : 'outside'} ±30 % (reported)`,
      };
    }
  }
}

export interface LevelBFamily {
  family: 'entry' | 'crater' | 'consistency';
  primaryPass: boolean;
  secondaryShare: number | null;
  secondaryPass: boolean;
  bias: number | null;
  biasPass: boolean;
  earns: 'B' | 'B provisional, one case' | 'D' | 'none';
}

export interface LevelBScore {
  targets: LevelBTargetScore[];
  families: LevelBFamily[];
}

export function scoreLevelB(): LevelBScore {
  const targets = LEVEL_B_OBSERVED.map(scoreTarget);
  const family = (
    name: LevelBFamily['family'],
    events: readonly { event: string }[]
  ): LevelBFamily => {
    const names = new Set(events.map((e) => e.event));
    const own = targets.filter((t) => t.counted && names.has(t.event));
    const primary = own.filter((t) => t.priority === 'primary');
    const secondary = own.filter((t) => t.priority === 'secondary');
    const continuous = own.filter((t) => t.logRatio !== null);
    const primaryPass = primary.length > 0 && primary.every((t) => t.pass);
    const secondaryShare =
      secondary.length === 0 ? null : secondary.filter((t) => t.pass).length / secondary.length;
    const secondaryPass = secondaryShare === null || secondaryShare >= LEVEL_B_BARS.secondaryShare;
    const bias =
      continuous.length === 0
        ? null
        : continuous.reduce((s, t) => s + (t.logRatio ?? 0), 0) / continuous.length;
    const biasPass =
      name === 'consistency' || bias === null || Math.abs(bias) <= LEVEL_B_BARS.biasLogRatio;
    const all = primaryPass && secondaryPass && biasPass;
    const earns: LevelBFamily['earns'] = !all
      ? 'none'
      : name === 'consistency'
        ? 'D'
        : name === 'crater'
          ? 'B provisional, one case'
          : 'B';
    return { family: name, primaryPass, secondaryShare, secondaryPass, bias, biasPass, earns };
  };
  return {
    targets,
    families: [
      family('entry', LEVEL_B_ENTRY_EVENTS),
      family('crater', LEVEL_B_CRATER_EVENTS),
      family('consistency', LEVEL_B_CONSISTENCY_EVENTS),
    ],
  };
}
