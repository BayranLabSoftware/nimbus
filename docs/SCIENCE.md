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
  scaling, in free air.
- **Swisdak, M. M. Jr. (1994).** _Simplified Kingery Airblast
  Calculations._ Minutes of the 26th DoD Explosives Safety Seminar,
  Miami. Naval Surface Warfare Center, DTIC ADA526744. The
  Kingery & Bulmash (1984) compilation for a hemispherical TNT surface
  burst, as one-line polynomials: what a chemical charge on the ground
  is drawn with since 18 September 2026.

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

| UI quantity                   | File                                | Formula                                                                                                                                                                                                                        | Source                                                                                        | 1σ                                                  |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Impactor kinetic energy       | events/impact/kinetic.ts            | E = ½ m v²                                                                                                                                                                                                                     | Newtonian                                                                                     | inputs                                              |
| Transient crater Ø            | events/impact/crater.ts             | D_tc = 1.161 (ρi/ρt)^⅓ L^0.78 v^0.44 g^-0.22 sinθ^⅓                                                                                                                                                                            | Collins et al. 2005, Eq. 21                                                                   | ±10%                                                |
| Final crater Ø (simple)       | events/impact/crater.ts             | D = 1.25 D_tc                                                                                                                                                                                                                  | Collins et al. 2005, Eq. 22                                                                   | ±5%                                                 |
| Final crater Ø (complex)      | events/impact/crater.ts             | D = 1.17 D_tc^1.13 D_c^-0.13                                                                                                                                                                                                   | Collins et al. 2005, Eq. 27                                                                   | ±10%                                                |
| Crater depth (simple)         | events/impact/crater.ts             | d = d_tc + h_fr − t_br ≈ 0.213 D                                                                                                                                                                                               | Collins et al. 2005, Eqs. 23–26, 48                                                           | ±30%                                                |
| Crater depth (complex)        | events/impact/crater.ts             | d = 0.4 D^0.3 (km)                                                                                                                                                                                                             | Collins et al. 2005, Eq. 28 (Herrick et al. 1997)                                             | ±30%                                                |
| Ejecta thickness              | effects/ejecta.ts                   | t = D_tc⁴ / (112 r³), r ≥ D_fr / 2                                                                                                                                                                                             | Collins et al. 2005, Eq. 47 (r⁻³: McGetchin et al. 1973)                                      | lower bound                                         |
| Seismic magnitude, impact     | events/impact/seismic.ts            | M = 0.67 log₁₀(E) − 5.87, E = gf·E_k, or (v_b/v₀)²·E_k for an airburst (EIEP, rules 154–157)                                                                                                                                   | Collins et al. 2005, Eq. 40 (efficiency 10⁻⁴)                                                 | ±0.67 (10⁻⁵–10⁻³)                                   |
| Seismic moment Mw → M₀        | events/earthquake/seismicMoment.ts  | M₀ = 10^(1.5 Mw + 9.1) N·m                                                                                                                                                                                                     | Hanks & Kanamori 1979                                                                         | ±0.1 Mw                                             |
| MMI from PGA                  | events/earthquake/intensity.ts      | MMI = piecewise a + b·log₁₀(PGA)                                                                                                                                                                                               | Worden et al. 2012                                                                            | ±0.5 MMI                                            |
| Rupture area from Mw          | events/earthquake/rupture.ts        | A = 10^(Mw - 4.0)                                                                                                                                                                                                              | Wells & Coppersmith 1994                                                                      | ±0.3 dec                                            |
| Aftershock rate (Omori)       | events/earthquake/aftershocks.ts    | n(t) = K (t + c)^-p                                                                                                                                                                                                            | Reasenberg & Jones 1989                                                                       | ±factor 2                                           |
| Plume height                  | events/volcano/plumeHeight.ts       | H = 2.0 V̇^0.241                                                                                                                                                                                                                | Mastin et al. 2009                                                                            | ±50%                                                |
| VEI ↔ ejecta volume           | events/volcano/vei.ts               | VEI = log₁₀(V) - 4 (V in m³)                                                                                                                                                                                                   | Newhall & Self 1982                                                                           | discrete                                            |
| Ashfall isopach               | events/volcano/tephra2Fallout.ts    | Tephra2's forward model (beta release, Gaussian φ sizes, three settling regimes, fall-time diffusion), held to the program (rules 158–161)                                                                                     | Bonadonna et al. 2005; Connor & Connor 2006                                                   | ±factor 2                                           |
| Pyroclastic runout            | events/volcano/pyroclasticRunout.ts | L = 10 · V_km³^(1/3) (Nimbus scaling)                                                                                                                                                                                          | Nimbus; Sheridan 1979 and Hayashi & Self 1992 background                                      | ±70%                                                |
| Lateral-blast wedge           | events/volcano/extendedEffects.ts   | runout = 2.5 × Sheridan runout (Nimbus), sector up to 180°                                                                                                                                                                     | Crandell & Hoblitt 1986 (sector, ≈ 28 km)                                                     | ±50%                                                |
| Overpressure ring (chemical)  | effects/kingeryBulmash.ts           | P = exp(A + B·lnZ + … + G·ln⁶Z) over three ranges of Z = R/W_kg^⅓, the hemispherical TNT surface burst                                                                                                                         | Swisdak 1994 Table 1 (Kingery & Bulmash 1984)                                                 | 1 % of Kingery & Bulmash                            |
| Overpressure ring (nuclear)   | events/explosion/overpressure.ts    | ΔP/P₀ = 808[1+(Z/4.5)²]/√(…), Z = R/W^⅓ (free air; the surface burst a nuclear yield enters at its own yield)                                                                                                                  | Kinney & Graham 1985; reflection: Takazawa et al. 2023                                        | ±15%                                                |
| Thermal fluence               | events/explosion/thermal.ts         | Q = f W τ / (4π R²), f = 0.18 → 0.35 up to 200·W^0.4 ft, τ = e^(−R/L) (project L); none for chemical; burn at Glasstone & Dolan Fig. 12.64 (6.2 → 11.8 cal/cm² third degree, 1 kt → 10 Mt); an impact at the project's 8 and 5 | Glasstone & Dolan 1977 §7.94–7.96, §7.101                                                     | ±25%                                                |
| Firestorm ignition radius     | events/explosion/firestorm.ts       | R s.t. Q(R) = 4.19e5 J/m² (10 cal/cm², project value)                                                                                                                                                                          | Glasstone & Dolan 1977 §7.94–7.96 (fluence)                                                   | ±30%                                                |
| Tsunami cavity radius         | events/tsunami/impact.ts            | R_C = (3 E / 2π ρ g)^¼                                                                                                                                                                                                         | Ward & Asphaug 2000, eq. 12 (ε = ½, D_C = R_C)                                                | ±30%                                                |
| Tsunami far-field (Ward)      | events/tsunami/impact.ts            | A(r) = A₀ R_C / r (A₀ project calibration)                                                                                                                                                                                     | simplifies Ward & Asphaug 2000, eq. 17                                                        | reference                                           |
| Tsunami far-field (best)      | events/tsunami/impactProgram.ts     | A = f_sea min(0.07 D_w, h) D_w/r (r > D_w), D_w = 0.82581965 (ρᵢ/ρ_w)^⅓ L^0.78 v^0.44 sin^⅓θ (EIEP, rules 150–153)                                                                                                             |
| Tsunami far-field (Wünnemann) | events/tsunami/wunnemann.ts         | A_r = min(0.14 R_w, h)(R_w/r)^q_r, q_r = min(1.2, 0.5+2e^(−1.75L/h)) (reference, the best estimate until 16 Sep 2026)                                                                                                          |
| Tsunami far-field bounds      | events/tsunami/wunnemann.ts         | A_up = min(0.28 R_w, h) R_w/r ; A_low = min{A_r, A_c}, A_c = 0.06 min(R_w/3, h)(5R_w/r)^q_c                                                                                                                                    | Wünnemann et al. 2010 eq. 7–8, 9b/10b                                                         | envelope                                            |
| Inland-impact sea coupling    | simulate.ts (tsunami block)         | reach = max(R_rim, R_w, r_ejecta 1 m); f_sea = min(1, max(R_rim, R_w)/d)                                                                                                                                                       | McGetchin et al. 1973 (r⁻³ ejecta)                                                            | ±factor 2                                           |
| Tsunami propagation seeds     | tsunami/sourcePlacement.ts          | nearest water ≥ 10 m, body ≥ 24 cells, per compass sector, planetary mask                                                                                                                                                      | —                                                                                             | geometric                                           |
| Conventional blast casualties | casualties.ts                       | 20/3/0.5/0.05 % at ≥12/5/2/1 psi, no flash, no mass fire, later deaths 2 % of the injured                                                                                                                                      | Glasstone & Dolan 1977 Table 12.38 (direct-blast lethality); rates are project values         | ×3                                                  |
| Blast casualties              | casualties.ts                       | Σ pop(band) · m ; m = 98/50/5/0 % at ≥12/5/2/1 psi                                                                                                                                                                             | OTA 1979 table 2                                                                              | ±factor 2                                           |
| Shaking casualties            | casualties.ts                       | ν(S) = Φ(ln(S/θ)/β), θ and β from the country's PAGER fit (252 of them; median 14.57 / 0.205)                                                                                                                                  | Jaiswal & Wald 2010 (PAGER)                                                                   | 5–95 % band                                         |
| Pyroclastic casualties        | casualties.ts                       | 0.9 · pop(runout) + 0.9 · sector/360 · pop(blast annulus)                                                                                                                                                                      | Auker et al. 2013                                                                             | 50–100 %                                            |
| Burn casualties               | casualties.ts                       | exposed 25 % (10–50) × mortality 50 % (30–80) inside the 3rd-degree radius, on the blast survivors                                                                                                                             | Glasstone & Dolan 1977 ch. XII                                                                | ×2–3                                                |
| Thermal horizon               | casualties.ts, effects/blastWave.ts | d = R⊕ · arccos(1 − R_f / R⊕); R_f = 0.002 · E^(1/3) impact, 2 · 100 · W^0.4 ft ≈ 61 · W^0.4 m nuclear                                                                                                                         | Collins et al. 2005 Eqs. 32\*, 37\*; Glasstone & Dolan 1977 §2.127                            | geometry                                            |
| Mass-fire casualties          | casualties.ts                       | 30 % (10–80) of the survivors inside the firestorm sustain radius                                                                                                                                                              | Glasstone & Dolan 1977 ch. VII; Postol 1986                                                   | ×3                                                  |
| Later deaths                  | casualties.ts                       | 30 % (10–60) of the prompt injured, first day to first month                                                                                                                                                                   | OTA 1979 ch. II                                                                               | ×2–3                                                |
| Explosion waves               | events/explosion/underwaterBurst.ts | H·R = 40 500·W^0.54 ft² in deep water, 150·d_w·W^0.25 ft² in shallow; T = 14.1·W^0.144 s; A = H/2; held inside max(bubble radius, Miche breaking radius)                                                                       | Glasstone & Dolan 1977 §6.119–6.121; Miche 1944                                               | ±35 %                                               |
| Dispersion in the veil        | tsunami/dispersion.ts               | D = (4π²/6)·r·h²/λ³; A ×= (1 + D)^(−1/2), so 1/√r near and 1/r far                                                                                                                                                             | Kajiura 1963; Watada et al. 2014; not on an explosion's 1/R wave                              | ×2                                                  |
| Tsunami casualties            | tsunamiCasualties.ts                | H = √(A · min(R, A)); X = 0.06 · H^(4/3) / n², n = 0.03 (≤ 10 km); people = land density × X × coast; ν(h) = Φ(ln(h/θ)/β), h = H/2, θ = 8 m unwarned → 16 m warned by arrival, 4 m high, β = 0.8                               | Koshimura et al. 2009; Jonkman et al. 2008                                                    | ×3                                                  |
| Casualty sweep                | casualtyTimeline.ts                 | deaths(t) = Σ deaths(band) · swept-area fraction at t; t(r) from the shock integral, r/3.5 km/s, r/30 m/s, r/400 m/s                                                                                                           | Kinney & Graham 1985; Dziewonski & Anderson 1981; Kieffer 1981                                | timing only                                         |
| Tsunami arrival time          | tsunami/fastMarching.ts             | eikonal `\|∇T\|² = 1/c²`, c = √(gh), or the group velocity of an explosion wave's period                                                                                                                                       | Sethian 1996                                                                                  | ±15%                                                |
| Linear waves of a period      | tsunami/linearWaves.ts              | ω² = g·k·tanh(k·h); c_g = n·ω/k, n = ½(1 + 2kh / sinh 2kh); shoaling A ∝ c_g^(−1/2)                                                                                                                                            | Lamb 1932 §228–237; Fenton & McKee 1990                                                       | exact                                               |
| Tsunami shoaling              | events/tsunami/propagation.ts       | A_s = A_d (h_d / h_s)^¼                                                                                                                                                                                                        | Green 1838                                                                                    | ±25%                                                |
| Tsunami runup                 | events/tsunami/extendedEffects.ts   | R = 2.831 d √(cot β) (H/d)^(5/4)                                                                                                                                                                                               | Synolakis 1987                                                                                | ±30%                                                |
| Landslide wave, above water   | effects/impulseWave.ts              | a₀,c₁ = 0.2·P^0.5·(b/h)^0.75·cos(6α/7)^0.25·h; P = F·S^0.5·M^0.25·cos(6α/7)^0.5; V_s = √(2gΔz(1 − tan δ·cot α))                                                                                                                | Evers et al. 2019 (impulse wave manual, 2nd ed.), held to its own spreadsheet (rules 162–167) | its experiments; the panel names each limit outside |
| Submarine landslide tsun.     | events/volcano/tsunami.ts           | η₀ = K·(γ/γ_ref)·V^(1/3)·sinθ, γ = ρ_s/ρ_w − 1                                                                                                                                                                                 | Watts 2000 (inspired); K set on unsourced targets, see card                                   | ±factor 2                                           |
| Atmospheric profile           | atmosphere/ussa1976.ts              | U.S. Standard Atmosphere 1976                                                                                                                                                                                                  | NOAA-S/T 76-1562                                                                              | ±5%                                                 |

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

### GeoClaw runs here, and the first row of T1 (19 September 2026)

T1 asks for the far field held to GeoClaw on real bathymetry, at the same DART
records. The standing said "pending: GeoClaw has been run only over a flat
ocean", and the reason was simpler than it sounded: GeoClaw did not run on this
machine at all. It does now, and two things in `docs/GEOCLAW_SETUP.md` were
wrong rather than anything in GeoClaw.

`pip install clawpack` is not enough: the 5.14.0 wheel carries the Python
tooling and not one `.f90`, not one Makefile, no `examples/`. And the Fortran
**truncates file names**: with the tree at a 105-character scratch path the
dtopo path was cut mid-filename, `xgeoclaw` exited at once, and it left a
`_output/` full of `.data` files, a zero-byte `fort.amr` and no solution at all
— while printing "Missing dtopo file" about a file that was plainly there. A
ten-character symlink fixed it. Both are written down now, with the truncated
message they print.

**The committed fixture reproduces on a second platform.** `maule-2010.json`
was computed on WSL2 with gfortran 11.4 on 29 April; the same example on macOS
with gfortran 16.2 gives a crest of 0.1785 m at DART 32412 against the
fixture's 0.178, and a peak time of 11 984 s against 11 984 — the same second.
Two compilers, two architectures, three digits.

**And the first row of T1, which is one row and not T1.** Feeding our own
far-field law the example's own subfault — strike 16°, 450 × 100 km, 15 m of
slip — and carrying its 1 000 km amplitude out to the buoy on the veil's own
spreading exponent:

|                            | amplitude at DART 32412                      |
| -------------------------- | -------------------------------------------- |
| Nimbus, toward the buoy    | 0.2385 m                                     |
| GeoClaw on real bathymetry | 0.1785 m — we are **1.34×**                  |
| the DART record itself     | 0.130 m — we are 1.83×, **GeoClaw is 1.37×** |

The directivity is what makes that comparison honest rather than flattering:
the beam factor toward that bearing is 0.463 and the buoy sits past the
coherent lobe, so the peak across the fault — 0.5587 m — would have read 3.1×
the reference. Taking the peak where the receiver is not is how a model looks
worse than it is, or better; here it was worse.

One row is not T1, which asks for the median over the records with a σ. What
this row says is that the law is within a third of the reference where the
reference is within a third of the buoy, and that the machinery to read the
rest now exists.

### What a flow covers, which is what the field predicts (19 September 2026)

The globe was made to draw a lahar's reach on 18 September, because the model
published it and the picture said nothing (B-054). Drawing it as a filled disc
turned out to be the next defect, and a large one: a lahar of 5 × 10⁷ m³ runs
42.1 km by our law, and a disc of that radius covers 5 576 km² where the
field's own relation gives **27.1 km²**. Two hundred times the ground.

The source was already in the scratchpad, downloaded on 16 September and never
opened: Griswold & Iverson (2008), USGS SIR 2007-5276. Its Table 6 gives, for a
fixed 2/3 slope, the maximum inundated cross-section A and the total inundated
planimetric area B of a flow of volume V — (0.05, 200) for lahars, (0.1, 20)
for non-volcanic debris flows, (0.2, 20) for rock avalanches — and its Appendix
A carries the 207 events behind them.

Two things came out of reading it. The field **publishes no runout length**:
LaharZ does not predict a distance, it fills a valley from a DEM until the
accumulated area reaches B. And our landslide module already computes
`characteristicArea = V^(2/3)`, calls it "cosmetic… not consumed downstream",
and it is the field's own variable missing only its coefficient.

Under rules 202 to 207 (`validation/inundationAreaRules.ts`, pushed before
anything of ours was scored), a lahar now publishes B, A and the swath width
the area and the runout imply — 640 m for that lahar. The extraction of
Appendix A was verified against the report's own counts (64 debris flows with
50 cross-sections and 44 areas, 143 rock avalanches with 142 areas; thirteen
rock avalanches carry a cross-section where the report says twelve, declared
and not tidied away), and the laws were re-derived from it as a check on the
transcription: 0.219·V^0.587 against a published 0.22·V^0.59, 10.17·V^0.731
against 10·V^0.73.

The globe draws the reach **unfilled** now. Rule 203 had proposed a ribbon of
the swath width and rule 207 forbids it in the same breath, because a ribbon
needs a direction and the direction is the valley's, which this project does
not compute. An outline claims only that a valley can carry the flow that far;
the ground is printed beside it as an area.

The band, measured on the 207 events and declared in sample: σ(log10) 0.32 to
0.44, a factor of 2.1 to 2.8 at one sigma, bias within 7 % of one. The spread
of the relation, not a validation of it.

**V4 stays open, and the energy cone says why.** ECMapProb was run offline on
its own Vesuvius topography with the distribution its example carries: median
reach 4.11 km, median inundated area 37.7 km². Our model gives 13.57 km for
the same volcano from its volume scaling and 88.39 km from the energy line,
and the 79 CE currents reached Pompeii at about 9 km with deposits beyond 15.
The three numbers straddle the record, and the comparison is dominated by one
parameter: H/L, which the energy cone takes and we do not have. Setting it
from an eruption's volume is what Aravena et al. (2022)'s calibration
strategies are for, and it is a round of its own.

One more thing the reading turned up, of the same family as the report defects
of 18 September: the page printed two reaches for one flow, six and a half
times apart, the first labelled "PDC runout (Sheridan H/L = 0.1)" for a
relation that is the project's own volume scaling with no H/L in it — its own
citation says so — and the second with no hint that the module calls it an
order-of-magnitude upper bound. Both labels now say what they are.

### What the globe draws, against what the model said (18 September 2026)

The report page had been read and the two defects it showed were closed. The
globe had not: `scripts/benchmark/globe-audit.ts` reads the geometry the
renderer hands to Cesium — every ellipse's axes, centre, rotation and caption,
and every contour polygon's vertices — for the same thirty scenarios, through
the `?probe` hook that was put in the code for exactly this and had never been
called.

Checked, on each contour that carries a published number: that the radius drawn
is the radius published, that the caption states it, that the ring is centred on
the event, that the drawn order is the order of the radii, that nothing is drawn
with no number behind it and no number is left undrawn. For a great earthquake,
whose shaking is a stadium around the rupture rather than a disc about the
epicentre, that **every vertex** of the polygon lies the contour's own radius
away from the rupture rectangle.

151 ellipses and 6 polygons were drawn across the thirty; 64 of them carry a
number, and all 64 carry it correctly. Nothing was found.

