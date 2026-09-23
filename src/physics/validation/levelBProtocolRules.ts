/**
 * Rules 855 to 865 — level B, preregistered: the observed events the impacts
 * model is held to, and how. Phase 3 of the plan of 22 September 2026.
 *
 * Written on 23 September 2026, on Andrea's word («ok procediamo»), after the
 * reviewer's reply of that morning on the sets and the bands, and before any
 * source for the events below has been opened for this test, any input of it
 * fixed, or the model run on any of them.
 *
 * RULE 855. WHAT THIS IS. Level B of the reviewer's scale, "validated within
 * stated domain": the model held to what was observed, within a bound written
 * first, on events no part of the model was fitted to. This round writes how,
 * in four steps, each committed and pushed before the next:
 *   (1) these rules: the sets, the frozen model, inputs apart from targets,
 *       the observables and their bands, the score, and what was already seen;
 *   (2) the sources, pinned (rule 862): for every input and every target its
 *       publication and the table, figure or page it is read from, with the
 *       interval stated there; sent to the reviewer before step 3;
 *   (3) the predictions: the frozen model on the pinned inputs, committed
 *       before any target value is written into the repository;
 *   (4) the comparison: the targets entered as pinned, scored by rule 863,
 *       and the outcome.
 *
 * RULE 856. PREREGISTERED, NOT BLIND. No third party holds the targets: the
 * reviewer declined on 23 September, and no one else has been named. The
 * targets are published, the author of these rules knows the headline figures
 * of these events from the literature, and some were read against the model
 * before (rule 858). What protects the test is the order, not ignorance: the
 * sets, the observables, the bands, the score and the model are fixed here,
 * before the sources are pinned; the sources before the model is run; and
 * nothing of the model moves between step 1 and step 4. A custodian, or a
 * deposit with deferred publication, may be added before step 3 without
 * changing a rule here; its file then replaces step 4's entry.
 *
 * RULE 857. THE SETS. Four, disjoint, as the reviewer proposed on 23 September
 * and as rule 858 corrects it:
 *   (a) development, never scored: Chelyabinsk 2013, Tunguska 1908 and
 *       Sikhote-Alin 1947. They are run and reported as regressions and as
 *       the size and sign of the model's error, and count for nothing here.
 *       The reviewer placed Sikhote-Alin among the scored cases, not knowing
 *       that the model's crater field is calibrated on it (rule 858).
 *   (b) level B, entry: 2008 TC3 (Almahata Sitta), 2018 LA (Motopi Pan),
 *       2023 CX1 (Saint-Pierre-le-Viger) and 2024 BX1 (Ribbeck). Each was
 *       seen by telescopes before it entered and fell as meteorites, so its
 *       size and path are measured apart from what the air did to it. None
 *       dug a crater: together they are the reviewer's negative case, a small
 *       body the model must break up in the air, and Carancas is the positive
 *       one. 2022 EB5 is supplementary, scored apart and only if step 2
 *       finds measured atmospheric data for the targets of rule 861.
 *   (c) level B, crater: Carancas, 15 September 2007.
 *   (d) consistency only, class D: Meteor Crater (Barringer). Its impactor
 *       is known in the literature from fits to the crater itself (the
 *       reviewer: Kring 2017, chapter 4), so it cannot validate a prediction.
 *
 * RULE 858. WHAT WAS ALREADY SEEN, from the inventory of the repository made
 * on 23 September before these rules.
 *   - Chelyabinsk: its energy and burst altitude are gated in the tests; its
 *     window damage was compared in BM-02's H3 and its preset re-derived after
 *     that check failed (B-033); a fitted altitude factor on the airburst's
 *     shock was set on it (removed, B-032); its sunburn at 30 km motivated the
 *     rework of the flash (B-094, B-095); its seismic Ms 3.7 is printed
 *     beside the model's; the gold standard's I3 was amended after its
 *     footprint and Tunguska's had failed it.
 *   - Tunguska: its energy (3 to 30 Mt) and burst altitude are gated; its
 *     flattened forest was compared in H3 and in the airburst band's rules;
 *     its scorched area motivated the flash's rework; the blast coupling of
 *     one half and the luminous efficiency of the burn radii were justified
 *     on its rings; its seismic Ms 5.0 is printed beside the model's. Until
 *     14 September the entry was a classifier tuned on it and on Chelyabinsk
 *     (replaced by Collins et al. 2005's equations, B-023).
 *   - Sikhote-Alin: a preset, and the factor 0.15 of the crater field of an
 *     iron swarm is fitted on its largest crater, 26 m.
 *   - Meteor Crater: its diameter, 1.2 km, is gated at ±35 % in the tests and
 *     is an anchor of the calibration envelope; the model gives about
 *     1.45 km; nothing in the model was changed because of it.
 *   - 2008 TC3, 2018 LA and 2022 EB5 are rows of the 357 CNEOS fireballs of
 *     I2 (16 September), whose altitude of peak brightness was compared with
 *     the model's as a median over all rows; no row was read alone and
 *     nothing was changed after it. That altitude is in the repository, so
 *     for these three it is reported and not scored (rule 861).
 *   - 2023 CX1, 2024 BX1 and Carancas are in no file of the repository. But
 *     the reviewer's reply of 23 September quoted Carancas's diameter (about
 *     14.2 m), its depth-to-diameter ratio (0.18 to 0.20), a geological
 *     energy (83 to 233 MJ) and an infrasound one (about 10¹⁰ J): they have
 *     been read, and this says so.
 *
 * RULE 859. THE MODEL. Frozen at commit 2c2c2f5, the model the reviewer scored
 * at 6.8 on 23 September: `simulateImpact` with its defaults, on Node 22.20.0
 * and darwin-arm64 (rules 836 and 837), so every prediction is reproducible to
 * the bit. The predictions are computed from a checkout of that commit,
 * whatever the repository holds by then. A change to the model after it is
 * tested by a later round, not by this one.
 *
 * RULE 860. INPUTS APART FROM TARGETS.
 *   (a) An input is a property of the body or its path measured apart from the
 *       effects scored: for the entry set, the speed and angle of entry from
 *       the pre-impact orbit, the size from the telescopic brightness with the
 *       albedo range the source allows, the density from the recovered
 *       meteorites; for Carancas, the path and the body from the event's own
 *       records and meteorites.
 *   (b) A target is an effect measured without an impact model: altitudes from
 *       light curves and video, the fragmentation seen in them, the crater
 *       surveyed on the ground, the seismic and infrasound records.
 *   (c) A quantity fitted by a model to a target — an energy from a blast or a
 *       crater, a size from crater scaling — is neither. It may enter as an
 *       input interval only where nothing measured exists; the target it was
 *       fitted to is then reported as circular, and not scored.
 *   (d) Every input is an interval, sampled by rule 863. No preset is used.
 *   (e) Energy is never both an input and a target.
 *
 * RULE 861. THE TARGETS: what the model computes, and nothing it does not.
 *   Entry set, per event:
 *     E1 the outcome, a break-up in the air with no crater, against
 *        `entry.regime` and `crater.origin`;
 *     E2 the altitude of the first major fragmentation, against
 *        `entry.breakupAltitude`;
 *     E3 the altitude of peak brightness, against `entry.burstAltitude` — the
 *        model's one statement of where its energy is released, declared here
 *        as an approximation of a light curve's peak. Scored for 2023 CX1 and
 *        2024 BX1; reported, not scored, for the three of rule 858's CNEOS
 *        rows.
 *   Not computed, so not scored: the place and time of the event, the dark
 *   flight and the strewn field, the shape of the light curve, the mass that
 *   reaches the ground as meteorites.
 *   Crater set, Carancas:
 *     K1 the outcome, a single crater dug by a body that reached the ground,
 *        against `entry.regime` and `crater.origin`;
 *     K2 the rim-to-rim diameter, against `crater.finalDiameter`;
 *     K3 the depth-to-diameter ratio, against `crater.depth` over it;
 *     K4 the morphology, simple, against `crater.morphology`;
 *     K5 the seismic magnitude, where a measured one exists, against
 *        `seismic.magnitude`.
 *   Class D, Meteor Crater: the diameter, the depth, the morphology and the
 *   ejecta's extent over the diameter, where the pinned source states them.
 *   Development set: every comparison already made, run again and reported.
 *
 * RULE 862. THE SOURCES, pinned at step 2: the reviewer's pointers (Morrison
 * 2018, NASA TM 20190002302, for Tunguska; Kring 2017, chapter 4 of the LPI
 * guidebook, for Meteor Crater) and each event's primary papers, every input
 * and target cited to its table, figure or page with the interval it states.
 * A target the pinned source does not report is dropped with the reason, and
 * none is added or replaced after step 3. Every download is asked of Andrea
 * first, with the file's name, source and size.
 *
 * RULE 863. SAMPLING AND SCORE.
 *   (a) Each input is sampled over its interval — uniformly, or as a normal
 *       with the σ its source gives — with the seed `level-b-2026-09-23` and
 *       1 000 draws per event. The prediction is the draws' median and their
 *       5–95 % band.
 *   (b) A continuous target (an altitude, a diameter, a ratio) is the interval
 *       its source states, or its central value ± the error stated. It
 *       passes if both hold: the observed interval overlaps the band, and
 *       |ln(median / observed central value)| ≤ ln 1.2. The band's width over
 *       the observed value is reported beside it.
 *   (c) An outcome or a morphology passes if at least 90 % of the draws
 *       answer as observed.
 *   (d) A magnitude passes if the median is within 0.5 of the measured one.
 *   (e) Class D passes if every observed quantity lies inside the band.
 *   (f) Damage, where a case has it (the development set): glass is read
 *       between 0.5 and 1.4 kPa for sporadic breakage and between 1.4 and
 *       5 kPa for extensive; trees between 10 and 35 kPa with a peak wind of
 *       20 to 50 m/s. The observed contour is compared with the range of
 *       distances the band puts it at, never with one threshold chosen after
 *       the model has been run (the reviewer, 23 September; Popova et al.
 *       2013 for the glass).
 *
 * RULE 864. WHAT DECIDES. A family earns class B within the domain its set
 * spans — stated at step 2 from the pinned inputs — if every scored target of
 * every event of its set passes: the entry from the entry set, the crater
 * from Carancas. Anything else leaves the class where it is, and every target
 * that fails becomes an item of phase 4, with its numbers.
 *
 * RULE 865. WHAT MAY NOT HAPPEN. No change to the model counts between step 1
 * and step 4. No set, target, band or source changes after step 3; the
 * reviewer's corrections before step 3 are adopted and recorded as his. One
 * run. Whatever is noticed after it is written down as read after.
 */

