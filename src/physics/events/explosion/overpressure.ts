import { SEA_LEVEL_PRESSURE, TNT_SPECIFIC_ENERGY } from '../../constants.js';
import type { Joules, Meters, Pascals } from '../../units.js';
import { Pa } from '../../units.js';

/**
 * Hopkinson–Cranz (cube-root) scaled distance at sea-level ambient:
 *
 *     Z = R / W^(1/3)     with  W in kg TNT-equivalent, R in metres,
 *                               Z in m · kg^(-1/3)
 *
 * Yields (and hence W) are supplied in joules; conversion uses the
 * definitional 1 kg TNT = 4.184 × 10⁶ J.
 *
 * Source: Hopkinson (1915) / Cranz (1926), as summarised in Glasstone &
 * Dolan (1977), "The Effects of Nuclear Weapons" (3rd ed.), §3.66.
 */
export function scaledDistance(distance: Meters, yieldEnergy: Joules): number {
  const R = distance as number;
  const Wkg = (yieldEnergy as number) / TNT_SPECIFIC_ENERGY;
  return R / Wkg ** (1 / 3);
}

/**
 * Inputs for {@link peakOverpressure}.
 */
export interface OverpressureInput {
  /** Ground-range distance from burst point (m). */
  distance: Meters;
  /** Total explosive yield, energy-equivalent (J). */
  yieldEnergy: Joules;
  /** Ambient atmospheric pressure (Pa). Defaults to sea-level (101 325 Pa). */
  ambientPressure?: Pascals;
}

/**
 * Peak incident overpressure of a TNT charge in free air, via the
 * Kinney–Graham (1985) semi-empirical fit.
 *
 *     P_s / P_0 =  808 · [1 + (Z/4.5)²]
 *                 ───────────────────────────────────────────────────────
 *                 √[1 + (Z/0.048)²] · √[1 + (Z/0.32)²] · √[1 + (Z/1.35)²]
 *
 * where Z = R / W^(1/3) is the Hopkinson–Cranz scaled distance (m/kg^(1/3))
 * and P_0 is the ambient pressure.
 *
 * Source: Kinney & Graham (1985), "Explosive Shocks in Air" (2nd ed.),
 * Springer-Verlag, as written out by Takazawa, Kim & Garcés (2023),
 * "Chemical Blast Standard (1 kg)", Seismological Research Letters
 * 94 (5), 2514–2524, DOI: 10.1785/0220230071.
 *
 * Caveats:
 *   - Free air. A charge on the ground, reflecting perfectly, makes a
 *     hemispherical wave like twice its yield in free air (Takazawa et
 *     al. 2023); the explosion simulator passes a chemical charge at
 *     twice its yield. A nuclear yield puts only about half its energy
 *     into the air shock (Glasstone & Dolan §1.25), which the
 *     reflection restores, so a nuclear burst passes at its yield.
 *   - Airbursts develop a Mach-stem reflection that boosts ground-range
 *     overpressure near the optimum height of burst; the HOB correction
 *     models that separately.
 */
export function peakOverpressure(input: OverpressureInput): Pascals {
  const Z = scaledDistance(input.distance, input.yieldEnergy);
  const P0 = (input.ambientPressure ?? SEA_LEVEL_PRESSURE) as number;

  const numerator = 808 * (1 + (Z / 4.5) ** 2);
  const denominator =
    Math.sqrt(1 + (Z / 0.048) ** 2) *
    Math.sqrt(1 + (Z / 0.32) ** 2) *
    Math.sqrt(1 + (Z / 1.35) ** 2);

  return Pa((numerator / denominator) * P0);
}
