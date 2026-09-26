/**
 * Rules 1254 onward — the blast solver: Nimbus solves the equations of the
 * blast itself, case by case, instead of reading another program's fits or
 * another team's maps. Opened on Andrea's word of 26 September 2026 (10:00
 * to 10:10), after rule 1253: «io voglio che il nostro software risolva le
 * equazioni in modo autonomo»; the order — first the two-dimensional solver
 * about the vertical, proved, then the three-dimensional one for inclined
 * trajectories — «sì, va bene quest'ordine»; the platform left open («installato
 * o su un server o su un computer, non è un problema»). Written before any of
 * its code, as every round of this project is.
 *
 * RULE 1254. WHAT IS SOLVED, HOW, AND WHAT PROVES IT — PHASE 1, THE SOLVER
 * ABOUT THE VERTICAL.
 *
 * (a) THE EQUATIONS. The compressible Euler equations of an inviscid perfect
 *     gas (γ = 1.4) in cylindrical coordinates (r, z), symmetric about the
 *     vertical through the burst, with gravity (g = 9.80665 m/s²) and an
 *     atmosphere in hydrostatic equilibrium; the ground a flat reflecting wall
 *     at z = 0; the far boundaries open. The source: the blast energy put as
 *     internal energy into a sphere of ambient air about the burst point
 *     (static source), or the same sphere moving downward with part of the
 *     energy as motion (Collins et al. 2017's moving source). What is read
 *     out: at each range along the ground, the peak overpressure over the
 *     run (then the peak wind, the arrival time and the positive phase).
 * (b) THE METHOD, from textbooks and papers, never from another code: a
 *     finite-volume scheme of second order (MUSCL–Hancock reconstruction
 *     with a slope limiter, an HLLC Riemann solver; Toro, «Riemann Solvers
 *     and Numerical Methods for Fluid Dynamics»), the axisymmetric
 *     geometric term as a source, and gravity treated so that the undisturbed
 *     atmosphere stays at rest to rounding (a well-balanced scheme, the one
 *     chosen under its own rule after the literature is read, before code).
 *     Phase 1 is a reference implementation in TypeScript on the CPU, the one
 *     the tests and, later, the seal read. Where the product runs it — the
 *     browser's GPU, an installed program or a server — is decided on the
 *     costs measured with it, under its own rule.
 * (c) THE TESTS, and their criteria, fixed now, before any run.
 *     T0 — the atmosphere at rest: with no source, over the longest run's
 *     duration, no speed above 0.01 m/s anywhere (the winds of interest are
 *     tens of m/s).
 *     T1 — Sedov–Taylor: a point blast in a uniform gas, whose shock radius
 *     grows as ξ(E t²/ρ)^(1/5), ξ = 1.033 for γ = 1.4 — within 2 % once the
 *     shock is ten cells from the source and until it reaches half the
 *     domain, and converging as the grid is refined.
 *     T2 — 1 kt against Glasstone & Dolan's map, digitised under rule 1251
 *     (`porta1Hob250MtFigure.json`, the solid curves): a sea-level uniform
 *     atmosphere (a 1 kt blast is far smaller than the scale height); the
 *     energy 1 kt as blast, one for one, as Collins et al. (2017) found in
 *     good agreement with the nuclear data, in their nominal source of 45 m;
 *     the reach at 1, 2, 4 and 10 psi at each of the 26 heights.
 *     T3 — 250 Mt against Aftosmis, Mathias & Tarano (2019)'s Cart3D map (the
 *     dashed curves): their setup — a perfect gas, an isothermal atmosphere of
 *     1 atm at the ground and 2.7·10⁻³ atm at 40 km (a scale height of 6.8
 *     km), a spherical source of 0.5 km; the same readings; and again with a
 *     scale height of 7.6 km, their mean value, as a sensitivity.
 *     T4 — Collins et al. (2017)'s Table 2: their setup — an isothermal
 *     atmosphere of 1 kg/m³ and 10⁵ Pa at its base, a source of 45 m per
 *     kt^(1/3), 0.5, 5, 15 and 50 Mt at 21.5, 14, 10 and 11 km — the peak
 *     overpressure at ground zero and at three burst altitudes, and the
 *     ranges of 1, 10, 20 and 35 kPa, for their static source and for their
 *     moving source (a third of the energy as motion, 2 450 m/s downward).
 *     T5 — convergence: T2 to T4 each on three grids, each twice as fine as
 *     the last; the order observed and the extrapolated value; the declared
 *     numerical error of a reading is the finest grid's distance from the
 *     extrapolation.
 *     The criteria. T2 and T3: every reach within 10 % of the reference and
 *     the median within 5 %, at the heights where both are non-zero, leaving
 *     out — and counting — the readings within 0.02 km scaled of a curve's
 *     turning point, where a reach is ill-conditioned (a small error in
 *     height moves it far). T4: every number of the table within 15 %. The
 *     numerical error of T5 is stated with every reading and does not widen
 *     any criterion.
 * (d) WHAT MAY NOT HAPPEN. No physical constant — the energy's share, γ, the
 *     atmosphere, the source's size — is tuned to make a test pass: each is
 *     the reference's own setup, stated above. A failing test is diagnosed,
 *     and only a numerical fault (a bug, a resolution) may be mended, each
 *     under its own rule; a test that still fails is reported as failed. The
 *     one choice not fixed by a reference — the source's size for the
 *     product — is made after the sensitivity to it is measured (30, 45 and
 *     60 m per kt^(1/3)), under its own rule.
 * (e) WHAT IS NOT IN PHASE 1: the three-dimensional solver for inclined
 *     trajectories (phase 2); real-gas air, radiation, terrain, wind; the
 *     globe, the report and the seal — nothing in the product changes until
 *     the tests have passed and a rule says how the solver enters it.
 * (f) WHERE IT LIVES: `src/physics/solvers/blast2d/` (the solver and its unit
 *     tests), `scripts/blast2d-*.ts` (the test runs), their outputs as JSON
 *     in `src/physics/validation/` and as pages in `docs/`.
 */
