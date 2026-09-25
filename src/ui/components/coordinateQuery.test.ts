import { describe, expect, it } from 'vitest';
import { parseCoordinates } from './coordinateQuery.js';

/** Rule 1215: coordinates typed where a city is, so any point has a keyboard path. */
describe('a place typed as coordinates', () => {
  it('reads signed decimal degrees, however they are separated', () => {
    for (const text of ['40.85, 14.27', '40.85 14.27', '40.85;14.27', ' 40.85 ,  14.27 ']) {
      expect(parseCoordinates(text)).toEqual({ kind: 'point', latitude: 40.85, longitude: 14.27 });
    }
    expect(parseCoordinates('-33.87, 151.21')).toEqual({
      kind: 'point',
      latitude: -33.87,
      longitude: 151.21,
    });
    expect(parseCoordinates('21.4, -89.5')).toEqual({
      kind: 'point',
      latitude: 21.4,
      longitude: -89.5,
    });
  });

  it('reads the hemispheres, in English and in Italian', () => {
    expect(parseCoordinates('33.87S 151.21E')).toEqual({
      kind: 'point',
      latitude: -33.87,
      longitude: 151.21,
    });
    expect(parseCoordinates('21.4°N, 89.5°W')).toEqual({
      kind: 'point',
      latitude: 21.4,
      longitude: -89.5,
    });
    expect(parseCoordinates('45,46 N; 9,19 O')).toEqual({
      kind: 'point',
      latitude: 45.46,
      longitude: -9.19,
    });
  });

  it('reads a decimal comma where the separator leaves no doubt', () => {
    expect(parseCoordinates('40,85; 14,27')).toEqual({
      kind: 'point',
      latitude: 40.85,
      longitude: 14.27,
    });
    expect(parseCoordinates('40,85 14,27')).toEqual({
      kind: 'point',
      latitude: 40.85,
      longitude: 14.27,
    });
  });

  it('says when the figures are out of range, and reads a name as no coordinates', () => {
    expect(parseCoordinates('95, 10')).toEqual({ kind: 'outOfRange' });
    expect(parseCoordinates('10, 190')).toEqual({ kind: 'outOfRange' });
    expect(parseCoordinates('Naples')).toBeNull();
    expect(parseCoordinates('40.85')).toBeNull();
    expect(parseCoordinates('-40.85 S, 14 E')).toBeNull();
  });
});
