import { describe, expect, it } from 'vitest';
import {
  dominates,
  dominatesShipped,
  frontierOf,
  minimaxRegret,
  relativeChange,
  type Objectives,
} from './factorialRules.js';

const o = (peak: number, areas: number, dead: number, quiet: number): Objectives => ({
  peak,
  areas,
  dead,
  quiet,
});
/** The shipped model, as thirteen rounds measured it. */
const SHIPS = o(1.96, 0.934, 204.1, 1195);

describe('rule 490: domination', () => {
  it('needs no worse on all four and better on one', () => {
    expect(dominates(o(1, 1, 1, 1), o(2, 2, 2, 2))).toBe(true);
    expect(dominates(o(1, 2, 2, 2), o(2, 2, 2, 2))).toBe(true);
    expect(dominates(o(2, 2, 2, 2), o(2, 2, 2, 2))).toBe(false);
    // Better on three and worse on one dominates nothing, which is the
    // whole reason this project needed a frontier.
    expect(dominates(o(1, 1, 1, 3), o(2, 2, 2, 2))).toBe(false);
  });

  it('keeps every cell nothing dominates', () => {
    const cells = [
      { key: 'a', objectives: o(1, 4, 1, 1) },
      { key: 'b', objectives: o(4, 1, 1, 1) },
      { key: 'c', objectives: o(2, 5, 2, 2) },
    ];
    const f = frontierOf(cells).map((c) => c.key);
    expect(f).toContain('a');
    expect(f).toContain('b');
    expect(f).not.toContain('c');
  });
});

describe('rule 491: the decision, fixed before the frontier', () => {
  it('(a) adopts only something that is no worse anywhere', () => {
    // The union of rules 483 to 487: better on peak and areas, worse on
    // both toll sets. It must NOT trigger the automatic case.
    const union = o(1.06, 0.319, 232.4, 1847);
    expect(dominatesShipped(SHIPS, union)).toBe(false);
    // And something genuinely better everywhere must.
    expect(dominatesShipped(SHIPS, o(1.0, 0.3, 200, 1100))).toBe(true);
  });

  it('(b) recommends the smallest worst relative change', () => {
    const cells = [
      // better on three, ruinous on one
      { key: 'lopsided', objectives: o(0.5, 0.2, 150, 4000) },
      // slightly worse everywhere, but never by much
      { key: 'balanced', objectives: o(2.0, 0.95, 210, 1230) },
    ];
    expect(minimaxRegret(SHIPS, cells)?.key).toBe('balanced');
  });

  it('breaks a tie by total improvement', () => {
    const a = { key: 'a', objectives: o(1.96, 0.934, 204.1, 1195) };
    const b = { key: 'b', objectives: o(1.5, 0.934, 204.1, 1195) };
    expect(minimaxRegret(SHIPS, [a, b])?.key).toBe('b');
  });

  it('reads an improvement as a negative change', () => {
    const rel = relativeChange(SHIPS, o(1.06, 0.319, 232.4, 1847));
    expect(rel.peak).toBeLessThan(0);
    expect(rel.areas).toBeLessThan(0);
    expect(rel.dead).toBeGreaterThan(0);
    expect(rel.quiet).toBeGreaterThan(0);
  });

  it('says nothing about an empty frontier', () => {
    expect(minimaxRegret(SHIPS, [])).toBeNull();
  });
});
