import { describe, expect, it } from 'vitest';
import {
  compareWithRecord,
  RECORDED_EVENTS,
  sampleToll,
  shippedExposureCurve,
} from './recordedTolls.js';
import { populationWithin } from '../uq/tollBand.js';
import { shippedPlanetTotal } from './shippedPopulation.js';

/**
 * The calibration net.
 *
 * Yesterday a Chicxulub-class impact on Rome read 4.2 billion dead;
 * today it reads 1.0 billion, and the difference was found by a human
 * reading a PDF. That is the failure this file exists to prevent: not
 * the wrong number, which will happen again, but the wrong number
 * going unnoticed.
 *
 * Each gated row asserts one thing — the model's own low–high band
 * contains the number that was counted — and prints its ratio either
 * way, so a drift shows up in the log before it shows up in a report.
 */

describe('the shipped rasters decode', () => {
  it('sum to the total their own sidecar claims', () => {
    const { decoded, sidecar } = shippedPlanetTotal();
    // Log-scale quantisation is ~7 % per cell and averages out across
    // 4.1 million of them; anything past a per cent is a decoder bug.
    expect(decoded / sidecar).toBeGreaterThan(0.99);
    expect(decoded / sidecar).toBeLessThan(1.01);
  });
});

describe('the toll against events that were counted', () => {
  const rows = RECORDED_EVENTS.map(compareWithRecord);

  it('prints where the model lands on every event with a record', () => {
    const line = (r: (typeof rows)[number]): string => {
      const e = r.event;
      const band = `${Math.round(r.low).toLocaleString('en-US')} – ${Math.round(r.high).toLocaleString('en-US')}`;
      const ratio = Number.isFinite(r.ratio) ? `${r.ratio.toFixed(2)}×` : '∞';
      // How cheap the pass was: a band spanning four orders of
      // magnitude contains almost anything, and saying so in the log
      // is the difference between a test and a formality.
      const span =
        r.high > 0 ? `10^${(Math.log10(r.high / Math.max(r.low, 1)) || 0).toFixed(1)}` : '—';
      return `${e.gated ? 'gate ' : 'note '} ${e.name.padEnd(24)} recorded ${e.recordedDeaths.toLocaleString('en-US').padStart(9)}  model ${Math.round(r.deaths).toLocaleString('en-US').padStart(11)}  band ${band.padStart(25)} ${span.padStart(7)}  ${ratio.padStart(8)}  ${r.contains ? 'contains' : 'MISSES'}`;
    };
    console.log(['', ...rows.map(line)].join('\n'));
    expect(rows).toHaveLength(RECORDED_EVENTS.length);
  });

  for (const event of RECORDED_EVENTS.filter((e) => e.gated)) {
    it(`${event.name}: the band contains the ${event.recordedDeaths.toLocaleString('en-US')} counted`, () => {
      const r = compareWithRecord(event);
      expect(r.estimate).not.toBeNull();
      expect(r.contains).toBe(true);
    });
  }
});

/**
 * A gate that cannot fail is not a gate.
 *
 * Every gated row used to pass on a band three to five orders of
 * magnitude wide — Northridge on 13 to 139 037 dead — because the
 * low and high ends were the gentlest and harshest vulnerability
 * curves in the table rather than an interval the model predicts.
 * Containing the record proved nothing.
 *
 * The band is now the fifth to ninety-fifth percentile of the toll
 * under the published input scatter, and this keeps it that way: a
 * row that widens back past a couple of orders of magnitude has
 * stopped making a claim, whatever it contains.
 */
describe('a band that could not fail', () => {
  it('every gated row makes a claim narrow enough to be wrong', () => {
    for (const event of RECORDED_EVENTS.filter((e) => e.gated)) {
      const c = compareWithRecord(event);
      if (c.high <= 0) continue; // a row whose model and record are both zero
      const span = Math.log10(Math.max(c.high, 1) / Math.max(c.low, 1));
      expect(span, `${event.name}: band spans 10^${span.toFixed(1)}`).toBeLessThan(3.5);
    }
  });

  it('the band is stable between runs, so a miss is a finding and not a draw', () => {
    for (const event of RECORDED_EVENTS.slice(0, 3)) {
      const a = compareWithRecord(event);
      const b = compareWithRecord(event);
      expect(a.low, event.name).toBe(b.low);
      expect(a.high, event.name).toBe(b.high);
    }
  });
});

/**
 * What the interpolation costs.
 *
 * The browser cannot query the population backend once per
 * realisation — a band is tens of seconds — so it queries it once per
 * ring and reads every sampled radius off the curve between them,
 * at constant density across each annulus. This harness has the
 * raster in memory and can afford the exact query at every radius.
 *
 * Running both and comparing is the only way to know that the band a
 * visitor reads is a statement about the earth rather than about the
 * interpolation. Three or four measured points is not many, and the
 * radii a realisation asks for run well outside them.
 */
describe('the interpolated band and the measured one', () => {
  it('agree closely enough that the shipped band is about the event', () => {
    const lines: string[] = [];
    const worst: { name: string; lo: number; hi: number }[] = [];
    for (const event of RECORDED_EVENTS) {
      const exact = sampleToll(event);
      const curve = shippedExposureCurve(event);
      const approx = sampleToll(event, (r) => populationWithin(curve, r));
      if (exact === null || approx === null) continue;
      if (exact.high.deaths <= 0) continue;
      const ratio = (a: number, b: number): number =>
        Math.max(a, 1) > Math.max(b, 1)
          ? Math.max(a, 1) / Math.max(b, 1)
          : Math.max(b, 1) / Math.max(a, 1);
      const lo = ratio(exact.low.deaths, approx.low.deaths);
      const hi = ratio(exact.high.deaths, approx.high.deaths);
      lines.push(
        `${event.name.padEnd(24)}${exact.high.deaths >= 100 ? ' ' : '*'}measured ${Math.round(exact.low.deaths).toLocaleString('en-US').padStart(9)} – ${Math.round(exact.high.deaths).toLocaleString('en-US').padStart(9)}   interpolated ${Math.round(approx.low.deaths).toLocaleString('en-US').padStart(9)} – ${Math.round(approx.high.deaths).toLocaleString('en-US').padStart(9)}   ${lo.toFixed(2)}× / ${hi.toFixed(2)}×`
      );
      // Below a hundred dead the two bands differ by fewer people
      // than live in one cell of the raster they both read, so the
      // ratio measures the raster and not the interpolation.
      // Sumatra's shaking-only row is the case: 43 against 115.
      const comparable = exact.high.deaths >= 100;
      if (comparable) worst.push({ name: event.name, lo, hi });
    }
    console.log(['', ...lines, '', '* too few dead to compare — see the comment above'].join('\n'));
    for (const w of worst) {
      expect(w.lo, `${w.name}: low end`).toBeLessThan(2);
      expect(w.hi, `${w.name}: high end`).toBeLessThan(2);
    }
  });
});
