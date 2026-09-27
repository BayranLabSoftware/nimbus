/**
 * Rules 1308 and 1312 (`../../validation/blastSolverRules.ts`): the equation
 * of state of equilibrium air of Srinivasan, Tannehill & Weilmuenster (1987,
 * NASA RP-1181) — p(e, ρ), a(e, ρ) and T(e, ρ) — from the report's equations
 * (22)–(28) and its Tables A1–A6 (`airEosRp1181.json`, two blind
 * transcriptions, identical), from 10⁻⁷ to 10³ times ρ₀ (outside, the
 * nearest band). Their reach in energy is the report's data (its Fig. 11:
 * log₁₀(e/RT₀) up to 3.03 at ρ₀, 3.57 at 10⁻⁷ ρ₀, rule 1319 (c)): at that
 * edge the module's temperature runs from 16 609 K (10⁻⁴ ρ₀) to 25 192 K
 * (10² ρ₀) and 27 522 K (10³ ρ₀) (rule 1320 (c)). The module refuses (a
 * RangeError) beyond the edge, and wherever γ̃ ≤ 1, a² ≤ 0, ∂p/∂e|ρ ≤ 0 or T
 * does not rise with e (rules 1317 (b), 1318 (a)) — which on the ρ₀ isochore
 * comes before the edge (from Z = 2.998), and between some isochores too
 * (rule 1322 (a)).
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

/**
 * Rule 1319 (c): the edge of the report's data in energy, Z_max at
 * Y = −7 … 3 (its Fig. 11, the highest compared point of each isochore,
 * the mean of two blind readings that agree within 0.005); linear in Y
 * between them, the ends held beyond.
 */
const DATA_EDGE = [3.573, 3.516, 3.456, 3.298, 3.288, 3.268, 3.219, 3.031, 2.961, 2.924, 2.883];
export function airDataEdge(y: number): number {
  const x = Math.min(3, Math.max(-7, y)) + 7;
  const n = Math.min(9, Math.floor(x));
  const lo = DATA_EDGE[n] ?? NaN;
  const hi = DATA_EDGE[n + 1] ?? NaN;
  return lo + (hi - lo) * (x - n);
}

function refuse(what: string, e: number, rho: number): never {
  throw new RangeError(
    `airEos: beyond RP-1181's data (${what} at e = ${String(e)} J/kg, ρ = ${String(rho)} kg/m³)`
  );
}

/** γ̃ = h/e at specific internal energy e (J/kg) and density ρ (kg/m³);
 *  refused where γ̃ ≤ 1 or ∂p/∂e|ρ = ρ[(γ̃ − 1) + γ̃_Z/ln 10] ≤ 0 (rule 1318
 *  (a)), at both ends of a blend. */
export function airGamma(e: number, rho: number): number {
  const y = Math.log10(rho / AIR_RHO0);
  const z = Math.log10(e / RT0);
  if (z > airDataEdge(y)) refuse(`Z = ${z.toFixed(3)} beyond the data's edge`, e, rho);
  return acrossBands(y, (yy) => {
    const v = gammaAt(yy, z);
    if (!(v.f > 1)) refuse(`γ̃ = ${String(v.f)}`, e, rho);
    if (!(v.f - 1 + v.fZ / LN10 > 0)) refuse('∂p/∂e ≤ 0', e, rho);
    return v.f;
  });
}

/** Eq. (25): the pressure (Pa), refused where γ̃ is. */
export function airPressure(e: number, rho: number): number {
  return rho * e * (airGamma(e, rho) - 1);
}

