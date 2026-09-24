# The independent test — protocol, version 2 (draft, amended)

Rules 1100–1113, `src/physics/validation/independentTestCharterV2.ts`, written on 24 September 2026
before any source of the third set was opened. A draft: frozen only when the reviewer approves it,
run only after. The first version ([INDEPENDENT_TEST_CHARTER.md](INDEPENDENT_TEST_CHARTER.md)) stays
as written, a historical version suspended as a judge (rule 1099). This version corrects how the
comparison is read, not any number of Nimbus.

Rules 1100–1106 are the first draft; rules 1107–1113 amend it on the reviewer's reply (not yet to be
frozen): mixed arrivals made exhaustive, the joint outcome added, the clause of 0.90 withdrawn, D2's
numbers, O1's draws accounted for, the decision's edge cases, and what each observed answer rests on.

## What is kept and what is dropped (rule 1100)

Kept by number: the models and the set (1039–1041), the observables O1–O4 and their roles (1042, 1043) save O1's selection, the thresholds (1044), O2 as amended (1050, 1051, 1058, 1059, 1077), the
bands (1053, 1061), eligibility counted first (1054, 1062), an observable lost to a variant (1076),
what may not happen (1045). Dropped: O5 as the composite of rules 1052 and 1060, C3's right answers
of rule 1075, and the transitions of rules 1084 and 1089.

The models (rule 1101): the baseline, S at f1 = 0.50 (0c59e87), F (3586988, run as 9eeed0a ran it,
with rule 1097's warning); S + F not built. No class B from this set: no version of the judge creates
the ground case it lacks.

## The arrivals of a draw (rules 1102, 1107)

Every piece or swarm that reaches the ground is classed on its own — **crater** (at 5 km/s or more),
**dark flight** (at its terminal speed), **between** (below 5 km/s, above its terminal speed; a swarm
is never at its terminal speed). The draw's state follows by a fixed precedence: crater, then
between, then dark flight, then nothing — a draw is in dark flight only if everything that arrives
is. The shares of the arriving mass in each class are published beside. These are Nimbus's
operational classes, not measurements of how a real meteorite arrived.

| Draw state  | D1 survival | D2 crater in the law's domain | D3 (description) | J joint |
| ----------- | ----------- | ----------------------------- | ---------------- | ------- |
| nothing     | no          | no crater                     | not asked        | no      |
| crater      | yes         | crater                        | no               | no      |
| between     | yes         | not asked                     | no               | no      |
| dark flight | yes         | not asked                     | yes              | yes     |

«Out of the domain» is never read as «no crater», nor as «crater», nor as «no meteorites».

## The questions and the decision (rules 1103, 1108, 1110, 1112)

- **D1**, P(material arrives), on all the paired draws.
- **D3**, P(dark flight | material arrives): a description only, published with whether it is
  assessable (at least half the draws arriving); it never decides, is never a success, and a D3 not
  assessable lets no model escape D1.
- **J**, P(material arrives and the draw is in dark flight), on all the paired draws.
- **D2** earns no credit: the number of computed craters and the number of draws in the law's domain
  are published, and beside them the share of draws with a computed crater over all the draws — the
  share the worsening reads, not a probability of «no crater». It worsens where that share exceeds
  0.10 on a fall, or the baseline's by more than 0.10 — only on the bodies where «no crater» is
  documented.
- **The ground outcome** (one decisive observable) has two deciding measures: D1 on the bodies whose
  recovery is documented, J on those whose regime of arrival is documented. Each improves where its
  mean rises by 0.10 or more over at least three bodies in the priors' domain read for both models;
  each worsens where a body the baseline held at or above 0.90 falls below it or the mean falls by
  more than 0.10. Where J is eligible on at least three bodies the outcome improves only through J;
  D1 alone improves it only where J is eligible on fewer than three — survival cannot be bought with
  arrivals a documented fall contradicts. The clause of 0.90 of rule 1103 (d) is withdrawn.
- **Edge cases.** A measure with fewer than three bodies cannot improve, its worsenings still
  count. D3 assessable for one model and not the other decides nothing; the difference shows in D1
  and J.

## What each observed answer rests on (rule 1109)

Classed body by body when the sources are pinned, before any prediction:

- **Recovery documented** (D1 yes): meteorites recovered and attributed to the fireball.
- **No crater documented** (D2): the circumstances of the finds described — on the surface, in a pit
  of the stone's own size, on a structure — or no crater stated. A report silent on the finds does not
  document it.
- **Regime documented** (J): the traces of the arrival — a pit or penetration of the stone's own
  size, damage to a structure, a witnessed impact — read as an arrival at terminal speed. The end of
  the luminous flight, an end speed of the luminous phase or a dark-flight model alone does not
  document it: the end of the light, the end of ablation, the dark flight and the terminal speed are
  distinct stages.

## O1 (rules 1104, 1111)

The band of the model's release — the baseline's burst altitude, S's m2 — is read on the draws that
produce it with no computed crater, whether material arrives or not, in dark flight or between. Each
draw is counted as one of: release produced; excluded by the selection (a computed crater); not
produced (the baseline intact, S with no share bursting); produced but not convergent. A draw out of
the crater law's domain with no crater is never excluded for it. A non-assessability due to the
selection is said so, never read as a worse photometric prediction. The peak of the energy given to
the air is a proxy of the brightest flare, not the same quantity.

## What can be assessed, and for whom (rules 1105, 1112)

| Observable | Role           | What the source must give                                         | Assessable for  |
| ---------- | -------------- | ----------------------------------------------------------------- | --------------- |
| O1         | decisive       | flare heights measured from the light curve and the trajectory    | baseline, S     |
| O2         | decisive       | the largest recovered mass, measured or a lower bound (rule 1058) | baseline, S (?) |
| O3         | diagnostic     | at least ten recovered masses and a documented search             | baseline, S, F  |
| O4         | not assessable | the end speed of the luminous flight — no model gives it aloft    | none            |
| Ground     | decisive       | recovery, no crater and regime, each documented (rule 1109)       | baseline, S, F  |

**F cannot be adopted in this round** (rule 1112 (c)): O1 is not assessable for it (rule 1094), and
its masses are not comparable with a recovered mass (rule 1097), so neither is O2; both count against
its clause of two (rule 1076), and the ground outcome alone cannot meet it. F's readings are published
as diagnostics. **S and the baseline** carry no ablation either (S's core by assumption, the
baseline's intact body as the product has it): whether O2 stays assessable for them is asked of the
reviewer before the set is opened (rule 1112 (d)).

## The order (rules 1106, 1113)

These amendments pushed; the reviewer reads them; frozen only on his approval. Then the sources
opened, with Andrea's leave for each download, and pinned into the table of eligibility; then the
predictions, the judge run once, every outcome published even if negative or not assessable. Until
then the third set stays closed.
