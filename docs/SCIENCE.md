# Scientific bibliography & formula rules

Every number rendered in the UI traces back to a published formula
listed below. Every physics function in `src/physics/` carries a
JSDoc citation with authors, year, source, and the equation number
used.

## Rules for new physics code

1. **Cite the source.** Authors, year, short title, DOI or stable
   URL, and the equation number used.
2. **Test against a published value.** A unit test reproduces a
   documented empirical or model-derived value within ±5%. If the
   source itself has wider uncertainty, widen the tolerance and say
   why in a comment.
3. **Brand inputs and outputs.** Raw `number` is rejected by the
   compiler at physics boundaries — use the types from
   [src/physics/units.ts](../src/physics/units.ts).
4. **No magic numbers.** Constants live in `src/physics/constants.ts`
   with a source line. Inline literals are reserved for dimensionless
   coefficients lifted from a specific equation, with the equation
   number in the comment.
5. **Deterministic.** No `Math.random` inside formulas. Accept a
   PRNG seed if stochasticity is genuinely needed.
6. **Document tolerances.** A test comment explains why the
   tolerance was chosen ("Collins+05 reports ±10% on transient
   crater radius").

## Core references

### Impacts

- **Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005).** _Earth
  Impact Effects Program._ Meteoritics & Planetary Science 40(6),
  817–840. DOI: [10.1111/j.1945-5100.2005.tb00157.x](https://doi.org/10.1111/j.1945-5100.2005.tb00157.x).
  Energy, crater diameter (simple + complex), seismic magnitude,
  thermal radiation, ejecta.
- **Melosh, H. J. (1989).** _Impact Cratering: A Geologic Process._
  Oxford University Press. Foundational reference for crater
  morphology.
- **Pike, R. J. (1980).** _Control of crater morphology by gravity
  and target type: Mars, Earth, Moon._ Proc. LPSC 11, 2159–2189.
  Depth-to-diameter ratio for complex craters.

### Nuclear and conventional explosions

- **Glasstone, S., & Dolan, P. J. (1977).** _The Effects of Nuclear
  Weapons_ (3rd ed.). U.S. DoD/DoE. Overpressure scaling, thermal
  fluence, fireball radius, airburst vs groundburst.
- **Brode, H. L. (1968).** _Review of Nuclear Weapons Effects._
  Annual Review of Nuclear Science 18, 153–202. Semi-empirical
  blast-wave relations.
- **Kinney, G. F., & Graham, K. J. (1985).** _Explosive Shocks in
  Air_ (2nd ed.). Springer. Conventional-explosive overpressure
  scaling.

### Tsunamis

- **Ward, S. N., & Asphaug, E. (2000).** _Asteroid impact tsunami: a
  probabilistic hazard assessment._ Icarus 145, 64–78. DOI:
  [10.1006/icar.1999.6336](https://doi.org/10.1006/icar.1999.6336).
- **Wünnemann, K., Collins, G. S., & Weiss, R. (2010).** _Impact of a
  cosmic body into Earth's ocean and the generation of a large tsunami
  wave: insight from numerical modeling._ Reviews of Geophysics 48,
  RG4006. DOI:
  [10.1029/2009RG000308](https://doi.org/10.1029/2009RG000308).
  Rim-wave / collapse-wave far field (eqs. 7–10) — the impact-tsunami
  best estimate and envelope.
- **Wünnemann, K., Weiss, R., & Hofmann, K. (2007).** _Characteristics
  of oceanic impact-induced large water waves — re-evaluation of the
  tsunami hazard._ Meteoritics & Planetary Science 42, 1893–1903. The
  hydrocode runs behind the 2010 attenuation exponents.
- **McGetchin, T. R., Settle, M., & Head, J. W. (1973).** _Radial
  thickness variation in impact crater ejecta._ EPSL 20, 226–236.
  Ejecta thickness ∝ (r/R)⁻³ — the fraction of ejecta falling beyond a
  shoreline, which scales the sea coupling of an inland impact.

### Casualties

- **U.S. Congress, Office of Technology Assessment (1979).** _The
  Effects of Nuclear War._ OTA-NS-89. Ch. II, table 2: mortality and
  injury by peak overpressure (98 % at ≥ 12 psi, 50 % at 5 psi, 5 % at
  2 psi), derived from Hiroshima and Nagasaki. Used for impacts and
  explosions.
- **Jaiswal, K., & Wald, D. J. (2010).** _An empirical model for global
  earthquake fatality estimation._ Earthquake Spectra 26(4),
  1017–1037. DOI:
  [10.1193/1.3480331](https://doi.org/10.1193/1.3480331). The USGS
  PAGER log-normal fatality rate ν(S) = Φ(ln(S/θ)/β).
- **Auker, M. R., Sparks, R. S. J., Siebert, L., Crosweller, H. S., &
  Ewert, J. (2013).** _A statistical analysis of the global historical
  volcanic fatalities record._ J. Applied Volcanology 2, 2. DOI:
  [10.1186/2191-5040-2-2](https://doi.org/10.1186/2191-5040-2-2).
  Pyroclastic density currents as the deadliest volcanic hazard.
- **Postol, T. A. (1986).** _Possible fatalities from superfires
  following nuclear attacks in or near urban areas._ In _The Medical
  Implications of Nuclear War_, National Academy Press, 15–72. — Upper
  bound of mass-fire mortality.
- **Bretschneider, C. L., & Wybro, P. G. (1976).** _Tsunami inundation
  prediction._ Proceedings of the 15th Coastal Engineering Conference,
  ASCE, 1006–1024. — Inundation distance from run-up and ground
  roughness; the form Hills & Mader (1997) applied to impact tsunamis.
- **Koshimura, S., Oie, T., Yanagisawa, H., & Imamura, F. (2009).**
  _Developing fragility functions for tsunami damage estimation using
  numerical model and post-tsunami data from Banda Aceh, Indonesia._
  Coastal Engineering Journal, 51(3), 243–273. — Tsunami fatality by
  inundation depth.
- **Jonkman, S. N., Vrijling, J. K., & Vrouwenvelder, A. C. W. M. (2008).**
  _Methods for the estimation of loss of life due to floods: a
  literature review and a proposal for a new method._ Natural Hazards,
  46(3), 353–389. — Flood mortality functions.
- **Dziewonski, A. M., & Anderson, D. L. (1981).** _Preliminary reference
  Earth model._ Physics of the Earth and Planetary Interiors, 25(4),
  297–356. — Crustal shear-wave speeds used to time the shaking sweep.
- **Kieffer, S. W. (1981).** _Fluid dynamics of the May 18 blast at Mount
  St. Helens._ In Lipman & Mullineaux (eds.), The 1980 Eruptions of
  Mount St. Helens, USGS Professional Paper 1250, 379–400. — Lateral
  blast front speed.
- **Tatem, A. J. (2017).** _WorldPop, open data for spatial
  demography._ Scientific Data 4, 170004. The population under every
  band up to 100 000 km² (zonal-statistics API).
- **Schiavina, M., Freire, S., & MacManus, K. (2023).** _GHS-POP
  R2023A — GHS population grid multitemporal (1975–2030)._ European
  Commission, JRC. DOI:
  [10.2905/2FF68A52-5B5B-4A22-8F40-C41DA8332CFE](https://doi.org/10.2905/2FF68A52-5B5B-4A22-8F40-C41DA8332CFE).
  The shipped 0.125° aggregate under planetary-scale rings.
- **Watts, P. (2000).** _Tsunami Features of Solid Block Underwater
  Landslides._ J. Waterway Port Coastal Ocean Eng. 126(3), 144–152.
  Submarine-landslide source.
- **Satake, K., & Atwater, B. F. (2007).** _Long-term perspectives on
  giant earthquakes and tsunamis at subduction zones._ Annual Review
  of Earth and Planetary Sciences 35, 349–374.
- **Synolakis, C. E. (1987).** _The runup of solitary waves._
  J. Fluid Mech. 185, 523–545. Coastal run-up.
- **Lamb, H. (1932).** _Hydrodynamics_ (6th ed.). CUP. Long-wave
  phase speed, §170.

### Earthquakes

- **Wald, D. J., Quitoriano, V., Heaton, T. H., & Kanamori, H.
  (1999).** _Relationships between PGA, PGV, and MMI in California._
  Earthquake Spectra 15(3), 557–564. Underlies USGS ShakeMap.
- **Boore, D. M., Stewart, J. P., Seyhan, E., & Atkinson, G. M.
  (2014).** _NGA-West2 Equations for Predicting PGA, PGV, and 5%-
  Damped PSA._ Earthquake Spectra 30(3), 1057–1085.
- **Hanks, T. C., & Kanamori, H. (1979).** _A moment magnitude
  scale._ JGR 84(B5), 2348–2350.
- **Wells, D. L., & Coppersmith, K. J. (1994).** _New empirical
  relationships among magnitude, rupture length, rupture width,
  rupture area, and surface displacement._ BSSA 84, 974–1002.
- **Reasenberg, P. A., & Jones, L. M. (1989).** _Earthquake hazard
  after a mainshock in California._ Science 243, 1173–1176.
  Aftershock sequence model.

### Volcanic eruptions

- **Mastin, L. G., et al. (2009).** _A multidisciplinary effort to
  assign realistic source parameters to models of volcanic ash-cloud
  transport and dispersion during eruptions._ JVGR 186, 10–21. DOI:
  [10.1016/j.jvolgeores.2009.01.008](https://doi.org/10.1016/j.jvolgeores.2009.01.008).
  Plume height as a function of mass eruption rate.
- **Newhall, C. G., & Self, S. (1982).** _The Volcanic Explosivity
  Index (VEI)._ JGR 87(C2), 1231–1238.
- **Glicken, H. (1996).** _Rockslide-debris avalanche of May 18,
  1980, Mount St. Helens Volcano, Washington._ USGS Open-File Report
  96-677. Lateral-blast wedge.

### Constants

- **CODATA 2018** — fundamental constants.
- **IAU 2015** — nominal solar / planetary values.
- **IUGG GRS80 / IERS** — Earth radius and mass.
- **UNESCO/IOC 1981** — seawater density.
- **Turcotte & Schubert, _Geodynamics_ (2nd ed., 2002)** — crustal
  density.
- **U.S. Standard Atmosphere 1976 (NOAA-S/T 76-1562)** — atmospheric
  profile.

## Validation values

Benchmark values that physics tests should reproduce. Extend as
formulas are added.

| Event            | Quantity         | Reference value | Source                    |
| ---------------- | ---------------- | --------------- | ------------------------- |
| Chicxulub impact | Kinetic energy   | ~4.2e23 J       | Schulte et al. 2010       |
| Tunguska 1908    | Equivalent yield | ~10–15 Mt TNT   | Boslough & Crawford 2008  |
| Hiroshima        | Yield            | ~15 kt TNT      | Glasstone & Dolan 1977    |
| Tsar Bomba       | Yield            | ~50 Mt TNT      | Khariton et al. 1996      |
| Krakatau 1883    | VEI              | 6               | Self & Rampino 1981       |
| Tōhoku 2011      | Moment magnitude | 9.1 Mw          | USGS                      |
| Tōhoku 2011      | Source amplitude | 4–10 m          | Satake et al. 2013 (DART) |

## Master formula table

The single source of truth for every quantity rendered to the user.
Each row links the UI label to the implementing file, the canonical
equation, the citation, and the declared 1σ scatter (used both by
{@link src/physics/confidence.ts} for static bands and by the Monte
Carlo wrappers for sampled inputs).

| UI quantity                | File                                | Formula                                                                                                                                                                                  | Source                                                         | 1σ          |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| Impactor kinetic energy    | events/impact/kinetic.ts            | E = ½ m v²                                                                                                                                                                               | Newtonian                                                      | inputs      |
| Transient crater Ø         | events/impact/crater.ts             | D_tc = 1.161 (ρi/ρt)^⅓ L^0.78 v^0.44 g^-0.22 sinθ^⅓                                                                                                                                      | Collins et al. 2005, Eq. 21                                    | ±10%        |
| Final crater Ø (simple)    | events/impact/crater.ts             | D = 1.25 D_tc                                                                                                                                                                            | Collins et al. 2005, Eq. 22                                    | ±5%         |
| Final crater Ø (complex)   | events/impact/crater.ts             | D = 1.17 D_tc^1.13 D_c^-0.13                                                                                                                                                             | Collins et al. 2005, Eq. 27                                    | ±10%        |
| Crater depth (simple)      | events/impact/crater.ts             | d = 0.196 D                                                                                                                                                                              | Pike 1980, Table III                                           | ±30%        |
| Crater depth (complex)     | events/impact/crater.ts             | d = 1.044 D^0.301                                                                                                                                                                        | Pike 1980, Table III                                           | ±30%        |
| Seismic Mw from impact     | events/impact/seismic.ts            | Mw ≈ 0.67 log₁₀ E - 5.87                                                                                                                                                                 | Schultz & Gault 1975                                           | ±0.3 Mw     |
| Seismic moment Mw → M₀     | events/earthquake/seismicMoment.ts  | M₀ = 10^(1.5 Mw + 9.1) N·m                                                                                                                                                               | Hanks & Kanamori 1979                                          | ±0.1 Mw     |
| MMI from PGA               | events/earthquake/intensity.ts      | MMI = piecewise a + b·log₁₀(PGA)                                                                                                                                                         | Worden et al. 2012                                             | ±0.5 MMI    |
| Rupture area from Mw       | events/earthquake/rupture.ts        | A = 10^(Mw - 4.0)                                                                                                                                                                        | Wells & Coppersmith 1994                                       | ±0.3 dec    |
| Aftershock rate (Omori)    | events/earthquake/aftershocks.ts    | n(t) = K (t + c)^-p                                                                                                                                                                      | Reasenberg & Jones 1989                                        | ±factor 2   |
| Plume height               | events/volcano/plumeHeight.ts       | H = 2.0 V̇^0.241                                                                                                                                                                          | Mastin et al. 2009                                             | ±50%        |
| VEI ↔ ejecta volume        | events/volcano/vei.ts               | VEI = log₁₀(V) - 4 (V in m³)                                                                                                                                                             | Newhall & Self 1982                                            | discrete    |
| Ashfall isopach            | events/volcano/ashfall.ts           | Suzuki 1983 column + Ganser 1993 fallout                                                                                                                                                 | Bonadonna & Phillips 2003                                      | ±factor 2   |
| Pyroclastic runout         | events/volcano/pyroclasticRunout.ts | L = 10 · V_km³^(1/3) (H/L ≈ 0.1)                                                                                                                                                         | Sheridan 1979 / Hayashi & Self 92                              | ±70%        |
| Lateral-blast wedge        | events/volcano/extendedEffects.ts   | Glicken 1996 directed-blast                                                                                                                                                              | Glicken 1996                                                   | ±50%        |
| Overpressure ring          | events/explosion/overpressure.ts    | P = f(W, R/W^⅓) Sadovsky                                                                                                                                                                 | Glasstone & Dolan 1977                                         | ±15%        |
| Thermal fluence            | events/explosion/thermal.ts         | Q = η Y / (4π R²) τ_atm                                                                                                                                                                  | Glasstone & Dolan 1977                                         | ±25%        |
| Firestorm ignition radius  | events/explosion/firestorm.ts       | R s.t. Q(R) = 4.19e5 J/m²                                                                                                                                                                | Glasstone & Dolan §7.40                                        | ±30%        |
| Tsunami cavity radius      | events/tsunami/impact.ts            | R_C = (3 E / 2π ρ g)^¼                                                                                                                                                                   | Ward & Asphaug 2000, Eq. 3                                     | ±30%        |
| Tsunami far-field (Ward)   | events/tsunami/impact.ts            | A(r) = A₀ R_C / r                                                                                                                                                                        | Ward & Asphaug 2000 §4                                         | reference   |
| Tsunami far-field (best)   | events/tsunami/wunnemann.ts         | A_r = min(0.14 R_w, h)(R_w/r)^q_r, q_r = min(1.2, 0.5+2e^(−1.75L/h))                                                                                                                     | Wünnemann, Collins & Weiss 2010 eq. 9a/10a                     | ±factor 3   |
| Tsunami far-field bounds   | events/tsunami/wunnemann.ts         | A_up = min(0.28 R_w, h) R_w/r ; A_low = min{A_r, A_c}, A_c = 0.06 min(R_w/3, h)(5R_w/r)^q_c                                                                                              | Wünnemann et al. 2010 eq. 7–8, 9b/10b                          | envelope    |
| Inland-impact sea coupling | simulate.ts (tsunami block)         | reach = max(R_rim, R_w, r_ejecta 1 m); f_sea = min(1, max(R_rim, R_w)/d)                                                                                                                 | McGetchin et al. 1973 (r⁻³ ejecta)                             | ±factor 2   |
| Tsunami propagation seeds  | tsunami/sourcePlacement.ts          | nearest water ≥ 10 m, body ≥ 24 cells, per compass sector, planetary mask                                                                                                                | —                                                              | geometric   |
| Blast casualties           | casualties.ts                       | Σ pop(band) · m ; m = 98/50/5/0 % at ≥12/5/2/1 psi                                                                                                                                       | OTA 1979 table 2                                               | ±factor 2   |
| Shaking casualties         | casualties.ts                       | ν(S) = Φ(ln(S/θ)/β), θ = 13.5, β = 0.22 (band 14.5/0.12 – 11.5/0.30)                                                                                                                     | Jaiswal & Wald 2010 (PAGER)                                    | 3 orders    |
| Pyroclastic casualties     | casualties.ts                       | 0.9 · pop(runout) + 0.9 · sector/360 · pop(blast annulus)                                                                                                                                | Auker et al. 2013                                              | 50–100 %    |
| Burn casualties            | casualties.ts                       | exposed 25 % (10–50) × mortality 50 % (30–80) inside the 3rd-degree radius, on the blast survivors                                                                                       | Glasstone & Dolan 1977 ch. XII                                 | ×2–3        |
| Mass-fire casualties       | casualties.ts                       | 30 % (10–80) of the survivors inside the firestorm sustain radius                                                                                                                        | Glasstone & Dolan 1977 ch. VII; Postol 1986                    | ×3          |
| Later deaths               | casualties.ts                       | 30 % (10–60) of the prompt injured, first day to first month                                                                                                                             | OTA 1979 ch. II                                                | ×2–3        |
| Tsunami casualties         | tsunamiCasualties.ts                | H = √(A · R); X = 0.06 · H^(4/3) / n², n = 0.03 (≤ 10 km); people = land density × X × coast; ν(h) = Φ(ln(h/θ)/β), h = H/2, θ = 8 m unwarned → 16 m warned by arrival, 4 m high, β = 0.8 | Koshimura et al. 2009; Jonkman et al. 2008                     | ×3          |
| Casualty sweep             | casualtyTimeline.ts                 | deaths(t) = Σ deaths(band) · swept-area fraction at t; t(r) from the shock integral, r/3.5 km/s, r/30 m/s, r/400 m/s                                                                     | Kinney & Graham 1985; Dziewonski & Anderson 1981; Kieffer 1981 | timing only |
| Tsunami arrival time       | tsunami/fastMarching.ts             | eikonal `\|∇T\|² = 1/c²`, c = √(gh)                                                                                                                                                      | Sethian 1996                                                   | ±15%        |
| Tsunami shoaling           | events/tsunami/propagation.ts       | A_s = A_d (h_d / h_s)^¼                                                                                                                                                                  | Green 1838                                                     | ±25%        |
| Tsunami runup              | events/tsunami/extendedEffects.ts   | R = 2.831 d √(cot β) (H/d)^(5/4)                                                                                                                                                         | Synolakis 1987                                                 | ±30%        |
| Submarine landslide tsun.  | events/volcano/tsunami.ts           | η₀ = K·(γ/γ_ref)·V^(1/3)·sinθ, γ = ρ_s/ρ_w − 1                                                                                                                                           | Watts 2000 (inspired)                                          | ±factor 2   |
| Atmospheric profile        | atmosphere/ussa1976.ts              | U.S. Standard Atmosphere 1976                                                                                                                                                            | NOAA-S/T 76-1562                                               | ±5%         |

**How to read the σ column.** Where σ is given as a percent it is the
half-range of a symmetric 1σ Gaussian (or log-Gaussian) on the value;
"factor-N" means the high-side bound is N× the value (corresponding
σ_log = ln N). The σ column is the **published** scatter — propagation
through the cascade is in `src/physics/uq/` (see Phase 3 of the
[scientific-defensibility roadmap](./ROADMAP.md)).

## Casualties (Phase 23)

The population-exposure figure of earlier phases is now converted to
an estimated death toll, per hazard family, with a low–high band and
the assumptions printed on the label (prompt effects only, nobody
evacuated, no tsunami / fallout / famine / disease):

- **Population** — WorldPop 2020 through the zonal-statistics API
  (`api.worldpop.org/v1/services/stats`, free, CORS-enabled, ≈ 15–45 s
  per polygon, 100 000 km² per request) for rings up to ≈ 178 km, and
  a shipped 0.125° aggregate of the JRC GHS-POP 2020 30″ grid
  (`public/data/population-0p125.png`, built by
  `scripts/build-population.ts`; the WorldPop 1 km mosaic is the
  alternative input) for larger rings or when the API is unreachable.
  `src/scene/populationLookup.ts`.
- **Blast** (impacts, explosions) — OTA 1979 mortality by overpressure
  band; the 12 and 2 psi radii derive from the drawn 5 / 1 psi contours
  through the Kinney–Graham curve ratio at the event's yield.
- **Shaking** (earthquakes) — PAGER log-normal rate at the mid-band
  intensity of the MMI ≥ IX, VIII and VII annuli; central parameters
  are an average building stock (θ = 13.5, β = 0.22), the band spans
  the published national fits from earthquake-engineered (θ = 14.5,
  β = 0.12) to unreinforced masonry (θ = 11.5, β = 0.30) — three
  orders of magnitude, printed as such.
- **Pyroclastic** (volcanoes) — 90 % inside the runout, the lateral
  blast weighted by its sector.
- **Tsunami** (impacts, earthquakes, landslides, collapses) — counted
  wherever the wave map touches a coast: run-up over beach slope for
  the strip, the 2.5′ tiles for the coastal land density, Koshimura
  2009 / Jonkman 2008 log-normal mortality in the mean flow depth,
  binned by arrival time. See "The coastal toll of the wave" below.

`src/physics/casualties.ts` is pure and tested; the store fetches the
cumulative population inside every band's outer radius and evaluates
the plan (`runCasualtyLookup` in `src/store/useAppStore.ts`).

### Burns, mass fire and later deaths (Phase 24)

The blast bands of OTA 1979 are the prompt blast and collapse count
of Hiroshima and Nagasaki. Three more hazards are now counted, each
acting in sequence on the people the earlier ones left alive, so the
combined mortality of an annulus is 1 − Π(1 − m) and nobody dies
twice. Burns: inside the drawn third-degree radius, the fraction of
people in sight of the fireball — outdoors, at a window — times the
mortality of extensive untreated full-thickness burns (Glasstone &
Dolan 1977 ch. XII); inside the second-degree radius the exposed
survivors count as injured. Mass fire: where the fluence sustains a
firestorm, a share of the survivors dies, the Hamburg and Dresden
record at the low end and Postol's near-total superfire mortality at
the high end. Later deaths: OTA 1979 counts the injured and expects
most of the seriously injured to die for lack of care, two thousand
burn beds against hundreds of thousands of burn cases; a share of
the prompt injured is counted as dying within the first month, shown
apart from the prompt toll and dated in the sweep. The OTA annuli are
split wherever a thermal or fire radius falls, and beyond the 1 psi
ring the burns alone reach out — for a Chicxulub the third-degree
radius is the whole planet.

### Population under the rings (Phase 24)

Two rasters ship with the site, both built by `scripts/build-population.ts`
from the JRC GHS-POP 2020 30″ grid: the planet at 0.125° for planetary
rings, and thirty 60° × 30° tiles at 2.5′ (≈ 4.6 km at the equator,
fetched on demand, at most eight per query) for rings up to 1 500 km
and for the coast. Each cell carries its population on a log scale
and its land fraction — the share of its 30″ source cells that are
not sea — so a coastal cell's people are spread over its land rather
than over the water it also covers: a city-scale ring inside one
cell is the cell's land density times the ring's area, capped at the
whole cell; a cell the ring's edge crosses counts by a 4 × 4
sub-sample. The WorldPop zonal-statistics API, at 100 m, remains the
fine source for city-scale rings; the tiles give the provisional
figure and the fallback. Against the API over Naples the 2.5′ tiles
land within a factor of two where the 0.125° planet was a factor of
four.

### The coastal toll of the wave (Phase 24)

The tsunami was the one hazard the toll left out. It is counted now
wherever the wave map touches a coast. `runupField.ts` already gave
every coastal cell of the local grid its Synolakis run-up R on the
local beach slope β; each cell now also carries the slope, the length
of coast it stands for and the wave's arrival time from the
fast-marching field, and the planetary layer gets the same run-up
field along the planet's coasts at 40 km, used beyond the local grid.
`tsunamiCasualties.ts` turns the cells into people. The water height
at the shore is H = √(A · R), the geometric mean of the shoaled
amplitude arriving at the coast and the plane-beach run-up it makes:
the run-up is what a beach does to a wave, the amplitude what arrives,
and a kilometre grid knows neither beach nor plain — about 9 m on the
2011 Tōhoku coast, where the record shows 8–15 m on the plains and
20–40 m in the rias. The strip the water crosses is the Bretschneider
& Wybro (1976) inundation distance X = k · H^(4/3) / n² that Hills &
Mader (1997) used for impact tsunamis, with Manning's n = 0.03 and
k = 0.06 for metres — 1.3 km for 9 m, the mean the Tōhoku inundation
showed over 500 km of coast (561 km²) — capped at ten kilometres (the
Sendai plain flooded five); the people in it are the coastal
land density — the 2.5′ tiles around the cell, people over land —
times the strip's area; and the share that dies follows the mean
flow depth, H/2 over a strip that runs from H at the shore to nothing
at its edge, through the log-normal form of every published tsunami
and flood fatality function (Koshimura et al. 2009 fitted it to the
2004 Banda Aceh death ratios by inundation depth; Jonkman et al. 2008
reviewed the flood record): ν(h) = Φ(ln(h/θ)/β) with θ = 8 m and
β = 0.8 for a coast with no warning, θ = 16 m for a coast that
evacuated (the 2011 Tōhoku ratios, a few per cent at five metres) and
θ = 4 m for Banda Aceh, where the wave took most of the people it
reached above five metres. Warning is a matter of time: a coast the
wave reaches within half an hour has none, a coast three hours away
has been warned and emptied in any modern scenario (Tōhoku 2011 killed
one person across the Pacific), and the thresholds shift on a log
scale in between, Banda Aceh the high end throughout.
The toll is binned by arrival time and the sweep raises the counter
as the wave lands, hours after the impact for a far coast; the panel
shows it apart. Calibrated against the one event with a complete record. Tōhoku 2011
in the simulator puts 2.8 million people in the strips of the whole
Pacific, half a million of them on the Japanese coasts the wave
reaches first — the 561 km² Japan actually flooded held about 600 000.
The toll on those coasts is 25 000 at the low end of the band against
the 18 500 the wave killed, so the low end is where a coast with
Japan's seawalls, warning and drills belongs; the central figure,
125 000 there, is the same wave on a coast without them, and the
simulator does not know which coast it is looking at. Its honesty:
a run-up height and an empirical reach are not an inundation map, the
coast is where the rasters are coarsest, and the band is a factor of
three either way.

### When the deaths happen (Phase 24)

The bar of the globe view shows the toll rising as the event unfolds.
The number is not animated for effect: `casualtyTimeline.ts` sweeps
the estimate with the hazard front. Each band is crossed by a front
whose arrival time at radius r comes from the physics of the hazard —
the Kinney–Graham shock integral of `blastWave.ts` for impacts and
explosions (the same energy the rings are drawn with, `IMPACT_BLAST_COUPLING`
times the kinetic energy for an impact), the crustal shear wave at
3.5 km/s for earthquakes (PREM crust 3.2–3.9 km/s, Dziewonski &
Anderson 1981), 30 m/s for a pyroclastic current and 400 m/s for a
lateral blast (Mt St Helens cleared 27 km in about a minute, Kieffer 1981) — and the band's deaths accrue in proportion to the annulus
area the front has swept. The one assumption is that people are
spread uniformly within a band, which is the assumption the estimate
already makes when it applies one mortality to the whole annulus. A
15 kt front is done in about fifteen seconds; a Chicxulub 2 psi ring
at 2 000 km takes two hours. The burns are counted within the thermal
pulse (Glasstone & Dolan §7.86: 10 t_max, t_max ≈ 0.0417 W^0.44 s), the
mass fire from twenty minutes to six hours after the burst (the
Hiroshima fire storm, §7.71), the later deaths from the first day to
the first month; the wave on each coast at its arrival time, binned.

The clock on screen is a UI clock: five seconds, the cascade panel's
budget, with the physical time log-compressed into it so the first
seconds are legible for a city and the hours of a planetary blast do
not fill the screen. The physical elapsed time is printed beside the
figure, which is shown to two significant figures with its low–high
band. The figure starts from the shipped rasters — 2.5′ tiles (≈ 4.6 km)
for rings up to 1 500 km and the coast, the 0.125° planet beyond —
answered in milliseconds, and glides to the WorldPop figure when
that lands.

## Trans-oceanic tsunami propagation (Phase 11)

Tsunami iso-amplitude contours render through a **two-layer
hierarchical bathymetric pipeline** so trans-oceanic events
(Chicxulub, Tōhoku 2011, Hunga Tonga 2022, mega-megathrusts) draw
correct iso-curves all the way to the antipodes — not just inside the
~150 km local terrain tile.

| Layer      | Source                           | Resolution     | Coverage                                           | Used for                                      |
| ---------- | -------------------------------- | -------------- | -------------------------------------------------- | --------------------------------------------- |
| **Local**  | AWS Terrarium PNG, zoom 8        | ~600 m / pixel | ~150 km × 150 km centred on click                  | sub-km coastal detail, Synolakis run-up       |
| **Global** | AWS Terrarium PNG, zoom 2 mosaic | ~40 km / pixel | full planet (-85° to +85° lat, -180° to +180° lon) | trans-oceanic iso-contours, far-field heatmap |

The orchestrator `src/physics/tsunami/bathymetricTsunami.ts` runs the
Fast-Marching eikonal solver, Green's-law shoaling and iso-amplitude
extraction on **both** grids, returning a `result` object with both a
local layer (existing Phase 7 behaviour) and an optional `result.global`
layer (Phase 11 addition).

**Where the wave starts (Phase 23).** The propagation seeds are found
by `src/physics/tsunami/sourcePlacement.ts`: the nearest water at
least 10 m deep (the solver's floor) belonging to a body of at least
24 cells, in each of eight compass sectors within the event's reach,
on the planetary mosaic at its own resolution and on the local tile
vetted by the mosaic (a lake the tile shows as water is land on the
mosaic). All seeds start at t = 0 and the arrival field is their
minimum, so an impact in Florida raises the Gulf and the Atlantic in
the same run. Earlier revisions moved an inland source to the nearest
cell below −1 m — a lake or a 7 m bay from which the solver could not
march — and the globe stayed mute while the legend listed a tsunami.

**When the global layer activates:**

- The browser has finished fetching the 16-tile zoom-2 mosaic
  (~800 KB, kicked off at App shell mount, cached LRU for the session)
- The simulator triggered a tsunami (any of impact, explosion, earthquake,
  volcano, landslide source paths)

**When it doesn't:**

- Network failure on the mosaic fetch → falls back to local-only
- Launch pressed while the mosaic is still in flight → `evaluate()`
  waits for it (bounded at 8 s, see `ensureTerrainForEvaluate` in the
  store); should it land later still, `setGlobalBathymetricGrid`
  completes the tsunami layer of the result already on screen without
  re-running the physics

**UI status indicator.** The Ring Legend on the globe surfaces a
small badge with three states:

- 🟢 _globalActive_ — both layers rendered, trans-oceanic visible
- 🟡 _localOnly_ — the mosaic was not ready for this run; completes
  when it lands, or on the next Launch
- 🔵 _globalLoading_ — global mosaic still in flight

**Cancellation contract.** Phase 12a added a monotone evaluation
token: a Launch issued while the previous evaluate is still in
flight invalidates the previous resolution, so a stale
`bathymetricTsunami` with a missing `.global` field can never
overwrite a fresh dual-layer one.

**Performance.** The 1024×1024 global FMM runs in a Web Worker
(`src/physics/worker.ts`); the global heatmap is rendered at 512×512
via the `downsample` option to keep main-thread render under 50 ms;
each iso-band is capped at 800 segments via uniform stride sampling
so the silhouette is preserved without flooding Cesium with thousands
of entities.

## When the science is contested

Some quantities have legitimately broad uncertainty in the
literature (Chicxulub impactor diameter is anywhere from 10 to 14 km
depending on the study). In those cases:

1. Pick the most widely cited value.
2. Document the uncertainty in the JSDoc.
3. Widen the test tolerance and explain why.
4. If two formulas disagree by more than the tolerance, file an
   issue and discuss before picking one.

Better to surface uncertainty than pretend it isn't there. A
popular-science audience deserves "we know this to ±30%", not a fake
two-decimal-place precision.

### Calibrated fits flagged as such

A few headline quantities are NOT transcriptions of a published
equation but **calibrated envelopes** fit to one or two benchmark
events. They are honest order-of-magnitude estimates, and each is
labelled in its JSDoc as a fit (not the cited authors' formula):

- **Impact-tsunami source amplitude (Ward row)** (`events/tsunami/impact.ts`,
  `impactSourceAmplitude`) — a saturating fit to the Range 2022 /
  Bralower 2018 hydrocode envelope, not Ward & Asphaug's raw
  A₀ = R_C/2. It survives as the historical Ward & Asphaug reference
  row. The simulator's best estimate — run-up, the on-globe veil, the
  legend — is the Wünnemann, Collins & Weiss 2010 rim wave
  (`events/tsunami/wunnemann.ts`), which is a transcription of their
  eqs. 9a/10a, not a fit; the published upper/lower envelope
  (eqs. 7–8) is reported next to it because the impact-tsunami hazard
  itself is contested (Melosh 2003 "over-rated"; Wünnemann 2007).
- **Landslide / volcanic-collapse source amplitude**
  (`events/volcano/tsunami.ts`) — a Watts-2000-INSPIRED
  `K·(γ/γ_ref)·V^(1/3)·sinθ` calibrated per regime, not Watts'
  predictive equation (slide thickness and Froude number are folded
  into the regime prefactor).
- **Seismic-tsunami coupling triplet** (`events/earthquake/seismicTsunami.ts`)
  — the rupture aspect, dip-uplift, and wave-coupling factors are
  tuned to the Tōhoku DART + Sumatra anchors; that is calibration to a
  few targets, not independent validation.
- **Bolide airburst amplification** (`effects/atmosphericEntry.ts`) —
  the Sachs exponent β = 5/3 is effectively a single fitted knob
  landing Chelyabinsk / Tunguska on observation.
