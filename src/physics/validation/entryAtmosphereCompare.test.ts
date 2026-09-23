import { describe, expect, it } from 'vitest';
import { compareAtmospheres, type AtmosphereReading } from './entryAtmosphereCompare.js';
import { ENTRY_ATMOSPHERE_CRITERION } from './entryAtmosphereRules.js';

/** Rule 914's decision, on readings made up to sit on each of its edges. */
const legacy: AtmosphereReading = {
  atmosphere: 'closed',
  rows: 357,
  toTheGround: 6,
  medianAbsoluteErrorKm: 5.3,
  meanErrorKm: 1.7,
  coveragePoints: 40,
};
const as = (change: Partial<AtmosphereReading>): AtmosphereReading => ({
  ...legacy,
  atmosphere: 'integratedUssa',
  ...change,
});

describe('rule 914: the comparative criterion', () => {
  it('the band is S2 at the 10th and 90th percentiles of its log-uniform prior', () => {
    const [weak, strong] = ENTRY_ATMOSPHERE_CRITERION.bandStrengthsPa;
    expect(weak / 1e6).toBeCloseTo(1.068, 3);
    expect(strong / 1e6).toBeCloseTo(4.21, 2);
  });

  it('adopts two improvements with nothing worse', () => {
    const v = compareAtmospheres(legacy, as({ medianAbsoluteErrorKm: 5.2, meanErrorKm: 1.6 }));
    expect(v.improved).toEqual(['absolute error', 'bias']);
    expect(v.metricsAdopt).toBe(true);
  });

  it('one improvement is not enough', () => {
    expect(compareAtmospheres(legacy, as({ coveragePoints: 45 })).metricsAdopt).toBe(false);
  });

  it('a bias of the other sign is read by its size', () => {
    const v = compareAtmospheres(legacy, as({ meanErrorKm: -1.5, coveragePoints: 41 }));
    expect(v.improved).toEqual(['bias', 'coverage']);
    expect(v.metricsAdopt).toBe(true);
  });

  it('refuses a material worsening, at each edge and not below it', () => {
    const two = { meanErrorKm: 1.5, coveragePoints: 42 };
    expect(
      compareAtmospheres(legacy, as({ ...two, medianAbsoluteErrorKm: 5.56 })).worsened
    ).toEqual(['absolute error']);
    expect(
      compareAtmospheres(legacy, as({ ...two, medianAbsoluteErrorKm: 5.54 })).metricsAdopt
    ).toBe(true);
    const other = { medianAbsoluteErrorKm: 5.1, coveragePoints: 42 };
    expect(compareAtmospheres(legacy, as({ ...other, meanErrorKm: -2.3 })).worsened).toEqual([
      'bias',
    ]);
    const third = { medianAbsoluteErrorKm: 5.1, meanErrorKm: 1.5 };
    expect(compareAtmospheres(legacy, as({ ...third, coveragePoints: 37.9 })).worsened).toEqual([
      'coverage',
    ]);
    expect(compareAtmospheres(legacy, as({ ...third, toTheGround: 14 })).worsened).toEqual([
      'to the ground',
    ]);
    expect(compareAtmospheres(legacy, as({ ...third, toTheGround: 13 })).metricsAdopt).toBe(true);
  });
});
