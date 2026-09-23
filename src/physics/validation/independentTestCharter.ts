/**
 * Rules 1038 to 1047 — the charter of the independent test that may one day
 * judge S, F or S + F. Written on 24 September 2026, night, on the reviewer's
 * order after the study of S («Prima blocca il protocollo del test
 * indipendente; poi specifica ed esegui F come studio di sviluppo») and
 * Andrea's («Report, passi 4–7, carta, F»). The test is not run now; the third
 * set is not reopened; no source of its events is read. What is fixed here is
 * how the evaluation will happen, before F is seen. A readable version:
 * docs/INDEPENDENT_TEST_CHARTER.md.
 *
 * RULE 1038. WHAT THIS IS. S was run as a study of development (rules 1014,
 * 1023): one metric could be evaluated, and its dominant error — a surviving
 * core from six to over twenty thousand times heavier than the meteorites
 * recovered — says the closure «broken within 5 MPa, the rest intact» does not
 * describe the cascade. F, the fragments that slow by their size, is motivated
 * by that error and will be a study too. Whether S, F or S + F is ever adopted
 * is decided by the test this charter fixes, and by nothing else.
 *
 * RULE 1039. THE MODELS JUDGED. Each model is frozen at a commit, named before
 * its predictions: the baseline — the product's branch at the commit that
 * freezes the last candidate; S as its study ran it (0c59e87), at f1 = 0.50,
 * the median of rule 1001 (0.25 and 0.60 published beside, as sensitivity,
 * never chosen after); F and S + F as their studies will freeze them, one
 * specification each. A model changed after its freezing is a new model,
 * frozen and judged anew. The baseline is judged beside every model, on the
 * same draws of the same inputs (rule 934's, with rule 934(c)'s stress runs
 * reported and never scored).
 *
 * RULE 1040. THE SET is the third set as rules 941 to 944 froze it: the entry
 * bodies Winchcombe, Golden, Madura Cave, Hamburg, Traspena and Cavezzo,
 * admitted or dropped by rule 934 when their sources are pinned; Arpu Kuilpu
 * and Kindberg on the conditions of rule 941(b). No event is added (rule 944).
 * An event read for the development of S, F or S + F leaves the set for good
 * and is written down with its reason (rule 937). The sources are pinned —
 * page, table, value, uncertainty, with rule 866's conversions — only after the
 * last model to be judged is frozen. An observable a source gives only through
 * a model fitted to the event — a fragmentation height from an assumed
 * strength, a mass from a fitted entry model — does not count for that event
 * (rules 904, 921, 934(a)); the event stays for the others.
 *
 * RULE 1041. COMPOSITION. The priors of the two-stage strength and of S
 * describe ordinary chondrites (rule 1013). A body whose source gives a type
 * outside them — Winchcombe, a CM2 — is run under the same model with the same
 * priors and read as a control of robustness out of the priors' domain, as
 * rule 1023(a) read 2024 BX1: published, counted in no decision, neither a
 * success nor a failure. Its observables count only for a model that declares
 * priors for its type before its freezing. A body of unknown type, or of a type
 * its source gives as uncertain, is read as "sensitivity with the ordinary
 * chondrites' priors" and counts in no decision either.
 *
 * RULE 1042. THE PRIMARY OBSERVABLES, kept apart, never folded into one score:
 *   O1 — the flares' altitude: E3, the compatibility of the model's release
 *        with the measured flare heights, read on the draws that satisfy the
 *        outcome (rules 928 to 930, the heights widened by 5 km, rule 868);
 *   O2 — the mass of the largest recovered meteorite, against the model's
 *        largest piece at the ground (the whole body, S's core, F's largest
 *        fragment) over the draws; where the source does not declare the
 *        search complete, the recovered mass is a lower bound of the largest
 *        that fell;
 *   O3 — the distribution of the recovered masses, where the source gives at
 *        least ten meteorites with their masses and a documented search: the
 *        model's number of pieces heavier than each of the recovered quartiles;
 *   O4 — the speed at the end of the luminous flight, where the source
 *        measures it with its uncertainty, against the speed of the model's
 *        largest piece at the observed end height;
 *   O5 — the regime at the ground, rule 1011's three observables: survival
 *        (at least one piece reaches the ground), the regime of arrival (at
 *        the crater law's speeds, in dark flight, or between them, out of the
 *        crater's domain) and the observable crater (computed, none, out of
 *        the domain) — each read against a fall: meteorites recovered, reached
 *        in dark flight, no crater. "Out of the domain" never reads as "no
 *        crater" (rule 940).
 *
 * RULE 1043. WHAT DECIDES AND WHAT IS DIAGNOSTIC. Decisive, on the bodies in
 * the priors' domain: O1 where flares were measured; O2 where a largest
 * recovered mass is given; O5's survival and regime of arrival on every body.
 * Diagnostic: O3, unless its conditions hold on at least three bodies; O4,
 * unless measured on at least three; O5's observable crater (a fall has none,
 * and it decides only where a model predicts one — a worsening); every result
 * out of the priors' domain (rule 1041) and every stress run. A decisive
 * observable needs at least three bodies in the priors' domain; with fewer it
 * is reported body by body and decides nothing.
 *
 * RULE 1044. THE THRESHOLDS, fixed before any prediction.
 *   O1: a body is compatible where E3 holds. A model improves O1 where it is
 *       compatible on at least one more body than the baseline, and loses
 *       none the baseline held.
 *   O2: a body is compatible where the largest recovered mass lies inside the
 *       model's 5–95 % band of its largest piece, widened by a factor of three
 *       each way (the recovered is a lower bound, the band is the model's).
 *       Its error is |log10(model's median / recovered)|. A model improves O2
 *       where the median of that error over the bodies falls by at least
 *       log10 2 — a factor of two — and it is compatible on at least as many
 *       bodies as the baseline.
 *   O5: on each body the share of draws that give the observed survival and
 *       the observed regime; a model improves O5 where the mean share rises by
 *       at least 0.10 (rule 975's gain) and no body falls below 0.90 where the
 *       baseline was at or above it (rule 964 (b)'s right outcome).
 *   A band more than 1.5 times the baseline's voids the body's improvement
 *   (rule 976). A model WORSENS where it loses, on any decisive observable, a
 *   body the baseline held, or its O5 share falls by more than 0.10 on any
 *   body. A model is ADOPTABLE only where it improves at least two decisive
 *   observables (rule 964's two) and worsens none; one improvement is
 *   published and adopts nothing. A class B is another question, under rule
 *   939 — three admitted entry bodies and one admitted ground case — which
 *   this set cannot yet meet (rule 941(c)).
 *
 * RULE 1045. WHAT MAY NOT HAPPEN. No law of F, no size of its fragments, no
 * upper edge of the strengths, no f1, no closure is chosen, tuned or checked
 * against the set; its sources stay closed until the last model is frozen;
 * the test runs once for each frozen model, and its outcome is published as it
 * comes, in the words fixed before the run. No threshold of rule 1044 moves
 * after this commit, save by a rule written and pushed before any prediction.
 *
 * RULE 1046. WHAT WAS SEEN, declared: rule 943's quoted values from the search
 * results — the pressures of Winchcombe, Golden, Hamburg and Traspena, the
 * speeds and angles of Golden, Madura Cave, Hamburg, Traspena and Cavezzo, the
 * mass of Golden and Traspena, the altitudes of Madura Cave, Hamburg and
 * Cavezzo. Nothing else. None of them is used to write F.
 *
 * RULE 1047. THE ORDER. This charter, pushed. Then F's specification, before
 * its code, and F run as a study of development, with S's discipline:
 * budgets, convergence, the three observables of rule 1011 non-decisional, no
 * automatic promotion — its fragments slowed and spread by their physical
 * size, never by the numerical shares. Then S + F, if the studies call for it.
 * Then the models frozen, the sources pinned, the predictions made, the test
 * run once. The test is not run in this round.
 */

