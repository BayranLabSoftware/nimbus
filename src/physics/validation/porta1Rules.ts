/**
 * Rules 1222 onward — Porta 1 of `Nimbus-PIANO.md`, the physics of the near
 * field, opened on Andrea's word of 26 September 2026, 02:30: «Per la parte 1
 * parta dall'inizio e continua fino al completamento». Written before any
 * source is read for it and before any code, as every round of this project
 * is; the reviewer's programme of whole rounds (a dossier at the start, a
 * package at the end, no approval step by step inside the perimeter) is kept.
 *
 * RULE 1222. WHAT THIS IS, AND WHAT STILL BINDS IT. Porta 1 is the direct
 * continuation of the fragment-cloud branch (`effects/fcmBranch.ts`, rules
 * 1137 to 1192), not a new start. Everything the reviewer's causal dossier
 * forbade stays forbidden here (rule 1191 (g)): nothing implemented from a
 * source before its fact sheet is written; no prior, and no `settleWithin`,
 * chosen on the development cases; the settled share's physical fate not
 * resolved by assumption; the sealed candidate (rule 1162) untouched; no
 * class B; nothing adopted in the product. The product's entry stays Collins
 * et al.'s pancake on the two-stage law, and the seal of the 308 scenarios
 * its regression test, until a candidate passes gates 1 to 3 (rules 1141,
 * 1142, and an independent gate 3 that needs the external custodian —
 * Andrea's decision, `Nimbus-PIANO.md`, «Le decisioni che servono»).
 *
 * RULE 1223. A CORRECTION TO THE PLAN, before any work on its first line.
 * `Nimbus-PIANO.md` lists Porta 1's first item as «Ablazione delle nubi —
 * oggi assente». That is wrong as written: the branch's clouds do ablate —
 * dm/dt = −½ σ ρ A v³ on the cloud's own area πr², the same law as the
 * fragments' (rule 1138; `fcmBranch.ts`, `advance`). What the audit asks for
 * (A1, «come migliorare») is different and precise: 93 % of the entry mass
 * «smette di essere integrata come nube assestata» — rule 1190's 93.21 %,
 * pooled over the 71 pairs that complete, stopped at the terminal-speed
 * condition of rule 1138 (c) — and it names three routes of physics, not
 * tuning: the ablation of the clouds, the breakup criterion of Rulko et al.
 * (2025), the interaction between fragments of Register et al. (2020). The
 * plan's line is corrected to say so, in the plan's own file, with the date.
 *
 * RULE 1224. THE ORDER OF THE ENTRY'S ITEMS, from the reviewer's own (rule
 * 1191 (f): the threshold and the partition before any interaction):
 *   (a) THE BREAKUP CRITERION. Rulko, Rau, Chomette, Wheeler, Mathias, Dotson
 *       & Radovitzky (2025), «Stress analysis of asteroids during atmospheric
 *       entry and implications for the breakup criterion», Icarus 434,
 *       116526 — the audit's own source, and the first candidate for rule
 *       1191 (d) whose loading regime IS an atmospheric entry. Read directly;
 *       held to rule 1191 (d)'s transferability check all the same (loading,
 *       material, scale, geometry, the observable measured, the parameters
 *       left free); a fact sheet in rule 1192's form (the constrained form,
 *       its domain, what it leaves free, the discriminating observable, what
 *       would refute it).
 *   (b) THE SETTLED CLOUD MASS. What the published fragment-cloud work does
 *       with a cloud once it has slowed — R17 and W18 were read in round 1;
 *       Wheeler, Register & Mathias (2017, Icarus 295) was not found open
 *       then (`docs/FCM_ROUND_DOSSIER.md`), and its NTRS conference form
 *       (20170000320) is to be checked — and what a source independent of
 *       this project's cases says of a debris cloud's late fate: vapour,
 *       dust, pieces. A fact sheet; where no source constrains the form
 *       without new constants chosen on the development cases, the verdict
 *       is NOT IDENTIFIABLE, which rule 1191 already prefers to a guess.
 *   (c) THE INTERACTION. Register, Aftosmis, Stern, Brock, Seltner, Willems,
 *       Guelhan & Mathias (2020), «Interactions between asteroid fragments
 *       during atmospheric entry», Icarus 337, 113468. Read and written up
 *       as (a) and (b); attempted in code only after (a) or (b) gives an
 *       identifiable, individually measurable effect (rule 1191 (f)).
 *   (d) No code in these rules. A candidate is written only under a later,
 *       separately preregistered rule set, after its fact sheet clears the
 *       check, and it is then held to gate 1 (rule 1141) and gate 2 (rule
 *       1142) as every change of the branch is.
 *
 * RULE 1225. HOW THE SOURCES ARE READ. A source an editorial site refuses to
 * a script is not fetched around its refusal: Andrea downloads it into
 * `~/Desktop/Nimbus-fonti/`, and it is read there, never pasted into the
 * conversation (the lesson of deviation D15). Any altitude a source gives for
 * an event outside rule 1143's development list is read only through the
 * mask (`scripts/tmp/inputs-masked.ts`), since a future independent test may
 * need that event blind. Open copies (NTRS, arXiv) are fetched directly and
 * their fingerprint recorded with the fact sheet.
 *
 * RULE 1226. THE REST OF PORTA 1, named so it is not lost: the blast from
 * height-of-burst curves computed by CFD (Aftosmis et al. 2019) in place of
 * the static source; the thermal thresholds for long pulses (Coates et al.
 * 2024); level B's second round with the targets deposited under embargo
 * before any prediction. Each is opened by its own rules in the reviewer's
 * order of modules (the entry, then the blast, then the heat), after the
 * entry's three items above are written up or declared not identifiable.
 */
