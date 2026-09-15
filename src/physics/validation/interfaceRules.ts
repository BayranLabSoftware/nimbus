import { adoptOnTolls, CONTOUR_LAW_MARGIN, meanAbsoluteBias } from './contourLaws.js';
import { passesOnQuiet } from './depthRules.js';

/**
 * The rings of an earthquake on a subduction interface.
 *
 * The benchmark campaign (docs/BENCHMARK_REPORT.md, BM-10) drew the five
 * megathrust presets' rings with Boore et al. 2014 at 4.2 and 6.0 times the
 * distances two interface models give in OpenQuake. The figure is made at
 * MMI VIII, which those models reach only at the edge of the rupture; at
 * MMI VII the rings were 0.71 and 0.83 of theirs. What was looked at
 * before these rules were written, and is therefore not held out:
 *
 *  - that campaign comparison, five presets against Abrahamson, Gregor &
 *    Addo 2016 and Parker et al. 2022;
 *  - on rule 18's ShakeMaps, the areas the law in place draws for the 76
 *    reverse-faulting earthquakes of Mw 7 or more that have a map, with no
 *    candidate: at MMI VII it covers 0.98 of Tōhoku 2011's ground, 0.78 of
 *    Maule 2010's, 0.47 of Kamchatka 2025's and Chignik 2021's and 0.19 of
 *    Ecuador 2016's, and at MMI VIII 1.8 times Tōhoku's, 5.6 times
 *    Chignik's, and ground at Maule and Iquique 2014 where their maps hold
 *    none;
 *  - the info.json of one ShakeMap (Kamchatka 2025), to see what it
 *    carries; and, once rule 35's file was read, that 933 of the 1 177
 *    maps, drawn before ShakeMap wrote STREC's probabilities into
 *    info.json, carry none, which is why rule 35 reads the weight the
 *    map's model gave its interface models instead, and how many of each
 *    set's earthquakes that classes as interface events.
 *
 * Boore et al. 2014 is a relation for shallow crustal earthquakes in the
 * Joyner–Boore distance, and draws the whole footprint of a rupture 20 to
 * 50 km deep at the shaking of a fault that breaks the surface. The
 * relations fitted on interface earthquakes draw it lower near the rupture
 * and slower to fall away, which is the shape those maps have. Whether that
 * is better is chosen on maps these relations have not been scored on, and
 * checked on the dead.
 *
 * The rules, fixed on 15 September 2026, before either candidate below was
 * coded or run on any earthquake they name, and numbered after the
 * thirty-four before them:
 *
 *  35. The set. Every earthquake of rule 11's set with a ShakeMap footprint
 *      in ruleShakemapData.ts and every earthquake of rule 23's set in
 *      unseenSetData.ts whose preferred ShakeMap — the product its
 *      footprint was summed from — was drawn with a ground-motion model
 *      that gives its subduction-interface model sets a weight of 0.5 or
 *      more, as the map's info.json records it: the weight ShakeMap's
 *      select module sets from the Seismo-Tectonic Regime Earth
 *      Calculator (STREC, with the Slab2 model) for the event. That is 98
 *      of rule 11's 369 maps and 353 of rule 23's 808.
 *      scripts/build-interface-set.ts reads them into interfaceSetData.ts,
 *      committed before any candidate is scored; an earthquake whose map
 *      has no info.json or no model weights is listed there and left out.
 *      STREC's own probabilities, where a map carries them, are stored and
 *      decide nothing. The inputs are rules 1 to 3's, with the scenario
 *      marked a subduction interface — Strasser et al. 2010's interface
 *      rupture, drawn as its stadium — for every law alike.
 *  36. The candidates. In place, `boore2014`. And, for a scenario marked a
 *      subduction interface only, Boore et al. 2014 elsewhere:
 *      `abrahamson2016Interface`, Abrahamson, Gregor & Addo 2016 (the BC
 *      Hydro model) for interface events, median PGA, its central
 *      magnitude scaling (ΔC1 = 0.2), a forearc site, its own site term at
 *      the scenario's Vs30; and `parker2022Interface`, Parker et al. 2022
 *      (NGA-Subduction), its global interface model without regional or
 *      basin terms, median PGA, its own site term. For both, each
 *      intensity's PGA is Worden et al. 2012's, as in place; the ring stands
 *      at the Joyner–Boore distance x about the stadium where the median at
 *      the rupture distance √(x² + h²) falls to it, h the scenario's depth
 *      (15 km where none is set); a ground-motion residual scales the
 *      median as it scales Boore et al. 2014's. Before any score, each is
 *      held to OpenQuake's implementation (AbrahamsonEtAl2015SInter,
 *      ParkerEtAl2020SInter, version 3.26.2) within 0.1 % at magnitudes 6
 *      to 9.5, rupture distances 1 to 1 000 km and Vs30 150 to 1 500 m/s;
 *      a miss is a defect to fix, not a choice.
 *  37. Selection on shaking. Rule 18's score, with its floor and its three
 *      magnitude cells, on the ShakeMaps of rule 35's earthquakes, read four
 *      ways: rule 11's part and rule 23's part, each on reference rock
 *      (Vs30 760 m/s) and on the browser's ground by rule 22. A candidate is
 *      eligible when its mean absolute bias is lower than Boore et al.
 *      2014's by 0.05 or more in every reading; the winner is the eligible
 *      candidate with the lowest sum of its four; with none eligible,
 *      Boore et al. 2014 stays and nothing runs on the dead.
 *  38. Checked on the dead. The winner runs once, beside Boore et al. 2014,
 *      on the browser's ground: on rule 11's held-out tolls of rule 35's
 *      earthquakes, and on rule 23's quiet ones among them. It is adopted
 *      if it passes rule 19's test on those tolls against the law in place
 *      and, as rule 25 has it, raises no larger a share of those quiet
 *      earthquakes to a median toll of ten. An adopted law draws the rings
 *      of every scenario marked a subduction interface: the presets, a
 *      custom scenario that sets it, and in the harness every earthquake
 *      rule 35 classes as one. The report prints both laws' figures
 *      whatever they read; rows of the net that leave their band are
 *      ungated with their cause, and nothing is re-tuned (rules 5 and 6).
 *  39. Reported, deciding nothing: the three laws' scores on the maps with
 *      ten seismic stations or more, and apart on the maps drawn with each
 *      of ShakeMap's interface model sets; the bands each invents and
 *      misses; and each law's rings for the five megathrust presets.
 *
 * What these rules cannot settle. For an earthquake few stations
 * recorded, a ShakeMap is mostly the models USGS runs for its region, and
 * those include both candidates: BC Hydro in the NSHMP 2014 interface set
 * (weight 0.3) and, refitted to Chile by Montalva et al. 2017, in the set
 * ShakeMap runs alone there; Parker et al. in the NSHMP 2023 one (0.25). A
 * candidate agrees with such a map partly because the map is made of it,
 * which rule 39 prints and does not correct. STREC's probability is itself a model of
 * the slab. The rupture distance is a hypocentre's depth added to a
 * distance from a symmetric stadium, where a megathrust dips. And the
 * interface earthquakes that killed are few.
 */

