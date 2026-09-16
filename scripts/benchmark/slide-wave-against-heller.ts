import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * L2 as the amendment of 16 September 2026 to docs/GOLD_STANDARD.md reads it:
 * the model against the field's own method — Heller, Hager & Minor 2009 — on
 * the same held-out landslides and against the same record, like for like.
 *
 * **It runs nothing.** Rule 125 closed the set of rules 118 to 125 to further
 * readings of the model, so this is arithmetic on the per-row outputs those
 * rules already committed in `benchmark/results/slide-wave-2026-09-16-1.json`:
 * Heller's first crest and the project law's source amplitude, both
 * amplitudes, each against the catalogue's heights. A height against an
 * amplitude is the mistake that made an earlier claim of this project wrong —
 * that the law in place stood nearer the record than Heller — and it is not
 * repeated here.
 *
 * The model meets the re-anchored bound when, on the same rows, its bias is no
 * further from one than the reference's and its σ_ln no larger.
 *
 *   pnpm exec tsx scripts/benchmark/slide-wave-against-heller.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULT = join(ROOT, 'benchmark', 'results', 'slide-wave-2026-09-16-1.json');

interface Row {
  hellerCrestM: number;
  projectSubaerialM: number;
  peakM: number;
  runUpM: number;
  recordM: number;
}

function reading(pairs: readonly (readonly [number, number])[]): {
  n: number;
  bias: number;
  sigmaLn: number;
} {
  const logs = pairs.filter(([m, r]) => m > 0 && r > 0).map(([m, r]) => Math.log(m / r));
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance = logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1);
  return { n: logs.length, bias: Math.exp(mean), sigmaLn: Math.sqrt(variance) };
}

const rows = (JSON.parse(readFileSync(RESULT, 'utf8')) as { rows: Row[] }).rows;
console.log(`${rows.length.toString()} rows read from ${RESULT}; nothing re-run\n`);

const records: readonly [string, keyof Row, boolean][] = [
  ['Peak height (decides)', 'peakM', true],
  ['Run-up h', 'runUpM', false],
  ['Wave h max', 'recordM', false],
];
for (const [name, key, decides] of records) {
  const same = rows.filter((r) => r.hellerCrestM > 0 && r.projectSubaerialM > 0 && r[key] > 0);
  const h = reading(same.map((r) => [r.hellerCrestM, r[key]] as const));
  const m = reading(same.map((r) => [r.projectSubaerialM, r[key]] as const));
  const closer = Math.abs(Math.log(m.bias)) <= Math.abs(Math.log(h.bias));
  const tighter = m.sigmaLn <= h.sigmaLn;
  console.log(`against ${name}, the same ${same.length.toString()} rows:`);
  console.log(`  Heller (reference)  bias ${h.bias.toFixed(3)}  sigma ${h.sigmaLn.toFixed(3)}`);
  console.log(`  the model           bias ${m.bias.toFixed(3)}  sigma ${m.sigmaLn.toFixed(3)}`);
  console.log(
    `  no further from one: ${String(closer)}   no wider: ${String(tighter)}${decides ? `   → L2 ${closer && tighter ? 'MET' : 'NOT MET'}` : ''}\n`
  );
}
