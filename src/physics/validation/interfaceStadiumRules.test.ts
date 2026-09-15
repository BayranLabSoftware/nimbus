import { describe, expect, it } from 'vitest';
import type { ContourCell } from './contourLaws.js';
import {
  DEEP_INTERFACE_EARTHQUAKES,
  DEEP_INTERFACE_LISTED,
  DEEP_INTERFACE_UNREADABLE,
  DEEP_INTERFACE_WITHOUT_COVERAGE,
  DEEP_INTERFACE_WITHOUT_MODEL,
} from './deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { isInterfaceEvent } from './interfaceRules.js';
import {
  adoptFromMw75,
  recordedScore,
  STADIUM_CELLS,
  stadiumEligible,
  type RecordedRun,
} from './interfaceStadiumRules.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 40 to 44 of interfaceStadiumRules.ts, before either geometry runs:
 * the set is the one the rules name, and the choice and the adoption do
 * what the rules say.
 */

const cell = (sizeBand: string, bias: number | null): ContourCell => ({
  sizeBand,
  pairs: bias === null ? 0 : 1,
  bias,
  scatter: null,
  invented: 0,
  missed: 0,
});

describe('rule 40: the deep interface set', () => {
  it('holds what the rules say, and none of rule 11’s or rule 23’s earthquakes', () => {
    expect(DEEP_INTERFACE_LISTED).toBe(179);
    expect(DEEP_INTERFACE_EARTHQUAKES).toHaveLength(153);
    expect(DEEP_INTERFACE_WITHOUT_COVERAGE).toHaveLength(23);
    expect(DEEP_INTERFACE_WITHOUT_MODEL).toHaveLength(0);
    expect(DEEP_INTERFACE_UNREADABLE).toHaveLength(0);
    const seen = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
    ]);
    for (const q of DEEP_INTERFACE_EARTHQUAKES) {
      expect(seen.has(q.comcat), q.comcat).toBe(false);
      expect(q.magnitude).toBeGreaterThanOrEqual(6);
      expect(q.magnitude).toBeLessThan(7.5);
      expect(q.depthKm).toBeGreaterThan(40);
      expect(q.depthKm).toBeLessThanOrEqual(70);
    }
  });

  it('classes 64 as interface earthquakes: 43 below Mw 6.5, 42 quiet; 21 from it, 11 quiet', () => {
    const interfaces = DEEP_INTERFACE_EARTHQUAKES.filter(isInterfaceEvent);
    expect(interfaces).toHaveLength(64);
    const below = interfaces.filter((q) => q.magnitude < 6.5);
    const above = interfaces.filter((q) => q.magnitude >= 6.5);
    expect([below.length, below.filter((q) => q.ncei.length === 0).length]).toEqual([43, 42]);
    expect([above.length, above.filter((q) => q.ncei.length === 0).length]).toEqual([21, 11]);
    expect(interfaces.filter((q) => q.stations >= 10)).toHaveLength(9);
  });
});

describe('rule 42: selection on shaking', () => {
  it('reads only the cells below Mw 7.5, and asks a margin of 0.05', () => {
    expect(STADIUM_CELLS).toEqual(['Mw < 6.5', 'Mw 6.5–7.5']);
    const inPlace = [cell('Mw < 6.5', 1), cell('Mw 6.5–7.5', -0.5), cell('Mw ≥ 7.5', 3)];
    // Mean absolute bias 0.75 against 0.70: exactly the margin.
    const candidate = [cell('Mw < 6.5', 0.9), cell('Mw 6.5–7.5', 0.5), cell('Mw ≥ 7.5', 0)];
    expect(stadiumEligible(inPlace, candidate).eligible).toBe(true);
    const short = [cell('Mw < 6.5', 0.95), cell('Mw 6.5–7.5', 0.5), cell('Mw ≥ 7.5', 0)];
    expect(stadiumEligible(inPlace, short).eligible).toBe(false);
  });
});

describe('rule 43: checked on the dead', () => {
  const run = (
    comcat: string,
    sizeBand: string,
    record: number,
    central: number,
    inside: boolean
  ): RecordedRun => ({ comcat, sizeBand, record, central, inside });

  it('scores a recorded toll with both sides plus one, so a zero toll counts', () => {
    expect(recordedScore([run('a', 'Mw < 6.5', 9, 0, false)])).toBeCloseTo(Math.log(10), 12);
    expect(recordedScore([])).toBe(0);
  });

  it('adopts a disc that holds as many records, reads them no worse, and raises no more quiet earthquakes', () => {
    const stadium = [
      run('a', 'Mw < 6.5', 0, 40, false),
      run('b', 'Mw 6.5–7.5', 12, 300, true),
      run('c', 'Mw 6.5–7.5', 0, 5, true),
    ];
    const disc = [
      run('a', 'Mw < 6.5', 0, 2, true),
      run('b', 'Mw 6.5–7.5', 12, 30, true),
      run('c', 'Mw 6.5–7.5', 0, 0, true),
    ];
    expect(
      adoptFromMw75(
        { inPlaceShare: 0.2, candidateShare: 0.05 },
        { inPlace: stadium, candidate: disc }
      )
    ).toEqual({ adopted: true, quiet: true, recorded: true });
    // One record fewer in a cell, and it is not adopted.
    const fewer = disc.map((r) => (r.comcat === 'b' ? { ...r, inside: false } : r));
    expect(
      adoptFromMw75(
        { inPlaceShare: 0.2, candidateShare: 0.05 },
        { inPlace: stadium, candidate: fewer }
      )
    ).toEqual({ adopted: false, quiet: true, recorded: false });
    expect(
      adoptFromMw75(
        { inPlaceShare: 0.05, candidateShare: 0.06 },
        { inPlace: stadium, candidate: disc }
      ).adopted
    ).toBe(false);
  });
});
