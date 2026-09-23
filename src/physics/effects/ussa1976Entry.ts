import type { EntryProfile } from './entryIntegrated.js';

/**
 * The U.S. Standard Atmosphere, 1976 (NOAA, NASA, USAF; NOAA-S/T 76-1562,
 * NASA-TM-X-74335, Washington 1976), as rule 912 of
 * validation/entryAtmosphereRules.ts takes it for the impacts' entry: from its
 * defining constants up to 86 km geometric, and above from the densities its
 * Table I prints. Page numbers are the standard's own. The project's
 * `atmosphere/ussa1976.ts`, read by the volcanic ashfall, is another thing
 * and is left as it is (rule 912).
 */

/** Table 2 (p. 2) and §1.2.4 (p. 9): g0, r0, R*, M0, P0, T0. */
const G0 = 9.806_65;
const R0 = 6_356_766;
const R_STAR = 8_314.32;
const M0 = 28.964_4;
const P0 = 101_325;
const T0 = 288.15;

/** g0′ M0 / R*, the hydrostatic constant of eqs. 33a and 33b (K/m′). */
const HYDROSTATIC = (G0 * M0) / R_STAR;

/** Table 4 (p. 3): the base geopotential heights (m′) and the gradients of
 *  molecular-scale temperature (K/m′) of the seven layers below 86 km. */
const LAYERS: readonly (readonly [number, number])[] = [
  [0, -0.006_5],
  [11_000, 0],
  [20_000, 0.001],
  [32_000, 0.002_8],
  [47_000, 0],
  [51_000, -0.002_8],
  [71_000, -0.002],
];

/** Geometric 86 km (Table 4, p. 3: 84.8520 km′). */
export const USSA_LOWER_TOP_M = 86_000;

/** The base temperature and pressure of each layer, carried up from T0, P0. */
const BASES: readonly { h: number; lapse: number; t: number; p: number }[] = (() => {
  const out: { h: number; lapse: number; t: number; p: number }[] = [];
  let t = T0;
  let p = P0;
  for (const [i, [h, lapse]] of LAYERS.entries()) {
    out.push({ h, lapse, t, p });
    const next = LAYERS[i + 1];
    if (next === undefined) break;
    const dh = next[0] - h;
    const top = t + lapse * dh;
    p =
      lapse === 0 ? p * Math.exp((-HYDROSTATIC * dh) / t) : p * (t / top) ** (HYDROSTATIC / lapse);
    t = top;
  }
  return out;
})();

/** Eq. 18 (p. 8): the geopotential height of a geometric altitude (m′). */
export function ussaGeopotential(z: number): number {
  return (R0 * z) / (R0 + z);
}

export interface UssaState {
  /** Kinetic temperature (K); below 86 km the molecular-scale temperature,
   *  as Table I prints it there (p. 9). */
  temperature: number;
  /** Pressure (Pa). */
  pressure: number;
  /** Density (kg/m³). */
  density: number;
}

/**
 * Below 86 km: eq. 23's molecular-scale temperature, eqs. 33a and 33b's
 * pressure and eq. 42's density, ρ = P M0 / (R* T_M). Below the ground, the
 * lowest layer's law continued, as Table I itself continues it to −5 km.
 */
export function ussaLower(z: number): UssaState {
  const h = ussaGeopotential(z);
  let base = BASES[0];
  for (const b of BASES) if (b.h <= h) base = b;
  if (base === undefined) throw new Error('USSA 1976: no layer');
  const dh = h - base.h;
  const t = base.t + base.lapse * dh;
  const p =
    base.lapse === 0
      ? base.p * Math.exp((-HYDROSTATIC * dh) / base.t)
      : base.p * (base.t / t) ** (HYDROSTATIC / base.lapse);
  return { temperature: t, pressure: p, density: (p * M0) / (R_STAR * t) };
}

/** §1.2.6 (pp. 10–11): the kinetic temperature above 86 km (K), eqs. 25, 27,
 *  29 and 31. */
export function ussaUpperTemperature(z: number): number {
  const km = z / 1_000;
  if (km < 91) return 186.867_3;
  if (km < 110) {
    const x = (km - 91) / -19.942_9;
    return 263.190_5 - 76.323_2 * Math.sqrt(Math.max(1 - x * x, 0));
  }
  if (km < 120) return 240 + 12 * (km - 110);
  const r0 = R0 / 1_000;
  const xi = ((km - 120) * (r0 + 120)) / (r0 + km);
  return 1_000 - (1_000 - 360) * Math.exp(-0.018_75 * xi);
}

/**
 * Table I, geometric altitude (pp. 68–69): the density (kg/m³) and pressure
 * (mb) the standard prints from 86 to 150 km — every 500 m to 100 km, every
 * kilometre above — read from the scanned tables by hand. Their ratio is held
 * to a smooth mean molecular weight by the test, so that a figure misread
 * shows.
 */
