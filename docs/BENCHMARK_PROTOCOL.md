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

## After the campaign: the rings of a subduction interface (BM-10)

Written on 15 September 2026, before either candidate named below was coded
or run on any earthquake. The rules are numbered after the thirty-four of
the validation harness and live with them, in
`src/physics/validation/interfaceRules.ts` (rules 35 to 39); what USGS says
each earthquake is comes first, in `interfaceSetData.ts`, read from the
preferred ShakeMap's `info.json` of every earthquake of rule 11's and rule
23's sets by `scripts/build-interface-set.ts`.

### What is already known, and so not held out

The campaign compared the five megathrust presets with two interface models
in OpenQuake: Boore et al. 2014's rings at 4.2× Abrahamson, Gregor & Addo
2016's and 6.0× Parker et al. 2022's, a figure made at MMI VIII, which those
models reach only at the edge of the rupture; at MMI VII the rings were 0.71×
and 0.83× theirs. On rule 18's ShakeMaps, the law in place — no candidate —
was then read on the 76 reverse-faulting earthquakes of Mw 7 or more: at MMI
VII it draws 0.98 of Tōhoku 2011's area, 0.78 of Maule 2010's, 0.47 of
Kamchatka 2025's and Chignik 2021's and 0.19 of Ecuador 2016's; at MMI VIII
1.8 times Tōhoku's, 5.6 times Chignik's, and ground at Maule and Iquique 2014
where their maps hold none. One `info.json` (Kamchatka 2025) was opened to
see what it carries, and once the set was read, the count of maps that carry
STREC's probabilities (244 of 1 177) and of the earthquakes rule 35 then
classes as interface events: 98 of rule 11's maps and 353 of rule 23's.

### The candidates, the score and the decision

Rule 35 takes the earthquakes whose ShakeMap was drawn with a ground-motion
model giving its subduction-interface models a weight of 0.5 or more — the
weight ShakeMap's select module sets from STREC and Slab2 — and runs every law
on rules 1 to 3's inputs with the scenario marked a subduction interface.
Rule 36 names the candidates for such a scenario, Abrahamson, Gregor & Addo
2016 and Parker et al. 2022, each on median PGA through Worden et al. 2012,
with the rupture distance taken from the depth, and holds both to
OpenQuake's implementation within 0.1 % before any score. Rule 37 scores the
three laws on those ShakeMaps as rule 18 scores a law, four ways — each set on
rock and on the browser's ground — and a candidate must beat Boore et al.
2014 by 0.05 in every one. Rule 38 checks a winner on rule 11's held-out tolls
of those earthquakes and on rule 23's quiet ones, as rules 19 and 25 do, and
says what an adopted law draws. Rule 39 lists what is printed beside and
decides nothing, among it the maps with ten stations or more, since a map of
few stations is mostly the models USGS runs, and both candidates are among
them. Nothing is tuned on these sets.

### Outcome

Run once on 15 September 2026, after the candidates were committed
(`2456244`). Both beat Boore et al. 2014 in every reading and Parker et al.
2022 won (a sum of 4.35 against BC Hydro's 5.16 and Boore et al.'s 9.77); on
the dead it raised fewer quiet earthquakes to a toll of ten (0.3 % against
11.9 % of 352), but its band held none of five, eight of 22 and 11 of 16 of
rule 11's records, so by rule 38 it is not adopted. BM-10 is declared with
these numbers; `docs/SCIENCE.md` gives them in full, with what was read
afterwards.

## After BM-10: whether an interface scenario below Mw 7.5 is a stadium

Written on 15 September 2026, before either geometry named below was run on
any earthquake of the set it names. The rules are numbered after the
thirty-nine before them and live in
`src/physics/validation/interfaceStadiumRules.ts` (rules 40 to 44); the set
comes first, in `deepInterfaceSetData.ts`, read by
`scripts/build-deep-interface-set.ts`.

### What is already known, and so not held out

A scenario marked a subduction interface is a rupture stadium at every
magnitude; any other becomes one from Mw 7.5. Rule 38's run of BM-10 found
the mark taking Boore et al. 2014's held-out tolls of rule 11's interface
earthquakes from 5.06×, 1.98× and 5.37× their records, unmarked, to 43.11×,
35.77× and 13.21×. Below Mw 7.5 a marked scenario drawn as a disc is the
unmarked one, so on rule 11's and rule 23's sets the candidate's figures are
already known, and those sets decide nothing here. Before the rules were
written, ComCat's count of the events rule 40 lists was read (179), and once
the set was read, only its counts: 153 with a map, 64 interface earthquakes,
43 below Mw 6.5 (42 quiet) and 21 from it (11 quiet), nine maps with ten
stations or more. No footprint, map area or toll of the set was looked at.

### The geometries, the score and the decision

Rule 40's set is every ComCat earthquake of Mw 6 to 7.5, 2008 to 2025, deeper
than 40 km and no deeper than 70 km, with a ShakeMap and in neither rule 11's
nor rule 23's set: none of them has been read by a rule. Rule 41's candidate
draws a marked scenario as a stadium from Mw 7.5 only, a disc below; all else
is shared. Rule 42 scores both on the ShakeMaps of the set's interface
earthquakes, on reference rock, in the cells below Mw 7.5, and asks the
candidate to be better by 0.05. Rule 43 checks it on the dead, against the
geometry it would replace: no more quiet earthquakes raised to a toll of ten,
no fewer records held in either cell, and a mean |ln((toll + 1) / (record +
1))| no larger. Rule 44 says what adoption changes and what is printed beside.
The set's earthquakes are deep, and Boore et al. 2014 draws them as shallow
ones; the rules say so rather than correct it.

