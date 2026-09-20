import { describe, expect, it } from 'vitest';
import { EARTHQUAKE_PRESETS } from '../events/earthquake/simulate.js';
import { SHAKEMAP_FOOTPRINTS } from './shakemapFixtures.js';
// The computation lives beside the fixtures so that this suite and the
// validation report read the same one.
import { EXPECTED_RADIUS_SCATTER, modelAreaKm2 } from './shakemapFootprint.js';

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
    // Re-pinned on 20 September 2026, when the cell chosen from the
    // re-filtered frontier was adopted: Boore et al. 2014's rings at
    // Thompson & Worden's point-source distance, laid on the rupture's
    // surface projection, with the topmost casualty band bounded by the
    // peak. Rule 44: the figures the earlier rules published move.
    //
    // They do NOT all move the same way, and the title of this test used
    // to say "and no worse", which is no longer true and has been
    // dropped. Against the values pinned on 14 September:
    //
    //   Northridge   0.32   -> 0.733   and 0.0831 -> 0.484   much better
    //   Gorkha       0.372  -> 0.325   and 1.92   -> 1.531   mixed
    //   Tohoku       1.53   -> 1.526   and 2.84   -> 2.843   unmoved, as
    //                it is an extended source and the correction is read
    //                only for a point one
    //   Kokoxili     0.373  -> 0.273   and 0.326  -> 0.149   worse
    //   L'Aquila     2.03   -> 6.822                         much worse
    //   Amatrice     6.08   -> 17.451                        much worse
    //
    // The two Apennine normal-faulting events were already the ones both
    // laws overdrew by three to eleven times, and a wider ring overdraws
    // them further. On the 116 ShakeMaps of rule 405 the same change
    // takes the area bias from 0.393x to 1.022x; these six are not that
    // jury and never were. `0` is a band the ShakeMap reached and the
    // model does not.
    'Northridge 1994': { 7: 0.733, 8: 0.484 },
    "L'Aquila 2009": { 7: 6.822 },
    'Amatrice 2016': { 7: 17.451 },
    'Gorkha 2015': { 7: 0.325, 8: 1.531 },
    'Tōhoku 2011': { 7: 1.526, 8: 2.843 },
    'Kokoxili 2001': { 7: 0.273, 8: 0.149, 9: 0 },
  };

  it('the footprint sits where it was last measured', () => {
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
        if (expected === 0) {
          expect(observed, `${f.name} MMI≥${thr.toString()}`).toBeGreaterThan(0);
          expect(model, `${f.name} MMI≥${thr.toString()} misses this band`).toBe(0);
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

  it('is unbiased across the events, with the scatter ground motion has', () => {
    // The correction that matters to reading every row above.
    //
    // The model predicts the MEDIAN ground motion; a ShakeMap records
    // one realisation of it. Comparing the two event by event and
    // calling a factor of two or three a defect is a category error:
    // the published aleatory scatter of PGA is σ_lnY ≈ 0.6 (Boore et
    // al. 2014, M ≥ 5.5), and PGA falls as about R^(−0.71) at these
    // ranges, so one sigma of ground motion is a factor of 2.3 in
    // radius and 5.4 in area before anything is wrong at all.
    //
    // What a median model can honestly be held to is being centred,
    // and to scattering no more than the ground does. It is: the
    // geometric mean radius ratio across every band that exists is
    // 0.71 on Boore et al. 2014's rings (1.18 on Joyner & Boore 1981's),
    // and the spread is σ_ln = 0.82 (0.71) — under the 0.85 the
    // published ground-motion sigma implies, and above the 0.49 its
    // between-event part alone would (EXPECTED_RADIUS_SCATTER says why
    // the first is a ceiling).
    const logs: number[] = [];
    for (const f of SHAKEMAP_FOOTPRINTS) {
      for (const thr of [7, 8, 9] as const) {
        const observed = f.areaKm2[thr];
        const model = modelAreaKm2(f, thr);
        if (observed <= 0 || model <= 0) continue;
        // Areas to equivalent radii: the scatter is a property of the
        // ground motion, which lives in distance rather than in area.
        logs.push(0.5 * Math.log(model / observed));
      }
    }
    expect(logs.length).toBeGreaterThanOrEqual(10);
    const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
    const sd = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length);
    // Is the bias distinguishable from zero? That is the question a
    // median can be asked, and the answer is a standard error rather
    // than a bound somebody picked: with this much scatter and this
    // few events, se = σ/√n ≈ 0.21, so anything inside about two of
    // those is a model that cannot be shown to be off-centre.
    const standardError = sd / Math.sqrt(logs.length);
    expect(Math.abs(mean) / standardError, 'bias in standard errors').toBeLessThan(2);
    // And scattering like ground motion rather than like a bug: under
    // the ceiling one sigma of ground motion implies. Until 14 September
    // this bound was 0.5 / 0.71 + 0.25, on a misquoted sigma with an
    // allowance on top; the sigma Boore et al. give needs none.
    expect(sd, 'σ_ln of the radius ratio').toBeLessThan(EXPECTED_RADIUS_SCATTER);
  });

  it('no event is shaken at an intensity it never reached', () => {
    // On Joyner & Boore 1981's rings four were: the model painted
    // 180 747 km² of Japan at MMI IX where the 2011 ShakeMap's maximum
    // anywhere was 8.18, and L'Aquila, Amatrice and Gorkha each gained a
    // band they never had. Boore et al. 2014's saturation, adopted on
    // 14 September 2026 by rule 19 of contourLaws.ts, invents none — and
    // misses Kokoxili's 1 700 km² of MMI IX instead, pinned above.
    const invented: string[] = [];
    for (const f of SHAKEMAP_FOOTPRINTS) {
      for (const thr of [7, 8, 9] as const) {
        if (f.areaKm2[thr] > 0) continue;
        if (modelAreaKm2(f, thr) > 0) invented.push(`${f.name} MMI≥${thr.toString()}`);
      }
    }
    expect(invented).toEqual([]);
  });
});
