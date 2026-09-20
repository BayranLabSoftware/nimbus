import { describe, expect, it } from 'vitest';
import { simulateEarthquake, type EarthquakeScenarioInput } from './simulate.js';
import type { Meters } from '../../units.js';

/**
 * Rule 423: the candidate reaches exactly what it claims.
 *
 * `stadiumWidth: 'surfaceProjection'` changes the width the footprint is
 * laid on and nothing else. In particular it must not move the rupture
 * itself — `ruptureWidth` is a true down-dip distance and the tsunami
 * source reads it, so a candidate that quietly shrank it would be moving
 * a wave as well as a map.
 */
const km = (v: number): Meters => (v * 1_000) as Meters;
const projected = (input: EarthquakeScenarioInput): EarthquakeScenarioInput => ({
  ...input,
  stadiumWidth: 'surfaceProjection',
});

describe('rule 419: the footprint width is the rupture on the map', () => {
  it('projects by the dip the model already assigns to the style', () => {
    // The dip table of simulate.ts: strike-slip 90°, normal 55°, reverse
    // 45°. A vertical fault projects nothing onto the ground.
    const cases = [
      { faultType: 'strike-slip' as const, cos: Math.cos((90 * Math.PI) / 180) },
      { faultType: 'normal' as const, cos: Math.cos((55 * Math.PI) / 180) },
      { faultType: 'reverse' as const, cos: Math.cos((45 * Math.PI) / 180) },
    ];
    for (const c of cases) {
      const input: EarthquakeScenarioInput = {
        magnitude: 7.2,
        depth: km(12),
        faultType: c.faultType,
      };
      const r = simulateEarthquake(projected(input));
      expect(r.ruptureFootprintWidth as number, c.faultType).toBeCloseTo(
        (r.ruptureWidth as number) * c.cos,
        6
      );
    }
  });

  it('draws an unknown mechanism as a line, because it draws it strike-slip', () => {
    // 80 of the 116 earthquakes of rule 405's jury have no mechanism, and
    // CB14's neutral case is strike-slip, so this is the common case.
    const r = simulateEarthquake(projected({ magnitude: 7.0, depth: km(10) }));
    expect(r.ruptureFootprintWidth as number).toBeCloseTo(0, 6);
    expect(r.ruptureWidth as number).toBeGreaterThan(10_000);
  });

  it('leaves the rupture itself alone, so the tsunami cannot have moved', () => {
    for (const magnitude of [6.2, 7.2, 8.6]) {
      const input: EarthquakeScenarioInput = { magnitude, depth: km(15) };
      expect(simulateEarthquake(projected(input)).ruptureWidth).toBe(
        simulateEarthquake(input).ruptureWidth
      );
    }
  });

  it('is off by default: the footprint width IS the rupture width', () => {
    for (const magnitude of [5.5, 6.8, 7.9]) {
      const r = simulateEarthquake({ magnitude, depth: km(15) });
      expect(r.ruptureFootprintWidth).toBe(r.ruptureWidth);
    }
  });

  it('leaves a marked interface and a deep earthquake to their own rules', () => {
    // Rule 421: the dip table has no megathrust in it, and would hand one
    // 45° where it dips 15 to 25. A deep scenario is a disc anyway.
    for (const magnitude of [6.5, 7.8]) {
      const marked: EarthquakeScenarioInput = {
        magnitude,
        depth: km(30),
        subductionInterface: true,
      };
      const m = simulateEarthquake(projected(marked));
      expect(m.ruptureFootprintWidth, `interface Mw ${magnitude.toString()}`).toBe(m.ruptureWidth);
    }
    for (const depthKm of [80, 300]) {
      const deep = simulateEarthquake(projected({ magnitude: 7.2, depth: km(depthKm) }));
      expect(deep.ruptureFootprintWidth, `${depthKm.toString()} km`).toBe(deep.ruptureWidth);
    }
  });

  it('changes nothing but the width, everywhere else in the answer', () => {
    // Everything the simulator says except the inputs and the one field
    // this round exists to move.
    for (const magnitude of [6.4, 7.6]) {
      const input: EarthquakeScenarioInput = { magnitude, depth: km(12) };
      const strip = (r: ReturnType<typeof simulateEarthquake>): string => {
        const { inputs: _i, ruptureFootprintWidth: _w, ...rest } = r;
        return JSON.stringify(rest);
      };
      expect(strip(simulateEarthquake(projected(input))), `Mw ${magnitude.toString()}`).toBe(
        strip(simulateEarthquake(input))
      );
    }
  });
});
