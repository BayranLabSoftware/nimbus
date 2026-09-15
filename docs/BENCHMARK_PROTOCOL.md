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

## After the campaign: the far wave of a megathrust (BM-05)

Written on 15 September 2026, before any deep-ocean record other than the one
named below was read and before either model was run on one.

### What is already known, and so not held out

The campaign found Nimbus's published megathrust amplitude 0.92× the exact
linear solution for its own rupture at 100 km and 0.28× at 3 000 km: the
wave is spread as a ring leaving a disc half the down-dip width across, where
a rupture hundreds of kilometres long keeps its broadside wave far longer.
The one far-field record the model was checked on, Tōhoku 2011 at DART 21413,
has stood in the project at "about 30 cm". Before this was written the NOAA
NDBC file for that buoy (`21413t2011.txt.gz`) was read: detided with a
polynomial over ±14 h, its largest crest is 0.88 m at 1 h 20 min after the
origin. At that buoy Nimbus's law gives 0.29 m and the exact linear solution
for a uniform slip on Nimbus's rupture 0.87 m (flat ocean, 24° off the
broadside). Those three numbers are not evidence for either model. Davies
2019 (GJI 218: 1939) had already tested that source family, Strasser et al.
2010 areas with uniform slip, against DART buoys with a full propagation
model, and found it biased low.

### The records

- **Events.** Every earthquake in USGS ComCat from 2006 to 2025 of preferred
  magnitude 7.7 or more and depth 71 km or less, after Davies 2019, whose
  preferred moment tensor has a nodal plane dipping 45° or less with a rake
  between 45° and 135° (a thrust). An event within 24 h after a larger one of
  the set, whose wave it would overlap, is left out.
- **Stations.** Every DART station with an NDBC historical file for the
  event's year, at the position NDBC's station table gives.
- **A record.** The water-column height from 3 days before to 3 days after
  the origin, detided by a least-squares fit of the constituents M2, S2, N2,
  K2, K1, O1, P1 and Q1 plus a quadratic drift to every sample outside the
  window from 1 h before the origin to 30 h after it. The tsunami window runs
  from the arrival at 250 m/s along the great circle, less 30 min (never
  before 20 min after the origin, which leaves out the Rayleigh waves), to
  3 h after the arrival at 150 m/s. A record counts only if samples of 1 min
  or finer cover at least 90 % of that window. Its crest is the largest
  detided value in the window; its range, largest less smallest.
- **Detection.** A record whose range is under 2 cm, or under five times the
  standard deviation of the detided samples in the 3 h before the origin, is
  left out. An event with fewer than four records left is left out.

The script that does this is committed with its output, the list of records,
before either model is run on them.

### The two models

- **C0, Nimbus's law as it stands.** The amplitude
  `seismicTsunami.ts` publishes toward a receiver, at the great-circle
  distance: the initial amplitude from Strasser et al. 2010's area and the
  couplings 0.6 and 0.7, the ring spreading from half the down-dip width, the
  dispersion of a wave twice that width over 4 000 m, and the beam toward the
  receiver's bearing from the strike of the thrust plane.
