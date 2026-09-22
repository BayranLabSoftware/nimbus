/**
 * How the report writes a number, in the reader's language (B-110): the
 * decimal comma in Italian and the point in English, each language's own
 * grouping, a true minus sign, and a radius exactly as the globe's legend
 * prints it. Every formatter takes the language instead of reading i18next,
 * so the report's builder stays a pure function a test can run in either.
 */
import { formatRange } from '../../../scene/globe/impactFieldMap.js';

/** What a quantity the scenario does not have prints as. */
export const NONE = '—';

export function localeOf(language: string): string {
  return language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
}

/** Dates in English as a report writes them — "22 September 2026" — and
 *  not the month-first American form the numbers' locale would give. */
function dateLocaleOf(language: string): string {
  return language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-GB';
}

const withMinus = (s: string): string => s.replace(/-/g, '−');

/** A number with exactly `digits` decimals. */
export function fixed(value: number, digits: number, language: string): string {
  if (!Number.isFinite(value)) return NONE;
  return withMinus(
    value.toLocaleString(localeOf(language), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

/** "1,6 × 10¹²" — a mantissa with `digits` decimals and its power of ten. */
export function scientific(value: number, digits: number, language: string): string {
  if (!Number.isFinite(value)) return NONE;
  if (value === 0) return '0';
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = value / 10 ** exponent;
  // 9.96 written with one decimal is 10.0: carry it into the exponent.
  if (Math.abs(Number(mantissa.toFixed(digits))) >= 10) {
    exponent += 1;
    mantissa /= 10;
  }
  const power = exponent
    .toString()
    .split('')
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join('');
  return `${fixed(mantissa, digits, language)} × 10${power}`;
}

/** A radius or a length: the legend's own formatter, so a table and the
 *  isoline it describes print the same figure. */
export function length(meters: number, language: string): string {
  return formatRange(meters, language);
}

/** Metres to `digits` decimals — thicknesses, heights, amplitudes. */
export function meters(value: number, digits: number, language: string): string {
  if (!Number.isFinite(value)) return NONE;
  return `${fixed(value, digits, language)} m`;
}

export function area(m2: number, language: string): string {
  if (!Number.isFinite(m2) || m2 <= 0) return NONE;
  const km2 = m2 / 1_000_000;
  if (km2 >= 1_000_000) return `${fixed(km2 / 1_000_000, 1, language)} M km²`;
  if (km2 >= 1) return `${fixed(km2, 0, language)} km²`;
  return `${fixed(m2, 0, language)} m²`;
}

/** TNT equivalent, from tonnes to gigatonnes. */
export function tnt(megatons: number, language: string): string {
  if (!Number.isFinite(megatons) || megatons <= 0) return NONE;
  if (megatons < 0.001) return `${fixed(megatons * 1_000_000, 0, language)} t`;
  if (megatons < 1) return `${fixed(megatons * 1_000, 1, language)} kt`;
  if (megatons < 1_000) return `${fixed(megatons, 1, language)} Mt`;
  return `${fixed(megatons / 1_000, 2, language)} Gt`;
}

/** A mass: a tonne is 10³ kg, a kilotonne 10⁶, a megatonne 10⁹, a
 *  gigatonne 10¹², a teratonne 10¹⁵ (B-065). */
export function mass(kg: number, language: string): string {
  if (!Number.isFinite(kg) || kg <= 0) return NONE;
  if (kg >= 1e18) return `${scientific(kg / 1e15, 1, language)} Tt`;
  if (kg >= 1e15) return `${fixed(kg / 1e15, 1, language)} Tt`;
  if (kg >= 1e12) return `${fixed(kg / 1e12, 1, language)} Gt`;
  if (kg >= 1e9) return `${fixed(kg / 1e9, 1, language)} Mt`;
  if (kg >= 1e6) return `${fixed(kg / 1e6, 1, language)} kt`;
  if (kg >= 1_000) return `${fixed(kg / 1_000, 0, language)} t`;
  return `${fixed(kg, 0, language)} kg`;
}

/** Minutes, then hours and minutes: symbols, the same in both languages. */
export function duration(seconds: number, language: string): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return NONE;
  const minutes = seconds / 60;
  if (minutes < 60) return `${fixed(minutes, 0, language)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0
    ? `${fixed(hours, 0, language)} h`
    : `${fixed(hours, 0, language)} h ${fixed(rest, 0, language)} min`;
}

/** A share, with the space before the sign the casualty panel prints. */
export function percent(fraction: number, digits: number, language: string): string {
  if (!Number.isFinite(fraction)) return NONE;
  return `${fixed(fraction * 100, digits, language)} %`;
}

/**
 * A share of the energy, never rounded onto a whole it is not: a body that
 * keeps 0.04 % in the air is not "100 %" to the ground, and printing it so
 * beside "breaks up in the air" read as a contradiction (the astrophysicist's
 * review of 22 September 2026). Whole per cent where that is honest, one
 * decimal near either end, and "> 99.9 %" or "< 0.1 %" beyond.
 */
export function energyShare(fraction: number, language: string): string {
  if (!Number.isFinite(fraction)) return NONE;
  if (fraction <= 0 || fraction >= 1)
    return percent(Math.min(Math.max(fraction, 0), 1), 0, language);
  if (fraction > 0.999) return `> ${fixed(99.9, 1, language)} %`;
  if (fraction < 0.001) return `< ${fixed(0.1, 1, language)} %`;
  const digits = fraction > 0.99 || fraction < 0.01 ? 1 : 0;
  return percent(fraction, digits, language);
}

/** Latitude and longitude with their hemispheres. */
export function coordinates(
  latitude: number,
  longitude: number,
  language: string,
  hemispheres: { north: string; south: string; east: string; west: string }
): string {
  const lat = `${fixed(Math.abs(latitude), 3, language)}° ${latitude >= 0 ? hemispheres.north : hemispheres.south}`;
  const lon = `${fixed(Math.abs(longitude), 3, language)}° ${longitude >= 0 ? hemispheres.east : hemispheres.west}`;
  return `${lat} · ${lon}`;
}

/** When the page was computed, in the reader's calendar, clock and zone. */
export function dateTime(epochMs: number, language: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(dateLocaleOf(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone !== undefined && { timeZone }),
  }).format(epochMs);
}

/** A country's name from its ISO code, in the reader's language, from the
 *  browser's own tables; null where the code is not one. */
export function countryName(code: string, language: string): string | null {
  if (!/^[A-Z]{2}$/.test(code)) return null;
  try {
    return new Intl.DisplayNames([localeOf(language)], { type: 'region' }).of(code) ?? null;
  } catch {
    return null;
  }
}

/** The sixteen points of the compass, as keys of `report.impact.compass`. */
export const COMPASS_POINTS = [
  'n',
  'nne',
  'ne',
  'ene',
  'e',
  'ese',
  'se',
  'sse',
  's',
  'ssw',
  'sw',
  'wsw',
  'w',
  'wnw',
  'nw',
  'nnw',
] as const;

export function compassPoint(bearingDeg: number): (typeof COMPASS_POINTS)[number] {
  const i = Math.round((((bearingDeg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_POINTS[i] ?? 'n';
}

/**
 * People as an order of magnitude: one significant figure behind "≈". The
 * headline of a modelled toll — read as a count when it was printed to two
 * figures (the astrophysicist's review of 22 September 2026).
 */
export function peopleOrder(n: number, language: string): string {
  if (!Number.isFinite(n) || n < 0) return NONE;
  if (n < 1) return '0';
  const magnitude = 10 ** Math.floor(Math.log10(n));
  return `≈ ${(Math.round(n / magnitude) * magnitude).toLocaleString(localeOf(language))}`;
}

/** People, to the two significant figures the casualty panel prints them
 *  with (`formatPeople`): "42", "66 000", never "65 812". */
export function people(n: number, language: string): string {
  if (!Number.isFinite(n) || n < 0) return NONE;
  if (n < 100) return Math.round(n).toLocaleString(localeOf(language));
  const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
  return (Math.round(n / magnitude) * magnitude).toLocaleString(localeOf(language));
}
