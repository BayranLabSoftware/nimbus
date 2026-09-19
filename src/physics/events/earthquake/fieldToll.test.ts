import { describe, expect, it } from 'vitest';
import { pagerFatalityRate } from '../../casualties.js';
import { evaluateShakingField, type RuptureFootprint } from './shakingField.js';
import { tollOverField } from './fieldToll.js';

/**
 * Rules 335 and 336 on a field whose answer can be worked out by hand: uniform
 * ground, uniform people, and a law that is a straight line in distance.
 */

const AT: RuptureFootprint = {
  latitude: 0,
  longitude: 20,
  strikeDeg: 0,
  halfLengthM: 0,
  halfWidthM: 0,
};

/** PAGER's curve is asked for at a given intensity; these are its shape. */
const VULNERABILITY = {
  low: { theta: 12, beta: 0.2 },
  mid: { theta: 11, beta: 0.2 },
  high: { theta: 10, beta: 0.2 },
};

/** A law that is MMI 10 at the epicentre and falls one unit every 10 km. */
const linear = (distanceM: number): number => 10 - distanceM / 10_000;

const rock = () => ({ vs30: 760, provenance: 'rock' as const });

describe('rules 335 and 336 — the dead where the shaking is', () => {
  it('counts nobody where nobody lives', () => {
    const field = evaluateShakingField({
      rupture: AT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 60_000,
      points: 101,
    });
    const toll = tollOverField({
      field,
      densityAt: () => 0,
      vulnerability: VULNERABILITY,
      lowestBand: 5,
    });
    expect(toll.deaths).toBe(0);
    expect(toll.exposed).toBe(0);
    expect(toll.populatedCells).toBe(0);
  });

  it('puts the people of a uniform plain where the geometry says they are', () => {
    const field = evaluateShakingField({
      rupture: AT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 50_000,
      points: 201,
    });
    // A hundred people to the square kilometre, everywhere.
    const toll = tollOverField({
      field,
      densityAt: () => 100,
      vulnerability: VULNERABILITY,
      lowestBand: 5,
    });
    // MMI V is reached out to 50 km, which the field just covers; the exposed
    // are the people of the disc of that radius, within the square's corners.
    const disc = Math.PI * 50 ** 2 * 100;
    const square = 100 ** 2 * 100;
    expect(toll.exposed).toBeGreaterThan(disc * 0.95);
    expect(toll.exposed).toBeLessThan(square);
    // Every band the law reaches is present and none below V.
    expect(Object.keys(toll.byBand).sort()).toEqual(['mmi5', 'mmi6', 'mmi7', 'mmi8', 'mmi9']);
    // The bands' dead add up to the total.
    const summed = Object.values(toll.byBand).reduce((a, b) => a + b.deaths, 0);
    expect(summed).toBeCloseTo(toll.deaths, 6);
  });

  it('rule 335: a cell is counted at its own intensity, not its band’s', () => {
    const field = evaluateShakingField({
      rupture: AT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 50_000,
      points: 201,
    });
    const toll = tollOverField({
      field,
      densityAt: () => 100,
      vulnerability: VULNERABILITY,
      lowestBand: 5,
    });
    // The MMI VII band runs from 7.0 to 7.99. Counting it at one rate — the
    // band's own middle, as the annulus does — gives a different number from
    // counting each cell at its own intensity, and the difference is the
    // reason this round exists.
    const band = toll.byBand.mmi7 ?? { people: 0, deaths: 0 };
    const atMiddle = band.people * pagerFatalityRate(7.5, VULNERABILITY.mid);
    expect(band.deaths).toBeGreaterThan(0);
    expect(Math.abs(band.deaths - atMiddle) / atMiddle).toBeGreaterThan(0.01);
  });

  it('rule 338: the band of the toll brackets its central figure', () => {
    const field = evaluateShakingField({
      rupture: AT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 50_000,
      points: 101,
    });
    const toll = tollOverField({
      field,
      densityAt: () => 250,
      vulnerability: VULNERABILITY,
      lowestBand: 7,
    });
    expect(toll.low).toBeLessThanOrEqual(toll.deaths);
    expect(toll.high).toBeGreaterThanOrEqual(toll.deaths);
    // With `lowestBand` at VII nothing below it is counted at all.
    expect(Object.keys(toll.byBand).sort()).toEqual(['mmi7', 'mmi8', 'mmi9']);
  });

  it('rule 340: a toll is computed inside the budget', () => {
    const field = evaluateShakingField({
      rupture: AT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 300_000,
    });
    const toll = tollOverField({
      field,
      densityAt: () => 50,
      vulnerability: VULNERABILITY,
      lowestBand: 5,
    });
    expect(toll.elapsedMs).toBeLessThan(250);
  });
});