export const PORTA1_OPENED = '2026-09-26' as const;

/**
 * RULE 1227. ITEM (b), FIRST FINDING — THE SETTLE CONDITION DOES NOT SAY WHAT
 * RULE 1138 (c) SAYS. Read before anything was changed: R17 (NTRS
 * 20180003387, sha-256 57a14e75…, p. 5) flies a cloud until it fully
 * ablates, slows below a limiting speed, or reaches the ground; W18 (NTRS
 * 20180002835, sha-256 22cdf472…, p. 18) counts landed FRAGMENTS, not cloud
 * mass, against the meteorites found; Wheeler et al.'s poster (NTRS
 * 20170000320, sha-256 ca8261c1…) calls a debris cloud one aggregate mass of
 * particulates that drives the deposition. So the branch's stop is R17's own
 * kind, and cloud mass is never meteorite mass — the published model sets no
 * later fate for it.
 *
 * But the stop as coded is not the stop as written. Rule 1138 (c): «a cloud
 * settles where its speed is within this share ABOVE its terminal speed»,
 * the stiff last approach to it (deviation D9). `fcmBranch.ts` tests
 * `y[0] <= settleAbove * cloudTerminal(h, y)`: any speed BELOW 1.01 × the
 * local terminal speed — which a fresh cloud high in thin air has before it
 * has slowed at all, because the thin air cannot yet hold it up. Measured on
 * 26 September 2026 (the audit engine's own records, rule 1190 (a), the
 * first draw of the development case «Tunguska», M1/unlimited): the first
 * break's cloud, 69.6 % of the body's mass, born at 39.9 km at 15.0 km/s,
 * its local terminal speed 22.5 km/s — stopped at birth, and its whole
 * kinetic energy, 69.9 % of the entry's, given to the air at that one
 * altitude. M1/capped: 84.5 %; M2/unlimited: 54.0 %. On the smaller
 * development bodies (2008 TC3, 2018 LA, 2022 EB5, 2023 CX1, 2024 BX1, 2022
 * WJ1, Carancas, Chelyabinsk) the energy stopped is 0.1 to 26 parts per
 * million of the entry's: there the clouds do come down to their terminal
 * speed before they stop. Rule 1190's pooled 93.21 % is weighted by mass, so
 * the largest body weighs most in it.
 *   (a) NOT A TUNING: nothing is fitted and no number moves by choice. The
 *       condition is made to say what rule 1138 (c) says — a cloud settles
 *       once its speed has been above (1 + settleWithin) × its local terminal
 *       speed in its own flight and has since come down within that share of
 *       it. A cloud still below its terminal speed flies on: in denser air
 *       its terminal speed falls, it slows, and it settles when rule 1138
 *       (c) meant it to, or reaches the ground as a swarm.
 *   (b) THE SEALED CANDIDATE IS NOT REOPENED (rules 1162, 1191 (g)): the
 *       correction is a new version of the engine in a file of its own,
 *       `effects/fcmBranchSettle.ts`, the sealed one's text with that
 *       condition alone changed, and a test that the two agree to the last
 *       bit wherever no cloud is ever born below its terminal speed.
 *   (c) WHAT IS MEASURED, on a declared sample of the development cases
 *       (development only, rule 1143), the sealed version beside the new:
 *       the settled share, the energy given to the air at stops, the
 *       ledger's balance (gate 1's criterion, rule 1141 (a)), and the
 *       deposit's peak and its altitude (rule 1151). A sample says whether
 *       the defect moves them; the full development run is its own step.
 *   (d) Gate 2 (rule 1142) is re-read on the new version for R17's and
 *       W18's events; where no cloud of those runs is born below its
 *       terminal speed, the two versions agree to the bit and gate 2 stands
 *       as it was, which the test of (b) proves rather than assumes.
 *   (e) No adoption, no class B, no new claim about the ground: a package
 *       for the reviewer, as every round of this branch ends.
 */
