import { describe, expect, it } from 'vitest';

import { DEFAULT_CHEMICAL_BLAST_SOURCE } from '../events/explosion/overpressure.js';
import {
  CHEMICAL_CANDIDATE,
  CHEMICAL_IN_PLACE,
  CHEMICAL_LOOKED_AT_RATIO,
  CHEMICAL_RATIO_TOLERANCE,
  chooseChemicalBlastSource,
  type ChemicalGuard,
} from './chemicalBlastRules.js';

const PASSING: ChemicalGuard = {
  transcriptionChecksPass: true,
  releaseGatePasses: true,
  sweepInPlace: 2,
  sweepCandidate: 2,
  applicationDepartures: 0,
  worstRingDeparture: 0.001,
  otherRowsMoved: 0,
};

describe('rules 177 to 181: a chemical charge drawn by Kingery–Bulmash', () => {
  it('has not been adopted yet, so a scenario that names no source keeps the law in place', () => {
    expect(DEFAULT_CHEMICAL_BLAST_SOURCE).toBe(CHEMICAL_IN_PLACE);
  });

  it('adopts the candidate when every guard of rule 180 holds', () => {
    expect(chooseChemicalBlastSource(PASSING)).toBe(CHEMICAL_CANDIDATE);
  });

  it('refuses it on any one guard', () => {
    const failures: Partial<ChemicalGuard>[] = [
      { transcriptionChecksPass: false },
      { releaseGatePasses: false },
      { sweepCandidate: 3 },
      { sweepCandidate: Number.NaN },
      { applicationDepartures: 1 },
      { otherRowsMoved: 1 },
      { worstRingDeparture: CHEMICAL_RATIO_TOLERANCE * 2 },
      { worstRingDeparture: Number.NaN },
    ];
    for (const failure of failures) {
      expect(chooseChemicalBlastSource({ ...PASSING, ...failure })).toBe(CHEMICAL_IN_PLACE);
    }
  });

  it('keeps what rule 177 looked at, so the run can be held to it', () => {
    expect(Object.keys(CHEMICAL_LOOKED_AT_RATIO)).toEqual(['5 psi', '1 psi', '0.5 psi']);
    for (const ratio of Object.values(CHEMICAL_LOOKED_AT_RATIO)) {
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    }
  });
});
