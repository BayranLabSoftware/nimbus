import { CONTOUR_AREA_FLOOR_KM2, type ContourPair } from './contourLaws.js';
import type { MmiThreshold } from './shakemapFootprint.js';

/**
 * The intensity rings against earthquakes that have not happened yet.
 *
 * Every set the rings have been chosen or checked on so far had happened
 * and been mapped before the rule that read it was written; the rules
 * kept the choices from being fitted to the sets, but not the person
 * writing the rules from knowing the world they came from. And rules 23
 * to 26 found, after their result, that the score rule 18 defined gives
 * no credit for a band rightly left blank (docs/SCIENCE.md, "Whether the
 * rings carry depth"). Both are answered the only way they can be: a
 * score that counts silences as well as sizes, written before the
 * earthquakes it will be tried on.
 *
 * The rules, fixed on 14 September 2026, before the first earthquake they
 * name, and numbered after the twenty-six before them:
 *
 *  27. The set, read forward. Every event USGS ComCat's FDSN event service
 *      returns for starttime 2026-09-15 (UTC), minmagnitude 6, maxdepth 40
 *      and producttype shakemap, read no sooner than thirty days after its
 *      origin time, so that its ShakeMap has settled. Inputs by rules 1 to
 *      3, the ground by rule 20, the footprint as rule 18 sums it and the
 *      record as rule 23 reads it, all as scripts/build-unseen-set.ts and
 *      scripts/build-site-vs30.ts read rule 23's set, with these dates and
 *      nothing taken out. An event whose ShakeMap has no low-resolution MMI
 *      coverage, or that ComCat no longer serves, is listed and left out.
 *      The set is scored once, the first time it holds eighty earthquakes
 *      with a map, and every event read before that day and after the
 *      thirty days is in it.
 *  28. The score, which credits a band rightly left blank. For each
 *      earthquake and each of MMI VII and VIII, a side reaches the band
 *      when its ground at or above that intensity is 10 km² or more, rule
 *      18's floor. Over the set, per band: hits, where both reach it;
 *      misses, where the map does and the rings do not; false alarms,
 *      where the rings do and the map does not; and silences, where
 *      neither does. A law's skill in a band is the Peirce skill score,
 *      hits over hits and misses less false alarms over false alarms and
 *      silences; its score is the mean skill over the bands the maps reach
 *      at least five times. Its sharpness is the median absolute log
 *      radius ratio over the earthquakes where both reach MMI VII.
 *  29. The candidates: the law in place on the day the set is scored, and
 *      every other ring law committed before the set is first read, each
 *      on the browser's ground. The law in place stays unless another's
 *      score is higher by 0.10 or more and its sharpness is no worse by
 *      more than 0.10 — a tenth of a log unit of radius, which leaves room
 *      for a law that draws fewer bands to draw the ones it keeps a little
 *      less exactly.
 *  30. A winner is checked on the dead as rule 25 checks one — rule 19's
 *      test on the set's recorded tolls where twenty or more of them have
 *      something to say, and the share of quiet earthquakes whose median
 *      toll is ten or more — and adopted as rule 26 adopts one. The report
 *      prints every candidate's hits, misses, false alarms, silences, skill
 *      and sharpness, whatever they read.
 *
 * What this cannot settle. Eighty earthquakes of a year or so are not the
 * world's, and a map is still partly a model where few stations recorded
 * it (rule 23). The Peirce score weighs a miss of the rare strong band and
 * a false alarm of the common weak one by their own base rates, which is
 * what makes it fair to both and blunt about either.
 */

/** Rule 27's first day, and how long a ShakeMap is left to settle. */
export const PROSPECTIVE_START = '2026-09-15';
export const PROSPECTIVE_SETTLE_DAYS = 30;
/** Rule 27: the set is scored the first time it holds this many. */
export const PROSPECTIVE_EVENTS = 80;
/** Rule 28's bands, and how often a map must reach one to be scored. */
export const PROSPECTIVE_BANDS: readonly MmiThreshold[] = [7, 8];
export const PROSPECTIVE_MIN_REACHED = 5;
/** Rule 29: how much higher a winner's score must be, and how much
 *  blunter it may be. */
export const PROSPECTIVE_SKILL_MARGIN = 0.1;
export const PROSPECTIVE_SHARPNESS_TOLERANCE = 0.1;

export interface BandOutcome {
  hits: number;
  misses: number;
  falseAlarms: number;
  silences: number;
}

const reaches = (km2: number): boolean => km2 >= CONTOUR_AREA_FLOOR_KM2;

/** Rule 28's four counts for one band. */
export function bandOutcome(pairs: readonly ContourPair[], band: MmiThreshold): BandOutcome {
  const outcome: BandOutcome = { hits: 0, misses: 0, falseAlarms: 0, silences: 0 };
  for (const p of pairs) {
    if (p.threshold !== band) continue;
    const model = reaches(p.modelKm2);
    const map = reaches(p.observedKm2);
    if (model && map) outcome.hits += 1;
    else if (map) outcome.misses += 1;
    else if (model) outcome.falseAlarms += 1;
    else outcome.silences += 1;
  }
  return outcome;
}

/** The Peirce skill score; null where the map never reaches the band or
 *  always does, and the score has nothing to weigh. */
export function peirceSkill(o: BandOutcome): number | null {
  const reached = o.hits + o.misses;
  const blank = o.falseAlarms + o.silences;
  if (reached === 0 || blank === 0) return null;
  return o.hits / reached - o.falseAlarms / blank;
}

export interface ProspectiveScore {
  bands: { band: MmiThreshold; outcome: BandOutcome; skill: number | null; scored: boolean }[];
  /** Mean skill over the bands the maps reach often enough; null if none. */
  score: number | null;
  /** Median |ln radius ratio| where both reach MMI VII; null if nowhere. */
  sharpness: number | null;
}

export function prospectiveScore(pairs: readonly ContourPair[]): ProspectiveScore {
  const bands = PROSPECTIVE_BANDS.map((band) => {
    const outcome = bandOutcome(pairs, band);
    const skill = peirceSkill(outcome);
    return {
      band,
      outcome,
      skill,
      scored: skill !== null && outcome.hits + outcome.misses >= PROSPECTIVE_MIN_REACHED,
    };
  });
  const skills = bands.filter((b) => b.scored).map((b) => b.skill ?? 0);
  const ratios = pairs
    .filter((p) => p.threshold === 7 && reaches(p.modelKm2) && reaches(p.observedKm2))
    .map((p) => Math.abs(0.5 * Math.log(p.modelKm2 / p.observedKm2)))
    .sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  const sharpness =
    ratios.length === 0
      ? null
      : ratios.length % 2 === 1
        ? (ratios[mid] ?? null)
        : ((ratios[mid - 1] ?? 0) + (ratios[mid] ?? 0)) / 2;
  return {
    bands,
    score: skills.length === 0 ? null : skills.reduce((a, b) => a + b, 0) / skills.length,
    sharpness,
  };
}

/** Rule 29: whether a candidate displaces the law in place. */
export function displacesLawInPlace(
  inPlace: ProspectiveScore,
  candidate: ProspectiveScore
): boolean {
  if (candidate.score === null || inPlace.score === null) return false;
  if (candidate.score - inPlace.score < PROSPECTIVE_SKILL_MARGIN) return false;
  if (candidate.sharpness === null || inPlace.sharpness === null) return inPlace.sharpness === null;
  return candidate.sharpness - inPlace.sharpness <= PROSPECTIVE_SHARPNESS_TOLERANCE;
}