### Outcome

Run once on 15 September 2026, after the candidate was committed
(`7deba3d`). Below Mw 7.5 the disc scored 0.99 on the maps against the
stadium's 2.29, raised none of 53 quiet earthquakes to a toll of ten against
5.7 %, held one record of one and eight of ten against none and eight, and
read them at 0.65 against 1.69. By rules 42 and 43 it is adopted: a scenario
marked a subduction interface is a stadium from Mw 7.5 only. `docs/SCIENCE.md`
gives the figures in full, with what was read afterwards.

## After BM-10: whether the toll counts the dead below MMI VII

Written on 15 September 2026, before either candidate named below was coded
or run on any earthquake. The rules are numbered after the forty-four before
them and live in `src/physics/validation/lowIntensityRules.ts` (rules 45 to
49); the set comes first, in `moderateSetData.ts` and `moderateSiteData.ts`,
read by `scripts/build-moderate-set.ts` and `scripts/build-site-vs30.ts
--moderate`.

### What is already known, and so not held out

The toll counts deaths inside the MMI VII ring only, at PAGER's rates for
7.5, 8.5 and 9.5; PAGER counts them from V. BM-03's half-chain with PAGER's
bands and rates on the PGA rings read rule 11's held-out tolls at 1.51×,
0.35× and 3.34× against 1.46×, 0.33× and 1.94× in place, and BM-10 found
bands of [0, 0] about moderate earthquakes with a few dead. Before the rules
were written, NCEI's count of the records rule 45 names was read (302), and
once the set was read, only its counts: 298 earthquakes, 120 records with
deaths, 21 of ten or more, nine below magnitude 5 in ComCat. No toll of the
set was run.

### The tolls, the score and the decision

Rule 45's set is every NCEI significant earthquake of magnitude 5.0 to 5.99,
2008 to 2025, no deeper than 40 km — below rule 11's magnitude, so none of
them has been read by a rule — on the browser's ground. Rule 46's candidates
add the V and VI bands the rings draw, at PAGER's rates for their middles
(5.5 and 6.5) or for their integers (5 and 6), everything else shared. Rule
47 asks a candidate to lower the mean |ln((toll + 1) / (record + 1))| by ln
1.25 and hold no fewer records. Rule 48 guards the winner on rule 11's
held-out tolls (0.10 of room and eight records in ten per cell) and on rule
23's quiet earthquakes (one in a hundred of room). Rule 49 says what adoption
changes — and that the rules which decided on the toll in place keep it — and
what is printed beside.

### Outcome

Run once on 15 September 2026, after the candidates were committed
(`6f720e6`). On the 298 earthquakes the toll in place scored 1.185 and held
261 records; V and VI at their middles scored 1.254 and held 293, at their
integers 1.190 and 295. Counting the bands below VII widens the band, which
holds more records, and does not bring the central figure nearer them. No
candidate lowers the score by ln 1.25, so by rule 47 the toll in place stays
and the guards did not run. `docs/SCIENCE.md` gives the figures in full, with
what was read afterwards.

## After BM-10: how far a point source's ground is from its rupture

Written on 15 September 2026, before the candidate named below was run on any
earthquake. The rules are numbered after the forty-nine before them and live
in `src/physics/validation/pointSourceRules.ts` (rules 50 to 55); the set
comes first, in `pointSourceSetData.ts` and `pointSourceSiteData.ts`, read by
`scripts/build-point-source-set.ts` and `scripts/build-site-vs30.ts
--point-source`.

### What is already known, and so not held out

Every scenario below Mw 7.5 is a disc, and its rings take the Joyner–Boore
distance to be the distance from the epicentre. Rule 18's run found them at
0.83, 0.50 and 0.90 of the ShakeMaps' radius where a map reaches MMI VII, and
rule 11's held-out tolls read 1.46×, 0.33× and 1.94× their records on the
browser's ground: the candidate is proposed because of those figures, and
draws larger rings below Mw 7.5 wherever it differs. BM-10's point 3 left the
interface models' rupture distance on the hypocentre's depth. ShakeMap's code
and ps2ff's were read to write the candidate as ShakeMap 4.0.2 applies it,
and the candidate was coded and compared with ps2ff on distances alone, with
no ring drawn. Before the rules were written, ComCat's count of the events
rule 50 lists was read (445), its ids to find the eight earthquakes of the
window already read, and one map's info.json; once the set was read, only its
counts — 421 with a map, 241, 154 and 26 by cell, 86, 70 and 10 interface
earthquakes, 20, 32 and 8 maps drawn on a finite rupture or with ten stations
or more — its maps' ShakeMap revisions and the values of their `fault_ref`
and `median_dist`. No footprint, map area or toll of the set was looked at.

The set's recorded deaths were first meant to decide. They were moved beside
before the rules were written, once it was recalled that PAGER's country
curves, which the toll uses, were fitted on the fatal earthquakes of 1973 to
2007 — rule 1's reason for holding out only later ones.

