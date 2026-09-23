/**
 * Level B, step 2: the sources, pinned (rules 855 to 865, levelBProtocolRules.ts).
 *
 * Written on 23 September 2026, after rules 855 to 865 were pushed (61aaffe)
 * and before the model has been run on any input below. Every input carries
 * its value and the place in its source it is read from; every target carries
 * only its place and what it measures. Its value enters the repository at
 * step 4, after the predictions are committed (rule 855(3)).
 *
 * RULE 866. HOW A SOURCE'S WORDS BECOME AN INTERVAL, fixed before the model is
 * run on any of them:
 *   (a) a value given with ± is a normal of that σ; two values the source
 *       gives for one quantity, or a range it states, are a uniform interval
 *       between them;
 *   (b) a value the source calls "about" or "typical", with no error, takes
 *       ±20 % for an albedo and ±10 % for a density, uniform; a value stated
 *       plainly with no error takes the half-unit of its last printed digit
 *       (the printed interval of level A);
 *   (c) a diameter from a telescopic brightness is D = 1329 km × 10^(−H/5) / √p
 *       over the intervals of H and p, uniform between the smallest and the
 *       largest it gives; where the source gives the diameters itself, those;
 *   (d) the strength is not an input: the model derives it from the density
 *       (Collins et al. 2005, Eq. 9), and that law is part of the model under
 *       test (rule 859);
 *   (e) an event's target stated as two altitudes for one feature (two flares
 *       of one peak) is the interval between them, each end widened by its
 *       half-unit.
 *
 * What was read while pinning, declared (rule 858 continued): the full text of
 * the papers below, and the search results that led to them, which quoted
 * fragmentation altitudes of 2024 BX1 and 2023 CX1 and Carancas's crater
 * diameter. 2008 TC3's paper refuses automated access: Andrea opened it and
 * gave its text on 23 September. Brown et al. 2008 and Kenkmann et al. 2009
 * he downloaded the same day. Meteor Crater, class D, from chapters 4, 10 and
 * 11 of Kring's guidebook, downloaded with Andrea's leave the same day.
 *
 * Carancas, declared at pinning: every estimate of its body's mass or energy
 * uses the crater's diameter (Brown et al. 2008, Sect. 6, "we use the diameter
 * of the crater as a constraint"), so by rule 860(c) the diameter is reported
 * as circular and not scored; its depth-to-diameter ratio and its morphology
 * were not fitted and are scored. No pinned source states a seismic
 * magnitude, so K5 is dropped (rule 862).
 */

export interface LevelBSource {
  readonly id: string;
  readonly citation: string;
  readonly copy: string;
}

export type LevelBInputValue =
  | { readonly kind: 'normal'; readonly mean: number; readonly sigma: number }
  | { readonly kind: 'uniform'; readonly low: number; readonly high: number };

export interface LevelBInput {
  readonly value: LevelBInputValue;
  readonly unit: 'km/s' | 'deg' | 'm' | 'kg/m3';
  readonly source: string;
  readonly where: string;
  readonly note?: string;
}

export interface LevelBTarget {
  readonly id: 'E1' | 'E2' | 'E3' | 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'D1' | 'D2' | 'D3';
  readonly measures: string;
  readonly source: string;
  readonly where: string;
  readonly scored: boolean;
  readonly note?: string;
}

export interface LevelBEvent {
  readonly event: string;
  readonly inputs: {
    readonly velocity: LevelBInput;
    readonly angle: LevelBInput;
    readonly diameter: LevelBInput;
    readonly density: LevelBInput;
  };
  readonly targets: readonly LevelBTarget[];
}

