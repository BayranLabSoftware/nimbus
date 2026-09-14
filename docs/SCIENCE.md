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
- **Herrick, R. R., Sharpton, V. L., Malin, M. C., Lyons, S. N., &
  Feely, K. (1997).** _Morphology and morphometry of impact craters._
  In _Venus II_ (Bougher, Hunten & Phillips, eds.), University of
  Arizona Press, 1015–1046. The depth–diameter fit for fresh complex
  craters on Venus that Collins et al. (2005, Eq. 28) use for Earth.

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
  Effects of Nuclear War._ Ch. II, fig. 1 (p. 19): mortality and
  injury by peak overpressure (98 % at ≥ 12 psi, 50 % at 5 psi, 5 % at
  2 psi), assumptions OTA calls relatively conservative and Postol
  (1986) describes as the standard Hiroshima-based rules. Used for
  impacts and explosions.
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
- **Goldin, T. J., & Melosh, H. J. (2009).** _Self-shielding of thermal
  radiation by Chicxulub impact ejecta: Firestorm or fizzle?_ Geology
  37 (12), 1135–1138. — Why a global re-entry firestorm is not a
  certainty, and why its toll is not counted here.
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
  phase speed, Art. 170; Green's law, Art. 185.

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

| UI quantity                   | File                                | Formula                                                                                                                                                                                          | Source                                                                                | 1σ                |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------- |
| Impactor kinetic energy       | events/impact/kinetic.ts            | E = ½ m v²                                                                                                                                                                                       | Newtonian                                                                             | inputs            |
| Transient crater Ø            | events/impact/crater.ts             | D_tc = 1.161 (ρi/ρt)^⅓ L^0.78 v^0.44 g^-0.22 sinθ^⅓                                                                                                                                              | Collins et al. 2005, Eq. 21                                                           | ±10%              |
| Final crater Ø (simple)       | events/impact/crater.ts             | D = 1.25 D_tc                                                                                                                                                                                    | Collins et al. 2005, Eq. 22                                                           | ±5%               |
| Final crater Ø (complex)      | events/impact/crater.ts             | D = 1.17 D_tc^1.13 D_c^-0.13                                                                                                                                                                     | Collins et al. 2005, Eq. 27                                                           | ±10%              |
| Crater depth (simple)         | events/impact/crater.ts             | d = d_tc + h_fr − t_br ≈ 0.213 D                                                                                                                                                                 | Collins et al. 2005, Eqs. 23–26, 48                                                   | ±30%              |
| Crater depth (complex)        | events/impact/crater.ts             | d = 0.4 D^0.3 (km)                                                                                                                                                                               | Collins et al. 2005, Eq. 28 (Herrick et al. 1997)                                     | ±30%              |
| Ejecta thickness              | effects/ejecta.ts                   | t = D_tc⁴ / (112 r³), r ≥ D_fr / 2                                                                                                                                                               | Collins et al. 2005, Eq. 47 (r⁻³: McGetchin et al. 1973)                              | lower bound       |
| Seismic magnitude, impact     | events/impact/seismic.ts            | M = 0.67 log₁₀(gf·E) − 5.87                                                                                                                                                                      | Collins et al. 2005, Eq. 40 (efficiency 10⁻⁴)                                         | ±0.67 (10⁻⁵–10⁻³) |
| Seismic moment Mw → M₀        | events/earthquake/seismicMoment.ts  | M₀ = 10^(1.5 Mw + 9.1) N·m                                                                                                                                                                       | Hanks & Kanamori 1979                                                                 | ±0.1 Mw           |
| MMI from PGA                  | events/earthquake/intensity.ts      | MMI = piecewise a + b·log₁₀(PGA)                                                                                                                                                                 | Worden et al. 2012                                                                    | ±0.5 MMI          |
| Rupture area from Mw          | events/earthquake/rupture.ts        | A = 10^(Mw - 4.0)                                                                                                                                                                                | Wells & Coppersmith 1994                                                              | ±0.3 dec          |
| Aftershock rate (Omori)       | events/earthquake/aftershocks.ts    | n(t) = K (t + c)^-p                                                                                                                                                                              | Reasenberg & Jones 1989                                                               | ±factor 2         |
| Plume height                  | events/volcano/plumeHeight.ts       | H = 2.0 V̇^0.241                                                                                                                                                                                  | Mastin et al. 2009                                                                    | ±50%              |
| VEI ↔ ejecta volume           | events/volcano/vei.ts               | VEI = log₁₀(V) - 4 (V in m³)                                                                                                                                                                     | Newhall & Self 1982                                                                   | discrete          |
| Ashfall isopach               | events/volcano/ashfall.ts           | Suzuki column (Pfeiffer et al. 2005 form) + Ganser 1993 fallout + Nimbus crosswind closure                                                                                                       | Suzuki 1983; Pfeiffer et al. 2005; Ganser 1993                                        | ±factor 2         |
| Pyroclastic runout            | events/volcano/pyroclasticRunout.ts | L = 10 · V_km³^(1/3) (Nimbus scaling)                                                                                                                                                            | Nimbus; Sheridan 1979 and Hayashi & Self 1992 background                              | ±70%              |
| Lateral-blast wedge           | events/volcano/extendedEffects.ts   | runout = 2.5 × Sheridan runout (Nimbus), sector up to 180°                                                                                                                                       | Crandell & Hoblitt 1986 (sector, ≈ 28 km)                                             | ±50%              |
| Overpressure ring             | events/explosion/overpressure.ts    | ΔP/P₀ = 808[1+(Z/4.5)²]/√(…), Z = R/W^⅓ (free air; chemical at 2W on the ground)                                                                                                                 | Kinney & Graham 1985; reflection: Takazawa et al. 2023                                | ±15%              |
| Thermal fluence               | events/explosion/thermal.ts         | Q = f W τ / (4π R²), f = 0.18 → 0.35 up to 200·W^0.4 ft, τ = e^(−R/L) (project L); none for chemical                                                                                             | Glasstone & Dolan 1977 §7.94–7.96, §7.101                                             | ±25%              |
| Firestorm ignition radius     | events/explosion/firestorm.ts       | R s.t. Q(R) = 4.19e5 J/m² (10 cal/cm², project value)                                                                                                                                            | Glasstone & Dolan 1977 §7.94–7.96 (fluence)                                           | ±30%              |
| Tsunami cavity radius         | events/tsunami/impact.ts            | R_C = (3 E / 2π ρ g)^¼                                                                                                                                                                           | Ward & Asphaug 2000, eq. 12 (ε = ½, D_C = R_C)                                        | ±30%              |
| Tsunami far-field (Ward)      | events/tsunami/impact.ts            | A(r) = A₀ R_C / r (A₀ project calibration)                                                                                                                                                       | simplifies Ward & Asphaug 2000, eq. 17                                                | reference         |
| Tsunami far-field (best)      | events/tsunami/wunnemann.ts         | A_r = min(0.14 R_w, h)(R_w/r)^q_r, q_r = min(1.2, 0.5+2e^(−1.75L/h))                                                                                                                             | Wünnemann, Collins & Weiss 2010 eq. 9a/10a                                            | ±factor 3         |
| Tsunami far-field bounds      | events/tsunami/wunnemann.ts         | A_up = min(0.28 R_w, h) R_w/r ; A_low = min{A_r, A_c}, A_c = 0.06 min(R_w/3, h)(5R_w/r)^q_c                                                                                                      | Wünnemann et al. 2010 eq. 7–8, 9b/10b                                                 | envelope          |
| Inland-impact sea coupling    | simulate.ts (tsunami block)         | reach = max(R_rim, R_w, r_ejecta 1 m); f_sea = min(1, max(R_rim, R_w)/d)                                                                                                                         | McGetchin et al. 1973 (r⁻³ ejecta)                                                    | ±factor 2         |
| Tsunami propagation seeds     | tsunami/sourcePlacement.ts          | nearest water ≥ 10 m, body ≥ 24 cells, per compass sector, planetary mask                                                                                                                        | —                                                                                     | geometric         |
| Conventional blast casualties | casualties.ts                       | 20/3/0.5/0.05 % at ≥12/5/2/1 psi, no flash, no mass fire, later deaths 2 % of the injured                                                                                                        | Glasstone & Dolan 1977 Table 12.38 (direct-blast lethality); rates are project values | ×3                |
| Blast casualties              | casualties.ts                       | Σ pop(band) · m ; m = 98/50/5/0 % at ≥12/5/2/1 psi                                                                                                                                               | OTA 1979 table 2                                                                      | ±factor 2         |
| Shaking casualties            | casualties.ts                       | ν(S) = Φ(ln(S/θ)/β), θ and β from the country's PAGER fit (252 of them; median 14.57 / 0.205)                                                                                                    | Jaiswal & Wald 2010 (PAGER)                                                           | 5–95 % band       |
| Pyroclastic casualties        | casualties.ts                       | 0.9 · pop(runout) + 0.9 · sector/360 · pop(blast annulus)                                                                                                                                        | Auker et al. 2013                                                                     | 50–100 %          |
| Burn casualties               | casualties.ts                       | exposed 25 % (10–50) × mortality 50 % (30–80) inside the 3rd-degree radius, on the blast survivors                                                                                               | Glasstone & Dolan 1977 ch. XII                                                        | ×2–3              |
| Thermal horizon               | casualties.ts                       | d = R⊕ · arccos(R⊕ / (R⊕ + R_f)); R_f = 0.002 · E^(1/3) impact, 55 · W^0.4 nuclear                                                                                                               | Collins et al. 2005; Glasstone & Dolan 1977 §2.120                                    | geometry          |
| Mass-fire casualties          | casualties.ts                       | 30 % (10–80) of the survivors inside the firestorm sustain radius                                                                                                                                | Glasstone & Dolan 1977 ch. VII; Postol 1986                                           | ×3                |
| Later deaths                  | casualties.ts                       | 30 % (10–60) of the prompt injured, first day to first month                                                                                                                                     | OTA 1979 ch. II                                                                       | ×2–3              |
| Explosion waves               | events/explosion/underwaterBurst.ts | H·R = 40 500·W^0.54 ft² in deep water, 150·d_w·W^0.25 ft² in shallow; T = 14.1·W^0.144 s; A = H/2; held inside max(bubble radius, Miche breaking radius)                                         | Glasstone & Dolan 1977 §6.119–6.121; Miche 1944                                       | ±35 %             |
| Dispersion in the veil        | tsunami/dispersion.ts               | D = (4π²/6)·r·h²/λ³; A ×= (1 + D)^(−1/2), so 1/√r near and 1/r far                                                                                                                               | Kajiura 1963; Watada et al. 2014; not on an explosion's 1/R wave                      | ×2                |
| Tsunami casualties            | tsunamiCasualties.ts                | H = √(A · min(R, A)); X = 0.06 · H^(4/3) / n², n = 0.03 (≤ 10 km); people = land density × X × coast; ν(h) = Φ(ln(h/θ)/β), h = H/2, θ = 8 m unwarned → 16 m warned by arrival, 4 m high, β = 0.8 | Koshimura et al. 2009; Jonkman et al. 2008                                            | ×3                |
| Casualty sweep                | casualtyTimeline.ts                 | deaths(t) = Σ deaths(band) · swept-area fraction at t; t(r) from the shock integral, r/3.5 km/s, r/30 m/s, r/400 m/s                                                                             | Kinney & Graham 1985; Dziewonski & Anderson 1981; Kieffer 1981                        | timing only       |
| Tsunami arrival time          | tsunami/fastMarching.ts             | eikonal `\|∇T\|² = 1/c²`, c = √(gh), or the group velocity of an explosion wave's period                                                                                                         | Sethian 1996                                                                          | ±15%              |
| Linear waves of a period      | tsunami/linearWaves.ts              | ω² = g·k·tanh(k·h); c_g = n·ω/k, n = ½(1 + 2kh / sinh 2kh); shoaling A ∝ c_g^(−1/2)                                                                                                              | Lamb 1932 §228–237; Fenton & McKee 1990                                               | exact             |
| Tsunami shoaling              | events/tsunami/propagation.ts       | A_s = A_d (h_d / h_s)^¼                                                                                                                                                                          | Green 1838                                                                            | ±25%              |
| Tsunami runup                 | events/tsunami/extendedEffects.ts   | R = 2.831 d √(cot β) (H/d)^(5/4)                                                                                                                                                                 | Synolakis 1987                                                                        | ±30%              |
| Submarine landslide tsun.     | events/volcano/tsunami.ts           | η₀ = K·(γ/γ_ref)·V^(1/3)·sinθ, γ = ρ_s/ρ_w − 1                                                                                                                                                   | Watts 2000 (inspired); K set on unsourced targets, see card                           | ±factor 2         |
| Atmospheric profile           | atmosphere/ussa1976.ts              | U.S. Standard Atmosphere 1976                                                                                                                                                                    | NOAA-S/T 76-1562                                                                      | ±5%               |

**How to read the σ column.** Where σ is given as a percent it is the
half-range of a symmetric 1σ Gaussian (or log-Gaussian) on the value;
"factor-N" means the high-side bound is N× the value (corresponding
σ_log = ln N). The σ column is the **published** scatter — propagation
through the cascade is in `src/physics/uq/` (see Phase 3 of the
[scientific-defensibility roadmap](./ROADMAP.md)).

## Casualties (Phase 23)

The population-exposure figure of earlier phases is now converted to
an estimated death toll, per hazard family, with a 5–95 % predictive
band and the assumptions printed on the label (prompt effects only; nobody
evacuated unless the scenario says which zone was cleared; no fallout,
famine or disease):

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
  intensity of the MMI ≥ IX, VIII and VII annuli, with the country's
  own fitted θ and β read from Jaiswal & Wald's 252-country table
  (United States 46.16 / 0.434, Japan 11.86 / 0.101, Iran 9.32 / 0.10;
  global median 14.57 / 0.205). The per-band low and high are the best
  and the worst building stock in that same table, three orders of
  magnitude apart — but that pair is no longer what the panel prints;
  see "What the pair beside the figure is" below.
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

