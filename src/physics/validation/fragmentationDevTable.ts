import type { TargetQuality } from './fragmentationRoundRules.js';

/**
 * Rule 980: the development table of the round on fragmentation — for each
 * case and metric, what was observed, where the repository holds it, the
 * quality of the target and whether it is counted. Written before the
 * baseline was computed on any case (rule 978), from the level B rounds'
 * targets and sources, I2's CNEOS row and the presets' own notes; no source
 * was opened for it. Fixed once for the round (rule 977); rectified once,
 * before P, by rules 982 to 986 — version 1 kept in
 * docs/FRAGMENTATION_DEV_TABLE.v1.md.
 */

export type DevCase =
  | 'Chelyabinsk'
  | 'Tunguska'
  | '2008 TC3'
  | '2018 LA'
  | '2022 EB5'
  | '2023 CX1'
  | '2024 BX1'
  | '2022 WJ1'
  | 'Carancas';

export type DevMetric = 'm1' | 'm2' | 'm3' | 'm4';

/** Rule 961: the roles the reviewer gave the cases. */
export type DevRole =
  | 'historical control'
  | 'regression'
  | 'crucial regression'
  | 'survival control';

export type DevObserved =
  | { readonly kind: 'altitude'; readonly lowM: number; readonly highM: number }
  | { readonly kind: 'outcome'; readonly reachesGround: boolean }
  | { readonly kind: 'none' };

export interface DevRow {
  readonly case: DevCase;
  readonly metric: DevMetric;
  readonly observed: DevObserved;
  /** A source id of levelBSources.ts or levelB2Sources.ts, or the file that
   *  holds the value; empty where nothing is held. */
  readonly source: string;
  readonly where: string;
  /** Rule 977; null where nothing is observed. */
  readonly quality: TargetQuality | null;
  readonly counted: boolean;
  readonly reason: string;
}

export const DEV_CASES: readonly { readonly case: DevCase; readonly role: DevRole }[] = [
  { case: 'Chelyabinsk', role: 'historical control' },
  { case: 'Tunguska', role: 'historical control' },
  { case: '2008 TC3', role: 'regression' },
  { case: '2018 LA', role: 'regression' },
  { case: '2022 EB5', role: 'regression' },
  { case: '2023 CX1', role: 'crucial regression' },
  { case: '2024 BX1', role: 'crucial regression' },
  { case: '2022 WJ1', role: 'crucial regression' },
  { case: 'Carancas', role: 'survival control' },
];

const NONE: DevObserved = { kind: 'none' };
const notHeld = (what: string): string =>
  `the repository holds no ${what} for it, and rule 963 opens no source`;
const NO_FRACTION =
  'no source in the repository gives the energy that reached the ground as a fraction with its uncertainty (rule 975)';
const noEnergy = (c: DevCase): DevRow => ({
  case: c,
  metric: 'm4',
  observed: NONE,
  source: '',
  where: '',
  quality: null,
  counted: false,
  reason: NO_FRACTION,
});

