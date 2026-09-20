/**
 * The wave a slide raises when it fails *under* the water, by the method the
 * field uses.
 *
 * Watts, P., Grilli, S. T., Tappin, D. R. & Fryer, G. J. (2005), "Tsunami
 * generation by submarine mass failure. II: Predictive equations and case
 * studies", J. Waterway Port Coastal Ocean Eng. 131(6): 298–310, give a
 * closed form for the three-dimensional characteristic amplitude of a
 * submerged translational slide. This module is their Eqs. (17) and (18) as
 * Enet, F. & Grilli, S. T. (2007), J. Waterway Port Coastal Ocean Eng.
 * 133(6): 442–454, print them beside the laboratory experiments that validate
 * them, together with the centre-of-mass motion of Watts, P. et al. (2003),
 * Nat. Hazards Earth Syst. Sci. 3: 391–402, Eqs. (1b) to (1e) and (3a).
 *
 * Nothing is transcribed from either group's code, which this project does
 * not have; the equations are read from the printed page and checked against
 * the printed outputs by `submarineSlide.test.ts` (rules 500 to 508 of
 * `validation/submarineSlideRules.ts`).
 *
 * **What this module is not.** It is the *generation* of the wave over the
 * slide — the maximum depression above the slide's initial position — not its
 * propagation and not a run-up. It is a translational slide: a rotational
 * slump moves on Eqs. (2) and (4) of the same paper and is not here, because
 * nothing in this product asks for one yet.
 */
/** The gravity the papers compute in, as `impulseWave.ts` keeps the impulse
 *  wave manual's. Using the project's 9.806 65 here would move the printed
 *  coefficients of Watts et al. 2003 in the fourth figure and turn a
 *  transcription into an approximation of one. */
const GRAVITY = 9.81;

/** Sea water, the density a slide's specific density is taken against
 *  (kg/m³). The papers write γ = ρ_slide/ρ_water and take fresh water at the
 *  laboratory scale; the field cases are marine. */
export const SUBMARINE_SLIDE_WATER_DENSITY = 1_030;

/**
 * Added-mass and drag coefficients of the centre-of-mass force balance.
 *
 * Watts et al. 2003 state C_m ≅ 1 and C_d ≅ 1 for their field cases, and the
 * two coefficients of their Eqs. (1b) and (1c) — 0.30 and 1.16 — are what
 * those values give at γ = 1.85. Enet & Grilli 2007 use C_m ≅ 0.61 and
 * C_d ≅ 0.36 for their laboratory ellipsoid, "for lack of more accurate
 * values at this stage". The field pair is the default here because the
 * scenarios this product draws are field-scale; a caller may pass either.
 */
export const SUBMARINE_SLIDE_ADDED_MASS = 1;
export const SUBMARINE_SLIDE_DRAG = 1;

/** The slide the equations are written in. Lengths in metres, angle in
 *  degrees, γ dimensionless. */
export interface SubmarineSlide {
  /** B, the slide's length along the incline. */
  lengthM: number;
  /** T, its maximum thickness. */
  thicknessM: number;
  /** w, its maximum width across the slope. */
  widthM: number;
  /** d, the initial submergence depth of the slide's centre of mass. */
  depthM: number;
  /** θ, the incline. */
  angleDeg: number;
  /** γ = ρ_slide / ρ_water. */
  specificDensity: number;
  /** C_m, added mass. Defaults to {@link SUBMARINE_SLIDE_ADDED_MASS}. */
  addedMass?: number;
  /** C_d, drag. Defaults to {@link SUBMARINE_SLIDE_DRAG}. */
  dragCoefficient?: number;
}

/** How the slide's centre of mass moves, Watts et al. 2003 Eqs. (1b) to (1e)
 *  with the characteristic wavelength of (3a). */
