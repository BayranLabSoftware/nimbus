/**
 * Rules 1100 to 1106 — the independent test's protocol, second version. Written
 * on 24 September 2026, before any source of the third set was opened, on the
 * reviewer's reply to rule 1098: the first charter suspended as a judge (rule
 * 1099), a successor to be written that keeps apart whether material reaches
 * the ground, whether a crater forms in the crater law's domain, and whether
 * the outcome lies outside that domain, with the observables that can really
 * be assessed and their conditions. Andrea's word: the suspension and this
 * draft. It is a draft: not frozen until the reviewer approves it, and not run
 * before. A readable version: docs/INDEPENDENT_TEST_CHARTER_V2.md.
 *
 * RULE 1100. WHAT THIS IS. The second version of the judge, versioned. The
 * first (rules 1038 to 1062, 1075 to 1077, 1084, 1089) stays as written, a
 * historical version (rule 1099); this one replaces nothing of it tacitly.
 * Where it keeps a clause of the first it names it by number; where it drops
 * one it says so. Kept: the models and the set (rules 1039 to 1041), the
 * primary observables O1 to O4 and their roles (rules 1042, 1043) save where
 * rule 1104 says otherwise, the thresholds (rule 1044), O2 as amended (rules
 * 1050, 1051, 1058, 1059, 1077), the bands (rules 1053, 1061), eligibility
 * counted first (rules 1054, 1062), an observable lost to a variant (rule
 * 1076), what may not happen (rule 1045). Dropped: O5 as the composite of
 * rules 1052 and 1060, C3's right answers of rule 1075, and the transitions
 * of rules 1084 and 1089 — replaced by rules 1102 and 1103. It changes no
 * number of Nimbus: it corrects how the comparison is read, not the physics.
 *
 * RULE 1101. THE MODELS AND THE SET, as rule 1098 (a) froze and named them:
 * the baseline, S at f1 = 0.50 (0c59e87), F (3586988, run as 9eeed0a ran it);
 * S + F not built and not judged. F goes with rule 1097's warning. The set is
 * the third set of rules 941 to 944, its bodies read by type as rule 1041
 * reads them. No class B can come from it (rule 1055): no version of the judge
 * creates the ground case it lacks.
 *
 * RULE 1102. THE THREE QUESTIONS OF THE GROUND, kept apart, never folded into
 * one. On each draw a model's outcome at the ground is one of: NOTHING
 * ARRIVES; material arrives at the crater law's speeds (5 km/s or more) and
 * the law gives a CRATER; material arrives below them, OUT OF THE LAW'S
 * DOMAIN — in DARK FLIGHT, at the piece's terminal speed, or BETWEEN the two.
 * The regime is the largest arriving piece's, else a swarm's (rule 1096 (d)).
 *   Q1 SURVIVAL: does material reach the ground? Yes unless nothing arrives.
 *   Q2 THE CRATER IN THE LAW'S DOMAIN: does a crater form where the law
 *      applies? Answered only on the draws in the law's domain — a crater,
 *      or nothing arriving; a draw out of the domain is not an answer to Q2,
 *      neither «crater» nor «no crater».
 *   Q3 OUT OF THE LAW'S DOMAIN: where material arrives, does it arrive outside
 *      the law's domain, and how — in dark flight or between? Answered only
 *      on the draws on which material arrives.
 * For a fall of the set — meteorites recovered, the luminous flight observed
 * to end above the ground — the observed answers are: Q1 yes; Q2 no crater;
 * Q3 outside the domain, in dark flight. «Out of the domain» is never read as
 * «no crater», nor as «crater», nor as «no meteorites».
 *
 * RULE 1103. HOW THE THREE ARE READ AND WHAT DECIDES (`groundReading`,
 * `groundVerdict`), per body on the paired draws.
 *   (a) Q1's share: the draws on which material arrives, over all draws.
 *       Decisive.
 *   (b) Q3's share: the draws arriving in dark flight, over the draws on which
 *       material arrives; with fewer than half the draws arriving, Q3 is not
 *       assessable for that model on that body. The shares out of the domain
 *       and between are published beside. Decisive.
 *   (c) Q2: its share of craters over the draws in the law's domain is
 *       published, with the number of those draws; it earns no credit. It
 *       worsens: a model whose computed craters, counted on all the paired
 *       draws, exceed 0.10 of them on a fall, or exceed the baseline's by more
 *       than 0.10, worsens the ground outcome (rule 1075's worsening, kept).
 *       A draw moved out of the domain neither earns nor loses anything on Q2;
 *       it is read by Q3.
 *   (d) The ground outcome — O5 of the first version — improves where Q1's or
 *       Q3's mean share, over the bodies on which both the baseline and the
 *       model are assessable, rises by 0.10 or more (rule 975's gain), on at
 *       least three such bodies in the priors' domain; and it worsens where,
 *       on those bodies, a body falls below 0.90 that the baseline held at or
 *       above it, a mean share falls by more than 0.10, or (c) holds. A
 *       question comparable on fewer than three bodies cannot improve; its
 *       worsenings still count. Where Q3 is not assessable for the baseline on
 *       a body — nothing arrives there — and is for the model, the model's Q3
 *       is read against the fall itself: below 0.90 (rule 964 (b)'s right
 *       outcome) it bars any improvement of the ground outcome, so that a gain
 *       of Q1 cannot be bought with arrivals the fall contradicts. The ground
 *       outcome counts as one decisive observable.
 *
 * RULE 1104. O1, THE FLARES, IN THIS VERSION (amends rule 1042's reading of
 * E3 through E1). The band of the model's release — the baseline's burst
 * altitude, S's m2 — is read on the draws that give no crater in the law's
 * domain, whether or not material arrives: a fall's meteorites do reach the
 * ground, and a draw that brings them down is not excluded for it. The draws
 * that give no release altitude are counted and published. F has none to
 * give (rule 1094): O1 is not assessable for F, and by rule 1076 it counts
 * against F's clause of two wherever it is assessable for the baseline. Where
 * O1 is not assessable for a model because of a rule of selection, the
 * verdict says so, and never reads it as a worse photometric prediction. The
 * peak of the energy given to the air is a proxy of the brightest flare, a
 * photometric observable, not the same quantity.
 *
 * RULE 1105. WHAT CAN BE ASSESSED, AND ON WHAT CONDITIONS (`V2_OBSERVABLES`).
 *   O1 — where the source measures the flare heights directly from the light
 *        curve and the trajectory (not from a model fitted to the event);
 *        produced by the baseline and S, not by F. Decisive.
 *   O2 — where the source gives the largest recovered mass, classed measured
 *        or lower bound from the evidence of the search (rule 1058); produced
 *        by all three, S's and F's masses with no ablation. Decisive.
 *   O3 — where the source gives at least ten recovered masses and a
 *        documented search; produced by all three. Diagnostic unless on at
 *        least three bodies.
 *   O4 — the end speed of the luminous flight: produced by no frozen model at
 *        a height above the ground, and given to none as a new output. Not
 *        assessable in this version; reported so.
 *   Q1, Q2, Q3 — where the source documents the recovery of meteorites (Q1)
 *        and the end of the luminous flight above the ground (Q3); Q2 applies
 *        to every fall. Produced by all three.
 * A body is admitted per observable, never pooled across observables (rule
 * 1054); the table of eligibility is filled, by name, when the sources are
 * pinned and before any prediction.
 *
 * RULE 1106. THE ORDER. This draft pushed; the reviewer reads it; it is
 * frozen only on his approval, and amended before that by rules of its own.
 * Then the sources opened with Andrea's leave for each download and pinned
 * into the table of eligibility; then the predictions, the judge run once,
 * every outcome published even if negative or not assessable. Until then the
 * third set stays closed. No class B from this set.
 */

