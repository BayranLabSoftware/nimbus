import { NUCLEAR_THERMAL_PARTITION } from '../constants.js';
import type { Joules, Meters, SquareMeters } from '../units.js';
import { m } from '../units.js';
import { ignitionFluenceThreshold } from './ignitionExposure.js';

/**
 * Thermal-pulse fire-hazard metrics shared between nuclear explosions
 * and cosmic impacts. Both events emit a brief bright pulse whose
 * fluence falls with 1/r²; the receiver thresholds are the same.
 *
 * The fluence is Glasstone & Dolan's (1977) energy spread over a sphere
 * (§7.94–7.96). The thermal partition f is the fraction of total event
 * energy emitted as light in the thermal-pulse band; 0.35 (default) is
 * their value for a nuclear air burst (§1.25). For cosmic impacts
 * Collins et al. (2005) take a luminous efficiency of 3 × 10⁻³, within
 * 10⁻⁴–10⁻², which callers supply explicitly.
 *
 * The two thresholds are the book's own, from Table 7.40 — the shredded
 * newspaper for the fire, the douglas fir plywood for the mass fire — read at
 * the scenario's yield by effects/ignitionExposure.ts. Until 19 September 2026
 * they were two flat numbers of the project's own, 10 cal/cm² for the fire and
 * 6 for the mass fire, which put the mass fire outside the fire at every scale
 * (B-061). Rules 227 to 234 of validation/massFireRules.ts say what replaced
 * them and what decided it.
 */

export interface FirestormInput {
  /** Total event yield — nuclear J or impact kinetic-energy J. */
  yieldEnergy: Joules;
  /** Fraction emitted as thermal radiation. Defaults to 0.35 (nuclear). */
  thermalPartition?: number;
  /** Atmospheric transmission factor τ ∈ (0, 1]. Defaults to 1. */
  atmosphericTransmission?: number;
}

/**
 * §7.58's fourth minimum requirement for a fire storm: "a minimum burning area
 * of about half a square mile". In square metres.
 *
 * The other three — at least 8 pounds of combustibles per square foot, at
 * least half the structures alight at once, a wind under 8 miles per hour —
 * want a fuel map and a weather this model does not hold, and are declared
 * assumed rather than met (rule 229). §7.58 says in the same breath that there
 * is no generally accepted definition of a fire storm and that the conditions
 * under which one may be expected are not known.
 */
export const MINIMUM_BURNING_AREA_M2 = 0.5 * 2_589_988.110336;

/** Whether a burning area clears §7.58's fourth requirement. Below it there is
 *  no fire storm, and the model reports none — radius and area both zero. */
export function passesMinimumBurningArea(area: SquareMeters | number): boolean {
  return Number.isFinite(area) && area >= MINIMUM_BURNING_AREA_M2;
}

/**
 * Range at which the incident thermal fluence drops to the exposure Table 7.40
 * gives for shredded newspaper at this yield — 4 cal/cm² at 35 kt, 6 at
 * 1.4 Mt, 11 at 20 Mt. The lightest household tinder the table lists, and so
 * the outer of the two fire rings: beyond it, nothing the table knows of
 * catches from the flash.
 */
export function flammableIgnitionRadius(input: FirestormInput): Meters {
  return thresholdRadius(input, ignitionFluenceThreshold('tinder', input.yieldEnergy));
}

/**
 * Range at which the fluence drops to the exposure Table 7.40 gives for
 * douglas fir plywood — 9 cal/cm² at 35 kt, 16 at 1.4 Mt, 20 at 20 Mt, its one
 * structural surface recorded as flaming during the exposure itself. It stands
 * for the second of §7.58's four requirements, half the structures in the area
 * on fire simultaneously, and it is the inner of the two rings: a mass fire is
 * contained by the fire that feeds it, which is how §7.71 reads Hiroshima.
 *
 * The caller applies {@link passesMinimumBurningArea} to what this returns —
 * below half a square mile of burning ground there is no fire storm at all.
 */
export function firestormSustainRadius(input: FirestormInput): Meters {
  return thresholdRadius(input, ignitionFluenceThreshold('structural', input.yieldEnergy));
}

function thresholdRadius(input: FirestormInput, fluenceThreshold: number): Meters {
  const W = input.yieldEnergy as number;
  const f = input.thermalPartition ?? NUCLEAR_THERMAL_PARTITION;
  const tau = input.atmosphericTransmission ?? 1;
  if (!Number.isFinite(W) || W <= 0 || fluenceThreshold <= 0) return m(0);
  return m(Math.sqrt((f * tau * W) / (4 * Math.PI * fluenceThreshold)));
}
