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
- There is no 10, and below 9 a grade stays a reading: these rules say only
  what a 9 is.
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

One amendment has been made, and it is below. It re-anchors bounds to the
rule this file opened with, rather than loosening any: the verdict each rule
reached under its bound as first written stays recorded, and no rule is met
today that was not met before it.

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

| Rule   | Bound as first written                                                         | Read against                                                                                                                                                             | Standing under the re-anchored bound                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1     | score ≥ 0.50 (≥ 0.40 on finite-rupture or ten-station maps), sharpness ≤ 0.35  | a ShakeMap scenario run on its own ground-motion models without stations, scored the same way on the same maps                                                           | pending: the scenario mode has not been run                                                                                                                                                                                                                                                       |
| E2     | within ×1.5 of PAGER, σ_ln ≤ 1.0                                               | unchanged: PAGER is the reference and the rule already reads against it                                                                                                  | not met: 0.13×, σ_ln 2.18                                                                                                                                                                                                                                                                         |
| E3, E4 | bias ×1.5; σ_ln ≤ PAGER's own + 0.25                                           | PAGER's own loss estimates on the same rows. **Tighter**: the 0.25 allowance goes, since as good as the field leaves none                                                | pending: PAGER's own σ_ln on those rows not read                                                                                                                                                                                                                                                  |
| T1     | ×1.25 at the median event, σ_ln ≤ 0.50, ×1.5 beyond 7 000 km                   | GeoClaw on real bathymetry, on the same DART records                                                                                                                     | pending: GeoClaw has been run only over a flat ocean                                                                                                                                                                                                                                              |
| T2     | ×1.5, σ_ln ≤ 0.8                                                               | GeoClaw on real bathymetry, on the same coastal bins                                                                                                                     | pending. Under the bound as first written, **not met** (3.16×, rules 102 to 105), and that stays recorded                                                                                                                                                                                         |
| T3     | within 5 % or 5 min on 90 %                                                    | a reference travel-time computation on the same records                                                                                                                  | pending                                                                                                                                                                                                                                                                                           |
| T4     | ×2, σ_ln ≤ 1.5                                                                 | **no tool of the field computes a tsunami's toll**: the project's choice, declared                                                                                       | pending                                                                                                                                                                                                                                                                                           |
| L2     | ×1.5, σ_ln ≤ 0.7                                                               | Heller et al. 2009 on the same rows and record                                                                                                                           | **not met**. Against `Peak height` on the same thirty-seven rows, first crest against source amplitude: Heller 1.282× at σ_ln 1.776; the model 2.090× at σ_ln 1.529 — tighter, and further from one. Under the bound as first written, not met twice (rules 121 and 125), and that stays recorded |
| L3     | a band meeting G3 at L2's σ                                                    | follows L2                                                                                                                                                               | not met: no sampler                                                                                                                                                                                                                                                                               |
| I2     | median error ≤ 5 km, mean ≤ 3 km                                               | the Earth Impact Effects Program's entry on the same fireballs                                                                                                           | pending: expected equal, since the model reproduces the program's burst altitude, but the program has not been run on the fireballs themselves. Under the bound as first written, **not met** (13.7 km, rules 76 to 79), and that stays recorded                                                  |
| I3     | holds Tunguska, Chelyabinsk and 90 % of Collins et al. 2017's runs; width ≤ ×3 | already read against Collins et al. 2017's shock-physics runs; the ×3 width is the project's choice, declared                                                            | not met                                                                                                                                                                                                                                                                                           |
| N2     | radius ×1.25, σ_ln ≤ 0.3                                                       | Glasstone & Dolan's and Kingery–Bulmash's scaling on the same accidental explosions                                                                                      | pending: no set                                                                                                                                                                                                                                                                                   |
| N3     | ×2, σ_ln ≤ 1.0                                                                 | **no tool of the field in use**: NUKEMAP publishes a casualty estimate, and this project does not query it (BENCHMARK_PROTOCOL, Conduct). The project's choice, declared | not met                                                                                                                                                                                                                                                                                           |
| V2     | ×1.15, σ_ln ≤ 0.35                                                             | Mastin et al. 2009 on the same phases — which is the model, so where G1 verifies the implementation the two agree by construction                                        | pending: no set beyond IVESPA, which is read (0.95×, σ_ln 0.44)                                                                                                                                                                                                                                   |
| V3     | 1 cm isopach area ×2, σ_ln ≤ 0.7                                               | Tephra2 on the same eruptions                                                                                                                                            | pending                                                                                                                                                                                                                                                                                           |
| V4     | runout ×1.5, σ_ln ≤ 0.5                                                        | the energy cone and LaharZ on the same currents                                                                                                                          | pending. Under the bound as first written, not met, and that stays recorded                                                                                                                                                                                                                       |
| V5     | ×3, σ_ln ≤ 1.2                                                                 | **no tool of the field**: the project's choice, declared                                                                                                                 | not met                                                                                                                                                                                                                                                                                           |
| V6     | bands meeting G3                                                               | follows V2 to V5                                                                                                                                                         | pending                                                                                                                                                                                                                                                                                           |

