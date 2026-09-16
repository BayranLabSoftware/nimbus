import { readFileSync, writeFileSync } from 'node:fs';
import { atmosphericEntry, collinsStrength } from '../../src/physics/effects/atmosphericEntry.js';
import {
  FIREBALL_ANCHOR_SCALE_HEIGHT_M,
  fireballAgreement,
  fireballAnchorVerdict,
  type FireballAnchorRow,
} from '../../src/physics/validation/fireballAnchorRules.js';
import { J, kgPerM3, m, mps, rad } from '../../src/physics/units.js';

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

interface Sent {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
}
interface Fetched {
  date: string;
  sent: Sent;
  error: string | null;
  observedKm: number;
  nimbusBurstKm: number | null;
  eiepBurstKm: number | null;
}

/** BM-13: the model's burst altitude had it broken the body up on twice
 *  Eq. 12's I_f, as the program does. Null where the formula does not apply. */
function onEiepIf(s: Sent, energyJ: number): number | null {
  const H = FIREBALL_ANCHOR_SCALE_HEIGHT_M;
  const v = s.velocityKmS * 1_000;
  const theta = (s.angleDeg * Math.PI) / 180;
  const sinTheta = Math.sin(theta);
  const entry = atmosphericEntry(
    m(s.diameterM),
    mps(v),
    undefined,
    kgPerM3(s.densityKgM3),
    J(energyJ),
    rad(theta)
  );
  const breakupNimbus = entry.breakupAltitude as number;
  if (!(breakupNimbus > 0)) return null;
  const strength = collinsStrength(kgPerM3(s.densityKgM3)) as number;
  const If = (4.07 * 2 * H * strength) / (s.densityKgM3 * s.diameterM * v * v * sinTheta);
  if (!(If > 0) || 1 - 2 * If < 0) return null;
  const breakup =
    breakupNimbus + H * (0.314 * If + 1.303 * (Math.sqrt(1 - 2 * If) - Math.sqrt(1 - If)));
  const spread = s.diameterM * sinTheta * Math.sqrt(s.densityKgM3 / (2 * Math.exp(-breakup / H)));
  const burst = breakup - 2 * H * Math.log(1 + (spread * Math.sqrt(7 * 7 - 1)) / (2 * H));
  return burst > 0 ? burst / 1_000 : null;
}

const path = process.argv[2];
if (path === undefined) {
  console.error('usage: fireball-against-eiep.ts <eiep-fireballs.json> [<out.json>]');
  process.exit(2);
}
const fetched = (JSON.parse(readFileSync(path, 'utf8')) as { rows: Fetched[] }).rows;
const rows: FireballAnchorRow[] = fetched.map((f) => {
  const mass = (Math.PI / 6) * f.sent.densityKgM3 * f.sent.diameterM ** 3;
  const energyJ = 0.5 * mass * (f.sent.velocityKmS * 1_000) ** 2;
  return {
    date: f.date,
    observedKm: f.observedKm,
    nimbusBurstKm: f.nimbusBurstKm,
    eiepBurstKm: f.eiepBurstKm,
    eiepError: f.error,
    nimbusOnEiepIfKm: onEiepIf(f.sent, energyJ),
  };
});
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
