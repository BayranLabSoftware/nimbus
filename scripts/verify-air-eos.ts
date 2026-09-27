/**
 * Rule 1308 (d) (`src/physics/validation/blastSolverRules.ts`): the
 * verification of the equation of state of real air
 * (`src/physics/solvers/blast2d/airEos.ts`, RP-1181). (1) The report's own
 * juncture tables 10–12 within the last printed digit; (3) the ideal-gas
 * limit at sea level and 300 K; (4) the jumps of p and a across the energy
 * columns' boundaries below 1 %; (5) a² against the thermodynamic derivative
 * of the p fit within 5 % up to 25 000 K. (2), against Hilsenrath & Klein,
 * runs apart once their tables are transcribed.
 *
 *   pnpm exec tsx scripts/verify-air-eos.ts
 *
 * Writes src/physics/validation/verifyAirEos.json.
 */

import { writeFileSync } from 'node:fs';
import {
  AIR_R,
  AIR_RHO0,
  AIR_T0,
  airPressure,
  airSoundSpeed,
  airTemperature,
  grabau,
  rp1181,
} from '../src/physics/solvers/blast2d/airEos.js';
import table from '../src/physics/solvers/blast2d/airEosRp1181.json';

const { pressureBands, temperatureBands, soundSquared, RT0 } = rp1181;

/** A printed value and the size of its last digit. */
function printed(s: string): { value: number; unit: number } | undefined {
  const t = s.replace(/\s/g, '').replace('−', '-');
  if (t === '' || t === '—' || t === '-') return undefined;
  const m = /^([-+]?\d*\.?\d*)(?:×10\^([-+]?\d+))?$/.exec(t);
  if (m === null) return undefined;
  const mantissa = m[1] ?? '';
  const exponent = Number(m[2] ?? 0);
  const decimals = mantissa.includes('.') ? (mantissa.split('.')[1] ?? '').length : 0;
  return { value: Number(mantissa) * 10 ** exponent, unit: 10 ** (exponent - decimals) };
}

interface Juncture {
  table: string;
  densityRatio: string;
  point: string;
  side: string;
  printed: string;
  computed: number;
  offDigits: number;
}
const junctures: Juncture[] = [];
const spurious: string[] = [];
const letters = ['A', 'B', 'C', 'D', 'E'];
for (const name of ['10', '11', '12'] as const) {
  const t = (
    table.junctures as Record<string, { rows: { densityRatio: string; values: string[] }[] }>
  )[name];
  if (t === undefined) continue;
  for (const row of t.rows) {
    const y = Number(/10\^(-?\d+)/.exec(row.densityRatio)?.[1] ?? NaN);
    const rho = AIR_RHO0 * 10 ** y;
    const bands = name === '12' ? temperatureBands : pressureBands;
    const b = bands.find((bb) => y <= bb.yMax) ?? bands[bands.length - 1];
    if (b === undefined) continue;
    // The junctures: the columns' upper bounds (T: 0.25, below which T = p/ρR, first).
    const bounds =
      name === '12'
        ? [0.25, ...b.columns.slice(0, -1).map((c) => c.zMax ?? NaN)]
        : b.columns.slice(0, -1).map((c) => c.zMax ?? NaN);
    for (let q = 0; q < 5; q++)
      for (const [side, s] of [
        ['lower', 0],
        ['upper', 1],
      ] as const) {
        const text = row.values[2 * q + s] ?? '';
        const want = printed(text);
        if (want === undefined) continue;
        const z = bounds[q];
        if (z === undefined) {
          spurious.push(
            `Table ${name}, ${row.densityRatio}, point ${letters[q] ?? '?'} ${side}: ${text}`
          );
          continue;
        }
        let computed: number;
        if (name === '12') {
          if (q === 0 && s === 0) computed = AIR_T0 * 10 ** z;
          else {
            const c = b.columns[q - 1 + s];
            computed =
              c === undefined ? NaN : AIR_T0 * 10 ** grabau(c.coefficients, c.sign, y, z).f;
          }
        } else {
          const c = b.columns[q + s];
          const e = RT0 * 10 ** z;
          if (c === undefined) computed = NaN;
          else {
            const g = grabau(c.coefficients, c.sign, y, z);
            computed = name === '10' ? rho * e * (g.f - 1) : Math.sqrt(soundSquared(e, g));
          }
        }
        junctures.push({
          table: name,
          densityRatio: row.densityRatio,
          point: letters[q] ?? '?',
          side,
          printed: text,
          computed,
          offDigits: Math.abs(computed - want.value) / want.unit,
        });
      }
  }
}
const missed = junctures.filter((j) => !(j.offDigits <= 1));
console.log(
  `(1) junctures: ${String(junctures.length - missed.length)} of ${String(junctures.length)} within the last printed digit; spurious left out: ${String(spurious.length)}`
);
for (const m of missed)
  console.log(
    `    Table ${m.table} ${m.densityRatio} ${m.point} ${m.side}: printed ${m.printed}, computed ${m.computed.toPrecision(5)} (${m.offDigits.toFixed(1)} digits)`
  );