export const BLAST_SOLVER_OPENED = '2026-09-26' as const;

/**
 * RULE 1255. THE SCHEME, CHOSEN AFTER READING (26 September 2026, 10:09).
 * Written before any code.
 *
 * (a) WHAT WAS READ, whole (mathematical papers; they name no event):
 *     Berberich, Chandrashekar, Klingenberg & Röpke (2019), «Second order
 *     finite volume scheme for Euler equations with gravity which is
 *     well-balanced for general equations of state and grid systems»,
 *     Commun. Comput. Phys. 26, 599–630 (arXiv 1807.11825, sha-256
 *     598acb40…); Berberich, Käppeli, Chandrashekar & Klingenberg,
 *     arXiv 2005.01811 (ed14f43e…), for the kinds of well-balanced schemes.
 *     Käppeli & Mishra (2016, A&A) was not read: its host answered with a
 *     CAPTCHA, which is not bypassed.
 * (b) THE KIND. Ours is their «type 1»: the atmosphere at rest is known
 *     beforehand — in closed form for an isothermal atmosphere, as a table
 *     for a standard one later. With the background's density and pressure
 *     written ρ̄ = ρ₀α(z), p̄ = p₀β(z), the scheme reconstructs
 *     w = (ρ/α, u, v, p/β) — constant at rest — and turns face values back
 *     with α and β at the face; gravity on the vertical momentum is
 *     (p₀ρᵢ/(ρ₀αᵢ))·(β(z_{j+½}) − β(z_{j−½}))/Δz, and on the energy (kept
 *     without the potential) the vertical velocity times it. Their Theorem
 *     4.1 proves the atmosphere at rest exact for any consistent numerical
 *     flux and any reconstruction of w. About the axis the background does
 *     not vary with r; the geometric term p/r, with rᵢ the midpoint of the
 *     cell's radial faces, balances the radial fluxes exactly.
 * (c) A CHANGE TO RULE 1254 (b), declared: time is advanced by the method of
 *     lines with the second-order strong-stability-preserving Runge–Kutta
 *     scheme of Shu & Osher, not by the Hancock half step — the theorem is
 *     proven for the semi-discrete scheme, and a Hancock predictor would need
 *     a proof of its own. The rest stands: second-order MUSCL reconstruction
 *     of w with the van Leer limiter, the HLLC flux (Toro), float64, SI units.
 * (d) THE DETAILS, fixed now. A uniform grid, Δr = Δz, in phase 1 (a
 *     stretched one only under a later rule). Time step: CFL 0.4 on the sum
 *     of both directions' signal speeds. The axis and the ground reflect;
 *     the outer and upper boundaries copy w outward (the background stays
 *     exact there). Where a reconstructed face has no positive density or
 *     pressure, that cell falls back to first order for that step, and every
 *     fallback is counted and reported. The source: its energy added as
 *     internal energy to the cells inside the sphere, weighted by the share
 *     of each cell's volume inside it (sampled), then scaled so that the
 *     energy put in is exactly the source's. The ground reading: in the
 *     first row of cells, the peak over the run of p − p̄ at each range.
 */
export const RULE_1255_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1256. TWO WORDS OF RULE 1254 (c) MADE OPERATIONAL, BEFORE ANY RUN OF
 * T2 TO T4 (26 September 2026, 10:25).
 *
 * (a) «WITHIN 0.02 km SCALED OF A CURVE'S TURNING POINT, WHERE A REACH IS
 *     ILL-CONDITIONED». A reference reading at height h is left out when the
 *     reference's own farthest reach, interpolated linearly between its read
 *     heights, changes by more than 10 % — the criterion's whole width —
 *     between h − 0.02 and h + 0.02 km scaled (half the difference, over the
 *     reach at h). This catches what the words meant: the stretches where a
 *     curve runs nearly flat in height (a bulge's return, a Mach stem's
 *     shelf, a curve's top at the axis), where an error of a few pixels in
 *     height moves the reach far. Every reading left out is listed.
 * (b) «THE REACH». The farthest ground range at which the run's peak
 *     overpressure in the first row of cells reaches the threshold,
 *     interpolated between cell centres — the same definition as the
 *     digitised curves' farthest crossing, and as the product's.
 * (c) T5 on T2 to T4: the three grids' reaches give the observed order
 *     p = log₂((r₁ − r₂)/(r₂ − r₃)) (coarse to fine) and the extrapolated
 *     reach r₃ + (r₃ − r₂)/(2^p − 1); where the three do not converge
 *     monotonically, no extrapolation is made and the spread of the three is
 *     stated as the error. The finest grid is the one judged.
 */
export const RULE_1256_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1257. T1'S OUTCOME: FAILED AS FIXED, AND WHY (26 September 2026,
 * 10:36).
 *
 * (a) THE NUMBERS (`blast2dT1Sedov.json`). Three grids of 100, 200 and 400
 *     cells over 1.2 (Δx = 0.012, 0.006, 0.003), the source on the ground
 *     over three cells, no first-order fall-back in any: 1 998, 8 312 and
 *     34 849 steps, 4, 62 and 1 121 s. The worst judged deviation of the
 *     shock radius from ξ(2Et²/ρ)^(1/5): 10.4, 11.9 and 9.5 % — T1 FAILS its
 *     2 % criterion on every grid. On the finest, every reading from 60
 *     cells out is within 2.1 % (from 83 cells, 1.9 %); the misses are the
 *     readings at 17 to 40 cells (9.5 to 3.8 %).
 * (b) THE DIAGNOSIS, one hypothesis at a time. The shock is read 1 to 2
 *     cells ahead of the exact radius, on the ground, the axis and the
 *     diagonal alike (the axis some tenths of a per cent more); halving the
 *     source to 1.5 cells changes nothing; the density's peak sits within
 *     half a cell behind the exact radius; reading the front's steepest
 *     point instead of its half height gives the same lead. At a fixed
 *     radius the error halves with the cell — R = 0.25: 6.2, 3.0, 1.6 %;
 *     R = 0.6: 2.3, 1.4, 0.9 % along the ground — first-order convergence,
 *     the order a captured shock's position has; the mass and the energy are
 *     kept to rounding. No fault was found in the code. The criterion asked
 *     for a fifth of a cell at ten cells, which a shock-capturing scheme does
 *     not give.
 * (c) WHAT IS NOT DONE: the criterion is not changed after its outcome, and
 *     nothing in the scheme is tuned to it. T1 stands failed as fixed. Whether
 *     it is judged again under a criterion written now — in cells, or on the
 *     converged radius — is Andrea's to say; T2 to T4, which T1 does not
 *     gate, go on meanwhile.
 */
