import { CONTOUR_LAW_MARGIN, meanAbsoluteBias, type ContourCell } from './contourLaws.js';
import { passesOnQuiet, type UnseenEarthquake } from './depthRules.js';
import { SIZE_BANDS } from './scorecard.js';

/**
 * Whether a scenario marked a subduction interface is a rupture stadium
 * below Mw 7.5.
 *
 * Every other earthquake scenario becomes a stadium — the rupture
 * rectangle grown by the ring's radius — from Mw 7.5, and is a disc about
 * the epicentre below. A scenario marked a subduction interface is a
 * stadium at every magnitude, drawn on Strasser et al. 2010's interface
 * rupture. Run by rule 38 of interfaceRules.ts, that mark took Boore et al.
 * 2014's held-out tolls of rule 11's interface earthquakes from 5.06, 1.98
 * and 5.37 times their records, unmarked, to 43.11, 35.77 and 13.21 times
 * (docs/SCIENCE.md, "The rings of a subduction interface"). Those figures
 * were read before these rules were written, and they settle what these
 * rules would otherwise ask of rule 11's set: below Mw 7.5 a scenario
 * marked an interface and drawn as a disc is the unmarked scenario, whose
 * tolls are the first two figures. So the question is put to earthquakes
 * no rule has read.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: rule 38's run and the unmarked tolls beside it; ComCat's count
 * of the events rule 40 lists (179); and, once rule 40's file was read, how
 * many of its earthquakes it holds and classes, by magnitude cell, as
 * quiet or recorded — not a footprint, a map's area or a toll.
 *
 * The rules, fixed on 15 September 2026, before either geometry was run on
 * any earthquake of rule 40's set, and numbered after the thirty-nine
 * before them:
 *
 *  40. The set. Every event USGS ComCat's FDSN event service returns for
 *      starttime 2008-01-01, endtime 2026-01-01, minmagnitude 6,
 *      maxmagnitude 7.4999, a depth above 40 km and no more than 70 km, and
 *      producttype shakemap — 179 on 15 September 2026 — less the events
 *      of rule 11's and rule 23's sets, by the event's ComCat id or any id
 *      associated with it (3). Inputs by rules 1 to 3; the footprint as
 *      rule 18 sums it; the record as rule 23 reads NCEI's database, quiet
 *      where it holds none; an interface earthquake as rule 35 classes one,
 *      its map's interface models weighing 0.5 or more.
 *      scripts/build-deep-interface-set.ts writes it into
 *      deepInterfaceSetData.ts, committed before either geometry runs on
 *      it: 153 earthquakes with a low-resolution MMI map (23 without one,
 *      listed and left out), 64 of them interface earthquakes — 43 below
 *      Mw 6.5, of which 42 quiet, and 21 from Mw 6.5, of which 11 quiet.
 *  41. The geometries. In place, `always`: a scenario marked a subduction
 *      interface is a stadium at every magnitude. The candidate,
 *      `fromMw7.5`: it is a stadium from Mw 7.5, as every other scenario
 *      is, and a disc about the epicentre below. Everything else is shared:
 *      the scenario marked an interface, Boore et al. 2014's rings,
 *      Strasser et al. 2010's interface rupture (which the tsunami keeps
 *      reading), reference rock at Vs30 760 m/s, and the harness. Before
 *      any score, the candidate is coded as a scenario input and held to
 *      draw what the in-place geometry draws at Mw 7.5 and above and on any
 *      scenario not marked, and below Mw 7.5 a disc of the same ring radii.
 *  42. Selection on shaking. Rule 18's score, with its floor, on the
 *      ShakeMaps of rule 40's interface earthquakes, on reference rock, in
 *      the two magnitude cells below Mw 7.5, where the geometries can
 *      differ. The candidate is eligible when its mean absolute bias over
 *      those cells is lower than the stadium's by 0.05 or more.
 *  43. Checked on the dead. An eligible candidate is run, beside the
 *      stadium, on reference rock, on rule 40's interface earthquakes. It
 *      is adopted when both hold. (a) As rule 25 has it, the share of the
 *      quiet ones whose median toll is ten or more is no larger than the
 *      stadium's. (b) On the recorded ones, its band holds no fewer records
 *      than the stadium's in either magnitude cell, and the mean over them
 *      of |ln((central toll + 1) / (record + 1))| is no larger — each
 *      record taken as rule 23 takes it, the dead and, where there are
 *      missing, the dead plus the missing at the high end. Not rule 19's
 *      test, which asks eight records in ten of a whole law in every cell:
 *      this changes a geometry below Mw 7.5 only, and is judged against the
 *      geometry it would replace on the earthquakes it changes; and with
 *      eleven recorded earthquakes, a score that keeps a zero toll in view.
 *  44. What an adopted geometry does, and what is printed. Adopted, a
 *      scenario marked a subduction interface is a stadium from Mw 7.5
 *      only, in the simulator and in the harness, rules 35 to 39's runs
 *      included, whose printed figures then move. The report prints both
 *      geometries' figures whatever they read; rows of the net that leave
 *      their band are ungated with their cause, and nothing is re-tuned
 *      (rules 5 and 6). Printed beside, deciding nothing: both geometries
 *      on rule 35's interface earthquakes below Mw 7.5 in rule 11's and
 *      rule 23's sets, where the candidate's figures are the unmarked
 *      scenario's; the nine maps of rule 40's set with ten seismic stations
 *      or more; and the bands each geometry invents and misses.
 *
 * What these rules cannot settle. The earthquakes rule 40 holds are 40 to
 * 70 km deep, and Boore et al. 2014 draws the rings of a deep earthquake as
 * it draws a shallow one's, so on a map that holds no strong shaking both
 * geometries paint bands, and the smaller paints less; the question is
 * asked of the shallower interface earthquakes on rule 11's and rule 23's
 * sets only beside, where the answer is already known. The set is small,
 * and eleven of its earthquakes have a record. And a map of few stations is
 * still mostly the models USGS runs.
 */

