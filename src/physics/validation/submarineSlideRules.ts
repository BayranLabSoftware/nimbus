/**
 * Rules 500 to 508 — the submarine regime of a landslide wave, 20 September
 * 2026, written and pushed before the candidate ran.
 *
 * WHAT IS WRONG TODAY. A landslide that fails under the water draws
 *
 *     η_source = K · V^(1/3) · sin θ,   K = 0.005
 *
 * (`VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE`). That K was set on a single event,
 * Storegga, against a number the source does not give: Bondevik et al. 2005
 * publish run-up read from deposits, 10 to 12 m in western Norway, for a
 * 2 400 km³ slide, and the prefactor was fitted to a 5–10 m *source
 * amplitude* for a 3 000 km³ slide. One event, and a quantity the paper never
 * printed.
 *
 * L1 of docs/GOLD_STANDARD.md asks that the relation making the wave be held
 * to its source's worked examples within 1 % and to the ranges of the
 * experiments it was fitted on, and that the product warn outside them. A
 * prefactor fitted to one misread number holds none of that, and no worked
 * example exists for it to be held to. This is the reason waves from
 * landslides read 1 of 2 on fidelity.
 *
 * RULE 500. WHAT THIS ROUND IS. It replaces the submarine branch with the
 * field's published predictive equations. It is a model substitution, not a
 * re-fitting: no coefficient is chosen here, every one is transcribed.
 *
 * RULE 501. THE REFERENCE, AND WHAT IS TAKEN FROM EACH.
 *
 *   (a) Watts, P., Grilli, S. T., Tappin, D. R. & Fryer, G. J. (2005).
 *       "Tsunami generation by submarine mass failure. II: Predictive
 *       equations and case studies." J. Waterway Port Coastal Ocean Eng.
 *       131(6): 298–310. Equations (17) and (18) — the three-dimensional
 *       characteristic amplitude of a submerged slide and its two empirical
 *       functions — read as Enet, F. & Grilli, S. T. (2007), "Experimental
 *       study of tsunami generation by three-dimensional rigid underwater
 *       landslides", J. Waterway Port Coastal Ocean Eng. 133(6): 442–454,
 *       prints them in its Eqs. (17) and (18), with the laboratory
 *       measurements that validate them (correlation r = 0.98).
 *
 *   (b) Watts, P., Grilli, S. T., Kirby, J. T., Fryer, G. J. & Tappin, D. R.
 *       (2003). "Landslide tsunami case studies using a Boussinesq model and
 *       a fully nonlinear tsunami generation model." Natural Hazards and
 *       Earth System Sciences 3: 391–402 (open access). Equations (1b) to
 *       (1e) for the motion of a translational slide and (3a) for the
 *       characteristic wavelength, with the three field case studies of its
 *       Tables 1 and 2.
 *
 * Nothing is copied from either paper's code, which this project does not
 * have. The equations are transcribed from the printed page and re-derived
 * against the printed outputs.
 *
 * RULE 502. THE WORKED EXAMPLES, AND THE 1 % OF G1. The candidate ships only
 * if a test in CI reproduces every one of these, each within 1 % of the
 * printed value:
 *
 *   (a) Enet & Grilli 2007, their model slide at θ = 15° and γ = 2.44:
 *       F = 0.0408 and G = 1.130 from Eq. (18).
 *   (b) Enet & Grilli 2007, the same model with C_m = 0.61 and C_d = 0.36:
 *       Eq. (19) reduces to μ = 0.0958 (d/B)^0.5.
 *   (c) Watts et al. 2003, Table 1 (Unimak, Alaska; b = 40 km, T = 300 m,
 *       w = 20 km, d = 1 700 m, θ = 4.3°, γ = 1.85): a₀ = 0.22 m/s²,
 *       u_t = 199 m/s, s₀ = 179 km, t₀ = 903 s, λ₀ = 117 km.
 *   (d) Watts et al. 2003, Table 2 (Skagway, Alaska), slides A and B:
 *       A (b = 600 m, T = 15 m, w = 340 m, d = 150 m, θ = 9°)
 *         → a₀ = 0.46, u_t = 35, s₀ = 2 690 m, t₀ = 77 s, λ₀ = 2 936 m;
 *       B (b = 215 m, T = 15 m, w = 390 m, d = 95 m, θ = 22°)
 *         → a₀ = 1.10, u_t = 33, s₀ = 964 m, t₀ = 30 s, λ₀ = 904 m.
 *
 * (c) and (d) are read to the precision the tables print, which is two or
 * three figures; the test states the tolerance each one is held to and it is
 * never looser than 1 % where the table prints three figures.
 *
 * RULE 503. WHAT IS *NOT* A WORKED EXAMPLE OF EQ. (17), and would be a false
 * check if used as one. The η₀ column of Watts et al. 2003's Tables 1, 2 and
 * 4 is **not** Eq. (17): that paper says the three-dimensional amplitude was
 * "found by the BEM model", two years before the closed form was published.
 * Measured before this rule was written, so that it cannot be claimed as a
 * success later: Eq. (17) gives 18.5 m where Table 1 prints 64 m and 0.170 m
 * where Table 2 prints 0.54 m. Those rows are a check on the *motion*
 * equations and on nothing else, and this file says so rather than letting a
 * later reader mistake the disagreement for a defect.
 *
 * RULE 504. THE RANGES, AND WHAT THE PRODUCT MUST SAY (G4). The equations
 * were fitted inside
 *
 *     θ < 30°,  T/B ≤ 0.2,  1.46 ≤ γ ≤ 2.93,  d/B > 0.06
 *
 * (Enet & Grilli 2007, printed immediately below their Eq. (18)). A scenario
 * outside any of them is extrapolation, and the result must name which limit
 * it is outside of, in the same way `outsideTestedRange` already does for the
 * impulse wave manual. A candidate that computes the equations and stays
 * silent outside their range does not close L1, because L1 is two clauses.
 *
 * RULE 505. WHAT THE CANDIDATE MAY REACH. The submarine regime, and nothing
 * else.
 *
 *   (a) A subaerial slide in open water keeps the impulse wave manual. Rules
 *       162 to 167 adopted it and L2 is met on it; this round may not move a
 *       number of that set.
 *   (b) A confined basin keeps its own branch. It is the other half of L1 and
 *       it is not this round's; a round that quietly took both could not say
 *       which one had done the work.
 *   (c) A volcanic flank collapse marked subaerial keeps its prefactor. The
 *       submarine prefactor is the only default this round touches.
 *
 * RULE 506. THE BAR. This is verification, not validation: no held-out set is
 * read and nothing is scored. The bar is rule 502's 1 % and rule 504's
 * warning, both held by a test that runs in CI. A held-out figure measured
 * after the fact is a consequence and is reported as one, never as the reason
 * the candidate was adopted.
 *
 * RULE 507. WHAT REFUSES IT.
 *
 *   (a) Any worked example of rule 502 outside its stated tolerance.
 *   (b) Any row of L2's set moving by more than a thousandth — that set is
 *       subaerial and the candidate claims not to reach it. If a row moves,
 *       the candidate reaches further than it says and the claim is false
 *       whichever way the number went.
 *   (c) A scenario outside rule 504's ranges that draws a number without
 *       naming the limit it is outside of.
 *   (d) The sweep of G5 failing on landslides where it passes today.
 *
 * RULE 508. ONE RUN, NO RE-TUNING. No coefficient, tolerance, range or
 * decision above is changed after a number is seen. If the candidate is
 * refused the shipped prefactor stays and the refusal is published with its
 * figure, as every refusal of this project is.
 */

