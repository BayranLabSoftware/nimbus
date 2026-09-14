import { describe, expect, it } from 'vitest';
import { fromScientific, isMantissa, scaleTyped, splitScientific } from './typedNumber.js';

describe('numbers typed into the panel', () => {
  it('a value typed in kilometres reaches the model in metres without float noise', () => {
    // The bare products: 8050.000000000001, 4030.0000000000005,
    // 2009.9999999999998. Each was stored, linked and shown back.
    expect(8.05 * 1_000).not.toBe(8_050);
    expect(scaleTyped(8.05, 1_000)).toBe(8_050);
    expect(scaleTyped(4.03, 1_000)).toBe(4_030);
    expect(scaleTyped(2.01, 1_000)).toBe(2_010);
    expect(scaleTyped(0.07, 1_000)).toBe(70);
  });

  it('a mantissa and its exponent make the number typed, not its neighbour', () => {
    expect(2.05 * 1e5).not.toBe(205_000);
    expect(fromScientific(2.05, 5)).toBe(205_000);
    expect(fromScientific(2.5, 5)).toBe(250_000);
    expect(fromScientific(2.7, 9)).toBe(2.7e9);
  });

  it('keeps every digit a person can type', () => {
    expect(scaleTyped(0.000123456789, 1_000)).toBe(0.123456789);
    expect(scaleTyped(12_345.678901, 1_000)).toBe(12_345_678.901);
  });

  it('splits a number into a mantissa in [1, 10) and its exponent', () => {
    expect(splitScientific(2.5e5)).toEqual({ mantissa: 2.5, exp: 5 });
    expect(splitScientific(1_000)).toEqual({ mantissa: 1, exp: 3 });
    expect(splitScientific(0)).toEqual({ mantissa: 1, exp: 0 });
    expect(splitScientific(Number.NaN)).toEqual({ mantissa: 1, exp: 0 });
  });

  it('a mantissa waits until the text reads as one', () => {
    expect(isMantissa(1)).toBe(true);
    expect(isMantissa(9.99)).toBe(true);
    expect(isMantissa(10)).toBe(false);
    expect(isMantissa(0.5)).toBe(false);
    expect(isMantissa(Number.NaN)).toBe(false);
  });
});
