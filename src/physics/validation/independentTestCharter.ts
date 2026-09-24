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

/**
 * Rules 1049 to 1055 — the charter amended, operationally, before F's
 * specification. The reviewer, 24 September 2026, approved the separation of
 * the observables and the freezing of the models before any prediction, and
 * asked that five points become rules that execute, not readings made after
 * the predictions are seen; Andrea's word: the corrections, then this
 * amendment, then the text. Each rule below is carried by a function of this
 * file, tested; two implementations cannot give two verdicts.
 *
 * RULE 1049. WHAT THIS IS. It amends rules 1042 to 1044 on five points: the
 * incomplete recovery of O2, O2's improvement, O5 as a composite, the width of
 * the bands, and the eligibility counted per observable. Nothing else of the
 * charter moves.
 *
 * RULE 1050. O2, THE RECOVERY (`o2Compatible`). When its source is pinned, each
 * body's largest recovered mass is classed: MEASURED where the source names it
 * the fall's main mass, or declares the search of its strewn field complete;
 * a LOWER BOUND otherwise. On a lower bound the body is incompatible where the
 * model's 95th percentile of its largest piece lies below the recovered mass,
 * and compatible otherwise; no error of accuracy is computed on it and it
 * earns no credit of accuracy. On a measured mass the body is compatible where
 * the recovered mass lies inside the model's 5–95 % band widened by a factor
 * of three each way — a tolerance of compatibility, nothing more — and its
 * error is |log10(model's median ÷ recovered)|.
 *
 * RULE 1051. O2, THE IMPROVEMENT (`o2Improves`), exactly. (a) Compatibility:
 * the model is compatible on at least one more eligible body — measured or
 * lower bound — than the baseline, and incompatible on none the baseline held.
 * (b) Accuracy: on the measured bodies only, at least three in the priors'
 * domain; E is the median over them of rule 1050's error; the model improves
 * where E(baseline) − E(model) ≥ log10 2 and it loses no compatible body.
 * Where E(baseline) < log10 2 — the baseline already within a factor of two —
 * no improvement of accuracy can be claimed, and only (a) can improve O2. O2
 * improves where (a) or (b) holds, and counts as one decisive observable.
 *
 * RULE 1052. O5, A COMPOSITE (`o5ComponentShare`, `o5Verdict`), never averaged
 * into one "right". Its components, each read on its own: C1 survival (at least
 * one piece reaches the ground); C2 the regime of arrival of the largest piece
 * (rule 1011: at the crater law's speeds, in dark flight, or between them); C3
 * the observable crater (computed, none, out of the domain). For each body,
 * when its source is pinned: C1 applies where meteorites were recovered or a
 * search is documented; C2 applies where C1's observed answer is yes; C3
 * applies to every fall. On each draw: C1 is right where the model's answer is
 * the observed one; C2 where the model's regime is the observed one (dark
 * flight, for every fall); C3 is right where the model's crater is none, wrong
 * where it is computed, and not assessable on a draw where it is out of the
 * domain — never counted right. A component's share on a body is its right
 * draws over its assessable draws; with fewer than half its draws assessable
 * it is not assessable on that body; a body with no applicable, assessable
 * component is not assessable for O5. C1 and C2 decide; C3 is diagnostic, save
 * that a model digging a computed crater in more than a tenth of a body's
 * draws worsens O5. O5 improves where the mean share of at least one deciding
 * component, over its eligible bodies, rises by 0.10 or more, and no deciding
 * component worsens — a body falling below 0.90 where the baseline was at or
 * above it, or a mean share falling by more than 0.10. O5 counts as one
 * decisive observable.
 *
 * RULE 1053. THE WIDTH OF THE BANDS (`bandVoids`; amends rule 1044's reading
 * of rule 976). The width is that of the 5–95 % band of the quantity the
 * observable compares: for O1 the release altitude in km, on the draws that
 * satisfy the outcome; for O2 the base-10 logarithm of the largest piece's
 * mass. O5 has no band. A band conditioned on an outcome is compared only where
 * both the model and the baseline keep at least 50 conditioned draws; with
 * fewer, the body's improvement on that observable is not counted and is
 * reported as not assessable. A baseline band narrower than 0.5 km (O1) or 0.05
 * dex (O2) is taken at that floor. A model's band wider than 1.5 times the
 * baseline's voids the body's improvement.
 *
 * RULE 1054. ELIGIBILITY, COUNTED FIRST (`charterVerdict`). Before any verdict
 * each observable's eligible bodies — in the priors' domain, with the
 * observable given directly by its source and applicable — are counted and
 * published by name, observable by observable. A decisive observable with fewer
 * than three is not assessable, and is never completed with bodies eligible
 * only for another: the observables' sets are never pooled, and three sets of
 * different cases are never presented as one comparison. The clause of two
 * improved decisive observables counts assessable observables only; with fewer
 * than two assessable, no model can be adopted, and the verdict says so.
 *
 * RULE 1055. WHAT STAYS. With the set as frozen — no admitted ground case — no
 * result can reach class B (rule 939), and no ground case is added after any
 * model's performance has been seen. f1 = 0.50 for S and Winchcombe as a
 * control stand. The third set stays closed: this amendment authorizes no
 * independent prediction and no adoption of S, F or S + F. With it pushed, F's
 * specification may be written, as a study of development (rule 1047).
 */