export const LEVEL_B_SOURCES: readonly LevelBSource[] = [
  {
    id: 'spurny2024',
    citation:
      'Spurný P., Borovička J., et al. (2024), Atmospheric entry and fragmentation of the small asteroid 2024 BX1, A&A 686, A67',
    copy: 'arXiv:2403.00634v2',
  },
  {
    id: 'egal2025',
    citation:
      'Egal A., Vida D., et al. (2025), Catastrophic disruption of asteroid 2023 CX1 and implications for planetary defense, Nature Astronomy',
    copy: 'arXiv:2509.12362v1',
  },
  {
    id: 'borovicka2009',
    citation:
      'Borovička J., Charvát Z. (2009), Meteosat observation of the atmospheric entry of 2008 TC3 over Sudan and the associated dust cloud, A&A 507, 1015–1022',
    copy: 'A&A full HTML, text supplied by Andrea on 23 September 2026',
  },
  {
    id: 'brown2008',
    citation:
      'Brown P., ReVelle D. O., et al. (2008), Analysis of a crater-forming meteorite impact in Peru, J. Geophys. Res. 113, E09007',
    copy: 'PDF supplied by Andrea on 23 September 2026',
  },
  {
    id: 'kenkmann2009',
    citation:
      'Kenkmann T., Artemieva N. A., et al. (2009), The Carancas meteorite impact crater, Peru: geologic surveying and modeling of crater formation and atmospheric passage, Meteoritics & Planetary Science 44, 985–1000',
    copy: 'University of Arizona repository PDF (pages cited as printed in the journal), supplied by Andrea on 23 September 2026',
  },
  {
    id: 'kring2017',
    citation:
      'Kring D. A. (2017), Guidebook to the Geology of Barringer Meteorite Crater, Arizona (a.k.a. Meteor Crater), 2nd ed., LPI Contribution 2040, chapters 4, 10 and 11',
    copy: 'LPI chapter PDFs',
  },
  {
    id: 'jenniskens2021',
    citation:
      'Jenniskens P., et al. (2021), The impact and recovery of asteroid 2018 LA, Meteoritics & Planetary Science 56, doi:10.1111/maps.13653',
    copy: 'arXiv:2105.05997',
  },
];

/** The outcome every one of the entry set shares: meteorites on the ground,
 *  no crater. */
const noCrater = (source: string, where: string): LevelBTarget => ({
  id: 'E1',
  measures: 'the outcome: a break-up in the air, meteorites recovered, no crater',
  source,
  where,
  scored: true,
});

