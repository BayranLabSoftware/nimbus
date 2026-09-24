/**
 * Writes docs/INDEPENDENT_TEST_ELIGIBILITY_V2.md from
 * src/physics/validation/thirdSetSources.ts (rules 1120 to 1124): the third
 * set's table of eligibility under the second version of the judge, before any
 * prediction. Deterministic: no clock.
 *
 *   pnpm exec tsx scripts/third-set-eligibility.ts
 */

import { writeFileSync } from 'node:fs';
import type { LevelBInputValue } from '../src/physics/validation/levelBSources.js';
import {
  THIRD_SET_BODIES,
  THIRD_SET_NOT_ADMITTED,
  THIRD_SET_SOURCES,
  thirdSetCounts,
} from '../src/physics/validation/thirdSetSources.js';

const fmt = (x: number, d = 3): string => String(Number(x.toPrecision(d)));
const interval = (v: LevelBInputValue): string => {
  switch (v.kind) {
    case 'normal':
      return `${fmt(v.mean, 6)} ± ${fmt(v.sigma)}`;
    case 'uniform':
    case 'sin2theta':
      return `${fmt(v.low, 4)}–${fmt(v.high, 4)}`;
    case 'fixed':
      return String(v.value);
  }
};
const yes = (b: boolean): string => (b ? 'yes' : 'no');
const c = thirdSetCounts();

const lines: string[] = [
  '# The third set — table of eligibility, version 2',
  '',
  'Rules 1120–1124, `src/physics/validation/thirdSetSources.ts`, under the second version of the judge',
  '(rules 1100–1119, frozen and pushed before any source was opened). Written on 24 September 2026 by',
  '`scripts/third-set-eligibility.ts`. **No model has been run on these bodies; the predictions are not',
  'authorized** — this table is the reviewer’s next point of review. No class B can come from this set.',
  '',
  '## Sources read (rule 1120)',
  '',
  ...THIRD_SET_SOURCES.map((s) => `- ${s.citation}. Copy: ${s.copy}.`),
  '',
  '## Admission (rule 1122)',
  '',
  `Admitted as entry bodies: ${THIRD_SET_BODIES.map((b) => b.event).join(', ')}.`,
  '',
  ...THIRD_SET_NOT_ADMITTED.map((b) => `- **${b.event}, not admitted**: ${b.why}.`),
  '',
  '## Eligibility, observable by observable (rule 1123)',
  '',
  '| Body | Type | Read as | O1: interval (km) | O2 (diagnostic): largest, class | O3 | D1 recovery | D2 no crater | J regime |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...THIRD_SET_BODIES.map(
    (b) =>
      `| ${b.event} | ${b.type} | ${b.reading === 'counted' ? 'counted' : 'control (rule 1041)'} | ${b.o1.eligible ? `${fmt(b.o1.intervalKm[0], 5)}–${fmt(b.o1.intervalKm[1], 5)}` : `not counted (${fmt(b.o1.intervalKm[0], 5)}–${fmt(b.o1.intervalKm[1], 5)})`} | ${fmt(b.o2.largestKg * 1000, 4)} g, ${b.o2.class === 'lowerBound' ? 'lower bound' : 'measured'} | ${yes(b.o3.eligible)} | ${yes(b.ground.recovery.eligible)} | ${yes(b.ground.noCrater.eligible)} | ${yes(b.ground.regime.eligible)} |`
  ),
  '',
  `Counts in the priors’ domain (${String(c.counted)} bodies): O1 ${String(c.o1)}; D1 ${String(c.recovery)}; D2 documented ${String(c.noCrater)}; J ${String(c.regime)} — not admissible, so D1 decides (rules 1108 (d), 1119 (c)); O3 ${String(c.o3)} — diagnostic; O2 diagnostic (rule 1114); O4 not assessable. O1 and the ground outcome are each assessable on ${String(Math.min(c.o1, c.recovery))} bodies: S can be judged under rule 1115; F cannot be adopted in this round.`,
  '',
  '### Why, cell by cell',
  '',
];
for (const b of THIRD_SET_BODIES) {
  lines.push(
    `**${b.event}.**`,
    `O1 — ${b.o1.why}; ${b.o1.where}. All flares given: ${b.o1.flaresKm.map((z) => `${fmt(z, 5)} km`).join(', ')}.`,
    `O2 — ${b.o2.where}. O3 — ${b.o3.why}.`,
    `D1 — ${b.ground.recovery.why}. D2 — ${b.ground.noCrater.why}. J — ${b.ground.regime.why}.`,
    ...(b.recorded ?? []).map((r) => `Recorded — ${r}.`),
    ''
  );
}
lines.push(
  '## Inputs pinned (rules 866, 1121)',
  '',
  '| Body | Speed (km/s) | Angle from the horizontal (°) | Diameter (m) | Density (kg/m³) | Size leans on a target |',
  '| --- | --- | --- | --- | --- | --- |',
  ...THIRD_SET_BODIES.map(
    (b) =>
      `| ${b.event} | ${interval(b.inputs.velocity.value)} | ${interval(b.inputs.angle.value)} | ${interval(b.inputs.diameter.value)} | ${interval(b.inputs.density.value)} | ${b.inputs.diameter.dependsOnTarget ? 'yes — stress run ×3 in mass, never scored' : 'no'} |`
  ),
  '',
  'A value with ± is a normal of that σ; a range is uniform. Where each comes from:',
  '',
  ...THIRD_SET_BODIES.flatMap((b) => [
    `- **${b.event}**: speed — ${b.inputs.velocity.where}; angle — ${b.inputs.angle.where}; diameter — ${b.inputs.diameter.where}${b.inputs.diameter.note === undefined ? '' : ` (${b.inputs.diameter.note})`}; density — ${b.inputs.density.where}. The ground’s density is the model’s crustal rock, 2700 kg/m³ (rule 873).`,
  ]),
  '',
  '## Put to the reviewer',
  '',
  '- Rule 1121’s six conventions were written after the sources were read and before any model ran on',
  '  them; none was chosen on a model’s output.',
  '- Cavezzo is classified «L5 anomalous»: read as an ordinary chondrite of the L group and counted.',
  '- Golden’s roof and bed document a trace of the arrival, but the source does not read it as an arrival',
  '  at terminal speed: J is not admitted for it.',
  '- O1’s interval spans the flares each source names as principal: for Golden the main flare near 30–31',
  '  km and the one at 34 km (45 km, «less certain», left out); for Traspena the three of intensity 1.0.',
  '- Madura Cave’s density was not measured: the interval spans the 3500 kg/m³ the source assumes and the',
  '  2800 its particle filter gives.',
  ''
);
writeFileSync('docs/INDEPENDENT_TEST_ELIGIBILITY_V2.md', lines.join('\n'));
console.log('Wrote docs/INDEPENDENT_TEST_ELIGIBILITY_V2.md');
