# Porta 1 — the sources of 26 September 2026 (rules 1235 to 1240)

The batch Andrea put in `~/Desktop/Nimbus-fonti/` on the morning of 26 September 2026, catalogued
before it was read (rule 1235), read whole through the altitude mask by five readers, and checked
against the masked texts before anything was recorded (rule 1236). Only fact sheets, fingerprints and
short quotes enter the repository; the texts stay outside it. Development only: nothing is coded,
fitted or adopted.

## What came in

| Source                                                                                              | SHA-256   | For                                     |
| --------------------------------------------------------------------------------------------------- | --------- | --------------------------------------- |
| Rulko, Rau, Chomette, Wheeler, Mathias, Dotson & Radovitzky (2025), Icarus 434, 116526 (AM)         | 1d7e2e9f… | item (a), the breakup criterion         |
| Rulko (2024), MIT SM thesis, «On stress, strength, and failure in asteroids during planetary entry» | f7657228… | item (a)                                |
| Register, Aftosmis, Stern, Brock, Seltner, Willems, Guelhan & Mathias (2020), Icarus 337, 113468    | 5e245a32… | item (c), the interaction               |
| Klekociuk, Brown, Pack, ReVelle, Edwards et al. (2005), Nature 436, 1132                            | 3ea14a48… | item (b), the share of the settled mass |
| Register, Mathias & Wheeler (2017), Icarus — R17                                                    | 4a5fe381… | the branch's own source, journal text   |
| Wheeler, Mathias, Stokan & Brown (2018), Icarus 315 — W18                                           | ea241bff… | the branch's own source, journal text   |
| Tárano, Wheeler, Close & Mathias (2019), Icarus 329                                                 | 9c418f2a… | priors for the branch                   |
| Wheeler & Mathias (2019), Icarus 327, 83–96                                                         | 1f267784… | PAIR's practice: blast, inputs          |
| Wheeler & Mathias, property distributions (reprint, Icarus 327, 72–82)                              | 0811b866… | population priors                       |
| Robertson & Mathias (2019), Icarus 327, 36–47                                                       | 7689870f… | blast, burst altitude, tree fall        |
| Johnston & Stern (2019), Icarus 327, 48–59                                                          | 1be1f881… | thermal radiation                       |

The scan `Seismo_1314.pdf` is O'Keefe & Ahrens (1985), already read (rule 1192 (b)). The bundles'
other Icarus articles (Europa's plumes, volatile transport, the lunar neon exosphere, hydrogen cyanide
in exoplanet atmospheres, corrigenda, editorial boards) are not about this project. Rietmeijer et al.
(2016) was not found.

## The entry's three items

**(a) The breakup criterion — Rulko et al. (2025), Rulko (2024).** Elastostatics of a monolith under
the entry's loads gives the largest equivalent stress inside as the stagnation pressure divided by a
strength factor F that mechanics fixes: 10.3 for a circle in two dimensions; 35, 17.5 and 10.3 for a
sphere at Poisson ratios 0, 0.2 and 0.4; 3.2 to 65.6 for six real shape models, by orientation; lower
with spin. The equivalent stress is Mohr–Coulomb with k = 0.14 ± 0.02 from laboratory meteorite
strengths — as printed, σ_I + k·σ_II does not give the paper's numbers; the classical σ_I − k·σ_II
(σ_II compressive) does. The thesis uses the largest principal stress (F ≈ 20) and a compressive
Weibull size law. What is missing is the strength the stress is compared with, at the body's size: the
laboratory tensile strength of 30 MPa, unscaled, puts Chelyabinsk's first break at about 525 MPa,
above the paper's own peak stagnation pressure for it (about 0.4 GPa). **Not identifiable** as a
replacement for «break when ρv² ≥ S»: without the strength at scale it relabels S. It would become
identifiable with a tensile size law measured in the laboratory and a Poisson ratio from meteorites.

**(b) The settled mass — Klekociuk et al. (2005).** No fraction is stated: a dust cloud of
(1.1 ± 0.3)·10⁶ kg, a lower limit, against meteoroid masses of 0.6–1.9, 0.65 ± 0.05 and 1.4 ± 0.3
·10⁶ kg; the review's 79 % is the infrasound ratio alone. The kind of fate is confirmed — micrometre
silicate dust, not nanometre smoke, suspended or settling slowly; the share is **not identifiable**
(`docs/PORTA1_SETTLED_FATE.md`).