export const RULE_1257_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1258. T1 JUDGED AGAIN, ON THE EXTRAPOLATED RADIUS — A CRITERION
 * WRITTEN AFTER THE OUTCOME (26 September 2026, 10:49; Andrea's answer to
 * rule 1257 (c): «Rigiudicare sul raggio estrapolato»).
 *
 * (a) DECLARED: this criterion is written after T1's outcome and after its
 *     raw radii were seen (rule 1257 (a)); it does not replace rule 1257's
 *     verdict, which stays on record as T1 as first fixed.
 * (b) THE CRITERION. For each time and each ray (the ground, the axis, the
 *     diagonal), the three grids' radii give the extrapolated radius of rule
 *     1256 (c); it must lie within 2 % of ξ(2Et²/ρ)^(1/5). Where the three do
 *     not converge monotonically, no extrapolation is made and the finest
 *     radius, with the three's spread, must lie within 2 %.
 * (c) WHICH READINGS: those where every grid has the shock at least ten of
 *     its own cells beyond the source — so that all three are in the range an
 *     extrapolation needs — and within half the domain: on these grids, from
 *     R = 0.156 to 0.6. That is narrower than rule 1257 judged (it began at
 *     ten cells of the finest grid); the reason is the extrapolation's, and
 *     it was chosen knowing the raw radii.
 * (d) No new run: the three grids' readings of `blast2dT1Sedov.json`.
 */
export const RULE_1258_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1259. RULE 1258'S OUTCOME: T1 FAILS ON THE EXTRAPOLATED RADIUS TOO
 * (26 September 2026, 10:49; `blast2dT1Extrapolated.json`).
 *
 * (a) Of the 18 readings judged (R = 0.18 to 0.6, three rays), 14 lie within
 *     2 % and 4 do not: the axis at R = 0.18 (−8.4 %, observed order 0.43),
 *     the diagonal at 0.18 (not monotone, the three spread over 2.4 %), the
 *     diagonal at 0.45 (−3.2 %, order 0.22) and the axis at 0.55 (−3.2 %,
 *     order 0.30). T1 FAILS rule 1258's criterion as it failed rule 1254's.
 * (b) What the misses are: where the observed order is low, the three
 *     differences nearly equal, the extrapolation divides by a small number
 *     and carries the reading's own scatter (some tenths of a cell) far past
 *     the finest grid; at those four readings the finest grid's raw radius is
 *     within 1.4 to 1.9 %. That is a statement about the extrapolation, not a
 *     pass: no third criterion is written.
 * (c) T1 stands failed on both criteria, with the diagnosis of rule 1257 (b):
 *     a captured shock read 1 to 2 cells ahead, converging at first order, no
 *     fault found. T2 to T4 go on.
 */
export const RULE_1259_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1260. T4'S SOURCE, READ AGAIN BEFORE ANY RUN OF IT (26 September
 * 2026, 11:10).
 *
 * (a) THE CONTRADICTION. Rule 1254 (c) transcribed two of Collins et al.
 *     (2017)'s numbers for T4: «a source of 45 m per kt^(1/3)» and, for the
 *     moving source, «a third of the energy as motion, 2 450 m/s downward».
 *     Their text: the radius was «set by yield scaling a nominal 1 kt
 *     fireball radius of 45 m, implying a specific internal energy of 8.968
 *     MJ kg⁻¹», and the downward speed is the square root of two-thirds of
 *     that specific energy (2 450 m/s «in all scenarios»). In their own
 *     atmosphere (1 kg/m³ at the base, far less at 10 to 21.5 km) a radius of
 *     45 m·W^(1/3) gives neither 8.968 MJ/kg nor 2 450 m/s — only a density
 *     of 1.22 kg/m³ would. The two numbers they state as results are
 *     consistent with each other only if the specific energy is what is held
 *     fixed.
 * (b) THE SETUP JUDGED: the source's specific energy fixed at 8.968 MJ/kg —
 *     its mass E/8.968 MJ/kg, its radius from the air's density at the burst
 *     height — for the static source and for the moving one (a third of the
 *     energy as motion, which gives 2 450 m/s). The literal 45 m·W^(1/3)
 *     radius is run as a sensitivity for the static source, and reported.
 * (c) THE REST as rule 1254 (c): their isothermal atmosphere (ρ₀ = 1 kg/m³,
 *     p₀ = 10⁵ Pa, g = 9.80665 m/s², so H = 10.2 km), 0.5, 5, 15 and 50 Mt at
 *     21.5, 14, 10 and 11 km; every number of their Table 2 that is a number
 *     (not «n/a» nor «—») within 15 %; three grids whose cells are 20, 10
 *     and 5 m scaled to 1 kt, the finest judged.
 */
