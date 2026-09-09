# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Fixed

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
