/**
 * Rules 838 to 845 — a scattered body digs a crater field, as the reference
 * implementation does. For impacts, 23 September 2026, B-123, by Andrea's
 * order of that morning («se è una cosa che serve a raggiungere l'obiettivo
 * facciamolo»); written and pushed before the candidate is written, before any
 * sweep is run on it and before any preset is read under it.
 *
 * RULE 838. WHAT THIS ROUND IS. A law, `craterField`: `single` (what the model
 * does today) or `field`, and `DEFAULT_CRATER_FIELD` goes from `single` to
 * `field` if rule 842 holds. Under `field`, a body that breaks up and still
 * reaches the ground as a swarm (the partial airburst), on land, and that is
 * not an iron whose fragments' crater rules 764 to 771 decide, is a crater
 * field wherever the swarm's lateral spread at the ground — L(0), Collins,
 * Melosh & Marcus (2005) Eq. 15* at z = 0 with Eq. 16*'s dispersion length —
 * is at least the transient crater D_tc the whole swarm would dig at its speed
 * at the ground (Eq. 21*). The crater reported and drawn is then the largest
 * fragment's, D_tc / 2, and everything computed from a transient crater — the
 * final diameter, the depth, the morphology, the rim, the ejecta blanket — is
 * computed from it, as from any other. The crater's origin reads `craterField`.
 * The energy, the blast, the heat, the seismic magnitude and the toll's blast
 * plan do not change: the consequences are those of the swarm's whole kinetic
 * energy, as the paper computes them. And the harness's regime (rule 623)
 * gains the field — entry regime, morphology, and `field` where the crater is
 * one — so that a crater that becomes a field is read as a regime switch, as
 * the reference program's own answer switches there; nothing else of the
 * regime changes, and no existing switch is added to it.
 *
 * RULE 839. WHY: B-123, found by level A (c67f86f). On the wide grid, 14
 * impacts — bodies of 100 to 300 m, 1 000 to 3 000 kg/m³, 12 to 40 km/s —
 * gave 98 readings past the audit bar: a transient and a final crater, a depth
 * twice the program's, and an ejecta blanket 2^(4/3) wider. Level A documents
 * every one (`crater-field` in levelA.ts); this round is the repair.
 *
 * RULE 840. THE SOURCE, and whose each part is. The criterion is the paper's
 * (p. 821): «The dispersion of the swarm at impact is compared to the
 * estimated transient crater size and, if it is comparable or larger, then
 * the formation of a crater field is reported, similar to that actually
 * observed at Henbury, Australia.» The largest fragment's crater is the
 * program's as its authors run it today, whose page says «The result of the
 * impact is a crater field, not a single crater. The following dimensions are
 * for the crater produced by the largest fragment.» — where the paper of 2005
 * said its program could not give one: the rule follows the program, and the
 * report will say so. «Comparable» is read as L(0) ≥ D_tc, because the
 * program's answers on the wide grid separate there: the 14 fields have
 * L(0) / D_tc ≥ 1.013 and the 887 single craters with a dispersion printed
 * ≤ 0.993, with L(0) the minor axis of the ellipse the program prints — its
 * major axis is L(0) / sin θ, and impacts at 15° with a major axis up to 3.3
 * D_tc stay single. The factor one half is the program's: against the
 * unrounded radii its map carries, the model's whole-swarm transient crater
 * is 1.9995 to 1.9996 times the program's on all 14. The threshold of one and
 * the ≥ are this project's reading of «comparable», fixed here.
 *
 * RULE 841. WHAT WAS LOOKED AT BEFORE THESE RULES. The wide grid of level A,
 * all of it (read for c67f86f and b8c2df8); one page of the program, for a
 * 100 m body of 1 500 kg/m³ at 12 km/s and 60°, which printed the sentence
 * above; the paper (downloaded with Andrea's leave the same morning); and the
 * analysis of rule 840, from the grid. No sweep has been run with the
 * candidate, no preset has been read under it, and the candidate does not
 * exist. This is a round of verification against the reference
 * implementation: it spends no held-out observation.
 *
 * RULE 842. WHAT DECIDES. Every clause, or the default stays `single`.
 *   (a) Level A: every reading the difference `crater-field` covers comes
 *       within 2 % of the program, or inside the interval its printed figure
 *       stands for; the difference is removed; and no other reading of level
 *       A moves by more than one part in 10¹² — only the impacts that become
 *       fields move.
 *   (b) The presets: none is expected to move. Any that does must be a crater
 *       field by rule 838's own test, and is listed in the outcome with its
 *       crater before and after.
 *   (c) G5, with rule 838's regime: on the benchmark's own draw (5 000
 *       impacts, the seed of 15 September) it reads 0 under `field`; and on a
 *       seed no run has used, `benchmark-2026-09-23-heldout-crater-field`, it
 *       reads no more under `field` than under `single`, and none of what it
 *       reads under `field` is a crater, a rim or an ejecta ring at a switch
 *       into a field.
 *   (d) The seal moves only in scenarios whose crater becomes a field, and in
 *       those rule 830's key numbers move only in the crater's; it is re-taken
 *       under rule 833 with the list of what moved.
 *   (e) Typecheck, lint, format, the whole suite, the strict gate PASS with the
 *       validation report regenerated once, and Chromium's end-to-end suite.
 *
 * RULE 843. WHAT IT COSTS, DECLARED. A crater that halves where the swarm's
 * spread crosses the crater it would dig: a jump in the crater, its rim and
 * its ejecta, which is the reference's own and which G5 reads as the switch it
 * is. At sea nothing changes: the wide grid holds no water target, so the
 * program's answer there was never read, and the rule does not reach it.
 *
 * RULE 844. WHAT MAY NOT HAPPEN. No constant of the model is introduced or
 * touched but the two this rule fixes from the reference — the threshold of
 * one and the factor of one half — and neither is tuned on the sweep or on a
 * preset. The irons' rules (764 to 771), the low burst's (756 to 763) and the
 * entry are not touched. No test is weakened to let the candidate through.
 *
 * RULE 845. WHAT AN ADOPTION DOES. `DEFAULT_CRATER_FIELD` becomes `field`;
 * B-123 is closed; level A's `crater-field` difference is removed; the
 * crater's card in the evidence table loses its exception; the panel and the
 * report say what a crater field is; the seal is re-taken; the ROADMAP, the
 * CHANGELOG and the bug registry record it. A refusal records why, and the
 * default stays `single` with B-123 open.
 */

/** The seed no run has used, for rule 842(c). */
export const CRATER_FIELD_HELD_OUT_SEED = 'benchmark-2026-09-23-heldout-crater-field';

/** Rule 840: the threshold on L(0) / D_tc, and the largest fragment's share of
 *  the whole swarm's transient crater, both the reference's. */
export const CRATER_FIELD_THRESHOLD = 1;
export const CRATER_FIELD_LARGEST_FRAGMENT = 0.5;

/** The outcome, written after the candidate was measured. */
export const CRATER_FIELD_OUTCOME = 'PENDING: the rules are written; the candidate is not.';
