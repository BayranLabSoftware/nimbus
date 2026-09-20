/**
 * Rules 518 to 524 — the impulse wave manual's 2D channel decay,
 * 20 September 2026, written and pushed before the candidate ran.
 *
 * THE FINDING THIS COMES FROM, and it is worth more than the code below.
 *
 * L1's remaining half is the confined basin, and the assumption behind the
 * branch that serves it turns out to be wrong. `simulate.ts` excludes a
 * confined basin from the impulse wave manual and substitutes a basin-fill
 * form, η = min(V/A · dynamicFactor, h), on the stated grounds that the
 * manual's experiments are "open water or a basin wide enough for the wave to
 * spread".
 *
 * The manual is titled *Landslide-generated Impulse Waves in Reservoirs*. Its
 * §3.2.4 is called "Reservoir shape" and splits into §3.2.4.2, "Extreme case
 * (a) (2D)", and §3.2.4.3, "Extreme case (b) (3D)". A confined basin is not
 * outside the manual: it is one of the manual's two cases.
 *
 * And the split is NOT in the generation. Its own worked Example 2 (§5.2)
 * generates in 3D and then, "between points C and D", where "the reservoir
 * geometry resembles that of a laboratory wave channel", switches to the 2D
 * decay. The generation equations 3.26 to 3.28 are used for both. So the
 * confined basin is a **propagation** case, and this project replaced the
 * **generation** for it.
 *
 * WHAT NIMBUS HAS AND HAS NOT. `effects/impulseWave.ts` is the manual's
 * generation — Eqs. 3.5, 3.12, 3.26 to 3.28 — and it is verified to the
 * manual's own spreadsheet on 143 cases. Nimbus implements **none of the
 * manual's propagation**: not the 3D decay of Eqs. 3.24, 3.25 and 3.29 to
 * 3.31, and not the 2D decay of Eq. 3.19. The generated amplitude is handed
 * to `volcanoTsunami`, which carries it outward on Ward & Asphaug's 1/r — a
 * different law from a different paper. That join is why waves from
 * landslides count their propagation "beyond" rather than as fidelity, and
 * nothing in the repository said so before this file.
 *
 * RULE 518. WHAT THIS ROUND IS, AND WHAT IT IS NOT. It transcribes and
 * verifies the manual's 2D relations only. **It changes no default.** The
 * confined-basin branch is not rewired here: that touches Vaiont and the
 * recorded waves, and it is a round of its own with its own rules. A round
 * that transcribed a law and adopted it in the same breath could not say
 * which of the two the figures belonged to.
 *
 * RULE 519. THE REFERENCE. Evers, Heller, Fuchs, Hager & Boes (2019),
 * *Landslide-generated Impulse Waves in Reservoirs — Basics and
 * Computation*, 2nd edition, VAW-Mitteilung 254, ETH Zürich,
 * doi:10.3929/ethz-b-000413216, version 2.1 of June 2023 — the same document
 * `docs/IMPULSE_WAVE_TOOL.md` already records by SHA-256, re-downloaded on
 * 20 September 2026 and byte-identical to that hash. §3.2.4.2, Eqs. (3.13),
 * (3.14), (3.15) and (3.19); the worked numbers of §5.2.2.
 *
 * RULE 520. WHAT IS TRANSCRIBED.
 *
 *   (3.13)  H_M = (5/9) P^(4/5) h              maximum wave height
 *   (3.14)  x_M = (11/2) P^(1/2) h             where it occurs
 *   (3.15)  T_M = 9 P^(1/2) (h/g)^(1/2)        its period
 *   (3.19)  H(x) = (3/4) (P X^(−1/3))^(4/5) h  for X = x/h > X_M = x_M/h
 *
 * P is the impulse product parameter of Eq. (3.12), which this project
 * already has and already verifies. Nothing new is fitted.
 *
 * RULE 521. THE WORKED EXAMPLE, fixed before the code. §5.2.2's section C–D
 * of Example 2: an amplitude of 2.2 m at point C decays over 1 550 m in
 * h = 100 m of water to **1.1 m at the dam**, the manual writing the decay as
 * proportional to X^(−4/15) "after Eq. (3.19)". The transcription must give
 * 1.1 m to the precision the manual prints, and must give the exponent
 * −4/15 exactly rather than a decimal that rounds to it.
 *
 * RULE 522. THE SECOND CHECK, AND WHAT IT TURNED INTO. The draft of this
 * rule asserted that Eq. (3.19) at X = X_M returns H_M of Eq. (3.13) — that
 * the impact zone and the propagation zone meet where the maximum occurs —
 * and held the candidate to 1 % of it. That assertion was made before it was
 * measured, and measuring it while the rules were still being written showed
 * it is FALSE:
 *
 *     P = 0.13   H(X_M)/H_M = 1.125   (+12.5 %)
 *     P = 0.43   H(X_M)/H_M = 0.959   ( −4.1 %)
 *     P = 1.00   H(X_M)/H_M = 0.857   (−14.3 %)
 *     P = 2.08   H(X_M)/H_M = 0.777   (−22.3 %)
 *
 * The two zones of the manual's own Figure 3-3a do not join. They cross near
 * P ≈ 0.37 and diverge either side, by a quarter at the top of the fitted
 * range. This is a property of the reference, not of the transcription:
 * Eq. (3.13) has P^(4/5) and Eq. (3.19) at X_M has P^(2/3), so no
 * coefficient could make them agree at every P.
 *
 * So rule 522 is not a bar. It is a MEASUREMENT this round reports, pinned by
 * a test so it cannot drift, and it carries a warning for whoever rewires the
 * confined basin: Eq. (3.19) is a decay law fitted in the propagation zone,
 * not a continuation of the peak, and a caller who starts it from H_M rather
 * than from the amplitude at the point the channel begins — as the manual's
 * own Example 2 does, starting from a_c2 at point C — will be off by up to a
 * quarter before the wave has travelled anywhere.
 *
 * The draft is left recorded above rather than quietly replaced, because a
 * bar that was written and then found false is exactly the kind of thing
 * this project publishes.
 *
 * RULE 523. WHAT REFUSES IT.
 *   (a) The worked number of rule 521 outside the manual's printed rounding.
 *   (b) The measurement of rule 522 differing from the four ratios it
 *       records, which would mean the transcription is not the manual's.
 *   (c) Any existing bar going red — which, since nothing is rewired, would
 *       mean the transcription reached somewhere it does not claim to.
 *
 * RULE 524. WHAT THIS DOES NOT CLOSE. L1. Not its confined-basin half, which
 * needs the rewiring this round refuses to do, and not its submarine half,
 * which rules 500 to 517 left open tonight. What it closes is the excuse:
 * the manual's 2D case is no longer something this project has not read.
 */

