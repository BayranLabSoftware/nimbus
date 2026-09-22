import { describe, expect, it } from 'vitest';
import { formatPeople } from '../../utils/numberFormat.js';
import {
  area,
  compassPoint,
  coordinates,
  countryName,
  dateTime,
  duration,
  fixed,
  length,
  mass,
  people,
  percent,
  scientific,
  tnt,
} from './reportFormat.js';

/**
 * The report writes numbers in the reader's language (B-110): the decimal
 * comma in Italian and the point in English, from the same function.
 */
describe('reportFormat', () => {
  const hemispheres = { north: 'N', south: 'S', east: 'E', west: 'O' };

  it('writes the decimal separator of the language', () => {
    expect(fixed(12.8, 1, 'it')).toBe('12,8');
    expect(fixed(12.8, 1, 'en')).toBe('12.8');
    expect(fixed(7_800, 0, 'en')).toBe('7,800');
    expect(fixed(7_800, 0, 'it')).toBe('7800');
    expect(fixed(-2.5, 1, 'en')).toBe('−2.5');
    expect(fixed(Number.NaN, 1, 'it')).toBe('—');
    expect(percent(0.73, 0, 'it')).toBe('73 %');
  });

  it('prints a length exactly as the legend does', () => {
    expect(length(8_452, 'it')).toBe('8,5 km');
    expect(length(723, 'en')).toBe('723 m');
    expect(length(210_031, 'en')).toBe('210 km');
    expect(length(0, 'it')).toBe('—');
  });

  it('keeps the mass tiers of B-065 and a scientific tail', () => {
    expect(mass(4.842e10, 'en')).toBe('48.4 Mt');
    expect(mass(1.571e12, 'it')).toBe('1,6 Gt');
    expect(mass(510_500_000, 'it')).toBe('510,5 kt');
    expect(mass(3.2e19, 'en')).toBe('3.2 × 10⁴ Tt');
    expect(scientific(9.96e5, 1, 'en')).toBe('1.0 × 10⁶');
  });

  it('writes energies, areas and durations', () => {
    expect(tnt(10, 'it')).toBe('10,0 Mt');
    expect(tnt(0.59, 'en')).toBe('590.0 kt');
    expect(tnt(253_414.8, 'en')).toBe('253.41 Gt');
    expect(area(184e6, 'en')).toBe('184 km²');
    expect(duration(35 * 60, 'en')).toBe('35 min');
    expect(duration(2 * 3_600 + 5 * 60, 'it')).toBe('2 h 5 min');
  });

  it('names the hemispheres and the reader’s clock', () => {
    expect(coordinates(35.0275, -111.0225, 'it', hemispheres)).toMatch(
      /^35,02[78]° N · 111,02[23]° O$/
    );
    const when = Date.UTC(2026, 8, 22, 8, 37, 55);
    expect(dateTime(when, 'it', 'Europe/Rome')).toBe('22 settembre 2026 alle ore 10:37 CEST');
    expect(dateTime(when, 'en', 'Europe/Rome')).toBe('22 September 2026 at 10:37 CEST');
    expect(countryName('US', 'it')).toBe('Stati Uniti');
    expect(countryName('US', 'en')).toBe('United States');
    expect(countryName('', 'en')).toBeNull();
  });

  it('points the compass on sixteen winds', () => {
    expect(compassPoint(0)).toBe('n');
    expect(compassPoint(108.2)).toBe('ese');
    expect(compassPoint(359)).toBe('n');
    expect(compassPoint(247.5)).toBe('wsw');
  });

  it('rounds people as the casualty panel does', () => {
    for (const n of [0, 7, 42, 99, 100, 260, 65_812, 2_812_345]) {
      expect(people(n, 'it')).toBe(formatPeople(n, 'it-IT'));
      expect(people(n, 'en')).toBe(formatPeople(n, 'en-US'));
    }
  });
});
