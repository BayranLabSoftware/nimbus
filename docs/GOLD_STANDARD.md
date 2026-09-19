# What a 9 is

On 15 September 2026 Andrea asked how far each domain of Nimbus stands from
a 9 out of 10 against the goal the project has set itself: to be the
software a paper cites because it is accurate and precise
([ROADMAP.md](ROADMAP.md), "The goal this is all for"). The answer that day
was a reading — impacts 6.5, explosions 6, earthquakes 5, waves 5 (6 for
waves from earthquakes, 3 for waves from landslides), volcanoes 4 — and a
reading moves with whoever makes it. The rules below replace it with a bar
that does not move: written before any work towards it, and changed only as
the last section allows.

## How the rules are read

- A domain has a 9 when every rule that applies to it holds at one commit,
  read from the validation report that commit regenerates. A rule not yet
  measured does not hold.
- Nimbus has a 9 when every domain has one and rules C1 to C3 hold.
- There is no 10. Below 9 a grade is a count, not a reading (since
  16 September 2026, at Andrea's request): each domain is scored on its own
  rules and on the rules of every domain that apply to it, each counted once;
  a rule that lists clauses earns the share of them that holds, and a rule
  that does not hold, or is pending, earns nothing. The grade is 9 × what is
  earned over the rules, cut to one decimal, so it reads 9 only when every rule
  holds. `src/physics/validation/goldStandardScorecard.ts` holds each status
  with its evidence, and the validation report prints the count at every
  commit ("Toward a 9"). A status changes only with the verdict that changes
  it. Beside the count the report prints two measures of the same rules,
  fidelity and beyond (the second amendment below); neither is a 9.
- Where the field has a tool that makes the same estimate for the same
  events, a bound is read against that tool on the same rows, so that a 9
  means as good as the field and never better than the field can be.
  Every other bound is the project's choice, and this file says so by giving
  no other source for it.

The terms are the validation report's:

- **Held-out set:** rows chosen by a rule committed before the version of
  the model it tests was fixed, and not used to choose, tune or guard that
  version. A set a rule has read — as a candidate's score, a guard or a
  check — is not held out again ([BENCHMARK_PROTOCOL.md](BENCHMARK_PROTOCOL.md)).
- **Bias:** the geometric mean of model over record, over the rows where
  both are above zero. **Within ×k** is between 1/k and k.
- **σ_ln:** the standard deviation of ln(model / record) over the same rows.
- **Band:** the 5–95 % interval the product prints. **Coverage:** the share
  of held-out rows whose record lies inside the band, over the rows where the
  record or the band is above zero. **Width:** the ratio of the band's upper
  end to its lower end, a lower end of zero read as one, its median over the
  same rows.
- **Cell:** the size cells the scorecard uses for the family.

## Where a 9 is pursued

Chosen with Andrea on 16 September 2026, and written here so that a reader
sees a choice of scope and not a bar lowered after it was missed. It changes
no rule, no bound and no status.

- **A 9 is pursued on impacts, explosions, volcanoes and waves from
  landslides.** The tools their rules read against — the Earth Impact Effects
  Program, Glasstone & Dolan and Kingery–Bulmash, Mastin et al. and Tephra2,
  the impulse wave manual — are closed forms or small programs, which a
  browser can match, and every rule of those domains can be reached by
  matching them and by the work their rules ask beyond them.
- **Earthquakes and waves from earthquakes are measured and declared.** A 9
  there asks for what ShakeMap and GeoClaw compute — ground motion conditioned
  on stations and finite ruptures, waves carried over real bathymetry — and
  reaching it means rewriting those systems inside a browser. The aim set that
  day was a 7, when a grade was still a reading and not yet the count below.
  The count reads both domains against every rule of this file, unchanged.

- **Amended 20 September 2026, by Andrea's decision: a 9 IS now pursued on
  earthquakes.** The paragraph above stands as it was written and is not
  rewritten, because it says what a 9 there costs and that has not changed:
  ground motion conditioned on stations and finite ruptures, measured against
  what ShakeMap computes on the same rows. What changed is the choice of what
  to spend, and who made it — "i terremoti potremmo anche portarli a 9, decido
  io quando basta". The aim is recorded here on the day it was taken so that a
  reader sees a scope widened deliberately and not a bar quietly moved; no
  rule, bound or status of this file changes with it, and the count below is
  the same count.

  The work it opens was ordered, and the ordering was wrong, which is itself
  recorded: rules 286 to 294 of `validation/faultStrikeRules.ts` put the fault
  strike first and Slab2's subduction geometry second, and the first candidate
  was refused because four of the six presets a strike is decided on are
  subduction earthquakes, whose interface a database of crustal faults does not
  carry. Slab2 comes first.

  **The second candidate was accepted, on 20 September 2026.** Rules 295 to 303
  of `validation/slabStrikeRules.ts` were fixed and pushed before it was
  written, and they decide it: with Slab2 under the strike the six presets are
  answered six of six, the worst error is 11.5° against a 25° bound, due north
  — what is being replaced — is beaten on every one of the six, and 218 911
  bytes are shipped against a budget of 1.5 MB. Four of the six are answered by
  rule 296 alone, the hypocentre within the model's own published uncertainty of
  the mapped interface, so rule 297's capacity clause — the one written for
  Valdivia, whose Mw 9.5 the first round handed to a crustal fault 22 km away —
  never had to fire. Gorkha, which the first round recorded as permanently
  UNKNOWN because the GEM database maps no thrust within 90 km of it, is
  answered to 8.2°: Slab2 carries the Main Himalayan Thrust that the fault
  database does not. What was missing was the file and not the law.

The reason is the one the work of 15 and 16 September showed: effort spread
over six domains moved each of them by a tenth. A project that says where it
aims for a 9 and where it does not makes a claim that can be checked; one that
aims for a 9 everywhere and stays at 5 everywhere makes none.

## Every domain

**G1. Verification.** Every relation that sets a number the product prints
is held, by a test that runs in CI, to a reference implementation — its
authors' code, or an implementation the field uses — within 1 % or the
reference's printed rounding, on a grid that reaches both ends of every
input the form accepts. Where no implementation exists, the relation is held
to its source's tables or figures, within the reading accuracy the test
states. A deliberate departure from the reference is allowed where the
report names it and gives the reason.

**G2. Accuracy.** Each quantity a domain's rules name meets its bias and
σ_ln bounds on a held-out set of at least the size its rule names, overall
and in every cell with twenty scored rows or more.

**G3. Precision.** Each quantity a domain's rules name carries a band. On
the held-out set its coverage lies between 85 % and 95 % overall and is at
least 80 % in every cell with twenty rows or more — at least 80 % overall on
a set of fewer than twenty rows — and its median width is no more than
exp(3.29 σ), σ being the quantity's σ_ln bound: the width of a 5–95 % band
that would be exactly calibrated at that bound. A record held by a band
wider than that is not counted as held.

**G4. The input space.** For every input the form accepts, the product says
whether the scenario lies inside the cells the held-out sets measured, and
the report gives each quantity's G2 and G3 figures cell by cell. Nothing is
printed outside the measured cells without that warning.

**G5. Robustness.** Five thousand random scenarios of the family, drawn
across the form as the benchmark's invariants draw them, all finish, give
finite numbers, no area larger than the Earth and no distance past the
antipode, and are monotone wherever the physics is; for every preset and for
the sweep, the application prints what the model computes in Node.

**G6. Gaps.** Every gap is declared in the report, and a 9 carries no gap
but the ceilings listed below.

**G7. Method.** Every default that changes on the way to a 9 changes by rules
written before its candidate was run, and every outcome, adopted or not, is
recorded ([BENCHMARK_PROTOCOL.md](BENCHMARK_PROTOCOL.md)).

## Earthquakes

**E1. The footprint.** On a held-out set of at least 300 USGS ShakeMaps of
every depth, rule 28's score (`src/physics/validation/prospectiveRules.ts`)
is at least 0.50, and at least 0.40 on the maps drawn on a finite rupture or
with ten stations or more; its sharpness is no more than 0.35. The band of
the MMI VII radius meets G3 against each map's equivalent radius with σ =
0.52, the σ whose median absolute log error is 0.35.

**E2. People exposed.** On at least 100 held-out earthquakes with a USGS
PAGER exposure, the people at MMI VII and above are within ×1.5 of PAGER's,
with σ_ln no more than 1.0. PAGER's exposure is itself a model, so this rule
reads accuracy only.

**E3. Deaths.** On a held-out set of at least 100 earthquakes whose record or
band is above zero, each with a PAGER loss estimate: bias within ×1.5 overall
and in every cell, and σ_ln no more than PAGER's own estimates read on the
same rows plus 0.25. Of the quiet earthquakes of the same window — those NCEI
holds no record of — no more than 2 % have a median toll of ten or more.

**E4. The band of deaths** meets G3 with σ equal to E3's bound on that set.

**E5. The cells of G4** are the scorecard's magnitude cells and four depth
cells: to 40 km, from 40 to 70, from 70 to 300, and deeper.

## Waves from earthquakes

**T1. The deep ocean.** On a held-out set of at least 100 DART records from
at least ten earthquakes, one of them with a rupture 500 km long or more:
bias within ×1.25 at the median event, σ_ln no more than 0.50 over the
records, and bias within ×1.5 beyond 7 000 km.

**T2. The coast.** On a held-out set of at least 500 run-up and water-height
observations of NOAA NCEI's Global Historical Tsunami Database, from at least
ten events, the observations within each 50 km of coast read as their median:
bias within ×1.5, σ_ln no more than 0.8.

**T3. Arrival.** The first arrival at a DART buoy within 5 % of the travel
time or 5 minutes, whichever is larger, on 90 % of T1's records.

**T4. Deaths on the coast.** On a held-out set of at least fifteen tsunamis
with a counted toll: bias within ×2, σ_ln no more than 1.5.

**T5. Bands.** T1's amplitudes, T2's coastal medians and T4's tolls meet G3
with their rules' σ bounds.

## Waves from landslides

**L1.** The relation that makes the wave is held to its source's worked
examples within 1 % and to the ranges of the experiments it was fitted on
(G1), and the product warns outside those ranges (G4).

**L2.** On a held-out set of at least ten landslides with a published slide
volume and a measured wave or run-up near the source: bias within ×1.5, σ_ln
no more than 0.7.

**L3.** Every wave figure the product prints for a landslide carries a band
drawn by a Monte Carlo sampler, meeting G3 with L2's σ bound.

## Impacts

**I1.** G1 against the Earth Impact Effects Program (Collins, Melosh & Marcus
2005, with Collins et al. 2017's air blast) on every quantity both print: the
entry, the burst, the speed and energy at the ground, the crater's diameters
and depth, the fireball and its horizon, the thermal exposure, the ejecta,
the air blast of airbursts and of ground impacts, the seismic magnitude and
the impact tsunami. Every departure carries its reason.

**I2. Entry.** On the fireballs of NASA JPL's CNEOS catalogue that give an
altitude, a speed and an energy — at least 300, held out — the altitude at
which the model's body deposits its energy lies within 5 km of the altitude
of peak brightness in median absolute error, with a mean error within 3 km,
for bodies of the form's default composition.

**I3. Air blast.** The band of an airburst's blast radius holds every
measured airburst footprint — the forest flattened at Tunguska, the windows
broken at Chelyabinsk — and at least 90 % of the shock-physics runs of
Collins et al. 2017, and its width in radius is no more than ×3. Both
footprints and those runs have been read, and no other exists: this rule is a
check, not a held-out test.

**I4. Tolls.** The people inside each ring are counted within 5 % of an exact
count on the same raster, and the toll carries the ceiling below.

## Explosions

**N1.** G1 against Glasstone & Dolan 1977 for every effect the product
prints — overpressure with range and height of burst within 10 % in range,
the fireball within 5 %, thermal fluence and its partition within 15 %, burns
at exposures that grow with yield (Fig. 12.65), initial radiation dose within
20 % in range, the crater within 20 %, the water wave within the book's own
35 % — and against Kingery–Bulmash within 10 % in range for a charge on the
ground; where the book gives a curve, no fit of the project's stands in for
it.

**N2. Damage.** On a held-out set of at least eight accidental explosions
with a published yield and a mapped damage radius: radius bias within ×1.25,
σ_ln no more than 0.3.

**N3. Deaths.** On a held-out set of at least ten explosions with a published
yield and a counted toll — Hiroshima 1945 and Beirut 2020 are tuned and do
not count: bias within ×2, σ_ln no more than 1.0, and a band that draws the
scatter of the mortality and of the population, not the yield's alone,
meeting G3.

## Volcanoes

**V1.** G1 for the column, the ash and the flows: the ash held to Tephra2 on
its own grid where the model is Tephra2's, and the reach of pyroclastic
currents and lahars to LaharZ (Schilling 2014) on the same terrain within 10
% in area, where the model is LaharZ's; any other model to its own reference
implementation.

**V2. Columns.** On a held-out set of at least 30 eruption phases not in
IVESPA 1.0, which has been read: bias within ×1.15, σ_ln no more than 0.35.

**V3. Ash.** On a held-out set of at least ten eruptions with a published
isopach map: the area inside the 1 cm isopach with bias within ×2, σ_ln no
more than 0.7.

**V4. Flows.** On a held-out set of at least 30 pyroclastic currents and
lahars with a published volume and runout: runout bias within ×1.5, σ_ln no
more than 0.5.

**V5. Deaths.** On a held-out set of at least fifteen fatal eruptions,
counting the dead of the mechanisms the product draws and declaring the rest
row by row: bias within ×3, σ_ln no more than 1.2.

**V6. Bands.** V2 to V5 meet G3 with their rules' σ bounds.

## Ceilings

The only gaps a 9 may carry, because no model of this kind can close them:

- **An impact's death toll.** No impact in recorded history left one (I4).
- **The elongated footprint of a shallow airburst,** which only
  three-dimensional shock-physics codes have reproduced: a round footprint is
  allowed where I3's band holds the measured ones.
- **Deaths no count of the prompt effects can see** — disease, famine,
  climate, roofs collapsing under wetted ash — declared row by row wherever a
  set holds them.
- **Fallout,** whose dose follows weather the product does not have: held to
  a reference implementation if printed, not validated.

## Citability

**C1.** A tagged release with a DOI, whose validation report is the one its
commit regenerates.

**C2.** A review by someone outside the project who tried to break it, with
every finding answered in the repository, fixed or declared.

**C3.** An accepted peer-reviewed article on the methods and the validation:
the Journal of Open Source Software, not before March 2027, or a journal.

## Changing these rules

A bound changes only by a dated amendment in this file that says why,
written before the figure it touches has been measured on the set it names,
and it is never loosened after a figure has failed it.

Three amendments have been made, and they are below. The first re-anchors
bounds to the rule this file opened with, rather than loosening any: the
verdict each rule reached under its bound as first written stays recorded, and
no rule is met today that was not met before it. The second changes no bound
and no status: it reads the same verdicts under two measures. The third reads
G3's two bounds as tests on a sample, because both are read from one, and it is
written before any band has been scored on a held-out set.

## Amendment of 16 September 2026: every validation bound read against the field

**Why.** This file opens with its own principle: _where the field has a tool
that makes the same estimate for the same events, a bound is read against that
tool on the same rows, so that a 9 means as good as the field and never better
than the field can be._ The verification rules keep to it — G1, I1, N1, V1 and
L1 hold the model to the field's own implementations. The validation rules did
not. Their bias and σ bounds were written on 15 September as the project's
choice, without measuring what the field's tools achieve on the same data, and
two measurements of 16 September show what that did:

- **L2** asked σ_ln no more than 0.7 of the wave a landslide raises. Heller,
  Hager & Minor (2009) — the method the field uses, reproduced here to 0.4 %
  of its own manual — reads **σ_ln 1.78** on the thirty-seven held-out
  landslides of rules 122 to 125. The bound was two and a half times tighter
  than the state of the art, and no software using the field's method could
  ever meet it.
- **I2** asked that an entering body deposit its energy within 5 km of where
  the sensors saw it peak. The model reproduces the Earth Impact Effects
  Program's burst altitude at 1.002× (twenty-three of twenty-four airbursts of
  the benchmark grid within 1 %), and on the CNEOS fireballs it misses by a
  median 13.7 km — which is, to that agreement, the program's own miss.

A rule a faithful implementation of the field cannot meet does not measure
the model. It measures the field, and it names the model as having failed.

**The amendment.** Every validation bound whose quantity the field has a tool
for is read against that tool, on the same held-out rows and against the same
record:

> A model meets a re-anchored bound when its bias is **no further from one**
> than the reference's (|ln bias| no larger) **and** its σ_ln is **no larger**
> than the reference's, overall and in every cell with twenty scored rows or
> more. Where the model implements the reference exactly — verified under G1 —
> the two agree by construction, and the held-out reading is printed for what
> it says of the field, not as a bar. G3's band width becomes exp(3.29 σ) with
> σ the reference's.

Where the field has no tool for a quantity — a tsunami's death toll, an
explosion's, an eruption's — the bound stays the project's choice, and this
file says so. A bound whose reference has not yet been run on the rows is
**pending**, and a pending rule is not met.

| Rule   | Bound as first written                                                         | Read against                                                                                                                                                             | Standing under the re-anchored bound                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1     | score ≥ 0.50 (≥ 0.40 on finite-rupture or ten-station maps), sharpness ≤ 0.35  | a ShakeMap scenario run on its own ground-motion models without stations, scored the same way on the same maps                                                           | pending on its set: ShakeMap's scenario mode **runs here since 19 September 2026** and on its first five scenarios our ring is 0.46 of its equivalent MMI VII radius at the rock reference, with VII drawn where it draws none and the same ring at 10 and 40 km depth ([SHAKEMAP_SETUP.md](SHAKEMAP_SETUP.md))                                                                                                                                                                                                                  |
| E2     | within ×1.5 of PAGER, σ_ln ≤ 1.0                                               | unchanged: PAGER is the reference and the rule already reads against it                                                                                                  | not met: 0.13×, σ_ln 2.18                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| E3, E4 | bias ×1.5; σ_ln ≤ PAGER's own + 0.25                                           | PAGER's own loss estimates on the same rows. **Tighter**: the 0.25 allowance goes, since as good as the field leaves none                                                | **not met** on 19 September 2026: 0.901× with σ_ln 2.798 against PAGER's own 2.547 on the same 48 rows, a scatter 1.286 times the reference's. Under the bound as first written it misses by 0.00127 in ln (rules 215 to 219)                                                                                                                                                                                                                                                                                                    |
| T1     | ×1.25 at the median event, σ_ln ≤ 0.50, ×1.5 beyond 7 000 km                   | GeoClaw on real bathymetry, on the same DART records                                                                                                                     | pending: GeoClaw has been run only over a flat ocean                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| T2     | ×1.5, σ_ln ≤ 0.8                                                               | GeoClaw on real bathymetry, on the same coastal bins                                                                                                                     | pending. Under the bound as first written, **not met**: 3.16× when it was first read on 16 September 2026, and 3.69× when the same set was read again on 18 September with the antimeridian closed (B-055) — the wall had been cancelling part of the run-up over-prediction, so the fix made the figure worse and neither reading meets the bound. Both stay recorded                                                                                                                                                           |
| T3     | within 5 % or 5 min on 90 %                                                    | a reference travel-time computation on the same records                                                                                                                  | pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| T4     | ×2, σ_ln ≤ 1.5                                                                 | **no tool of the field computes a tsunami's toll**: the project's choice, declared                                                                                       | pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| L2     | ×1.5, σ_ln ≤ 0.7                                                               | Heller et al. 2009 on the same rows and record — the impulse wave manual, whose second edition (Evers et al. 2019) is the one read (B-043)                               | **met**, 17 September 2026 (rules 162 to 167): the model is the manual's first crest, checked against the manual's own spreadsheet on all 43 rows, so its bias and σ_ln are the reference's by construction. Printed for the field, as first read: Heller 1.282× at σ_ln 1.776 against `Peak height`, the model 2.090× at σ_ln 1.529 — computed before B-042 corrected the slide's speed, and the set is not read again (rule 125). Under the bound as first written, not met twice (rules 121 and 125), and that stays recorded |
| L3     | a band meeting G3 at L2's σ                                                    | follows L2                                                                                                                                                               | not met: no sampler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| I2     | median error ≤ 5 km, mean ≤ 3 km                                               | the Earth Impact Effects Program's entry on the same fireballs                                                                                                           | **met**, 16 September 2026 (rules 126 to 128). The program was run on all 357 fireballs and answered 356; the model agrees with it within 1 % on 352 and through BM-13's declared I_f on the other 4, median departure 0.086 %, so on this set the model is the field's tool. Both miss the sky alike — the program by 13.68 km in the median and 12.69 in the mean, the model by 13.74 and 12.75 — and that miss is printed as the field's. Under the bound as first written, not met (rules 76 to 79), and that stays recorded |
| I3     | holds Tunguska, Chelyabinsk and 90 % of Collins et al. 2017's runs; width ≤ ×3 | already read against Collins et al. 2017's shock-physics runs; the ×3 width is the project's choice, declared                                                            | not met                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| N2     | radius ×1.25, σ_ln ≤ 0.3                                                       | Glasstone & Dolan's and Kingery–Bulmash's scaling on the same accidental explosions                                                                                      | pending: no set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| N3     | ×2, σ_ln ≤ 1.0                                                                 | **no tool of the field in use**: NUKEMAP publishes a casualty estimate, and this project does not query it (BENCHMARK_PROTOCOL, Conduct). The project's choice, declared | not met                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| V2     | ×1.15, σ_ln ≤ 0.35                                                             | Mastin et al. 2009 on the same phases — which is the model, so where G1 verifies the implementation the two agree by construction                                        | pending: no set beyond IVESPA, which is read (0.95×, σ_ln 0.44)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| V3     | 1 cm isopach area ×2, σ_ln ≤ 0.7                                               | Tephra2 on the same eruptions                                                                                                                                            | pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| V4     | runout ×1.5, σ_ln ≤ 0.5                                                        | the energy cone and LaharZ on the same currents                                                                                                                          | pending. Under the bound as first written, not met, and that stays recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| V5     | ×3, σ_ln ≤ 1.2                                                                 | **no tool of the field**: the project's choice, declared                                                                                                                 | not met                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| V6     | bands meeting G3                                                               | follows V2 to V5                                                                                                                                                         | pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Unchanged, because they are not bounds against the world or already read
against the field: G1 to G7, E5, L1, I1, I4, N1, V1 and C1 to C3.

**What this changed on the day it was written: nothing was met that was not.** Every rule the
standing below names as not met is still not met — L2 because the model is
further from one than Heller is, the rest because they were not met before
or because their reference has not been run. The amendment did not move a single rule across the line. What it did is make the line one a faithful implementation of the field can reach, and name, rule by rule, the reference run that would settle it. **The first such run settled I2 the same day** — by running the field's program on the rows, not by moving anything in the model — and it is recorded under "What has moved since".

**Why this is not a bound loosened after it failed**, which the paragraph
above forbids, and the three things that make the difference checkable: the
new bound is a **measurement of the field**, not a number chosen to let the
model through; the verdict under the old bound **stays recorded** beside the
new one; and the re-anchored bound is evaluated on **outputs already
committed** — L2's head-to-head above is arithmetic on
`benchmark/results/slide-wave-2026-09-16-1.json`, and the model was not run on
that set again. Where anchoring makes a bound tighter, as it does for E3, it
is tightened. Andrea asked for it on 16 September 2026, on the view that a
software that reaches the results of the field's gold-standard tools, all in
one place, is a gold standard in its own right; this amendment is that view
written as a rule.

**What it does not claim.** Agreeing with the field's tools is agreeing with
the field, errors included: where the field's best method misses the world by
a factor of four, a 9 here misses it too, and the validation report prints by
how much. And a software that joins the field's tools — an earthquake into a
wave, a wave onto a coast, a coast into a toll — makes joins no single tool
checks. Those joins are this project's own contribution, and they are measured
as such (T2, T4, N3, V5), not inherited from any reference.

## Amendment of 16 September 2026, evening: two measures beside the count

**Why.** The count mixes two questions. One is whether Nimbus gives what the
field's tools give on the same inputs, which is what Andrea set as the goal —
a software that reaches the results of the field's gold-standard tools, all in
one place. The other is whether it goes past them: bands calibrated on the
record, a warning outside the measured cells, rings that never shrink as an
event grows, no gap but the ceilings. The field's tools do not do the second:
the Earth Impact Effects Program, asked, shrinks its own blast rings and
magnitudes as a body grows, and prints no band. So a domain that matches its
tool to the fifth digit read 4.0 on 16 September 2026, and the count could not
say whether a round had brought the model nearer the field or past it. Worse,
the two pull against each other: following the program on the air blast of a
ground impact took G5's sweep from 181 failures to 425.

**The amendment.** The count stays as it is, and a 9 stays every rule at once.
Beside it the report prints two measures of the same rules and the same
verdicts, each read as the count is, 9 × credit over rules:

- **Fidelity** — the rules that ask the model to give what a tool of the field
  gives on the same inputs: G1 and the rules that stand for it (I1, N1, V1,
  L1); I4, a count held to an exact count; and every bound the first amendment
  read against a tool of the field on the same rows — E1, E2, E3, T1, T2, T3,
  L2, I2, N2, V2, V3 and V4.
- **Beyond** — every other rule of a domain: the bands (G3, E4, T5, L3, V6),
  the input space (G4, E5), robustness (G5), gaps (G6), method (G7), the
  airburst band that must hold the measured footprints (I3), and the tolls no
  tool of the field computes (T4, N3, V5).

A rule belongs to one measure only, and the two add up to the count.

**What it changed on the day it was written.** No status and no count:

| Domain                 | Count | Fidelity     | Beyond       |
| ---------------------- | ----: | ------------ | ------------ |
| Impacts                |   4.0 | 9.0 (3 of 3) | 1.5 (1 of 6) |
| Explosions             |   3.2 | 4.0 (0 of 2) | 3.0 (2 of 6) |
| Waves from landslides  |   3.0 | 0.0 (0 of 2) | 4.5 (2 of 4) |
| Volcanoes              |   1.1 | 0.5 (0 of 4) | 1.5 (1 of 6) |
| Earthquakes            |   1.0 | 0.0 (0 of 4) | 1.8 (1 of 5) |
| Waves from earthquakes |   0.9 | 0.0 (0 of 4) | 1.5 (1 of 6) |

Fidelity says where the work of matching the field stands: done for impacts;
half done for explosions, where the overpressure with height of burst and a
set of accidental explosions remain; not begun in a way a rule can see for
the rest — the landslide relation of the field is verified but not the
default, the earthquake relations are verified one by one but not all, and
most of the other bounds are pending because the field's tool has not been
run on their rows.

**What it does not claim.** A fidelity of 9 is not a 9, and it is not
accuracy: it means the model is the field's tool on the quantities that tool
computes, errors included, and says nothing of what no tool computes — a toll,
a band, a join between two tools. Those are counted beyond, and a 9 still
needs them.

## Amendment of 18 September 2026: G3 read as a test on a sample

**Why.** G3 asks two things of a band: that it hold about nine records in ten,
and that it be no wider than a band exactly calibrated at the quantity's σ_ln
bound, exp(3.29 σ) — and the amendment of 16 September makes that σ the
reference's, read on the same held-out rows. Both halves are then read from a
sample, and neither reading is the thing it stands for: the reference's σ over
eight rows is not its σ, and the share of records held on eight rows is not the
band's coverage. The width bound turns on a coin — the sample σ falls below the
true one about half the time, and every record is then held by a band the rule
calls too wide, so the reading is nothing held at all.

A band drawn at exactly the right scatter therefore fails more often than it
passes. On an unbiased model, 20 000 draws per case
(`scripts/benchmark/g3-sampling.py`, seed 18 092 026):

| Rows | As written | Amended |
| ---: | ---------: | ------: |
|    8 |     26.0 % |  94.3 % |
|   10 |     37.0 % |  93.7 % |
|   30 |     28.4 % |  94.0 % |

**The amendment.** G3's two bounds are read as tests of the claims they stand
for, with the sample allowed for. Everything else in G3 is unchanged — the band
is still the 5–95 % interval the product prints, a record held by a band wider
than the bound is still not counted as held, and the cells are still read as the
rule says.

> **Width.** The median width is no more than exp(3.29 σ⁺), σ⁺ being the
> one-sided 95 % upper confidence limit of the σ the bound names, read on the
> rows: σ⁺ = σ · √((n − 1) / χ²₀․₀₅,ₙ₋₁), which is ×1.80 the reading on eight
> rows, ×1.65 on ten, ×1.37 on twenty, ×1.28 on thirty.
> **Coverage.** The records held lie in the central 95 % of Binomial(n, 0.9) —
> the records a band that holds nine in ten may show on n rows: 5 to 8 of
> eight, 7 to 10 of ten, 15 to 20 of twenty, 23 to 30 of thirty. On a set of
> twenty rows or more the same test is read in every cell of twenty rows or
> more.

**What it refuses.** The test still catches a band that is not calibrated, where
the rows are enough to see it: on thirty rows a band whose σ is 60 % too large
passes 2.6 times in a hundred and one 30 % too small 51.8. On eight or ten rows
it is weak — 59.7 % and 47.8 % for the same band 60 % too wide — and that
weakness is the set's, not the reading's. This file already says that outside
earthquakes the sets are small and test a band coarsely; the amendment does not
mend that, and a domain whose G3 rests on eight rows should say so beside the
verdict.

**What it changes on the day it is written: nothing.** No band has been scored
against a held-out set under G3 in any domain. Every G3 and the rules that
follow it — E4, T5, L3, V6 — reads not met or pending, for want of a band, of a
set, or of the rules they follow; the earthquake toll's band, the only one read
against records, was read by the scorecard's own statistics and not by G3. So
no figure that failed is being re-read under a looser rule. What changes is that
a band which is right can now pass, and one which is wrong still cannot.

## Where each domain stands, 15 September 2026

Read from `docs/VALIDATION_REPORT.md` and `docs/BENCHMARK_REPORT.md` that
day. No domain has a 9. Every set the harness holds has been read, so no rule
of G2 or G3 can hold on it: the figures below say how far the model stands,
not that a rule holds.

| Rule   | Standing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1     | Met for Boore et al. 2014 (0.0005 % of Boore's Fortran), Allen et al. 2012, the interface models and Thompson & Worden's distances, and for the impact entry, craters, fireball, ejecta and airburst blast against EIEP. Not met elsewhere below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| G5     | Not met, and now read to its causes for impacts. On the physics of 16 September 2026 the sweep of 5 000 random scenarios a hazard gives **221** failures against the campaign's 12 104, and **222** when it is drawn again after the burn and radiation rounds changed the explosion, the extra one being the ring √(slant² − h²) where a lethal dose reaches the ground tangentially and is genuinely not smooth in yield. The impact family's 199 of them were read to their causes that evening, and it read **181**: 167 blast rings that shrink when a body bursts lower in the Mach region, as a burst below its optimum height does and as the program's own overpressure does on the body it was asked about; 8 rings born under the burst, whose peak overpressure is within 3 % of the threshold, growing steeply from nothing; 4 crater sizes at Collins et al.'s simple-to-complex step, the published law; 2 tsunami amplitudes at a seafloor cutoff of the model's own, whose taper was refused (rules 132 to 137). The rest of the 199 went with the program's passage to the Mach region (rules 129 to 131) and with the two flashes of a partial airburst adding up (rule 135). Following the program's ground blast and entry (rules 141 to 145) brought it to **425**: the program's blast of a ground impact weakens at a fixed range as a larger body puts Eq. 18's altitude deeper, and 407 blast rings now shrink as a body grows, the program's own with them where it was asked. G1 decided that round and G5 measured it. The application and Node agree on every number the check compares.                                                                                                                                            |
| E1     | Not met: the law in place scores 0.06 on the ShakeMap Atlas of 1973–1999; the best law tried, 0.42 (0.33 on the least modelled maps, sharpness 0.51).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| E2     | Not met: 0.13× PAGER's people at MMI VII and above, σ_ln 2.18, on the 100 of 187 earthquakes where both count someone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| E3, E4 | Not measured on a held-out set. On rule 11's set, now read: 0.913×, σ_ln 2.44, coverage 93 % at a width of 10^2.5 — the figures `docs/VALIDATION_REPORT.json` regenerates at `calibration.byRule.earthquakes.cells[0]`, which this row transcribed as 0.90× and 2.42 until 19 September 2026. PAGER's own σ_ln on those rows: read on 19 September 2026 (rules 215 to 219).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| E5     | Not met: the envelope has no depth cells, and the input check flags only depths beyond 100 km.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| T1     | On the 113 DART records of BM-05, now read: 1.00× at the median event, σ_ln 0.44, 0.84× beyond 7 000 km. No held-out set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| T2–T4  | T2 measured on 16 September 2026 and **not met**: over 2 468 coastal bins of 64 earthquakes (6 672 NCEI observations, Tōhoku, Sumatra and BM-05's own events left out) the run-up is 3.16× what was measured, σ_ln 1.365, against bounds of ×1.5 and 0.8 — and 3.69× with σ_ln 1.354 when the same set was read again on 18 September, after the antimeridian was closed (B-055), the wall having flattered the figure by making far Pacific waves travel the long way round; 4.63× at the distant tide gauges that carry two thirds of the bins, 1.49× at the nearer ones (rules 102 to 105). T3 and T4 still not measured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| T5     | Not met: waves carry no band.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| L1     | Not met: the relation in place is Watts 2000's cube-root scaling with prefactors set on Anak Krakatau, Storegga and Vaiont; Heller et al. 2009's Example 1 is reproduced only in the benchmark.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| L2, L3 | L2 measured twice on 16 September 2026 against held-out landslides and **not met** either time under its bound as first written — 7.762× against `Wave h max` (rule 121), 3.984× against `Peak height` (rule 125), both Heller's crest and trough against a height. Under the amendment of the same day it is read against Heller on the same rows, like for like, and is **still not met**: Heller 1.282× at σ_ln 1.776, the model 2.090× at σ_ln 1.529. L3: no sampler.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| I1     | Met. The seismic magnitude, the last clause, is closed: the program prints none, but its map draws the ranges of Mercalli III to XII, which lie on Collins et al.'s Eqs. 40\* to 43\* — with 1/42 and 1/208 for the printed 0.0238 and 0.0048, the distance of Eq. 43\* in radians, each equation in force to where it meets the next — and read an airburst's magnitude from the energy it keeps at its burst altitude; Nimbus now does the same, and sixteen held-out bodies agree within 0.01 at all 45 rings (rules 154 to 157). The impact tsunami is closed: the program draws an impact's wave as 1/r from one crater diameter out in the water, no taller there than the water is deep, and Nimbus now draws it so; thirteen held-out impacts agree at all 49 levels, the rings within 1 % (rules 150 to 153). The thermal exposure is closed: an impact's fireball radiates into the half-space and is dimmed by the share of it above the horizon (Eq. 36\*), as the program computes it, and sixteen held-out ignition rings agree within 1 % (rules 146 to 149). The air blast of ground impacts, the largest clause, is closed: it answered the impact angle backwards, 0.24× to 8.4× the program, because the program reads it from Eq. 18's altitude below the ground and on its own entry equations, which part from its paper in two places (BM-13's doubled I_f and an Eq. 20 without −3(l/H)²); Nimbus now computes both as the program does (rules 138 to 145), and every quantity of the grid agrees within the program's rounding — the ground blast, breakup and burst altitudes at 1.00×. The crater depth is closed (B-040), and the air blast of an airburst follows the program across the edge of the Mach region (rules 129 to 131). |
| I2, I4 | **I2 met** on 16 September 2026, as read against the field under the amendment of that day: the Earth Impact Effects Program, run on the 357 CNEOS fireballs for the first time, answers 356, and the model agrees with it on every one — within 1 % on 352, through BM-13 on 4 — so the two share the same miss of the sky, 13.68 km in the median for the program and 13.74 for the model. Under I2 as first written, not met (rules 76 to 79). I4's counting clause measured on 16 September 2026 and missed — the ring count was up to 10.4 % from an exact count of the same cells on 20 km circles — then met: the edge cells are split 12 × 12 and the worst is 2.7 % (rules 94 to 97). The polygon counter an extended rupture uses was measured the same night (rules 98 to 101) and passes as it stands, worst 1.19 % over thirty stadiums — because a stadium is far larger than the circles that failed, not because its arithmetic is finer. The ceiling clause is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| I3     | Not met: Tunguska's 20 kPa ring 0.43× the flattened forest; Chelyabinsk's 1 kPa ring 0.54× on a re-run that is not a validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| N1     | Not met, and down to one clause. **Met**: the burn rings at the exposures the book gives, and at the figure the rule names — Figure 12.65, since rules 114 to 117 on 16 September 2026; the initial-radiation ranges read off Figures 8.33a/b and 8.64a/b (rules 85 to 89); three of five crater coefficients read off Figures 6.72a/b (rules 90 to 93), the other two declared; **Kingery–Bulmash within 10 % in range for a charge on the ground** — all thirty rings of the campaign, worst the 1 psi ring at 0.934×, and the rings of 16 September identical to the campaign's to the millimetre; **the water wave within the book's own 35 %** where the book's relation applies — the model is §6.121 with nothing fitted, and reads 0.68 to 0.71 of Table 6.57's Baker heights out to 2 000 yd, the range over which the book's own H·R is constant; beyond 2 700 yd it reads about 0.6, because the book's relation stops following the book's table there (§6.56), declared under G1. **Open**: the overpressure with height of burst, which still stands on a project step and needs Figures 3.73a–c traced by a contour follower.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| N2     | Not measured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| N3     | Not met: two tolls, both tuned, on a band of 10^0.1 that Beirut misses by 6.6×.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| V1     | Not met, on the currents and the lahars. **The ash is met** since 16 September 2026: Tephra2's forward model was read in its source and written for Nimbus rather than transcribed, and forty eruptions nobody had run it on — twenty-four across the program's own inputs, sixteen of Nimbus's — give all 1 600 points within the six figures the program prints (rules 158 to 161); on the benchmark's 70 eruptions the deposit reads 1.000× the reference on the axis and across the wind, where Tephra2's closure alone had taken it from 0.008× to 0.299× (rules 106 to 113). Currents are still a project mobility, and no lahar follows a valley, so LaharZ is unmeasured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| V2     | On IVESPA 1.0, now read: 0.95×, σ_ln 0.44.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| V4, V5 | Not met: Fuego 2018's current 3.7 km against 11.7, Unzen 1991's 0.84 against 3.2; one held-out toll of three inside, 0.21×.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| C1–C3  | Not met.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## What has moved since

- **19 September 2026: a flow publishes the ground it covers.** The globe had
  been drawing a lahar's reach as a filled disc, which claimed two hundred
  times the area the field's own relation gives. Griswold & Iverson (2008) —
  in the scratchpad since the 16th, unopened — publishes what a flow covers
  and publishes no runout at all, LaharZ being a valley filled from a DEM until
  the area is reached. Rules 202 to 207 adopt the area laws, transcribed and
  checked by re-deriving them from the report's own 207 events, and the globe
  draws an unfilled reach beside a published area. V4 is not closed: the energy
  cone ran offline on Vesuvius and gives 4.11 km where our volume scaling gives
  13.57 and our energy line 88.39, with the record at about 9 to 15 — the
  comparison turns on H/L, which the reference takes and we do not have.

- **18 September 2026, night: the wave crosses the dateline now, and T2 got
  worse for it.** The globe had never been read against its own numbers. An
  audit that reads the geometry the renderer hands to Cesium found, among
  other things, one vertex of an «+8 h» isochrone at longitude −180 where the
  solver's field said forty hours — and behind it a wall: the fast-marching
  raster had no neighbour past ±180°, so a front reached the far Pacific only
  by going round the globe. On a uniform ocean a point two degrees past the
  seam read 30.31 h against an arc of 1.72. Closed under rules 197 to 201,
  pushed before anything was measured. The run-up set was read again as rule
  200 demanded, and the figure moved the wrong way: 3.16× to 3.69×, σ_ln 1.365
  to 1.354. The wall had been cancelling part of a run-up over-prediction the
  model already had — a wave that arrived the long way round arrived smaller —
  so the fix bought right arrival times and showed the height error at full
  size. Twenty-seven of the sixty-four events, every one outside the Pacific,
  did not move by a thousandth.

- **18 September 2026, evening: what a report says has to hold together.**
  Thirty scenarios opened by link on the product's own report page found six
  defects that 2 254 tests had not, because tests read numbers and a report is
  read by a person. Four were fixed at once (B-044 to B-050). The two that
  moved numbers a rule had already read got their rules first (`af73931`) and
  were closed after. An earthquake's wave was crossing the ocean at the depth
  of the water over its own epicentre, so a Mw 9.0 on a shelf made 1 000 km in
  20 h 54 min — 13.3 m/s, four to fifteen times slower than every one of the
  151 deep-ocean records BM-05 kept; the path has its own depth now, and the
  4 000 m default sits on those records at a median ratio of 1.011. And the
  intensity at the epicentre came from a law without a depth term while the
  rings came from laws with one, so a Mw 7.5 three hundred kilometres down
  printed MMI 9.3 at its epicentre and drew no MMI VII ring anywhere; the
  epicentre is now the ring law's own value at zero distance, which moves the
  model's peak from +2.14 to +1.96 intensity units against 1 100 ShakeMaps and
  from +2.85 to +1.78 on the great earthquakes. Neither round moved a number of
  the validation report: no earthquake preset carries a water depth, and no
  ring radius changed. Two rounds, no score claimed — what they bought is that
  the page cannot state two contradictory things about the same event.

- **18 September 2026, a charge on the ground is the field's own relation.**
  N1 asks that a charge on the ground be held to Kingery–Bulmash, and the
  campaign had measured the project's rings against it at 0.990× with a
  scatter of 0.04: within ten per cent, and not the same relation — a
  free-air fit entered at twice the yield. It matters beyond N1, because N2
  reads a held-out set of accidental explosions against Kingery–Bulmash's own
  scaling, and those few per cent would have decided it instead of the
  question the rule asks. Rules 177 to 181 were pushed before the candidate
  drew anything, and `effects/kingeryBulmash.ts` was written from Swisdak's
  (1994) Table 1 — the 1984 compilation as one-line polynomials, from a
  document approved for public release, and from nobody's code — with three
  checks in CI: the worked examples of IATG 01.80 within 1 %, the paper's own
  English coefficients within 0.02 %, the joins between its ranges within
  0.7 %. No guard failed: the explosion sweep reads the same two declared
  failures under both laws in one session, the release gate stays PASS, the
  application prints what Node computes on all ten explosion presets, and the
  three chemical presets move by the ratios the rules wrote down beforehand
  and by nothing else — 5 psi 0.9 % in, 1 psi 6.6 % out, 0.5 psi 2.9 % in.
  The casualty bands' inner edges now come off the same curve as the rings
  they are measured from. Beirut's toll is tuned and moves with its rings,
  which is recorded, not corrected.

- **17 September 2026, night, N1 held whole: an air burst's rings from the
  book's curves.** The last clause of N1 left was the overpressure with
  height of burst, drawn by a factor its own module called chosen. The seven
  curves of Glasstone & Dolan's Figure 3.73c were traced from the public scan
  — every grid line located, the grid and the triple-point dashes taken off
  the ink, each curve read along rays of constant incidence — and checked
  against the caption's example (4 psi farthest at 2 600 ft for a burst at
  about 1 100 ft; 2 618 at 1 080) and against Figure 3.73b's own 10 and
  15 psi curves (within 3.9 %). Rules 168 to 173 were pushed before the
  curves drew a preset. No guard failed and the release gate stayed PASS. On
  the five cases the campaign kept of its NUKEMAP comparison, the 1 psi ring
  now agrees within 0.3 %, where the factor was 17 to 20 % wide; Hiroshima's
  rings tighten to 1.62 and 4.49 km, and its toll moves from 116 639 to
  109 102 against a record of 105 000, not re-tuned. A burst whose 5 psi
  never reaches the ground had no casualty plan at all, and now keeps its
  lighter bands. Rules 174 to 176 then put a burst in the water on the same
  curves, closing a 14 % step in its 1 psi ring at the waterline. Explosions
  count 3.3, fidelity 4.5.

- **17 September 2026, night, L2 met: a landslide's wave is the field's
  method.** At Andrea's choice the waves from landslides came first. The
  impulse wave manual was read again, whole, with its authors' spreadsheet,
  and it showed two defects of this project on the path no scenario drew: the
  manual is the second edition (Evers, Heller, Fuchs, Hager & Boes 2019), not
  the 2009 one every citation named, and a slide's speed from its drop height
  was low by √(sin α) (B-042, B-043). Rules 162 to 167 were pushed before the
  spreadsheet — driven in Excel with its macros taken out — was asked 143
  cases drawn after them: sixty across its own inputs, forty of Nimbus's
  scenarios, the forty-three rows of L2. Every one of 1 015 numbers agreed, the
  worst to 3 × 10⁻¹⁰, and every limit; the release gate stayed PASS. A slide
  entering open water from above now draws the manual's first crest, with no
  ceiling on it, and the panel names each of the manual's limits the scenario
  falls outside of and what it had to estimate: Lituya Bay 1958 goes from the
  48 m of the ceiling to 94 m. The sweep found 606 infinite ratios between the
  regimes where friction holds a slide, fixed; then none. L2 is met under the
  amendment, the model being the reference on its rows; **L1 is not**, because
  a slide under the water and a confined basin still draw the project's
  calibrated forms, and the paper that would give the field's submarine
  relation (Watts et al. 2005) is not open. Waves from landslides count 4.5,
  fidelity 4.5.

- **16 September 2026, night, V1's ash met: Tephra2 written anew.** At
  Andrea's word the reference's source may be read to understand it, and
  Nimbus's code is written from the equations and the behaviour, never
  transcribed. Tephra2's forward model was read so and written for Nimbus:
  a hundred grain sizes, a beta release along the column, three settling
  regimes, the wind level by level and a spread that grows with the fall time.
  Before any rule it gave every one of the 50 328 points of the program's own
  Colima example within its printing, and forty eruptions drawn across its
  inputs the same. Rules 158 to 161 were pushed before forty new eruptions
  were run, and all 1 600 points agreed, the worst to 4.8 × 10⁻⁶; the release
  gate stayed PASS. A scenario's ash is now that deposit, under the
  parameters the campaign's reference run gave Tephra2, and on the benchmark's
  70 eruptions it reads 1.000× where the closed form read 0.47× on the axis
  and 0.299× across it. The volcano sweep went from 6 failures to none — the
  six were the closed form's bands jumping across the threshold — and the
  application prints what Node computes on every preset, so G5 holds for
  volcanoes too. What it does not settle is the parameters: one inversion at
  Colima and Nimbus's own grain classes, which V3 would read against real
  isopachs. Volcanoes count 2.2, fidelity 1.1.

- **16 September 2026, evening, two measures beside the count.** Andrea
  asked why a domain that matches its tool reads 4.0. The count now prints,
  beside itself, fidelity — the rules that ask for what a tool of the field
  gives on the same inputs — and beyond — the rules that ask for what no tool
  gives. Nothing changed status. Fidelity reads impacts 9.0, explosions 4.0,
  volcanoes 0.5, and 0.0 for waves from landslides, earthquakes and waves from
  earthquakes; beyond reads 1.5 to 4.5. The split corrected a reading given to
  Andrea the same evening: the waves from landslides do not match Heller et al.
  2009 in the product, since that relation is verified but is not the default.

- **16 September 2026, I1 met: the seismic magnitude closed.** The program
  prints no magnitude, but its map draws the ranges of Mercalli III, V, VII,
  IX and XII. On the grid's 70 bodies, and 24 asked where one of Collins et
  al.'s equations hands over to the next, they lie on Eqs. 40\* to 43\* with
  1/42 and 1/208 for the printed 0.0238 and 0.0048, Eq. 43\*'s distance in
  radians and each equation in force to where it meets the next; for a body
  that reaches the ground the magnitude was already Nimbus's to the fifth
  decimal. For an airburst the program reads it from the energy the body keeps
  at its burst altitude, where Nimbus read none, at a speed its Eq. 20 gives
  without the −3(l/H)² term it drops at the ground (Eq. 19's integral plus
  H·L₀²) — which also brings the airburst overpressures the report compares from 0.999–1.003× to 1.000×. Rules 154 to 157 were pushed before sixteen new bodies were asked,
  eight airbursts and eight strikes, and all 45 rings agreed within 0.01; the
  release gate stayed PASS. What it costs: Tunguska now shakes at magnitude
  4.7 and Chelyabinsk at 4.2, where Collins et al. give airbursts no seismic
  effect, and the impact family's sweep goes from 426 to 464 — an airburst
  that grows 1 % bursts lower and keeps a little less energy, and the program,
  asked on one, drops its magnitude by the same 0.0002. Impacts count 4.0.

- **16 September 2026, the tsunami of an impact closed (BM-09).** The
  campaign compared the program's wave rings as a class-C quantity, 0.86×
  with a scatter of 1.0 and 55 rings where Nimbus made no wave. Nineteen
  bodies asked afterwards showed one law: the wave falls as 1/r from one
  crater diameter out in the water, min(0.07 D_w, h) there, with D_w the form
  of Collins et al.'s Eq. 21 on the speed at the water, fitted to 10⁻⁹ in the
  logarithm. Rules 150 to 153 were pushed before fourteen new impacts were
  asked; the program answered thirteen, and every level agreed — 37 rings
  within 1 %, the worst to 7.8 × 10⁻⁵, and 12 levels where neither draws one —
  and the release gate stayed PASS. What it costs: a strike in deep water now
  sends a far field several times what Wünnemann's hydrocode fit gave, a 1 km
  stone in 4 km of water 6.9 to 22.9 m at 1 000 km, and nothing has measured
  which is right. The sweep found the program's crater wider than the Earth
  for bodies some two thousand kilometres across; what is reported of it now
  stops at the antipode, and the sweep, which now also holds the wave a
  visitor is shown, is 426 as before. I1 waits on the seismic magnitude alone.
  Impacts count 3.9.

- **16 September 2026, the thermal exposure of an impact closed.** The program
  prints no exposure, but its clothing-ignition ring reveals it: on the grid's
  49 ground impacts, Collins et al.'s half-space with the visible fraction of
  Eq. 36\* gave every ring within 1 % or 200 m, where the model's sphere gave
  none within 1 %. Rules 146 to 149 were pushed before sixteen new bodies were
  asked, and all sixteen rings agreed within 1 %. An impact's burn and fire
  rings are drawn on that exposure at the project's own thresholds: farther
  where the flash is far from the horizon (Meteor Crater's burns 5.5 to
  7.1 km), less far where the horizon dims it (Boltysh's 523 to 462 km).
  Impacts count 3.8.

- **16 September 2026, the grade becomes a count.** Readings such as
  "impacts 7.5" judged how good a model is; they could not show progress
  toward the rules, and they moved with whoever read them. The count replaces
  them. On the day it was written it reads impacts 3.7, explosions 3.2, waves
  from landslides 3.0, volcanoes 1.1, earthquakes 1.0 and waves from
  earthquakes 0.9 — lower than the readings because it counts what holds, and
  most of what does not hold is pending: a reference that has not been run on
  the rows, or a held-out set that has not been gathered.

- **16 September 2026, the air blast of a ground impact closed, by following
  the program where it parts from its paper.** Rules 138 to 140 were refused on
  one slow iron, and the refusal named the entry. The program's entry doubles
  Eq. 12's I_f (BM-13, declared since the campaign) and drops a term from
  Eq. 20; with both, everything already read agreed within 0.12 %. Rules 141
  to 144 were pushed before sixteen new bodies were asked — eight slow and
  dense, where the two entries part most, and four airbursts — and every
  overpressure, breakup and burst altitude agreed; the release gate stayed
  PASS with Meteor Crater's crater in it. The first test run after adoption
  showed a declared choice gone wrong: where the program has no answer the
  candidate kept Sikhote-Alin's body whole and dug a 129 m crater; rule 145,
  written after and saying so, uses the paper's equations there, and the
  crater is 26.7 m against 26 observed. The report's ground blast went from
  0.24–8.44× to 1.00×. What it cost: the impact family's sweep went from 181 to
  425, because the program's ground blast weakens at a fixed range as a body
  grows, and the program's own rings shrink with it where it was asked. I1
  now waits on the impact tsunami and the fireball's visible fraction.

- **16 September 2026, BM-21's law found, and refused on one body.** The air
  blast of a ground impact, the largest open clause of I1, answered the angle
  backwards because the program reads it at Eq. 18's altitude below the
  ground, where r_x = 290 + 0.65 z₁ shortens as a steeper entry goes deeper.
  Read off 18 new points and checked on the grid's 57 (within 0.18 %), then
  held out on twelve bodies after rules 138 to 140 were pushed: 55 of 60
  within 0.054 %, where the model in place matched 1. The five outside are one
  slow iron, whose speed at the ground the entry gives 1.3 % faster than the
  program's blast implies, amplified by a scaled crossover of 92 m. Rule 140 asked
  for every point; the law stays reachable and I1 stays open on this clause,
  which now waits on the entry's ground speed for slow strong bodies and on
  BM-13, not on the blast.

- **16 September 2026, the impact family's G5 failures read to their causes,
  199 to 181.** Every failure the sweep found for impacts was followed to what
  makes it. The program's passage to the Mach region (rules 129 to 131) took
  the blast's to 167 rings that shrink and 8 that jump: the first a burst
  below its optimum height, which the program does too; the second rings
  born under the burst, which grow steeply because the peak they are drawn
  under is within 3 % of their threshold. B-041 was found on the way: an
  airburst's flash burned at a nuclear fireball's exposure, against rule 81.
  Two kinds were the model's own, and rules 132 to 137 were pushed before the
  sweep that decided them, run three times in one session: a partial
  airburst's burn ring was the larger of its two flashes, and **the flashes
  now add** — the six burn-ring failures gone, nothing else moved, Meteor
  Crater's burn rings ×1.17 and every other preset's still; the seafloor
  cutoff's taper cleared the two tsunami failures and **was refused**, because
  it moved Collins et al.'s crater step onto one more random scenario and the
  rule allowed nothing to grow. What is left is the program's physics, the
  published crater law and one cutoff of the model's own, declared.

- **16 September 2026, the airburst's blast follows the program across the
  edge of the Mach region.** The invariants found blast rings that jumped
  when a body grew by 0.1 %, and the Earth Impact Effects Program, asked on
  one, did not jump: where the law stepped from regular reflection to the
  Mach region, the program draws a straight line in range between the two,
  and uses r_x = 290 + 0.65 z₁ where the project had read 289. Read off 50 of
  its printed overpressures (rule 129) and held out on twelve bodies drawn
  with a seed after the rules were pushed, the program's passage reproduced
  72 of 72 points, the worst to 3.5 × 10⁻⁷; the published step, 42 (rules
  130 and 131, `validation/machBlendRules.ts`). Adopted. It closes a G1
  departure of up to 43 % on the air blast of airbursts and leaves I1's
  open clauses where they were; what it does to G5 is measured with the
  next sweep.

- **16 September 2026, N1 down to one clause.** Three clauses closed in one
  evening, and only one of them by changing the model. Rules 114 to 117 moved
  the burn rings from Figure 12.64 to Figure 12.65, the figure N1 names: every
  guard held — rings moved at most ×0.965, the release gate stayed PASS, and
  the invariants read 222 under both figures in the same session. The
  Kingery–Bulmash clause turned out already met: all thirty rings of the
  campaign within 10 % in range, and today's rings identical to the campaign's
  to the millimetre, so the campaign's reading still holds. The water-wave
  clause is met where the book's relation applies, out to 2 000 yd, and
  declared beyond, where the book's own table departs from the book's own
  relation for a reason the book gives. What is left of N1 is the overpressure
  with height of burst. Two things the evening found on the way: a sentence of
  the validation report that said 12.64 asks more exposure than 12.65
  _everywhere_ — it holds at the two yields it was read at and not between —
  and a toll whose printed total could miss the sum of its printed parts by
  one, now the sum of the parts.

- **16 September 2026, I2 met — the first rule of this standard to cross the
  line.** Under the amendment of the same day I2 is read against the Earth
  Impact Effects Program's entry on the same fireballs, and nobody had run the
  program on them. `scripts/eiep-fireballs.py` did: 357 CNEOS fireballs, each
  built as rule 77 builds its body, one request every 1.5 s. The program
  answered 356 — it fails on an entry at 0.68°, which the model brings to the
  ground. On every one of the 356 the model agrees with it: within 1 % on 352,
  and on the other 4 through BM-13, the one departure G1 already names, by the
  formula `eiepComparison.test.ts` holds in CI. The median departure is
  0.086 %. So the model is the field's tool on this set, and the two miss the
  sky together — the program by 13.68 km in the median, the model by 13.74.
  How to read that 60 m was fixed in rules 126 to 128 and pushed while the
  program was still answering (`37deef1`), because the one fireball tried by
  hand had shown it coming: a bare comparison of errors would have failed the
  model by 60 m on a body it reproduces to a tenth of a per cent. The miss of
  13.7 km stays printed in the validation report, as the field's.
- **16 September 2026, the ash cloud widened towards Tephra2 — refused once,
  then adopted.** The worst number in the project was the tephra loading across
  the wind, 0.008× the model the field runs, from a spread that grew with the
  downwind distance and not with the time a grain spends falling, so fine ash
  spread no more than a lapillus. Tephra2's own closure makes it **0.299×**
  with the scatter down from 31.8 to 4.1, and improves the wind axis at the
  same time: every figure of the comparison gets better. Rules 106 to 109
  refused it anyway, on their invariant guard — 222 against the 221 the rule
  named — and the 222nd failure was neither the closure's (the sweep gives 222
  with the candidate switched off) nor a defect: it is the ring √(slant² − h²)
  where a lethal dose reaches the ground with fifty-three centimetres to spare,
  whose derivative is genuinely infinite there. The bound was stale, read
  before the burn and radiation rounds changed the explosion, and a bound is
  not moved after it has failed, so the refusal stands as that round's verdict.
  Rules 110 to 113 then put the same candidate, unchanged to the constant, to a
  baseline taken in the same run — 222 under the law in place, 222 with the
  candidate in place — and adopted it. The protocol's Conduct now carries the
  general lesson: a guard on the invariants names the reading under the law in
  place, taken in the same run, and never a count carried from another day. The
  reference generator the campaign never left behind is in the repository
  (docs/TEPHRA2_SETUP.md), which is what lets any of this be re-run.
- **16 September 2026, T2 measured for the first time — and missed.** Of the
  five domains, waves were the only one whose bar had never been reached
  rather than missed: no offline harness could compute a coastal run-up. One
  can now, because the bathymetry the browser reads is readable in Node. On
  6 672 NCEI observations of 64 earthquakes the model's coastal run-up stands
  at 3.16× what was measured, with σ_ln 1.365, against T2's ×1.5 and 0.8 — and
  4.63× at the distant tide gauges that carry two thirds of the bins. Nothing
  is tuned on it and the set is now read (docs/SCIENCE.md, "The coast,
  measured for the first time").
- **16 September 2026, the ring count measured and mended.** The people inside
  a circle were counted by splitting each edge cell of the raster into a
  4 × 4 sub-grid, and nobody had ever measured what that cost. On a set of 224
  circles built from the raster by a fixed rule it cost up to 10.4 % against a
  count of the very same cells at 48 × 48 — above the 5 % every letter of this
  standard asks of a ring. Splitting 12 × 12 brings the worst to 2.7 % for
  seven per cent more time, and the release gate holds. The polygon counter an
  extended rupture uses was measured the same night by rules 98 to 101 and
  passes as it stands — a median 0.032 % and 1.19 % at its worst over thirty
  stadiums — because a stadium is far larger than the circles that failed, not
  because its arithmetic is finer (docs/SCIENCE.md, "How many people the rings
  actually hold" and "And how many the rupture stadiums hold").
- **16 September 2026, three clauses of N1 met.** N1 asks that no fit of the
  project's stand in where the book gives a curve. Rules 80 to 84 traced
  Glasstone & Dolan's Figure 12.64 from the public scan and adopted it: an
  explosion's burn rings are drawn at the exposure the book gives for that
  yield, where they stood at three fixed numbers of the project's own. Rules
  85 to 89 did the same for the initial radiation, whose fit had cited a
  figure the book does not contain: the rings are now read off Figures 8.33a/b
  and 8.64a/b, and they answer to the height of burst, which the fit could
  not. Rules 90 to 93 then read the crater coefficients off the numbers the
  book prints on Figures 6.72a and b, moving three of the five by a few per
  cent; the other two are declared rather than replaced — wet soil keeps the
  Bravo and Mike craters it was set on, against a 1 kt figure carried four
  decades up in yield, and the book has no clay. The rest of N1 is unchanged,
  and an impact still draws the project's burn fluences (docs/SCIENCE.md,
  "The exposure that burns, from the book's own figure", "The initial
  radiation, from the figures the book draws" and "The crater, from the
  numbers the book prints").
- **16 September 2026, I2 measured and missed.** Rules 76 to 79 put the entry
  model to the 357 bolides of NASA JPL's fireball catalogue that carry an
  altitude of peak brightness, a speed and an energy — the first held-out
  reading of an impact quantity. It bursts a median 13.7 km above the altitude
  the sensors measured and 12.8 km above on average, where I2 asks 5 km and 3
  km. Declared in the validation report.
- **16 September 2026, G5 re-measured, twice.** The invariants ran again on
  5 000 random scenarios a hazard, on the physics of that day: 221 failures
  against the campaign's 12 104 — 199 of them the airburst blast's altitude
  factor (BM-16), the rest threshold crossings. Still not met, and much nearer
  (docs/SCIENCE.md, "The invariants after the campaign's fixes"). Run again at
  the end of the day, after the burn and radiation rounds had changed the
  explosion, it gives **222**: the radiation rings now answer to the height of
  burst, and where the lethal dose only just reaches the ground the ring
  √(slant² − h²) is genuinely not smooth in yield. Declared and not fixed —
  the geometry is right and the invariant assumes a smoothness the world has
  not got here — and it is what refused the ash round.
- **16 September 2026, E1 and E3 read again.** Rules 66 to 70 adopted an
  intraslab law for scenarios deeper than 70 km, on ShakeMaps no rule had read;
  its band holds fewer of rule 61's deep records than the rings it replaced.
  Rules 71 to 75 then tried the ground-motion residual in its two parts, which
  narrows the bands by a factor of two and drops nine of rule 11's records, and
  was not adopted. Neither set can be held out again.

## What these rules cannot settle

- Outside earthquakes the sets are small: ten explosions or fifteen eruptions
  test a band coarsely, and a coverage of 80 % on ten rows is eight.
- Every NCEI earthquake record of 2008 to 2025 of magnitude 4 or more has been
  read by rules 11, 45 or 61, except those of magnitude 4 to 4.99 deeper than
  40 km, and the dead of 1973 to 2007 are those PAGER's country curves were
  fitted on. E3 can therefore be met only on earthquakes after 15 September
  2026 — the prospective set of rules 27 to 30 grows by about eighty a year,
  fewer of them with dead — or on a set before 1973 opened by rules of its own,
  whose inputs (origins, moment tensors, the population of the day) are poorer
  than the later sets'.
- A bound read against PAGER is as good as PAGER; where PAGER is wrong, a 9
  may be too.
- I3 reads the only measured airbursts, which have been read; a 9 on the air
  blast of an airburst is a check that its band is honest, not a held-out
  test. **Measured on 18 September 2026, before any rule was written for it:
  the check turns on the overpressure one assigns to the damage, more than on
  the model.** The reach of the program's law at Tunguska's burst is 11.5 km
  at 20 kPa, 20.1 at 10 and 29.2 at 6, against the 26.5 km radius of the
  flattened forest; at Chelyabinsk's it is 30.1 km at 1 kPa, 47.6 at 0.7 and
  67.8 at 0.5, against the 56 km radius over which windows broke. A factor of
  three in radius sits between the ends of each of those ranges, and the
  literature does not fix the threshold better than that. The model's own
  scatter is smaller: against the twenty ranges Collins et al. (2017) publish
  from their shock-physics runs, the law reads 1.09× with a σ_ln of 0.24, so a
  band drawn at that scatter spans ×0.74 to ×1.61 and holds nineteen of the
  twenty. Read at the paper's own thresholds — 20 kPa for the trees, 1 kPa for
  the windows — such a band holds neither footprint: Tunguska would need ×2.31
  and Chelyabinsk ×1.86. I3's width bound of ×3, chosen by the project on 15
  September without measuring, cannot carry both the model's scatter and the
  threshold's, and this file forbids loosening a bound after a figure has
  failed it. So I3 stays not met, and the reason is now measured rather than
  assumed.