/**
 * Rules 1107 to 1113 — the second version amended before it is frozen, on the
 * reviewer's reply of 24 September 2026: not yet to be frozen; D3 conditioned
 * on arrival confirmed as a description, with the joint outcome over all the
 * draws added; the clause of 0.90 refused; mixed arrivals, D2's numbers, O1's
 * selection, the decision's edge cases and the observational basis of each
 * answer to be fixed now. Andrea's word: the amendments and the text. They
 * are amendments to the judge, not to any number of Nimbus; the third set
 * stays closed.
 *
 * RULE 1107. THE ARRIVALS OF A DRAW, EXHAUSTIVE (amends rule 1102). Every
 * piece or swarm that reaches the ground is classed on its own: CRATER, at the
 * crater law's speeds (5 km/s or more); DARK FLIGHT, at its terminal speed;
 * BETWEEN, below the law's speeds and above its terminal speed — a swarm never
 * at its terminal speed. The draw's state follows by a fixed precedence:
 * crater, then between, then dark flight, then nothing — a draw is in dark
 * flight only if everything that arrives is. Beside the states, the shares of
 * the arriving mass in each class are published. The pieces are the
 * baseline's body or swarm, S's core and swarms, F's fragments and swarms
 * (`pieceClass`, `drawState`). For the judge this reading replaces rule
 * 1096 (d)'s, which read the largest piece alone. These are Nimbus's
 * operational classes, not measurements of how a real meteorite arrived.
 *
 * RULE 1108. D1, D3 AND THE JOINT OUTCOME (amends rule 1103 (a), (b), (d)).
 *   (a) D1, P(material arrives), on all the paired draws.
 *   (b) D3, P(dark flight | material arrives): a description, published with
 *       whether it is assessable (at least half the draws arriving); it never
 *       decides, is never a success, and a D3 not assessable neither counts
 *       nor lets a model escape D1.
 *   (c) J, the joint outcome, P(material arrives and the draw is in dark
 *       flight), on all the paired draws.
 *   (d) The ground outcome, one decisive observable, has two deciding
 *       measures: D1 on the bodies whose recovery is documented, J on the
 *       bodies whose regime of arrival is documented (rule 1109). Each
 *       improves where its mean share over at least three bodies in the
 *       priors' domain, eligible for it and read for both models, rises by
 *       0.10 or more; each worsens where, on those bodies, one the baseline
 *       held at or above 0.90 falls below it or the mean falls by more than
 *       0.10. So that survival cannot be bought with arrivals a fall
 *       contradicts: where J is eligible on at least three bodies, the ground
 *       outcome improves only through J; D1 alone improves it only where J is
 *       eligible on fewer than three. It improves where one measure improves
 *       as allowed and nothing worsens (D1, J, rule 1110's craters).
 *
 * RULE 1109. WHAT EACH ANSWER RESTS ON, fixed before any prediction and
 * classed body by body when the sources are pinned, into the table of
 * eligibility (amends rule 1105).
 *   (a) RECOVERY DOCUMENTED — D1 observed yes: the source reports meteorites
 *       recovered and attributes them to the fireball.
 *   (b) NO CRATER DOCUMENTED — D2 observed «no crater»: the source describes
 *       the circumstances of the finds — on the surface, in a pit of the
 *       stone's own size, on a structure — or states that no crater formed.
 *       A report that is silent on the finds does not document it.
 *   (c) REGIME DOCUMENTED — J observed yes: the source documents the traces of
 *       the recovered meteorites' arrival — a pit or penetration of their own
 *       size, damage to a structure, a witnessed impact — and reads them as an
 *       arrival at terminal speed. The end of the luminous flight, an end
 *       speed of the luminous phase, or a dark-flight model alone does not
 *       document it: the end of the light, the end of ablation, the dark
 *       flight and the terminal speed are distinct stages.
 *   Each answer supports only what it measures.
 *
 * RULE 1110. THE CLAUSE OF 0.90 WITHDRAWN, AND D2's NUMBERS (amends rule
 * 1103 (c), (d)). Rule 1103 (d)'s bar — a model's D3 below 0.90 against the
 * fall itself — is withdrawn: rule 1108 (d) takes its place. D2 publishes the
 * number of computed craters and the number of draws in the law's domain, and
 * beside them the share of the draws with a computed crater over all the
 * paired draws, which the worsening reads; that share is not called a
 * probability of «no crater». The worsening by craters applies only on the
 * bodies where «no crater» is documented (rule 1109 (b)).
 *
 * RULE 1111. O1's DRAWS, EACH ACCOUNTED FOR (amends rule 1104). Each draw is
 * one of: RELEASE PRODUCED — the model gives its release quantity and no
 * crater is computed on the draw, whether material arrives or not, in dark
 * flight or between; EXCLUDED BY THE SELECTION — a crater is computed on the
 * draw; NOT PRODUCED — the model gives no release quantity there (the
 * baseline intact, S with no share bursting); PRODUCED, NOT CONVERGENT — a
 * quantity whose convergence was tested and failed (F's release altitude,
 * rule 1094). The four counts are published per body; the band is read on the
 * first. A draw out of the crater law's domain with no crater is never
 * excluded for it (`releaseStatus`).
 *
 * RULE 1112. THE DECISION'S EDGE CASES, said before the set is opened.
 *   (a) A deciding measure eligible on fewer than three bodies read for both
 *       models cannot improve; its worsenings on the bodies it has still
 *       count. With neither D1 nor J able to improve, the ground outcome
 *       cannot improve.
 *   (b) D3 assessable for the baseline and not for the variant, or the other
 *       way: it decides nothing (rule 1108 (b)); the difference shows in D1
 *       and J, which read all the draws.
 *   (c) F cannot be adopted in this round. O1 is not assessable for it (rule
 *       1094), and its masses — rule 1097 — are not comparable with a
 *       recovered mass, so O2 is not assessable for it either; by rule 1076
 *       both count against its clause of two, and the ground outcome alone
 *       cannot meet it. F's readings are published as diagnostics.
 *   (d) S and the baseline carry no ablation either — S's core by the model's
 *       assumption (rule 1023 (b)), the baseline's intact body as the product
 *       has it. Whether O2 stays assessable for them, as the first version read
 *       it, is asked of the reviewer before the set is opened; until he
 *       answers, the version is not frozen.
 *
 * RULE 1113. THE ORDER, kept (rule 1106): these amendments pushed, the reviewer
 * reads them; frozen only on his approval; the third set closed until then.
 */

