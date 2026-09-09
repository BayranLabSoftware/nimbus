import { describe, expect, it } from 'vitest';
import {
  cityDisplayName,
  formatPopulation,
  isCityPick,
  labelRangeMetres,
  searchCities,
  type CityRecord,
} from './cityLabels.js';

const CITIES: CityRecord[] = [
  {
    nameEn: 'Rome',
    nameIt: 'Roma',
    lat: 41.9,
    lon: 12.5,
    popMax: 3_339_000,
    minZoom: 2.7,
    capital: true,
    cc: 'IT',
  },
  {
    nameEn: 'Naples',
    nameIt: 'Napoli',
    lat: 40.8,
    lon: 14.2,
    popMax: 2_250_000,
    minZoom: 4.7,
    capital: false,
    cc: 'IT',
  },
  {
    nameEn: 'Nairobi',
    nameIt: '',
    lat: -1.3,
    lon: 36.8,
    popMax: 3_010_000,
    minZoom: 3,
    capital: true,
    cc: 'IT',
  },
  {
    nameEn: 'São Paulo',
    nameIt: 'San Paolo',
    lat: -23.6,
    lon: -46.6,
    popMax: 18_845_000,
    minZoom: 3,
    capital: false,
    cc: 'IT',
  },
];

describe('cityDisplayName', () => {
  it('uses the Italian exonym for the Italian UI and the English name otherwise', () => {
    const rome = CITIES[0];
    if (rome === undefined) throw new Error('fixture');
    expect(cityDisplayName(rome, 'it')).toBe('Roma');
    expect(cityDisplayName(rome, 'it-IT')).toBe('Roma');
    expect(cityDisplayName(rome, 'en')).toBe('Rome');
  });

  it('falls back to the English name when no exonym exists', () => {
    const nairobi = CITIES[2];
    if (nairobi === undefined) throw new Error('fixture');
    expect(cityDisplayName(nairobi, 'it')).toBe('Nairobi');
  });
});

describe('labelRangeMetres', () => {
  it('world cities are visible from any distance', () => {
    expect(labelRangeMetres(1.7)).toBeGreaterThan(1e8);
    expect(labelRangeMetres(2.5)).toBeGreaterThan(1e8);
  });

  it('halves the range for every zoom tier, like a web map', () => {
    expect(labelRangeMetres(5) / labelRangeMetres(6)).toBeCloseTo(2, 9);
  });

  it('regional towns appear only within a few hundred kilometres', () => {
    expect(labelRangeMetres(7)).toBeLessThan(1_500_000);
    expect(labelRangeMetres(7)).toBeGreaterThan(300_000);
  });
});

describe('searchCities', () => {
  it('matches accent-insensitively on either name column', () => {
    expect(searchCities(CITIES, 'sao').map((c) => c.nameEn)).toEqual(['São Paulo']);
    expect(searchCities(CITIES, 'NAP').map((c) => c.nameEn)).toEqual(['Naples']);
    expect(searchCities(CITIES, 'rom').map((c) => c.nameEn)).toEqual(['Rome']);
  });

  it('returns nothing for a blank query and honours the limit', () => {
    expect(searchCities(CITIES, '   ')).toEqual([]);
    expect(searchCities(CITIES, 'n', 1)).toHaveLength(1);
  });
});

describe('formatPopulation', () => {
  it('prints millions with one decimal and smaller counts in full', () => {
    expect(formatPopulation(3_339_000, 'en')).toBe('3.3 M');
    expect(formatPopulation(3_339_000, 'it')).toBe('3,3 M');
    expect(formatPopulation(250_000, 'en')).toBe('250,000');
    expect(formatPopulation(0, 'en')).toBe('');
  });
});

describe('isCityPick', () => {
  it('recognises the pick id shape and rejects entity ids', () => {
    expect(isCityPick({ nimbusCity: CITIES[0] })).toBe(true);
    expect(isCityPick({ id: 'damage-ring-craterRim' })).toBe(false);
    expect(isCityPick('damage-ring-craterRim')).toBe(false);
    expect(isCityPick(null)).toBe(false);
  });
});