Three things were reported and were the instrument, not the product, and they
are written down because they are the reason the zero can be believed: an
English caption's thousands comma read as a decimal point, which accused five
correct captions; ellipses read and polygons not, which called three megathrust
stadiums missing when they were there; and the nearest _vertex_ taken for the
nearest point of the boundary, when a stadium has vertices only at its four
corner caps — that one called eight correct contours twice too wide.

What this does **not** cover, and must not be read as green. A landslide draws
no contour that carries a published radius: zero of its five scenarios were
compared, so the globe's landslide picture is unmeasured. Of a volcano only the
pyroclastic ring was read; the ash blanket and the lahars are polygons bent by
wind and valleys and were not. The wave's amplitude veil is a second
calculation with a test of its own (`tsunami/fieldScalarAgreement.test.ts`), and
the isochrones are contours of the solver's own arrival field. Colour, fill and
animation are not read at all.

Two things hold by construction and were confirmed by reading the code rather
than the screen: the rings drawn and the rings the dead are counted in are the
same fields — `blast.overpressure5psiRadiusHob` for a burst, `damage.*` for an
impact — and the counter that climbs with the front is tested to end on the
model's own total, band by band.

**The second pass, over the two families the first left unmeasured.** The
landslides had been compared on nothing and the volcanoes on one ring, so the
audit was taught what those two draw: an ash plume's ellipse against the
downwind range and crosswind half-width that shape it, the dashed 1 mm isopach
against the area the advected footprint publishes, the column beacon against
the plume height, the wave cavity against the disc each family's wave leaves
from, and the pyroclastic and lahar reaches against their own runouts. 94
contours now carry a number and all 94 carry it correctly — up from 64, with
every family represented.

It found two defects, and both are the same shape as the report's were: the
picture said something the numbers did not.

- **B-053, the disc the wave leaves from.** The globe drew an earthquake's
  wave source at a quarter of the rupture length while the wave was seeded
  from half the down-dip width — the value `extractTsunamiMeta` moved to on 9
  September, measured at DART 21413. The renderer had kept its own copy of the
  old expression, with a comment beside it stating that the two were the same
  number. For a Mw 9.2 the circle on screen was 201 km and the source 111 km.
  One function is read by both now, and a test pins the ring, the veil and the
  solver's seed to it.
- **B-054, the lahar nobody drew.** The model publishes a lahar's reach, the
  report prints it, the panel prints it with its citation — and the globe drew
  nothing: forty kilometres of debris flow, and an eruption on screen with no
  mud in it. It could stay invisible because `scene/visualContracts.ts`, the
  file that lists what every shape on the globe is and whose own header says
  its ids are there "so a runtime audit can verify each entity was added", had
  no entry for the lahar — and nothing in the repository imported the
  contracts at all. Thirty-four contracts, no reader. The lahar now has its
  ring, its contract and its captions, and `scene/visualContracts.test.ts`
  reads the contracts in CI: every captioned contour has a caption in both
  languages, every hazard a volcano publishes has a contract, and the two
  volcanic runouts state out loud that their circle is a placeholder for a
  flow that follows a valley.

Two shapes on that list are worth a reader's caution, and the contracts say so
rather than hiding it: the pyroclastic reach and the lahar are **circles about
the vent**, while both flows follow valleys. The reach is the model's; the
shape is not the mountain's.

**And one the audit found that is not the globe's at all: the wave did not
cross the antimeridian.** An «+8 h» isochrone carried a single vertex, one of
199, at longitude −180.00 where the solver's own field says forty hours — and
the same vertex, in the same place, on a second scenario. Following it down:
`tsunami/fastMarching.ts` walked its neighbours with `j + 1 < nLon` and
`j - 1 >= 0`, so the planetary raster was a wall at ±180° and a front reached
the other side only by going the long way round the globe. On a uniform ocean
of 4 000 m, source at 0°N 170°E, the model read 1.41 h at 179°E against the
1.40 the arc gives — and **30.31 h at 179°W against 1.72, seventeen times
late**. Two degrees of longitude, thirty hours.

It is fixed (B-055), under rules 197 to 201 of `validation/datelineRules.ts`,
written and pushed before anything was measured. The march wraps where a grid
spans the globe and keeps its edges where it does not, and the edge meridian —
which the raster holds twice — is finalised as the one place it is. That second
part was not in the first cure: the guard caught it, the hour line at the seam
still sitting 2.4 minutes off its own hour because the two columns had marched
there from opposite sides. Now the uniform ocean reads a flat 0.28 % everywhere,
the marcher's own discretisation, the same on both sides of the dateline.

**What it cost, declared:** the run-up set of rules 102 to 105 propagates every
event on that mosaic, so it was read again, before and after, over the same
2 468 bins of 64 events.

|                  | bias   | σ_ln  | within ×2 |
| ---------------- | ------ | ----- | --------- |
| through the wall | 3.162× | 1.365 | 23 %      |
| with it closed   | 3.685× | 1.354 | 22 %      |

T2 was not met before and is not met after, and **the headline number got
worse**. That is the interesting part and not a footnote: the wall was
cancelling part of an error the model already had. A wave that reached a far
Pacific coast the long way round had spread over a far longer path and arrived
smaller, which flattered a model that runs high. Closing the seam removes a
cancellation, not an accuracy — the arrival times are right where they were
absurd, and the heights are as wrong as they always were, one sixth more
visibly. Which events moved says the same thing: 27 of the 64, every Atlantic,
Mediterranean and Indian-Ocean one, do not move by a thousandth; the ones that
move are Pacific without exception, Andreanof by a factor of two.

Still open from that round, and named in rule 201: the poles. The same walk
stops a front at 85°, and no isochrone of the thirty scenarios reaches far
enough to show it. It was measured rather than left as a worry: on the same
uniform ocean a front from 80°N 0° reaches 80°N 180° in 3.54 h where a path
straight over the pole would take 3.12 — **1.1×**, against the 17.7× the
dateline cost — because the raster reaches to 85° and the front goes round
inside that band. The cap it cannot enter is 0.38 % of the Earth's surface,
under permanent ice. Real, and small: which of the two it was is exactly what
a measurement is for.

What the second pass leaves declared and unmeasured: a landslide's own body is
not drawn — the globe shows its wave, not the slide — which the audit counts
as a silence on all five of its scenarios rather than as coverage. And three
of the harness's own mistakes are recorded with the round, because they are
why the zero can be believed: the cavity demanded of earthquakes that raise no
wave, a reading taken before the ring cascade had started (a ring begins its
growth at a millimetre, so "every ring is positive" was true before anything
moved), and thirty scenarios sharing one page, which left the cascade of a
later scenario unstarted and read a millimetre where the model published three
hundred metres. The audit now opens a page per scenario and accepts a reading
only when two of them agree and no ring is still at its starting millimetre.

### Two things thirty scenarios found, and how they were closed (18 September 2026)

Thirty scenarios were opened by link on the application's own report page and
read one by one (`scripts/benchmark/report-sweep.ts`). Six defects came out.
Four were fixed the same day and carry rows B-044 to B-050. Two were left open
because each moved numbers a rule had already read; they were closed that
evening, with their rules written and pushed first (`af73931`).

**An earthquake's wave crossed the ocean at the depth of its own epicentre**
(B-052, rules 187 to 191 of `validation/basinDepthRules.ts`).
`simulateEarthquake` passed `waterDepth` — the water over the source, the
number that says whether the seafloor lifts any water at all — into the tsunami
module as its `basinDepth`, and that depth carries the celerity, the travel time
to 1 000 km, the dominant period and the dispersion of the far-field rows. A Mw
9.0 on an eighteen-metre shelf reported 1 000 km in 20 h 54 min, which is
13.3 m/s: the speed of a wave in eighteen metres of water, not of one crossing
an ocean. The product did not believe it itself — the globe's solver was handed
4 000 m for the same event and read the real bathymetry from there, so the
picture and the row beside it disagreed.

The path now has its own input. The source's depth keeps the trigger; the store
passes the median sea within 1 000 km of the source from the planetary mosaic;
a caller who names nothing gets the 4 000 m the module always defaulted to,
which is what the globe was already using. The result publishes the depth it
travelled on and the report prints it, so a reader can see which ocean the
travel time is about.

What it is worth: against the 151 deep-ocean records BM-05 kept, whose crest
times bound a wave's speed from below, the 4 000 m default has a median ratio
of 1.011 and is certainly too slow on 47.7 % of them — an estimate sitting on
the records. The law removed here, on the shelves the sweep found, has a median
ratio of 0.068 at 18 m and is certainly too slow on **every** record; 0.124 at
60 m, 0.226 at 200 m. Nothing was tuned on any of it: the default was 4 000 m
before the reading and after it.

**The intensity at the epicentre and the rings did not agree** (B-051, rules 192
to 196 of `validation/epicentralIntensityRules.ts`). The rings are drawn by the
law rules 17 to 19 chose, or by the interface and intraslab models of rules 36
and 67, each inverted for the acceleration Worden et al. 2012 puts under an
intensity. The epicentre was Joyner & Boore 1981 at distance zero, without a
site term and without a depth — that function takes a magnitude and a distance
and nothing else. So a Mw 7.5 three hundred kilometres down printed MMI 9.3 at
its epicentre and drew no MMI VII ring anywhere, and a Mw 9.0 printed 10.7 with
no MMI IX ring.

Every one of those inverses already computes the number the report wanted: each
begins by evaluating its own law at distance zero and returns a radius of zero
when that value is below the threshold. The epicentre is now that value. The
deep event reads 5.0, the Mw 9.0 reads 8.6 with an MMI VIII ring and no IX, and
over 224 scenarios — seven magnitudes, eight depths from 5 to 300 km, three
fault types, and an interface at each magnitude and depth — a ring of intensity
k exists exactly when the epicentre reaches k. No ring radius moved.

What it is worth, on the 1 100 atlas events that carry a ShakeMap peak
intensity: mean model minus map +2.14 → **+1.96**, σ 1.08 → 1.12, and on Mw ≥
7.5 +2.85 → **+1.78** with the share within one intensity unit going from 9.2 %
to 20.0 %.

Two things that reading does not say, and they matter more than the numbers.
The atlas holds no event deeper than 71 km, so the slab law — the case the
defect was loudest on — is not exercised by it at all. And a bias of +2 is not
a model reading two units hot: the worst rows are Tonga, Fiji, Kermadec and the
Azores, epicentres in open ocean where a ShakeMap's peak is the intensity at
the nearest land while the model's is at the epicentre. Split on the elevation
the atlas read under each epicentre, it is +1.19 on the 491 events on land and
+2.58 on the 609 at sea. **That split is a diagnostic and not a score**: it was
found after the reading, by looking at which rows were worst, and rule 195
declared the whole set.

**Still open, and named so it is not lost again.** On land the model's
strongest shaking reads about one intensity unit above the map's. The rings are
drawn in Joyner–Boore distance, and a point source's own distance above itself
is zero unless rule 51's averages are switched on, which they are not by
default. Whether turning them on closes that unit is a question for a round
with its rules written first; asking it now would be choosing a law after
seeing a set. Open too, from the other round: the reference depth the globe's
veil shoals from is a constant 4 000 m for every earthquake, where Green's law
wants the water over the rupture, and moving it moves the run-up rule's rows.

### What the toll's band carries, and what it left out (18 September 2026)

`uq/tollBand.ts`, `validation/tollBandRules.ts` (rules 182 to 186). Since 14
September the printed band is a predictive interval: draw the scenario a few
hundred times from the scatter the literature publishes, run each draw through
the plan builder the application uses, and report the fifth and ninety-fifth
percentiles. For shaking a realisation also draws the fatality curve's own
published scatter, PAGER's G. For everything else it drew nothing of the kind,
and the module said so plainly — "plans without a published scatter — blast,
pyroclastic — draw nothing, so their bands do not move".

Andrea ran four scenarios through the product on 17 September and caught what
that costs: a ten-megatonne burst over Rome printed 2 800 000 dead with
2 700 000 to 2 900 000 beside it, four per cent either way, on a page whose own
methodology calls the mortality uncertain by a factor of two. The band was
carrying the yield's ten per cent and the height of burst, and nothing else.

The vulnerability table already states what it does not know: every mortality
comes as a triple — third-degree burns 0.3, 0.5 and 0.8; a firestorm 0.1, 0.3
and 0.8; the share of the injured who die later 0.1, 0.3 and 0.6 — and every
band of a plan carries its own ends. A realisation now draws one factor per
hazard from that spread, a lognormal of σ = ln(high / low) / 3.29, the σ a
5–95 % interval of that width would have; a plan with one hazard and no
components draws for the band itself; the shaking still draws PAGER's G and
nothing more, or it would count twice. The central estimate is untouched.

What it moved, on the eighteen rows of the calibration net: no central estimate
moved at all, no band narrowed, and three rows widened — Beirut from ×1.22 to
×4.62, Hiroshima from ×1.22 to ×1.71, Mount St Helens from ×6.10 to ×39.83.
One row, Mount St Helens, goes from outside its band to inside it. **A wider
band holds more records by construction, so that is recorded and is not a
score** (rule 184); what the band now says is what the model does not know, and
whether it is the right width is a question for a held-out set nobody has.

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

_Corrected on 15 September 2026._ The 0.30 m recorded in the table was
never read from a source: the buoy's own NOAA NDBC file crests at
0.81 m, where the published row reads 0.30 m (0.37×) and the
Saint-Venant route 0.32× (B-034). The two routes still agree with each
other; neither agrees with the buoy. What the law was measured on
instead, nine megathrusts and 113 deep-ocean records, is in "The far
wave against the deep ocean" below.

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

### Which law draws the rings (14 September 2026)

Above Mw 7.5 the tolls held out by rule read 13.85× their record on
Joyner & Boore 1981's rings. Choosing a replacement on those same tolls
would fit the law to the set that found the fault, so rules 17 to 19
(`validation/contourLaws.ts`) were committed before any candidate ran: the
shipped law, Boore et al. 2014 with its fault-type and site terms (tried
on 9 September and reverted then on three tuned rows), and the first
below Mw 7.5 with the second from it. Rule 18 scores each on the ground it
shakes at MMI VII, VIII and IX against the USGS ShakeMaps of the rule set
(370 of its 408 earthquakes have one): half the log of the area ratio,
each area plus 10 km², averaged by magnitude cell. Rule 19 runs the winner
once on the held-out tolls.

| law                 | Mw < 6.5 | 6.5–7.5 | ≥ 7.5 | mean abs. log bias | bands invented |
| ------------------- | -------- | ------- | ----- | ------------------ | -------------- |
| Joyner & Boore 1981 | 2.72×    | 3.48×   | 8.22× | 1.45               | 565            |
| Boore et al. 2014   | 1.70×    | 1.62×   | 3.22× | 0.73               | 424            |
| JB81, then BSSA14   | 2.72×    | 3.48×   | 3.22× | 1.14               | 506            |

On the tolls, bias and inside where there is something to hold:

| law                 | Mw < 6.5           | 6.5–7.5            | ≥ 7.5             |
| ------------------- | ------------------ | ------------------ | ----------------- |
| Joyner & Boore 1981 | 1.69× · 123 of 134 | 0.98× · 108 of 115 | 13.85× · 29 of 34 |
| Boore et al. 2014   | 0.69× · 121 of 132 | 0.23× · 96 of 107  | 1.92× · 32 of 34  |

Its mean absolute log bias is 0.83 against 1.06 and it holds nine records
in ten in every cell, so by rule 19 it is adopted, and the simulator draws
the rings with it.

What the score does not show was read afterwards, and is written here as
such. Most of Boore et al. 2014's margin on the ShakeMaps is the bands it
does not invent: Joyner & Boore painted MMI IX for 95 earthquakes whose
ShakeMaps never reached it, Boore et al. none. Where a ShakeMap does reach
MMI VII, Joyner & Boore draws it at a median 1.26, 0.89 and 1.13 of its
radius from the smallest cell up, and Boore et al. at 0.83, 0.50 and
0.90; at MMI VIII the new rings are smaller still. On the net's anchors
the same shows: no band invented, Kokoxili's 1 700 km² of MMI IX missed,
Northridge's MMI VII at a ninth of its ShakeMap area, and the rings of the
two surveyed crustal events at about half their radii. The middle cell's
tolls, 0.23×, are where that lands. The rings stand on reference rock —
every rule-set row and every preset — while ShakeMaps count softer ground,
and that is the first suspect; a relation for long ruptures and trench
earthquakes is the second.

In the net, eleven of eighteen tolls are now inside: Northridge 13 dead on
1–177 against 57, L'Aquila 40 on 1–4 622 against 309 — a band past the
gate, so ungated as rule 19 says — Tōhoku's shaking 4 505, Gorkha 2 983,
while Amatrice (1 on 0–131 against 299) and Sumatra's shaking fall
outside. Gorkha's browser band now stops at half the measured high end,
past the interpolation gate, and is declared rather than hidden.

### The ground under the rings (14 September 2026)

Rules 17 to 19 chose the rings with every earthquake on reference rock,
Vs30 760 m/s: rule 3 sets no Vs30, and rock is what the simulator takes
for a Vs30 nobody set. The browser does not stand a pick on rock. With no
Vs30 typed in, the store gives the simulator Wald & Allen's (2007) Vs30
of the slope under the epicentre, on the terrain tile the globe fetched
for the pick, so every earthquake figure the harness had printed was for
a simulation a visitor sees only by typing 760. Reading that code turned
up two defects of the browser, fixed first: a Launch that beat the new
pick's tile read its Vs30 off the last pick's, 180 m/s wherever it was
(B-024), and a block of tiles next to the antimeridian ran round the
planet (B-025).

Rules 20 to 22 (`validation/siteVs30.ts`) were committed before any row
ran on other ground, and the sites before any was scored. Rule 20 reads
the browser's Vs30 under the 408 epicentres of the rule set and the net's
12, on the Terrarium tiles the browser would fetch, chosen and resampled
by its own code (346 tiles): a median of 522 m/s, with 215 of the 408
epicentres under the sea, where the slope is the sea floor's. Rule 21
scores three grounds on the ShakeMaps as rule 18 scored the laws, with
Boore et al. 2014 — the browser's slope, rock, and the slope on land with
rock under the sea — keeps the browser's unless beaten by 0.05, and checks
a winner on the tolls as rule 19 checked a law. Rule 22 chooses the law
once more on the ground that stands.

| ground                     | Mw < 6.5 | 6.5–7.5 | ≥ 7.5 | mean abs. log bias | bands invented |
| -------------------------- | -------- | ------- | ----- | ------------------ | -------------- |
| the browser's slope        | 2.28×    | 2.20×   | 3.68× | 0.97               | 469            |
| rock                       | 1.70×    | 1.62×   | 3.22× | 0.73               | 424            |
| slope on land, rock at sea | 2.10×    | 1.81×   | 3.28× | 0.84               | 445            |

On the held-out tolls, with Boore et al. 2014:

| ground                     | Mw < 6.5           | 6.5–7.5            | ≥ 7.5            | mean abs. log bias |
| -------------------------- | ------------------ | ------------------ | ---------------- | ------------------ |
| the browser's slope        | 1.46× · 122 of 132 | 0.33× · 106 of 112 | 1.94× · 32 of 35 | 0.72               |
| rock                       | 0.69× · 121 of 132 | 0.23× · 96 of 107  | 1.92× · 32 of 34 | 0.83               |
| slope on land, rock at sea | 1.34× · 119 of 132 | 0.41× · 100 of 108 | 2.11× · 31 of 34 | 0.65               |

Rock wins on the ShakeMaps by 0.24 and loses on the tolls, 0.83 against
0.72, so by rule 21 the browser's ground stands. On it, rule 22 keeps
Boore et al. 2014 (0.97, against 1.58 for Joyner & Boore 1981 and 1.30 for
the split law). The harness runs every earthquake on the browser's ground
since — the rule sets, the net and the footprint anchors. Held out by
rule, the earthquakes read 0.913× their record (0.56× on rock) with a
scatter of 2.44, and the band holds 258 of the 278 records it has
something to say about (93 %) — the figures the report's own cell carries
today, corrected here on 19 September 2026 from the 0.90×, 2.42 and 260 of
279 this paragraph was written with, which the regenerations since have
moved. In the net twelve of eighteen tolls are
inside: Northridge 29 dead on 2–415 against 57 (13 on 1–177 on rock),
Kumamoto 198 against 273, Gorkha 5 356 against 8 964, and Sumatra's band
for the shaking alone now reaches its record. The footprint anchors are
centred at 0.90 in radius (0.71 on rock) with a scatter of 0.63 (0.82),
and Gorkha's interpolation is back under the gate, its declaration gone.

