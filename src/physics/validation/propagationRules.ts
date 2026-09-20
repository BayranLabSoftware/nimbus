/**
 * Rules 525 to 531 — the impulse wave manual's three-dimensional
 * propagation, 20 September 2026.
 *
 * WHY THIS EXISTS. Rules 518 to 524 found that this project has the manual's
 * generation and none of its propagation: the amplitude computed at the slide
 * is handed to Ward & Asphaug's 1/r decay, a different law from a different
 * paper, and that join is why waves from landslides count their propagation
 * "beyond" rather than as fidelity. The 2D half was transcribed there. This
 * is the 3D half, which is the one an ordinary reservoir uses.
 *
 * RULE 525. WHAT THIS ROUND IS. Transcription and verification only. **No
 * default changes**, nothing is rewired, and no scenario of the product calls
 * any of it. Rewiring is a round of its own; a round that transcribed a law
 * and adopted it at once could not say which of the two its figures belonged
 * to. Same discipline as rule 518.
 *
 * RULE 526. THE REFERENCE. The manual §3.2.4.3, Eqs. (3.22) to (3.25),
 * (3.29) to (3.32), and Table 3-2's reach; the worked numbers of §5.2.2's
 * sections A–B and A–C. The document is the one `docs/IMPULSE_WAVE_TOOL.md`
 * records by SHA-256, verified byte-identical on 20 September 2026.
 *
 * RULE 527. THE WORKED EXAMPLE, fixed before the test is written. Example 2:
 * a 600 000 m³ icefall, b = 120 m, h = 100 m, α = 35°, P = 0.43, whose
 * generation this project already verifies at a_0,c1 = 14.4 m,
 * a_0,t1 = 23.3 m and a_0,c2 = 11.4 m.
 *
 *   (a) Eq. (3.22)  r_0,0°  = 204 m
 *   (b) Eq. (3.23)  r_0,90° = 177 m
 *   (c) Eq. (3.24)  r_0(0°) = 204 m and r_0(80°) = 178 m
 *   (d) Section A–B, r = 730 m at γ = 0°, so r* = 526 m:
 *           a_c1 = 2.8 m, a_t1 = 5.6 m, a_c2 = 7.4 m
 *   (e) Section A–C, r = 1 100 m at γ = 80°, so r* = 922 m:
 *           a_c1 = 0.5 m, a_t1 = 0.9 m, a_c2 = 2.2 m
 *
 * Eleven printed numbers. Each is held to the manual's own printed rounding,
 * which for the amplitudes is one decimal.
 *
 * RULE 528. A TYPO IN THE REFERENCE, recorded because it is a trap. The
 * substitution lines of Eqs. (3.22), (3.23) and (3.26) print **1.02** where
 * the formula reads P. 1.02 is that example's slide Froude number F; its
 * impulse product parameter is P = 0.43, which the same example's Table 5-10
 * prints and which Eq. (3.12) gives from F = 1.02, S = 0.40, M = 0.25 and
 * α = 35°. Every printed RESULT is computed with 0.43 and is correct; every
 * printed SUBSTITUTION shows 1.02 and is not.
 *
 * Measured, so the size of the trap is on the record: transcribing Eq. (3.22)
 * from its substitution line gives 253.7 m against the 204 m the manual
 * prints beside it, twenty-four per cent out. A test that checked the
 * substitution rather than the result would pass a wrong transcription.
 *
 * RULE 529. THE SQUARE ROOT, for the same reason. Eqs. (3.29) to (3.31)
 * carry √(r* / h) inside the exponential, not r* / h. The manual's substitution
 * shows √(526/100) plainly. A transcription that dropped it would reproduce
 * nothing, but a reader working from the garbled text of a PDF extractor
 * could easily lose it, and this says so.
 *
 * RULE 530. WHAT REFUSES IT.
 *   (a) Any of rule 527's eleven numbers outside the manual's printed
 *       rounding.
 *   (b) Any existing bar going red — which, nothing being rewired, would mean
 *       the transcription reached somewhere it does not claim to.
 *   (c) The reach of Table 3-2 not being read: a scenario outside 1 ≤ r/h ≤ 16
 *       must be named as outside, since G4 asks for it and the manual's own
 *       example runs past it at r/h = 26.5.
 *
 * RULE 531. WHAT THIS DOES NOT CLOSE. L1, still. What it closes is the
 * second half of the excuse: after tonight neither of the manual's two
 * reservoir shapes is something this project has not read, and the round that
 * rewires the confined basin has both laws, verified, to wire.
 */

/** Rule 527: Example 2's slide, as the generation already verified leaves it. */
export const MANUAL_EXAMPLE_TWO_PROPAGATION = {
  widthM: 120,
  depthM: 100,
  angleDeg: 35,
  impulseProduct: 0.43,
  firstCrestM: 14.4,
  firstTroughM: 23.3,
  secondCrestM: 11.4,
  /** (a) and (b): the two impact radii. */
  radiusAlongAxisM: 204,
  radiusAcrossAxisM: 177,
  /** (c): Eq. (3.24) at the two angles the example reads. */
  radiusAtAngleM: { 0: 204, 80: 178 },
  /** (d) and (e): the two sections, each with its printed r* and amplitudes. */
  sections: [
    {
      name: 'A-B',
      radialDistanceM: 730,
      propagationAngleDeg: 0,
      starDistanceM: 526,
      firstCrestM: 2.8,
      firstTroughM: 5.6,
      secondCrestM: 7.4,
    },
    {
      name: 'A-C',
      radialDistanceM: 1_100,
      propagationAngleDeg: 80,
      starDistanceM: 922,
      firstCrestM: 0.5,
      firstTroughM: 0.9,
      secondCrestM: 2.2,
    },
  ],
} as const;

/**
 * Rule 528: what the manual's own substitution line would give for
 * Eq. (3.22) if its printed 1.02 were taken as P, against the 204 m printed
 * beside it. Pinned so the trap stays visible.
 */
export const SUBSTITUTION_TYPO = {
  printedInSubstitution: 1.02,
  actualImpulseProduct: 0.43,
  radiusFromTypoM: 253.7,
  radiusPrintedM: 204,
} as const;

export const PROPAGATION_RULES = 'rules 525 to 531, fixed 20 September 2026';
