/**
 * How the Earth Impact Effects Program passes from regular reflection to the
 * Mach region, and whether Nimbus should do the same. Class A: the program is
 * the reference, and G1 of docs/GOLD_STANDARD.md asks the model to implement
 * it within 1 %.
 *
 * The invariants of 5 000 random impacts (G5) found blast rings that jump when
 * a body grows by 0.1 %. On one of them, a 29.06 m body of 7 087 kg/m³ at
 * 19.19 km/s and 30.63°, the program was asked for its overpressure at six
 * ranges: it agreed with Nimbus to 0.3 % out to 40 km and then did not —
 * Nimbus 14 % low at 50 km, 41 % low at 61 km, and back within 0.1 % at 70.
 * Nimbus steps from one relation to the other at r_m1, 2005 Eq. 58, as the
 * campaign's rules chose ("the published law steps at r_m1; the step is
 * kept", docs/BENCHMARK_PROTOCOL.md); the program rises smoothly through the
 * same ranges. The campaign had seen the program depart near r_m1 and wrote
 * that it "blends the two regions in a way neither paper describes". The
 * amendment of 16 September 2026 reads the gold standard against the field's
 * own tool, so the blend is now the question.
 *
 * The rules, numbered after the hundred and twenty-eight before them:
 *
 *  129. **What was looked at, and the law read off it.** Four bodies, 50
 *       printed overpressures, all read on 16 September 2026 before this was
 *       written: the body above at 21 ranges from 25 to 76 km, and three at a
 *       scaled burst altitude z₁ of 148, 294 and 428 m (28.139 m of
 *       7 800 kg/m³, and 53.917 and 47.904 m of 3 000 kg/m³, all at 20 km/s
 *       and 45°) at 12 ranges each, from 0.2 to 1.5 r_m1. Each fed the
 *       program's printed burst altitude and the yield scale its innermost
 *       point gives through 2017 Eq. 7, which the program follows there to
 *       2 × 10⁻⁶. What they show:
 *
 *       - beyond the blend, 2005 Eq. 54 with r_x = 290 + 0.65 z₁, to 10⁻⁶;
 *         the 289 the project had read is 0.2 % low throughout the Mach
 *         region;
 *       - between r_m1 − w and r_m1 + w, with w = 0.00328 z₁² in scaled
 *         metres, the overpressure is a straight line in range, from the
 *         regular relation at the inner end to the Mach relation at the outer,
 *         to 2 × 10⁻⁷ of the value. The half-width, measured on each side of
 *         each body, is 3.280000 × 10⁻³ z₁² to within 10⁻⁶ on the three
 *         bodies whose scale is known to 10⁻⁸, and to within 10⁻⁴ on the
 *         first. The line rises where the Mach relation at the outer end is
 *         the larger: the knee a burst above the ground draws where the Mach
 *         stem forms, and why the first body's overpressure grows from 46 to
 *         70 km.
 *
 *       That law is `MachTransition` `program` in effects/airburstBlast.ts,
 *       and `airburstBlast.test.ts` holds it to these points. They are code
 *       verification, used to read the law, and are not held out.
 *
 *  130. **The held-out check.** Twelve bodies nobody has asked the program
 *       about, drawn by `scripts/benchmark/mach-blend-bodies.ts` (seed
 *       1 290 916: diameter log-uniform from 5 to 500 m, density from 1 000
 *       to 8 000 kg/m³, speed from 11.2 to 72 km/s, angle from 10 to 90°,
 *       kept where Nimbus's entry bursts the body in the air at a z₁ from
 *       50 to 540 m, until twelve), each with six fractions drawn with it;
 *       both are `MACH_BLEND_BODIES` below. For each body the program is
 *       asked first at 10 m from the point under the burst: its printed
 *       burst altitude, and the scale Eq. 7 gives from its printed low
 *       overpressure there ({@link machBlendScale}), place the blend. Each
 *       fraction t then gives a range from half the inner end of the blend
 *       to a half-width beyond its outer end ({@link machBlendRangesKm}),
 *       and the program is asked there. A point **agrees** when Nimbus's
 *       blast, fed that burst altitude and that scale, is within 1 % of the
 *       program's printed low end plus half its last printed digit
 *       (0.0005 Pa). The high end, twice the low within three burst
 *       altitudes, is H1's and is not read again. A body the program brings
 *       to the ground, or bursts at a z₁ of 550 m or more, has no blend and
 *       is counted apart; a range the program does not answer is counted and
 *       does not count for or against. Both transitions are scored on every
 *       point; Nimbus's own entry, which departs from the program's through
 *       BM-13, is printed beside them and decides nothing.
 *
 *  131. **What decides.** `program` is **adopted** as the default when at
 *       least 48 points of at least 8 bodies are answered and every answered
 *       point agrees. Otherwise it is **refused**: `published` stays, the
 *       points outside are printed, and the step stays declared as the
 *       departure from the program it now is known to be. Adopted, the
 *       campaign's H4 sentence ("a break at r_m1 is the published law's and
 *       is reported, not smoothed") stays in the protocol as what was
 *       decided then, and `published` stays reachable.
 *
 * What these rules cannot settle. Whether the program's blend is right: it is
 * a choice the program makes and neither paper prints, and no measurement here
 * says a real burst draws its knee that way. A 9 on this is as good as the
 * field's tool. And a ring that jumps: where the blend rises, a threshold just
 * below the top of the knee reaches out past it, and a body a little larger
 * lowers the knee under the threshold and pulls the ring back inside. The
 * program's own overpressure does that; the invariants will count it as they
 * find it.
 */

