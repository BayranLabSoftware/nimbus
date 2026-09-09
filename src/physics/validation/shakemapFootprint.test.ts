import { describe, expect, it } from 'vitest';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { SHAKEMAP_FOOTPRINTS, type ShakemapFootprint } from './shakemapFixtures.js';

/**
 * The first layer, on its own.
 *
 * A death toll is the product of five models — intensity, exposure,
 * vulnerability, geometry, warning — and when it is wrong it does not
 * say which. This suite asks only the first: how much ground does the
 * model shake at MMI VII, VIII and IX, against how much the USGS
 * ShakeMap recorded.
 *
 * Area, not shape. The model draws a circle for a small rupture and a
 * stadium around a long one; the earth draws whatever the geology
 * says. What the two can honestly be compared on is how much ground
 * shook that hard.
 *
 * The numbers this found on its first run, all of them invisible
 * while only the toll was checked:
 *
 *   - Tōhoku's model shakes ~180 000 km² at MMI IX. The 2011 event
 *     never reached MMI IX anywhere — its maximum was 8.18. That band
 *     is where the model's 200 000 dead come from, against 18 500.
 *   - The two small Italian events are painted three to four times
 *     too wide in radius, ten in area, and their tolls still came out
 *     under — two errors pulling opposite ways.
 *   - Northridge is the other way: too small by three in area.
 *
 * So the footprint is not uniformly wrong. It is too generous for a
 * megathrust and too mean for a small crustal event, which is what a
 * single point-source attenuation inflated into a rupture stadium
 * would do.
 */

/** Model footprint (km²) at or above a threshold. */
function modelAreaKm2(footprint: ShakemapFootprint, threshold: 7 | 8 | 9): number {
  const preset = EARTHQUAKE_PRESETS[footprint.preset as keyof typeof EARTHQUAKE_PRESETS];
  const r = simulateEarthquake(preset.input);
  const radiusM =
    threshold === 7
      ? (r.shaking.mmi7Radius as number)
      : threshold === 8
        ? (r.shaking.mmi8Radius as number)
        : (r.shaking.mmi9Radius as number);
  if (!(radiusM > 0)) return 0;
  const radiusKm = radiusM / 1000;
  if (!r.isExtendedSource) return Math.PI * radiusKm * radiusKm;
  // An extended source is a stadium: the rupture rectangle grown by
  // the radius on every side, which is the shape the globe draws and
  // the casualty bands count inside.
  const lKm = (r.ruptureLength as number) / 1000;
  const wKm = (r.ruptureWidth as number) / 1000;
  return lKm * wKm + 2 * radiusKm * (lKm + wKm) + Math.PI * radiusKm * radiusKm;
}