### The distances, the score and the decision

Rule 50's set is every ComCat earthquake of Mw 6 or more, 2000 to 2007, no
deeper than 40 km, with a ShakeMap — the ShakeMap Atlas as ShakeMap
4.0.2+335 redrew it in 2020, with ps2ff's distances wherever the rupture was a
point. Rule 51's candidate draws a disc's rings at Thompson & Worden's (2018)
average Joyner–Boore distance — for the interface models, their average
rupture distance — with the parameters ShakeMap 4.0.2 passes for an origin
with no tectonic region, computed exactly on a grid of magnitude, depth and
distance and interpolated, and held to ps2ff 1.5.9 before any score. Rule 52
scores it under Boore et al. 2014 on the set's maps below Mw 7.5, on rock and
on the browser's ground, and asks it to be better by 0.05 in both and no worse
on the maps least made of ShakeMap's models. Rule 53 checks an eligible
candidate as rule 38 checks a law, on sets whose deaths lie outside the
curves' years: rule 19's test on rule 11's held-out tolls and rule 25's on
rule 23's quiet earthquakes. Rule 54 puts the interface models, with the new
rupture distance below Mw 7.5, to the set's interface maps against the law in
place, and checks a winner the same way on rule 35's interface earthquakes.
Rule 55 says what adoption changes and what is printed beside, the set's own
recorded tolls among it. Where the rupture was a point, the maps are made of
ps2ff's averages, so the candidate agrees with them partly by construction;
the rules say so rather than correct it.

### Outcome

Run once on 15 September 2026, after the candidate was committed
(`d311936`). Below Mw 7.5 the candidate read the set's maps at 1.53 on rock
and 1.78 on the browser's ground against 0.88 and 1.17 in place, and the least
modelled maps at 0.83 and 1.16 against 0.20 and 0.55. It is not eligible, so by
rule 52 nothing ran on the dead and a disc's rings stay at the epicentral
distance. On the set's interface maps Parker et al. 2022 at the candidate's
rupture distance won (1.05 and 0.95 against 1.30 and 1.52), and on rule 11's
interface records its band held none of five, 27 of 34 and 11 of 16, fewer
than eight in ten in every cell, so by rule 54 it is not adopted. Most pairs
the score reads are bands the rings draw where the maps hold none, and a wider
ring loses on each; where a map reaches MMI VIII the candidate came nearer.
`docs/SCIENCE.md` gives the figures in full, with what was read afterwards.

## After the point sources: the rings on the ShakeMap Atlas, scored so that silences count

Written on 15 September 2026, before any candidate named below was scored on
any earthquake of the set it names. The rules are numbered after the
fifty-five before them and live in `src/physics/validation/atlasRules.ts`
(rules 56 to 60); the set comes first, in `atlasSetData.ts` and
`atlasSiteData.ts`, read by `scripts/build-atlas-set.ts` and
`scripts/build-site-vs30.ts --atlas`, and the run that will score it in
`atlasRun.ts`, committed with the rules and run on nothing.

### What is already known, and so not held out

Rule 18's score gives nothing to a band rightly left blank, and it decided
rule 24's run against the hypocentral equation and rule 52's against the
distance to the rupture. Rule 28 wrote a score that counts silences for the
prospective set, and BM-03 read it once on rule 18's maps, where it favoured
Boore et al. 2014 on PGV (0.20 against 0.12). Before the rules were written,
ComCat's count of the events rule 56 lists was read (1 140), its ids to find
the two earthquakes of the window already read, and a search of the
repository for any other; once the set was read, only its counts — 1 101 with
a map, 617, 419 and 65 by cell, 691 quiet, 849 of no fault type, 47, 68 and 23
maps drawn on a finite rupture or with ten stations or more — its ShakeMap
revisions and its fault types. No footprint, map area, reached band or score of
the set was looked at.

### The candidates, the score and the decision

Rule 56's set is every ComCat earthquake of Mw 6 or more, 1973 to 1999, no
deeper than 40 km, with a ShakeMap: the ShakeMap Atlas as ShakeMap 4.0.2
redrew it. Rule 57 reads rule 28's score on its maps, on the browser's ground:
hits, misses, false alarms and silences at MMI VII and VIII, the Peirce skill
and the sharpness. Rule 58 puts every way of drawing the rings committed
before the rules against Boore et al. 2014 — Joyner & Boore 1981, the two
hypocentral equations, the law on PGV and the law at Thompson & Worden's
distance — and asks a winner to displace it as rule 29 does, by 0.10 of score
and within 0.10 of sharpness, and to lose nothing on the least modelled maps.
Rule 59 checks a winner as rule 38 checks a law, on rule 11's held-out tolls
and rule 23's quiet earthquakes, since the set's own deaths are among those
the country curves were fitted on. Rule 60 says what adoption changes and what
is printed beside. The maps of these years are mostly the models ShakeMap ran,
the candidates were fitted on data that include some of these earthquakes, and
six candidates can produce a chance winner; the rules say so rather than
correct it.

### Outcome

