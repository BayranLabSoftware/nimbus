import type { FaultType } from '../events/earthquake/ruptureLength.js';
import { meanAbsoluteBias } from './contourLaws.js';

/**
 * Whether the toll counts the dead where the shaking is below MMI VII.
 *
 * The toll of an earthquake counts deaths inside the MMI VII ring only:
 * the bands VII–VIII, VIII–IX and IX and above, each at the rate PAGER's
 * country curve gives at the band's middle, 7.5, 8.5 and 9.5. An
 * earthquake whose rings never reach VII kills nobody. USGS PAGER's
 * empirical model counts the dead from V (usgs/pager,
 * losspager/models/emploss.py), and rule 38 of interfaceRules.ts found a
 * law that rightly draws no VII band about moderate earthquakes reading
 * bands of [0, 0] where a few people died.
 *
 * What was looked at before these rules were written, and is therefore
 * not held out: rule 34's half-chain of BM-03, PAGER's bands and rates on
 * the PGA rings, which read rule 11's held-out tolls at 1.51×, 0.35× and
 * 3.34× against 1.46×, 0.33× and 1.94× in place (docs/SCIENCE.md, "People
 * and deaths against PAGER"); rule 38's misses; the count of the records
 * rule 45's query returns (302); and, once rule 45's file was read, how
 * many earthquakes it holds, by magnitude, fault type and whether their
 * record holds deaths — not a toll.
 *
 * The rules, fixed on 15 September 2026, before either candidate below was
 * coded or run on any earthquake, and numbered after the forty-four before
 * them:
 *
 *  45. The set. Every record of the NCEI/WDS Global Significant Earthquake
 *      Database dated 2008 to 2025 whose magnitude in the database is 5.0
 *      or more and below 6.0 and whose focal depth is 40 km or less, as the
 *      hazard-service API returns them for minYear=2008, maxYear=2025,
 *      minEqMagnitude=5, maxEqMagnitude=5.99 and maxEqDepth=40: 302 records,
 *      read on 15 September 2026, none of them in rule 11's set, which
 *      starts at 6. Each is matched to a USGS ComCat event by rule 12,
 *      among events of magnitude 4.5 or more, where rule 11 read a
 *      catalogue from 5.5; inputs by rules 1 to 3, the record by rule 13.
 *      scripts/build-moderate-set.ts writes them into moderateSetData.ts:
 *      298 earthquakes (3 records unmatched, 1 event already in rule 11's,
 *      rule 23's or rule 40's set left out), 120 of whose records hold
 *      deaths, 21 of them ten or more; ComCat puts 9 below magnitude 5.
 *      Their ground is the browser's, read as rule 20 reads it and picked
 *      as rule 22 picks, in moderateSiteData.ts. Both files are committed
 *      before any toll is run on them.
 *  46. The tolls. In place, `none`: deaths inside the MMI VII ring only.
 *      The candidates add the bands the rings draw below VII, V from 5.0 to
 *      6.0 and VI from 6.0 to 7.0, everything else as in place — Boore et
 *      al. 2014's rings through Worden et al. 2012, drawn at 5.0 and 6.0 as
 *      they are at 7, 8 and 9, the ground, the population, the country's
 *      curve at the epicentre and the band's sampling: `midBand`, V at
 *      PAGER's rate for 5.5 and VI at the rate for 6.5, as the bands above
 *      are counted at their middles; and `pager`, V at the rate for 5 and
 *      VI for 6, as PAGER counts its bins at their integers. An earthquake
 *      with a V ring and no VII ring has a toll. Before any score each is
 *      coded as a scenario input and held to count, above VII, exactly the
 *      deaths in place, and below it the rate its rule names.
 *  47. Selection on the dead. On rule 45's earthquakes, on the browser's
 *      ground, each toll's central figure against the record: the score is
 *      the mean over the earthquakes of |ln((central + 1) / (record + 1))|,
 *      and a band holds a record when it reaches from the record to its
 *      high end. A candidate is eligible when its score is lower than the
 *      toll in place's by ln 1.25 or more and its band holds no fewer
 *      records; the winner is the eligible candidate with the lower score.
 *      With none eligible, the toll in place stays and nothing else runs.
 *  48. Guards, on sets already read, where no candidate has run, on the
 *      browser's ground. (a) Rule 11's held-out tolls, with room as rule 33
 *      has it: the winner's mean absolute log bias over the three magnitude
 *      cells is no more than the toll in place's plus 0.10, and its band
 *      holds eight records in ten, among the rows with something, in every
 *      cell. (b) Rule 23's quiet earthquakes: the share whose median toll
 *      is ten or more is no more than the toll in place's plus 0.01. A toll
 *      that counts more bands adds deaths to every earthquake, so the room
 *      is the one rule 33 allowed a chain on the dead, not none.
 *  49. What an adopted toll does, and what is printed. A winner that passes
 *      both guards is adopted: the toll counts the bands below VII as its
 *      rule names them, in the simulator and in the harness — the net, the
 *      scorecard, the held-out sets and the footprint anchors. The runs of
 *      the rules that decided on the toll in place (19, 25, 33, 38 and 43)
 *      keep it, as rules 17 to 19 kept the rock they ran on, and are not
 *      decided again. The report prints both tolls' figures whatever they
 *      read; rows of the net that leave their band are ungated with their
 *      cause, and nothing is re-tuned (rules 5 and 6). Printed beside,
 *      deciding nothing: each toll's central figure against PAGER's
 *      estimate on the campaign's 187 PAGER products, as rule 34 reads it.
 *
 * What these rules cannot settle. PAGER's curves were fitted to deaths and
 * exposure together, and counting bands its fit may already absorb in
 * higher ones can count some deaths twice. A record of a moderate
 * earthquake is often a landslide, a collapse far from the epicentre or a
 * heart attack, which no ring holds. And NCEI's criteria admit a moderate
 * earthquake by its damage or its dead, so the set leans towards the ones
 * that did something.
 *
 * Run once, on 15 September 2026, after the candidates were committed
 * (6f720e6), and said here rather than folded into the rules above: on rule
 * 45's 298 earthquakes the toll in place scored 1.185 and held 261 records,
 * `midBand` 1.254 and 293, `pager` 1.190 and 295. Neither lowers the score
 * by ln 1.25, so by rule 47 the toll in place stays and nothing else ran.
 * What was read afterwards is in docs/SCIENCE.md, "The dead below MMI VII".
 */

