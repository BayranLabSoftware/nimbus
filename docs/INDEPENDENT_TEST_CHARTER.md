# The charter of the independent test

The rules are 1038 to 1047, in `src/physics/validation/independentTestCharter.ts`; this page is
their readable form. Written on 24 September 2026, on the reviewer's order after the study of S:
lock how S, F or S + F could one day be judged, before F is written, without reopening the third
set. The test is not run now.

## Why

S ran as a study of development: one metric could be evaluated, and its dominant error — a
surviving core from about six to over twenty thousand times heavier than the meteorites recovered —
shows that the closure «broken within 5 MPa, the rest intact» does not describe the cascade of
fragments. F (the fragments slowing by their size) is motivated by that error and will be a study
too. Whether any of them is ever adopted is decided by this test and by nothing else.

## The models judged

Each model is frozen at a commit before its predictions: the baseline (the product's branch when
the last candidate is frozen); S as its study ran it (0c59e87) at f1 = 0.50 — 0.25 and 0.60
published beside as sensitivity; F and S + F as their studies will freeze them. A model changed
after freezing is a new model. The baseline is judged beside every model on the same draws.

## The set

The third set as rules 941 to 944 froze it: Winchcombe, Golden, Madura Cave, Hamburg, Traspena and
Cavezzo, admitted or dropped by rule 934 when their sources are pinned; Arpu Kuilpu and Kindberg on
their conditions. No event is added; an event read for development leaves for good. Sources are
pinned only after the last model is frozen. An observable a source gives only through a model
fitted to the event does not count for that event.

**Composition.** The priors describe ordinary chondrites. A body of another known type — Winchcombe,
a CM2 — runs under the same model and priors as a control of robustness: published, counted in no
decision, unless a model declares priors for its type before its freezing. A body of unknown or
uncertain type is read as sensitivity with the ordinary chondrites' priors.

## The primary observables, kept apart

| Observable                                 | Reads                                                                                                          | Role                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| O1 flares' altitude                        | E3: the model's release against the measured flare heights widened by 5 km, on the draws with the outcome      | decisive where flares were measured                 |
| O2 largest recovered meteorite             | the model's largest piece at the ground; the recovered is a lower bound unless the search is declared complete | decisive where given                                |
| O3 distribution of recovered masses        | pieces heavier than each recovered quartile; needs ≥ 10 stones and a documented search                         | diagnostic unless its conditions hold on ≥ 3 bodies |
| O4 speed at the end of the luminous flight | the model's largest piece at the observed end height                                                           | diagnostic unless measured on ≥ 3 bodies            |
| O5 regime at the ground                    | rule 1011: survival, regime of arrival, observable crater — against a fall                                     | survival and regime decisive; the crater diagnostic |

A decisive observable needs at least three bodies in the priors' domain; with fewer it is reported
body by body and decides nothing. "Out of the domain" never reads as "no crater".

## The thresholds, fixed before any prediction

- **O1**: compatible where E3 holds; improves with at least one more compatible body than the
  baseline and none lost.
- **O2**: compatible where the recovered mass lies inside the model's 5–95 % band widened ×3 each
  way; error |log10(median / recovered)|; improves where the median error falls by at least a
  factor of two and no compatible body is lost.
- **O5**: the share of draws giving the observed survival and regime; improves where the mean share
  rises by 0.10, with no body falling below 0.90 where the baseline was at or above it.
- A band more than 1.5× the baseline's voids a body's improvement. A model **worsens** where it
  loses a body the baseline held on any decisive observable, or an O5 share falls by more than 0.10.
- A model is **adoptable** only where it improves at least two decisive observables and worsens
  none. A class B is another question (rule 939): this set has no admitted ground case yet.

## The amendment (rules 1049 to 1055)

The reviewer approved the separation of the observables and the freezing of the models, and asked
that five points become rules that execute. Each is a tested function of the charter's file.

- **O2, an incomplete recovery.** Each largest recovered mass is classed when its source is pinned:
  _measured_ (the source names it the main mass, or declares the strewn field searched) or a _lower
  bound_. A lower bound fails where the model's 95th percentile lies below it; above it the body is
  compatible, with no error computed and no credit of accuracy. Only a measured mass takes the ×3
  tolerance and an error |log10(median ÷ recovered)|.
- **O2, the improvement.** Either one more compatible body with none lost, or — on at least three
  measured bodies — the median error falling by a factor of two with none lost. A baseline already
  within a factor of two leaves no accuracy to claim.
- **O5, a composite.** Survival (C1), regime of arrival (C2) and observable crater (C3), each read
  on its own, each with its applicability per body and its answer per draw; out of the domain is
  never "no crater" but a draw not assessable; a component assessable on fewer than half its draws
  is not assessable on the body. C1 and C2 decide; C3 is diagnostic, save that a computed crater in
  more than a tenth of a body's draws worsens O5.
