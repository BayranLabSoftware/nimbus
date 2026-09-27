/**
 * Rules 1308 and 1312 (`../../validation/blastSolverRules.ts`): the equation
 * of state of equilibrium air of Srinivasan, Tannehill & Weilmuenster (1987,
 * NASA RP-1181) — p(e, ρ), a(e, ρ) and T(e, ρ) — from the report's equations
 * (22)–(28) and its Tables A1–A6 (`airEosRp1181.json`, two blind
 * transcriptions, identical), from 10⁻⁷ to 10³ times ρ₀ (outside, the
 * nearest band). Their reach in energy is the report's data (its Fig. 11:
 * log₁₀(e/RT₀) up to about 3.0 at ρ₀, 3.57 at 10⁻⁷ ρ₀) — below 25 000 K at
 * high densities; beyond it γ̃ falls below 1, and the module refuses (a
 * RangeError) where γ̃ ≤ 1 or a² ≤ 0 (rule 1317 (b)).
 *
 * γ̃ = h/e is fitted in Y = log₁₀(ρ/ρ₀) and Z = log₁₀(e/RT₀) as
 *   γ̃ = P₁(Y, Z) + P₂(Y, Z)/[1 ± exp(a₂₁ + a₂₂Y + a₂₃Z + a₂₄YZ)],
 * P₁ and P₂ the complete cubics of Eqs. (23)–(24); p = ρe(γ̃ − 1) (25), the
 * sound speed from Eq. (27) with the exact derivatives of γ̃, and T from
 * Eq. (28), log₁₀(T/T₀) a function of the same form in Y and X − Y,
 * X = log₁₀(p/p₀) (T = p/ρR where X − Y ≤ 0.25). Across the density bands
 * (Y = −4.5 and −0.5) the fitted quantity — γ̃, a, log₁₀(T/T₀) — is
 * interpolated linearly over ±0.025 and ±0.005 in Y (rule 1312 (c)).
 */

import table from './airEosRp1181.json';

interface Column {
  readonly zMin: number | null;
  readonly zMax: number | null;
  readonly coefficients: readonly number[];
  readonly sign: number;
}
interface Band {
  readonly yMin: number;
  readonly yMax: number;
  readonly columns: readonly Column[];
}

/** The gas constant of undissociated air (J/(kg K)) and the reference state. */
export const AIR_R = table.reference.R;
export const AIR_T0 = table.reference.T0;
export const AIR_P0 = table.reference.p0;
/** ρ₀ = p₀/(RT₀) (kg/m³): the density at 1 atm and 273.15 K. */
export const AIR_RHO0 = AIR_P0 / (AIR_R * AIR_T0);
const RT0 = AIR_R * AIR_T0;
const LN10 = Math.log(10);

const PRESSURE: readonly Band[] = table.pressureAndSound;
const TEMPERATURE: readonly Band[] = table.temperature;

/** The band of Y: −7 ≤ Y ≤ −4.5, −4.5 < Y ≤ −0.5, −0.5 < Y ≤ 3 (the nearest beyond). */
function band(bands: readonly Band[], y: number): Band {
  for (const b of bands) if (y <= b.yMax) return b;
  const last = bands[bands.length - 1];
  if (last === undefined) throw new Error('airEos: no density band');
  return last;
}

/** The column of Z: zMin < Z ≤ zMax (open ends null). */
function column(b: Band, z: number): Column {
  for (const c of b.columns) if (c.zMax === null || z <= c.zMax) return c;
  const last = b.columns[b.columns.length - 1];
  if (last === undefined) throw new Error('airEos: no energy column');
  return last;
}

/** A fitted function of the Grabau form and its derivatives in Y and Z. */
export interface GrabauValue {
  readonly f: number;
  readonly fY: number;
  readonly fZ: number;
}