/** Rule 521: the manual's own §5.2.2 section C–D. */
export const MANUAL_EXAMPLE_TWO_CHANNEL_DECAY = {
  /** The crest amplitude at point C, where the reservoir becomes a channel. */
  amplitudeAtCM: 2.2,
  /** C to D along the channel. */
  distanceM: 1_550,
  /** Still water depth on the slide axis. */
  depthM: 100,
  /** What the manual prints at the dam. */
  amplitudeAtDamM: 1.1,
  /** The exponent the manual writes the decay with, exactly. */
  exponent: -4 / 15,
} as const;

/**
 * Rule 522: the ratio H(X_M)/H_M at four impulse product parameters spanning
 * the manual's fitted range. Not a bar — a measurement of the reference,
 * pinned so that it cannot drift and so that whoever rewires the confined
 * basin sees it before they start Eq. (3.19) from the wrong amplitude.
 */
export const ZONE_JOIN_RATIO: Readonly<Record<string, number>> = {
  '0.13': 1.1247,
  '0.43': 0.9589,
  '1': 0.8568,
  '2.08': 0.7771,
};

/** The impulse product parameter's fitted range, as `impulseWave.ts` already
 *  records it from the manual's Table 3-3. */
export const CHANNEL_DECAY_PROBE_P = [0.13, 0.43, 1, 2.08] as const;

export const CHANNEL_DECAY_RULES = 'rules 518 to 524, fixed 20 September 2026';