/** Rule 1102: a model's outcome at the ground on one draw. */
export type GroundState = 'nothing' | 'crater' | 'darkFlight' | 'between';

/** Rule 1107: the class of one piece or swarm reaching the ground. */
export type PieceClass = 'crater' | 'darkFlight' | 'between';

/** Rule 1107: a piece's class from its speed at the ground, whether that speed
 *  is its terminal speed (a swarm never is), and the crater law's speed. */
export function pieceClass(speed: number, atTerminal: boolean, craterSpeed = 5_000): PieceClass {
  if (speed >= craterSpeed) return 'crater';
  return atTerminal ? 'darkFlight' : 'between';
}

/** Rule 1107: the draw's state, by the fixed precedence crater, between, dark
 *  flight, nothing. */
export function drawState(pieces: readonly PieceClass[]): GroundState {
  if (pieces.length === 0) return 'nothing';
  if (pieces.includes('crater')) return 'crater';
  if (pieces.includes('between')) return 'between';
  return 'darkFlight';
}

/** Rules 1103, 1108 and 1110: the questions read on one body's draws. */
export interface GroundReading {
  draws: number;
  /** D1: draws on which material arrives, over all. */
  q1: number;
  /** J (rule 1108 (c)): draws arriving in dark flight, over all. */
  joint: number;
  /** D2 (rule 1110): the computed craters and the draws in the law's domain. */
  craters: number;
  q2Draws: number;
  /** D2: craters over the draws in the law's domain; null with none there. */
  q2CraterShare: number | null;
  /** Rule 1110: the draws with a computed crater over all the draws — the
   *  worsening's share, not a probability of «no crater». */
  craterShareAll: number;
  /** D3 (rule 1108 (b)), a description: dark flight over the draws arriving;
   *  null where fewer than half the draws arrive (not assessable). */
  q3: number | null;
  /** Beside D3: out of the domain and between, over the draws arriving. */
  outOfDomainShare: number | null;
  betweenShare: number | null;
}