Run once on 15 September 2026, after the rules, the set and the run were
committed (`9a58165`). Boore et al. 2014 scored 0.056: it draws MMI VII about
every one of the 1 101 earthquakes, where 237 maps reach it, so its skill in
that band is nil. Allen et al. 2012's hypocentral equation below Mw 7.5 scored
0.418, sharper and ahead on the least modelled maps, and won. On rule 11's
held-out tolls it read the dead nearer their records in every cell and raised
fewer quiet earthquakes to a toll of ten, but its band held 81 of 113 records
below Mw 6.5, fewer than eight in ten, so by rule 59 it is not adopted. Most of
those misses are bands of [0, 0] about earthquakes that killed. `docs/SCIENCE.md`
gives the figures in full, with what was read afterwards.

## After the Atlas: the hypocentral equation with the dead of the V and VI bands

Written on 15 September 2026, before either candidate named below was run on
any earthquake of the set it names. The rules are numbered after the sixty
before them and live in `src/physics/validation/allenTollRules.ts` (rules 61
to 65); the set comes first, in `smallDeepSetData.ts` and
`smallDeepSiteData.ts`, read by `scripts/build-small-deep-set.ts` and
`scripts/build-site-vs30.ts --small-deep`, and the run that will score it in
`allenTollRun.ts`, committed with the rules and run on nothing.

### What is already known, and so not held out

Rule 58 chose Allen et al. 2012's hypocentral equation below Mw 7.5 on the
Atlas maps; rule 59 found its band holding 81 of rule 11's 113 records below Mw
6.5, and afterwards that 26 of the 32 it missed were bands of [0, 0] about
earthquakes that killed. Rules 45 to 49 had tried counting the V and VI bands
on Boore et al. 2014's rings, on the moderate set, and kept the toll in place.
The candidates are written because of those findings, so the sets that showed
them can only guard. Before the rules were written, NCEI's counts of the
records the two queries of rule 61 return were read, with those of the windows
not taken (13 in 2026, 215 from 1950 to 1972); once the set was read, only its
counts — 194 earthquakes, 94 small (31 with deaths), 100 deep (44 with deaths,
8 of ten or more; 49, 21 and 30 by cell) — and no toll.

### The candidates, the score and the decision

Rule 61's set is every NCEI significant earthquake of 2008 to 2025 of magnitude
4 to 4.99 no deeper than 40 km, or of magnitude 5 or more deeper than 40 km,
that no rule has read: outside the years the country curves were fitted on, on
the browser's ground. Rule 62's candidates draw the rings with the hypocentral
equation below Mw 7.5 and count the dead of the V and VI bands at PAGER's rates
for the bands' middles or integers. Rule 63 asks a candidate to read the set's
dead no worse than the toll in place, by rule 47's score, and to hold eight
records in ten in every cell. Rule 64 guards a winner on rule 11's held-out
tolls, rule 23's quiet earthquakes and rule 45's moderate set, with the room
rule 48 allows a toll that counts more bands. Rule 65 says what adoption
changes and what is printed beside. The set sits away from the moderate
shallow earthquakes where the fault showed, the equation is extrapolated for
the small and the deepest of it, and on deep earthquakes a law that reads depth
leads; the rules say so rather than correct it.

### Outcome

Run once on 15 September 2026, after the rules, the set and the run were
committed (`a48eb85`). On the 194 earthquakes the toll in place scored 0.720
and held 160 records; the equation with V and VI at their middles scored 0.565
and held 161, at their integers 0.566 and 158. Both read the dead nearer their
records, but neither band held eight records in ten below Mw 7.5, so by rule 63
neither is eligible and the guards did not run. The bands fix most of the small
earthquakes the toll left at [0, 0]; the equation draws no V ring about 24 deep
earthquakes that killed. `docs/SCIENCE.md` gives the figures in full, with what
was read afterwards.

## After Allen's tolls: the rings of an earthquake deeper than 70 km

Written on 15 September 2026, before either candidate named below was scored
on any earthquake of the set it names. The rules are numbered after the
sixty-five before them and live in `src/physics/validation/slabRules.ts`
(rules 66 to 70); the set comes first, in `slabSetData.ts` and
`slabSiteData.ts`, read by `scripts/build-slab-set.ts` and
`scripts/build-site-vs30.ts --slab`, and the run that will score it in
`slabRun.ts`, committed with the rules and run on nothing.

### What is already known, and so not held out

Boore et al. 2014 reads no depth, and draws an earthquake at 200 km as one at
10 km. Rule 61's run found the hypocentral equation drawing not even an MMI V
ring about 24 deep earthquakes that killed, and the dead the tolls counted
coming mostly from Hindu Kush 2015, Mw 7.5 at 231 km, drawn as a shallow
earthquake. The candidates are written because of that run, so rule 61's
deep earthquakes can only guard. Both candidates were coded and held to
OpenQuake's medians before the rules were written, with no ring drawn on any
earthquake. Before the rules were written, ComCat's count of the events rule
66 lists was read (737), its ids to take out the 44 earthquakes already read,
and the repository searched for any other; once the set was read, only its
counts — 618 with a map, 427, 180 and 11 by cell, 562 quiet, 22, 9 and 1 maps
drawn on a finite rupture or with ten stations or more — its ShakeMap
revisions and the slab models its maps were drawn with. No footprint, map
area, reached band, toll or score of the set was looked at.