What the scores do not show was read afterwards, and is written here as
such. The ShakeMaps and the tolls pull opposite ways because the score on
the ShakeMaps is mostly bands the model paints where the map holds none:
190 of the 370 maps hold no ground at MMI VII on their low-resolution grid,
and the rings draw a VII band about every one of them, on rock and on the
browser's ground alike. Softer ground widens those bands, which the score
counts against it, and widens the rings where the maps do reach MMI VII,
which is where the dead are: there the rings now run at a median 1.07, 0.66
and 1.01 of the map's radius by magnitude cell, against 0.82, 0.50 and 0.90
on rock. Why the model paints VII about those 190 is not established. Half
of their epicentres are at sea; for some the map's peak is VII in less than
a cell; and the rings take no account of the source's depth, but the
shallow earthquakes among the 190 get a ring as surely as the deep ones.

The third ground, the slope on land and rock under the sea, beat the
browser's on the ShakeMaps (0.84 against 0.97) and on the tolls (0.65
against 0.72, holding nine records in ten in every cell): it would have
passed both tests. Rule 21 checks only the ShakeMap winner on the tolls,
and the winner was rock. It is not adopted, because adopting it now would
be choosing on the result; a rule that asks for it has to be tried on
earthquakes these rules have not seen.

### Whether the rings carry depth (14 September 2026)

Boore et al. 2014 draws the rings in the Joyner–Boore distance with a fixed
4.5 km near-source term and no depth of its own, so the depth a scenario
sets changes nothing it shakes, and on rule 11's maps the rings paint MMI
VII about every one of the 190 earthquakes whose ShakeMaps hold none.
Rules 23 to 26 (`validation/depthRules.ts`) were committed before any
earthquake they name was read, and the earthquakes before any candidate was
scored on them. The set is every M ≥ 6 earthquake of 2008 to 2025, no deeper
than 40 km, that USGS holds a ShakeMap for and rule 11 did not take: 1 539
listed, 1 152 once rule 11's are taken out, 809 with a low-resolution MMI
map (342 without one, and one event ComCat no longer serves). 805 of them
are quiet — no NCEI record within two minutes and 200 km, so fewer than ten
dead by the database's criteria — and 152 of their maps reach MMI VII, ten
MMI VIII, none IX. The candidates are the law in place and Allen, Wald &
Worden's (2012) intensity prediction equation in hypocentral distance, on
its own and below Mw 7.5 only; its coefficients were read from OpenQuake's
implementation, not from the paper.

| law                               | Mw < 6.5 | 6.5–7.5 | ≥ 7.5  | mean abs. log bias | bands invented | bands missed |
| --------------------------------- | -------- | ------- | ------ | ------------------ | -------------- | ------------ |
| Boore et al. 2014                 | 3.11×    | 2.88×   | 44.55× | 2.00               | 1 374          | 0            |
| Allen et al. 2012, hypocentral    | 3.17×    | 3.76×   | 71.26× | 2.25               | 298            | 18           |
| Allen et al. below Mw 7.5, BSSA14 | 3.17×    | 3.76×   | 44.55× | 2.09               | 298            | 18           |

Boore et al. 2014 is not beaten by 0.05, and stays; by rule 25 nothing else
runs on the dead. On the same earthquakes its central toll reaches ten or more
for 2.9 % of the quiet ones. On rule 18's 370 maps, which decide nothing, the
three read 0.97, 0.97 and 0.95.

What the score does not show was read afterwards, and is written here as
such. Rule 18's score averages the log radius ratio over the pairs where
either side reaches a band, so a relation that rightly draws nothing earns no
credit for it, and one that draws a band where the map holds none is only
counted where it draws. On these quiet earthquakes that is most of the
difference: Boore et al. 2014 paints 1 374 bands where their maps hold none
— MMI VII and VIII about nearly every earthquake of Mw 6 — and the
hypocentral equation, which reads the depth (a median of 16.5 km here), paints
298 and misses 18 the maps do hold. Where it does draw, it draws wider than
the maps, and its mean over those few pairs is no smaller. The cell above
Mw 7.5 holds two bands of one earthquake, the South Sandwich Islands Mw 8.1
of 2021, whose map peaks at 6.5; averaged as one of three cells, those two
bands carry most of both laws' mean. None of this is acted on: choosing the
hypocentral equation now would be choosing it on a result already seen. A
score that credits a band rightly left blank — hits, misses, false alarms and
correct silences at each threshold — has to be written before it is tried,
and tried on earthquakes these rules have not read: the 342 whose maps carry
no low-resolution coverage, or those after 14 September 2026.

### The rings against their authors' code (14 September 2026)

A relation can be cited correctly and coded wrongly, and the brackets
beside Boore et al. 2014 in `attenuation.test.ts` would not see a
coefficient off by a few per cent. The OpenQuake Engine keeps, as test data,
the values David M. Boore's Fortran program gives for the relation (July
2014), and those of an independent Matlab implementation of Allen, Wald &
Worden's 2012 intensity equation. At the same inputs ours agree to within
0.0005 % over 450 accelerations with the style of faulting and 150 without —
magnitudes 3 to 8, Joyner–Boore distances to 100 km, Vs30 from 200 to 760
m/s, the non-linear site term included — and to within a millionth over the
intensity equation's 21 medians and 21 standard deviations
(`validation/ringVerification.ts`). OpenQuake's own tests allow two per cent
and a tenth of one; ours allow a hundredth. The same tables show what the
band's one ground-motion residual leaves out: σ is 0.6051 wherever the
relation is used for the rings' earthquakes of Mw 5.5 and above within 80 km
on firm ground, but 0.80 at magnitude 3 and 0.55 on ground of 200 m/s.

### Against the program the impact equations came from (14 September 2026)

The impact pipeline cites Collins, Melosh & Marcus (2005), and their
equations have an implementation the authors run online, the Earth Impact
Effects Program. A formula can be cited correctly and coded wrongly, and a
custom scenario reaches inputs no historical event checks, so the program
was asked for its answers on a grid fixed before any of them was read —
seven diameters from 10 m to 10 km, speeds of 12, 20 and 50 km/s, angles
of 15, 45 and 90°, densities from ice to iron, sedimentary and
crystalline targets, five distances: 83 impacts on land, two of which the
program itself fails on (`scripts/eiep-reference.py`,
`validation/eiepReference.ts`). Water targets are left out: the program
puts the crater on the sea floor, the simulator models the water cavity.

Where both codes bring a body to the ground whole, at no less than 95 %
of its entry speed — 34 impacts — the energy agrees within 3 %, the
transient and final crater diameters within 4 %, the ejecta blanket's
edge within 2 % at every thickness from 1 cm to 100 m, and the fireball
within 2 %: the program prints two or three figures, so that is its
rounding. `eiepComparison.test.ts` gates exactly that and nothing more.

Elsewhere they part, and each part has a name:

- **The atmospheric entry.** The simulator's entry is a classifier tuned
  on Chelyabinsk and Tunguska: the breakup altitude of Collins et al.'s
  Eq. 11, a burst two scale heights lower less a logarithmic correction
  for size, and a share of the energy reaching the ground that is at most
  0.3 once a body breaks up. The program integrates the pancake equations
  (their Eqs. 11–20). Of 57 impacts the program brings to the ground, the
  simulator bursts 21 in the air; a 100 m stony body at 20 km/s digs a
  1.6 km crater in the program and none here, and a 1 km body at 50 km/s
  delivers 95 % of its energy to the ground there and 30 % here. This is
  the largest error the grid found, declared on the validation page, and
  the next change to the impact pipeline.
- **The strength.** The simulator takes a strength class — 1 MPa unless a
  class is chosen, which the custom panel's taxonomy does — and the
  program a strength that grows with density, so an iron body typed in by
  density alone breaks up three times higher here. The stony bodies break
  up about an eighth lower, 1 MPa against the program's 0.3.
- **The complex crater depth.** The simulator follows the paper's Eq. 28,
  0.4 D^0.3, and the online program prints about three quarters of it for
  every complex crater of the grid. The published relation stays until
  the authors say which they intend.
- **The air blast.** The simulator reads Kinney & Graham's free-air fit on
  the energy that reaches the ground, the program the scaling its authors
  give; across the grid the two part from a fifth to seven times. Neither
  is a measurement of an impact's blast, and choosing between them wants
  one.

#### Adopted the same day: Collins et al.'s entry

The first of those was an error, not a design (B-023), and the equations
it should have been are in the paper the pipeline cites. The entry now
integrates them: the drag on a whole body (Eq. 8), the breakup altitude
(Eqs. 11–12), the spreading pancake and its airburst altitude (Eqs. 15–18)
and the speed its swarm strikes the ground at (Eqs. 17, 19, 20), with
Collins et al.'s constants and, where no strength class is chosen, their
strength from density (Eq. 9). The crater is dug at that speed. Before a
line of it went into the simulator the equations were transcribed and run
on the grid, and they reproduced the program in every outcome; in the
simulator, every one of the 81 impacts bursts or strikes as the program
says and digs the same kind of crater, the breakup altitude within 1 %, the
burst within 5 %, the speed at the ground within 4 % and the craters within
4 %.

On the two bolides the tuned classifier had been fitted to, nothing was
refitted: Chelyabinsk's preset (17 m, 19 km/s, 18°, 2 MPa) bursts at
29.0 km, against the 27.0 km Popova et al. (2013) measured and the 22.1 km
the classifier gave; Tunguska's, with its strength from density, at
9.8 km, where Chyba et al. (1993) put the burst at about 8. Meteor Crater's
iron breaks up at 9.3 km and strikes as a swarm at 10.9 of its 12.8 km/s,
digging 1.45 km against the 1.2 km observed, closer than the 1.55 km
before. What moved further from its record is downstream: the altitude
factor on an airburst's shock was fitted when Chelyabinsk burst at 22 km,
and at 29 km it carries the 0.5 psi ring to 183 km, against the 96 km it
drew before and the 120 km to which Popova et al. model window damage. The
factor is a declared gap and stays unrefitted.

### The airburst's blast, the program's own (15 September 2026)

`src/physics/effects/airburstBlast.ts`. The benchmark campaign
(`docs/BENCHMARK_REPORT.md`, BM-02) measured what the altitude factor
did: an airburst's 1 kPa ring 7.3 times the Earth Impact Effects
Program's, its overpressure ten times the program's at 100 km, and 144
of 240 rings where the program has no blast. The factor — a
surface-burst reach times (P₀/P(h))^(3/5), capped at 15 — had a fitted
exponent and a cap with no source (B-032).

It is replaced by the air blast the program uses, as its authors publish
it. The source is still, at the burst altitude, and is given the larger
of the energy the body keeps there and the energy it has handed to the
air by then (Collins et al. 2017). Scaled to one kiloton (Collins et al.
2005 Eq. 57), the overpressure near the point under the burst is the
regular-reflection fit of 2017 Eq. 7, which replaced 2005 Eqs. 55–56
because they attenuated high bursts too fast; beyond the edge of the
Mach region (2005 Eq. 58, which exists only for a scaled burst below
550 m) it is the surface-burst relation with its crossover moved out by
the burst altitude (Eq. 54). The paper's shock-physics runs found a
moving source up to twice as strong within three burst altitudes: the
panel prints that as the upper figure, and the rings and tolls use the
lower. Nothing in it is Nimbus's, and no blast coupling is applied: both
relations are fits to nuclear yields.

The rules were pushed before any check ran (`docs/BENCHMARK_PROTOCOL.md`,
"After the campaign", commit `0a9d418`), with what had been looked at
first: the campaign's 636 point overpressures, used to read how the
program combines those pieces. On them the law reproduces 618 within
1 %; the rest are two bodies whose burst altitude differs by 1.5–3 %
(BM-13) and points near the edge of the Mach region, where the program
blends the two regions in a way neither paper describes and the law
kept the published step (until the amendment below). The checks, `scripts/benchmark/airburst-checks.ts`:

- **Held out, the validation grid.** The 24 airburst rows the program
  printed on 14 September: all 48 values, low and high end, within 1 %
  (median 0.03 %). `eiepComparison.test.ts` gates them.
- **Against the paper's own runs** (Table 2, static source): 0.92× on the
  geometric mean, the median off by a factor of 1.21, under the ln 1.25
  flag — ground-zero overpressures from 0.72× (0.5 Mt at 21.5 km) to 1.24×
  (50 Mt at 11 km). One threshold is missed: the runs reach 20 kPa out to
  4.5 km for 5 Mt at 14 km, and the law, peaking at 17.6 kPa, does not.
  The upper figure against their moving source: 1.00×, the median off by
  1.18.
- **Two events** (class C, flagged outside ×2). Chelyabinsk's preset,
  0.33 Mt bursting at 29.0 km with 0.18 Mt in the blast, raises 1.2 kPa
  under the burst: 1 kPa, the overpressure Collins et al. take for window
  damage, reaches 17.6 km against the 56 km radius of the ~10 000 km² over
  which windows broke (0.31×, flagged), and the upper figure 53.9 km.
  Tunguska's, 9.1 Mt at 9.8 km with 7.7 Mt in the blast: 20 kPa reaches
  11.5 km against the 26.5 km radius of the ~2 200 km² of flattened forest
  (0.43×, flagged); 10 kPa, the factor of two the paper allows for terrain
  and the trees' state, 20.1 km (0.76×); the upper figures 20.1 and
  29.4 km. Both flags are declared: a burst on a shallow path spreads its
  energy along a line and damages an ellipse, which Collins et al. say
  wants a line source, and the presets' energies are estimates.
- **Invariants**, the campaign's 5 000 random impacts. Blast rings that
  shrink when the body grows by 1 %: from 1 062 to 177, all in the Mach
  region, where a larger body bursting lower draws a shorter reach at low
  overpressure, as a nuclear burst below its optimum height does (the
  largest example kept, 1.7 %). New: 10 jumps above 5 % for a body 0.1 %
  larger, 2 at the edge of the Mach region — the published step — and 8
  where a ring is born under the burst and grows steeply from nothing.
- **The campaign's IMP track, rerun** (its result files stay as
  measured): the airburst overpressure from 45× the program's to 0.998×,
  97 % within 1 %; the airburst rings from 4.2× to 1.4×, because the
  program's lie where its own printed overpressure is about 26.4, 5.5 and
  1.6 kPa rather than at the 20, 5 and 1 kPa its map labels; and 139 of
  the 144 rings where the program has no blast are drawn by neither.

On the presets, Tunguska's 5, 1 and 0.5 psi rings move from 16.7, 49.1
and 91.4 km to 5.8, 26.4 and 44.2 km (13.1 km for 5 psi at the upper
figure), and Chelyabinsk's from 33.5, 98.3 and 183 km to none. The flash,
a swarm that strikes the ground and the blast of a ground impact are
unchanged.

#### Amended on 16 September 2026: the program does not step

The law above steps from regular reflection to the Mach region at r_m1, as
the papers print it, and the rules said the step was kept. The invariants
of the gold standard then found a body 0.1 % larger whose blast ring jumped
from 33 to 61 km, and the program, asked on it, did not step: it agreed with
the law to 0.3 % out to 40 km and then rose smoothly where the law fell,
the law 41 % below it at 61 km. Fifty printed overpressures on four bodies gave its
passage to seven digits (rule 129, `validation/machBlendRules.ts`): the Mach
relation takes r_x = 290 + 0.65 z₁, not 289, and between r_m1 − 0.00328 z₁²
and r_m1 + 0.00328 z₁² the overpressure is a straight line in range, from the
regular relation at the inner end to the Mach relation at the outer. Where
the line rises it is the knee a burst above the ground draws where the Mach
stem forms. Neither paper prints it.

Rules 130 and 131 were pushed before the program was asked again
(`ef3a2ea`): twelve bodies drawn with a seed, the program's own burst
altitude and yield scale for each, six ranges placed across the blend. The
blend reproduced the program's printed low end on **72 of 72** points,
within 3.5 × 10⁻⁷; the step on 42, missing by up to 43 %. Through
Nimbus's own entry, which departs from the program's through BM-13, the
blend stays within 0.75 % everywhere. It is the default; the step stays
reachable as `published`. No preset moves: Tunguska's rings all lie inside
its regular region, and Chelyabinsk draws none.

#### Corrected the same day: Chelyabinsk's inputs, and no line source

The check that flagged Chelyabinsk ran on a preset that was not the body its
source measured: 17 m of 3.0 g/cm³ at 19 km/s and 18°, 0.33 Mt, where Popova
et al. 2013 give 19.16 km/s at 18.3° from the horizon and derive 19.8 m for
their 590 kt at the 3.3 g/cm³ of the recovered meteorites (B-033). The
correction was written into the protocol and pushed before the preset ran
again (`docs/BENCHMARK_PROTOCOL.md`, commit `7711464`), with the strength
left at the S-type class and nothing else moved. The preset now bursts at
27.1 km, against the 27.0 km observed, releasing 0.59 Mt with 0.30 Mt in the
blast; it raises 1.6 kPa under the burst and still draws no 0.5 psi ring.

Re-run, and not a validation, since the check had been seen: 1 kPa reaches
30.2 km against the 56 km radius of the windows broken over ~10 000 km²
(0.54×, inside the factor of two), and 68.0 km at the upper figure; 500 Pa,
the overpressure Popova et al. take for the edge of the damage, reaches
68.0 km, against the 120 km to which they model it across the path for
520 kt. A comparison not written beforehand, given because it says where the
point fails: in the city, 45 km from the point of peak brightness (their
Table S11), the law gives 0.74 kPa, where Brown et al. 2013 read 3.2 ±
0.6 kPa from the broken windows and 2.6 kPa from the speed of glass shards,
and Avramenko et al. 2014 1.6–1.9 kPa from car exhaust. Tunguska is unchanged.

Why the blast is still a point. The damage was elongated across the path —
about 180 km north to south against 80 km east to west — because a body on a
shallow path deposits its energy along a line. The one analytic model of
that line source, ReVelle's weak-shock cylindrical blast (1974, 1976), is
"largely inapplicable" beneath Chelyabinsk's trail by the account of those
who applied it there, since within one blast radius the ambient pressure
changes by a factor of several (Gi, Brown & Aftosmis 2018); benchmarked on
smaller bolides it stays within a factor of about two of a 3D solver's
footprint areas (their Table 1). The elongated footprint has been reproduced
only by three-dimensional hydrocodes — SOVA (Popova et al. 2013), Cart3D
(Aftosmis et al. 2016), CTH (Brown et al. 2013) — whose authors find the
damaged area set mainly by the total energy and its shape by how the energy
is spread along the path. A line source built here would be a model of this
project's, and none is added. Until this section the project quoted Popova et
al.'s modelled damage as reaching 108 km; their text says 120 km.

### Where a body breaks up: the paper and its program (15 September 2026)

One quantity of the atmospheric entry stayed outside the campaign's
tolerance (BM-13). The Earth Impact Effects Program breaks a 10 m iron body
at 20 km/s and 45° up at 15.9 km and bursts it at 9.18 km, where Nimbus
gives 16.4 and 9.49 km, and it breaks the Meteor Crater body, its strength
taken from its density, up at 10.6 km against 10.8. Both codes cite Eqs. 11
and 12 of Collins et al. (2005).

Every breakup altitude the program printed, for 188 bodies of the campaign
and 81 of the validation grid, is Eq. 11 evaluated on twice the I_f of Eq. 12,
within 0.01 %; every burst altitude then follows from Eqs. 16 and 18 as
printed, within 0.02 %. On the printed I_f the same altitudes part from the
program by up to 3.0 % at breakup and 4.9 % at the burst. Two bodies outside
both grids were predicted on the doubled I_f and then sent. A 3 m iron body
at 20 km/s: 11 360 and 9 573 m predicted, 11 327 and 9 544 m printed (0.3 %,
where I_f = 0.94 makes Eq. 11 steep), against 15 149 and 12 916 m on the
printed I_f. A 1 m stone at 12 km/s and 30°: 47 868 and 45 396 m predicted,
47 866 and 45 395 m printed.

