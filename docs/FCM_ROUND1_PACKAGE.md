# FCM round 1 — the package

Rule 1157 (`src/physics/validation/fcmRound1Rules.ts`): one package at the end of round 1 of the
fragment-cloud entry branch, on the reviewer's leave of 24 September 2026. Everything here is
development: no case in it is a blind test, and nothing is adopted. The plan: rules 1137 to 1147
(`docs/FCM_ROUND_DOSSIER.md`) and 1148 to 1159 (`docs/FCM_ROUND1_PLAN.md`).

## 1. Code and reproducibility

- **The commit**: the one this file is committed in; the rules at 1640839 (pushed before any
  development run); the engine and scripts at 0540942.
- **The engine**: `src/physics/effects/fcmBranch.ts`, not read by the product; its tests
  `src/physics/effects/fcmBranch.test.ts` (18, each named for its rule).
- **The sources**: Register, Mathias & Wheeler 2017 (R17), NTRS 20180003387, 1 699 417 bytes,
  SHA-256 57a14e751e0cff46ba9a431f98f6894404d588a800a643414f9efcbd0bc11c1e; Wheeler, Mathias,
  Stokan & Brown 2018 (W18), NTRS 20180002835, 697 337 bytes, SHA-256
  22cdf4728883b25e3fbcbc5320c895dea0e84eb4a99abd7c4e97d52d487cfff6. Not in the repository (their
  licence), each value used cited by page in the scripts.
- **The atmosphere**: the 1976 standard as `src/physics/effects/ussa1976Entry.ts` implements it
  (rule 912; defining constants below 86 km, Table I's printed rows above, every row tested within
  its last digit), read by the branch through a table of its logarithm every metre, the metres of a
  change of layer and the 86 km join read directly: within 4.7·10⁻¹⁰ of the standard everywhere
  (rule 1153, a test).
- **The runs**: Node 22.20.0 on darwin-arm64; every draw from named streams (FNV-1a and mulberry32,
  `scripts/fragmentationRun.ts`): `fcm-round1/map/<point>/<structure>/<cloud>`,
  `fcm-round1/<case>/<structure>/<cloud>`, `fcm-round1/<case>/inputs`; the development cases' input
  draws on the streams their earlier rounds used. The outputs are deterministic (no clock), but
  `docs/FCM_COST.md`, dated.
- **The scripts**: `scripts/fcm-gate1-convergence.ts`, `scripts/fcm-gate2.ts`,
  `scripts/fcm-gate2-w18.ts`, `scripts/fcm-domain-map.ts`, `scripts/fcm-dev-runs.ts`, with
  `scripts/fcmRound1Common.ts`.
- **The register of deviations**: `docs/FCM_DEVIATIONS.md`.

## 2. Gate 1 — numerical verification

**Built tests, one per limit** (`src/physics/effects/fcmBranch.test.ts`, in the CI):

| Rule     | What the test builds                                                                                    | What it checks                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1141 (b) | Three bodies that never break, σ = 0, g = 0, a straight path, the exponential atmosphere                | Collins's Eq. 8 for the speed, to 10⁻⁶                                                                   |
| 1141 (b) | A body that ablates and never breaks                                                                    | m = m₀ exp(σ (v² − v₀²) / 2), to 10⁻⁶                                                                    |
| 1141 (a) | 40 random bodies — splits, structures with their own groups, both clouds, gravity and curvature         | mass, energy and the momentum vector closed to 10⁻¹²; nothing negative                                   |
| 1138 (b) | A cascade built not to end                                                                              | declared not completed at the bound                                                                      |
| —        | Identical fragments bundled, and flown one by one                                                       | the same ledger, profile and ground, to 10⁻¹²                                                            |
| W18      | Bulk density below the material's; groups with their own α, split and density                           | the unbroken body flies on its bulk diameter; pieces take the material's; landed pieces name their group |
| 1153     | The branch's atmosphere table against the standard's function, every 0.73 m to 120 km                   | within 10⁻⁶ (in fact 4.7·10⁻¹⁰)                                                                          |
| 1154 (b) | A body that never breaks; two that break into clouds                                                    | the balance in flight to rounding; and smaller by more than four at 5 m than at 10 m                     |
| 1155     | A body built to cascade to the floor (α 0, equal halves, no cloud)                                      | dust at 1 g and at 0.1 g, the ledger closed                                                              |
| 1150     | The aggregated tail at a share no piece reaches, and at one many do                                     | nothing changes; pieces turn to clouds, the ledger closed                                                |
| 1151     | Built profiles: one hump; two within 95 %; a lower second hump; a shoulder without a dip; a narrow hump | robustness, both altitudes, the profile at the declared resolution                                       |