### The candidates, the score and the decision

Rule 66's set is every ComCat earthquake of Mw 6 or more, 1973 to 2025,
deeper than 70 km and no deeper than 300 km, with a ShakeMap. Rule 67's
candidates draw a scenario deeper than 70 km as a disc at every magnitude, its
rings where Abrahamson, Gregor & Addo 2016's or Parker et al. 2022's intraslab
median PGA, at the hypocentral distance, falls to Worden et al. 2012's PGA for
the intensity. Rule 68 reads rule 28's score on the set's maps, on the
browser's ground, and asks a winner to displace Boore et al. 2014 as rule 29
does and to lose nothing on the least modelled maps. Rule 69 guards a winner on
the dead of rule 61's earthquakes deeper than 70 km, by rule 47's score with
0.10 of room, since all of the set's own records are among those the country
curves were fitted on. Rule 70 says what adoption changes and what is printed
beside. Most of the maps are the models ShakeMap ran, and Abrahamson et al.
2016 is among them for 490 of 618; the band's scatter stays Boore et al.
2014's; the rules say so rather than correct it.

### Outcome

Run once on 15 September 2026, after the rules, the set and the run were
committed (`905c5ec`). Of the 618 maps 16 reach MMI VII and none reaches VIII,
so the score is the skill at MMI VII. Boore et al. 2014 draws VII about every
map and scored 0.00; Abrahamson, Gregor & Addo 2016 scored 0.86 and Parker et
al. 2022 0.74, both within the sharpness allowed. The guard on the least
modelled maps read nothing, since only 3 of them reach MMI VII. On the dead of
rule 61's 62 earthquakes deeper than 70 km the winner scored 0.801 against
1.091, so by rules 68 and 69 it is adopted and draws every scenario deeper than
70 km. Its band held 38 of those records against 58, which the rules print and
do not decide on. `docs/SCIENCE.md` gives the figures in full, with what was
read afterwards.

## After the deep earthquakes: the ground-motion residual in its two parts

Written on 16 September 2026, before the candidate named below drew a band for
any earthquake. The rules are numbered after the seventy before them and live
in `src/physics/validation/residualRules.ts` (rules 71 to 75); the candidate is
in `src/physics/uq/groundMotionResidual.ts`, held to OpenQuake and SciPy in its
test, and the run that will read it in `residualRun.ts`, committed with the
rules and run on nothing.

### What is already known, and so not held out

Every realisation draws one ground-motion residual, σ = 0.60, for every place
of the footprint at once, and since rules 66 to 70 that includes scenarios
drawn with a model whose own σ is 0.74. Every NCEI earthquake toll of 2008 to
2025 that a set could hold has been read by rules 11, 45 and 61 under that
residual (`docs/GOLD_STANDARD.md`), so no held-out set exists for the dead; the
sets these rules read can stop a candidate, not validate it. The candidate's
parts were read from OpenQuake's implementations and the literature, and its
correlation range was chosen from the model's own assumption — one Vs30 for a
whole footprint — with neither range run.

### The candidate, the score and the decision

Rule 71's candidate draws a realisation's residual in the parts of the law that
draws its rings: the between-event τ shared by every place, and the
within-event φ averaged over the median MMI VII footprint with Jayaram & Baker
2009's correlation (b = 40.7 km) for the rings, and whole for the accelerations
printed at one place. Rule 72 bands rule 11's 406 held-out earthquakes, rule
45's 298 and rule 61's 194 under both residuals and scores each band with
Gneiting & Raftery's interval score on log10(deaths + 1). Rule 73 adopts the
candidate if on rule 11's set its score is no worse and its coverage is 85 % or
more, and rule 74 guards rules 45 and 61 (5 % on the score, five points on the
coverage). Rule 75 says what adoption changes and what is printed beside. The
mean of the residual over an area is not the residual of the toll, and the
dead gather in towns smaller than the footprint; the rules say so rather than
correct it.

### Outcome

Run once on 16 September 2026, after the rules and the run were committed
(`16f0feb`). On rule 11's 406 held-out earthquakes the residual in place
scored 2.101 and its band held 258 of the 278 records with something; the
candidate scored 2.145 and held 241 of 269, on bands narrower by a median of
10^0.30 — a factor of two. By rule 73 the narrowing does not pay for the nine
records the bands drop, among them Noto 2024 with 549 dead, so the residual in
place stays; both of rule 74's guards passed and decided nothing.
`docs/SCIENCE.md` gives the figures in full, with what was read afterwards.

## After the residual: the entry model against the bolides that fell

Written on 16 September 2026, before the model was run on any bolide of the
set it names. The rules are numbered after the seventy-five before them and
live in `src/physics/validation/fireballRules.ts` (rules 76 to 79); the set
comes first, in `fireballSetData.ts`, read by `scripts/build-fireball-set.ts`,
and the run that will read it in `fireballRun.ts`, committed with the rules and
run on nothing.

### What is already known, and so not held out

The impact pipeline's entry has been held to the Earth Impact Effects Program,
its authors' own program, within the program's printed rounding: the breakup
altitude, the burst altitude, the speed and the energy at the ground all agree,
because both run Collins et al. 2005's equations 8 to 20. That is verification
and not validation — nothing has said how near either comes to a body that
fell. Before these rules were written, the catalogue's fields and its counts
were read, and that Chelyabinsk 2013 is in it: its preset carries the body
Popova et al. 2013 measured (B-033), so it is taken out. No altitude of any
other bolide was looked at.

