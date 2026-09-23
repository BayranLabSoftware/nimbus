/**
 * Rules 846 to 853 — a scattered body's crater field, asked again: joined, and
 * read alike on both sides of the switch where a burst reaches the ground.
 * For impacts, 23 September 2026, B-123, after rules 838 to 845 were refused
 * that morning; by Andrea's choice of «transizione monotona». Written and
 * pushed before the candidate is changed, before any sweep is run on it and
 * before level A is read under it.
 *
 * RULE 846. WHAT THIS ROUND IS. The law `craterField` gains a value, `joined`,
 * and `DEFAULT_CRATER_FIELD` goes from `single` to `joined` if rule 850 holds.
 * Under `joined`, with s the swarm's spread over the transient crater its mass
 * would dig whole:
 *   (i) the crater keeps the share min(1, max(1/2, 1/s)) of that crater — the
 *       whole crater up to s = 1, the program's largest fragment's half from
 *       s = 2 on, and between them a crater that shrinks in proportion as the
 *       spread passes it, D_tc² / L. No step anywhere;
 *   (ii) the swarm that reaches the ground is tested as rules 838 to 845 test
 *       it — L(0), Eq. 15* at the ground — and a complete airburst that digs
 *       below its own fireball (rules 756 to 763) is tested the same way, its
 *       swarm's spread at its burst being the pancake's limit, f_p · L0, which
 *       is how Eq. 18 defines the burst: at a burst on the ground the two are
 *       one, so the crater rule 756 joins across that switch stays joined;
 *   (iii) on land only, irons untouched, as in rule 838;
 *   (iv) the harness's regime returns to rule 623's as written — the joined
 *       crater has no step, so no switch is asked for it, and rule 838's
 *       `|field` is withdrawn: the stricter reading;
 *   (v) `field`, the sharp law rules 838 to 845 refused, stays in the code by
 *       name, for the record, and is not the default.
 *
 * RULE 847. WHY. B-123, and the two causes the refusal of rules 838 to 845
 * named. The sharp halving parts a burst just above the ground from a swarm
 * just reaching it: on the seed of rule 842(c), a body of 522.6 m, 4 244
 * kg/m³, at 19.1 km/s and 5.1°, digs 2 494 m as a low burst at 1.001 of its
 * size and 1 250 m as a partial airburst at 1.002, where the swarm's spread is
 * already 1.83 times its crater on both sides. And a reading the model no
 * longer answered was counted nowhere — level A now counts it (74b0010).
 *
 * RULE 848. THE SOURCE, and whose each part is. The criterion is the paper's
 * and the half the program's, as rule 840 reads them. The join between s = 1
 * and s = 2 is this project's, with no published source: the whole swarm's
 * crater shrinking as the spread passes it, which meets the program's half at
 * twice the crater and never steps — a difference of design where the
 * program halves at once, declared as such in level A, as rules 764 to 771
 * join an iron's strewn field to its single crater by mass where Bland &
 * Artemieva (2006) give two ends and no middle. The pancake's limit f_p is the
 * model's own (PANCAKE_FACTOR, effects/atmosphericEntry.ts), not new.
 *
 * RULE 849. WHAT WAS LOOKED AT BEFORE THESE RULES. Everything rule 841 lists;
 * the refusal's own measurements under the sharp law (cfb44ff, the four
 * sweeps of benchmark/results/invariants-2026-09-23 to -3, level A under
 * `field`); the scenario of rule 847 traced across its switch at eleven sizes;
 * the one-sided readings of level A (74b0010). No sweep has been run with
 * `joined`, level A has not been read under it, and it does not exist.
 *
 * RULE 850. WHAT DECIDES. Every clause, or the default stays `single`.
 *   (a) Level A under `joined`: every reading the difference `crater-field`
 *       covers either comes within 2 % of the program or inside its printed
 *       interval, or is one of an impact whose s is below 2, where the join
 *       parts from the program's half by design — the model's crater then
 *       being D_tc² / L within one part in 10⁹, recomputed — or has become a
 *       one-sided reading a documented difference covers; no reading of level
 *       A moves by more than one part in 10¹² but those of impacts whose crater
 *       the join or the low burst's test changes; and none of level A's
 *       readings past 10 % or one-sided is left without its documented cause.
 *   (b) The presets: none is expected to move; any that does must be
 *       changed by rule 846's own test, and is listed.
 *   (c) G5 under `joined`, with rule 623's regime as written: on the
 *       benchmark's own draw it reads 0; on a seed no run has used,
 *       `benchmark-2026-09-23-heldout-crater-field-2`, it reads no more than
 *       under `single`, and no crater, rim or ejecta ring shrinks or jumps
 *       where a crater is joined; and on rule 842(c)'s seed, already read and
 *       declared so, no more than `single`'s 8.
 *   (d) The seal moves only in scenarios whose crater the join or the low
 *       burst's test changes; it is re-taken under rule 833 with the list.
 *   (e) Typecheck, lint, format, the whole suite, the strict gate PASS with the
 *       validation report regenerated once, and Chromium's end-to-end suite.
 *
 * RULE 851. WHAT IT COSTS, DECLARED. Where 1 < s < 2 the model's crater parts
 * from the program's by up to a factor of two — on the wide grid, most of the
 * 14 fields the program reports lie there — and level A says so reading by
 * reading. A low burst whose swarm spreads wider than its crater digs less
 * than it did. Nothing changes at sea or for an iron.
 *
 * RULE 852. WHAT MAY NOT HAPPEN. No constant is introduced but the ends of the
 * join, 1 and 2, which are the program's threshold and the program's half; no
 * constant is tuned on a sweep, a preset or level A; the irons' rules, the low
 * burst's share and the entry are not touched; no test is weakened.
 *
 * RULE 853. WHAT AN ADOPTION DOES. `DEFAULT_CRATER_FIELD` becomes `joined`;
 * B-123 is closed as a join documented against the program's step; level A's
 * `crater-field` difference gives way to the join's; the crater's card, the
 * panel and the report say what a crater field is and that it is joined; the
 * seal is re-taken; the ROADMAP, the CHANGELOG and the registry record it. A
 * refusal records why, and the default stays `single`.
 */

