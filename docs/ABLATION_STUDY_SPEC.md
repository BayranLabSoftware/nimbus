# The study of A — the fragments' ablation (specification)

Rules 1128–1136, `src/physics/validation/ablationStudyRules.ts`, written on 24 September 2026 before
any code. A study of development: no class B, no adoption.

## After the third set (rule 1128)

The round is closed: S not adoptable under version 2, nothing adopted, no class B. The third set has
been read: its six bodies guide development and diagnostics and never again judge an adoption. The
order of what follows: the fragments' ablation first, then a study of the release altitude of strong
bodies (O1 unfavourable on Hamburg for both models), and beside them the search for an admissible
ground case reserved for a new independent test, frozen before it is used.

## What A is (rule 1129)

F with one change: every fragment loses mass by ablation from its birth to the ground, its terminal
speed or the floor. The whole body before its first break and the clouds do not ablate, so the main
break stays the baseline's event and the clouds the baseline's pancake — both declared as limits.

## The law and its prior (rules 1130, 1131)

The classic single-body law dm/dv = σ m v, so m(v) = m_b exp(σ (v² − v_b²) / 2); the diameter follows
the mass at the body's density; drag is Collins et al.'s on that diameter; the strength stays the one
the fragment was born with. The speed solves the α–β problem, by its exponential integral or by
Runge–Kutta, one checked against the other to 10⁻⁹.

| σ (s²/m²)              | Source (as Wheeler et al. 2018 quote them)                       |
| ---------------------- | ---------------------------------------------------------------- |
| 1 × 10⁻⁹ – 5.5 × 10⁻⁹  | aerothermodynamic simulations (Johnston et al. 2018)             |
| 4 × 10⁻⁹ – 8 × 10⁻⁹    | the best fragment-cloud fits of Chelyabinsk                      |
| 5 × 10⁻⁹ (1–15 × 10⁻⁹) | Košice (Borovička et al. 2013a)                                  |
| 1 × 10⁻⁸               | the baseline adopted from Hills & Goda (1993)                    |
| 1.6 × 10⁻⁸             | Popova et al. (2013)                                             |
| 5 × 10⁻⁹ – 3.5 × 10⁻⁷  | the dynamics of Chelyabinsk's fragments (Borovička et al. 2013b) |

The prior: log-uniform on 1 × 10⁻⁹ – 1.6 × 10⁻⁸ s²/m², one σ per draw for every fragment, drawn apart
from F's priors; 3.5 × 10⁻⁷ run apart as a sensitivity. The law and the fitted values come from the
sources; the log-uniform form, the bounds and one σ per draw are Nimbus's choices. Chelyabinsk and
Košice fed the interval: A's results on Chelyabinsk are not independent of it.

## Budgets, verification and the run (rules 1132–1135)

The ablated mass leaves as vapour in the air where it is lost — its mass, its kinetic energy and its
momentum written apart from drag's; a fragment ablating below the floor becomes dust there. Mass,
energy and the momentum vector close to 10⁻¹² of the entry's values, or the draw is void.

Before any case: σ = 0 gives F to the bit; a fragment's speed against Runge–Kutta and its mass against
the closed form, each to 10⁻⁹; the budgets on the 180 verification bodies; convergence on the bin and
the floor (a quantity that does not converge is said and not published as a result; the floor «not
exercised» where it acts on none); the bound of 10⁵ components; a constructed case of a fragment
ablating below the floor. Then, with the reviewer's leave, one run of development on the development
cases and the third set's six bodies, beside the baseline, S and F, with σ from its prior and apart at
3.5 × 10⁻⁷: the ground's classes, D1, J and D3 as descriptions, the largest piece, the surviving mass,
the ablated share, the release altitude by route (c), and for the third set's bodies the largest
piece beside the recovered mass — a lower bound, so a diagnostic, never a verdict of accuracy.

## The outcome (rule 1136)

«Studio A: l'ablazione dei frammenti di F mostra quanto la massa che arriva al suolo, la sopravvivenza
e il regime d'arrivo dipendono dalla perdita di massa in volo, nel dominio delle condriti ordinarie.
Non viene adottata e non riceve una classe B; ogni adozione richiede un nuovo test indipendente, con
un caso al suolo ammissibile congelato prima.»
