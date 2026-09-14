import { describe, expect, it } from 'vitest';
import {
  RULE_EARTHQUAKES,
  RULE_PLUMES,
  RULE_SEEN_EARTHQUAKES,
  RULE_SEEN_PLUMES,
  RULE_TUNED_EARTHQUAKES,
} from './heldOutByRule.js';
import { NCEI_UNMATCHED } from './heldOutByRuleData.js';

/**
 * The sets chosen by rule hold what their rules admit, and nothing
 * here runs the model: whether the rows are inside is the report's to
 * print, never a test's to gate (rule 5).
 */

function rakeBin(rake: number): 'strike-slip' | 'reverse' | 'normal' {
  const r = ((((rake + 180) % 360) + 360) % 360) - 180;
  if (Math.abs(r) <= 30 || Math.abs(r) >= 150) return 'strike-slip';
  return r > 0 ? 'reverse' : 'normal';
}

describe('the earthquakes chosen by rule', () => {
  it('account for every record the query returned', () => {
    const records = RULE_EARTHQUAKES.reduce((n, q) => n + q.row.nceiIds.length, 0);
    expect(records + NCEI_UNMATCHED.length).toBe(409);
  });

  it('are one row per ComCat event, each with its own name', () => {
    expect(new Set(RULE_EARTHQUAKES.map((q) => q.row.comcat)).size).toBe(RULE_EARTHQUAKES.length);
    expect(new Set(RULE_EARTHQUAKES.map((q) => q.event.name)).size).toBe(RULE_EARTHQUAKES.length);
  });

  it('read their fault type off the moment tensor by rule 2', () => {
    for (const { row } of RULE_EARTHQUAKES) {
      const expected =
        row.rakes === null
          ? 'all'
          : new Set(row.rakes.map(rakeBin)).size === 1
            ? rakeBin(row.rakes[0] ?? 0)
            : 'all';
      expect(row.faultType, row.comcat).toBe(expected);
    }
  });

  it('take the dead plus the missing as the high end, and nothing else', () => {
    for (const { row, event } of RULE_EARTHQUAKES) {
      expect(event.recordedDeaths).toBe(row.deaths);
      expect(event.recordedDeathsLow).toBeUndefined();
      expect(event.recordedDeathsHigh).toBe(row.missing > 0 ? row.deaths + row.missing : undefined);
      expect(event.gated).toBe(false);
    }
  });

  it('name every tuned and every seen event among their rows', () => {
    const ids = new Set(RULE_EARTHQUAKES.map((q) => q.row.comcat));
    for (const id of [
      ...Object.keys(RULE_TUNED_EARTHQUAKES),
      ...Object.keys(RULE_SEEN_EARTHQUAKES),
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(RULE_EARTHQUAKES.filter((q) => q.role === 'tuned')).toHaveLength(2);
    expect(RULE_EARTHQUAKES.filter((q) => q.seen)).toHaveLength(6);
  });
});

describe('the eruption columns chosen by rule', () => {
  it('are every IVESPA phase from 2009 on', () => {
    expect(RULE_PLUMES).toHaveLength(37);
    for (const { row } of RULE_PLUMES)
      expect(Number(row.start.slice(0, 4))).toBeGreaterThanOrEqual(2009);
  });

  it('have an eruption rate and a height above the vent to compare', () => {
    for (const { observation } of RULE_PLUMES) {
      expect(observation.volumeEruptionRate).toBeGreaterThan(0);
      expect(observation.observedPlumeHeightKm).toBeGreaterThan(0);
      expect(observation.toleranceKm).toBeGreaterThan(0);
      expect(observation.gated).toBe(false);
    }
  });

  it('mark the phases already in the net as seen', () => {
    const seen = RULE_PLUMES.filter((p) => p.seen).map((p) => p.row.ivespa);
    expect(seen.sort()).toEqual([...RULE_SEEN_PLUMES].sort());
  });
});
