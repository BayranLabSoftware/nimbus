import { CHONDRITIC_DENSITY } from '../constants.js';
import { locateCell, type CellVerdict, type MeasuredCells } from './measuredCells.js';

/**
 * I2's cells (rules 722 to 729 of `entryCellsRules.ts`): where the altitude at
 * which an impact's entry spends the body's energy was measured, on the 357
 * bolides of rules 76 to 79 (`fireballSetData.ts`). Rule 78's axes crossed,
 * closed at the set's least and greatest; `entryCells.test.ts` recomputes
 * every edge and count from the set.
 */
export const ENTRY_CELLS: MeasuredCells = {
  quantity: 'the altitude the entry spends its energy at (I2)',
  axes: [
    { key: 'energy', unit: 'kt', edges: [0.048, 0.3, 3, 49] },
    { key: 'speed', unit: 'km/s', edges: [9.8, 17, 71.1] },
  ],
  rows: [96, 104, 59, 70, 13, 15],
  scoredFrom: 20,
};

/** Rule 723: the span of angles from the horizontal the rows were run at
 *  (degrees), widened outward by less than 1e-4 of a degree. */
export const ENTRY_CELLS_ANGLE_DEG = { least: 0.6793, greatest: 88.3514 } as const;

/** Rule 723: the body the rows were run as. */
export const ENTRY_CELLS_DENSITY = CHONDRITIC_DENSITY as number;

/** What rule 724 reads of a scenario. */
export interface EntryCellInput {
  /** Joules. */
  kineticEnergy: number;
  /** m/s. */
  impactVelocity: number;
  /** kg/m³. */
  impactorDensity: number;
  /** Pa; undefined where the scenario names none. */
  impactorStrength?: number | undefined;
  /** Radians from the horizontal. */
  impactAngle: number;
}

/** Rule 724: where a scenario lies among I2's cells. */
export function entryCellVerdict(input: EntryCellInput): CellVerdict {
  const angleDeg = (input.impactAngle * 180) / Math.PI;
  return locateCell(
    ENTRY_CELLS,
    { energy: input.kineticEnergy / 4.184e12, speed: input.impactVelocity / 1_000 },
    [
      { key: 'density', holds: input.impactorDensity === ENTRY_CELLS_DENSITY },
      { key: 'strength', holds: input.impactorStrength === undefined },
      {
        key: 'angle',
        holds:
          angleDeg >= ENTRY_CELLS_ANGLE_DEG.least && angleDeg <= ENTRY_CELLS_ANGLE_DEG.greatest,
      },
    ]
  );
}
