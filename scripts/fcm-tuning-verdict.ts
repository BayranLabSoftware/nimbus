/**
 * Rule 1160 (d) (src/physics/validation/fcmRound1Rules.ts): the registered
 * tuning's choice, read from the untuned development runs and the two
 * candidates' — src/physics/validation/fcmDevRuns.json, fcmDevRuns.T1.json,
 * fcmDevRuns.T2.json — and written to src/physics/validation/fcmTuning.json and
 * docs/FCM_TUNING.md.
 *
 *   pnpm exec tsx scripts/fcm-tuning-verdict.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { FCM_TUNING } from '../src/physics/validation/fcmRound1Rules.js';

interface Configuration {
  configuration: string;
  landedKg: { median: number | null; p95: number | null };
  judgement: { mainFlare: { verdict: string } };
}
interface Runs {
  results: { case: string; configurations: Configuration[] }[];
}

const read = (path: string): Runs => JSON.parse(readFileSync(path, 'utf8')) as Runs;
const untuned = read('src/physics/validation/fcmDevRuns.json');
const candidates = (['T1', 'T2'] as const).map((name) => ({
  name,
  runs: read(`src/physics/validation/fcmDevRuns.${name}.json`),
}));

const RANK: Record<string, number> = {
  favourable: 2,
  equal: 1,
  unfavourable: 0,
  'not assessable': -1,
};
const configurations = untuned.results[0]?.configurations.map((c) => c.configuration) ?? [];
const landed = (runs: Runs, name: string, conf: string): number | null =>
  runs.results.find((r) => r.case === name)?.configurations.find((c) => c.configuration === conf)
    ?.landedKg.median ?? null;

const assessed = candidates.map(({ name, runs }) => {
  const rows = configurations.map((conf) => {
    // (a) both medians inside the objective.
    const objective = Object.entries(FCM_TUNING.objective).map(([event, [lo, hi]]) => {
      const x = landed(runs, event, conf);
      return { event, landedKg: x, inside: x !== null && x >= lo && x <= hi };
    });
    // (b) no case's main flare worse than untuned.
    const worse = runs.results.flatMap((r) => {
      const t = r.configurations.find((c) => c.configuration === conf);
      const u = untuned.results
        .find((x) => x.case === r.case)
        ?.configurations.find((c) => c.configuration === conf);
      if (t === undefined || u === undefined) return [];
      const a = RANK[u.judgement.mainFlare.verdict] ?? -1;
      const b = RANK[t.judgement.mainFlare.verdict] ?? -1;
      return a >= 0 && b < a
        ? [`${r.case} (${u.judgement.mainFlare.verdict} to ${t.judgement.mainFlare.verdict})`]
        : [];
    });
    return {
      configuration: conf,
      objective,
      meetsObjective: objective.every((o) => o.inside),
      mainFlareWorse: worse,
      meets: objective.every((o) => o.inside) && worse.length === 0,
    };
  });
  return { name, rows, configurationsMet: rows.filter((r) => r.meets).length };
});

// (d) the most configurations met, T1 on a tie; none, the untuned priors stay.
const best = [...assessed].sort((a, b) => b.configurationsMet - a.configurationsMet)[0];
const chosen = best !== undefined && best.configurationsMet > 0 ? best.name : null;

const untunedLanded = Object.keys(FCM_TUNING.objective).map((event) => ({
  event,
  byConfiguration: configurations.map((conf) => ({ conf, landedKg: landed(untuned, event, conf) })),
}));

writeFileSync(
  'src/physics/validation/fcmTuning.json',
  `${JSON.stringify({ rule: '1160', objective: FCM_TUNING.objective, candidates: FCM_TUNING.candidates, untunedLanded, assessed, chosen }, null, 1)}\n`
);

const kg = (x: number | null): string => (x === null ? '—' : `${String(Math.round(x))} kg`);
const lines = [
  '# FCM round 1 — the registered tuning (rule 1160)',
  '',
  'Rule 1160 (`src/physics/validation/fcmRound1Rules.ts`), written after the untuned development runs and',
  'before any tuned one; read by `scripts/fcm-tuning-verdict.ts` from the three runs. The objective: the median',
  'landed mass of Chelyabinsk within 1 667–15 000 kg and of Tagish Lake within 60–1 300 kg, in the same',
  'configuration; the constraint: no case’s main flare worse than untuned. T1: the cloud share on 0.5–0.85;',
  'T2: the same and α on 0.05–0.3.',
  '',
  '| Configuration | Untuned: Chelyabinsk · Tagish Lake | T1: Chelyabinsk · Tagish Lake | T1 meets | T2: Chelyabinsk · Tagish Lake | T2 meets |',
  '| --- | --- | --- | --- | --- | --- |',
  ...configurations.map((conf, i) => {
    const u = untunedLanded.map((e) => kg(e.byConfiguration[i]?.landedKg ?? null)).join(' · ');
    const cells = assessed.map((a) => {
      const r = a.rows[i];
      if (r === undefined) return '— | —';
      const words = r.objective.map((o) => `${kg(o.landedKg)}${o.inside ? '' : ' ✗'}`).join(' · ');
      return `${words} | ${r.meets ? 'yes' : '**no**'}${r.mainFlareWorse.length > 0 ? ` (main flare worse: ${r.mainFlareWorse.join(', ')})` : ''}`;
    });
    return `| ${conf} | ${u} | ${cells.join(' | ')} |`;
  }),
  '',
  chosen === null
    ? `Neither candidate meets the objective in any configuration. By rule 1160 (d) the untuned priors stay, the ground outcome is declared **not credible in mass**, and the proposal limits the claim to the atmosphere. Both candidates are kept as the record of what was tried. The main flare: ${
        assessed.some((a) => a.rows.some((r) => r.mainFlareWorse.length > 0))
          ? `worse than untuned for ${assessed
              .flatMap((a) =>
                a.rows
                  .filter((r) => r.mainFlareWorse.length > 0)
                  .map((r) => `${r.mainFlareWorse.join(', ')} under ${a.name} ${r.configuration}`)
              )
              .join('; ')}; no other case worse`
          : 'unchanged by either'
      }.`
    : `The choice: ${chosen}, meeting the objective in ${String(best?.configurationsMet)} configuration(s).`,
  '',
];
writeFileSync('docs/FCM_TUNING.md', lines.join('\n'));
console.log(JSON.stringify({ chosen, met: assessed.map((a) => [a.name, a.configurationsMet]) }));
