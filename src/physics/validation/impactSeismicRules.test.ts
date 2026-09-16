import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_BURST_SPEED } from '../effects/atmosphericEntry.js';
import {
  DEFAULT_IMPACT_SEISMIC_SOURCE,
  PROGRAM_FAR_EDGE_KM,
  PROGRAM_NEAR_EDGE_KM,
  PROGRAM_SHAKING_LEVELS,
  programSeismicAttenuation,
  programShakingRadiusKm,
} from '../events/impact/seismic.js';
import type { BurstSpeed } from '../effects/atmosphericEntry.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import {
  candidateSeismicMagnitude,
  EIEP_MAP_RADIUS_M,
  IMPACT_SEISMIC_BODIES,
  impactSeismicVerdict,
  seismicBodyAgreements,
  seismicLevelAgreement,
} from './impactSeismicRules.js';

interface RingRow {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  error: string | null;
  seismicRadiiM?: readonly (readonly [number, number])[] | null;
}

const LOOKED_AT = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL(
        '../../../benchmark/results/impact-seismic-looked-at-2026-09-16.json',
        import.meta.url
      )
    ),
    'utf8'
  )
) as { rows: RingRow[] };

/** Every body once, with its worst difference in magnitude against the law. */
function read(rows: readonly RingRow[], burstSpeed: BurstSpeed) {
  const seen = new Set<string>();
  let bodies = 0;
  let airbursts = 0;
  let rings = 0;
  let apart = 0;
  let worst = 0;
  for (const row of rows) {
    if (row.error !== null || !row.seismicRadiiM) continue;
    const key = `${row.diameterM.toString()}|${row.densityKgM3.toString()}|${row.velocityKmS.toString()}|${row.angleDeg.toString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bodies++;
    const { magnitude, airburst } = candidateSeismicMagnitude(row, burstSpeed);
    if (airburst) airbursts++;
    const agreements = seismicBodyAgreements(
      magnitude,
      row.seismicRadiiM.map(([, r]) => r)
    );
    row.seismicRadiiM.forEach(([, r], i) => {
      const level = PROGRAM_SHAKING_LEVELS[i]?.magnitude ?? 0;
      if (agreements[i] === 'apart') {
        apart++;
        return;
      }
      if (r === 0) return;
      rings++;
      const km = (r / EIEP_MAP_RADIUS_M) * 6_371;
      worst = Math.max(worst, Math.abs(level + programSeismicAttenuation(km) - magnitude));
    });
  }
  return { bodies, airbursts, rings, apart, worst };
}

describe('rule 154: the law read off the program', () => {
  it('passes from one equation to the next where they cross', () => {
    expect(PROGRAM_NEAR_EDGE_KM).toBeCloseTo(61.2783, 4);
    expect(PROGRAM_FAR_EDGE_KM).toBeCloseTo(772.3928, 4);
    for (const edge of [PROGRAM_NEAR_EDGE_KM, PROGRAM_FAR_EDGE_KM]) {
      expect(programSeismicAttenuation(edge * (1 - 1e-12))).toBeCloseTo(
        programSeismicAttenuation(edge * (1 + 1e-12)),
        9
      );
    }
    for (const km of [3, 61, 62, 400, 772, 773, 5_000]) {
      expect(programShakingRadiusKm(7 + programSeismicAttenuation(km), 7)).toBeCloseTo(km, 9);
    }
    expect(programShakingRadiusKm(3, 4)).toBe(0);
  });

  it("puts the grid's 214 rings on 70 bodies within 1.1e-5 in magnitude", () => {
    const got = read(EIEP_REFERENCE, 'program');
    expect(got).toMatchObject({ bodies: 70, airbursts: 24, rings: 214, apart: 6 });
    expect(got.worst).toBeLessThan(1.1e-5);
  });

  it('puts the 96 rings of the 24 bodies asked before the rules within 1e-9', () => {
    const got = read(LOOKED_AT.rows, 'program');
    expect(got).toMatchObject({ bodies: 24, rings: 96, apart: 0 });
    expect(got.worst).toBeLessThan(1e-9);
  });

  it("parts from the airbursts by up to 0.0053 on Eq. 19's burst speed", () => {
    const worst = read(EIEP_REFERENCE, 'paper').worst;
    expect(worst).toBeGreaterThan(0.005);
    expect(worst).toBeLessThan(0.0053);
  });

  it('is the default since rule 157', () => {
    expect(DEFAULT_IMPACT_SEISMIC_SOURCE).toBe('program');
    expect(DEFAULT_BURST_SPEED).toBe('program');
  });
});

describe('rules 156 and 157', () => {
  it('draws eight airbursts and eight that reach the ground, each of magnitude 3.2 or more', () => {
    expect(IMPACT_SEISMIC_BODIES).toHaveLength(16);
    IMPACT_SEISMIC_BODIES.forEach((body, i) => {
      const { magnitude, airburst } = candidateSeismicMagnitude(body);
      expect(airburst).toBe(i < 8);
      expect(magnitude).toBeGreaterThanOrEqual(3.2);
    });
  });

  it('reads a level back to a magnitude, and counts a ring past a quarter of the Earth apart', () => {
    const ringAt = (km: number): number => (km / 6_371) * EIEP_MAP_RADIUS_M;
    expect(seismicLevelAgreement(6, 3, ringAt(programShakingRadiusKm(6.009, 3)))).toBe('agrees');
    expect(seismicLevelAgreement(6, 3, ringAt(programShakingRadiusKm(6.011, 3)))).toBe('departs');
    expect(seismicLevelAgreement(3.5, 4, 0)).toBe('neither');
    expect(seismicLevelAgreement(4.005, 4, 0)).toBe('agrees');
    expect(seismicLevelAgreement(4.02, 4, 0)).toBe('departs');
    expect(seismicLevelAgreement(10, 3, ringAt(50))).toBe('apart');
  });

  it('adopts only on enough bodies and rings with none departing', () => {
    const body = ['agrees', 'agrees', 'agrees', 'neither', 'neither'] as const;
    expect(impactSeismicVerdict(Array.from({ length: 12 }, () => [...body]))).toEqual({
      bodies: 12,
      rings: 36,
      departs: 0,
      heldOutPasses: true,
    });
    expect(impactSeismicVerdict(Array.from({ length: 11 }, () => [...body])).heldOutPasses).toBe(
      false
    );
    expect(
      impactSeismicVerdict([
        ['departs', 'agrees', 'agrees', 'neither', 'neither'],
        ...Array.from({ length: 12 }, () => [...body]),
      ]).heldOutPasses
    ).toBe(false);
  });
});
