import {
  FIELD_JUMP_HALVINGS,
  FIELD_JUMP_MAX_EVALUATIONS,
  FIELD_JUMP_STEEP_DEPTH,
} from './fieldJumpRules.js';

/** What the search of rule 662 found. */
export type FieldSearch =
  | { kind: 'steep'; depth: number; evaluations: number }
  | { kind: 'jump'; depth: number; evaluations: number; at: number }
  | { kind: 'unresolved'; depth: number; evaluations: number; why: string };

/**
 * Rule 662 of `fieldJumpRules.ts`: whether a quantity that moves by more
 * than `threshold` between `lo` and `hi` jumps somewhere between them, or
 * only climbs steeply.
 *
 * Every interval over which the quantity moves by more than the threshold
 * is halved, down to `FIELD_JUMP_HALVINGS` halvings. A continuous quantity
 * stops moving that much over intervals short enough, and the search ends;
 * a jump moves it by its own size over every interval that holds it, and the
 * search reaches the bottom.
 */
export function searchFieldJump(
  value: (x: number) => number,
  lo: number,
  hi: number,
  valueLo: number,
  valueHi: number,
  threshold: number
): FieldSearch {
  let evaluations = 0;
  let depth = 0;
  const stack: [number, number, number, number, number][] = [[lo, valueLo, hi, valueHi, 0]];
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === undefined) break;
    const [a, va, b, vb, level] = top;
    if (!(Math.abs(vb - va) > threshold)) continue;
    depth = Math.max(depth, level);
    if (level === FIELD_JUMP_HALVINGS) return { kind: 'jump', depth, evaluations, at: (a + b) / 2 };
    if (evaluations >= FIELD_JUMP_MAX_EVALUATIONS)
      return { kind: 'unresolved', depth, evaluations, why: 'too many runs' };
    const mid = (a + b) / 2;
    const vm = value(mid);
    evaluations += 1;
    if (!Number.isFinite(vm))
      return { kind: 'unresolved', depth, evaluations, why: `no value at ${String(mid)}` };
    stack.push([mid, vm, b, vb, level + 1], [a, va, mid, vm, level + 1]);
  }
  return depth <= FIELD_JUMP_STEEP_DEPTH
    ? { kind: 'steep', depth, evaluations }
    : { kind: 'unresolved', depth, evaluations, why: `still moving at halving ${String(depth)}` };
}
