/**
 * A variant of the round on fragmentation, run once on the development
 * table's draws (rules 995 and 1000, src/physics/validation/
 * fragmentationRoundRules.ts):
 *
 *   pnpm exec tsx scripts/fragmentation-variant.ts P
 *
 * Runs the development cases with the variant's switches, reads them beside
 * the committed baseline (fragmentationBaseline.json) and scores them with
 * fragmentationScore.ts; writes fragmentationVariant<P>.json and
 * docs/FRAGMENTATION_VARIANT_<P>.md. Deterministic: no clock, no randomness
 * but the seeds'.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { scoreVariant, type ScoreRun } from '../src/physics/validation/fragmentationScore.js';
import { runDevCases, type Band } from './fragmentationRun.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Rule 960: the variants, by their switches. */
const VARIANTS: Record<string, { switches: Partial<ImpactScenarioInput>; what: string }> = {
  P: {
    switches: { pancakeGrowth: 'eq14' },
    what: "the pancake as Collins et al.'s Eq. 14 solved, in place of Eq. 15* (rules 992 to 1000)",
  },
};

const name = process.argv[2] ?? '';
const variant = VARIANTS[name];
if (variant === undefined) {
  console.error(`Usage: tsx scripts/fragmentation-variant.ts <${Object.keys(VARIANTS).join('|')}>`);
  process.exit(2);
}
const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

const baselinePath = join(ROOT, 'src', 'physics', 'validation', 'fragmentationBaseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as ScoreRun & {
  cases: ReturnType<typeof runDevCases>['cases'];
};
const run = runDevCases(variant.switches);
const verdict = scoreVariant(baseline, run);

const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', `fragmentationVariant${name}.json`);
const OUT_MD = join(ROOT, 'docs', `FRAGMENTATION_VARIANT_${name}.md`);
writeFileSync(
  OUT_JSON,
  `${JSON.stringify(
    {
      protocol: 'rules 959 to 1000, src/physics/validation/fragmentationRoundRules.ts',
      variant: name,
      what: variant.what,
      switches: variant.switches,
      baseline: 'fragmentationBaseline.json, version 2 (09bae54)',
      engine: { node: process.version, platform },
      cases: run.cases,
      summary: run.summary,
      verdict,
    },
    null,
    2
  )}\n`
);

const km = (x: number): string => (x / 1_000).toFixed(1);
const pct = (x: number): string => `${(x * 100).toFixed(1)} %`;
const bandKm = (b: Band | null): string =>
  b === null ? '—' : `${km(b.median)} [${km(b.p5)}–${km(b.p95)}]`;
const shareText = (x: Record<string, number>): string =>
  Object.entries(x)
    .map(([k, v]) => `${k} ${pct(v)}`)
    .join(', ');
const lines: string[] = [
  `# Variant ${name} of the round on fragmentation`,
  '',
  `${variant.what}. Run once on the draws of rule 978, beside the baseline of the development`,
  'table, version 2 (`docs/FRAGMENTATION_DEV_TABLE.md`); scored by',
  '`src/physics/validation/fragmentationScore.ts`, pushed before the run. Written by',
  '`scripts/fragmentation-variant.ts`. An uncounted metric is in brackets; m2 is a proxy.',
  '',
  '## Case by case',
  '',
  '| Case | Run | m1 p(first stage) | m1 altitude (km) | m1 miss (km) | m2 p(burst) | m2 burst altitude (km) | m2 miss (km) | m3 p(observed) | m4 energy to the ground | Regimes | Crater states |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];
const wrap = (s: string, counted: boolean): string => (counted ? s : `(${s})`);
for (const [i, v] of run.cases.entries()) {
  const b = baseline.cases[i];
  for (const [label, c] of [
    ['baseline', b],
    [name, v],
  ] as const) {
    if (c === undefined) continue;
    lines.push(
      `| ${label === 'baseline' ? c.case : ''} | ${label} | ${wrap(pct(c.m1.pFirstStage), c.m1.counted)} | ${wrap(bandKm(c.m1.altitude), c.m1.counted)} | ${c.m1.miss === null ? '—' : wrap(km(c.m1.miss), c.m1.counted)} | ${wrap(pct(c.m2.pBurst), c.m2.counted)} | ${wrap(bandKm(c.m2.altitude), c.m2.counted)} | ${c.m2.miss === null ? '—' : wrap(km(c.m2.miss), c.m2.counted)} | ${c.m3.observedOutcome === null ? `— (reaches ${pct(c.m3.reachesGround)})` : wrap(pct(c.m3.observedOutcome), c.m3.counted)} | ${wrap(`${c.m4.median.toPrecision(3)} [${c.m4.p5.toPrecision(3)}–${c.m4.p95.toPrecision(3)}]`, c.m4.counted)} | ${shareText(c.regimes)} | ${shareText(c.craterStates)} |`
    );
  }
}
const credit = (c: { case: string; change: number; credited: number; why: string }): string =>
  `${c.case}: ${km(c.change)} km, credited ${km(c.credited)} (${c.why})`;
lines.push(
  '',
  '## The verdict (rules 964, 975, 976, 985, 1000)',
  '',
  `- m1: ${verdict.m1.credits.map(credit).join('; ') || 'no case'}${verdict.m1.apart.length > 0 ? `; apart: ${verdict.m1.apart.join(', ')}` : ''} — mean credited ${verdict.m1.meanCredited === null ? '—' : `${km(verdict.m1.meanCredited)} km`}: ${verdict.m1.improved ? 'improved' : 'not improved'}.`,
  `- m2: ${verdict.m2.credits.map(credit).join('; ') || 'no case'}${verdict.m2.apart.length > 0 ? `; apart: ${verdict.m2.apart.join(', ')}` : ''} — mean credited ${verdict.m2.meanCredited === null ? '—' : `${km(verdict.m2.meanCredited)} km`}: ${verdict.m2.improved ? 'improved' : 'not improved'}.`,
  `- m3: ${verdict.m3.gains.map((g) => `${g.case} ${g.gain >= 0 ? '+' : ''}${g.gain.toFixed(3)}`).join('; ')} — mean Δp ${verdict.m3.meanGain === null ? '—' : verdict.m3.meanGain.toFixed(3)}: ${verdict.m3.improved ? 'improved' : 'not improved'}.`,
  '- m4: counted on no case.',
  `- The outcomes already right: ${verdict.rightKept.map((r) => `${r.case} ${pct(r.baseline)} → ${pct(r.variant)}${r.kept ? '' : ' LOST'}`).join('; ')}.`,
  `- Metrics improved: ${String(verdict.improvedCount)} of the two needed. Rule 964 (a) to (c): ${verdict.holds ? 'HOLD — (d) is run next' : 'DO NOT HOLD — the variant is refused'}.`,
  ''
);
writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
console.log(
  `Verdict: ${verdict.holds ? 'holds' : 'does not hold'} (${String(verdict.improvedCount)} improved)`
);
