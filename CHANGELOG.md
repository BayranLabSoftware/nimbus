# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Licence

- **Nimbus is now free software under the GNU Affero General Public
  License, version 3 or later (AGPL-3.0-or-later).** Anyone may use,
  study and share it; anyone who distributes a modified version, or runs
  one as a website, must publish its source under the same licence.
  Versions up to commit `13e0e9f` (14 September 2026) were released under
  the Apache License 2.0, and copies taken from them keep those terms.
  The footers of the landing page, the methodology page and the printed
  report say so, and the report no longer calls every formula
  "peer-reviewed": each is cited to its source.

### Added

- **An impact's report is the globe's map, in the reader's language.** The
  report of an impact now carries every layer the globe draws — overpressure,
  wind, thermal fluence, ejecta, shaking and the uncertainty view — each as a
  flat map in the azimuthal equidistant projection about the point of impact
  (the plane the model's own families live in, so every distance from the
  centre is true), on a paper ground of sea, land and people, with its
  isolines and their values, a scale bar, the north, the nearby cities, the
  colour bar and notes of the globe's legend, a table of its isolines and, in
  the corner, the globe's own photograph of the layer taken as the report is
  opened. Every word follows the language chosen — labels, values with the
  language's decimal separator, regimes, the place with its hemispheres and
  the nearest town, the date in the reader's zone, the formulas and the
  reasons for each source — and the link opens the same report in the
  sender's language, with the same threshold on its probability map. The
  numbers are grouped by effect, each pointing to the figure that draws it.
  The other modules' reports keep their rows as they were, in English, until
  their turn.

- **An impact is drawn as the field's own map.** Until 22 September 2026
  an impact's globe drew every quantity as a ring, and most as two or three
  — the contour, the dashed line of its published scatter and, for an
  airburst's blast, the dotted edges of its band — with the zones of
  different quantities tiling one another. Now it draws one quantity at a
  time, as ShakeMap draws shaking and Glasstone & Dolan a blast: the
  overpressure first, then the wind behind the shock front, the thermal
  fluence with its two fire thresholds, the ejecta blanket with the crater,
  the program's shaking with the liquefaction, and an uncertainty view — the
  probability of exceeding a threshold from its published scatter, or, for a
  complete airburst's blast, the agreement of its band. Each is a continuous
  surface in its units, the model's thresholds as isolines carrying their
  value, and a legend with the colour scale, what each threshold means and
  how far it reaches, over imagery turned to greys. Tsunamis are drawn as
  before. Closes B-104 (the zone of 5 psi left unpainted at Meteor Crater),
  B-105 (an oblique impact's edges drawn about the point of impact, their
  zones about the model's centre) and B-107 (shaking and liquefaction not on
  the globe, and a legend row for a front already gone).
- **An impact has a wind.** The Earth Impact Effects Program prints the
  peak wind behind the shock front beside the overpressure; until 22
  September 2026 the impact domain computed none (B-106). It is now the
  program's relation — Collins, Melosh & Marcus (2005), with the round
  constants the program uses, 1 bar and 330 m/s — on the impact's own
  blast, and I1 holds it as a twelfth clause: on the overpressure gated for
  each of the 81 rows that print a wind it reads the program's at 0.9999×
  to 1.0008×, and an airburst's drawn wind within 1 %. A body that reaches
  the ground is drawn the wind of the blast it is drawn, the ground burst of
  rules 748 to 755, I1's named departure. The first reading, rules 788 to
  792, was refused by its own check: it had taken the gated overpressure of
  a ground impact for the drawn one (rules 793 to 797,
  `validation/impactWindRules.ts`).
- **An earthquake points where its fault points.** Until 20 September
  2026 every earthquake a reader placed was drawn, and counted, as a
  fault striking due north: three call sites read `strikeAzimuthDeg ??
  0`, and only seven presets carried a published strike. The strike now
  comes from the structure under the epicentre — Slab2 (Hayes et al.
  2018, USGS, public domain) where a subduction interface holds the
  hypocentre within two of the model's own published depth
  uncertainties, the GEM Global Active Faults Database (Styron & Pagani
  2020, CC-BY-SA-4.0) where a mapped crustal trace can host the rupture,
  and UNKNOWN where neither is in reach. On the six presets with a
  published strike and an instrumental epicentre: found six of six,
  worst error 11.5° against a 25° bound, due north beaten on every one.
  Gorkha, which the first attempt had recorded as permanently unknown
  because the fault database maps no thrust within 90 km of it, is
  answered to 8.2°: Slab2 carries the Main Himalayan Thrust 22 km under
  that epicentre.
- **What the default cost, measured by ShakeMap rather than argued.**
  ShakeMap 4 now runs on this machine in scenario mode
  (`docs/SHAKEMAP_SETUP.md`), and the same earthquake was run twice with
  one input different — the azimuth of the finite rupture. Turning it
  from north to the strike the lookup finds moves 18 % to 68 % of the
  MMI VII footprint onto different ground while the AREA of that
  footprint changes by at most 1.7 %, and the population inside it goes
  from 7.35 M to 19.93 M under Sumatra. Turning the fault does not
  change how much ground shakes; it changes whose.
- **Where the fault is unknown, the picture says so.** An extended
  rupture with no strike is no longer drawn as a north–south rectangle:
  the globe draws no oriented shape for it and the toll is counted
  inside the disc that contains the stadium at every orientation.
- **The ground under the whole footprint.** The USGS global Vs30 grid —
  the one ShakeMap and PAGER themselves read — is cut to the 2.5′ tiles
  the population already ships on, and the shaking of an earthquake can
  be evaluated as a FIELD over a 257 × 257 grid, each point standing on
  its own ground, with contours taken by marching squares. Measured
  against ShakeMap scenarios run here on twelve rows nobody had read, it
  takes our MMI VII area from 0.192 to 0.288 of the reference's and the
  agreement of the two footprints from 0.192 to 0.288, better on every
  decidable row. It is adopted and not yet wired: the toll still counts
  inside the smooth stadium, which is a declared debt with a round of
  its own.
- **What a 9 is.** `docs/GOLD_STANDARD.md` fixes, before any work towards
  it, what a 9 out of 10 means for each domain: every printed number held
  to a reference implementation; bias, scatter and a calibrated band no
  wider than that scatter allows, on held-out sets of a stated size; the
  input space flagged where it was not measured; and the only gaps a 9 may
  carry. Where a tool of the field makes the same estimate — USGS PAGER
  for earthquake deaths — the bound is read against it on the same
  events. On 15 September 2026 no domain meets it, and every set the
  harness holds has been read.
- **Nimbus against the field's own programs.** A night-long campaign, run
  to a protocol committed before any program was asked a case
  (`docs/BENCHMARK_PROTOCOL.md`), compares every hazard with the software
  its field uses — the Earth Impact Effects Program, NUKEMAP and the 1962
  Nuclear Bomb Effects Computer, Kingery–Bulmash, the OpenQuake Engine,
  USGS PAGER, GeoClaw, Tephra2 and Heller's impulse-wave method — on the
  presets and on thousands of custom cases, and holds every output to
  invariants on 5 000 random scenarios a hazard and every preset of the
  application to the same physics run in Node. `docs/BENCHMARK_REPORT.md`
  says where Nimbus reproduces its sources to their printed rounding (the
  impact pipeline, Boore et al. 2014), where it agrees within ×1.25 (the
  blast of explosions), and where it does not: an earthquake of magnitude
  3.2 to 3.7 never finishes, airbursts carry their blast far beyond the
  impact program's, the earthquake rings hold a fraction of the people
  PAGER counts, large impacts print fire areas larger than the Earth, and
  the megathrust wave falls to about a quarter of the shallow-water
  solution for its own source by 3 000 km. The
  physics was frozen for the campaign; nothing it found is fixed yet.

- **A test the rings cannot have been fitted to.** Rules 27 to 30
  (`validation/prospectiveRules.ts`) choose between the ring laws on the
  earthquakes that happen from 15 September 2026 — the day after they were
  written — once eighty of them have a USGS ShakeMap, about a year from now.
  The score counts, at intensities VII and VIII, the bands both the rings
  and the map reach, the ones either misses, and the ones both rightly
  leave blank, which the earlier score gave no credit for.

- **The intensity rings are checked against their authors' own code.**
  Boore et al. 2014, which draws the rings, agrees to within 0.0005 % with
  the values David M. Boore's Fortran program gives at 600 inputs —
  magnitudes 3 to 8, distances to 100 km, five site velocities, the
  non-linear site term included — and Allen, Wald & Worden's 2012 intensity
  equation with an independent implementation at 42. The reference values
  are OpenQuake's test data (GEM Foundation, AGPL), and the validation
  report prints the comparison beside the impact pipeline's.

- **The validation report says which checks are validation.** Every
  quantity every recorded event checks now carries a role: _tuned on
  it_ (a coefficient, an input or a modelling choice was made with that
  row in view), _input inferred from it_, _same source_ (the published
  relation was fitted on data that include the event), _held out_, or
  _not established_ — each with a note naming the constant, the input
  or the source, so a reader can check it. The roles come from an
  inventory of every calibrated constant and every preset input
  re-tuned to a record. Of twenty-six checks, twelve are tuned on their
  own event — Storegga, Vaiont and Tōhoku's buoy among them — and eight
  are held out. Held out, the tables read one death toll of four inside
  its band and three waves of three, and three of those four passes are
  records of nothing: a plateau nobody lives on, charges that never
  entered the water. The report and the public validation page both say
  so, computed from the rows rather than written in.

- **A scorecard for accuracy and precision.** The validation report
  and the public validation page now score the model per quantity (death
  tolls, waves, eruption columns), per event family and per size band
  (magnitude, energy, volume), on the held-out checks apart from the
  fitted ones: bias as the geometric mean of model over record, scatter
  as the standard deviation of its natural log, zeros counted apart, the
  share of records inside the death toll's 5–95 % band against the nine
  in ten it claims, and that band's median width. First reading, held out:
  eruption columns 0.91× with a scatter of 0.07, three of three accepted;
  earthquake death tolls 0.11× with a scatter of 2.01, four of eight
  records inside a band a hundred times wide. Every cell stands on few
  rows and the note under the table says so. The plume comparison moves to
  a shared module so the suite, the report and the scorecard read one
  computation.

- **The impact pipeline against the program its equations came from.**
  The Earth Impact Effects Program, run online by the authors of the
  equations the impact pipeline cites, answered a fixed grid of 83 impacts
  on land (`scripts/eiep-reference.py`). Where both bring a body down
  whole the energy, the craters, the ejecta blanket and the fireball agree
  to the program's rounding, and a test now gates it. Where they part the
  validation report measures and names it: the simulator's tuned entry
  burst in the air 21 of the 57 impacts the program brings to the ground
  (fixed the same day, below), the air blast is a different fit, and the
  online program prints three quarters of the complex-crater depth its own
  paper gives.

- **Held-out sets chosen by rule, run once.** Written down and pushed
  before the model saw them (`validation/heldOutByRule.ts`, rules 11 to
  16; `scripts/held-out-by-rule.py` reads the sources): every earthquake
  in NOAA NCEI's significant-earthquake database from 2008 to 2025 with
  magnitude 6 or more and depth to 40 km, run on its USGS ComCat origin
  and moment tensor, and every IVESPA eruption phase from 2009 on. Over
  406 held-out earthquakes the death toll's band holds 249 of the 276
  records where there is something to hold (90 %, against the nine in
  ten it claims) with the central figure at 1.17× the record and a
  scatter of 2.23 — calibrated, and two and a half orders of magnitude
  wide; above Mw 7.5 it read 0.41× and held 20 of 29 on this first run,
  before the harness was found counting circles (see Fixed). The 37 columns
  read 0.95× with a scatter of 0.44, 35 accepted. The report prints both
  sets with every row and every miss, and the validation page shows
  their cells; the scorecard's rows can now say whether a record of
  nothing and a band of nothing is a check at all (`isInformative`).

- **The second held-out group, run once.** Written down and pushed before
  the model was run on it (`validation/heldOutEvents.ts`, rules 7 to 10):
  Illapel 2015 at DART 32402, the eruption columns of Grímsvötn 2011 and
  both phases of Calbuco 2015 from IVESPA, and the tolls of Fuego 2018 and
  Unzen 1991. Illapel's buoy reads 10.6 cm against 10.9–11 cm (0.97×), the
  first held-out non-zero number to land on its record on a band that
  could have missed it; the three columns fall inside, declared not blind
  because Mastin's one-line relation was computed on them while the
  sources were read. Fuego's toll is inside for the wrong reasons — the
  model's disc reaches 3.7 km where the current ran 11.7 km down one
  ravine, and the two errors cancel — and Unzen's misses, 10 against 43,
  on a reach four times short and dead who were not residents. The report
  gains an eruption-column table, the occupancy cause and the volcanic gap
  say what the rows showed, and the anchors of held-out rows move to a
  data-only module the application can import without the rows.

- **An earthquake's death-toll band carries the fatality curve's own
  scatter.** USGS PAGER publishes, for every country, how far one
  earthquake's deaths stray from its fitted curve: the `gnormvalue` in
  `fatality.xml`, which PAGER's loss module uses as the standard
  deviation of ln(deaths) about the expected toll. The PAGER table is
  regenerated to carry it (no θ, β or fit status changed), and each
  shaking realisation of the 5–95 % band now scales its mortality by
  exp(N(0, G)) — G from 1.0 for New Zealand and the United States to 2.5
  for Nepal and Iran, the table's median 1.73 where no country is found —
  on a random stream of its own, so the physics of every realisation is
  unchanged. Nothing was re-tuned. Northridge's band goes from 4–238 to
  1–499, L'Aquila's from 32–1 876 to 4–9 480; Amatrice and Gorkha move
  inside their bands, Gorkha on one almost five orders of magnitude
  wide; Christchurch, Kaikōura and Pohang still miss. The declared gap,
  the methodology cards and the casualty panel's note say what the band
  now holds and what it still does not: the census, the blast and
  pyroclastic rates, and the overlap between G and the ground-motion
  residual. The interpolation check is measured on the physics alone.
  The panel's description of the shaking model still gave the average
  pair retired on 9 September and called Japan's building stock the
  earthquake-engineered low end; it now describes the country curve and
  the band that is actually drawn.