export const RULE_1260_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1261. T2'S OUTCOME: FAILED, AND NOT CONVERGED (26 September 2026,
 * 16:37; `blast2dT2.json`, `docs/BLAST2D_T2.md`).
 *
 * (a) AS RUN. Of 104 readings, 60 were judged and 44 left out (a zero, or
 *     ill-conditioned under rule 1256 (a)); worst 67 %, median 10.4 % — T2
 *     FAILS. At 1 psi the finest grid reaches 1.40 km at the ground (Glasstone
 *     & Dolan 1.17), 1.95 km at their optimum (2.14) and 1.51 km at 1.27 km of
 *     height (0.90): a flatter curve than theirs.
 * (b) NOT CONVERGED. The reach grows by nearly equal steps from 20 to 10 to
 *     5 m — at 1 psi and the optimum 1.22, 1.60, 1.95 km, observed order 0.14;
 *     elsewhere 0.2 to 0.7. No extrapolation stands, and the finest grid is
 *     not yet an answer: T2 cannot yet say whether the solver agrees with the
 *     map.
 * (c) THE DIAGNOSIS, one hypothesis at a time. (1) The domain's top: a run at
 *     1.27 km with the top 1.2 and 2.4 km above the burst gives the same reach
 *     to the metre, and the ground's peaks come with the direct wave —
 *     excluded. (2) The source's resolution: in a one-dimensional spherical
 *     version of the same scheme (a diagnostic, `scripts/blast1d-diagnostic.ts`),
 *     cells of 0.625 m out to 500 m and 5 m beyond give 7.77 kPa at 1 km,
 *     against 7.64 with 5 m everywhere and 9.08 with 0.625 m everywhere —
 *     excluded. (3) The propagation: the same diagnostic gives the free-air
 *     peak at 1 km as 4.60, 6.44, 7.64, 8.44, 8.96 and 9.08 kPa for cells of
 *     20, 10, 5, 2.5, 1.25 and 0.625 m (at 2 km 1.72 to 3.95): the
 *     second-order TVD reconstruction clips the pulse's peak — a local
 *     extremum, where the limiter falls to first order — at every step of its
 *     travel; at 5 m the peak is 16 % low at 1 km and 23 % at 2 km. That is
 *     the fault: numerical.
 * (d) OPEN, not acted on: Glasstone & Dolan (§1.25, fourmilab's Chapter I,
 *     sha-256 e5a20d25…) put about half a fission burst's energy into the air
 *     shock, and rule 1254 set 1 kt one for one. Whether that matters is read
 *     only once T2 converges; any change to it would come after the outcome,
 *     and is Andrea's.
 * (e) T3, run on the same scheme, was stopped at 57 of 104 runs.
 */
export const RULE_1261_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1262. THE NUMERICAL FAULT MENDED: A FIFTH-ORDER RECONSTRUCTION
 * (26 September 2026, 16:37). Under rule 1254 (d); written before the solver's
 * code is changed.
 *
 * (a) THE CHANGE. The reconstruction of w (rule 1255 (b)) becomes the
 *     fifth-order weighted essentially non-oscillatory one — the candidate
 *     stencils, linear weights (1/10, 6/10, 3/10) and smoothness indicators
 *     of Shu's ICASE report 97-65 (NASA/CR-97-206253, NTRS 19980007543,
 *     sha-256 9d24d811…, read for them), with the «Z» weights of Borges et
 *     al. (2008), αₖ = dₖ(1 + |β₀ − β₂|/(βₖ + ε)), in the form widely
 *     restated (their paper was not read); three ghost layers; time by the
 *     third-order strong-stability-preserving Runge–Kutta of Shu & Osher.
 *     Berberich et al.'s theorem holds for any reconstruction of w: the
 *     atmosphere at rest stays exact. Where a reconstructed face has no
 *     positive ρ/α or p/β, that face falls back to first order, counted.
 * (b) TRIED FIRST in the one-dimensional diagnostic: the free-air peak at
 *     1 km, 8.52, 9.41, 8.48 and 8.88 kPa for cells of 20, 10, 5 and 2.5 m,
 *     against 9.08 for the TVD scheme at 0.625 m; at 2 km 3.59, 3.76, 3.52,
 *     3.87 against 3.95 — close at a cell ten to twenty times coarser, but not
 *     monotone (±5 % from grid to grid). The classic Jiang–Shu weights, tried
 *     in a draft of the diagnostic, did not finish a run; not diagnosed, not
 *     used.
 * (c) EVERY TEST RUNS AGAIN on the mended scheme, with its criteria as fixed:
 *     T0, T1 (both of its judgements, rules 1257 and 1258), T2, T3 and T4
 *     on the grids fixed for them. The superseded runs stay on record.
 */