export interface SubmarineSlideMotion {
  /** a₀, the initial acceleration (m/s²). */
  initialAccelerationMS2: number;
  /** u_t, the theoretical terminal velocity (m/s). */
  terminalVelocityMS: number;
  /** s₀ = u_t²/a₀, the characteristic distance of motion (m). */
  characteristicDistanceM: number;
  /** t₀ = u_t/a₀, the characteristic time of motion (s). */
  characteristicTimeS: number;
  /** λ₀ = t₀·√(g·d), the characteristic wavelength (m). */
  characteristicWavelengthM: number;
}

const sinOf = (angleDeg: number): number => Math.sin((angleDeg * Math.PI) / 180);

/**
 * The motion of a submerged translational slide.
 *
 * Watts et al. 2003 print their Eqs. (1b) and (1c) already specialised to
 * γ ≅ 1.85 with C_m ≅ C_d ≅ 1:
 *
 *     a₀ ≅ 0.30 g sin θ           u_t ≅ 1.16 √(b g sin θ)
 *
 * The general forms those two numbers come from are the force balance the
 * same paper describes — buoyant weight against added mass, and buoyant
 * weight against form drag over the slide's own length:
 *
 *     a₀ = g sin θ (γ − 1)/(γ + C_m)
 *     u_t = √( g B sin θ · π(γ − 1) / (2 C_d) )
 *
 * At γ = 1.85 and C_m = C_d = 1 they give 0.2982 and 1.1554, which are the
 * printed 0.30 and 1.16; `submarineSlide.test.ts` holds the whole chain to
 * the paper's three field cases instead of to this note.
 */
export function submarineSlideMotion(s: SubmarineSlide): SubmarineSlideMotion {
  const sin = sinOf(s.angleDeg);
  const cm = s.addedMass ?? SUBMARINE_SLIDE_ADDED_MASS;
  const cd = s.dragCoefficient ?? SUBMARINE_SLIDE_DRAG;
  const gamma = s.specificDensity;
  const a0 = (GRAVITY * sin * (gamma - 1)) / (gamma + cm);
  const ut = Math.sqrt((GRAVITY * s.lengthM * sin * Math.PI * (gamma - 1)) / (2 * cd));
  const t0 = a0 > 0 ? ut / a0 : 0;
  return {
    initialAccelerationMS2: a0,
    terminalVelocityMS: ut,
    characteristicDistanceM: a0 > 0 ? (ut * ut) / a0 : 0,
    characteristicTimeS: t0,
    characteristicWavelengthM: t0 * Math.sqrt(GRAVITY * s.depthM),
  };
}

/**
 * F(θ) and G(γ), the two empirical functions of Watts et al. 2005 Eq. (18):
 *
 *     F = 0.0486 − 0.0302 sin θ        G = 1.18 { 1 − e^(−2.2(γ − 1)) }
 *
 * Enet & Grilli 2007 print F = 0.0408 and G = 1.130 for their own slide at
 * θ = 15° and γ = 2.44, which is what rule 502(a) holds these to.
 */
export function submarineSlideShapeFunctions(s: SubmarineSlide): { F: number; G: number } {
  return {
    F: 0.0486 - 0.0302 * sinOf(s.angleDeg),
    G: 1.18 * (1 - Math.exp(-2.2 * (s.specificDensity - 1))),
  };
}

/**
 * η₀^3D, the characteristic tsunami amplitude over a submerged slide —
 * Watts et al. 2005 Eq. (17):
 *
 *     η₀ = s₀ F(θ) G(γ) (T/B) (B sin θ / d)^1.25 · 1/(1 + λ₀/w)
 *
 * The last factor is the three-dimensional correction: the two-dimensional
 * amplitude is spread over a width, and mass conservation carries the
 * wavelength into it. The number is a **depression** over the slide, printed
 * negative in the papers' tables; it is returned here as a positive
 * amplitude, because everything downstream in this project reads a magnitude.
 */
