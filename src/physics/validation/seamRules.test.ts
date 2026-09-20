import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { SEAM_AREAS_KM2 } from './seamRules.js';

/**
 * B-083, pinned as it is — not as it should be.
 *
 * This is a characterisation test. It records the defect so that the day
 * somebody repairs the seam these numbers go red and they have to say so
 * deliberately, rather than the tenfold jump quietly becoming something
 * else.
 */
/** The geometry that shipped until B-083 was closed: the down-dip width
 *  and no point-source correction. Named explicitly, because it is no
 *  longer what a bare `simulateEarthquake` gives. */
const BEFORE = { stadiumWidth: 'downDip', pointSourceDistance: 'epicentral' } as const;

const areaKm2 = (magnitude: number, tw: boolean): number => {
  const r = simulateEarthquake({
    magnitude,
    vs30: 760,
    ...BEFORE,
    ...(tw ? { pointSourceDistance: 'thompsonWorden2018' as const } : {}),
  });
  const rad = ((r.shaking.mmi7Radius as number) || 0) / 1000;
  if (!(rad > 0)) return 0;
  if (!r.isExtendedSource) return Math.PI * rad * rad;
  const l = (r.ruptureLength as number) / 1000;
  const w = (r.ruptureFootprintWidth as number) / 1000;
  return l * w + 2 * rad * (l + w) + Math.PI * rad * rad;
};

describe('B-083: the seam at Mw 7.5, as it was and as it is', () => {
  it('multiplies the shaken ground by ten for a tenth of a magnitude', () => {
    const below = areaKm2(7.4, false);
    const above = areaKm2(7.5, false);
    expect(below).toBeCloseTo(SEAM_AREAS_KM2.shipped[7.4], -1);
    expect(above).toBeCloseTo(SEAM_AREAS_KM2.shipped[7.5], -2);
    expect(above / below).toBeGreaterThan(9);
  });

  it('is REDUCED, not caused, by Thompson & Worden', () => {
    const jump = areaKm2(7.5, true) / areaKm2(7.4, true);
    expect(jump).toBeLessThan(3);
    expect(jump).toBeLessThan(areaKm2(7.5, false) / areaKm2(7.4, false));
  });

  it('was invisible to the radius, which is what P-MONO-MW read', () => {
    // 14.07 km to 14.88 km: a gate on the radius walked straight past a
    // tenfold jump in the ground, because the shape changed underneath.
    const at = (m: number): number =>
      (simulateEarthquake({ magnitude: m, vs30: 760, ...BEFORE }).shaking.mmi7Radius as number) /
      1000;
    expect(at(7.5)).toBeGreaterThan(at(7.4));
    expect(at(7.5) / at(7.4)).toBeLessThan(1.1);
  });

  it('disappears when one shape is used at every magnitude', () => {
    // `extendedSource: always` removes the seam by construction, which is
    // the third implication of the diagnosis.
    const area = (magnitude: number): number => {
      const r = simulateEarthquake({ magnitude, vs30: 760, extendedSource: 'always' });
      const rad = ((r.shaking.mmi7Radius as number) || 0) / 1000;
      const l = (r.ruptureLength as number) / 1000;
      const w = (r.ruptureFootprintWidth as number) / 1000;
      return l * w + 2 * rad * (l + w) + Math.PI * rad * rad;
    };
    expect(area(7.5) / area(7.4)).toBeLessThan(1.5);
  });
});
