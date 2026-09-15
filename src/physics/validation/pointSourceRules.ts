import type { PointSourceDistance } from '../events/earthquake/simulate.js';
import { CONTOUR_LAW_MARGIN, meanAbsoluteBias, type ContourCell } from './contourLaws.js';
import type { UnseenEarthquake } from './depthRules.js';
import { adoptInterfaceLaw } from './interfaceRules.js';
import { STADIUM_CELLS } from './interfaceStadiumRules.js';

/**
 * How far the ground of a point source stands from its rupture.
 *
 * Every earthquake scenario below Mw 7.5 is a disc about its epicentre, and
 * Boore et al. 2014 draws its rings with the Joyner–Boore distance taken as
 * the distance from the epicentre: every site as far from the rupture as
 * from the point where it began. A rupture tens of kilometres long passes
 * closer to most of them. USGS ShakeMap draws a map without a finite rupture
 * the other way: from version 4.0 to 4.2, which reprocessed the ShakeMap
 * Atlas in 2020, it takes Thompson & Worden's (2018) average distance to the
 * ruptures the hypocentre can belong to (ps2ff); from 4.3.0, in April 2024,
 * it simulates those ruptures instead (FFSimmer). Rule 18's run found Boore
 * et al. 2014 drawing MMI VII at 0.83, 0.50 and 0.90 of the ShakeMaps'
 * radius where a map reaches it (docs/SCIENCE.md, "Which law draws the
 * rings"), and BM-10's point 3 left the interface models' rupture distance
 * standing on the hypocentre's depth. So the question is whether the rings
 * should be drawn at the rupture's distance, put to maps no rule has read,
 * and checked on the dead.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out:
 *
 *  - that the rings in place stand at about half the ShakeMaps' radius in
 *    the Mw 6.5–7.5 cell of rule 18's set, and that rule 11's held-out tolls
 *    read 1.46×, 0.33× and 1.94× their records on the browser's ground: the
 *    candidate is proposed because of them, and draws larger rings below Mw
 *    7.5 wherever it differs;
 *  - ShakeMap's code (shakelib/rupture/point_rupture.py at 4.0.2 and
 *    esi-shakelib today, its CHANGELOG) and ps2ff 1.5.9's, to write the
 *    candidate as ShakeMap applies it; and the candidate itself, coded in
 *    events/earthquake/pointSourceDistance.ts and compared with ps2ff on
 *    distances alone, with no ring drawn and no score run;
 *  - ComCat's count of the events rule 50 lists (445), the list's ids, to
 *    find the eight earthquakes of its window the project had read, and one
 *    map's info.json (Bam 2003), to see what it carries; once rule 50's
 *    file was read, only its counts, below, the ShakeMap revisions that drew
 *    it and the values of its maps' `fault_ref` and `median_dist` — not a
 *    footprint, a map's area or a toll;
 *  - that the country fatality curves the toll uses were fitted by PAGER on
 *    the earthquakes of 1973 to 2007 (Jaiswal & Wald 2010; rule 1's reason
 *    for holding out only later ones). The set's recorded deaths were first
 *    meant to decide, and were moved beside, deciding nothing, before these
 *    rules were written.
 *
 * The rules, fixed on 15 September 2026, before the candidate was run on any
 * earthquake, and numbered after the forty-nine before them:
 *
 *  50. The set. Every event USGS ComCat's FDSN event service returns for
 *      starttime 2000-01-01, endtime 2008-01-01, minmagnitude 6, maxdepth
 *      40 and producttype shakemap — 445 on 15 September 2026 — less the
 *      eight earthquakes of that window the project had read
 *      (`POINT_SOURCE_SEEN`, by the event's ComCat id or any id associated
 *      with it). Inputs by rules 1 to 3; the footprint as rule 18 sums it; an
 *      interface earthquake as rule 35 classes one; from each map's
 *      info.json, its seismic stations and intensity reports, whether it was
 *      drawn on a finite rupture (a `fault_ref` citing a source, where a
 *      point's reads "Origin") and the ShakeMap revision; the record as rule
 *      23 reads NCEI's database, for 2000 to 2007, which decides nothing
 *      (rule 55); the ground by rule 20, picked as rule 22 picks.
 *      scripts/build-point-source-set.ts writes the set into
 *      pointSourceSetData.ts and scripts/build-site-vs30.ts --point-source
 *      its ground into pointSourceSiteData.ts, both committed before the
 *      candidate runs on them: 421 earthquakes with a low-resolution MMI map
 *      (16 without one, listed and left out), 241 below Mw 6.5, 154 from Mw
 *      6.5 to 7.5 and 26 from Mw 7.5; 86, 70 and 10 of them interface
 *      earthquakes. The maps least made of the models ShakeMap runs — drawn
 *      on a finite rupture, or with ten seismic stations or more — are 20,
 *      32 and 8. Every map was drawn by ShakeMap 4.0.2+335 or +380, with
 *      ps2ff's distances wherever the rupture was a point.
 *  51. The distances. In place, `epicentral`: a disc's ring stands where the
 *      median at a Joyner–Boore distance equal to the epicentral distance —
 *      for an interface model, at the rupture distance √(x² + h²), h the
 *      depth — falls to the threshold. The candidate, `thompsonWorden2018`:
 *      the ring stands at the epicentral distance at which the median, at
 *      the average Joyner–Boore distance (for an interface model, the
 *      average rupture distance) Thompson & Worden 2018 give for a point
 *      source there, falls to the threshold. The averages are ps2ff 1.5.9's
 *      single-event integral with the parameters ShakeMap 4.0.2 passes for
 *      an origin with no tectonic region: Wells & Coppersmith 1994's area
 *      for all mechanisms (log10 A = −3.49 + 0.91 M, σ 0.24, in five bins
 *      truncated at two sigma), an aspect ratio of 1.7, dips of 10° to 90°
 *      in four steps, the hypocentre over the rupture in seven steps each
 *      way, nineteen azimuths, a seismogenic zone from the surface, and the
 *      scenario's magnitude and depth (15 km where none is set). They are
 *      computed exactly at magnitudes a tenth apart, depths a kilometre apart
 *      (a depth above 1 km read at 1 km) and 49 epicentral distances from 0.1
 *      to 1 000 km, twelve a decade, and interpolated linearly in distance
 *      and bilinearly in magnitude and depth; within 0.1 km the average
 *      Joyner–Boore distance is proportional to the epicentral one and the
 *      rupture distance flat, and beyond 1 000 km both are proportional.
 *      Only a disc changes: a stadium, from Mw 7.5, keeps its distances.
 *      Everything else is shared — the law, the intensity, the ground, the
 *      population, the toll and the harness. Before any score the candidate
 *      is coded as a scenario input and held (a) to ps2ff 1.5.9's
 *      single_event_adjustment within one part in a billion at the 49
 *      distances, for magnitudes 5 to 7.4 and depths 1 to 33 km; (b) within
 *      5 % of the exact integral, and within 2 % where the depth or the
 *      distance is 3 km or more, on a scan of Mw 5.05, 6.05 and 7.45, depths
 *      from 1.05 to 2.85 km a fifth apart and of 3.5, 9.5 and 39.5 km, and
 *      distances from 1 to 3 km a tenth apart and of 5, 20, 100 and 300 km —
 *      the interpolation is coarsest for a hypocentre within 3 km of the
 *      surface, a few kilometres from it; (c) to draw with `epicentral`
 *      exactly what the simulator draws now, and a stadium's rings unchanged
 *      under either. A miss is a defect to fix, not a choice.
 *  52. Selection on shaking. Rule 18's score, with its floor, on rule 50's
 *      ShakeMaps under Boore et al. 2014, in the two magnitude cells below Mw
 *      7.5, where the distances can differ, read on reference rock (Vs30 760
 *      m/s) and on the browser's ground. The candidate is eligible when its
 *      mean absolute bias over those cells is lower than `epicentral`'s by
 *      0.05 or more in both readings, and, on the maps least made of the
 *      models ShakeMap runs (rule 50's 20 and 32), no higher in either.
 *  53. Checked on the dead, on sets whose deaths lie outside the curves'
 *      years. An eligible candidate runs once beside `epicentral`, on the
 *      browser's ground: on rule 11's held-out tolls and on rule 23's quiet
 *      earthquakes. It is adopted if it passes rule 19's test on those tolls
 *      against the distance in place and, as rule 25 has it, raises no
 *      larger a share of those quiet earthquakes to a median toll of ten
 *      (rule 38's test, `adoptInterfaceLaw`). Both sets have been read; they
 *      can only show that the candidate does not break the tolls, not choose
 *      it.
 *  54. The interface models. On rule 50's interface earthquakes, each run
 *      as a scenario marked a subduction interface, in all three magnitude
 *      cells: the law in place, Boore et al. 2014 at the distance rule 53
 *      leaves, against `parker2022Interface` and `abrahamson2016Interface`
 *      (rule 36) with rule 51's average rupture distance below Mw 7.5 and
 *      √(x² + h²) about the stadium from it. Rule 18's score, with its floor,
 *      on reference rock and on the browser's ground; a candidate is
 *      eligible when its mean absolute bias over the three cells is lower
 *      than the law in place's by 0.05 or more in both readings, and the
 *      winner is the eligible one with the lower sum of its two. A winner
 *      runs once beside the law in place, as rule 38 runs one: rule 19's
 *      test on rule 11's held-out tolls of rule 35's interface earthquakes,
 *      and rule 25's on rule 23's quiet ones, on the browser's ground.
 *      Adopted, it draws the rings of every scenario marked a subduction
 *      interface — the presets, a custom scenario that sets it, and in the
 *      harness every earthquake rule 35 classes as one.
 *  55. What an adoption does, and what is printed. An adopted distance draws
 *      every disc's rings in the simulator and in the harness; the rules
 *      that decided before keep their verdicts, and their printed figures
 *      move, as rule 44 has it. The report prints both distances' figures,
 *      and every candidate's of rule 54, whatever they read; rows of the net
 *      that leave their band are ungated with their cause, and nothing is
 *      re-tuned (rules 5 and 6). Printed beside, deciding nothing: rule 50's
 *      recorded tolls below Mw 7.5 under both distances, whose deaths the
 *      curves were fitted on; rule 52's scores on the maps drawn on a finite
 *      rupture and on those with ten stations or more, apart; the interface
 *      models with rule 36's distance on rule 50's interface maps; and the
 *      rings of the net's earthquakes below Mw 7.5 under both distances.
 *
 * What these rules cannot settle. Where the rupture was a point, rule 50's
 * maps are ps2ff's averages under the relations ShakeMap ran — with the
 * parameters of the event's tectonic region where STREC gave one, not rule
 * 51's — so the candidate agrees with them partly because they are made of
 * it; rule 52 asks it not to lose on the maps made least that way, which are
 * few. Rule 11's and rule 23's sets have been read, and a candidate that draws
 * larger rings below Mw 7.5 was expected to raise their middle cell's tolls.
 * The averages are over every strike, so a ring stays a circle about the
 * epicentre where a real rupture is long in one direction; the spread
 * Thompson & Worden give about the average is not added to the band; and a
 * stadium's rupture distance still stands on the hypocentre's depth. Maps
 * drawn from April 2024 on use FFSimmer, which none of these rules reads.
 *
 * Run once, on 15 September 2026, after the candidate was committed
 * (d311936), and said here rather than folded into the rules above: below Mw
 * 7.5 the candidate read rule 50's maps at 1.53 on rock and 1.78 on the
 * browser's ground against 0.88 and 1.17 in place, and on the maps least made
 * of ShakeMap's models at 0.83 and 1.16 against 0.20 and 0.55. It is not
 * eligible, so by rule 52 nothing ran on the dead and `epicentral` stays. On
 * rule 50's interface maps Parker et al. 2022 at the candidate's rupture
 * distance read 1.05 and 0.95, BC Hydro 1.11 and 1.16, the law in place 1.30
 * and 1.52; Parker et al. won, raised 0.6 % of rule 23's 352 quiet interface
 * earthquakes to a toll of ten against 3.4 %, and its band held none of five,
 * 27 of 34 and 11 of 16 of rule 11's interface records with something, fewer
 * than eight in ten in every cell, so by rule 54 it is not adopted and Boore
 * et al. 2014 keeps drawing the rings of a scenario marked a subduction
 * interface. What was read afterwards is in docs/SCIENCE.md, "A disc's
 * distance to its rupture".
 */