### Two things a band has to admit (Phase 25)

The calibration net found the casualty bands to be the wrong shape:
vague where the model could be specific, confident where it was
wrong. Two of the three have been corrected.

**A conventional explosion is not a small nuclear one.** OTA's bands
are Hiroshima and Nagasaki — a nuclear flash through cities of light
timber, half the people dead at five psi — and applying them to
ammonium nitrate in a port of reinforced concrete put Beirut 2020 at
fifty times the 218 who were killed. `ExplosionScenarioInput` now
carries a charge type, and a chemical one gets its own bands. Below
the pressures that damage lungs the blast wave itself kills almost
nobody (Glasstone & Dolan Table 12.38: lung-damage threshold 12 psi,
fifty per cent lethality at 62 psi), so the dead are under the
buildings: twenty per cent at ≥ 12 psi, three at five, half a per
cent at two, banded by three because the record is thin. There is no
thermal flash and no mass fire, a chemical explosive radiating a per
cent or so of its energy where a nuclear device radiates a third. And
the later deaths fall from thirty per cent of the injured to two:
OTA's figure is not a fact about wounds but about a country under
nuclear attack with no hospital left standing, which is not a port
detonating in a city that still works. Beirut came from 50× to 4.1×,
and what remains is the raster rather than the model — at 240 m the
ring is twenty times smaller than a population cell, so a port basin
gets the city's average density.

**Whether anyone was told to leave is a scenario fact, and now an
input.** People caught inside a pyroclastic current almost never
survive, which is why the central mortality stays at Auker's ninety
per cent for anyone it reaches where they live. But a volcano gives
days of warning where an impact gives none, and the toll turns far
more on whether a zone was cleared than on anything the volcano does.
Until 14 September the simulator could not know which world it was
in, and hid the choice in an asymmetric band.

`VolcanoScenarioInput.evacuationRadiusM` is the radius of the zone
cleared before the eruption. Inside it the mortality is the one
measured at Merapi in 2010 — 367 dead among 410 388 displaced from
zones widened from 10 to 20 km as the eruption grew (BNPB, in Surono
et al. 2012) — about a thousandth, not the one per cent the band used
to call "the Merapi ratio", which was that ratio rounded up ten-fold.
Beyond the radius, everyone a current reaches is someone nobody told
to leave. It is a radius and not a switch because of Mount St Helens:
the closed zones reached about eight kilometres and the lateral blast
went nearly four times further, and only three of the fifty-seven dead
were inside the red zone.

Measured on the two volcano rows. **Pinatubo** carries the 40 km zone
PHIVOLCS had declared by the climax, and reads 82 dead where it read
82 477 — under the 847 counted, and for the right reason: most of
Pinatubo's dead were killed by roofs collapsing under typhoon-soaked
ash and by disease in the camps, neither of which the model simulates.
With the rounded one per cent it would have landed within ten per cent
of the record, for dead it does not contain; that is why the measured
ratio is the centre. **Mount St Helens** does not move at all, and
that is also right: 264 of its 265 modelled dead are in the blast
sector beyond the closed zones. What remains there is occupancy — a
map of where people live, putting 586 residents in logging land the
blast reached at 08:32 on a Sunday. Custom eruptions start from no
evacuation and say so; the panel asks for the radius.

**The third was that the band was never the model's uncertainty.**
The earthquake rows passed with bands up to five orders of magnitude
wide because the ends were the gentlest and harshest rows of the
vulnerability table, picked — a range of parameters, not a claim
about the event. That is now fixed at both ends: the country's own
PAGER fit is looked up from the 252-country table (the shipped city
index carries the ISO code), and the printed pair is a predictive
interval.

### What the pair beside the figure is

`src/physics/uq/tollBand.ts`. The scenario is drawn 200 times from the
published input scatter of `uq/conventions.ts` — magnitude σ 0.15 Mw,
depth 20 %, Vs30 30 %, yield σ_log 0.1, height of an air burst ±50 m, plume
and ejecta σ_log 0.5 and 0.3 — and, for shaking, dominated by the
ground-motion residual σ_lnY ≈ 0.60 that separates a median prediction
from one draw of the earth (the total Boore et al. 2014 give for PGA at
M ≥ 5.5; see "The residual Boore et al. give" below). Every draw goes through the same plan
builder the application uses; the fifth and ninety-fifth percentiles
of the resulting tolls are the band.

Each end is a **whole realisation**, not a percentile taken column by
column: percentiles do not add up, so a table built per column prints
rows that refuse to total. A draw's rings rarely line up with the
median's — at the ninety-fifth percentile of L'Aquila the MMI VIII
contour runs three times further out — so each ring is spread over the
median bands it overlaps, in proportion to the people in each overlap.
Nothing is dropped and the rows total to the figure above them.

For shaking, the fatality curve's own published scatter is drawn as
well: each realisation scales its mortality by exp(N(0, G)), G being
PAGER's `gnormvalue` for the country (see "The curve's own scatter"
below). Held fixed, and therefore **not** in the band: the population,
whose census error is its own question, and the blast and pyroclastic
death rates, which publish no scatter. The panel says so.

The population cannot be counted once per draw — a WorldPop band is
tens of seconds. It is counted once per damage ring plus two
footprints bracketing the radii the draws reach, and every sampled
radius is read off that curve at one density per annulus (cumulative
count linear in r²). What the interpolation costs is measured against
the raster rather than assumed: `recordedTolls.test.ts` runs both and
compares. Without the two bracketing footprints Pinatubo's high end
moved by a factor of 2.7 — a band about the interpolation and not
about the eruption; with them the worst comparable row is 1.37×.

### One law for the wave's decay (9 September 2026)

`src/physics/tsunami/spreading.ts`. There is one question — what is
left of the wave at range r — and the simulator answered it in four
places: the veil on the globe, the far-field row each event module
publishes, the row the calibration harness compared against the
record, and a 1/r cross-check in the extended-effects module. A
reviewer who sees two numbers for one wave stops trusting the rest.

Underneath the four was a second duplication. `simulateEarthquake`
publishes the down-dip width W from the Strasser 2010 regression and
draws the rupture rectangle, the casualty polygons and the veil's
source radius with it; the tsunami module derived its own as
L / aspect and the two disagreed by 37 % for Tōhoku. For Sumatra it
was worse than a disagreement: the preset overrides the length to the
observed 1 300 km **and the width to the geometrically constrained
200 km**, and the wave never heard the second override — it read
L / 2.5 = 520 km, wider than the whole forearc, and a mean slip of
2.8 m against inversions of five to ten. The caller now supplies the
width and `SeismicTsunamiResult.ruptureWidth` echoes it back, so a
divergence cannot hide inside one result object again.

The law itself is the energy of a ring, A(r) = A₀·√(a / (4√π·r)),
from a source radius a = W/2 — half the **down-dip width**, because a
wave leaving a long fault leaves it broadside and sees the
across-strike profile. That is the same argument that settles the
wavelength at 2·W, which the recorded period at DART 21413 (30–40 min)
settled first.

What the record says about it, at DART 21413, inside the main lobe:

|                                  | before                      | after          | recorded |
| -------------------------------- | --------------------------- | -------------- | -------- |
| published row                    | 1.93 m (4.5× with the beam) | 0.27 m (0.90×) | 0.30 m   |
| Tier-2 Saint-Venant, independent | 1.14×                       | 0.79×          | 0.30 m   |

Both columns were measured at 1 500 km, the distance every row used for
this buoy until 14 September 2026 and one no source gave. DART 21413 is
1 242 km from the USGS epicentre at the position NOAA NCEI lists for
it, and there the published row reads 0.29 m.

Two routes that share nothing — a closed-form chain and a
shallow-water solver on a Gaussian of its own — now land within twelve
per cent of each other and both inside the buoy's band. Before, they
read 4.5× and 1.14× and the disagreement between them was the thing
nobody could explain.

What it costs, stated rather than absorbed. **Cocos Island**, past the
first null of the 2004 rupture and standing on the incoherent floor,
goes from 0.83× the gauge to 0.33×: the old agreement was a source
2.5× too small given back by a decay 6× too generous. Even with no
beam at all the model would read 0.71× there, so a third of the
shortfall is the radiation pattern and two thirds is the source.
**Tōhoku's mean slip** goes from 9.5 m to 13.0 m where the inversions
average about 10 — M₀/(μ·L·W) with μ = 30 GPa over the Strasser area,
which is smaller than the inverted one. That same factor of 1.37 makes
the near field louder, and the coastal toll with it.

And what it gains, live, on the two coasts with a counted toll:

| coast                | before | after  | recorded        |
| -------------------- | ------ | ------ | --------------- |
| Sumatra–Andaman 2004 | 2 600  | 25 700 | 227 900         |
| Tōhoku 2011          | 24 000 | 49 100 | ~16 700 drowned |

Sumatra moves from eighty-seven times under to nine; Tōhoku from
1.4 times over to 2.9. The remaining thread is the same 1.37: the
slip, and therefore the rigidity or the area it is divided by. It is
in the roadmap and it is not fitted in the meantime.

### Crossroads Baker, read as it was printed (14 September 2026)

The first regenerated validation report found the two Crossroads
Baker rows gating a number the globe does not draw. The wave harness
spread an underwater burst as A₀·√(R₀/r), without the energy of a ring
that the veil has carried since the section above, and read 23.3 m at
300 m and 1.89 m at 5.5 km — inside records of 20–45 m and 1–3 m —
while the veil drew 10.5 m and 0.72 m, outside both. It looked like a
choice of law for compact sources, and a hard one, because the same
normalisation carries the coastal toll of a flank collapse.

The records settled it, once they were read as printed. Glasstone &
Dolan (1977) give Baker's waves in Table 6.57 as _maximum heights,
crest to trough_, at seven ranges, and the model computes an amplitude,
the crest above still water. The "1.8 m at 5.5 km" was nowhere in the
book; its figure is 6 ft at 22 000 ft, for the ninth wave of the train
(§2.70). Halved, with the foot each height was rounded to and the
book's own 35 % accuracy for explosion waves (§6.119), on a flat lagoon
of the 200 ft the book gives:

| range              | printed (crest to trough) | amplitude | globe's law    | same law, no ring energy |
| ------------------ | ------------------------- | --------- | -------------- | ------------------------ |
| 330 yd (302 m)     | 94 ft                     | 14.3 m    | 11.3 m (0.79×) | 28.4 m (1.98×)           |
| 660 yd (604 m)     | 47 ft                     | 7.2 m     | 6.0 m (0.83×)  | 15.4 m (2.15×)           |
| 1 330 yd (1.2 km)  | 24 ft                     | 3.7 m     | 3.1 m (0.84×)  | 8.0 m (2.20×)            |
| 2 000 yd (1.8 km)  | 16 ft                     | 2.4 m     | 2.1 m (0.84×)  | 5.4 m (2.23×)            |
| 2 700 yd (2.5 km)  | 13 ft                     | 2.0 m     | 1.5 m (0.78×)  | 4.1 m (2.05×)            |
| 3 300 yd (3.0 km)  | 11 ft                     | 1.7 m     | 1.3 m (0.75×)  | 3.3 m (1.99×)            |
| 4 000 yd (3.7 km)  | 9 ft                      | 1.4 m     | 1.0 m (0.76×)  | 2.8 m (2.02×)            |
| 22 000 ft (6.7 km) | 6 ft, ninth wave          | 0.9 m     | 0.57 m (0.63×) | 1.5 m (1.66×)            |

and one figure that is a crest rather than a height: the USS Saratoga,
anchored with its stern 400 yards out, rose "over 43 feet" on the first
wave (§6.58), where the globe's law reads 9.5 m, 0.72 of it.

So the globe was right and the gate was wrong. The law with the ring's
energy holds a steady eight tenths of the record from three hundred
metres to nearly four kilometres while the wave falls tenfold — the
slope is the law's and the level is the source's — and the law without
it stands at twice, above the book's tolerance at every tabulated
range. The residuals that remain have physical names. Near the burst
the first wave was a long solitary wave (§6.55) whose crest stood
higher than half its height, which the Saratoga shows and a linear law
of spreading does not carry; beyond two kilometres the highest wave
passes back into the train (§6.56) and the heights fall more slowly
than the model's leading-wave dispersion does. Anak Krakatau does not
move, because its law is the one already on the globe.

The harness had also been reconstructing the veil rather than asking
it. `veilLaw` in `amplitudeField.ts` is now the body of the field's
loop, exported, and every wave row calls it at the measured range on a
flat sea of the measured depth; a test draws the whole field — fast
marching included — on a flat lagoon and requires the two to agree
within 3 %.

What re-reading the chapter found beside Baker was settled later the
same day, in the next section: the explosion source's calibration cited
a table the 1977 edition does not have, and against the book's
deep-water relation the burst was five to nine times under even at its
own optimum depth. The figures in the table above are that source's.

### The burst's wave, as Glasstone & Dolan give it (14 September 2026)

`src/physics/events/explosion/underwaterBurst.ts`. The source that
passed Baker was a Ward & Asphaug cavity dug by 8 % of the yield and
scaled by a log-normal depth-of-burst curve, and all three numbers were
the project's own, two of them credited to Glasstone pages that do not
say them. It is replaced by what the book gives:

- **Deep water** (§6.119): the train's height from crest to trough is
  H ≈ 40 500·W^0.54 / R (feet, kilotons), to about 35 %, for water
  256–850·W^0.25 ft deep — the lower limit is the gas bubble's maximum
  diameter — and "for any depth of burst within the water".
- **Shallow water** (§6.121): d_w < 100·W^0.25 ft, "such as Bikini
  BAKER", H ≈ 150·d_w·W^0.25 / R.
- **The peak wave** (§6.119): T ≈ 14.1·W^0.144 s, and L ≈ 1 010·W^0.288 ft,
  which is exactly the deep-water length of a wave of that period.