- **Five earthquakes held out of every fit, and run once.** Christchurch
  2011, Kumamoto 2016, Kaikōura 2016, Pohang 2017 and Durrës (Albania)
  2019 are in the calibration net under rules committed and pushed before
  the model was run on any of them (`validation/heldOutEvents.ts`): after
  the years PAGER's fatality curves were fitted on, inputs from the USGS
  ComCat origin and moment tensor, the record from the NCEI significant
  earthquake database, no gate and no re-tuning. Two fall inside their
  band — Kumamoto on one four orders of magnitude wide, Durrës at 0.31× —
  and three miss: Christchurch reads 1 dead against 185, Pohang 35 where
  nobody died, Kaikōura none against 2. The causes, written after the
  results and saying so, are the fatality curves New Zealand and South
  Korea borrow from their regions, and at Kaikōura a new one: a handful
  of deaths below what a rate over a population can resolve. The
  interpolation check now compares each end of a band only when that end
  holds a hundred dead, as it already did for the band; Pohang's low end,
  1 against 3, had been read as a statement about the interpolation.

- **A guide for the scientist asked to break the model.**
  `docs/REVIEWING.md` says what Nimbus claims and what it does not, where
  to start with an hour, a day or more, how to reproduce the report,
  where each kind of check lives, what is already known, which documents
  are current and which are history, the questions we most want answered
  in each domain, and how to report a finding. The README and the
  release checklist point to it.

- **What the source review found and did not fix is declared.** The
  validation report and the public validation page now list seven more
  gaps: the toll band holds the population and the fatality curves
  fixed; subduction earthquakes are shaken with crustal relations, slip
  on one rigidity, and Tōhoku slips 13 m where inversions find about 10;
  Anak Krakatau and Storegga are tuned on numbers their sources do not
  give; three numbers are not traced to a source
  read here (DART 21413's 30 cm, the arrival-time table, the Venus crater
  depth); an airburst's altitude factor reaches 640 km at the threshold
  Popova et al. use for Chelyabinsk's 108 km; parts of the explosion model
  are the project's rather than Glasstone & Dolan's; and the volcanic
  relations were not rechecked. The page's list comes from one module
  that the locale test reads, so a gap cannot appear without words.

- **A custom explosion can be shared by link.** Yield, height or depth
  of burst, ground type, wind and charge type travel in short keys
  (`y`, `h` — negative for a depth under the water — `gt`, `ws`, `wdir`,
  `ct`), and opening the link rebuilds the same input the sender had,
  down to the seed of its predictive band.

- **So can a custom earthquake, volcano or landslide.** Every field the
  stored input carries goes into the link — for an earthquake the
  magnitude, depth, fault type, Vs30, the subduction flag, the strike,
  the rupture overrides and `wi=none` for a basin with no warning
  system; for a volcano the eruption rate and volume, lahar, wind, the
  cleared zone, and a flank collapse or lateral blast when there is one;
  for a landslide the volume, slope, basin depth, footprint, confined
  basin and regime. The link restores the input wholesale through the
  validator, so the recipient gets the identical object rather than its
  own defaults with the link's values laid over them. A test sends every
  preset of every kind through an edit and a link and requires that
  object back; it caught the first draft refusing the dry-land basin of
  Elm 1881, 0 m deep. The slide density travels too (`sd`).

- **A landslide can be edited in the panel.** Every field the model
  reads: volume, where the slide starts (above or under the water),
  the slope of the sliding plane, the water depth, and — empty unless
  set — the slide's density, the area it covers and the surface of a
  confined basin with its amplification. Empty fields are the model's
  own defaults, named from the physics so the panel cannot drift from
  it, and the help under each one says what it does: 0 m of water is a
  slide that ends on dry land, and a rigid mass falling in raises a wave
  up to 80 times taller than sediment sliding along the sea floor. The
  result says which source ran — open water, confined basin, or none —
  and the printable report lists every field that was set. The numbers
  in these fields can be typed through: the text stays yours while the
  field has focus, so "0.5" typed over a basin of 3 km² is 0.5.

- **An explosion can be placed under the water.** The panel offers "in
  the air or on the surface" or "under the water" with a depth, and the
  result says where the burst was. Within the water — over open water,
  no deeper than the sea — it makes Glasstone & Dolan's waves; its
  flash, fires and initial radiation are absorbed (§2.64), and its air
  blast reaches each overpressure at the surface burst's range times
  e^(−ρ·λ_d/126), the relation §6.81 gives for a buried burst and §6.53
  says an underwater one follows. A charge below the sea floor or under
  land would be an underground burst, which the model does not have: it
  is drawn as a surface burst, and the panel says so. The schema now
  accepts a negative height of burst and refuses only one deeper than
  any ocean. Wave periods under two minutes are shown in seconds.

### Changed

- **Earthquakes deeper than 70 km are drawn with a model for a subducting
  slab.** No ring law read a deep earthquake's depth: Boore et al. 2014 drew
  one at 200 km as one at 10 km, and painted MMI VII about every earthquake
  of Mw 6 or more. Rules written before either candidate was scored
  (`validation/slabRules.ts`) put two intraslab models, held to OpenQuake,
  to the 618 ShakeMaps of 1973 to 2025 deeper than 70 km that no rule had
  read. Abrahamson, Gregor & Addo 2016 (BC Hydro) scored 0.86 at MMI VII
  where Boore et al. 2014 scored 0.00, and read the dead of 62 deep
  earthquakes nearer their records, so it now draws the rings of every
  scenario deeper than 70 km, as a disc at every magnitude; the depth
  warning moves from 100 to 300 km. Its band holds fewer of those records
  (38 against 58): the toll counts the dead inside MMI VII only, and a law
  silent where the maps are silent leaves some deep earthquakes that killed,
  Hindu Kush 2015 among them, at [0, 0]. The validation report declares it.

- **An interface earthquake below Mw 7.5 is drawn as a disc.** A scenario
  marked a subduction interface was a rupture stadium at every magnitude,
  where every other becomes one from Mw 7.5, and that alone multiplied the
  held-out tolls of interface earthquakes several times over. Rules written
  before either geometry ran (`validation/interfaceStadiumRules.ts`) put the
  question to 64 interface earthquakes 40 to 70 km deep that no rule had
  read: below Mw 7.5 the disc drew their ShakeMaps closer (0.99 against
  2.29), raised none of 53 quiet earthquakes to a toll of ten against 5.7 %,
  and held as many recorded dead, so it is adopted. A marked scenario is now
  a stadium from Mw 7.5 only; the interface rupture and the tsunami do not
  change, and no preset does, all being Mw 8.7 or more.

- **Whether the intensity rings should carry depth, asked of 809
  earthquakes nobody had looked at.** Boore et al. 2014, which draws the
  rings, has no depth, so a scenario's depth moves nothing it shakes. Rules
  23 to 26 (`validation/depthRules.ts`) were written before any of the
  earthquakes was read: every M ≥ 6 earthquake of 2008 to 2025 with a USGS
  ShakeMap that the earlier sets did not hold, and Allen, Wald & Worden's
  2012 intensity equation in hypocentral distance as the candidate that
  reads depth. On the score chosen in advance Boore et al. 2014 kept its
  place, 2.00 against 2.09, and draws the rings still. The report prints
  what that score leaves out, and it is most of the picture: on these mostly
  quiet earthquakes Boore et al. 2014 paints 1 374 bands of MMI VII and VIII
  that their ShakeMaps do not hold, the depth-reading equation 298. Adopting
  it on that would be choosing on a result already seen; a score that credits
  a band rightly left blank comes first, tried on earthquakes not yet read.

- **The validation harness stands every earthquake on the ground the
  browser gives it.** With no Vs30 typed in, the browser gives the
  simulator the Vs30 of the terrain's slope under the pick; the harness
  ran every earthquake on reference rock, so its figures were for a
  simulation a visitor sees only by typing 760. Rules 20 to 22
  (`validation/siteVs30.ts`) were written down first: read the browser's
  ground under every epicentre with the browser's own tile code, choose
  between it, rock, and the slope on land with rock under the sea on the
  370 ShakeMaps, check a winner on the tolls, and choose the rings' law
  again on the ground that stands. Rock won on the ShakeMaps and lost on
  the tolls, so the browser's ground stands, and Boore et al. 2014 stays
  on it. Held out by rule, the earthquakes now read 0.90× their record
  (0.56× on rock) with the band holding 93 % of the records it has
  something to say about; in the net twelve of eighteen tolls are inside,
  Northridge reads 29 dead against 57 (13 on rock), and the footprint
  anchors are centred at 0.90 in radius (0.71). The report prints the
  rock figures beside, and a declared gap moves: the rings paint MMI VII
  about all 190 earthquakes whose ShakeMaps hold none, on any ground.

