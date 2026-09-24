/**
 * Rule 1168 (e): round 3's targets, extracted by rule 1174 (b)'s procedure
 * after the predictions were pushed (361dfa4), each with its kind (rule 1164),
 * quality (rules 1165 (a), 1177 (c)) and place in its source.
 */

export interface Round3Target {
  readonly event: string;
  readonly kind: 'primary' | 'proxy' | 'diagnostic';
  readonly quality: 'A' | 'B' | 'C' | null;
  /** The judged altitude and its uncertainty (km), for a primary or a proxy. */
  readonly altitudeKm: number | null;
  readonly sigmaKm: number | null;
  readonly where: string;
  /** Diagnostic heights, reported and never judged (km). */
  readonly diagnostics?: Readonly<Record<string, number>>;
  readonly note?: string;
}

export const FCM_ROUND3_TARGETS: readonly Round3Target[] = [
  {
    event: 'Aguas Zarcas',
    kind: 'proxy',
    quality: 'A',
    altitudeKm: 25.1,
    sigmaKm: 1.0,
    where:
      'Table 2 (p. 43), «Altitude Flare (km) 25.1 ± 1.0», and p. 11: «the altitude of this flare measured by all stations is 25.1 ± 1.0 km (standard error)»; the source calls it «the main flare» (p. 9), its peak Mv −13.82 ± 0.04 (p. 13) — the brightest by the source’s word',
  },
  // Rule 1177 (d): Jenniskens (2026) names no brightest flare, and its light
  // curves are figures the pasted text lacks — the kind falls to diagnostic.
  // Its Table 2 heights are reported (Hf, the onset of fragmentation; Hd, the
  // end flare), never judged.
  {
    event: 'Grimsby',
    kind: 'diagnostic',
    quality: null,
    altitudeKm: null,
    sigmaKm: null,
    where: 'Jenniskens (2026), Table 2, row #17 (σH 0.1 km)',
    diagnostics: { HfKm: 37.9, HdKm: 29.0 },
  },
  {
    event: 'Bunburra Rockhole',
    kind: 'diagnostic',
    quality: null,
    altitudeKm: null,
    sigmaKm: null,
    where: 'Jenniskens (2026), Table 2, row #12 (σH 0.1 km)',
    diagnostics: { HfKm: 36.0, HdKm: 33.9 },
  },
  {
    event: 'Mason Gully',
    kind: 'diagnostic',
    quality: null,
    altitudeKm: null,
    sigmaKm: null,
    where: 'Jenniskens (2026), Table 2, row #19 (σH 0.1 km)',
    diagnostics: { HfKm: 34.4, HdKm: 28.1 },
  },
  {
    event: 'Neuschwanstein',
    kind: 'diagnostic',
    quality: null,
    altitudeKm: null,
    sigmaKm: null,
    where: 'Jenniskens (2026), Table 2, row #9 (σH 0.1 km; no Hf printed)',
    diagnostics: { HdKm: 22.2 },
  },
  {
    event: 'Benenitra',
    kind: 'diagnostic',
    quality: null,
    altitudeKm: null,
    sigmaKm: null,
    where: 'rule 1176 (c): no measured trajectory, no deposition from a light curve',
  },
];
