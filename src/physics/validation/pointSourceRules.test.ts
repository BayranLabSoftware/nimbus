import { describe, expect, it } from 'vitest';
import type { ContourCell } from './contourLaws.js';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { isInterfaceEvent } from './interfaceRules.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import {
  adoptPointSourceDistance,
  choosePointSourceInterfaceLaw,
  isLeastModelled,
  POINT_SOURCE_CELLS,
  POINT_SOURCE_SEEN,
  pointSourceEligible,
} from './pointSourceRules.js';
import {
  POINT_SOURCE_EARTHQUAKES,
  POINT_SOURCE_LISTED,
  POINT_SOURCE_UNREADABLE,
  POINT_SOURCE_WITHOUT_COVERAGE,
  POINT_SOURCE_WITHOUT_MODEL,
} from './pointSourceSetData.js';
import { POINT_SOURCE_SITES } from './pointSourceSiteData.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 50 to 55 of pointSourceRules.ts, before the candidate runs: the set
 * is the one the rules name, and the choices and the adoptions do what the
 * rules say.
 */

const cell = (sizeBand: string, bias: number | null): ContourCell => ({
  sizeBand,
  pairs: bias === null ? 0 : 1,
  bias,
  scatter: null,
  invented: 0,
  missed: 0,
});

const byCell = (rows: readonly { magnitude: number }[]): number[] => [
  rows.filter((q) => q.magnitude < 6.5).length,
  rows.filter((q) => q.magnitude >= 6.5 && q.magnitude < 7.5).length,
  rows.filter((q) => q.magnitude >= 7.5).length,
];

describe('rule 50: the set of 2000 to 2007', () => {
  it('holds what the rule says, and no earthquake read before', () => {
    expect(POINT_SOURCE_LISTED).toBe(445);
    expect(POINT_SOURCE_EARTHQUAKES).toHaveLength(421);
    expect(POINT_SOURCE_WITHOUT_COVERAGE).toHaveLength(16);
    expect(POINT_SOURCE_WITHOUT_MODEL).toHaveLength(0);
    expect(POINT_SOURCE_UNREADABLE).toHaveLength(0);
    expect(POINT_SOURCE_SEEN).toHaveLength(8);
    const earlier = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
      ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
      ...MODERATE_EARTHQUAKES.map((q) => q.comcat),
      ...POINT_SOURCE_SEEN.map((s) => s.comcat),
    ]);
    for (const q of POINT_SOURCE_EARTHQUAKES) {
      expect(earlier.has(q.comcat), q.comcat).toBe(false);
      expect(q.magnitude).toBeGreaterThanOrEqual(6);
      expect(q.depthKm).toBeLessThanOrEqual(40);
      expect(q.time >= '2000-01-01' && q.time < '2008-01-01', q.time).toBe(true);
      expect(q.revision.startsWith('4.0.2+'), q.revision).toBe(true);
    }
  });

  it('counts 241, 154 and 26 by cell; 86, 70 and 10 interface; 20, 32 and 8 least modelled', () => {
    expect(byCell(POINT_SOURCE_EARTHQUAKES)).toEqual([241, 154, 26]);
    expect(byCell(POINT_SOURCE_EARTHQUAKES.filter(isInterfaceEvent))).toEqual([86, 70, 10]);
    expect(byCell(POINT_SOURCE_EARTHQUAKES.filter(isLeastModelled))).toEqual([20, 32, 8]);
  });

  it('has the browser’s ground under every earthquake', () => {
    expect(POINT_SOURCE_SITES.map((s) => s.key)).toEqual(
      POINT_SOURCE_EARTHQUAKES.map((q) => q.comcat)
    );
  });
});

describe('rule 52: selection on shaking', () => {
  it('reads the cells below Mw 7.5, asks 0.05 in both readings and no loss on the least modelled maps', () => {
    expect(POINT_SOURCE_CELLS).toEqual(['Mw < 6.5', 'Mw 6.5–7.5']);
    const inPlace = [cell('Mw < 6.5', 1), cell('Mw 6.5–7.5', -0.5), cell('Mw ≥ 7.5', 3)];
    // 0.75 against 0.70 below Mw 7.5: exactly the margin; the ≥ 7.5 cell is not read.
    const candidate = [cell('Mw < 6.5', 0.9), cell('Mw 6.5–7.5', 0.5), cell('Mw ≥ 7.5', 0)];
    const same = { inPlace, candidate };
    expect(pointSourceEligible({ rock: same, ground: same }, { rock: same, ground: same })).toEqual(
      expect.objectContaining({ eligible: true })
    );
    const short = { inPlace, candidate: [cell('Mw < 6.5', 0.95), cell('Mw 6.5–7.5', 0.5)] };
    expect(
      pointSourceEligible({ rock: same, ground: short }, { rock: same, ground: same }).eligible
    ).toBe(false);
    // Better on every map, worse on the least modelled ones: not eligible.
    const worseThere = { inPlace, candidate: [cell('Mw < 6.5', 1.2), cell('Mw 6.5–7.5', 0.5)] };
    expect(
      pointSourceEligible({ rock: same, ground: same }, { rock: same, ground: worseThere }).eligible
    ).toBe(false);
  });
});

describe('rules 53 and 54: checked on the dead', () => {
  const inPlace = [{ bias: 1.46 }, { bias: 0.33 }, { bias: 1.94 }];
  it('is rule 38’s test: no larger log bias, eight in ten in every cell, no more quiet raised', () => {
    const winner = [
      { bias: 1.3, inside: 9, rows: 10 },
      { bias: 0.6, inside: 8, rows: 10 },
      { bias: 1.9, inside: 10, rows: 10 },
    ];
    expect(
      adoptPointSourceDistance({ inPlace, winner }, { inPlaceShare: 0.03, winnerShare: 0.03 })
    ).toEqual({ adopted: true, tolls: true, quiet: true });
    expect(
      adoptPointSourceDistance({ inPlace, winner }, { inPlaceShare: 0.03, winnerShare: 0.031 })
        .adopted
    ).toBe(false);
    const fewer = winner.map((c, i) => (i === 1 ? { ...c, inside: 7 } : c));
    expect(
      adoptPointSourceDistance({ inPlace, winner: fewer }, { inPlaceShare: 0.03, winnerShare: 0 })
    ).toEqual({ adopted: false, tolls: false, quiet: true });
  });
});

describe('rule 54: the interface models', () => {
  it('asks 0.05 over the three cells in both readings, and takes the lower sum', () => {
    const inPlace = [{ bias: 1 }, { bias: 1 }, { bias: 1 }];
    const reading = (parker: number, bcHydro: number) => ({
      inPlace,
      candidates: {
        parker2022Interface: [{ bias: parker }, { bias: parker }, { bias: parker }],
        abrahamson2016Interface: [{ bias: bcHydro }, { bias: bcHydro }, { bias: bcHydro }],
      },
    });
    const both = choosePointSourceInterfaceLaw({
      rock: reading(0.6, 0.5),
      ground: reading(0.6, 0.8),
    });
    expect(both.eligible).toEqual(['parker2022Interface', 'abrahamson2016Interface']);
    // Parker 1.2 against BC Hydro 1.3.
    expect(both.winner).toBe('parker2022Interface');
    const one = choosePointSourceInterfaceLaw({
      rock: reading(0.96, 0.5),
      ground: reading(0.6, 0.8),
    });
    expect(one.eligible).toEqual(['abrahamson2016Interface']);
    expect(
      choosePointSourceInterfaceLaw({ rock: reading(0.96, 0.99), ground: reading(0.6, 0.8) }).winner
    ).toBeNull();
  });
});
