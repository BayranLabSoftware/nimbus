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

## After the campaign: the airburst's blast (BM-02)

Written on 15 September 2026, after the report and before the checks below
were run. It fixes what replaces the altitude factor on an airburst's shock,
what the replacement is held to, and what may be done with the answers.

### What is replaced, and by what

The shock radii of an airburst are Kinney & Graham's surface-burst reach on
half the atmospheric yield, multiplied by f(h) = (P₀/P(h))^(3/5) with a cap
of 15. The exponent was fitted on two events and the cap has no source. It is
replaced by the air-blast model of the Earth Impact Effects Program as its
authors publish it:

1. **Energy.** W = E₀ · max(f, 1 − f), f = (v_b/v₀)²: the larger of the
   kinetic energy the body keeps at the burst altitude and the energy it has
   given the air there (Collins et al. 2017, "three improvements to the web
   program"), with v_b from Collins et al. 2005 Eq. 19 as the entry already
   computes it. No blast coupling factor: both relations below are fits to
   nuclear yields and the program feeds them the impact energy.
2. **Scaling.** r₁ = r / W_kt^⅓ and z₁ = z_b / W_kt^⅓, W_kt = W / 4.184 × 10¹² J
   (2005 Eq. 57).
3. **Regular reflection.** p = 3.14 × 10¹¹ (r₁² + z₁²)^(−1.3) +
   1.8 × 10⁷ (r₁² + z₁²)^(−0.565) Pa (2017 Eq. 7, which replaces 2005 Eqs.
   55–56).
4. **Mach reflection.** For z₁ < 550 m, from r_m1 = 550 z₁ / (1.2 (550 − z₁))
   outwards (2005 Eq. 58): p = (p_x r_x / 4r₁)(1 + 3 (r_x/r₁)^1.3), with
   p_x = 75 000 Pa and r_x = 289 + 0.65 z₁ (2005 Eq. 54 and the text under
   it). Above 550 m there is no Mach region. The published law steps at
   r_m1; the step is kept.
5. **Range.** Within r < 3 z_b the overpressure is a range from p to 2p: the
   static source is the low end, the moving source the high one (2017, the
   third improvement). Nimbus's rings (5, 1, 0.5 psi) and everything
   downstream of them use the low end; the high end is printed beside it.
6. **Ring radius.** The largest ground range at which the overpressure
   reaches the threshold, no farther than half the Earth's circumference.

Nothing in it is set by Nimbus. It applies to complete airbursts only: the
flash radii, a swarm that strikes the ground, and the blast of a ground
impact are unchanged.

What was looked at before this was written: the campaign's 636 EIEP point
overpressures of airbursts were used to read how the program combines the
published pieces — which region applies where, and which energy it feeds
them. With them, the law above reproduces 618 of the 636 within 1 %, so they
are code verification and are not held out. While reading the paper, two
numbers of the 0.5 Mt row of Table 2 were estimated by hand from Eq. 7
alone (2.75 kPa at ground zero against 3.81; the 1 kPa range 43 km against
52.3). Nothing else below has been computed.

### Checks, held out

- **H1, code verification (class A).** The 24 airburst rows with a printed
  overpressure in `validation/eiepReference.ts` (read 14 September 2026, a
  grid the campaign did not use), with Nimbus's own entry: within 1 % plus
  the printed rounding. Rows where Nimbus's burst altitude is more than 1 %
  from the program's (BM-13) are reported apart. A row outside is a
  candidate implementation defect.
- **H2, the simple law against the paper's shock-physics runs (class B).**
  Collins et al. 2017 Table 2, static source (S) at the burst altitudes the
  paper gives, the law fed W directly. Nimbus's low end against S; its high
  end against the moving source (M) as a sensitivity row. Flag if the median
  |ln ratio| exceeds ln 1.25. A cell the paper marks n/a (not reached) is
  checked as not reached.

  | W (Mt) | z_b (km) | Peak p S / M (kPa) | p at 3 z_b S / M (kPa) | 1 kPa S / M (km) | 10 kPa S / M (km) | 20 kPa S / M (km) | 35 kPa S / M (km) |
  | -----: | -------: | -----------------: | ---------------------: | ---------------: | ----------------: | ----------------: | ----------------: |
  |    0.5 |     21.5 |        3.81 / 5.27 |          0.786 / 0.811 |      52.3 / 54.8 |         n/a / n/a |         n/a / n/a |         n/a / n/a |
  |      5 |       14 |        21.6 / 35.2 |            4.16 / 4.41 |        142 / 140 |       18.7 / 22.4 |       4.48 / 11.8 |        n/a / 1.16 |
  |     15 |       10 |         65.8 / 143 |            11.8 / 13.0 |        257 / 236 |       34.4 / 36.2 |       19.2 / 22.1 |       11.1 / 14.9 |
  |     50 |       11 |          116 / 326 |            19.6 / 20.5 |            — / — |       57.0 / 54.3 |       32.4 / 33.5 |       20.4 / 23.3 |

  (— : too low to be seen in the paper's mesh; not compared.)

- **H3, two events (class C).** On Nimbus's presets as the app runs them.
  Chelyabinsk: the range at 1 kPa, the overpressure Collins et al. 2017 take
  for window damage, against the radius of a circle of the ~10 000 km² over
  which Popova et al. 2013 found windows broken, 56.4 km. Tunguska: the range
  at 20 kPa against the radius of a circle of the ~2 200 km² of flattened
  forest, 26.5 km; the range at 10 kPa, the factor of two the paper allows
  for terrain and the state of the trees, reported beside it. Flag outside
  ×2. The presets' energies are estimates (0.33 Mt against Chelyabinsk's
  ~0.5 Mt; Tunguska inside 3–15 Mt) and the footprints are not circles.
- **H4, invariants.** `scripts/benchmark/invariants.ts` rerun on the impact
  hazard, same seed and 5 000 cases; the failures before and after are
  counted by invariant. A break at r_m1 is the published law's and is
  reported, not smoothed.
- **H5, the campaign's IMP track.** `compare-impact.ts` rerun on the
  campaign's EIEP answers: the airburst overpressure becomes class A. The
  program's airburst radii lie where its own printed overpressure is about
  26.4, 5.5 and 1.6 kPa rather than at the 20, 5 and 1 kPa its map labels
  (the airburst side of BM-17); they stay class B with that note.

### What may be done with the answers

The law is adopted if H1 holds, rows reported apart excepted. H2 to H5 do not
decide it: a flag goes into the declared gaps with its numbers. No
coefficient is changed after any check has run; an H1 row outside tolerance
is corrected only where the code departs from the papers, and that departure
is reported. The campaign's result files are not rewritten: the numbers after
the change are recorded in `docs/SCIENCE.md` and the changelog.

### Added after H3 was seen: Chelyabinsk's inputs

Written on 15 September 2026, after H3 flagged Chelyabinsk and before the
preset below was run. It is not a held-out check, and it says so.

The preset flew a 17 m body of 3.0 g/cm³ at 19 km/s and 18°, 0.33 Mt. The
source it cites, Popova et al. 2013 (Science 342, Table 1 and text), measured
19.16 km/s at 18.3° from the horizon, and derives a diameter of 19.8 m for
their 590 kt at the 3.3 g/cm³ of the recovered meteorites. The preset takes
those four values, from the source and not from the check. Its strength stays
at the S-type class, 2 MPa: Popova et al. model a fragmentation that starts at
0.2 MPa and hardens as the pieces shrink, which a single strength does not
represent, and choosing one now would be choosing with the check in view.

Nothing else moves: not the blast law, not its energy rule, not H3's
thresholds or footprints. H3 is reported again with the new inputs beside the
old, as a re-run and not as a validation.

No line source is added. The only analytic one, ReVelle's weak-shock
cylindrical source, is "largely inapplicable" beneath Chelyabinsk's trail, by
the account of those who applied it there (Gi, Brown & Aftosmis 2018, MAPS,
arXiv:1802.07299: within one blast radius the ambient pressure changes by a
factor of several), and the elongated footprint has been reproduced only by
three-dimensional hydrocodes (Popova et al. 2013, SOVA; Aftosmis et al. 2016,
Cart3D), whose authors also find the damaged area set mainly by the total
energy and its shape by how the energy is spread along the path. The declared
gap says so.
