import type { Meters } from '../units.js';
import { m } from '../units.js';

/**
 * How much of an event reaches the sea, and by what route.
 *
 * One law, two callers. A cosmic impact and a surface detonation are
 * different events, but the question they put to the water is the
 * same one: the sea is some distance away, and something has to cross
 * that distance to lift it. Three answers, in order of how much they
 * lift:
 *
 *   'water'   — the sea is underneath. Everything couples.
 *   'crater'  — the shoreline lies inside the hole being dug, so the
 *               water is part of the excavation and everything that
 *               would have coupled still does.
 *   'ejecta'  — the hole stops short of the water, and what reaches
 *               it is the material thrown beyond the rim. McGetchin,
 *               Settle & Head (1973) measured that blanket falling as
 *               r⁻³ for explosion craters and impact craters alike —
 *               it was never an impact-only law — so the mass landing
 *               past a shore at distance d is the inner reach over d,
 *               continuous at the rim and reaching zero only where
 *               the blanket itself ends.
 *
 * Beyond that last edge there is no mechanism left and the fraction
 * is zero: not a special case, the end of the same curve.
 *
 * A caller with no ejecta model passes no ejecta reach, and the law
 * degrades to "the water is in the crater or it is not" without
 * needing to know it has been simplified.
 */

export interface SeaCoupling {
  /** Which of the three routes carried the energy. */
  mechanism: 'water' | 'crater' | 'ejecta';
  /** Distance from the event to the nearest usable sea (m). */
  shoreDistance: Meters;
  /** Fraction of the water-coupled energy that actually reaches it. */
  fraction: number;
  /** Farthest shore this event can still lift (m). */
  reach: Meters;
}

export interface SeaCouplingInput {
  /** Distance to the sea (m); zero or less means the event is in it. */
  shoreDistanceM: number;
  /** Radius of the crater rim (m). */
  craterRimRadiusM: number;
  /** Radius the water cavity would have if everything coupled (m).
   *  The larger of this and the rim is the reach of full coupling. */
  cavityAtFullCouplingM: number;
  /** Outer edge of the continuous ejecta blanket (m). Omit when the
   *  event has no ejecta model; the law then stops at the crater. */
  ejectaReachM?: number;
}

/** The law. Pure, and the only place either event type decides how
 *  much of itself the sea receives. */
export function computeSeaCoupling(input: SeaCouplingInput): SeaCoupling {
  const shore = Number.isFinite(input.shoreDistanceM) ? Math.max(0, input.shoreDistanceM) : 0;
  const rim = Number.isFinite(input.craterRimRadiusM) ? Math.max(0, input.craterRimRadiusM) : 0;
  const cavity = Number.isFinite(input.cavityAtFullCouplingM)
    ? Math.max(0, input.cavityAtFullCouplingM)
    : 0;
  const innerReach = Math.max(rim, cavity);
  const ejectaReach =
    input.ejectaReachM !== undefined && Number.isFinite(input.ejectaReachM)
      ? Math.max(0, input.ejectaReachM)
      : 0;
  const reach = Math.max(innerReach, ejectaReach);
  const withinReach = shore <= reach;
  const fraction = shore <= innerReach ? 1 : Math.min(1, innerReach / Math.max(shore, 1e-9));
  return {
    mechanism: shore <= 0 ? 'water' : shore <= innerReach ? 'crater' : 'ejecta',
    shoreDistance: m(shore),
    fraction: withinReach ? fraction : 0,
    reach: m(reach),
  };
}