### The set, the scenario and the score

Rule 76's set is every bolide NASA JPL's Fireball Data API returns with an
altitude of peak brightness, a pre-entry speed with its components, an energy
and a place: 357 of 1 072, from 1998 to 2026. Rule 77 builds each body from
what was measured — the mass is twice the energy over the speed squared, the
diameter that mass at the density a scenario with no class carries, and the
angle comes from the velocity's components at the place — and runs the entry as
the panel runs it, with the stony and the iron class read beside. Rule 78 reads
the model's burst altitude against the altitude the sensors measured: the
median absolute difference, the mean difference, the share within 5 km and the
share the model brings to the ground, by energy and by speed. Rule 79 says what
the reading decides: nothing in the model, which no candidate stands against
here, and everything in what `docs/GOLD_STANDARD.md` asks of an impact's entry
(I2). The body is inferred and not observed, and the altitude of peak
brightness is not the burst altitude by definition; the rules say so rather
than correct it.

### Outcome

Run once on 16 September 2026, after the rules, the set and the run were
committed (`1af2286`). The model bursts 356 of the 357 bolides in the air, at a
median altitude of 46.9 km where the sensors put the peak brightness at 33.3
km: a median absolute difference of 13.7 km and a mean of +12.8 km, with 49 of
356 within 5 km. `docs/GOLD_STANDARD.md` asks 5 km and 3 km of an impact's
entry (I2), so the bar is missed and the gap is declared in the validation
report. At the panel's stony class the same bodies burst 8.3 km above the
record, and at an iron's they reach the ground 289 times of 357; the difference
hardly moves with the entry angle. Nothing in the model changes: rule 79 lets
this reading decide nothing, and rule 5 forbids tuning on a set now read.
`docs/SCIENCE.md` gives the figures in full, with what was read afterwards.

## After the bolides: the radiant exposure that burns, from the book itself

Written on 16 September 2026, before the candidate drew a ring for any row of
the calibration net. The rules are numbered after the seventy-nine before them
and live in `src/physics/validation/burnRules.ts` (rules 80 to 84); the curves
come first, in `src/physics/effects/burnExposureData.ts`, traced by
`scripts/benchmark/burn-curves.py` from the public scan of Glasstone & Dolan
(1977), and the run that will read them in `burnRun.ts`, committed with the
rules and run on nothing.

### What is already known, and so not held out

Nimbus draws its burn rings at 8, 5 and 2 cal/cm², three numbers of the
project's own: the book gives no fixed threshold, and its Figure 12.64 (page
564; the text calls it 12.65) draws the exposure that burns as a curve rising
with the yield, nine of them for three degrees and three skin pigmentations.
The validation report has carried the difference as a declared gap since 14
September 2026. Before these rules were written, that page was read, with the
book's worked example at 1 Mt, the curves were traced, and the rings a
scenario draws under them at six yields were printed. No toll and no row of
the net was run under the candidate.

### The curves, the candidate and the decision

Rule 80 traces the nine curves and refuses to write them unless there are
nine, each rising with the yield and none crossing another; the reading is
good to about a tenth of a cal/cm². Rule 81's candidate draws an explosion's
burn rings at the exposure the book gives for that yield and the middle of its
three pigmentations, interpolated in the logarithm of the yield and held flat
outside the figure; an impact's burn rings are left as they are, since the
book's curves are the pulse of a nuclear fireball. Rule 82 adopts the book —
this replaces the project's own numbers with the source it cites — unless the
trace fails its checks, the release gate stops passing, or a ring moves by
more than a factor of two, which a misread figure could not pass. Rule 83 says
what is printed, rule 84 what an adoption changes. A traced curve carries the
scan's own error, and the tolls cannot judge the change, since no row of the
net counts the burned apart from the dead; the rules say so rather than
correct it.

### The outcome, 16 September 2026

Run once after the rules were pushed (`bd255bc`), with
`pnpm exec tsx scripts/benchmark/burn.ts`. The trace passed its three checks
and the book's own worked example at 1 Mt. No guard failed: the release gate
stayed PASS, and the largest move of any ring is a factor of 0.83 — Tsar
Bomba's first-degree ring from 71.3 to 60.3 km. **Adopted.** Every explosion
now draws its burn rings at the book's curves, at the middle pigmentation;
Hiroshima's three go from 4.03 · 2.66 · 2.14 km to 3.65 · 2.80 · 2.25, the
outer two shrinking and the third-degree ring growing because at 15 kt the
book asks 7.20 cal/cm² of it where the project asked 8. An impact keeps the
project's fluences (rule 81). The two rows of the net that are explosions
decide nothing, as rule 82 said: Beirut's charge is chemical and draws no
flash at all, so its band does not move, and Hiroshima's, tuned on its own
mortality, goes from 107 004 / 113 594 / 129 200 to 107 512 / 115 748 /
129 492 against a record of 105 000. The validation report prints the table,
and the light and dark curves beside it.

## After the burns: the initial radiation, from the figures the book draws

