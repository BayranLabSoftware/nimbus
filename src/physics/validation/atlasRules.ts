import type {
  ContourLaw,
  IntensityMeasure,
  PointSourceDistance,
} from '../events/earthquake/simulate.js';
import type { PointSourceEarthquake, SeenEarthquake } from './pointSourceRules.js';
import { displacesLawInPlace, type ProspectiveScore } from './prospectiveRules.js';

/**
 * The rings against the ShakeMap Atlas of 1973 to 1999, scored so that a
 * band rightly left blank counts.
 *
 * Rule 18's score, which chose the rings and has judged every law since,
 * takes half the log of the ratio of the ground a law shakes to the ground a
 * ShakeMap shakes, band by band, and gives nothing to a law that draws no
 * band where the map holds none. Twice that decided: rule 24's run found
 * Allen et al. 2012's hypocentral equation painting 298 bands the maps did
 * not hold where Boore et al. 2014 painted 1 374, and lost; rule 52's found
 * that on the maps of 2000 to 2007 most pairs were such bands, and a wider
 * ring lost on every one. Rules 27 to 30 wrote a score that counts silences
 * — rule 28's hits, misses, false alarms and silences, and the Peirce skill
 * score — for earthquakes that have not happened yet, and it will first be
 * read in about a year. These rules read it now, on maps no rule has read.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out:
 *
 *  - rule 18's, rule 24's and rule 52's runs, and what was read after them;
 *    BM-03's reading of rule 28's score, which favoured Boore et al. 2014 on
 *    PGV over PGA, 0.20 against 0.12, on rule 18's maps;
 *  - ComCat's count of the events rule 56 lists (1 140) and the list's ids,
 *    to find the two earthquakes of its window the project had read; and,
 *    once rule 56's file was read, only its counts, below, its maps'
 *    ShakeMap revisions and its fault types — not a footprint, a map's area,
 *    which bands a map reaches, or a score;
 *  - atlasRun.ts and scripts/benchmark/atlas.ts, written before these rules
 *    were fixed and run on nothing.
 *
 * The rules, fixed on 15 September 2026, before any candidate was scored on
 * any earthquake of rule 56's set, and numbered after the fifty-five before
 * them:
 *
 *  56. The set. Every event USGS ComCat's FDSN event service returns for
 *      starttime 1973-01-01, endtime 2000-01-01, minmagnitude 6, maxdepth
 *      40 and producttype shakemap — 1 140 on 15 September 2026 — less the
 *      two earthquakes of that window the project had read (`ATLAS_SEEN`, by
 *      the event's ComCat id or any id associated with it). Inputs by rules
 *      1 to 3; the footprint as rule 18 sums it; from each map's info.json
 *      what rule 50 reads; the record as rule 23 reads NCEI's database, for
 *      1973 to 1999, which decides nothing; the ground by rule 20, picked as
 *      rule 22 picks. scripts/build-atlas-set.ts writes the set into
 *      atlasSetData.ts and scripts/build-site-vs30.ts --atlas its ground into
 *      atlasSiteData.ts, both committed before any candidate is scored on
 *      them: 1 101 earthquakes with a low-resolution MMI map (37 without
 *      one, listed and left out), 617 below Mw 6.5, 419 from Mw 6.5 to 7.5
 *      and 65 from Mw 7.5; 691 quiet; 849 of no fault type by rule 2. The
 *      maps least made of the models ShakeMap runs —
 *      drawn on a finite rupture, or with ten seismic stations or more — are
 *      47, 68 and 23. Every map was drawn by ShakeMap 4.0.2, for the ShakeMap
 *      Atlas.
 *  57. The score. Rule 28's, on rule 56's maps, on the browser's ground as
 *      rule 29 reads it: for MMI VII and VIII, hits, misses, false alarms and
 *      silences, a side reaching a band with 10 km² or more; a band scored
 *      where the maps reach it five times or more and leave it blank at
 *      least once; the score, the mean Peirce skill over the scored bands;
 *      the sharpness, the median absolute log radius ratio where both reach
 *      MMI VII. The same score is read on the least modelled maps.
 *  58. The candidates and the choice. In place, `boore2014`: Boore et al.
 *      2014 on PGA, a disc at the epicentral distance. Against it, every
 *      other way of drawing the rings of a scenario not marked a subduction
 *      interface that was committed before these rules: `joynerBoore1981`,
 *      `boore2014FromMw7.5`, `allen2012Hypocentral`,
 *      `allen2012HypocentralBelowMw7.5`, Boore et al. 2014 on PGV (rule 31)
 *      and Boore et al. 2014 at Thompson & Worden's distance (rule 51). Not
 *      candidates: the interface models and the interface stadium, which draw
 *      a marked scenario only; PAGER's banding, whose bands begin at k − ½,
 *      which rule 28's areas from k cannot read; and the dead below MMI VII,
 *      a toll and not a ring. A candidate displaces the law in place as rule
 *      29 has it — a score higher by 0.10 or more, a sharpness no worse by
 *      more than 0.10 — and passes the guard when its score on the least
 *      modelled maps is no lower than the law in place's there; where either
 *      score cannot be read on those maps, the guard reads nothing and the
 *      report says so. The winner is the displacing candidate that passes the
 *      guard with the highest score, the sharper where two tie. With none,
 *      Boore et al. 2014 stays and nothing runs on the dead.
 *  59. Checked on the dead, on sets whose deaths lie outside the years the
 *      country curves were fitted on. The winner runs once beside Boore et
 *      al. 2014, on the browser's ground: rule 19's test on rule 11's held-out
 *      tolls, and the share of rule 23's quiet earthquakes raised to a median
 *      toll of ten no larger (rule 38's test). Rule 30 would check a winner on
 *      its own set's recorded tolls; rule 56's were fitted on, so they are not
 *      read.
 *  60. What an adoption does, and what is printed. Adopted, the winner draws
 *      the rings of every scenario its inputs reach, in the simulator and in
 *      the harness: the law, the intensity measure or the distance it names
 *      becomes the default. The rules that decided before keep their verdicts
 *      and their printed figures move, as rule 44 has it; rules 27 to 30 run
 *      as written, with the law in place on their day. The report prints
 *      every candidate's hits, misses, false alarms, silences, skill and
 *      sharpness, whatever they read; rows of the net that leave their band
 *      are ungated with their cause, and nothing is re-tuned (rules 5 and 6).
 *      Printed beside, deciding nothing: the same score on reference rock,
 *      and on the maps of rule 11's, rule 23's and rule 50's sets, which have
 *      been read.
 *
 * What these rules cannot settle. Before stations were many a map is mostly
 * the relations ShakeMap ran — for active crust the NGA-West2 set, which
 * holds Boore et al. 2014 — at ps2ff's distances, so the law in place and the
 * laws built on it agree with such maps partly because the maps are made of
 * them; the guard asks for no loss on the 138 maps made least that way. The
 * candidates were fitted on data that include earthquakes of these years —
 * NGA-West2 holds Loma Prieta, Landers, Kobe, Kocaeli and Chi-Chi — so each
 * has seen some of these maps' ground. The catalogue of these years knows
 * less: three earthquakes in four have no fault type. Six candidates are
 * compared with the law in place, so one may pass the margin by chance; the
 * guard and the dead are the only other stops, and the dead's sets have been
 * read.
 *
 * Run once, on 15 September 2026, after the rules, the set and the run were
 * committed (9a58165), and said here rather than folded into the rules above:
 * on rule 56's 1 101 maps Boore et al. 2014 scored 0.056. It draws MMI VII
 * about every one of them, where 237 reach it, so its skill in that band is
 * nil. Allen et al. 2012's hypocentral equation below Mw 7.5 scored 0.418,
 * with a sharpness of 0.51 against 0.53, and 0.33 against 0.05 on the least
 * modelled maps; it won. On rule 11's held-out tolls it read 1.05×, 0.67× and
 * 1.94× against 1.46×, 0.33× and 1.94×, and raised 1.4 % of rule 23's 805
 * quiet earthquakes to a toll of ten against 2.9 %, but its band held 81 of
 * 113 records below Mw 6.5, fewer than eight in ten. By rule 59 it is not
 * adopted, and Boore et al. 2014 keeps drawing the rings. What was read
 * afterwards is in docs/SCIENCE.md, "The rings when a silence counts".
 */

