import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIREBALL_BODIES } from '../../src/physics/validation/fireballRules.js';
import type { FireballReading } from '../../src/physics/validation/fireballRules.js';
import { runFireball } from '../../src/physics/validation/fireballRun.js';

/**
 * Rules 76 to 79 of src/physics/validation/fireballRules.ts, run once and
 * printed: the entry model's burst altitude against the altitude of peak
 * brightness the sensors measured, for every bolide of rule 76's set.
 *
 *   pnpm exec tsx scripts/benchmark/fireball.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runFireball();
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));
const text = (r: FireballReading): string =>
  `${r.rows.toString()} bolides, ${r.burst.toString()} burst in the air and ${r.toTheGround.toString()} brought to the ground; median |Δh| ${f(r.medianAbsoluteErrorKm)} km, mean Δh ${f(r.meanErrorKm)} km, within 5 km ${r.withinFiveKm.toString()} of ${r.burst.toString()}`;

console.log(
  `rule 76: ${run.events.bolides.toString()} bolides (${run.events.byEnergy.join(' / ')} by energy, ${run.events.fast.toString()} from 17 km/s)`
);
for (const body of FIREBALL_BODIES) {
  const reading = run.readings[body.key];
  if (reading === undefined) continue;
  console.log(`rule 78 ${body.key}: ${text(reading)}`);
  for (const cell of run.cells[body.key] ?? []) {
    console.log(`         ${cell.label}: ${text(cell.reading)}`);
  }
}
console.log('rule 79: meets the bar of I2:', run.meetsBar);
console.log(`\n${((Date.now() - started) / 1000).toFixed(1)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