Written on 16 September 2026, before the candidate drew a ring for any preset
of the product. The rules are numbered after the eighty-four before them and
live in `src/physics/validation/doseRules.ts` (rules 85 to 89); the curves come
first, in `src/physics/effects/initialRadiationData.ts`, traced by
`scripts/benchmark/dose-curves.py` from the public scan of Glasstone & Dolan
(1977), the model that reads them in `src/physics/effects/initialRadiation.ts`,
and the run that will judge it in `doseRun.ts`, committed with the rules and
run on nothing.

### What is already known, and so not held out

Nimbus draws its three initial-radiation rings from a project fit: 700 m at
1 kt for the LD₅₀, growing as the yield to the 0.18, with LD₁₀₀ at 0.7 of it
and the acute-radiation threshold at 1.4. The fit's own comment credits its
anchors to a "Glasstone Fig. 8.46", which is not a dose–range figure of the
book, and says they were never rechecked. The book's dose–range figures are
8.33a and b for gamma rays and 8.64a and b for neutrons, six curves apiece at
30, 100, 300, 1 000, 3 000 and 10 000 rads, the "a" of each pair for fission
weapons from 1 to 100 kt and the "b" for thermonuclear weapons of 50 % fission
yield from 0.1 to 20 Mt. Before these rules were written, those four pages were
read, with Table 8.37 and §§8.33 to 8.37 and 8.63 to 8.65, the curves were
traced, and the rings a handful of yields draw under them were printed. No row
of the calibration net was run under the candidate — and none can judge it,
since no death in this model is counted from radiation at all.

### The curves, the candidate and the decision

Rule 85 traces the twenty-four curves and refuses to write them unless each
figure holds six, each rises with the yield, none crosses another, the fission
and thermonuclear figures of one radiation agree within 18 % where they meet at
100 kt, and the traced gamma table reproduces the book's own worked example at
§8.34 — 2 000 yards from a 50 kt fission air burst, which the book reads as
"somewhat less than 300 rads … about 250". Rule 86's candidate adds the gamma
and neutron doses, reads the fission figures below 100 kt and the thermonuclear
pair above, corrects towards a contact surface burst below 300 feet by Table
8.37 for gamma rays and by one half for neutrons, and turns the figure's slant
range into a ring on the ground. Rule 87 adopts the book — this replaces a fit
of the project's with the source it cites — unless the trace fails its checks,
the release gate stops passing, or the rings lose their order or stop growing
with the yield, save at the 100 kt step the book itself draws. Rule 88 says
what is printed, rule 89 what an adoption changes. What the rules cannot settle
they say: no toll can judge this, the figures stop at 1 kt and 20 Mt, rads of
neutrons are added as if they were worth the same as rads of gamma rays where
the book says they are often worth more, and the book's own reliability is a
factor of two either way for a fission weapon.

### The outcome, 16 September 2026

Run once after the rules were pushed (`06f31d1`), with
`pnpm exec tsx scripts/benchmark/dose.ts`. The trace passed all five checks,
the book's own worked example included. No guard failed: the release gate
stayed PASS — which it could hardly not, since no death here is counted from
radiation — and the rings kept their order and grew with the yield across the
figures' span. **Adopted.** The rings widen almost everywhere: Hiroshima's
LD₅₀ from 1.14 to 1.33 km, the 1 Mt reference from 2.43 to 2.77, Castle Bravo
from 3.95 to 4.88. They also crowd together, because the book's curves do —
the fit held LD₁₀₀ at a flat 0.7 of LD₅₀ and the threshold at 1.4, where the
book puts Hiroshima's at 0.91 and 1.26 — and they now answer to the height of
burst: Tsar Bomba, 4 km up, draws 2.77 km where the fit drew 4.91, and a burst
above the atmosphere draws nothing. One reading is declared rather than
mended: at 50 Mt the figures are held flat at their 20 Mt end, so Tsar Bomba's
rings are too small by an unknown amount. The validation report prints the
table and the book's own reliability beside it.

## After the radiation: the crater, from the numbers the book prints

Written on 16 September 2026, before the candidate dug a crater for any preset
of the product. The rules are numbered after the eighty-nine before them and
live in `src/physics/validation/craterRules.ts` (rules 90 to 93); the numbers
are in `src/physics/effects/nuclearCrater.ts`, read by eye from the page rather
than traced, and the run that will judge them in `craterRun.ts`, committed with
the rules and run on nothing.

### What is already known, and so not held out

Nimbus draws the apparent crater of a nuclear surface burst as
D_a = K · W_kt^0.3, with a coefficient for each of five ground types. Two stand
on nothing: hard rock's 29 m is "0.8 of dry soil, a project value" and clay's
105 m is "a project value above wet soil, with no source". A third, firm
ground's 36.6 m, was read from a sentence of the book. But because a crater's
size changes so fast as the burst passes through the surface, the book prints
the contact-surface-burst radius and depth of a 1 kt explosion in four media on
Figures 6.72a and b themselves, in words: 82, 61, 58 and 49 feet of radius and
31, 28, 28 and 22 feet of depth, for wet soil or wet soft rock, dry soil or dry
soft rock, wet hard rock, and dry hard rock. §6.72 scales both as W^0.3. Those
pages, their legends and the worked example facing Fig. 6.72a were read before
these rules were written, as were the five coefficients already in the code and
the comments that say where each came from. No row of the calibration net is
scored on a nuclear crater — none exists — so none was run under the candidate,
and none can judge it.

