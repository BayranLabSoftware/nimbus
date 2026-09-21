import { DRE_DENSITY } from '../../constants.js';
import { standardAtmosphere } from '../../effects/standardAtmosphere.js';
import {
  AIR_MOLAR_MASS,
  CEILING_ADIABATIC_EXPONENT,
  CEILING_PLUME_MOLAR_MASS,
  CEILING_VENT_TEMPERATURE_K,
} from '../../validation/plumeCeilingRules.js';
import type { KilogramPerCubicMeter, Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Mastin et al. (2009) H ∝ V̇^0.241 coefficient (volume-rate form).
 * The published Eq. 1 of the paper reads H_km = 2.00 · V̇_m³/s^0.241
 * for an "average" Plinian eruption, with ~±50 % scatter across the
 * dataset. The coefficient is exported so callers can apply their
 * own calibration if they want to.
 */
export const MASTIN_2009_COEFFICIENT = 2.0;
export const MASTIN_2009_EXPONENT = 0.241;

export interface PlumeHeightInput {
  /** Volume eruption rate V̇ (m³/s), volumes measured as DRE. */
  volumeEruptionRate: number;
  /** Surface gravity — unused by Mastin 2009 but reserved for future
   *  extensions that scale with g on non-Earth bodies. */
  surfaceGravity?: number;
}

/**
 * Plinian-plume height above the vent from the Mastin et al. (2009)
 * empirical scaling:
 *
 *     H = 2.00 · V̇^0.241       (H in km, V̇ in m³/s)
 *
 * Fitted against 34 historical eruptions ranging over six orders of
 * magnitude in mass eruption rate. Reproduces the Krakatoa-class
 * (V̇ ≈ 2 × 10⁵ m³/s) ≈ 38 km plume and the Mt. St. Helens 1980
 * (V̇ ≈ 4 × 10³ m³/s) ≈ 14 km plume to within the ±30 % scatter band
 * documented in the paper.
 *
 * Source: Mastin, Guffanti, Servranckx, Webley, Barsotti, Dean,
 * Durant, Ewert, Neri, Rose, Schneider, Siebert, Stunder, Swanson,
 * Tupper, Volentik & Waythomas (2009), "A multidisciplinary effort
 * to assign realistic source parameters to models of volcanic
 * ash-cloud transport and dispersion during eruptions",
 * J. Volcanol. Geotherm. Res. 186(1-2), pp. 10–21, Eq. 1.
 * DOI: 10.1016/j.jvolgeores.2009.01.008.
 */
export function plumeHeight(input: PlumeHeightInput): Meters {
  const heightKm = MASTIN_2009_COEFFICIENT * input.volumeEruptionRate ** MASTIN_2009_EXPONENT;
  // Rule 599: a minimum, not a rewrite. Below the crossing the relation is
  // untouched; above it the relation is a fit outside its box and the
  // atmosphere decides instead.
  return m(Math.min(heightKm * 1_000, PLUME_CEILING_ABOVE_VENT_M));
}

/**
 * The highest a volcanic plume can rise above its vent, in metres — rules
 * 593 to 604.
 *
 * A plume rises because it is lighter than the air around it. It expands as
 * it rises and expanding cools it, so there is a height at which it is no
 * longer lighter, and no eruption rate can carry it past that height. The
 * level is where
 *
 *     T_plume / T_air  =  M_plume / M_air
 *
 * with the plume expanding adiabatically from the vent,
 * T_plume(P) = T_vent · (P / P_vent)^κ, and T_air and P from the US
 * Standard Atmosphere 1976.
 *
 * Rule 595 takes every parameter at the value that puts the level higher,
 * so what comes back is a BOUND and not a prediction: the plume is pure
 * water vapour, the lightest a volcanic plume can be; it is at 1 700 K,
 * above any terrestrial magma; and it entrains nothing and radiates
 * nothing, so it keeps every joule it left the vent with. A real column is
 * mostly entrained air with ash in it and reaches its own neutral level far
 * lower — 36 to 45 km for a silicate column at 1 100 to 1 700 K, which is
 * where Pinatubo (≈ 40 km) and Tambora (≈ 43 km) sit.
 *
 * The bound is on the height ABOVE THE VENT and barely depends on where the
 * vent is: 71.9 km from sea level, 72.0 km from 7 000 m.
 */
export function plumeCeilingAboveVent(ventElevation: Meters = m(0)): Meters {
  const ventPressure = standardAtmosphere(ventElevation).pressure as number;
  const massRatio = CEILING_PLUME_MOLAR_MASS / AIR_MOLAR_MASS;
  const stillLighter = (height: number): boolean => {
    const air = standardAtmosphere(m(height));
    const plumeK =
      CEILING_VENT_TEMPERATURE_K *
      ((air.pressure as number) / ventPressure) ** CEILING_ADIABATIC_EXPONENT;
    return plumeK / air.temperatureK > massRatio;
  };
  let low = (ventElevation as number) + 1;
  let high = 84_852;
  if (stillLighter(high)) return m(high - (ventElevation as number));
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (stillLighter(mid)) low = mid;
    else high = mid;
  }
  return m((low + high) / 2 - (ventElevation as number));
}

/** Rule 601: the ceiling `plumeHeight` applies, from a vent at sea level. */
export const PLUME_CEILING_ABOVE_VENT_M = plumeCeilingAboveVent() as number;

/**
 * Inverse of {@link plumeHeight}: the Mastin 2009 volume-rate that
 * sustains a column of the requested height above vent.
 *
 *     V̇ = (H / 2.00)^(1 / 0.241)
 */
export function volumeEruptionRateFromPlume(plumeHeight: Meters): number {
  const heightKm = (plumeHeight as number) / 1_000;
  return (heightKm / MASTIN_2009_COEFFICIENT) ** (1 / MASTIN_2009_EXPONENT);
}

/**
 * Convenience: mass eruption rate (kg/s) from Mastin 2009 volume rate,
 * using the DRE density as the conversion factor (default 2 500 kg/m³).
 */
export function massEruptionRateFromPlume(
  plumeHeight: Meters,
  density: KilogramPerCubicMeter = DRE_DENSITY
): number {
  return volumeEruptionRateFromPlume(plumeHeight) * (density as number);
}