The model propagates amplitudes, so A = H/2. Three things the book does
not give are said rather than invented: between 100 and 256·W^0.25 ft of
water the product H·R is carried geometrically from one relation to the
other; near the burst the amplitude is held inside the radius where the
relation's height would be steeper than the water can hold,
H = 0.142·L·tanh(2πh/L) (Miche 1944), or inside the gas bubble; and a
burst on or above the water, or in the seabed, is not within the water
and makes no wave, so the wave steps where the charge goes under — a
step the validation report declares.

**The period decides the speed, and so the shoaling.** A megatonne's
peak wave has a 38 s period and is 2.3 km long, so over four kilometres
of ocean it does not feel the bottom, and its energy travels at the
group velocity of linear theory, g·T/(4π) ≈ 30 m/s, where every other
wave in the pipeline travels at √(g·h) = 198 m/s. The arrival-time
solver takes the period and moves the fronts at that speed; the veil
reads its path length on the same speed and shoals by conserving energy
flux, A ∝ c_g^(−1/2) — which for a long wave is Green's law and for this
one is the "initial small decrease, then increase" of §6.120. The
relation is 1/R with the train's dispersion already in it, so the veil
takes exponent one and does not disperse it again, and the wave starts
from the water the burst was fired in rather than the 4 km default that
shoaled a lagoon burst threefold. Deep Dive no longer offers itself for
an explosion: its solver spreads the source over a 350 km Gaussian with
no dispersion, which for a wave a few hundred metres long is a different
event.

**Against Baker's own table**, with nothing fitted to Baker, the shallow
relation reads 0.68–0.71 of the tabulated heights out to 2 000 yards,
where the table's H·R is constant within 3 % — inside the book's 35 %,
and gated. From 2 700 yards the table's H·R rises 13–17 % because the
highest wave passes back into the train (§6.56), and the relation reads
about six tenths: those rows, the ninth wave at 22 000 ft (half) and the
Saratoga's crest (two thirds) are declared with their reasons. The
source this replaced read 0.75–0.84 — nearer, for reasons that were not
its own.

What it changes, on the same flat seas:

| burst                             | globe at 10 km, before → after | row at 100 km, before → after | speed, before → after |
| --------------------------------- | ------------------------------ | ----------------------------- | --------------------- |
| 1 Mt, 40 m down, 4 km of ocean    | 0.21 m → 7.8 m                 | 0.56 m → 0.78 m               | 198 → 30 m/s          |
| 1 Mt, 1 000 m down, 4 km of ocean | nothing → 7.8 m                | nothing → 0.78 m              | 198 → 30 m/s          |
| 20 kt, 11 m down, 300 m of shelf  | 0.16 m → 0.95 m                | 0.085 m → 0.095 m             | 198 → 17 m/s          |
| 100 kt, 30 m down, 91 m of water  | 1.3 m → 0.66 m                 | 0.16 m → 0.066 m              | 198 → 21 m/s          |
| Crossroads Baker, 61 m lagoon     | 0.39 m → 0.31 m                | 0.054 m → 0.031 m             | 198 → 17 m/s          |

A deep-water burst now makes the wave the book says it makes, where the
globe used to draw a few centimetres; a shallow one makes a smaller
wave, as §6.121 says it should.

**It reached the page the same evening.** Until then the panel took a
height of burst of zero or more and the input schema refused a negative
one, so no burst on the page was ever within the water. The next section
is what changed.

### A burst under the water (14 September 2026)

The panel now places a charge in the air or on the surface, or under
the water at a depth; the model keeps one signed height of burst, and
the schema refuses only a depth no sea has, 11 km. Where the charge is
decides what reaches whom (`BurstPlacement` in
`events/explosion/simulate.ts`):

- **Within the water** — over open water, no deeper than the sea — it
  makes Glasstone & Dolan's waves. The flash, the fires and the initial
  radiation are gone: "much of the thermal radiation and of the initial
  nuclear radiation will be absorbed within a short distance", and the
  BAKER fireball was visible for a few thousandths of a second (§2.64).
  The book says a shallow burst lets some escape without saying how
  much, so zero is the low end. The air blast reaches each overpressure
  at the surface burst's range times e^(−ρ·λ_d/126), λ_d the depth in
  ft·kt^(−1/3) and ρ = 1.025: the relation §6.81 gives for a buried
  burst, which §6.53 says an underwater burst follows "in a pattern
  similar". That leaves BAKER about three quarters of a surface burst's
  reach, and a megatonne at 40 m nine tenths.
- **Buried** — below the sea floor, under land, or on land beside the
  sea — it would be an underground burst, which the model does not
  have. It is drawn as a burst on the surface and makes no wave, and
  the panel says so rather than inventing an underground explosion.

A megatonne 40 m down in 800 m of sea now reads, on the page: the deep
relation, a source radius of 508 m, arrival at 100 km in 56 minutes at
30 m/s, no burns, and air blast at 0.90 of a surface burst's reach.

### The residual Boore et al. give (14 September 2026)

The toll bands, the earthquake Monte Carlo and the footprint check all
rest on one number: the scatter of ground motion about its median. It
was 0.50 in ln units, cited to Boore et al. 2014 together with a
between-event τ ≈ 0.397 and a within-event φ ≈ 0.308. Neither is in the
paper. Its coefficients for PGA give τ = 0.398 at M ≤ 4.5 falling to
0.348 at M ≥ 5.5, and φ = 0.695 falling to 0.495; in quadrature the
total above M 5.5 is **0.60**. Their φ also grows by up to 0.10 between
110 and 270 km and shrinks by up to 0.07 on ground softer than 300 m/s.
The model draws one number everywhere, and `uq/conventions.ts` says so.

| event (recorded)       | band at 0.50 | band at 0.60 | span            |
| ---------------------- | ------------ | ------------ | --------------- |
| Northridge 1994 (57)   | 5 – 180      | 4 – 238      | 10^1.6 → 10^1.8 |
| L'Aquila 2009 (309)    | 37 – 1 542   | 32 – 1 876   | 10^1.6 → 10^1.8 |
| Amatrice 2016 (299)    | 0 – 114      | 0 – 175      | 10^2.1 → 10^2.2 |
| Gorkha 2015 (8 964)    | 22 – 4 924   | 13 – 6 942   | 10^2.3 → 10^2.7 |
| Sumatra 2004 (227 898) | 0 – 43       | 0 – 87       | 10^1.6 → 10^1.9 |

No verdict changed: Northridge and L'Aquila still contain their record,
Amatrice and Gorkha still miss it, and the gated spans stay far inside
the gate. A wider band is not a better model. It is the band the source
gives, and the narrower one claimed a precision the ground does not
have. The PGA and intensity bands of the uncertainty panel widen the
same way.

The footprint check changes its reference. One sigma is now a factor
of 2.3 in radius and 5.4 in area, so the scatter the ground implies is
0.85 rather than 0.70, and the model's 0.71 falls under it. That is a
ceiling, not a match: a footprint is an area, over which the
within-event part of the scatter partly averages out, while the
between-event part moves the whole footprint at once — and that part
alone implies 0.49. The model scatters between the two, which is as
much as a median model can be asked for. The test's bound loses the
0.25 allowance it carried on top of the misquoted value: 0.95 before,
0.85 now.

### Held out, and run once (14 September 2026)

Until today every non-trivial pass in the calibration net was on an
event the model had been set on, and the held-out checks that passed
were records of nothing. The roadmap named, that morning, earthquakes
that would test the death toll out of sample; five of them are now in
the net.

**The protocol.** `validation/heldOutEvents.ts` was committed and
pushed (`cacee02`) before the model was run on any of the five, with
the rules it applies to every row: after 2007, so outside the years USGS
PAGER's fatality curves were fitted on (Japan's entry in PAGER's table
lists its fitting events, the last from July 2007); shallow crustal;
magnitude, depth and epicentre from the USGS ComCat preferred origin;
the fault type from the preferred moment tensor's nodal planes; the
record from the NCEI/WDS Global Significant Earthquake Database, with a
published direct count as the low end where one separates it from
later deaths; held out, ungated, and no re-tuning on the result. What
was written after the result — the causes of the misses and the
comparison of interpolated low ends below a hundred dead — says so.

| event                 | recorded        | model | band (5–95 %) | verdict |
| --------------------- | --------------- | ----- | ------------- | ------- |
| Christchurch 2011     | 185             | 1     | 0 – 15        | misses  |
| Kumamoto 2016         | 49 direct – 273 | 332   | 1 – 12 168    | inside  |
| Kaikōura 2016         | 2               | 0     | 0 – 0         | misses  |
| Pohang 2017           | 0               | 35    | 1 – 17 877    | misses  |
| Durrës (Albania) 2019 | 51              | 16    | 1 – 510       | inside  |

Two of five inside, and Kumamoto's pass is on a band four orders of
magnitude wide, which contains almost anything. Durrës is the first
held-out death toll that is not a zero to fall inside a band narrow
enough to have been wrong, and it is one row.

**What the misses share** is the fatality curve, not the shaking.
New Zealand has no PAGER curve of its own and borrows its region's
(θ = 37.8, β = 0.36): with all 265 529 people inside the model's MMI VII
ring around Christchurch shaken at MMI IX, it reads about nine deaths
against 185, so no error in the rings could close the gap. South Korea
borrows its region's too, one of the deadliest in the table (θ = 10.3,
β = 0.10), and at Pohang it kills one in fifteen hundred people inside
the MMI VII ring where the buildings killed nobody. At Kaikōura the
curve gives the few thousand people near the epicentre one twentieth
of a death against two recorded — below what any rate over a population
can resolve, which is the cause the row now names. And Japan's own curve
is steep enough (β = 0.10) that one sigma of ground motion spans Kumamoto's
four orders of magnitude.

The toll band draws the physics and holds the curve fixed, which was a
declared gap this morning and is now a measured one: of the ten misses in
the net, four are the fatality curve (Amatrice, Gorkha, Christchurch,
Pohang). Re-tuning a curve on these rows would spend them. What they
point to instead is a band that carries the curve's own uncertainty,
and then the next lists in the roadmap — volcanic tolls, a buoy, two
plumes — under the same rules.

One harness rule changed because of these rows, and it is not a model
change: the interpolation check compared Pohang's low end, 1 dead
measured against 3 interpolated, as if it were a statement about the
interpolation. The threshold below which the ratio measures the raster
rather than the interpolation, a hundred dead, now applies to each end
of a band on its own, as it already applied to the band.

### The curve's own scatter (14 September 2026)

The held-out misses above were the fatality curve, and the band held
the curve fixed. A fitted curve says what an earthquake of a given
intensity kills on average in a country; one earthquake kills more or
fewer, and USGS PAGER publishes by how much. Each country in its
`fatality.xml` carries a `gnormvalue`, and PAGER's loss module uses it
as the standard deviation of the natural log of the deaths, centred on
the expected toll, to state the probability of each range of deaths
(`calcEmpiricalProbFromRange` in `losspager/utils/probs.py`). The
table's G runs from 1.0 (New Zealand, the United States) through 1.46
(Japan) and 1.96 (Italy) to 2.5 (Nepal, Iran); its median is 1.73.
Regenerating the table to read it changed no θ, β or fit status.

Every shaking realisation now scales its mortality by one draw of
exp(N(0, G)), from a random stream of its own so that the physics of
every realisation is the draw it was. Nothing was re-tuned.

| event                 | recorded | band, physics | band, with G | verdict now     |
| --------------------- | -------- | ------------- | ------------ | --------------- |
| Northridge 1994       | 57       | 4 – 238       | 1 – 499      | inside (gated)  |
| L'Aquila 2009         | 309      | 32 – 1 876    | 4 – 9 480    | inside (gated)  |
| Amatrice 2016         | 299      | 0 – 175       | 0 – 490      | inside, was out |
| Gorkha 2015           | 8 964    | 13 – 6 942    | 2 – 72 166   | inside, was out |
| Christchurch 2011     | 185      | 0 – 15        | 0 – 34       | misses          |
| Kumamoto 2016         | 49 – 273 | 1 – 12 168    | 1 – 62 577   | inside          |
| Kaikōura 2016         | 2        | 0 – 0         | 0 – 1        | misses          |
| Pohang 2017           | 0        | 1 – 17 877    | 1 – 29 628   | misses          |
| Durrës (Albania) 2019 | 51       | 1 – 510       | 1 – 1 425    | inside          |

Two rows move inside, and neither is a success. Gorkha's band spans
almost five orders of magnitude and contains the record the way the
table's best-and-worst pair used to; Amatrice's central estimate is
still a fiftieth of the record. What the band says now is the width
PAGER's own numbers give a single earthquake, and where the curve is
steep or its scatter large that width is enormous. Christchurch still
misses — New Zealand's G is the smallest in the table — and so does
Pohang, whose band cannot reach zero. L'Aquila's gated span is 10^3.4
against a gate of 10^3.5.

Two caveats are stated rather than solved. G was measured on ShakeMap
intensities, which carry part of the ground-motion error the band
already draws, so the two overlap by an amount not separated here and
the band may be somewhat wide. And the population is still fixed.

The interpolation check is measured on the physics alone: the curve's
draw multiplies a realisation's exact and interpolated toll by the same
factor, so it says nothing about the population curve, and drawn it
would lift Sumatra's shaking-only row over the comparable threshold
without the population having changed. That row shows what the check
cannot catch: where people cluster between two measured rings — along
Sumatra's coast, between rings measured at sixty and a hundred and
fifteen kilometres — the interpolated high end runs about two and a
half times the exact one, on counts small enough to stay under the
threshold.

### The second held-out group (14 September 2026)

The rest of the roadmap's list went in under the same protocol: rules
fixed and pushed (`f49cc41`) before the model was run, no gate, no
re-tuning, and the cause of a miss written afterwards and marked so.
Rules 7 to 10 of `validation/heldOutEvents.ts` say what was taken from
where.

