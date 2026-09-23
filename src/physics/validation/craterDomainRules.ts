/**
 * Rules 945 to 952 — the crater below the hypervelocity domain (B-124).
 * Written on 23 September 2026, evening, on Andrea's word («Sì, procedi»),
 * after the third set was frozen (a92f2ac) and in the order the reviewer set:
 * this defect alone, before the round on fragmentation, so that it is known
 * which change mends which error. Written before any line of the change.
 *
 * RULE 945. THE DEFECT. The model evaluates Collins, Melosh & Marcus (2005)'s
 * Eq. 21 — a law built on hypervelocity experiments and explosions — at
 * whatever speed its body reaches the ground, down to its terminal velocity.
 * Level B's second round found it (91e4eb5): 2022 WJ1, kept whole, reaches
 * the ground at about 0.1 km/s and is given a crater of 2.3 to 3.4 m. It is
 * a fault of the crater's domain, not of the law of fragmentation, and it is
 * mended first and apart (the reviewer). Registered as B-124.
 *
 * RULE 946. THE DOMAIN, from the sources, fixed before any code and chosen on
 * no event. French (1998), Traces of Catastrophe (LPI Contribution 954):
 * a hypervelocity impact crater forms where the projectile strikes at
 * velocities "much greater than the speed of sound in the target rocks", its
 * crater dug by shock waves (§3.1, p. 17); smaller projectiles strike "at
 * speeds of no more than a few hundred meters per second", penetrate, and
 * excavate "a pit that is slightly larger than the projectile itself" —
 * "strictly a mechanical" process, with no shock waves — pits "typically less
 * than a few tens of meters in diameter" (p. 17); the speed of sound in the
 * target rocks is "typically 5–8 km/s" (p. 18). Brown et al. (2008, §1) call
 * such craters strength-dominated; Collins et al. (2005, p. 820) write that
 * their program "should not be used" for small objects that "drop small
 * meteorites to the surface at terminal velocity". So Eq. 21 is inside its
 * domain where the speed it is evaluated at is at least 5 km/s — the lowest
 * speed of sound French gives for target rocks — and outside it below.
 *
 * RULE 947. THE THREE STATES — and the only thing that changes. A new field,
 * `crater.state`:
 *   `computed`     Eq. 21 inside its domain, and every law built on it — the
 *                  final crater, the depth, the morphology, the ejecta — as
 *                  today, to the bit;
 *   `none`         nothing reaches the ground to dig (`crater.origin` `none`),
 *                  as today;
 *   `outOfDomain`  a body, a swarm or a share of it reaches the ground, but
 *                  Eq. 21 would be evaluated below 5 km/s for a term that
 *                  weighs in the crater: no transient or final diameter, no
 *                  depth and no ejecta blanket are given — they are not
 *                  numbers — and the crater is "not resolved: a local
 *                  penetration pit is possible".
 * The iron's strewn field keeps its own law, its largest crater calibrated on
 * Sikhote-Alin at the speed of entry (rules 764 to 771): where it alone
 * digs, the state is `computed`, as today. The third state is never read as
 * "no crater" and never as a crater: it is neither a success nor a failure
 * (the reviewer).
 *
 * RULE 948. WHAT DOES NOT CHANGE: every output of the entry — altitudes,
 * speeds, masses, the energy that reaches the ground; every effect read from
 * that energy — the fireball at the ground, the blast, the flash, the seismic
 * magnitude; level A, its harness and every check against the program, which
 * run with the legacy crater (`craterDomain: 'legacy'`) because the program
 * evaluates Eq. 21 at any speed; and every crater computed at 5 km/s or more,
 * to the bit.
 *
 * RULE 949. WHAT THE PRODUCT SAYS in the third state: the panel, the report
 * and the globe say the crater is not resolved and a local penetration pit is
 * possible, and draw no crater or ejecta ring; the Monte Carlo counts the
 * draws out of the domain apart — its crater and ejecta rows read over the
 * resolved draws, with the share out of the domain beside them, never merged
 * with the draws that dig nothing; the evidence card of the crater says where
 * its law holds.
 *
 * RULE 950. WHAT VERIFIES IT, on development and seen cases only, as a
 * diagnostic (the reviewer) — none of the third set is run: 2022 WJ1 on the
 * frozen draws of the second round (whole at about 0.1 km/s: out of the
 * domain, never "none"); Sterlitamak's draws (an iron at about 0.9 km/s: out
 * of the domain, where a penetration crater of about 10 m was observed);
 * Carancas (the model bursts it: unchanged); Ådalen (a row of I2's CNEOS set,
 * diagnostic: reported, its CNEOS altitude not counted); Meteor Crater,
 * Chicxulub and every preset whose crater is computed at 5 km/s or more
 * (unchanged to the bit); the Sikhote-Alin preset (its strewn field
 * unchanged). No threshold is chosen on any of them: it is rule 946's.
 *
 * RULE 951. WHAT DECIDES, and what an adoption may update.
 *   (a) every crater computed at 5 km/s or more is identical to the bit: the
 *       seal moves only in scenarios whose crater falls out of the domain,
 *       each listed;
 *   (b) no output of the entry moves, and level A does not move;
 *   (c) G5 reads nothing new;
 *   (d) 2022 WJ1's draws that reach the ground read `outOfDomain`, none reads
 *       `none` because of the change (rule 940); B-124's regression test
 *       passes;
 *   (e) typecheck, lint, format, the whole suite, the strict gate, and
 *       Chromium's end-to-end suite.
 * An adoption may update, each for its reason written in the outcome: a check
 * against the program, pinned to the legacy crater; a record or test that
 * asserts a crater number for a body reaching the ground below 5 km/s,
 * rewritten to the three states; the seal, re-taken. Any other test that
 * fails refuses the change.
 *
 * RULE 952. WHAT MAY NOT HAPPEN. The 5 km/s is French's and stays. One run of
 * rule 951. No event of the third set is read. The round on fragmentation
 * does not start until this one's outcome is written.
 */

