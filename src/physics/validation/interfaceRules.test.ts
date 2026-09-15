import { describe, expect, it } from 'vitest';
import {
  adoptInterfaceLaw,
  chooseInterfaceLaw,
  INTERFACE_LAWS,
  INTERFACE_READINGS,
  isInterfaceEvent,
  type InterfaceLaw,
  type InterfaceReading,
} from './interfaceRules.js';
import {
  INTERFACE_CLASSES,
  INTERFACE_WITHOUT_INFO,
  INTERFACE_WITHOUT_MODEL,
} from './interfaceSetData.js';
import { RULE_SHAKEMAPS } from './ruleShakemapData.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 35 to 39 of interfaceRules.ts, before either candidate runs: the
 * set is the one the rules name, and the choice and the adoption do what
 * the rules say.
 */

type Scores = Record<InterfaceReading, Record<InterfaceLaw, { bias: number | null }[]>>;

/** Every reading with the same mean absolute bias per law, changed where
 *  asked. */
function scores(
  base: Record<InterfaceLaw, number>,
  change: Partial<Record<InterfaceReading, Partial<Record<InterfaceLaw, number>>>> = {}
): Scores {
  return Object.fromEntries(
    INTERFACE_READINGS.map((reading) => [
      reading,
      Object.fromEntries(
        INTERFACE_LAWS.map((law) => [law, [{ bias: change[reading]?.[law] ?? base[law] }]])
      ),
    ])
  ) as Scores;
}

describe('rule 35: the interface set', () => {
  it('holds every map of both sets but the ones listed as unreadable', () => {
    const listed = new Set([...INTERFACE_WITHOUT_INFO, ...INTERFACE_WITHOUT_MODEL]);
    const rule11 = INTERFACE_CLASSES.filter((c) => c.set === 'rule11').map((c) => c.comcat);
    const rule23 = INTERFACE_CLASSES.filter((c) => c.set === 'rule23').map((c) => c.comcat);
    expect(new Set(rule11).size).toBe(rule11.length);
    expect(new Set(rule23).size).toBe(rule23.length);
    expect(RULE_SHAKEMAPS.filter((s) => !listed.has(s.comcat)).map((s) => s.comcat)).toEqual(
      rule11
    );
    expect(UNSEEN_EARTHQUAKES.filter((q) => !listed.has(q.comcat)).map((q) => q.comcat)).toEqual(
      rule23
    );
  });

  it('classes 98 of rule 11’s maps and 353 of rule 23’s as interface events', () => {
    const count = (set: 'rule11' | 'rule23'): number =>
      INTERFACE_CLASSES.filter((c) => c.set === set && isInterfaceEvent(c)).length;
    expect(count('rule11')).toBe(98);
    expect(count('rule23')).toBe(353);
    expect(isInterfaceEvent({ interfaceWeight: 0.5 })).toBe(true);
    expect(isInterfaceEvent({ interfaceWeight: 0.4999 })).toBe(false);
  });
});

describe('rule 37: selection on shaking', () => {
  it('keeps Boore et al. 2014 unless a candidate beats it by 0.05 in every reading', () => {
    const base = { boore2014: 0.6, abrahamson2016Interface: 0.5, parker2022Interface: 0.58 };
    expect(chooseInterfaceLaw(scores(base)).winner).toBe('abrahamson2016Interface');
    // One reading short of the margin, and it is not eligible.
    const short = chooseInterfaceLaw(
      scores(base, { rule23Ground: { abrahamson2016Interface: 0.56 } })
    );
    expect(short.eligible).toEqual([]);
    expect(short.winner).toBe('boore2014');
  });

  it('counts a margin of exactly 0.05, and picks the lower sum when both are eligible', () => {
    const exact = chooseInterfaceLaw(
      scores({ boore2014: 0.55, abrahamson2016Interface: 0.5, parker2022Interface: 0.9 })
    );
    expect(exact.eligible).toEqual(['abrahamson2016Interface']);
    const both = chooseInterfaceLaw(
      scores(
        { boore2014: 1, abrahamson2016Interface: 0.7, parker2022Interface: 0.8 },
        { rule11Rock: { parker2022Interface: 0.1 } }
      )
    );
    expect(both.eligible).toEqual(['abrahamson2016Interface', 'parker2022Interface']);
    // Parker's four: 0.1 + 0.8 × 3 = 2.5; Abrahamson's 0.7 × 4 = 2.8.
    expect(both.winner).toBe('parker2022Interface');
  });

  it('reads a law with no scored pairs as never better', () => {
    const table = scores({
      boore2014: 0.6,
      abrahamson2016Interface: 0.3,
      parker2022Interface: 0.9,
    });
    table.rule11Rock.abrahamson2016Interface = [{ bias: null }];
    const empty = chooseInterfaceLaw(table);
    expect(empty.meanAbsoluteBias.rule11Rock.abrahamson2016Interface).toBe(
      Number.POSITIVE_INFINITY
    );
    expect(empty.winner).toBe('boore2014');
  });
});

describe('rule 38: checked on the dead', () => {
  const inPlace = [{ bias: 2 }, { bias: 0.5 }, { bias: null }];
  it('adopts a winner that does no worse on the tolls and raises no more quiet earthquakes', () => {
    const winner = [
      { bias: 1.5, inside: 9, rows: 10 },
      { bias: 0.8, inside: 8, rows: 10 },
      { bias: null, inside: 0, rows: 0 },
    ];
    expect(adoptInterfaceLaw({ inPlace, winner }, { inPlaceShare: 0.1, winnerShare: 0.1 })).toEqual(
      { adopted: true, tolls: true, quiet: true }
    );
    expect(
      adoptInterfaceLaw({ inPlace, winner }, { inPlaceShare: 0.1, winnerShare: 0.11 }).adopted
    ).toBe(false);
  });

  it('refuses a winner whose band holds fewer than eight records in ten in a cell', () => {
    const winner = [
      { bias: 1.5, inside: 7, rows: 10 },
      { bias: 0.8, inside: 8, rows: 10 },
      { bias: null, inside: 0, rows: 0 },
    ];
    const result = adoptInterfaceLaw({ inPlace, winner }, { inPlaceShare: 0.2, winnerShare: 0.1 });
    expect(result).toEqual({ adopted: false, tolls: false, quiet: true });
  });
});
