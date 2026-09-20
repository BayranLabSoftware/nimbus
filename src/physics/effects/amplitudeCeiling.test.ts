import { describe, expect, it } from 'vitest';
import {
  CEILING_DERIVATION,
  OTHER_MAXIMA,
  PRESET_HEADROOM,
} from '../validation/amplitudeCeilingRules.js';
import {
  IMPULSE_WAVE_FIRST_CREST_CEILING,
  IMPULSE_WAVE_TESTED,
  impulseWaveAmplitudes,
  impulseProduct,
  type ImpulseWaveSlide,
} from './impulseWave.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from '../events/landslide/simulate.js';

/** Rules 541 to 547. */

/** The raw Eq. (3.26), without the ceiling, so the test can see what the
 *  ceiling did and did not cut. */
const uncappedFirstCrest = (s: ImpulseWaveSlide): number =>
  0.2 *
  impulseProduct(s) ** 0.5 *
  (s.widthM / s.depthM) ** 0.75 *
  Math.cos(((6 / 7) * s.angleDeg * Math.PI) / 180) ** 0.25 *
  s.depthM;

describe('rule 542: the ceiling is derived, not chosen', () => {
  it('is Eq. (3.26) at the corner of Table 3-3, re-derived here', () => {
    const { impulseProduct: P, relativeWidth: B, angleDeg } = CEILING_DERIVATION;
    const derived =
      0.2 * P ** 0.5 * B ** 0.75 * Math.cos(((6 / 7) * angleDeg * Math.PI) / 180) ** 0.25;
    expect(derived).toBeCloseTo(IMPULSE_WAVE_FIRST_CREST_CEILING, 6);
    expect(derived).toBeCloseTo(CEILING_DERIVATION.ceiling, 6);
  });

  it('sits at the corner the manual’s own limits put it at', () => {
    expect(CEILING_DERIVATION.impulseProduct).toBe(IMPULSE_WAVE_TESTED.impulseProduct[1]);
    expect(CEILING_DERIVATION.relativeWidth).toBe(IMPULSE_WAVE_TESTED.relativeWidth[1]);
    expect(CEILING_DERIVATION.angleDeg).toBe(IMPULSE_WAVE_TESTED.angleDeg[0]);
  });

  it('is the 0.94 the code has cited since 17 September, now with a derivation', () => {
    expect(IMPULSE_WAVE_FIRST_CREST_CEILING).toBeCloseTo(0.94, 2);
  });
});

