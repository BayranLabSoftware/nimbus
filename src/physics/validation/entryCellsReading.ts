import { ENTRY_CELLS } from './entryCells.js';
import {
  burstOnProgramIfKm,
  fireballAnchorVerdict,
  type FireballAnchorRow,
  type FireballAnchorVerdict,
  type FireballSent,
} from './fireballAnchorRules.js';
import type { FireballRow } from './fireballRun.js';
import { cellSpans, everyCell, locateCell } from './measuredCells.js';

/**
 * Rule 726 of `entryCellsRules.ts`: I2 read cell by cell, for the report. In
 * each of the six cells, the model's burst altitude and the program's against
 * the sky, and rules 126 to 128 — the agreement and the verdict — on the
 * fireballs that fall there.
 */

/** One fireball as `scripts/eiep-fireballs.py` brought it back
 *  (`benchmark/results/eiep-fireballs-2026-09-16.json`). */
export interface EiepFireball {
  date: string;
  sent: FireballSent;
  error: string | null;
  observedKm: number;
  eiepBurstKm: number | null;
}

export interface EntryCellReading {
  bins: number[];
  spans: { key: string; unit: string; from: number; to: number }[];
  rows: number;
  /** Whether G2 scores the cell alone. */
  scored: boolean;
  /** Rules 126 to 128 on the cell's fireballs. */
  anchor: FireballAnchorVerdict;
}

/** Rule 126's row for one fireball: the model as it runs now, the program as
 *  it answered. */
export function anchorRowOf(row: FireballRow, eiep: EiepFireball): FireballAnchorRow {
  return {
    date: row.date,
    observedKm: row.observedKm,
    nimbusBurstKm: row.burstKm,
    eiepBurstKm: eiep.eiepBurstKm,
    eiepError: eiep.error,
    nimbusOnEiepIfKm: burstOnProgramIfKm(eiep.sent),
  };
}

/** Rule 726: the six cells, each read on the fireballs that fall in it. The
 *  model's rows are rule 77's default body; every one must have the program's
 *  answer beside it. */
export function readEntryCells(
  rows: readonly FireballRow[],
  eiep: readonly EiepFireball[]
): EntryCellReading[] {
  const byDate = new Map(eiep.map((e) => [e.date, e]));
  const inCell = new Map<number, FireballAnchorRow[]>();
  for (const row of rows) {
    const answer = byDate.get(row.date);
    if (answer === undefined) throw new Error(`no answer of the program for ${row.date}`);
    const verdict = locateCell(ENTRY_CELLS, { energy: row.energyKt, speed: row.speedKmS });
    if (!verdict.inside) throw new Error(`fireball ${row.date} outside its own cells`);
    const list = inCell.get(verdict.cell) ?? [];
    list.push(anchorRowOf(row, answer));
    inCell.set(verdict.cell, list);
  }
  return everyCell(ENTRY_CELLS).map((bins, cell) => {
    const list = inCell.get(cell) ?? [];
    return {
      bins,
      spans: cellSpans(ENTRY_CELLS, bins),
      rows: list.length,
      scored: list.length >= ENTRY_CELLS.scoredFrom,
      anchor: fireballAnchorVerdict(list),
    };
  });
}