/** Rule 946: the lowest speed at which Eq. 21 is inside its domain (m/s). */
export const CRATER_DOMAIN_MIN_SPEED_MS = 5_000;

/** Rule 948: the legacy crater (Eq. 21 at any speed) or the domain of 946. */
export type CraterDomain = 'legacy' | 'hypervelocity';

/** Rule 947: the crater's three states. */
export type CraterState = 'computed' | 'none' | 'outOfDomain';

/**
 * The outcome, written on 23 September 2026 after the one run of rule 951, on
 * the candidate of b93c887 (the rules pushed first, 818bfda).
 *
 * ADOPTED: every clause of rule 951 holds. `DEFAULT_CRATER_DOMAIN` is
 * `hypervelocity`.
 * (a) MET. Of the 308 sealed scenarios, the numbers and the drawing moved in
 *     four — drawn:048, 136, 150 and 166 — and in those only: each reaches the
 *     ground below 5 km/s (3.90, 1.86, 0.20 and 4.20 km/s), its crater now not
 *     resolved where Eq. 21 gave 413, 52, 6 and 345 m. The texts of every
 *     scenario moved by the crater card's sentence on its domain (rule 949).
 *     The seal is re-taken.
 * (b) MET. In the four, the entry, the rings but the rim, the seismic
 *     magnitude, the firestorm, the atmosphere and the tsunami are the same to
 *     the bit; level A passes unchanged, its harness and the program's rows
 *     on the legacy crater.
 * (c) MET. G5 reads the same under both branches, on the benchmark's own draw
 *     and on the held-out seed benchmark-2026-09-23-heldout-crater-domain
 *     (invariants-2026-09-23-16 to -19), once its finite invariant no longer
 *     reads the crater's fields where rule 947 makes them not numbers.
 * (d) MET. On the second round's frozen draws of 2022 WJ1, the 918 that reach
 *     the ground move from `computed` to `outOfDomain` (at about 98 m/s) and
 *     the 82 that burst stay `none`: no draw became "no crater". B-124's test
 *     passes.
 * (e) MET. Typecheck, lint, format; the whole suite; the validation report
 *     regenerated once, identical, its strict gate PASS; Chromium's
 *     end-to-end suite, 33 passed and 14 skipped as before; the panel read in
 *     the running app for a 0.5 m stone at 14 km/s and 22.5°: "non risolto:
 *     possibile buca di penetrazione locale".
 * Updated as rule 951 allows, each for its reason: the finite invariants of
 * the custom scenarios, of B-030 and of G5, rewritten to the three states;
 * the records of rules 764 to 771, 838 to 845 and 846 to 853 and the iron's
 * monotony, read on the legacy crater they were measured on (under the
 * domain their slow swarms — a 25 m iron at 4.8 km/s among them — are not
 * resolved).
 *
 * Rule 950's diagnostics, never deciding: Sterlitamak's draws reach the
 * ground at about 0.88 km/s and are out of the domain on every ground, where
 * a penetration crater of about 10 m was observed; Carancas still bursts in
 * the air in every draw; Ådalen, from its CNEOS row with an iron's density
 * (a body of 1.24 m at 73°, its CNEOS altitude of 22.3 km not counted),
 * reaches the ground whole at 4.6 km/s and is out of the domain — where a
 * 13.8 kg iron was found, and no crater.
 *
 * What stays open: a law for the pits below 5 km/s (French's "penetration
 * craters"), and Collins et al.'s own statement that Eq. 21 holds where
 * gravity ends the crater's growth, "larger than a couple of hundred meters"
 * (p. 823) — a crater of 20 m at 15 km/s is inside this round's domain and
 * outside that one.
 */
