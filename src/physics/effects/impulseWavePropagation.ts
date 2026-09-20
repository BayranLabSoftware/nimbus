/**
 * The impulse wave manual's **three-dimensional propagation**: how the wave
 * generated at the slide decays outward across a reservoir, with distance and
 * with the angle away from the slide axis.
 *
 * Evers, Heller, Fuchs, Hager & Boes (2019), *Landslide-generated Impulse
 * Waves in Reservoirs — Basics and Computation*, 2nd edition, VAW-Mitteilung
 * 254, ETH Zürich, §3.2.4.3, Eqs. (3.22) to (3.25) and (3.29) to (3.31).
 *
 * `effects/impulseWave.ts` is the manual's **generation** — the amplitudes
 * a_0,c1, a_0,t1 and a_0,c2 at the slide — and until this module there was no
 * propagation in this project at all: the generated amplitude was handed
 * straight to Ward & Asphaug's 1/r decay, a different law from a different
 * paper. `effects/channelDecay.ts` is the other reservoir shape, the 2D one.
 *
 * **Nothing in the product calls this yet** (rules 525 to 531 of
 * `validation/propagationRules.ts` keep the round that wrote it to
 * transcription).
 *
 * A TYPO IN THE REFERENCE, worth knowing before transcribing anything from
 * its §5.2.2. The substitution lines of Eqs. (3.22), (3.23) and (3.26) print
 * **1.02** — which is that example's slide Froude number F — where the
 * formula reads P and where the printed *results* require P = 0.43. Every
 * printed result is right; every printed substitution shows the wrong number.
 * Transcribing from the substitution line gives 253.7 m for an impact radius
 * the manual prints as 204, twenty-four per cent out.
 */

/** The gravity the manual computes in, as its siblings keep it. */
const GRAVITY = 9.81;

/**
 * A slide as the propagation equations see it, once generation has produced
 * the three initial amplitudes.
 */
export interface PropagatingWave {
  /** a_0,c1, the first crest at the slide (m). */
  firstCrestM: number;
  /** a_0,t1, the first trough at the slide (m). */
  firstTroughM: number;
  /** a_0,c2, the second crest at the slide (m). */
  secondCrestM: number;
  /** b, the slide width (m). */
  widthM: number;
  /** h, the still water depth on the slide axis (m). */
  depthM: number;
  /** α, the slide impact angle (°). The equations read the effective angle
   *  α_eff = (6/7)α, and this module takes α and applies the 6/7 itself so a
   *  caller cannot apply it twice. */
  angleDeg: number;
  /** P, the impulse product parameter of Eq. (3.12). */
  impulseProduct: number;
}

/** α_eff = (6/7)α, in radians. */
const effectiveAngleRad = (angleDeg: number): number => ((6 / 7) * angleDeg * Math.PI) / 180;

const sech = (x: number): number => 1 / Math.cosh(x);

/**
 * Eq. (3.22): the impact radius along the slide axis.
 *
 *     r_0,0° = 2.5 [ P (b/h) cos α_eff ]^0.25 h
 */
export function impactRadiusAlongAxis(w: PropagatingWave): number {
  if (!(w.depthM > 0)) return 0;
  const inner = w.impulseProduct * (w.widthM / w.depthM) * Math.cos(effectiveAngleRad(w.angleDeg));
  if (!(inner > 0)) return 0;
  return 2.5 * Math.pow(inner, 0.25) * w.depthM;
}

/**
 * Eq. (3.23): the impact radius across it.
 *
 *     r_0,90° = (b/2) + 1.5 (P cos α_eff)^0.25 h
 *
 * The first term is a length in metres, not a ratio — the manual substitutes
 * 120/2 = 60 m for a 120 m slide — so this is not Eq. (3.22) with different
 * coefficients.
 */
export function impactRadiusAcrossAxis(w: PropagatingWave): number {
  if (!(w.depthM > 0)) return 0;
  const inner = w.impulseProduct * Math.cos(effectiveAngleRad(w.angleDeg));
  if (!(inner > 0)) return w.widthM / 2;
  return w.widthM / 2 + 1.5 * Math.pow(inner, 0.25) * w.depthM;
}

/**
 * Eq. (3.24): the impact radius at an angle γ from the slide axis — an
 * ellipse through the two axis radii.
 *
 *     r_0(γ) = √[ r_0,0°² r_0,90°² / (r_0,0°² sin²γ + r_0,90°² cos²γ) ]
 */
