import type { GroundMotionResidual } from '../uq/groundMotionResidual.js';

/**
 * The ground-motion residual of a realisation, drawn in the parts its model
 * gives it, and put to the tolls the band is meant to hold.
 *
 * Every earthquake realisation draws one residual, σ = 0.60 in ln PGA —
 * Boore et al. 2014's total for PGA at M 5.5 and above — and applies it to
 * every place of the footprint and to every quantity alike. A model's
 * scatter has two parts: the between-event τ, which moves one earthquake's
 * every place together, and the within-event φ, which differs from place to
 * place and is correlated over tens of kilometres. A toll is counted over a
 * footprint, so one draw for the whole of it counts all of φ as if every place
 * moved together, and the band is wider than the parts allow. And since
 * rules 66 to 70 a scenario deeper than 70 km is drawn with a model whose own
 * σ is 0.74, which the band does not draw.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out:
 *
 *  - every figure the tolls of rule 11's, rule 45's and rule 61's sets have
 *    read under the residual in place, in the runs of rules 17 to 70;
 *  - the standard deviations OpenQuake gives Boore et al. 2014 and the two
 *    intraslab models, the code of its correlation models, and the
 *    reference values in residualReference.ts;
 *  - the candidate's code, groundMotionResidual.test.ts, residualRun.ts and
 *    scripts/benchmark/residual.ts, written with these rules and run on
 *    nothing. The correlation range was chosen from the model's own
 *    assumption, one Vs30 for a whole footprint, with neither range run.
 *
 * The rules, fixed on 16 September 2026, before the candidate drew a band for
 * any earthquake, and numbered after the seventy before them:
 *
 *  71. The candidate (`betweenAndWithin`). A realisation draws its residual in
 *      the parts of the law that draws the median scenario's rings: Boore et
 *      al. 2014 where that scenario is no deeper than 70 km, the intraslab
 *      model of Abrahamson, Gregor & Addo 2016 where it is deeper. The
 *      between-event part, τ·z₁, is shared by every place and every quantity,
 *      z₁ being the draw the residual in place makes, so a realisation's
 *      magnitude, depth and ground are the same under either. The
 *      within-event part is drawn from a stream of its own, twice: for the
 *      rings and the liquefaction radius as φ·√ρ̄·z₂, its mean over the
 *      footprint; for the accelerations printed at one distance and at the
 *      epicentre as φ·z₃, one place's. For PGA, Boore et al. 2014's τ and φ
 *      by magnitude (0.398 to 0.348 and 0.695 to 0.495 between Mw 4.5 and
 *      5.5), with φ's site term and without its distance term, which begins
 *      at 110 km; the intraslab model's ergodic τ = 0.43 and φ = 0.60. ρ̄ is
 *      the mean, over two points drawn independently and uniformly in a disc
 *      of the area of the median scenario's MMI VII footprint — the stadium's
 *      area where the scenario is one — of Jayaram & Baker 2009's correlation
 *      exp(−3h/b), with b = 40.7 km, their case 2 for PGA, where site
 *      conditions are clustered, as one Vs30 for a whole footprint makes
 *      them; a median scenario with no MMI VII footprint takes ρ̄ = 1. A
 *      scenario whose rings another law or PGV draws keeps the residual in
 *      place. τ, φ and the correlation were held to OpenQuake 3.26.2's
 *      BooreEtAl2014, AbrahamsonEtAl2015SSlab and jbcorrelation within 1e-9,
 *      away from Vs30 = 225 m/s exactly, where OpenQuake subtracts Boore et
 *      al.'s site term twice; ρ̄ to SciPy's integral within one part in a
 *      million; and the sampler to the parts above
 *      (uq/groundMotionResidual.test.ts).
 *  72. The sets and the score. On the browser's ground, each earthquake's
 *      band drawn as rule 63 draws it — 200 realisations, its row's seed, the
 *      fatality curve's scatter drawn — under the residual in place and
 *      under the candidate: rule 11's 406 held-out earthquakes, which
 *      decide, and rule 45's 298 and rule 61's 194, which guard. All three
 *      have been read by rules before, so this is a check that the band
 *      stays honest, not a held-out test (docs/GOLD_STANDARD.md). The score
 *      is Gneiting & Raftery's (2007) interval score for a central 90 %
 *      interval, on log10(deaths + 1): the band's width, plus twenty times
 *      the distance by which the record lies below its lower end or above its
 *      upper end, its mean over the set's earthquakes. The coverage is the
 *      share of the records with something that the band holds, as the
 *      scorecard reads it.
 *  73. The choice. The candidate is adopted when, on rule 11's held-out
 *      earthquakes, its mean interval score is no higher than the residual in
 *      place's and its coverage is 85 % or more, and it passes rule 74's
 *      guards. Otherwise the residual in place stays.
 *  74. The guards. On rule 45's earthquakes and on rule 61's, the candidate's
 *      mean interval score is no more than 5 % above the residual in place's,
 *      and its coverage no more than five points below.
 *  75. What an adoption does, and what is printed. Adopted, every earthquake
 *      realisation — the toll's band and the uncertainty page alike — draws
 *      its residual in two parts: `groundMotionResidual` defaults to
 *      `betweenAndWithin`. The rules that decided before keep their verdicts
 *      and their printed figures move, as rule 44 has it; a gated row of the
 *      net that leaves its band is ungated with its cause, and nothing is
 *      re-tuned (rules 5 and 6). The report prints, whatever they read, each
 *      residual's mean interval score, coverage and median band width on the
 *      three sets, overall and by magnitude cell. Printed beside, deciding
 *      nothing: one draw of the law's own total σ per scenario (`lawTotal`),
 *      to part the law's σ from the averaging over the footprint; and the
 *      net's earthquakes under each residual.
 *
 * What these rules cannot settle. The sets have been read, so the check can
 * stop a candidate that breaks the band's calibration but cannot show it
 * holds on earthquakes no rule has read; the prospective set of rules 27 to
 * 30 will read it. The dead gather where people live, often in one town
 * smaller than the footprint, where the within-event part averages less than
 * over the whole disc, so the band may come out narrower than the dead
 * warrant; and a stadium is read as the disc of its area. The mean of the
 * residual over an area is not the residual of the toll: the toll is not
 * linear in the shaking, and a field that varies inside the footprint lifts
 * some places over an intensity and drops others below it. Jayaram & Baker
 * fitted the correlation on a few well-recorded earthquakes, and its range
 * differs between regions. τ and φ are the laws' ergodic values; the
 * fatality curve's own scatter was measured on ShakeMap intensities and
 * overlaps the residual by an amount not separated here. And a realisation
 * whose depth crosses 70 km keeps the median scenario's τ and φ.
 */

