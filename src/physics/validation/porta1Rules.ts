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
