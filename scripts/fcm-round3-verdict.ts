/**
 * Rule 1168 (e): round 3's verdict, computed from the predictions pushed
 * before any target (fcmRound3Predictions.json, 361dfa4) and the targets
 * extracted after (fcmRound3Targets.ts), by rules 1163 to 1167, 1169 and 1170.
 * Writes src/physics/validation/fcmRound3Verdict.json and
 * docs/FCM_ROUND3_VERDICT.md. Every outcome is published.
 *
 *   pnpm exec tsx scripts/fcm-round3-verdict.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { FCM_ROUND3 } from '../src/physics/validation/fcmRound3Charter.js';
import { FCM_ROUND3_TARGETS } from '../src/physics/validation/fcmRound3Targets.js';

interface Band {
  p5: number | null;
  median: number | null;
  p95: number | null;
}
interface Prediction {
  event: string;
  inDomain: boolean;
  configurations: {
    configuration: string;
    producedShare: number;
    notRobustShare: number;
    releaseKm: Band;
    exponentialReleaseKm: Band;
  }[];
  mixture: { equal: Band; exponential: Band };
  baseline: { burstShare: number; burstKm: Band };
}

const P = JSON.parse(readFileSync('src/physics/validation/fcmRound3Predictions.json', 'utf8')) as {
  results: Prediction[];
};

const round = (x: number, d = 4): number => Number(x.toPrecision(d));
const distance = (x: number | null, lo: number, hi: number): number | null =>
  x === null ? null : Math.max(0, lo - x, x - hi);
/** Gneiting & Raftery's interval score of a 5–95 % band against a value. */
const intervalScore = (b: Band, x: number): number | null => {
  if (b.p5 === null || b.p95 === null) return null;
  const a = FCM_ROUND3.intervalScoreAlpha;
  return b.p95 - b.p5 + (2 / a) * Math.max(0, b.p5 - x) + (2 / a) * Math.max(0, x - b.p95);
};

interface DiagRow {
  event: string;
  assessable: false;
  reason: string;
  diagnostics: Record<
    string,
    { heightKm: number; branchMinusKm: number | null; baselineMinusKm: number | null }
  >;
}
interface AssessedRow {
  event: string;
  assessable: true;
  reason: string;
  kind: 'primary' | 'proxy';
  quality: 'A' | 'B';
  interval: [number, number];
  branch: { median: number | null; distanceKm: number | null; intervalScore: number | null };
  baseline: { median: number | null; distanceKm: number | null; intervalScore: number | null };
  exponential: { median: number | null; distanceKm: number | null; outcome: string };
  outcome: 'favourable' | 'unfavourable' | 'equal';
  configurations: {
    configuration: string;
    medianKm: number | null;
    distanceKm: number | null;
    producedShare: number;
    notRobustShare: number;
    severe: boolean;
  }[];
  severeStructural: boolean;
}
type Row = DiagRow | AssessedRow;

