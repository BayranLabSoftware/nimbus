import { describe, expect, it } from 'vitest';
import { LOOKUP_ON_RULE_11_ROWS } from './heldOutStrikeRules.js';
import { RULE_EARTHQUAKES, RULE_EARTHQUAKES_POINTED } from './heldOutByRule.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { shippedStrikeAnswer } from './shippedFaults.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { m } from '../units.js';

/**
 * Rules 342 to 348, verified before one toll is scored with the candidate.
 *
 * This is the protocol's second step: the candidate exists, is reachable by
 * name, and is drawn by nothing. What these tests hold are the two claims the
 * rules make about it — that rule 343's table is what the shipped tiles
 * actually answer, and that the candidate changes where a footprint points
 * and nothing else about the scenario.
 */
describe('rules 342 to 348 — the strike we know, on the rows we measure on', () => {
  /** The lookup's answer for every row, computed once for the whole file. */
  const answers = NCEI_EARTHQUAKE_ROWS.map((row) => {
    const result = simulateEarthquake({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
    });
    return {
      row,
      extended: result.isExtendedSource,
      answer: shippedStrikeAnswer(
        row.latitude,
        row.longitude,
        row.depthKm * 1_000,
        result.ruptureLength
      ),
    };
  });

  const tally = (
    rows: typeof answers
  ): { rows: number; interface: number; crustal: number; unknown: number } => ({
    rows: rows.length,
    interface: rows.filter((a) => a.answer.source.startsWith('interface')).length,
    crustal: rows.filter((a) => a.answer.source === 'crustal').length,
    unknown: rows.filter((a) => a.answer.source === 'unknown').length,
  });

  it('rule 343: the table written before the run is what the tiles answer', () => {
    expect(tally(answers)).toEqual(LOOKUP_ON_RULE_11_ROWS.all);
    expect(tally(answers.filter((a) => a.row.magnitude < 6.5))).toEqual(
      LOOKUP_ON_RULE_11_ROWS.belowMw65
    );
    expect(tally(answers.filter((a) => a.row.magnitude >= 6.5 && a.row.magnitude < 7.5))).toEqual(
      LOOKUP_ON_RULE_11_ROWS.mw65to75
    );
    expect(tally(answers.filter((a) => a.row.magnitude >= 7.5))).toEqual(
      LOOKUP_ON_RULE_11_ROWS.fromMw75
    );
  });

  it('rule 343: every row of Mw 7.5 or more is an extended source, and only those', () => {
    // This is why the cell matters and why rule 346(c) can be a check: below
    // the threshold the rupture is a point, and a strike cannot move a point.
    for (const a of answers) expect(a.extended).toBe(a.row.magnitude >= 7.5);
  });

  it('rule 344: the candidate gives a strike exactly where the lookup has one', () => {
    expect(RULE_EARTHQUAKES_POINTED).toHaveLength(answers.length);
    let given = 0;
    for (const [index, a] of answers.entries()) {
      const pointed = RULE_EARTHQUAKES_POINTED[index]?.event.run();
      expect(pointed?.type).toBe('earthquake');
      if (pointed?.type !== 'earthquake') continue;
      const strike = pointed.data.inputs.strikeAzimuthDeg;
      if (a.answer.strikeDeg === null) expect(strike).toBeUndefined();
      else {
        expect(strike).toBeCloseTo(a.answer.strikeDeg, 9);
        given += 1;
      }
    }
    expect(given).toBe(LOOKUP_ON_RULE_11_ROWS.all.interface + LOOKUP_ON_RULE_11_ROWS.all.crustal);
  });

  it('rule 347: the candidate moves the strike and nothing else', () => {
    for (const [index, plain] of RULE_EARTHQUAKES.entries()) {
      const before = plain.event.run();
      const after = RULE_EARTHQUAKES_POINTED[index]?.event.run();
      if (before.type !== 'earthquake' || after?.type !== 'earthquake') continue;
      // The scenario is the same scenario: same magnitude, same depth, same
      // ground, same mechanism, same law, same rupture. Rule 302 stands —
      // nothing here sets `subductionInterface`.
      const { strikeAzimuthDeg: _b, ...restBefore } = before.data.inputs;
      const { strikeAzimuthDeg: _a, ...restAfter } = after.data.inputs;
      expect(restAfter).toEqual(restBefore);
      expect(after.data.ruptureLength).toBe(before.data.ruptureLength);
      expect(after.data.ruptureWidth).toBe(before.data.ruptureWidth);
      expect(after.data.isExtendedSource).toBe(before.data.isExtendedSource);
      // And the shaking itself is untouched: a strike turns the footprint, it
      // does not change how hard the ground shakes at a distance.
      expect(after.data.shaking.mmi7Radius).toBe(before.data.shaking.mmi7Radius);
    }
  });

  it('the candidate is drawn by nothing yet: the scored set still names no strike', () => {
    // The report reads `RULE_EARTHQUAKES`. While this holds, the candidate
    // cannot have moved a published figure.
    for (const quake of RULE_EARTHQUAKES) {
      const result = quake.event.run();
      if (result.type !== 'earthquake') continue;
      expect(result.data.inputs.strikeAzimuthDeg).toBeUndefined();
    }
  });
});