export const LEVEL_B_ENTRY_EVENTS: readonly LevelBEvent[] = [
  {
    event: '2008 TC3',
    inputs: {
      velocity: {
        value: { kind: 'uniform', low: 12.35, high: 12.45 },
        unit: 'km/s',
        source: 'borovicka2009',
        where:
          'Sect. 4.1: 12.4 km/s at 50 km, from the astrometric impact trajectory (Chesley et al. 2008)',
      },
      angle: {
        value: { kind: 'uniform', low: 19.95, high: 20.05 },
        unit: 'deg',
        source: 'borovicka2009',
        where: 'Sect. 4.1: "descending angle of 20.0° to the horizontal"',
      },
      diameter: {
        // The volume's normal carried to the equivalent sphere's diameter to
        // first order: D = (6V/π)^(1/3), σ_D = D σ_V / 3V.
        value: { kind: 'normal', mean: 3.81, sigma: 0.26 },
        unit: 'm',
        source: 'borovicka2009',
        where:
          'Sect. 5: "volume of 2008 TC3 from the shape model is 29 ± 6 m3 (Scheirich et al. 2009)"',
        note: 'The 35 000–65 000 kg from the radiated energy is an effect of the entry: not an input (rule 860(c)).',
      },
      density: {
        value: { kind: 'uniform', low: 2_100, high: 2_500 },
        unit: 'kg/m3',
        source: 'borovicka2009',
        where:
          'Sect. 5: Almahata Sitta meteorites, "bulk densities of 2100-2500 kg m-3" (Jenniskens et al. 2009)',
        note: "The authors' guess of a bulk density below 1700 kg m-3 is inferred from the heights of fragmentation, a target: not an input (rule 860(c)).",
      },
    },
    targets: [
      noCrater('borovicka2009', 'Sect. 5: "only small meteorites (≤ 283 g) were found"'),
      {
        id: 'E2',
        measures:
          'the height of the first major fragmentation: the flare with dust deposition that Meteosat recorded',
        source: 'borovicka2009',
        where: 'Sect. 4.2 and Sect. 5: "Another flare was detected by Meteosat at …" (rule 866(e))',
        scored: true,
        note: 'An earlier flare is "possible but uncertain", seen in one channel only (Sect. 4.2): not counted.',
      },
      {
        id: 'E3',
        measures: 'the height of the main flare',
        source: 'borovicka2009',
        where: 'Sect. 5: "the main flare occurred at a height of …"',
        scored: false,
        note: 'A row of I2 (rule 858): reported, not scored.',
      },
    ],
  },
  {
    event: '2024 BX1',
    inputs: {
      velocity: {
        value: { kind: 'normal', mean: 15.199, sigma: 0.008 },
        unit: 'km/s',
        source: 'spurny2024',
        where: 'Table 3, v∞, p. 4',
      },
      angle: {
        value: { kind: 'uniform', low: 75.557, high: 75.74 },
        unit: 'deg',
        source: 'spurny2024',
        where: 'Table 2, slope at the beginning and at the end, p. 3',
      },
      diameter: {
        // H = 32.84 (half-unit 0.005), p = 0.50 ± 20 % (rule 866(b), (c)).
        value: {
          kind: 'uniform',
          low: (1_329_000 * 10 ** (-32.845 / 5)) / Math.sqrt(0.6),
          high: (1_329_000 * 10 ** (-32.835 / 5)) / Math.sqrt(0.4),
        },
        unit: 'm',
        source: 'spurny2024',
        where: 'p. 7: H = 32.84 (MPC), albedo "about 0.50" of E-type asteroids and aubrites',
        note: 'The 140 kg of the fragmentation model is fitted to the light curve, a target: not an input (rule 860(c)).',
      },
      density: {
        value: { kind: 'uniform', low: 2_790, high: 3_410 },
        unit: 'kg/m3',
        source: 'spurny2024',
        where: 'p. 7: "the typical aubrite density 3100 kg m−3" (±10 %, rule 866(b))',
      },
    },
    targets: [
      noCrater('spurny2024', 'abstract and Sect. 7, p. 1 and p. 7: meteorites recovered'),
      {
        id: 'E2',
        measures: 'the height at which the first major fragmentation started',
        source: 'spurny2024',
        where:
          'Sect. 5, p. 4: "The first major, and in fact catastrophic, fragmentation started at a height of …"',
        scored: true,
      },
      {
        id: 'E3',
        measures: 'the height of maximum brightness, the two equally bright flares',
        source: 'spurny2024',
        where:
          'Sect. 5, p. 4: "maximum brightness … in two almost equally bright flares at heights of …" (rule 866(e))',
        scored: true,
      },
    ],
  },
  {
    event: '2023 CX1',
    inputs: {
      velocity: {
        value: { kind: 'normal', mean: 14.04, sigma: 0.03 },
        unit: 'km/s',
        source: 'egal2025',
        where: 'Table 3, initial velocity, p. 32',
      },
      angle: {
        value: { kind: 'uniform', low: 48.725, high: 49.098 },
        unit: 'deg',
        source: 'egal2025',
        where: 'Table 3, slope at the beginning and at the end before the flare, p. 32',
      },
      diameter: {
        value: { kind: 'uniform', low: 0.7, high: 1.1 },
        unit: 'm',
        source: 'egal2025',
        where:
          'Sect. 4.3, p. 16: radius "based on brightness alone, to 35-55 cm" (H = 32.7 ± 0.3, albedo of (20) Massalia 0.196 ± 0.036)',
        note: 'The preferred 36 ± 3 cm and 650 ± 160 kg combine the light curve and the infrasound, which are effects of the entry: not inputs (rule 860(c)).',
      },
      density: {
        value: { kind: 'uniform', low: 3_294, high: 3_353 },
        unit: 'kg/m3',
        source: 'egal2025',
        where:
          'Sect. 2.1.3, p. 7: bulk densities of the meteorites, 3.353 ± 0.080 and 3.294 ± 0.002 g/cm3',
      },
    },
    targets: [
      noCrater('egal2025', 'Sect. 2 and 4, meteorites recovered (Saint-Pierre-le-Viger)'),
      {
        id: 'E2',
        measures: 'the altitude of the first of the two major fragmentation events of the flare',
        source: 'egal2025',
        where: 'Sect. 2.2, p. 8, and p. 9: "two major fragmentation events at altitudes of …"',
        scored: true,
        note: 'Fragment F separated earlier "with minimal mass loss" and no brightening (p. 9): not a major fragmentation.',
      },
      {
        id: 'E3',
        measures:
          'the altitude of peak brightness, the second and more prominent fragmentation phase',
        source: 'egal2025',
        where:
          'p. 8 (the second of the two events) and p. 9 ("the second, more prominent fragmentation phase around …"): the interval between the two figures (rule 866(e))',
        scored: true,
      },
    ],
  },
  {
    event: '2018 LA',
    inputs: {
      velocity: {
        value: { kind: 'normal', mean: 16.999, sigma: 0.001 },
        unit: 'km/s',
        source: 'jenniskens2021',
        where: 'p. 12: speed at 100 km altitude from the measured orbit',
      },
      angle: {
        value: { kind: 'normal', mean: 24.12, sigma: 0.01 },
        unit: 'deg',
        source: 'jenniskens2021',
        where: 'p. 14: elevation El',
      },
      diameter: {
        value: { kind: 'uniform', low: 0.79, high: 1.56 },
        unit: 'm',
        source: 'jenniskens2021',
        where:
          'p. 30: "133 ± 23 cm or 96 ± 17 cm" for H = 31.08 (G = 0) or 31.78 (G = 0.15) and the V-class albedo 0.37 ± 0.12 — the interval spanning both',
        note: 'The preferred "about 156 cm" and 5 700 kg use the infrasound energy, an effect of the entry: not an input (rule 860(c)).',
      },
      density: {
        value: { kind: 'normal', mean: 2_850, sigma: 10 },
        unit: 'kg/m3',
        source: 'jenniskens2021',
        where: 'p. 15: bulk density of MP-01, 2.85 ± 0.01 g/cm3',
      },
    },
    targets: [
      noCrater('jenniskens2021', 'Abstract and p. 1: twenty-three meteorites recovered'),
      {
        id: 'E2',
        measures: 'the altitude of the disruption, the one flare, triangulated from video',
        source: 'jenniskens2021',
        where: 'p. 12: "Triangulation of these directions puts the flare at … altitude = …"',
        scored: true,
        note: 'The body broke up once, in the flare; the U.S. Government sensors give its peak (p. 13), the CNEOS row already in the repository (rule 858).',
      },
      {
        id: 'E3',
        measures: 'the altitude of peak brightness',
        source: 'jenniskens2021',
        where: 'p. 13: U.S. Government sensors, "peaking in brightness at … altitude"',
        scored: false,
        note: 'A row of I2 (rule 858): reported, not scored.',
      },
    ],
  },
];