/** An earthquake of 2000 to 2007 the project had read before rule 50, by
 *  its ComCat event, and where. */
export interface SeenEarthquake {
  comcat: string;
  name: string;
  seenAs: string;
}

/** Rule 50: the earthquakes of its window already read, taken out. */
export const POINT_SOURCE_SEEN: readonly SeenEarthquake[] = [
  {
    comcat: 'usp000asvm',
    name: 'Kokoxili (Kunlun) 2001',
    seenAs: 'a preset, a row of the net, an anchor of the envelope and of the ShakeMap footprints',
  },
  {
    comcat: 'official20041226005853450_30',
    name: 'Sumatra–Andaman 2004',
    seenAs: 'a preset, a row of the net, an anchor of the envelope and a tsunami fixture',
  },
  { comcat: 'usp000ensm', name: 'Java 2006', seenAs: "BM-05's DART records" },
  { comcat: 'usp000exfn', name: 'Kuril Islands 2006', seenAs: "BM-05's DART records, scored" },
  { comcat: 'usp000f83m', name: 'Solomon Islands 2007', seenAs: "BM-05's DART records" },
  { comcat: 'usp000fjta', name: 'Pisco 2007', seenAs: "BM-05's DART records" },
  {
    comcat: 'official20070912111026830_34',
    name: 'Southern Sumatra 2007',
    seenAs: "BM-05's DART records",
  },
  { comcat: 'usp000fshy', name: 'Tocopilla 2007', seenAs: "BM-05's DART records" },
];

