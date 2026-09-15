import type { ContourLaw, LowIntensityDeaths } from '../events/earthquake/simulate.js';
import { meanAbsoluteBias } from './contourLaws.js';
import type { ModerateEarthquake } from './lowIntensityRules.js';

/**
 * Allen et al. 2012's hypocentral rings below Mw 7.5, with the dead of the V
 * and VI bands, checked on tolls no rule has read.
 *
 * Rule 58 chose Allen, Wald & Worden's hypocentral equation below Mw 7.5 on
 * the ShakeMap Atlas of 1973 to 1999, by a score that credits a band rightly
 * left blank: 0.42 against Boore et al. 2014's 0.06. Rule 59 then found its
 * band holding 81 of rule 11's 113 records below Mw 6.5, and afterwards that
 * 26 of the 32 it missed were bands of [0, 0] about earthquakes that killed
 * (docs/SCIENCE.md, "The rings when a silence counts"). The toll counts the
 * dead inside the MMI VII ring only; rule 46 wrote two ways of counting them
 * in the V and VI bands, which rule 47 did not adopt on Boore et al. 2014's
 * rings. Whether the equation with those bands reads the dead well enough to
 * draw the rings is put to tolls no rule has read, and guarded on the sets
 * that showed the fault.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: rule 59's run on rule 11's tolls and what was read after it;
 * rules 45 to 49's run on the moderate set; NCEI's counts of the records the
 * two queries of rule 61 return, and of the windows beside them that were
 * not taken (2026, 1950 to 1972); and, once rule 61's file was read, only its
 * counts, below — not a toll.
 *
 * The rules, fixed on 15 September 2026, before any candidate below was run
 * on any earthquake of rule 61's set, and numbered after the sixty before
 * them:
 *
 *  61. The set. Every record of the NCEI/WDS Global Significant Earthquake
 *      Database dated 2008 to 2025, as the hazard-service API returns them
 *      for minYear=2008 and maxYear=2025 with either minEqMagnitude=4,
 *      maxEqMagnitude=4.99 and maxEqDepth=40 (`small`), or minEqMagnitude=5,
 *      minEqDepth=41 and maxEqDepth=700 (`deep`): 241 records, read on 15
 *      September 2026, outside the years the country curves were fitted on.
 *      Each is matched to a USGS ComCat event by rule 12, among events of
 *      magnitude 3.5 or more, where rule 45 read a catalogue from 4.5;
 *      records that share an event are one row; inputs by rules 1 to 3, the
 *      record by rule 13. An event already read — in rule 11's, 23's, 40's,
 *      45's, 50's or 56's set, among the campaign's PAGER products or its DART
 *      records — is listed and left out. scripts/build-small-deep-set.ts
 *      writes them into smallDeepSetData.ts, and scripts/build-site-vs30.ts
 *      --small-deep their ground, as rule 20 reads it and rule 22 picks it,
 *      into smallDeepSiteData.ts; both are committed before any toll is run
 *      on them: 194 earthquakes (2 records unmatched, 44 events left out).
 *      `small`, 94, all below Mw 6.5, 31 of whose records hold deaths, none
 *      ten or more; `deep`, 100, of which 49 below Mw 6.5, 21 from 6.5 to 7.5
 *      and 30 from 7.5, 44 with deaths and 8 with ten or more; 62 are deeper
 *      than 70 km.
 *  62. The candidates. In place, Boore et al. 2014 counting the dead inside
 *      MMI VII only (`boore2014`, `none`). Against it, Allen et al. 2012's
 *      hypocentral equation below Mw 7.5 and Boore et al. 2014 from it
 *      (`allen2012HypocentralBelowMw7.5`, rule 58's winner), counting the dead
 *      of the V and VI bands its rings draw at 5.0 and 6.0 as rule 46 counts
 *      them: at PAGER's rates for the bands' middles (`midBand`) or for their
 *      integers (`pager`). Everything else is shared — the ground, the
 *      population, the country's curve and the band's sampling. Both laws and
 *      both tolls were coded and held before these rules (rules 24 and 46),
 *      so nothing new is coded.
 *  63. Selection on the dead. On rule 61's earthquakes, on the browser's
 *      ground: each toll's score, the mean over the earthquakes of |ln
 *      ((central + 1) / (record + 1))|, and the records its band holds, as
 *      rule 47 reads them; and rule 19's cells, the share of records held
 *      among the rows with something in each magnitude cell. A candidate is
 *      eligible when its score is no higher than the toll in place's and its
 *      band holds eight records in ten in every cell with rows; the winner is
 *      the eligible candidate with the lower score. With none eligible, Boore
 *      et al. 2014 stays and nothing else runs. Not rule 47's margin: the
 *      rings were chosen on the maps by rule 58, and the dead check a choice
 *      already made, as rule 43 checks one.
 *  64. Guards, on sets already read, on the browser's ground, with the room
 *      rule 48 allows a toll that counts more bands. (a) Rule 11's held-out
 *      tolls: the winner's mean absolute log bias over the three cells no
 *      more than the toll in place's plus 0.10, and its band holding eight
 *      records in ten, among the rows with something, in every cell — the
 *      test the equation alone failed. (b) Rule 23's quiet earthquakes: the
 *      share whose median toll is ten or more no more than the toll in
 *      place's plus 0.01. (c) Rule 45's moderate earthquakes: its rule 47
 *      score no more than the toll in place's plus 0.10. A winner that passes
 *      all three is adopted.
 *  65. What an adoption does, and what is printed. Adopted, the winner draws
 *      the rings and counts the toll of every scenario, in the simulator and
 *      in the harness: `allen2012HypocentralBelowMw7.5` becomes the default
 *      law and its toll the default count below MMI VII. The rules that
 *      decided before keep their verdicts and their printed figures move, as
 *      rule 44 has it; rules 27 to 30 run as written. The report prints every
 *      candidate's figures whatever they read; rows of the net that leave
 *      their band are ungated with their cause, and nothing is re-tuned
 *      (rules 5 and 6). Printed beside, deciding nothing: on rule 61's set,
 *      the equation counting the dead inside MMI VII only and Boore et al.
 *      2014 counting V and VI both ways, to part the law's share from the
 *      toll's; and every candidate on the small and the deep earthquakes
 *      apart.
 *
 * What these rules cannot settle. The set sits away from the earthquakes
 * where the fault showed: the equation was fitted on earthquakes of Mw 5.0
 * to 7.9 within 300 km, so it is extrapolated for the small ones and for the
 * deepest, and on the deep ones a law that reads depth leads a law that does
 * not whatever either counts below VII. A small earthquake's record is often
 * a landslide or one building, which no ring holds. NCEI's criteria admit an
 * earthquake by its damage or its dead, so the set leans towards the ones
 * that did something. The candidates were written after rule 59's misses on
 * rule 11's tolls, so rule 11 can only stop them, not choose them. And the
 * rates below VII are PAGER's, fitted with its bands, which may already
 * count in higher bands some of the dead these count again.
 *
 * Run once, on 15 September 2026, after the rules, the set and the run were
 * committed (a48eb85), and said here rather than folded into the rules above:
 * on rule 61's 194 earthquakes the toll in place scored 0.720 and held 160
 * records; the equation with the V and VI bands at their middles scored 0.565
 * and held 161, at their integers 0.566 and 158. Both read the dead nearer
 * their records, but neither held eight records in ten in every cell — 59 of
 * 88 and 53 of 85 below Mw 6.5, 12 of 16 from 6.5 to 7.5 — so by rule 63
 * neither is eligible, the guards did not run, and Boore et al. 2014 keeps
 * drawing the rings. What was read afterwards is in docs/SCIENCE.md, "The
 * hypocentral equation with the dead of V and VI".
 */