export const CRATER_DOMAIN_OUTCOME: string | null =
  'ADOPTED 23 September 2026: below 5 km/s at the ground the crater is not resolved — a local penetration pit is possible — where the model gave a hypervelocity crater. Four sealed scenarios move, nothing else of the model does; 2022 WJ1 reads "out of the domain", never "no crater".';

/**
 * Rules 953 to 958 — two refinements of B-124, as the reviewer asked on 23
 * September 2026, evening, on approving it. Written on Andrea's word («Entrambi,
 * in ordine») before any line of the change.
 *
 * RULE 953. WHAT THIS IS. (a) Where the crater is out of its law's domain, the
 * model gives no seismic magnitude either: how a body that penetrates at a
 * few hundred metres a second couples to the ground is not modelled. (b) The
 * crater's domain is said in three tiers, the reviewer's: below 5 km/s at the
 * ground, out of the domain of hypervelocity cratering, a local penetration
 * possible and not modelled; at 5 km/s or more with a crater under about
 * 200 m, exploratory — outside the domain Collins et al. declare for their
 * scaling law; at 5 km/s or more and 200 m or more, inside it.
 *
 * RULE 954. THE MAGNITUDE. In the state `outOfDomain` the seismic magnitude
 * and its range are null and its source is null, as where no relation covers
 * a scenario (rule 730); the liquefaction radius, read from the magnitude, is
 * none. Nothing else moves: the blast and the flash of the energy released at
 * the ground are the energy's, not the crater's — the rings "of crater origin"
 * the reviewer names, the rim and the ejecta, are already not given (rule
 * 947). This reading is written to the reviewer with the outcome.
 *
 * RULE 955. THE SECOND TIER. Collins, Melosh & Marcus (2005, p. 823): Eq. 21
 * "applies for impacts into solid rock targets where gravity is the
 * predominant arresting influence in crater growth, which is the case for all
 * terrestrial impacts larger than a couple of hundred meters in diameter". A
 * crater computed (`computed`) whose final diameter is under 200 m is labelled
 * "exploratory: outside the declared domain of Collins et al.'s scaling law"
 * in the panel, the report and the crater's evidence card — its numbers kept
 * and shown, as the reviewer asked, for the round that will read them. The
 * label is a word, not a switch: no number moves by it.
 *
 * RULE 956. WHAT DECIDES. (a) The seal moves in the numbers of the four
 * scenarios out of the domain (their seismic fields) and nowhere else; in
 * texts where a crater under 200 m is labelled, or a card's words change; (b)
 * level A does not move — its crater is the legacy one, never out of the
 * domain; (c) G5 reads nothing new; (d) typecheck, lint, format, the whole
 * suite, the strict gate, Chromium's end-to-end suite; (e) the label read in
 * the running app on a crater under 200 m, and the magnitude's absence on a
 * body out of the domain.
 *
 * RULE 957. WHAT AN ADOPTION MAY UPDATE: a test that asserts a magnitude for a
 * body whose crater is out of the domain, rewritten to its absence; the seal,
 * re-taken. Any other test that fails refuses the change.
 *
 * RULE 958. WHAT MAY NOT HAPPEN. The 200 m is Collins's "couple of hundred
 * meters", read as 200, and stays; no crater is disabled by it; one run. The
 * second tier's own round — a law for the strength regime — comes after the
 * round on fragmentation (the reviewer).
 */

