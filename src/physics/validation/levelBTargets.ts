/**
 * Level B, step 4: the observed values, entered after the predictions were
 * committed (ad08138), each read where levelBSources.ts pinned it and turned
 * into an interval as rule 866 says. Nothing here was chosen after the
 * predictions were seen: the places, the conversions and the bars were all
 * fixed before (rules 855 to 874).
 */

export type LevelBObserved =
  | {
      readonly kind: 'interval';
      readonly low: number;
      readonly high: number;
      readonly unit: 'm' | 'ratio';
    }
  | { readonly kind: 'outcome'; readonly origin: 'none' | 'impact' }
  | { readonly kind: 'morphology'; readonly value: 'simple' };

export interface LevelBObservation {
  readonly event: string;
  readonly target: 'E1' | 'E2' | 'E3' | 'K1' | 'K2' | 'K3' | 'K4' | 'D1' | 'D2' | 'D3';
  readonly observed: LevelBObserved;
  /** The words of the source, as read. */
  readonly read: string;
}

export const LEVEL_B_OBSERVED: readonly LevelBObservation[] = [
  // 2024 BX1 — Spurný et al. 2024.
  {
    event: '2024 BX1',
    target: 'E1',
    observed: { kind: 'outcome', origin: 'none' },
    read: 'meteorites recovered in the predicted strewn field; no crater',
  },
  {
    event: '2024 BX1',
    target: 'E2',
    observed: { kind: 'interval', low: 54_500, high: 55_500, unit: 'm' },
    read: 'p. 4: "fragmentation started at a height of 55 km" (half-unit, rule 866(b))',
  },
  {
    event: '2024 BX1',
    target: 'E3',
    observed: { kind: 'interval', low: 33_850, high: 35_250, unit: 'm' },
    read: 'p. 4: "two almost equally bright flares at heights of 35.2 and 33.9 km" (rule 866(e))',
  },
  // 2023 CX1 — Egal et al. 2025.
  {
    event: '2023 CX1',
    target: 'E1',
    observed: { kind: 'outcome', origin: 'none' },
    read: 'Saint-Pierre-le-Viger meteorites recovered; no crater',
  },
  {
    event: '2023 CX1',
    target: 'E2',
    observed: { kind: 'interval', low: 29_350, high: 29_450, unit: 'm' },
    read: 'p. 8: "two major fragmentation events at altitudes of 29.4 and 27.1 km" — the first; p. 9: "the first fragmentation event at 29.4 km altitude"',
  },
  {
    event: '2023 CX1',
    target: 'E3',
    observed: { kind: 'interval', low: 27_050, high: 28_150, unit: 'm' },
    read: 'p. 8: the second event at 27.1 km; p. 9: "the second, more prominent fragmentation phase around 28.1 km" (rule 866(e))',
  },
  // 2008 TC3 and 2018 LA — seen (rule 867): reported, never counted.
  {
    event: '2008 TC3',
    target: 'E1',
    observed: { kind: 'outcome', origin: 'none' },
    read: 'Sect. 5: "only small meteorites (≤283 g) were found"',
  },
  {
    event: '2008 TC3',
    target: 'E2',
    observed: { kind: 'interval', low: 43_500, high: 45_500, unit: 'm' },
    read: 'Sect. 5: "Another flare was detected by Meteosat at 45-44 km" (rule 866(e))',
  },
  {
    event: '2008 TC3',
    target: 'E3',
    observed: { kind: 'interval', low: 36_500, high: 37_500, unit: 'm' },
    read: 'Sect. 5: "the main flare occurred at a height of 37 km"',
  },
  {
    event: '2018 LA',
    target: 'E1',
    observed: { kind: 'outcome', origin: 'none' },
    read: 'twenty-three meteorites recovered; no crater',
  },
  {
    event: '2018 LA',
    target: 'E2',
    observed: { kind: 'interval', low: 26_900, high: 28_700, unit: 'm' },
    read: 'p. 12: "altitude = 27.8 ± 0.9 km"',
  },
  {
    event: '2018 LA',
    target: 'E3',
    observed: { kind: 'interval', low: 28_650, high: 28_750, unit: 'm' },
    read: 'p. 13: "peaking in brightness at 28.7 km altitude"',
  },
  // Carancas — Kenkmann et al. 2009.
  {
    event: 'Carancas',
    target: 'K1',
    observed: { kind: 'outcome', origin: 'impact' },
    read: 'p. 985: an H4–5 chondrite struck the ground and formed a crater',
  },
  {
    event: 'Carancas',
    target: 'K2',
    observed: { kind: 'interval', low: 13.3, high: 14.43, unit: 'm' },
    read: 'p. 989: "14.2 ± 0.23 m" 3.5 months after, and "13.3–13.8 m" shortly after — reported, circular (rule 860(c))',
  },
  {
    event: 'Carancas',
    target: 'K3',
    observed: { kind: 'interval', low: 0.18, high: 0.2, unit: 'ratio' },
    read: 'p. 989: "Depth/diameter ratios obtained from measured profiles … are 0.18–0.2"',
  },
  {
    event: 'Carancas',
    target: 'K4',
    observed: { kind: 'morphology', value: 'simple' },
    read: 'pp. 989–990 and Fig. 2: a simple, cone- to bowl-shaped crater',
  },
  // Meteor Crater — Kring 2017, class D.
  {
    event: 'Meteor Crater',
    target: 'D1',
    observed: { kind: 'interval', low: 1_150, high: 1_250, unit: 'm' },
    read: 'p. 35: "has a diameter of ~1.2 km" (half-unit, rule 866(b))',
  },
  {
    event: 'Meteor Crater',
    target: 'D2',
    observed: { kind: 'interval', low: 175, high: 185, unit: 'm' },
    read: 'p. 35: "a bowl-shaped depression that is ~180 m deep" (half-unit, rule 866(b))',
  },
  {
    event: 'Meteor Crater',
    target: 'D3',
    observed: { kind: 'morphology', value: 'simple' },
    read: 'p. 35: "The crater has a simple bowl-shaped morphology"',
  },
];