/** Rules 1102, 1103, 1108 and 1110: one body's reading. Out of the domain
 *  never enters D2, as «crater» or as «no crater». */
export function groundReading(states: readonly GroundState[]): GroundReading {
  const n = states.length;
  const count = (f: (s: GroundState) => boolean): number => states.filter(f).length;
  const arriving = count((s) => s !== 'nothing');
  const craters = count((s) => s === 'crater');
  const dark = count((s) => s === 'darkFlight');
  const inDomain = count((s) => s === 'crater' || s === 'nothing');
  const out = count((s) => s === 'darkFlight' || s === 'between');
  const assessable = n > 0 && arriving >= n / 2;
  return {
    draws: n,
    q1: n === 0 ? 0 : arriving / n,
    joint: n === 0 ? 0 : dark / n,
    craters,
    q2Draws: inDomain,
    q2CraterShare: inDomain === 0 ? null : craters / inDomain,
    craterShareAll: n === 0 ? 0 : craters / n,
    q3: assessable ? dark / arriving : null,
    outOfDomainShare: arriving === 0 ? null : out / arriving,
    betweenShare: arriving === 0 ? null : count((s) => s === 'between') / arriving,
  };
}

/** Rules 1103 (c) and 1110: the worsening by craters on a fall whose «no
 *  crater» is documented, on all paired draws. */
