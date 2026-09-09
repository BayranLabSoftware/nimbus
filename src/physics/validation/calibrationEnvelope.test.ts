import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_ANCHORS,
  anchorsFor,
  calibrationEnvelope,
  envelopeOf,
  uncheckedFor,
  type EnvelopeEventType,
} from './calibrationEnvelope.js';
import { RECORDED_EVENTS } from './recordedTolls.js';
import { RECORDED_WAVES } from './recordedWaves.js';
import { GOLDEN_DATASET } from './goldenDataset.js';
import { PLUME_HEIGHT_OBSERVATIONS, TUNGUSKA_ENERGY_OBSERVATION } from './fixtures.js';

const MEGATON_J = 4.184e15;
const TYPES: readonly EnvelopeEventType[] = [
  'impact',
  'explosion',
  'earthquake',
  'volcano',
  'landslide',
];

/**
 * The envelope is a second copy of the calibration net, kept small
 * enough for the bundle. A second copy drifts unless something
 * watches it, so these first tests are the watch: every row the net
 * measures must be an anchor, and every anchor must be a row the net
 * measures. Add an event to the net and this fails until the envelope
 * knows about it, which is the point.
 */
describe('the envelope stays in step with the calibration net', () => {
  const names = CALIBRATION_ANCHORS.map((a) => a.name);
  const covers = (row: string): boolean => names.some((n) => row.includes(n));

  it('every recorded death toll has an anchor', () => {
    for (const toll of RECORDED_EVENTS) expect(covers(toll.name), toll.name).toBe(true);
  });

  it('every recorded wave has an anchor', () => {
    for (const wave of RECORDED_WAVES) expect(covers(wave.name), wave.name).toBe(true);
  });

  it('every observed plume height has an anchor', () => {
    for (const obs of PLUME_HEIGHT_OBSERVATIONS) expect(covers(obs.event), obs.event).toBe(true);
  });

  it('every historical row of the golden dataset has an anchor', () => {
    const historical = GOLDEN_DATASET.filter((g) => g.oracle === 'historical');
    expect(historical.length).toBeGreaterThan(0);
    for (const row of historical) expect(covers(row.title), row.title).toBe(true);
  });

  it('every anchor is a row the net actually measures', () => {
    const rows = [
      ...RECORDED_EVENTS.map((r) => r.name),
      ...RECORDED_WAVES.map((r) => r.name),
      ...PLUME_HEIGHT_OBSERVATIONS.map((r) => r.event),
      ...GOLDEN_DATASET.map((r) => r.title),
      TUNGUSKA_ENERGY_OBSERVATION.event,
    ];
    for (const anchor of CALIBRATION_ANCHORS) {
      expect(
        rows.some((row) => row.includes(anchor.name)),
        anchor.name
      ).toBe(true);
    }
  });

  it("Tunguska's anchor sits inside the energy the forest allows", () => {
    const tunguska = CALIBRATION_ANCHORS.find((a) => a.name === 'Tunguska 1908');
    expect(tunguska).toBeDefined();
    const mt = (tunguska?.value ?? 0) / MEGATON_J;
    expect(mt).toBeGreaterThan(TUNGUSKA_ENERGY_OBSERVATION.yieldMtLow);
    expect(mt).toBeLessThan(TUNGUSKA_ENERGY_OBSERVATION.yieldMtHigh);
  });

  it('every family has at least two anchors, so a span exists', () => {
    for (const type of TYPES) expect(anchorsFor(type).length, type).toBeGreaterThanOrEqual(2);
  });
});

/**
 * What the envelope is allowed to claim. These are the sentences the
 * interface will put in front of a reader, so they are asserted here
 * rather than left to whoever writes the copy.
 */
describe('what the net does and does not measure', () => {
  it('no impact in the record has a death toll or a wave to check', () => {
    expect([...uncheckedFor('impact')].sort()).toEqual(['toll', 'wave']);
  });

  it('no explosion crater is checked against a measurement', () => {
    expect([...uncheckedFor('explosion')]).toEqual(['crater']);
  });

  it('earthquakes have both a toll and a wave measured', () => {
    expect(uncheckedFor('earthquake')).toEqual([]);
  });

  it('no volcanic wave is checked — not even Krakatau, which drowned 36 000', () => {
    expect([...uncheckedFor('volcano')]).toEqual(['wave']);
  });

  it('no landslide in the record has a death toll to check', () => {
    expect([...uncheckedFor('landslide')]).toEqual(['toll']);
  });
});