- **The intensity rings are Boore et al. 2014's, chosen on 370 USGS
  ShakeMaps.** Rules 17 to 19 (`validation/contourLaws.ts`) were written
  down before any candidate ran: choose the law on the ground each draws
  at MMI VII, VIII and IX against the ShakeMaps of the earthquakes held
  out by rule, then check the winner once on their death tolls. Boore et
  al. 2014 won (mean absolute log radius bias 0.73 against Joyner & Boore
  1981's 1.45) and passed on the tolls, and draws the rings now. It
  invents no intensity an earthquake never reached — Joyner & Boore
  painted 180 000 km² of Japan at IX for Tōhoku, whose ShakeMap never
  reached it — and takes the held-out earthquakes of Mw 7.5 and above from
  13.85× their record to 1.92×. It also draws moderate earthquakes' MMI VII
  at about half the radius the ShakeMaps and surveys give, on the
  reference rock every row stands on, and the tolls of Mw 6.5–7.5 fell from
  0.98× to 0.23× — a declared gap, with the site conditions the first
  suspect. In the net eleven of eighteen tolls are inside their band;
  L'Aquila's widened past the gate and is ungated, as rule 19 says, and
  Gorkha's interpolation, past two, is declared.

- **An underwater burst makes the waves Glasstone & Dolan give it.**
  The source was a Ward & Asphaug cavity scaled by an 8 % coupling and a
  depth-of-burst curve, all three the project's own, and in deep water
  it stood five to nine times under the book's relation even at its
  chosen optimum depth. It is now §6.119–6.121: the train's height from
  crest to trough is 40 500·W^0.54 / R feet in deep water (to about
  35 %, for any depth of burst in the water) and 150·d_w·W^0.25 / R in
  shallow water, the peak wave's period is 14.1·W^0.144 s, and the
  amplitude is half the height. The model's own choices are said: a
  geometric bridge between the two relations, the amplitude held inside
  the Miche breaking radius or the gas bubble, and no wave for a burst
  not within the water. The period sets the speed, so the arrival-time
  solver and the globe move, spread and shoal an explosion's wave at its
  group velocity — 30 m/s for a megatonne over the abyss, not 198 — and
  the globe no longer disperses a far field that was measured with its
  dispersion inside it, nor starts it from a 4 km default depth. A
  megatonne 40 m down in 4 km of ocean now draws 7.8 m at 10 km where
  the globe drew 0.21 m; a shallow burst draws less than before. Against
  Crossroads Baker's own table the book's shallow relation reads
  0.68–0.71 of the heights out to 2 000 yards (gated) and about six
  tenths beyond, where the maximum passes back into the train
  (declared). Deep Dive no longer runs on an explosion, whose wave its
  350 km Gaussian cannot represent. A burst on the surface of open water
  still makes no wave, and the validation report now declares it. It
  reaches the page through the depth of burst below.

### Fixed

- **An impact's wave can be seen (B-113).** Since the map of the field, the
  layer chosen covered the globe whenever an impact was drawn, the tsunami's
  wave map with it, and nothing took the field off: Chicxulub on New Orleans
  read as if it raised no wave. The map's legend now has a «Tsunami» tab
  wherever the impact raises one; it takes the field off, gives the imagery
  back its colours and shows the wave map as the globe has always drawn it.
  Its keys are what the globe says it drew — the veil's scale in the
  heatmap's own colours up to the top it was painted to, each NOAA isoline,
  the hours of arrival, the crest, the streaks and the tiers of run-up — and
  nothing else, with the source's height and the depth of the water it rose
  in. The report's flat maps do not draw the wave, and print no figure of it.
- **The globe no longer picks at every mouse move (B-112).** The hover
  tooltip drew every pickable into the pick buffer and read it back from the
  GPU at each move of the mouse, dragging included — most of a frame each
  time on Chrome, and a stutter on Safari. It now picks at most every 90 ms,
  at the cursor's last position, and never while the camera is dragged; and
  a new layer's pick shaders are compiled at the first idle moment after it
  is drawn, where the first hover used to freeze the globe for up to half a
  second.
- **An impact's isolines answer the cursor (B-111).** Their tooltips — what a
  line is, its value and reach, its source — were filed and never read.
- **The printed report prints only the formulas the run used (B-108).** A
  formula was matched to the run by its source alone, so an impact whose burn
  toll cites Glasstone & Dolan printed six formulas of the explosions — the
  height-of-burst curves, the initial radiation, the underwater burst — while
  the dust and the acid of a small impact, and an airburst's magnitude, went
  unprinted where their source was not cited. Each formula an impact can run
  is now listed with the condition under which it runs.
- **Every word of the printed report is dark on white (B-109).** The casualty
  table and the cascade kept the console's light-on-dark colours on the sheet:
  the band column, the notes and the calibration line printed white on white,
  and the timeline faded its stages in from nothing over five seconds, so a
  report printed as it opened lost the stages not yet shown. Both now have a
  paper version, in every module's report.
- **Italian numbers carry the decimal comma (B-110).** The report wrote every
  value with the English point, and the Italian map and tooltips of an impact
  said "0.5 psi" and "3.4 kPa".

- **An airburst blasts the ground as the Earth Impact Effects Program
  has it.** Its shock rings were a surface burst's reach multiplied by a
  factor for the thin air of the burst, up to 15 times, with a fitted
  exponent and a cap from no source: the benchmark campaign measured the
  rings 7.3 times the program's and 144 of 240 where the program has no
  blast. They are now the program's own air blast as Collins et al.
  publish it (2005 Eqs. 54, 57–58; 2017 Eq. 7): a still source at the
  burst altitude, given the larger of the energy the body keeps there and
  the energy it has lost, with the factor of two a moving source can add
  within three burst altitudes printed beside each ring. The rules and
  checks were pushed before any check ran (`docs/BENCHMARK_PROTOCOL.md`).
  Held out, the 24 airbursts of the validation grid match the program
  within 1 % at both ends; against the paper's shock-physics runs the law
  reads 0.92×. At the two events it falls short, and both are declared:
  Chelyabinsk's 1 kPa ring reaches 17.6 km where windows broke over some
  10 000 km², and Tunguska's 20 kPa ring 11.5 km against 26.5 km of
  flattened forest. Tunguska's rings move from 16.7, 49.1 and 91.4 km to
  5.8, 26.4 and 44.2 km; Chelyabinsk's 29 km burst no longer draws any
  (B-032).

- **The Chelyabinsk preset flies the body that was measured.** It flew
  17 m of 3.0 g/cm³ at 19 km/s and 18°, 0.33 Mt; the source it cites,
  Popova et al. 2013, measured 19.16 km/s at 18.3° and derives 19.8 m at the
  3.3 g/cm³ of the recovered meteorites, 590 kt. The preset takes those
  values, written into the benchmark protocol before it ran again (B-033):
  it bursts at 27.1 km against the 27.0 km observed, with 0.59 Mt. Its
  window-damage ring (1 kPa) reaches 30 km where windows broke over some
  10 000 km², inside the factor of two the check allows — a re-run, not a
  validation. The blast stays a point: the only analytic line source does
  not hold so close to the trail, and the declared gap says what a point
  misses, 0.7 kPa in the city against about 3 kPa. The project had quoted
  Popova et al.'s modelled damage as reaching 108 km; they give 120 km.

- **An impact burns only as far as its fireball is seen.** The flash was
  already cut at the fireball's horizon for the deaths and the fire radii,
  but the burn rings the globe drew and the panel printed ran on with
  nothing in the way: Boltysh's third-degree burns reached 936 km,
  Popigai's 10 900 km and Chicxulub's 27 478 km, where their fireballs set
  at 523, 1 186 and 1 616 km. They stop there now (B-038, part of BM-11).
  No toll moves; what the benchmark still finds is the program dimming the
  flash as the fireball sinks, which Nimbus leaves out.

- **A fireball is seen as long as any of it is above the horizon.** The
  flash was cut at the range where the point one fireball radius above
  ground zero sets. The fireball is a sphere about ground zero, and part of
  it stays in sight until the curve of the Earth between it and the
  observer reaches its radius — Collins et al. 2005's Eq. 37\*, the cut the
  Earth Impact Effects Program makes. The cut fell 1.6 % short for a 200 km
  fireball and 3.2 % for a 408 km one, the benchmark campaign's largest
  (BM-14, B-037). The Chicxulub preset's flash now reaches 1 616 km instead
  of 1 591 and its toll on Rome gains 0.16 %; a nuclear fireball's horizon
  moves by less than a metre in a kilometre, and no row of the validation
  report moves. The program also dims the flash by the share of the
  fireball still in sight, which Nimbus leaves out.

- **A nuclear burst has one fireball.** The globe drew it at 70·W^0.4 m,
  credited to Glasstone & Dolan figures the book does not give — its "440
  feet" is a 1-megaton fireball seven-tenths of a millisecond in, and its
  1-megaton maximum is 5,700 feet across — while the casualty model cut the
  flash at the horizon of a second relation, 55·W^0.4 m. Both are now the
  book's own rule, twice the breakaway radius of 100·W^0.4 feet (§2.127):
  202 m at 20 kt, 966 m at 1 Mt, a tenth past the 5,700 feet. The fireball
  on the globe is 13 % smaller, and no toll moves. The impact fireball,
  written twice under two equation numbers, is now one relation under
  Collins et al.'s Eq. 32* (B-036).

- **A footprint across the antimeridian counts the people on both sides.**
  Every vertex of a footprint polygon was clamped to ±179.99° before its
  people were counted, so a shape that crossed the date line was cut at it:
  the stadium of a great Kermadec earthquake reaching New Zealand counted
  none of its 553 651 people, one centred between Samoa and Fiji 30 % of
  them, and the validation harness's stadium counter clipped its window the
  same way. The ring now keeps its longitudes continuous and the counters
  read the columns it covers round the planet; the two cases match a count
  over every cell of the planet within a few per cent, the difference
  between the raster the footprint reads and the coarse one the count uses
  (B-035). A shape across the date line is counted on the shipped rasters,
  since the WorldPop service would need it cut in two.

- **A planetary circle counts everyone inside it.** The people inside a
  circle thousands of kilometres across were counted in a window of
  longitudes that was too narrow toward the poles and never took in every
  longitude when the circle held one: 7 000 km about New York left out 183
  million people, a circle of the same size about Delhi or Beijing 2 to 3 %.
  The window is now the exact one on the sphere, and four circles, two of
  them over a pole, match a count over every cell of the planet (B-026).

- **The Tōhoku buoy says what it recorded, and the megathrust wave is
  measured on nine earthquakes instead.** The one far-field check of the
  megathrust wave was DART 21413 for Tōhoku 2011 at "about 30 cm", credited
  to a paper this project had not read, and the uplift factor was set on it.
  The buoy's own NOAA file crests at 0.81 m; the law reads 0.30 m there,
  and the row is declared, not re-tuned (B-034). What measures the law now
  is BM-05: every thrust of magnitude 7.7 or more from 2006 to 2025, 113
  DART records of nine of them, read to rules committed before the law ran
  on them (`docs/BENCHMARK_PROTOCOL.md`, amended the same day for bad
  transmissions, seismic noise and the tide). The law reads 1.00× at the
  median event, the events scattered by a factor of 1.56, and an exact
  shallow-water solution for a uniform slip on the same ruptures reads
  1.38×; all four readings of the records chose the law. It stays as it is.

- **An impact lights fires as far as its fireball is seen, on a round
  Earth.** The ignition and sustain radii of an impact were the distances
  at which the flash would still carry enough heat with nothing in the way
  — 24 579 km for Chicxulub, past the antipode — and their areas were
  discs of them, so the panel printed an ignition area of 1 897.9 million
  km², 3.7 times the surface of the Earth. The flash travels in straight
  lines: the radii now stop where the fireball sets below the horizon, the
  cut the casualty count already made, and never pass the antipode, and the
  areas are spherical caps. Chicxulub's fires reach 1 591 km (B-028).

- **The ashfall footprint grows with the eruption.** Along the wind the
  deposit is a row of bands, the coarse grains near the vent and the
  finest far out, and the edge of the 1 mm isopach was found by a
  bisection that stopped at whichever band edge it met: 1 % more tephra
  could shorten the reach from 184 to 159 km, or from 5 000 to 4 070 km,
  and a reach at the 5 000 km limit came with no width and no area. The
  edge is now the far side of the farthest band above 1 mm, and the width
  is measured where the bands are widest. On the campaign's 5 000 random
  eruptions none shrinks when it grows; a distal band crossing 1 mm still
  moves the edge in a jump, which is the deposit's shape (B-029).

- **A body under a metre across burns up without breaking the run.** A
  few centimetres of iron could not raise 5 psi even a metre from its
  impact, and the calculation of that ring threw; a link with such a
  diameter broke the simulation. A threshold the blast cannot reach now
  draws no ring, as the entry's own rings already did (B-030).

- **An impact at sea prints no fire area.** The open-water gate cleared
  the fire radii and the ignition area of an ocean impact and left the
  firestorm area, which the panel printed beside rings of nothing (B-031).

- **An earthquake of magnitude 3.2 to 3.7 finishes.** The aftershock
  catalogue drew magnitudes above its completeness cutoff and drew again
  any that came out above Båth's ceiling, a magnitude and two tenths below
  the mainshock. Up to Mw 3.7 the ceiling is at or under the cutoff, so from
  Mw 3.13, once the catalogue was to hold one aftershock, no draw could be
  kept and the simulation never returned: six values the form offers left
  the page waiting and a processor core busy until reload. The benchmark
  campaign's random earthquakes found it, 392 in 5 000. Magnitudes are now
  drawn once from the Gutenberg–Richter law cut to the window between the
  cutoff and the ceiling, and the count keeps the aftershocks that fall in
  that window: none for Mw 3.7 and smaller, half the count at Mw 4, 99.7 %
  of it from Mw 6.5 up, where it was before. On the same 5 000 random
  earthquakes none hangs (B-027).

- **The earthquake panel says what the simulator stands on.** With no
  Vs30 typed in, the simulator reads one off the slope of the terrain
  under the pick, but the field showed 760 m/s, rock, as though that were
  the value in use, and once a number was typed there was no way back to
  the terrain's. The field is now empty with "from the terrain" in it,
  and emptying it gives the site back to the terrain. The depth field says
  under it that the shaking rings do not use the depth yet: Boore et al.
  2014, which draws them, has none, and a source 35 km down shakes the
  ground as a shallow one does — a declared gap on the validation page.

- **The terrain under a pick near the antimeridian is the terrain under
  it.** Where the tile under a pick is mostly sea, the globe fetches the
  eight around it; next to the 180th meridian the ones past it came back
  with longitudes on the far side of the planet, and the grid they were
  resampled into ran from −180° to 180°: one grid round the whole Earth,
  twenty kilometres a column, for a pick off Gisborne or in the Rat
  Islands. A rupture strip that crossed the meridian went the long way
  round and ended up in the middle of the planet, with the pick outside
  it (B-025). Blocks and strips now stop at the meridian, as they stop at
  the poles.

- **An earthquake takes its ground from the terrain under the pick.**
  With no Vs30 typed in, the simulator reads one off the slope of the
  terrain tile under the epicentre. A Launch pressed before the new
  pick's tile arrived read it off the last pick's tile instead, clamped
  to its edge, where there is no slope: 180 m/s, the softest soil on the
  table, wherever the pick was — and on soft soil Boore et al. 2014's
  rings are drawn much wider (B-024). The store now waits for the tile
  that covers the pick and takes rock until it has it.

- **An asteroid's passage through the air follows the equations the
  impact pipeline cites.** The atmospheric entry was a classifier tuned on
  Chelyabinsk and Tunguska — a burst two scale heights below breakup, less
  a logarithmic correction for size, and at most three tenths of the
  energy left for the ground once a body broke (B-023). Against the Earth
  Impact Effects Program it burst in the air 21 of the 57 impacts the
  program brings to the ground: a 100 m stony body at 20 km/s dug a 1.6 km
  crater there and none here, a 300 m body at 50 km/s a 9.6 km crater
  there and none here. The entry now integrates Collins, Melosh & Marcus
  2005's pancake equations (Eqs. 8–20, their constants, and their
  density-derived strength when no class is chosen), and the crater is dug
  at the speed the body or its swarm strikes the ground. On the 81-impact
  grid every outcome and every kind of crater agrees, the breakup altitude
  within 1 %, the burst within 5 %, the craters within 4 %, and a test
  gates it. Chelyabinsk now bursts at 29.0 km against the 27.0 km Popova
  et al. measured (22.1 km before), Tunguska at 9.8 km, and Meteor Crater's
  iron breaks up and strikes as a swarm at 10.9 km/s, digging 1.45 km
  against the 1.2 km observed (1.55 km before). The panel shows the speed
  at the end of entry where it showed a tuned "penetration bonus". The
  altitude factor on an airburst's shock was fitted to the old, lower
  bursts and has not been refitted: at Chelyabinsk it now carries the
  0.5 psi ring to 183 km, and the declared gap says so.

- **The validation checks count a great earthquake the way the
  simulator does.** From Mw 7.5 the simulator counts the people inside
  the rupture stadium it draws; the offline harness behind every death
  toll in the validation report counted a circle of the same radius
  about the epicentre, and an offshore megathrust's circle sits at sea
  (B-022). It now counts the stadium, with a fast counter held to the
  browser's own polygon sum by a test. The model is unchanged; what the
  report says about it is not. Tōhoku's shaking row went from 0 dead on
  a band of 0 to 5 to 177 033 on 2 529 to 2 969 170 — nearly ten times
  the whole record, drowned included — and the held-out earthquakes of
  Mw 7.5 and above chosen by rule from 0.41× their record to 13.85×. The
  circle had hidden the largest error in the earthquake model: the
  shaking footprint of great ruptures, now a declared gap with its own
  cause on the validation page. Twelve of the eighteen death tolls in the
  net are inside their band, up from nine, most of them on very wide
  bands.

- **A burst's Monte Carlo keeps it where it was placed.** The explosion
  sampler drew every height of burst about its nominal value with
  σ = 50 m and clamped it at zero. A charge 40 m under the sea came out on
  the surface in about four draws of five and in the air in the rest,
  never in the water; a charge on the ground went off up to a hundred
  metres above it. The 50 m is the reconstruction error of Hiroshima's
  air-burst height, so only an air burst's height is drawn now, and a
  burst on the surface or under the water keeps its placement. Beirut's
  toll band narrows from 1 297–2 433 to 1 296–1 586 against 218 recorded,
  and the uncertainty panel of any underwater burst finally describes an
  underwater burst (B-021).
- **The methodology page describes the code that exists.** An audit of
  its overview, uncertainty and limitations sections and of the landing
  page's features checked 55 claims and found 23 stale or wrong. Among
  them: the Monte Carlo was said to draw 200 realisations where the
  button draws 1 000; every input and every output was said to carry a
  documented σ, where landslides have none and eight outputs do; Tunguska's
  energy was "80 % driven by the diameter", where the sensitivity script
  prints 0.49 for the diameter, 0.20 for the velocity and 0.16 for the
  density; the mushroom cloud was said to follow Mastin's plume scaling,
  in a "Stage view" that no longer exists; earthquakes were "a point
  source"; the landing page promised full keyboard navigation, which the
  globe does not have. Each section now says what the code does. The
  simulator panel printed a log-normal scatter as a percentage — "±110 %"
  for a band of three times either way — and now prints the factor.
- **The pages no longer claim more than the validation shows.** The
  methodology page described four regression checks that "every commit"
  runs, with tolerances "not curve-fitted": the tsunami arrival-time
  checks have been switched off since their times turned out to carry a
  citation that does not exist, and several of the others were set on
  the events they check. Its section now says what each check does and
  what it cannot prove, and sends the reader to the validation page. The
  landing page read "Validated against Collins/Melosh/Marcus 2005,
  Glasstone & Dolan…", which are the sources of the formulas, not
  validation; and the methodology subtitle called every source
  peer-reviewed, which Glasstone & Dolan's handbook is not.
  `docs/VALIDATION.md`, last written in April, now opens by pointing to
  the report and stating both corrections.
- **The scatter of ground motion is the one Boore et al. give.** The
  toll bands and the earthquake Monte Carlo drew the ground-motion
  residual at σ_lnY = 0.50, cited to Boore et al. 2014 with a
  between-event 0.397 and a within-event 0.308 that are not in the
  paper. Its coefficients for PGA at M ≥ 5.5 are 0.348 and 0.495, a
  total of 0.60, and that is what is drawn now. The bands widen —
  Northridge 5–180 to 4–238, Gorkha 22–4 924 to 13–6 942 — and no
  verdict changes. The footprint check's reference moves from 0.70 to
  0.85, shown as the ceiling it is beside the 0.49 the between-event
  part alone implies, and its test loses the 0.25 allowance it carried.
