import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { isLeastModelled } from './pointSourceRules.js';
import type { AtlasEarthquake } from './atlasRules.js';

/**
 * A wider jury for the contour law: the rules, written and pushed before
 * a single area of the wider set was scored.
 *
 * Three rounds have now refused Campbell & Bozorgnia 2014 on the areas of
 * SIX ShakeMaps — the last one by a scatter of 1.53 against 1.34, with the
 * candidate better centred (0.92x against 0.73x) and losing no band. Two
 * of those six are Apennine normal-faulting earthquakes that BOTH laws
 * miss by a factor of three or more, and they carry a third of the bands.
 *
 * Rule 18 chose the shipped law on 370 ShakeMaps. These rounds decide on
 * six, because six is what `SHAKEMAP_FOOTPRINTS` carries — one fixture per
 * preset, built by `pnpm shakemap:build` from a hand-written list of
 * events. That is a sample assembled to anchor the presets, being used as
 * evidence for a decision it was never sized for. Ten bands decided the
 * last three rounds.
 *
 * This round adds no physics. It asks one question: does the verdict
 * survive a jury picked by rule instead of by which events happen to have
 * presets?
 *
 * THE TRAP THIS ROUND HAS TO AVOID, written before the criterion because
 * it is the reason the criterion is what it is. Three refusals are on the
 * record and I know exactly which events hurt the candidate most. Any
 * criterion invented now — a magnitude floor just above L'Aquila, a region
 * filter, a station count that happens to drop Amatrice — would be
 * choosing the answer and calling it a rule. So the criterion is built
 * ENTIRELY out of thresholds this repository already uses for other
 * purposes and already ships in code, and then every event that passes it
 * is taken. Nothing is dropped for being awkward.
 *
 * WHAT THIS SET IS NOT: held out. Rule 56's atlas was read once, on
 * 15 September 2026, under rules 56 to 60 — Boore et al. 2014 scored
 * 0.056 on rule 57's Peirce skill, Allen below Mw 7.5 scored 0.418 and
 * won there, and rule 59 refused to adopt it. So these maps have been
 * looked at. Two things limit what that costs and both are stated rather
 * than argued away:
 *
 *   - the score is not the same score. Rule 57 counts hits, misses, false
 *     alarms and silences at a 10 km² threshold. This round reads the
 *     ratio of areas, which rule 57's run never printed for these events;
 *   - the candidate did not exist. Campbell & Bozorgnia 2014 is not among
 *     rule 58's candidates and was written on 20 September 2026, five days
 *     after that run. Nothing in it was fitted, chosen or tuned against
 *     anything read from this set.
 *
 * What it still costs: this is a SECOND reading of the same maps, and a
 * set read twice is worth less than a set read once. It is spent here,
 * knowingly, because the alternative is to keep deciding a contour law on
 * ten bands.
 *
 * AND NO DOWNLOAD IS NEEDED, which is worth saying because it was the
 * expected cost of this round. `scripts/build-atlas-set.ts` already summed
 * each of these maps with `areasAbove` from `build-shakemap-fixtures.ts` —
 * the very function that produced the six fixtures — over the same
 * `coverage_mmi_low_res.covjson` product. The areas have been committed in
 * `atlasSetData.ts` since 15 September. The wider jury was already in the
 * repository; nothing had asked it this question.
 *
 * The rules, fixed on 20 September 2026, numbered after the 404 before
 * them:
 *
 *  405. The set. Every earthquake of rule 56's atlas — 1 101 events with a
 *       low-resolution MMI map, read from ComCat on 15 September 2026 —
 *       that satisfies BOTH:
 *
 *       (a) `isLeastModelled`, which is rule 52's own test and is imported
 *           from `pointSourceRules.ts` rather than restated here: a map
 *           drawn on a finite rupture, or with ten seismic stations or
 *           more. It is the guard rule 58 already leans on, and the reason
 *           it matters is rule 58's own caveat — before stations were
 *           many, a ShakeMap is mostly the relations ShakeMap ran, which
 *           for active crust is the NGA-West2 set, which contains Boore et
 *           al. 2014 AND Campbell & Bozorgnia 2014. Scoring either against
 *           such a map is close to scoring it against itself. The atlas
 *           holds 138 such maps;
 *
 *       (b) a record that reaches MMI 7 somewhere, so that there is a band
 *           to compare at all.
 *
 *       Applied to the atlas as committed that is 116 earthquakes, Mw 6.0
 *       to 8.3, 0 to 36 km deep, of which 110 have a measured MMI VII
 *       area, 60 an MMI VIII and 8 an MMI IX: 178 bands with ground in
 *       them, against the eleven these rounds have been deciding on. {@link widerJury}
 *       computes the list from the criterion, so the set cannot drift from
 *       the rule that defines it, and {@link WIDER_JURY_COUNTS} pins what
 *       it gave on the day the rule was written.
 *
 *  406. The scenario, built from the record and not from a preset. This is
 *       what the six fixtures could not do: each is tied to a preset, and
 *       a preset carries a hand-set strike, depth and mechanism. For each
 *       event of rule 405 the scenario is the product's own answer to its
 *       ComCat row — magnitude, hypocentral depth, latitude, longitude and
 *       fault type exactly as `atlasSetData.ts` holds them, an unknown
 *       mechanism passed as unknown and never hand-assigned, the strike
 *       from `shippedStrikeAnswer` as the globe asks for it, and the
 *       shipped Vs30 tiles under every cell. Where the product would guess,
 *       it guesses; a round that fed the model better inputs than the
 *       product has would be measuring a simulator nobody can run.
 *
 *  407. The measurement, unchanged from rule 393. The model's area at an
 *       intensity is the ground its FIELD covers at that intensity —
 *       `areaAbove` on the grid the globe paints — and not the area of a
 *       ring. The record's area is the atlas's own, as rule 18 sums it.
 *       Both contenders are measured in the same run, on the same events,
 *       by the same code path.
 *
 *  408. Every event is scored, none is dropped. A band where both the
 *       record and the model have ground gives a ratio; a band the record
 *       has and the model leaves blank is a lost band and is counted as
 *       such; a band the model paints where the record has none is counted
 *       as an invented band. All three counts are published for both laws.
 *
 *  409. The verdict, with the clauses of rule 402 unchanged and read on the
 *       wider set: the candidate replaces the shipped law only if its
 *       geometric mean of model-over-record area is no further from 1,
 *       its scatter is no wider, it loses no band the shipped law draws
 *       and the record has, monotonicity in magnitude holds, and the depth
 *       still moves the epicentral intensity by at least one MMI degree
 *       between 5 km and 50 km.
 *
 *  410. And the six are reported beside the 116, not replaced by them. If
 *       the two juries disagree, that disagreement IS the finding of this
 *       round and is published as such. A law chosen on six events and
 *       refused on a hundred and sixteen, or the reverse, says more than
 *       either number alone — and it would say that the three refusals
 *       already on the record were a fact about the sample.
 *
 *  411. One run, no re-tuning, as rule 404. The criterion of rule 405 is
 *       not adjusted after an area is read, no event is added or removed
 *       once the run has been seen, and if a clause of rule 409 fails the
 *       shipped law stays and the numbers are published anyway.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 411 and published
 * as it came out: the candidate is REFUSED a fourth time — and the two
 * clauses that refused it the first three times both PASS.
 *
 * Rule 409, clause by clause, on the 116:
 *
 *   | law       | bands | geometric mean | scatter | combined | lost | invented |
 *   | --------- | ----- | -------------- | ------- | -------- | ---- | -------- |
 *   | boore2014 | 165   | 0.393x         | 1.579   | 1.835    | 13   | 58       |
 *   | CB14      | 155   | **0.656x**     | 1.479   | 1.538    | 23   | 60       |
 *
 *   centred      PASS   0.656x against 0.393x; |ln bias| 0.421 against 0.935
 *   scatter      PASS   1.479 against 1.579 — the clause that refused it
 *                       three times, passed on the wider jury
 *   bands lost   FAIL   the candidate leaves blank 16 bands the shipped law
 *                       draws and the record has: 12 at MMI VIII, 4 at VII
 *   monotonicity PASS   0 inversions over Mw 4.0 to 9.0
 *   depth        PASS   the epicentral intensity falls 1.84, 2.50 and 1.27
 *                       MMI degrees from 5 km to 50 km at Mw 5.5, 6.5, 7.5
 *
 * RULE 410'S FINDING, and it is the reason this round was run: THE TWO
 * JURIES DISAGREE, on exactly the clause that had been deciding.
 *
 *   | jury        | shipped        | candidate      | scatter clause |
 *   | ----------- | -------------- | -------------- | -------------- |
 *   | six events  | 0.733x / 1.336 | 0.918x / 1.529 | candidate WORSE |
 *   | 116 events  | 0.393x / 1.579 | 0.656x / 1.479 | candidate BETTER |
 *
 *   The Z_tor round refused Campbell & Bozorgnia 2014 because its scatter
 *   was 1.53 against 1.34. On a jury picked by rule instead of by which
 *   events have presets, the same two laws in the same code swap places:
 *   1.48 against 1.58. That refusal was a fact about the sample. Two of the
 *   six fixtures are Apennine normal faults that both laws overdraw by
 *   three to eleven times, and on ten bands two events set the scatter.
 *
 * AND A FINDING ABOUT THE SHIPPED LAW, which is not about the candidate at
 * all and matters more. Boore et al. 2014 reads **0.393x** on the wider
 * jury: across 165 bands it draws well under half the ground the ShakeMaps
 * record. The six fixtures said 0.73x. The law the simulator ships is
 * roughly twice as far from centred as six events had been reporting, and
 * nothing but the width of the jury changed to show it.
 *
 * WHY THE CANDIDATE LOSES THOSE 16 BANDS, measured rather than guessed.
 * It is not a defect; it is Campbell & Bozorgnia's nonlinear site term.
 * For the 1979 Imperial Valley earthquake (Mw 6.4 at 15 km, on the valley's
 * deep soft sediments) the epicentral intensity is:
 *
 *   on rock, Vs30 760:   shipped 8.04, candidate 8.53
 *   on soft, Vs30 270:   shipped 8.32, candidate **8.17**
 *
 *   The candidate is the STRONGER law on rock and the weaker one on soft
 *   ground, because its soil term de-amplifies harder as the shaking gets
 *   big. So it spreads a wider MMI VII skirt and reaches MMI VIII less
 *   often, which is exactly the pattern in the counts: it loses 12 MMI VIII
 *   bands and paints 43 where the shipped law paints 52, while beating it
 *   on MMI VII area everywhere.
 *
 * WHAT THE CLAUSE THAT REFUSED IT IS WORTH, said plainly because the rule
 * was fixed before the run and will not be amended after it. At Imperial
 * Valley the record has 485 km² at MMI VIII, the shipped law draws 27 and
 * the candidate draws none. The clause counts that as the shipped law
 * holding a band the candidate loses. It is also the shipped law missing
 * 94 % of that band. A clause that protects a band drawn at a twentieth of
 * its size is protecting very little, and on this jury it is the only thing
 * standing between the candidate and adoption. That is an argument for a
 * better clause in a later round, written before its run like this one —
 * NOT for setting this one aside now that its answer is known.
 *
 * ONE MEASUREMENT ARTEFACT, named so nobody reads the "invented" column as
 * false alarms. The record's area comes from `coverage_mmi_low_res.covjson`,
 * whose cells are coarse: of the 6 events whose record has no MMI VII area,
 * ALL SIX reached MMI VII at their peak, and 17 of the 56 with no MMI VIII
 * area reached MMI VIII. So a good part of both laws' 58 and 60 "invented"
 * bands are bands the earthquake really had and the grid could not resolve.
 * The deciding clause is clean of this: a lost band is one where the record
 * has positive measured area, and all 16 do — from 52 km² to 2 356 km².
 *
 * WHAT THIS ROUND LEAVES. The shipped law stays, by rule 409. Four rounds
 * have now refused this candidate and the refusals have got steadily
 * narrower: one band, one band, a scatter, and now a clause about bands
 * whose own accuracy is 5 %. The candidate is better centred than the
 * shipped law on both juries and better scattered on the wider one. The
 * next round is not another coefficient — it is a clause that can tell a
 * band drawn WELL from a band merely drawn, on a jury of 116 rather than
 * six, and the shipped law's 0.393x is what it has to answer for.
 */

