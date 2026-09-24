/**
 * Rules 1137 to 1147 — the opening dossier of round 1 (the fragment-cloud
 * entry branch, «FCM») and the plan of round 2 (the fourth set), on the
 * reviewer's programme of 24 September 2026: work by whole rounds, a dossier at
 * the start and a package at the end, no approval step by step inside the
 * perimeter; no change of population, targets or judge after predictions are
 * seen. Andrea's word: the dossier of round 1 and the plan of round 2, as rules
 * and as a text; the downloads the programme needs authorized. The study A
 * (rules 1129 to 1136) folds into round 1: its law and its prior are the
 * branch's ablation. A readable version: docs/FCM_ROUND_DOSSIER.md.
 *
 * Sources read (NTRS, open copies, with Andrea's leave): Register, Mathias &
 * Wheeler (2017), «Asteroid fragmentation approaches for modeling atmospheric
 * energy deposition», 20180003387 — «R17»; Wheeler, Mathias, Stokan & Brown
 * (2018), «Atmospheric energy deposition modeling and inference for varied
 * meteoroid structures», 20180002835 — «W18»; two posters, 20170000320 and
 * 20180001225. Not found in an open copy: Wheeler et al. (2017, Icarus 295),
 * which W18 cites for its equations — where W18's figure and R17 differ, R17's
 * printed equations are taken, and the difference recorded.
 *
 * RULE 1137. THE QUESTION AND THE USE. Where a stony body deposits its energy
 * along its path, and what reaches the ground — mass, speed, regime — for
 * probabilistic assessment, as PAIR uses the family; not local high-fidelity
 * questions. The domain, fixed now: stony bodies (bulk density 1 500 to 4 000
 * kg/m³), diameters 0.1 to 300 m, speeds 11.2 to 30 km/s, entry angles 15° to
 * 90° from the horizontal. Out of it, said so on every output: irons, cometary
 * bodies, grazing entries below 15°, bodies above 300 m. Collins's entry stays
 * the baseline: the historical reference and the comparator every result of
 * the branch is paired with; the seal of the 308 scenarios stays its
 * regression test. The branch does not replace the product in this round.
 *
 * RULE 1138. THE BRANCH'S PHYSICS, from R17 (Eqs. 1 to 5, 8 to 11, 15) and W18:
 *   (a) every component — the body, each fragment, each cloud — flies on its
 *       own: dv/dt = −½ C_d A ρ v² / m − g sin θ; dθ/dt = (v/(R_E + h) −
 *       g/v) cos θ (W18's Fig. 1; R17's Eq. 2 prints no cos θ on the first
 *       term — recorded); dm/dt = −½ σ ρ A v³ (R17's σ_ab C_d = W18's σ);
 *       dh/dt = v sin θ; g = g₀ (R_E/(R_E + h))²; C_d = 1.0 in R17's ½ C_d
 *       convention (not Collins's); the area follows the mass at constant
 *       density, a sphere; the atmosphere R17's — the 1976 US Standard
 *       Atmosphere's density, from the product's table — with the product's
 *       exponential atmosphere as a declared sensitivity; the start at 100 km;
 *   (b) a piece breaks where ρ v² ≥ its strength (R17 Eq. 8); a child's
 *       strength S_p (m_p/m_c)^α, capped at 330 MPa (Eq. 9); a break gives N
 *       fragments with given mass fractions and one cloud with a given
 *       fraction (W18), R17's «combination» — two spheres whose radii sum to
 *       the parent's, the cloud 1 − f³ − (1 − f)³ — being one setting of it;
 *       the body may start as structure groups of pieces with their own
 *       strengths, released at an initial strength (W18);
 *   (c) a cloud starts as the sphere of its mass at the parent's speed and
 *       angle, spreads as v_disp = v (C_disp ρ / ρ_b)^½ with A = π (r + v_disp
 *       dt)² (R17 Eqs. 10–11; C_disp = 3.5 in Hills & Goda's baseline), keeps a
 *       common bow shock and ablates on its area, and ends where it has
 *       ablated below the floor, reaches the ground, or falls to its terminal
 *       speed — R17's «limiting velocity», unpublished, is fixed so;
 *   (d) the energy deposited per altitude is the change of kinetic energy of
 *       every component, the ablated mass's included (R17 Eq. 15), at 10 m
 *       and at 1 km bins; with the energy lost to drag, the energy lost by
 *       ablation, the kinetic energy at the ground and the light kept apart —
 *       the peak of deposition is never called «the predicted flare»; the
 *       light is not modelled in this round;
 *   (e) each draw keeps a physical ledger: initial mass and energy; mass
 *       ablated, in clouds, in fragments, as dust, at the ground; energy by
 *       altitude and residual at the ground; the components' count.
 * What is left for later, declared: the shape and spin of pieces (their
 * uncertainty carried in the area only), the collective wake, heat exchange in
 * detail, lateral spreading in three dimensions, the light.
 *
 * RULE 1139. THE PARAMETERS. Measured quantities and the model's effective
 * parameters are kept apart: the strength of breakup is an effective
 * parameter (R17), not a material's strength. For development the free ones
 * take priors from the literature — the initial strength as the product's two
 * stages do (S1, S2 and their priors, rules 881 to 889); α uniform on 0.05 to
 * 0.6 (rule 1068); the fragments per break 2, with 3 and 4 as a sensitivity;
 * the larger share on 0.5 to 0.8 (R17 50/50 to W18's 80/20); the cloud share
 * on 0.05 to 0.85 (rule 1068); C_disp log-uniform on 1 to 3.5 (W18's fits to
 * Hills & Goda's baseline), 0.1 as a sensitivity (W18's Tagish Lake); σ as
 * rule 1131. They may be tuned on declared development cases with their
 * interval and objective recorded; they are frozen before round 3.
 *
 * RULE 1140. TWO STRUCTURES, NEVER ONE FORCED (the reviewer's structural
 * uncertainty). Every development result is given under two structures: M1,
 * the monolith broken progressively by the combination rule; M2, the
 * structured body of W18 — groups released at an initial strength, each
 * breaking on its own. And under two clouds: spreading without limit (R17)
 * and spreading capped at ten initial radii (R17's Fig. 8). Where they differ
 * greatly, the difference is published as structural uncertainty. Where a
 * regime fails systematically — strong bodies, grazing paths, small
 * meteoroids — the branch's domain is restricted, or two branches are kept, by
 * a rule said before the next result; no universal law is forced.
 *
 * RULE 1141. GATE 1, NUMERICAL VERIFICATION, before any case:
 *   (a) the ledger closes — mass, energy, the momentum vector — at every break
 *       and at the end, to 10⁻¹² of the entry's values; no mass, speed or
 *       energy ever negative;
 *   (b) limits: no break, σ = 0, g = 0, a straight path and the exponential
 *       atmosphere give Collins's Eq. 8 for the body, converted to R17's drag
 *       convention, to 10⁻⁶ at the step of 10 m; with σ > 0 the mass follows
 *       m(v) = m₀ exp(σ (v² − v₀²) / (2 C_d)) — with C_d = 1, the classic form
 *       of rule 1130 — to 10⁻⁶;
 *   (c) convergence on the same draws: the step halved and doubled, the bins,
 *       the floor (1 g, 0.1 g) and the bound of components moving each
 *       decisional quantity — the peak's altitude and value, the integrated
 *       deposition, the energy at the ground, the survival, the largest piece
 *       — by less than 2 %, or by less than 0.1 km, 10⁻³ E0 or 0.01 where a
 *       value is near zero; the 2 % studied, not assumed; a quantity that does
 *       not converge said and not published as a result.
 *
 * RULE 1142. GATE 2, REPRODUCTION OF WHAT IS PUBLISHED, the same inputs,
 * parameters, conventions and resolution:
 *   (a) R17's Chelyabinsk (D 19.8 m, 19.16 km/s, 18.3°, 3 300 kg/m³, start 100
 *       km, 10 m steps, the table of R17's parameters): the pancake (S₀ 1.6
 *       MPa) against R17's text — its peak about 50 % above the observed
 *       82–83 kt/km — at about 29 to 30 km (R17's figure, read by eye); beside
 *       it W18's statement that FCM runs at 3 300 kg/m³ exceed the observed 83
 *       kt/km peak by about 50 % (123 kt/km), consistently: a target near 123
 *       kt/km, derived from text, not read from a table; the integrated
 *       deposition against the entry's 588 kt;
 *   (b) R17's other settings on the same event, against their stated excess
 *       over the observed peak (the combination of Fig. 7a, 15–17 %; of Fig.
 *       7b, about 50 %; the independent wakes, 15–22 %);
 *   (c) W18's Košice, its four groups as printed, against what W18 states of
 *       its behaviour; W18's Chelyabinsk and Tagish Lake, against their
 *       landed masses (5 600 kg; 190 kg), with what W18 leaves unsaid chosen
 *       inside W18's stated ranges and listed;
 *   (d) criteria proposed by the reviewer: below 5 % on the integrated energy
 *       and 1 km on the main peak's altitude where the paper's numbers permit
 *       that replication; otherwise «a partial comparison», neither a failure
 *       nor a verification; R17's scheme, explicit and apparently Euler, run
 *       beside the branch's Runge–Kutta, the difference reported. Nothing
 *       unpublished is invented: each gap is written down.
 *
 * RULE 1143. DEVELOPMENT AND TEST, divided. Development, and never an
 * independent judgement: the cases of rule 961, the six bodies of the third set
 * (rule 1128 (a)), R17's and W18's four events (Chelyabinsk, Košice, Benešov,
 * Tagish Lake), and every event read before. Reserved: the fourth set of
 * round 2, of which nothing is read in round 1.
 *
 * RULE 1144. THE END OF ROUND 1, its package: the exact commit; gates 1 and 2
 * with every result; the development cases paired with the baseline, under both
 * structures and both clouds, with the ledger's figures; the sensitivity to the
 * priors and to the atmosphere; the domain and its limits; a register of
 * deviations with their reasons; and a proposal — «ready for the independent
 * test», «not ready», or «ready in a restricted domain». Ready asks gate 1
 * passed, gate 2 passed or partial with its gaps named, and no failure on the
 * development cases the round cannot explain. Nothing is adopted in round 1.
 *
 * RULE 1145. ROUND 2, THE FOURTH SET, planned now and started only on the
 * reviewer's leave for this plan:
 *   (a) excluded before the search: every event read so far (rule 1143's
 *       development, level B's rounds, the third set, the sample of Borovička
 *       et al. 2020, I2's CNEOS rows, every preset, test, fixture or table);
 *   (b) an inventory by observable, not by event: flares from calibrated
 *       networks on measured trajectories; energy-deposition curves
 *       reconstructed with their luminous efficiency and uncertainty;
 *       survivals with a documented recovery, and negatives whose search makes
 *       «nothing arrived» credible; regimes documented by traces; masses with
 *       the search's coverage; craters with inputs not derived from them;
 *   (c) minimums proposed by the reviewer, to be frozen: at least 5 entry
 *       events in the domain, 3 of them with trajectory and flares, not all of
 *       one regime of strength; at least 3 documented survivals and 3
 *       credible negatives; at least one independent crater — two better — or
 *       the claim limited to the atmosphere, never an event weakened to fill a
 *       quota;
 *   (d) the search: candidates from abstracts and search results only, what
 *       was seen declared (as rule 943); each source pinned by its DOI and its
 *       file's hash; the observed values not extracted until the branch, its
 *       priors and the charter v3 are frozen — a deferred deposit, the
 *       extraction done then by a procedure written before;
 *   (e) the charter v3, written in round 2 before any prediction: two primary
 *       objectives — the structure and altitude of the atmospheric release,
 *       and the ground outcome with no worsening of arrivals at the crater
 *       law's speeds where «no crater» is documented; the deposition profile
 *       primary only where an independent reconstruction with its uncertainty
 *       exists; masses read with a rule for lower bounds and censored searches;
 *       adoption on at least two primary objectives improved and assessable,
 *       no severe worsening, no gain from a band made wide; three claims kept
 *       apart — the entry branch's adoption, a restricted atmospheric level B,
 *       the whole software's fitness.
 *
 * RULE 1146. ROUND 3 AND 4, named now: round 3 the one independent test of the
 * frozen branch against the baseline under the charter v3, every outcome
 * published; round 4 the consequences — the blast first, then heat, crater and
 * ejecta apart, seismics, tsunami, casualties last — each with its own use,
 * references and independent set, in a matrix of fitness by phenomenon and
 * domain.
 *
 * RULE 1147. THE CADENCE. This dossier pushed; the reviewer reads it; on his
 * leave round 1 runs whole, rules written before code inside it, a register of
 * deviations kept, no reserved data read; round 2's search begins only on his
 * leave for rule 1145. Until then the branch's code may be begun as
 * development, labelled so, and changes if the dossier does.
 */