- **Vaiont's wave is the one its source gives.** The confined-basin
  amplification was 3, tuned so the Vaiont preset reached a 250 m wave
  that Genevois & Ghirotti 2005 do not give — their 250 m is the
  thickness of the slide. Their wave crested 140 m above the top of a dam
  that stood 25 m above the lake that night (ASDSO): 165 m. The factor is
  now 1.8, the preset stands 162 m above 238 m of water, and the wave is
  a gated row of the validation report (125–165 m), declared tuned on it.
  A custom confined-basin slide makes a wave 40 % lower than before.
- **A chemical explosion blasts, and does not burn.** Kinney & Graham fit
  a charge in free air; a charge on the ground, reflecting perfectly,
  makes the wave of twice its yield (Takazawa, Kim & Garcés 2023). A
  chemical charge now enters the fit at twice its yield — its rings are a
  quarter wider — while a nuclear burst, which puts only half its energy
  into the blast (Glasstone & Dolan §1.25), still enters at its yield. And
  a chemical charge no longer draws the burn, fire and initial-radiation
  rings of a nuclear burst: at a few thousand degrees it radiates
  comparatively little (§1.23). Beirut's toll, which reads the rings,
  rises from 902 to 1 432 against 218 recorded; the row stays declared,
  with the population raster and the conventional mortality bands named
  as what is left.
- **A nuclear burst on the ground radiates less than one in the air.**
  Every burst took the air-burst thermal partition, 0.35; Glasstone &
  Dolan give 0.18 for a contact surface burst and interpolate between
  (§7.101). The partition now rises linearly from 0.18 on the ground to
  0.35 at 200·W^0.4 ft, the height of the book's air-burst curves. Castle
  Bravo's third-degree radius falls from 27 to 23 km and its fire radius
  from 65 to 46 km; Hiroshima and Nagasaki, air bursts, do not change.
- **Nuclear craters are Glasstone & Dolan's size.** Dry soil and firm
  ground were 75 and 60 m per kt^0.3, twice the 60 ft apparent radius the
  book gives a 1 kt burst in dry soil (§6.09); both are now 36.6. Saturated
  reef keeps 92, which puts Castle Bravo and Ivy Mike near the mile-wide
  craters they left (DTRIAC SR-12-001). Hard rock (29) and clay (105) are
  declared project values.
- **Sources that were not what they were cited as, found by checking
  every one.** A new `pnpm audit:sources` resolves every DOI in the
  repository against Crossref, DataCite and doi.org and compares every
  citation on the methodology page with its record; it now passes. On
  its first run it found a Mars-seismology citation with an invented
  title, venue and DOI (the paper is Teanby & Wookey 2011, _Physics of
  the Earth and Planetary Interiors_); DOIs for Pike 1980 and ReVelle
  1976 that belong to other papers; a crater-scaling "Nordyke 1977" that
  is Nordyke 1962, in the About dialog and the printed reports too; an
  Etna 1669 reference with a wrong title and DOI; and a dozen citations
  missing DOIs they have.
- **Test data with no source behind it.** The Tōhoku and Sumatra
  tsunami arrival times cited a paper that does not exist, and their
  station distances were wrong by up to 130 %. The distances are now
  great circles from USGS epicentres to NOAA station positions; the
  times have no source, so the tests that read them are skipped until a
  published table is read. DART 21413, the buoy the Tōhoku wave is
  checked at, is 1 242 km from the epicentre, not the 1 500 km every
  row used; the model reads 0.29 m there against the 0.30 recorded.
- **Aftershocks were drawn six times too few.** Reasenberg & Jones 1989
  give a daily rate; the code took its amplitude as the whole count. The
  count is now the rate integrated over the window, and the magnitudes,
  times and count use their one generic parameter set (b = 0.91,
  p = 1.08, c = 0.05 d).
- **Steep ground was not rock.** The slope-to-Vs30 proxy returned 685 m/s
  for every slope past 0.138, and its table matched neither Wald & Allen
  2007 nor Allen & Wald 2009. It is now the active-tectonic table USGS
  uses (its `grad2vs30.c`), read in log–log as that program does. This
  changes the site term of every earthquake run on the globe, not the
  validation report's presets.
- **The earthquake methodology cards say what the code does and what
  their sources say.** Among eighteen corrections: the uplift factor
  and the coupling efficiency are simulator calibrations, not published
  values; the NGA-West2 row is not the displayed estimator; the site term
  is the published Boore et al. 2014 one, not the power law it replaced;
  and the tsunami trigger fires on the subduction flag too.
- **An impact's seismic magnitude was about 2.9 units too low.** The
  panel led with a "Teanby–Wookey, modern estimate" that took a seismic
  moment of 10⁻⁴ of the impact energy. Ten to the minus four is the
  fraction radiated as seismic waves, and an earthquake's moment is some
  2 × 10⁴ times the energy it radiates (Kanamori 1977); Teanby & Wookey
  2011 contain no such formula. Chicxulub read 7.3 and drew a 44 km
  liquefaction ring. The panel now gives the magnitude of Collins et al.
  2005, Eq. 40* — 10.2 for Chicxulub, 5.3 for Meteor Crater — with its
  range across the seismic efficiencies they give (10⁻⁵ to 10⁻³, ±0.67),
  computed on the energy that reaches the ground: an airburst shakes it
  with its ground-coupled share only (Tunguska 4.6, Chelyabinsk 3.1).
  Liquefaction (213 km for Chicxulub), the Monte Carlo and the
  sensitivity table read the same number.
- **Ejecta deposits were 2.4 to 10 times too thick.** The thickness
  law was Collins et al.'s Eq. 47* written with the final crater's rim
  radius instead of the transient crater's, and credited to an equation
  that gives crater depth. At two crater radii Meteor Crater's deposit
  is now 5.7 m, not 13.6, and Chicxulub's 1 m edge 856 km, not 1 874; an
  inland impact reaches the sea over that shorter distance. The deposit
  is reported only outside the final rim, as Collins et al. do.
- **Complex craters were about 2.6 times too deep.** The depth
  came from Pike's fit to lunar craters, credited to a Pike 1980 table,
  and applied from 3.2 km, where it jumped from 627 m to 1 482 m.
  Depths now follow Collins et al. 2005: the transient bowl less its
  breccia lens plus the rim for a simple crater (0.21 of the diameter),
  and for a complex one the fit Herrick et al. 1997 made to fresh
  craters on Venus (Eq. 28*). A fresh Chicxulub is 1.9 km deep, not 4.9.
- **An impact's stratospheric dust was a hundred times too much, and its
  acid rain eighty.** The dust scaled from a Chicxulub value credited to
  Toon et al. 1997 Table 3, which is a table of impact frequencies; it
  now follows their prescription, 0.1 % of the rock the crater
  pulverizes (eq. 10), so an airburst lofts none. The nitric acid scaled
  from 10¹⁶ kg that no case of Prinn & Fegley 1987 gives at that energy;
  it now scales from their asteroid, whose 3 × 10³⁸ NO molecules at
  10²³ J are 3.1 × 10¹³ kg as HNO₃, an upper limit. Chicxulub now lofts
  1.1 × 10¹⁵ kg of dust and 3.3 × 10¹⁴ kg of acid. The climate tiers are
  said to be the project's bands, with Toon's regimes beside them.
- **The rest of the impact cards say what the code does.** The airburst
  classifier, its penetration term and its ground-energy fraction are
  Nimbus heuristics tuned on Tunguska and Chelyabinsk, not Chyba 1993's
  equations. The altitude factor on airburst shock radii is a fitted
  plausibility argument, and Chelyabinsk does not validate it: its 0.5 psi
  ring lands near the 108 km to which Popova et al. 2013 model window
  damage, but at their 500 Pa threshold the model reaches about 640 km;
  the "0.5 psi at 120 km" credited to Brown et al. 2013 is not in their
  paper. The ejecta butterfly is the project's own, and the Schultz &
  Anderson abstract it cited is a paper on impact flash spectroscopy; the
  asteroid densities are presets, two of which resemble meteorite
  densities in Britt & Consolmagno 2003. The Ward & Asphaug row names its
  equation and its project calibration, and the Wünnemann card says how
  Nimbus reads the paper's contradictory validity condition.
- **The explosion and casualty cards say which numbers are the
  project's.** Rechecked against Glasstone & Dolan, OTA 1979, PAGER and
  the other sources they cite, twenty-eight cards and the comments
  behind them no longer credit tables and figures that do not hold
  their numbers. The burn (2, 5, 8 cal/cm²) and fire (10, 6 cal/cm²)
  thresholds, the height-of-burst factor, the initial-radiation fit, the
  crater coefficients and the EMP roll-off are project values; the crater
  coefficients are twice what Glasstone & Dolan give for dry soil (§6.09),
  and the radiation fit cited a figure that holds no dose–range curve.
  The Kinney–Graham fit is for free air, so a chemical surface burst's
  radii are about a fifth short (Takazawa, Kim & Garcés 2023); a nuclear
  burst's half-blast yield roughly compensates. The nuclear thermal
  partition, 0.35, is Glasstone & Dolan's for an air burst, and a
  contact surface burst would take 0.18. OTA's blast table is its
  figure 1, "relatively conservative" in its own words; the direct-blast
  thresholds are Table 12.38 (lung damage from 12 psi, lethality from
  40), not §12.44; the PAGER card names the curves the code uses; the
  pyroclastic, fire, later-death and exposure shares are project
  estimates; the tsunami toll's formula matches its code; the random
  generator is Tommy Ettinger's Mulberry32; the Box–Muller transform is
  the basic form. Part of this text reached the site with the impact
  commit before it.
- **Two landslide waves were tuned on numbers their sources do not
  give.** Vaiont's confined-basin factor was chosen to reach a 250 m
  wave credited to Genevois & Ghirotti 2005; their wave crested 140 m
  above the top of the dam, and their 250 m is the thickness of the
  slide. The Anak Krakatau prefactor was set on an 85 m source credited
  to Grilli et al. 2019, whose simulated leading wave is nearly 50 m;
  the Storegga one on a 5–10 m source amplitude Bondevik et al. 2005 do
  not give — they read run-up from deposits. The model is unchanged; the
  validation report, the regression registry, the cards and the presets
  now say so, and the gaps are listed for re-tuning.
- **The volcano and tsunami cards say what the code does.** The PDC,
  ashfall, lahar, climate and crosswind formulas on the cards were
  stale or credited to papers that do not contain them; they are Nimbus
  scalings and calibrations, with the papers named as background. The
  dispersion card and the report cite Kajiura 1963, not a paper on the
  1998 Papua New Guinea tsunami; the source wavelength is twice the
  down-dip width (410 km for Tōhoku, 35 min); the inundation readout is a
  geometric identity, not "FEMA 55 §3.4"; the coastal damage labels are
  the project's, beside Japan's warning bands; Green's law is Lamb's
  Art. 185. Twenty entries of the historical roster are corrected — among
  them Lisbon's magnitude, Hunga Tonga's 57 km (Proud et al. 2022),
  Boltysh 0.65 Myr after Chicxulub, and Halifax, Texas City and Ivy Mike
  credited to what exists.
- **The terrain tiles are not CC0.** They combine public-domain data
  with sources that require attribution; the README, ASSETS and the code
  say so and link the list.

- **A shared custom impact was not the impact its sender had.** The link
  carried seven fields and laid them over the recipient's own input, so
  whatever it left out came from the recipient's open preset: an iron
  body edited from Meteor Crater arrived with Chicxulub's strength — a
  different entry regime — and the heading was lost. It also carried
  an ocean impact's water and basin depths, which the recipient then
  dropped (the setter did not read them), so the ocean Chicxulub opened
  as a land impact, and it wrote gravity to four decimals. Impacts now
  take the path the other four scenarios took: every field of the
  stored input, the strength (`str`), heading (`az`) and distance to the
  shore (`sh`) included, written exactly and restored wholesale through
  the validator. Links made by the app before still open; a hand-written
  link without `g` gets Earth's gravity, and one without the densities
  now leaves the preset alone instead of borrowing them.

- **A number typed over another in a custom panel could be stored as a
  different number.** Every field was bound straight to the store, and a
  keystroke the model refused put the old value back mid-word: on
  Tunguska, "0.07" typed over the diameter stored 60.7 m; on Hiroshima,
  "0.02" over the yield stored 0.01502 Mt; on Krakatau, "2.5" in the
  eruption-rate mantissa stayed "2.0" and stored 204 999.99999999997
  m³/s. Kilometres also picked up float noise on their way to metres:
  8.05 km of depth became 8 050.000000000001 m, in the link as well.
  Every number field in the five panels now keeps the typed text while
  it has focus, and unit conversions are rounded to twelve significant
  digits. The e2e tests type key by key: `fill` sets the whole text at
  once and would have shown neither defect.

- **The landslide validator threw the slide density away.** The model
  has read it since the Watts density factor went in, but no edit could
  keep one. It is validated now, and one no denser than seawater is
  flagged: the slide floats and raises no wave.

- **The landslide regime was described as a tag, and the methodology
  page printed the wrong source.** The input's documentation said the
  regime was report metadata; it picks the calibrated prefactor, 0.4 or
  0.005. The methodology page gave a single prefactor of 0.1 for both
  the landslide and the flank-collapse source — 22 m for Anak Krakatau,
  where the model gives 88 m held to 80 m by the breaking cap — and
  called the reconstruction it is calibrated on an observation. Both
  entries now print the formulas the model runs.

- **Anak Krakatau 2018 could not be picked as a landslide.** The
  eruption and the flank collapse it shed share one preset id, and
  picking it on the landslide tab, or opening its link, switched to the
  volcano. On the landslide tab it now means the landslide.

- **Two more fields the validators threw away.** Editing anything on
  Sumatra 2004, Lisbon 1755, Valdivia 1960 or Alaska 1964 dropped
  `warningIssueS`, so their coasts were given a tsunami warning nobody
  could have issued and their coastal toll changed; editing the ocean
  Chicxulub dropped its basin depth. Both are validated and kept now.

- **Wind and charge type were thrown away by the explosion validator.**
  It copied only six fields into its output and the store keeps the
  output, so the wind set in the panel never reached the thermal ring —
  the direction slider sprang back — and editing anything on Beirut,
  Halifax or Texas City dropped the charge type, turning a chemical
  explosion into a nuclear one with a flash and fires. The validator now
  checks and keeps the charge type, the distance to the shore and the
  wind.