// (3) The ideal-gas limit: sea level, 300 K, e = RT/(γ − 1).
const eSea = (AIR_R * 300) / 0.4;
const ratio = airPressure(eSea, 1.225) / (1.225 * eSea);
const ideal = Math.abs(ratio / 0.4 - 1);
console.log(
  `(3) p/(ρe) at sea level and 300 K: ${ratio.toFixed(5)} (${(ideal * 100).toFixed(3)} % from 0.4)`
);

// (4) Jumps across the energy columns' boundaries, on Y from −7 to 3.
let jumpP = 0;
let jumpA = 0;
const jumps: string[] = [];
for (const b of pressureBands)
  for (let y = b.yMin; y <= b.yMax + 1e-9; y += 0.25) {
    if (Math.abs(y + 4.5) < 0.03 || Math.abs(y + 0.5) < 0.01) continue;
    for (let q = 0; q + 1 < b.columns.length; q++) {
      const lo = b.columns[q];
      const hi = b.columns[q + 1];
      const z = lo?.zMax ?? NaN;
      if (lo === undefined || hi === undefined) continue;
      const e = RT0 * 10 ** z;
      const gl = grabau(lo.coefficients, lo.sign, y, z);
      const gh = grabau(hi.coefficients, hi.sign, y, z);
      const dp = Math.abs((gh.f - 1) / (gl.f - 1) - 1);
      const da = Math.abs(Math.sqrt(soundSquared(e, gh) / soundSquared(e, gl)) - 1);
      if (dp > jumpP) jumpP = dp;
      if (da > jumpA) jumpA = da;
      if (dp > 0.01 || da > 0.01)
        jumps.push(
          `Y ${y.toFixed(2)}, Z ${z.toFixed(2)}: p ${(dp * 100).toFixed(2)} %, a ${(da * 100).toFixed(2)} %`
        );
    }
  }
console.log(
  `(4) largest jump across a boundary: p ${(jumpP * 100).toFixed(2)} %, a ${(jumpA * 100).toFixed(2)} %; ${String(jumps.length)} above 1 %`
);

// (5) a² against ∂p/∂ρ|ₑ + (p/ρ²)∂p/∂e|_ρ from the p fit, T ≤ 25 000 K.
let worstA = 0;
let worstAt = '';
let points = 0;
for (let y = -6.75; y <= 2.76; y += 0.25)
  for (let z = 0.3; z <= 3.61; z += 0.05) {
    const rho = AIR_RHO0 * 10 ** y;
    const e = RT0 * 10 ** z;
    if (airTemperature(e, rho) > 25_000) continue;
    const h = 1e-5;
    // Only where the finite differences stay within one band and one column.
    const colOf = (yy: number, zz: number): string => {
      const bb = pressureBands.find((x) => yy <= x.yMax) ?? pressureBands[pressureBands.length - 1];
      const i = bb?.columns.findIndex((c) => c.zMax === null || zz <= c.zMax) ?? -1;
      return `${String(bb?.yMax)}:${String(i)}`;
    };
    const here = colOf(y, z);
    const dy = Math.log10(1 + h);
    if (
      Math.abs(y + 4.5) < 0.03 ||
      Math.abs(y + 0.5) < 0.01 ||
      colOf(y + dy, z) !== here ||
      colOf(y - dy, z) !== here ||
      colOf(y, z + dy) !== here ||
      colOf(y, z - dy) !== here
    )
      continue;
    const p = airPressure(e, rho);
    const dpdr = (airPressure(e, rho * (1 + h)) - airPressure(e, rho * (1 - h))) / (2 * h * rho);
    const dpde = (airPressure(e * (1 + h), rho) - airPressure(e * (1 - h), rho)) / (2 * h * e);
    const a2 = dpdr + (p / (rho * rho)) * dpde;
    const a = airSoundSpeed(e, rho);
    const off = Math.abs(Math.sqrt(Math.max(a2, 0)) / a - 1);
    points++;
    if (off > worstA) {
      worstA = off;
      worstAt = `Y ${y.toFixed(2)}, Z ${z.toFixed(2)}`;
    }
  }
console.log(
  `(5) a against the p fit's derivative: largest ${(worstA * 100).toFixed(2)} % at ${worstAt} over ${String(points)} points`
);

const checks = {
  junctures: missed.length === 0,
  idealLimit: ideal <= 0.005,
  continuity: jumpP < 0.01 && jumpA < 0.01,
  consistency: worstA <= 0.05,
};
console.log(JSON.stringify(checks));
writeFileSync(
  'src/physics/validation/verifyAirEos.json',
  `${JSON.stringify(
    {
      rule: '1308 (d), 1312',
      junctures: { total: junctures.length, missed, spurious },
      idealLimit: { ratio, off: ideal },
      continuity: { largestP: jumpP, largestA: jumpA, above1percent: jumps },
      consistency: { largest: worstA, at: worstAt, points },
      checks,
    },
    null,
    2
  )}\n`
);