/**
 * Rules 867 to 874 — the reviewer's corrections, adopted before step 3 as rule
 * 865 allows. Written on 23 September 2026 from his reply of that day to the
 * protocol (sent by Andrea as «Nimbus — protocollo livello B per il
 * revisore»), which approved it on conditions; each condition is one rule
 * below, and each is his. No model has been run on any pinned input.
 *
 * RULE 867. THE SETS, REVISED. 2008 TC3, 2018 LA and 2022 EB5 are rows of
 * I2's 357 CNEOS fireballs: the model's altitudes were examined on them, in
 * aggregate. They leave the entry set for a set of their own, `seen`: run and
 * reported as public checks, never counted for level B. Level B of the entry
 * rests on 2023 CX1 and 2024 BX1; of the crater on Carancas; Meteor Crater
 * stays class D; the development set is unchanged. A B of the entry that
 * generalises beyond them needs a further body seen before impact, used
 * neither in development nor in I2 — pinned by rules of its own, before its
 * model is run.
 *
 * RULE 868. THE TARGETS, primary and secondary, and their bars (replacing
 * rule 863(b) to (e) for level B):
 *   E1 the outcome — primary — passes if at least 90 % of the draws dig no
 *      crater of any kind (`crater.origin` is `none`);
 *   E2 the altitude of the first major fragmentation, against
 *      `entry.breakupAltitude` — primary — passes if the draws' 5–95 % band
 *      overlaps the observed interval and their median lies inside it once it
 *      is widened on each side by the larger of 30 % of its midpoint and 5 km;
 *   E3 "compatibility with the flare altitude": the altitude at which the
 *      model deposits its energy, `entry.burstAltitude`, is a proxy of the
 *      flare, not the same observable (the light depends on the luminous
 *      efficiency, the ablation, every fragmentation and the instrument) —
 *      secondary — passes if the band meets the observed interval widened by
 *      5 km on each side;
 *   K1 the outcome — primary — passes if at least 90 % of the draws dig a
 *      crater with a body that reached the ground (`crater.origin` is
 *      `impact`);
 *   K3 the depth-to-diameter ratio — primary — passes if the band overlaps the
 *      observed interval and the median lies inside it once widened by 20 % of
 *      its midpoint on each side;
 *   K4 and D3 the morphology — secondary — passes if at least 80 % of the
 *      draws answer as observed;
 *   D1 and D2, class D — pass if the observed interval lies inside the band;
 *      the median against the interval widened by 30 % of its midpoint is
 *      reported beside it.
 * Where an observed value is an interval, the median is held to the interval,
 * never to a single figure chosen after the run.
 *
 * RULE 869. THE ANGLES. A best-fit or a most probable angle is not a rounded
 * measurement, and rule 866(b)'s half-unit does not apply to it. Carancas:
 * uniform between 45° and 75° about the representative 63°. Meteor Crater:
 * p(θ) ∝ sin 2θ between 30° and 75°, the distribution of random impacts; its
 * nominal 45° is run as a scenario apart, reported, never mixed into the
 * ensemble.
 *
 * RULE 870. WHAT DECIDES, replacing rule 864. A family earns class B limited
 * to the domain of rule 871 if (i) every primary target of every counted event
 * passes, (ii) at least 80 % of its secondary targets pass, and (iii) its
 * continuous targets show no directional bias: the mean of ln(median /
 * observed midpoint) over them lies within ±ln 1.3. (iv) Whether the 5–95 %
 * bands cover as often as they claim cannot be measured on two events, and the
 * outcome says so rather than claim it. For the crater, Carancas alone gives
 * at most "B provisional, a single case", worded "compatible with Carancas in
 * one reference case"; "validated" waits for a second independent positive
 * case — an iron with a crater field, or a body constrained before its crater
 * was found.
 *
 * RULE 871. THE DOMAIN. The entry's is the span of 2023 CX1's and 2024 BX1's
 * pinned inputs: stony bodies of 0.46 to 1.1 m, entering at 14.0 to 15.2 km/s
 * and 48.7° to 75.7°, of 3 100 to 3 350 kg/m³ (rule 866(b) widens 2024 BX1's
 * to 2 790–3 410). Nothing outside it is claimed.
 *
 * RULE 872. EVERY INPUT SAYS WHETHER IT DEPENDS ON A SCORED TARGET. Carancas's
 * 3 to 9 t does: it was fitted with the crater as a constraint, so it is a
 * mixed informative prior, not an independent distribution. Beside the
 * scored run, a stress run widens it to 1 to 27 t (a third of the lowest to
 * three times the highest) and is reported, not scored, to show how much the
 * test leans on it.
 *
 * RULE 873. THE TARGET'S GROUND, fixed now because no rule had: Carancas,
 * wet soil of "~2 g cm−3" (Kenkmann et al. 2009, p. 991; ±10 % by rule
 * 866(b)); Meteor Crater and the bodies of the entry set, which no pinned
 * source gives, the model's crustal rock, 2 700 kg/m³, declared as such.
 *
 * RULE 874. AFTER THIS COMMIT the protocol is frozen: step 3 may start. The
 * reviewer's conditions and where each went: the three CNEOS rows
 * reclassified (867); energy deposition apart from brightness (868, E3);
 * the angles widened (869); primary and secondary targets, the family rule,
 * the bias and the coverage (870); every claim limited to its domain (870,
 * 871); a second positive crater before "validated" (870). The table of
 * dependence he asked for is `dependsOnTarget` on every input of
 * levelBSources.ts (872).
 */