- **Crossroads Baker was being checked against the wrong quantity, on a
  law the globe does not draw.** The wave harness spread an underwater
  burst without the energy of a ring and passed Baker at 23.3 m and
  1.89 m, while the globe drew about half and missed. Glasstone &
  Dolan's Table 6.57 prints Baker's waves as heights from crest to
  trough, at seven ranges; the model computes amplitudes, and the
  "1.8 m at 5.5 km" had no source. Read as printed, the globe's law
  reads 0.75–0.84 of every tabulated height and the harness's law
  about twice. The harness now calls the veil's own per-cell law
  (`veilLaw`, the body of the field's loop), carries all seven ranges,
  the USS Saratoga's crest and the ninth wave at 22 000 ft, and a test
  draws the field on a flat lagoon to hold the two together. Nothing on
  the globe changes. What the same chapter shows about the explosion
  source — a calibration citing a table the book does not have, and a
  deep-water wave five to nine times under Glasstone's relation — is in
  the roadmap.

- **The explosion wave cited pages that do not say what it said.** The
  8 % coupling was "calibrated against Glasstone Table 6.50 ≈ 180 m
  source amplitude for 1 Mt" and the optimum depth of 4 m·kt^(−1/3)
  came from "Glasstone §6.40", in the code, its tests and the
  methodology page. The 1977 edition has no Table 6.50 and no source
  amplitude for any yield, and its §6.40 is about buildings in Las
  Vegas. All three numbers are now called the project's own, beside
  what the book does give: 2–5 % of the yield in the surface waves
  (§6.54), a vent depth (§6.53), and wave-height relations for deep and
  shallow water (§6.119–6.121). No number changes.

- **The report's "tsunami source amplitude" was a number the model does
  not propagate.** It sat on Ward & Asphaug's figure, which has no water
  depth in it and read 1 362 m in 200 m of sea for a Chicxulub on Rome.
  The label now carries the Wünnemann rim wave, capped at the water
  depth — the wave every downstream consumer uses — and Ward is printed
  beside it as the reference it is.

- **The legend listed three tsunami rings the globe does not draw.** The
  5 m / 1 m / 0.3 m wave fronts were retired from the globe in Phase 16
  and stayed in the legend, where toggling them hid nothing and their
  radii came from laws the field no longer uses. Gone; the cavity ring,
  which is drawn, stays.

### Measured

- **A validation bar that the reference misses by a factor of
  twenty-two.** Our MMI VII area was held against the published ShakeMap
  of six events and a round was refused on it. Asked afterwards what the
  REFERENCE scores on those same rows — ShakeMap run the way we are run,
  no stations, no felt reports — the answer is 0.28 at Northridge, 11.06
  at L'Aquila, 22.03 at Amatrice: a published map of an Italian
  earthquake is pulled in to the few tens of square kilometres that
  really reached MMI VII by a dense network and thousands of felt
  reports, and no blind model knows that. The bar was measuring the
  absence of stations. Read the way the amendment of 16 September says
  to read it, on the same rows: with the ground under every point our
  bias is 0.851× and our scatter σ 1.335, against the reference's 1.546×
  and 1.926 — closer to the record than the reference, on both clauses.
  The refused verdict was not re-scored: a bound shown to have been the
  wrong bound is not a licence to re-run the round that failed it.


- **The invariants, drawn again after the campaign's fixes.** Five thousand
  random scenarios of every hazard, over the ranges the custom forms accept:
  221 invariant failures against the campaign's 12 104. No run hangs, no
  radius reaches past the antipode, no area is larger than the Earth, and the
  ashfall grows with the eruption again. What is left is almost all one
  finding — an airburst's blast rings shrink by a few tenths of a percent as
  the body grows (BM-16) — with a handful of threshold crossings elsewhere.
  `benchmark/results/invariants-2026-09-16.json` keeps the draw beside the
  campaign's.

- **The impact entry, against 357 bolides the sensors measured.** The entry
  agrees with the Earth Impact Effects Program, its authors' own program, to
  the program's rounding — which says the equations are coded right, not that
  they match the sky. Rules written before the model was run on any of them
  (`validation/fireballRules.ts`) put it to every bolide of NASA JPL's
  fireball catalogue that carries an altitude of peak brightness, a pre-entry
  speed with its components and an energy. The model bursts them a median
  13.7 km above the altitude the sensors measured, and 12.8 km above on
  average; at the panel's stony class 8.3 km. The bar the gold standard sets
  for an impact's entry is 5 km and 3 km, so the validation report now
  declares the gap. Nothing is tuned on the set.

- **The ground-motion residual, drawn in the two parts its model gives it,
  does not pay for itself yet.** A realisation draws one residual for the
  whole footprint, σ 0.60, which counts all of the within-event scatter as
  if every place of an earthquake moved together. Rules written before the
  candidate drew a band (`validation/residualRules.ts`) drew the
  between-event part shared and the within-event part averaged over the
  footprint, with Jayaram & Baker 2009's correlation and each law's own τ
  and φ, all held to OpenQuake and SciPy. On rule 11's 406 held-out
  earthquakes the bands narrow by a factor of two and hold 241 of 269
  records against 258 of 278: by the interval score the narrowing does not
  pay for the nine records dropped, Noto 2024 among them, so the residual in
  place stays. The validation report prints the figures on all three sets.

- **The rings of a subduction interface.** The campaign drew the megathrust
  presets' rings at 4.2 and 6.0 times two interface models' distances
  (BM-10). Rules written before either model was coded
  (`validation/interfaceRules.ts`) tried Abrahamson, Gregor & Addo 2016 (BC
  Hydro) and Parker et al. 2022 (NGA-Subduction), both held to OpenQuake,
  against Boore et al. 2014 on the ShakeMaps of the 451 earthquakes USGS drew
  with its interface models. Both drew the shaking far better — Parker et
  al. best, 4.35 against 9.77 over four readings — and Parker et al. raised
  0.3 % of 352 quiet earthquakes to a toll of ten against 11.9 %; but its toll
  band held too few of the recorded dead, fewer than eight in ten in every
  magnitude cell, so the rings stay Boore et al.'s. Read afterwards and left
  open: marking a scenario an interface draws a rupture stadium at every
  magnitude, which alone multiplies the held-out tolls of these earthquakes
  by 2.5 to 18.

- **The dead below MMI VII.** The toll counts deaths inside the MMI VII
  ring; USGS PAGER counts them from V. Rules written before either
  candidate was coded (`validation/lowIntensityRules.ts`) added the V and VI
  bands at PAGER's rates, for the bands' middles or their integers, on the
  298 NCEI significant earthquakes of magnitude 5 to 6, 2008 to 2025, that no
  rule had read. Neither brought the toll nearer the record (1.25 and 1.19
  against 1.18 in place), so the toll is unchanged; `lowIntensityDeaths` on
  the earthquake scenario keeps both for the record. The set showed instead
  that the toll in place counts 16 378 dead where 1 732 died, most of them
  about four Iranian earthquakes near cities, and counts the deadliest far
  below their records.

- **A disc's distance to its rupture.** Below Mw 7.5 the rings take every
  site to be as far from the rupture as from the epicentre; USGS ShakeMap 4.0
  draws such an earthquake at Thompson & Worden's (2018) average distance to
  the ruptures it can have. Rules written before the candidate was scored
  (`validation/pointSourceRules.ts`) put that average, as ShakeMap 4.0.2
  computes it and held to ps2ff within 4 × 10⁻¹⁶, to the 421 ShakeMaps of
  2000 to 2007 that no rule had read. Its wider rings read the maps at 1.53
  against 0.88 in place, because most of those maps hold no strong shaking
  where the rings already draw some, and the interface models at the new
  rupture distance again held too few of the recorded dead; nothing changes,
  and `pointSourceDistance` on the earthquake scenario keeps the candidate for
  the record. Where a map does reach MMI VIII, the candidate's rings came
  nearer to it.

- **The rings when a silence counts.** The score that chose the rings gives
  nothing to a band rightly left blank. Rules written before any candidate
  was scored (`validation/atlasRules.ts`) read instead the prospective set's
  skill score, which counts hits, misses, false alarms and silences, on the
  1 101 ShakeMaps of 1973 to 1999 that no rule had read. Boore et al. 2014,
  which draws the rings, scored 0.06: it paints MMI VII about every
  earthquake of Mw 6 or more. Allen et al. 2012's hypocentral equation below
  Mw 7.5 scored 0.42 and read the held-out dead nearer their records, but its
  band held too few of them below Mw 6.5, most of the misses earthquakes that
  killed where it draws no ring, so the rings are unchanged.

- **The hypocentral equation with the dead of V and VI.** Rules written
  before either candidate was run (`validation/allenTollRules.ts`) added the
  dead of the V and VI bands to that equation's toll and put it to 194 small
  and deep earthquakes of 2008 to 2025 that no rule had read. It read the dead
  nearer their records than the toll in place (0.57 against 0.72) and fixed
  most of the small earthquakes left without a band, but its band still held
  fewer than eight records in ten: the equation draws no V ring about deep
  earthquakes that killed. The rings and the toll are unchanged.

- **Where a body breaks up, the paper against its program.** The Earth
  Impact Effects Program breaks small strong bodies up to 3 % lower than
  Nimbus, and bursts them up to 5 % lower (BM-13). Every altitude it
  printed, for 269 bodies, is Collins et al.'s Eq. 11 on twice the I_f
  their Eq. 12 prints, within 0.02 %. Eq. 11 on the printed I_f is the one
  that lands on the root of their Eq. 10, where the ram pressure first
  reaches the body's strength (within 40 m below I_f = 0.9), and Nimbus
  keeps it. Declared, with a test on each side, and nothing moves.

- **People at each intensity, against USGS PAGER.** The benchmark campaign
  put the people Nimbus counts at MMI VII and above at 0.13 of what PAGER
  counts, nobody at IX where PAGER counts people, and the toll at 0.30 of
  PAGER's estimate. Three causes were found, none a fit: PAGER counts VII
  from 6.5 where Nimbus starts at 7.0; the rings convert a median PGA, which
  never reaches IX; and PAGER counts deaths from V. Rules written before
  anything ran (`validation/pagerChain.ts`) tried PAGER's own chain —
  intensity from Boore et al. 2014's PGV through Worden et al. 2012's PGV
  relation, as ShakeMap draws it, with PAGER's bands and rates — against the
  chain in place. It counts PAGER's people far better (a score of 0.63
  against 1.76) and keeps the held-out dead within the margin, but draws the
  ShakeMaps' areas worse than the rules allow (1.13 against 0.97), so the
  chain in place stays. The PGV relation, verified against Boore's own code
  within 0.0005 %, is kept as a candidate of the prospective rings.

- **The scalar path's run-up is not missing the field's caps.** The
  field caps run-up at four times an amplitude that is itself shoaled up
  to four times, and lands on the same sixteen-fold as the scalar path —
  so the fix the roadmap described would have changed nothing. What is
  wrong is Synolakis' non-breaking law used on breaking waves, and it
  does not touch the toll, which reads the Green–McCowan shore height.
  Recorded, with the line-source hypothesis checked from first
  principles (in its naive form it would take DART from 0.90× to about
  3×) and what the MMI saturation fix needs.


- **Nimbus can be cited.** `CITATION.cff` carries the citation metadata
  GitHub's "Cite this repository" button and Zenodo both read, and asks
  for the commit printed on the simulation report being quoted. No
  version or DOI yet: those arrive with the signed v1.0.0 tag and the
  Zenodo integration, which only the maintainer can switch on. A
  release-notes draft for 1.0 says what the release promises and what
  it does not do, and the release checklist now names the steps only
  the maintainer can take — and stops pointing at a repository, a
  remote and a hosting provider the project does not use.

- **The README says how the model is checked**, links the validation
  page and report, and stops quoting a test count from months ago.


- **A volcano knows which zone was cleared.** `evacuationRadiusM` is the
  zone ordered cleared before the eruption, set by the reader in the
  panel and by the record in historical presets. Inside it the model
  uses the mortality measured at Merapi in 2010 — 367 dead among
  410 388 displaced — and beyond it everyone a current reaches counts
  as unwarned. A radius rather than a switch: at Mount St Helens the
  closed zones reached about eight kilometres, the blast nearly four
  times that, and only three of the fifty-seven dead were inside the
  red zone. Pinatubo (40 km, PHIVOLCS) goes from 82 477 modelled dead
  to 82 against 847 counted — now under, because most of its dead were
  killed by ash-loaded roofs and disease in the camps, which the model
  does not simulate. St Helens does not move: its modelled dead are
  beyond the zone, and its cause is now recorded as occupancy rather
  than evacuation, which was wrong. The band's old "Merapi ratio" of
  one per cent was the real ratio rounded up ten-fold; it stays a high
  end and is no longer anyone's centre.


- **A public validation page** (`?m=validation`, one click from the
  landing page and from the methodology page). The model against real
  events, with the misses shown as prominently as the matches: every
  counted death toll with its 9-in-10 band and verdict, every measured
  wave with what the globe itself draws beside it, the shaking
  footprint against USGS ShakeMap with its bias and scatter, what the
  site's population shortcut costs, the per-quantity standing of every
  anchor, and what the model does not do. Every figure is read from
  `docs/VALIDATION_REPORT.json`, which CI keeps byte-for-byte in step
  with the code, so the page cannot go stale any more than the report
  can; the page names the commit it was built from and links to the
  full report at that commit. Its own chunk, so a visitor who never
  asks how the model is checked does not download the answer; WCAG 2.1
  AA, tables keyboard-scrollable on a phone.

- **Every miss has a named cause.** A toll row now carries one of five
  causes — people had left, the buildings were not the national
  average, the population map is coarser than the blast, they drowned
  and the tests have no sea floor, the map counts who lives there now —
  and a test refuses a row that misses its record without one. The
  page explains each cause once, in both languages.

### Fixed

- **The methodology page called the preset list a validation.** It said
  fifteen events were re-simulated on every commit, over a list of
  thirty that were in fact the simulator's presets. It now calls them
  what they are and points to the page where the checking is.


- **The validation report can no longer go stale.** `docs/VALIDATION_REPORT.md`
  had sat at 30 April for four months while CI regenerated a throwaway
  copy on every push, so by September the document meant to prove the
  model described one that no longer existed — it still listed a
  flank-collapse input the validator had long since learned to check
  as untrusted. It is now generated deterministically, with no
  timestamp and every figure at the precision it is quoted, and CI
  fails the build when the committed copy differs from what the code
  produces. It also carries what it never had: the whole calibration
  net — death tolls against counted events with their predictive
  bands and the cause of every miss, waves against records, the
  shaking footprint against USGS ShakeMap, what the product's
  population interpolation costs, and the per-quantity standing of all
  twenty-one anchors.

- **Every printed simulation report names the model that produced it.**
  The report page stamps the commit it was built from and links to the
  validation report at that commit — which, with the gate above, is
  exactly the model that printed the page. A build from a working tree
  with uncommitted changes says so and names no validation report,
  because a precise-looking commit on code it does not run would be a
  lie.

