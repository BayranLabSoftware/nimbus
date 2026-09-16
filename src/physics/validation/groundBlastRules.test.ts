import { describe, expect, it } from 'vitest';
import {
  GROUND_BLAST_BODIES,
  GROUND_BLAST_MIN_BODIES,
  GROUND_BLAST_MIN_POINTS,
  groundBlastAgrees,
  groundBlastVerdict,
  type GroundBlastPoint,
} from './groundBlastRules.js';

describe('rule 139: the held-out check', () => {
  it('draws twelve bodies with five ranges each, inside the drawn bounds', () => {
    expect(GROUND_BLAST_BODIES).toHaveLength(12);
    for (const b of GROUND_BLAST_BODIES) {
      expect(b.rangesKm).toHaveLength(5);
      for (const r of b.rangesKm) {
        expect(r).toBeGreaterThanOrEqual(0.5);
        expect(r).toBeLessThanOrEqual(500);
      }
      expect(b.diameterM).toBeGreaterThanOrEqual(5);
      expect(b.diameterM).toBeLessThanOrEqual(5_000);
    }
  });

  it('agrees within 1 % plus half the last printed digit', () => {
    expect(groundBlastAgrees(240.354, 240.354 * 1.0099)).toBe(true);
    expect(groundBlastAgrees(240.354, 240.354 * 1.0101)).toBe(false);
  });
});

describe('rule 140: what decides', () => {
  const point = (body: number, over: Partial<GroundBlastPoint> = {}): GroundBlastPoint => ({
    body,
    rangeKm: 10,
    programPa: 1_000,
    programLawPa: 1_002,
    inPlacePa: 4_000,
    ...over,
  });
  const full = Array.from({ length: GROUND_BLAST_MIN_POINTS }, (_, i) =>
    point(i % GROUND_BLAST_MIN_BODIES)
  );

  it('adopts when enough is compared and every point agrees', () => {
    const v = groundBlastVerdict(full);
    expect(v.adopted).toBe(true);
    expect(v.inPlaceAgrees).toBe(0);
  });

  it('refuses on one point outside, or on too little compared', () => {
    expect(groundBlastVerdict([...full, point(1, { programLawPa: 1_020 })]).adopted).toBe(false);
    expect(groundBlastVerdict(full.slice(1)).adopted).toBe(false);
    expect(groundBlastVerdict([...full.slice(1), point(2, { programPa: null })]).adopted).toBe(
      false
    );
  });
});
