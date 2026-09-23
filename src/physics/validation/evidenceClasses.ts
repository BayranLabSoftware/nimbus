/**
 * What each number an impact prints can claim, and on what evidence.
 *
 * Phase 1 of the plan of 22 September 2026 ("honesty on the cards"), on the
 * scale the reviewing astrophysicist gave that evening. His question is the
 * one every card must answer without being asked: in which physical domain is
 * the model reliable, with what error, and when is it only extrapolating?
 *
 * The scale:
 *
 * - **A — implementation verified.** The code computes the equations it cites
 *   as the reference implementation of those equations does, on a stated set
 *   of cases, within a stated error, at every commit. It says nothing about
 *   whether the equations describe the world.
 * - **B — validated within stated domain.** Held to what was observed —
 *   Chelyabinsk, Tunguska, Meteor Crater blind — within a bound written first.
 * - **C — screening-grade for specified parameter ranges.** Held to published
 *   hydrocode results (iSALE, CTH, SOVA) across a grid, green, amber and red.
 * - **D — consistent with literature ranges.** For what no single study
 *   settles (Chicxulub), inside the spread of the studies — never a validated
 *   prediction.
 * - **Exploratory only.** None of the above yet. The number is printed as a
 *   scenario, and the card says so.
 *
 * One table, read by the globe's legend, the panel and the report, so that a
 * class cannot differ between the three. The texts are in the locales
 * (`evidence.*`); the figures they carry are here, and the test beside this
 * file recomputes every one of them from its source — a class, like a number,
 * must not drift from the thing it describes.
 *
 * Nothing here changes a computed number. It changes what is claimed about it.
 */

export type EvidenceClass = 'A' | 'B' | 'C' | 'D' | 'exploratory';

export const EVIDENCE_CLASSES: readonly EvidenceClass[] = ['A', 'B', 'C', 'D', 'exploratory'];

/**
 * The families of numbers an impact prints. Every figure the panel, the globe
 * or the report shows belongs to exactly one; the test beside this file fails
 * if one appears without it.
 */
export type EvidenceQuantity =
  | 'energy'
  | 'entry'
  | 'crater'
  | 'blast'
  | 'thermal'
  | 'ejecta'
  | 'seismic'
  | 'atmosphere'
  | 'tsunami'
  | 'casualties';

export const EVIDENCE_QUANTITIES: readonly EvidenceQuantity[] = [
  'energy',
  'entry',
  'crater',
  'blast',
  'thermal',
  'ejecta',
  'seismic',
  'atmosphere',
  'tsunami',
  'casualties',
];

/**
 * A comparison with the reference implementation, case by case (level A,
 * `levelA.ts`, on both reference grids): every reading past the audit bar
 * must be traced to a documented difference for the family to hold class A.
 */
export interface ReferenceCheck {
  /** Impacts of the reference grids that answer this family. */
  readonly impacts: number;
  /** Pairs compared: an impact can answer at several ranges or thresholds. */
  readonly readings: number;
  /** The share within 2 % of the program, in per cent, rounded down to a
   *  tenth. */
  readonly excellentPercent: number;
  /** Readings past 10 %, each traced to a documented difference. */
  readonly pastTen: number;
}

/** A comparison with what was observed. */
export interface ObservedCheck {
  /** What was observed, as the locales name it (`evidence.observed.*`). */
  readonly id: 'bolides';
  readonly events: number;
  /** The model's median distance from the observations. */
  readonly medianError: number;
  readonly unit: 'km';
  /** The bar the plan sets, and whether the model meets it. */
  readonly bar: number;
  readonly meetsBar: boolean;
}

/**
 * Level B (phase 3 of the plan): the model held to observed events,
 * preregistered — rules 855 to 874 (levelBProtocolRules.ts), scored by
 * levelBScore.ts. Its outcome, as the reviewer worded it on 23 September 2026,
 * is in the locales (`evidence.levelB.*`).
 */
export interface LevelBCheck {
  readonly outcome: 'not earned';
  /** The events the family was counted on. */
  readonly events: readonly string[];
  /** Events it is consistent with, class D, where there are some. */
  readonly consistent: readonly string[];
}