/** Rule 955: the final crater under which Collins et al.'s law is outside its
 *  declared domain (m). */
export const COLLINS_GRAVITY_REGIME_MIN_DIAMETER_M = 200;

/**
 * The outcome of rules 953 to 958, written on 23 September 2026 after their one
 * run (the rules pushed first, 6aa794d).
 *
 * ADOPTED: every clause of rule 956 holds.
 * (a) MET. The seal's numbers moved in the four scenarios out of the domain
 *     and nowhere else — their magnitude, its range and its source now none;
 *     the drawing moved in two of them, drawn:048 and drawn:166, whose
 *     magnitudes of 3.6 and 4.0 drew shaking levels that are no longer drawn
 *     (the other two had none); the texts of every scenario moved by the
 *     crater card's sentence on the second tier and the label of craters
 *     under 200 m. The seal is re-taken.
 * (b) MET. Level A unchanged.
 * (c) MET. G5 reads what it read before, on the benchmark's own draw and the
 *     held-out seed (invariants-2026-09-23-20 and -21, identical to -17 and
 *     -19).
 * (d) MET. Typecheck, lint, format; 3 064 tests; the validation report
 *     regenerated, identical, its strict gate PASS; Chromium's end-to-end
 *     suite, 33 passed and 14 skipped.
 * (e) MET, and read: in the running app Sikhote-Alin's crater carries
 *     "esplorativo: sotto i ~200 m la legge di Collins è fuori dal suo dominio
 *     dichiarato (regime di gravità)". A 0.5 m stone at 14 km/s and 22.5° showed
 *     no magnitude, but under the words written for an airburst ("nessuna
 *     relazione verificata dal simulatore copre questo airburst"), which it is
 *     not; the panel now says the body reaches the ground below 5 km/s and how
 *     it couples to the ground as it penetrates is not modelled. That sentence
 *     is in no sealed text.
 * Updated as rule 957 allows: B-124's test, which held the magnitude of a body
 * out of the domain equal on both branches, now holds its absence.
 */
export const CRATER_TIERS_OUTCOME: string | null =
  "ADOPTED 23 September 2026: out of the crater law's domain no seismic magnitude is given; a crater computed under 200 m is labelled exploratory, outside the domain Collins et al. declare, its numbers kept.";

/**
 * Rules 968 to 972 — what else is of crater origin (B-125). Written on
 * 23 September 2026, evening, on Andrea's word («Sì, tutto in ordine»), after
 * the reviewer's reply to rules 953 to 958. Written before any line of the
 * change.
 *
 * RULE 968. THE DEFECT. The reviewer's reading of "of crater origin": out of
 * the domain, nothing is given that presupposes the crater's excavation or its
 * coupling to the ground — the crater's diameter and depth; its rim, its
 * ejecta and their geometry; the seismic magnitude and the liquefaction; any
 * radius computed from the crater's mass or geometry. The blast and the flash
 * of the energy deposited in the air or at the ground stay, their source said,
 * and are not presented as effects of a cratering impact. Four outputs still
 * read the crater out of the domain: (i) the stratospheric dust, the rock the
 * crater pulverizes (Toon et al. 1997, §8.2), given only where a transient
 * crater is; (ii) the shock-made nitric acid, whose NO comes mostly from the
 * ejecta plume (Prinn & Fegley 1987); (iii) the sea's coupling, which reads
 * the transient cavity on land and the rim and the 1 m isopach at sea, and
 * publishes its reach from them — rule 948 kept it on the model's own crater;
 * (iv) the drawn offset of the ejecta blanket, 0.3 of its edge. And the
 * morphology is read from the final diameter; the panel and the report hide
 * it out of the domain, the report's citations do not. Registered as B-125.
 *
 * RULE 969. THE CHANGE, out of the domain only: (i) and (ii) are not given
 * (not a number), "not resolved" in the panel and the report; (iii) the sea's
 * coupling reads no crater — no rim, no transient cavity on land, no ejecta
 * reach: on land no wave is raised through a crater the model does not
 * resolve, which is not a claim that none is raised; at sea the water cavity
 * stays, since it is not Eq. 21's crater — whether its law holds at a few
 * hundred metres a second is a question for the tsunami, not asked here;
 * (iv) the blanket's offset reads no blanket; the morphology is cited
 * nowhere. And the damage section of the panel and of the report says, under
 * the rings, where they come from: the energy released in the air and the
 * energy that reaches the ground, each in megatons, not an impact that digs
 * a crater — a slow penetration is not modelled.
 *
 * RULE 970. WHAT DECIDES. (a) The seal's numbers move in the scenarios out of
 * the domain and nowhere else — today drawn:048, 136, 150 and 166, whose dust,
 * acid and blanket offset go, and none of which raises a wave; the drawing
 * moves nowhere, the blanket being drawn in none of them; the texts move
 * where the source line and the unresolved rows are written. (b) Level A
 * does not move. (c) G5 reads nothing new, its exemption of rule 952 extended
 * to the two fields. (d) Typecheck, lint, format, the whole suite, the strict
 * gate, Chromium's end-to-end suite. (e) Read in the running app on a body
 * out of the domain: dust and acid not resolved, and the source line.
 *
 * RULE 971. WHAT AN ADOPTION MAY UPDATE: a test that asserts a dust, an acid,
 * a sea reach or a blanket offset for a body out of the domain, rewritten to
 * its absence; G5's exemption, extended to the dust and the acid; the seal,
 * re-taken. Any other test that fails refuses the change.
 *
 * RULE 972. WHAT MAY NOT HAPPEN. No threshold moves; nothing the energy makes
 * — blast, flash, fire, climate — moves by a bit; the water cavity at sea is
 * untouched; one run.
 */

