import type { LevelBEvent, LevelBInput, LevelBSource, LevelBTarget } from './levelBSources.js';

/**
 * Level B's second round, step 2: the sources, pinned (rules 875 to 880, 903,
 * 904 and 919 to 926 of levelBSecondRules.ts).
 *
 * Written on 23 September 2026, afternoon, after rules 919 to 926 were pushed
 * (00f39c5) and the audit of rule 920 found every candidate absent from the
 * repository's data; the model frozen at 5b6b7a5 has been run on none of the
 * inputs below. As in the first round every input carries its value and its
 * place in its source; every target carries only its place and what it
 * measures, its value entering the repository at step 4, after the
 * predictions are committed. The conversions are rule 866's.
 *
 * What was read while pinning, declared (rule 858 continued): the full text of
 * the four sources below, downloaded with Andrea's leave that afternoon
 * (arXiv 2411.14595 and ACM 2023 abstract 2207 for 2022 WJ1; arXiv 2502.09712
 * for 2024 XA1; LPSC XXIII 573–574 and the MetSoc 2021 e-poster 6046 for
 * Sterlitamak), and the search results that led to them, which quoted 2022
 * WJ1's fragmentation pressures, 2024 XA1's modelled fragmentation heights,
 * 2024 UQ's CNEOS altitude, 2026 RW1's size and Sterlitamak's crater and
 * masses. The targets of 2022 WJ1 and Sterlitamak have therefore been read
 * before the predictions: the test is preregistered, not blind (rule 856).
 *
 * Rule 904's row, event by event, is `LEVEL_B2_ROWS` below.
 */

export const LEVEL_B2_SOURCES: readonly LevelBSource[] = [
  {
    id: 'kareta2024',
    citation:
      'Kareta T., Vida D., Micheli M., Moskovitz N., Wiegert P., Brown P. G., et al. (2024), Telescope-to-Fireball Characterization of Earth Impactor 2022 WJ1 (received 21 June 2024, accepted 22 October 2024)',
    copy: 'arXiv:2411.14595v1 (21 November 2024)',
  },
  {
    id: 'wiegert2023',
    citation:
      'Wiegert P., et al. (2023), The 2022 WJ1 fireball event, Asteroids, Comets, Meteors 2023, abstract 2207',
    copy: 'hou.usra.edu/meetings/acm2023/pdf/2207.pdf',
  },
  {
    id: 'gianotto2025',
    citation:
      'Gianotto F., Carbognani A., Fenucci M., et al. (2025), The fall of asteroid 2024 XA1 and the location of possible meteorites, Icarus',
    copy: 'arXiv:2502.09712v1 (13 February 2025)',
  },
  {
    id: 'ivanov1992',
    citation:
      'Ivanov B. A., Petaev M. I. (1992), Mass and impact velocity of the meteorite formed the Sterlitamak crater in 1990, Lunar Planet. Sci. XXIII, 573–574',
    copy: 'articles.adsabs.harvard.edu, 1992LPI....23..573I',
  },
  {
    id: 'ovcharenko2021',
    citation:
      'Ovcharenko A. V., Schapov V. A., Muravyev L. A. (2021), Geophysical search of the Sterlitamak meteorite, 84th Meteoritical Society meeting, e-poster 6046',
    copy: 'hou.usra.edu/meetings/metsoc2021/eposter/6046.pdf',
  },
];

/** Rule 873: no pinned source states the ground under the body. */
const crustalRock = (source: string, why: string): LevelBInput => ({
  value: { kind: 'fixed', value: 2_700 },
  unit: 'kg/m3',
  dependsOnTarget: false,
  source,
  where: `not stated by the source (${why}): the model's crustal rock, CRUSTAL_ROCK_DENSITY (rule 873)`,
});

/**
 * Rule 904's row for each candidate of rule 876: its primary source and when
 * it appeared; how each altitude was measured, and whether measured or derived
 * from a model; its uncertainty; the definition of the observable; its
 * presence in I2's CNEOS set and in the literature the strength's priors came
 * from; and what rule 876 does with it.
 */
export interface LevelB2Row {
  readonly event: string;
  readonly primarySource: string | null;
  readonly published: string | null;
  readonly altitudes: string;
  readonly uncertainty: string;
  readonly observable: string;
  readonly inCneosSet: boolean;
  readonly inPriorsLiterature: boolean;
  readonly decision: 'counted' | 'not counted' | 'diagnostic';
  readonly reason: string;
}