**The stop, corrected.** R17's «limiting velocity» belongs to its stand-alone pancake (Sect. 2.3); its
fragment-cloud model (Sect. 2.7) and W18 (p. 2) fly every cloud until it reaches the ground or ablates
away. The branch's settle stop (deviation D9) is the pancake's, carried over: it changes no energy of
consequence, and the mass it stops is, in the published model's terms, cloud debris flown on at its
terminal speed — never meteorite mass (`docs/FCM_DEVIATIONS.md`, rule 1239 (b)).

**(c) The interaction — Register et al. (2020).** A pair law whose constants come from CFD and two
wind-tunnel runs: a child released at size ratio r and angle θ ends in the near wake, the far wake,
the parent's shock, independent flight or ahead, after a time D₁·(ρ/q)^½·τ(r, θ). The branch's
independent wakes are one of those five outcomes, reached only after that time; small children are
mostly caught in the wake. For an equal pair side by side the lateral speed is 0.34 of Passey &
Melosh's. **Not identifiable**: the paper itself names the distributions of fragment sizes and
release angles as the primary missing elements, and in an energy-deposition curve the effect is
degenerate with strength, strength scaling, cloud fraction and C_disp.

**Priors — Tárano et al. (2019).** The fragment-cloud model fitted by a genetic algorithm to three
light curves (Chelyabinsk, Lost City, Benešov), C_disp fixed at 3.5; cloud fraction, strength scaling
and fragment count searched and never reported; the fits are not unique. No prior for the branch comes
from it that was not chosen on its development cases.

## For the blast and the heat (not opened)

**PAIR's blast (Wheeler & Mathias 2019).** A static source at the altitude of peak energy deposition,
with the entry's whole energy; damage radii from height-of-burst maps — Glasstone & Dolan's below 5
Mt, Aftosmis, Mathias & Tarano's CFD maps above 250 Mt, interpolated linearly between (the variable is
not stated, and it matters); 4 psi (27.6 kPa) as the damage radius; about 45–50 m/s of wind at 4 psi
and 24–28 m/s at 2 psi in 15 Mt simulations. The maps themselves are in Aftosmis, Mathias & Tarano
(Acta Astronautica, doi:10.1016/j.actaastro.2017.12.021), which is not in the batch.

**Robertson & Mathias (2019).** No moving-source blast: a half-energy burst altitude calibrated on
their hydrocode runs (Eq. 3, drag coefficient 1 and pancake factor 4, not fitted to Tunguska), and a
tree-fall criterion on the wind at the top of the canopy. Their warning bears on the audit's blast
finding: at Tunguska the trees' strength alone spans 3 to 30 Mt, so the damage criterion must be fixed
independently before the propagation is blamed.

**Johnston & Stern (2019).** The ground flux from the shock layer and wake of the moving body or debris
cloud, a closed form fitted to coupled CFD and radiation simulations (±30 %), with a fit for the
atmosphere's absorption (±15–25 %), for 6 to 18 km/s — a moving source by construction, giving the
flux history at each ground point that a long-pulse threshold needs. Its 40 J/cm² charring threshold
is fixed and says nothing of pulse length; its Tunguska radius and cloud cap are fitted there.

**Population priors (Wheeler & Mathias).** NEOWISE albedos, D = 1.326·10⁶ m·10^(−H/5)/√p_v, H
frequencies, density and speed ranges: independent of this project's events. PAIR's fragment-cloud
settings (80 % cloud, strength scaling 0.1–0.3, a halved ablation coefficient) were informed by fits to
four of this project's development cases.

## What the mask let through, and the blind events named

Nothing used, nothing copied: the coordinates in Klekociuk et al.'s Fig. 1 caption; two Monte Carlo
burst altitudes in Wheeler & Mathias; an altitude split across a line in Register et al.; W18's
integration step; figure ticks and a code listing in Rulko's texts; the constants of Johnston &
Stern's Eq. 8. None is a blind target's altitude, and the mask is hardened before any further source
on an event outside the development list is read. Rulko's thesis lists Neuschwanstein, Bunburra
Rockhole and Grimsby (round 3) among the fireballs one of its figures plots, with no number of theirs
in the text; Tárano et al. cite Neuschwanstein in a reference's title only.
