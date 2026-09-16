import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ashFootprint, DEFAULT_ASH_DEPOSIT_MODEL } from '../events/volcano/ashfall.js';
import { plumeHeight } from '../events/volcano/plumeHeight.js';
import {
  prepareTephra2Deposit,
  tephra2Field,
  tephra2Loading,
} from '../events/volcano/tephra2Fallout.js';
import {
  tephra2HeldOutCases,
  tephra2PointAgrees,
  tephra2Verdict,
  type Tephra2Case,
} from './tephra2Rules.js';

const LOOKED_AT = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../../benchmark/results/tephra2-looked-at-2026-09-16.json', import.meta.url)
    ),
    'utf8'
  )
) as { cases: (Tephra2Case & { program: number[] })[] };

describe("rule 158: Nimbus's forward model against the program", () => {
  it('gives the 1 000 points of the forty eruptions looked at within 1 %', () => {
    let points = 0;
    let aboveZero = 0;
    for (const c of LOOKED_AT.cases) {
      const deposit = prepareTephra2Deposit(c.eruption, c.wind);
      c.points.forEach((p, i) => {
        const program = c.program[i] ?? Number.NaN;
        const model = tephra2Loading(deposit, p.northM, p.eastM, p.elevationM);
        expect(tephra2PointAgrees(model, program), `${c.key} point ${i.toString()}`).toBe(true);
        points++;
        if (program > 0) aboveZero++;
      });
    }
    expect(points).toBe(1_000);
    expect(aboveZero).toBe(666);
  });

  it('sums the same field for points at one elevation', () => {
    const c = LOOKED_AT.cases.find((x) => x.program.some((v) => v > 1e-3));
    expect(c).toBeDefined();
    if (c === undefined) return;
    const deposit = prepareTephra2Deposit(c.eruption, c.wind);
    const field = tephra2Field(deposit, 500);
    for (const p of c.points) {
      expect(field(p.northM, p.eastM)).toBe(tephra2Loading(deposit, p.northM, p.eastM, 500));
    }
  });

  it('is not the default until rule 161 says so', () => {
    expect(DEFAULT_ASH_DEPOSIT_MODEL).toBe('closed-form');
  });

  it("draws the candidate's footprint off the program's deposit", () => {
    const footprint = ashFootprint({
      plumeHeight: plumeHeight({ volumeEruptionRate: 1e5 }),
      totalEjectaVolume: 1e9,
      windSpeed: 10,
      depositModel: 'program',
    });
    expect(footprint.downwindRange as number).toBeGreaterThan(100_000);
    expect(footprint.crosswindHalfWidth as number).toBeGreaterThan(10_000);
    expect(footprint.area as number).toBeCloseTo(
      Math.PI *
        ((footprint.downwindRange as number) / 2) *
        (footprint.crosswindHalfWidth as number),
      0
    );
  });
});

describe('rules 160 and 161', () => {
  it('draws the same forty eruptions every time', () => {
    const cases = tephra2HeldOutCases();
    expect(cases).toHaveLength(40);
    expect(cases.reduce((n, c) => n + c.points.length, 0)).toBe(1_600);
    expect(tephra2HeldOutCases()).toEqual(cases);
    for (const c of cases.slice(0, 24)) {
      const top = c.wind[c.wind.length - 1]?.heightM ?? 0;
      expect(top, c.key).toBeGreaterThan(c.eruption.plumeTopElevationM);
      expect(c.eruption.grainSteps).toBeLessThanOrEqual(100);
      expect(c.eruption.ventElevationM).toBeGreaterThan(0);
    }
  });

  it('agrees within 1 %, and adopts only on enough eruptions and points with none departing', () => {
    expect(tephra2PointAgrees(1.009, 1)).toBe(true);
    expect(tephra2PointAgrees(1.011, 1)).toBe(false);
    expect(tephra2PointAgrees(0, 0)).toBe(true);
    const all = (n: number): boolean[] => Array.from({ length: n }, () => true);
    expect(tephra2Verdict(Array.from({ length: 30 }, () => all(40))).heldOutPasses).toBe(true);
    expect(tephra2Verdict(Array.from({ length: 29 }, () => all(50))).heldOutPasses).toBe(false);
    expect(
      tephra2Verdict([[false, ...all(39)], ...Array.from({ length: 30 }, () => all(40))])
        .heldOutPasses
    ).toBe(false);
  });
});