- **The calibration envelope's gates were wrong for seven anchors.**
  The flag was one boolean per event, and one event can be both: Beirut
  and Tōhoku gate their wave and declare their toll, Hiroshima gates
  its blast radius, St Helens and Pinatubo their plume. Amatrice and
  Gorkha were still marked gated a week after the toll net ungated
  them. The gate is now per quantity, and a test holds it to the nets
  that decide.

- **Two anchors gated a wave the globe does not draw.** The Crossroads
  Baker rows spread an underwater burst without the energy
  normalisation the globe's veil has applied since 9 September, and
  read 23.3 m and 1.89 m, inside both records, where the veil draws
  10.5 m and 0.72 m, outside both. Not resolved — which law is right
  for a compact source is a physics decision — but no longer hidden:
  the report prints both figures and a test pins the misses.

- **The landing page's source-code link pointed at a repository that
  returns 404.** It and the report now share one address, the
  repository the code is actually pushed to.

### Measured

- **The wave at the coast, layer by layer.** The coastal toll was the
  only thing being checked and it hid two different faults behind one
  ratio. Read off the run-up field the toll itself uses: on the
  Sanriku coast the model's median shore height is 9.5 m against a
  surveyed 8–15, and the toll is still 2.9× the record — the wave is
  right and what is left over is the label's own assumption that
  nobody evacuated. On Sumatra's coasts the wave is too small and
  increasingly so with range: 4.4 m at Aceh against a surveyed flow
  depth of 5–15, 1.45 m in Thailand against a 5–10 m run-up, 0.72 m in
  Sri Lanka against 3–10. In the open ocean the same — Jason-1
  measured 0.6–0.8 m across the Bay of Bengal two hours in, where the
  model has 0.19 — while Tōhoku at the same range is right. Of the
  176 857 people the model puts inside the far-field strip it kills
  314, which is the whole of the deficit.

  The rigidity was the obvious suspect for the 1.37 left by the width
  fix and it is not the answer: μ scales every wave alike, and at
  40 GPa DART goes from 0.90× to 0.67×, Tōhoku's coast from 2.9× to
  1.5× and Sumatra's from nine times under to seventeen. The rows
  disagree about which way to move, so the residual is not a scale
  error. What the numbers point at instead is a far-field law with no
  rupture length in it — 702 km of fault and 1 300 km radiate the same
  wave at the same range — and the factor Sumatra is missing, 1.7–1.8,
  is L_Sumatra / L_Tōhoku. In the roadmap with the console snippet
  that reproduces every number above.

### Changed

- **One law for the wave's decay, and one width under it.** The
  amplitude at range was computed in four places with four answers —
  the veil on the globe, the far-field row each module publishes, the
  row the calibration harness compared against the record, and a 1/r
  cross-check. It now lives in `src/physics/tsunami/spreading.ts` and
  every caller reads it. Underneath was a second duplication:
  `simulateEarthquake` publishes the down-dip width from the Strasser
  2010 regression and draws everything with it, while the tsunami
  module derived its own as L / aspect. For Sumatra that meant the
  preset's own `ruptureWidthOverride` of 200 km — the geometrically
  constrained value — was ignored in favour of 520 km, wider than the
  whole forearc, and a mean slip of 2.8 m against inversions of five
  to ten. The caller supplies the width now and the result echoes it
  back, so the two cannot drift apart inside one object again.

  At DART 21413 the published row went from 1.93 m to 0.27 m against
  the 0.30 m recorded — 4.5× to 0.90× once beamed — and the Tier-2
  Saint-Venant solver, which shares nothing with that chain, reads
  0.79× against the same buoy. Live, Sumatra's coastal toll went from
  2 600 to 25 700 against the 227 900 counted.

  Declared rather than absorbed: Cocos Island, past the first null,
  goes from 0.83× the gauge to 0.33× — the old agreement was a source
  2.5× too small given back by a decay 6× too generous. And Tōhoku's
  mean slip is now 13.0 m where inversions average 10, which takes its
  coastal toll from 1.4× the record to 2.9×. That factor of 1.37 is
  M₀/(μ·L·W), and which of the three is wrong is the next question
  rather than something to fit.


- **The pair beside the death toll is a predictive interval.** In the
  product, and now for every event the simulator can resample, the low
  and high figures are the 5th and 95th percentile of 200 realisations
  drawn from the published input scatter, not the gentlest and
  harshest settings of the vulnerability table. Hiroshima on Rome
  reads 170 000 (150 000 – 190 000) where the old pair spanned a
  factor of four; L'Aquila reads 270 (24 – 1 700) and the 309 counted
  is inside it. Each end is a whole realisation rather than a column
  of separate percentiles, because percentiles do not add up and the
  rows have to total to the figure above them — matching a draw's
  rings to the median's by name left the ninety-fifth percentile of
  L'Aquila with nowhere to put its dead, and the panel said 24 – 1 700
  while the counter rising along the shaking front ended on 27 – 360.
  Rings are now spread over the median's by the people in each
  overlap. The panel says which kind of band it is showing, and what
  it does not carry: the vulnerability function's own factor of 2–5,
  and the census.

- **The Monte-Carlo samplers carry the whole scenario.** All four
  rebuilt their input from scratch and silently dropped every field
  they do not draw, so a realisation of Beirut ran a nuclear device
  instead of ammonium nitrate, one of Sumatra ran on the 803 km the
  regression gives rather than the 1 300 km observed, and one of
  St Helens lost its lateral blast. Everything unsampled now rides
  through untouched.

- **Three rows of the toll net read differently for it.** Hiroshima
  went from 47 924 – 198 927 to 107 004 – 129 200 and still contains
  its record. Pinatubo went from 916 – 91 641 to 32 123 – 313 870: the
  old low end missed by eight per cent and read like a model nearly
  right, where the truth is two orders of magnitude and a mechanism —
  roofs collapsing under wet ash — that is not modelled at all. Mount
  St Helens stopped containing its 57: an evacuated eruption fell
  inside 3 – 295 by accident, and 120 – 692 says plainly that a model
  counting everyone who was there cannot reach a toll made by everyone
  having left.

- **What the interpolation costs is measured, not assumed.** The
  browser cannot count the population once per realisation, so it
  counts once per ring plus two footprints bracketing the radii the
  draws reach, and reads every sampled radius off that curve at one
  density per annulus. `recordedTolls.test.ts` runs both that curve
  and the exact raster and compares: without the two brackets
  Pinatubo's high end moved by a factor of 2.7 — a band about the
  interpolation rather than about the eruption — and with them the
  worst row left is 1.37×.

### Fixed

- **A gate that could not fail.** Every gated row of the toll net
  passed on a band three to five orders of magnitude wide — Northridge
  on 13 to 139 037 dead — because the ends were the gentlest and
  harshest vulnerability curves in the table, picked, rather than an
  interval the model predicts. The band is now the 5th to 95th
  percentile of 200 realisations drawn from the published input
  scatter: magnitude σ 0.15 Mw, depth 20 %, Vs30 30 %, and the
  ground-motion residual σ_lnY ≈ 0.50 that dominates them. Northridge
  now claims 3 to 180 and still contains 57. Two rows stopped passing
  when the band narrowed — Amatrice at 299 against 0–111 and Gorkha at
  8 964 against 22–4 924 — and are declared misses with their cause
  filed. A new gate keeps any gated band under two and a half orders
  of magnitude.

- **The intensity contours honour the ground they stand on.** `vs30`
  was accepted, fed to the reported accelerations, and dropped before
  the rings were drawn — a Northridge run at Vs30 760, 500, 400, 300
  and 250 gave the same 17.0 km MMI VII ring every time. A contour is
  now the range at which the site-amplified median reaches the
  threshold: 17.0 km on rock, 21.6 at Vs30 400, and back to 21.0 at
  250 as the published site term's non-linear half saturates. At the
  rock reference the factor is one by construction, so nothing in the
  calibration net moves.

- **A median held to what a median can be held to.** The footprint
  anchor's per-event ratios were read as a defect — "wrong at both
  ends of the magnitude range" — and that was a category error. The
  model predicts median ground motion and a ShakeMap records one
  realisation of it; the published σ_lnY of 0.5 over an R^(−0.71)
  decay makes one sigma a factor of two in radius and four in area.
  Across all eleven bands the model is centred at 1.18 and scatters at
  σ_ln 0.71 against the 0.70 the published sigma implies, and that is
  now what the suite asserts, with the per-event numbers kept as pins
  beside it. What survives as a real defect is a band that did not
  happen: Tōhoku's MMI IX and three others.

- **The NGA-West2 site term is the published one.** It was a
  power-law surrogate `(Vs30/760)^(−0.4)`, and the code said so; it is
  now Boore et al.'s F_lin + F_nl with the coefficients read off the
  model's own PGA row. The non-linear half is what a power law cannot
  carry: soft ground amplifies a gentle wave 1.71× at Vs30 = 300 and
  saturates to 1.18× at half a g, where the surrogate gave a flat
  1.45× whatever the ground was doing. Nothing moves for the presets,
  which all sit at the rock reference where the term is zero by
  construction — what changes is a custom scenario that names its
  ground. The path function also gained its R_ref term.

- **Which country's buildings.** The shaking model ran one fatality
  curve for the whole planet — θ = 13.5, β = 0.22 — and read Northridge
  1994 at 12 546 dead against 57, the largest error left in the
  simulator and the one driving the number a visitor reads first for
  every earthquake. Jaiswal & Wald's per-country fits are behind a
  paywall but the fitted parameters are not: PAGER is USGS work in the
  public domain, and `pnpm pager:build` now generates the 252-country
  table from its own `fatality.xml`. The country comes from the
  nearest coded place in the city index, which Natural Earth gave an
  ISO code all along and the index was discarding. The 220× turns out
  to be two errors multiplied — no country costs forty in the United
  States, and 13.5 was itself six times deadlier than the table's real
  median of 14.57. Northridge now reads **38 against 57** in the net
  and 40 live, L'Aquila 227 against 309, and Tōhoku's headline falls
  from 980 000 to 200 000. Two rows moved the wrong way and are
  declared: Amatrice and Gorkha killed in small dense historic
  settlements that a national fit under-predicts.

- **The local terrain grid follows the fault.** It was a square around
  the pick, which for a 1 300 km rupture resolved 74 km of the coast
  that drowned in 2004 and left the rest to the planetary mosaic at
  thirty kilometres a sample. It is now a strip of tiles along the
  fault — at most forty, trimmed from both ends so the fault stays
  centred — on a fixed sample budget, so a long thin block spends its
  512 × 512 on rows instead of columns and the fast-marching pass
  costs what it always did. Sumatra's block goes from 470 km at 0.9 km
  a sample to 780 × 1 090 km at 1.8, four times the area for the same
  63 seconds end to end, and its coastal toll from 1 600 drowned to
  2 600. A factor of 1.6 where the coverage argument implied an order
  of magnitude; Tōhoku drifts 22 000 → 24 000, from 1.32× of its
  record to 1.44×.

- **A rupture starts its wave along its whole length.** The bearing
  came from the fault two changes ago and the distance did not: the
  arrival field was seeded at one point, so Banda Aceh — 250 km up the
  2004 rupture, on top of the part of the fault that lifted it — was
  given the amplitude of a coast 250 km from a source, 1.43 m against
  a run-up record of fifteen to thirty metres. The seeds now run along
  the fault every fifty kilometres and the field's distance is to the
  nearest part of the rupture: Aceh reads 4.92 m and 19.7 m of run-up.
  Tōhoku's coastal toll goes 9 400 → **22 000 drowned against about
  16 700**, from 0.56× to 1.32× and this time from the right geography;
  Sumatra 320 → 1 600, five times better and still far under, with the
  cause now located in the extent of the fine coastal grid.
- **The density lookup searches for land instead of averaging over
  province.** Its window grew with the caller's grid spacing, so a
  coastal point could divide a coast's people by a forty-kilometre
  square behind them; it now grows ring by ring and stops at the
  nearest land. Measured, it moved almost nothing — the raster's
  numbers were never the problem — but it is the right rule.

- **The disc the source sits in.** The field held the full source
  amplitude everywhere inside R₀ = half the rupture length — for
  Tōhoku a disc 351 km across at 3.99 m, which is every coast in Japan
  — and used the same number as the source scale in the spreading
  law's energy normalisation. It should be half the down-dip width,
  the same argument that settled the wavelength and the beam. DART
  21413 isolates it: 0.563 m against the 0.30 recorded with half the
  length, **0.280 m with half the width**. Every coastal toll comes
  down with it, because every one was standing on a far field nearly
  twice too strong: Tōhoku 63 000 → 9 400 drowned against about
  16 700, Krakatau unmoved at 24 000, Sumatra 6 700 → 320 — its dead
  are 250 km from a fault 200 km wide and used to sit inside the
  saturation disc at full amplitude.

- **A rupture is a line.** Every bearing the wave field asked for was
  measured from the epicentre, which for a 1 300 km fault puts Banda
  Aceh — 250 km up the line and square across the strike — almost
  straight along it, and hands it the incoherent floor of the beam
  where the answer is 1. The bearing now comes from the nearest point
  of the rupture: Aceh's cosine off the strike falls from 0.96 to
  under 0.35, and Sumatra's coastal toll goes from 2 100 drowned to
  6 700. Tōhoku's goes from 17 000 to 63 000, from 1.02× of its record
  to 3.8× over — the compensating pair the roadmap had already called
  a coincidence has come apart, and what it was hiding is now a
  roadmap entry of its own.

- **The amplitude a thousand kilometres out, and the last fifty metres
  of water.** Two errors on top of each other. The spreading law held
  the amplitude at the source value out to R₀ and decayed from there,
  which read 1.34 m at DART 21413 where 30 cm was recorded and made
  the coastal exposure of the *Sumatra* tsunami come out dominated by
  Tokyo Bay, Mumbai and Rio de Janeiro. Energy fixes it with no fitted
  constant: a ring of circumference 2πr and width √π·a gives
  A(r) = A₀√(a/(4√π·r)), which reproduces the NOAA Saint-Venant solver
  to three per cent. (This entry first claimed the model's own source
  landed at 0.27 m against the 0.30 recorded; it read 0.563 m, and the
  next entry is what makes the claim true.)
  Meanwhile the shore height was the offshore amplitude itself, so the
  fifty metres of water between where the field stops and where the
  wave breaks were dropped; Green's law and McCowan's breaking index
  give H = (d·γ)^(1/5)·A^(4/5) ≈ 2.1·A^(4/5), both constants already
  in the model. Together: Tōhoku's coastal toll 5 400 → **17 000
  drowned against about 16 700 recorded**, and Krakatau 1883 at 24 000
  against 36 400. Sumatra remains 2 100 against 227 000, and the
  reason is now identified — its rupture is 1 300 km long and the
  model treats it as a point at the southern end.

