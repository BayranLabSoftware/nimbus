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

/** Rule 1050: whether a body is compatible on O2, and its error where one is
 *  computed (a measured mass only). */
export function o2Compatible(
  recovered: RecoveredMass,
  model: MassBand
): { compatible: boolean; error: number | null } {
  const w = CHARTER.massBandWidening;
  if (recovered.kind === 'lowerBound')
    return { compatible: model.p95 >= recovered.kg, error: null };
  return {
    compatible: recovered.kg >= model.p5 / w && recovered.kg <= model.p95 * w,
    error: Math.abs(Math.log10(model.p50 / recovered.kg)),
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

/** Rule 1051: whether a model improves O2, and whether its accuracy could be
 *  judged at all. */
export function o2Improves(bodies: readonly O2Body[]): {
  improves: boolean;
  compatibilityGain: number;
  accuracyAssessable: boolean;
} {
  const base = bodies.map((b) => o2Compatible(b.recovered, b.baseline));
  const mod = bodies.map((b) => o2Compatible(b.recovered, b.model));
  const lost = base.some((b, i) => b.compatible && mod[i]?.compatible !== true);
  const gain = mod.filter((m) => m.compatible).length - base.filter((b) => b.compatible).length;
  const measured = base
    .map((b, i) => ({ b: b.error, m: mod[i]?.error ?? null }))
    .filter((x): x is { b: number; m: number } => x.b !== null && x.m !== null);
  const eBase = measured.length > 0 ? median(measured.map((x) => x.b)) : Number.NaN;
  const accuracyAssessable =
    measured.length >= CHARTER_AMENDMENT.accuracyMinBodies && eBase >= CHARTER.massImprovementDex;
  const accuracy =
    accuracyAssessable && eBase - median(measured.map((x) => x.m)) >= CHARTER.massImprovementDex;
  return {
    improves: !lost && (gain >= 1 || accuracy),
    compatibilityGain: gain,
    accuracyAssessable,
  };
}

/** Rule 1052: one draw's answer on a component — right, wrong, or not
 *  assessable (C3 out of the domain). */
export type DrawAnswer = 'right' | 'wrong' | 'notAssessable';

/** Rule 1052: C3 on a draw — a computed crater is wrong for a fall, none is
 *  right, out of the domain is never counted right. */
export function craterAnswer(state: 'computed' | 'none' | 'outOfDomain'): DrawAnswer {
  return state === 'none' ? 'right' : state === 'computed' ? 'wrong' : 'notAssessable';
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

/** One deciding component of O5 on its eligible bodies: the shares of the
 *  baseline and of the model, body by body (null where not assessable). */
export interface O5Component {
  baseline: readonly (number | null)[];
  model: readonly (number | null)[];
}

/** Rule 1052: O5's verdict from its deciding components (C1, C2) and the share
 *  of draws, body by body, where the model digs a computed crater. */
export function o5Verdict(
  components: readonly O5Component[],
  modelComputedCraterShare: readonly number[]
): { improves: boolean; worsens: boolean } {
  const craterWorse = modelComputedCraterShare.some((s) => s > CHARTER_AMENDMENT.craterWorsening);
  let improves = false;
  let worsens = craterWorse;
  for (const c of components) {
    const pairs = c.baseline
      .map((b, i) => ({ b, m: c.model[i] ?? null }))
      .filter((x): x is { b: number; m: number } => x.b !== null && x.m !== null);
    if (pairs.length === 0) continue;
    const mean = (xs: number[]): number => xs.reduce((a, x) => a + x, 0) / xs.length;
    const delta = mean(pairs.map((p) => p.m)) - mean(pairs.map((p) => p.b));
    const fellBelow = pairs.some(
      (p) => p.b >= CHARTER.rightOutcomeShare && p.m < CHARTER.rightOutcomeShare
    );
    if (fellBelow || delta < -CHARTER.outcomeWorsening) worsens = true;
    if (delta >= CHARTER.outcomeGain) improves = true;
  }
  return { improves: improves && !worsens, worsens };
}

/** Rule 1053: whether a model's band voids a body's improvement — true where
 *  it is too wide, null where the comparison is not assessable. */
export function bandVoids(
  observable: 'O1' | 'O2',
  baselineWidth: number,
  modelWidth: number,
  conditionedDraws?: { baseline: number; model: number }
): boolean | null {
  if (
    conditionedDraws !== undefined &&
    (conditionedDraws.baseline < CHARTER_AMENDMENT.conditionedMinDraws ||
      conditionedDraws.model < CHARTER_AMENDMENT.conditionedMinDraws)
  )
    return null;
  const floor =
    observable === 'O1' ? CHARTER_AMENDMENT.bandFloorKm : CHARTER_AMENDMENT.bandFloorDex;
  return modelWidth > CHARTER.bandWidening * Math.max(baselineWidth, floor);
}

/** Rule 1054: one decisive observable, its eligible bodies counted by name. */
export interface ObservableOutcome {
  observable: CharterObservable;
  eligible: readonly string[];
  improves: boolean;
  worsens: boolean;
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
  if (assessable.filter((o) => o.improves).length < CHARTER.minObservablesImproved)
    return { assessable: names, adoptable: false, reason: 'tooFewImproved' };
  return { assessable: names, adoptable: true, reason: 'adoptable' };
}
