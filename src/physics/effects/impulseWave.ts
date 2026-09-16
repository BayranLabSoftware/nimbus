/**
 * Landslide-generated impulse waves, by the method the field uses.
 *
 * Evers, Heller, Fuchs, Hager & Boes (2019), *Landslide-generated Impulse
 * Waves in Reservoirs — Basics and Computation*, 2nd edition, VAW-Mitteilung
 * 254, ETH Zürich, doi:10.3929/ethz-b-000413216, read in its version 2.1 of
 * June 2023, which adds Evers & Bross's addendum on shallow slide impact
 * angles. The field calls it the impulse wave manual. Here: the impulse
 * product parameter of Eq. 3.12 (Heller & Hager 2010), the three-dimensional
 * generation equations 3.26 to 3.28 (Evers 2017; Evers et al. 2019), and the
 * slide impact velocity of Eq. 3.5 (Körner 1976). It is the standard
 * hazard-assessment method for a slide entering a body of water, it comes out
 * of a long series of wave-channel and wave-basin experiments, and the manual
 * carries worked examples and a spreadsheet that computes them
 * (doi:10.5281/zenodo.3492000) — which is what lets this be a
 * **verification** rather than an argument.
 *
 * **Which edition.** Until 17 September 2026 this module and everything that
 * cites it credited Heller, Hager & Minor (2009), VAW-Mitteilung 211 — the
 * first edition — while the file that was read, and whose Example 1 the tests
 * pin, was the second (B-043). The two share P; the three-dimensional
 * generation was revised in the second edition, as its own preface says.
 *
 * The maths lived in `scripts/benchmark/compare-landslide.ts` from the campaign
 * of 15 September 2026 until 16 September, when it was moved here so that a
 * test in CI holds it to the manual instead of a benchmark script nobody runs.
 *
 * **What this module is not.** It is the *generation* of the wave at the
 * slide, not its propagation, and not a run-up. The manual's experiments are a
 * granular slide entering still water from above, in a channel or a basin: a
 * submarine slump, a fjord where the far wall focuses the wave (Lituya Bay),
 * and a filled reservoir that sloshes (Vaiont) are all outside what these
 * equations were fitted on, and {@link outsideTestedRange} says so for a given
 * slide rather than leaving a caller to find out.
 */

/** Water density the relative slide mass is taken against (kg/m³). */
export const IMPULSE_WAVE_WATER_DENSITY = 1_000;

/**
 * The limits of the three-dimensional equations: the manual's Table 3-3, with
 * the two extensions its own text allows for a preliminary hazard assessment.
 * A slide outside them is extrapolation, and G4 of docs/GOLD_STANDARD.md asks
 * that the product say so.
 */
export const IMPULSE_WAVE_TESTED = {
  /** Slide Froude number, V_s / √(g·h). */
  froude: [0.4, 3.4],
  /** Relative slide thickness, s/h. */
  relativeThickness: [0.15, 0.6],
  /** Relative slide mass, ρ_s·V / (ρ_w · b · h²). */
  relativeMass: [0.25, 1],
  /** Relative slide volume, V / (b · h²). Missing here until 17 September
   *  2026 (B-043). */
  relativeVolume: [0.187, 0.75],
  /** Relative bulk slide density, ρ_s/ρ_w. The experiments used one
   *  granulate, D = 1.338; Section 3.2.4.3 extends the equations to this range
   *  (snow and ice avalanches to rock), and the manual's spreadsheet checks
   *  against it. Missing here until 17 September 2026 (B-043). */
  relativeDensity: [0.59, 1.72],
  /** Relative slide width, b/h. */
  relativeWidth: [0.83, 5],
  /** Slide impact angle (°) in the experiments. The addendum of June 2023
   *  allows down to {@link IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG} where P is
   *  inside its range. */
  angleDeg: [30, 90],
  /** Impulse product parameter P. */
  impulseProduct: [0.13, 2.08],
} as const;

/** The shallowest slide impact angle the addendum admits for the 3D
 *  equations, "for a preliminary hazard assessment if 0.13 ≤ P ≤ 2.08". */
export const IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG = 15;

export interface ImpulseWaveSlide {
  /** Slide Froude number at impact, V_s / √(g·h). */
  froude: number;
  /** Slide thickness at impact (m). */
  thicknessM: number;
  /** Slide width at impact (m). */
  widthM: number;
  /** Bulk slide volume (m³). */
  volumeM3: number;
  /** Bulk slide density (kg/m³). */
  densityKgM3: number;
  /** Slide impact angle to the horizontal (°). */
  angleDeg: number;
  /** Still-water depth at the impact (m). */
  depthM: number;
}

