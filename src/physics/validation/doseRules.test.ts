import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RADIATION_SOURCE,
  doseAtSlantRangeRad,
  figureHeightOfBurstM,
  groundRangeForDoseM,
  heightFactor,
  radiationWeaponFor,
  slantRangeForDoseM,
  SURFACE_CORRECTION_BELOW_M,
} from '../effects/initialRadiation.js';
import { DOSE_CURVE_RADS, DOSE_CURVES, YARD_M } from '../effects/initialRadiationData.js';
import { initialRadiationRadii, LD50_RAD } from '../events/explosion/radiation.js';
import {
  chooseRadiationSource,
  DOSE_CANDIDATE,
  DOSE_IN_PLACE,
  doseTracePasses,
} from './doseRules.js';
import { doseTraceChecks, ringsBehave } from './doseRun.js';

describe('rule 85: the figures traced from the book', () => {
  it('are four, six curves each, rising, never crossing, meeting at 100 kt', () => {
    const checks = doseTraceChecks();
    expect(checks).toEqual({
      six: true,
      risesWithYield: true,
      neverCrosses: true,
      meetsAt100Kt: true,
      matchesTheExample: true,
    });
    expect(doseTracePasses(checks)).toBe(true);
    expect(DOSE_CURVE_RADS).toEqual([30, 100, 300, 1_000, 3_000, 10_000]);
  });

  it('keep the values the trace read, so a re-trace that moves them is seen', () => {
    const gammaFission = DOSE_CURVES.find(([k, w]) => k === 'gamma' && w === 'fission');
    expect(gammaFission?.[2]).toBe('8.33a');
    // The 30-rad curve of Fig. 8.33a at 1 kt and at 100 kt (yards).
    expect(gammaFission?.[4][0]?.[0]).toBeCloseTo(1461.6, 6);
    expect(gammaFission?.[4][0]?.[10]).toBeCloseTo(2791.5, 6);
    const neutronThermo = DOSE_CURVES.find(([k, w]) => k === 'neutron' && w === 'thermonuclear');
    expect(neutronThermo?.[2]).toBe('8.64b');
    expect(neutronThermo?.[4][5]?.[11]).toBeCloseTo(2174.1, 6);
  });

  it("reproduces the book's own worked example at §8.34", () => {
    // 2 000 yards from a 50 kt fission air burst: the book reads "somewhat
    // less than 300 rads … about 250".
    const dose = doseAtSlantRangeRad('gamma', 50, 2_000 * YARD_M);
    expect(dose).toBeGreaterThan(180);
    expect(dose).toBeLessThan(320);
  });
});

describe('rule 86: the dose a scenario reads', () => {
  it('falls with range and rises with yield', () => {
    expect(doseAtSlantRangeRad('gamma', 20, 1_000)).toBeGreaterThan(
      doseAtSlantRangeRad('gamma', 20, 2_000)
    );
    expect(doseAtSlantRangeRad('neutron', 50, 1_500)).toBeGreaterThan(
      doseAtSlantRangeRad('neutron', 5, 1_500)
    );
  });

  it("reads the book's fission figures below 100 kt and its thermonuclear pair above", () => {
    expect(radiationWeaponFor(99)).toBe('fission');
    expect(radiationWeaponFor(100)).toBe('thermonuclear');
    expect(figureHeightOfBurstM(15)).toBeCloseTo(290 * 15 ** 0.4 * 0.3048, 9);
  });

  it('corrects towards a contact surface burst only below 300 feet', () => {
    expect(heightFactor('neutron', 20, SURFACE_CORRECTION_BELOW_M)).toBe(1);
    expect(heightFactor('neutron', 20, 0)).toBeCloseTo(0.5, 9);
    expect(heightFactor('neutron', 20, SURFACE_CORRECTION_BELOW_M / 2)).toBeCloseTo(0.75, 9);
    // Table 8.37: ⅔ up to 50 kt, 1 at 100 kt, 3 from 5 Mt.
    expect(heightFactor('gamma', 10, 0)).toBeCloseTo(2 / 3, 9);
    expect(heightFactor('gamma', 100, 0)).toBeCloseTo(1, 9);
    expect(heightFactor('gamma', 10_000, 0)).toBeCloseTo(3, 9);
  });

  it('turns the slant range into a ring on the ground', () => {
    const slant = slantRangeForDoseM(LD50_RAD, 1_000, 2_000);
    const ground = groundRangeForDoseM(LD50_RAD, 1_000, 2_000);
    expect(ground).toBeCloseTo(Math.sqrt(slant * slant - 2_000 * 2_000), 3);
    // A burst higher than the dose reaches draws nothing on the ground.
    expect(groundRangeForDoseM(LD50_RAD, 1, 40_000)).toBe(0);
  });
});

describe('rule 87: the choice', () => {
  const trace = {
    six: true,
    risesWithYield: true,
    neverCrosses: true,
    meetsAt100Kt: true,
    matchesTheExample: true,
  };

  it('adopts the book unless the trace, the gate or the rings say otherwise', () => {
    expect(chooseRadiationSource({ trace, gatePasses: true, ringsBehave: true }).adopted).toBe(
      true
    );
    expect(
      chooseRadiationSource({
        trace: { ...trace, neverCrosses: false },
        gatePasses: true,
        ringsBehave: true,
      }).adopted
    ).toBe(false);
    expect(chooseRadiationSource({ trace, gatePasses: false, ringsBehave: true }).adopted).toBe(
      false
    );
    expect(chooseRadiationSource({ trace, gatePasses: true, ringsBehave: false }).adopted).toBe(
      false
    );
  });

  it('finds the rings ordered and growing with the yield', () => {
    expect(ringsBehave()).toBe(true);
  });
});

describe('rule 89: what a scenario draws', () => {
  it('names the law, and the two differ', () => {
    const fit = initialRadiationRadii(0.015, { source: DOSE_IN_PLACE, heightOfBurstM: 580 });
    const book = initialRadiationRadii(0.015, { source: DOSE_CANDIDATE, heightOfBurstM: 580 });
    expect(fit.ld50Radius).not.toBe(book.ld50Radius);
    const unnamed = initialRadiationRadii(0.015, { heightOfBurstM: 580 });
    const expected = DEFAULT_RADIATION_SOURCE === 'project' ? fit : book;
    expect(unnamed.ld50Radius).toBe(expected.ld50Radius);
  });

  it('leaves the fit deaf to the height of burst and the book not', () => {
    const a = initialRadiationRadii(1, { source: DOSE_IN_PLACE, heightOfBurstM: 0 });
    const b = initialRadiationRadii(1, { source: DOSE_IN_PLACE, heightOfBurstM: 3_000 });
    expect(a.ld50Radius).toBe(b.ld50Radius);
    const c = initialRadiationRadii(1, { source: DOSE_CANDIDATE, heightOfBurstM: 0 });
    const d = initialRadiationRadii(1, { source: DOSE_CANDIDATE, heightOfBurstM: 3_000 });
    expect(c.ld50Radius).not.toBe(d.ld50Radius);
  });
});
