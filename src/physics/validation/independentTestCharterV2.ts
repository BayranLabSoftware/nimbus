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

/** Rule 1102: a model's outcome at the ground on one draw. */
export type GroundState = 'nothing' | 'crater' | 'darkFlight' | 'between';

/** Rule 1103: the three questions read on one body's draws. */
export interface GroundReading {
  draws: number;
  /** Q1: draws on which material arrives, over all. */
  q1: number;
  /** Q2: draws in the law's domain (a crater, or nothing arriving). */
  q2Draws: number;
  /** Q2: craters over the draws in the law's domain; null with none there. */
  q2CraterShare: number | null;
  /** Rule 1103 (c): craters over all the draws. */
  craterShareAll: number;
  /** Q3: draws arriving in dark flight over the draws arriving; null where
   *  fewer than half the draws arrive (not assessable). */
  q3: number | null;
  /** Q3, beside: out of the domain and between, over the draws arriving. */
  outOfDomainShare: number | null;
  betweenShare: number | null;
}

/** Rules 1102 and 1103: one body's reading. Out of the domain never enters
 *  Q2, as «crater» or as «no crater». */
export function groundReading(states: readonly GroundState[]): GroundReading {
  const n = states.length;
  const count = (f: (s: GroundState) => boolean): number => states.filter(f).length;
  const arriving = count((s) => s !== 'nothing');
  const craters = count((s) => s === 'crater');
  const inDomain = count((s) => s === 'crater' || s === 'nothing');
  const out = count((s) => s === 'darkFlight' || s === 'between');
  const assessable = n > 0 && arriving >= n / 2;
  return {
    draws: n,
    q1: n === 0 ? 0 : arriving / n,
    q2Draws: inDomain,
    q2CraterShare: inDomain === 0 ? null : craters / inDomain,
    craterShareAll: n === 0 ? 0 : craters / n,
    q3: assessable ? count((s) => s === 'darkFlight') / arriving : null,
    outOfDomainShare: arriving === 0 ? null : out / arriving,
    betweenShare: arriving === 0 ? null : count((s) => s === 'between') / arriving,
  };
}

/** Rule 1103 (c): the worsening by craters on a fall, on all paired draws. */
export function craterWorsensV2(baseline: GroundReading, model: GroundReading): boolean {
  return model.craterShareAll > 0.1 || model.craterShareAll > baseline.craterShareAll + 0.1;
}

/** Rule 1103 (d): the ground outcome's verdict over the bodies in the priors'
 *  domain, each read for the baseline and the model on the same draws. */
export function groundVerdict(
  bodies: readonly { baseline: GroundReading; model: GroundReading }[]
): {
  q1: { comparable: number; gain: number | null };
  q3: { comparable: number; gain: number | null };
  barred: boolean;
  improves: boolean;
  worsens: boolean;
} {
  const question = (pick: (r: GroundReading) => number | null) => {
    const pairs = bodies.flatMap(({ baseline, model }) => {
      const b = pick(baseline);
      const m = pick(model);
      return b === null || m === null ? [] : [{ b, m }];
    });
    const mean = (xs: number[]): number => xs.reduce((a, x) => a + x, 0) / xs.length;
    const gain =
      pairs.length === 0 ? null : mean(pairs.map((p) => p.m)) - mean(pairs.map((p) => p.b));
    const lost = pairs.some((p) => p.b >= 0.9 && p.m < 0.9);
    return {
      comparable: pairs.length,
      gain,
      improves: pairs.length >= 3 && gain !== null && gain >= 0.1,
      worsens: lost || (gain !== null && gain < -0.1),
    };
  };
  const q1 = question((r) => r.q1);
  const q3 = question((r) => r.q3);
  const craters = bodies.some(({ baseline, model }) => craterWorsensV2(baseline, model));
  const worsens = q1.worsens || q3.worsens || craters;
  // Rule 1103 (d): arrivals the fall contradicts, where the baseline has none.
  const barred = bodies.some(
    ({ baseline, model }) => baseline.q3 === null && model.q3 !== null && model.q3 < 0.9
  );
  return {
    q1: { comparable: q1.comparable, gain: q1.gain },
    q3: { comparable: q3.comparable, gain: q3.gain },
    barred,
    improves: (q1.improves || q3.improves) && !worsens && !barred,
    worsens,
  };
}

/** Rule 1105: what each observable asks of its source and who produces it. */
export const V2_OBSERVABLES = {
  O1: {
    role: 'decisive',
    source: 'flare heights measured from the light curve and the trajectory',
    producedBy: ['baseline', 'S'],
  },
  O2: {
    role: 'decisive',
    source: 'the largest recovered mass, measured or a lower bound (rule 1058)',
    producedBy: ['baseline', 'S', 'F'],
  },
  O3: {
    role: 'diagnostic',
    source: 'at least ten recovered masses and a documented search',
    producedBy: ['baseline', 'S', 'F'],
  },
  O4: { role: 'not assessable', source: 'the end speed of the luminous flight', producedBy: [] },
  ground: {
    role: 'decisive',
    source: 'the recovery documented (Q1); the luminous flight ending above the ground (Q3)',
    producedBy: ['baseline', 'S', 'F'],
  },
} as const;

/** Rules 1100 and 1106: this version's status. */
export const CHARTER_V2 = {
  version: 2,
  rules: '1100–1106',
  frozen: false,
  predecessor: 'independentTestCharter.ts (rule 1099: suspended as a judge)',
} as const;
