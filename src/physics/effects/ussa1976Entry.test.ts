import { describe, expect, it } from 'vitest';
import {
  USSA_1976_PROFILE,
  USSA_UPPER_ROWS,
  ussaLower,
  ussaState,
  ussaUpperTemperature,
} from './ussa1976Entry.js';

/**
 * Rule 912 of validation/entryAtmosphereRules.ts: the profile gives the
 * standard's printed temperature, pressure and density within their last
 * printed digit, at every 5 km from 0 to 85 km, at 86, 90, 100, 110, 120 and
 * 150 km, and at −5 km, where Table I continues its lowest layer below the
 * ground. Each row as Table I (geometric altitude, metric units) prints it:
 * altitude (m), T (K), P (mb), ρ (kg/m³), and its page.
 */
const PRINTED: readonly (readonly [number, string, string, string, number])[] = [
  [-5_000, '320.676', '1.7776e3', '1.9311e0', 51],
  [0, '288.150', '1.01325e3', '1.2250e0', 53],
  [5_000, '255.676', '5.4048e2', '7.3643e-1', 55],
  [10_000, '223.252', '2.6499e2', '4.1351e-1', 57],
  [15_000, '216.650', '1.2111e2', '1.9476e-1', 59],
  [20_000, '216.650', '5.5293e1', '8.8910e-2', 61],
  [25_000, '221.552', '2.5492e1', '4.0084e-2', 61],
  [30_000, '226.509', '1.1970e1', '1.8410e-2', 63],
  [35_000, '236.513', '5.7459e0', '8.4634e-3', 63],
  [40_000, '250.350', '2.8714e0', '3.9957e-3', 65],
  [45_000, '264.164', '1.4910e0', '1.9663e-3', 65],
  [50_000, '270.650', '7.9779e-1', '1.0269e-3', 65],
  [55_000, '260.771', '4.2525e-1', '5.6810e-4', 65],
  [60_000, '247.021', '2.1958e-1', '3.0968e-4', 67],
  [65_000, '233.292', '1.0929e-1', '1.6321e-4', 67],
  [70_000, '219.585', '5.2209e-2', '8.2829e-5', 67],
  [75_000, '208.399', '2.3881e-2', '3.9921e-5', 67],
  [80_000, '198.639', '1.0524e-2', '1.8458e-5', 67],
  [85_000, '188.893', '4.4568e-3', '8.2196e-6', 67],
  [86_000, '186.87', '3.7338e-3', '6.958e-6', 68],
  [90_000, '186.87', '1.8359e-3', '3.416e-6', 68],
  [100_000, '195.08', '3.2011e-4', '5.604e-7', 68],
  [110_000, '240.00', '7.1042e-5', '9.708e-8', 68],
  [120_000, '360.00', '2.5382e-5', '2.222e-8', 68],
  [150_000, '634.39', '4.5422e-6', '2.076e-9', 69],
];

/** One unit of a printed figure's last digit. */
function lastDigit(printed: string): number {
  const [mantissa = '', exponent = '0'] = printed.split('e');
  const decimals = mantissa.split('.')[1]?.length ?? 0;
  return 10 ** (Number(exponent) - decimals);
}

describe('rule 912: the U.S. Standard Atmosphere 1976 of the entry', () => {
  it('gives every printed row within its last digit', () => {
    const misses: string[] = [];
    for (const [z, t, p, rho, page] of PRINTED) {
      const s = ussaState(z);
      const checks: [string, number, string][] = [
        ['T', s.temperature, t],
        ['P', s.pressure / 100, p],
        ['ρ', s.density, rho],
      ];
      for (const [name, got, want] of checks) {
        if (Math.abs(got - Number(want)) > lastDigit(want)) {
          misses.push(
            `${String(z)} m (p. ${String(page)}): ${name} ${String(got)} against ${want}`
          );
        }
      }
    }
    expect(misses).toEqual([]);
  });

  it('joins its two parts at 86 km within the printed digit', () => {
    expect(Math.abs(ussaLower(86_000).density - 6.958e-6)).toBeLessThanOrEqual(1e-9);
  });

  it('the rows above 86 km hold a smooth mean molecular weight, M = ρ R* T / P', () => {
    // Four printed digits of density move M by about 0.01 kg/kmol; a figure
    // misread moves it by tenths.
    const weights = USSA_UPPER_ROWS.map(
      ([z, rho, mb]) => (rho * 8_314.32 * ussaUpperTemperature(z)) / (mb * 100)
    );
    // §1.2.6 (p. 10): M7 / M0 = 0.9995788 at 86 km.
    expect(weights[0]).toBeCloseTo(28.9644 * 0.999_578_8, 1);
    for (let i = 1; i < weights.length; i++) {
      const step = (weights[i] ?? 0) - (weights[i - 1] ?? 0);
      expect(step).toBeLessThan(0.03);
      expect(step).toBeGreaterThan(-0.2);
    }
  });

  it('continues below the ground and above 150 km without a break', () => {
    const d = USSA_1976_PROFILE.density;
    expect(d(-150_000)).toBeGreaterThan(d(-100_000));
    expect(d(151_000)).toBeLessThan(d(150_000));
    expect(d(151_000) / d(150_000)).toBeCloseTo(2.076 / 2.196, 2);
  });
});
