# The independent test — protocol, version 2 (draft)

Rules 1100–1106, `src/physics/validation/independentTestCharterV2.ts`, written on 24 September 2026
before any source of the third set was opened. A draft: frozen only when the reviewer approves it,
run only after. The first version ([INDEPENDENT_TEST_CHARTER.md](INDEPENDENT_TEST_CHARTER.md)) stays
as written, a historical version suspended as a judge (rule 1099). This version corrects how the
comparison is read, not any number of Nimbus.

## What is kept and what is dropped (rule 1100)

Kept by number: the models and the set (1039–1041), the observables O1–O4 and their roles (1042, 1043) save O1's selection, the thresholds (1044), O2 as amended (1050, 1051, 1058, 1059, 1077), the
bands (1053, 1061), eligibility counted first (1054, 1062), an observable lost to a variant (1076),
what may not happen (1045). Dropped: O5 as the composite of rules 1052 and 1060, C3's right answers
of rule 1075, and the transitions of rules 1084 and 1089.

The models (rule 1101): the baseline, S at f1 = 0.50 (0c59e87), F (3586988, run as 9eeed0a ran it,
with rule 1097's warning); S + F not built. No class B from this set: no version of the judge creates
the ground case it lacks.

## The three questions of the ground (rules 1102, 1103)

On each draw a model's outcome at the ground is one of four states:

| State       | What it means                                              | Q1 survival | Q2 crater in the law's domain | Q3 out of the domain |
| ----------- | ---------------------------------------------------------- | ----------- | ----------------------------- | -------------------- |
| nothing     | nothing reaches the ground                                 | no          | no crater                     | not asked            |
| crater      | material arrives at 5 km/s or more, the law gives a crater | yes         | crater                        | no                   |
| dark flight | material arrives at its terminal speed                     | yes         | not asked                     | yes, in dark flight  |
| between     | material arrives below 5 km/s, above its terminal speed    | yes         | not asked                     | yes, between         |

For a fall — meteorites recovered, the luminous flight observed to end above the ground — the
observed answers are Q1 yes, Q2 no crater, Q3 outside the domain in dark flight. «Out of the domain»
is never read as «no crater», nor as «crater», nor as «no meteorites».

- **Q1**, decisive: the share of draws on which material arrives.
- **Q3**, decisive: over the draws on which material arrives, the share in dark flight; not
  assessable where fewer than half the draws arrive. The shares out of the domain and between are
  published beside.
- **Q2** earns no credit: its share of craters over the draws in the law's domain is published. It
  worsens where computed craters, counted on all the paired draws, exceed 0.10 on a fall or the
  baseline's by more than 0.10. A draw moved out of the domain neither earns nor loses on Q2.
- **The ground outcome** (one decisive observable) improves where Q1's or Q3's mean share rises by
  0.10 or more over at least three bodies comparable for both models, in the priors' domain, and
  nothing worsens: no body the baseline held at or above 0.90 falling below it, no mean share
  falling by more than 0.10, no worsening by craters. Where the baseline has nothing arriving on a
  body and the model does, the model's Q3 there is read against the fall itself: below 0.90 it bars
  any improvement, so that survival cannot be bought with arrivals the fall contradicts.

## O1 in this version (rule 1104)

The band of the model's release — the baseline's burst altitude, S's m2 — is read on the draws that
give no crater in the law's domain, whether or not material arrives: a fall's meteorites do reach the
ground. F has no release altitude to give (rule 1094): O1 is not assessable for F and, by rule 1076,
counts against its clause of two wherever it is assessable for the baseline. A non-assessability due
to a rule of selection is said so, never read as a worse photometric prediction. The peak of the
energy given to the air is a proxy of the brightest flare, not the same quantity.

## What can be assessed, and on what conditions (rule 1105)

| Observable | Role           | What the source must give                                             | Produced by    |
| ---------- | -------------- | --------------------------------------------------------------------- | -------------- |
| O1         | decisive       | flare heights measured from the light curve and the trajectory        | baseline, S    |
| O2         | decisive       | the largest recovered mass, measured or a lower bound (rule 1058)     | baseline, S, F |
| O3         | diagnostic     | at least ten recovered masses and a documented search                 | baseline, S, F |
| O4         | not assessable | the end speed of the luminous flight — no model gives it aloft        | none           |
| Ground     | decisive       | the recovery documented (Q1); the flight ending above the ground (Q3) | baseline, S, F |

A body is admitted per observable, never pooled across observables; the table of eligibility is
filled, by name, when the sources are pinned and before any prediction.

## The order (rule 1106)

This draft pushed; the reviewer reads it; frozen only on his approval and amended before that by
rules of its own. Then the sources opened, with Andrea's leave for each download, and pinned into the
table of eligibility; then the predictions, the judge run once, every outcome published even if
negative or not assessable. Until then the third set stays closed.