/**
 * The impulse product parameter P (Eq. 3.12): the one number that carries the
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
 * The initial amplitudes of the first crest, the first trough and the second
 * crest at the slide (Eqs. 3.26 to 3.28), in metres. The manual writes α_eff
 * for 6α/7.
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

/** The dimensionless numbers the manual's limits are written in. */
export interface ImpulseWaveDimensionless {
  /** Slide Froude number. */
  F: number;
  /** Relative slide thickness, s/h. */
  S: number;
  /** Relative slide mass, ρ_s·V / (ρ_w · b · h²). */
  M: number;
  /** Relative slide volume, V / (b · h²). */
  V: number;
  /** Relative bulk slide density, ρ_s/ρ_w. */
  D: number;
  /** Relative slide width, b/h. */
  B: number;
  /** Impulse product parameter. */
  P: number;
}

/** A slide's dimensionless numbers, as §3.2.4 and Table 3-3 define them. */
export function impulseWaveDimensionless(s: ImpulseWaveSlide): ImpulseWaveDimensionless {
  return {
    F: s.froude,
    S: s.thicknessM / s.depthM,
    M: (s.densityKgM3 * s.volumeM3) / (IMPULSE_WAVE_WATER_DENSITY * s.widthM * s.depthM ** 2),
    V: s.volumeM3 / (s.widthM * s.depthM ** 2),
    D: s.densityKgM3 / IMPULSE_WAVE_WATER_DENSITY,
    B: s.widthM / s.depthM,
    P: impulseProduct(s),
  };
}

/**
 * Which of the limits this slide falls outside of, named so that a caller can
 * print them: F, S, M, V, D, B, α and P. Empty means the slide sits inside
 * every one.
 *
 * The angle is read as the addendum reads it: 30° to 90° as tested, and down
 * to 15° where P is inside its range. The bulk porosity the manual also limits
 * is not an input of this module and is not checked; nor are the radial
 * distance and propagation angle, which belong to the propagation equations
 * this module does not use.
 */
export function outsideTestedRange(s: ImpulseWaveSlide): string[] {
  const n = impulseWaveDimensionless(s);
  const T = IMPULSE_WAVE_TESTED;
  const inside = (value: number, range: readonly [number, number]): boolean =>
    value >= range[0] && value <= range[1];
  const pInside = inside(n.P, T.impulseProduct);
  const angleInside =
    inside(s.angleDeg, T.angleDeg) ||
    (pInside && inside(s.angleDeg, [IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG, T.angleDeg[1]]));
  const checks: readonly (readonly [string, boolean])[] = [
    ['F', inside(n.F, T.froude)],
    ['S', inside(n.S, T.relativeThickness)],
    ['M', inside(n.M, T.relativeMass)],
    ['V', inside(n.V, T.relativeVolume)],
    ['D', inside(n.D, T.relativeDensity)],
    ['B', inside(n.B, T.relativeWidth)],
    ['α', angleInside],
    ['P', pInside],
  ];
  return checks.filter(([, ok]) => !ok).map(([name]) => name);
}

/** The manual's own worked Example 1 (§5.1), and what it prints for it: a
 *  220 000 m³ rockfall, 12 m thick and 100 m wide, entering 80 m of water at
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

/** The manual's worked Example 2 (§5.2): an icefall of 600 000 m³, 40 m thick
 *  and 120 m wide, at a bulk density of 500 kg/m³, entering 100 m of water down
 *  a 35° slope. Eq. 3.5 gives it 32.2 m/s, and the manual carries 32 into F
 *  (Table 5-10: F = 32/(9.81·100)^0.5 = 1.02); the slide as given here does the
 *  same, and every figure the example prints then comes back to its last
 *  digit. */
export const IMPULSE_WAVE_EXAMPLE_TWO_SLIDE: ImpulseWaveSlide = {
  froude: 32 / Math.sqrt(9.81 * 100),
  thicknessM: 40,
  widthM: 120,
  volumeM3: 600_000,
  densityKgM3: 500,
  angleDeg: 35,
  depthM: 100,
};

/** What the manual prints for Example 2. Its density, D = 0.50, is below even
 *  the extended range, and the manual says so in its own limitations table. */
export const IMPULSE_WAVE_EXAMPLE_TWO_MANUAL = {
  impulseProduct: 0.43,
  firstCrest: 14.4,
  firstTrough: 23.3,
  secondCrest: 11.4,
} as const;

// ---------------------------------------------------------------------------
// Closing what the manual needs and Nimbus does not have
// ---------------------------------------------------------------------------

/**
 * The manual's equations want a slide's **speed, thickness and width** at the
 * moment it meets the water. A Nimbus landslide is a volume, a slope and a
 * depth, and a visitor can give the three where they know them. Where they do
 * not, the closures below are the project's own, not the manual's, and each is
 * declared here so a reader can see exactly where a number stops being the
 * manual's and starts being ours. The speed from a drop height is the manual's
 * Eq. 3.5; only the friction and the drop are ours.
 */

