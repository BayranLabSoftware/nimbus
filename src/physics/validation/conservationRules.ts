/**
 * Rules 605 to 612 — the possibility lens, second pass: what comes out
 * cannot be more than what went in. 21 September 2026, written and pushed
 * before the run.
 *
 * WHY. The first pass (rules 548 to 554) asked seven questions of the sweep
 * and six came back clean, but it found three defects along the way that no
 * held-out set would ever catch — B-084, B-085 and B-086, all three closed
 * the same night. Every one lived in the same place: a relation used past
 * the range it was fitted in, giving a number that is finite, positive and
 * impossible. The first pass asked about GEOMETRY — is a radius inside the
 * antipode, is an area inside a sphere. This one asks about ACCOUNTING.
 *
 * A model can put more ash on the ground than the volcano erupted, or more
 * energy into a seismic wave than the impact carried, and no clause of G5
 * would notice, because each number on its own is ordinary. The question is
 * whether they add up.
 *
 * RULE 605. WHAT THIS ROUND IS. An audit. It runs the sweep's own scenarios
 * with the sweep's own seeds, asks seven questions, changes nothing, adopts
 * nothing and scores nothing. Whatever it finds is registered and fixed in
 * its own round, as rule 554 required of its parent.
 *
 * RULE 606. THE SEVEN, fixed now, and they may not grow. The parent round
 * had to withdraw six of its readings for not being laws; the guard against
 * that is to write them down before looking.
 *
 *   (a) ASH LANDS NO DEEPER THAN IT ERUPTED. Inside the 1 mm contour the
 *       deposit is at least 1 mm thick, so it holds at least
 *       area × 1 mm of tephra. That may not exceed what the eruption
 *       produced, as bulk deposit rather than DRE.
 *   (b) A LAHAR DEPOSITS NO MORE THAN ITS OWN VOLUME. The inundated area
 *       times the mean depth its own cross-section implies may not exceed
 *       the lahar volume it was given.
 *   (c) THE AIR GETS NO MORE THAN THE BODY HAD. An impact's atmospheric
 *       yield, and its blast yield, may not exceed its kinetic energy.
 *   (d) A SEISMIC MAGNITUDE IMPLIES NO MORE ENERGY THAN THE EVENT HAD.
 *       Gutenberg and Richter's log₁₀ E_s = 1.5 M + 4.8 turns the magnitude
 *       back into joules; those may not exceed the impactor's kinetic
 *       energy.
 *   (e) THE BLANKET HOLDS NO MORE ROCK THAN THE CRATER LOST. The ejecta
 *       blanket, integrated from the rim out to where it thins to 1 mm on
 *       the model's own profile, may not exceed the transient crater's
 *       excavated volume.
 *   (f) AFTERSHOCKS RELEASE NO MORE MOMENT THAN THE MAINSHOCK. The moments
 *       of the whole sequence, summed, may not exceed the mainshock's; and
 *       no aftershock may be larger than the mainshock.
 *   (g) A FAULT SLIPS WHAT A FAULT CAN SLIP. The slip the moment and the
 *       rupture area imply, M₀ = μ·L·W·D with μ = 3 × 10¹⁰ Pa, may not
 *       exceed 100 m — the largest slip ever measured is Tōhoku's ≈ 50 to
 *       60 m, and this round allows twice it.
 *
 * RULE 607. EVERY ONE IS A LAW, NOT A PREFERENCE. (a), (b), (e) and (f) are
 * conservation; (c) is conservation; (d) is conservation through a
 * published identity; (g) is the one bound taken from observation, and it
 * is set at twice the record so that it can only fire on the impossible.
 * If a reading fails, it is a defect, and the round says so.
 *
 * RULE 608. THE TOLERANCES, fixed now, so that none is chosen after a
 * failure. Each question passes at its bound times 1.0 exactly, except:
 *
 *   - (a) allows the deposit to be 2.5 times the DRE volume, which is the
 *     bulk-to-DRE ratio a fresh fall deposit has, and asks only that the
 *     1 mm contour hold no more than that;
 *   - (e) allows the excavated volume to be the full transient bowl,
 *     πD³/(16√2) for a paraboloid of depth D/(2√2), rather than the third
 *     of it that is usually thrown beyond the rim. Both are generous on
 *     purpose: a question that fires at 1.05× is measuring its own
 *     tolerance, and one that fires at 10× is measuring the model.
 *
 * RULE 609. WHAT IT PRINTS. For each question: how many scenarios could be
 * asked it at all, how many failed, the worst ratio, and four examples. A
 * question no scenario can be asked prints NOTHING TO READ and not a zero —
 * the parent round's own rule, and the reason its seventh question became
 * rules 586 to 592 instead of a clean sheet.
 *
 * RULE 610. THE FIELDS ARE READ FROM THE MODEL FIRST. The parent round's
 * first draft searched four paths that do not exist and would have reported
 * a clean answer on four of seven questions. Every path below was taken
 * from a dump of the sweep's own output before this file was written, and
 * rule 609's count is what catches it if one is still wrong.
 *
 * RULE 611. NO REPAIRS IN THIS ROUND, and no re-tuning of the seven or of
 * rule 608's tolerances after the run.
 *
 * RULE 612. ONE RUN, and the answer is published whatever it is —
 * including the zeroes.
 */

/** Rule 606: the seven, in the order they are asked and printed. */
export const CONSERVATION_QUESTIONS = [
  'ashLandsNoDeeperThanItErupted',
  'laharDepositsNoMoreThanItsVolume',
  'airGetsNoMoreThanTheBodyHad',
  'seismicImpliesNoMoreThanTheEventHad',
  'blanketHoldsNoMoreThanTheCraterLost',
  'aftershocksReleaseNoMoreThanTheMainshock',
  'aFaultSlipsWhatAFaultCanSlip',
] as const;

export type ConservationQuestion = (typeof CONSERVATION_QUESTIONS)[number];

/** Rule 608(a): bulk deposit to dense-rock-equivalent for a fresh fall. */
export const BULK_TO_DRE = 2.5;

/** Rule 606(g): twice the largest slip ever measured, in metres. */
export const MAX_CREDIBLE_SLIP_M = 100;

/** Rule 606(g): crustal rigidity, Pa. */
export const CRUSTAL_RIGIDITY_PA = 3e10;

/** Rule 606(d): Gutenberg & Richter's radiated-energy identity,
 *  log₁₀ E_s (J) = 1.5 M + 4.8. */
export function radiatedSeismicEnergy(magnitude: number): number {
  return 10 ** (1.5 * magnitude + 4.8);
}

/** Rule 606(f): the seismic moment of a magnitude, N·m (Hanks & Kanamori
 *  1979, log₁₀ M₀ = 1.5 M + 9.1). */
export function seismicMomentOf(magnitude: number): number {
  return 10 ** (1.5 * magnitude + 9.1);
}

export const CONSERVATION_RULES = 'rules 605 to 612, fixed 21 September 2026';
