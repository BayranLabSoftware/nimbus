import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { campbellBozorgnia2014Pga, campbellBozorgnia2014Sigma } from './campbellBozorgnia2014.js';
import { CB14_GRID, CB14_REFERENCE_PGA } from './campbellBozorgnia2014Reference.js';

/**
 * Rule 385: faithful to its source, or it is not a candidate.
 *
 * An implementation written from a paper's equations is worth what its
 * agreement with the published model is worth, and nothing more. The grid
 * and the tolerance are rule 385's, fixed before this file existed.
 */
describe('Campbell & Bozorgnia 2014 against its own implementation', () => {
  it('agrees to within one part in ten thousand over rule 385’s grid', () => {
    let worst = 0;
    let worstCase = '';
    let index = 0;
    for (const magnitude of CB14_GRID.magnitude) {
      for (const rrupKm of CB14_GRID.ruptureDistanceKm) {
        for (const vs30 of CB14_GRID.vs30) {
          for (const depthKm of CB14_GRID.hypocentreDepthKm) {
            for (const style of CB14_GRID.style) {
              const expected = CB14_REFERENCE_PGA[index];
              index += 1;
              expect(expected).toBeDefined();
              if (expected === undefined) continue;
              const got = campbellBozorgnia2014Pga({
                magnitude,
                ruptureDistance: m(rrupKm * 1_000),
                vs30,
                hypocentreDepth: m(depthKm * 1_000),
                style,
              });
              const relative = Math.abs(got - expected) / expected;
              if (relative > worst) {
                worst = relative;
                worstCase = `Mw ${magnitude.toString()}, R ${rrupKm.toString()} km, Vs30 ${vs30.toString()}, h ${depthKm.toString()} km, ${style}`;
              }
            }
          }
        }
      }
    }
    expect(index, 'every reference value is used').toBe(CB14_REFERENCE_PGA.length);
    expect(worst, `worst at ${worstCase}`).toBeLessThan(1e-4);
  });

  /**
   * The reason the model is here — and the shape of it is NOT the obvious
   * one, which is why this test says what was measured rather than what was
   * expected.
   *
   * At a fixed distance to the rupture, CB14's depth term (c17 and c18,
   * both positive) makes a deeper source shake HARDER: at equal R_rup the
   * path from a deep source spends less of itself in the slow, lossy top of
   * the crust. What makes a deep earthquake gentler at the surface is the
   * distance itself, which Boore et al. 2014 in Joyner-Boore distance has
   * no way to see.
   *
   * Put together at the epicentre, the two pull against each other, and
   * between 10 and 20 km deep the depth term briefly WINS at moderate
   * magnitudes: at Mw 5.5 the PGA goes 0.247, 0.205, 0.215, 0.242 at 5, 10,
   * 15 and 20 km. It is not monotone, and saying otherwise here would be
   * writing down a wish. Over the range that matters it falls hard and
   * without exception — by a factor of at least 2.8 from 5 km to 50 km at
   * every magnitude tested — and that is what is asserted.
   */
  it('a source 50 km down shakes its epicentre a third as hard as one at 5', () => {
    const atDepth = (magnitude: number, depthKm: number): number =>
      campbellBozorgnia2014Pga({
        magnitude,
        ruptureDistance: m(depthKm * 1_000),
        vs30: 400,
        hypocentreDepth: m(depthKm * 1_000),
        style: 'reverse',
      });
    for (const magnitude of [5, 5.5, 6, 6.5, 7, 7.5]) {
      const shallow = atDepth(magnitude, 5);
      const deep = atDepth(magnitude, 50);
      expect(deep / shallow, `Mw ${magnitude.toString()}`).toBeLessThan(0.4);
      // And it keeps falling past 50: nothing turns back up at the bottom.
      expect(atDepth(magnitude, 65)).toBeLessThan(deep);
    }
  });

  /**
   * And the depth term itself counts from 7 km and stops at 20, so at equal
   * distance two sources at 30 and 60 km differ in nothing at all.
   */
  it('the depth term counts from 7 km and saturates at 20', () => {
    const at = (depthKm: number): number =>
      campbellBozorgnia2014Pga({
        magnitude: 6.5,
        ruptureDistance: m(20_000),
        vs30: 400,
        hypocentreDepth: m(depthKm * 1_000),
        style: 'reverse',
      });
    expect(at(3)).toBeCloseTo(at(7), 12);
    expect(at(30)).toBeCloseTo(at(60), 12);
    // Positive coefficients: at equal distance, deeper is stronger.
    expect(at(20)).toBeGreaterThan(at(7));
  });

  it('the scatter is the model’s, and narrows with magnitude', () => {
    expect(campbellBozorgnia2014Sigma(4)).toBeGreaterThan(campbellBozorgnia2014Sigma(6));
    // tau1/phi1 below Mw 4.5, tau2/phi2 above 5.5, interpolated between.
    expect(campbellBozorgnia2014Sigma(4)).toBeCloseTo(Math.hypot(0.409, 0.734), 12);
    expect(campbellBozorgnia2014Sigma(7)).toBeCloseTo(Math.hypot(0.322, 0.492), 12);
  });
});