/**
 * Rules 1057 to 1062 — the charter amended a second time, on the reviewer's
 * reply of 24 September 2026, before it is frozen as a rule of judgement and
 * before F's specification; Andrea's word: this amendment, then F's
 * specification with no code, then the text. The third set stays closed.
 *
 * RULE 1057. WHAT THIS IS. The first amendment (rules 1049 to 1055) is kept
 * and corrected on four points: what makes a recovered mass measured, O2's
 * point prediction and comparison, O5's worsening by a crater and a component
 * not assessable, and the bands and eligibility — with an empty table of
 * eligibility published before the test.
 *
 * RULE 1058. O2, MEASURED ONLY FROM THE EVIDENCE OF THE RECOVERY (amends rule
 * 1050). That a source calls a stone «the main mass» does not show it is the
 * largest that fell. A largest recovered mass is MEASURED only where its
 * source documents the completeness of the search — the area searched against
 * the strewn field's modelled or observed extent, and the recovery of the
 * masses the dark flight places there — so that no larger piece is likely to
 * lie unfound; otherwise it is a LOWER BOUND, whatever it is called. The class
 * is fixed from that evidence when the source is pinned, before any
 * prediction. On a lower bound the verdicts are «incompatible» (the model's
 * 95th percentile below it) and «not incompatible» (otherwise) — never
 * «compatible», which is kept for a measured mass.
 *
 * RULE 1059. O2, THE ERROR AND THE COMPARISON (amends rule 1051). The point
 * prediction is the median, over the draws, of the mass of the largest piece
 * at the ground; a draw with no piece at the ground gives zero, and a median
 * of zero an infinite error. The error |log10(point ÷ recovered)| is computed
 * on measured masses only, and is the error whether or not the model's band
 * crosses the recovered mass — a band that crosses it earns compatibility, not
 * a smaller error. Baseline and model are compared on the same measured
 * bodies. The clause of rule 1051 (b) is read on the median over those bodies:
 * where the baseline's median error is below log10 2, no improvement of
 * accuracy can be claimed.
 *
 * RULE 1060. O5, THE CRATER AND A COMPONENT NOT ASSESSABLE (amends rule 1052).
 * The worsening by a crater applies only where the observation excludes a
 * crater — a fall — and on the draws where the model is in the domain in which
 * it can judge one: its share is the draws with a computed crater over the
 * draws with a computed crater or none; with fewer than half the draws in that
 * domain it is not assessable and worsens nothing. C1 and C2 keep rule 1052's
 * rules — a gain of 0.10 in a component's mean share to improve, no body the
 * baseline held at or above 0.90 falling below it, no mean share falling by
 * more than 0.10. O5's improvement can be claimed only where C1 and C2 are
 * each assessable on at least three bodies; a deciding component not
 * assessable forbids the claim of improvement, and does not forbid a
 * worsening from counting.
 *
 * RULE 1061. THE BANDS (amends rule 1053). Widths are compared on the same
 * bodies and, for a conditioned band, on the same draws — those that satisfy
 * the outcome under both the baseline and the model, paired by their index;
 * with fewer than 50 such draws the body's improvement is not counted. The
 * floors of 0.5 km and 0.05 dex stabilize the ratio and license nothing: a
 * model's band voids the body's improvement where it is wider than the larger
 * of 1.5 times the baseline's real width and the floor.
 *
 * RULE 1062. THE TABLE OF ELIGIBILITY, published empty before the test
 * (docs/INDEPENDENT_TEST_ELIGIBILITY.md, `ELIGIBILITY_COLUMNS`): a row for each
 * body of the set, columns for its type and domain, O1, O2 with its class
 * (measured or lower bound), C1, C2 and C3, each cell filled — eligible, not
 * eligible and why — only when the sources are pinned, before any prediction.
 */