const rows: Row[] = P.results.map((p): Row => {
  const t = FCM_ROUND3_TARGETS.find((x) => x.event === p.event);
  const judged =
    t !== undefined &&
    t.kind !== 'diagnostic' &&
    t.quality !== null &&
    t.quality !== 'C' &&
    t.altitudeKm !== null;
  const producedBoth =
    p.baseline.burstShare > 0 && p.configurations.some((c) => c.producedShare > 0);
  const reason = !judged
    ? `not judged: its kind is ${t?.kind ?? 'unknown'}`
    : !p.inDomain
      ? 'out of the domain (rule 1170)'
      : !producedBoth
        ? 'the release not produced by both models (rule 1167 (a))'
        : 'assessable';
  if (!judged || !p.inDomain || !producedBoth) {
    const diag = t?.diagnostics ?? {};
    return {
      event: p.event,
      assessable: false as const,
      reason,
      diagnostics: Object.fromEntries(
        Object.entries(diag).map(([k, h]) => [
          k,
          {
            heightKm: h,
            branchMinusKm:
              p.mixture.equal.median === null ? null : round(p.mixture.equal.median - h),
            baselineMinusKm:
              p.baseline.burstKm.median === null ? null : round(p.baseline.burstKm.median - h),
          },
        ])
      ),
    };
  }
  // Rules 1165 (a) and 1177 (c): the interval by the quality.
  const sigma =
    t.quality === 'B' ? Math.max(t.sigmaKm ?? 0, FCM_ROUND3.qualityBMinimumKm) : (t.sigmaKm ?? 0);
  const lo = t.altitudeKm - sigma;
  const hi = t.altitudeKm + sigma;
  const margin = t.kind === 'primary' ? FCM_ROUND3.margins.primaryKm : FCM_ROUND3.margins.proxyKm;
  const dm = distance(p.mixture.equal.median, lo, hi);
  const db = distance(p.baseline.burstKm.median, lo, hi);
  const dx = distance(p.mixture.exponential.median, lo, hi);
  const verdictOf = (
    a: number | null,
    b: number | null
  ): 'favourable' | 'unfavourable' | 'equal' =>
    a === null || b === null
      ? 'equal'
      : a <= b - margin
        ? 'favourable'
        : a >= b + margin
          ? 'unfavourable'
          : 'equal';
  let outcome = verdictOf(dm, db);
  // Rule 1165 (c): a favourable distance stands only with a score not worse.
  const isM = intervalScore(p.mixture.equal, t.altitudeKm);
  const isB = intervalScore(p.baseline.burstKm, t.altitudeKm);
  if (outcome === 'favourable' && isM !== null && isB !== null && isM > isB) outcome = 'equal';
  // Rule 1165 (d): not unfavourable under the exponential.
  const expOutcome = verdictOf(dx, db);
  if (outcome === 'favourable' && expOutcome === 'unfavourable') outcome = 'equal';
  // Rules 1166 and 1169: each configuration's severe failure.
  const severeKm = t.kind === 'primary' ? FCM_ROUND3.severe.primaryKm : FCM_ROUND3.severe.proxyKm;
  const configurations = p.configurations.map((c) => {
    const d = distance(c.releaseKm.median, lo, hi);
    return {
      configuration: c.configuration,
      medianKm: c.releaseKm.median,
      distanceKm: d === null ? null : round(d),
      producedShare: c.producedShare,
      notRobustShare: c.notRobustShare,
      severe: (d !== null && d > severeKm) || c.producedShare < FCM_ROUND3.severe.producedShareMin,
    };
  });
  return {
    event: p.event,
    assessable: true as const,
    reason,
    kind: t.kind,
    quality: t.quality,
    interval: [round(lo), round(hi)] as [number, number],
    branch: {
      median: p.mixture.equal.median,
      distanceKm: dm === null ? null : round(dm),
      intervalScore: isM === null ? null : round(isM),
    },
    baseline: {
      median: p.baseline.burstKm.median,
      distanceKm: db === null ? null : round(db),
      intervalScore: isB === null ? null : round(isB),
    },
    exponential: {
      median: p.mixture.exponential.median,
      distanceKm: dx === null ? null : round(dx),
      outcome: expOutcome,
    },
    outcome,
    configurations,
    severeStructural: configurations.some((c) => c.severe),
  };
});

// Rule 1167: the verdict.
const assessable = rows.filter((r): r is AssessedRow => r.assessable);
const strong = assessable.filter((r) => r.kind === 'primary' || r.quality === 'A');
const weight = (r: AssessedRow): number =>
  r.kind === 'proxy' ? FCM_ROUND3.verdict.proxyWeight : 1;
const sumW = (f: (r: AssessedRow) => boolean): number =>
  assessable.filter(f).reduce((a, r) => a + weight(r), 0);
const fav = sumW((r) => r.outcome === 'favourable');
const unfav = sumW((r) => r.outcome === 'unfavourable');
const total = sumW(() => true);
const severeShare =
  assessable.length === 0
    ? 0
    : assessable.filter((r) => r.severeStructural).length / assessable.length;
