import { EARTH_RADIUS, IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import type { Joules, Meters } from '../units.js';
import { m } from '../units.js';

/**
 * The thermal exposure of an impact's fireball as the Earth Impact Effects
 * Program computes it (rules 146 to 149 of validation/impactThermalRules.ts).
 *
 * Collins, Melosh & Marcus (2005): the fireball of an impact that reaches the
 * ground radiates a fraction η = 3 × 10⁻³ of the energy E it brings there into
 * the half-space above the ground, so the exposure at a range Δ is
 *
 *     Φ = f · η · E / (2π Δ²)                                   (their Eq. 35)
 *
 * where f is the share of the fireball still above the observer's horizon:
 * a fireball of radius R_f = 0.002 E^⅓ (Eq. 32*) sunk by h = (1 − cos(Δ/R⊕))
 * R⊕ (Eq. 37*) shows f = (2/π)(δ − (h/R_f) sin δ), δ = arccos(h/R_f)
 * (Eq. 36*), and none of it once h reaches R_f. The program draws its
 * clothing-ignition ring where Φ = 1 MJ/m² · E_Mt^⅙.
 */

const RE = EARTH_RADIUS as number;
const JOULES_PER_MEGATON = 4.184e15;

/** Eq. 32*: the fireball radius (m) for the energy at the ground. */
function fireballRadius(energy: number): number {
  return energy > 0 ? 0.002 * Math.cbrt(energy) : 0;
}

/** Eqs. 36* and 37*: the share of the fireball above the horizon at a range. */
export function impactFireballVisibleFraction(range: Meters, energy: Joules): number {
  const rf = fireballRadius(energy);
  const d = Math.abs(range);
  if (!(rf > 0) || !Number.isFinite(d)) return 0;
  const h = (1 - Math.cos(Math.min(d, Math.PI * RE) / RE)) * RE;
  if (h >= rf) return 0;
  const delta = Math.acos(h / rf);
  return (2 / Math.PI) * (delta - (h / rf) * Math.sin(delta));
}

/** Eq. 35: the exposure (J/m²) at a range from an impact's fireball. */
export function impactThermalExposure(range: Meters, energy: Joules): number {
  const E = energy as number;
  const d = Math.abs(range);
  if (!(E > 0) || !(d > 0)) return E > 0 ? Infinity : 0;
  return (
    (impactFireballVisibleFraction(range, energy) * IMPACT_LUMINOUS_EFFICIENCY * E) /
    (2 * Math.PI * d * d)
  );
}

/** The program's clothing-ignition exposure (J/m²) for the energy at the ground. */
export function programIgnitionExposure(energy: Joules): number {
  const E = energy as number;
  return E > 0 ? 1e6 * (E / JOULES_PER_MEGATON) ** (1 / 6) : Infinity;
}

/**
 * The farthest range (m) at which a fluence that falls with range reaches the
 * threshold, never beyond half the Earth's circumference; 0 when it does not
 * reach it at a metre.
 */
export function fluenceReach(fluence: (range: number) => number, threshold: number): Meters {
  if (!(threshold > 0)) return m(0);
  let lo = 1;
  let hi = Math.PI * RE;
  if (fluence(lo) < threshold) return m(0);
  if (fluence(hi) >= threshold) return m(hi);
  for (let i = 0; i < 200 && hi - lo > 1e-6 * hi; i++) {
    const mid = Math.sqrt(lo * hi);
    if (fluence(mid) >= threshold) lo = mid;
    else hi = mid;
  }
  return m(lo);
}
