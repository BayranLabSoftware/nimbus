import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { PS2FF_REFERENCE } from '../../validation/ps2ffReference.js';
import {
  POINT_SOURCE_DISTANCES_KM,
  pointSourceDistances,
  thompsonWorden2018Averages,
} from './pointSourceDistance.js';
import { simulateEarthquake, type EarthquakeScenarioInput } from './simulate.js';

/**
 * Rule 51 of validation/pointSourceRules.ts, held before any score: the
 * integral is ps2ff's, the grid keeps to it, and the scenario input moves
 * nothing it should not.
 */

describe('rule 51 (a): Thompson & Worden 2018 as ps2ff 1.5.9 computes it', () => {
  it('matches single_event_adjustment within one part in a billion at every distance', () => {
    expect(PS2FF_REFERENCE).toHaveLength(4 * 4 * 49);
    for (const [magnitude, depthKm, r, rjb, rrup] of PS2FF_REFERENCE) {
      const a = thompsonWorden2018Averages(magnitude, depthKm, r);
      const at = `M ${magnitude.toString()} z ${depthKm.toString()} r ${r.toString()}`;
      expect(Math.abs(a.rjbKm / rjb - 1), at).toBeLessThan(1e-9);
      expect(Math.abs(a.rrupKm / rrup - 1), at).toBeLessThan(1e-9);
    }
  });

  it('computes at ps2ff’s own 49 distances', () => {
    const distances = PS2FF_REFERENCE.slice(0, 49).map((row) => row[2]);
    POINT_SOURCE_DISTANCES_KM.forEach((r, i) => {
      expect(Math.abs(r / (distances[i] ?? 0) - 1)).toBeLessThan(1e-12);
    });
  });
});

describe('rule 51 (b): the grid keeps to the integral', () => {
  it('within 5 %, and within 2 % where the depth or the distance is 3 km or more', () => {
    const magnitudes = [5.05, 6.05, 7.45];
    const depths = [...Array.from({ length: 10 }, (_, i) => 1.05 + 0.2 * i), 3.5, 9.5, 39.5];
    const distances = [...Array.from({ length: 21 }, (_, i) => 1 + 0.1 * i), 5, 20, 100, 300];
    let worst = 0;
    let worstFar = 0;
    for (const magnitude of magnitudes) {
      for (const depthKm of depths) {
        const grid = pointSourceDistances(magnitude, depthKm);
        for (const r of distances) {
          const exact = thompsonWorden2018Averages(magnitude, depthKm, r);
          const error = Math.max(
            Math.abs(grid.rjbKm(r) / exact.rjbKm - 1),
            Math.abs(grid.rrupKm(r) / exact.rrupKm - 1)
          );
          worst = Math.max(worst, error);
          if (depthKm >= 3 || r >= 3) worstFar = Math.max(worstFar, error);
        }
      }
    }
    expect(worst).toBeLessThan(0.05);
    expect(worstFar).toBeLessThan(0.02);
    // About seventy nodes of 49 integrals each: 0.7 s alone, 2.6 s under
    // coverage, and past vitest's 5 s on CI's runner.
  }, 30_000);

  it('is exact at a node, and reads a depth above 1 km at 1 km', () => {
    const grid = pointSourceDistances(6.3, 12);
    for (const i of [0, 12, 24, 36, 48]) {
      const r = POINT_SOURCE_DISTANCES_KM[i] ?? 0;
      const exact = thompsonWorden2018Averages(6.3, 12, r);
      expect(grid.rjbKm(r)).toBeCloseTo(exact.rjbKm, 9);
      expect(grid.rrupKm(r)).toBeCloseTo(exact.rrupKm, 9);
    }
    expect(pointSourceDistances(6.3, 0.2).rjbKm(10)).toBe(pointSourceDistances(6.3, 1).rjbKm(10));
  });

  it('never puts a site further from the rupture than from the epicentre, and inverts', () => {
    for (const [magnitude, depthKm] of [
      [5.5, 3],
      [6.6, 10],
      [7.4, 30],
    ] as const) {
      const grid = pointSourceDistances(magnitude, depthKm);
      let last = 0;
      for (const r of [0.05, 0.3, 1, 2.5, 7, 15, 40, 90, 250, 800, 2_000]) {
        const rjb = grid.rjbKm(r);
        expect(rjb).toBeLessThanOrEqual(r);
        expect(rjb).toBeGreaterThan(last);
        last = rjb;
        expect(grid.epicentralForRjbKm(rjb)).toBeCloseTo(r, 9);
      }
      expect(grid.epicentralForRjbKm(0)).toBe(0);
    }
  });
});