export function craterWorsensV2(baseline: GroundReading, model: GroundReading): boolean {
  return model.craterShareAll > 0.1 || model.craterShareAll > baseline.craterShareAll + 0.1;
}

/** Rule 1109: what a body's sources document, classed when they are pinned. */
export interface BodyDocumentation {
  recovery: boolean;
  noCrater: boolean;
  regime: boolean;
}

/** Rules 1108 (d), 1110 and 1112: the ground outcome's verdict over the
 *  bodies in the priors' domain, each read for the baseline and the model on
 *  the same draws. */
export function groundVerdict(
  bodies: readonly {
    baseline: GroundReading;
    model: GroundReading;
    documented: BodyDocumentation;
  }[]
): {
  d1: { eligible: number; gain: number | null; improves: boolean; worsens: boolean };
  joint: { eligible: number; gain: number | null; improves: boolean; worsens: boolean };
  craters: boolean;
  improves: boolean;
  worsens: boolean;
} {
  const measure = (
    pick: (r: GroundReading) => number,
    eligible: (d: BodyDocumentation) => boolean
  ) => {
    const pairs = bodies
      .filter((b) => eligible(b.documented))
      .map(({ baseline, model }) => ({ b: pick(baseline), m: pick(model) }));
    const mean = (xs: number[]): number => xs.reduce((a, x) => a + x, 0) / xs.length;
    const gain =
      pairs.length === 0 ? null : mean(pairs.map((p) => p.m)) - mean(pairs.map((p) => p.b));
    return {
      eligible: pairs.length,
      gain,
      improves: pairs.length >= 3 && gain !== null && gain >= 0.1,
      worsens: pairs.some((p) => p.b >= 0.9 && p.m < 0.9) || (gain !== null && gain < -0.1),
    };
  };
  const d1 = measure(
    (r) => r.q1,
    (d) => d.recovery
  );
  const joint = measure(
    (r) => r.joint,
    (d) => d.regime
  );
  const craters = bodies.some(
    ({ baseline, model, documented }) => documented.noCrater && craterWorsensV2(baseline, model)
  );
  const worsens = d1.worsens || joint.worsens || craters;
  // Rule 1108 (d): through J where J has three bodies; D1 alone only where not.
  const improvesBy = joint.eligible >= 3 ? joint.improves : joint.improves || d1.improves;
  return { d1, joint, craters, improves: improvesBy && !worsens, worsens };
}

/** Rule 1111: what one draw gives O1. */
export type ReleaseStatus = 'produced' | 'excludedBySelection' | 'notProduced' | 'notConvergent';

/** Rule 1111: a draw with no computed crater is never excluded, in or out of
 *  the crater law's domain. */
export function releaseStatus(
  state: GroundState,
  release: number | null,
  convergent = true
): ReleaseStatus {
  if (state === 'crater') return 'excludedBySelection';
  if (release === null) return 'notProduced';
  return convergent ? 'produced' : 'notConvergent';
}

/** Rules 1105 and 1112: what each observable asks of its source and who can
 *  be judged on it. */
export const V2_OBSERVABLES = {
  O1: {
    role: 'decisive',
    source: 'flare heights measured from the light curve and the trajectory',
    assessableFor: ['baseline', 'S'],
  },
  O2: {
    role: 'decisive',
    source: 'the largest recovered mass, measured or a lower bound (rule 1058)',
    // Rule 1112 (c): not F; (d): S and the baseline asked of the reviewer.
    assessableFor: ['baseline', 'S'],
  },
  O3: {
    role: 'diagnostic',
    source: 'at least ten recovered masses and a documented search',
    assessableFor: ['baseline', 'S', 'F'],
  },
  O4: { role: 'not assessable', source: 'the end speed of the luminous flight', assessableFor: [] },
  ground: {
    role: 'decisive',
    source: 'recovery (D1), no crater (D2) and regime (J) each documented (rule 1109)',
    assessableFor: ['baseline', 'S', 'F'],
  },
} as const;

/** Rule 1112 (c): F cannot be adopted in this round. */
export const F_ADOPTABLE_THIS_ROUND = false;

/** Rules 1100, 1106 and 1113: this version's status. */
export const CHARTER_V2 = {
  version: 2,
  rules: '1100–1113',
  frozen: false,
  predecessor: 'independentTestCharter.ts (rule 1099: suspended as a judge)',
} as const;