export const RULE_1262_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1263. A LATENT FAULT OF THE RUNS' STOP, MENDED BEFORE THEY RUN AGAIN
 * (26 September 2026, 16:41).
 *
 * A run stops once the incident wave has passed the farthest range read: its
 * peak set there, and the overpressure there fallen below a third of it
 * (`scripts/blast2d-run.ts`). «Its peak set» was «a peak above zero», and
 * air at rest carries rounding of some 10⁻¹¹ Pa: the one-dimensional
 * diagnostic, rewritten cleanly for the record, stopped on it at once. The
 * condition becomes a peak above 10⁻⁴ of the ground's pressure (10 Pa).
 * None of the runs so far was touched: every one of T2's 78 lasted at least
 * 7.1 s, the wave's passage, with a peak of at least 1 979 Pa at the far end.
 */
export const RULE_1263_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1264. THE FIFTH-ORDER SCHEME LOST POSITIVITY IN THE FIREBALL: AN A
 * POSTERIORI FALL-BACK, AND RUNS THAT FAIL LOUDLY (26 September 2026, 17:14).
 * Written before the code.
 *
 * (a) WHAT HAPPENED. With rule 1262's scheme, T2 at 16, 48, 187 and 293 m
 *     and T3's low bursts ran on for twenty minutes and more where their
 *     predecessors took seconds. Reproduced at 16 m on 20 m cells: in the
 *     fireball's hot, thin core by the axis and the ground the density falls
 *     to 10⁻³ kg/m³, first-order fall-backs at the faces multiply, and a stage
 *     of the Runge–Kutta leaves a cell with no positive density or pressure;
 *     from there the state is not a number, the time step infinite, and the
 *     run never meets its stop. Rule 1262's check guards the reconstruction
 *     at the faces, not the cell's update. The runs were stopped; T1's grids
 *     of 100 and 200 cells had finished (worst 3.7 and 6.1 %), its finest had
 *     not.
 * (b) THE MEND, a numerical one under rule 1254 (d). After each stage, every
 *     interior cell whose density or pressure is not a positive finite number
 *     is marked; the stage is done again from its own starting state with the
 *     faces of the marked cells at first order (the HLLC flux of the cells'
 *     own values), and so on until no cell is marked; the marks hold for the
 *     rest of the step. This is the a posteriori idea known as MOOD (Clain,
 *     Diot & Loubère 2011, not read here), in its plainest form; the
 *     first-order HLLC update is what the unmarked scheme falls back to. The
 *     cells so redone are counted and reported with the face fall-backs.
 * (c) RUNS THAT FAIL LOUDLY. If a stage still leaves a marked cell after five
 *     tries, or a time step is not a positive finite number, the solver
 *     throws; a run that throws is reported as failed by the pool, never
 *     waited on.
 * (d) Checked on the cases that failed (16 m on 20 m cells, a low T3 burst)
 *     before the tests run again; the unit tests stay green.
 */
export const RULE_1264_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1265. AN OPEN QUESTION AT 250 Mt, AND THE DIAGNOSTICS SO FAR (26
 * September 2026, 17:30). Diagnostics, not tests: nothing is judged here.
 *
 * (a) THE QUESTION. In T3's stratified atmosphere the solver's ground wave
 *     decays far more slowly than in a uniform one of the same ground density:
 *     a surface burst of 250 Mt on the coarse grid keeps 7.7, 4.1, 2.9, 2.7 and
 *     2.2 psi at 0.5 to 2.5 km scaled (32 to 158 km), against 4.7, 1.8, 1.1,
 *     0.7 and 0.6 psi without gravity, and reaches 1 psi near 3.1 km scaled —
 *     Aftosmis et al.'s Cart3D, 1.04. The superseded second-order runs show the
 *     same slow decay, so it is not the fifth-order scheme's.
 * (b) EXCLUDED so far: the domain's top (twice as high, the same peaks to the
 *     hundredth of a psi); gravity at a small scale (1 kt at the ground with
 *     and without an isothermal atmosphere, the peaks within 1 % out to 2 km);
 *     a gross loss or gain of energy (internal, kinetic and potential energy
 *     kept to 0.04 % over the first seconds at 250 Mt).
 * (c) KOMPANEETS. A strong blast 6 H above the ground, the shock's shape
 *     against Kompaneets (1960)'s relations as restated by Roy et al. (arXiv
 *     1303.2664, sha-256 d182ea13…), which do not depend on his constant λ
 *     (`scripts/blast2d-kompaneets.ts`, 20 cells per H): at a top of 0.5 H the
 *     bottom and the widest radius agree (1.00 and 1.01 times); as the top
 *     climbs to 3 H the solver's bottom lies 1.13 to 1.35 times, and its widest
 *     radius 1.05 to 1.18 times, beyond Kompaneets's — the direction in which
 *     his uniform-pressure assumption is expected to err (a top that climbs
 *     too fast); by how much, the source read does not say. The solver keeps
 *     more of the energy low: consistent with (a), not a proof of it.
 * (d) WHAT DECIDES IT: T4, a comparison with another code (Collins et al.'s
 *     iSALE) in a stratified atmosphere out to 1 kPa at 257 km. T3 is judged
 *     only once T4 has spoken.
 */