export const DEV_TABLE: readonly DevRow[] = [
  // Chelyabinsk — historical control (rule 961): never tuned point by point.
  {
    case: 'Chelyabinsk',
    metric: 'm1',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: `${notHeld('observed altitude of the first fragmentation')}; asked of the reviewer (rule 980)`,
  },
  {
    case: 'Chelyabinsk',
    metric: 'm2',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: `${notHeld('observed altitude of peak brightness')} — its CNEOS row is set aside as seen (fireballSetData.ts, rule 76); asked of the reviewer (rule 980)`,
  },
  {
    case: 'Chelyabinsk',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'simulate.ts',
    where: "the preset's note: a complete airburst, no crater (Popova et al. 2013)",
    quality: 'direct',
    counted: true,
    reason:
      'no crater: neither the body nor a swarm reached the ground; the meteorites fell in dark flight',
  },
  noEnergy('Chelyabinsk'),
  // Tunguska — historical control.
  {
    case: 'Tunguska',
    metric: 'm1',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: notHeld('observed altitude of fragmentation'),
  },
  {
    case: 'Tunguska',
    metric: 'm2',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: `${notHeld('value of the burst altitude')}; every estimate of it is model-dependent (levelBProtocolRules.ts); asked of the reviewer (rule 980)`,
  },
  {
    case: 'Tunguska',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'simulate.ts',
    where: "the preset's note: an airburst, no crater (Boslough & Crawford 2008)",
    quality: 'direct',
    counted: true,
    reason: 'no crater was found under the felled forest',
  },
  noEnergy('Tunguska'),
  // 2008 TC3 — seen (rule 867), a regression of the entry.
  {
    case: '2008 TC3',
    metric: 'm1',
    observed: { kind: 'altitude', lowM: 43_500, highM: 45_500 },
    source: 'borovicka2009',
    where:
      'Sect. 4.2 and Sect. 5: "Another flare was detected by Meteosat at 45-44 km" — the first major fragmentation (rule 866(e))',
    quality: 'direct',
    counted: false,
    reason:
      "not applicable (rule 983): its density lies below the two-stage law's range and the model produces no first stage — its one breakup is diagnostic; the observation stands, measured and unique",
  },
  {
    case: '2008 TC3',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 36_500, highM: 37_500 },
    source: 'borovicka2009',
    where: 'Sect. 5: "the main flare occurred at a height of 37 km"',
    quality: 'direct',
    counted: true,
    reason: 'the brightest flare, measured; a proxy of the release (rule 974)',
  },
  {
    case: '2008 TC3',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'borovicka2009',
    where: 'Sect. 5: "only small meteorites (≤283 g) were found"',
    quality: 'direct',
    counted: true,
    reason: 'no crater; small meteorites in dark flight',
  },
  noEnergy('2008 TC3'),
  // 2018 LA — seen (rule 867).
  {
    case: '2018 LA',
    metric: 'm1',
    observed: { kind: 'altitude', lowM: 26_900, highM: 28_700 },
    source: 'jenniskens2021',
    where: 'p. 12: the one flare, triangulated from video, "altitude = 27.8 ± 0.9 km"',
    quality: 'direct',
    counted: true,
    reason: 'the body broke up once, in this flare: measured and unique',
  },
  {
    case: '2018 LA',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 28_650, highM: 28_750 },
    source: 'jenniskens2021',
    where: 'p. 13: U.S. Government sensors, "peaking in brightness at 28.7 km altitude"',
    quality: 'direct',
    counted: true,
    reason: 'the peak of brightness, measured; a proxy of the release (rule 974)',
  },
  {
    case: '2018 LA',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'jenniskens2021',
    where: 'twenty-three meteorites recovered; no crater',
    quality: 'direct',
    counted: true,
    reason: 'no crater; meteorites in dark flight',
  },
  noEnergy('2018 LA'),
  // 2022 EB5 — seen, a row of I2.
  {
    case: '2022 EB5',
    metric: 'm1',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: 'its CNEOS row gives only the peak of brightness',
  },
  {
    case: '2022 EB5',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 33_250, highM: 33_350 },
    source: 'fireballSetData.ts',
    where:
      'the CNEOS row 2022-03-11T21:22:45Z, altitude of peak brightness 33.3 km, no uncertainty given: the half-unit (rule 866(b))',
    quality: 'direct',
    counted: true,
    reason:
      'the peak of brightness, from the U.S. Government sensors; a proxy of the release (rule 974)',
  },
  {
    case: '2022 EB5',
    metric: 'm3',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: 'it fell over the Norwegian Sea: nothing was observed at the surface',
  },
  noEnergy('2022 EB5'),
  // 2023 CX1 — a crucial regression.
  {
    case: '2023 CX1',
    metric: 'm1',
    observed: { kind: 'altitude', lowM: 29_350, highM: 29_450 },
    source: 'egal2025',
    where: 'p. 9: "the first fragmentation event at 29.4 km altitude"',
    quality: 'direct',
    counted: true,
    reason: 'measured and unique',
  },
  {
    case: '2023 CX1',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 27_050, highM: 28_150 },
    source: 'egal2025',
    where:
      'p. 8: the second event at 27.1 km; p. 9: "the second, more prominent fragmentation phase around 28.1 km" (rule 866(e))',
    quality: 'direct',
    counted: true,
    reason: 'the most prominent phase, measured; a proxy of the release (rule 974)',
  },
  {
    case: '2023 CX1',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'egal2025',
    where: 'Saint-Pierre-le-Viger meteorites recovered; no crater',
    quality: 'direct',
    counted: true,
    reason: 'no crater; meteorites in dark flight',
  },
  noEnergy('2023 CX1'),
  // 2024 BX1 — a crucial regression.
  {
    case: '2024 BX1',
    metric: 'm1',
    observed: { kind: 'altitude', lowM: 54_500, highM: 55_500 },
    source: 'spurny2024',
    where: 'p. 4: "fragmentation started at a height of 55 km" (half-unit, rule 866(b))',
    quality: 'direct',
    counted: true,
    reason: 'measured and unique',
  },
  {
    case: '2024 BX1',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 33_850, highM: 35_250 },
    source: 'spurny2024',
    where: 'p. 4: "two almost equally bright flares at heights of 35.2 and 33.9 km" (rule 866(e))',
    quality: 'direct',
    counted: true,
    reason: 'the brightest flares, measured; a proxy of the release (rule 974)',
  },
  {
    case: '2024 BX1',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'spurny2024',
    where: 'meteorites recovered in the predicted strewn field; no crater',
    quality: 'direct',
    counted: true,
    reason: 'no crater; meteorites in dark flight',
  },
  noEnergy('2024 BX1'),
  // 2022 WJ1 — a crucial regression, the counted body of level B's second round.
  {
    case: '2022 WJ1',
    metric: 'm1',
    observed: NONE,
    source: 'kareta2024',
    where:
      'Sect. 2.5, p. 17: "WJ1 did not show any evidence for early, first stage fragmentation at low dynamic pressures ≤ 0.1 MPa"',
    quality: null,
    counted: false,
    reason: 'an absence determines no unique observed altitude (rule 928)',
  },
  {
    case: '2022 WJ1',
    metric: 'm2',
    observed: { kind: 'altitude', lowM: 33_995, highM: 38_655 },
    source: 'kareta2024',
    where:
      'Table 7, p. 19: the two brightest flares of the Caistor light curve, 38.65 and 34.00 km (rule 866(e))',
    quality: 'direct',
    counted: true,
    reason: 'the brightest flares, measured; a proxy of the release (rule 974)',
  },
  {
    case: '2022 WJ1',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: false },
    source: 'kareta2024',
    where:
      'Sect. 2.6, pp. 18–20: fragments into Lake Ontario and a main mass of about 8 to 20 kg to the ground; no crater',
    quality: 'reconstructed',
    counted: true,
    reason:
      'the body broke in flares and what reached the ground was meteorites in dark flight; the masses are reconstructed from radar and the light curve',
  },
  {
    case: '2022 WJ1',
    metric: 'm4',
    observed: NONE,
    source: 'kareta2024',
    where: 'Sect. 2.6: a main mass of about 8 to 20 kg',
    quality: null,
    counted: false,
    reason:
      'a mass, not an energy: turning it into a fraction needs its speed and the initial mass, an indirect estimate (rule 975)',
  },
  // Carancas — control of survival (rule 961): its mass is never calibrated.
  {
    case: 'Carancas',
    metric: 'm1',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: notHeld('observed altitude of fragmentation'),
  },
  {
    case: 'Carancas',
    metric: 'm2',
    observed: NONE,
    source: '',
    where: '',
    quality: null,
    counted: false,
    reason: notHeld('observed altitude of a flare'),
  },
  {
    case: 'Carancas',
    metric: 'm3',
    observed: { kind: 'outcome', reachesGround: true },
    source: 'kenkmann2009',
    where: 'Abstract, p. 985: an H4–5 chondrite struck the ground and formed a crater',
    quality: 'direct',
    counted: false,
    reason:
      'diagnostic (rule 986): a crater, the body reached the ground — but the entry is computed down to sea level where the site lies at about 3 800 m, until that is mended apart',
  },
  {
    case: 'Carancas',
    metric: 'm4',
    observed: NONE,
    source: 'brown2008',
    where: "Sect. 6: the body's energy estimated with the crater's diameter as a constraint",
    quality: 'modelDependent',
    counted: false,
    reason: "circular: every estimate of its energy uses the crater's diameter (rule 860(c))",
  },
];