/** Rule 1043: the role an observable plays in the decision. */
export type CharterRole = 'decisive' | 'diagnostic';

/** Rule 1042: the primary observables. */
export type CharterObservable = 'O1' | 'O2' | 'O3' | 'O4' | 'O5';

/** Rule 1043: each observable's role as the charter fixes it — O3 and O4
 *  diagnostic unless their conditions hold on enough bodies. */
export const CHARTER_ROLES: Readonly<Record<CharterObservable, CharterRole>> = {
  O1: 'decisive',
  O2: 'decisive',
  O3: 'diagnostic',
  O4: 'diagnostic',
  O5: 'decisive',
};

/** Rules 1039, 1043 and 1044: the charter's numbers, fixed before any
 *  prediction. */
export const CHARTER = {
  /** Rule 1039: S's f1 for the test, the median of rule 1001. */
  sFirstPhaseLoss: 0.5,
  /** Rule 1043: bodies in the priors' domain a decisive observable needs. */
  minBodies: 3,
  /** Rule 1042 (O3): recovered meteorites, with a documented search. */
  minRecoveredStones: 10,
  /** Rule 1044 (O2): the model's band widened this factor each way. */
  massBandWidening: 3,
  /** Rule 1044 (O2): the fall of the median error, in log10 (a factor of 2). */
  massImprovementDex: Math.log10(2),
  /** Rule 1044 (O5), as rule 975. */
  outcomeGain: 0.1,
  /** Rule 1044 (O5), as rule 964 (b). */
  rightOutcomeShare: 0.9,
  /** Rule 1044, as rule 976. */
  bandWidening: 1.5,
  /** Rule 1044, as rule 964. */
  minObservablesImproved: 2,
  /** Rule 1044: a fall of the O5 share on any body that worsens a model. */
  outcomeWorsening: 0.1,
} as const;

/** Rule 1041: how a body of the set is read by its type. */
export type CharterReading = 'counted' | 'robustnessControl' | 'sensitivity';

/** Rule 1041: the reading of a type named by a body's source. */
export function charterReading(
  type: 'ordinaryChondrite' | 'other' | 'unknown',
  priorsForType = false
): CharterReading {
  if (type === 'ordinaryChondrite') return 'counted';
  if (type === 'other') return priorsForType ? 'counted' : 'robustnessControl';
  return 'sensitivity';
}
