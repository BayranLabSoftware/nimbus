import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ENTRY_CELLS } from './entryCells.js';
import { readEntryCells, anchorRowOf, type EiepFireball } from './entryCellsReading.js';
import { fireballAnchorVerdict } from './fireballAnchorRules.js';
import { runFireball } from './fireballRun.js';

/** Rule 727 (c): the report's cells add up to the whole. */

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const EIEP = (
  JSON.parse(
    readFileSync(join(ROOT, 'benchmark/results/eiep-fireballs-2026-09-16.json'), 'utf8')
  ) as { rows: EiepFireball[] }
).rows;

describe('rule 726: I2 read cell by cell', () => {
  // Read against the program's answers, which run on Eq. 9: pinned to it,
  // as level A is (rule 898(a)).
  const rows = runFireball('density').rows.default ?? [];
  const cells = readEntryCells(rows, EIEP);

  it('(c) holds every fireball once, in the cells rule 723 counted', () => {
    expect(cells.map((c) => c.rows)).toEqual([...ENTRY_CELLS.rows]);
    expect(cells.reduce((sum, c) => sum + c.rows, 0)).toBe(357);
    expect(cells.filter((c) => c.scored)).toHaveLength(4);
  });

  it('(c) adds the agreement up to what rules 126 to 128 print for the set', () => {
    const byDate = new Map(EIEP.map((e) => [e.date, e]));
    const whole = fireballAnchorVerdict(
      rows.map((r) => {
        const answer = byDate.get(r.date);
        if (answer === undefined) throw new Error(r.date);
        return anchorRowOf(r, answer);
      })
    );
    expect(whole.counts).toEqual({ within: 352, bm13: 4, departs: 0, regime: 0, unanswered: 1 });
    expect(whole.met).toBe(true);
    for (const key of ['within', 'bm13', 'departs', 'regime', 'unanswered'] as const) {
      expect(cells.reduce((sum, c) => sum + c.anchor.counts[key], 0)).toBe(whole.counts[key]);
    }
  });
});