**A buoy.** Illapel 2015 (Mww 8.3, the interface plane of the USGS
moment tensor, 353/19) at DART 32402, 582 km away over 4 070 m of water.
Heidarzadeh et al. 2016 read a zero-to-crest maximum of 10.9 cm and Tang
et al. 2016 11 cm on the first crest; the row accepts a factor of two
either way, fixed before the run. The model reads 10.6 cm, 0.97×. The
wave law's megathrust coupling was set on Tōhoku at DART 21413; this is
an earthquake some fifteen times smaller in moment, at under half the
distance, on a buoy nothing was set on. One buoy near its source is not a
basin, but it is the first held-out number that is not zero to land on
its record with a band that could have missed it.

**Three eruption columns.** Every IVESPA phase of Grímsvötn 2011 and
Calbuco 2015 (Aubry et al. 2021, which exists to pair independently
estimated eruption rates with heights): the rate is the erupted mass over
the phase's duration, the height IVESPA's plume top less the vent. Mastin
et al.'s relation reads 0.95×, 0.95× and 0.82×, all inside. These are
not blind — the relation is one line and was computed on these numbers
while the sources were being read — and taking every phase by database
ID is what keeps them a check rather than a choice.

**Two volcanic tolls.** Fuego 2018 and Unzen 1991, with the vent where
the Global Volcanism Program puts it, the bulk volume of the event's
deposits, no evacuation radius, and the official counts:

| eruption   | recorded  | model | band     | the model's current | the real one                 |
| ---------- | --------- | ----- | -------- | ------------------- | ---------------------------- |
| Fuego 2018 | 201 – 445 | 187   | 14 – 304 | a 3.7 km disc       | 11.7 km down one ravine      |
| Unzen 1991 | 40 – 43   | 10    | 8 – 14   | a 0.84 km disc      | 3.2 km, its surge about 4 km |

Fuego's row is inside and should not be read as a pass. The disc,
L = 10 · V^⅓ with a mobility of the project's, holds 207 people round
the summit; a disc as long as the current that killed would hold about
110 000. A reach three times short and a footprint far too wide land near
the record by cancelling. Unzen's row misses on both counts at once: a
reach four times short, and dead who were journalists, firefighters and
police in a valley its residents had been advised to leave, whom no map
of residents can hold.

What the group says, taken together: the wave law and the column
relation hold on their first held-out events, and the pyroclastic model
does not — it needs a mobility taken from a source and a footprint that
follows the ground. The lahar of Nevado del Ruiz is not here because the
net has no runout quantity. And the list itself was the weak part of the
protocol: IVESPA alone holds 37 eruptions since 2009, so the next set can
be chosen by a rule rather than by hand.

### The scorecard (14 September 2026)

"Gold standard" here means a model other people can cite because its
numbers are accurate and precise, and both words can be measured.
`validation/scorecard.ts` measures them on every row of the calibration
net, scores the held-out rows apart from the fitted ones, and splits each
event family by size — magnitude, energy, volume — because someone who
builds a scenario of their own asks how good the model is near their
inputs, not on average. The report prints the whole table at every
commit; the validation page shows the held-out half.

- **Bias:** the geometric mean of model over record, over the rows where
  both are above zero; 1.00× is unbiased.
- **Scatter:** the standard deviation of ln(model / record) over the same
  rows. Both need two such rows and mean little below five.
- **Zeros**, which a ratio cannot hold, are counted apart: both zero, a
  record of nothing where the model says something, a record the model
  sends to zero.
- **Inside:** for a death toll, the claim of the 5–95 % band, which
  should hold about nine records in ten while being as narrow as it can
  — calibration subject to sharpness, as Gneiting, Balabdaoui & Raftery
  (2007) put it for probabilistic forecasts. For waves and eruption
  columns the rows carry no predictive band, and inside is an acceptance.
- **Band:** the median width of the death toll's band, in orders of
  magnitude.

The first reading, held out only:

| quantity, family         | held out (scored) | bias  | scatter σ_ln | inside                  | band   |
| ------------------------ | ----------------- | ----- | ------------ | ----------------------- | ------ |
| death tolls, earthquakes | 8 (4)             | 0.11× | 2.01         | 4 of 8, against 9 in 10 | 10^2.3 |
| death tolls, volcanoes   | 3 (3)             | 0.21× | 0.62         | 1 of 3                  | 10^1.0 |
| waves, earthquakes       | 1 (1)             | —     | —            | 1 of 1 accepted         | —      |
| eruption columns         | 3 (3)             | 0.91× | 0.07         | 3 of 3 accepted         | —      |

Read plainly: the column relation is accurate and precise on what it has
not seen; the death tolls are biased low by about an order of magnitude
with a scatter of a factor of seven either way, and their band holds half
the records where it promises nine in ten, while already being two orders
of magnitude wide. Every cell is scored on too few rows, and the table
says so. That is the programme in one line: more held-out rows, chosen
by rule, and a casualty model whose band can be both honest and narrow.

### Held out by rule (14 September 2026)

Eight held-out earthquakes cannot say whether a band holds nine records
in ten, and a list is only as fair as whoever wrote it. So the next
held-out sets were chosen by rules, written down and pushed
(`validation/heldOutByRule.ts`, rules 11 to 16, commit `3726ade`) before
the model was run on any of their rows:

- every earthquake in NOAA NCEI's significant-earthquake database from
  2008 to 2025 with magnitude 6 or more and focal depth 40 km or less:
  409 records, 408 matched to their USGS ComCat origin and moment tensor
  and run exactly as the first held-out rows were, against the deaths
  the database gives the earthquake itself;
- every IVESPA eruption phase from 2009 on, 37 of 134, after the
  eruptions Mastin et al. 2009 fitted their relation on.

`scripts/held-out-by-rule.py` reads the sources and writes the rows, and
the validation report scores them at every commit. The first run, with
the harness as rule 16 describes it — which was wrong for the largest
earthquakes, corrected below — earthquakes held out (L'Aquila 2009 and
Amatrice 2016 are tuned, and scored apart):

| magnitude  | rows | with something | scored | bias  | scatter σ_ln | inside, with something | band   |
| ---------- | ---- | -------------- | ------ | ----- | ------------ | ---------------------- | ------ |
| all        | 406  | 276            | 138    | 1.17× | 2.23         | 249 of 276 (90 %)      | 10^2.6 |
| Mw < 6.5   | 152  | 134            | 69     | 1.69× | 2.14         | 123 of 134 (92 %)      | 10^2.8 |
| Mw 6.5–7.5 | 196  | 113            | 54     | 0.98× | 2.20         | 106 of 113 (94 %)      | 10^2.6 |
| Mw ≥ 7.5   | 58   | 29             | 15     | 0.41× | 2.34         | 20 of 29 (69 %)        | 10^2.7 |

"With something" leaves out the 130 rows where both the record and the
band are zero, which are inside by construction; counted with them, the
band holds 379 of 406. Without the six events run in the net before the
rule, the bias is 1.26× and the band holds 246 of 270. The eruption
columns: 0.95× with a scatter of 0.44, 35 of 37 accepted — strong
plumes 1.03× (σ 0.16, six phases), weak ones 0.98× (0.53, eleven), those
IVESPA gives no morphology 0.91× (0.44, twenty); without the three phases
seen before, 0.95× and 32 of 34.

Read plainly, it corrects the scorecard's first reading. Over four
hundred earthquakes nobody picked, the death toll's band keeps its
promise — nine records in ten where it claims nine — and the central
figure is within a factor of 1.2 of the records on average. The 0.11×
of eight rows named by hand was the sample, famous disasters among
them, and not the model. What the rule confirms is the other half: a
single event strays by a factor of nine either way (σ_ln 2.23), and the
band keeps its promise by being two and a half orders of magnitude wide.
The model is calibrated and it is not sharp. Nor is it calibrated
everywhere: above Mw 7.5 it reads 0.41× and holds 20 records of 29.

What the 27 earthquake rows outside their band have in common, written
after the result, as rule 16 requires:

- **Thirteen are a handful of deaths the model makes nothing of:** one
  to ten dead against a band of zero, or zero to one — Sumatra's Mw 8.6
  of 2012 with ten, Iquique 2014 with seven, and moderate events killing
  one or two. A rate over a population cannot resolve them.
- **Four are great ruptures read as circles about the epicentre.** The
  rules give no rupture extent, and the offline harness counts people in
  circles: Tōhoku's shaking, 1 474 dead against a band of 0 to 1 about
  an epicentre at sea; Wenchuan 2008, 87 652 against 2 to 79 838;
  Kahramanmaraş 2023, 56 697 against 9 to 44 812; Palu 2018, 4 340 dead
  and 667 missing against 1 to 3 752. This is the Mw ≥ 7.5 cell.
- **Two are doublets whose dead the database gives to one record.** The
  Mw 7.5 nine hours after Kahramanmaraş reads 382 against none, and the
  second Mw 6.4 at Ziarat in 2008, twelve hours after the first, 323
  against none, while the first holds the 215. The model's figure for
  each shock stands on its own; the record's does not.
- **Five read high where nobody, or two, died:** Baja California 2010,
  Michoacán 2013, Tecpan 2014, Ilam 2014 and Assam 2021 — the direction
  of Pohang's miss in the net, with its cause not established here.
- **Three are missed by the band's upper end:** Christchurch 2011, 185
  against 0 to 29; Myanmar 2011, near Tachileik, 104 against 0 to 83;
  Nura 2008 in Kyrgyzstan, 74 against 0 to 6.

Two columns are outside: Merapi on 4 November 2010, 14.0 km above the
vent against 5.5, and Cotopaxi's first phase in 2015, 6.5 against 2.1.
Both are long phases, 36 and 14 hours, and the rate is their mass
averaged over that time, while the height is the highest the column
reached.

NCEI admits an earthquake for its damage, ten deaths, magnitude 7.5,
intensity X or a tsunami, so the set leans towards the damaging and the
40 false alarms it counts are a floor. What it points at next: a casualty
band that is sharp as well as calibrated, the extent of great ruptures in
the offline harness, and a set of quiet earthquakes to count false alarms
on.

#### Corrected the same day: the stadium, not the circle

The second of those was not a limit of the model but an error of the
harness, and it hid the model's largest error. From Mw 7.5 — in the
model, or in any of a band's realisations — the simulator counts the
people inside the rupture stadium it draws; the harness counted a circle
of the same contour radius about the epicentre (docs/BUG_REGISTRY.md,
B-022). An offshore megathrust's circle sits at sea, its stadium runs
along the coast. The harness now counts the stadium, with a counter held
to the browser's own polygon sum by a test. The model was not touched,
and because rule 16 described the harness as it was, the correction is
made after the result and said so. Counted as the simulator counts:

| magnitude  | rows | with something | scored | bias   | scatter σ_ln | inside, with something | band   |
| ---------- | ---- | -------------- | ------ | ------ | ------------ | ---------------------- | ------ |
| all        | 406  | 283            | 142    | 1.82×  | 2.32         | 260 of 283 (92 %)      | 10^2.8 |
| Mw < 6.5   | 152  | 134            | 69     | 1.69×  | 2.14         | 123 of 134 (92 %)      | 10^2.8 |
| Mw 6.5–7.5 | 196  | 115            | 54     | 0.98×  | 2.20         | 108 of 115 (94 %)      | 10^2.6 |
| Mw ≥ 7.5   | 58   | 34             | 19     | 13.85× | 2.16         | 29 of 34 (85 %)        | 10^2.9 |

Above Mw 7.5 the simulator's toll is fourteen times the record on
average, not four tenths of it, and the band still holds 29 records of 34
only because it spans three orders of magnitude. It is the error move 4
of the roadmap describes from the shaking side — Joyner & Boore's rings
for a point, stretched into a stadium, painting three times the area of
intensity VIII USGS measured at Tōhoku — now measured on the toll.
Tōhoku's shaking alone reads 177 033 dead, where NCEI gives the
earthquake's own effects 1 474; Wenchuan 2008 reads 316 273 against
87 652, Ecuador 2016 18 880 against 663. Below Mw 7.5 nothing moved but
the few realisations that cross it. So: calibrated everywhere, sharp
nowhere, and above Mw 7.5 not accurate either — the first thing to fix
in the model.

Of the 23 rows now outside, eleven are a handful of deaths the band puts
at none, three are missed by the band's upper end (Christchurch 2011,
Myanmar 2011, Nura 2008), and nine read high where nobody or almost
nobody died — among them Illapel 2015 and Nicoya 2012, both great
ruptures, and the second shocks at Kahramanmaraş (none recorded, a band
of 3 to 219 400) and at Ziarat. The great ruptures that killed most no
longer miss below their record; they sit inside it on bands too wide to
say much.

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

The flash stops at the horizon. A fluence radius answers "how much
heat would arrive with nothing in the way", and for an impact-scale
fireball it runs right around the planet: the 15 km stone that makes
a 165 km crater has a third-degree radius of 27 000 km on a globe
whose half-circumference is 20 015. Thermal radiation travels in
straight lines, so the burns and the mass fire are cut at the range
where the fireball sets below the curve of the Earth,
d = R⊕ · arccos(R⊕ / (R⊕ + R_f)) — the same cut the Earth Impact
Effects Program makes (Collins et al. 2005). The fireball radius is
0.002 · E^(1/3) for an impact (Collins eq. 12) and 55 · W^0.4 metres
for a nuclear burst (Glasstone & Dolan §2.120): a 200 km fireball is
seen to 1 590 km, Hiroshima's to 46 km and a 50 Mt burst's to 230 km,
so the cut bites only at impact scale and no nuclear scenario moves.
Dropping a Chicxulub-class body on Rome went from 4.2 billion dead to
1.0 billion, and the 3.2 billion that left were people on the far
side of the planet dying of a flash they could not see.

Heat does reach them, and the cascade says so at +30 minutes: rock
thrown out on ballistic arcs re-enters everywhere at once and the
upper atmosphere passes 1 500 K (Toon et al. 1997; Goldin & Melosh
2009). That is a diffuse infrared bath over minutes, not a flash, and
survival under it turns on shelter rather than on line of sight — a
different hazard needing a different vulnerability function. This
model does not convert it into deaths, and Goldin & Melosh are the
reason for the restraint: they argue the ejecta shield their own
radiation enough to make the global firestorm a fizzle rather than a
certainty. Counting it with the fireball's mortality would be a
number with the wrong physics behind it.

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