/** Rule 130: G1's tolerance, and half the program's last printed digit (Pa). */
export const MACH_BLEND_TOLERANCE = 0.01;
export const MACH_BLEND_ROUNDING_PA = 0.0005;
/** Rule 130: where each body is first asked (km from under the burst). */
export const MACH_BLEND_ANCHOR_KM = 0.01;
/** Rule 131: how much must be answered for a verdict. */
export const MACH_BLEND_MIN_POINTS = 48;
export const MACH_BLEND_MIN_BODIES = 8;

/** The relations' constants, repeated here so that the check does not read
 *  the ranges it asks at off the code it tests. */
const KILOTON = 4.184e12;
const MACH_CEILING = 550;
const BLEND_HALF_WIDTH = 0.00328;

export interface MachBlendBody {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  /** Where along rule 130's span each held-out range falls, from 0 to 1. */
  fractions: readonly number[];
}

/** Rule 130: the twelve bodies, as `scripts/benchmark/mach-blend-bodies.ts`
 *  drew them on 16 September 2026 (122 drawn, 12 kept). */
export const MACH_BLEND_BODIES: readonly MachBlendBody[] = [
  {
    diameterM: 60.756,
    densityKgM3: 1983.2,
    velocityKmS: 46.875,
    angleDeg: 63.48,
    fractions: [0.5515, 0.6812, 0.2128, 0.5863, 0.0839, 0.4952],
  }, // z₁ 120 m on the entry here
  {
    diameterM: 59.541,
    densityKgM3: 3789.5,
    velocityKmS: 55.249,
    angleDeg: 13.53,
    fractions: [0.0212, 0.3769, 0.1542, 0.6927, 0.7092, 0.3376],
  }, // z₁ 459 m on the entry here
  {
    diameterM: 61.49,
    densityKgM3: 3986.8,
    velocityKmS: 52.278,
    angleDeg: 35.75,
    fractions: [0.2945, 0.2199, 0.8953, 0.6536, 0.8483, 0.4723],
  }, // z₁ 104 m on the entry here
  {
    diameterM: 24.737,
    densityKgM3: 7410.6,
    velocityKmS: 69.151,
    angleDeg: 32.22,
    fractions: [0.1221, 0.3429, 0.224, 0.4271, 0.3944, 0.5442],
  }, // z₁ 494 m on the entry here
  {
    diameterM: 103.602,
    densityKgM3: 5901.1,
    velocityKmS: 36.694,
    angleDeg: 13.53,
    fractions: [0.1883, 0.9291, 0.7956, 0.4011, 0.2176, 0.1773],
  }, // z₁ 91 m on the entry here
  {
    diameterM: 21.98,
    densityKgM3: 6426.9,
    velocityKmS: 54.131,
    angleDeg: 55.66,
    fractions: [0.3984, 0.0474, 0.7552, 0.1438, 0.7398, 0.2317],
  }, // z₁ 518 m on the entry here
  {
    diameterM: 43.479,
    densityKgM3: 4962.8,
    velocityKmS: 13.263,
    angleDeg: 38.96,
    fractions: [0.3286, 0.0219, 0.3961, 0.9051, 0.8857, 0.0261],
  }, // z₁ 327 m on the entry here
  {
    diameterM: 72.416,
    densityKgM3: 2528.1,
    velocityKmS: 59.27,
    angleDeg: 13.08,
    fractions: [0.8296, 0.9893, 0.7564, 0.7451, 0.256, 0.4046],
  }, // z₁ 426 m on the entry here
  {
    diameterM: 45.375,
    densityKgM3: 2023.1,
    velocityKmS: 56.46,
    angleDeg: 40.7,
    fractions: [0.8812, 0.0813, 0.8845, 0.7901, 0.6744, 0.7597],
  }, // z₁ 452 m on the entry here
  {
    diameterM: 52.38,
    densityKgM3: 2339.8,
    velocityKmS: 21.37,
    angleDeg: 59.3,
    fractions: [0.782, 0.6363, 0.4767, 0.1333, 0.3624, 0.297],
  }, // z₁ 293 m on the entry here
  {
    diameterM: 51.848,
    densityKgM3: 1435.2,
    velocityKmS: 56.911,
    angleDeg: 45.63,
    fractions: [0.6174, 0.4753, 0.5294, 0.7869, 0.8742, 0.6284],
  }, // z₁ 407 m on the entry here
  {
    diameterM: 89.228,
    densityKgM3: 5116.8,
    velocityKmS: 23.187,
    angleDeg: 21.59,
    fractions: [0.2724, 0.8009, 0.3263, 0.7996, 0.4945, 0.9182],
  }, // z₁ 74 m on the entry here
];