export const WIDER_FOOTPRINT_RULES = 'rules 405 to 411, fixed 20 September 2026';

/** Rule 405(b): the intensity a record must reach to have a band worth
 *  comparing. Rule 405(a)'s threshold is not restated here — it is
 *  `isLeastModelled`, imported, so there is one definition of it. */
export const WIDER_JURY_MIN_MAX_MMI = 7;

/**
 * Rule 405's set, computed from the criterion rather than listed, so that
 * the jury cannot quietly stop being what the rule says it is.
 */
export function widerJury(
  events: readonly AtlasEarthquake[] = ATLAS_EARTHQUAKES
): readonly AtlasEarthquake[] {
  return events.filter((e) => isLeastModelled(e) && e.maxMmi >= WIDER_JURY_MIN_MAX_MMI);
}

/**
 * What rule 405 gave on the day it was written, pinned so that a change to
 * the atlas or to `isLeastModelled` cannot move the jury without a test
 * saying so.
 */
export const WIDER_JURY_COUNTS = {
  leastModelled: 138,
  events: 116,
  bands: { 7: 110, 8: 60, 9: 8 },
  /** The bands the six fixtures' records hold. Ten of the eleven were
   *  scored in the last round: the eleventh is Northridge's MMI VIII,
   *  which the shipped law leaves blank and which is exactly the band
   *  three rounds have argued over. */
  bandsBefore: 11,
  scoredBefore: 10,
} as const;