/** Rule 71's candidate and the residual in place, and what rule 75 prints
 *  beside. */
export const RESIDUAL_IN_PLACE: GroundMotionResidual = 'onePerScenario';
export const RESIDUAL_CANDIDATE: GroundMotionResidual = 'betweenAndWithin';
export const RESIDUAL_BESIDE: GroundMotionResidual = 'lawTotal';

/** Rule 72: the central interval the band is, and the penalty per unit
 *  outside it, 2/α. */
export const RESIDUAL_INTERVAL_ALPHA = 0.1;

/** Rule 73: the least coverage on rule 11's held-out earthquakes. */
export const RESIDUAL_MIN_COVERAGE = 0.85;

/** Rule 74: the room on a guard set's interval score (a ratio) and on its
 *  coverage (a share). */
export const RESIDUAL_GUARD_SCORE_ROOM = 0.05;
export const RESIDUAL_GUARD_COVERAGE_ROOM = 0.05;

/** Rule 72: one earthquake's interval score, on log10(deaths + 1). */
export function intervalScore(record: number, low: number, high: number): number {
  const y = Math.log10(record + 1);
  const l = Math.log10(low + 1);
  const u = Math.log10(high + 1);
  const penalty = 2 / RESIDUAL_INTERVAL_ALPHA;
  return u - l + penalty * Math.max(0, l - y) + penalty * Math.max(0, y - u);
}

/** What rules 73 and 74 read of one residual on one set. */
export interface ResidualReading {
  meanIntervalScore: number;
  /** Records held among the rows with something, and those rows. */
  held: number;
  rows: number;
}

const coverage = (r: ResidualReading): number => (r.rows === 0 ? 1 : r.held / r.rows);

/** Rules 73 and 74: whether the candidate is adopted, and why. */
export function chooseResidual(readings: {
  rule11: Record<'inPlace' | 'candidate', ResidualReading>;
  rule45: Record<'inPlace' | 'candidate', ResidualReading>;
  rule61: Record<'inPlace' | 'candidate', ResidualReading>;
}): { adopted: boolean; score: boolean; coverage: boolean; rule45: boolean; rule61: boolean } {
  const { rule11 } = readings;
  const score = rule11.candidate.meanIntervalScore <= rule11.inPlace.meanIntervalScore;
  const covered = coverage(rule11.candidate) >= RESIDUAL_MIN_COVERAGE;
  const guard = (set: Record<'inPlace' | 'candidate', ResidualReading>): boolean =>
    set.candidate.meanIntervalScore <=
      set.inPlace.meanIntervalScore * (1 + RESIDUAL_GUARD_SCORE_ROOM) &&
    coverage(set.candidate) >= coverage(set.inPlace) - RESIDUAL_GUARD_COVERAGE_ROOM;
  const rule45 = guard(readings.rule45);
  const rule61 = guard(readings.rule61);
  return {
    adopted: score && covered && rule45 && rule61,
    score,
    coverage: covered,
    rule45,
    rule61,
  };
}