const severeOnPrimaryA = assessable.some(
  (r) => r.kind === 'primary' && r.quality === 'A' && r.severeStructural
);
const enough =
  assessable.length >= FCM_ROUND3.verdict.minEvents &&
  strong.length >= FCM_ROUND3.verdict.minStrong;
const structuralBlock = severeShare >= FCM_ROUND3.severe.eventShare || severeOnPrimaryA;
const verdict = !enough
  ? 'inconclusive'
  : unfav > fav
    ? 'unfavourable'
    : fav >= FCM_ROUND3.verdict.favourableShare * total && !structuralBlock
      ? 'favourable'
      : 'inconclusive';
const why = !enough
  ? `${String(assessable.length)} assessable event(s), ${String(strong.length)} strong — rule 1167 asks at least ${String(FCM_ROUND3.verdict.minEvents)} and ${String(FCM_ROUND3.verdict.minStrong)}`
  : `weighted favourable ${String(fav)}, unfavourable ${String(unfav)} of ${String(total)}${structuralBlock ? '; a structural failure (rules 1166, 1169)' : ''}`;

const out = {
  rule: '1168 (e)',
  verdict,
  why,
  assessable: assessable.length,
  strong: strong.length,
  rows,
};
writeFileSync('src/physics/validation/fcmRound3Verdict.json', `${JSON.stringify(out, null, 1)}\n`);

const lines = [
  '# FCM round 3 — the verdict',
  '',
  'Rule 1168 (e): computed by `scripts/fcm-round3-verdict.ts` from the predictions pushed before any target',
  '(`fcmRound3Predictions.json`, 361dfa4) and the targets extracted after (`fcmRound3Targets.ts`). It judges the',
  'altitude of the atmospheric release and nothing else (rule 1167 (c)).',
  '',
  `**Verdict: ${verdict}** — ${why}.`,
  '',
  '## Assessable events',
  '',
  ...assessable.flatMap((r) => [
    `### ${r.event} (${r.kind}, quality ${r.quality})`,
    '',
    `Observed interval ${String(r.interval[0])}–${String(r.interval[1])} km. The branch’s mixture: median ${String(r.branch.median)} km, ${String(r.branch.distanceKm)} km from the interval, interval score ${String(r.branch.intervalScore)}. The baseline: median ${String(r.baseline.median)} km, ${String(r.baseline.distanceKm)} km away, interval score ${String(r.baseline.intervalScore)}. Under the exponential atmosphere the branch's median is ${String(r.exponential.median)} km (${String(r.exponential.distanceKm)} km away, ${r.exponential.outcome}). **Outcome: ${r.outcome}.**`,
    '',
    '| Configuration | median (km) | distance (km) | produced | not robust | severe failure |',
    '| --- | --- | --- | --- | --- | --- |',
    ...r.configurations.map(
      (c) =>
        `| ${c.configuration} | ${String(c.medianKm)} | ${String(c.distanceKm)} | ${String(c.producedShare)} | ${String(c.notRobustShare)} | ${c.severe ? '**yes**' : 'no'} |`
    ),
    '',
  ]),
  '## Not assessable, reported as diagnostics',
  '',
  ...rows
    .filter((r): r is DiagRow => !r.assessable)
    .flatMap((r) => [
      `- **${r.event}** — ${r.reason}.${
        Object.keys(r.diagnostics).length > 0
          ? ` Against Jenniskens (2026)’s heights, not judged: ${Object.entries(r.diagnostics)
              .map(
                ([k, d]) =>
                  `${k} ${String(d.heightKm)} km — the branch ${d.branchMinusKm === null ? '—' : `${d.branchMinusKm > 0 ? '+' : ''}${String(d.branchMinusKm)} km`}, the baseline ${d.baselineMinusKm === null ? '— (no burst)' : `${d.baselineMinusKm > 0 ? '+' : ''}${String(d.baselineMinusKm)} km`}`
              )
              .join('; ')}.`
          : ''
      }`,
    ]),
  '',
];
writeFileSync('docs/FCM_ROUND3_VERDICT.md', lines.join('\n'));
console.log(JSON.stringify({ verdict, why }, null, 1));
