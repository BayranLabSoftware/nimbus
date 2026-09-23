import type { LevelBObservation } from './levelBTargets.js';

/**
 * Level B's second round, step 4: the observed values, entered after the
 * predictions were committed (aaec9bf), each read where levelB2Sources.ts
 * pinned it and turned into an interval as rule 866 says. Nothing here was
 * chosen after the predictions were seen: the places, the conversions and the
 * bars were all fixed before (rules 875 to 880, 903, 904, 919 to 932).
 */

export const LEVEL_B2_OBSERVED: readonly LevelBObservation[] = [
  // 2022 WJ1 — Kareta et al. 2024, the counted body.
  {
    event: '2022 WJ1',
    target: 'E1',
    observed: { kind: 'outcome', origin: 'none' },
    read: 'abstract, p. 1: "no meteorites have been found as of yet"; Sect. 2.6, pp. 18–20: fragments into Lake Ontario and a main mass of about 8 to 20 kg to the ground; no crater',
  },
  {
    event: '2022 WJ1',
    target: 'E3',
    observed: { kind: 'interval', low: 33_995, high: 38_655, unit: 'm' },
    read: 'Table 7, p. 19: flares at heights of 38.65 and 34.00 km, the two brightest of the Caistor light curve (Fig. 11, p. 16); the interval between them, each end widened by its half-unit (rule 866(e))',
  },
];

/** Rule 928: the check reported in the reviewer's words, never scored. */
export const LEVEL_B2_QUALITATIVE = {
  event: '2022 WJ1',
  read: 'Sect. 2.5, p. 17: "WJ1 did not show any evidence for early, first stage fragmentation at low dynamic pressures ≤ 0.1 MPa"',
  statement:
    'No identifiable initial fragmentation was observed at dynamic pressures up to 0.1 MPa; the comparison is not assessed quantitatively, because an absence does not determine a unique observed altitude.',
} as const;

/** Rule 922: Sterlitamak's crater, diagnostic, never scored. */
export const LEVEL_B2_DIAGNOSTIC_OBSERVED: readonly LevelBObservation[] = [
  {
    event: 'Sterlitamak',
    target: 'K1',
    observed: { kind: 'outcome', origin: 'impact' },
    read: 'ivanov1992, p. 573: a crater, the projectile recovered from it',
  },
  {
    event: 'Sterlitamak',
    target: 'K3',
    observed: { kind: 'interval', low: 3 / 9.4, high: 0.5, unit: 'ratio' },
    read: 'ivanov1992, p. 573: "the mean R is about 4.7 m, h = 3 m" a week after the fall (3 / 9.4); ovcharenko2021, p. 1: "a 10 m diameter and a 5 m depth" (0.5); the interval between them (rule 866(a))',
  },
  {
    event: 'Sterlitamak',
    target: 'K4',
    observed: { kind: 'morphology', value: 'simple' },
    read: 'ovcharenko2021, p. 1: a bowl 10 m across with sheer walls and a conical talus',
  },
];
