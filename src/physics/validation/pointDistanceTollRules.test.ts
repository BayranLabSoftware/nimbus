import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import type { Meters } from '../units.js';
import { CITED } from './pointDistanceTollRules.js';

const km = (v: number): Meters => (v * 1_000) as Meters;

describe('rule 478: the candidate moves the rings and nothing else', () => {
  it('leaves the epicentral intensity exactly where it was', () => {
    // The claim rule 479(a) cites rather than re-runs: R_JB is horizontal,
    // so a correction to it cannot reach the peak. If this ever stopped
    // being true the round would be measuring two things.
    for (const magnitude of [5.2, 6.0, 6.8, 7.4, 8.1]) {
      for (const depthKm of [3, 10, 25, 38]) {
        const plain = simulateEarthquake({ magnitude, depth: km(depthKm) });
        const fixed = simulateEarthquake({
          magnitude,
          depth: km(depthKm),
          pointSourceDistance: 'thompsonWorden2018',
        });
        expect(
          fixed.shaking.mmiAtEpicenter,
          `Mw ${magnitude.toString()} at ${depthKm.toString()} km`
        ).toBe(plain.shaking.mmiAtEpicenter);
      }
    }
  }, 30_000);

  it('does move the rings, which is the whole point', () => {
    for (const magnitude of [5.5, 6.2, 7.0]) {
      const plain = simulateEarthquake({ magnitude, depth: km(12) });
      const fixed = simulateEarthquake({
        magnitude,
        depth: km(12),
        pointSourceDistance: 'thompsonWorden2018',
      });
      expect(fixed.shaking.mmi7Radius).not.toBe(plain.shaking.mmi7Radius);
    }
  });

  it('cites figures that are the published ones', () => {
    expect(CITED.areaBias).toBeGreaterThan(CITED.shippedAreaBias);
    // Closer to 1 than what ships, which is the half it wins.
    expect(Math.abs(Math.log(CITED.areaBias))).toBeLessThan(
      Math.abs(Math.log(CITED.shippedAreaBias))
    );
  });
});
