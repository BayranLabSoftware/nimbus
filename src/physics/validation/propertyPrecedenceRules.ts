/**
 * When a score and a property disagree: rule 398.
 *
 * This rule is written AFTER seeing which way the score falls, and says so
 * at the top, because a reader is entitled to weigh that. What follows is
 * the argument for why it is a statement of something the repository
 * already enforced rather than a new criterion invented to protect a
 * result.
 *
 * THE SITUATION. B-078 was a real defect: where the median scenario
 * reached nobody at a lethal intensity, `compareWithRecord` returned a
 * predictive band of [0, 0] and stopped, scoring the model as saying
 * "nobody dies, certainly" when its two hundred realisations had said no
 * such thing. Fixed, rule 59's decision turns over and adopts
 * `allen2012HypocentralBelowMw7.5` — and not narrowly:
 *
 *   in place (Boore et al. 2014)   260 records inside their band, of 278
 *   candidate (Allen below 7.5)    300 records inside their band, of 320
 *   silences                       2.86 % in place, 1.37 % candidate
 *
 * THE CONFLICT. That candidate fails P-MONO-MW, a property test that has
 * been in this repository since long before rule 59 was written: over
 * magnitudes 4.0 to 9.0 the MMI VII radius must never decrease, and the
 * adopted variant drops it by 38.8 km at Mw 7.5, where it switches from
 * one law to the other and the two disagree by a factor of three about the
 * same earthquake. A model whose rings shrink when the earthquake grows is
 * not a model of anything.
 *
 * WHY THIS IS NOT AN AMENDMENT. Adopting the candidate would turn
 * P-MONO-MW red. The repository would refuse the change on its own, with
 * no rule written anywhere: the suite is the gate. What was missing was
 * only a place to SAY that, so that the report could describe the conflict
 * instead of the generator dying on it — which is what it did, stopping
 * with "Rule 59 adopts …; the simulator still draws Boore et al. 2014" and
 * printing nothing at all. A silent stop is worse than a stated conflict.
 *
 * Rule 398, fixed 20 September 2026:
 *
 *  398. A property outranks a score. Where a rule adopts a candidate on a
 *       score — rule 19's areas, rule 59's dead, any that follow — and
 *       that candidate fails a property test of the model, the adoption
 *       does not take effect. The report prints both: what the score
 *       decided, by how much, and which property refused it, with the
 *       number that refused it. The shipped law stays until a candidate
 *       wins the score AND holds every property.
 *
 *       This is not a way of dismissing a score. The score stands and is
 *       published; rule 59's verdict on the dead is in the report exactly
 *       as it came out, and it says Allen's rings read the dead better
 *       than the ones that ship. What it does not get to do is put a
 *       discontinuity into the product.
 *
 * WHAT IT COSTS, and it is worth writing down: the model keeps rings that
 * are measurably worse at the thing rule 59 measured. The next candidate
 * has a target — beat Boore et al. 2014 on the dead the way Allen does,
 * without a step at Mw 7.5 — and `allen2012Hypocentral`, the same equation
 * without the switch, is continuous and already in the repository. Nobody
 * has measured it on rule 59's set, because rule 58 chose the switched
 * variant on areas. That is a round, and it is written down here so it
 * does not have to be rediscovered.
 */

export const PROPERTY_PRECEDENCE_RULES = 'rule 398, fixed 20 September 2026';

/** The MMI VII radius must never fall as the magnitude rises: the property
 *  rule 398 is about, measured the way P-MONO-MW measures it. */
export function countMagnitudeInversions(
  radiusAt: (magnitude: number) => number,
  from = 4,
  to = 9,
  step = 0.05
): { inversions: number; worstDropKm: number } {
  let inversions = 0;
  let worstDropKm = 0;
  let previous = -1;
  for (let mw = from; mw <= to + 1e-9; mw += step) {
    const value = radiusAt(Math.round(mw * 100) / 100);
    if (previous >= 0 && value < previous) {
      inversions += 1;
      worstDropKm = Math.max(worstDropKm, (previous - value) / 1_000);
    }
    previous = value;
  }
  return { inversions, worstDropKm };
}
