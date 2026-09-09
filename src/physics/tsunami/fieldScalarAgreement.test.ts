import { describe, expect, it } from 'vitest';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from '../events/landslide/simulate.js';
import { VOLCANO_PRESETS, simulateVolcano } from '../events/volcano/simulate.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { extractTsunamiMeta } from '../../store/useAppStore.js';
import type { ActiveResult } from '../../store/useAppStore.js';
import { m } from '../units.js';
import { spreadingFactor } from './amplitudeField.js';

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

/**
 * What the veil will show at `rangeM`, by calling the field's own
 * spreading law on the metadata the store hands it.
 *
 * It used to reimplement that law as `(R₀/r)^q`, and so went on
 * asserting agreement after the field gained its energy
 * normalisation and stopped computing that. A test that reimplements
 * what it is checking will pass whatever the code does; this one now
 * calls `spreadingFactor` and can only agree when there is something
 * to agree with.
 */
function veilAmplitudeAt(result: ActiveResult, rangeM: number): number {
  const meta = extractTsunamiMeta(result);
  if (meta === null) throw new Error('no tsunami metadata');
  const normalise = meta.spreadingExponent === undefined;
  const q = meta.spreadingExponent ?? 0.5;
  return meta.sourceAmplitudeM * spreadingFactor(meta.sourceCavityRadiusM, rangeM, q, normalise);
}

/** Deep water, far from any shelf: the veil and the published row are
 *  then the same quantity and must agree within a few per cent. */
const AT_1000_KM = 1_000_000;

describe('the amplitude veil agrees with the published far-field row', () => {
  /**
   * What the veil owes the published row, and what the row owes the
   * veil.
   *
   * Geometry first: the veil spreads and the compact-source rows
   * follow Lamb's 1/r, so at a thousand kilometres the veil stands
   * above them by (r/R₀)^0.5 — the dispersion the row carries and the
   * veil does not.
   *
   * Then the normalisation, which runs the other way. The veil's
   * spreading carries the energy of a ring, a factor √(4√π) ≈ 2.66
   * that the published rows do not have; they still hold the source
   * amplitude flat out to R₀ and decay from there. That is not a
   * difference of physics like the one above — it is the same physics
   * done twice, once corrected and once not, and the roadmap has it.
   * Until then it is measured here rather than left to be discovered.
   */
  const NORMALISATION_GAP = Math.sqrt(4 * Math.sqrt(Math.PI));
  const geometricGap = (cavityM: number): number =>
    (AT_1000_KM / cavityM) ** 0.5 / NORMALISATION_GAP;

  it('a submarine landslide keeps geometric spreading, and stands above its dispersed row', () => {
    const data = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(data.tsunami).not.toBeNull();
    if (data.tsunami === null) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'landslide', data }, AT_1000_KM);
    const gap = geometricGap(data.tsunami.cavityRadius);
    expect(veil / published).toBeGreaterThan(gap * 0.9);
    expect(veil / published).toBeLessThan(gap * 1.1);
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

  it('a megathrust — the veil is quieter than its row, and by how much', () => {
    // These two used to agree, and the agreement was worth pinning:
    // both spread geometrically, so a divergence would have been a
    // bug. They no longer do, for two reasons that are both the
    // veil being right and the row being behind.
    //
    // The veil carries the energy normalisation, √(4√π) ≈ 2.66, and
    // it spreads from half the fault's down-dip width where the row
    // spreads from half its along-strike length — 103 km against 351
    // for Tōhoku, another 1.8. Together the veil stands at about a
    // fifth of the row.
    //
    // The check on which of the two is right is DART 21413: the veil
    // reads 0.280 m there against the 0.30 recorded, the row 0.563.
    // Moving the row onto the veil's law is the right end state and
    // is not a one-line change — six anchored rows were fitted around
    // it, among them the G-TOH-DART golden case, the Tōhoku replay
    // fixture and the B-006 registry entry.
    const data = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    expect(data.tsunami).toBeDefined();
    if (data.tsunami === undefined) return;
    const published = data.tsunami.amplitudeAt1000km as number;
    const veil = veilAmplitudeAt({ type: 'earthquake', data }, AT_1000_KM);
    expect(veil / published).toBeGreaterThan(0.18);
    expect(veil / published).toBeLessThan(0.25);
  });
});