/**
 * Rules 1075 to 1077 — the charter touched a third time, on the reviewer's
 * reply of 24 September 2026, before the judge is frozen. Andrea's word: this,
 * then F's specification completed, then the text.
 *
 * RULE 1075. O5'S CRATER, NOT TO BE DODGED (amends rule 1060). The share of
 * computed craters is read on all the paired draws — the same draws, by index,
 * for the baseline and the variant — never on those left in the crater's
 * domain alone: a variant cannot better it by moving draws out of the domain.
 * For each body the three shares — crater computed, no crater, out of the
 * domain — are published for both, on those draws. A variant worsens O5 on a
 * fall where its share of computed craters exceeds 0.10, or exceeds the
 * baseline's by more than 0.10. C3's right answers are the draws with no
 * crater over all the paired draws: a draw out of the domain is never right,
 * and a move there is never a success nor hides a worsening.
 *
 * RULE 1076. AN OBSERVABLE LOST TO A VARIANT. A decisive observable assessable
 * for the baseline stays in the verdict's count of assessable observables;
 * where it is not assessable for the variant, the variant earns no improvement
 * on it, and it counts against the clause of two.
 *
 * RULE 1077. O2'S INFINITIES AND SPARSE SURVIVORS (amends rule 1059). Two
 * infinite errors compare equal: no improvement of accuracy is claimed between
 * them, and the baseline's infinite median error against a variant's finite one
 * counts as an improvement only through rule 1051's other conditions. The
 * point prediction stays the median over all the draws: a body on which fewer
 * than half the draws put a piece on the ground has a median of zero, an
 * infinite error, and on a measured mass is incompatible; on a lower bound its
 * verdict is read on the 95th percentile as before. Its share of draws with a
 * survivor is published beside, and survival is judged by C1, apart. A lower
 * bound's «not incompatible» is never accuracy: only a measured mass's error
 * is.
 */

/** Rule 1062: the columns of the table of eligibility. */
export const ELIGIBILITY_COLUMNS = ['type', 'O1', 'O2', 'C1', 'C2', 'C3'] as const;

/** Rules 1050 to 1053: the amendment's numbers. */
export const CHARTER_AMENDMENT = {
  /** Rule 1050: the percentile a lower bound is read against. */
  lowerBoundPercentile: 0.95,
  /** Rule 1051 (b): measured bodies an improvement of accuracy needs. */
  accuracyMinBodies: 3,
  /** Rule 1052: the share of a body's draws a component must be assessable on. */
  componentAssessableShare: 0.5,
  /** Rule 1052: the share of draws with a computed crater that worsens O5. */
  craterWorsening: 0.1,
  /** Rule 1053: conditioned draws a band's comparison needs, on each side. */
  conditionedMinDraws: 50,
  /** Rule 1053: the floors of a baseline's band. */
  bandFloorKm: 0.5,
  bandFloorDex: 0.05,
} as const;

/** Rule 1050: a body's largest recovered mass, as its source classes it. */
export interface RecoveredMass {
  kg: number;
  kind: 'measured' | 'lowerBound';
}

/** The 5th, 50th and 95th percentiles of the model's largest piece (kg). */
export interface MassBand {
  p5: number;
  p50: number;
  p95: number;
}

/** Rules 1050 and 1058: a body's verdict on O2. «Compatible» is kept for a
 *  measured mass; on a lower bound the model is «not incompatible» at best. */
export type O2Verdict = 'compatible' | 'notIncompatible' | 'incompatible';

/** Rules 1050, 1058 and 1059: a body's verdict on O2, and its error — on a
 *  measured mass only, from the median of the largest piece (zero where no
 *  piece reaches the ground, and then an infinite error). */
