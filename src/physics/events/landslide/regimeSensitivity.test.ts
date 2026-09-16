import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from './simulate.js';

/**
 * The regime is not a label: it picks K = 0.4 against K = 0.005, and a visitor
 * setting up a scenario usually cannot know which their slide was. The
 * catalogue of landslide-triggered tsunamis that rules 118 to 121 read does
 * not carry the distinction at all. So the result says how much the switch
 * decides, rather than printing one answer and leaving the other to be
 * discovered.
 */
describe('a landslide says how much its regime decides', () => {
  it('reports both regimes and how far apart they are', () => {
    const r = simulateLandslide({
      volumeM3: 1e8,
      slopeAngleDeg: 25,
      meanOceanDepth: m(500),
      regime: 'subaerial',
    });
    const s = r.regimeSensitivity;
    expect(s).not.toBeNull();
    if (s === null) return;
    expect(Number(s.subaerialAmplitude)).toBeGreaterThan(Number(s.submarineAmplitude));
    // The two prefactors are eighty apart; the cap and the density factor
    // bring what a visitor sees closer than that, but not close.
    expect(s.ratio).toBeGreaterThan(10);
  });

  it('agrees with whichever regime the scenario actually asked for', () => {
    for (const regime of ['subaerial', 'submarine'] as const) {
      const r = simulateLandslide({
        volumeM3: 1e8,
        slopeAngleDeg: 25,
        meanOceanDepth: m(500),
        regime,
      });
      const drawn = Number(r.tsunami?.sourceAmplitude ?? 0);
      const s = r.regimeSensitivity;
      expect(s).not.toBeNull();
      if (s === null) continue;
      const mine = regime === 'subaerial' ? s.subaerialAmplitude : s.submarineAmplitude;
      expect(Number(mine)).toBeCloseTo(drawn, 9);
    }
  });

  it('says nothing where there is no wave either way', () => {
    // Elm 1881: a slide that ends on dry land.
    const r = simulateLandslide({ ...LANDSLIDE_PRESETS.ELM_1881.input });
    expect(r.regimeSensitivity).toBeNull();
  });

  it('is computed for every preset that makes a wave', () => {
    for (const [key, p] of Object.entries(LANDSLIDE_PRESETS)) {
      const r = simulateLandslide({ ...p.input });
      const made = Number(r.tsunami?.sourceAmplitude ?? 0) > 0;
      expect(r.regimeSensitivity === null, key).toBe(!made);
    }
  });
});
