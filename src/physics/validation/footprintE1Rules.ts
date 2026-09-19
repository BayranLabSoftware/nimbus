/**
 * E1, read the way the amendment says to read it, on maps nobody here has
 * seen.
 *
 * WHY A NEW SET HAD TO BE BUILT. E1 of `docs/GOLD_STANDARD.md` asks for "a
 * held-out set of at least 300 USGS ShakeMaps of every depth". The project
 * holds several ShakeMap sets and every one of them has been read: rule 11's
 * 370 maps chose the contour law (rules 17 to 19); rule 23's 809 scored the
 * depth candidates and are quoted in the validation report; the Atlas set, the
 * moderate set, the point-source set, the small-deep set, the deep-interface
 * set and the slab set each decided their own rule; and twelve more were spent
 * by rules 316 to 321 on 20 September 2026. A set that has been read is not
 * held out, and no number computed on one can close a rule of the gold
 * standard. So the set is new, and it is fetched.
 *
 * WHERE A SET CAN STILL BE NEW, and it is not luck: it is the shape of what was
 * asked before. Rule 23 took every ShakeMap event of 2008 to 2026 with Mw ≥ 6
 * AND A DEPTH OF 40 KM OR LESS; rule 66 took every M 6 event of 1973 to 2025
 * DEEPER THAN 70 KM. Between 40 and 70 km there is a band neither has ever
 * looked at, and after 1 January 2026 there is a window rule 23's query stops
 * before. Counted on 20 September 2026, before any of them was fetched:
 *
 *   40–70 km, Mw ≥ 6, 1973 to 2026, with a ShakeMap   547
 *   any depth, Mw ≥ 6, 2026-01-01 to 2026-09-20       99
 *
 * WHAT WAS LOOKED AT before these rules were fixed: those two counts, the
 * queries that produce them, rule 23's own wording, and the 1 764 ComCat
 * identifiers the repository's data files already carry. NOT looked at: any
 * event of either band by name, any of their ShakeMap areas, any of their
 * depths or magnitudes beyond the query bounds, and no scenario has been run
 * for any of them.
 *
 * 329. THE SET, fixed here and built by `scripts/build-e1-set.ts`:
 *      (a) query A — ComCat FDSN, starttime 1973-01-01, endtime 2026-01-01,
 *          minmagnitude 6, mindepth 40.001, maxdepth 70, producttype
 *          shakemap;
 *      (b) query B — the same service, starttime 2026-01-01, endtime
 *          2026-09-20, minmagnitude 6, any depth, producttype shakemap;
 *      (c) less every event whose ComCat id, or any id associated with it,
 *          appears in a data file of this repository — the same exclusion
 *          rule 23 applied to rule 11, applied now to everything;
 *      (d) every surviving event of B, then those of A in ascending order of
 *          identifier, up to 300. B first because it is the only part of the
 *          set that carries shallow and deep alike, and E1 asks for every
 *          depth; A is one band of depth and would not, alone, answer the
 *          rule it is measured against.
 *      (e) inputs by rules 1 to 3 from each event's preferred origin,
 *          magnitude and moment tensor, and the ground by rule 20 — the same
 *          reading rule 23 used, so that the two sets differ in their rows and
 *          not in how a row is read;
 *      (f) the footprint is the preferred ShakeMap's low-resolution MMI
 *          coverage summed as rule 18 sums it. An event whose ShakeMap has
 *          none is listed and left out, as rule 23 lists and leaves out its
 *          342.
 *
 *      The rows are written into a data file and COMMITTED BEFORE ANY
 *      CANDIDATE IS SCORED ON THEM, which is what rule 23 did and what makes
 *      "held out" checkable by someone who was not here.
 *
 * 330. THE REFERENCE, and it is a program and not a number: ShakeMap 4 run
 *      here in scenario mode on each row — same origin, same magnitude, same
 *      mechanism, same rupture length and width as ours, the strike rules 295
 *      to 303 find and north where they find none, given to both — with no
 *      stations, no intensity reports and the installation's own
 *      configuration. Its version and configuration are recorded with the
 *      result. This is E1's own reference, in E1's own words.
 *
 * 331. WHAT IS MEASURED, for us and for the reference, on the same rows and
 *      by the same arithmetic:
 *      (a) rule 28's score — the Peirce skill at MMI VII and VIII over hits,
 *          misses, false alarms and silences, with rule 18's 10 km² floor for
 *          "reaches a band" — and its sharpness, the median absolute log
 *          radius ratio where both reach MMI VII;
 *      (b) the bias and σ_ln of the MMI VII area against the published one.
 *      Ours is computed twice: with the single Vs30 the simulator runs on and
 *      with the ground at every point (rules 309 to 321), because the second
 *      is what the product will draw and the first is what every published
 *      figure still stands on.
 *
 * 332. WHAT DECIDES, and there are two bars, not one, and they are reported
 *      separately because they ask different questions.
 *      (a) THE ANCHORED BAR, which is the amendment of 16 September: on the
 *          same rows, our score is no lower than the reference's and our
 *          sharpness no worse. Meeting it means "as good as the field's own
 *          program with the same information", which is what a 9 asks of a
 *          domain where the reference exists.
 *      (b) THE WRITTEN BAR, which is E1 as first drafted: score ≥ 0.50, ≥ 0.40
 *          on the maps drawn on a finite rupture or with ten stations or more,
 *          sharpness ≤ 0.35. Printed whatever it reads.
 *      E1 is declared SATISFIED only if (a) holds and the set is at least 300
 *      rows. If (a) holds and (b) does not, that is recorded as what it is:
 *      the reference does not meet the project's own first draft either, and
 *      the draft was a number chosen before anyone had asked what the
 *      reference reaches.
 *
 * 333. WHAT THIS ROUND MAY NOT DO. It may not change one coefficient, one law,
 *      one bound or one line of the model. It is a measurement and nothing
 *      else: if the answer is no, the answer is no, and the next round is a
 *      different file. No row is dropped after it is fetched except by rule
 *      329(f), which is written before any of them arrives.
 *
 * 334. WHAT IS PRINTED: the set's size and the count it was drawn from; the
 *      hits, misses, false alarms and silences at MMI VII and VIII for the
 *      reference and for both of ours; the three scores and sharpnesses; the
 *      three bias-and-σ pairs; the rows where the reference reaches no band at
 *      all; and the ShakeMap version and configuration that produced them.
 *
 * WHAT THIS CANNOT SETTLE. Whether a ShakeMap is the truth — it is the
 * reference, and where few stations recorded an earthquake it is partly a
 * model itself (rule 23's own caveat). Whether a set drawn from one band of
 * depth and eight months of one year speaks for the world. And the toll: this
 * measures the footprint, and the dead are E3's.
 */

