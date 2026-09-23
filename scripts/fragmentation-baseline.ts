/**
 * Step 2 of the round on fragmentation (rules 978 to 986,
 * src/physics/validation/fragmentationRoundRules.ts): the baseline's metrics
 * on every development case — version 2, as rules 982 to 986 rectify it; the
 * first version is kept in fragmentationBaseline.v1.json.
 *
 *   pnpm exec tsx scripts/fragmentation-baseline.ts
 *
 * Runs today's model on the draws rule 978 names, reads each metric as rules
 * 979, 983 and 984 say against the table of rules 980 and 986, and writes
 * src/physics/validation/fragmentationBaseline.json and
 * docs/FRAGMENTATION_DEV_TABLE.md. Deterministic: no clock, no randomness but
 * the seeds'.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_CASES, type DevRow } from '../src/physics/validation/fragmentationDevTable.js';
import { firstEventPressures, row, runDevCases, type Band } from './fragmentationRun.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', 'fragmentationBaseline.json');
const OUT_MD = join(ROOT, 'docs', 'FRAGMENTATION_DEV_TABLE.md');

// Rules 836, 837 and 859: the engine every level B round ran on.
const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

const { cases, summary } = runDevCases();

const out = {
  protocol: 'rules 959 to 986, src/physics/validation/fragmentationRoundRules.ts',
  version: 2,
  rectifies: 'fragmentationBaseline.v1.json (b1bf097), by rules 982 to 986',
  model: 'the baseline of rule 960: the product as it stands after ae80c5d',
  engine: { node: process.version, platform },
  cases,
  summary,
};
writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`);

// The table for the reviewer.
const km = (x: number): string => (x / 1_000).toFixed(1);
const pct = (x: number): string => `${(x * 100).toFixed(1)} %`;
const cell = (s: string): string => s.replace(/\|/g, '\\|');
const observed = (r: DevRow): string =>
  r.observed.kind === 'altitude'
    ? `${km(r.observed.lowM)}–${km(r.observed.highM)} km`
    : r.observed.kind === 'outcome'
      ? r.observed.reachesGround
        ? 'reaches the ground'
        : 'does not reach the ground'
      : '—';
const quality = (r: DevRow): string =>
  r.quality === null
    ? '—'
    : { direct: 'direct', reconstructed: 'reconstructed', modelDependent: 'model-dependent' }[
        r.quality
      ];
const lines: string[] = [
  '# The development table of the round on fragmentation',
  '',
  'Version 2, rectified before P by rules 982 to 986; version 1 (b1bf097) is kept in',
  '`docs/FRAGMENTATION_DEV_TABLE.v1.md` and `fragmentationBaseline.v1.json`. Step 2 of the round',
  '(rules 959 to 986, `src/physics/validation/fragmentationRoundRules.ts`), written by',
  "`scripts/fragmentation-baseline.ts` from `fragmentationDevTable.ts` (the targets) and today's",
  'model (the baseline of rule 960), on the draws of rule 978, unchanged. After P runs only',
  'columns are added (rule 977). m2 is a proxy: the brightest flare is not the largest release',
  'of energy (rule 974).',
  '',
  '## What the rectification changed',
  '',
  '| | Version 1 (rule 979) | Version 2 (rules 983 to 986) |',
  '| --- | --- | --- |',
  "| m1 | the first stage's altitude over all draws, 0 where the model produces none | the probability of a first stage, and its altitude over the draws that have one; not applicable where no draw has one (2008 TC3, whose single breakup is diagnostic) |",
  '| m2 | the burst altitude over all draws, 0 where the body or swarm reaches the ground | the probability of a burst in the air, and its altitude over the draws that burst |',
  '| Credit | a mean miss falling by 1 km | the same, read case by case over the cases with an altitude on both sides; a gain counts only where the variant does not lower the probability of the event (rule 985) |',
  '| Counted, m1 | 2008 TC3, 2018 LA, 2023 CX1, 2024 BX1 | 2018 LA, 2023 CX1, 2024 BX1 |',
  '| Counted, m2 | 2008 TC3, 2018 LA, 2022 EB5, 2023 CX1, 2024 BX1, 2022 WJ1 | unchanged |',
  '| Counted, m3 | the same, less 2022 EB5, plus Carancas, Chelyabinsk, Tunguska | Carancas diagnostic: its entry runs to sea level, the site lies at about 3 800 m (rule 986) |',
  '| m4 | counted nowhere | unchanged |',
  '',
  '## Targets',
  '',
  '| Case | Role | Metric | Observed | Source and place | Quality of the target | Counted for adoption? |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
for (const { case: c, role } of DEV_CASES)
  for (const metric of ['m1', 'm2', 'm3', 'm4'] as const) {
    const r = row(c, metric);
    lines.push(
      `| ${c} | ${role} | ${metric} | ${observed(r)} | ${cell(r.source === '' ? '—' : `${r.source}: ${r.where}`)} | ${quality(r)} | ${r.counted ? 'yes' : 'no'} — ${cell(r.reason)} |`
    );
  }
lines.push(
  '',
  '## The baseline',
  '',
  'm1 and m2: the probability of the event, then the median of its altitude over the draws in',
  'which it happens, with the 5 %–95 % band, and the distance from that median to the observed',
  'interval. m3: the probability the model gives the observed outcome. m4: the median share of the',
  'energy that reaches the ground. An uncounted metric is shown in brackets.',
  '',
  '| Case | Draws | m1 p(first stage) | m1 altitude (km) | m1 miss (km) | m2 p(burst) | m2 burst altitude, proxy (km) | m2 miss (km) | m3 p(observed) | m4 energy to the ground | Regimes | Crater states | Diagnostic: altitude of the single breakup (km) |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
);
const bandKm = (b: Band | null): string =>
  b === null ? '—' : `${km(b.median)} [${km(b.p5)}–${km(b.p95)}]`;
const wrap = (s: string, counted: boolean): string => (counted ? s : `(${s})`);
const shareText = (x: Record<string, number>): string =>
  Object.entries(x)
    .map(([k, v]) => `${k} ${pct(v)}`)
    .join(', ');
for (const c of cases) {
  lines.push(
    `| ${c.case} | ${c.drawn} | ${wrap(pct(c.m1.pFirstStage), c.m1.counted)} | ${wrap(bandKm(c.m1.altitude), c.m1.counted)} | ${c.m1.miss === null ? '—' : wrap(km(c.m1.miss), c.m1.counted)} | ${wrap(pct(c.m2.pBurst), c.m2.counted)} | ${wrap(bandKm(c.m2.altitude), c.m2.counted)} | ${c.m2.miss === null ? '—' : wrap(km(c.m2.miss), c.m2.counted)} | ${c.m3.observedOutcome === null ? `— (reaches ${pct(c.m3.reachesGround)})` : wrap(pct(c.m3.observedOutcome), c.m3.counted)} | ${wrap(`${c.m4.median.toPrecision(3)} [${c.m4.p5.toPrecision(3)}–${c.m4.p95.toPrecision(3)}]`, c.m4.counted)} | ${shareText(c.regimes)} | ${shareText(c.craterStates)} | ${bandKm(c.diagnostic.singleBreakup)} |`
  );
}
lines.push(
  '',
  '## What a variant is measured against',
  '',
  `- m1: the mean miss of the first stage's conditional altitude over ${summary.m1Cases.join(', ')}: ${summary.m1MeanMissM === null ? '—' : `${km(summary.m1MeanMissM)} km`}. A variant improves it when the mean credited fall of the miss is 1 km or more (rule 985).`,
  `- m2: the mean miss of the conditional burst altitude over ${summary.m2Cases.join(', ')}: ${summary.m2MeanMissM === null ? '—' : `${km(summary.m2MeanMissM)} km`}. The same bar and the same credit.`,
  `- m3: the mean probability of the observed outcome over ${summary.m3Cases.join(', ')}: ${summary.m3MeanObservedOutcome === null ? '—' : pct(summary.m3MeanObservedOutcome)}. A variant improves it when the mean of Δp is 0.10 or more (rule 975).`,
  '- m4: counted on no case; in this round a variant must improve two of m1 to m3.',
  `- The outcomes already right (rule 964 (b)), which a variant must keep at 90 % or more: ${summary.rightOutcomes.length === 0 ? 'none' : summary.rightOutcomes.join(', ')}.`,
  ''
);
// Rules 1010 and 1012, added after P's run as columns only (rule 977).
lines.push(
  '## Amendments of rules 1009 to 1014',
  '',
  '- m3 of this version is unfit for decision (rule 1010, B-127): it codes the observed falls in dark flight as not reaching the ground while it reads a whole body at its terminal speed as reaching it. It stays published above, as it is.',
  "- m1 is not applicable as a test of S1 for 2023 CX1 and 2018 LA; 2024 BX1, an aubrite, is diagnostic (rule 1012). The first observed events, their phase not identified, at the pressure the model's atmosphere gives them at the nominal inputs:",
  '',
  "| Case | First observed event (km) | Pressure on the model's atmosphere (MPa) | Phase |",
  '| --- | --- | --- | --- |',
  ...firstEventPressures().map(
    (e) =>
      `| ${e.case} | ${(e.altitudeM / 1_000).toFixed(1)} | ${(e.pressurePa / 1e6).toFixed(2)} | not identified |`
  ),
  ''
);
writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