/** An earthquake of rule 50's set, as scripts/build-point-source-set.ts
 *  stores it: rule 23's columns, what rule 35 reads from its map, and what
 *  the map says of how it was drawn. */
export interface PointSourceEarthquake extends UnseenEarthquake {
  /** The weight the map's ground-motion model gives its
   *  subduction-interface models, and their names. */
  interfaceWeight: number;
  interfaceSet: string;
  /** Seismic stations and intensity reports the map used. */
  stations: number;
  reports: number;
  /** Whether the map was drawn on a finite rupture, not a point: its
   *  `fault_ref` cites a source where a point's reads "Origin". */
  finiteFault: boolean;
  /** The ShakeMap revision that drew the map. */
  revision: string;
}

/** Rule 51's distances, the one in place first. */
export const POINT_SOURCE_CANDIDATES = [
  'epicentral',
  'thompsonWorden2018',
] as const satisfies readonly PointSourceDistance[];

/** Rule 52's magnitude cells: the scorecard's cells below Mw 7.5. */
export const POINT_SOURCE_CELLS: readonly string[] = STADIUM_CELLS;

/** Rule 52: the stations that make a map one of the least modelled. */
export const POINT_SOURCE_STATIONS_AT_LEAST = 10;

/** Rule 52: a map least made of the models ShakeMap runs. */
export function isLeastModelled(
  q: Pick<PointSourceEarthquake, 'finiteFault' | 'stations'>
): boolean {
  return q.finiteFault || q.stations >= POINT_SOURCE_STATIONS_AT_LEAST;
}

