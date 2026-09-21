/**
 * G4's machinery (docs/GOLD_STANDARD.md): the cells a held-out set measured,
 * and where a scenario lies among them. Rules 722 to 729 of
 * `entryCellsRules.ts`; generic, and first used for an impact's entry
 * (`entryCells.ts`).
 *
 * A set of cells is a few named axes, each cut at ascending edges: the first
 * edge is the least the set holds on that axis and the last the greatest, and
 * those between cut it into bins, each from its lower edge up to the next, the
 * topmost closed at the top. Crossing the axes gives the cells, and each holds
 * the rows of the set that fall in it. The rows were run under conditions — a
 * composition, a strength — and a scenario that breaks one lies outside every
 * cell however its axes read.
 */

export interface CellAxis {
  /** What the axis reads, as a verdict names it (e.g. `energy`). */
  readonly key: string;
  /** The unit its edges are in. */
  readonly unit: string;
  /** Ascending, at least two: the set's least, the cuts, the set's greatest. */
  readonly edges: readonly number[];
}

export interface MeasuredCells {
  /** The quantity the set measured, and the rule it was measured under. */
  readonly quantity: string;
  readonly axes: readonly CellAxis[];
  /** The rows each cell holds, the first axis varying slowest. */
  readonly rows: readonly number[];
  /** G2 scores a cell alone from this many rows (docs/GOLD_STANDARD.md). */
  readonly scoredFrom: number;
}

/** What puts a scenario outside every cell. */
export type CellOutside =
  | {
      readonly kind: 'axis';
      readonly key: string;
      readonly value: number;
      readonly side: 'below' | 'above';
      /** The set's least on that axis (below) or its greatest (above). */
      readonly bound: number;
    }
  | { readonly kind: 'condition'; readonly key: string };

export type CellVerdict =
  | {
      readonly inside: true;
      /** The cell's index in {@link MeasuredCells.rows}. */
      readonly cell: number;
      /** The bin on each axis, in the order of the axes. */
      readonly bins: readonly number[];
      readonly rows: number;
      /** Whether the cell holds the rows G2 scores a cell alone from. */
      readonly scored: boolean;
    }
  | { readonly inside: false; readonly outside: CellOutside };

/** A condition the set's rows were run under, and whether a scenario keeps
 *  it. */
export interface CellCondition {
  readonly key: string;
  readonly holds: boolean;
}

/** The bin of `value` on `axis`, or the side of the set's span it lies on; a
 *  value that is not a number lies below it. */
function binOf(axis: CellAxis, value: number): number | 'below' | 'above' {
  const edges = axis.edges;
  const least = edges[0] ?? Number.NaN;
  const greatest = edges[edges.length - 1] ?? Number.NaN;
  if (!(value >= least)) return 'below';
  if (!(value <= greatest)) return 'above';
  let bin = 0;
  while (bin < edges.length - 2 && value >= (edges[bin + 1] ?? Number.POSITIVE_INFINITY)) bin++;
  return bin;
}

/**
 * Rule 722: where a scenario lies among the cells. The axes are read first,
 * in their order, then the conditions in theirs; the first that puts the
 * scenario out is the one the verdict names.
 */
export function locateCell(
  cells: MeasuredCells,
  point: Readonly<Record<string, number>>,
  conditions: readonly CellCondition[] = []
): CellVerdict {
  const bins: number[] = [];
  for (const axis of cells.axes) {
    const value = point[axis.key] ?? Number.NaN;
    const bin = binOf(axis, value);
    if (bin === 'below' || bin === 'above') {
      const edges = axis.edges;
      const bound = (bin === 'below' ? edges[0] : edges[edges.length - 1]) ?? Number.NaN;
      return { inside: false, outside: { kind: 'axis', key: axis.key, value, side: bin, bound } };
    }
    bins.push(bin);
  }
  for (const condition of conditions) {
    if (!condition.holds) {
      return { inside: false, outside: { kind: 'condition', key: condition.key } };
    }
  }
  let cell = 0;
  cells.axes.forEach((axis, i) => {
    cell = cell * (axis.edges.length - 1) + (bins[i] ?? 0);
  });
  const rows = cells.rows[cell] ?? 0;
  return { inside: true, cell, bins, rows, scored: rows >= cells.scoredFrom };
}

/** The span of a cell on each axis: from its lower edge to its upper. */
export function cellSpans(
  cells: MeasuredCells,
  bins: readonly number[]
): { key: string; unit: string; from: number; to: number }[] {
  return cells.axes.map((axis, i) => {
    const bin = bins[i] ?? 0;
    return {
      key: axis.key,
      unit: axis.unit,
      from: axis.edges[bin] ?? Number.NaN,
      to: axis.edges[bin + 1] ?? Number.NaN,
    };
  });
}

/** The bins of every cell, in the order of {@link MeasuredCells.rows}. */
export function everyCell(cells: MeasuredCells): number[][] {
  let out: number[][] = [[]];
  for (const axis of cells.axes) {
    const next: number[][] = [];
    for (const prefix of out) {
      for (let bin = 0; bin < axis.edges.length - 1; bin++) next.push([...prefix, bin]);
    }
    out = next;
  }
  return out;
}
