import { FRAGMENTATION_CLAUSE, M3_V2_STATUS } from './fragmentationRoundRules.js';

/**
 * The verdict of a variant of the round on fragmentation against the baseline
 * (rules 964, 975, 976, 981, 985, 996 and 1000 of fragmentationRoundRules.ts),
 * written before variant P ran. A pure reading of two runs of
 * scripts/fragmentationRun.ts: nothing here runs the model.
 */

export interface ScoreBand {
  median: number;
  p5: number;
  p95: number;
  width: number;
}

/** What the score reads of one case of a run. */
export interface ScoreCase {
  case: string;
  draws: number;
  m1: { pFirstStage: number; altitude: ScoreBand | null; miss: number | null; counted: boolean };
  m2: { pBurst: number; altitude: ScoreBand | null; miss: number | null; counted: boolean };
  m3: { observedOutcome: number | null; counted: boolean };
  m4: { counted: boolean };
}

export interface ScoreRun {
  cases: readonly ScoreCase[];
  summary: { rightOutcomes: readonly string[] };
}

export interface AltitudeCredit {
  case: string;
  /** The fall of the miss, baseline minus variant (m); positive is better. */
  change: number;
  /** What counts of it (rule 985 and 976). */
  credited: number;
  why: string;
}

export interface FragmentationVerdict {
  m1: {
    credits: AltitudeCredit[];
    meanCredited: number | null;
    improved: boolean;
    apart: string[];
  };
  m2: {
    credits: AltitudeCredit[];
    meanCredited: number | null;
    improved: boolean;
    apart: string[];
  };
  m3: { gains: { case: string; gain: number }[]; meanGain: number | null; improved: boolean };
  m4: { improved: false };
  improvedCount: number;
  /** Rule 964 (b): the outcomes already right, each still at 0.9 or more. */
  rightKept: { case: string; baseline: number; variant: number; kept: boolean }[];
  /** Rule 964 (a) to (c): two metrics improved and every right outcome kept. */
  holds: boolean;
}

const mean = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

/** Rule 976: a band that widens by more than half voids a case's gain; a
 *  single run (no width on either side) reads no band. */
function widened(base: ScoreBand | null, variant: ScoreBand | null): boolean {
  if (base === null || variant === null) return false;
  if (!(base.width > 0)) return false;
  return variant.width > FRAGMENTATION_CLAUSE.bandWidening * base.width;
}

/** Rules 985 and 1000: the altitude credit of m1 or m2, case by case. */
function altitudeCredits(
  base: ScoreRun,
  variant: ScoreRun,
  metric: 'm1' | 'm2'
): { credits: AltitudeCredit[]; apart: string[] } {
  const credits: AltitudeCredit[] = [];
  const apart: string[] = [];
  for (const b of base.cases) {
    const v = variant.cases.find((x) => x.case === b.case);
    if (v === undefined || !b[metric].counted) continue;
    const missB = b[metric].miss;
    const missV = v[metric].miss;
    if (missB === null || missV === null) {
      apart.push(b.case);
      continue;
    }
    // The probability of the event the altitude belongs to: the first stage's
    // for m1; for m2 that of the observed outcome, or of the burst where no
    // outcome is observed (rule 1000).
    const [pB, pV] =
      metric === 'm1'
        ? [b.m1.pFirstStage, v.m1.pFirstStage]
        : b.m3.observedOutcome !== null && v.m3.observedOutcome !== null
          ? [b.m3.observedOutcome, v.m3.observedOutcome]
          : [b.m2.pBurst, v.m2.pBurst];
    const change = missB - missV;
    const lowered = pV < pB;
    const wide = widened(b[metric].altitude, v[metric].altitude);
    const credited = lowered || wide ? Math.min(0, change) : change;
    credits.push({
      case: b.case,
      change,
      credited,
      why: lowered
        ? 'the probability of the event fell: a gain is diagnostic'
        : wide
          ? 'the band widened by more than half: a gain does not count'
          : 'credited',
    });
  }
  return { credits, apart };
}

export function scoreVariant(base: ScoreRun, variant: ScoreRun): FragmentationVerdict {
  const m1 = altitudeCredits(base, variant, 'm1');
  const m2 = altitudeCredits(base, variant, 'm2');
  const m1Mean = mean(m1.credits.map((c) => c.credited));
  const m2Mean = mean(m2.credits.map((c) => c.credited));
  const bar = FRAGMENTATION_CLAUSE.altitudeImproveKm * 1_000;
  const gains: { case: string; gain: number }[] = [];
  for (const b of base.cases) {
    const v = variant.cases.find((x) => x.case === b.case);
    if (v === undefined || !b.m3.counted) continue;
    if (b.m3.observedOutcome === null || v.m3.observedOutcome === null) continue;
    gains.push({ case: b.case, gain: v.m3.observedOutcome - b.m3.observedOutcome });
  }
  const m3Mean = mean(gains.map((g) => g.gain));
  const improved = {
    m1: m1Mean !== null && m1Mean >= bar,
    m2: m2Mean !== null && m2Mean >= bar,
    // Rule 1010: m3 of version 2 decides nothing since rules 1009 to 1014.
    m3:
      M3_V2_STATUS === 'decides' &&
      m3Mean !== null &&
      m3Mean >= FRAGMENTATION_CLAUSE.observedOutcomeGain,
  };
  const improvedCount = [improved.m1, improved.m2, improved.m3].filter(Boolean).length;
  const rightKept = base.summary.rightOutcomes.map((c) => {
    const b = base.cases.find((x) => x.case === c)?.m3.observedOutcome ?? 0;
    const v = variant.cases.find((x) => x.case === c)?.m3.observedOutcome ?? 0;
    return { case: c, baseline: b, variant: v, kept: v >= FRAGMENTATION_CLAUSE.rightOutcomeShare };
  });
  return {
    m1: { ...m1, meanCredited: m1Mean, improved: improved.m1 },
    m2: { ...m2, meanCredited: m2Mean, improved: improved.m2 },
    m3: { gains, meanGain: m3Mean, improved: improved.m3 },
    m4: { improved: false },
    improvedCount,
    rightKept,
    holds:
      improvedCount >= FRAGMENTATION_CLAUSE.minMetricsImproved &&
      (M3_V2_STATUS !== 'decides' || rightKept.every((r) => r.kept)),
  };
}