/** What rule 35 reads from one ShakeMap. */
export interface InterfaceClass {
  comcat: string;
  set: 'rule11' | 'rule23';
  /** The weight the map's ground-motion model gives its
   *  subduction-interface model sets, and their names; 0 and empty where
   *  it drew with none. */
  interfaceWeight: number;
  interfaceSet: string;
  /** STREC's probabilities of a subduction-zone earthquake being on the
   *  interface, crustal, or in the slab, where the map carries them. */
  interfaceProbability: number | null;
  crustalProbability: number | null;
  intraslabProbability: number | null;
  /** STREC's tectonic region. */
  region: string;
  /** The Slab2 depth and dip under the epicentre, where there is a slab. */
  slabDepthKm: number | null;
  slabDipDeg: number | null;
  /** Seismic stations and intensity reports the map used. */
  stations: number;
  reports: number;
}

/** Rule 35: the least weight of an interface event's interface models. */
export const INTERFACE_WEIGHT_AT_LEAST = 0.5;

export function isInterfaceEvent(c: Pick<InterfaceClass, 'interfaceWeight'>): boolean {
  return c.interfaceWeight >= INTERFACE_WEIGHT_AT_LEAST;
}

/** Rule 36's laws, the one in place first. */
export const INTERFACE_LAWS = [
  'boore2014',
  'abrahamson2016Interface',
  'parker2022Interface',
] as const;

export type InterfaceLaw = (typeof INTERFACE_LAWS)[number];

/** Rule 37's four readings. */
export const INTERFACE_READINGS = [
  'rule11Rock',
  'rule11Ground',
  'rule23Rock',
  'rule23Ground',
] as const;

export type InterfaceReading = (typeof INTERFACE_READINGS)[number];

/** Rule 39: the stations a map needs to be printed apart. */
export const INTERFACE_STATIONS_AT_LEAST = 10;

/** Rule 37: the winner among the candidates, if any. */
export function chooseInterfaceLaw(
  scores: Readonly<
    Record<InterfaceReading, Readonly<Record<InterfaceLaw, readonly { bias: number | null }[]>>>
  >
): {
  winner: InterfaceLaw;
  eligible: InterfaceLaw[];
  meanAbsoluteBias: Record<InterfaceReading, Record<InterfaceLaw, number>>;
} {
  const measured = Object.fromEntries(
    INTERFACE_READINGS.map((reading) => [
      reading,
      Object.fromEntries(
        INTERFACE_LAWS.map((law) => [law, meanAbsoluteBias(scores[reading][law])])
      ) as Record<InterfaceLaw, number>,
    ])
  ) as Record<InterfaceReading, Record<InterfaceLaw, number>>;
  const eligible = INTERFACE_LAWS.filter(
    (law) =>
      law !== 'boore2014' &&
      INTERFACE_READINGS.every(
        (reading) => measured[reading].boore2014 - measured[reading][law] >= CONTOUR_LAW_MARGIN
      )
  );
  const sum = (law: InterfaceLaw): number =>
    INTERFACE_READINGS.reduce((a, reading) => a + measured[reading][law], 0);
  const winner = eligible.reduce<InterfaceLaw>(
    (best, law) => (best === 'boore2014' || sum(law) < sum(best) ? law : best),
    'boore2014'
  );
  return { winner, eligible, meanAbsoluteBias: measured };
}

/** Rule 38: whether the winner is adopted, and which test it passes. */
export function adoptInterfaceLaw(
  tolls: {
    inPlace: readonly { bias: number | null }[];
    winner: readonly { bias: number | null; inside: number; rows: number }[];
  },
  quiet: { inPlaceShare: number; winnerShare: number }
): { adopted: boolean; tolls: boolean; quiet: boolean } {
  const onTolls = adoptOnTolls(tolls.inPlace, tolls.winner);
  const onQuiet = passesOnQuiet(quiet.inPlaceShare, quiet.winnerShare);
  return { adopted: onTolls && onQuiet, tolls: onTolls, quiet: onQuiet };
}
