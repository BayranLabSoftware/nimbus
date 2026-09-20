import { describe, expect, it } from 'vitest';
import { simulateEarthquake, type EarthquakeScenarioInput } from './simulate.js';
import type { Meters } from '../../units.js';

/**
 * Rule 413: exactly one thing changes, and it is the shape.
 *
 * `extendedSource: 'always'` claims to change the footprint of an
 * unmarked, shallow scenario below Mw 7.5 and NOTHING else. A candidate
 * that moved a number outside the domain it claims would be two changes
 * wearing one name, and the round that scored it would not be able to say
 * which one had done the work.
 *
 * So this compares the two geometries' whole results, field by field, and
 * asks for identity everywhere the candidate says it does not reach.
 */
const km = (v: number): Meters => (v * 1_000) as Meters;

/** Everything the simulator answers except the inputs, which differ by
 *  construction: the candidate carries the input that names it. */
function answer(input: EarthquakeScenarioInput): string {
  const { inputs: _inputs, ...rest } = simulateEarthquake(input);
  return JSON.stringify(rest);
}

const both = (input: EarthquakeScenarioInput): { inPlace: string; candidate: string } => ({
  inPlace: answer(input),
  candidate: answer({ ...input, extendedSource: 'always' }),
});

describe('rule 413: the candidate reaches only where it says', () => {
  it('draws the same thing at Mw 7.5 and above, where both are stadiums', () => {
    for (const magnitude of [7.5, 7.8, 8.2, 9.1]) {
      const { inPlace, candidate } = both({ magnitude, depth: km(15) });
      expect(candidate, `Mw ${magnitude.toString()}`).toBe(inPlace);
    }
  });

  it('leaves a subduction interface to rule 44, at every magnitude', () => {
    // Rules 40 to 44 chose the disc below Mw 7.5 for a marked scenario on
    // 64 interface earthquakes. This round is not allowed to reopen that.
    for (const magnitude of [6.0, 6.6, 7.0, 7.4, 7.9]) {
      const { inPlace, candidate } = both({
        magnitude,
        depth: km(30),
        subductionInterface: true,
      });
      expect(candidate, `interface Mw ${magnitude.toString()}`).toBe(inPlace);
    }
  });

  it('leaves a deep earthquake to rules 66 to 70', () => {
    for (const depthKm of [80, 150, 400]) {
      const { inPlace, candidate } = both({ magnitude: 7.0, depth: km(depthKm) });
      expect(candidate, `${depthKm.toString()} km`).toBe(inPlace);
    }
  });

  it('changes the shape, and only the shape, where it does reach', () => {
    for (const magnitude of [6.0, 6.6, 7.0, 7.4]) {
      // Since 20 September the point-source distance defaults to Thompson
      // & Worden's, which is read only where a scenario is NOT extended —
      // so flipping this flag would flip the distance convention too. The
      // old convention is named on both sides, so the flag is measured
      // alone. That coupling is a real property of the adopted defaults
      // and is recorded in the adoption's own notes.
      const input: EarthquakeScenarioInput = {
        magnitude,
        depth: km(12),
        pointSourceDistance: 'epicentral',
      };
      const a = simulateEarthquake(input);
      const b = simulateEarthquake({ ...input, extendedSource: 'always' });
      expect(a.isExtendedSource, `Mw ${magnitude.toString()} in place`).toBe(false);
      expect(b.isExtendedSource, `Mw ${magnitude.toString()} candidate`).toBe(true);
      // Every ring keeps its radius: the rings are what the contour law
      // says, and the geometry only decides what shape is laid on them.
      expect(b.shaking.mmi7Radius).toBe(a.shaking.mmi7Radius);
      expect(b.shaking.mmi8Radius).toBe(a.shaking.mmi8Radius);
      expect(b.shaking.mmi9Radius).toBe(a.shaking.mmi9Radius);
    }
  });

  it('is off by default, so nothing moves until a rule adopts it', () => {
    for (const magnitude of [5.0, 6.2, 7.2]) {
      const plain = simulateEarthquake({ magnitude, depth: km(10) });
      const named = simulateEarthquake({
        magnitude,
        depth: km(10),
        extendedSource: 'fromMw7.5',
      });
      expect(named.isExtendedSource).toBe(plain.isExtendedSource);
      expect(answer({ magnitude, depth: km(10), extendedSource: 'fromMw7.5' })).toBe(
        answer({ magnitude, depth: km(10) })
      );
    }
  });
});