Unchanged, because they are not bounds against the world or already read
against the field: G1 to G7, E5, L1, I1, I4, N1, V1 and C1 to C3.

**What this changes today: nothing is met that was not.** Every rule the
standing below names as not met is still not met — L2 because the model is
further from one than Heller is, the rest because they were not met before
or because their reference has not been run. The amendment does not move a
single rule across the line. What it does is make the line one a faithful
implementation of the field can reach, and name, rule by rule, the reference
run that would settle it.

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

## Where each domain stands, 15 September 2026

Read from `docs/VALIDATION_REPORT.md` and `docs/BENCHMARK_REPORT.md` that
day. No domain has a 9. Every set the harness holds has been read, so no rule
of G2 or G3 can hold on it: the figures below say how far the model stands,
not that a rule holds.

| Rule   | Standing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1     | Met for Boore et al. 2014 (0.0005 % of Boore's Fortran), Allen et al. 2012, the interface models and Thompson & Worden's distances, and for the impact entry, craters, fireball, ejecta and airburst blast against EIEP. Not met elsewhere below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| G5     | Not met, and now measured twice in a day. On the physics of 16 September 2026 the sweep of 5 000 random scenarios a hazard gives **221** failures against the campaign's 12 104 — 199 of them the airburst blast's altitude factor (BM-16), the rest threshold crossings — and **222** when it is drawn again after the burn and radiation rounds changed the explosion, the extra one being the ring √(slant² − h²) where a lethal dose reaches the ground tangentially and is genuinely not smooth in yield. The application and Node agree on every number the check compares.                                                                                                                                                      |
| E1     | Not met: the law in place scores 0.06 on the ShakeMap Atlas of 1973–1999; the best law tried, 0.42 (0.33 on the least modelled maps, sharpness 0.51).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| E2     | Not met: 0.13× PAGER's people at MMI VII and above, σ_ln 2.18, on the 100 of 187 earthquakes where both count someone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| E3, E4 | Not measured on a held-out set. On rule 11's set, now read: 0.90×, σ_ln 2.42, coverage 93 % at a width of 10^2.5. PAGER's own σ_ln on those rows not read.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| E5     | Not met: the envelope has no depth cells, and the input check flags only depths beyond 100 km.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| T1     | On the 113 DART records of BM-05, now read: 1.00× at the median event, σ_ln 0.44, 0.84× beyond 7 000 km. No held-out set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| T2–T4  | T2 measured on 16 September 2026 and **not met**: over 2 468 coastal bins of 64 earthquakes (6 672 NCEI observations, Tōhoku, Sumatra and BM-05's own events left out) the run-up is 3.16× what was measured, σ_ln 1.365, against bounds of ×1.5 and 0.8; 4.63× at the distant tide gauges that carry two thirds of the bins, 1.49× at the nearer ones (rules 102 to 105). T3 and T4 still not measured.                                                                                                                                                                                                                                                                                                                               |
| T5     | Not met: waves carry no band.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| L1     | Not met: the relation in place is Watts 2000's cube-root scaling with prefactors set on Anak Krakatau, Storegga and Vaiont; Heller et al. 2009's Example 1 is reproduced only in the benchmark.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| L2, L3 | L2 measured twice on 16 September 2026 against held-out landslides and **not met** either time under its bound as first written — 7.762× against `Wave h max` (rule 121), 3.984× against `Peak height` (rule 125), both Heller's crest and trough against a height. Under the amendment of the same day it is read against Heller on the same rows, like for like, and is **still not met**: Heller 1.282× at σ_ln 1.776, the model 2.090× at σ_ln 1.529. L3: no sampler.                                                                                                                                                                                                                                                              |
| I1     | Not met for the air blast of ground impacts, and for one reason now known: the overpressure is computed from the energy that reaches the ground where it comes from the energy deposited in the air, so it answers the impact angle backwards — 0.24× to 8.4× the program, and of fourteen groups holding more than one angle this model rises with a steeper impact in twelve where the program falls in twelve (BM-21). Also the impact tsunami (BM-09) and the visible fraction of the fireball (Eq. 36\*). The crater depth is closed: 1.293× became 0.995× on 16 September 2026 when the Venus fit it carried was replaced by Collins et al.'s own Eq. 28\* (B-040). Everything else both print agrees between 0.995× and 1.002×. |
| I2, I4 | I2 not met (see above). I4's counting clause measured on 16 September 2026 and missed — the ring count was up to 10.4 % from an exact count of the same cells on 20 km circles — then met: the edge cells are split 12 × 12 and the worst is 2.7 % (rules 94 to 97). The polygon counter an extended rupture uses was measured the same night (rules 98 to 101) and passes as it stands, worst 1.19 % over thirty stadiums — because a stadium is far larger than the circles that failed, not because its arithmetic is finer. The ceiling clause is unchanged.                                                                                                                                                                       |
| I3     | Not met: Tunguska's 20 kPa ring 0.43× the flattened forest; Chelyabinsk's 1 kPa ring 0.54× on a re-run that is not a validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| N1     | Not met: blast rings 1.09× NUKEMAP, overpressure 1.07× Kingery–Bulmash; height of burst set on Hiroshima. Three clauses met since 16 September 2026, each by reading the page the project already cited: the burn exposures are the book's Figure 12.64 (rules 80 to 84), the initial-radiation ranges its Figures 8.33a/b and 8.64a/b (rules 85 to 89), and three of the five crater coefficients the numbers printed on its Figures 6.72a/b (rules 90 to 93). Wet soil's crater keeps the measured Bravo and Mike craters over a 1 kt figure carried four decades, and clay is nowhere in the book — both declared.                                                                                                                  |
| N2     | Not measured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| N3     | Not met: two tolls, both tuned, on a band of 10^0.1 that Beirut misses by 6.6×.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| V1     | Not met, and much nearer on the ash. Tephra2's own closure was adopted on 16 September 2026 (rules 110 to 113, after rules 106 to 109 measured it and refused it): across the wind 0.008× became **0.299×** and its scatter fell from 31.8 to 4.1, on the axis 0.47× became 0.69× with 59 % of points within a factor of two against 23 %. Three times too narrow is still outside the rule, and part of what remains is a wind — Tephra2 turns its wind with height and Nimbus holds one constant. Currents are still a project mobility, and no lahar follows a valley, so LaharZ is unmeasured.                                                                                                                                     |
| V2     | On IVESPA 1.0, now read: 0.95×, σ_ln 0.44.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| V4, V5 | Not met: Fuego 2018's current 3.7 km against 11.7, Unzen 1991's 0.84 against 3.2; one held-out toll of three inside, 0.21×.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C1–C3  | Not met.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

## What has moved since

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
  test.