export const RULE_1265_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1266. T1 AGAIN, ON RULE 1262'S SCHEME: CLOSER, AND STILL FAILED ON
 * BOTH CRITERIA (26 September 2026, 18:53; `blast2dT1Sedov.json`,
 * `blast2dT1Extrapolated.json`).
 *
 * (a) RULE 1254'S CRITERION. The worst judged deviation of the shock radius:
 *     3.7, 6.1 and 2.9 % on 100, 200 and 400 cells (on the superseded scheme
 *     10.4, 11.9 and 9.5 %). On the finest grid every reading from R = 0.08
 *     (27 cells) out lies within 1.8 %; the one miss is the first judged
 *     reading, R = 0.05 (17 cells), at 2.4, 2.9 and 1.9 % on the ground, the
 *     axis and the diagonal. T1 FAILS, by 0.9 of a point.
 * (b) RULE 1258'S CRITERION. Of 18 extrapolated readings 16 lie within 2 %;
 *     the axis at R = 0.18 (not monotone, the three grids spread over 2.3 %;
 *     the finest within 0.6 %) and at R = 0.45 (order 0.47, extrapolated 3.5 %;
 *     the finest within 1.8 %) do not. T1 FAILS it too.
 * (c) The finest grid's 400 cells fell back to first order at 147 688 faces:
 *     the near-empty centre of a Sedov blast in gas at 10⁻⁶ of its pressure.
 *     No new criterion is written; T1 stands failed on both, as before, with
 *     the errors now a fifth of what they were.
 */
export const RULE_1266_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1267. A DIAGNOSTIC FOR THE ENERGY QUESTION OF RULE 1261 (d): WHAT
 * GLASSTONE & DOLAN'S «1 kt» IS AS AIR-SHOCK ENERGY (26 September 2026, 18:55).
 * A diagnostic, not a test.
 *
 * (a) THEIR CURVE. Fig. 3.72, the peak overpressure of a 1 kt free air burst
 *     at sea level (fourmilab's Chapter III, sha-256 d60de70a…), digitised
 *     into `gd1ktFreeAir.json` (procedure there; the book's own example,
 *     4.2 psi at 1 360 ft, read back at 4.37): 5 psi at 382 m, 2 psi at 681 m,
 *     1 psi at 1 137 m, 0.5 psi at 1 997 m.
 * (b) OURS. The one-dimensional diagnostic (rule 1261 (c)), an ideal gas with
 *     the whole kiloton in the air, on 0.625 m cells (converged to about half
 *     a per cent: 8.44, 8.96, 9.08 kPa at 1 km on 2.5, 1.25, 0.625 m): 2 psi at
 *     about 753 m, 1 psi at about 1 277 m, 0.5 psi at about 2 220 m — 1.11,
 *     1.12 and 1.11 times theirs. By cube-root scaling, their «1 kt» is the
 *     air shock of about 0.72 kt of our source — not the 0.5 that §1.25's
 *     «about 50 percent» might suggest, nor the 1 that rule 1254 set.
 * (c) WHAT IT BEARS ON. T2 compares with their map at 1 kt one for one: if the
 *     solver converges there, it should stand about 11 % farther than their
 *     curves wherever the reflection is as in free air. Nothing is changed:
 *     the energy of T2 is Andrea's to decide once T2 has its outcome.
 */
export const RULE_1267_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1268. A STEP THAT CANNOT KEEP POSITIVITY IS DONE AGAIN WITH HALF THE
 * TIME STEP (26 September 2026, 19:02). Written before the code.
 *
 * (a) WHAT HAPPENED. T3's run at 13 km on its coarse grid (1 260 m cells, a
 *     source of 500 m inside one cell) threw at its ninth step (rule 1264
 *     (c)): the source's cell on the axis, emptying at 7 km/s, kept a negative
 *     pressure even at first order — at that time step the axisymmetric term
 *     p/r, strongest next to the axis, outruns the first-order update. The
 *     T3 batch stopped; T2 and T4 ran on.
 * (b) THE MEND, numerical, under rule 1254 (d). When a stage cannot restore
 *     positivity (rule 1264 (b)), the whole step is started again from its
 *     own beginning with half the time step, up to eight times; a step still
 *     unsound after eight halvings throws, as before. The halvings are
 *     counted and reported. A run that never meets the fault computes, to the
 *     bit, what it computed before: T2's and T4's runs, under way, are not
 *     touched.
 */
export const RULE_1268_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1269. RULE 1265 (c)'S DIAGNOSTIC ON A GRID TWICE AS FINE (26
 * September 2026, 20:03). With 40 cells per scale height instead of 20, the
 * solver's shape against Kompaneets's is the same: the bottom 1.13 to 1.35
 * times his, the widest radius 1.06 to 1.18 times, as the top climbs from
 * 0.5 to 3 H. The departure does not come from the grid: it is the full
 * equations' against his approximation. A diagnostic; nothing judged.
 */