export const LEVEL_B2_ROWS: readonly LevelB2Row[] = [
  {
    event: '2022 WJ1',
    primarySource: 'kareta2024',
    published: 'arXiv 21 November 2024 (accepted 22 October 2024)',
    altitudes:
      'measured: the trajectory from five calibrated cameras (Table 3, p. 12); the flares timed on the Caistor light curve and placed on that trajectory (Fig. 11, p. 16; Table 7, p. 19). Derived from a model, not a target: the fragmentation heights and pressures of Table 6 (p. 17), fitted by the semi-empirical fragmentation model, "not a unique solution but simply representative" (p. 15)',
    uncertainty:
      'trajectory heights ±0.013 to ±0.044 km, speed ±0.003 km/s, elevation ±0.013° (Table 3); light curve ±0.2 mag unsaturated, up to ±1 mag where saturated and corrected (p. 14)',
    observable:
      'E1 no crater; E3 the heights of the flares; E2, the first stage of the strength, has no altitude to be read against: the source reports no first-stage fragmentation at dynamic pressures ≤ 0.1 MPa (Sect. 2.5, p. 17)',
    inCneosSet: false,
    inPriorsLiterature: false,
    decision: 'counted',
    reason:
      'rule 876(a): seen by telescopes before entry, its fireball measured by instruments; absent from every file of the repository (rules 903, 920) and from the 2009–2018 sample of Borovička et al. 2020; not detected by GLM (p. 14)',
  },
  {
    event: '2024 XA1',
    primarySource: 'gianotto2025',
    published: 'arXiv 13 February 2025, Icarus 2025',
    altitudes:
      'derived from a model only: the main fragmentation at 40.6, 35.6 and 23.7 km for assumed strengths of 0.5, 1 and 5 MPa (p. 10); the Lensk webcam shows "at least two flares, one of which was very intense towards the end of the fireball phase" (pp. 10–11), with no altitude',
    uncertainty: 'none stated for any altitude',
    observable: 'no altitude of fragmentation or flare that was observed',
    inCneosSet: false,
    inPriorsLiterature: false,
    decision: 'not counted',
    reason:
      "rule 876(b)'s clause not met: no pinned peer-reviewed source reports an observed altitude",
  },
  {
    event: '2024 UQ',
    primarySource: null,
    published: null,
    altitudes:
      "the only altitude found, peak brightness at 38.2 km, is CNEOS's, relayed by ESA's NEO Coordination Centre; no peer-reviewed source of an independent observation was found (search of 23 September 2026)",
    uncertainty: 'none stated',
    observable: 'none independent of CNEOS',
    inCneosSet: false,
    inPriorsLiterature: false,
    decision: 'not counted',
    reason: "rule 876(b)'s clause and rule 904: no independent observation with its uncertainty",
  },
  {
    event: '2026 RW1',
    primarySource: null,
    published: null,
    altitudes:
      'none: seventeen days after its impact, only news reports (a body of about 0.8 m burning up over the Indian Ocean) were found (search of 23 September 2026)',
    uncertainty: 'none',
    observable: 'none',
    inCneosSet: false,
    inPriorsLiterature: false,
    decision: 'not counted',
    reason: "rule 876(b)'s clause not met: no peer-reviewed source",
  },
  {
    event: 'Sterlitamak',
    primarySource: 'ivanov1992',
    published: 'Lunar and Planetary Science XXIII, March 1992',
    altitudes: 'none: a crater-forming fall; the targets are the crater',
    uncertainty:
      'the crater measured about a week after the fall, after local people had visited it (p. 573); later accounts differ (ovcharenko2021, p. 1)',
    observable:
      'K1 a single crater dug by a body that reached the ground; K3 depth over diameter; K4 simple',
    inCneosSet: false,
    inPriorsLiterature: false,
    decision: 'diagnostic',
    reason:
      'rule 922: every mass of the body is fitted to the crater — 1.4 to 2.6 t for a body that does not ablate, 3 to 290 t with ablation (Tables 1 and 2, p. 574); the 325 kg recovered (p. 573) is a lower bound only, and the geophysical search of 2014–2016 found that "a significant mass of the meteorite may still be in the crater" without weighing it (ovcharenko2021, p. 1)',
  },
];

const noCrater = (source: string, where: string): LevelBTarget => ({
  id: 'E1',
  measures: 'the outcome: a break-up in the air, fragments to the ground, no crater (rule 904)',
  source,
  where,
  scored: true,
  priority: 'primary',
});

