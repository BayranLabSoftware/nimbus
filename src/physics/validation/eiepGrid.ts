/**
 * Level A's wide grid: the Earth Impact Effects Program's answers on the 1 782
 * cases `scripts/eiep-grid.py` fixed before it was asked (commit 58c599f),
 * read from the program as its authors run it. Written by that script; never
 * edited by hand. Read by tests and by the validation report, never by the
 * browser.
 */
import grid from './eiepGrid.json' with { type: 'json' };
import type { EiepRow } from './eiepReference.js';

export interface EiepGridRow extends EiepRow {
  readonly index: number;
  readonly block: 'factorial' | 'crystalline' | 'ranges' | 'transition';
  /** The rest of what the page states, kept so no later question needs the
   *  program asked again. */
  readonly airblastRadiiM?: readonly number[] | null;
  readonly craterRadiiM?: readonly number[] | null;
  readonly condition?: string | null;
  readonly atmosphericLossJ?: number | null;
  readonly fragmentEllipseM?: readonly number[] | null;
  readonly blastArrivalS?: number | null;
  readonly soundDb?: number | null;
  readonly meltVolumeKm3?: number | null;
  readonly noCrater?: boolean;
}

export const EIEP_GRID_READ_ON: string = grid.readOn;

export const EIEP_GRID: readonly EiepGridRow[] = grid.rows as unknown as readonly EiepGridRow[];
