# Round 1 — the fragment-cloud entry branch (FCM): the opening dossier

Rules 1137–1147, `src/physics/validation/fcmRoundRules.ts`, 24 September 2026, on the reviewer's
programme of work by whole rounds: a dossier at the start, a package at the end, no approval step
by step inside the perimeter, no change of population, targets or judge after predictions. The study
A (rules 1129–1136) folds in: its law and prior are the branch's ablation.

**Sources** (NTRS open copies): Register, Mathias & Wheeler 2017 («R17», 20180003387) — the flight
equations, the pancake cloud, the combination model, Chelyabinsk's parameters; Wheeler, Mathias,
Stokan & Brown 2018 («W18», 20180002835) — structured bodies, four events. Wheeler et al. 2017
(Icarus 295) was not found in an open copy: where W18's figure and R17 differ, R17's printed
equations are taken and the difference recorded.

## Question, use and domain (rule 1137)

Where a stony body deposits its energy and what reaches the ground, for probabilistic assessment.
Domain: bulk density 1 500–4 000 kg/m³, diameters 0.1–300 m, 11.2–30 km/s, 15°–90°. Out of it, said
so: irons, comets, grazing entries, bodies above 300 m. Collins stays the baseline and comparator;
the seal of the 308 scenarios stays its regression test; the product is not replaced in this round.

## The branch (rule 1138)

Every component — body, fragments, clouds — flies numerically: drag (C_d = 1, R17's ½ C_d
convention), ablation dm/dt = −½ σ ρ A v³, gravity and the turn of the path, on R17's 1976 US
Standard Atmosphere (the exponential one as a sensitivity), from 100 km, in 10 m steps. A piece
breaks where ρv² reaches its strength; children are stronger by (m_p/m_c)^α up to 330 MPa; each
break gives N fragments and a cloud (R17's combination is one setting); the body may start as W18's
structure groups. Clouds spread as v_disp = v (C_disp ρ/ρ_b)^½ under a common bow shock and ablate.
The deposition is the change of kinetic energy of every component per altitude, at 10 m and 1 km —
never called «the predicted flare»; each draw keeps a physical ledger. Left for later: shape and
spin, the collective wake, detailed heat exchange, 3D lateral spread, the light.

## Parameters and structures (rules 1139, 1140)

Effective parameters kept apart from measured ones. Priors: initial strength as the product's two
stages; α 0.05–0.6; 2 fragments per break (3, 4 as sensitivity); larger share 0.5–0.8; cloud share
0.05–0.85; C_disp log-uniform 1–3.5 (0.1 as sensitivity); σ log-uniform 1e-9–1.6e-8 s²/m². Tuning on
declared development cases allowed, recorded, frozen before round 3. Every result under two
structures (the progressive monolith; W18's structured body) and two clouds (unlimited spread; capped
at ten radii); large differences published as structural uncertainty; a regime failing
systematically restricts the domain or keeps two branches — no universal law forced.

## The gates (rules 1141, 1142)

1. **Numerical**: the ledger closed at every break and at the end to 10⁻¹², nothing negative; the
   limits (no break, σ = 0 → Collins's Eq. 8; σ > 0 → m₀ exp(σ(v² − v₀²)/(2C_d))) to 10⁻⁶;
   convergence under 2 % (or small absolute limits near zero) on step, bins, floor and bound.
2. **Reproduction**: R17's Chelyabinsk pancake (peak about 50 % above the observed 82–83 kt/km, near
   29–30 km; W18: FCM at 3 300 kg/m³ about 123 kt/km) and R17's other settings; W18's Košice,
   Chelyabinsk and Tagish Lake against what W18 states. Within 5 % on the integrated energy and 1 km
   on the main peak where the papers permit; otherwise «a partial comparison». R17's explicit scheme
   run beside Runge–Kutta. Nothing unpublished invented; every gap listed.
3. **Observational, independent**: round 3.

## Development and test (rule 1143)

Development only: the cases of rule 961, the third set's six bodies, R17's and W18's four events,
every event read before. Reserved: the fourth set, of which nothing is read in round 1.

## The end of round 1 (rule 1144)

The exact commit; gates 1 and 2; the development cases paired with the baseline under both
structures and both clouds; sensitivities; the domain and limits; a register of deviations; and a
proposal — ready for the independent test, not ready, or ready in a restricted domain. Nothing
adopted in round 1.

## Round 2 — the fourth set, planned (rule 1145)

Started only on the reviewer's leave for this plan. Everything read before is excluded; an inventory
by observable (flares on measured trajectories, deposition curves with their luminous efficiency,
documented survivals and credible negatives, regimes by traces, masses with search coverage,
craters with independent inputs); minimums to be frozen (≥ 5 entry events, ≥ 3 with trajectory and
flares; ≥ 3 survivals and ≥ 3 negatives; ≥ 1 independent crater, or the claim limited to the
atmosphere); candidates from abstracts only, sources pinned by DOI and file hash, values extracted
only after the branch, its priors and the charter v3 are frozen — a deferred deposit. The charter v3,
written in round 2: two primary objectives (the atmospheric release, the ground outcome), the
deposition profile primary only where independently reconstructed, masses with a censoring rule,
adoption on two improved objectives with no severe worsening, three claims kept apart.

## Rounds 3 and 4, and the cadence (rules 1146, 1147)

Round 3: the one independent test of the frozen branch against the baseline. Round 4: the
consequences — blast, heat, crater and ejecta apart, seismics, tsunami, casualties last — in a matrix
of fitness by phenomenon and domain. This dossier pushed and read; round 1 run whole on the reviewer's
leave; round 2's search only on his leave for its plan; until then the branch's code may be begun as
development, labelled so.
