import { describe, expect, it } from 'vitest';
import { BREAKING_INDEX } from '../../tsunamiCasualties.js';
import { m, sqm } from '../../units.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from '../landslide/simulate.js';
import { SOURCE_AMPLITUDE_CEILING, volcanoTsunami } from './tsunami.js';

/**
 * B-039. The ceiling the wave at a source is held to is the project's own
 * number. It was credited to McCowan (1894) until 16 September 2026, and
 * McCowan's solitary-wave breaking limit is 0.78 — which this project uses
 * correctly a few modules away.
 *
 * These tests do not say the ceiling is right. They say what it is, whose it
 * is not, and exactly which of the product's waves it decides, so that moving
 * it is a round with a named blast radius rather than a one-character edit.
 */
describe("B-039 the source ceiling is the project's own number, and says so", () => {
  it('is not the number the project uses for McCowan elsewhere', () => {
    expect(BREAKING_INDEX).toBe(0.78);
    expect(SOURCE_AMPLITUDE_CEILING).toBe(0.4);
    expect(SOURCE_AMPLITUDE_CEILING).not.toBe(BREAKING_INDEX);
  });

  it('decides the wave outright at Lituya Bay and Anak Krakatau', () => {
    // Both sit exactly on it: what a visitor sees is the ceiling, not the
    // relation above it. If either stops sitting on it, the ceiling moved and
    // this test is the place that says so.
    for (const key of ['LITUYA_BAY_1958', 'ANAK_KRAKATAU_2018'] as const) {
      const r = simulateLandslide({ ...LANDSLIDE_PRESETS[key].input });
      const wave = r.tsunami;
      expect(wave).not.toBeNull();
      const amplitude = Number(wave?.sourceAmplitude ?? 0);
      const depth = Number(wave?.meanOceanDepth ?? 0);
      expect(depth).toBeGreaterThan(0);
      expect(amplitude / depth).toBeCloseTo(SOURCE_AMPLITUDE_CEILING, 9);
    }
  });

  it('does not touch a confined basin, which has its own branch', () => {
    // A reservoir sloshes past a ceiling meant for open water (Vaiont).
    const r = volcanoTsunami({
      collapseVolumeM3: 2.7e8,
      slopeAngleRad: (35 * Math.PI) / 180,
      regime: 'subaerial',
      meanOceanDepth: m(238),
      confinedBasinArea: sqm(1.5e6),
    });
    expect(Number(r?.sourceAmplitude ?? 0) / Number(r?.meanOceanDepth ?? 1)).toBeGreaterThan(
      SOURCE_AMPLITUDE_CEILING
    );
  });

  it('holds a wave handed in from another relation to the same ceiling', () => {
    // The Heller path passes its own first crest in; the ceiling is a property
    // of the water column, so it applies there too — which is precisely why
    // whether 0.4 is right matters beyond the law that used to make the wave.
    const tall = volcanoTsunami({
      collapseVolumeM3: 3e7,
      slopeAngleRad: (35 * Math.PI) / 180,
      regime: 'subaerial',
      meanOceanDepth: m(120),
      sourceAmplitudeM: 10_000,
    });
    expect(Number(tall?.sourceAmplitude ?? 0)).toBeCloseTo(120 * SOURCE_AMPLITUDE_CEILING, 9);
  });
});