/** Rule 501: the papers, named where a reader can check them. */
export const SUBMARINE_SLIDE_SOURCES = {
  predictiveEquations:
    'Watts, Grilli, Tappin & Fryer 2005, J. Waterway Port Coastal Ocean Eng. 131(6): 298–310, Eqs. (17) and (18)',
  asPrintedIn:
    'Enet & Grilli 2007, J. Waterway Port Coastal Ocean Eng. 133(6): 442–454, Eqs. (17) to (20)',
  motion:
    'Watts, Grilli, Kirby, Fryer & Tappin 2003, Nat. Hazards Earth Syst. Sci. 3: 391–402, Eqs. (1b) to (1e) and (3a)',
} as const;

/**
 * Rule 504: the ranges the equations were fitted inside, exactly as Enet &
 * Grilli 2007 print them below their Eq. (18). A scenario outside any of
 * these is extrapolation and the product says which one.
 */
export const SUBMARINE_SLIDE_TESTED = {
  /** Incline angle (°), strictly less than 30 in the source. */
  angleDeg: [0, 30],
  /** Relative thickness T/B, at most 0.2. */
  relativeThickness: [0, 0.2],
  /** Specific density γ = ρ_slide/ρ_water. */
  specificDensity: [1.46, 2.93],
  /** Relative submergence d/B, strictly greater than 0.06. */
  relativeSubmergence: [0.06, Number.POSITIVE_INFINITY],
} as const;