### The first layer, on its own (Phase 38)

A death toll is the product of five models — intensity, exposure,
vulnerability, geometry, warning — and when it is wrong it does not
say which. Finding out which took most of 9 September, by hand, one
instrumented run at a time. So the first thing M9 asks for is an
anchor on each layer separately, and the intensity field has the best
one there is: the USGS ShakeMap, published for every event since 2000
and for the significant ones before, machine-readable and without a
key.

`pnpm shakemap:build` fetches the MMI coverage grid of six anchored
earthquakes and stores the **ground area above each threshold**. Area
and not a contour, because the model draws a circle for a small
rupture and a stadium around a long one where the earth draws whatever
the geology says; what the two can honestly be compared on is how much
ground shook that hard.

The first run:

| event           | MMI ≥ VII | MMI ≥ VIII | MMI ≥ IX   |
| --------------- | --------- | ---------- | ---------- |
| Northridge 1994 | 0.32×     | 0.21×      | —          |
| L'Aquila 2009   | **8.9×**  | _invented_ | —          |
| Amatrice 2016   | **18.2×** | _invented_ | —          |
| Gorkha 2015     | 0.42×     | 2.77×      | _invented_ |
| Tōhoku 2011     | 1.30×     | 3.12×      | _invented_ |
| Kokoxili 2001   | 0.36×     | 0.48×      | 3.97×      |

"Invented" means the model shakes ground at an intensity the event
never reached anywhere. **Tōhoku's model paints 180 747 km² of Japan
at MMI IX; the 2011 ShakeMap's maximum was 8.18.** That band is where
the model's 200 000 dead come from, against a record of 18 500 — the
headline error of Phase 37, now located rather than suspected.

And the footprint is not uniformly wrong, which is the part that only
a per-layer anchor could have said. It is too generous for a
megathrust and far too generous for a small crustal event — Amatrice
eighteen times over in area — and too mean for Northridge and
Kokoxili. That is the signature of one point-source attenuation curve
inflated into a rupture stadium: it cannot be right at both ends of
the magnitude range at once.

It also explains a thing that looked like luck. Amatrice's toll came
out 0.02× of its record while its footprint is 18× too wide: two
errors pulling opposite ways, and neither visible while only the toll
was checked.

The residuals are pinned rather than tolerated — the ratios above are
in the test, to a tenth, so any change to the intensity field shows up
here in either direction instead of hiding inside a toll. A
laboratory-level model has nothing in the invented list. Today it has
four, and that count is pinned too.

### A gate that could not fail (Phase 42)

Every gated row in the toll net passed. Northridge passed on a band of
13 to 139 037 dead. That span came from no uncertainty at all: the low
and high ends were the gentlest and harshest vulnerability curves in
the PAGER table, picked, and a row containing the record between them
proved nothing. Three of the five gated rows passed that way, and it
is why finding today's errors took a day of measuring by hand instead
of a red suite.

The band is now the fifth to ninety-fifth percentile of the toll under
the **published** input scatter, sampled two hundred times per event
from `uq/conventions.ts`: the magnitude an agency reports (σ = 0.15
Mw), the depth a catalogue gives (20 %), the ground underneath (30 %
on Vs30), and — dominating all three — the ground-motion aleatory
residual, σ_lnY ≈ 0.50 about the median (misquoted: Boore et al. give
0.60, drawn since 14 September — "The residual Boore et al. give" has
the bands it makes). The population is held fixed,
because what is being sampled is the physics and not the census. It is
seeded per event, so a band never moves unless something else moved
first.

|                 | old band     | new band    | span                |
| --------------- | ------------ | ----------- | ------------------- |
| Northridge 1994 | 13 – 139 037 | **3 – 180** | 10^4.0 → **10^1.8** |
| Gorkha 2015     | 1 – 13 428   | 22 – 4 924  | 10^4.1 → 10^2.3     |
| L'Aquila 2009   | 1 – 6 380    | 0 – 1 538   | 10^3.8 → 10^3.2     |
| Sumatra 2004    | 0 – 1 526    | 0 – 43      | 10^3.2 → 10^1.6     |

Northridge's claim went from four orders of magnitude to under two,
**and it still contains the record**. That is a gate.

**And two rows stopped passing.** Amatrice 2016 records 299 dead
against a predictive interval of 0 to 111; Gorkha 2015 records 8 964
against 22 to 4 924. Neither model changed — the band did. They had
been inside a span five orders wide the way a fish is inside a net
with metre-wide holes, and they are now measured misses with the cause
already filed: a national fatality curve, fitted mostly on larger and
broader events, under-predicts what happens in medieval masonry
villages and in the brick of the Kathmandu valley.

Both are declared rather than gated, and a new gate keeps the
absolution from coming back: a gated row whose band spans more than
three and a half orders of magnitude has stopped making a claim,
whatever it contains.

### The ground the rings stand on (Phase 41)

`vs30` was an input a scenario could set. It reached the reported
accelerations. It never reached the rings: the MMI contours go through
Joyner–Boore 1981, which takes a magnitude and nothing else. Measured,
a Northridge run at Vs30 760, 500, 400, 300 and 250 gave the same
17.0 km MMI VII ring every time, where soft ground is worth a factor
of two in radius. An input accepted and dropped.

A contour is now the range at which the **site-amplified** median
reaches the threshold, using the published BSSA14 site term from the
previous phase:

| Vs30       | MMI VII ring | area    |
| ---------- | ------------ | ------- |
| 760 (rock) | 17.0 km      | 913 km² |
| 500        | 20.6 km      | 1 329   |
| 400        | 21.6 km      | 1 467   |
| 300        | 21.7 km      | 1 477   |
| 250        | **21.0 km**  | 1 389   |

The turn at the bottom is the non-linear half doing its work: soil
that is already shaking hard stops behaving elastically, so the very
softest ground amplifies _less_. A power law could not have said that,
and the previous surrogate did not.

The assumption is stated in the code because it is one: the 1981
median is taken to stand for the reference-rock site the site term is
written against, and it is not exactly that — JB81 was fitted across a
mix of sites with no site term of its own. At Vs30 = 760 the factor is
one by construction, so every preset in the calibration net is
untouched and all 1 590 tests stay green.

**And the obvious alternative was tried, measured and rejected.**
Drawing the contours with NGA-West2 outright is one law instead of
two, honours the ground natively, and empties the invented-band list
entirely. It also takes Northridge's toll from 38 dead against 57 to
13, L'Aquila's from 227 against 309 to 40, Gorkha's from 580 to 62,
and pushes Amatrice out of its gate. The footprint bias goes from
1.18 to 0.69 and the scatter from σ_ln 0.71 to 0.86 — still not
distinguishable from unbiased at n = 11, but worse on every point
estimate. It wins on one criterion and loses on the others, so it is
not in the code and the numbers are in the roadmap.

### A median against one realisation (Phase 40)

A correction to the previous two sections, and to what was said in
conversation off the back of them.

The footprint anchor read Amatrice's MMI VII area at eighteen times
the ShakeMap's and Northridge's at a third of it, and that was called
"wrong at both ends" — the signature of one attenuation curve that
cannot fit the whole magnitude range. It is not, or at least the
evidence does not say so.

