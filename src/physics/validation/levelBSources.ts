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
 * the three papers below, and the search results that led to them, which
 * quoted fragmentation altitudes of 2024 BX1 and 2023 CX1 and Carancas's
 * crater diameter. 2008 TC3's paper could not be read: its publisher refuses
 * automated access, and the event stays unpinned until it is read by hand.
 * Carancas and Meteor Crater are pinned in a later commit of this step, still
 * before step 3.
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
  readonly id: 'E1' | 'E2' | 'E3' | 'K1' | 'K2' | 'K3' | 'K4' | 'K5';
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