/** The seed no run has used, for rule 850(c). */
export const CRATER_FIELD_JOINED_HELD_OUT_SEED = 'benchmark-2026-09-23-heldout-crater-field-2';

/**
 * The outcome, written on 23 September 2026 after the candidate (ac9258e) was
 * measured once, on one commit. The rules were pushed in 5d70c4b first.
 *
 * ADOPTED. Rule 850 holds on every clause.
 *
 * (a) Level A under `joined`: of the 98 readings `crater-field` covered, 12
 *     agree with the program within 2 % or its printing (the fields with
 *     s ≥ 2), 83 are the join's own — the model's crater D_tc² / L within one
 *     part in 10⁹, where 1 < s < 2 — and 3 became one-sided readings that
 *     `program-ring-inside-its-crater` covers. The craters of 16 impacts
 *     change (14 fields, 2 low bursts) and no other reading of level A moves.
 *     Adopted, `crater-field` gives way to `crater-field-joined`, and no
 *     reading past 10 % or one-sided is left without its cause.
 * (b) No preset moves.
 * (c) G5 under `joined`, with rule 623's regime as written: 0 on the
 *     benchmark's own draw, identical line for line to `single`'s
 *     (benchmark/results/invariants-2026-09-23-4 against the morning's);
 *     on the new seed 4 under both laws, identical line for line (-6 against
 *     -5); on rule 842(c)'s seed 8, as `single`'s 8 (-7 against -3): the
 *     crater that shrank as its body grew under the sharp law is gone, and
 *     what differs is only the example values of rows G5 does not read.
 * (d) No scenario of the seal changes its numbers or its drawing; its report
 *     text moved in all 308, the evidence table's crater card losing its
 *     exception, and it was re-taken under rule 833.
 * (e) Typecheck, lint, format, the whole suite, the strict gate with the
 *     validation report regenerated once, and Chromium's end-to-end suite —
 *     run on the adoption's own commit, before it was pushed.
 *
 * B-123 is closed as a join documented against the program's step.
 */
export const CRATER_FIELD_JOINED_OUTCOME =
  "ADOPTED 23 September 2026: a scattered body's crater field, joined — whole up to a spread equal to its crater, the program's half from twice it, D_tc² / L between; level A's 98 crater-field readings agree, follow the join exactly, or are documented one-sided; G5 unchanged on three draws; no preset and no sealed number moves. B-123 closed.";
