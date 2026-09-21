import { readFileSync, writeFileSync } from 'node:fs';
import {
  burstOnProgramIfKm,
  fireballAgreement,
  fireballAnchorVerdict,
  type FireballAnchorRow,
  type FireballSent,
} from '../../src/physics/validation/fireballAnchorRules.js';

/**
 * Rules 126 to 128 of src/physics/validation/fireballAnchorRules.ts, run on
 * what scripts/eiep-fireballs.py brought back: I2 read against the Earth Impact
 * Effects Program on the same fireballs.
 *
 *   pnpm exec tsx scripts/benchmark/fireball-against-eiep.ts <eiep-fireballs.json> [<out.json>]
 *
 * For each fireball the model's burst altitude is taken as rules 76 to 79
 * committed it, and recomputed on the program's I_f by the formula
 * eiepComparison.test.ts holds to 0.1 % in CI (BM-13).
 */

interface Fetched {
  date: string;
  sent: FireballSent;
  error: string | null;
  observedKm: number;
  nimbusBurstKm: number | null;
  eiepBurstKm: number | null;
}

const path = process.argv[2];
if (path === undefined) {
  console.error('usage: fireball-against-eiep.ts <eiep-fireballs.json> [<out.json>]');
  process.exit(2);
}
const fetched = (JSON.parse(readFileSync(path, 'utf8')) as { rows: Fetched[] }).rows;
const rows: FireballAnchorRow[] = fetched.map((f) => ({
  date: f.date,
  observedKm: f.observedKm,
  nimbusBurstKm: f.nimbusBurstKm,
  eiepBurstKm: f.eiepBurstKm,
  eiepError: f.error,
  nimbusOnEiepIfKm: burstOnProgramIfKm(f.sent),
}));
const v = fireballAnchorVerdict(rows);
console.log(`${rows.length.toString()} fireballs`);
console.log(`  agree within 1 %:          ${v.counts.within.toString()}`);
console.log(`  agree through BM-13:       ${v.counts.bm13.toString()}`);
console.log(`  depart beyond BM-13:       ${v.counts.departs.toString()}`);
console.log(`  burst against ground:      ${v.counts.regime.toString()}`);
console.log(`  refused by the program:    ${v.counts.unanswered.toString()}`);
console.log(`\nover the fireballs both burst in the air:`);
console.log(
  `  the program  median |Δh| ${v.eiep.medianAbsKm.toFixed(2)} km   mean Δh ${v.eiep.meanKm.toFixed(2)} km`
);
console.log(
  `  the model    median |Δh| ${v.nimbus.medianAbsKm.toFixed(2)} km   mean Δh ${v.nimbus.meanKm.toFixed(2)} km`
);
console.log(
  `\nrule 128: the model implements the reference on this set: ${String(v.implementsReference)}`
);
console.log(`          I2, as read against the field: ${v.met ? 'MET' : 'NOT MET'}`);
const worst = rows
  .filter((r) => fireballAgreement(r) === 'departs' || fireballAgreement(r) === 'regime')
  .slice(0, 10);
if (worst.length > 0) {
  console.log('\ndepartures:');
  for (const r of worst) {
    console.log(
      `  ${r.date}  model ${String(r.nimbusBurstKm)}  program ${String(r.eiepBurstKm)}  on program's I_f ${String(r.nimbusOnEiepIfKm)}  (${fireballAgreement(r)})`
    );
  }
}
const out = process.argv[3];
if (out !== undefined) writeFileSync(out, `${JSON.stringify({ verdict: v, rows }, null, 1)}\n`);