export function o2Compatible(
  recovered: RecoveredMass,
  model: MassBand
): { verdict: O2Verdict; error: number | null } {
  const w = CHARTER.massBandWidening;
  if (recovered.kind === 'lowerBound')
    return {
      verdict: model.p95 >= recovered.kg ? 'notIncompatible' : 'incompatible',
      error: null,
    };
  return {
    verdict:
      recovered.kg >= model.p5 / w && recovered.kg <= model.p95 * w ? 'compatible' : 'incompatible',
    error:
      model.p50 > 0 ? Math.abs(Math.log10(model.p50 / recovered.kg)) : Number.POSITIVE_INFINITY,
  };
}

const median = (values: readonly number[]): number => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

/** One eligible body on O2, the baseline's reading and the model's. */
export interface O2Body {
  recovered: RecoveredMass;
  baseline: MassBand;
  model: MassBand;
}

/** Rules 1051 and 1059: whether a model improves O2, and whether its accuracy
 *  could be judged at all — on the same measured bodies for both, the clause
 *  of a factor of two read on the baseline's median error. */
export function o2Improves(bodies: readonly O2Body[]): {
  improves: boolean;
  compatibilityGain: number;
  accuracyAssessable: boolean;
} {
  const base = bodies.map((b) => o2Compatible(b.recovered, b.baseline));
  const mod = bodies.map((b) => o2Compatible(b.recovered, b.model));
  const failed = (v: O2Verdict | undefined): boolean => v === 'incompatible';
  const lost = base.some((b, i) => !failed(b.verdict) && failed(mod[i]?.verdict));
  const gain =
    mod.filter((m) => !failed(m.verdict)).length - base.filter((b) => !failed(b.verdict)).length;
  const measured = base
    .map((b, i) => ({ b: b.error, m: mod[i]?.error ?? null }))
    .filter((x): x is { b: number; m: number } => x.b !== null && x.m !== null);
  const eBase = measured.length > 0 ? median(measured.map((x) => x.b)) : Number.NaN;
  const accuracyAssessable =
    measured.length >= CHARTER_AMENDMENT.accuracyMinBodies && eBase >= CHARTER.massImprovementDex;
  // Rule 1077: two infinite errors compare equal — no gain between them.
  const eModel = measured.length > 0 ? median(measured.map((x) => x.m)) : Number.NaN;
  const accuracy =
    accuracyAssessable && Number.isFinite(eModel) && eBase - eModel >= CHARTER.massImprovementDex;
  return {
    improves: !lost && (gain >= 1 || accuracy),
    compatibilityGain: gain,
    accuracyAssessable,
  };
}

/** Rule 1052: one draw's answer on a component — right, wrong, or not
 *  assessable (C3 out of the domain). */
export type DrawAnswer = 'right' | 'wrong' | 'notAssessable';

/** Rules 1052 and 1075: C3 on a draw of a fall — no crater is right; a
 *  computed crater, and a draw out of the domain, are not: the share is read
 *  on all the paired draws, and a move out of the domain is never a success. */
export function craterAnswer(state: 'computed' | 'none' | 'outOfDomain'): DrawAnswer {
  return state === 'none' ? 'right' : 'wrong';
}

/** Rule 1052: a component's share on a body, or null where it is not
 *  assessable there. */
export function o5ComponentShare(draws: readonly DrawAnswer[]): number | null {
  const assessable = draws.filter((d) => d !== 'notAssessable');
  if (
    draws.length === 0 ||
    assessable.length < CHARTER_AMENDMENT.componentAssessableShare * draws.length
  )
    return null;
  return assessable.filter((d) => d === 'right').length / assessable.length;
}

/** Rule 1075: a body's three crater shares on its draws — computed, none,
 *  out of the domain — published for the baseline and the variant alike. */
export function craterShares(states: readonly ('computed' | 'none' | 'outOfDomain')[]): {
  computed: number;
  none: number;
  outOfDomain: number;
} {
  const n = states.length;
  const share = (k: string): number => (n === 0 ? 0 : states.filter((st) => st === k).length / n);
  return { computed: share('computed'), none: share('none'), outOfDomain: share('outOfDomain') };
}

/** Rule 1075: whether the variant worsens O5 by its craters on a fall — its
 *  share of computed craters, on all the paired draws, above 0.10, or above the
 *  baseline's by more than 0.10. */
export function craterWorsens(
  baseline: readonly ('computed' | 'none' | 'outOfDomain')[],
  variant: readonly ('computed' | 'none' | 'outOfDomain')[]
): boolean {
  if (baseline.length !== variant.length)
    throw new Error('rule 1075: the draws must be paired, one for one');
  const b = craterShares(baseline).computed;
  const v = craterShares(variant).computed;
  return v > CHARTER_AMENDMENT.craterWorsening || v - b > CHARTER_AMENDMENT.craterWorsening;
}