/** Rule 857(c): the crater set. */
export const LEVEL_B_CRATER_EVENTS: readonly LevelBEvent[] = [
  {
    event: 'Carancas',
    inputs: {
      velocity: {
        value: { kind: 'uniform', low: 11.7, high: 16.9 },
        unit: 'km/s',
        source: 'brown2008',
        where:
          'Sect. 5, [24], p. 8: "between 11.7–16.9 km/s" at the top of the atmosphere, from the orbit (Tisserand parameter above 3)',
      },
      angle: {
        value: { kind: 'uniform', low: 62.5, high: 63.5 },
        unit: 'deg',
        source: 'brown2008',
        where:
          'Sect. 5, [23], p. 7: best-fit "entry angle of 63°" (rule 866(b)); the source calls it representative, not unique',
      },
      diameter: {
        // 3 to 9 t over the density's interval, as spheres.
        value: {
          kind: 'uniform',
          low: Math.cbrt((6 * 3_000) / (Math.PI * 3_750)),
          high: Math.cbrt((6 * 9_000) / (Math.PI * 3_650)),
        },
        unit: 'm',
        source: 'brown2008',
        where: 'Abstract, p. 1: "The initial mass of the meteoroid is in the range of 3–9 tons"',
        note: "Fitted with the crater's diameter as a constraint (Sect. 6, p. 8): K2 is circular (rule 860(c)).",
      },
      density: {
        value: { kind: 'uniform', low: 3_650, high: 3_750 },
        unit: 'kg/m3',
        source: 'kenkmann2009',
        where:
          'p. 994: "a density of 3700 kg/m3 (Consolmagno et al. 1998)" (rule 866(b), two significant figures)',
      },
    },
    targets: [
      {
        id: 'K1',
        measures: 'the outcome: a single crater dug by a body that reached the ground',
        source: 'kenkmann2009',
        where: 'Abstract, p. 985',
        scored: true,
      },
      {
        id: 'K2',
        measures: 'the rim-to-rim diameter',
        source: 'kenkmann2009',
        where:
          'p. 989: "average diameter of …, measured from rim crest to rim crest", and the earlier measurements it quotes',
        scored: false,
        note: "Circular: the body's mass was fitted to it (rule 860(c)).",
      },
      {
        id: 'K3',
        measures: 'the depth-to-diameter ratio',
        source: 'kenkmann2009',
        where: 'p. 989: "Depth/diameter ratios obtained from measured profiles …"',
        scored: true,
      },
      {
        id: 'K4',
        measures: 'the morphology: a simple, bowl- or cone-shaped crater',
        source: 'kenkmann2009',
        where: 'pp. 989–990 and Fig. 2',
        scored: true,
      },
    ],
  },
];