**The model predicts the median ground motion; a ShakeMap records one
realisation of it.** The published aleatory scatter of PGA is
σ_lnY ≈ 0.5, the module's own documentation says so, and PGA falls as
about R^(−0.71) at these ranges — so one sigma of ground motion is a
factor of two in radius and four in area before anything is wrong at
all. (The documentation had it wrong: Boore et al. give 0.60, which
makes the factors 2.3 and 5.4 and the reference below 0.85 — see "The
residual Boore et al. give".) Comparing a median to a single draw event by event and calling
the difference a defect is a category error, and it was mine.

What a median model can honestly be held to is being centred, and
scattering no more than the ground does. Measured across all eleven
bands that exist:

|                                                   | model    |
| ------------------------------------------------- | -------- |
| geometric mean radius ratio                       | **1.18** |
| σ_ln of the ratio                                 | **0.71** |
| σ_ln implied by the published ground-motion sigma | 0.70     |

Eighteen per cent high on average, and scattering exactly as much as
ground motion scatters. That is a model behaving like a median, and it
is now the assertion the suite makes, with the per-event numbers kept
as pins beside it rather than as verdicts.

**What survives as a defect.** A band that did not happen. Tōhoku's
180 747 km² at MMI IX, on an event whose recorded maximum anywhere was
8.18, is not a high draw of anything — no amount of aleatory scatter
puts an intensity on the map that the earthquake never produced. The
same for Gorkha at MMI IX and the two Italian events at MMI VIII.
Those four are the list, and the list is pinned.

**And one plain bug found on the way.** `vs30` is an input a scenario
can set, it reaches the reported accelerations, and the intensity
contours ignore it completely — they run through the Joyner–Boore
path, which takes a magnitude and nothing else. A simulation on soft
soil draws the same rings as one on rock. That is not a modelling
choice, it is an input being accepted and dropped, and it is filed.

### The site term, as published (Phase 39)

The roadmap said the NGA-West2 site term had to be the real one before
swapping the intensity contours onto that law could mean anything.
The code had said so itself for longer: _"this is a Nimbus-chosen
power-law SURROGATE `(vs30/760)^(−0.4)`, NOT the published BSSA14 site
term"_.

The published one is a pair. The linear half is a slope in ln(Vs30),
clamped above 1 500 m/s. The non-linear half is the physics a power
law cannot carry:

    F_lin = c · ln(min(Vs30, Vc) / V_ref)
    F_nl  = f₁ + f₂ · ln((PGA_r + f₃) / f₃)
    f₂    = f₄ · [exp(f₅·(min(Vs30, 760) − 360)) − exp(f₅·400)]

with PGA_r the acceleration the same event would produce on reference
rock. Soft ground amplifies a gentle wave and **saturates under a
violent one**, because the soil stops behaving elastically. At
Vs30 = 300 the published term gives 1.71× under weak shaking and 1.18×
at half a g, where the surrogate gave a flat 1.45× whatever the ground
was doing.

The coefficients are the model's own — c = −0.6, Vc = 1500,
V_ref = 760, f₁ = 0, f₃ = 0.1, f₄ = −0.15, f₅ = −0.00701 — read from
the PGA row of the published table rather than recalled, and the event
and path coefficients already in this module turned out to match that
same row exactly. The path function also gained its R_ref term, worth
0.8 % and free.

**It changes nothing today, and that is the point.** Every preset
leaves Vs30 at the rock reference, where the term is zero by
construction; what it changes is a custom scenario that names its
ground, and the precondition for looking at the contours again.

### Two ways to measure the same shaking (Phase 38b)

Building the footprint anchor turned up something worth its own note:
this repository already had a ShakeMap test. `shakemap.test.ts` pins
the MMI VII _ring radius_ against macroseismic surveys — Northridge at
25 km from Wald 1999, L'Aquila at 15 km from Galli & Camassi's INGV
survey — and it has been passing.

The new anchor reads the instrumental coverage grid instead, and for
Northridge the two agree: 30 km equivalent against 25. For L'Aquila
they do not. The grid gives 4.4 km equivalent where the survey gives
15 — a factor of 3.4 on the same earthquake.

That is not a bug in either. A macroseismic survey asks people what
happened to their buildings; an instrumental grid converts recorded
ground motion through a GMICE, and the intensity module already warns
that the Worden 2012 relation is California-calibrated and
mis-predicts European intensity, which is why `mmiFromPgaEuropean`
exists beside it. The two are measuring different things, and in Italy
they diverge threefold.

It matters because the toll follows what the buildings experienced,
not what the accelerometers recorded — so a change to the contours has
to say which of the two it is aiming at. The obvious modernisation,
drawing the contours with NGA-West2 instead of Joyner–Boore 1981,
turns out to under-predict _both_: Northridge's ring goes to 9.9 km
against 25 and 30. It was tried, measured and reverted, and the reason
is in the roadmap rather than in a commit nobody will find.

### Which country's buildings (Phase 37)

The shaking model had no country. It ran ν(S) = Φ(ln(S/θ)/β) with one
pair for the whole planet — θ = 13.5, β = 0.22, chosen to look like
the published spread — and read **Northridge 1994 at 12 546 dead
against 57**. That was the largest error left anywhere in the
simulator, and it drove the number a visitor reads first for every
earthquake.

Jaiswal & Wald (2010) fit that curve per country, by hindcasting the
deaths of every fatal earthquake since 1973. The paper's table is
behind a paywall; the fitted parameters are not, because the PAGER
implementation is USGS work in the public domain and ships them as
data. `pnpm pager:build` reads them from `losspager/data/fatality.xml`
and writes `src/physics/pagerCountries.ts`: **252 countries**, of which
28 have enough fatal earthquakes for a fit of their own and 224 borrow
their region's, which the table records.

The spread is the point. At MMI VII–VIII the United States (θ = 46.2)
loses about fourteen people per million exposed; Iran (θ = 9.3) loses
one and a half per cent. A thousandfold, from the same shaking,
because of what the buildings are made of.

**The 220× was two errors multiplied.** Having no country costs a
factor of forty in the United States. And the pair standing in for the
world was not the world's median: θ = 13.5 is six times deadlier at
MMI VII–VIII than the median of the 252 fitted countries, which is
θ = 14.57. Forty times six is two hundred and forty, and Northridge
read 220.

**Which country a point is in.** This project ships no country
polygons; it ships four thousand populated places for the globe's
labels, and Natural Earth gives each an ISO code that the index was
throwing away. It now keeps it, and the nearest coded place answers
the question. That is a guess — near a border, well offshore, or in
the empty middle of a continent it can pick the wrong side — so the
uncertainty band stays the whole table's range, the best-engineered
stock (θ = 46.2) to the worst (θ = 8.3), rather than narrowing to the
country's own fit. A band that narrowed would be claiming to know
which country the shaking is standing in, and we are guessing.

**What it did.**

| calibration net | before        | after           | recorded |
| --------------- | ------------- | --------------- | -------- |
| Northridge 1994 | 12 546 (220×) | **38 (0.67×)**  | 57       |
| L'Aquila 2009   | 683 (2.21×)   | **227 (0.73×)** | 309      |
| Amatrice 2016   | 24 (0.08×)    | 6 (0.02×)       | 299      |
| Gorkha 2015     | 2 427 (0.27×) | 580 (0.06×)     | 8 964    |

And live, where a visitor sees it: Northridge went from about 12 500
dead to **40** against 57, L'Aquila to 130 against 309, and Tōhoku's
headline from 980 000 to 200 000 against 18 500.

Two of the four moved the wrong way, and honestly: Italy's national
curve and Nepal's regional one are both gentler than the pair they
replaced, so two rows that were already under went further under.
Both are small dense historic settlements — Amatrice's medieval
masonry, Gorkha's Kathmandu valley brick — where a national fit made
mostly on larger, broader events under-predicts. That is a real
limitation of a country-level model and it is not fixed by pretending
the old number was better.

**What is still wrong.** Tōhoku's headline is 200 000 where about
1 800 died of the shaking and the rest drowned. Japan's curve is right
(θ = 11.9, fitted on 5 502 of its own dead); what is too big is the
MMI IX footprint, which would need twelve million people inside it to
produce that number. The vulnerability is now the table's; the
intensity field is the next thing to look at.

### The local grid follows the fault (Phase 36)

The fine terrain grid was a square around the pick — one zoom-8 tile,
or nine when the tile held too little land. For a crater that is the
right shape. For a thirteen-hundred-kilometre rupture it resolved
74 km of the coast that drowned in 2004 and left the other nine
hundred to the planetary mosaic at thirty kilometres a sample.

It is now a strip of tiles along the fault, bounded two ways. At most
forty tiles, trimmed from both ends so the fault stays centred — about
four megabytes at ninety to a hundred and twenty kilobytes apiece, and
only for the events that need it. And a **fixed sample budget**: the
block spends the same 512 × 512 samples whatever its shape, so a long
thin block gets more rows than columns and the fast-marching pass that
runs on it costs what it always did. Sumatra's block comes out five
tiles by seven — 780 by 1 090 km at 1.8 km a sample, against 470 km at
0.9 before. Four times the area, the same wall clock: 63 seconds
end to end, measured, unchanged.

| coastal toll  | before | after     | recorded  |
| ------------- | ------ | --------- | --------- |
| Sumatra 2004  | 1 600  | **2 600** | ≈ 227 000 |
| Tōhoku 2011   | 22 000 | 24 000    | ≈ 16 700  |
| Krakatau 1883 | 26 000 | 26 000    | ≈ 36 400  |

A modest gain, and worth saying so plainly: quadrupling the fine
coverage bought Sumatra a factor of 1.6, not the order of magnitude
the coverage argument implied. Tōhoku drifts from 1.32× of its record
to 1.44×.

**What that leaves.** Sumatra is 87× under, and it is no longer
explained by any of the things that have been fixed for it today. Its
wave is right: Banda Aceh reads 4.92 m of amplitude and 19.7 m of
run-up against a record of fifteen to thirty. Its warning is right:
the 2004 Indian Ocean had none and the model now knows it. Its beam,
its distance and its spreading radius are all measured from the fault.
Its coast is four times better covered. And Tōhoku, with the same
physics end to end, sits at 1.44×.

So whatever is left is specific to that event rather than general to
the model, and the one measurement pointing anywhere is the density at
the cells themselves: Aceh's coastal cells read 18 to 830 people per
km² where the raster holds 1 647 for Banda Aceh and Sendai's cells
read 4 738. A city ten kilometres across on a 4.6 km raster is two or
three cells, and which of them a coastal point finds is close to
chance. That is where the next look goes, and it starts from a
measurement rather than from a story.

### A rupture starts its wave along its whole length (Phase 35)

The bearing came from the fault two phases ago and the distance did
not: the arrival field was still seeded at one point, so travel time —
and through it the amplitude — was measured from the epicentre.

Banda Aceh is the case. It sits 250 km up the 2004 rupture, on top of
the part of the fault that lifted it, and the model gave it the
amplitude of a coast 250 km from a source: **1.43 m**, against a 2004
run-up of fifteen to thirty metres. The seeds now run along the fault
every fifty kilometres, and the field's distance to a cell is the
distance to the nearest part of the rupture. Aceh reads **4.92 m**,
saturated at the source amplitude as a coast on top of a megathrust
should be, and its run-up 19.7 m against that record.

| coastal toll  | before | after      | recorded  |
| ------------- | ------ | ---------- | --------- |
| Tōhoku 2011   | 9 400  | **22 000** | ≈ 16 700  |
| Krakatau 1883 | 24 000 | 26 000     | ≈ 36 400  |
| Sumatra 2004  | 320    | 1 600      | ≈ 227 000 |

Tōhoku goes from 0.56× of its record to 1.32×, halving the residual
again, and this time from the right geography rather than in spite of
it. Sumatra improves fivefold and is still 140× under.

**Where Sumatra's shortfall is now.** Not the wave: Aceh's amplitude
and run-up are both right. The exposure. The local grid resolves
74 km of the Aceh coast at one kilometre a cell, and the coastline
that drowned runs the better part of a thousand. Everything beyond one
tile block of the click falls back to the planetary mosaic at thirty
kilometres a sample. It is the extent of the fine coverage, and it is
the last thing standing between that row and its record.

**One thing that did not work, recorded because it was measured.** The
density lookup grew its search ring by ring to the nearest land
instead of averaging over the whole radius, on the theory that a
forty-kilometre window was dividing a coast's people by a square of
province behind them. It is the better rule and it moved almost
nothing — Krakatau 24 000 to 26 000, the rest inside the noise. The
raster's own numbers were never the problem: Banda Aceh reads 1 647
people per km² of land in it, Galle 1 482, Sendai 4 738. The rule
stays because it is right; the hypothesis it was built on was wrong.

### The disc the source sits in (Phase 34)

`r = max(c·T, R₀)` holds the full source amplitude everywhere inside
R₀, and R₀ was half the rupture _length_: for Tōhoku a disc 351 km
across at 3.99 m, which is every coast in Japan. R₀ is also the source
scale in the energy normalisation of the spreading law, so the same
number sets how much wave reaches an ocean away.

It should be half the down-dip _width_ — the same argument that
settled the source wavelength and the beam. What a wave leaving the
fault broadside sees is the across-strike profile, and how big the
source looks to that wave is how wide the fault is, not how long.

The check is DART 21413, which isolates this parameter and nothing
else:

| source radius              | amplitude at DART | recorded |
| -------------------------- | ----------------- | -------- |
| half the length, 351 km    | 0.563 m           | 0.30 m   |
| **half the width, 103 km** | **0.280 m**       | 0.30 m   |

1.88× against 0.93×. It also makes true a sentence written in the
previous phase that was not: the corrected far field really does land
on the buoy now.

**And it takes the tolls down.** Every one of them, because every one
was standing on a far field that was nearly twice too strong:

| coastal toll  | before | after     | recorded  |
| ------------- | ------ | --------- | --------- |
| Tōhoku 2011   | 63 000 | **9 400** | ≈ 16 700  |
| Krakatau 1883 | 24 000 | 24 000    | ≈ 36 400  |
| Sumatra 2004  | 6 700  | 320       | ≈ 227 000 |

Tōhoku's residual halves in log terms, from 3.8× over to 0.56× under.
Krakatau does not move, because a caldera's source radius is the
caldera and always was. Sumatra collapses, and the reason is specific
rather than mysterious: its dead are in Banda Aceh, 250 km from a
fault 200 km wide, and that coast used to sit inside the saturation
disc at the full source amplitude. It no longer does, which is
correct, and what is left of Aceh's toll is then held down by the
density lookup that does not reach it — the thing measured in Phase 33
and already filed.

This is the third correction today that made a number worse while
making the model right, and each time the compensation it removed has
been named. That is the trade this project takes.

### A rupture is a line (Phase 33)

Every bearing the wave field asked for was measured from one point,
the epicentre. For a short rupture that is fine, because a short
rupture is very nearly a point. For a long one it is wrong where it
matters most.

The 2004 Sumatra–Andaman rupture ran 1 300 km north and most of its
dead were in Banda Aceh, 250 km up that line. Aceh is not off the end
of that fault; it is beside the middle of it, square across the
strike, where a megathrust radiates hardest. Measured from the
epicentre it came out lying almost straight along the strike instead —
the cosine of its angle off the strike reads 0.96 from the centre and
under 0.35 from the fault — and the beam handed it the incoherent
floor that belongs off a fault's end, 0.46 where the answer is 1.

So the bearing is taken from the nearest point of the rupture. A cell
abreast of the fault gets a perpendicular and the full beam; a cell
off one end gets the end, and the bearing from there runs along the
strike as it should. The two agree wherever the rupture is short
compared with the distance, which is every scenario that was right
before. The rupture is centred on the source point, because which way
a rupture propagated is not something a scenario knows.

**What it did, and what it cost.** Sumatra's coastal toll went from
2 100 drowned to **6 700**, three times better and still thirty-four
times under its record. Tōhoku's went from 17 000 to **63 000** — from
1.02× of its record to 3.8× over.

That second number is the point of writing the first one down in
advance. The roadmap said, before this was measured, that Tōhoku's
match was "a right total made of wrong places, a coincidence waiting
to be found out". It has been found out. Correcting the geometry took
the compensation away and left what it was compensating for, which is
now visible: the field holds the full source amplitude out to R₀ = L/2
— a 351 km disc at 3.99 m for Tōhoku — so every Japanese coast, all of
them within 200 km, sits at the peak. The saturation radius should be
the fault's across-strike half-width, the same argument that fixed the
wavelength, and that is the next entry.

**And Banda Aceh is in the model.** It was worth checking rather than
assuming: 360 coastal cells sit in the northern Sumatra box and the
ones at Banda Aceh carry a run-up of 19.7 m, against a record of 15 to 30. The wave is there and it is the right size. What is not there is
the people: the density lookup gives the twelve fine tiles holding the
most points to the 2.5′ raster and everything else to the 0.125°
planet, and for a fifteen-thousand-cell field spread over an ocean,
Aceh is not reliably among the twelve.

### The amplitude a thousand kilometres out, and the last fifty metres (Phase 32)

Two errors sat on top of each other, pulling in opposite directions,
and neither could be seen while the other was there.

**The far field was too strong.** `A = A₀·(R₀/r)^q` held the amplitude
at the source value out to R₀ and decayed from there. For Tōhoku that
reads **1.34 m at DART 21413 where 30 cm was recorded** — four and a
half times over — and it made the whole planet's coasts a metre or
two. Measured, the coastal exposure of the _Sumatra 2004_ tsunami was
dominated by Tokyo Bay, Mumbai, Manila and Rio de Janeiro. The event
had no geography left in it.

Energy fixes the normalisation with no fitted constant. A hump of peak
A₀ and radius a holds ½ρg·A₀²·πa²; half goes outward, and at range r
it occupies a ring of circumference 2πr whose effective width is √π·a.
Equating them,

    A(r) = A₀ · √( a / (4√π · r) )     for r ≫ a

The bare law omits the 4√π and over-states by its square root — 2.66.
The constant is the algebra of a Gaussian ring, and the check is that
it reproduces the Saint-Venant solver of the NOAA benchmark to three
per cent: that solver on its own Gaussian gives 0.494 m at DART, this
gives 0.508.

(That paragraph first claimed the model's own source landed at 0.27 m
against the 0.30 recorded. It did not: the arithmetic behind the claim
used half the fault's _width_ as the source radius where the code used
half its _length_, and the shipped law read 0.563 m — 1.88× the
record. Phase 34 makes the code do what the paragraph said.)

**The shore height was too weak.** The field stops at fifty metres of
water, because the shallow-water equations it is built on give out
below that. The casualty model then took the shore height as the
amplitude itself, hedged against the Synolakis run-up through a trust
factor of one — and since a run-up is almost always larger than the
wave that made it, the hedge chose the amplitude every time. The last
fifty metres of water were simply dropped.

Green's law carries the wave the rest of the way, A ∝ h^(−¼), and
McCowan says how far the rest of the way is: it breaks when its height
reaches 0.78 of the depth. Solving the two together removes the depth:

    H = (d·γ)^(1/5) · A^(4/5)   ≈ 2.1 · A^(4/5)

A wave arriving at three metres stands at five and a half; one
arriving at one metre stands at two. Both numbers were already in the
model — d is the field's own floor and γ its own shoaling cap — so
there is nothing fitted here either. The run-up is still the ceiling,
because a cliff makes little of a big wave and there Synolakis is the
one that knows about the beach.

**What the pair does.** Measured live, on the coasts as they are:

| coastal toll  | before | after      | recorded  |
| ------------- | ------ | ---------- | --------- |
| Tōhoku 2011   | 5 400  | **17 000** | ≈ 16 700  |
| Krakatau 1883 | —      | **24 000** | ≈ 36 400  |
| Sumatra 2004  | 100    | 2 100      | ≈ 227 000 |

Tōhoku is at 1.02× of its record and Krakatau at 0.66×, and those are
the first coastal tolls this project has been able to say that about.
Neither number was fitted: the corrections are a ring's energy and two
constants the model already had.

**What it does not fix, and what that now points at.** Two things.

The first is honesty about Tōhoku: the total is right and the
geography inside it is not. Tokyo Bay is the largest single
contributor where Sanriku should be. A right total made of wrong
places is a coincidence waiting to be found out, and it is written
into the roadmap as such.

The second is Sumatra, still a hundred times under. Its dead were in
Banda Aceh, at the _northern end_ of a 1 300 km rupture whose southern
end is where this model puts the source. Aceh is not off the end of
that rupture — it is beside the middle of it — but a point source with
a beam measures the bearing from one place and hands Aceh the
incoherent floor, 0.46, that belongs off a fault's end. The source has
to become a line before that row can move, and that is the next thing.

### A warning nobody could have given (Phase 31)

The coastal toll asked one question about warning and should have
asked two. It took the wave's travel time as the warning time: a coast
half an hour out has none, a coast three hours out has been emptied.
That is right for the Pacific, where the centres bulletin within
minutes and Japan's within three — Tōhoku 2011 killed one person
across the whole ocean. It is wrong for the Indian Ocean in December
2004, which had no system at all. Its far coasts had two hours of
travel time and no warning whatsoever, and Sri Lanka and India lost
more than fifty thousand people between them at distances where the
Pacific would have been evacuated twice over.

So the lead time is what a coast actually has: **max(0, arrival −
issue)**, and the issue time is a fact about the basin rather than
about the wave. A scenario says nothing and gets the modern case, ten
minutes, because every ocean has a system today. A preset that
predates its own basin's says so — Sumatra 2004, and Lisbon 1755,
Valdivia 1960 and Alaska 1964, the last two being the earthquakes the
Pacific system was built after. Their coasts then have no lead however
far out they are.

It is one law with one input, not a branch on which event is running.
Sumatra's modelled coastal toll went from 120 drowned to **1 500**, a
factor of twelve, and Tōhoku's did not move, because Tōhoku was warned.

### The coast a single tile cannot see (Phase 31b)

The run-up field is built on two grids: a local one fetched around the
pick, under a kilometre per sample, and the planetary mosaic at ten to
thirty. The local one is a single zoom-8 tile, about 156 km across,
and it was fetched as a block of nine only when the tile held no land
at all.

A pick offshore breaks that test without failing it. The Sumatra 2004
epicentre is 150 km out to sea; its tile clips a corner of coastline,
which is land, so one tile was judged enough — and the run-up field
came out with **43 local coastal cells out of 14 693**. Every coast
that drowned in 2004 came off the planetary mosaic instead.

The test is now a quarter of the tile rather than a single sample of
it: below that the tile is mostly water and the eight extra fetches
are worth making. Sumatra's local cells went from 43 to 406 and
Tōhoku's to 585, and Tōhoku's coastal toll rose from 6 500 drowned to
7 100 against about 16 700 recorded.

Sumatra's did not move, and that is the useful part of the
measurement: its dead were hundreds to thousands of kilometres from
the source, on coasts no local grid will ever reach. What holds that
row down now is neither the warning nor the grid but the wave itself —
the field's mean coastal run-up for that event is 2.9 m where the
2004 record is 5–10 m in Sri Lanka and 15–30 m in Aceh, and the
inundation strip goes as H^(4/3), so the exposure is short before the
mortality is even asked. That is the next thing to measure.

### The floor under the beam (Phase 30)

The array factor has zeros; a fault does not. That was the one thing
left between the model and the record at Cocos Island, where the
pattern said three per cent of the peak and the tide gauge recorded
twenty times that.

A fault moves together over a correlation length ℓ and breaks into
N = L/ℓ pieces that stop agreeing with each other, and N incoherent
sources add as √N in amplitude where N coherent ones add as N. So the
radiation cannot fall below **√(ℓ/L)** of its own peak, whatever the
array factor says. The floor is one number for every rupture rather
than one per event, because Mai & Beroza (2002) found the correlation
length scales with the fault's own dimensions — so ℓ/L does not depend
on magnitude.

What sets it is a measurement made elsewhere. Melgar & Hayes (2019),
as reported by Sepúlveda et al. (2020), put the along-strike
correlation length of a magnitude 9 rupture near 150 km, against the
seven hundred kilometres such a rupture runs: a fifth of its length.
√(1/5) ≈ 0.46, and that is the only number in the file.

It is not fitted to the two records. It is measured somewhere else and
happens to reproduce them, which is the whole difference:

|                              | isotropic | beam alone | beam with floor | recorded |
| ---------------------------- | --------- | ---------- | --------------- | -------- |
| DART 21413, in the main lobe | 1.65×     | **1.14×**  | 1.14×           | 0.30 m   |
| Cocos Island, past the null  | 1.80×     | 0.06×      | **0.83×**       | 0.40 m   |

DART is untouched, because a main lobe is above the floor by
definition. Cocos goes from a factor of eighteen under to within
seventeen per cent, and both records now sit inside the ±25–50 % that
Synolakis et al. 2008 give as the spread between MOST, GeoClaw and
COMCOT on the same benchmark.

**A draft that was rejected.** The first version of this floor used
ℓ = λ, the wavelength, which put Cocos at 1.00× and DART at 1.47×.
Better-looking and worse science: the count of pieces a fault breaks
into is not set by the wavelength of the wave it radiates, and picking
λ for it was picking a parameter to make two numbers come out. The
published correlation length was worth the search.

**On the globe.** The floor stops the beam nulling the coasts that lie
along a rupture, which is where most of the dead of a megathrust
actually are. Tōhoku's coastal toll went from 3 800 drowned to 6 500,
against about 16 700 recorded. Sumatra's moved 100 → 120 against near
227 000, so its shortfall was never the beam: it is the forty-kilometre
coastal grid and a warning-time assumption that hands 2004 a warning it
did not have, both written up under M8.

### The beam reaches the numbers, and stops where it should (Phase 29)

The wave field on the globe beamed; the numbers in the report did not.
`seismicTsunamiFromMegathrust` published "the amplitude at 1 000 km"
with no direction attached, which for a source that radiates several
times more strongly across itself than along itself is not a
well-defined quantity — it is the peak, quoted as though it were
everywhere.

The scalar path now takes an optional strike and a receiver bearing
and reports what reaches that bearing. Applied to the two far-field
records, it does two different things, and the difference is the
result worth keeping.

**DART 21413** lies at bearing 131° from the Tōhoku epicentre and the
Japan Trench strikes 200°, so the buoy is 21° off the seaward
perpendicular: inside the main lobe. The array factor there is 0.69,
and the modelled amplitude goes from 1.65× the recorded peak to
**1.14×**. That is a match, at the limit of what anyone can claim —
Synolakis et al. 2008 §6 puts the spread between MOST, GeoClaw and
COMCOT on the same benchmark at ±25–50 %.

**Cocos Island** lies at bearing 176° from the centroid of a rupture
striking 330°, which is 154° off the perpendicular and well past the
first null of an array three and a quarter wavelengths long. The
pattern says three per cent of the peak there. The tide gauge recorded
twenty times that.

So the pattern is right in its main lobe and wrong past its first
null, and the reason is not subtle: a coherent line source has zeros
and a fault does not. The array factor assumes the whole rupture
radiates one wavelength in step, and a fault that took ten minutes to
tear thirteen hundred kilometres through patchy slip does neither.
Its nulls are filled in by everything that makes it a rupture rather
than an antenna.

What would fill them in the model is the slip correlation length — how
far along a rupture the seafloor really does move together — and this
project has no measurement of one. So `directivityTrusted` says which
side of the first null a bearing falls on, and the scalar path applies
the beam inside the main lobe and declines to outside it, leaving the
row at its peak with the reason attached. Cocos stays a declared
residual at 1.80×: an unbeamed number with an explanation, rather than
a beamed one from outside the model's range.

A first draft did fill the null, with an incoherent floor of √(λ/L)
derived from N = L/λ pieces adding as √N. It put Cocos at 1.00× and
DART at 1.47×, which looks better than what shipped and is worse
science: the count of pieces is not L/λ but L over the slip
correlation length, and choosing λ for it was choosing a parameter to
make two numbers come out. The floor is not in the code.

### What a megathrust radiates on (Phase 28)

The previous section left one question, and the codebase turned out to
be answering it three ways at once. The report printed a source
wavelength of 2·L, the along-strike length doubled. The wave field on
the globe fell back on twice its cavity radius, which for a rupture is
L. The dispersion and the directivity beam both used whichever of
those reached them. One source, three wavelengths.

The recorded period settles it, and it is not close. At four
kilometres of ocean the celerity is 198 m/s, so a wavelength implies a
period directly:

|         | λ          | period     |
| ------- | ---------- | ---------- |
| 2·L     | 1 400 km   | 1 h 58     |
| L       | 700 km     | 59 min     |
| **2·W** | **470 km** | **39 min** |

The leading wave at DART 21413 had a period of roughly thirty to forty
minutes (Satake et al. 2013). No buoy recorded a two-hour leading
wave. The wavelength is 2·W.

The physics agrees with the buoy. A megathrust lifts a long, narrow
ridge of seafloor — L along strike, W across it — and the wave that
leaves the fault broadside is shaped by the across-strike profile,
because that is the direction it is travelling in. Along strike the
source really is 2·L long, but very little energy goes that way, and
none of the far-field records this model is checked against sit
there.

It is now one number computed once and passed to everyone who needs
it: the dispersion, the beam on the globe, and the period printed in
the panel. That last one is the check a reader can make for
themselves.

**What it moved.** The directivity beam, which is the point: the array
factor goes as L/λ, and with λ tied to L that ratio was frozen at a
half however long the rupture, so the beam could never sharpen. On
2·W it is L/2W — the aspect ratio — and a rupture seven times longer
than its own wave finally beams like one.

The coastal toll of Tōhoku fell from 5 600 drowned to 3 800, and
Sumatra's from 130 to 100. Both were already far under their records —
about 16 700 drowned in Tōhoku and near 227 000 in Sumatra — and a
narrower beam takes a little more off the parts of a coast that are
not broadside to the rupture. That shortfall has causes of its own,
written up under M8: a coastal grid sampled every forty kilometres, a
warning-time assumption that gives 2004 a warning it did not have, and
a scalar path with no directivity at all. None of them is the source
wavelength, and none of them is a reason to keep a wavelength the
buoys contradict.

### One dispersion law, and what removing the other one showed (Phase 27)

Two laws were shipped at once. The wave field on the globe carried
Kajiura's parameter — D = (4π²/6)·r·h²/λ³, decay (1+D)^(−½) — and
everything else carried a fixed exponential, exp(−r / 2 500 km),
printed in the report under a citation to Heidarzadeh & Satake 2015.
The code's own comment said what the citation did not: "a HEURISTIC
exponential envelope, NOT a transcription of a published equation".

The two disagree by a factor of seven at five thousand kilometres, so
the same wave had two amplitudes depending on which surface the reader
was looking at. Measured side by side the reason is plain:

|                                        | exponential | Kajiura |
| -------------------------------------- | ----------- | ------- |
| Tōhoku at DART, λ = 1 400 km, h = 4 km | 0.55        | 0.999   |
| Tōhoku at 5 000 km                     | 0.14        | 0.996   |
| impact wave, λ = 18 km, at 1 000 km    | 0.67        | 0.24    |
| Baker at 5.5 km, λ = 200 m, h = 60 m   | 0.998       | 0.24    |

The exponential is the same curve for every event, because r is all it
knows. It invents dispersion where there is none — a rupture seven
hundred kilometres long makes a wave that crosses an ocean with its
shape intact — and misses it where it is overwhelming, which is every
short source: an impact cavity, a flank collapse, a depth charge.
Kajiura's parameter has h and λ in it, which are the two things
dispersion actually depends on. One of these can be a law and the
other cannot, so the heuristic is gone and the derived law is now the
only one in the codebase.

**What that exposed.** Six benchmark rows went red, all megathrusts,
all in the same direction: the model over-predicted the far field by
a factor of three to four. The exponential had been supplying almost
exactly that, under the wrong name.

Four of the six were an unfair comparison rather than a defect.
GeoClaw's driver lays a rupture out with `sub.strike = 0` — due north
— and every probe in those fixtures is due north of the centroid, so
they sit in the end-fire null of a source the 1D-radial path models as
isotropic. Giving the comparison the same directivity the wave field
already carries — the |sinc| line-source array factor — makes it
like-for-like, and all four pass without a tolerance being touched.

The other two are real, and they are now declared rather than
absorbed. The cylindrical law reads 1.65× the recorded amplitude at
DART 21413 and 1.80× at Cocos Island: the same direction, the same
size, a systematic. Both rows now pin that residual as a band so it
cannot drift unwatched, with the reason written beside them. Making a
number look worse while making the model more correct is the trade a
laboratory takes, and the alternative was keeping a fudge factor that
half-cancelled a spreading error by coincidence.

**What closes it.** A megathrust's dominant wavelength: 2·L along
strike, cited to Satake 2013, or 2·W across it, which is where the
energy that reaches a broadside buoy actually goes. The two differ by
a factor of forty in the dispersion parameter and they set the beam
width as well. That is the next piece, and it is a question about the
source rather than about the propagation — which is exactly where the
evidence now points, and could not while the exponential was there.

### Saying where the measurements stop (Phase 26)

The sweep of the previous section shows the laws hold outside the
calibration net. It does not make the page say where the outside
begins, and until it does a reader has no way to tell a scenario the
model has been checked against from one nobody has ever measured.
Both arrive in the same typeface.

So the casualty panel carries a line naming the nearest measured
event and how the scenario stands against it: beside it, between two
of them, or past the largest and by what factor. The factor is always
an energy ratio, whatever the family's own axis is — magnitude
converts at 1.5 units of Mw per decade of moment (Hanks & Kanamori
1979), erupted volume and yield are decades of themselves — so "ten
times past" means the same thing to a reader whichever event they are
looking at.

The placement is per quantity, not per family, and that is the part
worth arguing for. A fifty-megatonne charge is beside a measured event
if the question is the wave: Tsar Bomba was fired over water and made
none, and the model has to reproduce that. Ask instead about the dead
and the nearest event with a toll on record is Hiroshima, three
thousand times smaller. One event, two honest answers, and the panel
that shows a death toll owes the reader the second one.

Where the record is empty the line says so rather than reaching for
the nearest thing of any kind. No impact in recorded history has left
a death toll — Tunguska flattened an empty forest and Chelyabinsk
broke windows — so an impact's casualty figure is checked against
nothing at any scale, and it says that in place of naming a nearest
event. The same holds for landslides. Chicxulub is the sharpest case:
its crater is measured, and the model is held to it on every build, so
a reader could reasonably assume the rest of the row is measured too.
It is not, and now the page is the one that points that out.

None of this changes a number. It changes what is claimed about one,
which is a different thing and the one that decides how much weight a
reader should put on it.

### Eleven events pin eleven points (Phase 25)

The calibration net measures the model where the world has already
run the experiment, and that is eleven places. A visitor with the
custom fields open covers the whole space, and almost none of what
they can ask for has ever happened: a two-hundred-kilotonne charge a
kilometre under the Adriatic, a thirty-kilometre stone at eleven
kilometres a second, a magnitude nine and a half under Lisbon.
Nothing can check whether those answers are right, because nobody has
measured them.

What can be checked is that the laws still behave like laws out
there. `customScenarios.test.ts` sweeps the whole range — yields from
a tonne to a gigatonne, bursts from thirty kilometres up to five
kilometres down, impactors from a metre to a hundred, magnitudes four
to ten, water from dry land to the Challenger Deep — and asks four
things of every result: that every number in it is finite, that the
laws are monotone where physics says they must be, that they are
continuous across the boundaries the code draws for its own
convenience, and that nothing leaves the range physics allows. A model
that passes all four can still be wrong. One that fails any of them is
broken, and only a sweep would ever find out, because a preset never
goes there.

The sweep found the model sound on all four, and found one thing
worth recording about how to write such a test: the first version
asked that the wave not jump as a charge crosses the water surface,
with an arbitrary tolerance, and it failed. The curve is continuous —
zero at the surface, three centimetres a decimetre under, two and a
half metres half a metre under — it is simply steep, because half a
metre of water over a fireball is the difference between coupling and
venting. The property worth asserting was continuity, that the gap
across the surface closes as the interval does, which a threshold's
would not.

### A grid that contains a coast (Phase 25)

The terrain under a pick is one web-mercator tile, 1.4° of it, about
six hundred metres a sample. That is the right thing to fetch for
nearly every pick, and quite useless for one kind: a tile centred on
an offshore epicentre is all water, and a run-up field needs a coast
to run up. Tōhoku's local tile was 120 km of open Pacific with the
Sanriku shoreline a degree outside it, so the whole Japanese coast was
left to the planetary mosaic at forty kilometres a cell while a
six-hundred-metre grid sat empty beside it.

The rule is now about what the grid is for rather than about which
event asked for it: if there is no land in it at all, the ring around
it is fetched and the nine tiles resampled onto one uniform grid.
A pick on land fetches nothing extra, which is most picks. Tōhoku's
grid became 3.3° by 4.2° with seventeen per cent land and 585 coastal
cells where it had none, and its coastal toll went from 1 100 against
18 500 recorded to 5 710 — inside the band at last, with the modelled
exposure of 554 000 against the 600 000 who lived in the 561 km²
Japan actually lost.

### A rupture radiates across itself (Phase 25)

Seven hundred kilometres of seafloor rising together do not push the
ocean outward in a circle. They push it across the fault, in a beam,
and the longer the rupture the narrower the beam — which is why
Tōhoku flooded Sanriku and then crossed the whole Pacific to break
boats in Chile while the Sea of Okhotsk, a few hundred kilometres off
the northern end of the same rupture, was comparatively spared.
Ben-Menahem & Rosenman (1972) wrote the pattern down for tsunamis: it
is the array factor of a line of sources, f(θ) = |sinc(πL sinθ/λ)|
with θ measured from the perpendicular to the strike.

The simulator radiated its megathrusts evenly until now, at the
amplitude of the peak, which puts the strongest wave a fault can make
in every direction at once and quietly manufactures energy. The peak
is left where it is rather than renormalised upward: the amplitude it
multiplies comes from the peak seafloor uplift, so it already belongs
on that axis, and the correction is to take it away from the other
directions. A source with no orientation — a crater, a collapse, a
burst — has no beam and the factor is one everywhere, so nothing else
needed a special case.

The near field validates it about as well as this project has managed
anywhere: the maximum run-up modelled on the Sanriku coast is 47.7 m
against the 40.5 m surveyed at Miyako, the highest measured in 2011.

And it exposed two things that the overstated far field had been
hiding. A coastal density read with a fourteen-kilometre window on
the 2.5′ tiles sees nothing but water when the point it is given came
off a forty-kilometre tsunami grid and sits that far offshore; the
window now follows the caller's own spacing, and until it did, Japan
contributed nobody to its own tsunami while Chile and Hawaii carried
the toll. What remains is coarser still: for a megathrust the local
amplitude field is not produced at all, so even the coast twenty
kilometres from the rupture is sampled on the planetary grid at forty.
Tōhoku's coastal toll reads 1 100 against 18 500 recorded — seventeen
times under, where before the beam it was 2.6 times over. The closer
number was the sum of two errors of opposite sign, and this one has a
single cause with a known remedy.

### The veil learns which waves disperse (Phase 25)

A tsunami keeps its shape only while its wavelength dwarfs the water
it crosses. Past that the longer components outrun the shorter, the
crest spreads into a train, and the leading wave thins faster than
geometry alone would take it. The published far-field rows have
carried this for years as a fixed exponential with a 2 500 km scale
length, calibrated on the DART record of megathrust waves — and the
amplitude field, the veil on the globe, has carried none at all,
which was the better of the two mistakes available. That scale length
is a property of those waves and not of dispersion: a rupture seven
hundred kilometres long over four kilometres of ocean barely
disperses across a basin, while the wave from a flank collapse or a
depth charge is a kilometre or two long and has spread into its train
within a few hundred kilometres. One number could not describe both.

`dispersion.ts` carries the parameter instead of a scale length:
D = (4π²/6)·r·h²/λ³, which is the algebra of the first correction to
the shallow-water phase speed rather than a fit, and the veil applies
(1 + D)^(−1/3) to every cell using the source's own wavelength and
the local depth. The exponent is a half, and it is derived rather
than chosen. This project always had two far-field laws and treated
them as a choice — the veil spreading as 1/√r, a compact source's
published row decaying as 1/r — but they are the same law at its two
ends. Geometry gives 1/√r for any source on a water surface. A
dispersing wave loses height a second time because its energy spreads
along a train that lengthens as it goes, and in the fully dispersive
limit that is another r^(−1/2); together they are the r^(−1) that
`propagation.ts` has cited from Lamb since it was written. Crossroads
Baker, the only event measured at two ranges, agrees: 23.4 m where
thirty were seen at three hundred metres and 1.90 m where 1.8 were
seen at five and a half kilometres. An exponential in the same
parameter, tried first, takes that second point to nothing.
_(Corrected 14 September 2026: those two figures were a spreading law
the globe does not draw, set against heights from crest to trough,
and the second range has no source. Baker is tabulated at seven
ranges; see "Crossroads Baker, read as it was printed".)_

What it changed is as telling as what it did not. Anak Krakatau's
coastal toll fell from 8 700 against 437 recorded to 2 200, because a
flank collapse makes exactly the short wave dispersion eats. Tōhoku
did not move at all — its wave is too long to disperse over 1 500 km
and the model now says so rather than being made to. Chicxulub barely
moved. And a fifty-megatonne device detonated at its optimum depth
now delivers fifteen centimetres three thousand kilometres away
instead of a wave, which is the conclusion the tsunami-bomb
programmes reached in the 1940s and which this simulator had been
quietly contradicting.

### Waves that were measured (Phase 25)

The casualty harness measures what the model does to people; a second
one measures what it does to water, and it exists because the first
thing outside the casualty harness's reach was wrong by a factor of
three hundred and stayed wrong until it was live. Waves are the easier
half to check: a death toll depends on who happened to live there,
while a wave height was written down by people with instruments, and
the same charge in the same water makes the same wave whoever is
watching.

Four rows gate. Crossroads Baker 1946 is the one that matters — a
known yield at a known depth in a lagoon of known depth, the
best-instrumented explosion wave there will ever be — and the model
puts 30.7 m at 300 m from surface zero against the ~30 m recorded.
Castle Bravo and Ivy Mike, six hundred times Baker's energy but fired
at the surface, produce nothing, which is what the record says of
them; so does Beirut, whose harbour wave this harness was built after.
Storegga's inferred metre-scale open-ocean wave lands at 0.60 m inside
the 0.3–3 m the deposits imply.

Two rows are reported and cannot gate, and both measure the same
thing: the veil spreads geometrically and carries no dispersion, so it
runs high in the far field. Baker is dead on at 300 m and four times
high at 5.5 km. Tōhoku is 1.06 m at DART buoy 21413 against about
30 cm recorded — while this project's own alternative formula for the
same buoy gives 7 cm, four times under. The measurement sits between
two of our own laws, which is the clearest statement yet of why they
need joining, and neither should be bent to pass a test in the
meantime.

_(Corrected 14 September 2026: Baker's "~30 m" is a height from crest
to trough and the model's figures are amplitudes, so "dead on at
300 m" compared two different quantities. See "Crossroads Baker, read
as it was printed".)_

### Where a burst has to be to make a wave (Phase 25)

An explosion's coupling to water was a single number, eight per cent,
tuned so that a megatonne at the optimum depth reproduces Glasstone's
180 m source amplitude. It was spent on every burst regardless of where
the charge was: a half-kilotonne detonation resting on the Beirut quay
drew the same eight per cent as one hung three metres under the
surface, and the resulting wave drowned seventy-seven thousand people
in a city where the real wave was about a metre inside the harbour and
drowned nobody.

`waveCouplingEfficiency` is the curve that was always missing. It is a
log-normal in the scaled depth z/W^(1/3), peaking at the 4 m·kt^(−1/3)
this module cited from Glasstone §6.40 long before the curve existed,
and each side of the peak has a mechanism rather than a fit: too
shallow and the gas globe reaches the surface before it has finished
pushing, opening to the atmosphere so the energy leaves as air shock
and spray; too deep and the bubble oscillates and decays without ever
breaking through. Only the width in log-space is the project's own
composition, and it carries the ±50 % the module predicted years ago
when it declined to fit the curve at all.

It replaced a threshold rather than joining one. The branch used to
fire for a surface burst between zero and thirty metres of height and
refuse everything else, and underwater bursts were declared out of
scope precisely because there was no way to grade them. There is now,
so the branch opens wherever there is water to lift and the curve says
how much — which also means a genuinely submerged burst is modelled for
the first time. Crossroads Baker, twenty-seven metres down, is the
famous explosion-generated wave and the curve gives it one; Castle
Bravo on its reef and Ivy Mike on its islet are remembered for their
craters and their fallout and not for any wave, and the curve agrees.

_(Corrected 14 September 2026: "Glasstone's 180 m source amplitude"
and "Glasstone §6.40" do not exist in the 1977 edition — chapter 6 has
no Table 6.50, no source amplitude for any yield, and its §6.40 is
about buildings in Las Vegas — so the eight per cent, the
4 m·kt^(−1/3) optimum and the width are all the project's own. What
the book gives, and how far this source stands from it, is in the
roadmap under M9 move 3.)_

### The coastal toll of the wave (Phase 24)

The tsunami was the one hazard the toll left out. It is counted now
wherever the wave map touches a coast. `runupField.ts` already gave
every coastal cell of the local grid its Synolakis run-up R on the
local beach slope β; each cell now also carries the slope, the length
of coast it stands for and the wave's arrival time from the
fast-marching field, and the planetary layer gets the same run-up
field along the planet's coasts at 40 km, used beyond the local grid.
`tsunamiCasualties.ts` turns the cells into people. The water height at the
shore is H = √(A · min(R, A)) — the geometric mean of the shoaled
amplitude arriving at the coast and the plane-beach run-up it makes,
with the run-up believed only up to the amplitude. `runupField.ts`
clamps the Synolakis run-up at four times the amplitude, the McCowan
1894 breaking ceiling, and measured across the scenarios that clamp
binds on 84 to 95 per cent of the coastal cells: there the run-up is
not a computed height but the ceiling, and reading it as one lets the
ceiling set the flood. Where the solver returns less than the
amplitude it is Synolakis speaking, and the smaller number is used. The strip the water crosses is the Bretschneider
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
shows it apart. Calibrated against the two events with a complete record, and the
calibration is what found the next defect. Tōhoku 2011 first read
13 000 dead against the 18 500 the wave took — until the store was
caught handing the amplitude field a quarter of the rupture length
where the seismic module spreads from a half, leaving the veil a
factor √2 quieter than the amplitude row printed beside it. With the
contradiction removed the same run reads 48 000: two and a half times
the record rather than three quarters of it, and inside the band this
model claims. The closer number had been right for the wrong reason,
two errors cancelling.

Anak Krakatau 2018 reads 8 700 against 437, twenty times high, and
the reason sits upstream in a place worth naming. The veil spreads
geometrically, energy over a growing circumference, A ∝ (R₀/r)^0.5.
The far-field row a compact source publishes follows Lamb 1932's 1/r,
which is that geometry plus the dispersion a short wave suffers over
a thousand kilometres. Both are right where they are used, and
neither can be used where the other is: forcing the veil onto the 1/r
law — tried, measured, reverted — puts the Sunda Strait under half a
metre of water where the survey found metres, and the coastal toll
falls to one death against 437. A single power law cannot hold the
near field and the far field of a short wave at once. What the
simulator would need is dispersion in the field itself, with a scale
length set by the source's wavelength rather than the fixed 2 500 km
calibrated for megathrusts. Until then the divergence is pinned with
its size in `fieldScalarAgreement.test.ts`, so it stays visible.

Its honesty: a run-up height and an empirical reach are not an
inundation map, the coast is where the rasters are coarsest, and the
band is a factor of three either way — wider where the source is
small and close.

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