Eq. 11 approximates Eq. 10: the breakup is where the ram pressure on the
speed Eq. 8 leaves the body first reaches its strength. On a sweep of 4 554
bodies that break, Eq. 11 on the printed I_f lands within 40 m of that root
below I_f = 0.9 (the 40 m is 8 km × (1.308 − 1.303), the offset of its
constants at small I_f) and within 280 m above. On twice the I_f it is up to
5.7 km off, and it keeps whole 135 bodies whose ram pressure passes their
strength. The printed equation is the one that solves the paper's physics,
and Nimbus keeps it. Whether the program keeps those bodies whole cannot be
read: it returned a server error for each body the doubled I_f keeps whole
(Sikhote-Alin's preset, two random draws and two probes), as it does for some
bodies that break.

BM-13 is declared, a departure of the reference program from its paper, and
nothing in Nimbus changes. `atmosphericEntry.test.ts` holds the breakup
altitude to the root of Eq. 10 within 50 m, and `eiepComparison.test.ts`
holds the program's altitudes on the grid to the doubled I_f within 0.1 %,
so a change on either side shows.

#### Amended on 16 September 2026: Nimbus follows the program

The paragraph above kept the printed I_f because it solves the paper's
physics. The gold standard was read against the field's own tool the same
day, and the air blast of a ground impact then showed what keeping it costs:
the program reads that blast from Eq. 18's altitude, and a body's breakup moves
it. Its entry parts from the paper in one more place, found on a slow iron
where the ground blast missed by 9 %: Eq. 20's bracket has no −3(l/H)² term,
4 % of the bracket for a body that breaks low. Rules 141 to 145
(`validation/entryProgramRules.ts`) put the program's entry and its ground
blast to sixteen bodies nobody had asked it about, and everything agreed: 60
ground overpressures, 8 airburst ones, 16 breakup and 4 burst altitudes. Nimbus
now takes the doubled I_f and the program's Eq. 20. Where the doubled I_f
would keep a body whole — the program cannot compute it and errs — the paper's
equations are used: that is how Sikhote-Alin's body breaks at 6.0 km and digs
26.7 m, where reading it as whole dug 129 m (rule 145, written after the
adoption's first test run showed it). `atmosphericEntry.test.ts` now holds the
paper's equations, reachable as `EntryEquations` `paper`, to the root of
Eq. 10, and `eiepComparison.test.ts` the model's altitudes to the program's
within 0.2 %. The price is in the invariants: the program's ground blast
weakens at a fixed range as a larger body goes deeper, and 407 blast rings
shrink as a body grows by 1 % where 167 did (see "The invariants after the
campaign's fixes").

### The far wave against the deep ocean (15 September 2026)

`scripts/benchmark/dart-records.py`, `dart-c0.ts`, `dart-c1.py`,
`dart-score.ts`; their outputs in `benchmark/dart/`. The benchmark campaign
found the megathrust crest 0.28× the exact linear solution for Nimbus's own
rupture at 3 000 km (`docs/BENCHMARK_REPORT.md`, BM-05): the law spreads the
wave as a ring from half the down-dip width, where a long rupture keeps its
broadside wave far longer. Which of the two is nearer the ocean is a question
for records, and how to ask it was written down before any was read
(`docs/BENCHMARK_PROTOCOL.md`, "After the campaign: the far wave of a
megathrust", commit `d3a64b0`):

- **Events.** Every thrust in USGS ComCat from 2006 to 2025 of magnitude 7.7
  or more and depth 71 km or less: 30 earthquakes.
- **Records.** Every NOAA NDBC DART file of their years, detided by eight
  constituents fitted over ±3 days outside the event.
- **Models.** C0, the law as it stands. C1, Okada's deformation of a uniform
  slip over Nimbus's own rectangle on the thrust plane, propagated by the
  exact linear solution on a flat ocean, with no coupling factor.
- **Score.** ln(model / observed crest), its median over an event's records,
  and the model whose median over events is nearer zero, by more than ln 1.25.

The first reading of the records (commit `8b0a88a`) kept what a buoy
transmits wrong — values off by metres, 2¹⁵ and 2¹⁴ mm among them, so that
Haida Gwaii 2012 had a crest of 32.5 m at DART 51407 — along with seismic
noise near the source, levels centimetres off the tide prediction, and,
through its coverage rule, almost no far record. The protocol was amended
before either model ran (commit `f31536a`): bad samples screened by
Hampel's identifier, 1-min means low-passed at 3 min, the crest read above
the record's median and at least 2 cm (on days chosen at random, the tide
fit misses the level inside its gap by 1.9 cm at the median), and coverage
asked of the crest rather than of a fixed window, after Davies (2019). Each
of those is a choice, so the crest's floor and the coverage rule were crossed
into four readings, and a model could be chosen only if all four chose it.

All four chose C0.

| Reading                                    | Events | Records | C0, the law       | C1, uniform slip, exact |
| ------------------------------------------ | -----: | ------: | ----------------- | ----------------------- |
| crest bracketed by samples, ≥ 2 cm (first) |      9 |     113 | 1.00× (σ ln 0.44) | 1.38× (σ ln 0.48)       |
| crest bracketed by samples, ≥ 1 cm         |     11 |     139 | 1.27× (σ ln 0.46) | 1.69× (σ ln 0.55)       |
| 90 % of the window sampled, ≥ 2 cm         |      6 |      62 | 1.04× (σ ln 0.30) | 1.34× (σ ln 0.44)       |
| 90 % of the window sampled, ≥ 1 cm         |      7 |      69 | 1.27× (σ ln 0.57) | 1.69× (σ ln 0.61)       |

The factor is the median over events of each event's median ratio; σ is the
spread of those event medians. In the first reading the law reads Kuril 2006
0.92×, Maule 2010 0.87×, Tōhoku 2011 0.73×, Haida Gwaii 2012 0.76×, Iquique
2014 1.61×, Illapel 2015 1.00×, Chignik 2021 2.97×, and Kamchatka 2025
1.33× in July and 1.17× in September. Its records pooled by distance read
0.98× within 1 000 km, 1.18× to 3 000, 1.16× to 7 000 and 0.84× beyond;
C1's read 1.37×, 1.57×, 1.20× and 1.30×. The two readings at 1 cm add Santa
Cruz 2013 and Kermadec 2021, whose crests lie within the tide fit's miss, and
the law reads those two 1.84× and 2.30×.

So the law's fall with distance, measured against a flat ocean and a uniform
slip, is not a fall against the ocean: the flat solution for that source is
too high at every distance, and Nimbus's dispersion factor takes it only to
1.33×. What it lacks — slip that is not uniform, a sea floor that is not
flat, dispersion — is where the difference would come from, and none of that
was measured here. BM-05 is declared with these numbers, Nimbus keeps its
law, and nothing in it was tuned on the records. The scatter between events,
a factor of 1.56, is the size of the law's error on a megathrust's far wave.

**DART 21413.** The one buoy the law had been checked on was Tōhoku's, at
"about 30 cm" credited to Satake et al. 2013 without the paper having been
read; the megathrust uplift factor, 0.6, was set on it, and the far-field
source radius chosen by it. The buoy's file crests at 0.81 m — 0.80 m with
no filter, 0.88 m under a polynomial detide over ±14 h — and the law reads
0.30 m there, 0.37× (B-034). The row is declared, not re-tuned: the nine
events are the law's measure now. C1 misses the buoy too, at 0.37 m, since
21413 lies 29° off the seaward broadside of a 702 km rectangle, on the flank
of the lobe that reaches 2.5 m broadside at the same distance. The protocol's
own illustration, 0.87 m for C1 "24° off the broadside", had been computed
24° off the landward broadside with a dip of 12°, not at the buoy; it decided
nothing, and the script that scored C1 was checked against an independent
rotation of the receiver instead of the fault: 0.378 m against 0.374 at
21413, 0.302 against 0.302 at 51407, 2.525 against 2.525 at 21418.

### People and deaths against PAGER (15 September 2026)

`validation/pagerChain.ts` (rules 31 to 34), `validation/pagerChainRun.ts`.
The benchmark campaign put the simulator's people at MMI VII and above at
0.13 of what USGS PAGER counts on 187 earthquakes, at VIII and above 0.07,
nobody at IX where PAGER counts people, and the central toll at 0.30 of
PAGER's estimate (`docs/BENCHMARK_REPORT.md`, BM-03). Reading both sides
found three causes, none of them a fit, and they were written down before
anything ran (`docs/BENCHMARK_PROTOCOL.md`, commit `6b29669`). PAGER counts
intensity k from k − ½ to k + ½, the banding of ShakeMap's legend, where the
simulator's VII starts at 7.0. The rings convert Boore et al. 2014's median
PGA with Worden et al. 2012's PGA relation, and PGA saturates: the highest
intensity that median reaches is 8.0 to 8.8 for any magnitude on any ground,
so the IX ring is empty by construction. And PAGER's empirical model counts
deaths from V to IX, each bin at its integer intensity, where the simulator
counts them from VII at 7.5, 8.5 and 9.5.

PAGER's chain was built beside the one in place (commit `04d60b2`):
Boore et al. 2014's median PGV, which ShakeMap prefers where it has one,
through Worden et al.'s PGV relation, with the coefficients ShakeMap's code
carries; PAGER's bands and rates; the ground-motion residual of PGV. Against
D. M. Boore's own Fortran values in OpenQuake's test data the PGV agrees
within 0.0005 %. Rule 32 scores each chain's people at and above VII, VIII
and IX, as its own bands count them, against PAGER's; rule 33 adopts PAGER's
chain if that score falls by ln 1.25 or more and it does no worse, by more
than 0.10, on rule 11's held-out dead and on rule 18's ShakeMaps; rule 34
runs the two halves beside.

| Chain                           | People score | Held-out tolls, by cell              | Mean abs. log | ShakeMaps (rule 18) |
| ------------------------------- | -----------: | ------------------------------------ | ------------: | ------------------: |
| In place: PGA, rings at 7, 8, 9 |         1.76 | 1.46× · 0.33× · 1.94× (122, 106, 32) |          0.72 |                0.97 |
| PAGER's: PGV, PAGER's bands     |         0.63 | 1.13× · 0.50× · 4.70× (128, 119, 36) |          0.79 |                1.13 |
| Half: PGA, PAGER's bands        |         0.68 | 1.51× · 0.35× · 3.34× (129, 113, 34) |          0.89 |                0.97 |
| Half: PGV, rings at 7, 8, 9     |         1.49 | 0.97× · 0.44× · 6.33× (119, 107, 34) |          0.90 |                1.13 |

The tolls are the geometric mean of model over record in the cells Mw < 6.5,
6.5–7.5 and ≥ 7.5, with the records each band holds (of 132 to 136, 112 to 125 and 35 to 37). PAGER's chain cuts the people score from 1.76 to 0.63 and holds the dead within the margin, eight records in ten and more
in every cell; but its rings, taken at 7.0, 8.0 and 9.0 where the maps are
summed, score 1.13 on rule 18's ShakeMaps against 0.97, past the 0.10 the
rule allows. By rule 33 the chain in place stays, and nothing in it is
changed. Neither half passes either: PAGER's bands on the PGA rings count
the people almost as well (0.68) and do worse on the dead than the margin
allows (0.89); PGV on the rings in place does worse on both.

What the scores do not show was read afterwards, and is written here as
such. Most of the people score is the bands: at VII and above PAGER's chain
reads 0.52×, 0.37× and 0.88× PAGER by magnitude cell, where the chain in
place read 0.25×, 0.12× and 0.45×, and the half with the bands alone reads
0.73×, 0.32× and 0.69×. Above Mw 7.5 PAGER's chain overshoots instead —
3.67× PAGER at VIII and above, 2.72× at IX — and so do its tolls, 4.70× the
record against 1.94×: the PGV that reaches IX near a long rupture reaches it
over a stadium hundreds of kilometres long. Rule 18's score is the one
`docs/SCIENCE.md` already found gives no credit for a band rightly left
blank ("Whether the rings carry depth"); on rule 23's maps rule 28's score,
which does, reads 0.20 for PGV against 0.12 for PGA, because PGV paints MMI VIII about 229 earthquakes whose maps hold none, where PGA paints it about 614. That score
decided nothing here. The rings of the prospective set are chosen with it
(`validation/prospectiveRules.ts`, rules 27 to 30), and the PGV relation was
committed before that set is first read, so by rule 29 it is one of its
candidates. PAGER's bands are not adopted on their own either: choosing them
now would be choosing on this table.

### The rings of a subduction interface (15 September 2026)

`validation/interfaceRules.ts` (rules 35 to 39),
`validation/interfaceRulesRun.ts`, `events/earthquake/interfaceAttenuation.ts`.
The benchmark campaign drew the five megathrust presets' rings with Boore et
al. 2014 at 4.2 and 6.0 times the distances two interface models give in
OpenQuake (`docs/BENCHMARK_REPORT.md`, BM-10), a figure made at MMI VIII, which
those models reach only at the edge of the rupture. On rule 18's ShakeMaps the
law in place draws 0.19 to 0.98 of the MMI VII area of the great thrust
earthquakes and VIII where some maps hold none. Boore et al. 2014 is a relation
for shallow crustal earthquakes in the Joyner–Boore distance; a megathrust
breaks 20 to 50 km down.

The rules were pushed before either candidate was coded (commit `b423de0`),
and the candidates before either was scored (`2456244`). Rule 35 takes the
earthquakes of rule 11's and rule 23's sets whose preferred ShakeMap was drawn
with a ground-motion model giving its subduction-interface models a weight of
0.5 or more — the weight ShakeMap's select module sets from STREC and the
Slab2 model, read from each map's `info.json` (1 177 maps; only 244, drawn
since ShakeMap wrote them there, carry STREC's probabilities). That is 98
earthquakes of rule 11's set and 353 of rule 23's, each run with the scenario
marked a subduction interface, for every law. Rule 36's candidates, for such a
scenario only, are Abrahamson, Gregor & Addo 2016 (BC Hydro, central magnitude
scaling, forearc) and Parker et al. 2022 (NGA-Subduction, global model), each
on median PGA through Worden et al. 2012, the ring standing where the median at
the rupture distance √(x² + depth²) falls to the threshold; both agree with OpenQuake 3.26.2's implementation to its table's eight significant figures at 1 050 points each. Rule
37 scores the three laws as rule 18 does, four ways, and a candidate must beat
Boore et al. 2014 by 0.05 in every one.

| Law (mean abs. log radius ratio) | Rule 11, rock | Rule 11, ground | Rule 23, rock | Rule 23, ground |  Sum |
| -------------------------------- | ------------: | --------------: | ------------: | --------------: | ---: |
| Boore et al. 2014                |          1.96 |            2.07 |          2.83 |            2.91 | 9.77 |
| Abrahamson, Gregor & Addo 2016   |          0.57 |            0.56 |          2.02 |            2.02 | 5.16 |
| Parker et al. 2022               |          0.55 |            0.47 |          1.84 |            1.49 | 4.35 |

Both candidates beat the law in place in every reading, and Parker et al.
2022, with the lower sum, is the winner. Most of the difference is bands: with
the scenario marked an interface, Boore et al. 2014 paints 539 bands of MMI VII or VIII below Mw 6.5 on rule 23's maps, where they hold none, and Parker et al. paints two. Rule 38 then ran the winner on the dead, on the browser's ground.

| Law                | Rule 11's held-out interface tolls, by cell            | Mean abs. log | Quiet earthquakes raised to ten |
| ------------------ | ------------------------------------------------------ | ------------: | ------------------------------: |
| Boore et al. 2014  | 43.11× · 35.77× · 13.21× (6 of 14, 39 of 46, 13 of 18) |          3.31 |                   11.9 % of 352 |
| Parker et al. 2022 | — · 7.41× · 3.16× (0 of 5, 8 of 22, 11 of 16)          |          1.58 |                    0.3 % of 352 |

The cells are Mw < 6.5, 6.5–7.5 and ≥ 7.5, with the records each band holds
among the rows with something. Parker et al. 2022 reads its dead nearer their
records than the law in place and raises almost no quiet earthquake to a toll
of ten, but its band holds none of five, eight of 22 and 11 of 16 — fewer
than eight in ten in every cell — so by rule 38 it is not adopted, and Boore
et al. 2014 keeps drawing the rings of a scenario marked a subduction
interface. BM-10 is declared with these numbers.

Printed beside, deciding nothing (rule 39). On the 61 maps with ten seismic
stations or more the three laws read 2.08, 0.89 and 0.30, and above Mw 7.5 a
radius ratio of 4.12×, 3.42× and 1.15×. Apart by the interface models ShakeMap
drew a map with, no candidate gains on the maps made partly of it: on the 289
drawn with the NSHMP 2014 set, which holds BC Hydro, Parker et al. reads 0.40
against BC Hydro's 0.76; on the 47 of the NSHMP 2023 set, which holds Parker
et al., BC Hydro reads 0.96 against Parker's 1.40; on the 98 of Chile's,
Montalva et al.'s refit of BC Hydro, BC Hydro reads 0.86 against 1.03. The
presets' rings, MMI VII and VIII beyond the rupture's stadium, are wider
under both candidates, whose rupture distance is the hypocentre's depth:
Tōhoku 50 and 13 km under Boore et al. 2014, 82 and 29 under BC Hydro, 73
and 27 under Parker et al.; Lisbon 36 and 9, 72 and 30, 59 and 23. None draws
IX.

What the scores do not show was read afterwards, and is written here as such.
Rule 35's set holds earthquakes that are not on a subduction interface but lie
inside STREC's subduction regions, which ShakeMap drew with its interface
models: Gorkha and Dolakha 2015 under the Himalaya, Awaran 2013 in the Makran,
Bhutan 2009, Taipei 2015, Paphos 2022. The winner's misses on the dead are
mostly bands of [0, 0]: the toll counts deaths only inside MMI VII, and Parker
et al. draws no VII about moderate earthquakes whose records hold a few dead —
Nias 2008 (1), Bhutan 2009 (11), the Minahassa Peninsula 2008 (6). And marking
a scenario an interface is itself a large part of the dead's figures: on the
same held-out rows, unmarked, Boore et al. 2014 reads 5.06×, 1.98× and 5.37×,
holding 10 of 12, 34 of 37 and 17 of 17; marked, 43.11×, 35.77× and 13.21×,
because the mark draws Strasser et al.'s interface rupture as a stadium at
every magnitude. Neither is acted on here: whether an interface scenario below
Mw 7.5 should be a stadium, and a toll that counts the dead below MMI VII, are
open. Both candidates were committed before the prospective set is first
read, so by rule 29 they are among its candidates.

### An interface scenario below Mw 7.5 (15 September 2026)

`validation/interfaceStadiumRules.ts` (rules 40 to 44),
`validation/interfaceStadiumRun.ts`. Every earthquake scenario becomes a
rupture stadium from Mw 7.5 and is a disc about the epicentre below; a scenario
marked a subduction interface was a stadium at every magnitude, on Strasser et
al. 2010's interface rupture. The previous section found that mark taking
Boore et al. 2014's held-out tolls of rule 11's interface earthquakes from
5.06×, 1.98× and 5.37× their records to 43.11×, 35.77× and 13.21×. Below Mw 7.5
a marked scenario drawn as a disc is the unmarked one, whose figures on rule
11's and rule 23's sets were thereby known, so the question was put to
earthquakes no rule had read.

The rules were pushed before either geometry ran on them (commit `71115b9`),
and the candidate before it was scored (`7deba3d`). Rule 40's set is every
ComCat earthquake of M 6 to 7.5, 2008 to 2025, deeper than 40 km and no deeper
than 70 km, with a ShakeMap and outside rule 11's and rule 23's sets: 179
listed, three taken out, 153 with a low-resolution MMI map, of which 64 are
interface earthquakes by rule 35's weight — 43 below Mw 6.5 (42 quiet), 21 from
it (11 quiet). On reference rock the disc had to lower rule 18's score below Mw
7.5 by 0.05, raise no more quiet earthquakes to a toll of ten, hold no fewer
records in either magnitude cell, and read them no worse by the mean of
|ln((toll + 1) / (record + 1))|.

| Geometry, below Mw 7.5              | Mw < 6.5   | Mw 6.5–7.5  | Mean abs. log | Quiet raised to ten | Recorded: score, held |
| ----------------------------------- | ---------- | ----------- | ------------: | ------------------: | --------------------- |
| A stadium at every magnitude        | 8.59× (62) | 11.43× (42) |          2.29 |         5.7 % of 53 | 1.69; 0 of 1, 8 of 10 |
| A stadium from Mw 7.5, a disc below | 2.97× (62) | 2.45× (42)  |          0.99 |         0.0 % of 53 | 0.65; 1 of 1, 8 of 10 |

The disc passes every test, and by rules 42 and 43 it is adopted: a scenario
marked a subduction interface is a stadium from Mw 7.5 only, in the simulator
and in the harness. Nothing else moves — the interface rupture, which the
tsunami reads, stays Strasser et al.'s — and no preset changes, since every
megathrust preset is of Mw 8.7 or more. The option `interfaceStadium` keeps the
old geometry for the rules that ran on it.

Printed beside, deciding nothing (rule 44). On rule 35's interface earthquakes
below Mw 7.5, where the disc is the unmarked scenario, rule 18's score falls
from 2.29 to 0.89 on rule 11's maps on rock, from 2.41 to 1.26 on the browser's
ground, from 2.30 to 1.05 and from 2.38 to 1.32 on rule 23's; on the nine maps
of rule 40's set with ten stations or more, from 2.03 to 0.68. Rule 11's
held-out interface tolls below Mw 7.5, on the browser's ground, read 0.73
instead of 1.97 by the same score, the band holding 13 of 15 and 59 of 61
records instead of 7 and 54.

What the scores do not show was read afterwards, and is written here as such.
Most of the difference is bands the maps do not hold: every one of the 62
scored pairs below Mw 6.5 is a band both geometries paint about a deep
earthquake whose map shows none, and the disc paints less of it — the limit the
rules named, since Boore et al. 2014 draws a deep earthquake as a shallow one.
With the geometry adopted, rules 35 to 39 print different figures, as rule 44
said they would, and decide the same: Parker et al. 2022 still wins on the maps
(0.75, 0.70, 1.94 and 1.72 against 1.03, 1.30, 2.00 and 2.20), BC Hydro is no
longer eligible, and Parker et al.'s band still holds too few of rule 11's
records (none of five, 10 of 22, 11 of 16); Boore et al. 2014's interface tolls
now read 5.06×, 1.98× and 13.21×.

### The dead below MMI VII (15 September 2026)

`validation/lowIntensityRules.ts` (rules 45 to 49),
`validation/lowIntensityRun.ts`. The toll counts deaths inside the MMI VII ring
only, at PAGER's rates for 7.5, 8.5 and 9.5; USGS PAGER's empirical model counts
them from V. BM-10 had found bands of [0, 0] about moderate earthquakes with a
few dead, so the question was whether counting the bands below VII brings the
toll nearer the record, put to earthquakes no rule had read.

The rules and the set were pushed before either candidate was coded (commit
`a551aa3`), and the candidates before they were scored (`6f720e6`). Rule 45's
set is every NCEI significant earthquake of magnitude 5.0 to 5.99, 2008 to
2025, no deeper than 40 km: 302 records, 298 earthquakes once matched to
ComCat, 120 of them with deaths and 1 732 dead in all, on the browser's ground.
Both candidates draw the V and VI rings at 5.0 and 6.0 as the rings above are
drawn and count everything above VII as in place; `midBand` counts the new
bands at PAGER's rates for 5.5 and 6.5, `pager` at those for 5 and 6. A
candidate had to lower the mean |ln((toll + 1) / (record + 1))| by ln 1.25 and
hold no fewer records.

| Toll                       | Score | Records held | Of the 120 with deaths | Of 178 without, given ten or more | With deaths, given none | Dead counted |
| -------------------------- | ----: | -----------: | ---------------------: | --------------------------------: | ----------------------: | -----------: |
| Inside MMI VII only        | 1.185 |   261 of 298 |                     99 |                                28 |                      45 |       16 378 |
| V and VI at their middles  | 1.254 |   293 of 298 |                    117 |                                30 |                      38 |       17 569 |
| V and VI at their integers | 1.190 |   295 of 298 |                    117 |                                28 |                      42 |       16 554 |

Neither candidate lowers the score, let alone by ln 1.25: by rule 47 the toll
in place stays and the guards on rule 11's and rule 23's sets did not run.
Counting the bands below VII lifts the band's high end, so it holds more
records, and it gives a few more earthquakes a toll, but at PAGER's rates for
intensities 5 to 6.5 it adds little to the central figure, and what it adds
falls about as often where nobody died as where somebody did.

What the scores do not show was read afterwards, and is written here as such.
Below magnitude 5.5 (153 earthquakes) the scores are 0.92, 1.03 and 0.95, from
it (145) 1.47, 1.49 and 1.45: the counting of V at its integer comes nearest in
the upper half, by far less than the margin. The distance between toll and
record on this set is not the bands below VII. The toll in place counts 16 378
dead where 1 732 were recorded, most of them about four Iranian earthquakes near
cities — Shiraz 2010 (M 5.9), 7 587 against one dead; Khoy 2023 (M 5.9), 1 284
against three; two more near Khoy that killed nobody, 1 059 and 855 — on
Iran's national curve, the steepest PAGER fits (β 0.10, one and a half per cent
dead at 7.5), and ground of 260 to 680 m/s. The deadliest are counted far below
their records: Cianjur 2022 (M 5.6), 13 against 635; Jajarkot 2023 (M 5.7), 22
against 154; Jishishan 2023 (M 5.9), 47 against 151. All three stand on the
browser's reading of 760 m/s under the epicentre. Whether the ground under the
buildings that fell was softer was not read. A national curve and one Vs30 at
the epicentre are declared gaps already, and this set is where they show at
magnitude 5.

### A disc's distance to its rupture (15 September 2026)

`validation/pointSourceRules.ts` (rules 50 to 55),
`validation/pointSourceRun.ts`, `events/earthquake/pointSourceDistance.ts`.
Every earthquake scenario below Mw 7.5 is a disc about its epicentre, and Boore
et al. 2014 draws its rings with the Joyner–Boore distance taken as the
distance from the epicentre, as if every site stood as far from the rupture as
from the point where it began. USGS ShakeMap draws a map without a finite
rupture the other way. From version 4.0 to 4.2 it takes Thompson & Worden's
(2018) average distance to the ruptures the hypocentre can belong to (ps2ff),
and from 4.3.0, in April 2024, it simulates those ruptures (FFSimmer). Rule
18's run had found the rings at 0.83, 0.50 and 0.90 of the ShakeMaps' radius
where a map reaches MMI VII, and BM-10 left the interface models' rupture
distance on the hypocentre's depth. So the question was whether a disc's rings
should stand at the distance to its rupture, put to maps no rule had read.

The rules and the set were pushed before the candidate was committed (commit
`fdab1be`), and the candidate before it was scored (`d311936`). Rule 50's set
is every ComCat earthquake of Mw 6 or more, 2000 to 2007, no deeper than 40 km,
with a ShakeMap — 445, less eight the project had read and 16 whose map has no
MMI coverage. That leaves 421 maps of the ShakeMap Atlas as ShakeMap 4.0.2
redrew them in 2020, with ps2ff's
distances wherever the rupture was a point: 241 below Mw 6.5, 154 from 6.5 to
7.5 and 26 above. Rule 51's candidate is ps2ff 1.5.9's single-event integral
with the parameters ShakeMap 4.0.2 passes for an origin with no tectonic
region. It is computed on a grid of magnitude, depth and distance, and held to
ps2ff within 4 × 10⁻¹⁶ at 784 points and to the integral within 4.1 % (1.7 %
from 3 km). The set's recorded deaths decide nothing: PAGER's country curves
were fitted on the fatal earthquakes of 1973 to 2007. The check on the dead
was to use rule 11's held-out tolls and rule 23's quiet earthquakes.

| Distance, below Mw 7.5        | Rock: Mw < 6.5 | 6.5–7.5 | Mean | Ground: Mw < 6.5 | 6.5–7.5 | Mean | Least modelled: rock | ground |
| ----------------------------- | -------------: | ------: | ---: | ---------------: | ------: | ---: | -------------------: | -----: |
| From the epicentre (in place) |           0.92 |    0.84 | 0.88 |             1.18 |    1.17 | 1.17 |                 0.20 |   0.55 |
| Thompson & Worden's average   |           1.46 |    1.60 | 1.53 |             1.70 |    1.86 | 1.78 |                 0.83 |   1.16 |

The figures are rule 18's mean absolute log radius ratio. The least modelled
maps, drawn on a finite rupture or with ten seismic stations or more, are 20
below Mw 6.5 and 32 from it. The candidate is worse in both readings and on
the least modelled maps, so by rule 52 it is not eligible, nothing ran on the
dead, and the rings of a disc stay at the epicentral distance.

Rule 54 put the interface models, at the candidate's rupture distance below Mw
7.5, to the set's 166 interface maps, each run as a scenario marked a
subduction interface.

| Law, three magnitude cells | Rock | Ground |
| -------------------------- | ---: | -----: |
| Boore et al. 2014          | 1.30 |   1.52 |
| Parker et al. 2022         | 1.05 |   0.95 |
| BC Hydro 2016              | 1.11 |   1.16 |

Both candidates beat the law in place by more than 0.05 in both readings, and
Parker et al. 2022, with the lower sum, won. On rule 11's held-out tolls of rule
35's interface earthquakes, on the browser's ground:

| Law                | By cell, with the records each band holds             | Mean abs. log | Quiet interface earthquakes raised to ten |
| ------------------ | ----------------------------------------------------- | ------------: | ----------------------------------------: |
| Boore et al. 2014  | 5.06× · 1.98× · 13.21× (10 of 12, 36 of 38, 17 of 18) |          1.63 |                              3.4 % of 352 |
| Parker et al. 2022 | — · 5.64× · 3.16× (0 of 5, 27 of 34, 11 of 16)        |          1.44 |                              0.6 % of 352 |

Parker et al. reads the dead nearer their records and raises fewer quiet
earthquakes to a toll of ten, but its band holds fewer than eight records in
ten in every cell. By rule 54 it is not adopted, and Boore et al. 2014 keeps
drawing the rings of a scenario marked a subduction interface.

Printed beside, deciding nothing (rule 55). The set's 129 recorded earthquakes
below Mw 7.5 read 1.080 by |ln((toll + 1) / (record + 1))| with 116 records
held in place, and 1.066 with 117 at the candidate's distance. The counts are
7 684 and 18 884 dead where 43 365 were recorded, on curves fitted on those
years. On the maps drawn on a finite rupture the candidate reads 0.26 against
0.42 on rock and 0.60 against 0.05 on the browser's ground; on those with ten
stations or more, 1.04 against 0.38 and 1.32 against 0.72. At rule 36's
hypocentral distance the interface models read the set's interface maps at
0.49 and 0.34 (Parker et al.) and 0.83 and 0.60 (BC Hydro). The candidate
would widen the net's MMI VII rings: Northridge from 17.0 to 25.7 km, Kumamoto
from 19.7 to 31.6, L'Aquila from 6.3 to 11.5, Amatrice from 7.1 to 12.0.

What the scores do not show was read afterwards, and is written here as such.
Below Mw 7.5, 53 of the set's 395 maps reach MMI VII, and 10 of its 266 quiet
earthquakes are among them. On rock, 358 of the 381 scored pairs below Mw 6.5
and 252 of the 297 from it are bands the rings draw where the map holds none.
A ring drawn nearer its rupture is wider, and scores worse, on every one of
them. Where a map does reach the band, the picture is different. At MMI VIII
the candidate's rings stand at a median 0.61 and 0.76 of the map's radius on
rock against 0.20 and 0.22 in place (4 and 9 pairs). At MMI VII in the upper
cell they stand at 1.24 against 0.69 (34 pairs). Below Mw 6.5 (1.45 against
0.94) and on the browser's ground at MMI VII (1.73 and 1.57 against 1.21 and
0.97) they are further off. Rule 18's score gives no credit for a band rightly
left blank, as rule 24's run showed; on maps that mostly hold no strong
shaking, that decides.

The interface models' average rupture distance is shorter than their
hypocentral one, so they too draw bands where the maps hold none. It is at the
candidate's distance that Parker et al.'s band held 27 of rule 11's 34 records
in the middle cell, one short of eight in ten, and none of five below Mw 6.5.
The prospective set (rules 27 to 30) scores the rings with a skill score that
credits a correct silence. Boore et al. 2014 and the interface models at the
candidate's distance were committed before that set is first read, so by rule
29 they are among its candidates.

### The rings when a silence counts (15 September 2026)

`validation/atlasRules.ts` (rules 56 to 60), `validation/atlasRun.ts`. Rule
18's score takes half the log of the ratio of the ground a law shakes to the
ground a ShakeMap shakes, and gives nothing to a law that draws no band where
the map holds none. That decided rule 24's run against Allen et al.'s
hypocentral equation and rule 52's against the distance to the rupture. Rule
28 wrote a score that counts silences for the prospective set: at MMI VII and
VIII, hits, misses, false alarms and silences, a side reaching a band with 10
km², and the Peirce skill score — the share of the bands a map reaches that
the law reaches, less the share of the bands a map leaves blank that the law
paints. These rules read it now, on maps no rule had read.

The rules, the set and the run were pushed before any candidate was scored
(commit `9a58165`). Rule 56's set is every ComCat earthquake of Mw 6 or more,
1973 to 1999, no deeper than 40 km, with a ShakeMap: 1 140, less Northridge
1994 and Aitape 1998, which the project had read, and 37 without MMI coverage.
That leaves 1 101 maps of the ShakeMap Atlas, 138 of them drawn on a finite
rupture or with ten stations or more. Every way of drawing the rings
committed before the rules stood against Boore et al. 2014, on the browser's
ground. A winner had to displace it as rule 29 says, by 0.10 of score and
within 0.10 of sharpness (the median absolute log radius ratio where both
reach MMI VII), and lose nothing on the least modelled maps. It then had to
pass rule 38's test on rule 11's tolls and rule 23's quiet earthquakes, since
the set's own deaths are among those the country curves were fitted on.

| Law                                             | MMI VII: hits · misses · false alarms · silences | Skill | MMI VIII: hits · misses · false alarms · silences | Skill | Score | Sharpness | Least modelled |
| ----------------------------------------------- | ------------------------------------------------ | ----: | ------------------------------------------------- | ----: | ----: | --------: | -------------: |
| Boore et al. 2014 (in place)                    | 237 · 0 · 864 · 0                                |  0.00 | 66 · 8 · 801 · 226                                |  0.11 |  0.06 |      0.53 |           0.05 |
| Joyner & Boore 1981                             | 237 · 0 · 864 · 0                                |  0.00 | 72 · 2 · 976 · 51                                 |  0.02 |  0.01 |      0.52 |           0.02 |
| JB81 below Mw 7.5, Boore et al. from it         | 237 · 0 · 864 · 0                                |  0.00 | 72 · 2 · 976 · 51                                 |  0.02 |  0.01 |      0.52 |           0.02 |
| Allen et al. 2012, hypocentral                  | 210 · 27 · 295 · 569                             |  0.54 | 20 · 54 · 41 · 986                                |  0.23 |  0.39 |      0.54 |           0.30 |
| Allen et al. below Mw 7.5, Boore et al. from it | 210 · 27 · 295 · 569                             |  0.54 | 27 · 47 · 76 · 951                                |  0.29 |  0.42 |      0.51 |           0.33 |
| Boore et al. 2014 on PGV                        | 235 · 2 · 863 · 1                                | −0.01 | 52 · 22 · 428 · 599                               |  0.29 |  0.14 |      0.55 |           0.12 |
| Boore et al. at the rupture distance            | 237 · 0 · 864 · 0                                |  0.00 | 68 · 6 · 912 · 115                                |  0.03 |  0.02 |      0.54 |           0.01 |

Both hypocentral equations displace the law in place, and pass the guard;
Allen et al. 2012 below Mw 7.5, with the higher score, won. On rule 11's
held-out tolls, on the browser's ground:

| Law                       | By cell, with the records each band holds                | Mean abs. log | Quiet earthquakes raised to ten |
| ------------------------- | -------------------------------------------------------- | ------------: | ------------------------------: |
| Boore et al. 2014         | 1.46× · 0.33× · 1.94× (122 of 132, 106 of 112, 32 of 35) |          0.72 |                    2.9 % of 805 |
| Allen et al. below Mw 7.5 | 1.05× · 0.67× · 1.94× (81 of 113, 128 of 139, 33 of 36)  |          0.37 |                    1.4 % of 805 |

The winner reads the dead nearer their records in every cell and raises fewer
quiet earthquakes to a toll of ten. Below Mw 6.5, though, its band holds 81 of
113 records, fewer than eight in ten. By rule 59 it is not adopted, and Boore
et al. 2014 keeps drawing the rings.

Printed beside, deciding nothing (rule 60). On reference rock the law in place
scores 0.18, its MMI VIII skill rising to 0.37, and Allen et al. below Mw 7.5
scores 0.42. On the maps already read the order is the same. Boore et al. 2014
scores 0.08 on rule 11's, 0.12 on rule 23's and 0.06 on rule 50's; Allen et al.
below Mw 7.5 scores 0.34, 0.30 and 0.39; the law on PGV 0.14, 0.20 and 0.17.

What the scores do not show was read afterwards, and is written here as such.
Boore et al. 2014 draws MMI VII about every earthquake of Mw 6 or more in all
four sets, with no silence in any of them, so rule 18's score, which reads
sizes, has been reading rings that are always there. Allen et al.'s misses on
the dead below Mw 6.5 are mostly the other side of its silences. Twenty-six of
its 32 misses are bands of [0, 0] about earthquakes that killed, 408 dead in
all — Tainan 2016 (117), Mamuju 2021 (105), Durrës 2019 (51) — against three
such misses, of 11 dead, for Boore et al. 2014. The toll counts deaths inside
the MMI VII ring only, so a law that is silent where a map is silent is silent
about some earthquakes that killed; the equation also reads no ground.
Counting the dead below MMI VII did not help the toll in place on the moderate
set (rules 45 to 49); whether it would help this law was not run. The
prospective set (rules 27 to 30) will read every candidate again on
earthquakes not yet happened.

### The hypocentral equation with the dead of V and VI (15 September 2026)

`validation/allenTollRules.ts` (rules 61 to 65), `validation/allenTollRun.ts`.
The previous section found Allen et al. 2012's hypocentral equation below Mw
7.5 better on the maps and short on the dead, most of its misses bands of [0, 0]
about earthquakes that killed. The candidates add the dead of the V and VI
bands its rings draw, at PAGER's rates for the bands' middles or integers, as
rule 46 counts them. Since they answer what rule 11's tolls showed, those tolls
could only guard, and the choice was put to tolls no rule had read.

The rules, the set and the run were pushed before any toll was run on the set
(commit `a48eb85`). Rule 61's set is every NCEI significant earthquake of 2008
to 2025 of magnitude 4 to 4.99 no deeper than 40 km, or of magnitude 5 or more
deeper than 40 km, matched to ComCat and not read by any rule. Of 241 records
that leaves 194 earthquakes, 75 of them with deaths and 1 871 dead in all, on
the browser's ground. A candidate had to read the set's dead no worse than the
toll in place, by rule 47's score, and hold eight records in ten in every
magnitude cell; a winner would then face guards on rule 11's tolls, rule 23's
quiet earthquakes and rule 45's moderate set.

| Toll                                     | Score | Records held | Mw < 6.5         | Mw 6.5–7.5       | Mw ≥ 7.5         | Dead counted |
| ---------------------------------------- | ----: | -----------: | ---------------- | ---------------- | ---------------- | -----------: |
| Boore et al. 2014, inside MMI VII only   | 0.720 |   160 of 194 | 5.66× · 41 of 75 | 3.09× · 17 of 17 | 3.51× · 21 of 21 |       10 406 |
| The equation, V and VI at their middles  | 0.565 |   161 of 194 | 1.59× · 59 of 88 | 0.98× · 12 of 16 | 4.59× · 22 of 22 |        8 716 |
| The equation, V and VI at their integers | 0.566 |   158 of 194 | — · 53 of 85     | — · 12 of 16     | 3.93× · 21 of 21 |        8 277 |

Both candidates read the dead nearer their records, but neither band holds eight
records in ten below Mw 7.5, so by rule 63 neither is eligible, the guards did
not run, and Boore et al. 2014 keeps drawing the rings and counting the dead
inside MMI VII only.

Printed beside, deciding nothing (rule 65). The equation counting inside MMI VII
only scores 0.574 and holds 129 records, 3 of 55 below Mw 6.5; Boore et al. 2014
counting V and VI scores 0.785 at the bands' middles and 0.729 at their
integers, holding 182 and 180. On the small earthquakes every toll scores 0.40
to 0.44; on the deep ones the toll in place scores 1.006 and the equation with
V and VI 0.700 and 0.712.

What the scores do not show was read afterwards, and is written here as such.
The dead the tolls count come mostly from one earthquake. Hindu Kush 2015, Mw
7.5 at 231 km, counts 7 147 dead in place and 7 600 with the bands, against
399; from Mw 7.5 the candidates draw Boore et al. 2014's rings, which draw a
deep earthquake as a shallow one. The bands of V and VI do what they were
written for: with them the equation holds 59 of 88 records below Mw 6.5, where
alone it held 3 of 55, and of the bands of [0, 0] about small earthquakes that
killed, the toll in place leaves 29 (81 dead) and the equation with the bands'
middles 7 (15 dead). What they cannot reach is depth. The equation draws not
even a V ring about 24 deep earthquakes that killed — 20 below Mw 6.5 and four
from 6.5 to 7.5, at 108 to 267 km — 70 dead in all, where the toll in place,
which draws them as shallow, misses four. On this set the toll in place holds
41 of 75 records below Mw 6.5 as well, fewer than eight in ten; rule 63 asked
that share of the candidates only.

### The rings of an earthquake deeper than 70 km (15 September 2026)

`validation/slabRules.ts` (rules 66 to 70), `validation/slabRun.ts`. The rings
read no depth: Boore et al. 2014 takes the Joyner–Boore distance, which is the
same for a hypocentre at 10 km and at 200. The previous section found the cost
on both sides. The hypocentral equation drew no ring about 24 deep earthquakes
that killed, and Hindu Kush 2015, Mw 7.5 at 231 km, drawn as a shallow
earthquake, gave most of the dead the tolls counted. ShakeMap draws such
earthquakes with models fitted on records of earthquakes inside the subducting
slab. These rules put two of them to the maps: Abrahamson, Gregor & Addo 2016
(BC Hydro) and Parker et al. 2022, each held to OpenQuake's implementation
within 1e-9 of the median. Each draws a scenario deeper than 70 km as a disc at
every magnitude, its rings where its median PGA at the hypocentral distance
falls to the PGA Worden et al. 2012 give the intensity.

The rules, the set and the run were pushed before any candidate was scored
(commit `905c5ec`). Rule 66's set is every ComCat earthquake of Mw 6 or more,
1973 to 2025, deeper than 70 km and no deeper than 300 km, with a ShakeMap:
737, less 44 the project had read and 75 without MMI coverage. That leaves 618
maps, 32 of them drawn on a finite rupture or with ten stations or more, on the
browser's ground. A winner had to displace Boore et al. 2014 by 0.10 of rule
28's score within 0.10 of sharpness and lose nothing on the least modelled
maps. It then had to read the dead of rule 61's 62 earthquakes deeper than 70
km no worse than the law in place, with 0.10 of room, since every record of
the set itself is among those the country curves were fitted on.

| Law                            | MMI VII: hits · misses · false alarms · silences | Skill | MMI VIII: hits · misses · false alarms · silences | Skill | Score | Sharpness | Least modelled |
| ------------------------------ | ------------------------------------------------ | ----: | ------------------------------------------------- | ----: | ----: | --------: | -------------: |
| Boore et al. 2014 (in place)   | 16 · 0 · 602 · 0                                 |  0.00 | 0 · 0 · 423 · 195                                 |     — |  0.00 |      0.56 |              — |
| Abrahamson, Gregor & Addo 2016 | 14 · 2 · 7 · 595                                 |  0.86 | 0 · 0 · 0 · 618                                   |     — |  0.86 |      0.36 |              — |
| Parker et al. 2022             | 12 · 4 · 4 · 598                                 |  0.74 | 0 · 0 · 3 · 615                                   |     — |  0.74 |      0.34 |              — |

No map of the set reaches MMI VIII, so the score is the skill at MMI VII. Both
candidates displace the law in place. The guard on the least modelled maps read
nothing, as rule 68 allows: only 3 of those 32 maps reach MMI VII, and a band
is scored from five. Abrahamson et al. 2016, with the higher score, won. On
rule 61's earthquakes deeper than 70 km, counting the dead inside MMI VII:

| Law                            | Rule 47's score | Records held | Mw < 6.5 | Mw 6.5–7.5 | Mw ≥ 7.5 |
| ------------------------------ | --------------: | -----------: | -------: | ---------: | -------: |
| Boore et al. 2014              |           1.091 |     58 of 62 | 17 of 21 |   19 of 19 | 22 of 22 |
| Abrahamson, Gregor & Addo 2016 |           0.801 |     38 of 62 | 10 of 21 |    8 of 19 | 20 of 22 |

The winner reads the dead nearer their records, well within rule 69's room, so
it is adopted: since this commit it draws the rings of every scenario deeper
than 70 km, and the input check warns only beyond 300 km, where the set ends.
Its band holds 20 fewer of those records than the rings it replaced, which rule
69 prints and does not decide on.

Printed beside, deciding nothing (rule 70). On reference rock Abrahamson et al.
2016 scores 0.74, with a sharpness of 0.11, Parker et al. 2022 0.75 and Boore
et al. 2014 0.00. The 16 maps that reach MMI VII are all no deeper than 150 km,
so on the 212 deeper maps no score can be read; there Boore et al. 2014 paints
VII about every map, Abrahamson et al. about one and Parker et al. about none.
On the 490 maps drawn with a slab set that holds Abrahamson et al. 2016 it
scores 0.84 and Parker et al. 0.71; the 21 maps drawn with the sets that hold
Parker et al. and the 107 drawn with Chile's hold too few bands of MMI VII to
score.

What the scores do not show was read afterwards, and is written here as such.
The 16 maps that reach MMI VII are of earthquakes from Mw 6.9 to 7.8, 71 to 129 km deep; the skill rests on them and on the 602 maps that do not reach it, about every one of which Boore et al. 2014 draws VII and Abrahamson et al. 2016 draws it about seven. Abrahamson et al. 2016 misses
Vrancea 1990 (Mw 7.0 at 89 km) and Vanuatu 2021 (Mw 6.9 at 93 km); its seven
false alarms are earthquakes of Mw 7.2 to 7.8, 90 to 167 km deep, whose maps
peak at MMI 6.6 to 6.9. Where both reach MMI VII its ring stands at a median
1.4 times the map's radius, and at Iquique 2005 its area is 122 times the
map's. On the dead, the law in place counted 8 713 against 1 660 recorded, 7 147
of them at Hindu Kush 2015, where 399 died. The adopted law counts 5 981, 5 547
of them at Mashkal 2013 (Mw 7.7 at 80 km), where 40 died, and none at Hindu
Kush 2015, whose band it leaves at [0, 0]. It leaves 21 other records with deaths at [0, 0] too, 468 dead in all with Hindu Kush's, where the law in place left 3 records and 3 dead. The pattern is the one the hypocentral equation showed on
the Atlas: a law silent where the maps are silent is silent about some
earthquakes that killed, because the toll counts the dead inside MMI VII only.
Two things the rules held fixed may be part of it, and neither was tried: the
band draws Boore et al. 2014's σ of 0.60 where Abrahamson et al. 2016's is
0.74, and the dead of the V and VI bands are not counted.

Adopting the law moved the printed figures of the rules that decided before,
as rule 70 has it, and none of their verdicts. Among rule 11's held-out
earthquakes, Hindu Kush 2009 (Mw 6.2 at 186 km, 5 dead) now sits on a band of
[0, 0], and the set's band holds 258 of its 278 records with something (93 %).
On rule 61's set the toll in place now scores 0.627 and holds 139 of 194
records. There, on the 100 earthquakes deeper than 40 km, counting the dead of
the V and VI bands the rings draw holds 87 at either rate, where counting
inside MMI VII holds 74; no rule has put that to a set not yet read.

### The residual in two parts (16 September 2026)

`validation/residualRules.ts` (rules 71 to 75), `uq/groundMotionResidual.ts`.
Every realisation of an earthquake drew one ground-motion residual, σ = 0.60 in
ln PGA, and applied it to every place of the footprint at once — all of the
within-event scatter as if every place moved together. A ground-motion model
parts that scatter in two: the between-event τ, which does move one
earthquake's every place together, and the within-event φ, which differs from
place to place and is correlated over tens of kilometres (Jayaram & Baker
2009). A toll is counted over a footprint, so φ should average down over it.
The candidate draws τ shared and φ averaged over the median MMI VII footprint,
with the range b = 40.7 km their case 2 gives PGA where site conditions are
clustered — as one Vs30 for a whole footprint makes them — and φ whole for the
accelerations printed at one place. τ, φ and the correlation were held to
OpenQuake's implementations within 1e-9 and the mean correlation over a disc to
SciPy's integral within one part in a million.

The rules and the run were pushed before the candidate drew a band (commit
`16f0feb`). Every NCEI earthquake toll of 2008 to 2025 has been read by rules
11, 45 or 61 (docs/GOLD_STANDARD.md), so no held-out set of dead was left: the
three sets could stop the candidate, not validate it. The score is Gneiting &
Raftery's (2007) interval score on log10(deaths + 1) — the band's width plus
twenty times the distance by which the record lies outside it.

| Set                                | Residual                             | Interval score | Records held | Median width |
| ---------------------------------- | ------------------------------------ | -------------: | -----------: | -----------: |
| Rule 11's 406 held-out earthquakes | one draw of σ 0.60 (in place)        |          2.101 |   258 of 278 |      10^2.52 |
|                                    | τ shared, φ averaged (the candidate) |          2.145 |   241 of 269 |      10^2.36 |
|                                    | one draw of the law's own σ          |          2.114 |   258 of 278 |      10^2.50 |
| Rule 45's 298 moderate earthquakes | one draw of σ 0.60                   |          3.372 |   210 of 247 |      10^2.78 |
|                                    | the candidate                        |          3.345 |   200 of 245 |      10^2.74 |
| Rule 61's 194 small and deep       | one draw of σ 0.60                   |          3.741 |     41 of 96 |      10^0.00 |
|                                    | the candidate                        |          3.775 |     40 of 97 |      10^0.00 |

By rule 73 the candidate is not adopted: its score on rule 11's earthquakes is
higher, if barely. Its coverage, 89.6 %, is above the 85 % the rule asks, and
both of rule 74's guards passed, so they decided nothing. The residual in place
stays.

What the scores do not show was read afterwards, and is written here as such.
The narrowing is real: on rule 11's set 231 bands are narrower and 29 wider, a
median of 10^0.30 — a factor of two — and the same on rule 61's (10^0.35).
What it costs is nine records: nine rows the band held now fall outside it and
one falls in, and the nine hold 608 dead. Noto 2024 is the largest, 549 dead on
a band of 0 to 2 625 in place and 0 to 329 under the candidate; Tokyo 2008, 23
dead, goes from 0 to 33 to 0 to 9. One of the nine is the other way about:
Piura 2021 recorded nobody, and the candidate's lower end rose to one. The
interval score charges twenty units per decade outside the band and one per
decade of width, so nine such misses outweigh the halving.

Where the footprint is small the candidate is a shade wider than the residual
in place, since a law's own total at Mw 5.5 and above is 0.605 and ρ̄ is near
one; the narrowing is all in the large footprints, where ρ̄ falls to 0.10 at a
radius of 50 km and 0.03 at 100 km. The net's bands move the same way: Gorkha
2015 from 43–934 524 to 35–375 501, Tōhoku 2011 from 8–1 204 212 to 19–751 322,
Kumamoto 2016 from 0–19 404 to 0–10 780, Christchurch 2011 from 0–26 to 0–13,
still short of its 185; L'Aquila 2009, whose footprint is small, widens from
2–4 642 to 2–8 325.

What this leaves open is where the averaging is done. φ is averaged over the
footprint's area, where the dead gather in towns much smaller than it: a town
inside a 50 km ring sees nearly one draw of φ, not the average of the disc, so
the honest averaging is over the people and not over the ground. That is the
one change that could keep the records and the narrower band together, and it
was not tried; neither was the shorter range, 8.5 km, which averages more
still. The prospective set of rules 27 to 30 will read whatever is in place.

### How many people the rings actually hold (16 September 2026)

`validation/ringCountRules.ts` (rules 94 to 97), `validation/ringCountRun.ts`.
Every toll this project prints begins with a count: the people inside a circle
on a raster. The raster's cells are squares in degrees and the circle is a
circle, so the cells its edge crosses have to be split. Nimbus split them into
a 4 × 4 sub-grid and counted the sub-cells whose centres fell inside, and the
module's own header called what that left behind "the ±few-percent noise floor"
without ever measuring it. `docs/GOLD_STANDARD.md` asks (I4, and the same
clause under every other letter) for 5 % of an exact count on the same raster.

It was not within 5 %. On a set of 224 circles built from the raster by a fixed
rule — the sixteen most populous cells of the shipped 0.125° planet, eight
drawn by a seeded generator, and four geometric cases at the antimeridian, 70°
N, the equator and an empty stretch of southern ocean, each at radii from 20 to
5 000 km — the count in place is a median 0.020 % from a count of the very same
cells with the edge cells split 48 × 48, but 1.03 % at the ninetieth percentile
and 10.4 % at its worst. The worst are all 20 km circles, where almost every
cell the circle touches is an edge cell: a drawn centre in Mongolia counted 21
people where 19 live there, one in Kenya 5 394 against 5 017, and a 20 km
circle on the equator in Uganda 289 891 against 271 455.

Splitting the edge cells 12 × 12 brings every scored circle inside — worst
2.7 % — for 1.07 times the wall-clock of the whole set, because the edge cells
are a small share of a large circle and a large circle is where the time goes.
The release gate stays PASS, so rule 97 adopts it. Ten circles narrower than
one cell of the raster are counted apart and scored by nobody: the raster does
not say where inside a cell its people live, so there is no exact answer to
compare against, and what the code does there — the cell's land density times
the circle's area — is a model rather than an arithmetic.

Two things this does not say. It is a verification and not a validation: the
reference shares every assumption of the thing it checks — that a cell's people
are spread evenly over its land, that a great-circle distance is the right
distance — so if a cell's people are all in one corner, both counts are wrong
together and this says nothing at all. And it touches only the circle. The
polygon counter an extended rupture uses splits its own edge cells 4 × 4 too,
scored rows depend on it, and no round has measured it: it keeps its number
until one does.

This round's pre-registration is weaker than the three before it, and the rules
say so in their own header. The set was counted once while they were being
written, so what the count in place does was known before rule 97 was finished,
and rule 97's guard about the release gate was added after that first count.
The reference is arithmetic on the very same cells rather than a measurement of
the world — there is nothing to tune towards — but it is weaker, and a reader
should weigh it as one.

### The ash cloud is a hundred and twenty-five times too narrow, and the fix was refused (16 September 2026)

`validation/ashRules.ts` (rules 106 to 109), `validation/ashRun.ts`,
`events/volcano/ashfall.ts`. The campaign of the day before had found the worst
number in the project here. Against Tephra2 — the advection-diffusion model the
field runs, Connor & Connor 2006 on Bonadonna et al. 2005 and Suzuki 1983 —
Nimbus's tephra loading came out 0.51× on the wind axis and **0.008×** fifty
kilometres downwind and thirty across: a hundred and twenty-five times too
little, at a scatter of 31.8 in the log. Thirty kilometres off the axis the
ratio was zero to two decimals.

The cause was one line. Nimbus spread a release by
σ_y = max(0.3·H, 500 m)·√(1 + x/10H) — the downwind distance and the plume
height, and nothing else — so a 32 µm ash grain that takes a day to reach the
ground spread exactly as much as an 8 mm lapillus that takes four minutes. In
an advection-diffusion model it is the **fall time** that earns the spread, and
the fine tail is what makes a cloud wide. Tephra2's own closure, read out of
`tephra2_calc.c`: above a fall-time threshold σ² = (8/5)·C·(t + (0.2·h²)^(2/5))^(5/2),
below it σ² = 4·K·(t + 0.0032·h²/K).

It moves every figure:

| Law       | axis bias | axis σ | axis ×2 | across bias | across σ | across ×2 |
| --------- | --------: | -----: | ------: | ----------: | -------: | --------: |
| in place  |     0.466 |  2.873 |    23 % |       0.008 |   31.828 |      27 % |
| Tephra2's |     0.686 |  1.370 |    59 % |       0.299 |    4.081 |      34 % |

Across the wind the model goes from a hundred and twenty-five times too narrow
to three times, and its scatter falls by a factor of eight. On the axis the
bias moves from 0.47 to 0.69 and the share of points within a factor of two
rises from a quarter to nearly two thirds. Nothing else changes: the Suzuki
release profile, the Ganser terminal velocities, the grain classes and the mass
are what they were.

**And the first round refused it.** Rule 108 asks two things, and the second is
that rule 19's invariants come back no worse than the 221 failures it names.
They came back at 222.

The 222nd failure is not the closure's. The sweep that found it was taken with
the candidate switched off — the law in place, nothing else touched — and still
came back at 222; the extra one is `continuous: radiation.ld50Radius`, in a
hazard that never opens `ashfall.ts`. Nor is it a defect. A 1.258 Mt burst at
2 751.65 m reaches 450 rad at a slant range of 2 752.18 m, so the lethal sphere
touches the ground with fifty-three centimetres to spare and the ring it cuts
is √(slant² − h²) = 53.9 m; a 0.1 % step in yield moves that slant by 0.017 %
and the ring by 37 %, amplified by (slant/ground)² = 2 606. That is the
derivative of a sphere meeting a plane, one airburst in two hundred thousand is
that steep, and rule 19's continuity check simply assumes a smoothness the
geometry has not got there. Smoothing it would be lying about a sphere.

What was wrong was the number. 221 was read before the burn round (rules 80 to 84) and the radiation round (rules 85 to 89) changed the explosion's own
physics, and neither re-read rule 19; rules 85 to 89 are what gave the
radiation rings a height of burst, where the project fit had ignored it and was
smooth in consequence. The bound was stale the day it was written, by the same
hand it now binds. It was not moved for that: a bound re-read as "no worse than
the law in place" the moment it bites is the failure the whole protocol exists
to prevent, and the refusal stands as that round's verdict — in the protocol,
in the history, and in a test that breaks if anyone edits the rule after the
fact.

**The second round adopted it.** Rules 110 to 113, written and pushed before
anything was re-run, put the same candidate — unchanged to the constant, with
`ashRules.test.ts` pinning each one and three values the closure returns — to a
baseline that measures the candidate rather than the calendar: the sweep under
the law in place, and the sweep again with the candidate in place. Both read
222, hazard by hazard: impact 199, explosion 1, earthquake 16, volcano 6,
landslide 0. The candidate breaks nothing, which is what rule 108 was trying to
ask and asked wrongly, and `DEFAULT_ASH_SPREAD` is now `tephra2`.

The general lesson is in the protocol's Conduct, where the next guard will find
it: a guard on the invariants names the reading under the law in place, taken
in the same run as the candidate's, and never a count carried from another day.
A count carried from another day measures whatever else happened in between.
`scripts/benchmark/ash.ts` prints both verdicts side by side, which is the
point — a reader sees the guard that bit, the reason it bit, and the round that
answered it.

**And it costs something neither round guarded.** The 1 mm isopach reach is
printed because neither attempt was aimed at it, and it is the one figure that
does not simply improve. On the thirty eruptions both laws can score, the reach
goes from 0.993× the reference to 0.806× — further from one, which by the
round's own test is worse — while its scatter falls from 0.543 to 0.389 and the
share within a factor of two rises from 87 % to 93 %. Ten more eruptions become
scoreable at all, because the old law pushed their 1 mm isopach past the
sampled 500 km, and on the largest out to the solver's own 5 000 km limit: a
pencil-thin streak across a continent, which is not what an isopach map looks
like. No case goes the other way. So the deposit is now a little thinner along
the axis than Tephra2's and reaches less far, where before it was unbiased and
far noisier, and the shape it draws is a lobe rather than a streak. The cost is
written down as a cost.

Three things about this round are worth keeping. The first is that the
campaign had left no reference points behind, only statistics, so nothing could
ever have been measured against it; the generator that was missing is now in
the repository and reproduces the campaign's crosswind figure to three decimals
(0.008 at σ 31.83 against 31.84), which is what says it is faithful.

The second is that the candidate's form was found by scoring it twice, and the
rules say so rather than leave it to be noticed. The first attempt added
Tephra2's spread to Nimbus's source width in quadrature and came out nine times
too _wide_; reading the reference again showed Tephra2's plume-diffusion term
already carries the source's size, so the first attempt had counted it twice.
A round whose candidate is fitted to a reference cannot be pre-registered in
the strict sense — choosing the form _is_ the fitting — so what was fixed in
advance is the test of improvement, and it is a strict one: every figure must
get better and none may get worse.

The third is a defect the candidate caught on its way past, fixed here because
it is wrong rather than because it was in the way. Under the wider cloud the
isopach solver's bracket can end past the 5 000 km limit the function says it
reports, so a footprint came back at 5 000.26 km and a larger eruption, capped
at exactly 5 000, then read as smaller. The solved edge is now held to its own
limit. Under the law in place the sweep's volcano failures are the same six, in
the same scenarios, with the same numbers as before it.

What none of this settles: agreeing with Tephra2 is not agreeing with a
deposit. The reference is a model, and its eddy constant and diffusion
coefficient come from one inversion of one eruption at Colima, carried here
unchanged and declared. Three times too narrow is still too narrow, and part of
what remains between the two is a wind and not a spread — Tephra2 turns its
wind with height where Nimbus holds one constant. V3 — ten eruptions with a
published isopach map — is the rule that would read the world, and it is still
not measured.

### A ceiling credited to a man who gives a different number (16 September 2026)

`events/volcano/tsunami.ts`, `events/volcano/sourceCeiling.test.ts`. B-039.

The wave a landslide or a volcanic collapse raises at its own source is held
to 0.4 of the water column there. The code said why: "to honour the McCowan
1894 wave-breaking ceiling". McCowan's limit is **0.78** of the depth, and this
project knows that — `tsunamiCasualties.ts` carries it as `BREAKING_INDEX =
0.78`, and the shoaling section above uses it to carry a wave the last fifty
metres to the shore. The same citation, two numbers, two modules.

Nothing has been found that gives the 0.4. It is the project's own, and it now
says so: the citation is removed and **the value is left exactly where it
was**. Moving physics under cover of fixing a citation would be the worse of
the two errors, and it would move a great deal — because this ceiling is not a
rarely-touched guard but the answer itself for half the product's wave presets.
Lituya Bay 1958, Anak Krakatau 2018 in both its landslide and its volcano
framing, and Hunga Tonga 2022 all sit on it _exactly_: 48.0 m in 120 m of
water, 80.0 in 200, 60.0 in 150. For those four, what a visitor reads is this
number and not the relation above it, and `sourceCeiling.test.ts` pins that so
a change to the ceiling breaks a test that names what it changes.

What the right ceiling is remains open, and the two candidates both have a
problem. McCowan's 0.78 is a solitary wave shoaling on a flat bottom, which a
wave standing over its own source is not. And Heller, Hager & Minor's
impulse-wave equations — the field's method for exactly this generation, now in
`effects/impulseWave.ts` — produce first crests of up to 0.94 of the depth
inside the ranges their own experiments span, so their laboratory carried waves
that either limit would have cut. A ceiling put on top of those equations
counts the same physics twice.

Deciding it needs what rule L2 of the gold standard asks for and this project
does not have: ten landslides with a published slide volume and a measured wave
near the source. Until then the number is declared, its blast radius is
measured, and it is not moved.

This is the third number of its kind found by reading the page the project
already cited — after the fireball radii credited to figures Glasstone & Dolan
do not draw (B-036) and Figure 12.64 described as a probability it does not
carry. The pattern is worth naming: a citation next to a number is not
evidence that the number came from it.

### A landslide's wave by the field's own method (17 September 2026)

`effects/impulseWave.ts`, `events/landslide/simulate.ts`,
`validation/impulseWaveRules.ts`, `scripts/benchmark/impulse-wave-against-tool.ts`.
B-042, B-043. Rules 162 to 167.

The section above ended on what deciding the ceiling needed. What settled the
landslides' part of it was not a set of events but the field's own tool. The
impulse wave manual — the method dam operators and hazard agencies use for a
slide entering a reservoir — publishes a spreadsheet beside it, and Nimbus is
now held to that spreadsheet: sixty slides across its inputs, forty of
Nimbus's own scenarios and the forty-three landslides of L2, every number
within 3 × 10⁻¹⁰ and every limit the same. A slide entering open water from
above draws the manual's first crest, and nothing is put on top of it: inside
the manual's experiments that crest reaches 0.94 of the depth, and a ceiling
of 0.4 would have cut the field's method exactly where the field has measured
it. Lituya Bay 1958 reads 94 m instead of the ceiling's 48.

Reading the manual whole, rather than its first worked example, found two
things wrong here. The file the campaign read, and whose example the tests
pinned, is the **second edition** (Evers, Heller, Fuchs, Hager & Boes 2019),
whose three-dimensional generation — the one implemented — replaced the first
edition's; every citation named the first. And the slide's speed from its drop
height carried an extra sin α under the root, the fall along the slope where
the input is the vertical drop: 24 % slow at 35°, 41 % at 20°, against the
manual's Eq. 3.5 and the 41.3, 58.0 and 32.2 m/s its examples print. Neither
was on a path any scenario drew; both would have been the day it became one.

What the manual wants and a visitor rarely knows is the slide itself: its
thickness, its width and its speed as it meets the water. The form now keeps
all three, and a drop height for the speed; where they are empty Nimbus
estimates them — V^⅓ for thickness and width, Eq. 3.5 with tan δ = 0.3 on a
drop of V^⅓ · sin α for the speed — and the panel says which were estimated
and which of the manual's limits the slide falls outside of. Almost every
real slide falls outside at least one: all forty-three of L2's did. On a slope
no steeper than the bed friction angle the slide gathers no speed, the manual
gives no wave, and the panel says why instead of reaching for another law.

What this does not reach. A slide that starts under the water is not a slide
entering it, and the field's relation for that — the predictive equations of
Watts et al. 2005 — is not openly available; the one open paper that gives a
version of them (Watts et al. 2003) does not reproduce its own tables. So
submarine slides, and a confined basin such as Vaiont's, keep the calibrated
forms of the card above, and L1 is not met. Beyond the source, the wave still
spreads by the project's 1/r decay, which the manual's propagation equations —
valid to sixteen depths from the slide — do not replace.

### The coast, measured for the first time (16 September 2026)

`validation/runupRules.ts` (rules 102 to 105), `validation/runupRun.ts`,
`validation/terrariumTiles.ts`. Of the five domains, waves were the only one
whose bar had never been reached rather than missed. `docs/GOLD_STANDARD.md`
asks of the coast (T2) a bias within ×1.5 and a σ_ln no more than 0.8 against
at least 500 run-up observations of NOAA NCEI's Global Historical Tsunami
Database, and the validation report had said from the beginning that "the
coastal toll needs bathymetry, so no offline test reaches it". Nothing could
compute the left-hand side.

What was missing was plumbing, not physics. `terrainSampling.ts` had already
written down what to do — the browser fetches and decodes the terrarium tiles,
and "the validation harness hands in a loader that reads them in Node" — and
only the loader was missing. With it, the sixteen AWS terrain tiles of the
planetary mosaic decode offline in under a second, and the product's own
`computeBathymetricTsunami` propagates a wave across them unchanged.

The set is 6 672 observations of 64 earthquakes, built by a rule and not by
hand: every NCEI run-up with a height, not doubtful, not measured by a
deep-ocean gauge, whose tsunami the database blames on an earthquake it can
place. Three groups are left out because this project has already read their
wave — every tsunami of 2006 or later at magnitude 7.7 or more, which is
BM-05's own selection (5 725 observations), Tōhoku 2011 (6 014) and Sumatra
2004 (1 988) — and an event is kept only if thirty observations survive.

**T2 is not met, and not narrowly.** Over 2 468 coastal bins the model's run-up
stands at **3.16×** what was measured, where T2 allows 1.5, with **σ_ln 1.365**
where it allows 0.8. Twenty-three per cent of bins land within a factor of two.
Read against the shore height the product derives from the same cell — nearer
what a tide gauge measures, and deciding nothing — it is 2.23× and 1.285.

The failure is not uniform, and that is the useful part:

| NCEI type | bins | run-up bias | σ_ln | shore bias |
| --------- | ---: | ----------: | ---: | ---------: |
| 1         |  403 |       1.49× | 1.16 |      0.88× |
| 2         | 1661 |       4.63× | 1.27 |      3.49× |
| 5         |   79 |       0.83× | 1.21 |      0.53× |
| 4         |   15 |       0.32× | 0.89 |      0.27× |

Type 2 — the distant tide gauge, a median 3 000 km from its source reading a
median 13 cm — carries two thirds of the bins, and there the model stands 4.6
times too high. At type 1, nearer and larger, it is 1.49×, just inside T2's
bias bound. So the wave does not come out uniformly too big: it grows too large
with distance. That sits oddly beside the gap the report already declares in
the other direction — Sumatra's far coasts five to ten times under-waved — and
the two together say the far field is wrong in a way that depends on the
source, not scaled wrongly by a constant.

The scatter says something plainer and worse. σ_ln is about 1.3 at every type
and every range, against a bar of 0.8. A σ_ln of 1.3 means the middle half of
the bins are spread over a factor of six. A 40 km cell cannot hold a bay, a
headland or a river mouth, and those are what make one village's run-up three
times its neighbour's; Synolakis on a plane beach whose slope is read from a
40 km grid cannot know them either. Some of that scatter is the coast and not
the model, and this round cannot say how much.

What it does not touch: 1 070 of the 6 672 observations found no coastal cell
within 50 km and were scored by nobody. The events are mostly old, because the
recent large ones are the ones already read — this is the coast of the
twentieth century, surveyed as the twentieth century surveyed it. And nothing
is tuned on any of it (rules 5 and 6): the set is read now, and a better wave
has to be chosen against something else.

### And how many the rupture stadiums hold (16 September 2026)

`validation/polygonCountRules.ts` (rules 98 to 101), `validation/polygonCountRun.ts`.
The counter beside the circle's takes a polygon, and an extended rupture's
stadium is the footprint every scored earthquake of the calibration net counts
its people in — so if that one were out by ten per cent too, a good part of
this report would be. It is not the circle counter with a different shape: it
splits every cell of the bounding box rather than only the ones the edge
crosses, because a ring has no cheap "wholly inside" test the way a circle has
its centre-to-centre distance. The rim, though, is cut exactly as coarsely.

It passes. On thirty rupture stadiums built by a fixed rule from the same
centres the circles used — three shapes, about an M 6.5, an M 7.5 and a
megathrust, at a strike that turns 37° with each one — the count in place is a
median 0.032 % from the same counter at 32 × 32 and 1.19 % at its worst, against
a bar of 5 %. Nothing changes.

The reason it passes where the circle's failed is the size of the footprint and
not the quality of the arithmetic. The circles that missed were 20 km across, so
almost every cell they touched was a rim cell; the smallest stadium here is
about 130 km by 80 km, and its rim is a thin border around a great many cells
that are wholly inside. This round therefore says nothing about what the polygon
counter would do on a footprint a few cells wide — and it is worth knowing that
the finer sub-grid would have cost 8.8 times the wall-clock of the set, far more
than it costs a circle, so rule 101's budget would have refused it on cost had
it been needed. The cheap "wholly inside" test that would make it affordable is
named in the rules and left to a later round rather than invented in this one.

### The crater, from the numbers the book prints (16 September 2026)

`validation/craterRules.ts` (rules 90 to 93), `validation/craterRun.ts`,
`effects/nuclearCrater.ts`. The apparent crater of a nuclear surface burst is
D_a = K · W_kt^0.3, and two of the five ground coefficients stood on nothing:
hard rock's 29 m was "0.8 of dry soil, a project value" and clay's 105 m "a
project value above wet soil, with no source". A third, firm ground's 36.6 m,
came from a sentence of the book — §6.09's "about 60 ft" of radius in dry soil
— rather than from its figure.

The book does better than that sentence, and it needed no tracing. Because a
crater's size changes so fast as the burst passes through the surface,
Figures 6.72a and b print the contact-surface-burst radius and depth of a 1 kt
explosion in each of four media on the page itself, in words: 82, 61, 58 and
49 feet of radius and 31, 28, 28 and 22 feet of depth, for wet soil or wet
soft rock, dry soil or dry soft rock, wet hard rock and dry hard rock. §6.72
scales both dimensions as W^0.3, and the book's own worked example confirms the
exponent by arithmetic: it divides a 270-foot burst depth at 20 kt by 2.46 and
multiplies the answer back by the same 2.46, and 20^0.3 = 2.4622.

Three coefficients became the book's: hard rock 29 → 29.87, dry soil and firm
ground 36.6 → 37.19. The moves are a few per cent, which is the point — the
project's numbers were close, but three of them were guesses that happened to
be close, and now they are the book's.

Two did not move, and rule 92 said in advance why. Clay is not one of the
book's media at all — it has no clay — so it was never a candidate. And wet
soil's 92 m was set on the craters Castle Bravo and Ivy Mike left in the Bikini
reef, at 15 and 10.4 Mt. The book's wet soil gives 49.99, which would put those
craters at 0.89 and 0.80 km where 92 puts them at 1.6 and 1.5, near the
"mile-wide" holes they left. The figure is drawn for 1 kt. Carrying it four
decades up in yield is weaker evidence than a crater somebody measured at the
yield in question, so the measurement stays and the validation report prints
both numbers side by side rather than settling the disagreement quietly. This
is the first round where a rule had to say, before the run, that the book does
not always win.

What this cannot settle. No toll and no scored row of this project depends on a
nuclear crater, so the round is a reading of the book against the project's own
constants and not of either against the ground. The book's numbers are for a
1 kt explosion carried by W^0.3, which §6.72 calls "the best empirical fit" and
not a law, and nobody has fired a megaton contact surface burst in dry soil to
check it. The product's ground types are coarser than the book's media, and a
real site coarser still: §6.72 says the moisture of a soil alone moves the
crater significantly. And the apparent crater is not the hole a visitor
imagines — the true crater reaches further and the lip further again (§6.71) —
nor does the product draw the depth the book gives, which the report now prints
beside the diameters.

### The initial radiation, from the figures the book draws (16 September 2026)

`validation/doseRules.ts` (rules 85 to 89), `validation/doseRun.ts`,
`effects/initialRadiation.ts`. Nimbus drew its three initial-radiation rings
from a fit of its own: an LD₅₀ range of 700 m at 1 kt growing as the yield to
the 0.18, with LD₁₀₀ at 0.7 of that distance and the acute-radiation threshold
at 1.4. The fit's own comment named its anchors "Glasstone Fig. 8.46" and said
they had never been rechecked. There is no dose–range figure 8.46 in the book.
The dose–range figures are 8.33a and b for gamma rays and 8.64a and b for
neutrons — six curves apiece at 30, 100, 300, 1 000, 3 000 and 10 000 rads in
tissue, the "a" of each pair for fission weapons from 1 to 100 kt and the "b"
for thermonuclear weapons of 50 % fission yield from 0.1 to 20 Mt — and the fit
had never been read against them.

All twenty-four were traced from the public scan
(`scripts/benchmark/dose-curves.py`, on DTIC ADA087568). Each frame is
calibrated against that figure's own decade ticks, which land on their labelled
yields to under a percent — 1.012, 2.02, 5.03, 100.9 kt — and that is the
strongest evidence the axes were read right. The script refuses to write unless
each figure holds six curves, each rises with the yield, none crosses another,
the fission and thermonuclear figures of one radiation agree within 18 % where
they meet at 100 kt, and the traced gamma table reproduces the book's own
worked example at §8.34. That last check earned its place at once: the first
trace read the third curve's label as 500 rads and put the example at 394 rads
where the book reads "somewhat less than 300 … about 250". The label is 300,
the series is the regular 30-100-300-1 000-3 000-10 000, and the corrected
trace reads the example at 255 rads.

The candidate adds the two doses, reads the fission figures below 100 kt and
the thermonuclear pair above — the book's own division — corrects towards a
contact surface burst below 300 feet by Table 8.37 for gamma rays and by one
half for neutrons (§8.37, §8.65), and turns the figure's slant range into a
ring on the ground, √(slant² − height²). The three doses the rings are drawn at
do not move: 800, 450 and 100 rads, project values after OTA 1979, UNSCEAR and
BEIR VII, not the book's.

The rules were pushed before the candidate drew a ring for any preset (commit
`06f31d1`). Rule 87 made the choice an adoption unless a guard failed, because
the candidate replaces a fit whose anchors cite a figure that does not exist
with the source the project claims. None failed, and the figures are in place.
The rings widen almost everywhere: Hiroshima's LD₅₀ goes from 1.14 to 1.33 km,
the 1 Mt reference from 2.43 to 2.77 km, Castle Bravo from 3.95 to 4.88. The
three rings also crowd together, because the book's own curves do: the fit put
LD₁₀₀ at a flat 0.7 of LD₅₀ and the threshold at 1.4, where the book puts
Hiroshima's at 0.91 and 1.26 of it. And the rings now answer to the height of
burst, which the fit could not: Tsar Bomba, burst 4 km up, draws 2.77 km where
the fit drew 4.91, and a burst above the atmosphere draws nothing.

What this cannot settle is written in the rules. No toll can judge it: no death
in Nimbus is counted from initial radiation at all, so this is a reading of the
book against a fit and not of either against the world. The figures stop at
1 kt and 20 Mt and are held flat outside, so Tsar Bomba's 50 Mt is read as
20 Mt and its rings are too small by an unknown amount. Rads of neutrons are
added as if worth the same as rads of gamma rays, where §8.65 says they are
often worth more. The rings step down 5.3 % at 100 kt, where the book itself
changes weapon. And the book's own reliability is a factor of two either way on
a fission weapon's dose, which puts Hiroshima's LD₅₀ anywhere from 1.22 to
1.49 km — wider than the distance between the fit and the figures at some
yields. The report prints that band beside the rings, deciding nothing.

### An air burst's rings, from the curves the book draws (17 September 2026)

`validation/hobRules.ts` (rules 168 to 173), `validation/hobRun.ts`,
`events/explosion/hobCurves.ts`, `scripts/benchmark/hob-curves.py`. A burst in
the air reaches farther than one on the ground, because its wave reflects from
the surface and, past a point, the reflected and incident waves merge into a
Mach stem. Nimbus drew that with a factor on the surface burst's radii — 1.0 on
the ground, 1.5 near the optimum height, falling to 0.25 high up — which its
own module called "a piecewise function chosen by the project". Glasstone &
Dolan draw the effect itself: Figure 3.73c gives, for a 1-kiloton burst, the
peak overpressure on the ground as contours over distance and height of burst,
at 1, 2, 4, 6, 8, 10 and 15 psi, and the caption scales both axes as the cube
root of the yield.

The seven curves were traced from the public scan. The page is skewed by
under a degree and not quite straight, so no two calibration points would
do: every one of the twenty-seven grid lines is located and a smooth map from
pixels to feet is fitted through all of them (0.88 px rms). The grid, the
dashes of the triple-point line and the labels are then taken off the ink, the
gaps the scan leaves in the curves are closed, and the curves cut the plot
into regions; each curve is read where a ray from ground zero passes from one
region to the next. Rays, because along a line of constant angle of incidence
the overpressure falls as the scaled slant range grows, which is also what
makes it the right direction to interpolate in: 5 psi, which the book does not
draw, lies between the 4 and 6 psi curves in the logarithms of both range and
overpressure along each ray. The trace passes the caption's own worked example
(4 psi reaches farthest, 2 600 ft, for a burst at about 1 100 ft: the trace
reads 2 618 at 1 080) and the example scaled to 125 kt, and it agrees with the
same 10 and 15 psi curves as Figure 3.73b draws them, read from another page on
its own grid, within 3.9 % — which is also how far apart two figures of the
same book stand.

The ring for a burst is the farthest distance at which its contour crosses the
burst's scaled height, as §3.74 reads the figure; above the contour's top the
overpressure never reaches the ground and the ring is zero. The strongest
evidence the trace is right came from outside it: on the five cases the
benchmark campaign kept of its comparison with NUKEMAP, the 1 psi ring is
0.999× to 1.003× NUKEMAP's, where the factor stood 1.17× to 1.20×. Hiroshima's
5 and 1 psi rings go from 1.69 and 4.98 km to 1.62 and 4.49, Tsar Bomba's 1 psi
ring from 64 to 54 km, and a nuclear burst on the ground now reads the curves
at a height of zero, 12 % inside the surface relation's 1 psi ring. Hiroshima's
toll moves from 116 639 to 109 102 against the record's 105 000; it was tuned
on the factor's rings and is not re-tuned.

What the round found besides. Under the factor every burst below 30 km had a
5 psi ring, and the blast casualty plan returned nothing without one; under the
curves a burst high enough that 5 psi never reaches the ground still puts 1 psi
there, and its people were in no band at all. The plan now keeps their 2 and
1 psi bands.

What it leaves. The 0.5 psi light-damage ring, below anything the figure draws,
carries the 1 psi curve out by the surface relation's ratio, the project's
closure. A chemical charge keeps its own surface radii — Kingery–Bulmash's since
18 September 2026, below — and takes the curves' change with height at twice
its yield. A burst in the water went on
shortening the surface relation's radius, so its 1 psi ring stepped by 14 %
across the waterline; rules 174 to 176 closed that the same night, shortening
the book's contact surface burst instead — the reference burst §6.81 adjusts —
and the step is now the depth factor's alone. The figure is for nearly ideal
surfaces and a sea-level atmosphere:
a precursor over heated or dusty ground (§3.79) and bursts above 5 000 ft are
read without the corrections the book describes. And the explosion sweep gains
one failure, a 5 psi ring just under the top of its contour, where the
farthest crossing moves steeply with the height — the geometry of any contour
near its top, declared.

### A charge on the ground, from the compilation the field uses (18 September 2026)

`validation/chemicalBlastRules.ts` (rules 177 to 181), `effects/kingeryBulmash.ts`.
A chemical charge drew its rings from Kinney & Graham's fit for a charge in
free air, entered at twice its yield because a charge on the ground reflects
its blast and, reflecting perfectly, acts like twice the charge. N1 asks that
the same charge be held to Kingery & Bulmash — the compilation CONWEP, the
United States explosives safety standard, NATO's AASTP-1 and the United
Nations' IATG all compute a charge's blast with — and the campaign of 15
September measured it: the rings came out 0.990× the reference with a scatter
of 0.04 in the log. Within ten per cent, and not the same relation.

Kingery & Bulmash fitted explosive trials from under a kilogramme to over four
hundred tonnes; Swisdak (1994) republished those curves as one-line
polynomials, "accurate to within 1 % of the original Kingery values", and the
model is now written from his Table 1: three ranges of scaled distance from
0.2 to 198.5 m·kg⁻¹ᐟ³, read from the scan of a document approved for public
release and from nobody's code. Four readings hold the transcription in CI —
the worked examples the United Nations' IATG 01.80 prints for 1, 10 and 100 t
at 50 m, within 1 %; the paper's own English coefficients, converted, within
0.1 %; the joins between its ranges, within 1 %; and an implementation of the
same fits written by somebody else, run as a black box on 488 points over
eight charges from 1 kg to 1 kt, which it agrees with within 1.9 × 10⁻⁶. That
last reading was taken after the adoption, at Andrea's request, and changed no
verdict.

What moved: a chemical charge's 5 psi ring by 0.9 %, its 1 psi ring by 6.6 %
outward, its 0.5 psi ring by 2.9 % inward — one ratio each, at every charge
mass, because both relations scale with the cube root. The inner edges of the
casualty bands, 12 psi inside the 5 psi ring and 2 psi inside the 1 psi ring,
now come off the same curve as the rings they are measured from. A nuclear
burst is untouched, and the height-of-burst curves still change whichever
surface burst the charge has.

What it does not fix. Kingery's compilation carries the weather and the charge
performance of the trials behind it; Swisdak's paper says its curves must not
be extrapolated beyond the ranges printed, and warns that at low pressures,
where weather rules, a measurement may differ from the standard by a long way.
The curve also steps up by 0.65 % where its third range begins, at
23.8 m·kg⁻¹ᐟ³, which is between the 1 psi and 0.5 psi rings and touches
neither.

### The exposure that burns, from the book's own figure (16 September 2026)

`validation/burnRules.ts` (rules 80 to 84), `validation/burnRun.ts`,
`effects/burnExposure.ts`. Nimbus drew every burn ring at 8, 5 and 2 cal/cm²,
whatever the explosion. Those three numbers were the project's own. Glasstone
& Dolan, the book the project cites for them, give no fixed threshold: in their
Figure 12.64 (page 564 of the 1977 edition, which the text calls 12.65) the
exposure that burns grows with the yield, because a larger explosion spreads
the same heat over a longer pulse and the skin sheds more of it as it arrives.
Nine curves — first, second and third degree, each for light, medium and dark
skin — carry it from 1 kt to 10 Mt. The validation report had declared the
difference a gap since 14 September.

The curves were traced from the public scan by machine
(`scripts/benchmark/burn-curves.py`, on DTIC ADA087568): it finds the frame and
the axis, seeds one point per curve in a column clear of the legend, follows
each by continuity and slope, and refuses to write anything unless it has nine
of them, each rising with the yield and none crossing another. The reading is
good to about a tenth of a cal/cm², half the thickness of a printed curve, and
it lands where the book's own worked example puts it: at 1 Mt the book says a
population between 4.5 and 6 cal/cm² takes first-degree burns with some second,
and the traced first-degree line sits at 3.3 and the second-degree at 6.3.
At 1 kt the third-degree curve asks 6.2 cal/cm² of an average exposed
population and at 10 Mt it asks 11.8, where the project asked 8 throughout.

The rules were pushed before the curves were run on any row of the calibration
net (commit `bd255bc`). Rule 82 made the choice an adoption unless a guard
failed, because the candidate replaces three project numbers with the book's:
the trace's own checks, the release gate, and no ring moving by more than a
factor of two. None failed — the largest move is a factor of 0.83, Tsar Bomba's
first-degree ring falling from 71.3 to 60.3 km — so the curves are in place for
every explosion, at the middle of the three pigmentations. A small yield's
rings mostly shrink and its third-degree ring grows: Hiroshima's three go from
4.03 · 2.66 · 2.14 km to 3.65 · 2.80 · 2.25.

What this cannot settle is written in the rules. A systematic error in the axis
would move every threshold together, and the checks catch a crossing or a fall,
not a shift. The book's lines are for exposed skin with no evasive action and
no protection from structures or clothing, and clothing, shade and pigment move
the exposure by more than the reading error — the figure's own light and dark curves put Hiroshima's
third-degree ring at 2.15 and 2.36 km around the 2.25 in place, and the report
prints them beside, deciding nothing. And no row of the net can judge the
change: only two of its rows are explosions, Hiroshima's toll is tuned on its
own mortality and Beirut's charge is chemical, which draws no flash at all.
An impact keeps the project's fluences (rule 81): the book's curves are the
pulse of a nuclear fireball, and what it takes to burn under an impact's is a
gap of its own.

And one thing this round read wrongly, found the same day, after it had been
run and adopted, and written here rather than quietly mended. Figure 12.64 is
captioned "Radiant exposure required to produce skin burns for different skin
pigmentations". It attaches no probability to any curve. The rules, the report
and this page all described it as the exposure at which half of an average
exposed population takes the burn — and that is the book's _next_ figure, 12.65,
whose solid lines are exactly that and whose broken lines divide the 18 % and
82 % bands. The worked example rule 80 checks the trace against (§12.65: between
4.5 and 6 cal/cm² at 1 Mt, 18 % second-degree and the rest first) is read off
12.65, so that check is a consistency check across two figures and not the
reproduction of an example on the figure traced. It is weaker than it was
described as being.

Where the two stand beside each other is this. At 1 Mt the traced first-degree
curve for a middling skin asks 3.32 cal/cm², below the 4.5-to-6 band in which
§12.65 puts 18 % of an exposed population at second-degree burns and the rest
at first; the traced second-degree curve asks 6.30, just above that band.
The numbers are unchanged and correct for the figure they came from; what was
wrong was the sentence describing them, and it is corrected in the rules' own
text, in the report's declared gaps and here.

Figure 12.65 was then traced as well, the same night, so that the difference
could be read rather than argued about (`scripts/benchmark/burn-probability-curves.py`;
nothing in the product moves on it). It reproduces its own worked example on
its own figure, which the 12.64 trace could not: at 1 Mt the 18 %-second-degree
band runs 4.71 to 6.25 cal/cm² where §12.65 reads 4.5 to 6. Its seven curves at
1 kt and 10 Mt, in cal/cm²:

| curve                           | 1 kt | 10 Mt |
| ------------------------------- | ---: | ----: |
| 100 % third-degree              | 6.99 | 12.80 |
| 50 % third-degree               | 5.97 | 10.98 |
| 18 % third-degree, 82 % second  | 4.99 |  8.56 |
| 50 % second-degree              | 3.97 |  7.00 |
| 18 % second-degree, 82 % first  | 2.87 |  5.32 |
| 50 % first-degree               | 1.92 |  3.64 |
| 18 % first-degree, 82 % no burn | 1.11 |  2.19 |

Set beside them, 12.64's middle pigmentation asks a little more exposure than
12.65's 50 % line everywhere: 8 % more at 1 kt and 14 % at 10 Mt for a
first-degree burn, 2 % and 9 % for a second, 4 % and 7 % for a third. Since a
ring goes as the inverse square root of the exposure it is drawn at, the rings
this product draws are between 1 % and 7 % narrower than 50 % rings would be —
a real difference, and a small one.

So the choice is not between a right figure and a wrong one. It is between
drawing the exposure a burn needs on an average skin, which is what the product
does, and drawing the exposure at which half of a mixed population burns, which
would also come with the book's own 18 % and 82 % bands and give every ring a
band instead of a line. That is a choice about what a ring is meant to mean,
and it is Andrea's to make; nothing has been adopted on it.

### The entry model against the bolides (16 September 2026)

`validation/fireballRules.ts` (rules 76 to 79), `validation/fireballRun.ts`.
The impact pipeline's atmospheric entry is Collins, Melosh & Marcus 2005's
equations 8 to 20, and every figure of it agrees with the Earth Impact Effects
Program — their own program — within the program's printed rounding. That says
the equations are coded right. It says nothing about the sky. NASA JPL's
Center for Near-Earth Object Studies publishes what the United States
Government sensors recorded of every fireball since 1988, and among those
numbers is the altitude at which each burned brightest: the one quantity the
entry model predicts and the sensors measure.

The rules, the set and the run were pushed before the model was run on any
bolide (commit `1af2286`). Rule 76's set is the 357 bolides of 1 072 that carry
an altitude, a pre-entry speed with its components and an energy, from 1998 to
2026, less Chelyabinsk 2013, whose preset carries the body Popova et al. 2013
measured. Rule 77 builds each body from what was measured — mass twice the
energy over the speed squared, diameter that mass at 3 000 kg/m³, angle from
the velocity's components at the place — and runs the entry as the panel runs
a scenario that names no class, which takes Collins et al.'s equation 9 for the
strength.

| Body                              | Burst in the air | Median \|Δh\| |  Mean Δh | Within 5 km |
| --------------------------------- | ---------------: | ------------: | -------: | ----------: |
| No class (Collins et al.'s Eq. 9) |       356 of 357 |       13.7 km | +12.8 km |   49 of 356 |
| The panel's stony class, 1 MPa    |       355 of 357 |        8.3 km |  +6.6 km |   99 of 355 |
| An iron, 50 MPa at 7 800 kg/m³    |        68 of 357 |       20.7 km | −20.4 km |     2 of 68 |

The model bursts too high. Its median burst altitude is 46.9 km where the
sensors put the peak brightness at 33.3 km, and 329 of the 356 bursts are above
the record rather than below it. `docs/GOLD_STANDARD.md` asks a median absolute
difference of 5 km and a mean within 3 km of an impact's entry (I2): the
reading misses both by a factor of three or more, and the gap is now declared
in the validation report. Nothing in the model moves — rule 79 lets this
reading decide nothing, and rule 5 forbids tuning on a set that has now been
read.

What the scores do not show was read afterwards, and is written here as such.
The bodies are small: a median diameter of 1.6 m and none above 11 m, since a
catalogue of fireballs is a catalogue of metre-scale stones. The difference
hardly moves with the entry angle — a median of 13.8 km below 20° from the
horizontal, 15.3 km from 20 to 45, 12.2 km from 45 to 70 and 11.9 km above it —
so it is not the geometry. It moves with the strength: at the panel's stony
class, ten times the strength Collins et al.'s equation 9 gives that density,
the median difference falls from 13.7 to 8.3 km, and at an iron's the same
bodies survive to the ground 289 times, which the record says they did not. A
strength chosen to fit these altitudes would fit them; rule 5 forbids it, and
any choice among strengths belongs to a set nobody has read yet. What the
reading does settle is that the entry a visitor gets, for the body a visitor
types, bursts about 13 km higher than the sky does.

### The invariants after the campaign's fixes (16 September 2026)

`scripts/benchmark/invariants.ts`, `benchmark/results/invariants-2026-09-16.json`.
The benchmark campaign of 15 September drew 5 000 random scenarios of every
hazard over the ranges the custom forms accept and asked of each output that it
be finite, non-negative, inside the planet, monotone in the size of the event
and continuous in it. On the physics of that night it found 12 104 failures:
11 284 on impacts, 419 on earthquakes, 401 on volcanoes, none on explosions or
landslides. The fixes that followed — the aftershock loop that never returned
(B-027), the fire radii past the antipode and the areas larger than the Earth
(B-028, B-031), the ashfall's isopach edge (B-029) — were each pinned by a test,
but nothing had drawn the 25 000 scenarios again. This is that draw, on the
physics of this commit.

| Hazard     | The campaign | Tonight |
| ---------- | -----------: | ------: |
| impact     |       11 284 |     199 |
| earthquake |          419 |      16 |
| volcano    |          401 |       6 |
| explosion  |            0 |       0 |
| landslide  |            0 |       0 |

What is gone is what the fixes were for: no run hangs, no radius reaches past
the antipode, no area is larger than the Earth's surface, and the ashfall's
range and area grow with the eruption again. What is left is almost all one
finding of the campaign, BM-16: an airburst's blast rings shrink by a few tenths
of a percent as the body grows, because a larger body bursts lower, where the
altitude factor lifts the reach less — 193 of the 199 impact failures are
that, with four on the crater and its rim and two on the impact tsunami's
far-field amplitude. The 16 earthquake failures and the 6 volcanic ones are threshold
crossings: a ring that appears where there was none (MMI IX at 0.00 → 853 m),
the liquefaction radius stepping over its threshold, the ashfall's plume
crossing a grain-size regime. `docs/GOLD_STANDARD.md` (G5) asks that none of
them happen, so the rule is not met; the count is the measure of how far it is
from met, and it is much nearer than it was.

**And drawn once more at the end of the same day** — after the burn round
(rules 80 to 84) and the radiation round (rules 85 to 89) had changed the
explosion's own physics, which neither round re-read this sweep for —
`benchmark/results/invariants-2026-09-16-1.json`. The impact, earthquake,
volcano and landslide counts are unmoved at 199, 16, 6 and 0; the explosion
goes from 0 to **1**, and the total from 221 to **222**.

The new failure is `continuous: radiation.ld50Radius`, and it is the price of
having made those rings honest. Rules 85 to 89 read the initial-radiation
ranges off the book's own dose–range figures, which give a **slant** range, so
the ring on the ground became √(slant² − h²) and started answering to the
height of burst — where the project fit, 700·W^0.18, had ignored it and was
smooth in consequence. At 1.258 Mt and a burst height of 2 751.65 m the 450-rad
slant range is 2 752.18 m: the lethal sphere touches the ground with
fifty-three centimetres to spare, and cuts a ring of 53.9 m. A 0.1 % step in
yield moves the slant by 0.017 % and the ring by 37 %, amplified by
(slant/ground)² = 2 606 — the derivative of a sphere meeting a plane, which is
unbounded where they are tangent. One airburst in two hundred thousand is that
steep, and the sweep's 5 000 found the one.

It is declared and not fixed. The invariant asks for a smoothness the geometry
has not got at that point, and rounding the sphere off to satisfy it would make
the ring wrong everywhere to make one test green. It is also what refused the
ash round of the same night, whose guard had been written against the 221 above
— see "The ash cloud is a hundred and twenty-five times too narrow".

**And the impact family's read to their causes, the same evening.** One
sentence above is wrong: "193 of the 199 impact failures are that", the
altitude factor. The factor had been gone since B-032 replaced it with the
Earth Impact Effects Program's own air blast the day before. Followed one by
one, the 199 are: 177 blast rings that shrink when a larger body bursts lower
in the Mach region, below its optimum height — the program's own
overpressure falls with them on the body it was asked about, 3 453.9 to
3 445.8 Pa at 76.65 km — and 10 that jump, 2 at the step between regular and
Mach reflection and 8 where a ring is born under the burst; 6 burn rings at
the passage from a complete to a partial airburst; 4 crater sizes at Collins
et al.'s simple-to-complex step; 2 tsunami amplitudes at the seafloor cutoff.

Three things followed. The step went: the program does not take it, and its
passage, read off it and held out on twelve bodies, is now the law (rules 129
to 131; see "Amended on 16 September 2026: the program does not step"). A
partial airburst's two flashes now add, where the ring was the larger of
them — rules 132 to 137, pushed before a sweep run three times in one session
(`invariants-2026-09-16-5.json` to `-7`): with the flashes added no burn ring
fails and nothing else moves. The seafloor share's taper, which cleared the
two tsunami failures, was refused, because it moved the crater step onto one
more random scenario and the rule let no count grow. And B-041 was found and
fixed on the way: an airburst's flash had been drawing its burn rings at a
nuclear fireball's exposure since the explosions' default moved to Glasstone
& Dolan's curves, against rule 81.

| Impact failures                           | 8bf7057 | the step replaced | the flashes added |
| ----------------------------------------- | ------: | ----------------: | ----------------: |
| blast rings that shrink (Mach region)     |     177 |               167 |               167 |
| blast rings that jump                     |      10 |                 8 |                 8 |
| burn rings that shrink                    |       6 |                 6 |                 0 |
| crater sizes at the simple-complex step   |       4 |                 4 |                 4 |
| tsunami amplitudes at the seafloor cutoff |       2 |                 2 |                 2 |
| **total**                                 |     199 |               187 |           **181** |

The 8 jumps left are all rings born under the burst: its peak overpressure on
the ground is 0.4 % to 3 % above the threshold, and a ring drawn under a peak
that close grows steeply from nothing, as the lethal-dose ring above does. The
crater step is the published law; asked across it, the program prints its
craters to two figures and answers the bodies just below it with an error
(HTTP 500 for iron bodies of 101 to 110 m and stony ones of 170 to 180 m at
20 km/s and 45°), so whether it steps cannot be read off it. What is left of
the 181 is the program's physics, the published crater law, and one cutoff of
the model's own, declared.

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
so the cut bites only at impact scale and no nuclear scenario moves. (Corrected on 15 September 2026: the impact relation is Collins et al.'s Eq. 32\*, and the nuclear one 61 · W^0.4 m, twice the breakaway radius Glasstone & Dolan give in §2.127, which the globe's fireball now shares; Hiroshima's is seen to 48 km and a 50 Mt burst's to 243 km, B-036. Corrected again the same day: the cut was the horizon of the point R_f above ground zero, which the fireball outlasts. A sphere of radius R_f about ground zero keeps some of itself in sight until the curve of the Earth between it and the observer, (1 − cos Δ) · R⊕, reaches R_f — Collins et al.'s Eq. 37\*, the cut the program makes — so d = R⊕ · arccos(1 − R_f / R⊕): a 200 km fireball is seen to 1 600 km, the Chicxulub preset's to 1 616 km instead of 1 591, and the toll of that body on Rome gains 0.16 %, B-037. The program also dims the flash by the share of the fireball still in sight, their Eq. 36\*, which this model leaves out. The cut reached the deaths and the fire radii but not the burn rings the globe drew and the panel printed until B-038, the same day: Boltysh's third-degree burns reached 936 km and Chicxulub's 27 478 km, where their fireballs set at 523 and 1 616 km. They stop there now, and no toll moves.)
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
  legend — is, since 16 September 2026, the Earth Impact Effects
  Program's wave (`events/tsunami/impactProgram.ts`), read off the rings
  the program draws and held out on fourteen impacts (rules 150 to 153);
  until then it was the Wünnemann, Collins & Weiss 2010 rim wave
  (`events/tsunami/wunnemann.ts`), a transcription of their eqs. 9a/10a,
  not a fit, which falls faster in deep water and is kept as a law the
  model can still be run with. The impact-tsunami hazard itself is
  contested (Melosh 2003 "over-rated"; Wünnemann 2007).
- **Landslide / volcanic-collapse source amplitude**
  (`events/volcano/tsunami.ts`) — a Watts-2000-INSPIRED
  `K·(γ/γ_ref)·V^(1/3)·sinθ` calibrated per regime, not Watts'
  predictive equation (slide thickness and Froude number are folded
  into the regime prefactor).
- **Seismic-tsunami coupling triplet** (`events/earthquake/seismicTsunami.ts`)
  — the rupture aspect, dip-uplift, and wave-coupling factors are
  tuned to the Tōhoku DART + Sumatra anchors; that is calibration to a
  few targets, not independent validation.