/**
 * Rule 857(d): consistency only, class D. Its inputs are the ranges the
 * literature "usually" assumes (Kring 2017, p. 119), not the best fit of
 * Collins et al. 2016 that the guidebook reports (p. 39), which is fitted to
 * the crater. The observed crater is today's: eroded, its floor partly filled
 * (p. 36); the model's is fresh. Rim height, the ejecta's thickness on the
 * rim, the breccia lens and the gravity anomaly are not computed, so not
 * scored.
 */
export const LEVEL_B_CONSISTENCY_EVENTS: readonly LevelBEvent[] = [
  {
    event: 'Meteor Crater',
    inputs: {
      velocity: {
        value: { kind: 'uniform', low: 11, high: 20 },
        unit: 'km/s',
        source: 'kring2017',
        where:
          'Ch. 11, p. 119: "The impact velocity is usually assumed to be between 11 and 20 km/s"',
        note: 'An impact velocity, taken as the speed of entry: an iron of 10 to 50 m keeps most of it.',
      },
      angle: {
        value: { kind: 'uniform', low: 44.5, high: 45.5 },
        unit: 'deg',
        source: 'kring2017',
        where:
          'Ch. 10, p. 116: "a 45° impact angle, the most probable impact angle and consistent with the symmetrical shape of the crater" (rule 866(b))',
      },
      diameter: {
        value: { kind: 'uniform', low: 10, high: 50 },
        unit: 'm',
        source: 'kring2017',
        where:
          'Ch. 11, p. 119: "the projectile is usually assumed to have a pre-collisional diameter of roughly 10 to 50 m"',
      },
      density: {
        value: { kind: 'uniform', low: 7_750, high: 7_850 },
        unit: 'kg/m3',
        source: 'kring2017',
        where:
          'Ch. 11, Table 11.1 note, p. 120: "I assume a projectile density of 7.8 g/cm3" (rule 866(b))',
      },
    },
    targets: [
      {
        id: 'D1',
        measures: "the crater's diameter",
        source: 'kring2017',
        where: 'Ch. 4, p. 35: "has a diameter of …"',
        scored: true,
      },
      {
        id: 'D2',
        measures: 'the depth of the bowl-shaped depression, today',
        source: 'kring2017',
        where: 'Ch. 4, p. 35: "a bowl-shaped depression that is … deep"',
        scored: true,
        note: 'Eroded and partly filled since (p. 36): the fresh crater the model gives was deeper.',
      },
      {
        id: 'D3',
        measures: 'the morphology: simple',
        source: 'kring2017',
        where: 'Ch. 4, p. 35: "The crater has a simple bowl-shaped morphology"',
        scored: true,
      },
    ],
  },
];
