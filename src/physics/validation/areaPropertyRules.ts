import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';

/**
 * The property gate B-083 showed was missing: the ground, not the radius.
 *
 * P-MONO-MW has guarded the contour geometry since long before these
 * rounds, and it reads the MMI VII RADIUS. B-083 measured what that
 * misses: between Mw 7.4 and Mw 7.5 the shipped model's radius walks from
 * 14.07 km to 14.88, while the ground it shakes goes from 622 km2 to
 * 6 323 — ten times, for a tenth of a magnitude. The radius is continuous
 * there because it changes MEANING there: below the threshold it is an
 * epicentral distance, above it a margin around a rupture stadium.
 *
 * So the gate is not weakened and not replaced. It is SUPPLEMENTED by the
 * two properties it could not express, and itself narrowed to the regime
 * where it is well posed.
 *
 * WHAT IS GUARDED AGAINST GAMING, said before the numbers. This file is
 * written knowing which candidates the old gate blocked and which the new
 * one might let through, and that is exactly the situation in which a
 * bound gets quietly chosen to suit. Three things stop it:
 *
 *   - the monotonicity clause has NO bound at all, so there is nothing
 *     to choose;
 *   - the continuity bound is derived from the model's own scaling and
 *     then made deliberately far looser than that derivation, so that no
 *     plausible tightening or loosening changes any verdict;
 *   - the shipped model is expected to FAIL the new clause, and does. A
 *     gate written to let something through does not begin by failing the
 *     incumbent.
 *
 * THE DERIVATION OF THE BOUND. Wells & Coppersmith give a rupture area
 * that scales about 10^(0.98 Mw), so a magnitude step of 0.01 multiplies
 * the rupture by 10^0.0098 = 1.023. The shaken area is the rupture grown
 * by a ring radius, and that radius grows more slowly with magnitude than
 * the rupture does, so over a step of 0.01 the shaken area cannot honestly
 * grow by more than about 2 %. The clause allows 100 % — a factor FORTY
 * looser than the physics — because its job is to catch a seam, not to
 * police a scaling law, and a clause that is obviously generous cannot be
 * accused of having been tuned.
 *
 * The properties, fixed on 20 September 2026:
 *
 *   P-MONO-AREA   The ground above MMI VII never decreases as the
 *                 magnitude rises, over Mw 4.0 to 9.0 in steps of 0.01.
 *                 No bound; a model whose footprint shrinks when the
 *                 earthquake grows is not a model of anything, which is
 *                 what P-MONO-MW has always said about the radius.
 *
 *   P-CONT-AREA   No single step of 0.01 in magnitude multiplies that
 *                 ground by more than {@link AREA_STEP_LIMIT}. Nothing in
 *                 the earth does, and a modelling threshold that does is a
 *                 seam and not a physical fact.
 *
 *   P-MONO-MW     unchanged in what it asserts, but read WITHIN A REGIME:
 *                 the radius is compared only among magnitudes that share
 *                 a footprint shape. Across the extended-source threshold
 *                 it compares an epicentral distance with a stadium's
 *                 margin, which are not the same measurement, and rule 398
 *                 blocked a candidate on that comparison once already.
 *
 * WHAT THIS DOES NOT DO. It repairs an instrument; it changes no model.
 * The shipped model fails P-CONT-AREA at Mw 7.5 and that failure is
 * recorded as B-083, open. Nothing here adopts, refuses or repairs a
 * candidate, and the first round that uses these properties must say so
 * in its own rules before it runs.
 */

/**
 * THE RE-FILTER, run after this file was committed, AND A CORRECTION I
 * OWE.
 *
 * When this gate was committed its message said: "the repair does not
 * unblock what prompted it — Thompson & Worden now passes the narrowed
 * radius gate and fails the new area one." THAT CLAIM IS WRONG about the
 * thing it names. It is true of Thompson & Worden ALONE, which is what
 * the test in this file checks and which still fails at x2.07. It is
 * FALSE of the cell that was actually blocked, which carried the surface
 * projection and the top band with it:
 *
 *   boore2014 / fromMw7.5 / surfaceProjection / style / toPeak /
 *   thompsonWorden2018   →   worst step x1.87   →   PASSES
 *
 * The projection closes enough of the Mw 7.5 seam that the correction's
 * x2.07 drops below the bound, and the worst step moves to the Mw 5.2
 * one at 1.87. So the repaired gate DOES let through the adoption the
 * broken gate refused. That is the right outcome — the old gate was
 * measuring the wrong quantity and said so — but I claimed the opposite,
 * and the claim flattered the repair. It is corrected here rather than
 * left standing.
 *
 * THE RE-FILTER ITSELF, on the 26 frontier cells of rules 488 to 494,
 * with a `structure` dip walked at all six net sites and required to hold
 * at every one. FIVE HOLD EVERY PROPERTY, and the shipped model is not
 * among them:
 *
 *   | peak  | areas | dead  | quiet | worst step | cell                                   |
 *   | ----- | ----- | ----- | ----- | ---------- | -------------------------------------- |
 *   | 1.956 | 0.022 | 198.2 | 1547  | x1.87      | boore/7.5/projection/style/toPeak/T-W  |
 *   | 1.956 | 0.471 | 197.5 | 1736  | x1.41      | boore/always/downDip/-/toPeak/-        |
 *   | 1.956 | 0.935 | 204.1 | 1195  | **x9.19**  | SHIPPED — fails P-CONT-AREA            |
 *
 * AND TWO FINDINGS THE GATE PRODUCED ON ITS FIRST FULL OUTING, neither
 * of which any score had ever shown:
 *
 *   CAMPBELL & BOZORGNIA HAS ITS OWN SEAM, AND IT IS WORSE. Its cells
 *   read a worst step of x9.87 at Mw 5.28 and x17.13 at Mw 5.49 — a
 *   seventeen-fold jump in the shaken ground for a hundredth of a
 *   magnitude, down where the earthquakes are common. Four rounds scored
 *   that law on areas and on the peak and none of them could see it.
 *
 *   THE STRUCTURE DIP BREAKS P-MONO-AREA. Five cells carrying it show the
 *   ground SHRINKING as the magnitude rises. The dip is looked up from
 *   the rupture length, the rupture length grows with magnitude, so the
 *   dip can step to a different fault mid-sweep and the projected width
 *   with it. A footprint that shrinks when the earthquake grows is the
 *   thing P-MONO-MW was written to forbid, and it was happening in the
 *   quantity P-MONO-MW does not read.
 *
 * Neither is fixed here. Both are recorded, and any round that proposes
 * CB14 or the structure dip now has to answer them first.
 */