describe('rule 51 (c): the scenario input', () => {
  const scenarios: EarthquakeScenarioInput[] = [
    { magnitude: 5.4, depth: m(8_000), faultType: 'strike-slip' },
    { magnitude: 6.3, depth: m(9_000), faultType: 'normal', vs30: 450 },
    { magnitude: 6.9, faultType: 'reverse', vs30: 300, groundMotionResidualLn: 0.4 },
    { magnitude: 7.2, depth: m(35_000), subductionInterface: true },
    {
      magnitude: 7.2,
      depth: m(35_000),
      subductionInterface: true,
      contourLaw: 'parker2022Interface',
    },
    { magnitude: 6.7, depth: m(19_000), intensityMeasure: 'pgv', intensityBanding: 'pager' },
    { magnitude: 7.8, depth: m(10_000), faultType: 'strike-slip', strikeAzimuthDeg: 95 },
    {
      magnitude: 9.1,
      depth: m(29_000),
      subductionInterface: true,
      contourLaw: 'abrahamson2016Interface',
    },
  ];

  it('draws with `thompsonWorden2018` what the simulator draws when it names nothing', () => {
    // Adopted as a default on 20 September, from the re-filtered frontier.
    // `epicentral` is still reachable by name and still means what it
    // meant; it is simply no longer what silence means.
    for (const input of scenarios) {
      const plain = simulateEarthquake(input);
      const named = simulateEarthquake({ ...input, pointSourceDistance: 'thompsonWorden2018' });
      expect({ ...named, inputs: plain.inputs }).toEqual(plain);
    }
  });

  it('keeps a stadium’s rings, and only widens a disc’s', () => {
    for (const input of scenarios) {
      const plain = simulateEarthquake(input);
      const moved = simulateEarthquake({ ...input, pointSourceDistance: 'thompsonWorden2018' });
      const rings = (r: typeof plain) => [
        r.shaking.mmi5Radius,
        r.shaking.mmi6Radius,
        r.shaking.mmi7Radius,
        r.shaking.mmi8Radius,
        r.shaking.mmi9Radius,
      ];
      if (plain.isExtendedSource) {
        expect(rings(moved)).toEqual(rings(plain));
      } else if (input.contourLaw === undefined) {
        // Boore et al. 2014: the average R_JB is never more than the
        // epicentral distance, so a ring can only move out.
        rings(moved).forEach((r, i) => {
          expect((r as number | undefined) ?? 0).toBeGreaterThanOrEqual(
            ((rings(plain)[i] as number | undefined) ?? 0) * (1 - 1e-9)
          );
        });
      }
      // Everything but the rings — and the intensity at the epicentre, which
      // is the ring law read at zero since rule 193 of
      // validation/epicentralIntensityRules.ts and therefore stands at rule
      // 51's own distance above the source. This test asserted that the
      // epicentre did not move when the rings did, and that was the defect:
      // the two came from different laws (B-051).
      const exceptRings = (s: typeof plain.shaking) => ({
        ...s,
        mmi5Radius: 0,
        mmi6Radius: 0,
        mmi7Radius: 0,
        mmi8Radius: 0,
        mmi9Radius: 0,
        mmiAtEpicenter: 0,
        mmiAtEpicenterEurope: 0,
      });
      expect(exceptRings(moved.shaking)).toEqual(exceptRings(plain.shaking));
    }
  });

  it('moves an Mw 6.9 disc’s MMI VII ring out, and an interface model’s too', () => {
    const disc = { magnitude: 6.9, depth: m(15_000), faultType: 'reverse' } as const;
    expect(
      simulateEarthquake({ ...disc, pointSourceDistance: 'thompsonWorden2018' }).shaking.mmi7Radius
    ).toBeGreaterThan(
      simulateEarthquake({ ...disc, pointSourceDistance: 'epicentral' }).shaking.mmi7Radius
    );
    // The average rupture reaches nearer the surface than a hypocentre 15 km
    // down, so the interface model's ring moves out too.
    const marked = {
      magnitude: 7.4,
      depth: m(15_000),
      subductionInterface: true,
      contourLaw: 'parker2022Interface',
    } as const;
    const epicentral = simulateEarthquake({
      ...marked,
      pointSourceDistance: 'epicentral',
    }).shaking.mmi7Radius;
    expect(epicentral).toBeGreaterThan(0);
    expect(
      simulateEarthquake({ ...marked, pointSourceDistance: 'thompsonWorden2018' }).shaking
        .mmi7Radius
    ).toBeGreaterThan(epicentral);
  });
});