- **The bands.** The width of the 5–95 % band of the compared quantity — the release altitude in
  km (O1), the log10 of the largest mass (O2); conditioned bands compared only with at least 50
  conditioned draws on each side; a baseline band narrower than 0.5 km or 0.05 dex taken at that
  floor.
- **Eligibility.** Counted first, by name, observable by observable; a decisive observable with
  fewer than three bodies is not assessable and never completed from another's; the clause of two
  improved observables counts assessable ones only.

Unchanged: no class B with this set (no admitted ground case), none added after a model's
performance has been seen; f1 = 0.50 for S; Winchcombe a control. The amendment authorizes no
prediction and no adoption; F's specification may now be written, as a study of development.

## The second amendment (rules 1057 to 1062)

- **Measured, from the evidence.** A stone called «the main mass» is a lower bound unless its
  source documents the completeness of the search; the class is fixed from the recovery's evidence
  before any prediction. Above a lower bound the verdict is «not incompatible», never «compatible».
- **O2's error.** The point prediction is the median of the largest piece at the ground (zero where
  none arrives: an infinite error); the error is computed on measured masses whether or not the band
  crosses them; baseline and model on the same measured bodies; the factor-of-two clause read on
  the baseline's median error.
- **O5.** The crater's worsening only on a fall and on the draws where the model is in the crater's
  domain; C1 and C2 keep their gain of 0.10 and their floor of 0.90; O5's improvement can be claimed
  only with C1 and C2 each assessable on three bodies, while a worsening always counts.
- **The bands.** Compared on the same bodies and, when conditioned, on the same paired draws (at
  least 50); the floors stabilize the ratio and license no widened band.
- **The table of eligibility**, published empty: docs/INDEPENDENT_TEST_ELIGIBILITY.md.

## The third touch (rules 1075 to 1077)

- **O5's crater cannot be dodged.** Computed craters are counted on all the paired draws, never on
  those left in the domain; each body's three shares — crater, no crater, out of the domain — are
  published for the baseline and the variant; a variant worsens where its computed craters pass
  0.10 of the draws, or the baseline's by more than 0.10. A draw out of the domain is never "no
  crater" and never a success.
- **An observable lost to a variant** stays counted for the baseline, earns the variant nothing,
  and counts against the clause of two.
- **O2's infinities.** Two infinite errors compare equal. The point prediction stays the median over
  all draws, so a body with survivors in fewer than half its draws has an infinite error and, on a
  measured mass, is incompatible; its survival share is published beside, survival judged by C1.

## O5 and the flight out of the domain (rule 1084)

On each fall the paired draws are read as transitions — crater, no crater, out of the domain —
and the 3 × 3 table is published. Crater → out earns nothing; no crater → out is a loss; the only
crater gain is crater → no crater, net. Where the net share of draws moved out of the domain exceeds
0.10 on any fall, the variant earns no credit on O5 at all, whether its craters fall or not.

## The nine transitions (rule 1089)

| baseline \ variant | computed | no crater | out of domain |
| ------------------ | -------- | --------- | ------------- |
| computed           | 0        | +1        | 0             |
| no crater          | −1       | 0         | −1            |
| out of domain      | 0        | +1        | 0             |

C3's score is the sum over the paired draws divided by their number — the change of the share of
«no crater»; below −0.10 on any fall it worsens O5. The veto on a net flight out of the domain
(rule 1084) and the test on computed craters (rule 1075) apply in addition, never in its place.

## Frozen (rule 1093)

On 24 September 2026 the reviewer approved the charter as the judge, rule 1089 completing the scoring
of the transitions, and froze it; its execution is not authorized. Rules 1038–1062, 1075–1077, 1084
and 1089 are the judge as written: no threshold, definition or scoring changes, before the third set
is opened or after. F is not adopted and no class B is given; the frozen set still lacks the
admissible ground case, so no outcome of it alone promotes the cratering.

## What may not happen

No law of F, fragment size, upper edge of the strengths, f1 or closure is chosen, tuned or checked
against the set; its sources stay closed until the last model is frozen; the test runs once per
frozen model and its outcome is published as it comes. No threshold moves after this charter save
by a rule pushed before any prediction. What was seen of the set is only rule 943's quoted values,
and none of them is used to write F.

## The order

This charter; then F's specification before its code, and F as a study of development with S's
discipline (budgets, convergence, the three observables non-decisional, no automatic promotion),
its fragments slowed and spread by their physical size, never by numerical shares; then S + F if
the studies call for it; then the models frozen, the sources pinned, the predictions made, the test
run once.