/** One deciding component of O5 on its eligible bodies: the shares of the
 *  baseline and of the model, body by body (null where not assessable). */
export interface O5Component {
  baseline: readonly (number | null)[];
  model: readonly (number | null)[];
}

/** Rules 1052, 1060 and 1075: O5's verdict from its deciding components (C1,
 *  C2) and, on each fall, whether the variant's craters worsen it
 *  (`craterWorsens`). A deciding component assessable on fewer than three
 *  bodies forbids the claim of improvement; it does not stop a worsening from
 *  counting. */
export function o5Verdict(
  components: readonly O5Component[],
  craterWorsening: readonly boolean[]
): { improves: boolean; worsens: boolean; improvementClaimable: boolean } {
  let worsens = craterWorsening.some(Boolean);
  let gained = false;
  let claimable = components.length > 0;
  const mean = (xs: number[]): number => xs.reduce((a, x) => a + x, 0) / xs.length;
  for (const c of components) {
    const pairs = c.baseline
      .map((b, i) => ({ b, m: c.model[i] ?? null }))
      .filter((x): x is { b: number; m: number } => x.b !== null && x.m !== null);
    if (pairs.length < CHARTER.minBodies) claimable = false;
    if (pairs.length === 0) continue;
    const delta = mean(pairs.map((p) => p.m)) - mean(pairs.map((p) => p.b));
    const fellBelow = pairs.some(
      (p) => p.b >= CHARTER.rightOutcomeShare && p.m < CHARTER.rightOutcomeShare
    );
    if (fellBelow || delta < -CHARTER.outcomeWorsening) worsens = true;
    if (delta >= CHARTER.outcomeGain) gained = true;
  }
  return { improves: claimable && gained && !worsens, worsens, improvementClaimable: claimable };
}

/** Rules 1053 and 1061: whether a model's band voids a body's improvement —
 *  true where it is too wide, null where the comparison is not assessable.
 *  `pairedDraws`, for a conditioned band: the draws that satisfy the outcome
 *  under both the baseline and the model, paired by index. */
export function bandVoids(
  observable: 'O1' | 'O2',
  baselineWidth: number,
  modelWidth: number,
  pairedDraws?: number
): boolean | null {
  if (pairedDraws !== undefined && pairedDraws < CHARTER_AMENDMENT.conditionedMinDraws) return null;
  const floor =
    observable === 'O1' ? CHARTER_AMENDMENT.bandFloorKm : CHARTER_AMENDMENT.bandFloorDex;
  return modelWidth > Math.max(CHARTER.bandWidening * baselineWidth, floor);
}

/** Rule 1054: one decisive observable, its eligible bodies counted by name. */
export interface ObservableOutcome {
  observable: CharterObservable;
  /** The bodies eligible for it under the baseline. */
  eligible: readonly string[];
  improves: boolean;
  worsens: boolean;
  /** Rule 1076: false where the variant cannot be assessed on it. */
  assessableForVariant?: boolean;
}

/** Rule 1054: the verdict — assessable observables only, never pooled. */
export function charterVerdict(outcomes: readonly ObservableOutcome[]): {
  assessable: CharterObservable[];
  adoptable: boolean;
  reason: 'adoptable' | 'tooFewAssessable' | 'worsens' | 'tooFewImproved';
} {
  const assessable = outcomes.filter(
    (o) => CHARTER_ROLES[o.observable] === 'decisive' && o.eligible.length >= CHARTER.minBodies
  );
  const names = assessable.map((o) => o.observable);
  if (assessable.length < CHARTER.minObservablesImproved)
    return { assessable: names, adoptable: false, reason: 'tooFewAssessable' };
  if (assessable.some((o) => o.worsens))
    return { assessable: names, adoptable: false, reason: 'worsens' };
  // Rule 1076: an observable lost to the variant earns it no improvement.
  const improved = assessable.filter((o) => o.improves && o.assessableForVariant !== false);
  if (improved.length < CHARTER.minObservablesImproved)
    return { assessable: names, adoptable: false, reason: 'tooFewImproved' };
  return { assessable: names, adoptable: true, reason: 'adoptable' };
}
