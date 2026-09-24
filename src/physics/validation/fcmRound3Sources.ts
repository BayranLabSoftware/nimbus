/**
 * Rule 1168 (c): round 3's sources pinned — DOI, the URL of the open copy, the
 * file's size and SHA-256 — and the inputs extracted by rule 1174 (a)'s
 * procedure, each with the place it was read. Downloaded with Andrea's leave
 * on 24 September 2026, evening; the files stay outside the repository (their
 * licences), their hashes here. No target is recorded in this file: targets
 * are extracted only after the predictions are pushed (rule 1168 (e)).
 */

export interface PinnedSource {
  readonly event: string;
  readonly doi: string;
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
}

export const FCM_ROUND3_PINNED: readonly PinnedSource[] = [
  {
    event: 'Benenitra',
    doi: '10.17159/sajs.2021/8200',
    url: 'https://sajs.co.za/article/download/8200/15882',
    bytes: 1_270_424,
    sha256: '4a6ec10ad7185996f32625558d55558cc73b8fdaea92a690a370b3c51494b83c',
  },
  {
    event: 'Aguas Zarcas',
    doi: '10.1111/maps.14337',
    url: 'https://arxiv.org/pdf/2504.00183',
    bytes: 19_410_913,
    sha256: 'e1b1eb8a84f99784cc6b808590dfffd7683689500ed42a2d9da28f2b39135b9e',
  },
];

/** One input as the source gives it: value, uncertainty (1σ unless said),
 *  and where it stands. */
export interface ExtractedInput {
  readonly value: number;
  readonly sigma: number | null;
  readonly where: string;
}

export interface EventInputs {
  readonly event: string;
  readonly speedKmS: ExtractedInput;
  readonly angleDeg: ExtractedInput;
  /** The preferred initial mass; without a range, rule 1176 (a). */
  readonly massKg: ExtractedInput & { readonly range: readonly [number, number] | null };
  readonly densityKgM3: ExtractedInput & { readonly range: readonly [number, number] | null };
  readonly kind: 'primary' | 'proxy' | 'diagnostic';
  readonly note?: string;
}

/** Rule 1174 (a): the inputs, read through lines with altitudes masked. */
export const FCM_ROUND3_INPUTS: readonly EventInputs[] = [
  {
    event: 'Aguas Zarcas',
    speedKmS: {
      value: 14.6,
      sigma: 0.6,
      where: 'p. 12 and Table 2 (p. 43): «apparent entry speed of 14.6 ± 0.6 km/s»',
    },
    angleDeg: {
      value: 81.2,
      sigma: 1.6,
      where: 'p. 11: «a steep elevation angle of 81.2 ± 1.6°»',
    },
    massKg: {
      value: 250,
      sigma: null,
      range: null,
      where:
        'pp. 22 and 26: «The initial mass was about 250 kg» (the light curve gives ~280 kg, p. 14; the infrasound 8–236 kg, p. 15); no uncertainty stated: rule 1176 (a)',
    },
    densityKgM3: {
      value: 2_200,
      sigma: null,
      range: null,
      where: 'p. 14: «a typical 2.2 g/cm3 bulk density»',
    },
    kind: 'proxy',
  },
];

/** Rule 1176 (c): events whose kind fell at extraction, and why. */
export const FCM_ROUND3_FALLEN: Readonly<Record<string, string>> = {
  Benenitra:
    'an infrasound and seismic investigation: no measured trajectory, no deposition from a calibrated light curve, speed and angle assumed — diagnostic, not assessable',
};