export const RULE_1269_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1270. THE SOLVER ON THE GPU: ONE CODE FOR THE PRODUCT AND THE TESTS
 * (26 September 2026, 21:16; Andrea's word: «Per ora va bene questa strada,
 * rust lo useremo quando siamo al 100% sicuri di aver raggiunto
 * l'obbiettivo»). Written before the code.
 *
 * (a) THE DECISION. The solver's work — reconstruction, fluxes, sources,
 *     stages, the a posteriori fall-backs — is written as WebGPU compute
 *     shaders (WGSL), the one code the product runs in the user's browser and
 *     the tests run on this machine through headless Chrome driven by
 *     Playwright (`--enable-unsafe-webgpu --use-angle=metal`, checked: the
 *     Apple M5's GPU, «apple metal-3», 4 GB storage buffers). A native
 *     program (Rust) comes later, once the goal is reached for certain.
 * (b) WHAT STAYS THE TRUTH. The TypeScript solver in double precision
 *     (`blast2d/solver.ts`) remains the reference the tests and the seal
 *     read. The GPU works in single precision (WebGPU has no double; Metal's
 *     square root is not correctly rounded — sqrt(10⁶) came back as
 *     1000.0000610): it is adopted only where it reproduces the reference
 *     within the tolerances of (d), fixed now.
 * (c) THE SAME SCHEME, WRITTEN FOR SINGLE PRECISION. The GPU carries the
 *     deviations from the atmosphere at rest — ρ − ρ̄, the momenta, E − Ē —
 *     and reconstructs (ρ − ρ̄)/(ρ₀α), u, v, (p − p̄)/(p₀β): in exact
 *     arithmetic the reference's scheme itself (the fifth-order weights are
 *     blind to a constant added to all five values), but at rest every
 *     deviation is an exact zero, so the atmosphere stays exactly at rest, and
 *     the overpressure is carried as such rather than as a difference of two
 *     large numbers. The fluxes are the full ones less the background's at the
 *     face; gravity acts on ρ − ρ̄ through the reference's own lift.
 *     Everything else as rules 1255, 1262, 1264 and 1268 set it.
 * (d) THE CHECKS, before any GPU run is used for a test. G0 — the atmosphere
 *     at rest: no speed above 0.01 m/s over the longest run (T0's criterion).
 *     G1 — the same case on the CPU and on the GPU, same grid: the reach at
 *     1, 2, 4 and 10 psi within 0.5 %, and the peak overpressure along the
 *     ground within 1 % wherever it exceeds 1 kPa, on eight cases (T2 at four
 *     heights on 20 m cells; T4's 5 Mt, static and moving, and T3 at two
 *     heights, on their coarse grids). G2 — mass kept to 10⁻⁶ of the domain's,
 *     and the source's energy to 10⁻⁴ while no wave has left the domain. A GPU
 *     that fails a check is not used; the failure is diagnosed like any
 *     other, under its own rule.
 * (e) Then, and only then, the tests T1 to T5 run again on the GPU with their
 *     criteria unchanged, and the grids finer than the CPU could afford; the
 *     CPU runs under way go on and stay on record.
 */
export const RULE_1270_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1271. THE GPU'S CHECKS: G0 AND G2 PASS, G1 FAILS ON ONE CASE OF
 * EIGHT, AND WHY (26 September 2026, 21:50; `blast2dG1.json`).
 *
 * (a) G0. The isothermal atmosphere at rest, T0's grid, 200 steps (59 s):
 *     the largest speed is exactly 0 — once the HLLC star states were written
 *     so that every difference carries (S* − u), Toro's own algebra (before,
 *     1.9·10⁻⁴ m/s). PASSES.
 * (b) G2. Mass kept to 1.5·10⁻¹² and 1.1·10⁻¹⁰ of the domain's, the energy to
 *     1.9·10⁻⁶ and 4.6·10⁻⁶ of the source's, in a uniform and an isothermal
 *     atmosphere. PASSES.
 * (c) G1. Seven cases of eight agree: T2 at four heights, T4's 5 Mt static
 *     and moving, T3 at 0.48 km scaled — every reach within 0.09 %, every peak
 *     within 0.51 %, the GPU 4 to 18 times faster on these small grids. T3 at
 *     0.048 km scaled on its coarse grid does not: reach 1.7 %, peaks from
 *     1 % at 100 to 140 km to 7 % at 163 km. G1 FAILS; under rule 1270 (d) the
 *     GPU is not used for the tests.
 * (d) THE DIAGNOSIS, one hypothesis at a time, all on the CPU in double
 *     precision to the same fixed end (700 s): (1) the run's stop — not it,
 *     the 7 % stays with a fixed end; (2) the case's own sensitivity — the
 *     source's energy times (1 + 10⁻⁷) moves the far field by 0.68 % at most,
 *     far less; (3) single precision: rounding the deviations to float32 after
 *     each step reproduces the GPU's far field to 0.2 % (11.31 against the
 *     GPU's 11.33 kPa at 164 km) — found; rounding the full state instead
 *     still leaves 3 %; computing the fluxes from a float32 state while the
 *     state itself is kept in double brings it to 1.04 % at worst (0.4 % at
 *     164 km). It is the state's accumulation — five thousand small increments
 *     rounded away — not the fluxes' arithmetic.
 */
export const RULE_1271_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1272. THE GPU'S STATE IN EXTENDED PRECISION (26 September 2026, 21:50).
 * Written before the code.
 *
 * (a) THE MEND. The state and its copies within a step (the step's start, the
 *     stage's start) are held as pairs of single-precision numbers, high and
 *     low (a «double-float»), and each stage's update is done in that
 *     arithmetic (error-free sums and products, with fma); the fluxes and
 *     everything else stay in single precision, read from the high part.
 *     Before the kernels are trusted, a check on the GPU that its error-free
 *     sum is exact (no reassociation by the shader compiler).
 * (b) G0, G1 and G2 are run again with their criteria as fixed; the tests
 *     wait for them.
 */
export const RULE_1272_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1273. G0, G1 AND G2 ON THE DOUBLE-FLOAT STATE: G0 AND G2 PASS, G1
 * FAILS AGAIN ON THE SAME CASE, AND WHY (26 September 2026, 22:16;
 * `blast2dG1.json`).
 *
 * (a) RULE 1272 (a)'S CHECK. Before every run the GPU's error-free sum and
 *     product come back exact on every pair; the shader compiler's
 *     reassociation is barred by an opaque zero read at run time (without it
 *     3 809 sums of 4 096 had lost their error term).
 * (b) G0: the largest speed after 200 steps is exactly 0. G2: mass kept to
 *     2.1·10⁻¹¹ and 7.7·10⁻¹² of the domain's, the energy to 7.8·10⁻⁹ and
 *     1.2·10⁻⁷ of the source's. Both PASS.
 * (c) G1. T2 at four heights, T4's 5 Mt static and moving, and T3 at 0.48 km
 *     scaled: every reach within 0.031 %, every peak within 0.41 % (T2 and T4
 *     within 0.018 %), the GPU 4 to 18 times faster. T3 at 0.048 km scaled
 *     on its coarse grid: every reach within 0.44 %, but the peaks 41.8 %
 *     apart at 187 km. G1 FAILS as fixed; under rule 1270 (d) the GPU is not
 *     used for the tests.
 * (d) THE DIAGNOSIS, one hypothesis at a time.
 *     (1) THE RUNS' STOP. In this case the ground at the farthest range read
 *         (195.9 km) first sees a precursor of about 2 kPa, ahead of the
 *         incident wave; rule 1263's stop takes it for the incident wave and
 *         ends the run at 510.6 s with the incident wave (9 kPa) at 186 km.
 *         The peaks read beyond are the precursor's, on both engines, and
 *         the two stops, 2.5 s apart, set them 42 % apart. To a fixed end of
 *         700 s both engines see the incident wave out to the last range
 *         (8.55 and 8.48 kPa at 195.9 km). A DEFECT OF THE RUNS' STOP, not
 *         of the GPU, and not only G1's: of the 32 runs T3 has made under the
 *         present solver, 6 end this way — incident wave short of the last
 *         range at 157 to 187 km, where it still carries 3.5 to 6.8 kPa, so
 *         their peaks from a few cells behind the cut outward, where 1 psi
 *         can fall, are not the incident wave's. None of
 *         T2's 57 runs nor of T4's 12 so far shows the signature (a peak
 *         falling more than 1.3 times from one cell to the next beyond the
 *         tenth; `scripts/blast2d-cut-scan.ts`).
 *     (2) WHAT REMAINS, to the fixed end (`blast2dT3Spread.json`,
 *         `scripts/blast2d-t3-spread.ts`): the peaks within 0.05 % out to
 *         155 km, then the GPU 1.0 to 1.8 % below the CPU from 158 to 183 km.
 *         The reference against itself, the source's energy moved by
 *         amounts from one unit in the last place (2.2·10⁻¹⁶) to 10⁻⁹,
 *         either way (ten runs): at 163 km its peaks range from −3.95 to +2.59 %
 *         of its own, the widest spread 6.5 %; the steps (5 246 to 5 529
 *         against 5 165) and the first-order fall-backs (9 696 to 12 141
 *         against 10 198) move with it. Rule 1264's fall-back is a yes or no
 *         per face, taken where a stage just loses positivity; a rounding
 *         difference turns some of them, and past 155 km the ground keeps
 *         the trace. (The later fall-backs come in two bursts, at 270 to
 *         315 s and 490 to 610 s, while the domain's thinnest cell is in its
 *         upper rows, the wave that went up having reached the open top at
 *         about 100 km; an observation, not a finding.) The GPU's peaks lie
 *         inside the reference's own spread at every range but one, 4.4 km,
 *         where they are 0.04 % outside it. At these ranges no computation can meet 1 %
 *         against the reference: the reference does not meet it against
 *         itself (3.9 % at worst).
 *     (3) One variant tried as a diagnostic, not adopted: the density
 *         carried as ρ/ρ̄ rather than as its deviation, from both halves of
 *         the state (the fireball's core thins to 2.6·10⁻⁵ of the air around
 *         it, where the deviation form keeps only some 10⁻³ of the density's
 *         precision). It moves the far field to −6.3 %, outside the spread:
 *         the core's precision is not what sets the GPU apart.
 * (e) CONSEQUENCES. (1) T3's runs stopped at 22:06: under the defective stop
 *     their readings at the far ranges are to be made again; the stop is
 *     mended under rule 1274. (2) T3's judgment will state, beside every
 *     reading, the reference's own spread where it has been measured (±4 %
 *     from 155 to 196 km at 0.048 km scaled on the coarse grid). (3) The GPU
 *     stays unused for the tests. Whether G1 may judge a reading against the
 *     reference's own spread where the reference is ill-conditioned is a
 *     change of its criterion after the fact: Andrea's decision, not taken
 *     here.
 */
export const RULE_1273_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1274. THE RUNS' STOP, MENDED: NOT BEFORE THE SOUND HAS CROSSED THE
 * RANGE (26 September 2026, 22:16). Written before the code.
 *
 * (a) THE MEND. A case may carry a floor, as a factor f: the run stops as
 *     rule 1263 says, and not before f times the time a sound wave takes to
 *     reach the farthest range read at the speed of sound of the ground's
 *     air at rest, √(γp̄₀/ρ̄₀). The incident wave is a shock and travels
 *     faster than sound, so by then it has reached that range; f = 1.1 leaves
 *     a tenth for its rise across a few cells, and ends before the small
 *     reflection from the open side boundary, at 1.15 times the range, can
 *     come back (at least 1.3 times the range's travel). At 0.048 km scaled
 *     on T3's coarse grid: 705 s, against the 510.6 s the precursor gave.
 * (b) WHERE IT APPLIES. On every one of T3's cases and on the cases of every
 *     batch started from now, the GPU's included, f = 1.1. T2's and T4's
 *     batches, under way, keep their cases as they are: a case without the
 *     floor computes, to the bit, what it computed before, so their runs are
 *     not disturbed, and each of their runs is scanned for the signature of
 *     rule 1273 (d)(1) before it is judged (`scripts/blast2d-cut-scan.ts`); one that shows it is made again
 *     with the floor.
 * (c) T3 runs again, all its cases, with the floor. G1's two T3 cases are
 *     made again with the floor on both engines and G1 is judged again, its
 *     criteria as fixed.
 */
export const RULE_1274_WRITTEN = '2026-09-26' as const;