**The balances** (`docs/FCM_GATE1_CONVERGENCE.md`). At a break: mass, energy and the momentum vector
close to rounding (10⁻¹⁶ in the published runs) — a numerical conservation. In flight: the energy
given to the air against the drag's work and the ablated mass's energy integrated apart differs by
3.3·10⁻⁸ of the entry's energy at the median of 47 draws and 7.5·10⁻⁶ at most; halving the step
divides it by 2^3.99 at the median — fourth order. Where it converges more slowly, a capped cloud's
radius stops growing inside a step (the order drops there; the residuals stay below 2·10⁻⁷) or the
residual is at rounding. This check found the one fault of the round: a cloud's stiff approach to its
terminal speed held the balance near 10⁻⁶ whatever the step; clouds now settle within 1 % of it
(deviation D9). The analytic mass limit proves the law's implementation, not σ.

**Convergence** (`docs/FCM_GATE1_CONVERGENCE.md`, 48 draws; `docs/FCM_DOMAIN_MAP.md`, 1 028 runs).
Every decisional quantity within rule 1141 (c)'s tolerance under the step halved, on every run of the
map that completed. Under the step doubled or bins of 100 m, 6 of the map's 1 004 completed runs move
the peak's value or altitude beyond it — five bodies below 1 m, whose flares are narrower than a
100 m bin, and one of 300 m at 11.2 km/s and 15°: the reference at 10 m is converged against the
finer step; the coarser resolutions are not fine enough there. The floor: vacuous on every draw of the
priors (no piece fell below 1 g), and where built to act, nothing decisional moves between 1 g and
0.1 g.

**The map of the perimeter** (rules 1149, 1150; `docs/FCM_DOMAIN_MAP.md`):

| Diameter  | Runs  | convergent | not robust | completed only at 10⁶ | not convergent | not completed |
| --------- | ----- | ---------- | ---------- | --------------------- | -------------- | ------------- |
| 0.1–1 m   | 312   | 303        | 4          | 0                     | 5              | 0             |
| 1–10 m    | 280   | 273        | 6          | 1                     | 0              | 0             |
| 10–100 m  | 276   | 244        | 3          | 17                    | 0              | 12            |
| 100–300 m | 160   | 124        | 1          | 22                    | 1              | 12            |
| All       | 1 028 | 944        | 14         | 40                    | 6              | 24            |

Below 10 m every run completes. The 24 not completed are all of bodies from 13.6 m up, and 19 of them
draw α below 0.1 (the median 0.078) with a small cloud share (the median 0.15): long cascades of
unequal pieces, none flying as one. Among the runs above 10 m with α below 0.1, one in three does not
complete. They stay in the denominator. The aggregated tail (rule 1150) is **not verified**: against
the exact flight on the 1 004 completed runs, f_agg = 10⁻⁴ fails on 79, 10⁻⁵ on 26 and 10⁻⁶ on 3 —
mostly the survival, which moves by more than 0.01 of the mass where light pieces become clouds, and
at the coarser shares the peak — so no representation is adopted, and the domain ready for a test must be restricted by a rule written before round 3.
Cost: a map run (seven flights) takes 645 ms at the median and 46 s at the 90th percentile; the
longest, 50 minutes (`docs/FCM_COST.md`).

## 3. Gate 2 — reproduction of what is published

Rule 1159's reading: **R17 reproduced within the quantities its text lets one read; W18 partial, with
its discrepancies named.** Whether that is enough for a test in a restricted domain is the final
review's.

