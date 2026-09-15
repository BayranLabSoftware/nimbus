import type { DeepLaw } from '../events/earthquake/simulate.js';
import type { PointSourceEarthquake } from './pointSourceRules.js';
import { displacesLawInPlace, type ProspectiveScore } from './prospectiveRules.js';

/**
 * The rings of an earthquake deeper than 70 km, drawn with a law for a
 * subducting slab and chosen on maps no rule has read.
 *
 * The law in place does not read the depth of a deep earthquake. Boore et
 * al. 2014 takes the Joyner–Boore distance, which is the same for a
 * hypocentre at 10 km and at 200; the interface models read the depth only
 * for a scenario marked an interface; and the hypocentral equation of Allen
 * et al. 2012, which reads it, was fitted on earthquakes of Mw 5.0 to 7.9
 * within 300 km and has not been adopted. Rule 61's run found both faults on
 * the deep earthquakes of 2008 to 2025: the equation drew not even an MMI V
 * ring about 24 of them that killed, and the dead the tolls counted came
 * mostly from Hindu Kush 2015, Mw 7.5 at 231 km, which Boore et al. 2014 draws
 * as a shallow earthquake — 7 147 counted in place against 399 recorded
 * (docs/SCIENCE.md, "The hypocentral equation with the dead of V and VI").
 * ShakeMap draws such earthquakes with models fitted on intraslab records.
 * These rules put two of them to the maps.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out:
 *
 *  - rule 61's run and what was read after it, above;
 *  - ComCat's count of the events rule 66 lists (737) and the list's ids, to
 *    take out the earthquakes already read, and a search of the repository
 *    for any other earthquake of the window (none: no preset, anchor or
 *    calibration of the project is deeper than 70 km);
 *  - once rule 66's file was read, only its counts, below, its maps'
 *    ShakeMap revisions, and the slab model sets its maps were drawn with,
 *    with the models and weights inside each, read from their info.json —
 *    not a footprint, a map's area, which bands a map reaches, a toll or a
 *    score;
 *  - both candidates' code, held to OpenQuake's medians on a grid of
 *    magnitudes, depths, distances and Vs30 with no ring drawn, and the
 *    standard deviations OpenQuake gives them for three scenarios;
 *  - slabRun.ts and scripts/benchmark/slab.ts, written with these rules and
 *    run on nothing.
 *
 * The rules, fixed on 15 September 2026, before any candidate was scored on
 * any earthquake of rule 66's set, and numbered after the sixty-five before
 * them:
 *
 *  66. The set. Every event USGS ComCat's FDSN event service returns for
 *      starttime 1973-01-01, endtime 2026-01-01, minmagnitude 6, mindepth
 *      70.0001, maxdepth 300 and producttype shakemap — 737 on 15 September
 *      2026 — less the 44 earthquakes already read: those of rule 11's, 23's,
 *      40's, 45's, 50's, 56's and 61's sets, those rules 50 and 56 took out,
 *      the campaign's PAGER products and its DART records, by the event's
 *      ComCat id or any id associated with it. Inputs by rules 1 to 3; the
 *      footprint as rule 18 sums it; from each map's info.json what rule 50
 *      reads, and the weight its ground-motion model gave its subduction-slab
 *      model sets, with their names; the record as rule 23 reads NCEI's
 *      database, for 1973 to 2025, which decides nothing; the ground by rule
 *      20, picked as rule 22 picks. scripts/build-slab-set.ts writes the set
 *      into slabSetData.ts and scripts/build-site-vs30.ts --slab its ground
 *      into slabSiteData.ts, both committed before any candidate is scored on
 *      them: 618 earthquakes with a low-resolution MMI map (75 without one,
 *      listed and left out), 427 below Mw 6.5, 180 from Mw 6.5 to 7.5 and 11
 *      from Mw 7.5; 562 quiet; 406 no deeper than 150 km and 212 deeper. The
 *      maps least made of the models ShakeMap runs — drawn on a finite
 *      rupture, or with ten seismic stations or more — are 22, 9 and 1. 615
 *      maps gave the slab models a weight of 0.5 or more, and none gave the
 *      interface models as much; 543 were drawn by ShakeMap 4.0.2, the other
 *      75 by revisions 4.0.1 to 4.4.5.
 *  67. The candidates. In place, the law every scenario draws (`none`):
 *      Boore et al. 2014 on PGA, a disc at the epicentral distance below Mw
 *      7.5 and a stadium from it. Against it, for a scenario deeper than 70
 *      km, a disc about the epicentre at every magnitude, its rings where an
 *      intraslab model's median PGA, at the hypocentral distance and the
 *      hypocentre's depth on the scenario's Vs30, falls to the PGA Worden et
 *      al. 2012 give the intensity: Abrahamson, Gregor & Addo 2016, as
 *      OpenQuake's `AbrahamsonEtAl2015SSlab` has it — the central magnitude
 *      scaling, a forearc site, the ergodic model — (`abrahamson2016Slab`),
 *      or Parker et al. 2022's global slab model, as OpenQuake's
 *      `ParkerEtAl2020SSlab` has it with no region or basin
 *      (`parker2022Slab`). Each was held to OpenQuake 3.26.2 within 1e-9 of
 *      the median on 960 combinations of six magnitudes, five depths, eight
 *      epicentral distances and four Vs30 (slabAttenuation.test.ts) before
 *      these rules were fixed. Everything else is shared, the band's
 *      sampling among it: a ground-motion residual moves a candidate's target
 *      as it moves every law's, the residual's σ stays Boore et al. 2014's
 *      0.60, and a draw of depth at 70 km or less is drawn by the law in
 *      place. Not candidates: the hypocentral equation, which rule 58 chose on
 *      shallow maps and rule 59 did not adopt; the interface models, which
 *      draw a marked scenario only; and the older slab models ShakeMap also
 *      runs (Atkinson & Boore 2003, Zhao et al. 2006 and 2016, Montalva et
 *      al. 2017), left out to keep the comparisons to two.
 *  68. The score and the choice. Rule 28's, on rule 66's maps, on the
 *      browser's ground as rule 29 reads it: for MMI VII and VIII, hits,
 *      misses, false alarms and silences, a side reaching a band with 10 km²
 *      or more; a band scored where the maps reach it five times or more and
 *      leave it blank at least once; the score, the mean Peirce skill over
 *      the scored bands; the sharpness, the median absolute log radius ratio
 *      where both reach MMI VII. The same score is read on the least modelled
 *      maps. A candidate displaces the law in place as rule 29 has it — a
 *      score higher by 0.10 or more, a sharpness no worse by more than 0.10
 *      — and passes the guard when its score on the least modelled maps is no
 *      lower than the law in place's there; where either score cannot be
 *      read on those maps, the guard reads nothing and the report says so.
 *      The winner is the displacing candidate that passes the guard with the
 *      higher score, the sharper where the two tie. With none, the law in
 *      place stays and nothing runs on the dead.
 *  69. Checked on the dead, as a guard. The winner runs once beside the law
 *      in place on rule 61's earthquakes whose ComCat depth is more than 70
 *      km — 62: 21 below Mw 6.5, 19 from 6.5 to 7.5 and 22 from 7.5, 32 of
 *      them with deaths, all of 2008 to 2025 and so outside the years the
 *      country curves were fitted on — as rule 63 runs them, on the browser's
 *      ground, with the toll in place, which counts the dead inside MMI VII.
 *      It passes when its rule 47 score there is no more than the law in
 *      place's plus 0.10, the room rule 64 (c) gave a set already read; the
 *      records each band holds are printed and decide nothing. A winner that
 *      passes is adopted. Rule 66's own records decide nothing: all 56 are of
 *      1973 to 2007, the years the curves were fitted on.
 *  70. What an adoption does, and what is printed. Adopted, the winner draws
 *      the rings of every scenario deeper than 70 km, in the simulator and in
 *      the harness: `deepLaw` defaults to it. The rules that decided before
 *      keep their verdicts and their printed figures move, as rule 44 has it
 *      — two of rule 11's held-out earthquakes are deeper than 70 km; rules
 *      27 to 30, whose set is no deeper than 40 km, are untouched. The input
 *      check that flags a hypocentre deeper than 100 km as outside Boore et
 *      al. 2014's calibration then flags one deeper than 300 km, where rule
 *      66's set ends, and docs/CALIBRATION_RANGES.md says the same. The report
 *      prints every candidate's hits, misses, false alarms, silences, skill
 *      and sharpness, whatever they read; rows of the net that leave their
 *      band are ungated with their cause, and nothing is re-tuned (rules 5
 *      and 6). Printed beside, deciding nothing: the same score on reference
 *      rock; on the maps no deeper than 150 km and on the deeper ones; and on
 *      the maps drawn with a slab set that holds Abrahamson et al. 2016 (NSHMP
 *      2014 and SHARE, 490 maps), one that holds Parker et al. 2022 (NSHMP
 *      2023 and Alaska, 21) and one that holds neither (Chile, 107).
 *
 * What these rules cannot settle. The maps are mostly the models ShakeMap
 * ran: Abrahamson et al. 2016 is a third of the NSHMP 2014 slab set that drew
 * 482 of them and a fifth of the SHARE set that drew 8, so that candidate
 * agrees with most maps partly because they are made of it, and Parker et al.
 * 2022 is a quarter or a third of the sets that drew 21. Only 32 maps were
 * drawn on a finite rupture or with ten stations or more; the guard reads
 * those. The band's scatter stays 0.60, where OpenQuake gives Abrahamson et
 * al. 2016 a σ of 0.74 and Parker et al. 2022 one of 0.76 to 0.80 for these
 * scenarios, so a band drawn with either is narrower than its own model's. An
 * earthquake just below 70 km has a band drawn partly with each law. The
 * candidates were fitted on intraslab records that include earthquakes of
 * these years, so each has seen some of this ground. Nothing in the set is
 * deeper than 300 km, so a deeper scenario is extrapolated. And the dead of
 * rule 61's deep earthquakes have been read under the law in place, whose
 * figures on them are known, though not the candidates'.
 */

