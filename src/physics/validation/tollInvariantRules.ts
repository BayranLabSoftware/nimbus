/**
 * Rules 586 to 592 — the audit's seventh question, asked at last,
 * 21 September 2026, written and pushed before the run.
 *
 * WHY. Rules 548 to 554 asked seven invariants of the 25 000 scenarios the
 * sweep draws, and six came back clean. The seventh — "a toll inside its
 * exposure" — could not be asked at all, because no result of the sweep
 * carries a toll. That was printed as "NOTHING TO READ" rather than as a
 * zero, and it is the one gap the audit left in its own coverage.
 *
 * It matters more than the others. The largest errors this project measures
 * are in the tolls: 0.13× PAGER's people at MMI VII and above, 0.901× on
 * deaths with a scatter 1.286 times the reference's. A class of invariant
 * that is unchecked there is the worst place to have one.
 *
 * RULE 586. WHAT THIS ROUND IS. An audit, like its parent. It computes a
 * toll for each scenario of the sweep and asks five things of the
 * arithmetic. It changes nothing, adopts nothing and scores nothing.
 *
 * RULE 587. THE PEOPLE ARE SYNTHETIC, AND ON PURPOSE. A hundred to the
 * square kilometre, everywhere, which is what `lowIntensityDeaths.test.ts`
 * already uses. Not the population raster.
 *
 * The question is whether the casualty ARITHMETIC holds — whether a toll can
 * exceed the people it is drawn from, whether a band can be wider than its
 * own bounds, whether the parts sum to the whole. A raster would answer a
 * different question, about where people live and how a circle is counted
 * on a grid, which rules 94 to 101 already measure to a quarter of a per
 * cent. Feeding one in here would make every answer depend on it and none
 * of them cleaner.
 *
 * It also means the round spends nothing: no tile is read, no held-out row
 * is touched, and the run is the sweep's own scenarios and nothing else.
 *
 * RULE 588. THE FIVE, fixed now.
 *
 *   (a) A toll inside its exposure. `deaths` never exceeds `exposed`.
 *   (b) A band that contains its estimate. `deathsLow ≤ deaths ≤
 *       deathsHigh`.
 *   (c) The parts sum to the whole. `promptDeaths + delayedDeaths` equals
 *       `deaths`, to the rounding the estimate does.
 *   (d) Each band inside its own people. No annulus kills more than it
 *       holds.
 *   (e) Nothing negative. No count below zero.
 *
 * Every one is a statement about arithmetic rather than about the world, so
 * unlike its parent this round cannot withdraw a reading for not being a
 * law. If one of these fails it is a defect, full stop.
 *
 * RULE 589. WHICH PLANS. The three the physics layer builds — shaking,
 * blast and pyroclastic — over the domains that build them, on the sweep's
 * own seeded scenarios. A scenario whose plan is null has no toll and is
 * counted as such, not as a pass.
 *
 * RULE 590. WHAT REFUSES IT. Nothing: there is no candidate. What the round
 * can get wrong is the measurement, so every count it prints is of plans the
 * physics layer built and estimates the physics layer made, with no
 * arithmetic of its own beside them. And it prints how many scenarios
 * produced a plan, so a clean answer over three plans is not mistaken for a
 * clean answer over three thousand.
 *
 * RULE 591. NO REPAIRS. Whatever it finds is registered and fixed in its own
 * round, as rule 554 required of its parent, and for the same reason.
 *
 * RULE 592. ONE RUN, AND THE ANSWER IS PUBLISHED WHATEVER IT IS —
 * including, as the parent did, the zeroes.
 */

/** Rule 588: the five, in the order they are asked and printed. */
export const TOLL_INVARIANTS = [
  'tollInsideItsExposure',
  'bandContainsEstimate',
  'partsSumToWhole',
  'bandInsideItsPeople',
  'nothingNegative',
] as const;

export type TollInvariant = (typeof TOLL_INVARIANTS)[number];

/** Rule 587: a hundred people to the square kilometre, everywhere. */
export const PEOPLE_PER_SQUARE_KM = 100;

/** Rule 588(c): the estimate rounds its deaths, so the sum may differ from
 *  the whole by the rounding of the bands it is made of. One person per
 *  band is the most that can cost. */
export const ROUNDING_SLACK_PER_BAND = 1;

export const TOLL_INVARIANT_RULES = 'rules 586 to 592, fixed 21 September 2026';