/**
 * THE OUTCOME, measured on 20 September 2026. The rules were pushed in
 * 6b8138b, the set in bf003b0 — before one candidate was run on it — and the
 * three hundred scenarios were run in five processes with ShakeMap 4
 * (`shakemap-modules` 1.2.4, `esi-shakelib` 1.2.6), its own test
 * configuration, `active_crustal_nshmp2014`, WGRW12, AllenEtAl2012, no
 * stations. Three hundred of three hundred returned a grid; none failed.
 *
 * **E1 IS NOT SATISFIED.** Rule 332(a) is outside, and outside by a distance
 * no reading of the numbers softens.
 *
 * | side               | VII H/M/F/S      | VIII H/M/F/S     | score | sharpness | area bias | σ     |
 * |--------------------|------------------|------------------|------:|----------:|----------:|------:|
 * | ShakeMap, no stations | 26/17/10/247  | 3/7/0/290        | 0.433 |     0.144 |    1.262× | 0.924 |
 * | ours, one Vs30     | 43/0/234/23      | 8/2/65/225       | 0.333 |     0.412 |    0.686× | 1.216 |
 * | ours, with field   | 43/0/234/23      | 9/1/236/54       | 0.088 |     0.375 |    0.916× | 1.191 |
 *
 * WHAT THE COLUMNS SAY, and the first two columns say it all: WE NEVER MISS AN
 * MMI VII — nought misses against forty-three hits — AND WE PAINT ONE ALMOST
 * EVERYWHERE. Two hundred and thirty-four of the two hundred and fifty-seven
 * earthquakes whose published map holds no ground at MMI VII get a VII band
 * from us. The reference, given the same source and the same rupture, paints
 * ten. That is the whole gap: the Peirce score subtracts the false-alarm rate
 * from the hit rate, our hit rate is 1.00 and our false-alarm rate 0.91, and
 * 0.09 is what is left.
 *
 * THE FIELD MAKES THIS WORSE, WHILE MAKING THE AREA BETTER, and both halves of
 * that are true and neither cancels the other. With the ground under every
 * point the area bias goes from 0.686× to 0.916× — on the events where both
 * sides draw a VII, our footprint is nearly the published size, where with one
 * Vs30 it was a third too small. And the amplification that fixes the size
 * also pushes a VIII band onto two hundred and thirty-six events that have
 * none, where one Vs30 painted sixty-five, which takes the score from 0.333 to
 * 0.088. The round that adopted the field (rules 316 to 321) measured area and
 * shape against the reference and measured them correctly; it did not measure
 * false alarms, and this is what it did not see.
 *
 * THE REFERENCE DOES NOT MEET THE WRITTEN BAR EITHER: 0.433 against the 0.50
 * rule 332(b) carries, on the same three hundred rows. That number was chosen
 * in the gold standard before anyone had asked what ShakeMap's own scenario
 * mode scores, and the answer is that it does not reach it. This is recorded,
 * as rule 332 says to record it, and it is NOT used to lower anything: the bar
 * that decides is the anchored one, and we are below the reference on both of
 * its clauses.
 *
 * TWO THINGS THAT WEAKEN THIS COMPARISON, and they are stated because they cut
 * in our favour to name them and against us to leave them out:
 *
 *   1. THE REFERENCE RAN ON THE WRONG GROUND. Its configuration carries a
 *      Californian Vs30 grid and nothing else, so every one of its three
 *      hundred scenarios stood on that configuration's default Vs30 while ours
 *      stood on the USGS grid (rule 308(c) declared this when it was first
 *      done). Softer ground makes more bands; the reference was given harder
 *      ground than the world has. Some unknown part of its ten false alarms
 *      against our two hundred and thirty-four is that, and it cannot be
 *      separated without running the reference on its own Vs30 — which its
 *      installation cannot do.
 *   2. A LOW-RESOLUTION COVERAGE CANNOT HOLD A SMALL PEAK. Rule 18's floor is
 *      10 km², and a published low-res grid whose cells are larger than the
 *      true MMI VII patch records no VII at all. Part of our false alarms are
 *      real VIIs the map cannot resolve. The project's own report already says
 *      this of rule 23's set; it says it again here.
 *
 * WHAT THIS SETTLES, and it is worth the three hundred rows: the footprint's
 * first defect is not its size. It is that the model reaches MMI VII where the
 * record holds none, on nine tenths of the earthquakes that hold none — and
 * that defect is made WORSE by the site term that makes the size right. Any
 * round that goes at the contour law from here has to carry both numbers at
 * once, and a candidate that improves the area while adding bands is not an
 * improvement. The gold standard's E1 line stays "not met", with this set, this
 * date and these numbers under it.
 */
