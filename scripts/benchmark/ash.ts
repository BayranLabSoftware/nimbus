import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAsh } from '../../src/physics/validation/ashRun.js';

/**
 * Rules 106 to 109 of src/physics/validation/ashRules.ts, run once and
 * printed: Nimbus's tephra against Tephra2's under the law in place and under
 * the book's own closure, and rule 108's choice.
 *
 *   pnpm exec tsx scripts/benchmark/ash.ts <tephra2 reference.json> [<out.json>]
 *
 * docs/TEPHRA2_SETUP.md says how to make the reference.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const referencePath = process.argv[2];
if (referencePath === undefined) {
  console.error('usage: ash.ts <tephra2 reference.json> [<out.json>]');
  process.exit(2);
}
const run = runAsh(join(ROOT, 'benchmark', 'matrices', 'volcano.json'), referencePath);
const line = (
  name: string,
  r: { pairs: number; bias: number; sigmaLn: number; withinTwo: number }
) =>
  `  ${name.padEnd(22)} n=${r.pairs.toString().padStart(3)}  gm=${r.bias.toFixed(3).padStart(7)}  sigma=${r.sigmaLn.toFixed(3).padStart(6)}  within x2=${(100 * r.withinTwo).toFixed(0).padStart(3)} %`;

console.log(`${run.cases.toString()} eruptions against Tephra2`);
console.log('rule 109:');
console.log(line(`${run.inPlace.law}, axis`, run.inPlace.axis));
console.log(line(`${run.inPlace.law}, across`, run.inPlace.crosswind));
console.log(line(`${run.candidate.law}, axis`, run.candidate.axis));
console.log(line(`${run.candidate.law}, across`, run.candidate.crosswind));
console.log('rule 108:', JSON.stringify(run.decision));
console.log('rule 112:', JSON.stringify(run.decisionAgain));

const out = process.argv[3];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