export type LevelBSet = 'development' | 'seen' | 'entry' | 'crater' | 'consistency';

/** Rules 857 and 867: every event, in exactly one set. */
export const LEVEL_B_EVENTS: Readonly<Record<string, LevelBSet>> = {
  'Chelyabinsk 2013': 'development',
  'Tunguska 1908': 'development',
  'Sikhote-Alin 1947': 'development',
  '2008 TC3': 'seen',
  '2018 LA': 'seen',
  '2022 EB5': 'seen',
  '2023 CX1': 'entry',
  '2024 BX1': 'entry',
  Carancas: 'crater',
  'Meteor Crater': 'consistency',
};

/** Rule 859: the model under test. */
export const LEVEL_B_FROZEN_MODEL = '2c2c2f5';

/** Rule 863(a). */
export const LEVEL_B_SEED = 'level-b-2026-09-23';
export const LEVEL_B_DRAWS = 1_000;

/** Rules 868 and 870. */
export const LEVEL_B_BARS = {
  outcomeShare: 0.9,
  morphologyShare: 0.8,
  fragmentationRelative: 0.3,
  fragmentationMinimumM: 5_000,
  flareWideningM: 5_000,
  depthRatioRelative: 0.2,
  consistencyRelative: 0.3,
  secondaryShare: 0.8,
  biasLogRatio: Math.log(1.3),
} as const;

/** Rule 872: Carancas's stress run. */
export const LEVEL_B_CARANCAS_STRESS_MASS_KG = [1_000, 27_000] as const;

/** Rule 863(f), in pascals and metres per second. */
export const LEVEL_B_DAMAGE_BANDS = {
  glassSporadicPa: [500, 1_400],
  glassExtensivePa: [1_400, 5_000],
  treesPa: [10_000, 35_000],
  treesWindMps: [20, 50],
} as const;

/** The outcome, written after step 4. */
export const LEVEL_B_OUTCOME: string | null = null;