**R17** (`docs/FCM_GATE2.md`). The parameters are all R17's own: its Chelyabinsk inputs, conventions
and Table 1. Unpublished and so chosen: the clouds' end (within 1 % of the terminal speed) and the
integrator (Runge–Kutta, R17's explicit scheme run beside it). The four settings against the excess
over the observed 82–83 kt/km that R17's text states, each end widened by 5 %:

| Setting              | Peak (kt/km) at (km)                        | R17's text                                                  | Inside |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------- | ------ |
| Pancake              | 125.9 at 30.5                               | about 50 % above (W18: 123)                                 | yes    |
| Combination, Fig. 7a | 97.5 at 31.5                                | 15–17 % above                                               | yes    |
| Combination, Fig. 7b | 117.0 at 30.5, a second peak of 9.2 at 22.5 | about 50 % above; a second peak (the figure: ~9 near 23 km) | yes    |
| Independent wakes    | 90.1 at 29.5, 1 048 575 fragments           | 15–22 % above                                               | yes    |

The explicit scheme differs from the Runge–Kutta by less than 0.3 %. The uncertainty of reading: the
excess is R17's words, the observed peak its reading of Brown et al. (2013); the peak's altitude is
read by eye from R17's figures (29–30 km for the pancake), so the 1 km criterion is **not
applicable** and the altitude is reported, not scored; R17 prints no integrated deposition, so the 5 %
criterion is not applicable either.

**W18** (`docs/FCM_GATE2_W18.md`). W18's figures, which hold its groups' shares and strengths, are
images: each structure is rebuilt from W18's text, run at the middle of every stated range and at
every corner of the ranges (a declared development range where W18 is silent and the parameter
matters) — a study of sensitivity, not a reproduction with W18's parameters. Every corner is shown;
none is selected.

| Event       | Corners | W18's statements met, alone                                                                                                      | All at once | Unresolved                                                                                                                                                                                                                                                                                                           |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chelyabinsk | 512     | a peak in the observed band (67–109 kt/km, derived from W18's luminous efficiencies): 256; the landed mass in 5 000–6 500 kg: 16 | 6           | where the meteorites come from: at the middle, 3.5 % from the weak group (W18: ~50 %), 63 % from the strong group (W18: ~9 %); the largest piece 368–1 520 kg over the corners (W18: ~340 kg)                                                                                                                        |
| Tagish Lake | 64      | the flare near 32 km: 32; near 36 km: 64; near 47 km: 64; the landed mass in 100–1 000 kg: 32                                    | 0           | the landed mass reaches 100 kg only with σ low (10⁻⁹), which moves the 32 km flare to 30.5 km; W18 does not state σ for Tagish Lake                                                                                                                                                                                  |
| Košice      | 128     | the flare near 37 km: 0; near 53 km: 0                                                                                           | 0           | the main flare at 35.5 km for W18's ~37 (38.3 km the main piece's first break); no flare near 53 km: the strengths W18 states (35–40 and 55–70 kPa at 15 km/s) break the two small pieces at 61–65 km in the 1976 atmosphere, and the rebuilt structure deposits its upper hump at 59–60 km, at 4 % of the main peak |

Whether the Košice and Tagish Lake discrepancies lie in W18's text, in the parameters it leaves
unsaid or in the branch cannot be told without W18's figures.

## 4. The observational development

Rule 1156 (`docs/FCM_DEV_RUNS.md`): 18 declared development cases — rule 961's nine, the third set's
six, W18's Košice, Benešov and Tagish Lake — 200 draws each, under both structures and both clouds,
paired with the baseline on the same input draws; the judgement fixed before any run. None of it is a
blind test: every case is development, and several were read and tuned on before.

**The main flare.** Over the 72 comparisons (18 cases × 4 configurations): 25 favourable, 19 equal,
0 unfavourable, 28 not assessable (no observed interval in the repository, or a release produced in
too few draws). Favourable means closer than the baseline, not close:

| Case        | Observed (km)                    | Branch's median, M1 · unlimited (km) | Its distance | Baseline's distance |
| ----------- | -------------------------------- | ------------------------------------ | ------------ | ------------------- |
| 2008 TC3    | 36.5–37.5                        | 30.7                                 | 5.8          | 10.7                |
| 2018 LA     | 28.65–28.75                      | 34.9                                 | 6.2          | 8.0                 |
| 2022 EB5    | 33.25–33.35                      | 32.5                                 | 0.8          | 2.2                 |
| 2023 CX1    | 27.05–28.15                      | 32.2                                 | 4.1          | 5.4                 |
| 2024 BX1    | 33.85–35.25                      | 33.6                                 | 0.3          | 0                   |
| Hamburg     | 16.65–29.15 (widened, rule 1126) | 33.7                                 | 4.6          | 6.4                 |
| Košice      | 36–38 (W18's words, ±1 km)       | 32.3                                 | 3.7          | 12.7                |
| Tagish Lake | 31–33 (W18's words, ±1 km)       | 32.1                                 | 0            | 22.1                |

Golden, Madura Cave and Traspena fall inside their (wide) intervals under both models. Within 1 km of
the observed flare: 2022 EB5, 2024 BX1, Tagish Lake; 4 to 6 km off: 2008 TC3 (below), 2018 LA,
2023 CX1, Hamburg (above), Košice (below). The spread between the four configurations on the main
peak is 0.4 to 2 km for the bodies below 10 m, 4 to 5.5 km for Chelyabinsk, Tunguska and 2022 EB5.

**The first event.** 10 favourable, 4 unfavourable (2024 BX1 and Benešov under M1), 2 equal, 56 not
assessable. The structural uncertainty dominates: M1 first breaks at its strength S2 (32–43 km), M2 at
its release S1 (57–65 km) — a spread of 25 to 29 km on every case. The first event is not a quantity
this branch can claim.

**The ground.** In every case, every configuration and every draw, something reaches the ground, and
far too much of it: at the median, Chelyabinsk 24 to 450 t against Popova et al.'s 4 to 6 t (as W18
cites them), Tagish Lake 7 to 10 t against W18's 190 kg, 2008 TC3 7 to 10 t (its meteorites 283 g at
most), Tunguska some 850 t where nothing was found. The «favourable» survival verdicts (the baseline
never lands anything where meteorites were recovered) are hollow. No recorded mass is contradicted —
the rule reads recovered masses as lower bounds, and the branch is above them all. No arrival reaches
the crater law's 5 km/s in any case under either model, Carancas included (its crater verdict «equal»,
zero under both).

