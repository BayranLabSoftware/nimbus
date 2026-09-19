/**
 * A toll that names its causes has to name them right.
 *
 * Rules 261 to 266 put the model's death toll on Japan's own record, per head
 * and by distance, and it lands: 1.01 × at Hiroshima and 1.04 × at Nagasaki.
 * Then rule 264 named three things it was not allowed to touch, and one of
 * them was that the model carries no initial radiation at all where §12.16
 * makes it 5 to 15 % of Japan's fatalities.
 *
 * Read by cause instead of by total, the model is further from the book than
 * the total suggests. Its own hazards, on the book's populations:
 *
 *                  Hiroshima   Nagasaki    the book
 *   blast            62.4 %     70.8 %     the rest
 *   deferred         27.8 %     24.1 %     (not a cause, a delay)
 *   burns             9.7 %      5.2 %     "some 50 percent of the deaths
 *                                           were caused by burns of one kind
 *                                           or another" (§12.13)
 *   initial radiation    0 %        0 %    "from 5 to 15 percent of the total
 *                                           fatalities" (§12.16)
 *   mass fire            0 %        0 %    (moved to the band by rule 261)
 *
 * The total is right and the causes are not. And the radiation is not merely
 * mis-weighted: it is absent. The model computes three contours for it — LD₁₀₀
 * at 800 rad, LD₅₀ at 450, the acute-radiation-syndrome threshold at 100, all
 * from Glasstone & Dolan's own dose-against-range curves — and DRAWS the LD₅₀
 * ring on the globe, at 1.33 km for Hiroshima, where it kills nobody. A
 * quantity published, drawn, and not counted.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: §12.13, §12.16 and §12.17 of Glasstone & Dolan; the mix above;
 * the three radii and the doses they are drawn at; and a calculation, made
 * while the candidate was being chosen, of what the free-field dose would add
 * if nobody were shielded — which is what rule 281 turns on.
 *
 * The rules, fixed on 20 September 2026, before the candidate was written, and
 * numbered after the two hundred and seventy-eight before them:
 *
 * 279. The candidate. The initial radiation becomes a hazard of an explosion's
 *      toll, on the three radii the model already computes and draws: mortality
 *      1 inside LD₁₀₀, falling linearly through 0.5 at LD₅₀ to 0 at the
 *      acute-radiation-syndrome threshold, and acting on the survivors of
 *      everything else exactly as every other layer does — which is how OTA
 *      stacks its own, and how rules 261 to 266 left the stack.
 *
 * 280. Where it does not go. An impact has no initial nuclear radiation, so
 *      the hazard is an explosion's alone; the plan takes the radii only when
 *      a caller has them, and an impact passes none.
 *
 * 281. No shielding factor, and why not. §12.17 records that the death rate
 *      was greatest among those in the open, less for people in wood-frame
 *      houses and least of all in concrete, so a shielding fraction is
 *      physically right — and it would be a new project constant with no
 *      published value for a 1945 Japanese city. It is not introduced. The
 *      free-field dose is applied to everyone, which overstates, and the
 *      measurement is allowed to say whether the overstatement matters.
 *
 * 282. What decides.
 *      (a) The radiation's share of the dead lands inside §12.16's 5 to 15 %
 *          on both cities. Outside it on either, the candidate is refused and
 *          rule 281's shielding becomes the next question rather than a
 *          knob to reach for now.
 *      (b) Each city's total stays within a quarter of the record, which is
 *          the bound rule 263 fixed, and the middle zone with it.
 *      (c) The release gate stays PASS, and the two audits it now reads stay
 *          clean.
 *      (d) No constant other than the three doses already in the module is
 *          touched, and those are not touched either.
 *
 * 283. What is printed: the mix before and after against §12.13 and §12.16,
 *      the three radii for both cities, the per-zone mortality, and every toll
 *      of the calibration net that moves.
 *
 * 284. What this does NOT fix, and is a round of its own: the burns, 9.7 % and
 *      5.2 % where the book says about half the dead. Adding radiation does
 *      not touch them, and the blast share stays correspondingly too large. So
 *      does the innermost zone, 98.3 % against a recorded 85.6 and 88.3, and
 *      the outermost, where below 2 psi the model still carries nothing.
 *
 * 285. What may not happen. Nothing is re-tuned to catch a toll that moves
 *      (rules 5 and 6), and no bound is widened. If a total leaves its
 *      quarter, the candidate is refused.
 *
 * What these rules cannot settle. Whether a linear fall between three doses is
 * the shape of the mortality curve — it is the shape the three radii define
 * between them, and the real curve is sigmoid. Whether the deferred deaths,
 * which are 28 % of the model's toll and no cause at all, hide burns that the
 * book counts as burns: they are a share of the injured, and the injured were
 * injured by something. And the whole of rule 284.
 */

/** §12.16: the share of Japan's fatalities the book gives the initial nuclear
 *  radiation. Rule 282(a) scores the model's share against it. */
export const JAPAN_RADIATION_SHARE = { low: 0.05, high: 0.15 } as const;

/** §12.13: "some 50 percent of the deaths were caused by burns of one kind or
 *  another" — printed beside the result by rule 283, and rule 284's subject. */
export const JAPAN_BURN_SHARE = 0.5;

/**
 * Rule 279's curve: the share of the unshielded who die of the initial dose at
 * a ground range, from the three contours the model already draws. One inside
 * LD₁₀₀, a half at LD₅₀, nothing at the acute-radiation-syndrome line, linear
 * between.
 */
export function initialRadiationMortality(
  rangeM: number,
  ld100M: number,
  ld50M: number,
  arsM: number
): number {
  if (!Number.isFinite(rangeM) || rangeM < 0) return 0;
  if (!(ld50M > 0) || !(arsM > ld50M)) return 0;
  if (rangeM <= ld100M) return 1;
  if (rangeM >= arsM) return 0;
  if (rangeM <= ld50M) {
    const span = Math.max(ld50M - ld100M, 1e-9);
    return 1 - (0.5 * (rangeM - ld100M)) / span;
  }
  return 0.5 * (1 - (rangeM - ld50M) / Math.max(arsM - ld50M, 1e-9));
}

/**
 * The outcome of the round, written after the candidate was measured and not
 * before. Left null until then, so a reader can tell a rule from a result.
 */
export const JAPAN_MIX_OUTCOME: string | null = null;
