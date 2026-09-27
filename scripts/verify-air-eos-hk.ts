/**
 * Rules 1308 (d)(2) and 1321 (`src/physics/validation/blastSolverRules.ts`):
 * the real-air module (`src/physics/solvers/blast2d/airEos.ts`, RP-1181's
 * fits) against Hilsenrath & Klein's tables (1965), independent of the fits'
 * own source: p(e, ρ) at 49 points, T = 2 000 … 14 000 K and
 * log₁₀(ρ/ρ₀) = −5 … 1, within 5 % everywhere and 2 % in the median; a point
 * the module refuses counts as a failure.
 *
 *   pnpm exec tsx scripts/verify-air-eos-hk.ts
 *
 * Writes src/physics/validation/verifyAirEosHK.json.
 */

import { writeFileSync } from 'node:fs';
import { airPressure } from '../src/physics/solvers/blast2d/airEos.js';
import table from '../src/physics/validation/hilsenrathKlein49.json';

const {
  R_cal_per_mol_K: rCal,
  M_g_per_mol: m,
  calorie_J: cal,
  rho0_kg_per_m3: rho0,
} = table.constants;
/** R/M in J/(kg K). */
const R = (rCal / m) * cal * 1000;

/** A number as the tables print it: mantissa and a signed exponent. */
function read(s: string | null | undefined): number {
  const t = (s ?? '').replace(/\s/g, '');
  const match = /^([-+]?\d*\.?\d+)([-+]\d+)$/.exec(t);
  return match === null ? Number(t) : Number(match[1]) * 10 ** Number(match[2]);
}

interface Row {
  T: number;
  logRho: number;
  pTable: number;
  pModule: number | null;
  off: number | null;
}
const rows: Row[] = table.points.map((pt) => {
  const values = pt.values as Record<string, string | null>;
  const rho = rho0 * 10 ** pt.logRho;
  const e = read(values['E/RT']) * R * pt.T;
  const pTable = read(values.Z) * rho * R * pt.T;
  let pModule: number | null = null;
  try {
    pModule = airPressure(e, rho);
  } catch {
    pModule = null;
  }
  return {
    T: pt.T,
    logRho: pt.logRho,
    pTable,
    pModule,
    off: pModule === null ? null : pModule / pTable - 1,
  };
});
const offs = rows.map((r) => (r.off === null ? Infinity : Math.abs(r.off))).sort((a, b) => a - b);
const median = offs[Math.floor(offs.length / 2)] ?? NaN;
const worst = offs[offs.length - 1] ?? NaN;
const refused = rows.filter((r) => r.pModule === null).length;
for (const r of rows)
  console.log(
    `T ${String(r.T)} K, log ρ/ρ₀ ${String(r.logRho)}: table ${r.pTable.toPrecision(5)} Pa, module ${r.pModule === null ? 'refused' : r.pModule.toPrecision(5)} (${r.off === null ? '—' : (r.off * 100).toFixed(2)} %)`
  );
const passes = worst <= 0.05 && median <= 0.02;
console.log(
  `worst ${(worst * 100).toFixed(2)} %, median ${(median * 100).toFixed(2)} %, refused ${String(refused)} of ${String(rows.length)} — ${passes ? 'PASSES' : 'FAILS'}`
);
writeFileSync(
  'src/physics/validation/verifyAirEosHK.json',
  `${JSON.stringify({ rule: '1308 (d)(2), 1321', criteria: { worst: 0.05, median: 0.02 }, R, rows, worst, median, refused, passes }, null, 2)}\n`
);
