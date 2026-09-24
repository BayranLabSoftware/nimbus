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
  {
    event: 'density ranges (rule 1174 (a)), not needed: every source gives a density',
    doi: '10.1016/j.chemer.2017.04.002',
    url: 'ScienceDirect, open access, downloaded by Andrea in a browser',
    bytes: 4_419_106,
    sha256: 'e2accfce06e8ff9c2ae71afa72ac4eec0f824d8dc0dc0bdeb3808725978919fa',
  },
];

/**
 * Rule 1177: Jenniskens (2026), the source of Grimsby, Bunburra Rockhole, Mason
 * Gully and Neuschwanstein (rule 1175 (b)). The publisher's site refused the
 * file to a script; its text, as the publisher's page shows it, was pasted by
 * Andrea into the conversation — no file, and so no hash: pinned by its DOI and
 * its version of record. Its whole Table 2 was read with it (rule 1177 (a)).
 */
export const FCM_ROUND3_COMPILATION = {
  doi: '10.1111/maps.70203',
  title: 'Bolide light curve systematics from 75 recovered meteorites',
  journal: 'Meteoritics & Planetary Science',
  obtained: 'the text of the publisher’s page, pasted by Andrea on 24 September 2026',
} as const;

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
  {
    event: 'Grimsby',
    speedKmS: {
      value: 20.9,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #17: V∞, printed without uncertainty (rule 1177 (b))',
    },
    angleDeg: {
      value: 55.2,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #17: h, printed without uncertainty (rule 1177 (b))',
    },
    massKg: {
      value: 30,
      sigma: null,
      range: null,
      where:
        'Jenniskens (2026), Table 2, row #17: the initial mass, from the literature; rule 1176 (a)',
    },
    densityKgM3: {
      value: 3370,
      sigma: null,
      range: null,
      where: 'Jenniskens (2026), Table 2, row #17: 3.37 g/cm³, measured (H)',
    },
    kind: 'proxy',
    note: 'its kind falls to diagnostic unless the brightest flare can be read from the compilation’s figures (rule 1177 (d))',
  },
  {
    event: 'Bunburra Rockhole',
    speedKmS: {
      value: 13.3,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #12: V∞, printed without uncertainty (rule 1177 (b))',
    },
    angleDeg: {
      value: 31.2,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #12: h, printed without uncertainty (rule 1177 (b))',
    },
    massKg: {
      value: 22,
      sigma: null,
      range: null,
      where:
        'Jenniskens (2026), Table 2, row #12: the initial mass, from the literature; rule 1176 (a)',
    },
    densityKgM3: {
      value: 2700,
      sigma: null,
      range: null,
      where: 'Jenniskens (2026), Table 2, row #12: 2.70 g/cm³, measured (HED)',
    },
    kind: 'proxy',
    note: 'its kind falls to diagnostic unless the brightest flare can be read from the compilation’s figures (rule 1177 (d))',
  },
  {
    event: 'Mason Gully',
    speedKmS: {
      value: 14.5,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #19: V∞, printed without uncertainty (rule 1177 (b))',
    },
    angleDeg: {
      value: 53.9,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #19: h, printed without uncertainty (rule 1177 (b))',
    },
    massKg: {
      value: 40,
      sigma: null,
      range: null,
      where:
        'Jenniskens (2026), Table 2, row #19: the initial mass, from the literature; rule 1176 (a)',
    },
    densityKgM3: {
      value: 3320,
      sigma: null,
      range: null,
      where: 'Jenniskens (2026), Table 2, row #19: 3.32 g/cm³, measured (H)',
    },
    kind: 'proxy',
    note: 'its kind falls to diagnostic unless the brightest flare can be read from the compilation’s figures (rule 1177 (d))',
  },
  {
    event: 'Neuschwanstein',
    speedKmS: {
      value: 21.0,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #9: V∞, printed without uncertainty (rule 1177 (b))',
    },
    angleDeg: {
      value: 49.7,
      sigma: null,
      where: 'Jenniskens (2026), Table 2, row #9: h, printed without uncertainty (rule 1177 (b))',
    },
    massKg: {
      value: 300,
      sigma: null,
      range: null,
      where:
        'Jenniskens (2026), Table 2, row #9: the initial mass, from the literature; rule 1176 (a)',
    },
    densityKgM3: {
      value: 3490,
      sigma: null,
      range: null,
      where: 'Jenniskens (2026), Table 2, row #9: 3.49 g/cm³, measured (EL)',
    },
    kind: 'proxy',
    note: 'its kind falls to diagnostic unless the brightest flare can be read from the compilation’s figures (rule 1177 (d))',
  },
];

/** Rule 1176 (c): events whose kind fell at extraction, and why. */
export const FCM_ROUND3_FALLEN: Readonly<Record<string, string>> = {
  Benenitra:
    'an infrasound and seismic investigation: no measured trajectory, no deposition from a calibrated light curve, speed and angle assumed — diagnostic, not assessable',
};
