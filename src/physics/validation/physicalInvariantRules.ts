/**
 * Rules 548 to 554 — the invariants G5 does not read, 21 September 2026,
 * written and pushed before a single one of them was measured.
 *
 * WHERE THIS COMES FROM. B-084 was found last night by accident: a round
 * measuring a candidate for the confined basin ran the fair comparison
 * against the shipped subaerial branch and noticed it was drawing waves
 * taller than the water they were in. 278 of the invariant sweep's 1 827
 * subaerial scenarios, the worst at 1 102 times the depth, and the sweep had
 * been walking past all of them for five days.
 *
 * It walked past them because G5's clauses are the ones G5 names: finite
 * numbers, no area larger than the Earth, no distance past the antipode, and
 * monotone where the physics is. A 594 m wave is a finite length, so nothing
 * fired. The defect was not hidden — it was simply never asked about.
 *
 * RULE 548. WHAT THIS ROUND IS. An audit. It changes no default, adopts
 * nothing and scores nothing: it asks a fixed list of questions of the same
 * 5 000-scenario sweep each domain already runs, and publishes every answer.
 * Whatever it finds is registered as a defect and repaired in its own round
 * with its own rules — not here.
 *
 * RULE 549. THE LIST IS FIXED NOW, BEFORE ANY OF IT IS RUN, and this is the
 * whole point of writing the rules first. An audit whose questions are
 * chosen after the answers are known reports the interesting failures and
 * quietly drops the boring passes, which flatters the auditor and tells a
 * reader nothing about coverage. Seven questions, every one of them a
 * statement that is true of the world rather than a modelling preference:
 *
 *   (a) NESTING. A more severe threshold's ring is never larger than a less
 *       severe one's. MMI IX inside VIII inside VII; 20 psi inside 5 psi
 *       inside 1 psi; the same for every graded ring a domain draws.
 *   (b) A WAVE INSIDE ITS WATER. No wave amplitude exceeds the still water
 *       depth it is computed in. This is B-084's question, asked of every
 *       path that makes a wave and not only the one it was found on.
 *   (c) A TOLL INSIDE ITS EXPOSURE. No death count exceeds the number of
 *       people the same footprint contains.
 *   (d) ENERGY. Nothing deposits more energy at the ground than it arrived
 *       with, and no fraction of a total lies outside [0, 1].
 *   (e) A CRATER'S SHAPE. A crater is not deeper than it is wide.
 *   (f) AN AIRBURST IS IN THE AIR. An event the model classes as a complete
 *       airburst has a burst altitude above the ground.
 *   (g) NOTHING NEGATIVE. No radius, area, depth, height, duration or count
 *       is below zero anywhere.
 *
 * RULE 550. WHAT IS *NOT* ASKED, named so the coverage claim is honest.
 * Nothing about accuracy — this audit cannot tell whether a number is right,
 * only whether it is possible. Nothing about the ashfall's downwind profile,
 * because a wind field makes "decreasing with distance" a modelling question
 * rather than a fact. Nothing about arrival times. And nothing that G5
 * already reads, since the point is the gap beside it.
 *
 * RULE 551. THE SAME SCENARIOS, NOT NEW ONES. The audit runs the seeded
 * 5 000 per domain that `scripts/benchmark/invariants.ts` draws, with that
 * file's own seeds, so that what it finds is exactly what the existing sweep
 * has been walking past. A different draw would not be able to say that.
 *
 * RULE 552. EVERY ANSWER IS PUBLISHED, including the zeroes. A question with
 * no violations is as much a result as one with 278, and a reader deciding
 * whether to trust this product needs the list of what was asked, not the
 * list of what broke.
 *
 * RULE 553. A VIOLATION IS A DEFECT UNLESS THE MODEL DECLARES IT. If a
 * scenario breaks one of these and the result already names the limit it is
 * outside of, that is still a defect — B-084 named its limits and was still
 * drawing an impossible wave — but the registry entry says so, because a
 * declared impossibility and a silent one are different sizes of problem.
 *
 * RULE 554. NO REPAIRS IN THIS ROUND. Whatever this finds, the fix is a
 * separate block with rules written before it. The temptation at four in the
 * morning is to fix the small ones while they are in front of you, and a fix
 * bundled with the audit that found it cannot be reviewed as either.
 */

/** Rule 549: the seven questions, in the order they are asked and printed. */
export const INVARIANT_QUESTIONS = [
  'nesting',
  'waveInsideItsWater',
  'tollInsideItsExposure',
  'energy',
  'craterShape',
  'airburstIsInTheAir',
  'nothingNegative',
] as const;

export type InvariantQuestion = (typeof INVARIANT_QUESTIONS)[number];

/** Rule 551: the seeds `scripts/benchmark/invariants.ts` draws each domain's
 *  5 000 scenarios with, so the audit walks the same ground. */
export const SWEEP_SEED = (hazard: string): string => `benchmark-2026-09-15-inv-${hazard}`;

/** One scenario's answer to one question. */
export interface InvariantViolation {
  question: InvariantQuestion;
  hazard: string;
  detail: string;
  /** How far past the line it is, as a ratio where that makes sense. */
  ratio: number;
  /** Rule 553: whether the result already names a limit it is outside of. */
  declared: boolean;
}

export const PHYSICAL_INVARIANT_RULES = 'rules 548 to 554, fixed 21 September 2026';