/** An earthquake of rule 61's set: rule 45's columns, and which of the two
 *  NCEI queries its record came from. */
export interface SmallDeepEarthquake extends ModerateEarthquake {
  /** `small`: magnitude 4 to 4.99 in the database, 40 km deep or less;
   *  `deep`: magnitude 5 or more, deeper than 40 km. */
  window: 'small' | 'deep';
}

/** A toll as rule 62 names one: the law that draws the rings and how the
 *  dead below MMI VII are counted. */
export interface AllenTollCandidate {
  key: string;
  law: ContourLaw;
  low: LowIntensityDeaths;
}

/** Rule 62's tolls, the one in place first. */
export const ALLEN_TOLL_CANDIDATES: readonly AllenTollCandidate[] = [
  { key: 'boore2014', law: 'boore2014', low: 'none' },
  { key: 'allenMidBand', law: 'allen2012HypocentralBelowMw7.5', low: 'midBand' },
  { key: 'allenPager', law: 'allen2012HypocentralBelowMw7.5', low: 'pager' },
];

/** Rule 65's tolls printed beside. */
export const ALLEN_TOLL_BESIDE: readonly AllenTollCandidate[] = [
  { key: 'allenNone', law: 'allen2012HypocentralBelowMw7.5', low: 'none' },
  { key: 'booreMidBand', law: 'boore2014', low: 'midBand' },
  { key: 'boorePager', law: 'boore2014', low: 'pager' },
];