const GRAVITY = 9.81;

/** tan δ, δ the dynamic bed friction angle of Eq. 3.5 — about 16.7°, inside
 *  the 15° to 35° the manual gives as typical. A project value: nothing was
 *  fitted to choose it. */
export const IMPULSE_WAVE_SLIDE_FRICTION = 0.3;

/**
 * The speed a dry slide reaches when its centre of gravity falls `dropHeightM`
 * to the water down a slope of `angleDeg` (Eq. 3.5, Körner 1976):
 *
 *   V_s = √(2·g·Δz_sc·(1 − tan δ · cot α))
 *
 * and zero where friction holds it (α ≤ δ).
 *
 * Until 17 September 2026 this computed √(2·g·Δz·(sin α − tan δ·cos α)): the
 * same expression times sin α under the root, which is the fall measured along
 * the slope where the input is the vertical drop. Every speed was low by
 * √(sin α) — 24 % at 35°, 41 % at 20° (B-042). The manual's Examples 1 and 2
 * print 41.3, 58.0 and 32.2 m/s, which the test holds.
 */
export function slideImpactVelocity(
  dropHeightM: number,
  angleDeg: number,
  friction = IMPULSE_WAVE_SLIDE_FRICTION
): number {
  const a = (angleDeg * Math.PI) / 180;
  const driving = 1 - friction / Math.tan(a);
  if (!(driving > 0) || !(dropHeightM > 0) || !(angleDeg > 0)) return 0;
  return Math.sqrt(2 * GRAVITY * dropHeightM * driving);
}

export interface SlideClosureInput {
  volumeM3: number;
  angleDeg: number;
  depthM: number;
  densityKgM3: number;
  /** Measured or published, where a caller has it (m). */
  thicknessM?: number;
  /** Measured or published, where a caller has it (m). */
  widthM?: number;
  /** How far the slide's centre of gravity falls before it reaches the water
   *  (m). Where a caller has it, the velocity comes from it. */
  dropHeightM?: number;
  /** A published impact velocity (m/s) overrides every closure below. */
  impactVelocityMS?: number;
}

/** What each of the slide's three unknowns was: given, or closed here. */
export interface SlideClosure {
  slide: ImpulseWaveSlide;
  /** The slide impact velocity used (m/s). */
  impactVelocityMS: number;
  closed: {
    thickness: boolean;
    width: boolean;
    velocity: 'given' | 'fromDropHeight' | 'fromVolume';
  };
}

/**
 * A slide the manual's equations can take, from what a Nimbus landslide has.
 *
 * - **Thickness and width**, absent a measurement, are the slide's own
 *   characteristic length V^(1/3) — the campaign's closure, kept so the
 *   figures before and after can be compared. It makes the slide a cube, which
 *   no slide is; a real slab is wide and thin, and that is the crudest thing
 *   here.
 * - **Velocity** comes from a published figure where there is one, else from a
 *   drop height by Eq. 3.5, else from a drop of V^(1/3)·sin α — a slide whose
 *   centre of gravity descends about its own along-slope length before it is
 *   in the water. The last is the weakest of the three and is marked
 *   `fromVolume` so a caller can say so.
 */
export function slideFromVolume(input: SlideClosureInput): SlideClosure {
  const side = Math.cbrt(Math.max(input.volumeM3, 0));
  const thicknessM = input.thicknessM ?? side;
  const widthM = input.widthM ?? side;
  let velocity: number;
  let how: SlideClosure['closed']['velocity'];
  if (input.impactVelocityMS !== undefined && input.impactVelocityMS > 0) {
    velocity = input.impactVelocityMS;
    how = 'given';
  } else if (input.dropHeightM !== undefined && input.dropHeightM > 0) {
    velocity = slideImpactVelocity(input.dropHeightM, input.angleDeg);
    how = 'fromDropHeight';
  } else {
    const drop = side * Math.sin((input.angleDeg * Math.PI) / 180);
    velocity = slideImpactVelocity(drop, input.angleDeg);
    how = 'fromVolume';
  }
  return {
    slide: {
      froude: input.depthM > 0 ? velocity / Math.sqrt(GRAVITY * input.depthM) : 0,
      thicknessM,
      widthM,
      volumeM3: input.volumeM3,
      densityKgM3: input.densityKgM3,
      angleDeg: input.angleDeg,
      depthM: input.depthM,
    },
    impactVelocityMS: velocity,
    closed: {
      thickness: input.thicknessM === undefined,
      width: input.widthM === undefined,
      velocity: how,
    },
  };
}