/**
 * The outcome of rules 968 to 972, written on 23 September 2026 after their
 * one run (the rules pushed first, e32a3cf).
 *
 * ADOPTED: every clause of rule 970 holds.
 * (a) MET. The seal's numbers moved in drawn:048, 136, 150 and 166, out of the
 *     domain, and nowhere else — their dust and acid now none, and in 136 and
 *     150 the drawn offset of a blanket that is not drawn (31 and 4.5 m, now
 *     0); none raises a wave. The drawing moved nowhere. The texts moved in
 *     the same four: the unresolved dust and acid, and one report row more,
 *     the rings' source. The seal is re-taken.
 * (b) MET. Level A unchanged.
 * (c) MET. G5 reads what it read before, on the benchmark's own draw and the
 *     held-out seed (invariants-2026-09-23-22 and -23, identical to -20 and
 *     -21).
 * (d) MET. Typecheck, lint, format; 3 065 tests; the validation report
 *     regenerated, identical, its strict gate PASS; Chromium's end-to-end
 *     suite, 33 passed and 14 skipped.
 * (e) MET, and read: in the running app the 0.5 m stone at 14 km/s and 22.5°
 *     shows its dust and acid "non risolto" and its rings' source. The first
 *     reading of that source was wrong: it read the air's share as the burst
 *     yield, which is none for a body kept whole, and said the rings came
 *     from the 0.23 kg of TNT the stone brings to the ground, when its 73 m
 *     5 psi ring comes from the 5 t it deposits in the air on its way down —
 *     the energy the program's ground blast is read from. The sentence now
 *     reads the air's share as all the body loses before the ground, and
 *     writes energies below a tonne in kilograms; the seal was re-taken after
 *     it, once.
 * Updated as rule 971 allows: the custom-scenario sweep, which held every
 * number finite, now exempts the dust and the acid out of the domain, as it
 * exempted the crater.
 */
export const CRATER_ORIGIN_OUTCOME: string | null =
  "ADOPTED 23 September 2026: out of the crater law's domain no dust, acid, sea coupling or blanket offset of crater origin is given, and the rings say their energy's source.";