export const E1_OUTCOME =
  'NOT SATISFIED, 20 September 2026, on three hundred ShakeMaps of a band and a window no earlier rule had read. Rule 28\u2019s score: 0.433 for ShakeMap\u2019s own scenario mode, 0.333 for us on one Vs30, 0.088 for us with the ground under every point. We never miss an MMI VII (0 of 43) and we paint one on 234 of the 257 earthquakes whose published map holds none, where the reference paints 10. The field fixes the size \u2014 area bias 0.686\u00d7 to 0.916\u00d7 \u2014 and makes the false alarms worse, taking the score from 0.333 to 0.088. The reference does not meet the written bar either (0.433 against 0.50), which is recorded and used to lower nothing.';

/** Rule 329: the two queries, exactly as they will be sent. */
export const E1_QUERIES = {
  deepBand: {
    starttime: '1973-01-01',
    endtime: '2026-01-01',
    minmagnitude: '6',
    mindepth: '40.001',
    maxdepth: '70',
    producttype: 'shakemap',
  },
  after2026: {
    starttime: '2026-01-01',
    endtime: '2026-09-20',
    minmagnitude: '6',
    producttype: 'shakemap',
  },
} as const;

/** Rule 329: what the counts were on the day the rules were fixed, before one
 *  event was fetched. */
export const E1_COUNTED = { deepBand: 547, after2026: 99, seenIds: 1_764 } as const;

/** Rule 329(d): how many rows the set takes. */
export const E1_SET_SIZE = 300;

/** Rule 331(a): a side reaches a band when its ground at or above that
 *  intensity is this much or more — rule 18's floor, unchanged. */
export const E1_BAND_FLOOR_KM2 = 10;

/** Rule 332(b): E1 as first drafted, printed whatever it reads. */
export const E1_WRITTEN_BAR = { score: 0.5, scoreOnModelled: 0.4, sharpness: 0.35 } as const;

/** What rule 331 reads out of one side of one earthquake. */
export interface BandOutcome {
  hits: number;
  misses: number;
  falseAlarms: number;
  silences: number;
}

/** Rule 331(a): the Peirce skill score of a band. Null where a band has no
 *  positives or no negatives at all, which is a band the set cannot score. */
export function peirceSkill(outcome: BandOutcome): number | null {
  const positives = outcome.hits + outcome.misses;
  const negatives = outcome.falseAlarms + outcome.silences;
  if (positives === 0 || negatives === 0) return null;
  return outcome.hits / positives - outcome.falseAlarms / negatives;
}

/** Rule 332(a): the amendment, on a score and a sharpness. Lower sharpness is
 *  better; higher score is better. */
export function anchoredBarHolds(
  ours: { score: number; sharpness: number },
  reference: { score: number; sharpness: number }
): boolean {
  return ours.score >= reference.score && ours.sharpness <= reference.sharpness;
}
