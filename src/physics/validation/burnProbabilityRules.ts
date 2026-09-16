import {
  BURN_PROBABILITY_CURVES,
  BURN_PROBABILITY_WORKED_EXAMPLE_1MT,
  BURN_PROBABILITY_YIELDS_KT,
} from '../effects/burnProbabilityData.js';
import type { BurnExposureSource } from '../effects/burnExposure.js';

/**
 * What a burn ring means: the exposure a burn needs, or the exposure at which
 * half a population takes one.
 *
 * Rules 80 to 84 put the burn rings on Glasstone & Dolan's Figure 12.64, which
 * is captioned "Radiant exposure required to produce skin burns for different
 * skin pigmentations" and attaches **no probability to any curve**. The
 * validation report has carried that as a declared gap since the same day: the
 * book's next figure, 12.65, is "Skin burn probabilities for an average
 * unshielded population taking no evasive action", three solid lines at 50 %
 * and four broken ones at 18 % and 82 %, and this project did not read it.
 *
 * **This round is not a contest, and pretending otherwise would be the lie.**
 * No measurement can separate the two figures: they are the same book, on
 * facing pages, and there is no held-out data on which one is right, because
 * both are right about different questions. 12.64 answers "how much exposure
 * does this burn need?"; 12.65 answers "how much exposure before half these
 * people have it?". Which one a simulator should draw is a choice about what a
 * ring is meant to mean, and Andrea made it on 16 September 2026: the ring
 * goes where half a population takes the burn, and carries the band the figure
 * draws around it. What these rules can do is fix, before anything is run,
 * that the reading of the figure is faithful and that adopting it breaks
 * nothing — and to say plainly what the choice costs.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the page itself; the trace of all seven curves, made and committed
 * on 16 September 2026 (`0193b78`) before this round existed; and the
 * comparison the validation report already prints — at 1 Mt 12.64's middle
 * pigmentation asks 3.32 cal/cm² for a first-degree burn against 12.65's 50 %
 * line at 3.20, 6.30 against 6.25 for a second and 10.04 against 9.72 for a
 * third, so the rings this round draws are between 1 % and 7 % wider than the
 * ones in place. Nothing here is a measurement of the world, so nothing is
 * spent by looking.
 *
 * The rules, fixed on 16 September 2026, and numbered after the hundred and
 * thirteen before them:
 *
 *  114. **The curves.** Seven, traced from the public scan (DTIC ADA087568,
 *       printed page 565, which is page 573 of the scan and printed sideways)
 *       by `scripts/benchmark/burn-probability-curves.py` into
 *       `effects/burnProbabilityData.ts`, committed before the candidate is
 *       run on anything. The script refuses to write unless it finds exactly
 *       seven curves at its seed column, none falls as the yield rises, none
 *       crosses another, every degree's three lines are ordered at every
 *       yield, and **the book's own worked example is reproduced**: §12.65
 *       says that at 1 Mt a population between about 4.5 and 6 cal/cm² takes
 *       18 % second-degree burns and the rest first-degree, and the trace must
 *       put that band between 4.1–4.9 and 5.6–6.4. It gives 4.71 to 6.25. The
 *       reading is good to about a tenth of a cal/cm², half the thickness of a
 *       printed curve.
 *
 *  115. **What a curve means, read off that same worked example.** A curve is
 *       the exposure at which that share of an average unshielded population
 *       taking no evasive action has a burn of that degree — and each broken
 *       line does double duty, being at once the 18 % line of one degree and
 *       the 82 % line of the degree below. That is not a guess: it is what
 *       makes §12.65's example come out right, since the example's band runs
 *       from the "18 % second-degree, 82 % first" line up to the "50 %
 *       second-degree" line and holds 18 % second-degree burns throughout. So
 *       each degree has three lines, and the third degree's upper line is the
 *       figure's **100 %** curve rather than an 82 % one, because the figure
 *       draws no 82 % third-degree curve — carried as 100 % and declared, not
 *       invented.
 *
 *  116. **The candidate (`glasstone1977probability`).** A burn ring is drawn
 *       at the 50 % line for its degree, interpolated in the logarithm of the
 *       yield and held flat below 1 kt and above 10 Mt where the figure says
 *       nothing, exactly as rule 81 holds 12.64's. Each ring carries a band
 *       from its 18 % line to its upper line. Skin pigmentation has no meaning
 *       under this figure and is ignored: what 12.64 offers as three
 *       pigmentations 12.65 offers as one population with a spread, and no
 *       reading of one figure can give both. Everything else is shared with
 *       rules 80 to 84 — the thermal partition, the transmission, the
 *       fireball — and an impact's rings keep the project's fixed fluences,
 *       because these curves are a nuclear fireball's pulse.
 *
 *  117. **What decides.** The candidate is adopted unless a guard fails:
 *       (a) rule 114's checks on the trace; (b) the release gate leaves PASS —
 *       no gated row of the calibration net leaves its band; (c) any ring of a
 *       net explosion moves by more than a factor of two, which a misread
 *       figure could not pass and a 1-to-7 % move cannot fail; (d) rule 19's
 *       invariants, read **under the law in place and again with the candidate
 *       in place, in the same run** — the correction the protocol's Conduct
 *       took on 16 September 2026 — come back worse with the candidate than
 *       without it. The tolls of the net's explosions are read and printed;
 *       Hiroshima's is tuned on its own mortality and Beirut's charge is
 *       chemical and draws no flash, so neither can decide.
 *
 * What an adoption does. `DEFAULT_BURN_EXPOSURE` becomes
 * `glasstone1977probability`; 12.64 stays reachable by name and rules 80 to 84
 * keep their verdict and their text; the methodology page and the report name
 * the figure, its caption and the 18 %/82 % band; and the rules that decided
 * before keep their verdicts while their printed figures move, as rule 44 has
 * it, with nothing re-tuned (rules 5 and 6).
 *
 * What these rules cannot settle. That an average unshielded population taking
 * no evasive action is the population a visitor is asking about — most people
 * are indoors, behind something, or facing away, and the figure's own caption
 * says what it assumes. That the 18 %-to-82 % band is an uncertainty: it is a
 * spread across people at one exposure, not a confidence interval on the ring,
 * and the two must not be printed as if they were the same thing. And that a
 * curve traced off a scan is the curve the authors drew — what protects that
 * is the book's own arithmetic in §12.65, which the trace has to reproduce
 * before it may write anything at all.
 */

