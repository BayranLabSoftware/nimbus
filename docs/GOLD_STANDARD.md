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

## Where each domain stands, 15 September 2026

Read from `docs/VALIDATION_REPORT.md` and `docs/BENCHMARK_REPORT.md` that
day. No domain has a 9. Every set the harness holds has been read, so no rule
of G2 or G3 can hold on it: the figures below say how far the model stands,
not that a rule holds.

| Rule   | Standing                                                                                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1     | Met for Boore et al. 2014 (0.0005 % of Boore's Fortran), Allen et al. 2012, the interface models and Thompson & Worden's distances, and for the impact entry, craters, fireball, ejecta and airburst blast against EIEP. Not met elsewhere below. |
| G5     | Last measured by the benchmark, before its fixes: 392 of 5 000 random earthquakes hung (fixed since, B-027); 9 of 20 415 numbers differed between the application and Node. Not re-measured.                                                      |
| E1     | Not met: the law in place scores 0.06 on the ShakeMap Atlas of 1973–1999; the best law tried, 0.42 (0.33 on the least modelled maps, sharpness 0.51).                                                                                             |
| E2     | Not met: 0.13× PAGER's people at MMI VII and above, σ_ln 2.18, on the 100 of 187 earthquakes where both count someone.                                                                                                                            |
| E3, E4 | Not measured on a held-out set. On rule 11's set, now read: 0.90×, σ_ln 2.42, coverage 93 % at a width of 10^2.5. PAGER's own σ_ln on those rows not read.                                                                                        |
| E5     | Not met: the envelope has no depth cells, and the input check flags only depths beyond 100 km.                                                                                                                                                    |
| T1     | On the 113 DART records of BM-05, now read: 1.00× at the median event, σ_ln 0.44, 0.84× beyond 7 000 km. No held-out set.                                                                                                                         |
| T2–T4  | Not measured offline: the coast needs bathymetry, and the arrival times' citation did not exist.                                                                                                                                                  |
| T5     | Not met: waves carry no band.                                                                                                                                                                                                                     |
| L1     | Not met: the relation in place is Watts 2000's cube-root scaling with prefactors set on Anak Krakatau, Storegga and Vaiont; Heller et al. 2009's Example 1 is reproduced only in the benchmark.                                                   |
| L2, L3 | Not met: two rows, both tuned; 0.36× the centre of Heller's band; no sampler.                                                                                                                                                                     |
| I1     | Not met for the air blast of ground impacts (0.24× to 8.4× EIEP), the crater depth (about 1.3×, declared), the impact tsunami (BM-09) and the visible fraction of the fireball (Eq. 36\*).                                                        |
| I2, I4 | Not measured.                                                                                                                                                                                                                                     |
| I3     | Not met: Tunguska's 20 kPa ring 0.43× the flattened forest; Chelyabinsk's 1 kPa ring 0.54× on a re-run that is not a validation.                                                                                                                  |
| N1     | Not met: blast rings 1.09× NUKEMAP, overpressure 1.07× Kingery–Bulmash; burns 0.81× NUKEMAP at fixed exposures; radiation a project fit; height of burst set on Hiroshima; crater 0.40× to 0.80× NUKEMAP's radii.                                 |
| N2     | Not measured.                                                                                                                                                                                                                                     |
| N3     | Not met: two tolls, both tuned, on a band of 10^0.1 that Beirut misses by 6.6×.                                                                                                                                                                   |
| V1     | Not met: ash 0.51× Tephra2 on the wind axis, σ_ln 2.71; currents a project mobility.                                                                                                                                                              |
| V2     | On IVESPA 1.0, now read: 0.95×, σ_ln 0.44.                                                                                                                                                                                                        |
| V4, V5 | Not met: Fuego 2018's current 3.7 km against 11.7, Unzen 1991's 0.84 against 3.2; one held-out toll of three inside, 0.21×.                                                                                                                       |
| C1–C3  | Not met.                                                                                                                                                                                                                                          |

## What has moved since

- **16 September 2026, I2 measured and missed.** Rules 76 to 79 put the entry
  model to the 357 bolides of NASA JPL's fireball catalogue that carry an
  altitude of peak brightness, a speed and an energy — the first held-out
  reading of an impact quantity. It bursts a median 13.7 km above the altitude
  the sensors measured and 12.8 km above on average, where I2 asks 5 km and 3
  km. Declared in the validation report.
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
