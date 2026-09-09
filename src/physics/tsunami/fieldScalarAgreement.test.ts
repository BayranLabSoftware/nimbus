import { describe, expect, it } from 'vitest';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from '../events/landslide/simulate.js';
import { VOLCANO_PRESETS, simulateVolcano } from '../events/volcano/simulate.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { extractTsunamiMeta } from '../../store/useAppStore.js';
import type { ActiveResult } from '../../store/useAppStore.js';
import { m } from '../units.js';

/**
 * Where the veil and the published row agree, and where they must not.
 *
 * Every tsunami-bearing event publishes a far-field amplitude — the
 * "wave at 1 000 km" row — from its own module. The globe's amplitude
 * veil is a second calculation, `amplitudeField.ts`, driven by the
 * source metadata `extractTsunamiMeta` hands it. The two are not the
 * same physics, and the difference is not a bug:
 *
 *   - The veil spreads geometrically, A ∝ (R₀/r)^0.5: energy over a
 *     growing circumference, whatever made the wave. It is drawn from
 *     the source out to the near field, where a coast is a few tens of
 *     kilometres away and dispersion has not yet had room to act.
 *   - The published row for a compact source — a burst, a caldera
 *     collapse, a landslide — follows Lamb 1932's 1/r, which is that
 *     same geometry plus the dispersion a short wave suffers over a
 *     thousand kilometres. Right at a thousand kilometres, and ruinous
 *     nearer: applied from the source it would stand the Sunda Strait
 *     under half a metre of water where the 2018 wave drowned four
 *     hundred people, and the coastal toll would read one.
 *
 * So this suite pins two different things. For a megathrust, whose
 * published row is geometric too, veil and row must agree — and the
 * store used to hand the field a quarter of the rupture length where
 * the seismic module spreads from a half, leaving the veil a factor
 * √2 quieter than the number beside it. For a compact source, the
 * divergence is pinned with its size, so it stays visible and nobody
 * closes it by accident.
 */

/** What the veil will show at `rangeM`: A₀ · (R₀ / r)^q, the law of
 *  `amplitudeField.ts` on the metadata the store hands it. */
function veilAmplitudeAt(result: ActiveResult, rangeM: number): number {
  const meta = extractTsunamiMeta(result);
  if (meta === null) throw new Error('no tsunami metadata');
  const q = meta.spreadingExponent ?? 0.5; // the field's own default
  const r = Math.max(rangeM, meta.sourceCavityRadiusM);
  return meta.sourceAmplitudeM * (meta.sourceCavityRadiusM / r) ** q;
}

/** Deep water, far from any shelf: the veil and the published row are
 *  then the same quantity and must agree within a few per cent. */
const AT_1000_KM = 1_000_000;

describe('the amplitude veil agrees with the published far-field row', () => {
  /** The veil, being geometric, stands above the dispersed row at
   *  1 000 km by exactly (r / R₀)^0.5 — the dispersion the row carries
   *  and the veil does not. Pinned so the gap stays visible. */
  const geometricGap = (cavityM: number): number => (AT_1000_KM / cavityM) ** 0.5;

  it('a submarine landslide keeps geometric spreading, and stands above its dispersed row', () => {
    const data = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(data.tsunami).not.toBeNull();
    if (data.tsunami === null) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'landslide', data }, AT_1000_KM);
    expect(veil / published).toBeCloseTo(geometricGap(data.tsunami.cavityRadius), 1);
    // Storegga's slide is 96 km across: a broad source, so the gap is small.
    expect(veil / published).toBeLessThan(5);
  });

  it('a flank collapse is compact, so its gap at 1 000 km is large — and near the shore it is the veil that is right', () => {
    const data = simulateLandslide(LANDSLIDE_PRESETS.ANAK_KRAKATAU_2018.input);
    expect(data.tsunami).not.toBeNull();
    if (data.tsunami === null) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'landslide', data }, AT_1000_KM);
    expect(veil / published).toBeGreaterThan(10);
    // The near field is the one the toll reads, and there the veil
    // stands where the 2018 survey found the water: metres, not
    // centimetres, on coasts a few tens of kilometres away.
    const at50km = veilAmplitudeAt({ type: 'landslide', data }, 50_000);
    expect(at50km).toBeGreaterThan(1);
    expect(at50km).toBeLessThan(20);
  });

  it('a caldera collapse spreads geometrically too', () => {
    const data = simulateVolcano(VOLCANO_PRESETS.KRAKATAU_1883.input);
    if (data.tsunami === undefined) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'volcano', data }, AT_1000_KM);
    expect(veil / published).toBeCloseTo(geometricGap(data.tsunami.cavityRadius), 1);
  });

  it('an underwater burst spreads geometrically too', () => {
    const base = Object.values(EXPLOSION_PRESETS)[0];
    if (base === undefined) throw new Error('no explosion preset');
    // No shipped preset detonates in the sea: put one on a 1 km shelf,
    // at the depth where a burst actually makes a wave — the
    // depth-of-burst curve gives a charge resting on the surface
    // almost nothing, which is the point of it.
    const kt = base.input.yieldMegatons * 1_000;
    const data = simulateExplosion({
      ...base.input,
      heightOfBurst: m(-4 * Math.cbrt(kt)),
      waterDepth: m(1_000),
    });
    expect(data.tsunami).toBeDefined();
    if (data.tsunami === undefined) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'explosion', data }, AT_1000_KM);
    expect(veil / published).toBeCloseTo(geometricGap(data.tsunami.cavityRadius), 1);
  });

  it('a megathrust — a line source, cylindrical from half the rupture, so veil and row agree', () => {
    const data = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    expect(data.tsunami).toBeDefined();
    if (data.tsunami === undefined) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'earthquake', data }, AT_1000_KM);
    expect(veil / published).toBeGreaterThan(0.9);
    expect(veil / published).toBeLessThan(1.1);
  });
});
