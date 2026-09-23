import { beforeAll, describe, expect, it } from 'vitest';
import { EIEP_GRID } from './eiepGrid.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import { LEVEL_A_BARS, LEVEL_A_OPEN, runLevelA, type LevelARun } from './levelA.js';

/**
 * Level A, in every run of the suite: the impact pipeline against the Earth
 * Impact Effects Program on the wide grid (1 782 cases, fixed in 58c599f
 * before the program was asked) and the 83 of the first grid. The bars were
 * written in `levelA.ts` before the answers were read.
 */

const breathe = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('level A: the impact pipeline held to its reference implementation, case by case', () => {
  let run: LevelARun;
  beforeAll(async () => {
    run = await runLevelA([...EIEP_REFERENCE, ...EIEP_GRID], breathe);
  }, 900_000);

  it('reads the wide grid the script fixed, whole', () => {
    expect(EIEP_GRID).toHaveLength(1_782);
    const blocks = new Map<string, number>();
    for (const row of EIEP_GRID) blocks.set(row.block, (blocks.get(row.block) ?? 0) + 1);
    expect(Object.fromEntries(blocks)).toEqual({
      factorial: 1_000,
      crystalline: 270,
      ranges: 80,
      transition: 432,
    });
  });

  it('runs every case the program answered', () => {
    expect(run.modelFailed).toEqual([]);
  });

  it('leaves no reading past the audit bar without its documented difference', () => {
    const open = run.audits.filter((a) => a.difference === null);
    expect(
      open.map(
        (a) =>
          `${a.pair.quantity} ${(a.epsilon * 100).toFixed(1)} % — ${String(a.pair.row.diameterM)} m, ${String(a.pair.row.densityKgM3)} kg/m³, ${String(a.pair.row.velocityKmS)} km/s, ${String(a.pair.row.angleDeg)}°, ${a.pair.row.target}, ${String(a.pair.row.distanceKm)} km`
      )
    ).toEqual([]);
    expect(LEVEL_A_BARS.audit).toBe(0.1);
  });

  it('shows no constant sign that no difference explains', () => {
    for (const s of run.summaries) {
      if (s.constantSign) expect(s.unexplained, s.quantity).toBe(0);
    }
  });

  it('leaves nothing of the 2–10 % band open without the words that say so', () => {
    for (const s of run.summaries) {
      if ((s.explainBy.open ?? 0) > 0)
        expect(
          LEVEL_A_OPEN[s.quantity],
          `${s.quantity} has open readings and no note`
        ).toBeTruthy();
    }
  });

  it('prints its table', () => {
    const rows = run.summaries.map(
      (s) =>
        `| ${s.quantity} | ${String(s.pairs)} | ${s.medianPercent.toFixed(2)} | ${s.p90Percent.toFixed(2)} | ${s.maxPercent.toFixed(1)} | ${String(s.excellent)} | ${String(s.explain)} | ${String(s.audit)} | ${s.constantSign ? 'yes' : 'no'} | ${JSON.stringify(s.explainBy)} |`
    );
    console.log(
      [
        '',
        `level A: ${String(run.cases)} cases, ${String(run.programFailed)} the program failed on, ${String(run.pairs.length)} readings`,
        '| quantity | pairs | median ε % | p90 ε % | max ε % | < 2 % | 2–10 % | > 10 % | constant sign | 2–10 % by cause |',
        '| --- | --: | --: | --: | --: | --: | --: | --: | :-: | --- |',
        ...rows,
      ].join('\n')
    );
    expect(run.pairs.length).toBeGreaterThan(5_000);
  });
});