export function submarineSlideAmplitude(s: SubmarineSlide): number {
  if (!(s.lengthM > 0 && s.depthM > 0 && s.widthM > 0 && s.specificDensity > 1)) return 0;
  const motion = submarineSlideMotion(s);
  const { F, G } = submarineSlideShapeFunctions(s);
  const sin = sinOf(s.angleDeg);
  if (!(sin > 0)) return 0;
  const spread = 1 / (1 + motion.characteristicWavelengthM / s.widthM);
  return (
    motion.characteristicDistanceM *
    F *
    G *
    (s.thicknessM / s.lengthM) *
    Math.pow((s.lengthM * sin) / s.depthM, 1.25) *
    spread
  );
}

/**
 * Rule 504: the ranges the equations were fitted inside, printed by Enet &
 * Grilli 2007 immediately below their Eq. (18).
 *
 *     θ < 30°,  T/B ≤ 0.2,  1.46 ≤ γ ≤ 2.93,  d/B > 0.06
 *
 * G4 of docs/GOLD_STANDARD.md asks that the product say when a scenario lies
 * outside the cells a source measured, so this names each limit a slide falls
 * outside of rather than leaving a caller to find out. The authors' own
 * laboratory slide is outside T/B — they print T/B = 0.27 and say it is
 * "quite large for Eq. (17) to strictly apply" — which is the clearest
 * warning that these bounds are meant to be read, not assumed.
 */
export function submarineSlideOutsideTestedRange(s: SubmarineSlide): string[] {
  const outside: string[] = [];
  if (!(s.angleDeg < 30)) outside.push('angle');
  if (s.lengthM > 0) {
    if (!(s.thicknessM / s.lengthM <= 0.2)) outside.push('relativeThickness');
    if (!(s.depthM / s.lengthM > 0.06)) outside.push('relativeSubmergence');
  }
  if (!(s.specificDensity >= 1.46 && s.specificDensity <= 2.93)) outside.push('specificDensity');
  return outside;
}

/**
 * The shape a submarine slide is given when nothing measured one.
 *
 * `T/B ≅ 0.01` is the thickness-to-length ratio Watts et al. 2003 cite for
 * "most underwater slides" (Prior & Coleman 1979) and use to sanity-check
 * their own Unimak reconstruction. The width has **no published ratio**: the
 * paper's four field slides run from w/B = 0.5 to 1.8, so this takes w = B
 * and says so. Both are overridden by any measurement a caller has, and
 * `closed` says which were not.
 */
export const SUBMARINE_SLIDE_THICKNESS_RATIO = 0.01;

export interface SubmarineSlideClosure {
  slide: SubmarineSlide;
  closed: { thickness: boolean; width: boolean; length: boolean };
}

/**
 * A submarine slide the equations can take, from what a Nimbus landslide has.
 *
 * The volume fixes the length through the shape above: a slide of length B,
 * width w = B and thickness T = 0.01 B has the volume of its bounding box's
 * half-ellipsoid, V = π B w T / 6, so B = (6 V / (π · 0.01))^(1/3).
 */
export function submarineSlideFromVolume(input: {
  volumeM3: number;
  angleDeg: number;
  depthM: number;
  specificDensity: number;
  lengthM?: number;
  thicknessM?: number;
  widthM?: number;
}): SubmarineSlideClosure {
  const r = SUBMARINE_SLIDE_THICKNESS_RATIO;
  const fromVolume = Math.cbrt((6 * Math.max(input.volumeM3, 0)) / (Math.PI * r));
  const lengthM = input.lengthM ?? fromVolume;
  return {
    slide: {
      lengthM,
      thicknessM: input.thicknessM ?? r * lengthM,
      widthM: input.widthM ?? lengthM,
      depthM: input.depthM,
      angleDeg: input.angleDeg,
      specificDensity: input.specificDensity,
    },
    closed: {
      length: input.lengthM === undefined,
      thickness: input.thicknessM === undefined,
      width: input.widthM === undefined,
    },
  };
}