/** Eq. (27): the sound speed (m/s). */
export function airSoundSpeed(e: number, rho: number): number {
  airPressure(e, rho);
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
    const v = grabau(c.coefficients, c.sign, yy, z);
    // Rule 1318 (a): T must rise with e (Z_T rises with p, and p with e).
    if (!(v.fZ > 0)) refuse('T not rising with e', e, rho);
    return v.f;
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

/*
 * Rules 1334 (a) and 1335: the fit blended for the solver. The raw fit jumps
 * between its columns and bands (a contact at constant pressure rings without
 * converging); here every seam is a C¹ blend w = s²(3 − 2s), the cold branch
 * (Z ≤ 0.58) is the ideal gas at γ = 1.4 exactly, γ̃ is held constant in Z
 * beyond the effective edge (joined over 0.05 in Z) and Y is held at the
 * nearer end beyond −7 … 3. No exception is thrown: the held and clamped
 * evaluations are counted.
 */

/** Rule 1334 (a)(1)–(2): the cold branch's top and the cold blend's end. */
export const AIR_COLD_Z = 0.58;
/** The cold branch's top in specific internal energy (J/kg). */
export const AIR_COLD_E = RT0 * Math.pow(10, AIR_COLD_Z);
const COLD_BLEND_TOP = 0.72;
/** Rule 1334 (a)(3)–(4): the half widths of the column and band blends. */
const COLUMN_DELTA = 0.05;
/** Rule 1342: the seam at Y = −4.5 blended over ±0.1 (𝒢 reached 0 over ±0.05). */
const BAND_DELTA_LOW = 0.1;
const BAND_DELTA = 0.05;
/** Rule 1336 (b): the step back from the fit's first zero; rule 1337 (b):
 *  the width over which the continuation's slope falls to 0. */
const ZERO_BACKOFF = 0.05;
const CONTINUATION_DELTA = 0.05;
/** Rules 1339 (b)(1) and 1341: the bound on Z_h's slope in Y. */
const LIPSCHITZ = 0.1;
const BAND_SEAMS = [-4.5, -0.5] as const;

interface Blended {
  f: number;
  fY: number;
  fZ: number;
}

/** The C¹ weight and its derivative in s. */
function weight(s: number): { w: number; dw: number } {
  const t = Math.min(1, Math.max(0, s));
  return { w: t * t * (3 - 2 * t), dw: 6 * t * (1 - t) };
}

/** One band's columns, the cold branch and the column seams blended. */
function bandBlended(b: Band, y: number, z: number): Blended {
  const cols = b.columns;
  if (z <= AIR_COLD_Z) return { f: 1.4, fY: 0, fZ: 0 };
  const second = cols[1];
  if (second === undefined) throw new Error('airEos: a band without a second column');
  if (z < COLD_BLEND_TOP) {
    const span = COLD_BLEND_TOP - AIR_COLD_Z;
    const { w, dw } = weight((z - AIR_COLD_Z) / span);
    const hi = grabau(second.coefficients, second.sign, y, z);
    return { f: 1.4 + w * (hi.f - 1.4), fY: w * hi.fY, fZ: w * hi.fZ + (dw / span) * (hi.f - 1.4) };
  }
  // The seams between the higher columns: the zMax of columns 1 … n − 2.
  for (let k = 1; k < cols.length - 1; k++) {
    const lo = cols[k];
    const hi = cols[k + 1];
    const seam = lo?.zMax;
    if (lo === undefined || hi === undefined || seam === null || seam === undefined) continue;
    if (Math.abs(z - seam) < COLUMN_DELTA) {
      const { w, dw } = weight((z - seam + COLUMN_DELTA) / (2 * COLUMN_DELTA));
      const a = grabau(lo.coefficients, lo.sign, y, z);
      const c = grabau(hi.coefficients, hi.sign, y, z);
      return {
        f: a.f + w * (c.f - a.f),
        fY: a.fY + w * (c.fY - a.fY),
        fZ: a.fZ + w * (c.fZ - a.fZ) + (dw / (2 * COLUMN_DELTA)) * (c.f - a.f),
      };
    }
  }
  const c = column(b, z);
  return grabau(c.coefficients, c.sign, y, z);
}

/** The bands blended across their seams (Y = −4.5 and −0.5). */
function inner(y: number, z: number): Blended {
  for (const seam of BAND_SEAMS) {
    const delta = seam === -4.5 ? BAND_DELTA_LOW : BAND_DELTA;
    if (Math.abs(y - seam) < delta) {
      const { w, dw } = weight((y - seam + delta) / (2 * delta));
      const a = bandBlended(band(PRESSURE, seam - delta), y, z);
      const c = bandBlended(band(PRESSURE, seam + delta), y, z);
      return {
        f: a.f + w * (c.f - a.f),
        fY: a.fY + w * (c.fY - a.fY) + (dw / (2 * delta)) * (c.f - a.f),
        fZ: a.fZ + w * (c.fZ - a.fZ),
      };
    }
  }
  return bandBlended(band(PRESSURE, y), y, z);
}

/** The blended fit before any hold (for the verification). */
export function airGammaInner(y: number, z: number): Blended {
  return z <= AIR_COLD_Z ? { f: 1.4, fY: 0, fZ: 0 } : inner(y, z);
}

/** Rule 1336 (b) and 1338 (b): μ, κ, γ̃ − 1 and 𝒢 of the blended fit at
 *  (Y, Z), the least of them; 𝒢 = 1 + (ρ/c)(∂c/∂ρ)_s by central differences
 *  along the isentrope (ε = 10⁻⁴). */
function leastMargin(y: number, z: number): number {
  const v = inner(y, z);
  const g1 = v.f - 1;
  const mu = 1 + v.fZ / (g1 * LN10);
  const kappa = (g1 * (v.f + v.fZ / LN10) + v.fY / LN10) / (v.f * g1);
  const least = Math.min(mu, kappa, g1);
  if (!(least > 0)) return least;
  const eps = 1e-4;
  const dy = Math.log10(1 + eps);
  const dyMinus = Math.log10(1 - eps);
  const zPlus = z + Math.log10(1 + g1 * eps);
  const zMinus = z + Math.log10(1 - g1 * eps);
  const sound = (yy: number, zz: number): number => {
    const w = inner(yy, zz);
    const e = Math.pow(10, zz);
    return Math.sqrt(e * ((w.f - 1) * (w.f + w.fZ / LN10) + w.fY / LN10));
  };
  const c = sound(y, z);
  const fundamental = 1 + (sound(y + dy, zPlus) - sound(y + dyMinus, zMinus)) / (2 * eps * c);
  return Math.min(least, fundamental);
}

/** Rule 1336 (b), 1338 (b), 1339 (b)(1): Z_h every 0.01 in Y from −7 to 3 —
 *  the least of the data's edge and the first zero of μ, κ, γ̃ − 1 or 𝒢
 *  above 0.72 (scanned every 0.001 to the edge plus 0.3) less 0.05 — then
 *  its Lipschitz lower envelope, min over Y′ of Z_h(Y′) + 0.1|Y − Y′| (rule 1341). */
let continuation: Float64Array | null = null;
function continuationTable(): Float64Array {
  if (continuation !== null) return continuation;
  const raw = new Float64Array(1001);
  for (let n = 0; n <= 1000; n++) {
    const y = -7 + n / 100;
    const top = airDataEdge(y);
    let zh = top;
    for (let m = 0; ; m++) {
      const zz = COLD_BLEND_TOP + m / 1000;
      if (zz > top + 0.3) break;
      if (!(leastMargin(y, zz) > 0)) {
        zh = Math.min(top, zz - ZERO_BACKOFF);
        break;
      }
    }
    raw[n] = zh;
  }
  const z = new Float64Array(1001);
  for (let n = 0; n <= 1000; n++) {
    let least = Infinity;
    for (let k = 0; k <= 1000; k++)
      least = Math.min(least, (raw[k] ?? Infinity) + LIPSCHITZ * Math.abs(n - k) * 0.01);
    z[n] = least;
  }
  continuation = z;
  return z;
}

/** A table every 0.01 in Y from −7, read by cubic Hermite interpolation with
 *  central-difference slopes (C¹, its derivative exact), and its slope. */
function hermite(t: Float64Array, y: number): { v: number; vY: number } {
  const x = (Math.min(3, Math.max(-7, y)) + 7) * 100;
  const n = Math.min(999, Math.floor(x));
  const at = (k: number): number => t[Math.min(1000, Math.max(0, k))] ?? NaN;
  const slope = (k: number): number =>
    k <= 0 ? at(1) - at(0) : k >= 1000 ? at(1000) - at(999) : 0.5 * (at(k + 1) - at(k - 1));
  const u = x - n;
  const v0 = at(n);
  const v1 = at(n + 1);
  const m0 = slope(n);
  const m1 = slope(n + 1);
  const u2 = u * u;
  const u3 = u2 * u;
  return {
    v:
      (2 * u3 - 3 * u2 + 1) * v0 +
      (u3 - 2 * u2 + u) * m0 +
      (-2 * u3 + 3 * u2) * v1 +
      (u3 - u2) * m1,
    vY:
      100 *
      ((6 * u2 - 6 * u) * v0 +
        (3 * u2 - 4 * u + 1) * m0 +
        (-6 * u2 + 6 * u) * v1 +
        (3 * u2 - 2 * u) * m1),
  };
}

/** Z_h*(Y) with its slope, and the fit's slope S = γ̃_Z/(γ̃ − 1) there
 *  with S′ by central differences (rule 1339 (b)). */
export function airEffectiveEdge(y: number): { z: number; zY: number; s: number; sY: number } {
  const t = continuationTable();
  const z = hermite(t, y);
  const slopeAt = (yy: number): number => {
    const zz = hermite(t, yy).v;
    const v = inner(yy, zz);
    return v.fZ / (v.f - 1);
  };
  const h = 1e-5;
  return {
    z: z.v,
    zY: z.vY,
    s: slopeAt(y),
    sY:
      (slopeAt(Math.min(3, y + h)) - slopeAt(Math.max(-7, y - h))) /
      (Math.min(3, y + h) - Math.max(-7, y - h)),
  };
}

/** The continued and clamped evaluations (rules 1335 (c), 1336 (b)). */
export const airBlendedCounts = { held: 0, clamped: 0 };

/** γ̃ and its derivatives in Y = log₁₀(ρ/ρ₀) and Z = log₁₀(e/RT₀): the fit
 *  blended (rule 1334 (a)), continued beyond Z_h (rule 1336) and clamped in
 *  Y (rule 1335 (c)). */
export function airGammaBlended(y: number, z: number): Blended {
  let yc = y;
  const clamped = y < -7 || y > 3;
  if (clamped) {
    yc = Math.min(3, Math.max(-7, y));
    airBlendedCounts.clamped++;
  }
  if (z <= AIR_COLD_Z) return { f: 1.4, fY: 0, fZ: 0 };
  const edge = airEffectiveEdge(yc);
  let v: Blended;
  if (z > edge.z) {
    // Rule 1337 (b): φ = ln(γ̃ − 1) = Φ(Y) + S(Y)·δ·J(s), s = (Z − Z_h)/δ,
    // J(s) = s − s³ + s⁴/2 (1/2 beyond s = 1), so φ_Z = S(1 − w(s)).
    const h = inner(yc, edge.z);
    const g1 = h.f - 1;
    const s = Math.min(1, (z - edge.z) / CONTINUATION_DELTA);
    const s2 = s * s;
    const j = s - s2 * s + 0.5 * s2 * s2;
    const oneMinusW = 1 - s2 * (3 - 2 * s);
    const phiY =
      (h.fY + h.fZ * edge.zY) / g1 +
      edge.sY * CONTINUATION_DELTA * j -
      edge.s * oneMinusW * edge.zY;
    const gm1 = g1 * Math.exp(edge.s * CONTINUATION_DELTA * j);
    v = { f: 1 + gm1, fY: gm1 * phiY, fZ: gm1 * edge.s * oneMinusW };
    airBlendedCounts.held++;
  } else {
    v = inner(yc, z);
  }
  return clamped ? { f: v.f, fY: 0, fZ: v.fZ } : v;
}

/** The blended state at e (J/kg) and ρ (kg/m³): γ̃, p (Pa), c² (m²/s², Eq.
 *  27 with the blended derivatives) and ∂p/∂e|ρ / ρ. */
export function airBlended(
  e: number,
  rho: number
): { gamma: number; p: number; c2: number; dpde: number } {
  const y = Math.log10(rho / AIR_RHO0);
  const z = Math.log10(e / RT0);
  const g = airGammaBlended(y, z);
  return {
    gamma: g.f,
    p: rho * e * (g.f - 1),
    c2: soundSquared(e, g),
    dpde: g.f - 1 + g.fZ / LN10,
  };
}