### The numbers, the candidate and the decision

Rule 90 holds the module to the eight printed numbers and to the exponent by
the book's own arithmetic: its example divides a 270-foot depth at 20 kt by
2.46 and multiplies the answer back by the same 2.46, and 20^0.3 = 2.4622. Rule
91 reads each of the project's ground types as one of the book's media — hard
rock as dry hard rock, firm ground and dry soil as dry soil or dry soft rock,
wet soil as wet soil or wet soft rock — and leaves clay out, since the book has
no clay. Rule 92 adopts, ground type by ground type, unless the numbers fail
their checks, the gate stops passing, a coefficient moves by more than a factor
of two, or the five lose their order — **and unless the project's coefficient
was set on a crater somebody measured at a yield the book's figure does not
cover.** That last clause is the one that matters here, and it is written
before the run rather than after it: wet soil's 92 m was set on the craters
Castle Bravo and Ivy Mike left in the Bikini reef at 15 and 10.4 Mt, where the
book's figure is drawn for 1 kt, and a curve carried four decades up in yield is
weaker evidence than a crater measured at the yield in question. So wet soil
keeps its number and both are printed side by side. Rule 93 says what is
printed and what an adoption does.

### The outcome, 16 September 2026

Run once after the rules were pushed (`7ace5a4`), with
`pnpm exec tsx scripts/benchmark/crater.ts`. The numbers passed their checks
and the exponent the book's own arithmetic gives. No guard failed: the gate
stayed PASS, the largest move is a factor of 1.030, and the five keep their
order. **Adopted, for three of the five.** Hard rock goes from 29 to 29.87 m,
dry soil and firm ground from 36.6 to 37.19 — a few per cent each, which is
the point: the project's numbers were close, but three of them were guesses
that happened to be close. Clay was never a candidate, since the book has no
clay. And wet soil keeps its 92 m under rule 92 (d): the book's 49.99 would
put Castle Bravo's crater at 0.89 km and Ivy Mike's at 0.80, where 92 puts
them at 1.6 and 1.5, near the holes they left in the reef. Both numbers are
printed side by side in the validation report. This is the first round where a
rule had to say in advance that the book does not always win.

## After the crater: how many people the rings actually hold

Written on 16 September 2026. The rules are numbered after the ninety-three
before them and live in `src/physics/validation/ringCountRules.ts` (rules 94 to
97), with the run in `ringCountRun.ts`.

### What is already known, and so not held out

Every toll begins with a count: the people inside a circle on a raster. The
cells are squares in degrees and the circle is a circle, so the cells its edge
crosses are split into a 4 × 4 sub-grid and the sub-cells whose centres fall
inside are counted. `populationLookup.ts` calls what that leaves behind "the
±few-percent noise floor" and has never measured it.
`docs/GOLD_STANDARD.md` asks (I4, and the same clause under every other letter)
that the people inside each ring be counted within 5 % of an exact count on the
same raster.

This round's pre-registration is weaker than the three before it, and the rules
say so in their own header: the set was counted once while they were being
written, so what the count in place does was known before rule 97 was finished,
and rule 97's guard about the release gate was added after that first count.
It costs less here than it would anywhere else, because the reference is
arithmetic on the very same cells rather than a measurement of the world —
there is nothing to tune towards — but it is weaker, and it is said rather
than hidden.

### The circles, the reference and the decision

Rule 94 builds the set from the raster by a fixed rule: the sixteen most
populous cells of the shipped 0.125° planet, eight more drawn by a seeded
generator, and four fixed geometric cases — the antimeridian, 70° N, the
equator and an empty stretch of the southern ocean — each at radii from 20 to
5 000 km. Circles narrower than one cell are counted apart and left out of the
bar: the raster does not say where inside a cell its people live, so there is
no exact answer to compare against. Rule 95's reference is the same geometry on
the same cells with the edge cells split 48 × 48, checked for convergence
against 96 × 96 on every fourth circle. Rule 96's bar is I4's own: every scored
circle within 5 %, not the median. Rule 97 changes nothing if nothing misses;
if anything misses, the candidate is the same arithmetic split 12 × 12, adopted
only if it brings every circle inside, costs no more than three times the
wall-clock of the set, and leaves the release gate passing. The polygon counter
beside it, which scored rows depend on, keeps its 4 × 4 until a round measures
that too.

### The outcome, 16 September 2026

Run once after the rules were pushed (`a4890d6`), with
`pnpm exec tsx scripts/benchmark/ring-count.ts`. The reference converged: at
96 × 96 it moves by at most 0.285 %, over 53 circles. **The count in place
misses the bar.** It is a median 0.020 % from the reference, 1.03 % at the
ninetieth percentile and 10.4 % at its worst, and I4 asks 5 % of each ring.
Every one of the worst is a 20 km circle, where almost every cell the circle
touches is an edge cell. **Adopted:** splitting the edge cells 12 × 12 brings
every scored circle inside, worst 2.7 %, for 1.07 times the wall-clock of the
set, and the release gate stays PASS. The polygon counter keeps its 4 × 4, and
measuring it is the obvious next round.