- **A warning nobody could have given.** The coastal toll took the
  wave's travel time as the warning time, so the 2004 Indian Ocean —
  which had no warning system at all — was handed a warning at every
  coast more than half an hour out. The lead time is now
  max(0, arrival − issue), and the issue time is a property of the
  basin: ten minutes by default because every ocean has a system
  today, infinite for the presets that predate their own (Sumatra
  2004, Lisbon 1755, Valdivia 1960, Alaska 1964). Sumatra's modelled
  coastal toll went from 120 drowned to 1 500; Tōhoku's did not move,
  because Tōhoku was warned.
- **The coast a single tile cannot see.** The local run-up grid was
  widened to nine tiles only when its own tile held no land at all,
  and a pick 150 km offshore clips a corner of coastline, which counts
  as land. Sumatra 2004 came out with 43 local coastal cells out of
  14 693. The test is now a quarter of the tile: Sumatra's local cells
  went to 406 and Tōhoku's to 585, and Tōhoku's coastal toll rose from
  6 500 drowned to 7 100 against about 16 700 recorded.

- **A floor under the directivity beam.** The array factor has zeros
  and a fault does not: it moves together over a correlation length ℓ
  and breaks into N = L/ℓ pieces that add as √N where coherent ones
  add as N, so its radiation cannot fall below √(ℓ/L) of the peak. One
  number for every megathrust — Mai & Beroza (2002) found the
  correlation length scales with the fault — anchored on Melgar &
  Hayes (2019) at 150 km for a 700 km rupture, giving 0.46. Cocos
  Island goes from 0.06× the tide-gauge record to 0.83×, DART 21413 is
  untouched at 1.14×, and on the globe the beam stops nulling the
  coasts that lie along a rupture: Tōhoku's coastal toll 3 800 → 6 500
  drowned against about 16 700 recorded.

- **The beam reaches the report's numbers.** The wave field on the
  globe beamed and the scalar rows did not, so "the amplitude at
  1 000 km" was the peak quoted as though it were everywhere. The
  seismic tsunami now takes a strike and a receiver bearing. At DART
  21413, 21° off the perpendicular and inside the main lobe, the model
  goes from 1.65× the recorded peak to 1.14×. At Cocos Island, past
  the first null, the pattern says 3 % of the peak where the gauge
  recorded twenty times that — so the beam is declined there and the
  row stays isotropic with the reason attached, rather than reporting
  a number from outside the model's range. What would extend the
  pattern past its null is the slip correlation length, which is now
  a roadmap entry rather than an invented constant.

- **One source wavelength for a megathrust, and the buoys chose it.**
  The codebase carried three: 2·L in the report, L in the wave field,
  and whichever reached the dispersion and the beam. At 4 km of ocean
  those imply leading waves of two hours, one hour and thirty-nine
  minutes; DART 21413 recorded thirty to forty (Satake 2013), so the
  wavelength is 2·W — twice the down-dip width, which is the profile a
  wave leaving the fault broadside actually sees. It is now computed
  once and passed to the dispersion, the directivity and the printed
  period alike. The beam was the point: the array factor goes as L/λ,
  frozen at one half while λ was tied to L, and now the aspect ratio,
  so a long rupture beams like one. Tōhoku's coastal toll moved 5 600
  → 3 800 drowned and Sumatra's 130 → 100, both already far under
  their records for causes documented under M8.

- **One dispersion law instead of two.** The globe's wave field
  carried Kajiura's parameter while everything else carried a fixed
  exponential, printed under a citation the code's own comment
  disclaimed, and the two disagreed by a factor of seven at 5 000 km.
  The heuristic is gone. It invented dispersion where there is none —
  a 700 km rupture crosses an ocean with its shape intact — and missed
  it where it dominates, which is every short source. Removing it
  showed that what it had been supplying was directivity: four GeoClaw
  megathrust rows are probes sitting in the end-fire null of a source
  the 1D path models as isotropic, and giving the comparison the same
  beam the wave field already carries makes them pass with no
  tolerance touched. The two remaining residuals — 1.65× at DART
  21413, 1.80× at Cocos Island — are now declared and pinned rather
  than absorbed.
- **The casualty rings reconcile with the total.** The per-band
  mortality was prompt deaths over population while the death count
  was prompt plus delayed, so a row could not be added up: the
  outermost ring of a large impact printed "0 % mortality, 2 000 000
  dead". Mortality is now the total share, `promptMortality` carries
  the immediate one, and the report table gained a totals line.

- **A casualty band with no name.** Past the second-degree burn radius
  there is an annulus where the column still ignites and nothing else
  reaches; no rule labelled it, so the report printed the raw i18n key
  `casualties.band.b6`. For a 500 Mt burst that annulus runs from
  177 km to the fireball horizon at 365 km and holds two thirds of the
  dead, and the bug fired at every yield from a megatonne up. A sweep
  now asserts every band a scenario can produce has a name in both
  languages.
- **The calibration envelope overstated its own distance.** 500 Mt is
  3.3 × 10⁴ times Hiroshima; rounding the exponent printed "10⁵ times
  past" — a threefold exaggeration of how far outside the record a
  scenario sits.
- **Two equation cards describing a model the code had left behind.**
  The contact-water-burst card printed `regime === SURFACE AND
  waterDepth > 0` on a report whose own output was `false` with a
  SURFACE regime and 200 m of water, and the underwater-burst card
  omitted the depth-of-burst efficiency — the factor that actually
  decides whether a wave exists at all.


### Added

- **The shaking footprint is anchored on the ShakeMap that recorded
  it.** A death toll is five models multiplied and a wrong toll does
  not say which one; `pnpm shakemap:build` now stores the ground area
  above MMI VII, VIII and IX for six events from the USGS ShakeMap
  product, and a test compares the model's footprint against it. The
  first run located the headline error of the previous change in one
  shot: the model paints **180 747 km² of Japan at MMI IX** where the
  2011 ShakeMap's maximum anywhere was 8.18, which is where its
  200 000 dead come from against a record of 18 500. Four events are
  shaken at intensities they never reached, and the footprint is too
  generous for small crustal events (Amatrice 18× in area) while too
  mean for Northridge and Kokoxili — the signature of one point-source
  attenuation inflated into a rupture stadium. The residuals are
  pinned rather than tolerated.

- **The model says where it has been measured.** The casualty panel
  now names the nearest event with a death toll on record and how this
  scenario stands against it — beside it, between two of them, or past
  the largest and by what factor. Per quantity, not per family: a
  fifty-megatonne charge sits beside Tsar Bomba for the wave and three
  thousand times past Hiroshima for the dead, and the panel shows the
  dead. Where nothing has ever been recorded it says so outright — no
  impact in history left a death toll, and no landslide in the net has
  one, so those counts come from the laws and nothing else. No
  computed number changes; the calibration net's twenty-one measured
  events simply stop being invisible.

- **A sweep for the scenarios nobody has run.** The calibration net
  measures eleven events the world has already performed; a visitor
  with the custom fields open covers the whole space. A property sweep
  now runs the laws across it — a tonne to a gigatonne, thirty
  kilometres up to five down, a metre to a hundred kilometres of
  impactor, magnitude four to ten, dry land to the Challenger Deep —
  and asks that every number be finite, that the laws stay monotone
  where physics demands, that they stay continuous across the
  boundaries the code draws for itself, and that nothing leaves the
  physically possible. All four hold.

- **Waves that were measured.** A second calibration harness, beside
  the death-toll one, checks what the model does to water: Crossroads
  Baker's near-field wave (30.7 m modelled against ~30 m recorded),
  the surface bursts that made no wave at all, Beirut's harbour, and
  Storegga's inferred open-ocean amplitude. Two rows are reported
  rather than gated and both measure the same known divergence — the
  veil spreads geometrically and carries no dispersion, so Baker is
  dead on at 300 m and four times high at 5.5 km, and Tōhoku at DART
  21413 sits between two of this project's own far-field laws.

- **The coastal toll of the wave.** The tsunami is counted wherever
  the wave map touches a coast: every run-up cell of the local grid
  and of the planet beyond it carries its beach slope, its length of
  coast and the wave's arrival time; the water at the shore is the arriving
  amplitude where the breaking clamp saturates (it does on 84 to 95
  per cent of cells, so a saturated run-up is a ceiling and not a
  measurement), the strip it crosses is the Bretschneider & Wybro
  inundation distance (10 km at most), the people in it come from the
  coastal land density of the 2.5′ tiles, and the share that dies
  follows the mean flow depth through the log-normal form of
  Koshimura 2009 and Jonkman 2008, with no warning. The toll is
  binned by arrival and the counter rises as the wave lands, hours
  after the impact for a far coast; the panel shows it apart, and a
  submarine landslide gets its first death toll.
  Tōhoku 2011 reads 13 000 dead against the 18 500 the wave took.
- **Population at 2.5′ with a land fraction.** Thirty 60° × 30° tiles
  of the GHS-POP 2020 grid at 2.5′ (≈ 4.6 km, 5 MB in all, fetched on
  demand) serve rings up to 1 500 km and the coast; the 0.125° planet
  serves the rest. Every cell now carries its land fraction, so a
  coastal cell's people are spread over its land, not over the sea it
  also covers. The provisional figure the counter starts from comes
  from the tiles, within a factor of two of WorldPop over Naples where
  the planet raster was a factor of four.
- **Burns, mass fire and later deaths.** The blast toll counts three
  more hazards, each acting in sequence on the people the earlier
  ones left alive: third-degree burns on the fraction in sight of the
  fireball (Glasstone & Dolan 1977), a share of the survivors inside
  a sustained firestorm (Hamburg and Dresden at the low end, Postol's
  superfire at the high end), and the injured who die within the
  first month for lack of care (OTA 1979). The panel shows prompt and
  later deaths apart, the band table names the causes of every
  annulus, and the counter dates them: burns within the thermal
  pulse, the fire from twenty minutes to six hours, the later deaths
  over the month. Rings can now cover the whole planet, as a
  Chicxulub's third-degree radius does.
- **The toll as the event unfolds.** The bar of the globe view counts
  the estimated deaths while the hazard front sweeps the bands — the
  Kinney–Graham shock front for blast, the crustal shear wave for
  shaking, the observed front speeds of pyroclastic currents and
  lateral blasts — with the low–high band and the physical elapsed
  time beside the figure. A provisional figure from the shipped
  raster appears within milliseconds and glides to the WorldPop figure
  when that lands. The tsunami toll joined later in the same release.
- **Estimated casualties.** WorldPop 2020 population inside every
  hazard band (zonal-statistics API up to 100 000 km², a shipped
  0.125° GHS-POP aggregate beyond) times published vulnerability
  functions:
  OTA 1979 mortality by overpressure for impacts and explosions, the
  USGS PAGER log-normal rate for earthquakes, Auker 2013 for
  pyroclastic flows. Central figure with a low–high band, per-band
  breakdown in the report, assumptions on the label. Tsunami and
  landslide tolls are not converted.
- **Inland impacts reach the sea.** The physics now takes the
  shoreline distance: the sea is within reach of crater, water cavity
  or the 1 m ejecta isopach, and the energy entering it is scaled by
  the McGetchin ejecta fraction beyond the shore. Propagation starts
  from the nearest deep-enough water in every compass sector — the
  Gulf and the Atlantic at once for a Chicxulub in Florida — with a
  multi-seed fast-marching solver, and lakes, rivers and shallow bays
  are no longer mistaken for the sea (they left the globe mute).
- **Cities on the globe.** Natural Earth 1:10m populated places
  (public domain, ≈ 4 000 places) drawn as terrain-clamped dots and
  names, densified by Natural Earth's own label zoom tiers, in the UI
  language (Roma / Rome). Click a name to make it the epicentre; a
  "Go to a city" search in the simulator panel flies the camera
  there. Toggle in the app bar, remembered per browser.
- **Wünnemann, Collins & Weiss (2010) impact-tsunami far field.** The
  rim wave (eq. 9a/10a) replaces the earlier ad-hoc damping fit as
  the best estimate — `r^−0.5` on a shallow shelf, `r^−1.2` in the
  deep ocean — and drives the run-up chain, the legend and the
  bathymetric propagation on the globe. The published upper/lower
  envelope (eqs. 7–8, 9b/10b, the same range the Earth Impact
  Effects Program prints) is reported alongside, with the h/L regime.
- **Damage contours drawn as zones with captions.** Each threshold
  paints only its annulus, gets a crisp clamped contour with a dark
  under-line, a rim caption (`5 psi · 1,7 km`) and a dashed 1σ line;
  the first camera framing now includes the outermost contour.

### Changed

- **City names always on.** The "Cities" toggle left the bar; the
  Natural Earth names are part of the map now, and the stale
  `nimbus.showCityLabels` preference is removed from the browser on
  start-up (the privacy notice lists one preference, the language).
- **Small rings on the rasters.** A circle smaller than a cell is the
  cell's land density times the circle area, and edge cells count by
  their sub-sampled share — for polygons too — instead of "no cell
  centre inside, nobody".

### Fixed

- **A local grid that contains a coast.** The terrain under a pick is
  one tile, and a tile centred on an offshore epicentre is all water —
  so a run-up field had no coast to run up and the whole shoreline was
  left to the planetary mosaic at forty kilometres a cell. When the
  tile holds no land the ring around it is now fetched and the nine
  resampled together; a pick on land fetches nothing extra. Tōhoku
  gains 585 coastal cells where it had none and its coastal toll goes
  from 1 100 against 18 500 recorded to 5 710, with the record inside
  the band.

- **A rupture radiates across itself.** Megathrusts were radiating
  evenly, at the amplitude of the peak, which puts the strongest wave
  a fault can make in every direction at once. They now carry the
  line-source beam of Ben-Menahem & Rosenman 1972, across the strike
  and not along it. The modelled maximum run-up on the Sanriku coast
  is 47.7 m against the 40.5 m surveyed at Miyako in 2011. Sources
  without an orientation are untouched.
- **A coastal density that could see the coast.** The population
  density around a run-up cell was read with a fixed three-cell
  window — fourteen kilometres on the 2.5′ tiles — while the cells
  themselves come off a forty-kilometre tsunami grid and can sit that
  far offshore. It read water and reported nobody, so Japan
  contributed no one to its own tsunami and the toll came from Chile
  and Hawaii. The window now follows the caller's grid spacing.