describe('rule 543: it cuts nothing inside the fitted box', () => {
  it('leaves every corner and a grid of the box exactly where it was', () => {
    // A slide is built to hit a target P, b/h and α directly: thickness and
    // width set S and B, and the velocity is solved for the Froude number
    // that Eq. (3.12) needs. Walking the box this way reaches its corners,
    // which sampling the form's inputs would not.
    const depthM = 100;
    let checked = 0;
    for (const P of [0.13, 0.5, 1.0, 1.5, 2.08]) {
      for (const B of [0.83, 2, 3.5, 5]) {
        for (const angleDeg of [30, 45, 60, 90]) {
          const cosTerm = Math.cos(((6 / 7) * angleDeg * Math.PI) / 180);
          // Choose S and M at the middle of their ranges and solve for F.
          const S = 0.375;
          const M = 0.625;
          const F = P / (S ** 0.5 * M ** 0.25 * cosTerm ** 0.5);
          const widthM = B * depthM;
          const thicknessM = S * depthM;
          const slide: ImpulseWaveSlide = {
            froude: F,
            thicknessM,
            widthM,
            // Volume back out of M = ρ_s V / (ρ_w b h²).
            volumeM3: (M * 1_000 * widthM * depthM * depthM) / 1_700,
            densityKgM3: 1_700,
            angleDeg,
            depthM,
          };
          expect(impulseProduct(slide), `P at ${String(P)}`).toBeCloseTo(P, 6);
          const capped = impulseWaveAmplitudes(slide).firstCrest;
          const raw = uncappedFirstCrest(slide);
          expect(capped, `P=${String(P)} B=${String(B)} α=${String(angleDeg)}`).toBeCloseTo(raw, 9);
          expect(raw / depthM).toBeLessThanOrEqual(IMPULSE_WAVE_FIRST_CREST_CEILING + 1e-9);
          checked++;
        }
      }
    }
    expect(checked).toBe(80);
  });

  it('binds exactly at the corner and nowhere below it', () => {
    const depthM = 100;
    const at = (P: number): { capped: number; raw: number } => {
      const angleDeg = CEILING_DERIVATION.angleDeg;
      const cosTerm = Math.cos(((6 / 7) * angleDeg * Math.PI) / 180);
      const S = 0.375;
      const M = 0.625;
      const slide: ImpulseWaveSlide = {
        froude: P / (S ** 0.5 * M ** 0.25 * cosTerm ** 0.5),
        thicknessM: S * depthM,
        widthM: CEILING_DERIVATION.relativeWidth * depthM,
        volumeM3: (M * 1_000 * CEILING_DERIVATION.relativeWidth * depthM * depthM * depthM) / 1_700,
        densityKgM3: 1_700,
        angleDeg,
        depthM,
      };
      return { capped: impulseWaveAmplitudes(slide).firstCrest, raw: uncappedFirstCrest(slide) };
    };
    const corner = at(CEILING_DERIVATION.impulseProduct);
    expect(corner.raw / depthM).toBeCloseTo(IMPULSE_WAVE_FIRST_CREST_CEILING, 6);
    expect(corner.capped).toBeCloseTo(corner.raw, 6);
    // One step past the corner and it bites.
    const past = at(CEILING_DERIVATION.impulseProduct * 1.5);
    expect(past.raw).toBeGreaterThan(past.capped);
    expect(past.capped).toBeCloseTo(IMPULSE_WAVE_FIRST_CREST_CEILING * depthM, 6);
  });
});

describe('rule 545: the other two amplitudes keep their own maxima', () => {
  it('does not cut the trough, which passes the water column inside the box', () => {
    const { impulseProduct: P, relativeWidth: B, angleDeg } = CEILING_DERIVATION;
    const c = Math.cos(((6 / 7) * angleDeg * Math.PI) / 180);
    expect(0.35 * P ** 0.5 * B ** 0.5 * c ** 0.5).toBeCloseTo(OTHER_MAXIMA.firstTrough, 5);
    expect(0.14 * P ** 0.25 * B ** 0.25 * c ** 0.25).toBeCloseTo(OTHER_MAXIMA.secondCrest, 5);
    // The point of rule 545: one ceiling for all three would cut this.
    expect(OTHER_MAXIMA.firstTrough).toBeGreaterThan(IMPULSE_WAVE_FIRST_CREST_CEILING);
    expect(OTHER_MAXIMA.firstTrough).toBeGreaterThan(1);
  });
});

describe('rule 546: what the round predicted would not move', () => {
  it('leaves every landslide preset where it was', () => {
    const at = (k: keyof typeof LANDSLIDE_PRESETS): number =>
      Number(simulateLandslide(LANDSLIDE_PRESETS[k].input).tsunami?.sourceAmplitude ?? 0);
    expect(at('LITUYA_BAY_1958')).toBeCloseTo(93.9, 1);
    expect(at('ANAK_KRAKATAU_2018')).toBeCloseTo(149.99, 1);
    expect(at('VAIONT_1963')).toBeCloseTo(162.0, 1);
    expect(at('STOREGGA_8200_BP')).toBeCloseTo(6.29, 2);
  });

  it('confirms the headroom the prediction was made on', () => {
    const headroom = (k: keyof typeof PRESET_HEADROOM, depthM: number): number =>
      Number(simulateLandslide(LANDSLIDE_PRESETS[k].input).tsunami?.sourceAmplitude ?? 0) / depthM;
    expect(headroom('LITUYA_BAY_1958', 120)).toBeCloseTo(PRESET_HEADROOM.LITUYA_BAY_1958, 2);
    expect(headroom('ANAK_KRAKATAU_2018', 200)).toBeCloseTo(PRESET_HEADROOM.ANAK_KRAKATAU_2018, 2);
    expect(headroom('VAIONT_1963', 238)).toBeCloseTo(PRESET_HEADROOM.VAIONT_1963, 2);
  });
});
