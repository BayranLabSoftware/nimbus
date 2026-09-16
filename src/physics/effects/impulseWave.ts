/**
 * Landslide-generated impulse waves, by the method the field uses.
 *
 * Heller, Hager & Minor (2009), *Landslide generated impulse waves in
 * reservoirs — Basics and computation*, VAW Mitteilung 211, ETH Zürich: the
 * three-dimensional generation equations (3.26 to 3.28) on the impulse product
 * parameter of Eq. 3.19. It is the standard hazard-assessment method for a
 * slide entering a body of water, it comes out of a long series of wave-channel
 * and wave-basin experiments, and the manual carries worked examples — which is
 * what lets this be a **verification** rather than an argument.
 *
 * The maths lived in `scripts/benchmark/compare-landslide.ts` from the campaign
 * of 15 September 2026 until 16 September, when it was moved here so that a
 * test in CI holds it to the manual instead of a benchmark script nobody runs.
 * The comparison script now imports it, so the reference Nimbus is scored
 * against and the relation Nimbus could draw are the same code.
 *
 * **What this module is not.** It is the *generation* of the wave at the
 * slide, not its propagation, and not a run-up. Heller's experiments are a
 * subaerial slide entering still water in a rectangular basin: a submarine
 * slump, a fjord where the far wall focuses the wave (Lituya Bay), and a filled
 * reservoir that sloshes (Vaiont) are all outside what these equations were
 * fitted on, and {@link outsideTestedRange} says so for a given slide rather
 * than leaving a caller to find out.
 */

/** Water density the relative slide mass is taken against (kg/m³). */
export const IMPULSE_WAVE_WATER_DENSITY = 1_000;

/**
 * The ranges Heller's experiments span, as the benchmark campaign recorded
 * them. A slide outside them is extrapolation, and G4 of
 * docs/GOLD_STANDARD.md asks that the product say so.
 */
export const IMPULSE_WAVE_TESTED = {
  /** Slide Froude number, v_s / √(g·h). */
  froude: [0.4, 3.4],
  /** Relative slide thickness, s/h. */
  relativeThickness: [0.15, 0.6],
  /** Relative slide mass, m_s / (ρ_w · b · h²). */
  relativeMass: [0.25, 1],
  /** Relative slide width, b/h. */
  relativeWidth: [0.83, 5],
  /** Slide impact angle (°); the experiments go no shallower than 30°. */
  angleDeg: [30, 90],
  /** Impulse product parameter P. */
  impulseProduct: [0.13, 2.08],
} as const;

export interface ImpulseWaveSlide {
  /** Slide Froude number at impact, v_s / √(g·h). */
  froude: number;
  /** Slide thickness at impact (m). */
  thicknessM: number;
  /** Slide width at impact (m). */
  widthM: number;
  /** Slide volume (m³). */
  volumeM3: number;
  /** Slide bulk density (kg/m³). */
  densityKgM3: number;
  /** Slide impact angle to the horizontal (°). */
  angleDeg: number;
  /** Still-water depth at the impact (m). */
  depthM: number;
}

/**
 * The impulse product parameter P (Eq. 3.19): the one number that carries the
 * slide into the wave equations — its speed, its thickness, its mass and the
 * angle it comes in at.
 *
 *   P = F · S^(1/2) · M^(1/4) · cos(6α/7)^(1/2)
 */
export function impulseProduct(s: ImpulseWaveSlide): number {
  const S = s.thicknessM / s.depthM;
  const M = (s.densityKgM3 * s.volumeM3) / (IMPULSE_WAVE_WATER_DENSITY * s.widthM * s.depthM ** 2);
  const cosTerm = Math.cos(((6 / 7) * s.angleDeg * Math.PI) / 180);
  return s.froude * S ** 0.5 * M ** 0.25 * cosTerm ** 0.5;
}

export interface ImpulseWaveAmplitudes {
  /** First crest (m) — the wave a hazard map is drawn at. */
  firstCrest: number;
  /** First trough (m). Deeper than the first crest is high, which is what the
   *  experiments show and not a mistake. */
  firstTrough: number;
  /** Second crest (m). */
  secondCrest: number;
}

/**
 * The amplitudes of the first crest, the first trough and the second crest at
 * the slide (Eqs. 3.26 to 3.28), in metres.
 */
export function impulseWaveAmplitudes(s: ImpulseWaveSlide): ImpulseWaveAmplitudes {
  const P = impulseProduct(s);
  const B = s.widthM / s.depthM;
  const cosTerm = Math.cos(((6 / 7) * s.angleDeg * Math.PI) / 180);
  return {
    firstCrest: 0.2 * P ** 0.5 * B ** 0.75 * cosTerm ** 0.25 * s.depthM,
    firstTrough: 0.35 * P ** 0.5 * B ** 0.5 * cosTerm ** 0.5 * s.depthM,
    secondCrest: 0.14 * P ** 0.25 * B ** 0.25 * cosTerm ** 0.25 * s.depthM,
  };
}

/**
 * Which of Heller's tested ranges this slide falls outside of, named so that a
 * caller can print them. Empty means the slide sits inside every one.
 */
export function outsideTestedRange(s: ImpulseWaveSlide): string[] {
  const S = s.thicknessM / s.depthM;
  const M = (s.densityKgM3 * s.volumeM3) / (IMPULSE_WAVE_WATER_DENSITY * s.widthM * s.depthM ** 2);
  const B = s.widthM / s.depthM;
  const P = impulseProduct(s);
  const out = (name: string, value: number, range: readonly [number, number]): string | null =>
    value < range[0] || value > range[1] ? name : null;
  return [
    out('F', s.froude, IMPULSE_WAVE_TESTED.froude),
    out('S', S, IMPULSE_WAVE_TESTED.relativeThickness),
    out('M', M, IMPULSE_WAVE_TESTED.relativeMass),
    out('B', B, IMPULSE_WAVE_TESTED.relativeWidth),
    out('α', s.angleDeg, IMPULSE_WAVE_TESTED.angleDeg),
    out('P', P, IMPULSE_WAVE_TESTED.impulseProduct),
  ].filter((x): x is string => x !== null);
}

/** The manual's own worked Example 1 (§5.1), and what it prints for it: a
 *  220 000 m³ slide, 12 m thick and 100 m wide, entering 80 m of water at
 *  58 m/s down a 40° slope. */
export const IMPULSE_WAVE_EXAMPLE_ONE_SLIDE: ImpulseWaveSlide = {
  froude: 58 / Math.sqrt(9.81 * 80),
  thicknessM: 12,
  widthM: 100,
  volumeM3: 220_000,
  densityKgM3: 1_700,
  angleDeg: 40,
  depthM: 80,
};

/** What the manual prints for it: P = 0.64, and crest, trough, crest. */
export const IMPULSE_WAVE_EXAMPLE_ONE_MANUAL = {
  impulseProduct: 0.64,
  firstCrest: 14.4,
  firstTrough: 22.7,
  secondCrest: 10.1,
} as const;

/** The manual's Example 1 as this implementation computes it. */
export function impulseWaveExampleOne(): ImpulseWaveAmplitudes & { impulseProduct: number } {
  return {
    impulseProduct: impulseProduct(IMPULSE_WAVE_EXAMPLE_ONE_SLIDE),
    ...impulseWaveAmplitudes(IMPULSE_WAVE_EXAMPLE_ONE_SLIDE),
  };
}