export function impactRadius(w: PropagatingWave, propagationAngleDeg: number): number {
  const a = impactRadiusAlongAxis(w);
  const b = impactRadiusAcrossAxis(w);
  const g = (propagationAngleDeg * Math.PI) / 180;
  const den = a * a * Math.sin(g) * Math.sin(g) + b * b * Math.cos(g) * Math.cos(g);
  if (!(den > 0)) return 0;
  return Math.sqrt((a * a * b * b) / den);
}

/** Eq. (3.25): the distance measured from the edge of the impact zone. */
export function distanceFromImpactZone(
  w: PropagatingWave,
  radialDistanceM: number,
  propagationAngleDeg: number
): number {
  return radialDistanceM - impactRadius(w, propagationAngleDeg);
}

/** What the wave is, some way out and some way off the axis. */
export interface PropagatedAmplitudes {
  firstCrestM: number;
  firstTroughM: number;
  secondCrestM: number;
  /** r*, the distance from the edge of the impact zone (m). */
  starDistanceM: number;
}

/**
 * Eqs. (3.29), (3.30) and (3.31). Each of the three amplitudes decays the
 * same way, with its own two coefficients:
 *
 *     a(r*,γ) = a_0 · exp[ −k (a_0/h)^(−0.3) √(r* / h) ]
 *                   · [ sech(s · γ/90°) ]^{ cos α_eff · exp(−0.15 √(r* / h)) }
 *
 * with (k, s) = (0.4, 3.2) for the first crest, (0.4, 3.6) for the first
 * trough and (0.1, 3) for the second crest.
 *
 * Note the square root on r* / h inside the exponential: the manual's own
 * substitution shows √(526/100), and a transcription that dropped it would
 * still look plausible and be badly wrong beyond a few water depths.
 */
export function propagate(
  w: PropagatingWave,
  radialDistanceM: number,
  propagationAngleDeg: number
): PropagatedAmplitudes {
  const star = distanceFromImpactZone(w, radialDistanceM, propagationAngleDeg);
  if (!(w.depthM > 0) || !(star > 0)) {
    return {
      firstCrestM: w.firstCrestM,
      firstTroughM: w.firstTroughM,
      secondCrestM: w.secondCrestM,
      starDistanceM: Math.max(star, 0),
    };
  }
  const rootStar = Math.sqrt(star / w.depthM);
  const angleExponent = Math.cos(effectiveAngleRad(w.angleDeg)) * Math.exp(-0.15 * rootStar);
  const one = (initialM: number, k: number, s: number): number => {
    if (!(initialM > 0)) return 0;
    const radial = Math.exp(-k * Math.pow(initialM / w.depthM, -0.3) * rootStar);
    const lateral = Math.pow(sech((s * propagationAngleDeg) / 90), angleExponent);
    return initialM * radial * lateral;
  };
  return {
    firstCrestM: one(w.firstCrestM, 0.4, 3.2),
    firstTroughM: one(w.firstTroughM, 0.4, 3.6),
    secondCrestM: one(w.secondCrestM, 0.1, 3),
    starDistanceM: star,
  };
}

/**
 * Eq. (3.32): the celerity of the first crest, which the manual uses for the
 * travel time to the far shore.
 *
 *     c_c1 = 0.95 √( g (h + a_c1) )
 */
export function firstCrestCelerity(depthM: number, firstCrestM: number): number {
  if (!(depthM > 0)) return 0;
  return 0.95 * Math.sqrt(GRAVITY * (depthM + Math.max(firstCrestM, 0)));
}

/**
 * The manual's Table 3-2 limit on how far the three-dimensional equations
 * reach: 1 ≤ r/h ≤ 16. Its own Example 2 runs past it — A–D is r/h = 26.5 —
 * and that is exactly why the example switches to the channel decay there.
 */
export const PROPAGATION_TESTED_RELATIVE_DISTANCE = [1, 16] as const;

/** Which of that limit a reading falls outside of, named rather than left
 *  for a caller to discover (G4 of docs/GOLD_STANDARD.md). */
export function propagationOutsideTestedRange(depthM: number, radialDistanceM: number): string[] {
  if (!(depthM > 0)) return ['depth'];
  const x = radialDistanceM / depthM;
  const [lo, hi] = PROPAGATION_TESTED_RELATIVE_DISTANCE;
  if (x < lo) return ['relativeDistanceTooNear'];
  if (x > hi) return ['relativeDistanceTooFar'];
  return [];
}