export interface EvidenceRecord {
  readonly quantity: EvidenceQuantity;
  readonly klass: EvidenceClass;
  /** The reference implementation's check, where there is one. */
  readonly reference: ReferenceCheck | null;
  /** The observations it is held to, where there are some. */
  readonly observed: ObservedCheck | null;
  /** Level B, where the family was put to it. */
  readonly levelB: LevelBCheck | null;
}

/**
 * The reference implementation: the Earth Impact Effects Program (Collins,
 * Melosh & Marcus 2005) as its authors run it, on the grid of
 * `scripts/eiep-reference.py` — `eiepReference.ts`, compared by
 * `eiepComparison.ts` in every run of the test suite.
 */
export const EVIDENCE_REFERENCE_PROGRAM = 'Earth Impact Effects Program';

/**
 * The table. `reference` figures are those of level A (`runLevelA`) on both
 * reference grids — the 83 impacts of `eiepReference.ts` and the 1 782 of
 * `eiepGrid.json` — and the observed entry those of the validation report's
 * fireball reading; the test beside this file recomputes both.
 */
export const EVIDENCE: Readonly<Record<EvidenceQuantity, EvidenceRecord>> = {
  energy: {
    quantity: 'energy',
    klass: 'A',
    reference: { impacts: 1794, readings: 1794, excellentPercent: 81.2, pastTen: 0 },
    observed: null,
    levelB: null,
  },
  entry: {
    quantity: 'entry',
    klass: 'A',
    // Breakup and burst altitudes, and the speed at the ground.
    reference: { impacts: 1794, readings: 3588, excellentPercent: 93.6, pastTen: 38 },
    observed: {
      id: 'bolides',
      events: 357,
      medianError: 5.3,
      unit: 'km',
      bar: 5,
      meetsBar: false,
    },
    levelB: { outcome: 'not earned', events: ['2023 CX1', '2024 BX1'], consistent: [] },
  },
  crater: {
    quantity: 'crater',
    klass: 'A',
    // Transient and final diameter, final depth.
    reference: { impacts: 960, readings: 2880, excellentPercent: 82.4, pastTen: 36 },
    observed: null,
    levelB: { outcome: 'not earned', events: ['Carancas'], consistent: ['Meteor Crater'] },
  },
  blast: {
    quantity: 'blast',
    klass: 'A',
    // Peak overpressure of airbursts (both ends) and ground impacts, and the
    // wind behind it.
    reference: { impacts: 1678, readings: 4076, excellentPercent: 93.4, pastTen: 76 },
    observed: null,
    levelB: null,
  },
  thermal: {
    quantity: 'thermal',
    klass: 'exploratory',
    // The fireball's radius is the program's; the rings drawn from it are not
    // checked against anything observed.
    reference: { impacts: 958, readings: 958, excellentPercent: 99.4, pastTen: 1 },
    observed: null,
    levelB: null,
  },
  ejecta: {
    quantity: 'ejecta',
    klass: 'A',
    reference: { impacts: 1103, readings: 5078, excellentPercent: 92.4, pastTen: 331 },
    observed: null,
    levelB: null,
  },
  seismic: {
    quantity: 'seismic',
    klass: 'exploratory',
    reference: null,
    observed: null,
    levelB: null,
  },
  atmosphere: {
    quantity: 'atmosphere',
    klass: 'exploratory',
    reference: null,
    observed: null,
    levelB: null,
  },
  tsunami: {
    quantity: 'tsunami',
    klass: 'exploratory',
    reference: null,
    observed: null,
    levelB: null,
  },
  casualties: {
    quantity: 'casualties',
    klass: 'exploratory',
    reference: null,
    observed: null,
    levelB: null,
  },
};

export function evidenceOf(quantity: EvidenceQuantity): EvidenceRecord {
  return EVIDENCE[quantity];
}

/** The quantities of `EiepComparison` each family rests on. */
export const EVIDENCE_REFERENCE_QUANTITIES: Readonly<
  Partial<Record<EvidenceQuantity, readonly string[]>>
> = {
  energy: ['energy'],
  entry: ['breakupAltitude', 'burstAltitude', 'groundVelocity'],
  crater: ['transientDiameter', 'finalDiameter', 'finalDepth'],
  blast: ['overpressure', 'airburstOverpressure', 'airburstOverpressureHigh', 'wind'],
  thermal: ['fireballRadius'],
  ejecta: ['ejectaEdge'],
};
