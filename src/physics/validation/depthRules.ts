import type { ContourLaw } from '../events/earthquake/simulate.js';
import type { FaultType } from '../events/earthquake/ruptureLength.js';

/**
 * The depth of the source: whether the rings should carry it, chosen on
 * earthquakes nothing here has looked at.
 *
 * Boore et al. 2014, which draws the rings, is a relation in the
 * Joyner–Boore distance with a fixed 4.5 km near-source term and no
 * depth of its own, so the depth a scenario sets changes nothing it
 * shakes. Read after rules 20 to 22 had run, and said so there
 * (docs/SCIENCE.md, "The ground under the rings"): 190 of the 370
 * ShakeMaps of rule 11's set hold no ground at MMI VII, and the rings
 * draw a VII band about every one of them, on rock and on the browser's
 * ground alike. Choosing a relation that carries depth on those 370
 * would choose it on the maps that showed the fault, so the choice is
 * made on the ShakeMaps of earthquakes no rule has read, and checked on
 * the dead.
 *
 * The rules, fixed before any of those earthquakes was read and before
 * either new candidate was run on a ShakeMap, and numbered after the
 * twenty-two in heldOutEvents.ts, heldOutByRule.ts, contourLaws.ts and
 * siteVs30.ts:
 *
 *  23. The set. Every event USGS ComCat's FDSN event service returns for
 *      starttime 2008-01-01, endtime 2026-01-01, minmagnitude 6,
 *      maxdepth 40 and producttype shakemap — 1 539 on 14 September
 *      2026 — less the events of rule 11's set, by the event's ComCat id
 *      or any id associated with it. Inputs by rules 1 to 3 from each
 *      event's preferred origin, magnitude and moment tensor; the ground
 *      by rule 20, read the same way. The footprint is the preferred
 *      ShakeMap's low-resolution MMI coverage summed as rule 18 sums it,
 *      and an event whose ShakeMap has none is listed and left out. The
 *      record is NCEI's: an event within two minutes and 200 km of a
 *      record of the NCEI/WDS significant-earthquake database dated 2008
 *      to 2025, whatever that record's magnitude and depth (on the same
 *      day and within 200 km, where the record gives no time of day),
 *      takes that record's deaths and missing as rule 13 reads them;
 *      every other event is quiet, and a quiet earthquake killed fewer
 *      than ten, or the database — whose criteria admit every earthquake
 *      that killed ten — would hold it. scripts/build-unseen-set.ts
 *      writes the set into unseenSetData.ts and scripts/build-site-vs30.ts
 *      its ground into unseenSiteData.ts, and both are committed before
 *      any candidate is scored on them.
 *  24. The candidates, each written before this rule was run:
 *      `boore2014`, the law in place, and `allen2012Hypocentral` and
 *      `allen2012HypocentralBelowMw7.5`, as `ContourLaw` in
 *      events/earthquake/simulate.ts describes them; every one on the
 *      browser's ground, which the last two do not read. Each is scored
 *      on the set's ShakeMaps as rule 18 scores a law — the same floor,
 *      the same magnitude cells, the same margin — and Boore et al. 2014
 *      stays unless another beats it by 0.05. The report also prints the
 *      three on rule 18's 370 ShakeMaps, which decide nothing.
 *  25. Checked on the dead. A winner other than the law in place runs
 *      once on rule 11's held-out tolls and on the set's quiet
 *      earthquakes, beside the law in place. It is adopted if it passes
 *      rule 19's test on rule 11's tolls against the law in place, and
 *      if the share of quiet earthquakes whose median toll is ten or more
 *      is no larger than the law in place's. Otherwise Boore et al. 2014
 *      stays. The set's recorded tolls are printed beside, and decide
 *      nothing.
 *  26. A law adopted draws the rings in the simulator and in the harness,
 *      for the net, the sets and the footprint anchors alike. The report
 *      prints both laws' figures whatever they read; rows of the net that
 *      leave their band are ungated with their cause, and nothing is
 *      re-tuned (rules 5 and 6).
 *
 * What these rules cannot settle. ShakeMap is not a pure measurement
 * either: for an earthquake few stations recorded it is mostly the
 * ground-motion relations USGS runs for that region, and those carry
 * depth, so a candidate that carries depth agrees with a map partly
 * because both do. A quiet earthquake's record is an upper bound read off
 * a database's criteria, not a count. And the hypocentral equation's
 * coefficients were read from OpenQuake's implementation, not from the
 * paper.
 *
 * Run once, on 14 September 2026, and said here rather than folded into
 * the rules above: 809 earthquakes had a map to score on, and Boore et al.
 * 2014 kept its place (2.00 against 2.09 and 2.25), so nothing ran on the
 * dead. What the score leaves out — it gives no credit for a band rightly
 * left blank, and Boore et al. 2014 paints 1 374 bands those maps do not
 * hold where the hypocentral equation paints 298 — is in docs/SCIENCE.md,
 * "Whether the rings carry depth", and is not acted on here.
 */

/** Rule 24's candidates, the law in place first. */
export const DEPTH_CANDIDATES = [
  'boore2014',
  'allen2012Hypocentral',
  'allen2012HypocentralBelowMw7.5',
] as const satisfies readonly ContourLaw[];

export type DepthCandidate = (typeof DEPTH_CANDIDATES)[number];

/** A quiet earthquake killed fewer than this many (rule 23). */
export const QUIET_DEATHS_BELOW = 10;

/** An earthquake of rule 23's set, as scripts/build-unseen-set.ts
 *  stores it. */
export interface UnseenEarthquake {
  comcat: string;
  /** ComCat's origin time, ISO 8601, UTC. */
  time: string;
  place: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  faultType: FaultType;
  /** The preferred ShakeMap's peak, and its ground at or above MMI VII,
   *  VIII and IX (km²). */
  maxMmi: number;
  areaKm2: Readonly<Record<7 | 8 | 9, number>>;
  /** The NCEI records within rule 23's window; empty when quiet. */
  ncei: readonly number[];
  deaths: number;
  missing: number;
}

export function isQuiet(quake: UnseenEarthquake): boolean {
  return quake.ncei.length === 0;
}

/** The share of quiet earthquakes whose median toll is ten or more. */
export function falseAlarmShare(medianTolls: readonly number[]): number {
  if (medianTolls.length === 0) return 0;
  return medianTolls.filter((d) => d >= QUIET_DEATHS_BELOW).length / medianTolls.length;
}

/** Rule 25's second test. */
export function passesOnQuiet(inPlaceShare: number, winnerShare: number): boolean {
  return winnerShare <= inPlaceShare;
}
