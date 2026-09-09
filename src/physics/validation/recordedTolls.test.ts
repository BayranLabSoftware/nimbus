import { describe, expect, it } from 'vitest';
import { compareWithRecord, RECORDED_EVENTS } from './recordedTolls.js';
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
    for (const event of RECORDED_EVENTS.filter((e) => e.sample !== undefined).slice(0, 3)) {
      const a = compareWithRecord(event);
      const b = compareWithRecord(event);
      expect(a.low, event.name).toBe(b.low);
      expect(a.high, event.name).toBe(b.high);
    }
  });
});