export const RULE_1227_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1228. RULE 1227'S OUTCOME, as measured on 26 September 2026 — and one
 * mistake on the way, recorded.
 *
 * The mistake: the first version of `fcmBranchSettle.ts` settled a cloud
 * also where its speed stood within the band from BELOW — which rule 1227
 * (a)'s own words did not allow. Descending, the denser air brings a fresh
 * cloud's terminal speed down onto its own speed before the cloud has slowed
 * at all, and that first version stopped Tunguska's first cloud at 37.5 km
 * at 15.0 km/s, 69.9 % of the entry's energy still given to the air at one
 * altitude. Found by instrumenting the stops (why each stopped, where, at
 * what speed), before anything was committed; the code now says what the
 * rule says — only a cloud that has been above the band and has come down
 * into it settles.
 *
 * (a) THE TESTS (`effects/fcmBranchSettle.test.ts`). A small body whose
 *     clouds are all born above their band: the corrected engine is the
 *     sealed one to the last bit (the deposit, the ledger, the pieces). A
 *     Tunguska-scale body (60 m, 15 km/s, 30°): the sealed engine gives more
 *     than 30 % of the entry's energy to the air at stops, the corrected one
 *     less than 10⁻³, its ledger closed to 10⁻¹².
 * (b) THE DECLARED SAMPLE (`scripts/porta1-settle-sample.ts`, five draws of
 *     every development case of rule 1143, four configurations,
 *     `docs/PORTA1_SETTLE_SAMPLE.md`): every draw of every case but one is
 *     identical to the bit under the two engines — 60 of 60 configurations
 *     of the cases of rule 961, the third set's six bodies and W18's four
 *     events, and Chelyabinsk. Tunguska differs, in every configuration that
 *     completes: the energy given to the air at stops falls from 69.9 %,
 *     84.5 % and 54.0 % of the entry's to 2·10⁻⁶ or less, the deposit's peak
 *     moves from 40.4, 34.9 and 37.9 km to 18.1, 13.7 and 20.7 km, and the
 *     settled share from 90.7, 86.2 and 65.8 % to 21.1, 2.0 and 26.2 %
 *     (M1/unlimited, M1/capped, M2/unlimited; M2/capped completes under
 *     neither engine). The corrected engine's ledger, worst over every
 *     completed draw: 5.3·10⁻¹⁶ (rule 1141 (a) asks 10⁻¹²).
 *     [Corrected on 26 September 2026, 03:10, rule 1229 (a): W18's events
 *     are three, not four; and Chelyabinsk, Tunguska and 2022 EB5 carry one
 *     input each, the other fifteen cases five draws — so what is identical
 *     to the bit is 68 of 68 configurations, the fifteen cases' 60 and
 *     Chelyabinsk's and 2022 EB5's 8. «60 of 60 … and Chelyabinsk» left
 *     2022 EB5 out. Every other number of (b) stands.]
 * (c) WHAT THE CLOUD MASS DOES INSTEAD, on Tunguska's first draw: in the M1
 *     configurations part of it now reaches the ground as a swarm (48.9 %
 *     and 79.1 % of the mass) carrying 0.1 and 0.5 kt of the entry's 9 123
 *     kt — debris already slowed, which the sealed engine had labelled
 *     settled at birth. By the published model's own terms (rule 1227) it is
 *     particulate debris, never meteorite mass: no ground or meteorite claim
 *     is made of it.
 * (d) GATE 2 (rule 1142): R17's four Chelyabinsk settings, both schemes —
 *     identical results under the two engines. W18's events: identical under
 *     the sample above; the gate script's own re-run on the corrected engine
 *     is recorded in `docs/PORTA1_SETTLE.md` when it ends.
 * (e) WHAT IT MEANS, AND WHAT IT DOES NOT. Round 3's candidate is untouched,
 *     and so is its verdict: its domain is 0.1 to 10 m (rule 1163), where
 *     every draw measured here is identical. Rule 1190's pooled 93.21 % is
 *     weighted by mass and so dominated by the one body this defect distorts
 *     — read beside this rule, not alone. For bodies whose first cloud is
 *     born high and slow for its air — the large ones the audit says
 *     dominate the risk — the sealed branch's deposit was not the model's
 *     physics but its stopping rule; the corrected version is the one any
 *     later run above 10 m should use. No adoption, no class B, no tuning:
 *     the priors, `settleWithin` and every constant are as sealed.
 * (f) NEXT, in rule 1224's order: the full development run on the corrected
 *     engine, and gate 1's convergence (rule 1141 (c)) on the bodies it
 *     changes, before any reading of the branch above 10 m; items (a) and (c)
 *     wait for their sources (rule 1225).
 */