/** Rule 52's two readings. */
export const POINT_SOURCE_READINGS = ['rock', 'ground'] as const;

export type PointSourceReading = (typeof POINT_SOURCE_READINGS)[number];

type Readings<T> = Readonly<Record<PointSourceReading, T>>;

const belowMw75 = (cells: readonly ContourCell[]): number =>
  meanAbsoluteBias(cells.filter((c) => POINT_SOURCE_CELLS.includes(c.sizeBand)));

/** Rule 52: whether the candidate is eligible on the shaking. */
export function pointSourceEligible(
  all: Readings<{ inPlace: readonly ContourCell[]; candidate: readonly ContourCell[] }>,
  leastModelled: Readings<{ inPlace: readonly ContourCell[]; candidate: readonly ContourCell[] }>
): {
  eligible: boolean;
  all: Record<PointSourceReading, { inPlace: number; candidate: number }>;
  leastModelled: Record<PointSourceReading, { inPlace: number; candidate: number }>;
} {
  const measure = (
    r: Readings<{ inPlace: readonly ContourCell[]; candidate: readonly ContourCell[] }>
  ): Record<PointSourceReading, { inPlace: number; candidate: number }> => ({
    rock: { inPlace: belowMw75(r.rock.inPlace), candidate: belowMw75(r.rock.candidate) },
    ground: { inPlace: belowMw75(r.ground.inPlace), candidate: belowMw75(r.ground.candidate) },
  });
  const a = measure(all);
  const l = measure(leastModelled);
  const eligible = POINT_SOURCE_READINGS.every(
    (reading) =>
      a[reading].inPlace - a[reading].candidate >= CONTOUR_LAW_MARGIN &&
      l[reading].candidate <= l[reading].inPlace
  );
  return { eligible, all: a, leastModelled: l };
}