/** Rule 876(a): the counted body of the entry. */
export const LEVEL_B2_ENTRY_EVENTS: readonly LevelBEvent[] = [
  {
    event: '2022 WJ1',
    inputs: {
      velocity: {
        value: { kind: 'normal', mean: 14.003, sigma: 0.003 },
        unit: 'km/s',
        dependsOnTarget: false,
        source: 'kareta2024',
        where: 'Table 3, p. 12: velocity at the beginning of the luminous path, 95.455 km',
      },
      angle: {
        value: { kind: 'normal', mean: 22.46, sigma: 0.013 },
        unit: 'deg',
        dependsOnTarget: false,
        source: 'kareta2024',
        where: 'Table 3, p. 12: elevation at the beginning',
      },
      diameter: {
        value: { kind: 'uniform', low: 0.4, high: 0.6 },
        unit: 'm',
        dependsOnTarget: false,
        source: 'kareta2024',
        where:
          'Sect. 2.2, p. 7: "a diameter between 40 and 60 centimeters" from the telescopic colours and the S-complex albedos of 15 to 35 % (rule 866(c): the source gives the diameters)',
        note: 'The 44–54 cm of the fragmentation model (Sect. 2.5, p. 18) is fitted to the light curve, a target: not an input (rule 860(c)).',
      },
      density: {
        value: { kind: 'uniform', low: 2_500, high: 3_500 },
        unit: 'kg/m3',
        dependsOnTarget: false,
        source: 'kareta2024',
        where:
          'p. 8: ordinary chondrites, "whose densities fall in the range (2.5−3.5 g/cm3) (Flynn et al. 2018)"',
        note: 'The 3 400 kg/m³ of Table 5 (p. 17) is inferred by the fragmentation model from the light curve: not an input.',
      },
      targetDensity: crustalRock('kareta2024', 'fragments fell mostly into Lake Ontario'),
    },
    targets: [
      noCrater(
        'kareta2024',
        'abstract, p. 1 ("no meteorites have been found as of yet"), and Sect. 2.6, pp. 18–20 (dark flight: fragments into Lake Ontario and a main mass to the ground)'
      ),
      {
        id: 'E2',
        measures:
          "the altitude of the first major fragmentation, read as a test of the first stage (rule 921) — dropped by rule 862: the source reports no first-stage fragmentation at dynamic pressures ≤ 0.1 MPa, so there is no altitude to read the model against; the model's first-stage altitude and the share it gives major first phases (two in three) are reported beside the source's statement",
        source: 'kareta2024',
        where:
          'Sect. 2.5, p. 17: "WJ1 did not show any evidence for early, first stage fragmentation …"',
        scored: false,
      },
      {
        id: 'E3',
        measures:
          'compatibility with the flare altitude (rules 868 and 921): the heights of the two brightest flares, the model depositing its energy at `entry.burstAltitude` — a joint test of the second stage, the cascade of fragments and the light (rule 866(e): the interval between them)',
        source: 'kareta2024',
        where:
          'Table 7, p. 19 (flare heights on the measured trajectory) and Fig. 11, p. 16 (the two brightest flares of the Caistor light curve)',
        scored: true,
        priority: 'secondary',
      },
    ],
  },
];

/** Rule 922: Sterlitamak, run and reported, never scored. */
export const LEVEL_B2_DIAGNOSTIC_EVENTS: readonly LevelBEvent[] = [
  {
    event: 'Sterlitamak',
    inputs: {
      velocity: {
        value: { kind: 'uniform', low: 11.2, high: 17.8 },
        unit: 'km/s',
        dependsOnTarget: false,
        source: 'ivanov1992',
        where:
          'p. 573, input (5): "the entry velocity, ve, is in the range from 11.2 to 17.8 km/s", from the observed direction of flight and prograde orbits',
      },
      angle: {
        value: { kind: 'uniform', low: 30, high: 60 },
        unit: 'deg',
        dependsOnTarget: false,
        source: 'ivanov1992',
        where: 'p. 573, input (2): "The incidence angle was about 45 degrees", from witnesses',
        note: "The source gives no range; ±15° is this diagnostic case's own, declared at pinning (rule 923).",
      },
      diameter: {
        // 1.4 to 2.6 t of iron at 7 800 kg/m³, as spheres.
        value: {
          kind: 'uniform',
          low: Math.cbrt((6 * 1_400) / (Math.PI * 7_800)),
          high: Math.cbrt((6 * 2_600) / (Math.PI * 7_800)),
        },
        unit: 'm',
        dependsOnTarget: true,
        source: 'ivanov1992',
        where:
          'Table 1, p. 574: the mass of a body that does not ablate, 1.4 to 2.6 t over the three crater laws and the velocity range — the model does not ablate',
        note: 'Fitted to the crater volume (p. 573): circular (rule 860(c)), which is why the case is diagnostic.',
      },
      density: {
        value: { kind: 'fixed', value: 7_800 },
        unit: 'kg/m3',
        dependsOnTarget: false,
        source: 'ivanov1992',
        where:
          'p. 573, input (6): "the projectile is an iron meteorite" (a IIIAB octahedrite, ovcharenko2021, p. 1); the model\'s IRON_METEORITE_DENSITY',
      },
      targetDensity: crustalRock(
        'ovcharenko2021',
        'chernozems and grey soils over plastic red clays, p. 1, no density given'
      ),
    },
    targets: [
      {
        id: 'K1',
        measures: 'the outcome: a single crater dug by a body that reached the ground',
        source: 'ivanov1992',
        where: 'p. 573: the crater, and the projectile recovered from it',
        scored: false,
      },
      {
        id: 'K3',
        measures: 'the depth-to-diameter ratio',
        source: 'ivanov1992',
        where:
          'p. 573: the crater measured about a week after the fall (mean radius and depth), beside the dimensions of ovcharenko2021, p. 1',
        scored: false,
      },
      {
        id: 'K4',
        measures: 'the morphology: simple',
        source: 'ovcharenko2021',
        where: 'p. 1: the fresh crater and its photograph',
        scored: false,
      },
    ],
  },
];

/**
 * Rule 925: the domain a B of the entry would claim. With one counted body
 * (2022 WJ1) the round claims no B of the entry (rules 876(e) and 926): at
 * most "compatible in one case", for a stony body of 0.40 to 0.60 m entering
 * at 14.0 km/s and 22.5°.
 */
export const LEVEL_B2_COUNTED_ENTRY_BODIES = 1;