/** An earthquake of rule 66's set: rule 50's columns, and the weight the
 *  map's ground-motion model gave its subduction-slab model sets. */
export interface SlabEarthquake extends PointSourceEarthquake {
  slabWeight: number;
  slabSet: string;
}

/** One way of drawing a deep scenario's rings, as rule 67 names it. */
export interface SlabCandidate {
  key: string;
  deepLaw: DeepLaw;
}

/** Rule 67's candidates, the law in place first. */
export const SLAB_CANDIDATES: readonly SlabCandidate[] = [
  { key: 'boore2014', deepLaw: 'none' },
  { key: 'abrahamson2016Slab', deepLaw: 'abrahamson2016Slab' },
  { key: 'parker2022Slab', deepLaw: 'parker2022Slab' },
];

/** Rule 68's scores for every candidate, on all of rule 66's maps and on
 *  the least modelled ones. */
export type SlabScores = Readonly<
  Record<string, { all: ProspectiveScore; leastModelled: ProspectiveScore }>
>;

/** Rule 68: the winner, if any, and who displaced the law in place. */
export function chooseSlabCandidate(scores: SlabScores): {
  winner: string | null;
  displacing: string[];
  guarded: string[];
} {
  const inPlace = scores[SLAB_CANDIDATES[0]?.key ?? 'boore2014'];
  if (inPlace === undefined) return { winner: null, displacing: [], guarded: [] };
  const challengers = SLAB_CANDIDATES.slice(1).map((c) => c.key);
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

/** Rule 69: the room on rule 47's score. */
export const SLAB_DEAD_ROOM = 0.1;

/** Rule 69: whether a winner passes the guard on rule 61's deep dead. */
export function guardSlabLaw(scores: { inPlace: number; winner: number }): boolean {
  return scores.winner <= scores.inPlace + SLAB_DEAD_ROOM;
}

/** Rule 70: the depth (km) that parts the maps printed beside. */
export const SLAB_DEPTH_SPLIT_KM = 150;

/** Rule 70: the maps printed beside by the slab model sets that drew them. */
export const SLAB_MODEL_GROUPS: Readonly<Record<string, readonly string[]>> = {
  withAbrahamson2016: ['subduction_slab_nshmp2014', 'subduction_slab_share'],
  withParker2022: ['subduction_slab_nshmp2023', 'subduction_slab_alaska'],
  withNeither: ['subduction_slab_chile'],
};
