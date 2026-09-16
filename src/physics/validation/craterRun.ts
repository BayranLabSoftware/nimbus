import {
  BOOK_CONTACT_CRATER_FT,
  bookCraterCoefficient,
  bookCraterDepthM,
  CRATER_YIELD_EXPONENT,
  FOOT_M,
  type BookCraterMedium,
} from '../effects/nuclearCrater.js';
import { NUCLEAR_CRATER_COEFFICIENT } from '../events/explosion/cratering.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
  type ExplosionGroundType,
  type ExplosionScenarioInput,
} from '../events/explosion/simulate.js';
import {
  chooseCraterCoefficients,
  CRATER_MEDIUM_OF,
  CRATER_SET_ON_A_MEASUREMENT,
  type CraterNumberChecks,
} from './craterRules.js';

/**
 * Rules 90 to 93 of craterRules.ts, run: the book's printed numbers checked as
 * rule 90 asks, each ground type's coefficient before and after, the crater of
 * every explosion preset both ways, and rule 92's choice. One computation for
 * the script that first runs them, the report that prints them and the test
 * that keeps the report honest about them.
 */

const KILOTONS_PER_MEGATON = 1_000;

/** The order the project's five ground types stand in, narrowest crater
 *  first — rule 92 asks that whatever is adopted keep it. */
const ORDER: readonly ExplosionGroundType[] = [
  'HARD_ROCK',
  'DRY_SOIL',
  'FIRM_GROUND',
  'WET_SOIL',
  'CLAY',
];

/** Rule 90's checks, read from the module itself. */
export function craterNumberChecks(): CraterNumberChecks {
  const printed: Readonly<Record<BookCraterMedium, [number, number]>> = {
    wetSoilOrSoftRock: [82, 31],
    drySoilOrSoftRock: [61, 28],
    wetHardRock: [58, 28],
    dryHardRock: [49, 22],
  };
  const eight = (Object.keys(printed) as BookCraterMedium[]).every((medium) => {
    const want = printed[medium];
    const got = BOOK_CONTACT_CRATER_FT[medium];
    return got.radius === want[0] && got.depth === want[1];
  });
  // The book's own worked example: 270 feet at 20 kt scales by 2.46 both ways.
  const exponent = Math.abs(20 ** CRATER_YIELD_EXPONENT - 2.46) < 0.005;
  const radii = (Object.keys(printed) as BookCraterMedium[]).map(
    (medium) => BOOK_CONTACT_CRATER_FT[medium].radius
  );
  const ordered = radii.every((r, i) => i === 0 || r < (radii[i - 1] ?? Infinity));
  return { eight, exponent, ordered };
}

export interface CraterCoefficientRow {
  groundType: ExplosionGroundType;
  /** The book's medium it is read as, or null where the book has none. */
  medium: BookCraterMedium | null;
  mediumName: string;
  inPlace: number;
  /** What the book's number would make it, or null where rule 91 has none. */
  book: number | null;
  /** What is adopted for this ground type. */
  adopted: number;
  /** Why it was not replaced, where it was not. */
  kept: string | null;
  /** The book's crater depth for this medium at 1 kt (m); the product draws
   *  none, and this decides nothing. */
  depthAt1KtM: number | null;
}

export function craterCoefficientRows(): CraterCoefficientRow[] {
  return ORDER.map((groundType) => {
    const medium = CRATER_MEDIUM_OF[groundType] ?? null;
    const inPlace = NUCLEAR_CRATER_COEFFICIENT[groundType];
    const book = medium === null ? null : bookCraterCoefficient(medium);
    const measured = CRATER_SET_ON_A_MEASUREMENT.includes(groundType);
    const kept =
      medium === null
        ? 'the book has no such medium (rule 91)'
        : measured
          ? 'set on the Bravo and Mike craters, four decades above the figure (rule 92 d)'
          : null;
    return {
      groundType,
      medium,
      mediumName: medium === null ? '—' : BOOK_CONTACT_CRATER_FT[medium].name,
      inPlace,
      book,
      adopted: kept === null && book !== null ? book : inPlace,
      kept,
      depthAt1KtM: medium === null ? null : BOOK_CONTACT_CRATER_FT[medium].depth * FOOT_M,
    };
  });
}

export interface CraterPresetRow {
  name: string;
  yieldKt: number;
  groundType: ExplosionGroundType;
  inPlaceM: number;
  adoptedM: number;
  /** The book's own depth at this yield and medium (m), deciding nothing. */
  bookDepthM: number | null;
}

/** Rule 93: every preset that digs a crater, before and after. */
export function craterPresetRows(rows: readonly CraterCoefficientRow[]): CraterPresetRow[] {
  const adoptedOf = new Map(rows.map((r) => [r.groundType, r.adopted]));
  return Object.values(EXPLOSION_PRESETS)
    .map((preset) => {
      const input: ExplosionScenarioInput = preset.input;
      const groundType: ExplosionGroundType = input.groundType ?? 'FIRM_GROUND';
      const yieldKt = input.yieldMegatons * KILOTONS_PER_MEGATON;
      const inPlaceM = simulateExplosion(input).crater.apparentDiameter as number;
      const factor =
        (adoptedOf.get(groundType) ?? NUCLEAR_CRATER_COEFFICIENT[groundType]) /
        NUCLEAR_CRATER_COEFFICIENT[groundType];
      const medium = CRATER_MEDIUM_OF[groundType] ?? null;
      return {
        name: preset.name,
        yieldKt,
        groundType,
        inPlaceM,
        adoptedM: inPlaceM * factor,
        bookDepthM: medium === null ? null : bookCraterDepthM(medium, yieldKt),
      };
    })
    .filter((row) => row.inPlaceM > 0);
}

export interface CraterRunResult {
  numbers: CraterNumberChecks;
  coefficients: CraterCoefficientRow[];
  presets: CraterPresetRow[];
  worstMove: number;
  orderSurvives: boolean;
  decision: ReturnType<typeof chooseCraterCoefficients>;
  /** Rule 93, beside: what the book's wet-soil number would make of the two
   *  craters the project's was set on (m of diameter). */
  bikini: { name: string; yieldKt: number; inPlaceM: number; bookM: number }[];
}

export function runCrater(gatePasses = true): CraterRunResult {
  const numbers = craterNumberChecks();
  const coefficients = craterCoefficientRows();
  let worstMove = 1;
  for (const row of coefficients) {
    if (row.kept !== null || row.book === null) continue;
    const ratio = row.book / row.inPlace;
    if (Math.abs(Math.log(ratio)) > Math.abs(Math.log(worstMove))) worstMove = ratio;
  }
  const adopted = coefficients.map((r) => r.adopted);
  const orderSurvives = adopted.every((v, i) => i === 0 || v >= (adopted[i - 1] ?? 0));
  const wet = bookCraterCoefficient('wetSoilOrSoftRock');
  const bikini = Object.values(EXPLOSION_PRESETS)
    .filter((preset) => preset.input.groundType === 'WET_SOIL')
    .map((preset) => {
      const yieldKt = preset.input.yieldMegatons * KILOTONS_PER_MEGATON;
      return {
        name: preset.name,
        yieldKt,
        inPlaceM: simulateExplosion(preset.input).crater.apparentDiameter,
        bookM: wet * yieldKt ** CRATER_YIELD_EXPONENT,
      };
    });
  return {
    numbers,
    coefficients,
    presets: craterPresetRows(coefficients),
    worstMove,
    orderSurvives,
    decision: chooseCraterCoefficients({ numbers, gatePasses, worstMove, orderSurvives }),
    bikini,
  };
}