- **The veil learns which waves disperse.** The amplitude field
  carried no frequency dispersion at all, because the one factor
  available was a fixed 2 500 km scale length calibrated on megathrust
  waves and would have been wrong for everything else. It now carries
  the Kajiura parameter itself, D = (4π²/6)·r·h²/λ³, with the source's
  own wavelength — so a rupture seven hundred kilometres long crosses
  an ocean untouched while a flank collapse's kilometre-long wave
  spreads into its train within a few hundred kilometres. The decay exponent is a half
  and is derived rather than fitted: geometry gives 1/√r on a water
  surface, a dispersing train costs another r^(−1/2), and together
  they are the 1/r this project's far-field rows have always used —
  so the two laws it had were one law at its two ends. Crossroads
  Baker, the only event measured at two ranges, lands inside both. Anak Krakatau's coastal toll falls from 8 700 against
  437 recorded to 2 200; Tōhoku does not move, correctly; and a 50 Mt
  device at its optimum depth now delivers fifteen centimetres three
  thousand kilometres away instead of a wave, which is what the
  tsunami-bomb programmes concluded.

- **Where a burst has to be to make a wave.** An explosion's coupling
  to water was one number — the value for a charge at the optimum
  depth — spent on every burst wherever it sat, and a half-kilotonne
  detonation on the Beirut quay came out drowning 77 000 people in a
  harbour whose real wave was about a metre. There is now a
  depth-of-burst curve: peaked at the scaled depth Glasstone gives,
  falling to nothing at the surface where the gas globe vents to the
  air and again in deep water where the bubble never breaks through.
  It replaced the old height threshold rather than joining it, so a
  genuinely submerged burst is modelled for the first time — Crossroads
  Baker gets its wave, Castle Bravo and Ivy Mike get the craters they
  are actually remembered for, and Beirut reads 900 against 218
  counted. Explosions also gained the sea-coupling law impacts already
  had, which now lives in one place and serves both.

- **A conventional explosion is not a small nuclear one.** OTA's
  casualty bands come from Hiroshima and Nagasaki, and applying them
  to ammonium nitrate in the port of Beirut killed fifty times the 218
  who died. Explosions now carry a charge type: a chemical one gets
  bands built on direct-blast lethality and building collapse rather
  than on a nuclear flash, no thermal or mass-fire term at all, and
  later deaths at two per cent of the injured instead of the thirty
  that belongs to a country with no hospitals left. Beirut, Halifax
  and Texas City move from one to two orders of magnitude high to
  about four times.
- **A pyroclastic band that admits an evacuation.** Its low end was
  fifty per cent, which is a gentler current; it is now one per cent,
  which is an empty one — the Merapi 2010 ratio. Mount St Helens, a
  mountain closed for two months before it erupted, is inside the band
  again.

- **The flash stops at the horizon.** A Chicxulub-class fireball has a
  third-degree burn radius of 27 000 km on a planet 20 015 km across,
  and the toll was applying Glasstone's fireball mortality to all of
  it — 1.9 billion people at the antipode dying of a flash they could
  not see. Burns and mass fire are now cut where the fireball sets
  below the curve of the Earth, the cut the Earth Impact Effects
  Program makes: 1 590 km for a 200 km fireball, 46 km for Hiroshima's
  and 230 km for a 50 Mt burst, so no nuclear scenario moves. A 15 km
  impactor on Rome goes from 4.2 billion dead to 1.0 billion. The heat
  that does reach the far side comes from re-entering ejecta, which
  the cascade describes and the toll still does not count — Goldin &
  Melosh 2009 on why that firestorm may fizzle.

- **The veil and the caption beside it.** The store handed the tsunami
  amplitude field a quarter of the rupture length where the seismic
  module spreads from a half, so the wave drawn on the globe stood a
  factor √2 below the "wave at 1 000 km" printed under it. Fixed, and
  pinned by a test that runs the field's law on the metadata the store
  passes and demands the event's own published amplitude back. Tōhoku's
  coastal toll moves from 13 000 to 48 000 against a recorded 18 500:
  the closer figure had been right for the wrong reason, two errors
  cancelling. The same test pins, with its size and its reason, the
  divergence that must stay — the veil spreads geometrically for the
  near field, a compact source's published row carries the dispersion
  of a thousand kilometres, and neither law survives in the other's
  territory.

### Fixed

- **Ocean impacts showed tsunami numbers but no tsunami on the map.**
  `evaluate()` now waits for the terrain tile under the pick and for
  the planetary bathymetric mosaic (bounded at 8 s) before
  simulating, and a mosaic that lands after Launch completes the
  tsunami layer of the result already on screen instead of waiting
  for the next Launch.

- **Submarine landslide event type.** Watts (2000) flank-collapse and
  submarine-landslide tsunamigenesis with archetype scenarios for
  Storegga (~8200 BP), Anak Krakatau 2018, Lituya Bay 1958. Wired
  through store, URL state, cascade timeline, globe, and report.
- **Fault-style-aware seismic tsunami source.** Per-style rupture
  aspect ratio (Strasser 2010, Wells & Coppersmith 1994 Table 2A),
  dip-dependent uplift factor (Okada 1992, Tanioka & Satake 1996,
  Geist & Bilek 2001), and a wave-coupling efficiency η ≈ 0.7
  (Satake et al. 2013). Strike-slip Mw 8.5 now produces a smaller
  wave than a megathrust at the same magnitude, which is what the
  DART buoys actually measure.
- **Tsunami coverage extended to all event types.** Underwater and
  contact-water nuclear bursts (Glasstone §6, Le Méhauté & Wang 1996),
  volcanic flank- and caldera-collapse waves (Watts 2000, Grilli 2019),
  Green's-law shoaling combined with cylindrical 1/√r spreading
  painted as a heatmap (Lamb 1932, Synolakis & Bernard 2006).
- **Earthquake aftershock catalogue.** Deterministic Reasenberg-Jones /
  Båth / Omori-Utsu / Gutenberg-Richter sequence, seeded by the
  mainshock so the catalogue is reproducible and shareable. Rendered
  as a magnitude-graded point cloud with a log-compressed time-lapse.
- **Population-exposure overlay.** Client-side WorldPop 2020 COG
  lookup via geotiff.js with HTTP Range requests. Counts population
  inside the headline damage circle. Frames the number as exposure,
  not casualties — the casualty conversion needs a vulnerability
  function we deliberately don't ship.
- **U.S. Standard Atmosphere 1976.** Seven-layer hydrostatic profile
  (NOAA-S/T 76-1562) feeds atmospheric-entry and ash-settling.
- **Atmospheric-entry phenomenology.** Pancake penetration bonus,
  atmospheric yield in megatons, thermal-flash burn radii, and shock-
  wave overpressure radii applied to the airburst yield. Resolves the
  pedagogical "fragments at 46 km, 100 % energy to ground" puzzle:
  the penetration bonus exceeds the breakup altitude, regime is INTACT.
- **High-altitude airburst amplification.** Closed-form factor
  `f(h) = (P₀ / P_amb(h))^(1/β)` with β = 5/3 (Whitham 1974, Sachs
  1944, Korobeinikov 1991, USSA 1976) replaces the previous 2-point
  empirical fit. Validates Chelyabinsk 0.5 psi reach to within 1 %,
  Tunguska 5 psi reach to within 15 %.
- **Damage rings honour airburst regime.** Rings now use
  `max(surface burst from gf · KE, atmospheric airburst from
  (1 − gf) · KE)`, so Tunguska no longer renders as if 7 Mt detonated
  at sea level.
- **Bathymetry-aware scenarios.** Impact and explosion auto-derive
  water depth from AWS Terrarium tiles; clicking on open ocean
  triggers the tsunami branch without manual configuration.
- **Coastal explosion → tsunami auto-trigger.** Beirut 2020 on Hangar
  12, Castle Bravo on the Bikini reef. `findNearbyOceanDepth`
  searches a 9×9 lattice, falls back to the median ocean cell
  depth capped at 200 m.
- **DEM-driven Synolakis run-up.** Caller-supplied beach slope from
  the Terrarium tile around the click whenever the slope is inside
  Synolakis' valid envelope (~0.057° to ~18°). Outside the envelope
  the simulator falls back to the 1:100 reference. Inundation
  distance becomes `runup / tan(slope)`.
- **Tsunami kinematics in the report.** Open-ocean celerity `c=√(g·h)`,
  source wavelength (≈ 2× rupture length for seismic; ≈ 2× cavity
  diameter for impact), dominant period T = λ/c, plus inland
  inundation estimates at 100 km and 1000 km.
- **Tsunami visualisation.** Concentric wave-front rings (5 m / 1 m /
  0.3 m amplitude), tighter masking on the FMM amplitude raster,
  hover tooltips on every contour with EN+IT explanations tied to
  historical events.
- **Coastal damage tier description.** Six-tier readout under every
  run-up row, keyed off Bryant 2014 §10.5 / FEMA P-646 §3 /
  Imamura intensity thresholds.
- **Click-through aftershock detail.** Click any aftershock in the
  cloud, get magnitude, time, distance, MMI V/VI/VII contours, and
  three dim rings drawn around the picked event.
- **Geometry asymmetries.** Schultz & Anderson (1996) ejecta-blanket
  butterfly for oblique impacts, Glicken (1996) lateral-blast wedge
  for volcanoes (Mt St Helens 1980 archetype).
- **Monte-Carlo P10/P90 rings.** Faint translucent bands around the
  nominal damage circles when an MC sweep is run.
- **18 new historical presets.** Popigai, Boltysh, Sikhote-Alin (impact);
  Ivy Mike, Halifax 1917, Texas City 1947 (explosion); Valdivia 1960,
  Great Alaska 1964, Gorkha 2015, L'Aquila 2009, Amatrice 2016
  (earthquake); Vesuvius 79 CE, Etna 1669, Pelée 1902, Eyjafjallajökull
  2010, Hunga Tonga 2022 (volcano); Vaiont 1963, Elm 1881 (landslide).
- **Methodology page and glossary.** 23 new bibliographic Citations,
  validation roster grew from 15 to 38 historical events, glossary
  picked up 26 terms across 6 sections (new "Atmospheric entry" and
  "Population & exposure" categories). EN + IT.

### Fixed

- **Cascade ring timing for large-yield events.** Per-ring delay
  scaled linearly with the previous ring's radius at a fixed visual
  shock speed, so Tsar-Bomba light-damage rings appeared at t ≈ 23 s
  and Chicxulub rings at t ≈ 5 min — long after the 7 s mushroom-
  cloud VFX faded. New scheduler caps the total cascade at
  `MAX_TOTAL_CASCADE_MS` (5 s) by uniformly accelerating the
  effective shock speed when needed. Smaller scenarios unchanged.

### Changed

- Project renamed to **Nimbus — Nuclear & Impact Modeling & Blast Understanding System** (technical id
  `nimbus`). Repo: `anred88-stack/Nimbus`. All `PROJECT_NAME` /
  `GITHUB_USERNAME` placeholders substituted across `package.json`,
  `index.html`, the i18n JSON, the landing page, the deploy workflow,
  README, NOTICE, LICENSE, the announcement draft, the release
  checklist, and the development handbook.

### Pending for v1.0

- ~~Replace the `TBD` copyright holder and the placeholder contact
  addresses~~ — done.
- Set `VITE_PLAUSIBLE_DOMAIN` in the Cloudflare Pages production
  environment.
- Real-device QA pass on iOS Safari and Android Chrome (Playwright
  emulation already green).
- Polish the announcement post, tag `v1.0.0`.

---

## Milestone history

Each milestone landed as a series of DCO-signed Conventional Commits;
the summaries below describe the shape, not the full diff.

### M6 — Content, tooltips, scientific provenance

Every numeric readout carries a Radix tooltip with the cited paper.
In-app `GlossaryDialog` with 14 plain-language definitions grouped by
discipline. Per-preset note line surfaces beneath the dropdown (date,
attribution, mechanism). Preset gallery covers Chicxulub, Chicxulub
ocean, Tunguska, Meteor Crater, Hiroshima, Nagasaki, Castle Bravo,
Tsar Bomba, 1 Mt reference, Tōhoku, Northridge, Kokoxili, Krakatau,
Mt St Helens, Tambora — 15 presets across four event types.

### M5 — Cross-browser, mobile, accessibility, performance

Playwright matrix: Chromium, Firefox, WebKit, Pixel 7, iPhone 14 — 85
E2E × 5 projects, all green locally and in CI. `@axe-core/playwright`
sweep on landing (IT + EN), globe mode, About, Glossary — WCAG 2.1 AA
clean. Lighthouse CI enforces accessibility = 1.0 and holds LCP under
3000 ms. Responsive polish for short viewports.

### M4 — URL-serialisable state

Schema v1 with compact keys. Encoder/decoder round-trips every
preset-level state. `useUrlStateSync()` keeps `window.location` in
sync with the store, preserves unrelated params, replays shared URLs.
Copy-link button with transient confirmation.

### M3 — Earthquakes, tsunamis, volcanoes, cascade

Earthquake primitives (Hanks & Kanamori 1979, Wells & Coppersmith
1994, Joyner & Boore 1981, Worden et al. 2012). Tsunami primitives
(Ward & Asphaug 2000, Green 1838, Aki 1966) plus impact cascade — a
Chicxulub-class ocean impact seeds a megatsunami without a special
case. Volcano primitives (Mastin 2009, Newhall & Self 1982, Sheridan
1979). Discriminated `EventType` union threaded through the store,
CLI, URL schema, UI dispatch. Globe paints per-type rings.

### M2 — Globe + Stage rendering

Cesium 1.x viewer with OSM imagery (no Ion token), click-to-pick
WGS84, four damage rings (crater rim, 3rd-degree burn, 5 psi, 1 psi).
React-three-fiber Stage scene with dusk-warm lighting, ground plane,
1.7 m human + 381 m tower landmarks, dynamic scale bar. ~1.5 s
black-crossfade transition that respects `prefers-reduced-motion`.
Radix Dialog (About) and Tooltip (citations) adopted. Zustand store
with discriminated event slices.

### M1 — Physics engine foundations

Impact: Collins/Melosh/Marcus 2005 crater scaling, Pike 1980 depth-
to-diameter, Schultz & Gault 1975 seismic magnitude. Chicxulub-class
test pins energy ≈ 3 × 10²³ J and final crater ≈ 180 km within 10 %.
Explosion: Glasstone & Dolan 1977, Kinney & Graham 1985, Nordyke
1977. Branded units, deterministic `simulateImpact`, Comlink worker,
`pnpm simulate` CLI. Layer 2 stays headless (ESLint-enforced).

### M0 — Setup

Vite 6, React 19, TypeScript 5.7 strict (`exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `verbatimModuleSyntax`). ESLint flat
config with the Layer-2 import guard. Vitest split (physics/Node and
ui/jsdom). Playwright scaffold. Storybook with `addon-a11y`. i18n
(IT + EN). Husky, lint-staged, Conventional Commits, DCO. CI workflow.