export const RULE_1228_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1229. RULE 1228 (f)'S FIRST STEPS, FIXED BEFORE THEY RUN — and three
 * records first (26 September 2026, 03:10).
 *
 * (a) A CORRECTION TO RULE 1228 (b)'S COUNT, bracketed there: W18's events
 *     are three (Košice, Benešov, Tagish Lake); three of rule 961's cases
 *     carry one input each (Chelyabinsk, Tunguska, 2022 EB5, as in the
 *     development run of rule 1156); the configurations identical to the bit
 *     are 68 of 68, not «60 of 60 … and Chelyabinsk».
 * (b) GATE 2 ON W18, THE GATE SCRIPT'S OWN RE-RUN (rule 1228 (d)'s pending
 *     line): `scripts/fcm-gate2-w18.ts` with the engine's import alone
 *     changed (a copy in `scripts/tmp`, its outputs to the scratch folder),
 *     ended 03:01. Košice and Benešov: identical to the bit. Tagish Lake: NOT
 *     identical. W18's fit of it breaks its upper share at 1 to 90 kPa, 70 to
 *     90 km up, where the clouds born are below their terminal speed —
 *     exactly the case rule 1227 corrects: the deposit above 84 km moves down
 *     (the top bin, 89–90 km, is no longer reached; the bins from 64 to 84 km
 *     gain), the energy above 60 km is 5.30 % of the deposit under the sealed
 *     engine and 5.31 % under the corrected one, and the ledger's residuals
 *     move at 10⁻¹⁶. Nothing the gate judges moves: the flares, the peak (32.5
 *     km, 0.2955 kt/km), the envelope, the landed mass (50.2 kg), the largest
 *     piece and every verdict are identical. So rule 1227 (d)'s premise («no
 *     cloud of those runs is born below its terminal speed») does not hold
 *     for Tagish Lake, and gate 2 stands on the measurement, not on the
 *     premise.
 * (c) AN ORDER BROKEN, AND MENDED. At 03:01 the re-reading of round 1's map
 *     above 10 m was started — its script written before any rule for it,
 *     and before the steps rule 1228 (f) puts first. It was stopped at 03:06,
 *     before any shard had finished: no result of it was produced or read.
 *     It is written as its own rule after this one's outcome, and run then.
 *
 * The steps (development only, rule 1143; no adoption, no class B, no
 * tuning; the priors, `settleWithin` and every constant as sealed):
 *
 * (d) THE ENGINE AS A SWITCH, NOT A COPY. Every committed script this rule
 *     re-runs takes `--engine settle`, which puts `fcmEntrySettle` where the
 *     script calls `fcmEntry` and changes nothing else, and writes its
 *     outputs beside the sealed ones with the suffix `.settle` (`_SETTLE` in
 *     `docs/`). Without the switch each script is the one committed, its
 *     outputs untouched. Gate 2's two scripts are re-run through it, and
 *     their outputs must equal the copies' of (b) and of rule 1228 (d).
 *     The switch lives in `scripts/porta1Engine.ts`. A first version put it
 *     in `scripts/fcmRound1Common.ts` — one of the four files of the sealed
 *     candidate (rule 1162), whose SHA-256 test would have refused it. Found
 *     at 03:16, before any commit and before any run had ended: the file was
 *     restored to its sealed bytes (169b47a2…), the switch moved, and every
 *     run started on the first version stopped and started again, so that
 *     every output of this rule comes from the committed scripts.
 * (e) THE FULL DEVELOPMENT RUN, in two parts.
 *     (1) Rule 1156's run (`scripts/fcm-dev-runs.ts all --engine settle`):
 *         every development case, every draw (200, or the one input), the
 *         four configurations and the sensitivities, on the sealed run's
 *         streams, margins and judgement. Reported beside `fcmDevRuns.json`:
 *         the tally of verdicts per configuration, every case and observable
 *         whose verdict changes, and the recorded-mass contradictions.
 *     (2) Rule 1227 (c)'s quantities on every draw
 *         (`scripts/porta1-settle-full.ts`, the sample's reading at every
 *         draw, sealed beside corrected): the draws identical to the bit;
 *         where they differ, the energy given to the air at stops, the
 *         settled share, the deposit's peak and its altitude; the corrected
 *         engine's ledger, worst over every completed draw; and rule 1190's
 *         pooled overview — the fates' shares, weighted as rule 1190 weighs
 *         them — from each engine's own ledger (landed solid: the ground mass
 *         less the swarm's; landed cloud: the swarm; settled; dust). The
 *         sealed column must give back rule 1190's figures from the audit
 *         engine (93.21 % settled, 3.253 % landed solid, 3.538 % landed
 *         cloud); where it does not, the difference is reported and nothing
 *         is adjusted.
 *     (3) Round 3's predictions (`scripts/fcm-round3-predict.ts --engine
 *         settle`), beside the sealed engine's of `fcmRound3Predictions.json`
 *         — identical or not, event by event and configuration by
 *         configuration — and NEVER against round 3's targets: rule 1167's
 *         verdict stays the sealed engine's, and a difference is reported as
 *         what rule 1228 (e)'s «every draw measured here is identical» must
 *         be read beside. Added at 03:16, before any result of this rule was
 *         read, because (b) shows the defect acting on a body inside round
 *         3's domain (W18's Tagish Lake is 4.5 m), which that sentence, true
 *         of the sample it names, does not cover.
 * (f) GATE 1'S CONVERGENCE ON THE BODIES IT CHANGES (rule 1141 (c)).
 *     (1) Its own run (`scripts/fcm-gate1-convergence.ts --engine settle`):
 *         the 48 seeded draws over the branch's domain, the reference and
 *         every variation, compared row by row with
 *         `fcmGate1Convergence.json`; for every draw that changes, each
 *         variation's pass or fail under the same tolerances.
 *     (2) Every development draw that (e)(2) finds changed, under rule 1149
 *         (b)'s variations (the step halved and doubled, bins of 100 m),
 *         each quantity against the corrected reference by rule 1141 (c)'s
 *         tolerances (`failing` of `fcmRound1Common.ts`).
 * (g) WHAT WOULD COUNT AGAINST THE CORRECTION, fixed now: the corrected
 *     engine's ledger beyond 10⁻¹² on any completed draw; a draw it changes
 *     failing a tolerance under a variation that the sealed engine passed
 *     on the same draw; a judgement of gate 2 changed. Any of these is
 *     reported as a defect of the correction and not tuned away. A change of
 *     rule 1156's development verdicts, either way, is reported and never
 *     counted for or against it: development is not a test (rule 1143).
 * (h) NOT HERE: the branch above 10 m (its own rule, after this one's
 *     outcome), any adoption, and items (a) and (c) of rule 1224, which wait
 *     for their sources (rule 1225).
 */
export const RULE_1229_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1230. RULE 1229'S OUTCOME, as measured on 26 September 2026 (the runs
 * from 03:17 to 03:40, every one from the committed scripts after the switch
 * was moved).
 *
 * (a) GATE 2 THROUGH THE SWITCH (rule 1229 (d)): R17's four Chelyabinsk
 *     settings — results identical to the copy's run and to the sealed
 *     engine's (`fcmGate2.settle.json`); W18's three events — results
 *     identical to the copy's run of rule 1229 (b)
 *     (`fcmGate2W18.settle.json`): Tagish Lake's upper deposit moves, and
 *     none of the gate's judgements.
 * (b) EVERY DEVELOPMENT DRAW (rule 1229 (e)(2), `porta1SettleFull.json`,
 *     `docs/PORTA1_SETTLE_FULL.md`): 12 012 draws flown; 12 008 identical to
 *     the bit under the two engines; the four others are Tunguska's one
 *     input in each configuration — three changed, and M2/capped completes
 *     under neither engine (10⁶ components). Every other case, every draw,
 *     every configuration: identical. The corrected engine's ledger, worst
 *     over every completed draw: 6.7·10⁻¹⁶ (rule 1141 (a): 10⁻¹²).
 *     Rule 1190's pooled overview, from the plain engines' ledgers: the
 *     sealed column gives back the audit engine's figures to their printed
 *     digits (landed solid 3.253 %, landed cloud 3.538 %, settled 93.21 %,
 *     dust 4.588·10⁻⁷ %), which cross-checks the two instruments. The
 *     corrected column: landed solid 3.444 %, landed cloud 46.65 %, settled
 *     49.91 %, dust 4.588·10⁻⁷ %.
 * (c) WHAT THE POOLED FIGURE WAS. Tunguska's one input, flown once per
 *     configuration, weighs 3.4·10⁸ kg, against 2.0·10⁷ kg for the heaviest
 *     other case summed over its 200 draws (Tagish Lake): its three
 *     completing configurations carry 83 % of the pool's weight. Of the mass
 *     each run still accounts for at its end, Tunguska's settled share goes
 *     from 99.72 to 30.05 % (M1/unlimited), 88.85 to 2.51 % (M1/capped) and
 *     99.59 to 98.99 % (M2/unlimited) — in M2/unlimited the clouds, flown
 *     down, slow from above to their terminal speed and settle where rule
 *     1138 (c) meant them to, while the energy the sealed engine gave to the
 *     air at their birth, 54.04 % of the entry's, falls to 2·10⁻⁶. So the
 *     audit's 93.21 % (A1) was, for 83 % of its weight, the defect of rule
 *     1227. In the seventeen other cases nothing changes: their clouds do
 *     come down from above to their terminal speed and are stopped there as
 *     before — from 15 % (Winchcombe, M2/capped) to 99.65 % (Chelyabinsk,
 *     M1/unlimited) of what is accounted, the rest landed solid — and their
 *     later fate stays NOT IDENTIFIABLE from the sources read (rule 1227):
 *     particulate debris, never meteorite mass. The correction removes an
 *     artefact; it does not answer the fate.
 * (d) ROUND 3 (rule 1229 (e)(3)): its predictions under the corrected engine
 *     are identical to the bit to the sealed engine's — every event, every
 *     configuration, both atmospheres, 200 draws each. Rule 1167's verdict
 *     stands on the measurement.
 * (e) GATE 1 (rule 1229 (f)). Its own run (48 seeded draws over the
 *     branch's domain): 13 draws change, and every one of them still passes
 *     every variation and every quantity — 47 of 47 compared pass, as under
 *     the sealed engine; the worst relative movement rises to 7.65·10⁻⁴
 *     (step 20 m, the energy at the ground), against 2·10⁻². Twelve of the
 *     thirteen are structured bodies (M2), whose first stage releases its
 *     debris at 40 to 120 kPa, high; three are at or near round 3's domain:
 *     3.6 m (peak unchanged to five digits), 4.6 m (13.7 km/s, 15.6°: the
 *     deposit's peak from 54.4 km and 1.58 kt/km to 31.0 km and 0.26 kt/km)
 *     and 10.0 m (61.5 to 38.5 km). The largest reach the ground with more
 *     energy (281 m, M2/capped: 0.8 % to 7.6 % of the entry's). Tunguska's
 *     three changed draws under round 1's variations: every quantity passes
 *     under both engines; nothing broken (`porta1SettleConvergence.json`).
 * (f) RULE 1229 (g)'s CRITERIA: none met. No ledger beyond 10⁻¹²; no
 *     tolerance the correction breaks; no judgement of gate 2 changed.
 * (g) RULE 1156's DEVELOPMENT RUN (rule 1229 (e)(1),
 *     `fcmDevRuns.settle.json`, `docs/FCM_DEV_RUNS_SETTLE.md`): the tally of
 *     verdicts is identical in every configuration, and no recorded-mass
 *     contradiction comes or goes. What moves carries no verdict. Tunguska's
 *     deposit: the median peak's altitude from 40.4, 34.9 and 37.9 km to
 *     18.1, 13.7 and 20.7 km (M1/unlimited, M1/capped, M2/unlimited), its
 *     value from 6 379, 7 713 and 4 924 kt/km to 911, 953 and 1 105, and the
 *     largest single 10 m bin over the kilometre window's peak from 99.9 —
 *     the whole kilometre's energy in one bin, the dump — to 1.004; the
 *     development table gives Tunguska no observed interval to judge it by
 *     (not assessable, before and after). Five of Tunguska's sensitivities
 *     and one of Chelyabinsk's (strength scaled with size: 58.3 to 34.8 km)
 *     move too; their verdicts stay not assessable.
 * (h) WHAT IT MEANS. The defect acts where a cloud is born high and slow for
 *     its air. Among gate 1's draws: every structured body above 10 m (10 of
 *     10), 2 of the 14 structured bodies below it, and 1 of the 24 monoliths
 *     (232 m); among the development cases, Tunguska alone, in both
 *     structures. So it reaches inside round 3's domain — gate 1's 4.6 m
 *     structured draw — although no development draw there meets it. Rule
 *     1228 (e)'s sentence («its domain is 0.1 to 10 m, where every draw
 *     measured here is identical») is true of the sample it names and of
 *     every development draw, but not of the domain: round 3's verdict stands
 *     because its own predictions are identical, measured in (d), not because
 *     the defect cannot act there.
 *     No adoption, no class B: the sealed candidate stays the one round 3
 *     judged; any later run of the branch uses the corrected version.
 * (i) NEXT, in rule 1228 (f)'s order: the branch above 10 m — round 1's map
 *     re-read, under its own rule — and items (a) and (c) of rule 1224 when
 *     their sources are in `~/Desktop/Nimbus-fonti/`.
 */
export const RULE_1230_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1231. THE BRANCH ABOVE 10 M — ROUND 1'S MAP RE-READ (rule 1228 (f)'s
 * last step), written after rule 1230's outcome and before any run of it.
 *
 * (a) WHAT IS FLOWN. Every point of round 1's map of the perimeter (rule
 *     1149 (a): the sixteen corners, the centre, 240 Halton points in bases
 *     2, 3, 5 and 7) whose diameter is 10 m or more — 109 points, four
 *     configurations, 436 runs — on the map's own inputs and its own draws of
 *     the priors (the streams `fcm-round1/map/<point>/<structure>/<cloud>`),
 *     at the reference alone (rule 1149 (b): steps and bins of 10 m, a floor
 *     of 1 g, a bound of 10⁵ components retried at 10⁶), by the sealed engine
 *     and by the corrected one (`scripts/porta1-map-above-10m.ts`). The
 *     points are shared among the processes by round 1's recorded cost, which
 *     moves the wall time and nothing else.
 * (b) WHAT IS REPORTED (`porta1MapAbove10m.json`,
 *     `docs/PORTA1_MAP_ABOVE_10M.md`): the runs completed under both engines
 *     and those identical to the bit; the runs whose flight gives more than
 *     1 % of the entry's energy to the air at stops, under each engine; by
 *     diameter (10–30, 30–100, 100–300 m) the medians of that energy and of
 *     the deposit's peak altitude, sealed → corrected; the corrected
 *     engine's ledger, worst over every completed run.
 * (c) WHAT IT IS NOT. Not the perimeter's statuses again: no step or bin is
 *     varied — the convergence of the bodies the correction changes was rule
 *     1229 (f)'s, and it held (rule 1230 (e)). Not an observation: the map's
 *     bodies are synthetic; no development case or target is read. No
 *     adoption, no class B, nothing tuned.
 */
export const RULE_1231_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1232. ITEM (b), ITS SECOND PART — WHAT A SOURCE INDEPENDENT OF THIS
 * PROJECT'S CASES SAYS OF A DEBRIS CLOUD'S LATE FATE (rule 1224 (b)),
 * declared before any search (26 September 2026, 03:45), while the map of
 * rule 1231 runs.
 *
 * (a) WHAT COUNTS. A source that measures or models what becomes of the
 *     debris of a meteoroid's breakup once it has slowed — vapour, dust,
 *     pieces; in what shares, of what sizes, on what time scales — and is
 *     independent of this project's cases: about no event of rule 1143's
 *     development list, of round 3, of level B's sets or of the fifth set's
 *     candidates; a model counts only where its constants were not fitted
 *     on those events. Open copies only (NTRS, arXiv, an open journal, an
 *     author's repository), fetched directly and their SHA-256 recorded; a
 *     source behind a paywall or a challenge is asked of Andrea (rule 1225),
 *     never fetched around. Any altitude it gives for an event outside the
 *     development list is read only through a mask.
 * (b) HOW IT IS FOUND. A search of NTRS, arXiv and the open literature for
 *     the fate of meteoroid debris and dust after atmospheric breakup; every
 *     candidate named, with why it is kept or left, before any is read in
 *     full.
 * (c) WHAT IS WRITTEN. For each source read, a fact sheet in rule 1192's
 *     form (the form it constrains, its domain, what it leaves free, the
 *     observable that would discriminate, what would refute it); then item
 *     (b)'s verdict: IDENTIFIABLE only where a source constrains the settled
 *     mass's fate without new constants chosen on the development cases,
 *     otherwise NOT IDENTIFIABLE, which rule 1191 prefers to a guess. No
 *     code (rule 1224 (d)).
 */
export const RULE_1232_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1233. ITEM (b), THE READING DONE AS FAR AS OPEN COPIES GO — rule
 * 1232's search, its sources and the verdict (26 September 2026, 03:48).
 *
 * (a) THE CANDIDATES. Kept and read: Della Corte, Rietmeijer, Rotundi,
 *     Ferrari & Palumbo (2013), Tellus B 65, 20174 (open, sha-256
 *     bf05d4cb…); Schulz & Glassmeier (2020), arXiv:2008.13032v1, published
 *     as doi:10.1016/j.asr.2020.10.036 (open, sha-256 c22d5151…). Both read
 *     whole, every altitude masked. Asked of Andrea, behind a paywall:
 *     Klekociuk et al. (2005), Nature 436, 1132 — the one primary
 *     measurement of a large meteoroid's dust cloud outside this project's
 *     cases — and Rietmeijer et al. (2016), Icarus, on the debris collected
 *     from settling bolide dust clouds. Left, as about this project's cases:
 *     Popova et al. (2013) and Gorkavyi et al. (2013) (Chelyabinsk),
 *     Borovička & Charvát (2009) (2008 TC3), Borovička et al. (2019)
 *     (Maribo, in the fourth set's register).
 * (b) FACT SHEET, DELLA CORTE ET AL. (2013). Constrains no share: a
 *     balloon collector flying through the debris cloud of an unidentified
 *     carbonaceous bolide (Arctic, June 2008) caught intact and thermally
 *     eroded micrometre grains, melt and vapour condensates (CaO and carbon
 *     nanoparticles) — the settled debris of a bolide is dust aloft, of
 *     micrometre and nanometre sizes, and the authors call its residence
 *     time unknown. Domain: one event, one collection. Free: every share
 *     and size. Discriminating observable: in-situ collection after a known
 *     bolide. Refuted by: no such products where a known bolide's cloud was
 *     sampled.
 * (c) FACT SHEET, SCHULZ & GLASSMEIER (2020). A budget study, not an entry
 *     model. It cites three dust clouds against their entry mass —
 *     Chelyabinsk about 24 %, the Antarctic bolide of 3 September 2004
 *     about 79 % (at least 47 %, from Klekociuk et al.), 2008 TC3 about 20 %
 *     (at least 15 %) — and ASSUMES an aerosol share rising linearly with
 *     the logarithm of the mass, to 50 % at 10⁷ kg; the dust sediments
 *     within several months (citing Klekociuk et al. and Gorkavyi et al.).
 *     Domain: 10⁻² to 10⁸ kg, a yearly budget. Free: the linear form, by
 *     the authors' own word an assumption, fit on three events of which two
 *     are this project's development cases. Discriminating observable: a
 *     dust cloud's mass after a bolide, against its entry mass. Refuted by:
 *     large bolides whose dust clouds carry little of their mass.
 * (d) THE VERDICT ON ITEM (b), as far as these sources go. The KIND of fate
 *     is constrained without any new constant: what a large bolide neither
 *     vaporises nor lands stays aloft as micrometre and smaller dust, which
 *     sediments over months — never ground mass, never meteorite mass, and
 *     depositing no energy of consequence once slowed, which is what the
 *     branch's settle stop already does with it. The SHARE is NOT
 *     IDENTIFIABLE from them: no form independent of the development cases
 *     fixes it, and the one independent measurement (47 to 79 %, the 2004
 *     bolide) is read here only through a review; its primary waits for
 *     Andrea's download, and the verdict on the share is written again
 *     when it is read. Nothing is coded, fitted or adopted: the dust
 *     fraction of a known bolide is an observable the branch could be held
 *     to later, never a constant to tune it on.
 */
export const RULE_1233_WRITTEN = '2026-09-26' as const;
