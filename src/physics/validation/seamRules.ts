/**
 * The seam at Mw 7.5: a tenth of a magnitude, ten times the ground.
 *
 * This is a diagnosis, not a candidate. It proposes nothing and adopts
 * nothing. It was run because rule 398 blocked an adoption on P-MONO-MW —
 * the MMI VII radius halving at Mw 7.5 under Thompson & Worden's distance
 * — and the obvious next question was which of the two representations of
 * that earthquake is wrong.
 *
 * THE ANSWER IS NEITHER, AND BOTH. The two numbers are not the same
 * quantity. Below the threshold a scenario is a point source and
 * `mmi7Radius` is an EPICENTRAL distance; above it the scenario is an
 * extended source and `mmi7Radius` is a distance FROM THE RUPTURE, laid
 * around a stadium. Comparing them is comparing a circle's radius with a
 * racetrack's margin.
 *
 * So the thing to measure is the AREA, which means the same at both
 * sides and is what every ShakeMap comparison in this project uses.
 * Measured on reference rock, MMI VII:
 *
 *   | Mw  | shipped: disc, no correction | with Thompson-Worden |
 *   | --- | ---------------------------- | -------------------- |
 *   | 7.2 |    502 km2                   |   2 012 km2          |
 *   | 7.3 |    558                       |   2 318              |
 *   | 7.4 |  **622**                     | **2 673**            |
 *   | 7.5 | **6 323**                    |   6 323              |
 *   | 7.6 |  7 743                       |   7 743              |
 *
 * THE SHIPPED MODEL MULTIPLIES THE SHAKEN GROUND BY TEN BETWEEN Mw 7.4
 * AND Mw 7.5. Six hundred and twenty-two square kilometres become six
 * thousand three hundred and twenty-three, for a tenth of a magnitude.
 * The field area, computed independently on the 257 x 257 grid, agrees:
 * 612 and 6 401.
 *
 * Thompson & Worden's distance does not cause that discontinuity. IT
 * REDUCES IT, from 10.2x to 2.4x, by giving the point source below the
 * threshold the reach a rupture of that size actually has.
 *
 * AND NO TEST HAS EVER SEEN IT. P-MONO-MW reads the RADIUS, which without
 * the correction walks smoothly across the seam — 14.07 km at Mw 7.4,
 * 14.88 at Mw 7.5 — while the area it implies jumps tenfold, because the
 * shape changes underneath it. The one property gate this project has
 * over the contour geometry is measuring the one quantity that is
 * continuous there.
 *
 * So rule 398 blocked a candidate for a radius discontinuity of 2x while
 * the incumbent carries an area discontinuity of 10x that the same gate
 * cannot see. Rule 398 is not wrong — a property does outrank a score —
 * but the property it enforces is the wrong one, and that is the seventh
 * fault these rounds have found in their own instruments and the first
 * in one written before them.
 *
 * WHAT IT EXPLAINS. The area bias by magnitude cell, measured over
 * thirteen rounds and never accounted for:
 *
 *   Mw < 6.5      0.56x
 *   Mw 6.5–7.5    0.22x     <- the disc, at the top of its range
 *   Mw >= 7.5     1.27x     <- the stadium, immediately after
 *
 * The hole between Mw 6.5 and 7.5 IS this seam. It is not a law being
 * wrong by a factor of five; it is a point source being asked to stand
 * for a rupture seventy kilometres long, until the moment it is not.
 * Every round from 405 onward measured the consequences of this and none
 * of them looked at the seam itself.
 *
 * WHAT IT IMPLIES, and none of it is done here:
 *
 *   1. The property gate should read the AREA, or read the radius only
 *      within a regime. A gate that cannot see a tenfold jump is not
 *      guarding anything.
 *   2. `extendedSource: 'always'` removes the seam by construction — one
 *      shape at every magnitude — which is why the factorial measured it
 *      taking the areas from 0.935 to 0.471 and why the two halves of
 *      rules 419 to 434 needed each other.
 *   3. Thompson & Worden's correction is the right physics on the wrong
 *      side of a seam that should not exist. Judged against a continuous
 *      model it may well be adoptable; judged across this discontinuity
 *      it cannot be.
 *
 * B-083 of docs/BUG_REGISTRY.md. Recorded, not fixed: fixing it is a
 * candidate and candidates need rules written before them.
 */

export const SEAM_RULES = 'the Mw 7.5 seam, measured 20 September 2026';

/** The measured areas, pinned so a repair has to move them on purpose. */
export const SEAM_AREAS_KM2 = {
  shipped: { 7.4: 622, 7.5: 6323 },
  thompsonWorden: { 7.4: 2673, 7.5: 6323 },
  /** How many times the ground multiplies across a tenth of a magnitude. */
  jump: { shipped: 10.2, thompsonWorden: 2.4 },
} as const;