/** Rule 1137: the branch's domain. */
export const FCM_DOMAIN = {
  densityKgM3: [1_500, 4_000],
  diameterM: [0.1, 300],
  speedMS: [11_200, 30_000],
  angleDeg: [15, 90],
} as const;

/** Rule 1138: the branch's constants (R17). */
export const FCM_CONSTANTS = {
  dragCoefficient: 1.0,
  earthRadiusM: 6.371e6,
  startAltitudeM: 100_000,
  stepM: 10,
  strengthCeilingPa: 330e6,
  cloudDispersionBaseline: 3.5,
  cloudCapRadii: 10,
} as const;

/** Rule 1139: development priors of the free parameters. */
export const FCM_PRIORS = {
  alpha: [0.05, 0.6],
  largerShare: [0.5, 0.8],
  cloudShare: [0.05, 0.85],
  cDispersionLog: [1, 3.5],
  cDispersionSensitivity: 0.1,
  fragmentsPerBreak: 2,
  fragmentsSensitivity: [3, 4],
} as const;

/** Rule 1141: gate 1's tolerances. */
export const FCM_GATE1 = {
  ledger: 1e-12,
  limits: 1e-6,
  convergence: 0.02,
  nearZero: { altitudeM: 100, energyShare: 1e-3, share: 0.01 },
} as const;

/** Rule 1142: gate 2's reproduction targets and criteria. */
export const FCM_GATE2 = {
  chelyabinsk: {
    diameterM: 19.8,
    speedMS: 19_160,
    angleDeg: 18.3,
    densityKgM3: 3_300,
    pancakeStrengthPa: 1.6e6,
    observedPeakKtKm: [82, 83],
    pancakePeakKtKm: 123,
    pancakePeakAltitudeKm: [29, 30],
    entryEnergyKt: 588,
  },
  energyTolerance: 0.05,
  peakAltitudeToleranceM: 1_000,
} as const;