/** 2017 Eq. 7 at scaled slant distance d₁ (m). */
function regular(d1: number): number {
  const d2 = d1 * d1;
  return 3.14e11 * d2 ** -1.3 + 1.8e7 * d2 ** -0.565;
}

/**
 * Rule 130: the yield scale (m per m of a 1 kt burst) at which Eq. 7 gives
 * the printed low overpressure at the anchor, for the printed burst altitude.
 * NaN where there is nothing to invert.
 */
export function machBlendScale(anchorKm: number, burstAltitudeM: number, lowPa: number): number {
  if (!(lowPa > 0) || !(burstAltitudeM > 0)) return Number.NaN;
  let lo = 1e-3;
  let hi = 1e7;
  for (let i = 0; i < 400; i++) {
    const mid = Math.sqrt(lo * hi);
    if (regular(mid) > lowPa) lo = mid;
    else hi = mid;
  }
  return Math.hypot(anchorKm * 1_000, burstAltitudeM) / Math.sqrt(lo * hi);
}

/** Where the blend lies for a scaled burst altitude (scaled m), or null where
 *  there is no Mach region. */
export function machBlendSpan(z1: number): { inner: number; outer: number; half: number } | null {
  if (!(z1 > 0) || !(z1 < MACH_CEILING)) return null;
  const edge = (MACH_CEILING * z1) / (1.2 * (MACH_CEILING - z1));
  const half = BLEND_HALF_WIDTH * z1 * z1;
  return { inner: edge - half, outer: edge + half, half };
}

/**
 * Rule 130: the held-out ranges (km, to the 0.1 m the program is asked at),
 * t running from half the blend's inner end (t = 0) to a half-width past its
 * outer end (t = 1). Empty where there is no blend.
 */
export function machBlendRangesKm(
  burstAltitudeM: number,
  scale: number,
  fractions: readonly number[]
): number[] {
  const span = machBlendSpan(burstAltitudeM / scale);
  if (span === null || !Number.isFinite(scale)) return [];
  const from = span.inner / 2;
  const to = span.outer + span.half;
  return fractions.map((t) => Number((((from + t * (to - from)) * scale) / 1_000).toFixed(4)));
}

/** Rule 130: the yield (J) a scale stands for. */
export function machBlendYieldJ(scale: number): number {
  return scale ** 3 * KILOTON;
}

export interface MachBlendPoint {
  body: number;
  rangeKm: number;
  /** The program's printed low end (Pa), null where it did not answer. */
  programPa: number | null;
  /** Nimbus's blast fed the program's burst altitude and scale (Pa). */
  blendPa: number;
  stepPa: number;
}

/** Rule 130, for one point. */
export function machBlendAgrees(programPa: number, modelPa: number): boolean {
  return Math.abs(modelPa - programPa) <= MACH_BLEND_TOLERANCE * programPa + MACH_BLEND_ROUNDING_PA;
}

export interface MachBlendVerdict {
  answered: number;
  bodies: number;
  blendAgrees: number;
  stepAgrees: number;
  /** Rule 131. */
  adopted: boolean;
  enough: boolean;
}

/** Rule 131. */
export function machBlendVerdict(points: readonly MachBlendPoint[]): MachBlendVerdict {
  const answered = points.filter(
    (p): p is MachBlendPoint & { programPa: number } => p.programPa !== null
  );
  const bodies = new Set(answered.map((p) => p.body)).size;
  const blendAgrees = answered.filter((p) => machBlendAgrees(p.programPa, p.blendPa)).length;
  const stepAgrees = answered.filter((p) => machBlendAgrees(p.programPa, p.stepPa)).length;
  const enough = answered.length >= MACH_BLEND_MIN_POINTS && bodies >= MACH_BLEND_MIN_BODIES;
  return {
    answered: answered.length,
    bodies,
    blendAgrees,
    stepAgrees,
    enough,
    adopted: enough && blendAgrees === answered.length,
  };
}
