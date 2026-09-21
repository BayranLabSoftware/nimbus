import type { Meters, Pascals } from '../units.js';
import { Pa } from '../units.js';

/**
 * The US Standard Atmosphere 1976, in the only part of it this project
 * needs: temperature and pressure against height, from the ground to the
 * mesopause.
 *
 * It is written out here from the standard's own definition rather than
 * fitted to anything. The standard defines seven layers by a base
 * geopotential height, a base temperature and a linear lapse rate, and
 * everything else follows from hydrostatic balance:
 *
 *     T(h) = T_b + L·(h − h_b)
 *     P(h) = P_b · (T_b / T(h))^(g·M / (R*·L))        L ≠ 0
 *     P(h) = P_b · exp(−g·M·(h − h_b) / (R*·T_b))     L = 0
 *
 * with the standard's own constants: g = 9.806 65 m/s², M = 28.964 4 g/mol
 * and R* = 8.314 32 J/(mol·K). The base pressures are computed from those
 * formulae rather than transcribed, so the table below is the whole of the
 * input and nothing is copied that could be mistyped.
 *
 * Checked against the standard's own printed values: 22 632 Pa at 11 km,
 * 5 474.9 at 20 km, 868.02 at 32 km and 110.91 at 47 km.
 *
 * Reference: NOAA, NASA & USAF (1976), "U.S. Standard Atmosphere, 1976",
 * NOAA-S/T 76-1562, §1.2.3 and Table 4.
 */

/** Rule 594: the standard's seven layers — base height (m), base
 *  temperature (K), lapse rate (K/m). */
const LAYERS: readonly (readonly [number, number, number])[] = [
  [0, 288.15, -0.0065],
  [11_000, 216.65, 0],
  [20_000, 216.65, 0.001],
  [32_000, 228.65, 0.0028],
  [47_000, 270.65, 0],
  [51_000, 270.65, -0.0028],
  [71_000, 214.65, -0.002],
];

/** The top of the part of the standard this module covers, in metres. */
export const STANDARD_ATMOSPHERE_TOP_M = 84_852;

const SEA_LEVEL_PRESSURE_PA = 101_325;
const G0 = 9.80665;
const AIR_MOLAR_MASS_KG = 0.0289644;
const GAS_CONSTANT = 8.31432;

/** The base pressure of each layer, computed from the layer below. */
const BASE_PRESSURE: readonly number[] = (() => {
  const out = [SEA_LEVEL_PRESSURE_PA];
  for (let i = 0; i < LAYERS.length - 1; i++) {
    const layer = LAYERS[i];
    const next = LAYERS[i + 1];
    const previous = out[i];
    if (layer === undefined || next === undefined || previous === undefined) break;
    const [baseHeight, baseTemperature, lapse] = layer;
    const thickness = next[0] - baseHeight;
    out.push(
      lapse === 0
        ? previous *
            Math.exp((-G0 * AIR_MOLAR_MASS_KG * thickness) / (GAS_CONSTANT * baseTemperature))
        : previous *
            (baseTemperature / (baseTemperature + lapse * thickness)) **
              ((G0 * AIR_MOLAR_MASS_KG) / (GAS_CONSTANT * lapse))
    );
  }
  return out;
})();

export interface AtmosphericState {
  /** Ambient temperature, K. */
  temperatureK: number;
  /** Ambient pressure, Pa. */
  pressure: Pascals;
}

/**
 * The standard atmosphere at a height above sea level. Heights below zero
 * and above {@link STANDARD_ATMOSPHERE_TOP_M} are clamped to the ends of
 * the table, which is what the standard itself is defined over.
 */
export function standardAtmosphere(height: Meters): AtmosphericState {
  const h = Math.min(Math.max(height, 0), STANDARD_ATMOSPHERE_TOP_M);
  let index = 0;
  for (let i = 0; i < LAYERS.length - 1; i++) {
    const next = LAYERS[i + 1];
    if (next !== undefined && h >= next[0]) index = i + 1;
  }
  const layer = LAYERS[index];
  const basePressure = BASE_PRESSURE[index];
  if (layer === undefined || basePressure === undefined) {
    return { temperatureK: 288.15, pressure: Pa(SEA_LEVEL_PRESSURE_PA) };
  }
  const [baseHeight, baseTemperature, lapse] = layer;
  const rise = h - baseHeight;
  const temperatureK = baseTemperature + lapse * rise;
  const pressure =
    lapse === 0
      ? basePressure * Math.exp((-G0 * AIR_MOLAR_MASS_KG * rise) / (GAS_CONSTANT * baseTemperature))
      : basePressure *
        (baseTemperature / temperatureK) ** ((G0 * AIR_MOLAR_MASS_KG) / (GAS_CONSTANT * lapse));
  return { temperatureK, pressure: Pa(pressure) };
}