/** Rule 56: the earthquakes of its window already read, taken out. */
export const ATLAS_SEEN: readonly SeenEarthquake[] = [
  {
    comcat: 'ci3144585',
    name: 'Northridge 1994',
    seenAs: 'a preset, a row of the net, an anchor of the envelope and of the ShakeMap footprints',
  },
  {
    comcat: 'usp0008rpa',
    name: 'Aitape 1998',
    seenAs: "the calibration of a submarine landslide's wave (events/tsunami/extendedEffects.ts)",
  },
];

/** An earthquake of rule 56's set: rule 50's columns. */
export type AtlasEarthquake = PointSourceEarthquake;

/** One way of drawing the rings: a law, and the intensity measure and the
 *  distance of a disc where they are not the law's defaults. */
export interface AtlasCandidate {
  key: string;
  law: ContourLaw;
  measure?: IntensityMeasure;
  distance?: PointSourceDistance;
}

/** Rule 58's candidates, the law in place first. */
export const ATLAS_CANDIDATES: readonly AtlasCandidate[] = [
  { key: 'boore2014', law: 'boore2014' },
  { key: 'joynerBoore1981', law: 'joynerBoore1981' },
  { key: 'boore2014FromMw7.5', law: 'boore2014FromMw7.5' },
  { key: 'allen2012Hypocentral', law: 'allen2012Hypocentral' },
  { key: 'allen2012HypocentralBelowMw7.5', law: 'allen2012HypocentralBelowMw7.5' },
  { key: 'boore2014Pgv', law: 'boore2014', measure: 'pgv' },
  { key: 'boore2014ThompsonWorden2018', law: 'boore2014', distance: 'thompsonWorden2018' },
];

