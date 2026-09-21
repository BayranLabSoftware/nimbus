import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import { standardAtmosphere, STANDARD_ATMOSPHERE_TOP_M } from './standardAtmosphere.js';

/**
 * The US Standard Atmosphere 1976 is a definition, so this checks the
 * module against the standard's own printed table rather than against
 * anything measured. The pressures below are the standard's, to the digits
 * it prints them in.
 */
describe('the US Standard Atmosphere 1976', () => {
  it('reproduces the standard’s own layer boundaries', () => {
    const rows: readonly (readonly [number, number, number])[] = [
      [0, 288.15, 101_325],
      [11_000, 216.65, 22_632],
      [20_000, 216.65, 5_474.9],
      [32_000, 228.65, 868.02],
      [47_000, 270.65, 110.91],
      [51_000, 270.65, 66.939],
      [71_000, 214.65, 3.9564],
    ];
    for (const [height, temperatureK, pressure] of rows) {
      const a = standardAtmosphere(m(height));
      expect(a.temperatureK, `${String(height)} m temperature`).toBeCloseTo(temperatureK, 2);
      // Five significant figures, which is what the standard prints.
      expect(Number(a.pressure) / pressure, `${String(height)} m pressure`).toBeCloseTo(1, 4);
    }
  });

  it('has the stratopause warmer than the tropopause, which is why plumes stop', () => {
    expect(standardAtmosphere(m(47_000)).temperatureK).toBeGreaterThan(
      standardAtmosphere(m(11_000)).temperatureK
    );
    expect(standardAtmosphere(m(47_000)).temperatureK).toBeCloseTo(270.65, 2);
  });

  it('falls monotonically in pressure all the way up', () => {
    let previous = Infinity;
    for (let h = 0; h <= STANDARD_ATMOSPHERE_TOP_M; h += 500) {
      const p = Number(standardAtmosphere(m(h)).pressure);
      expect(p, `${String(h)} m`).toBeLessThan(previous);
      previous = p;
    }
  });

  it('clamps outside the range it is defined over', () => {
    expect(Number(standardAtmosphere(m(-100)).pressure)).toBeCloseTo(101_325, 0);
    expect(Number(standardAtmosphere(m(1e6)).pressure)).toBeCloseTo(
      Number(standardAtmosphere(m(STANDARD_ATMOSPHERE_TOP_M)).pressure),
      9
    );
  });
});
