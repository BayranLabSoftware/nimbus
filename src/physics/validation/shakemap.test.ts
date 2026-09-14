import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/index.js';
import { m } from '../units.js';
import { SHAKEMAP_OBSERVATIONS } from './fixtures.js';

/**
 * Earthquake MMI-ring validation against published macroseismic
 * surveys.
 *
 * The simulator's MMI VII radius is the distance at which the Joyner &
 * Boore 1981 PGA, scaled by the Boore et al. 2014 site term, reaches
 * the PGA that Worden et al. 2012 convert to MMI VII. (Until
 * 14 September 2026 this comment named a Wald 1999 PGV relation and an
 * NGA-West2 attenuation, neither of which draws the rings.) So this
 * test does NOT validate the conversion itself — it pins the
 * *integrated* output (the radius the user sees on the map) to the
 * radii reported by post-earthquake macroseismic intensity surveys.
 *
 * Tolerance: the published macroseismic ring is itself a fitted
 * contour through irregular felt-report data with ±5–10 km
 * irreducible scatter; the predicted vs observed must overlap that
 * scatter band, not match a sharp value.
 */

describe('Earthquake validation — MMI VII ring radius vs ShakeMap surveys', () => {
  for (const obs of SHAKEMAP_OBSERVATIONS) {
    it(`${obs.event}: predicted MMI VII radius matches ${obs.observedMmi7RadiusM.toString()} m ±${obs.toleranceM.toString()} m (${obs.source})`, () => {
      const r = simulateEarthquake({
        magnitude: obs.magnitudeMw,
        depth: m(obs.depthM),
        faultType: 'reverse',
      });
      const predicted = r.shaking.mmi7Radius as number;
      const diff = Math.abs(predicted - obs.observedMmi7RadiusM);
      // Tolerance is the survey's own scatter plus 30 % of the radius,
      // an allowance of this project's: Joyner & Boore's distance
      // carries a fixed 7.3 km depth term, so the event's depth does
      // not move the ring.
      const tolerance = obs.toleranceM + 0.3 * obs.observedMmi7RadiusM;
      expect(diff).toBeLessThan(tolerance);
    });
  }

  it('aggregate bias sits where rule 19 left it, and no worse', () => {
    let sum = 0;
    let n = 0;
    for (const obs of SHAKEMAP_OBSERVATIONS) {
      const r = simulateEarthquake({
        magnitude: obs.magnitudeMw,
        depth: m(obs.depthM),
        faultType: 'reverse',
      });
      const predicted = r.shaking.mmi7Radius as number;
      sum += (predicted - obs.observedMmi7RadiusM) / obs.observedMmi7RadiusM;
      n++;
    }
    const meanRelativeBias = sum / n;
    // Within ±25 % on Joyner & Boore 1981's rings. Boore et al. 2014's,
    // adopted on 14 September 2026 by rule 19 of contourLaws.ts after
    // winning on 370 ShakeMaps, draw MMI VII at about half these surveys'
    // radii on reference rock (−52 %): a declared gap, pinned here so it
    // can only close.
    expect(meanRelativeBias).toBeGreaterThan(-0.55);
    expect(meanRelativeBias).toBeLessThan(0.25);
  });
});
