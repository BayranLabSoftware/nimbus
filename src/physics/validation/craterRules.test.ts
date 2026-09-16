import { describe, expect, it } from 'vitest';
import {
  BOOK_CONTACT_CRATER_FT,
  bookCraterCoefficient,
  bookCraterDepthM,
  bookCraterDiameterM,
  CRATER_YIELD_EXPONENT,
} from '../effects/nuclearCrater.js';
import { NUCLEAR_CRATER_COEFFICIENT } from '../events/explosion/cratering.js';
import {
  chooseCraterCoefficients,
  CRATER_MEDIUM_OF,
  CRATER_SET_ON_A_MEASUREMENT,
  craterNumbersPass,
} from './craterRules.js';
import { craterCoefficientRows, craterNumberChecks } from './craterRun.js';

describe('rule 90: the numbers the book prints', () => {
  it('are the eight on Figures 6.72a and b, in the feet the book gives', () => {
    const checks = craterNumberChecks();
    expect(checks).toEqual({ eight: true, exponent: true, ordered: true });
    expect(craterNumbersPass(checks)).toBe(true);
    expect(BOOK_CONTACT_CRATER_FT.wetSoilOrSoftRock.radius).toBe(82);
    expect(BOOK_CONTACT_CRATER_FT.drySoilOrSoftRock.radius).toBe(61);
    expect(BOOK_CONTACT_CRATER_FT.wetHardRock.radius).toBe(58);
    expect(BOOK_CONTACT_CRATER_FT.dryHardRock.radius).toBe(49);
    expect(BOOK_CONTACT_CRATER_FT.wetSoilOrSoftRock.depth).toBe(31);
    expect(BOOK_CONTACT_CRATER_FT.dryHardRock.depth).toBe(22);
  });

  it("carries the exponent the book's own arithmetic gives", () => {
    // §6.72's example divides a 270-foot depth at 20 kt by 2.46 and multiplies
    // the answer back by the same 2.46.
    expect(20 ** CRATER_YIELD_EXPONENT).toBeCloseTo(2.46, 2);
    expect(CRATER_YIELD_EXPONENT).toBe(0.3);
    // 1 kt in dry soil: 61 feet of radius, 122 of diameter, 37.19 m.
    expect(bookCraterDiameterM('drySoilOrSoftRock', 1)).toBeCloseTo(37.19, 2);
    expect(bookCraterDepthM('drySoilOrSoftRock', 1)).toBeCloseTo(8.53, 2);
    // and at 20 kt both are 2.46 times that, as the book's example scales.
    expect(
      bookCraterDiameterM('drySoilOrSoftRock', 20) / bookCraterDiameterM('drySoilOrSoftRock', 1)
    ).toBeCloseTo(2.46, 2);
    expect(
      bookCraterDepthM('drySoilOrSoftRock', 20) / bookCraterDepthM('drySoilOrSoftRock', 1)
    ).toBeCloseTo(2.46, 2);
  });

  it('gives no crater for a yield of nothing', () => {
    expect(bookCraterDiameterM('dryHardRock', 0)).toBe(0);
    expect(bookCraterDepthM('dryHardRock', -1)).toBe(0);
  });
});

describe('rule 91: which medium each ground type is read as', () => {
  it('maps four of the five and leaves clay out, as the book has no clay', () => {
    expect(CRATER_MEDIUM_OF.HARD_ROCK).toBe('dryHardRock');
    expect(CRATER_MEDIUM_OF.FIRM_GROUND).toBe('drySoilOrSoftRock');
    expect(CRATER_MEDIUM_OF.DRY_SOIL).toBe('drySoilOrSoftRock');
    expect(CRATER_MEDIUM_OF.WET_SOIL).toBe('wetSoilOrSoftRock');
    expect(CRATER_MEDIUM_OF.CLAY).toBeUndefined();
  });

  it('turns the book’s radius into the same kind of coefficient the project has', () => {
    expect(bookCraterCoefficient('dryHardRock')).toBeCloseTo(29.87, 2);
    expect(bookCraterCoefficient('wetSoilOrSoftRock')).toBeCloseTo(49.99, 2);
  });
});

describe('rule 92: the choice', () => {
  const numbers = { eight: true, exponent: true, ordered: true };

  it('adopts unless the numbers, the gate, the move or the order say otherwise', () => {
    expect(
      chooseCraterCoefficients({ numbers, gatePasses: true, worstMove: 1.1, orderSurvives: true })
        .adopted
    ).toBe(true);
    expect(
      chooseCraterCoefficients({
        numbers: { ...numbers, eight: false },
        gatePasses: true,
        worstMove: 1.1,
        orderSurvives: true,
      }).adopted
    ).toBe(false);
    expect(
      chooseCraterCoefficients({ numbers, gatePasses: false, worstMove: 1.1, orderSurvives: true })
        .adopted
    ).toBe(false);
    expect(
      chooseCraterCoefficients({ numbers, gatePasses: true, worstMove: 2.5, orderSurvives: true })
        .adopted
    ).toBe(false);
    expect(
      chooseCraterCoefficients({ numbers, gatePasses: true, worstMove: 1.1, orderSurvives: false })
        .adopted
    ).toBe(false);
  });

  it('keeps wet soil, which was set on a crater somebody measured', () => {
    expect(CRATER_SET_ON_A_MEASUREMENT).toContain('WET_SOIL');
    const rows = craterCoefficientRows();
    const wet = rows.find((r) => r.groundType === 'WET_SOIL');
    expect(wet?.adopted).toBe(NUCLEAR_CRATER_COEFFICIENT.WET_SOIL);
    expect(wet?.kept).toContain('Bravo');
    const clay = rows.find((r) => r.groundType === 'CLAY');
    expect(clay?.adopted).toBe(NUCLEAR_CRATER_COEFFICIENT.CLAY);
    expect(clay?.book).toBeNull();
  });

  it('leaves the five in the order the project put them', () => {
    const adopted = craterCoefficientRows().map((r) => r.adopted);
    expect(adopted.every((v, i) => i === 0 || v >= (adopted[i - 1] ?? 0))).toBe(true);
  });
});
