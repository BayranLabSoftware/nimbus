# What is missing, and what each missing thing needs

Read from the scorecard of `src/physics/validation/goldStandardScorecard.ts` on
19 September 2026. Thirty-eight rules do not hold. This file sorts them by
**what would have to happen**, because the answer is almost never "find a better
paper": it is usually "a reference tool has never been run" or "the set does not
exist".

The four families, with counts:

| Family                                            | Rules | What it needs                                          |
| ------------------------------------------------- | ----- | ------------------------------------------------------ |
| A reference exists and has never been run         | 8     | machine time, and sometimes a platform                 |
| The set does not exist                            | 10    | data hunting, and a decision about what it is spent on |
| Our own housekeeping                              | 10    | code, no new science                                   |
| A relation of ours has no published law behind it | 10    | literature, then a round                               |

A note that governs the second family: **reading a set spends it.** A set read
to measure a law can no longer measure that law's band (G3), and Andrea's
standing rule is bands before sets. Every row below that spends a set says so.

---

## A: a reference exists and has never been run

| Rule       | What has never run                                                                              | Cost                                                                                                              | Spends a set                   |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| E1         | ShakeMap, as a scenario without stations, on the maps already read                              | the program; the atlas is in hand                                                                                 | no — the maps are read already |
| E3         | PAGER's own σ_ln on the same rows                                                               | PAGER is in hand (`scratchpad/oq`, `bench/pager`)                                                                 | no                             |
| T1         | GeoClaw over real bathymetry — it has only run over a flat ocean                                | GeoClaw **runs here since 19 September** (short path required); the fixtures need regenerating on real bathymetry | no                             |
| T2         | the same, on the coastal bins                                                                   | as T1                                                                                                             | no — the run-up set is read    |
| T3         | a reference travel-time computation on the records                                              | a travel-time atlas or GeoClaw                                                                                    | no                             |
| V3         | Tephra2 on a set of isopach maps — the binary is built and has run on forty eruptions           | building the isopach set                                                                                          | **yes**                        |
| V4         | the energy cone and LaharZ on a set of currents                                                 | ECMapProb runs (19 September); LaharZ needs ArcGIS, so its published example is the check                         | partly                         |
| G1 (waves) | the far-field and run-up relations held to a reference within 1 %, not to fixtures by tolerance | as T1                                                                                                             | no                             |

## B: the set does not exist

| Rule  | The set                                                               | What is known about finding it                                                                                           | Spends             |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| N2    | accidental explosions with an independent yield and a measured radius | sixteen events examined, two survive (Port Chicago 1944, Xiangshui 2019); the five next best each fail on one leg        | —                  |
| T4    | tsunami tolls, held out                                               | NCEI has the deaths; the wave rows already read most large events                                                        | yes                |
| V2    | eruption columns outside IVESPA 1.0                                   | one clean phase found in thirty (Raikoke 2019); most candidates are already in IVESPA or derive the rate from the height | yes                |
| V5    | volcanic tolls                                                        | one of three inside, 0.21×                                                                                               | yes                |
| E5    | depth cells for the calibration envelope                              | the atlas has no event deeper than 71 km                                                                                 | —                  |
| G3 ×3 | a band scored on a held-out set, for impacts, explosions, waves       | this is the deepest gap in the project: **no quantity anywhere carries one**                                             | yes, by definition |
| G4 ×4 | measured cells, for every domain                                      | —                                                                                                                        | yes                |

## C: our own housekeeping

| Rule             | What it is                                                                                            | Cost                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| G5 (earthquakes) | 16 sweep failures: rings stepping over their thresholds                                               | read the invariants file, fix or declare             |
| G5 (impacts)     | 464 sweep failures; 38 are an airburst's magnitude falling as the body grows, as the reference's does | most are declared already; the file needs re-reading |
| G5 (waves)       | the sweep checks the shaking's rings and not the wave's                                               | extend the sweep                                     |
| L3               | no Monte Carlo sampler for landslides                                                                 | wire the existing sampler                            |
| T5               | waves carry no band                                                                                   | the bands exist for other domains                    |
| G6 ×6            | the report declares gaps that are not ceilings, and a 9 may carry only ceilings                       | go through the declared gaps and separate the two    |

## D: a relation of ours has no published law behind it

| Rule        | The quantity                            | What we use                                                   | What the field uses                                           |
| ----------- | --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| V1 (flows)  | pyroclastic current reach               | `L = 10·V^⅓` km, **a Nimbus volume scaling**                  | the energy cone, H/L from a calibration (Aravena et al. 2022) |
| V1 (lahars) | where a lahar goes                      | a circle about the vent                                       | LaharZ: a valley filled from a DEM until the area law is met  |
| E2          | people inside MMI VII                   | 0.13× PAGER's, σ_ln 2.18                                      | PAGER's own exposure                                          |
| I3          | an airburst's damage radius             | 0.43× Tunguska's flattened forest                             | — (this is a measurement, not a missing law)                  |
| N3          | explosion tolls                         | two, both tuned; Beirut 6.6× outside its band                 | —                                                             |
| L1          | a submarine slide, and a confined basin | the project's calibrated forms, which no worked example holds | Watts et al. 2005 (paywalled); the manual's 2-D case          |

---

## What this map says

Only family D is a literature problem, and half of it is a measurement rather
than a missing law. The two biggest levers are elsewhere:

1. ~~**Install GeoClaw.**~~ Done on 19 September: the Chile 2010 example runs
   here and gives a gauge series at DART 32412 with a crest of 0.178 m against
   about 0.2 m observed. Four rules wait on what comes next — regenerating the
   fixtures on real bathymetry (T1, T2), a reference travel time (T3), and
   holding our relations to it within 1 % rather than to fixtures by tolerance
   (G1-waves).
2. **Decide what the remaining sets are spent on.** G3 has no band anywhere in
   the project, in any domain, and every unread set is a candidate for one. That
   is a choice about the shape of the 9, not a task.

And one thing that is neither: **G6 appears six times** and is the same
sentence every time — the report declares gaps that are not ceilings. That is
an afternoon of honest editing, and it unblocks a clause in every domain.