/** Rule 63 and 64 (a): the least share of records a band must hold in
 *  every cell with rows. */
export const ALLEN_TOLL_HELD_SHARE = 0.8;
/** Rule 64: the room on rule 11's log bias, rule 23's quiet share and rule
 *  45's score. */
export const ALLEN_TOLL_BIAS_ROOM = 0.1;
export const ALLEN_TOLL_QUIET_ROOM = 0.01;
export const ALLEN_TOLL_MODERATE_ROOM = 0.1;

/** One toll on rule 61's set: its rule 47 score and the share its band
 *  holds in each cell among the rows with something. */
export interface AllenTollReading {
  score: number;
  held: number;
  cells: readonly { inside: number; rows: number }[];
}

/** Rule 63: the eligible candidates and the winner, if any. */
export function chooseAllenToll(readings: Readonly<Record<string, AllenTollReading>>): {
  winner: string | null;
  eligible: string[];
} {
  const inPlace = readings[ALLEN_TOLL_CANDIDATES[0]?.key ?? 'boore2014'];
  if (inPlace === undefined) return { winner: null, eligible: [] };
  const eligible = ALLEN_TOLL_CANDIDATES.slice(1)
    .map((c) => c.key)
    .filter((key) => {
      const r = readings[key];
      return (
        r !== undefined &&
        r.score <= inPlace.score &&
        r.cells.every((c) => c.rows === 0 || c.inside / c.rows >= ALLEN_TOLL_HELD_SHARE)
      );
    });
  const winner = eligible.reduce<string | null>(
    (best, key) =>
      best === null || (readings[key]?.score ?? Infinity) < (readings[best]?.score ?? Infinity)
        ? key
        : best,
    null
  );
  return { winner, eligible };
}

/** Rule 64: whether a winner passes the three guards. */
export function guardAllenToll(
  rule11: {
    inPlace: readonly { bias: number | null }[];
    winner: readonly { bias: number | null; inside: number; rows: number }[];
  },
  quiet: { inPlaceShare: number; winnerShare: number },
  moderate: { inPlaceScore: number; winnerScore: number }
): { adopted: boolean; rule11: boolean; quiet: boolean; moderate: boolean } {
  const logged = (cells: readonly { bias: number | null }[]) =>
    meanAbsoluteBias(cells.map((c) => ({ bias: c.bias === null ? null : Math.log(c.bias) })));
  const onRule11 =
    logged(rule11.winner) <= logged(rule11.inPlace) + ALLEN_TOLL_BIAS_ROOM &&
    rule11.winner.every((c) => c.rows === 0 || c.inside / c.rows >= ALLEN_TOLL_HELD_SHARE);
  const onQuiet = quiet.winnerShare <= quiet.inPlaceShare + ALLEN_TOLL_QUIET_ROOM;
  const onModerate = moderate.winnerScore <= moderate.inPlaceScore + ALLEN_TOLL_MODERATE_ROOM;
  return {
    adopted: onRule11 && onQuiet && onModerate,
    rule11: onRule11,
    quiet: onQuiet,
    moderate: onModerate,
  };
}