describe('the shaking footprint against the ShakeMap that recorded it', () => {
  it('has a fixture for every earthquake the toll net gates on', () => {
    expect(SHAKEMAP_FOOTPRINTS.length).toBeGreaterThanOrEqual(6);
    for (const f of SHAKEMAP_FOOTPRINTS) {
      expect(
        EARTHQUAKE_PRESETS[f.preset as keyof typeof EARTHQUAKE_PRESETS],
        f.preset
      ).toBeDefined();
    }
  });

  it('reports every footprint against its record', () => {
    const rows: string[] = [];
    for (const f of SHAKEMAP_FOOTPRINTS) {
      for (const thr of [7, 8, 9] as const) {
        const model = modelAreaKm2(f, thr);
        const observed = f.areaKm2[thr];
        const ratio = observed > 0 ? model / observed : model > 0 ? Infinity : 1;
        rows.push(
          `mmi  ${f.name.padEnd(16)} MMI≥${thr.toString()}  observed ${observed.toFixed(0).padStart(7)} km²  ` +
            `model ${model.toFixed(0).padStart(7)}  ${
              Number.isFinite(ratio) ? `${ratio.toFixed(2)}×` : 'from nothing'
            }`
        );
      }
    }
    console.info(rows.join('\n'));
    expect(rows.length).toBe(SHAKEMAP_FOOTPRINTS.length * 3);
  });

  /**
   * Where the model stands today, pinned.
   *
   * These are residuals, not tolerances: numbers to be driven to one,
   * and a pin so that any change to the intensity field — in either
   * direction — shows up here instead of hiding inside a toll. The
   * value is the model's area over the ShakeMap's; `Infinity` means
   * the model shakes ground the event never shook at all.
   */
  const DECLARED: Record<string, Partial<Record<7 | 8 | 9, number>>> = {
    'Northridge 1994': { 7: 0.32, 8: 0.21 },
    "L'Aquila 2009": { 7: 8.92, 8: Infinity },
    'Amatrice 2016': { 7: 18.19, 8: Infinity },
    'Gorkha 2015': { 7: 0.42, 8: 2.77, 9: Infinity },
    'Tōhoku 2011': { 7: 1.3, 8: 3.12, 9: Infinity },
    'Kokoxili 2001': { 7: 0.36, 8: 0.48, 9: 3.97 },
  };

  it('the footprint sits where it was last measured, and no worse', () => {
    for (const f of SHAKEMAP_FOOTPRINTS) {
      const declared = DECLARED[f.name];
      expect(declared, f.name).toBeDefined();
      for (const thr of [7, 8, 9] as const) {
        const observed = f.areaKm2[thr];
        const model = modelAreaKm2(f, thr);
        const expected = declared?.[thr];
        if (expected === undefined) {
          // Nothing declared means both are zero: the event never
          // reached this intensity and neither does the model.
          expect(observed, `${f.name} MMI≥${thr.toString()} observed`).toBe(0);
          expect(model, `${f.name} MMI≥${thr.toString()} model`).toBe(0);
          continue;
        }
        if (expected === Infinity) {
          expect(observed, `${f.name} MMI≥${thr.toString()}`).toBe(0);
          expect(model, `${f.name} MMI≥${thr.toString()} invents this band`).toBeGreaterThan(0);
          continue;
        }
        const ratio = model / observed;
        expect(ratio, `${f.name} MMI≥${thr.toString()}`).toBeGreaterThan(expected * 0.9);
        expect(ratio, `${f.name} MMI≥${thr.toString()}`).toBeLessThan(expected * 1.1);
      }
    }
  });

  it('four events are shaken at an intensity they never reached', () => {
    // The sharpest thing this anchor says, and the one that explains
    // Tōhoku's headline: the model paints 180 747 km² of Japan at MMI
    // IX, and the 2011 ShakeMap's maximum anywhere was 8.18. That
    // band is where 200 000 of the model's dead come from, against a
    // record of 18 500.
    //
    // A laboratory-level model has nothing in this list. Today it has
    // four, and the count is pinned so it can only go down.
    //
    // Drawing the contours with NGA-West2 instead of Joyner–Boore
    // empties this list, and was tried and reverted on 9 September:
    // it also takes Northridge's MMI VII ring to 9.9 km where both
    // the ShakeMap grid (30 km equivalent) and Wald's macroseismic
    // survey (25 km) put it, breaks the Amatrice toll gate, and its
    // site term is a power-law surrogate rather than the published
    // BSSA14 one. See docs/ROADMAP.md.
    const invented: string[] = [];
    for (const f of SHAKEMAP_FOOTPRINTS) {
      for (const thr of [7, 8, 9] as const) {
        if (f.areaKm2[thr] > 0) continue;
        if (modelAreaKm2(f, thr) > 0) invented.push(`${f.name} MMI≥${thr.toString()}`);
      }
    }
    expect(invented).toEqual([
      "L'Aquila 2009 MMI≥8",
      'Amatrice 2016 MMI≥8',
      'Gorkha 2015 MMI≥9',
      'Tōhoku 2011 MMI≥9',
    ]);
  });
});
