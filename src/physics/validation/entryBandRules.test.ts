import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from '../simulate.js';
import { ENTRY_CELLS, entryCellVerdict } from './entryCells.js';
import {
  ENTRY_ALTITUDE_BAND,
  ENTRY_BAND_GROUPS,
  entryAltitudeBand,
  entryBandPercentiles,
  percentileType7,
  type EntryBandRow,
} from './entryBand.js';
import { runFireball } from './fireballRun.js';
import { locateCell } from './measuredCells.js';

/** Rules 739 to 747: the band of an impact's entry altitude. */

/** Rule 740: the rows the band is built on — the fireballs the model bursts
 *  in the air, each with its cell and the model's error (km). */
function bandRows(): EntryBandRow[] {
  return (runFireball().rows.default ?? []).flatMap((row) => {
    if (row.burstKm === null) return [];
    const verdict = locateCell(ENTRY_CELLS, { energy: row.energyKt, speed: row.speedKmS });
    if (!verdict.inside) throw new Error(`${row.date} outside its own cells`);
    return [{ cell: verdict.cell, errorKm: row.observedKm - row.burstKm }];
  });
}

describe('rules 739 to 747: the band of an impact’s entry altitude', () => {
  it('reads a percentile as type 7 does', () => {
    expect(percentileType7([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentileType7([1, 2, 3, 4, 5], 0.05)).toBeCloseTo(1.2, 12);
    expect(percentileType7([5, 1, 4, 2, 3], 0.95)).toBeCloseTo(4.8, 12);
  });

  it('(a) is frozen at the ten numbers the rows give', () => {
    const rows = bandRows();
    // Re-taken under rules 896 to 902 (rule 898(c)): 5 fireballs now reach the ground.
    expect(rows).toHaveLength(351);
    const read = entryBandPercentiles(rows);
    expect(ENTRY_ALTITUDE_BAND.frozenOn).toBe('2026-09-23');
    expect(ENTRY_ALTITUDE_BAND.groups).toHaveLength(ENTRY_BAND_GROUPS.length);
    read.forEach((group, i) => {
      const frozen = ENTRY_ALTITUDE_BAND.groups[i];
      expect(frozen?.rows, group.name).toBe(group.rows);
      expect(frozen?.lowKm, group.name).toBeCloseTo(group.lowKm, 9);
      expect(frozen?.highKm, group.name).toBeCloseTo(group.highKm, 9);
    });
    expect(read.map((g) => g.rows).reduce((a, b) => a + b, 0)).toBe(351);
  });

  it('(a) bands a burst inside every cell, and nothing else', () => {
    const KT = 4.184e12;
    for (const [cell, energyKt, speedKmS] of [
      [0, 0.1, 12],
      [1, 0.1, 20],
      [2, 1, 12],
      [3, 1, 20],
      [4, 10, 12],
      [5, 10, 20],
    ] as const) {
      const verdict = entryCellVerdict({
        kineticEnergy: energyKt * KT,
        impactVelocity: speedKmS * 1_000,
        impactorDensity: 3_000,
        impactAngle: Math.PI / 4,
      });
      expect(verdict.inside && verdict.cell).toBe(cell);
      const group =
        ENTRY_ALTITUDE_BAND.groups[ENTRY_BAND_GROUPS.findIndex((g) => g.cells.includes(cell))];
      const band = entryAltitudeBand(verdict, 40_000, true);
      expect(band?.low).toBeCloseTo(Math.max(0, 40_000 + (group?.lowKm ?? NaN) * 1_000), 6);
      expect(band?.high).toBeCloseTo(Math.max(0, 40_000 + (group?.highKm ?? NaN) * 1_000), 6);
      expect(entryAltitudeBand(verdict, 40_000, false)).toBeNull();
    }
    // Outside the cells, no band: every preset lies outside.
    for (const preset of Object.values(IMPACT_PRESETS)) {
      expect(simulateImpact(preset.input).entryAltitudeBand).toBeNull();
    }
  });

  it('(a) carries it in the result, beside the altitude it bands', () => {
    // A 1 kt stone at 20 km/s: inside the cell of 70 fireballs, a burst.
    const r = simulateImpact({
      impactorDiameter: 2.37,
      impactVelocity: 20_000,
      impactorDensity: 3_000,
      targetDensity: 2_500,
      impactAngle: Math.PI / 4,
    } as never);
    expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(r.entryAltitudeBand).toEqual(
      entryAltitudeBand(r.measuredCells.entry, r.entry.burstAltitude, true)
    );
    expect(r.entryAltitudeBand).not.toBeNull();
  });
});
