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
