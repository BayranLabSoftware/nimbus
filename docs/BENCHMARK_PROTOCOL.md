# Benchmark protocol: Nimbus against the reference software of each hazard

Written and committed on 15 September 2026, before any reference program was
asked a single case of it. The results are reported in
`docs/BENCHMARK_REPORT.md`; anything done differently from what is written here
is listed there as a deviation, with its reason.

## Purpose

To say where Nimbus stands against the programs the field uses, hazard by
hazard, for the presets and across the space of inputs a visitor can set. The
campaign measures; it does not tune. The physics is frozen at commit `2dfe0c3`
for its whole length: no model code changes until the report is written, and a
discrepancy found is recorded, not fixed.

## Standards

The campaign is organised after NASA-STD-7009A (Standard for Models and
Simulations) and ASME V&V 10 and V&V 20: each comparison is labelled as code
verification (the same published equations, implemented twice) or as
validation against another model (different equations for the same quantity),
and the report is written against 7009A's credibility factors — verification,
validation, input pedigree, uncertainty, robustness, use history.

## The cases

`scripts/benchmark/matrices.ts` writes every case to `benchmark/matrices/`,
deterministically: the presets of each hazard, a structured grid that walks
each input across its range with the others held, and — for impacts — a Latin
hypercube over the whole input space with the seed
`benchmark-2026-09-15-impact`.

| Matrix            | Cases | Inputs                                                             |
| ----------------- | ----: | ------------------------------------------------------------------ |
| `impact.json`     |   194 | diameter, density, velocity, angle, target; 8 distances each       |
| `nuclear.json`    |    29 | yield, height of burst; 8 ranges each                              |
| `chemical.json`   |    10 | TNT mass; 11 scaled distances each                                 |
| `earthquake.json` |   346 | magnitude, fault type, depth, Vs30; 13 distances each              |
| `tsunami.json`    |    23 | Gaussian humps and megathrusts in a flat ocean; 4 to 6 gauges each |
| `volcano.json`    |    70 | eruption rate, erupted volume, wind; 7 downwind distances each     |
| `landslide.json`  |    48 | volume, slope, water depth                                         |

The earthquake death-toll track uses the events USGS PAGER has a loss product
for among rule 11's set (`validation/heldOutByRule.ts`), rule 23's recorded
earthquakes and the net's earthquakes.

## Tracks, references and classes

A comparison is **class A** when Nimbus implements the reference's own
published equations (code verification), **class B** when both implement the
same physical model family with different choices, and **class C** when the
models differ.

| Track    | Nimbus output                                                                                             | Reference                                                                                                                                                                                                                                                                         | Class                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| IMP      | Atmospheric entry, crater, fireball, thermal exposure, seismic shaking, ejecta, air blast, impact tsunami | Earth Impact Effects Program (Collins, Melosh & Marcus 2005), public web service                                                                                                                                                                                                  | A for entry, crater, fireball and ejecta; B for air blast, thermal and seismic; C for the tsunami |
| NUC      | Fireball, 20/5/1 psi, burns of three degrees, initial radiation                                           | NUKEMAP (Wellerstein; browser effects library after Glasstone & Dolan 1977 and Brode) and the Nuclear Bomb Effects Computer (Fourmilab, after the 1962 slide rule)                                                                                                                | B                                                                                                 |
| CHEM     | Overpressure radii of a surface charge                                                                    | Kingery–Bulmash polynomials as UFC 3-340-02 and Swisdak 1994 give them                                                                                                                                                                                                            | B                                                                                                 |
| EQ-GM    | Ring radii at MMI VII, VIII, IX; PGA with distance                                                        | OpenQuake Engine: Boore et al. 2014 (identity check, A); Abrahamson et al. 2014, Campbell & Bozorgnia 2014, Chiou & Youngs 2014 on a finite rupture, and Allen et al. 2012 for intensity (C); for subduction interface presets, Abrahamson et al. 2016 and Parker et al. 2020 (C) | A / C                                                                                             |
| EQ-PAGER | Population at MMI VII+, VIII+, IX+ and the central toll                                                   | USGS PAGER loss products (exposure by intensity, empirical fatalities)                                                                                                                                                                                                            | C                                                                                                 |
| TSU      | Amplitude and arrival time at gauges                                                                      | GeoClaw (Clawpack 5.14), shallow-water on the sphere, flat bathymetry for the matrix; the 15 existing GeoClaw fixtures                                                                                                                                                            | C                                                                                                 |
| VOL      | Tephra loading and 1 mm isopach downwind                                                                  | Tephra2 (GPL-3.0, run locally) with Nimbus's plume height, erupted mass and wind                                                                                                                                                                                                  | C                                                                                                 |
| LAND     | Landslide wave amplitude                                                                                  | Heller, Hager & Minor 2009 (VAW 4257) impulse-wave equations                                                                                                                                                                                                                      | C                                                                                                 |
| INV      | Every output of every hazard                                                                              | Invariants: finite and non-negative, monotone in energy or size, rings within the antipode, continuity at regime switches; 5 000 random custom scenarios a hazard                                                                                                                 | pass / fail                                                                                       |
| UI       | The panel and report of every preset                                                                      | The same inputs through the physics in Node                                                                                                                                                                                                                                       | exact to displayed precision                                                                      |

Where a leading program is not accessible it is named and not replaced by
guesswork: DTRA HPAC/NUCFAST and USACE ConWep (restricted), FEMA Hazus (needs a
paid GIS), NOAA MOST/SIFT (internal), iSALE (licence on request), HYSPLIT and
the Ash3d web service (registration). Pyroclastic currents and lahars have no
reference in this campaign.

## Metrics and acceptance

For every quantity and every case the ratio Nimbus / reference is recorded,
with both values. A case where either side is zero or undefined is counted
apart, with its reason.

- **Class A** — the largest relative difference and the share of cases within
  1 %. A case beyond 1 % is a candidate implementation defect.
- **Class B** — geometric mean ratio, scatter σ_ln, median |ln ratio| and the
  shares within ×1.25, ×2 and ×10. A quantity whose median |ln ratio| exceeds
  ln 1.25 is flagged for review.
- **Class C** — the same statistics, with no pass or fail. A quantity whose
  geometric mean ratio lies outside ×2 is flagged for review.
- **INV** — a failure is any case that breaks an invariant.
- **UI** — a failure is any displayed number that differs from the Node physics
  beyond its displayed precision.

Every statistic is given for the presets and for the custom cases separately,
and by the size bands of the scorecard (`validation/scorecard.ts`).

## Conduct

- The reference programs are installed in a scratch directory, their own
  examples run first, and their versions and the SHA-256 of every file
  downloaded are recorded.
- Public web services are queried one request at a time with pauses, and the
  NUKEMAP casualty service is not used.
- A reference that cannot be installed or does not answer is recorded as such;
  the other tracks go on.
- Outputs are kept raw in scratch and summarised in `benchmark/results/`; the
  report is generated from those summaries.
- Findings are listed with a reproducer and a classification: implementation
  defect, model-form difference, reference limitation, or input mismatch.
  None is fixed during the campaign.
