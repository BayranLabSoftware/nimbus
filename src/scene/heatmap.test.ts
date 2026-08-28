import { describe, expect, it } from 'vitest';
import { computeValueRange, levelSeparatesField, veilUpperBound } from './heatmap.js';

describe('computeValueRange', () => {
  it('returns the min / max of a finite, positive field', () => {
    const samples = new Float32Array([1, 5, 10, 20, 40, 100]);
    const r = computeValueRange(samples);
    expect(r.valueMin).toBe(1);
    expect(r.valueMax).toBe(100);
  });

  it('respects caller-supplied overrides and echoes them unchanged', () => {
    const samples = new Float32Array([1, 5, 10, 20, 40, 100]);
    const r = computeValueRange(samples, Number.NEGATIVE_INFINITY, 0, 50);
    expect(r.valueMin).toBe(0);
    expect(r.valueMax).toBe(50);
  });

  it('returns {0, 0} for a uniform (degenerate) field so callers can detect it', () => {
    const r = computeValueRange(new Float32Array(6).fill(42));
    expect(r.valueMin).toBe(0);
    expect(r.valueMax).toBe(0);
  });

  it('returns {0, 0} for an all-transparent field', () => {
    const r = computeValueRange(new Float32Array([0, 0, 0]), 0);
    expect(r.valueMin).toBe(0);
    expect(r.valueMax).toBe(0);
  });

  it('ignores cells at or below transparentBelow', () => {
    // Three 0s (transparent) + three hits — should only use the hits.
    const samples = new Float32Array([0, 0, 0, 10, 20, 40]);
    const r = computeValueRange(samples, 0);
    expect(r.valueMin).toBe(10);
    expect(r.valueMax).toBe(40);
  });

  it('filters out Infinity (unreachable FMM cells) from the auto-range', () => {
    const samples = new Float32Array([Infinity, 100, 200, 300, Infinity, 400]);
    const r = computeValueRange(samples);
    expect(r.valueMin).toBe(100);
    expect(r.valueMax).toBe(400);
  });

  it('filters NaN defensively', () => {
    const samples = new Float32Array([NaN, 5, 10, NaN]);
    const r = computeValueRange(samples);
    expect(r.valueMin).toBe(5);
    expect(r.valueMax).toBe(10);
  });

  it('mixed user override on one bound, auto on the other', () => {
    // Pin only valueMin=0; let max auto-detect.
    const samples = new Float32Array([100, 200, 500]);
    const r = computeValueRange(samples, Number.NEGATIVE_INFINITY, 0, undefined);
    expect(r.valueMin).toBe(0);
    expect(r.valueMax).toBe(500);
  });
});

describe('levelSeparatesField', () => {
  const campo = (frazioneSopra: number): Float32Array => {
    const v = new Float32Array(1000);
    const sopra = Math.round(frazioneSopra * 1000);
    for (let i = 0; i < 1000; i++) v[i] = i < sopra ? 20 : 0.5;
    return v;
  };

  it('tiene una soglia che divide davvero il campo', () => {
    expect(levelSeparatesField(campo(0.4), 10)).toBe(true);
  });

  it('scarta una soglia superata da quasi tutto il mare', () => {
    // È il caso dell'impatto da centinaia di gigatoni: la soglia dei
    // 3 m è superata ovunque, quindi l'isolinea non è più un confine.
    expect(levelSeparatesField(campo(0.99), 10)).toBe(false);
  });

  it('scarta una soglia che quasi nessuno raggiunge', () => {
    expect(levelSeparatesField(campo(0.005), 10)).toBe(false);
  });

  it('ignora le celle di terra (valori non positivi o non finiti)', () => {
    const v = new Float32Array([20, 20, 0.5, 0, Number.NaN, Number.POSITIVE_INFINITY]);
    // Fra le tre celle bagnate (20, 20, 0,5) due superano la soglia:
    // 0,67, dentro la finestra utile.
    expect(levelSeparatesField(v, 10)).toBe(true);
  });

  it('non esplode su un campo tutto asciutto', () => {
    expect(levelSeparatesField(new Float32Array([0, 0, Number.NaN]), 3)).toBe(false);
  });
});

describe('veilUpperBound', () => {
  it('prende il novantottesimo percentile, non il massimo assoluto', () => {
    const v = new Float32Array(100);
    for (let i = 0; i < 99; i++) v[i] = 10;
    v[99] = 100_000;
    expect(veilUpperBound(v)).toBeLessThan(1_000);
  });

  it('non scende mai sotto i dieci metri', () => {
    expect(veilUpperBound(new Float32Array([0.1, 0.2, 0.3]))).toBe(10);
  });
});