/** An earthquake of rule 45's set, as scripts/build-moderate-set.ts stores
 *  it: rule 11's columns for a record of magnitude 5 to 6. */
export interface ModerateEarthquake {
  /** NCEI record ids; more than one where the database lists one
   *  earthquake twice. */
  nceiIds: readonly number[];
  date: string;
  place: string;
  /** The ComCat event, its preferred origin and magnitude. */
  comcat: string;
  time: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  faultType: FaultType;
  /** NCEI deaths and missing, the earthquake's own. */
  deaths: number;
  missing: number;
}

/** Rule 46's tolls, the one in place first. */
export const LOW_INTENSITY_TOLLS = ['none', 'midBand', 'pager'] as const;

export type LowIntensityToll = (typeof LOW_INTENSITY_TOLLS)[number];

/** Rule 47: how much lower a candidate's score must be. */
export const LOW_INTENSITY_MARGIN = Math.log(1.25);
/** Rule 48 (a): the room on rule 11's mean absolute log bias. */
export const LOW_INTENSITY_BIAS_ROOM = 0.1;
/** Rule 48 (b): the room on the share of quiet earthquakes raised to ten. */
export const LOW_INTENSITY_QUIET_ROOM = 0.01;

/** One recorded earthquake under one toll (rule 47). */
export interface TollRun {
  comcat: string;
  record: number;
  central: number;
  inside: boolean;
}

/** Rule 47's score: the mean of |ln((central + 1) / (record + 1))|. */
export function lowIntensityScore(rows: readonly TollRun[]): number {
  if (rows.length === 0) return 0;
  return (
    rows.reduce((a, r) => a + Math.abs(Math.log((r.central + 1) / (r.record + 1))), 0) / rows.length
  );
}

/** Rule 47: the winner among the candidates, if any. */
export function chooseLowIntensityToll(
  runs: Readonly<Record<LowIntensityToll, readonly TollRun[]>>
): {
  winner: LowIntensityToll;
  eligible: LowIntensityToll[];
  score: Record<LowIntensityToll, number>;
  held: Record<LowIntensityToll, number>;
} {
  const score = Object.fromEntries(
    LOW_INTENSITY_TOLLS.map((t) => [t, lowIntensityScore(runs[t])])
  ) as Record<LowIntensityToll, number>;
  const held = Object.fromEntries(
    LOW_INTENSITY_TOLLS.map((t) => [t, runs[t].filter((r) => r.inside).length])
  ) as Record<LowIntensityToll, number>;
  const eligible = LOW_INTENSITY_TOLLS.filter(
    (t) => t !== 'none' && score.none - score[t] >= LOW_INTENSITY_MARGIN && held[t] >= held.none
  );
  const winner = eligible.reduce<LowIntensityToll>(
    (best, t) => (best === 'none' || score[t] < score[best] ? t : best),
    'none'
  );
  return { winner, eligible, score, held };
}

/** Rule 48: whether a winner passes both guards. */
export function guardLowIntensityToll(
  tolls: {
    inPlace: readonly { bias: number | null }[];
    winner: readonly { bias: number | null; inside: number; rows: number }[];
  },
  quiet: { inPlaceShare: number; winnerShare: number }
): { adopted: boolean; tolls: boolean; quiet: boolean } {
  const logged = (cells: readonly { bias: number | null }[]) =>
    meanAbsoluteBias(cells.map((c) => ({ bias: c.bias === null ? null : Math.log(c.bias) })));
  const onTolls =
    logged(tolls.winner) <= logged(tolls.inPlace) + LOW_INTENSITY_BIAS_ROOM &&
    tolls.winner.every((c) => c.rows === 0 || c.inside / c.rows >= 0.8);
  const onQuiet = quiet.winnerShare <= quiet.inPlaceShare + LOW_INTENSITY_QUIET_ROOM;
  return { adopted: onTolls && onQuiet, tolls: onTolls, quiet: onQuiet };
}