/** Rule 57's scores for every candidate, on all of rule 56's maps and on
 *  the least modelled ones. */
export type AtlasScores = Readonly<
  Record<string, { all: ProspectiveScore; leastModelled: ProspectiveScore }>
>;

/** Rule 58: the winner, if any, and who displaced the law in place. */
export function chooseAtlasCandidate(scores: AtlasScores): {
  winner: string | null;
  displacing: string[];
  guarded: string[];
} {
  const inPlaceKey = ATLAS_CANDIDATES[0]?.key ?? 'boore2014';
  const inPlace = scores[inPlaceKey];
  if (inPlace === undefined) return { winner: null, displacing: [], guarded: [] };
  const challengers = ATLAS_CANDIDATES.slice(1).map((c) => c.key);
  const displacing = challengers.filter((key) => {
    const s = scores[key];
    return s !== undefined && displacesLawInPlace(inPlace.all, s.all);
  });
  // The guard reads the least modelled maps where their score can be read,
  // and nothing where it cannot.
  const guarded = displacing.filter((key) => {
    const s = scores[key];
    if (s === undefined) return false;
    const a = inPlace.leastModelled.score;
    const b = s.leastModelled.score;
    return a === null || b === null || b >= a;
  });
  const winner = guarded.reduce<string | null>((best, key) => {
    if (best === null) return key;
    const s = scores[key]?.all;
    const t = scores[best]?.all;
    if (s?.score == null || t?.score == null) return best;
    if (s.score !== t.score) return s.score > t.score ? key : best;
    return (s.sharpness ?? Infinity) < (t.sharpness ?? Infinity) ? key : best;
  }, null);
  return { winner, displacing, guarded };
}