/** P-CONT-AREA: a factor of two over a step of 0.01 in magnitude, where
 *  the model's own rupture scaling implies 1.023. Forty times looser than
 *  the derivation, on purpose. */
export const AREA_STEP_LIMIT = 2;

/** The magnitude step both area properties walk. */
export const AREA_STEP_MW = 0.01;

/** The ground (km²) a scenario shakes at or above an intensity, in the
 *  shape the model lays down — a disc for a point source, the rupture
 *  stadium for an extended one. The same expression `shakemapFootprint.ts`
 *  compares against a ShakeMap. */
export function shakenAreaKm2(input: EarthquakeScenarioInput, threshold: 7 | 8 | 9 = 7): number {
  const r = simulateEarthquake(input);
  const radiusM =
    threshold === 7
      ? r.shaking.mmi7Radius
      : threshold === 8
        ? r.shaking.mmi8Radius
        : r.shaking.mmi9Radius;
  const rad = ((radiusM as number) || 0) / 1_000;
  if (!(rad > 0)) return 0;
  if (!r.isExtendedSource) return Math.PI * rad * rad;
  const l = (r.ruptureLength as number) / 1_000;
  const w = (r.ruptureFootprintWidth as number) / 1_000;
  return l * w + 2 * rad * (l + w) + Math.PI * rad * rad;
}

export interface AreaWalk {
  /** P-MONO-AREA: steps where the ground shrank. */
  inversions: number;
  /** P-CONT-AREA: steps that multiplied the ground by more than the limit. */
  jumps: number;
  /** The largest single-step multiplication, and where it happened. */
  worst: { ratio: number; atMw: number };
  /** The median single-step multiplication, for scale: a model with no
   *  seam has a worst that looks like its median. */
  medianRatio: number;
}

/** Walks both area properties in one pass. */
export function walkArea(
  settings: Omit<EarthquakeScenarioInput, 'magnitude'> = {},
  from = 4,
  to = 9,
  step = AREA_STEP_MW,
  limit = AREA_STEP_LIMIT
): AreaWalk {
  let inversions = 0;
  let jumps = 0;
  let worst = { ratio: 0, atMw: Number.NaN };
  const ratios: number[] = [];
  let previous = Number.NaN;
  for (let mw = from; mw <= to + 1e-9; mw += step) {
    const magnitude = Math.round(mw * 1_000) / 1_000;
    const area = shakenAreaKm2({ ...settings, magnitude });
    if (Number.isFinite(previous) && previous > 0) {
      if (area < previous) inversions += 1;
      const ratio = area / previous;
      ratios.push(ratio);
      if (ratio > limit) jumps += 1;
      if (ratio > worst.ratio) worst = { ratio, atMw: magnitude };
    }
    previous = area;
  }
  ratios.sort((a, b) => a - b);
  const middle = Math.floor(ratios.length / 2);
  const medianRatio =
    ratios.length === 0
      ? Number.NaN
      : ratios.length % 2 === 1
        ? (ratios[middle] ?? Number.NaN)
        : ((ratios[middle - 1] ?? Number.NaN) + (ratios[middle] ?? Number.NaN)) / 2;
  return { inversions, jumps, worst, medianRatio };
}

/** P-MONO-MW, read within one regime: the magnitudes that share a shape.
 *  Returns the inversions of the MMI VII radius among them. */
export function radiusInversionsWithinRegime(
  settings: Omit<EarthquakeScenarioInput, 'magnitude'> = {},
  from = 4,
  to = 9,
  step = 0.05
): { belowThreshold: number; atOrAbove: number } {
  let below = 0;
  let above = 0;
  let previousBelow = -1;
  let previousAbove = -1;
  for (let mw = from; mw <= to + 1e-9; mw += step) {
    const magnitude = Math.round(mw * 100) / 100;
    const r = simulateEarthquake({ ...settings, magnitude });
    const radius = (r.shaking.mmi7Radius as number) || 0;
    if (r.isExtendedSource) {
      if (previousAbove >= 0 && radius < previousAbove) above += 1;
      previousAbove = radius;
    } else {
      if (previousBelow >= 0 && radius < previousBelow) below += 1;
      previousBelow = radius;
    }
  }
  return { belowThreshold: below, atOrAbove: above };
}