/**
 * Rules 987 to 991 — the audit of what else reads a cratering impact out of
 * the domain (B-126). Written on 23 September 2026, evening, on the
 * reviewer's request and Andrea's word («Sì, tutto in ordine»), before any
 * line of the change.
 *
 * RULE 987. THE AUDIT AND ITS FINDINGS. Every output a body out of the domain
 * still publishes was traced to what it reads. Three read a cratering impact
 * the model does not resolve there: (i) the flash's ground term — the
 * program's fireball on the energy that reaches the ground, the thermal
 * radiation of a hypervelocity impact's vapour plume (Collins et al. 2005) —
 * in the burn and fire rings and in the field's thermal exposure; (ii) the
 * rings' oblique-impact envelope and centre offset (Pierazzo & Artemieva 2003:
 * the downrange plume of a crater-forming oblique impact); (iii) the
 * timeline's seismic stage, shown where no magnitude is given. Read and
 * clean: the blast, which under the product's `surface` law reads the energy
 * ke·max(gf, 1 − gf) — out of the domain always the air's share, since a
 * body entering at 11 km/s or more and reaching the ground below 5 km/s keeps
 * gf below 0.21 (0.17 the largest in a sweep of 40 000 bodies, 1 687 out of the
 * domain) — placed as a point source at the impact point; the casualties and
 * the Monte Carlo, which read the rings; and the climate tier, which reads the
 * total kinetic energy alone, as it does for every airburst — out of the domain
 * it reads REGIONAL or CONTINENTAL for 52 of those 1 687, swarms of 170 to
 * 450 m reaching the ground below 5 km/s, a question for the reviewer and not a
 * crater's. Registered as B-126.
 *
 * RULE 988. THE CHANGE, out of the domain only: (i) no fireball on the ground
 * energy — the flash is the air's alone: a partial airburst's flash, the
 * radiation along the path, a low burst's own fireball; (ii) the rings are
 * drawn as their source makes them, circles about the impact point, with no
 * oblique-impact envelope; (iii) no seismic stage in the timeline; (iv) the
 * rings' source line says it: the energy the body deposits in the air along
 * its path, a source spread along the trajectory that the model draws as a
 * point at the impact point — exploratory proxies — and the energy that reaches
 * the ground drives no ring.
 *
 * RULE 989. WHAT DECIDES. (a) The seal moves in the scenarios out of the
 * domain and nowhere else, each moving scenario listed; (b) level A does not
 * move; (c) G5 reads nothing new; (d) typecheck, lint, format, the whole
 * suite, the strict gate, Chromium's end-to-end suite; (e) read in the running
 * app on a body out of the domain.
 *
 * RULE 990. WHAT AN ADOPTION MAY UPDATE: B-124's test that held the effects of
 * the energy equal on both branches, rewritten to hold the blast equal and the
 * flash, the fire and the rings' shapes read as rule 988 says; a test that
 * asserts a ground fireball, an oblique envelope or a seismic stage for a body
 * out of the domain, rewritten to its absence; the seal, re-taken. Any other
 * test that fails refuses the change.
 *
 * RULE 991. WHAT MAY NOT HAPPEN. Nothing moves inside the domain by a bit; the
 * blast's law and the climate tier are not touched; one run.
 */

/**
 * The outcome of rules 987 to 991, written on 23 September 2026 after their
 * one run (the rules pushed first, b188467).
 *
 * REFUSED by rule 990: three tests beyond those it lets an adoption update
 * failed, and the change was taken out.
 * - Two hold that no burn or fire ring shrinks as a body grows (rules 772 to
 *   779 and 780 to 787). They failed where a body, out of the domain on both
 *   sides, passes from a complete to a partial airburst: at 12 km/s and 8°, a
 *   body of 7 000 kg/m³ growing from 243.5 to 250.8 m saw its third-degree
 *   ring fall from 53.4 to 51.4 km (3.9 %); at 12 km/s and 30°, one of
 *   3 000 kg/m³ and 0.3 MPa growing from 113.1 to 115.3 m, from 10.914 to
 *   10.908 km. The cause is in rule 988, not in the code: B-093 made that passage
 *   continuous — a low burst's fireball on the ground becomes the partial
 *   airburst's fireball on the ground energy — and rule 988 took the second out
 *   and kept the first, which reopens the step B-093 closed.
 * - One holds that the field is the one the rings are drawn from (rule 626). It
 *   failed because the change told the field of the crater's state only through
 *   the field source the globe builds, not through a result read directly — a
 *   fault of the implementation, which would have been mended had the change
 *   stood.
 * Nothing else was read: the seal moved, as it had to, and G5 was not run.
 * What stands open, for the reviewer: whether a low burst's fireball on the
 * ground is of crater origin too when what reaches the ground travels below
 * 5 km/s, or whether the ground energy's fireball stays as the continuation
 * of it; and whether the three other parts of rule 988 — the rings' shapes, the
 * seismic stage, the source line — should be asked alone.
 */
export const CRATER_AUDIT_OUTCOME: string | null =
  'REFUSED 23 September 2026 by rule 990: taking the ground fireball out of the domain, while a low burst keeps its own, reopens the step B-093 closed between a complete and a partial airburst — two tests of rings that must not shrink as a body grows failed, by up to 3.9 %.';