/** An earthquake of rule 40's set, as scripts/build-deep-interface-set.ts
 *  stores it: rule 23's columns, and what rule 35 reads from its map. */
export interface DeepInterfaceEarthquake extends UnseenEarthquake {
  /** The weight the map's ground-motion model gives its
   *  subduction-interface models, and their names. */
  interfaceWeight: number;
  interfaceSet: string;
  /** Seismic stations and intensity reports the map used. */
  stations: number;
  reports: number;
}

/** Rule 41's geometries of a scenario marked a subduction interface, the
 *  one in place first. */
export const INTERFACE_STADIUMS = ['always', 'fromMw7.5'] as const;

export type InterfaceStadium = (typeof INTERFACE_STADIUMS)[number];

/** Rule 42's magnitude cells: the scorecard's cells below Mw 7.5. */
export const STADIUM_CELLS: readonly string[] = SIZE_BANDS.earthquake
  .filter((band) => band.below <= 7.5)
  .map((band) => band.label);

/** Rule 42: whether the candidate is eligible on the shaking. */
export function stadiumEligible(
  inPlace: readonly ContourCell[],
  candidate: readonly ContourCell[]
): { eligible: boolean; inPlace: number; candidate: number } {
  const below = (cells: readonly ContourCell[]): ContourCell[] =>
    cells.filter((c) => STADIUM_CELLS.includes(c.sizeBand));
  const a = meanAbsoluteBias(below(inPlace));
  const b = meanAbsoluteBias(below(candidate));
  return { eligible: a - b >= CONTOUR_LAW_MARGIN, inPlace: a, candidate: b };
}

/** One recorded earthquake under one geometry (rule 43 (b)). */
export interface RecordedRun {
  comcat: string;
  sizeBand: string;
  record: number;
  central: number;
  inside: boolean;
}

/** Rule 43 (b)'s score: the mean of |ln((central + 1) / (record + 1))|. */
export function recordedScore(rows: readonly RecordedRun[]): number {
  if (rows.length === 0) return 0;
  return (
    rows.reduce((a, r) => a + Math.abs(Math.log((r.central + 1) / (r.record + 1))), 0) / rows.length
  );
}

/** Rule 43: whether the candidate is adopted, and which test it passes. */
export function adoptFromMw75(
  quiet: { inPlaceShare: number; candidateShare: number },
  recorded: { inPlace: readonly RecordedRun[]; candidate: readonly RecordedRun[] }
): { adopted: boolean; quiet: boolean; recorded: boolean } {
  const onQuiet = passesOnQuiet(quiet.inPlaceShare, quiet.candidateShare);
  const insideIn = (rows: readonly RecordedRun[], cell: string): number =>
    rows.filter((r) => r.sizeBand === cell && r.inside).length;
  const holds = STADIUM_CELLS.every(
    (cell) => insideIn(recorded.candidate, cell) >= insideIn(recorded.inPlace, cell)
  );
  const onRecorded = holds && recordedScore(recorded.candidate) <= recordedScore(recorded.inPlace);
  return { adopted: onQuiet && onRecorded, quiet: onQuiet, recorded: onRecorded };
}