/** Rule 116's candidate and the source in place. */
export const BURN_PROBABILITY_IN_PLACE: BurnExposureSource = 'glasstone1977';
export const BURN_PROBABILITY_CANDIDATE: BurnExposureSource = 'glasstone1977probability';

/** Rule 114: the band the book reads at 1 Mt, and the window the trace must
 *  land in to be allowed to write. */
export const WORKED_EXAMPLE_LOW_WINDOW: readonly [number, number] = [4.1, 4.9];
export const WORKED_EXAMPLE_HIGH_WINDOW: readonly [number, number] = [5.6, 6.4];

export interface BurnProbabilityChecks {
  /** Three degrees, each with an 18 %, a 50 % and an upper line. */
  three: boolean;
  /** Every line rises with the yield. */
  rising: boolean;
  /** Every degree's three lines are ordered at every yield. */
  ordered: boolean;
  /** The book's own worked example at 1 Mt. */
  workedExample: boolean;
}

/** Rule 114, checked against the table that was written rather than trusted. */
export function burnProbabilityChecks(): BurnProbabilityChecks {
  const rows = BURN_PROBABILITY_CURVES;
  const three =
    rows.length === 3 &&
    rows.every(([, , lo, mid, hi]) =>
      [lo, mid, hi].every((v) => v.length === BURN_PROBABILITY_YIELDS_KT.length)
    );
  const rising = rows.every(([, , ...lines]) =>
    lines.every((line) => line.every((v, i) => i === 0 || v >= (line[i - 1] ?? 0)))
  );
  const ordered = rows.every(([, , lo, mid, hi]) =>
    lo.every((v, i) => v < (mid[i] ?? 0) && (mid[i] ?? 0) < (hi[i] ?? 0))
  );
  const [low, high] = BURN_PROBABILITY_WORKED_EXAMPLE_1MT;
  const workedExample =
    low >= WORKED_EXAMPLE_LOW_WINDOW[0] &&
    low <= WORKED_EXAMPLE_LOW_WINDOW[1] &&
    high >= WORKED_EXAMPLE_HIGH_WINDOW[0] &&
    high <= WORKED_EXAMPLE_HIGH_WINDOW[1];
  return { three, rising, ordered, workedExample };
}

export function burnProbabilityTracePasses(checks: BurnProbabilityChecks): boolean {
  return checks.three && checks.rising && checks.ordered && checks.workedExample;
}

/** Rule 117: whether the candidate is adopted. */
export function chooseBurnProbability(input: {
  checks: BurnProbabilityChecks;
  gatePasses: boolean;
  /** The largest factor by which any ring of a net explosion moves. */
  worstRingMove: number;
  /** Rule 19's sweep under the source in place, in this run. */
  invariantsInPlace: number;
  /** Rule 19's sweep with the candidate in place, in the same run. */
  invariantsWithCandidate: number;
}): {
  adopted: boolean;
  trace: boolean;
  gate: boolean;
  rings: boolean;
  invariants: boolean;
} {
  const trace = burnProbabilityTracePasses(input.checks);
  const rings = input.worstRingMove <= 2;
  const invariants = input.invariantsWithCandidate <= input.invariantsInPlace;
  return {
    adopted: trace && input.gatePasses && rings && invariants,
    trace,
    gate: input.gatePasses,
    rings,
    invariants,
  };
}