describe('placing a scenario against the record', () => {
  it('Hiroshima itself reads as measured, and names itself', () => {
    const e = calibrationEnvelope('explosion', 15 * 4.184e12);
    expect(e?.standing).toBe('measured');
    expect(e?.nearest?.name).toBe('Hiroshima 1945');
    expect(e?.beyond).toBe(1);
  });

  it('a megatonne sits between measured events, not beside one', () => {
    const e = calibrationEnvelope('explosion', 1 * MEGATON_J);
    expect(e?.standing).toBe('interpolated');
    expect(e?.beyond).toBe(1);
  });

  it('a gigatonne is twenty times past the largest charge ever fired', () => {
    const e = calibrationEnvelope('explosion', 1000 * MEGATON_J);
    expect(e?.standing).toBe('extrapolated');
    expect(e?.nearest?.name).toBe('Tsar Bomba');
    expect(e?.beyond).toBeCloseTo(20, 0);
  });

  it('a magnitude 10 is past every earthquake ever recorded', () => {
    const e = calibrationEnvelope('earthquake', 10);
    expect(e?.standing).toBe('extrapolated');
    expect(e?.nearest?.name).toBe('Sumatra–Andaman 2004');
    // 0.8 units of Mw past Sumatra is 10^1.2 in moment.
    expect(e?.beyond).toBeCloseTo(10 ** 1.2, 1);
  });

  it('a magnitude 6 is a fraction under the smallest measured, and says so', () => {
    const e = calibrationEnvelope('earthquake', 6);
    expect(e?.standing).toBe('measured');
    expect(e?.nearest?.name).toBe('Amatrice 2016');
  });

  it('a Toba-class eruption is far past Krakatau', () => {
    const e = calibrationEnvelope('volcano', 2.8e12);
    expect(e?.standing).toBe('extrapolated');
    expect(e?.nearest?.name).toBe('Krakatau 1883');
    expect(e?.beyond).toBeGreaterThan(100);
  });

  it('Chicxulub reads as measured — its crater is, its dead are not', () => {
    const e = calibrationEnvelope('impact', 7.8e23);
    expect(e?.standing).toBe('measured');
    expect(e?.nearest?.name).toBe('Chicxulub');
    expect(e?.nearest?.quantities).toEqual(['crater']);
    expect(e?.unchecked).toContain('toll');
  });

  it('beyond is never below 1, and is exactly 1 inside the range', () => {
    for (const type of TYPES) {
      const anchors = anchorsFor(type);
      for (const anchor of anchors) {
        const e = calibrationEnvelope(type, anchor.value);
        expect(e?.beyond, anchor.name).toBe(1);
        expect(e?.standing, anchor.name).toBe('measured');
      }
    }
  });

  it('refuses a value that is not a positive number', () => {
    expect(calibrationEnvelope('impact', 0)).toBeNull();
    expect(calibrationEnvelope('impact', -1)).toBeNull();
    expect(calibrationEnvelope('impact', Number.NaN)).toBeNull();
    expect(calibrationEnvelope('impact', Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('standing only ever moves outward as a scenario grows', () => {
    const order = { measured: 0, interpolated: 1, extrapolated: 2, unmeasured: 0 };
    for (const type of TYPES) {
      const anchors = anchorsFor(type);
      const top = anchors[anchors.length - 1]?.value ?? 0;
      expect(top, type).toBeGreaterThan(0);
      let previous = -1;
      for (const factor of [1, 2, 10, 100, 1e4, 1e8]) {
        const e = calibrationEnvelope(type, top * factor);
        expect(e).not.toBeNull();
        const rank = order[e?.standing ?? 'measured'];
        // Growing past the top can only leave the measured range, and
        // once left it never comes back.
        expect(rank, `${type} ×${factor.toString()}`).toBeGreaterThanOrEqual(previous);
        previous = rank;
      }
    }
  });
});

describe('reading the axis off a finished simulation', () => {
  it('takes an impact to its kinetic energy', () => {
    const e = envelopeOf({
      type: 'impact',
      data: { impactor: { kineticEnergy: 7.8e23 } },
    } as Parameters<typeof envelopeOf>[0]);
    expect(e?.nearest?.name).toBe('Chicxulub');
  });

  it('takes an eruption to its erupted volume, not its rounded VEI', () => {
    const pinatubo = envelopeOf({
      type: 'volcano',
      data: { inputs: { totalEjectaVolume: 1e10 } },
    } as Parameters<typeof envelopeOf>[0]);
    const krakatau = envelopeOf({
      type: 'volcano',
      data: { inputs: { totalEjectaVolume: 2e10 } },
    } as Parameters<typeof envelopeOf>[0]);
    // Both are VEI 6; the envelope still tells them apart.
    expect(pinatubo?.nearest?.name).toBe('Pinatubo 1991');
    expect(krakatau?.nearest?.name).toBe('Krakatau 1883');
  });
});
