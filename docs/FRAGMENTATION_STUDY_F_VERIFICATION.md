# The study of F — verification before any case

Rules 1070 and 1078 to 1092 of `src/physics/validation/fragmentationStudyFRules.ts`, run by
`scripts/fragmentation-study-f-verify.ts` on two sets of 90 bodies that are no development case,
drawn by one law (12–30 km/s, 2 500–3 500 kg/m³, 15–90°, S2 log-uniform on 0.9–5 MPa, F's priors
uniform on their intervals): rule 1070's with diameters of 0.3–30 m (seed 1070), rule 1092 (a)'s of
0.05–0.5 m (seed 1092). No case of the round was run and nothing of the third set was opened. This
checks the code against its equations and the baseline; it is no validation against observations.

## Budgets, the bound, the baseline's limit

|                                                                  | Rule 1070 (0.3–30 m)           | Rule 1092 (0.05–0.5 m)          |
| ---------------------------------------------------------------- | ------------------------------ | ------------------------------- |
| Draws completed                                                  | 89 of 90                       | 90 of 90                        |
| Not completed (past 10⁵ components)                              | 1                              | 0                               |
| Draws with a piece on the ground                                 | 89 of 89                       | 90 of 90                        |
| Components, median / largest                                     | 33 / 31113                     | 3 / 60                          |
| Mass residual, worst (≤ 10⁻¹²)                                   | 1.6e-16                        | 1.9e-16                         |
| Energy residual, worst (≤ 10⁻¹²)                                 | 2.5e-16                        | 3.3e-16                         |
| Momentum vector, worst (≤ 10⁻¹²)                                 | 2.5e-16                        | 2.8e-16                         |
| Norm − projection, worst                                         | 1.0e-16                        | 9.2e-17                         |
| f_c = 1: regimes of the baseline                                 | COMPLETE_AIRBURST 85, INTACT 5 | COMPLETE_AIRBURST 45, INTACT 45 |
| f_c = 1: regimes that differ                                     | 0                              | 0                               |
| f_c = 1: worst relative difference (≤ 10⁻⁹)                      | 2.2e-16                        | 3.1e-16                         |
| f_c = 1: values zero in the baseline, worst over their tolerance | 85 values, 0                   | 45 values, 0                    |
| f_c = 1: profile, worst bin over E0 (≤ 10⁻⁹)                     | 1.4e-12                        | 5.0e-12                         |
| Eq. 17 at the burst against Eq. 19's speed                       | 1.2e-12                        | 7.7e-12                         |
| f_c = 0, no further break: draws with two fragments, worst       | 81, 5.8e-16                    | 45, 2.3e-16                     |
| Exact flight against Runge–Kutta (h = 1 m), 30 bodies (≤ 10⁻⁹)   | 1.4e-13                        | 7.0e-10                         |

The baseline has no profile of its own: the one compared is built from its outputs by a loop apart
from F's (rule 1092 (b)). Between breakup and burst both use Eq. 17 in closed form, the only law the
baseline implies there: this checks F's bookkeeping, not that law. With f_c = 0 a fragment faster
than about 14 km/s passes the ceiling of 330 MPa low in the air and breaks again, as rule 1065 (b)
wants; the two-fragment check reads the draws where it does not.

Not completed, Rule 1070 (0.3–30 m): draw 35, 17.15 m, f_c 0.0546, y 0.528, α 0.129 — a low cloud share and a weak strength scaling, the cascade passing 10⁵ components; declared, never cut (rule 1083).

## Convergence on the same draws (rules 1080, 1087 (c), 1091 (b))

| Set                    | Change      | Pairs | Release, worst | Draws ≥ 1 % | Largest piece, median | Survival share | Converged: release / largest / survival |
| ---------------------- | ----------- | ----- | -------------- | ----------- | --------------------- | -------------- | --------------------------------------- |
| Rule 1070 (0.3–30 m)   | bin 50 m    | 89    | 0.001575       | 0           | 0                     | 0              | yes / yes / yes                         |
| Rule 1070 (0.3–30 m)   | bin 200 m   | 89    | 0.4127         | 1           | 0                     | 0              | **no** / yes / yes                      |
| Rule 1070 (0.3–30 m)   | floor 0.1 g | 89    | 0              | 0           | 0                     | 0              | not exercised (rule 1095)               |
| Rule 1092 (0.05–0.5 m) | bin 50 m    | 90    | 0.0009497      | 0           | 0                     | 0              | yes / yes / yes                         |
| Rule 1092 (0.05–0.5 m) | bin 200 m   | 90    | 0.001898       | 0           | 0                     | 0              | yes / yes / yes                         |
| Rule 1092 (0.05–0.5 m) | floor 0.1 g | 90    | 0              | 0           | 0                     | 0              | not exercised (rule 1095)               |

Not converged (rule 1092 (d)), Rule 1070 (0.3–30 m), bin 200 m: draw 84 — 29.4 m, f_c 0.13, α 0.17, 31113 components, the main cloud bursting at 19793 m. Its profile has two maxima: at the finer bin 19750 m (0.04748 of E0) and 27950 m (0.0398 of E0); at the coarser 27900 m (0.05673 of E0) and 19700 m (0.04858 of E0). The burst lays its energy in one bin, whatever the bin's width; the cascade spreads its own over many, so a wider bin gathers more of it. Where the two are close, the bin of the most energy — rule 1091 (c)'s release altitude — changes with the bin. No definition was changed before the reviewer read it; the reviewer chose to keep it and to publish no aggregated release altitude of F as a comparable result (rule 1094).

Every completed draw keeps a piece on the ground whatever the bin or the floor, so the survival share
stays 1 and its criterion is met without being tested.

## The floor (rules 1065 (d), 1080, 1085, 1092 (a))

The floor acts — some piece falls below it — in 0 of 90 draws at 1 g and 0 at 0.1 g (Rule 1070 (0.3–30 m)); 0 of 90 draws at 1 g and 0 at 0.1 g (Rule 1092 (0.05–0.5 m)): fewer than 10, and it is said. On these bodies a fragment stops breaking once past its peak of pressure, and children grow stronger as they shrink, and no cascade that ended came down to a gram: the lightest piece on the ground weighs 0.12 kg (Rule 1070 (0.3–30 m)) and 0.022 kg (Rule 1092 (0.05–0.5 m)). The floor's hypothesis does not weigh on these results; its sensitivity is read on no piece, and reads «not exercised», never «converged» (rule 1095).

The dust's branch is exercised on a body built to reach it (5 cm, 25 km/s, vertical, 0.3 MPa, f_c 0.05, y 0.5, α 0, so that every child breaks where its parent did):

| Floor | Components | Dust, share of the mass | E_dust / ½ m_dust v\*² | Dust written at | Budgets, worst |
| ----- | ---------- | ----------------------- | ---------------------- | --------------- | -------------- |
| 1 g   | 765        | 0.6634                  | 0.999974               | 60450 m         | 0.0e+0         |
| 0.1 g | 6141       | 0.5688                  | 0.999974               | 60450 m         | 7.1e-17        |

At Eq. 11's breakup altitude the pressure is 0.999784 of S2 — Collins et al.'s approximation — so children as strong as their parent fly a few metres more and break at the exact crossing: the dust is born there, in the same bin, at a speed a little below v\*.