/** Rule 53: whether an eligible candidate is adopted — rule 38's test. */
export const adoptPointSourceDistance = adoptInterfaceLaw;

/** Rule 54's candidates for a scenario marked a subduction interface. */
export const POINT_SOURCE_INTERFACE_CANDIDATES = [
  'parker2022Interface',
  'abrahamson2016Interface',
] as const;

export type PointSourceInterfaceCandidate = (typeof POINT_SOURCE_INTERFACE_CANDIDATES)[number];

/** Rule 54: the winner among the interface candidates, if any, over the
 *  three magnitude cells. */
export function choosePointSourceInterfaceLaw(
  scores: Readings<{
    inPlace: readonly { bias: number | null }[];
    candidates: Readonly<Record<PointSourceInterfaceCandidate, readonly { bias: number | null }[]>>;
  }>
): {
  winner: PointSourceInterfaceCandidate | null;
  eligible: PointSourceInterfaceCandidate[];
  meanAbsoluteBias: Record<
    PointSourceReading,
    { inPlace: number } & Record<PointSourceInterfaceCandidate, number>
  >;
} {
  const measured = Object.fromEntries(
    POINT_SOURCE_READINGS.map((reading) => [
      reading,
      {
        inPlace: meanAbsoluteBias(scores[reading].inPlace),
        ...Object.fromEntries(
          POINT_SOURCE_INTERFACE_CANDIDATES.map((c) => [
            c,
            meanAbsoluteBias(scores[reading].candidates[c]),
          ])
        ),
      },
    ])
  ) as Record<
    PointSourceReading,
    { inPlace: number } & Record<PointSourceInterfaceCandidate, number>
  >;
  const eligible = POINT_SOURCE_INTERFACE_CANDIDATES.filter((c) =>
    POINT_SOURCE_READINGS.every(
      (reading) => measured[reading].inPlace - measured[reading][c] >= CONTOUR_LAW_MARGIN
    )
  );
  const sum = (c: PointSourceInterfaceCandidate): number =>
    POINT_SOURCE_READINGS.reduce((a, reading) => a + measured[reading][c], 0);
  const winner = eligible.reduce<PointSourceInterfaceCandidate | null>(
    (best, c) => (best === null || sum(c) < sum(best) ? c : best),
    null
  );
  return { winner, eligible, meanAbsoluteBias: measured };
}

/** Rule 54: whether the interface winner is adopted — rule 38's test. */
export const adoptPointSourceInterfaceLaw = adoptInterfaceLaw;