- **C1, the same rupture as physics propagates it.** Okada's deformation of a
  uniform slip over Nimbus's own rectangle — the same length, width and mean
  slip — on the thrust plane's strike and dip, rake 90°, the top at 5 km,
  centred on the epicentre; its exact linear, non-dispersive solution on a
  flat ocean (Poisson's formula, the check the campaign used), at the
  receiver's distance and azimuth from the strike. No coupling factor: the
  deformation is the source. Its crest is compared with the record's crest,
  its range with the record's range.

A third row, C1 with Nimbus's dispersion factor applied to its crest, is
reported beside them and decides nothing.

### The score, and what may be done with it

For each model and record, ln(model / observed) of the crest. An event's
score is the median over its records; a model's bias is the median over
events of those scores, and its scatter their standard deviation. The model
with the smaller absolute bias is the one the far wave is built on; if the
two are within ln 1.25 of each other, the smaller scatter decides. The
ranges are reported and decide nothing.

If C1 wins, Nimbus replaces the ring spreading and the couplings with a
propagation of that source, and the replacement is held to C1 on these
records, within 15 % of its crest, before it ships; the recorded row for
DART 21413 takes the 0.88 m of its own file whichever model wins. If C0 wins,
BM-05 is declared with these numbers. Nothing is tuned on the records: a
model that loses is not adjusted and run again.

### Amendment of 15 September 2026: the records read again

Written after `dart-records.py` had read the records under the rules above
(its output is in the commit that precedes this one) and before C0 or C1 was
computed for any of them. It changes how a record is read, not the events,
the models or the score, and each change answers something that reading
showed:

- **Bad samples.** The transmitted values carry errors of metres (32.8 m and
  16.4 m are 2¹⁵ and 2¹⁴ mm, a flipped bit), and the rules kept them: Haida
  Gwaii 2012 had a crest of 32.5 m at DART 51407, Illapel 2015 one of 22.4 m
  at 51426.
- **Seismic waves.** Within a few hundred kilometres the 15-s values swing
  by a metre and more from one sample to the next for tens of minutes, past the
  20 min the rules set aside: Chignik 2021 had its crest of 1.2 m at 46403,
  302 km away, 25 min after the origin, inside that noise.
- **The level across the gap.** The tide fit misses the level inside its
  31-h gap. On 479 eight-hour windows of days chosen at random
  (`dart-tide-gap.py`) the largest miss is 1.9 cm at the median and 4.4 cm
  at the 95th percentile. Kamchatka 2025-09-18's records sat 2 to 4 cm below
  the prediction, and three of the five had crests between −8 mm and +1 mm,
  where ln(model / observed) has no value.
- **Coverage.** A DART stays in event mode for about 4 h, while the window
  grows by 2.67 s for every kilometre (7.2 h at 5 000 km): unless a station
  was held in event mode for the whole window, a far record failed the rule
  whatever its quality. Maule 2010, read at 35 stations, kept three.

The rules that replace the reading of a record:

- A time stamped twice for the same kind of sample keeps the mean of its
  values.
- **Bad samples** are dropped by Hampel's identifier on the tide residual: a
  sample further from the median of the samples of its kind within 5 min
  (for 1-min and 15-s samples) or 75 min (for 15-min samples) than five
  scaled median absolute deviations, and than 1 cm. The tide is fitted again
  without them, until no sample is dropped. Davies 2019 also replaced
  spikes, by interpolation.
- A record is left out when more than 5 % of its high-rate samples in the
  window were dropped, or when its residual outside the gap has a standard
  deviation above 2 cm, a level the tidal model does not describe to the
  centimetre (the median record's is 0.7 cm).
- **Seismic noise.** The high-rate residuals are averaged into 1-min means,
  gaps of up to 3 min are bridged, and every stretch of 30 min or more is
  low-passed at a 3-min period (Butterworth, fourth order, run forward and
  back). A wave twice the down-dip width of a magnitude 7.7 rupture (Strasser
  et al. 2010) takes 11 min to pass over 4 000 m of water, a period the
  filter keeps within 0.1 %.
- **The crest** is the highest value of that record in the window above its
  median in the window; the range, highest less lowest.
- **Detection** keeps the range rule and adds one for the crest: at least
  2 cm, and 2.5 times the standard deviation before the origin. On the days
  chosen at random, the highest value above the median is 1.0 cm at the
  median and 1.9 cm at the 84th percentile.
- **Coverage**, in place of the 90 %: the record holds at least an hour of
  the window, and its crest lies at least 30 min inside the stretch of
  samples that holds it, unless that stretch reaches the window's own edge.
  Davies 2019 read up to 3 h of the wave within the high-rate sampling,
  rather than asking the sampling to span a fixed window.

**Four readings, one decision.** The floor of the crest (2 cm, or 1 cm) and
the coverage (the crest bracketed as above, or 90 % of the window as first
registered) are crossed into four readings. Each keeps the events with four
records or more, and the decision rule above is applied to each. A model is
chosen only if all four readings choose it; if they part, BM-05 is declared
undecided with the four results, Nimbus keeps its law, and the gap stays
declared. The numbers quoted first are those of the bracketed, 2-cm reading.
If C1 is chosen, its replacement is held to C1 on the records of all four.

The recorded row for DART 21413 takes the crest this reading gives, 0.81 m,
not the 0.88 m above, which came from a polynomial detide over ±14 h.

The amended script, its output and `dart-tide-gap.py` are committed before
either model is run on a record, as the rules were.

## After the campaign: people and deaths against PAGER (BM-03)

Written on 15 September 2026, before either chain named below was run on
any earthquake the campaign's EQ-PAGER track holds. The rules are numbered
after the thirty of the validation harness and live with them, in
`src/physics/validation/pagerChain.ts` (rules 31 to 34); the PAGER products
they score against are stored first, in `pagerProductsData.ts`, as
`scripts/benchmark/pager-bench.ts` read them on 15 September 2026.

### What is already known, and so not held out

The campaign measured the chain in place on those 187 earthquakes: people at
MMI VII and above 0.13× PAGER's, at VIII and above 0.07×, nobody at IX where
PAGER counts people, the central toll 0.30× PAGER's estimate and the alert in
agreement for 66 % of them. Reading the code of both sides then found three
causes, none of them a fit:

- PAGER counts intensity k from k − ½ to k + ½, the banding of ShakeMap's
  legend; the simulator's VII starts at 7.0.
- The rings convert Boore et al. 2014's median PGA with Worden et al. 2012's
  PGA relation, and PGA saturates: the highest intensity the median reaches
  is 8.0 to 8.8 for any magnitude on any ground, so IX is empty by
  construction. ShakeMap takes intensity from PGV where it has one. With
  Boore et al. 2014's median PGV and Worden et al.'s PGV relation — computed
  for reverse faulting on Vs30 760 and 522 m/s only, on no earthquake of the
  set — the ring at MMI 7.0 reaches 0.25–0.6 of the PGA ring's radius at
  Mw 6, 0.8–0.9 at Mw 6.5, 0.9–1.1 at Mw 7, 1.1–1.2 at Mw 7.5 and 1.2–1.3 at
  Mw 8, and IX appears from about Mw 7.8 on soft ground.
- PAGER's empirical model counts deaths in the bins from V to IX, each at
  the rate of its integer intensity; the simulator counts them from VII, at
  the rates of 7.5, 8.5 and 9.5.

On rule 11's held-out tolls the chain in place reads 1.46×, 0.33× and 1.94×
by magnitude cell, a mean absolute log bias of 0.72, holding 122 of 132, 106
of 112 and 32 of 35 records (`docs/SCIENCE.md`, "The ground under the
rings").

### The chains, the score and the decision

Rule 31 defines the chain in place and PAGER's chain — Boore et al. 2014's
median PGV through Worden et al. 2012's PGV relation, banded and weighted as
PAGER's loss model bands and weights it, with everything else shared — and
holds the new relations to their authors' code before any score. Rule 32
scores each chain's people at and above VII, VIII and IX, as its own bands
count them, against PAGER's on the 187 earthquakes. Rule 33 adopts PAGER's
chain only if its people score is lower by ln 1.25 or more, and if it does
no worse than the chain in place, by more than 0.10, on rule 11's held-out
dead and on rule 18's ShakeMaps, holding eight records in ten in every
magnitude cell. Rule 34 lists what is printed beside and decides nothing.
Nothing in either chain is tuned on these sets.