export const USSA_UPPER_ROWS: readonly (readonly [number, number, number])[] = [
  [86_000, 6.958e-6, 3.7338e-3],
  [86_500, 6.366e-6, 3.4163e-3],
  [87_000, 5.824e-6, 3.1259e-3],
  [87_500, 5.328e-6, 2.8602e-3],
  [88_000, 4.875e-6, 2.6173e-3],
  [88_500, 4.46e-6, 2.3951e-3],
  [89_000, 4.081e-6, 2.1919e-3],
  [89_500, 3.734e-6, 2.006e-3],
  [90_000, 3.416e-6, 1.8359e-3],
  [90_500, 3.126e-6, 1.6804e-3],
  [91_000, 2.86e-6, 1.5381e-3],
  [91_500, 2.616e-6, 1.4078e-3],
  [92_000, 2.393e-6, 1.2887e-3],
  [92_500, 2.188e-6, 1.1798e-3],
  [93_000, 2.0e-6, 1.0801e-3],
  [93_500, 1.828e-6, 9.8896e-4],
  [94_000, 1.67e-6, 9.056e-4],
  [94_500, 1.526e-6, 8.2937e-4],
  [95_000, 1.393e-6, 7.5966e-4],
  [95_500, 1.273e-6, 6.9592e-4],
  [96_000, 1.162e-6, 6.3765e-4],
  [96_500, 1.061e-6, 5.8439e-4],
  [97_000, 9.685e-7, 5.3571e-4],
  [97_500, 8.842e-7, 4.9122e-4],
  [98_000, 8.071e-7, 4.5057e-4],
  [98_500, 7.367e-7, 4.1342e-4],
  [99_000, 6.725e-7, 3.7948e-4],
  [99_500, 6.139e-7, 3.4846e-4],
  [100_000, 5.604e-7, 3.2011e-4],
  [101_000, 4.695e-7, 2.7192e-4],
  [102_000, 3.935e-7, 2.3144e-4],
  [103_000, 3.3e-7, 1.9742e-4],
  [104_000, 2.769e-7, 1.6882e-4],
  [105_000, 2.325e-7, 1.4477e-4],
  [106_000, 1.954e-7, 1.2454e-4],
  [107_000, 1.643e-7, 1.0751e-4],
  [108_000, 1.381e-7, 9.3188e-5],
  [109_000, 1.161e-7, 8.1142e-5],
  [110_000, 9.708e-8, 7.1042e-5],
  [111_000, 8.111e-8, 6.2614e-5],
  [112_000, 6.838e-8, 5.5547e-5],
  [113_000, 5.811e-8, 4.957e-5],
  [114_000, 4.975e-8, 4.4473e-5],
  [115_000, 4.289e-8, 4.0096e-5],
  [116_000, 3.72e-8, 3.6312e-5],
  [117_000, 3.246e-8, 3.3022e-5],
  [118_000, 2.847e-8, 3.0144e-5],
  [119_000, 2.509e-8, 2.7615e-5],
  [120_000, 2.222e-8, 2.5382e-5],
  [121_000, 1.977e-8, 2.3401e-5],
  [122_000, 1.767e-8, 2.1635e-5],
  [123_000, 1.585e-8, 2.0055e-5],
  [124_000, 1.428e-8, 1.8635e-5],
  [125_000, 1.291e-8, 1.7354e-5],
  [126_000, 1.171e-8, 1.6194e-5],
  [127_000, 1.065e-8, 1.5141e-5],
  [128_000, 9.717e-9, 1.4183e-5],
  [129_000, 8.889e-9, 1.3307e-5],
  [130_000, 8.152e-9, 1.2505e-5],
  [131_000, 7.494e-9, 1.1769e-5],
  [132_000, 6.904e-9, 1.1092e-5],
  [133_000, 6.374e-9, 1.0468e-5],
  [134_000, 5.897e-9, 9.8907e-6],
  [135_000, 5.465e-9, 9.3568e-6],
  [136_000, 5.074e-9, 8.8617e-6],
  [137_000, 4.719e-9, 8.4018e-6],
  [138_000, 4.396e-9, 7.9739e-6],
  [139_000, 4.101e-9, 7.5751e-6],
  [140_000, 3.831e-9, 7.2028e-6],
  [141_000, 3.584e-9, 6.855e-6],
  [142_000, 3.358e-9, 6.5294e-6],
  [143_000, 3.15e-9, 6.2243e-6],
  [144_000, 2.958e-9, 5.938e-6],
  [145_000, 2.781e-9, 5.6691e-6],
  [146_000, 2.618e-9, 5.4162e-6],
  [147_000, 2.466e-9, 5.1781e-6],
  [148_000, 2.326e-9, 4.9538e-6],
  [149_000, 2.196e-9, 4.7421e-6],
  [150_000, 2.076e-9, 4.5422e-6],
];

/** A quantity of the upper rows read log-linearly between them (column 1:
 *  density, 2: pressure in mb), continued past 150 km by the last pair. */
function upper(z: number, column: 1 | 2): number {
  const rows = USSA_UPPER_ROWS;
  let i = 0;
  while (i < rows.length - 2 && (rows[i + 1]?.[0] ?? 0) <= z) i++;
  const a = rows[i];
  const b = rows[i + 1];
  if (a === undefined || b === undefined) throw new Error('USSA 1976: no row');
  const f = (z - a[0]) / (b[0] - a[0]);
  return Math.exp(Math.log(a[column]) + f * (Math.log(b[column]) - Math.log(a[column])));
}

/** The standard at a geometric altitude (m). */
export function ussaState(z: number): UssaState {
  if (z < USSA_LOWER_TOP_M) return ussaLower(z);
  return {
    temperature: ussaUpperTemperature(z),
    pressure: upper(z, 2) * 100,
    density: upper(z, 1),
  };
}

/** Rule 912: the profile N-USSA integrates on. */
export const USSA_1976_PROFILE: EntryProfile = {
  name: 'U.S. Standard Atmosphere 1976',
  density: (z) => ussaState(z).density,
};