**The registered tuning** (rule 1160, `docs/FCM_TUNING.md`), written after these runs and before any
tuned one: T1 (the cloud share on 0.5–0.85, W18's fits of main flares) cuts the landed mass by 1.2 to
9 times, T2 (also α on 0.05–0.3) by 2.5 to 23; the main flares barely move (2022 EB5 from favourable to
equal in three configurations). Neither meets the objective in any configuration — under M1 with clouds
unlimited, T1 brings Chelyabinsk to 5.1 t but leaves Tagish Lake at 2.7 t, T2 misses both by a hair
(1.44 t against 1.67; 1.33 t against 1.30); with M2 or capped clouds the landed mass stays several
times higher. By the
rule, the untuned priors stay and the ground outcome is **not credible in mass**.

**Sensitivities** (M1, clouds unlimited, the same draws). The exponential atmosphere lifts every main
peak by 2 to 3.5 km — four favourable verdicts turn unfavourable (2018 LA, 2023 CX1, 2024 BX1,
Hamburg): the release altitude depends on the atmosphere at that level, and the 1976 standard is the
reference. C_disp 0.1 lowers the peaks by 0 to 7 km; three or four fragments per break land more
mass; a strength scaled with the body's size moves the large bodies most (Chelyabinsk's peak to 58 km,
its landed mass to 3.4 t; Tunguska's peak to 87 km).

## 5. The proposal, bounded

**Ready in a restricted domain — for the atmospheric release only.** The claim offered to round 3:
the altitude of the main deposition peak (rule 1151's sliding window, robust draws; both altitudes
where not robust) of stony bodies of 0.1 to 10 m, 1 500 to 4 000 kg/m³, 11.2 to 30 km/s and 15° to
90°, on the 1976 standard atmosphere. Why this and no more:

- **Gate 1** holds there: every run of the map below 10 m completes (592 of 592); every decisional
  quantity converges against the halved step; the balance in flight converges at fourth order; the
  five runs that do not converge against the coarser step or bins are small bodies whose flares are
  narrower than 100 m, reported at 10 m. Gate 1 is not claimed above 10 m.
- **Gate 2**: R17 reproduced within what its text lets one read; W18 partial, its discrepancies named
  (Košice's flares, Tagish Lake's landed mass against its lowest flare, Chelyabinsk's meteorites by
  group).
- **Development**: no main flare worse than the baseline's in 72 comparisons; within 1 km on three
  cases, 4 to 6 km off on five — the accuracy the development cases show, not a blind estimate.

**Not claimed, and why:**

1. **The ground outcome** — the landed mass is 10 to 100 times the references at the median, and the
   registered tuning did not bring it within them (rule 1160): not credible in mass. It needs its own
   round, on the physics of what survives (the fragments stop breaking and fall; W18's fits land
   0.05 % of Chelyabinsk where these priors land 0.2 to 3.4 %), not a narrower prior.
2. **The first event** — the two structures put it 25 to 29 km apart on every case.
3. **Bodies above 10 m** — 24 of 436 map runs do not complete, 39 complete only with 10⁶ components,
   and the aggregated tail is not verified; by rule 1150 the ready domain is restricted, by a rule to
   be written before round 3 (proposed: 0.1 to 10 m).
4. **The peak's value in kt/km** — no development case in the repository holds an observed deposition
   curve with its uncertainty; the value is reported, not claimed.

**What to freeze.** The priors of rule 1152 as they stand (neither tuning changed the release), with
both structures and both clouds pooled into one predictive distribution, equal weights — the
structural uncertainty they carry stated with it: 0.4 to 2 km on the main peak below 10 m. Beside it,
the atmosphere's: 2 to 3.5 km between the 1976 standard and the exponential. The round-3 test would
then set the frozen branch's main-release altitude against the baseline's on the fourth set's events
of 0.1 to 10 m with measured trajectories and flares, under the charter v3.

If the reviewer judges the 4 to 6 km misses, or the failure on the ground, as reasons to stop, the
proposal is «not ready», and the next round is the ground physics.

## The register of deviations

`docs/FCM_DEVIATIONS.md`, D1 to D13.
