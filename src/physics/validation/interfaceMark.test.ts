import { describe, expect, it } from 'vitest';
import {
  CIRCULARITY_DEG,
  INTERFACE_MARK_ROWS,
  type InterfaceMarkCandidate,
} from './interfaceMarkRules.js';
import {
  RULE_EARTHQUAKES,
  RULE_EARTHQUAKES_GEOMETRY_DECIDES,
  RULE_EARTHQUAKES_TENSOR_MAY_REFUSE,
  type RuleEarthquake,
} from './heldOutByRule.js';
import { shippedStrikeAnswer } from './shippedFaults.js';
import { markingTheInterface, type RecordedEvent } from './recordedTolls.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { m } from '../units.js';

/**
 * Rules 363 to 369, verified before one toll is scored with a mark set.
 *
 * The protocol's second step: both candidates exist, are reachable by name,
 * and are drawn by nothing. What these tests hold are the claims the rules
 * make — the counts written into rule 364 before the run, the order rule 365
 * fixed, and that the mark changes what rule 363 says it changes and nothing
 * else.
 */
describe('rules 363 to 369 — Slab2 may say an earthquake is a megathrust', () => {
  /** What each row is, read once. */
  const rows = RULE_EARTHQUAKES.map((quake, index) => {
    const before = quake.event.run();
    if (before.type !== 'earthquake') throw new Error('a row that is not an earthquake');
    return {
      quake,
      index,
      before,
      // Rule 365: asked with the UNMARKED rupture, which is what this row carries.
      answer: shippedStrikeAnswer(
        quake.row.latitude,
        quake.row.longitude,
        quake.row.depthKm * 1_000,
        before.data.ruptureLength
      ),
      mechanism: before.data.inputs.faultType ?? 'all',
    };
  });

  const marked = (set: readonly RuleEarthquake[]): number[] => {
    const out: number[] = [];
    for (const [index, quake] of set.entries()) {
      const after = quake.event.run();
      if (after.type !== 'earthquake') continue;
      if (after.data.inputs.subductionInterface === true) out.push(index);
    }
    return out;
  };

  const geometry = marked(RULE_EARTHQUAKES_GEOMETRY_DECIDES);
  const tensor = marked(RULE_EARTHQUAKES_TENSOR_MAY_REFUSE);

  it('rule 364: both candidates mark the number of rows written down before the run', () => {
    expect(geometry).toHaveLength(INTERFACE_MARK_ROWS.geometryDecides.all);
    expect(tensor).toHaveLength(INTERFACE_MARK_ROWS.tensorMayRefuse.all);
    // And the narrower one is a subset of the wider one, which is what
    // "the tensor may refuse" means.
    for (const index of tensor) expect(geometry).toContain(index);
  });

  it('rule 364: the rows marked are the rows the slab answers for, by cell', () => {
    const answered = rows.filter((r) => r.answer.source.startsWith('interface'));
    expect(answered).toHaveLength(INTERFACE_MARK_ROWS.geometryDecides.all);
    const cell = (lo: number, hi: number): number =>
      answered.filter((r) => r.quake.row.magnitude >= lo && r.quake.row.magnitude < hi).length;
    expect(cell(0, 6.5)).toBe(INTERFACE_MARK_ROWS.geometryDecides.belowMw65);
    expect(cell(6.5, 7.5)).toBe(INTERFACE_MARK_ROWS.geometryDecides.mw65to75);
    expect(cell(7.5, 99)).toBe(INTERFACE_MARK_ROWS.geometryDecides.fromMw75);
  });

  it('rule 364(a): the moment tensor refuses exactly the rows that contradict a thrust', () => {
    const refused = geometry.filter((index) => !tensor.includes(index));
    const mechanisms = refused.map((index) => rows[index]?.mechanism);
    expect(mechanisms.filter((m) => m === 'strike-slip')).toHaveLength(
      INTERFACE_MARK_ROWS.contradicting.strikeSlip
    );
    expect(mechanisms.filter((m) => m === 'normal')).toHaveLength(
      INTERFACE_MARK_ROWS.contradicting.normal
    );
    // A row that named no mechanism is not a contradiction, so it is marked.
    expect(mechanisms.filter((m) => m === 'all')).toHaveLength(0);
    expect(mechanisms.filter((m) => m === 'reverse')).toHaveLength(0);
  });

  it('rule 363: the mark drags what the rules say it drags, and no more', () => {
    for (const candidate of [
      RULE_EARTHQUAKES_TENSOR_MAY_REFUSE,
      RULE_EARTHQUAKES_GEOMETRY_DECIDES,
    ]) {
      for (const [index, quake] of candidate.entries()) {
        const row = rows[index];
        const after = quake.event.run();
        if (row === undefined || after.type !== 'earthquake') continue;
        if (after.data.inputs.subductionInterface !== true) {
          // Rule 367(c): an unmarked row is untouched, to the figure.
          expect(after.data.inputs).toEqual(row.before.data.inputs);
          expect(after.data.ruptureLength).toBe(row.before.data.ruptureLength);
          continue;
        }
        // Marked: the mechanism is a thrust, the rupture is Strasser's, and
        // the extended-source threshold has NOT moved (rule 363's table).
        expect(after.data.isExtendedSource).toBe(row.before.data.isExtendedSource);
        expect(after.data.tsunami).toBeDefined();
        // Rule 365: the strike is the one the unmarked rupture asked for.
        if (row.answer.strikeDeg !== null) {
          expect(after.data.inputs.strikeAzimuthDeg).toBeCloseTo(row.answer.strikeDeg, 9);
        }
      }
    }
  });

  it('rule 365: re-asking with the marked rupture would move the strike by very little', () => {
    // The order is fixed so this number cannot be chosen later. It is checked
    // here so that a change in the tiles or in Strasser's scaling that made
    // the circularity matter would fail instead of passing quietly.
    let worst = 0;
    for (const row of rows) {
      if (!row.answer.source.startsWith('interface')) continue;
      const after = RULE_EARTHQUAKES_GEOMETRY_DECIDES[row.index]?.event.run();
      if (after?.type !== 'earthquake') continue;
      const again = shippedStrikeAnswer(
        row.quake.row.latitude,
        row.quake.row.longitude,
        row.quake.row.depthKm * 1_000,
        after.data.ruptureLength
      );
      expect(again.source).toBe(row.answer.source);
      if (again.strikeDeg === null || row.answer.strikeDeg === null) continue;
      let d = Math.abs(again.strikeDeg - row.answer.strikeDeg) % 180;
      if (d > 90) d = 180 - d;
      worst = Math.max(worst, d);
    }
    expect(worst).toBeLessThanOrEqual(CIRCULARITY_DEG.worst + 0.01);
    expect(worst).toBeLessThan(5);
  });

  it('the candidates are drawn by nothing: the scored set marks no interface', () => {
    for (const quake of RULE_EARTHQUAKES) {
      const result = quake.event.run();
      if (result.type !== 'earthquake') continue;
      expect(result.data.inputs.subductionInterface).toBeUndefined();
    }
  });

  it('a scenario that already says what it is keeps saying it', () => {
    // The preset case of rule 286, and a reader's own tick: the decorator
    // must not overrule either, in either direction.
    const at = rows[0];
    if (at === undefined) throw new Error('no rows');
    for (const tick of [true, false]) {
      const ticked: RecordedEvent = {
        name: 'rule 363 probe',
        latitude: at.quake.row.latitude,
        longitude: at.quake.row.longitude,
        recordedDeaths: 0,
        source: 'not a record: a probe of rule 363, scored nowhere',
        run: () => ({
          type: 'earthquake',
          data: simulateEarthquake({
            magnitude: at.quake.row.magnitude,
            depth: m(at.quake.row.depthKm * 1_000),
            faultType: 'reverse',
            subductionInterface: tick,
          }),
        }),
        gated: false,
      };
      for (const candidate of ['tensorMayRefuse', 'geometryDecides'] as InterfaceMarkCandidate[]) {
        const after = markingTheInterface(ticked, candidate).run();
        const before = ticked.run();
        if (after.type !== 'earthquake' || before.type !== 'earthquake') continue;
        expect(after.data.inputs.subductionInterface).toBe(tick);
        expect(after.data.inputs).toEqual(before.data.inputs);
      }
    }
  });
});