/** Eqs. (22)–(26) and their exact derivatives (rule 1312 (c)). */
export function grabau(c: readonly number[], sign: number, y: number, z: number): GrabauValue {
  const k = (n: number): number => c[n - 1] ?? 0;
  const y2 = y * y;
  const z2 = z * z;
  const p1 =
    k(1) +
    k(2) * y +
    k(3) * z +
    k(4) * y * z +
    k(5) * y2 +
    k(6) * z2 +
    k(7) * y2 * z +
    k(8) * y * z2 +
    k(9) * y2 * y +
    k(10) * z2 * z;
  const p2 =
    k(11) +
    k(12) * y +
    k(13) * z +
    k(14) * y * z +
    k(15) * y2 +
    k(16) * z2 +
    k(17) * y2 * z +
    k(18) * y * z2 +
    k(19) * y2 * y +
    k(20) * z2 * z;
  const p1Y = k(2) + k(4) * z + 2 * k(5) * y + 2 * k(7) * y * z + k(8) * z2 + 3 * k(9) * y2;
  const p1Z = k(3) + k(4) * y + 2 * k(6) * z + k(7) * y2 + 2 * k(8) * y * z + 3 * k(10) * z2;
  const p2Y = k(12) + k(14) * z + 2 * k(15) * y + 2 * k(17) * y * z + k(18) * z2 + 3 * k(19) * y2;
  const p2Z = k(13) + k(14) * y + 2 * k(16) * z + k(17) * y2 + 2 * k(18) * y * z + 3 * k(20) * z2;
  const x = k(21) + k(22) * y + k(23) * z + k(24) * y * z;
  // 1/D and e^x/D² with D = 1 + sign·e^x, written so that neither overflows.
  let inv: number;
  let w: number;
  if (x > 0) {
    const q = Math.exp(-x);
    inv = q / (q + sign);
    w = q / ((q + sign) * (q + sign));
  } else {
    const ex = Math.exp(x);
    inv = 1 / (1 + sign * ex);
    w = ex * inv * inv;
  }
  return {
    f: p1 + p2 * inv,
    fY: p1Y + p2Y * inv - sign * p2 * w * (k(22) + k(24) * z),
    fZ: p1Z + p2Z * inv - sign * p2 * w * (k(23) + k(24) * y),
  };
}

/** A fitted quantity of (Y, Z), interpolated linearly across the density
 *  bands' boundaries (rule 1312 (c)). */
function acrossBands(y: number, of: (y: number) => number): number {
  if (Math.abs(y + 4.5) < 0.025) {
    const lo = of(-4.525);
    return lo + ((of(-4.475) - lo) * (y + 4.525)) / 0.05;
  }
  if (Math.abs(y + 0.5) < 0.005) {
    const lo = of(-0.505);
    return lo + ((of(-0.495) - lo) * (y + 0.505)) / 0.01;
  }
  return of(y);
}

function gammaAt(y: number, z: number): GrabauValue {
  const c = column(band(PRESSURE, y), z);
  return grabau(c.coefficients, c.sign, y, z);
}

/** Eq. (27): the sound speed squared from γ̃ and its derivatives. */
function soundSquared(e: number, g: GrabauValue): number {
  return e * ((g.f - 1) * (g.f + g.fZ / LN10) + g.fY / LN10);
}

/** γ̃ = h/e at specific internal energy e (J/kg) and density ρ (kg/m³). */
export function airGamma(e: number, rho: number): number {
  const y = Math.log10(rho / AIR_RHO0);
  const z = Math.log10(e / RT0);
  return acrossBands(y, (yy) => gammaAt(yy, z).f);
}

/** Eq. (25): the pressure (Pa). */
export function airPressure(e: number, rho: number): number {
  const g = airGamma(e, rho);
  if (!(g > 1))
    throw new RangeError(
      `airEos: beyond RP-1181's data (γ̃ = ${String(g)} at e = ${String(e)} J/kg, ρ = ${String(rho)} kg/m³)`
    );
  return rho * e * (g - 1);
}

/** Eq. (27): the sound speed (m/s). */
export function airSoundSpeed(e: number, rho: number): number {
  const y = Math.log10(rho / AIR_RHO0);
  const z = Math.log10(e / RT0);
  const a = acrossBands(y, (yy) => Math.sqrt(soundSquared(e, gammaAt(yy, z))));
  if (!(a > 0))
    throw new RangeError(
      `airEos: beyond RP-1181's data (a² ≤ 0 at e = ${String(e)} J/kg, ρ = ${String(rho)} kg/m³)`
    );
  return a;
}

/** Eq. (28): the temperature (K). */
export function airTemperature(e: number, rho: number): number {
  const p = airPressure(e, rho);
  const y = Math.log10(rho / AIR_RHO0);
  const z = Math.log10(p / AIR_P0) - y;
  if (z <= 0.25) return p / (rho * AIR_R);
  const logT = acrossBands(y, (yy) => {
    const c = column(band(TEMPERATURE, yy), z);
    return grabau(c.coefficients, c.sign, yy, z).f;
  });
  return AIR_T0 * Math.pow(10, logT);
}

/** For the verification (rule 1308 (d)): a band's column by index, evaluated. */
export const rp1181 = {
  pressureBands: PRESSURE,
  temperatureBands: TEMPERATURE,
  soundSquared,
  RT0,
} as const;
