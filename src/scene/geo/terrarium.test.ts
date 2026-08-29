import { describe, expect, it } from 'vitest';
import {
  decodeNormalised,
  decodeTerrarium,
  normaliseElevation,
  sampleElevation,
} from './terrarium.js';

/** Build an RGBA buffer from (r,g,b) triples. */
function rgba(triples: readonly (readonly [number, number, number])[]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(triples.length * 4);
  triples.forEach(([r, g, b], i) => {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  });
  return out;
}

describe('decodeTerrarium', () => {
  it('decodes sea level from the documented offset', () => {
    // R = 128 → 128*256 = 32768, minus the 32768 offset → 0 m.
    const f = decodeTerrarium(rgba([[128, 0, 0]]), 1, 1);
    expect(f.meters[0]).toBeCloseTo(0, 9);
  });

  it('decodes a positive elevation', () => {
    const f = decodeTerrarium(rgba([[128, 100, 0]]), 1, 1);
    expect(f.meters[0]).toBeCloseTo(100, 9);
  });

  it('decodes a sub-metre fraction from the blue channel', () => {
    const f = decodeTerrarium(rgba([[128, 0, 128]]), 1, 1);
    expect(f.meters[0]).toBeCloseTo(0.5, 9);
  });

  it('decodes bathymetry as negative', () => {
    // 8302 m below sea level, as in the Chicxulub mosaic.
    const target = -8302;
    const raw = target + 32_768;
    const r = Math.floor(raw / 256);
    const g = raw - r * 256;
    const f = decodeTerrarium(rgba([[r, g, 0]]), 1, 1);
    expect(f.meters[0]).toBeCloseTo(target, 6);
  });

  it('reports the range over the whole field', () => {
    const f = decodeTerrarium(
      rgba([
        [128, 0, 0],
        [133, 200, 0],
        [124, 10, 0],
      ]),
      3,
      1
    );
    expect(f.min).toBeLessThan(0);
    expect(f.max).toBeGreaterThan(1_000);
    expect(f.max).toBeGreaterThan(f.min);
  });

  it('refuses a short buffer instead of decoding garbage', () => {
    expect(() => decodeTerrarium(new Uint8ClampedArray(8), 4, 4)).toThrow(/need 64/);
  });
});

describe('normaliseElevation — the filterable re-encoding', () => {
  const field = decodeTerrarium(
    rgba([
      [128, 0, 0], // 0 m
      [129, 0, 0], // 256 m
      [130, 0, 0], // 512 m
      [131, 0, 0], // 768 m
    ]),
    4,
    1
  );

  it('maps the range onto the full byte span', () => {
    const n = normaliseElevation(field);
    expect(n.bytes[0]).toBe(0);
    expect(n.bytes[3]).toBe(255);
    expect(n.min).toBeCloseTo(0, 6);
    expect(n.max).toBeCloseTo(768, 6);
  });

  it('round-trips within one quantisation step', () => {
    const n = normaliseElevation(field);
    const step = (n.max - n.min) / 255;
    for (let i = 0; i < 4; i++) {
      const back = decodeNormalised(n.bytes[i] ?? 0, n.min, n.max);
      expect(Math.abs(back - (field.meters[i] ?? 0))).toBeLessThanOrEqual(step);
    }
  });

  it('gives a flat field an artificial range so nothing divides by zero', () => {
    const flat = decodeTerrarium(
      rgba([
        [128, 50, 0],
        [128, 50, 0],
      ]),
      2,
      1
    );
    const n = normaliseElevation(flat);
    expect(n.max - n.min).toBeGreaterThan(0);
    expect(Number.isFinite(decodeNormalised(128, n.min, n.max))).toBe(true);
  });

  it('is monotone: a higher sample never encodes to a lower byte', () => {
    const n = normaliseElevation(field);
    for (let i = 1; i < 4; i++) {
      expect(n.bytes[i] ?? 0).toBeGreaterThanOrEqual(n.bytes[i - 1] ?? 0);
    }
  });
});

describe('sampleElevation', () => {
  const field = decodeTerrarium(
    rgba([
      [128, 0, 0], // 0 m   (0,0)
      [129, 0, 0], // 256 m (1,0)
      [130, 0, 0], // 512 m (0,1)
      [131, 0, 0], // 768 m (1,1)
    ]),
    2,
    2
  );

  it('returns the corner values exactly', () => {
    expect(sampleElevation(field, 0, 0)).toBeCloseTo(0, 6);
    expect(sampleElevation(field, 1, 0)).toBeCloseTo(256, 6);
    expect(sampleElevation(field, 0, 1)).toBeCloseTo(512, 6);
    expect(sampleElevation(field, 1, 1)).toBeCloseTo(768, 6);
  });

  it('interpolates the centre', () => {
    expect(sampleElevation(field, 0.5, 0.5)).toBeCloseTo(384, 6);
  });

  it('clamps outside the unit square instead of wrapping', () => {
    expect(sampleElevation(field, -3, -3)).toBeCloseTo(0, 6);
    expect(sampleElevation(field, 9, 9)).toBeCloseTo(768, 6);
  });
});
