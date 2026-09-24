# The independent test — protocol, version 2 (frozen)

Rules 1100–1119, `src/physics/validation/independentTestCharterV2.ts`, written on 24 September 2026
before any source of the third set was opened. A draft: frozen only when the reviewer approves it,
run only after. The first version ([INDEPENDENT_TEST_CHARTER.md](INDEPENDENT_TEST_CHARTER.md)) stays
as written, a historical version suspended as a judge (rule 1099). This version corrects how the
comparison is read, not any number of Nimbus.

Rules 1100–1106 are the first draft. Rules 1107–1113 amend it on the reviewer's first reply: mixed
arrivals made exhaustive, the joint outcome added, the clause of 0.90 withdrawn, D2's numbers, O1's
draws accounted for, the decision's edge cases, and what each observed answer rests on. Rules
1114–1118 amend it on his second: O2 diagnostic for all three models, the two decisive observables
that remain, and arrivals at the crater law's speeds that the law does not resolve.

## Frozen (rule 1119)

On 24 September 2026 the reviewer approved rules 1100–1118 as the judge, with four precisions: where
the sources admit fewer than three bodies for O1 or the ground outcome, the verdict is «adoption not
assessable under version 2», never a threshold loosened; D2's check keeps its declared name in every
result — the share of arrivals at the law's speeds, for S and F the share of fast arrivals, never a
share of craters they predict; J is admissible only where the sources document the regime on three
bodies, never by supposition; and the comparison gives limited evidence of compatibility, distinct
from physical validation. The sources may now be opened, with Andrea's leave for each download, and
the table of eligibility fixed before any prediction, exclusions kept with their reason. The
predictions are not authorized: the next review is that table.

## What is kept and what is dropped (rule 1100)

Kept by number: the models and the set (1039–1041), the observables O1–O4 and their roles (1042, 1043) save O1's selection, the thresholds (1044), O2 as amended (1050, 1051, 1058, 1059, 1077), made diagnostic by rule 1114, the
bands (1053, 1061), eligibility counted first (1054, 1062), an observable lost to a variant (1076),
what may not happen (1045). Dropped: O5 as the composite of rules 1052 and 1060, C3's right answers
of rule 1075, and the transitions of rules 1084 and 1089.

The models (rule 1101): the baseline, S at f1 = 0.50 (0c59e87), F (3586988, run as 9eeed0a ran it,
with rule 1097's warning); S + F not built. No class B from this set: no version of the judge creates
the ground case it lacks.

## The arrivals of a draw (rules 1102, 1107, 1116, 1117)

Every piece or swarm that reaches the ground is classed on its own — **crater** (a crater the
model's own code computes: the baseline's `crater.state` `computed`), **fast** (at 5 km/s or more,
its crater not computed — S and F carry no crater code), **between** (below 5 km/s, above its
terminal speed; a swarm is never at its terminal speed), **dark flight** (at its terminal speed).
Speed alone does not make a crater law applicable: the product's law has one condition of domain,
rule 946's 5 km/s, beside the iron's strewn field; it evaluates no other (size, strength regime,
target) — a limit of the product, stated and not changed here. The draw's state follows by a fixed
precedence: crater, fast, between, dark flight, nothing. For each class the share of draws with at
least one arrival of it and the mean share of the arriving mass in it are published, so that the
state that prevails hides none of the others. These are Nimbus's operational classes, not
measurements of how a real meteorite arrived.

| Draw state  | D1 survival | D2 crater in the law's domain | D3 (description) | J joint | D2's worsening share |
| ----------- | ----------- | ----------------------------- | ---------------- | ------- | -------------------- |
| nothing     | no          | no crater                     | not asked        | no      | no                   |
| crater      | yes         | crater                        | no               | no      | yes                  |
| fast        | yes         | not asked                     | no               | no      | yes                  |
| between     | yes         | not asked                     | no               | no      | no                   |
| dark flight | yes         | not asked                     | yes              | yes     | no                   |

«Out of the domain» is never read as «no crater», nor as «crater», nor as «no meteorites»; a fast
arrival is never called a crater.

## The questions and the decision (rules 1103, 1108, 1110, 1112)

- **D1**, P(material arrives), on all the paired draws.
- **D3**, P(dark flight | material arrives): a description only, published with whether it is
  assessable (at least half the draws arriving); it never decides, is never a success, and a D3 not
  assessable lets no model escape D1.
- **J**, P(material arrives and the draw is in dark flight), on all the paired draws.
- **D2** earns no credit: the number of computed craters and the number of draws in the law's domain
  are published. Its worsening reads, alike for every model, the share of the paired draws with an
  arrival at the crater law's speeds — a crater or a fast arrival — named so, not a share of craters
  nor a probability of «no crater». It worsens where that share exceeds 0.10 on a fall, or the
  baseline's by more than 0.10 — only on the bodies where «no crater» is documented.
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

## What can be assessed, and for whom (rules 1105, 1112, 1114, 1115)

| Observable | Role           | What the source must give                                         | Assessable for   |
| ---------- | -------------- | ----------------------------------------------------------------- | ---------------- |
| O1         | decisive       | flare heights measured from the light curve and the trajectory    | baseline, S      |
| O2         | diagnostic     | the largest recovered mass, measured or a lower bound (rule 1058) | none (no credit) |
| O3         | diagnostic     | at least ten recovered masses and a documented search             | baseline, S, F   |
| O4         | not assessable | the end speed of the luminous flight — no model gives it aloft    | none             |
| Ground     | decisive       | recovery, no crater and regime, each documented (rule 1109)       | baseline, S, F   |

**O2 is diagnostic for all three** (rule 1114): none of the models carries ablation, so its mass at
the ground is not the quantity recovered, and a recovered mass may be only a lower bound. No model
earns credit or is worsened on it; body by body are published the share of draws with a piece at the
ground, the median and 5–95 % band of the largest piece's mass over those draws, and the recovered
mass with its class — a draw with no piece gives no mass, never a zero nor an infinite error. It is
a choice of the judge made before the set is seen, not an observed failure of the models.

**The decisive observables that remain are two** (rule 1115): O1 and the ground outcome. A model is
adoptable only where both are assessable for it and the baseline on at least three admitted bodies,
both improve and neither worsens. **F cannot be adopted in this round**: O1 is not assessable for it
(rule 1094), and the ground outcome alone cannot adopt it. **S** can be adopted only through O1 and
the ground outcome together; where either is not admissible or not assessable on three bodies, it
cannot, and the verdict says so. Rule 1076 applies to O1, not to O2, which is assessable for none.

## The order (rules 1106, 1113, 1118)

These amendments pushed; the reviewer reads them; frozen only on his approval. Then the sources
opened, with Andrea's leave for each download, and pinned into the table of eligibility; then the
predictions, the judge run once, every outcome published even if negative or not assessable. Until
then the third set stays closed. Even frozen and run, the test gives evidence of compatibility or
incompatibility on the observables admitted — never a class B, the set lacking its ground case.