/**
 * Rule 502(a) and (b): the printed values of Enet & Grilli 2007 for their own
 * model slide, which the transcription has to return.
 */
export const ENET_GRILLI_MODEL = {
  /** Their single plane slope. */
  angleDeg: 15,
  /** Their single landslide density. */
  specificDensity: 2.44,
  /** Added-mass and drag coefficients they assume for the ellipsoid. */
  addedMass: 0.61,
  dragCoefficient: 0.36,
  /** Eq. (18) printed for that slide. */
  F: 0.0408,
  G: 1.13,
  /** Eq. (19) printed for that slide: μ = 0.0958 (d/B)^0.5. */
  dispersionPrefactor: 0.0958,
} as const;

/** Rule 502(c) and (d): the field cases of Watts et al. 2003, inputs and the
 *  motion outputs their tables print. `figures` is how many significant
 *  figures the table gives, which sets the tolerance the test may use. */
export const WATTS_2003_CASES = [
  {
    name: 'Unimak 1946',
    table: 1,
    lengthM: 40_000,
    thicknessM: 300,
    widthM: 20_000,
    depthM: 1_700,
    angleDeg: 4.3,
    specificDensity: 1.85,
    accelerationMS2: 0.22,
    terminalVelocityMS: 199,
    distanceM: 179_000,
    timeS: 903,
    wavelengthM: 117_000,
    figures: 3,
  },
  {
    name: 'Skagway 1994, slide A',
    table: 2,
    lengthM: 600,
    thicknessM: 15,
    widthM: 340,
    depthM: 150,
    angleDeg: 9,
    specificDensity: 1.85,
    accelerationMS2: 0.46,
    terminalVelocityMS: 35,
    distanceM: 2_690,
    timeS: 77,
    wavelengthM: 2_936,
    figures: 2,
  },
  {
    name: 'Skagway 1994, slide B',
    table: 2,
    lengthM: 215,
    thicknessM: 15,
    widthM: 390,
    depthM: 95,
    angleDeg: 22,
    specificDensity: 1.85,
    accelerationMS2: 1.1,
    terminalVelocityMS: 33,
    distanceM: 964,
    timeS: 30,
    wavelengthM: 904,
    figures: 2,
  },
] as const;

/**
 * Rule 503, measured before the round ran so that it cannot later be claimed
 * as anything else: what Eq. (17) gives on two of the field cases, against
 * the η₀ those tables print from a BEM run.
 */
export const EQ17_AGAINST_BEM_COLUMN = {
  'Unimak 1946': { equation17M: 18.5, tablePrintsM: 64 },
  'Skagway 1994, slide A': { equation17M: 0.17, tablePrintsM: 0.54 },
} as const;

/** Rule 507(b): a row of L2's set may not move by more than this. */
export const L2_ROW_TOLERANCE = 1e-3;

export const SUBMARINE_SLIDE_RULES = 'rules 500 to 508, fixed 20 September 2026';
