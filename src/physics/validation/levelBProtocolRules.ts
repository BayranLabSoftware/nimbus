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

export type LevelBSet = 'development' | 'entry' | 'crater' | 'consistency';

/** Rule 857: every event, in exactly one set. */
export const LEVEL_B_EVENTS: Readonly<Record<string, LevelBSet>> = {
  'Chelyabinsk 2013': 'development',
  'Tunguska 1908': 'development',
  'Sikhote-Alin 1947': 'development',
  '2008 TC3': 'entry',
  '2018 LA': 'entry',
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

/** Rule 863(b)–(d). */
export const LEVEL_B_BARS = {
  continuousLogRatio: Math.log(1.2),
  outcomeShare: 0.9,
  magnitude: 0.5,
} as const;

/** Rule 863(f), in pascals and metres per second. */
export const LEVEL_B_DAMAGE_BANDS = {
  glassSporadicPa: [500, 1_400],
  glassExtensivePa: [1_400, 5_000],
  treesPa: [10_000, 35_000],
  treesWindMps: [20, 50],
} as const;

/** The outcome, written after step 4. */
export const LEVEL_B_OUTCOME: string | null = null;
