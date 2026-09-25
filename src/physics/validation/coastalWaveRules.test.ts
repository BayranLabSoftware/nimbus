import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from '../simulate.js';
import { m } from '../units.js';
import {
  MAX_SHORE_SEGMENT_FRACTION,
  shoreSegmentEquivalentRadius,
  shoreSegmentFraction,
} from './coastalWaveRules.js';

/**
 * Rules 270 and 271: the geometry, checked in closed form, and the model
 * checked against itself — because there is no coastal impact in the record
 * and rule 270 said in advance that nothing here would pretend otherwise.
 *
 * The rules were fixed and pushed (commit 9d966e6) before the candidate was
 * written.
 */

const CHICXULUB = IMPACT_PRESETS.CHICXULUB.input;

const coastal = (shoreM: number) =>
  simulateImpact({ ...CHICXULUB, waterDepth: m(200), shoreDistance: m(shoreM) });

describe('rules 267 to 273 — the wave comes from the hole, not from a column', () => {
  it('rule 270(a): the segment is the closed form, half at the edge and nothing past the rim', () => {
    expect(shoreSegmentFraction(m(1), m(0))).toBe(MAX_SHORE_SEGMENT_FRACTION);
    expect(shoreSegmentFraction(m(1), m(1))).toBe(0);
    expect(shoreSegmentFraction(m(1), m(1.5))).toBe(0);
    expect(shoreSegmentFraction(m(0), m(0))).toBe(0);
    for (const d of [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
      const theta = Math.acos(d);
      expect(shoreSegmentFraction(m(1), m(d))).toBeCloseTo(
        (theta - Math.sin(theta) * Math.cos(theta)) / Math.PI,
        12
      );
      // Never more than half, wherever the shore is.
      expect(shoreSegmentFraction(m(1), m(d))).toBeLessThanOrEqual(MAX_SHORE_SEGMENT_FRACTION);
    }
    // And it falls without a step as the shore goes inland.
    let previous = Number.POSITIVE_INFINITY;
    for (const d of [0, 0.1, 0.2, 0.4, 0.6, 0.8, 0.95, 1]) {
      const f = shoreSegmentFraction(m(1), m(d));
      expect(f).toBeLessThan(previous);
      previous = f;
    }
    // The equal-area circle of that segment.
    expect(shoreSegmentEquivalentRadius(m(1_000), m(0))).toBeCloseTo(1_000 * Math.SQRT1_2, 9);
    expect(shoreSegmentEquivalentRadius(m(1_000), m(1_000))).toBe(0);
  });

  it('rule 270(b): a sea five kilometres away may not shrink a crater', () => {
    // The same body, once with a coast within reach and once with none at
    // all. Until this round the first lost a fifth of its energy and 6.7 % of
    // its crater to a water column that was not over it.
    const dry = simulateImpact(CHICXULUB);
    for (const shore of [1_000, 20_000, 44_000, 70_000, 600_000]) {
      const near = coastal(shore);
      expect(near.crater.transientDiameter, `${shore.toString()} m`).toBe(
        dry.crater.transientDiameter
      );
      expect(near.crater.finalDiameter).toBe(dry.crater.finalDiameter);
      expect(near.atmosphere.stratosphericDust).toBe(dry.atmosphere.stratosphericDust);
      expect(near.seismic.magnitude).toBe(dry.seismic.magnitude);
    }
  });

  it('rule 270(c): an impact in open water is unchanged', () => {
    // No shore distance is the open-water branch, and nothing in it moved:
    // the crater is suppressed by the column the body fell through, exactly
    // as it was.
    const deep = simulateImpact({ ...CHICXULUB, waterDepth: m(4_000) });
    const dry = simulateImpact(CHICXULUB);
    expect(deep.crater.transientDiameter as number).toBeLessThan(dry.crater.transientDiameter);
    expect(deep.tsunami).toBeDefined();
    expect(deep.tsunami?.seaCoupling.mechanism).toBe('water');
    expect(deep.tsunami?.seaCoupling.fraction).toBe(1);
  });

  it('rule 270(d): monotone in the shore distance and in the size of the body', () => {
    const rows: string[] = [
      '',
      '| shore | transient R | in the sea | cavity | A @ 1000 km |',
      '| --: | --: | --: | --: | --: |',
    ];
    let previous = Number.POSITIVE_INFINITY;
    for (const shore of [1_000, 10_000, 20_000, 30_000, 40_000, 44_000, 46_000, 70_000]) {
      const r = coastal(shore);
      const ts = r.tsunami;
      const rt = (r.crater.transientDiameter as number) / 2;
      rows.push(
        `| ${(shore / 1_000).toFixed(0)} km | ${(rt / 1_000).toFixed(1)} km | ${ts === undefined ? '—' : `${(100 * ts.seaCoupling.fraction).toFixed(2)} %`} | ${ts === undefined ? '—' : `${((ts.cavityRadius as number) / 1_000).toFixed(2)} km`} | ${ts === undefined ? 'no wave' : `${(ts.amplitudeAt1000kmWunnemann as number).toFixed(3)} m`} |`
      );
      const wave = (ts?.amplitudeAt1000kmWunnemann as number | undefined) ?? 0;
      // Strictly down while there is a wave; once the cavity stops short
      // there is none, and nothing after it can be smaller than nothing.
      if (wave > 0) expect(wave, `${shore.toString()} m`).toBeLessThan(previous);
      else expect(wave, `${shore.toString()} m`).toBeLessThanOrEqual(previous);
      previous = wave;
    }
    console.log(rows.join('\n'));

    // And in the size of the body, at a fixed shore.
    let last = 0;
    for (const diameter of [2_000, 5_000, 10_000, 15_000]) {
      const r = simulateImpact({
        ...CHICXULUB,
        impactorDiameter: m(diameter),
        waterDepth: m(200),
        shoreDistance: m(20_000),
      });
      const wave = (r.tsunami?.amplitudeAt1000kmWunnemann as number | undefined) ?? 0;
      expect(wave, `${diameter.toString()} m`).toBeGreaterThanOrEqual(last);
      last = wave;
    }
  });
});
