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

/**
 * RULE 1275. G1 JUDGED AGAIN WITH RULE 1274'S FLOOR: STILL FAILS, AS RULE
 * 1273 (d)(2) SAID IT WOULD; THE DOMAIN'S TOP IS NOT THE CAUSE (26 September
 * 2026, 22:53; `blast2dG1.json`).
 *
 * (a) T3's two cases made again with the floor on both engines, the other
 *     six unchanged. T3 at 0.048 km scaled: every reach within 0.32 % (the
 *     edge's 42 % is gone: both engines now read the incident wave out to
 *     the last range), the peaks within 1.80 % — the far field of rule 1273
 *     (d)(2), inside the reference's own spread. T3 at 0.48 km scaled: 0.031
 *     and 0.41 %. G1 FAILS as fixed; the GPU stays unused for the tests
 *     pending Andrea's decision (rule 1273 (e)(3)).
 * (b) THE DOMAIN'S TOP, a diagnostic: the same case to 700 s with the top at
 *     2.4 and 3.2 km scaled (151 and 202 km) instead of 1.6 (101 km). The
 *     ground's peaks move by at most 1.1 %, and at every range from 50 to
 *     195 km they stay inside the reference's own spread; the fall-backs grow
 *     with the cells up high (13 253 and 15 801 against 10 198). The open top
 *     neither sets the far field nor its indeterminacy: T3's domain stands.
 * (c) No run made so far under rule 1274's code (14 of T3's), nor any of
 *     T2's 58 and T4's 15, shows rule 1273 (d)(1)'s signature.
 */
export const RULE_1275_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1276. A REACH BEYOND THE DOMAIN IS A LOWER BOUND (26 September 2026,
 * 22:53). Written before the code.
 *
 * (a) THE FAULT. Where the ground's peak at the farthest range read is still
 *     above a threshold, rule 1256 (b)'s reach returns that range, and T2's,
 *     T3's and T4's judgments and T5's convergence take it as the reach. It
 *     is only a lower bound: nineteen runs of the cache, under the present
 *     code and older, carry one (T3's 1 psi at the lower heights, where the
 *     solver still has 7 to 10 kPa at 196 km; T4's 1 kPa at 50 Mt, and in
 *     two runs its 10 kPa, with 9 to 10 kPa at 68 km).
 * (b) WHY NO VERDICT WAS WRONG. Every test's domain reaches past its
 *     reference's farthest reach by at least its tolerance — T2 2.6 km
 *     against G&D's 2.14 (+21 %), T3 3.11 km scaled against Cart3D's 2.81
 *     (+11 %), T4 1.2 times the farthest distance of Collins's row (+20 %):
 *     a lower bound there already lies outside the tolerance, so a reading
 *     that bound fails, fails in truth. What was wrong is the size of the
 *     deviation printed, and T5's order and extrapolation drawn through it.
 * (c) THE MEND. The judgment marks such a reading as a lower bound («≥»),
 *     states its deviation as «at least», counts it against the criterion
 *     as failed only if the bound itself fails, and otherwise leaves it out
 *     as «beyond the domain», listed, with the case to be run again on a
 *     wider domain; T5 leaves out every grid series with such a reading.
 *     T2's and T4's drivers, under way with the old judgment in memory, are
 *     judged again from their runs once they end.
 */
export const RULE_1276_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1277. A CONTINUOUS POSITIVITY LIMITER IN PLACE OF THE YES-OR-NO
 * FALL-BACKS (26 September 2026, 23:50; Andrea's word: «Voglio la massima
 * precisione, terza scelta»). Written before the code.
 *
 * (a) WHY. Rule 1273 (d)(2): the reference's far field is fixed only to
 *     ±4 %, because rules 1262 (a), 1264 and 1268 take yes-or-no decisions —
 *     a face at first order or not, a cell redone or not, a step halved or
 *     not — that rounding turns. A scheme whose answer moves continuously
 *     with its data removes the cause; then CPU and GPU can be held to each
 *     other tightly, and grid convergence reads cleanly.
 * (b) THE SOURCE, read: Hu, Adams & Shu, «Positivity-preserving method for
 *     high-order conservative schemes solving compressible Euler equations»
 *     (J. Comput. Phys. 242, 169–180, 2013; the preprint of 4 December 2012,
 *     §2.1–2.5). Each cell's update is a convex combination of one-sided
 *     pieces Uᵢ ∓ 2λF̂ (their Eq. 11; in two dimensions Eq. 28, the
 *     directions weighted αₓ = τₓ/(τₓ + τᵧ), τ = (|u| + c)ₘₐₓ/Δ, Eq. 29, and
 *     Δt = CFL/(τₓ + τᵧ), Eq. 30). The first-order Lax–Friedrichs flux with
 *     the direction's largest (|u| + c) (Eq. 12) keeps every piece positive
 *     for CFL ≤ ½ (Eq. 13). At every face the high-order flux is blended with
 *     it, F = (1 − θ)F_LF + θF̂: θ from density first, from the two cells
 *     sharing the face, solving (1 − θ)g(U_LF) + θg(U) = ε and taking the
 *     smaller; then from pressure on the flux so limited, the same way (their
 *     two limiters of §2.2); ε = min(10⁻¹³, the initial minimum), in SI. At
 *     every Runge–Kutta stage (end of §2.2). θ is a continuous function of
 *     the data.
 * (c) OUR ADDITIONS, derived here, not from the paper. (1) THE AXISYMMETRIC
 *     WEIGHTS: with rᵢ the midpoint of the cell's radial faces, the radial
 *     update splits into pieces weighted r_{i±½}/(2rᵢ), which sum to one, and
 *     each piece is still Uᵢ ∓ 2λF̂ — the paper's condition unchanged; the
 *     axis face, of weight 0, is not limited. (2) THE SOURCES — the
 *     axisymmetric p/r and the well-balanced gravity — are added whole to
 *     every piece (the weights sum to one); density has none, so its limiter
 *     is exact as the paper's, and the pressure limiter sees the pieces with
 *     their source. Nothing guarantees a piece at θ = 0 with its source is
 *     positive: if one is not, or any cell is left without positive density
 *     and pressure, the run fails loudly — no fall-back. (3) THE FACE STATES:
 *     the high-order flux needs positive reconstructed states; since ρ/α and
 *     p/β are reconstructed themselves, positivity at a face is linear in the
 *     reconstruction, and each cell's two faces in a direction are scaled
 *     towards the cell's own value by the largest t ≤ 1 that keeps both at
 *     least ε (the velocities unscaled) — continuous where rule 1262 (a)'s
 *     face check was yes or no. (4) THE TIME STEP: Δt = 0.4Δ/((|u| + c)ₘₐₓ +
 *     (|v| + c)ₘₐₓ), their Eq. 30 with CFL 0.4 (≤ ½); the Lax–Friedrichs
 *     speeds and the weights αᵣ, α_z are taken from each stage's own state.
 * (d) HOW IT ENTERS. A solver option and a case field, `limiter: 'has'`; a
 *     case without it computes, to the bit, what it did (rules 1262, 1264,
 *     1268), so T2's batch under way is untouched and finishes for the record.
 *     T3's and T4's batches, on the old scheme and far from their end, are
 *     stopped at 23:50: their tests will be made on the scheme adopted here.
 * (e) THE CRITERIA, fixed now, on the CPU reference. (1) At rest: T0's
 *     criterion, no speed above 0.01 m/s. (2) Determinacy: rule 1273's case
 *     (T3 at 0.048 km scaled, coarse, to 700 s) under the eleven moves of the
 *     source's energy (`scripts/blast2d-t3-spread.ts`): the widest spread of
 *     the ground's peak within 0.1 % wherever it exceeds 1 kPa — ten times
 *     inside G1's tolerance. (3) Robustness: those eleven runs, and T2 at its
 *     lowest height on 20 m cells, end without a positivity failure. The
 *     limiter is adopted if all three hold; then every test, T1 to T5, is made
 *     again on it, and the GPU is written to it and checked (G0 to G2)
 *     before it runs any. If one fails, it is diagnosed under its own rule;
 *     nothing is tuned to pass.
 */
export const RULE_1277_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1278. RULE 1277'S LIMITER: ALL THREE CRITERIA MET, ADOPTED (27
 * September 2026, 00:10; `blast2dT3Spread.has.json`).
 *
 * (a) AT REST: 200 steps of T0's isothermal atmosphere, the largest speed
 *     1.7·10⁻¹² m/s, no face blended, no face pair scaled. MET.
 * (b) DETERMINACY: rule 1273's case under the eleven moves of the source's
 *     energy, from one unit in the last place to 10⁻⁹: the widest spread of
 *     the ground's peak 2.2·10⁻⁸ wherever it exceeds 1 kPa (the old scheme's
 *     6.5 %), every run the same 4 923 steps. MET, three million times over.
 * (c) ROBUSTNESS: those eleven runs (16 515 faces blended in each) and T2 at
 *     the ground on 20 m cells (none blended) end without a positivity
 *     failure. MET.
 * (d) WHAT MOVED. T2 at the ground: every peak within 0.06 % of the old
 *     scheme's. Rule 1273's case: within 1 % from 10 to 150 km, 11.5 %
 *     higher at 1.9 km (the fireball's edge, where the old scheme redid cells
 *     at first order), and 3 to 11 % lower from 158 to 196 km — outside the
 *     old scheme's own spread there. Which is nearer the truth, the grids
 *     will say (T5); the new answer at least is one answer.
 * (e) THEREFORE, as rule 1277 (e) fixed: the limiter is the solver's; every
 *     test, T1 to T5, is made again on it (the old scheme's results kept as
 *     *.mood.json), and the GPU is written to it and checked, G0 to G2 with
 *     G1 against this reference, before it runs any of them.
 */
export const RULE_1278_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1279. THE GPU ON RULE 1277'S LIMITER: THE FACE FLOOR IN SINGLE
 * PRECISION (27 September 2026, 00:46).
 *
 * (a) THE PORT. The GPU carries rule 1277 as the reference does: the face
 *     states scaled towards their cell (kernels scaleR, scaleZ), every face
 *     at fifth order, each face's flux blended with the Lax–Friedrichs flux
 *     on the full variables and the full sources (limitR, limitZ), the
 *     speeds (|u| + c)ₘₐₓ and (|v| + c)ₘₐₓ of every stage read back for the
 *     weights and Δt, and a cell left unsound failing the run. G0: at rest
 *     exactly 0 after 200 steps. G2: mass to 1.7·10⁻¹¹ and 7.3·10⁻¹², energy
 *     to 1.7·10⁻⁹ and 1.6·10⁻⁷ of the source's. Both PASS.
 * (b) G1'S FIRST CASE FAILED (T2 at 0.048 km, 20 m, at 1.94 s): a benign
 *     cell (ρ = 0.095, p = 101 kPa) turned NaN. THE CAUSE: the GPU carries
 *     the density and pressure as deviations, w = ρ/ρ̄ − 1, in single
 *     precision; the floor 10⁻¹³ on 1 + w cannot be written there — the
 *     nearest number to −1 + 10⁻¹³ is −1 — so a face scaled to the floor
 *     had zero density and the Riemann solver divided by it.
 * (c) THE MEND. On the GPU the face floor is 2⁻²² (≈ 2.4·10⁻⁷, the smallest
 *     1 + w single precision holds with a margin), and a scaled face is
 *     kept at least there (a max, continuous). Tried first as a diagnostic:
 *     the case then runs to its end in 4 884 steps, the reference's own
 *     count, in 18 s against 161 s. Where no face is near vacuum the two
 *     floors do the same; where one is, the difference is continuous and
 *     G1 measures it. The reference keeps 10⁻¹³.
 * (d) G1 runs again, its criteria as fixed.
 */
export const RULE_1279_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1280. RULE 1277 (c)(3) WAS WRONG: A FACE SCALED TO THE FLOOR IS A
 * VACUUM WHERE THERE IS NONE; THE FACES ARE BLENDED TOWARDS THEIR CELL
 * INSTEAD (27 September 2026, 01:00). Written before the code.
 *
 * (a) FOUND by G1's diagnosis (rule 1279 (d)): CPU and GPU, fed the same
 *     time steps on rule 1273's case, agree to 10⁻⁷ for seven steps and part
 *     by 44 % in density at the axis at the eighth. There the ground cell
 *     under the axis holds 501 kPa below the fireball's core (~10⁹ Pa); every
 *     fifth-order candidate at its ground face, (7p₀ − p₁)/6 among them, is
 *     negative, and rule 1277 (c)(3) scaled the face to the floor: the wall's
 *     momentum flux came out −0.011 Pa on the CPU instead of some 5·10⁵ Pa —
 *     the ground stopped pushing on the cell. The flux there is the floor's,
 *     not the flow's: the two engines' floors (10⁻¹³, 2⁻²²) part them, and
 *     even with the same floor on both the eighth step parts them by 44 %.
 *     A flaw of the construction, on both engines, that rule 1278's criteria
 *     could not see: the answer was determinate, positive, and wrong there.
 * (b) THE MEND, with no floor. Per cell and direction, y_c the cell's ratio
 *     (ρ/ρ̄ or p/p̄) and m the smaller of its two reconstructed faces, both
 *     faces are blended towards the cell's value, y = y_c + t(y_face − y_c):
 *     t = 1 where m ≥ ½y_c, t = 0 where m ≤ 0, t = 2m/y_c between — linear
 *     in m and continuous at both ends. A negative face becomes the cell's
 *     own value (first order, as rule 1262 (a) made it, but reached
 *     continuously); a face above half its cell's value is untouched; every
 *     face lies between its cell's value and a positive one. The half is
 *     chosen here, before any run, as «the reconstruction has lost half the
 *     cell's value within half a cell»; it is not tuned to a result.
 * (c) Rule 1277's other parts stand. Rule 1278's three criteria are met
 *     again on the mended scheme, with a fourth: at the eighth step of rule
 *     1273's case the wall pushes — the ground face's vertical momentum flux
 *     under the axis at least half its cell's pressure. Then T1, and G1.
 *     Rule 1279's GPU floor goes with the floor.
 */
export const RULE_1280_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1281. RULE 1280'S SCHEME MEETS ITS CRITERIA, AND THE GPU PASSES G0, G1
 * AND G2 ON IT (27 September 2026, 01:33; `blast2dT3Spread.has.json`,
 * `blast2dG1.json`).
 *
 * (a) THE CRITERIA OF RULES 1278 AND 1280 (c). At rest: the solver's tests,
 *     no speed above 10⁻⁹ m/s and no face touched. Determinacy: the widest
 *     spread 1.1·10⁻⁷ under the eleven moves of the source's energy, every
 *     run 4 311 steps. Robustness: those eleven and T2 at the ground on 20 m
 *     cells end without a failure. The wall pushes: at the eighth step the
 *     ground face under the axis carries 1.07 times its cell's pressure
 *     (the flawed scheme: 2·10⁻⁸). ALL MET.
 * (b) WHAT MOVED. Against the old scheme, rule 1273's case: +4 to +10 %
 *     within 3 km of the axis, within 2 % from 10 to 130 km, −18 to +9 %
 *     from 160 to 196 km; T2 at the ground: ±5 % within 90 m, within 0.7 %
 *     beyond 500 m.
 * (c) THE GPU, fed the reference's steps on rule 1273's case: within 6·10⁻⁶
 *     in density and 2.5·10⁻⁶ in pressure over 300 steps (19 s), where the
 *     flawed scheme parted by 44 % at the eighth.
 * (d) G0: exactly at rest. G2: mass to 1.7·10⁻¹¹ and 8.3·10⁻¹², energy to
 *     1.7·10⁻⁹ and 1.8·10⁻⁷ of the source's. G1: all eight cases take the
 *     reference's own number of steps; every reach within 0.009 %, every peak
 *     within 0.11 % (the criteria: 0.5 % and 1 %); the GPU 9 to 29 times
 *     faster. ALL PASS.
 * (e) THEREFORE, under rules 1270 (e) and 1278 (e): the tests are made on
 *     rule 1280's scheme with their criteria and grids as fixed — T2, T3 and
 *     T4 on the GPU (their finest grids cost the CPU days), T1 on the CPU
 *     reference (its grids are small); whether finer grids than those fixed
 *     are wanted is Andrea's to say. The CPU's own hot loops were written out
 *     per component meanwhile: the same numbers to the bit, twice as fast.
 */
export const RULE_1281_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1282. THE TESTS ON RULE 1280'S SCHEME, T2 TO T4 ON THE GPU (27
 * September 2026, 01:36). Written before the runs.
 *
 * (a) Every case of T2, T3 and T4 carries rule 1274's floor (1.1) and rule
 *     1277's limiter; their grids, references, criteria and rule 1276's
 *     reading of lower bounds are as fixed. They run on the GPU
 *     (BLAST2D_ENGINE=gpu: the same cases, the GPU's code in the cache key),
 *     several pages at once, each its own device; T1 on the CPU reference.
 * (b) T2's old-scheme batch was stopped at 01:36 with 69 of its 78 runs
 *     (rule 1277 (d) had let it finish for the record): the scheme it tested
 *     is no longer the solver's, and its output files are the new batch's.
 *     Its runs stay in the cache, under d09d6aa's code.
 * (c) The outcomes are written as rules as they come, each test judged as
 *     fixed; nothing is changed between a test's runs and its verdict.
 */
export const RULE_1282_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1283. T2 ON RULE 1280'S SCHEME: FAILED AS FIXED (27 September 2026,
 * 02:08; `blast2dT2.json`, `docs/BLAST2D_T2.md`).
 *
 * (a) THE NUMBERS. 78 runs on the GPU (1.5 hours of GPU time, three pages at
 *     once), no fall-back of any kind, no reading beyond the domain. Of 104
 *     readings 60 judged (44 left out by rule 1256 (a)): worst 0.80, median
 *     0.122 — the criterion 0.10 and 0.05. By threshold: 1 psi median 0.31,
 *     2 psi 0.096, 4 psi 0.024, 10 psi 0.040 (10 psi alone would pass).
 *     T2 FAILS.
 * (b) THE SHAPE. Below the curves' knee the solver lies 9 to 14 % beyond G&D
 *     at 1 psi (heights 0.16 to 0.52 km), 19 to 34 % at the lowest four
 *     heights, while at 2 and 4 psi it lies within 9 % of G&D there; above the knee (from 0.59 km) 34 to 75 % beyond, the curve
 *     falling more slowly with height than G&D's. Converged: the three grids
 *     within a few per cent almost everywhere.
 * (c) A DIAGNOSTIC, not a criterion: rule 1267's equivalence — G&D's 1 kt
 *     free-air curve is the air shock of about 0.72 kt of this source — with
 *     range and height scaled as W^(1/3). The medians become 0.095, 0.065,
 *     0.081 and 0.089 (1, 2, 4, 10 psi), the worst 0.38: below the knee 1 psi
 *     within 5 %, the higher thresholds 5 to 12 % short; above the knee still
 *     10 to 38 % beyond. The energy accounts for the offset below the knee,
 *     not for the knee.
 * (d) The energy convention for judging against nuclear data (G&D's yield is
 *     not the air shock's) is Andrea's decision, open since rule 1267; the
 *     knee is a question of its own. Nothing is changed here.
 */
export const RULE_1283_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1284. T4 ON RULE 1280'S SCHEME: FAILED AS FIXED — THE SOLVER RUNS
 * HOTTER THAN ISALE, EVERYWHERE (27 September 2026, 04:41; `blast2dT4.json`,
 * `docs/BLAST2D_T4.md`).
 *
 * (a) THE NUMBERS. 28 runs on the GPU (the finest, up to 2.3 million cells,
 *     about an hour each three at a time), no fall-back. 1 of 39 numbers
 *     within 15 %. T4 FAILS.
 * (b) THE SHAPE: every number above Collins et al.'s iSALE, none below —
 *     median 1.29; the peak at ground zero 1.18 to 1.70, at three burst
 *     altitudes 1.17 to 1.55, the ranges of 1 to 35 kPa 1.12 to 1.41 (6 of
 *     them lower bounds, rule 1276), with two outliers where a range sits at
 *     a knee (20 kPa at 5 Mt static, 1.98; 35 kPa at 5 Mt moving, 6.0). The
 *     three grids agree with each other to a few per cent almost everywhere:
 *     not a resolution effect. The literal 45 m·W^(1/3) radius changes the
 *     far field by a few per cent, the ground zero of 15 and 50 Mt by 9 and
 *     15 %.
 * (c) WHAT IT MEANS. By Hopkinson–Cranz scaling a range 1.2 to 1.3 times
 *     farther is a blast energy 1.7 to 2.2 times larger: the solver carries
 *     more of the source's energy into the blast than iSALE does, in the
 *     same direction as T2 (rule 1283 (c): 1 kt of this source ≈ 1.39 kt of
 *     G&D's, while Collins et al. report their 1 kt close to the nuclear
 *     data). Rule 1265 (d) made T4 the judge of the slow ground wave at
 *     250 Mt: T4 says the excess is the solver's, or its physics', not the
 *     stratification's alone.
 * (d) OPEN, not settled here: whether it is the air's equation of state
 *     (this solver's ideal gas at 12 500 K in the source against whatever
 *     iSALE's air was — to be read in their text), the source's energy
 *     partition, or this scheme. T3 (Aftosmis et al.'s Cart3D, a perfect gas
 *     like this solver's) runs on the GPU now and separates the equation of
 *     state from the rest. Nothing is changed.
 */
export const RULE_1284_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1285. RULE 1284 (d)'S FIRST QUESTION ANSWERED FROM THE TEXT: THE SAME
 * EQUATION OF STATE (27 September 2026, 04:44). A diagnostic.
 *
 * (a) READ. Collins et al. (2017), the same open copy as rules 1242 and 1248
 *     (SHA-256 c1cb0fc6…), Methods: iSALE's atmosphere «using a perfect gas
 *     equation of state … p = ΓρE, with Γ = 0.4» — γ = 1.4, this solver's —
 *     isothermal, 1 kg/m³ and 10⁵ Pa at the base; «Ten computational cells
 *     resolved the fireball radius»; no radiative transfer in iSALE; the
 *     static source verified against Glasstone & Dolan's 1 kt data with «good
 *     agreement», no number given.
 * (b) SO the equation of state is not the difference, and neither is the
 *     resolution on this side: at 0.5 Mt the source's radius is 772 m, and
 *     the solver's middle grid (79 m, 9.7 cells across it — iSALE's own)
 *     already gives 68.8 km for 1 kPa against their 52.3 (1.32); the three
 *     grids give 71.7, 68.8 and 73.5.
 * (c) WHAT REMAINS: iSALE's own dissipation (a code built for impacts on
 *     solids, ten cells per radius carried some seventy radii out), or this
 *     solver's. T1 says something here: its Sedov shock runs 3.8 % (100
 *     cells) and 6.1 % (200 cells) ahead of the exact radius — a radius 5 %
 *     long is an energy 28 % high — though rule 1257 found the reading itself
 *     ahead of the density's peak. An independent ideal-gas reference with no
 *     numerical dissipation of its own decides it: T1 on its finest grid
 *     (running), read at the density's peak as well as at rule 1257's
 *     flank; and Brode's (1956) hot sphere of air in a perfect gas, the
 *     static source exactly (a RAND research memorandum, openly published),
 *     to be read before it is used. T3 (Cart3D, a perfect gas, adaptive
 *     high resolution) runs meanwhile.
 */
export const RULE_1285_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1286. THE SEDOV SHOCK READ AT ITS DENSITY PEAK: NOT AHEAD, A LITTLE
 * BEHIND (27 September 2026, 04:49). A diagnostic, for rule 1285 (c).
 *
 * (a) T1's case on rule 1280's scheme, 200 cells
 *     (`scripts/blast2d-t1-peak.ts`): the density's peak along the ground
 *     and the axis (a parabola through the top three cells)
 *     against ξ(2Et²/ρ)^(1/5). From 8 to 92 cells of radius it lies 0.3 to
 *     1.0 cell BEHIND the exact radius (−4.5 to −0.4 %), closing as the shock
 *     grows (−0.7 and −0.4 % at 92 cells, ground and axis).
 * (b) SO the solver's shock does not outrun Sedov's: T1's failure is its
 *     reading on the outer flank (rule 1257's finding, again), and the exact
 *     solution shows no excess of energy in this solver — if anything a
 *     shock a fraction of a cell slow, as a captured shock's peak sits. The
 *     excess against iSALE (rule 1284) is then not this solver's energy
 *     budget; iSALE's own dissipation over seventy source radii is the
 *     likelier cause, not yet shown. Brode's (1956) hot sphere (rule 1285
 *     (c)) is the next independent reference. Nothing is changed.
 */
export const RULE_1286_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1287. T1 ON RULE 1280'S SCHEME: FAILED AS FIXED, NEARER THAN EVER
 * (27 September 2026, 04:58; `blast2dT1Sedov.json`,
 * `blast2dT1Extrapolated.json`).
 *
 * (a) On the CPU reference, 100, 200 and 400 cells (2 220, 9 282 and 38 160
 *     steps; 36 s, 8 min, 3.2 h), no fall-back. The worst judged deviation
 *     of the flank reading: 3.8, 6.1 and 3.1 % (the old scheme 10.4, 11.9,
 *     9.5) — the 2 % criterion FAILS on every grid.
 * (b) Re-judged on the extrapolated radius (rule 1258): 17 of 18 readings
 *     within 2 %, the worst 1.3 %; the eighteenth (0.18, the diagonal) does
 *     not converge monotonically (0.1868, 0.1817, 0.1819) and its spread,
 *     2.8 %, stands as its error — FAILS, by that one reading (the old
 *     scheme: 16 of 18).
 * (c) Read at the density's peak instead (rule 1286), the shock is a fraction
 *     of a cell behind the exact radius and closing: T1's criteria, fixed on
 *     the flank, measure the reading as much as the solver. Nothing changed.
 */
export const RULE_1287_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1288. T3 ON THE GPU STOPPED BY A FAILURE THE CPU DOES NOT HAVE (27
 * September 2026, 04:58).
 *
 * (a) After 21 of its 104 runs (the coarse grid up to 0.90 km scaled), T3's
 *     GPU batch failed: at 1.111 km scaled (70 km of altitude) a cell of the
 *     domain's top row, 145 km up — the air there 7·10⁻¹⁰ kg/m³, the rising
 *     gas 300 times that at 133 km/s — turned NaN at 0.68 s (step 1 095).
 * (b) The CPU reference runs that case, and those at 0.95 and 1.03 km scaled,
 *     to their end without a failure; on those two the GPU agrees with it in
 *     the same number of steps within 0.07 %. On the failing case the two
 *     engines, fed the same steps, agree within 10⁻⁴ through step 1 090, and
 *     at step 1 095 the first stage's fluxes about the cell are the same on
 *     both: the NaN arises later in that step, on the GPU only. A clamp that
 *     sends NaN to 0, as the reference's does, was tried and did not change
 *     it (not kept). Not yet found; T3 waits for it (rule 1270 (d): a GPU
 *     failure is diagnosed like any other).
 */
export const RULE_1288_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1289. RULE 1288'S FAILURE FOUND: THE FIFTH-ORDER WEIGHTS OVERFLOW IN
 * SINGLE PRECISION; WRITTEN SCALED (27 September 2026, 05:00). Written
 * before the code.
 *
 * (a) THE CAUSE. The NaN arises in the second stage of step 1 096 at the
 *     domain's top face over column 14, before the limiter, on the GPU only.
 *     The ghost rows above the top copy its values, so a stencil lying in
 *     them has a smoothness indicator of exactly zero, and its Z weight is
 *     d(1 + τ/(0 + ε)) with ε = 10⁻²⁰ (rule 1270's single-precision
 *     choice): τ near 10¹³ (p/p̄ near 10⁶ in the rising jet) makes it some
 *     10³³, times a candidate near 10⁶ — past single precision's 3.4·10³⁸:
 *     infinite over infinite. The reference in double (ε = 10⁻⁴⁰, range
 *     10³⁰⁸) never meets it.
 * (b) THE MEND, the same normalised weights written so that nothing can
 *     overflow: hₖ = (βₖ + ε)/(τ + βₖ + ε), in (0, 1], so that the Z weight
 *     dₖ(1 + τ/(βₖ + ε)) is dₖ/hₖ; the weights used are dₖ·h_min/hₖ (h_min
 *     the smallest; 1 where hₖ ≤ h_min, which also covers two that underflow
 *     alike) — the Z weights divided by the common 1/h_min, which cancels in
 *     the average. At rest every h is 1 and the weights are dₖ; a deviation
 *     of zero still reconstructs to exactly zero. A first form tried
 *     (multiplying by min β + ε) overflowed where every β is large and failed
 *     the first step; not kept. On the GPU only; the reference is unchanged.
 * (c) G0, G1 and G2 are run again, their criteria as fixed; then T3.
 */
export const RULE_1289_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1290. RULE 1289'S WEIGHTS: THE FAILING CASE RUNS, G0 TO G2 PASS AGAIN
 * (27 September 2026, 05:09; `blast2dG1.json`).
 *
 * (a) T3 at 1.111 km scaled on the coarse grid now runs to its end on the
 *     GPU in 8 672 steps, the reference's own count, the ground's peaks
 *     within 0.09 % of it.
 * (b) G0: exactly at rest. G2: mass to 2.4·10⁻¹¹ and 1.1·10⁻¹¹, energy to
 *     5.3·10⁻⁹ and 1.9·10⁻⁷ of the source's. G1: all eight cases in the
 *     reference's own number of steps, every reach within 0.010 %, every
 *     peak within 0.13 %. ALL PASS. T3 runs again on the GPU, all its cases.
 */
export const RULE_1290_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1291. T3 ON RULE 1280'S SCHEME: FAILED AS FIXED (27 September 2026,
 * 09:45; `blast2dT3.json`, `docs/BLAST2D_T3.md`).
 *
 * (a) 104 runs on the GPU after rule 1289's weights, the finest 713 × 320
 *     cells. Of 104 readings 53 judged (51 left out by rule 1256 (a)), 2 of
 *     them lower bounds (rule 1276): worst 3.62, median 0.23 — T3 FAILS.
 * (b) THE SHAPE, against Cart3D (a perfect gas and gravity, as this solver):
 *     for bursts from about 10 km of real altitude up to the curves' knee the
 *     solver lies 5 to 23 % beyond (1 psi 1.09 to 1.18, 2 psi 1.05 to 1.19,
 *     4 psi 1.16 to 1.32) — the order of T2's offset; above the knee 1.3 to
 *     1.85 beyond; and for bursts within about 5 km of the ground 2 to 4.6
 *     times (2 psi at the ground 2.63 km scaled against 0.58). The three
 *     grids agree: not resolution.
 */
export const RULE_1291_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1292. THE EXCESS NEAR THE GROUND, DIAGNOSED SO FAR (27 September 2026,
 * 09:45; Andrea: «sì, cerca la causa dell'eccesso vicino al suolo»). A
 * diagnostic; nothing is changed.
 *
 * (a) THE SOURCE IS NOT IT. The same 250 Mt at the ground in a uniform
 *     atmosphere without gravity (the stratified run's ground density) gives
 *     1, 2, 4 and 10 psi at 1.57, 0.95, 0.60 and 0.35 km scaled — T2's own
 *     1 kt at the ground, scaled (1.54, 0.95, 0.60, 0.33).
 * (b) THE STRATIFICATION IS. With the scale height 108, 27 and 6.76 km the
 *     reaches grow — 1 psi 1.63, 1.85, 3.10 (the domain's edge) — where
 *     Cart3D's shrink below the uniform ones (1.04). The ground's peak
 *     departs from the uniform run's beyond some 2 scale heights (+22 % at
 *     12.6 km, +48 % at 19 km, +70 % at 31 km, double at 63 km) and then
 *     barely decays (exponent −0.8), even growing from 18.3 to 20.1 kPa
 *     between 106 and 144 km.
 * (c) THE FRONT LEADS ALOFT: at 120 km of range it reaches 60 km of altitude
 *     at 222 s, 20 km at 292 s, the ground at 315 s; the peak along the
 *     ground is always the front's (no later wave).
 * (d) NOT THE DOMAIN'S TOP: with the top at 100, 60, 40, 20 and 15 km the
 *     10 and 4 psi reaches do not move (0.45, 0.97), 2 psi falls from 2.63
 *     to 1.80 only below 20 km. NOT AN ENERGY SOURCE: with nothing leaving
 *     the domain (top at 200 km) the total energy, internal, kinetic and
 *     potential, changes by −0.08 % of the source over 120 s, the mass by
 *     10⁻¹⁴. NOT THE LIMITER: the old scheme showed the same excess (rule
 *     1265). The atmosphere's ringing after a gentle pulse has periods of
 *     324 to 344 s at 5.5 km, on the gravity-wave branch (2π/N = 309 s):
 *     no gross error in the dynamics with gravity, though not a clean test.
 * (e) WHERE IT STANDS: the solver keeps more of a low burst's energy near the
 *     ground than Cart3D and iSALE do (rule 1269 saw it against
 *     Kompaneets), with every check this project can make on it passing.
 *     Which is right needs an independent reference for a strong explosion
 *     in an exponential atmosphere: Laumbach & Probstein (1969, J. Fluid
 *     Mech. 35) for the shock's strength along the horizontal; Aftosmis et
 *     al.'s fuller NASA report for their setup (domain, duration, source at
 *     the ground); Brode (1956) for the hot sphere itself.
 */
export const RULE_1292_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1293. THE EXCESS NEAR THE GROUND, FURTHER (27 September 2026, 09:53).
 * A diagnostic; nothing is changed.
 *
 * (a) THE NASA RECORD: NTRS holds only the poster of Aftosmis, Mathias &
 *     Tarano's work (20170011263, fetched again with Andrea's leave, the
 *     same bytes as rule 1242's, sha-256 71b29d5c…); it gives neither the
 *     domain, the duration nor how a source at the ground was set. Their
 *     paper says their simulations follow yield scaling up to about 10 Mt.
 * (b) THIS SOLVER AT 1 AND 5 Mt, at the ground, the stratified atmosphere
 *     against a uniform one of the same ground density: 1 psi +11 and +22 %,
 *     2 psi +7 and +14 %, 4 psi +5 and +8 %, 10 psi +3 and +6 %. The
 *     stratification's lift grows with the yield already below 10 Mt, where
 *     Cart3D and nuclear experience (Glasstone & Dolan's scaling rests on
 *     surface bursts of several megatons) see little.
 * (c) THE WHOLE PICTURE: at mid heights this solver lies 5 to 30 % beyond
 *     iSALE (T4), Cart3D above ~10 km (T3) and G&D (T2) alike — one offset,
 *     which less accurate codes' dissipation of a weak shock over long paths
 *     (this project's own TVD scheme lost 16 % of a peak in 1 km, rule 1261)
 *     or, for G&D, the nuclear blast fraction could explain; near the ground
 *     in a stratified atmosphere a lift of its own, 2 to 4.6 times Cart3D at
 *     250 Mt. Brode's free-air solutions (Andrea is placing them) decide the
 *     first; the second still wants an independent reference for a strong
 *     explosion at the ground in an exponential atmosphere (Laumbach &
 *     Probstein 1969 not found).
 */
export const RULE_1293_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1294. BRODE'S IDEAL-GAS BLAST READ: THIS SOLVER CONVERGES TO IT FROM
 * BELOW — NO EXCESS OF ENERGY IN FREE AIR (27 September 2026, 10:09). A
 * diagnostic, the first against an independent ideal-gas solution.
 *
 * (a) THE SOURCE. Brode, «Numerical Solutions of Spherical Blast Waves»,
 *     RAND RM-1363 (placed by Andrea, scanned, sha-256 e2526ab70bdf964b…;
 *     RM-1825 beside it, 2d96e7f55349221d…). An ideal gas, γ = 1.4, a
 *     Lagrangian integration from 2 000 atm down to 0.1 atm; the energy's
 *     length ε³ = E_tot/P₀ with E_tot the blast's energy in excess of the
 *     air at rest (his Eqs. 1–2), λ = r/ε; the peak overpressure of the
 *     point source (his Eq. 17) ΔP = 0.137/λ³ + 0.119/λ² + 0.269/λ − 0.019
 *     atm for 0.1 < ΔP < 10 (0.26 < λ < 2.8).
 * (b) THIS SOLVER IN ONE SPHERICAL DIMENSION (`scripts/blast1d-diagnostic.ts`,
 *     1 kt in a 45 m sphere at sea level, fifth-order WENO): at 1 km
 *     (λ = 2.89) 8.48, 9.07, 9.24 and 9.46 kPa on 5, 2, 1 and 0.5 m cells
 *     against Brode's 9.51 (−0.5 %); at 0.5 km (λ = 1.45) 24.8 to 26.0
 *     against 27.25 (−4.5 %, still rising).
 * (c) IN TWO DIMENSIONS, T2's 1 kt at the ground on the limiter — by the
 *     mirror a free-air 2 kt (ε = 435.5 m): on the 5 m grid −4 % at
 *     λ = 2.5 to 2.8, −6 to −10 % at λ = 1 to 2, less nearer the source,
 *     where the grids have not converged.
 * (d) SO: the solver approaches the ideal-gas solution from below and holds
 *     no energy it should not. T2's excess over G&D is then the nuclear
 *     blast's smaller share (rule 1267), not the solver's; where iSALE (T4)
 *     and Cart3D above ~10 km (T3) lie 5 to 30 % below this solver, they lie
 *     further below the ideal-gas truth — their dissipation is the likelier
 *     cause, though their atmospheres are stratified and Brode's is not. The
 *     lift near the ground in a stratified atmosphere (rules 1292–1293) is a
 *     question apart, still without an independent reference.
 */
export const RULE_1294_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1295. THE PATH, AND THE VERIFICATION PROGRAMME THAT BEGINS IT (27
 * September 2026, 10:17; Andrea: «sì, seguiamo questa strada, parti dalla
 * verifica»). Written before the code.
 *
 * (a) THE PATH, the most exact rather than the quickest: (1) verification —
 *     the solver solves its equations right, shown against exact solutions;
 *     (2) real air and radiation in the fireball, validated on the nuclear
 *     tests with no imposed factor; (3) the moving source from the entry
 *     model, then three dimensions, validated on Chelyabinsk and Tunguska;
 *     (4) fast models derived from it and the inputs' uncertainty carried
 *     through; (5) publication, independent review and the NASA Ames group.
 *     Each step verified and declared before the next is built on it.
 * (b) WITH IT, as proposed in the same answer: against nuclear data the
 *     blast's share of the yield is a declared input of the model, with its
 *     uncertainty, until the physics of step 2 yields it (rule 1267's 0.72 is
 *     a measurement, not a truth); T3 and T4 become comparisons between
 *     codes, reported and discussed, no longer pass-or-fail. The measures are
 *     exact solutions (verification) and observations (validation).
 * (c) THE VERIFICATION TESTS, on the solver itself (the CPU reference; the
 *     GPU where the grids need it), criteria fixed now:
 *     V1 — SMOOTH ORDER. A small spherical acoustic pulse (10⁻⁶ p₀ — small
 *       enough that the equations' nonlinearity, of the order of the
 *       amplitude, stays below the errors measured — Gaussian, at rest,
 *       isentropic) in a uniform atmosphere without gravity, centred on the
 *       axis at the ground (the wall and the axis both in play); the exact
 *       linear solution R·p' = ½[(R − ct)g(R − ct) + (R + ct)g(R + ct)] (g
 *       the initial profile, evenly extended). Initial state and exact
 *       solution as cell averages (Gauss quadrature, weighted by r). The L1
 *       error of p' over the L1 norm of the exact p', at a fixed time, on four
 *       grids (the pulse's width over 4, 8, 16 and 32 cells): the observed
 *       order at least 3 between the two finest, the finest's error at most
 *       1 %.
 *     V2 — PLANAR RIEMANN. Sod's shock tube along z (uniform, no gravity);
 *       the exact solution (Toro). The L1 error of density on four grids:
 *       observed order at least 0.8 between the two finest; the shock within
 *       one cell of the exact position on the finest.
 *     V3 — BRODE. The point source's peak overpressure (RM-1363, Eq. 17) from
 *       the two-dimensional solver — a ground burst read as the free-air
 *       burst of twice its energy — on 5, 2.5 and 1.25 m cells for 1 kt: the
 *       value extrapolated from the three (rule 1256 (c)) within 3 % of Eq.
 *       17 for 1 ≤ λ ≤ 2.8, the finest grid's raw value reported beside it.
 *     V4 — LAMB'S WAVE. In the isothermal atmosphere with gravity the mode
 *       with no vertical velocity is exact in the linear equations: p' = c²ρ'
 *       = P(r, t)e^{−z/(γH)}, u = U(r, t)e^{(γ−1)z/(γH)}, P and U obeying the
 *       cylindrical wave equation at c. Started from it (10⁻⁵ p₀ at the
 *       ground, a Gaussian ring, U = 0) with the top far enough that nothing
 *       from it reaches 3H in the time run: |w| at most 1 % of |u|; the
 *       vertical profile of p' within 1 % of e^{−z/(γH)} for z ≤ 3H; the
 *       ground's P within 1 % of the cylindrical wave equation's solution
 *       (computed apart to 10⁻⁶) on the finest grid, observed order at least
 *       2. This is the test of the dynamics with gravity the lift near the
 *       ground (rules 1292–1293) wants.
 * (d) ORDER: V1, V2, V4, V3. Nothing is adjusted to pass; a failure is
 *     diagnosed under its own rule. The scripts are the project's
 *     (`scripts/verify-blast-*.ts`), their outcomes committed as JSON.
 */
export const RULE_1295_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1296. V1: FAILED AS FIXED — SECOND ORDER IN THE AXISYMMETRIC GEOMETRY,
 * FIFTH IN THE PLANE (27 September 2026, 10:20; `verifyBlastV1.json`).
 *
 * (a) THE NUMBERS (`scripts/verify-blast-v1.ts`). The pulse's width over 4, 8,
 *     16 and 32 cells: relative L1 error 1.13·10⁻², 3.34·10⁻³, 8.54·10⁻⁴,
 *     2.15·10⁻⁴; observed orders 1.76, 1.97, 1.99. The finest's error is
 *     within its 1 %; the order, 2 against at least 3, is not — V1 FAILS.
 * (b) THE DIAGNOSIS (`scripts/verify-blast-v1-planar.ts`): the same pulse
 *     planar along z, where the geometry plays no part, gives 3.1·10⁻³,
 *     1.2·10⁻⁴, 5.2·10⁻⁶, 6.6·10⁻⁷ — orders 4.67, 4.57, then 2.97 where the
 *     third-order Runge–Kutta's error takes over. The reconstruction is of
 *     high order along a line; in r it is not. The cause: the cell averages
 *     in r are weighted by r, and they are reconstructed with Cartesian
 *     coefficients, and the axisymmetric source p/r takes the cell's value at
 *     its centre — each second-order in the geometry. Mignone (2014, J.
 *     Comput. Phys. 270, 784; arXiv 1404.0537) derives the reconstruction's
 *     coefficients for r-weighted averages and finds their absence degrading
 *     the accuracy near the axis «severely»: the mend's source, to be read
 *     before it is written. (That reconstructing primitive variables from
 *     averaged conserved ones is also second order in a nonlinear flow is a
 *     second question, which these linear tests cannot see.)
 */
export const RULE_1296_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1297. THE MEND OF RULE 1296: THE RADIAL RECONSTRUCTION AND THE AXIAL
 * SOURCE WRITTEN FOR THE GEOMETRY (27 September 2026, 10:29). Written before
 * the code.
 *
 * (a) THE SOURCE, read (Andrea's leave): Mignone (2014), arXiv 1404.0537
 *     (sha-256 1ee5ef49…), §§2–4. A face value from r-weighted averages is
 *     Σₛ wₛ⟨Q⟩ᵢ₊ₛ with weights solving his Eq. 21 — the transposed matrix of
 *     the moments βᵢ₊ₛ,ₙ = (1/ΔV)∫(ξ − ξc)ⁿ ξ dξ (his Eq. 16 with the
 *     cylindrical Jacobian) against the face's powers; across the axis the
 *     mirrored ghost cells take their signed coordinates, consistent with the
 *     mirror (even quantities keep, odd change sign). The geometrical source
 *     p/R as a volume average by Simpson's rule, (p₋ + 4p_c + p₊)/(6Rᵢ) (his
 *     Eqs. 65 and 67, m = 1), from the cell's own face values and its centre.
 * (b) OUR CONSTRUCTION ON IT, derived here: fifth-order WENO-Z in r keeps its
 *     three three-cell candidates and its Z weights, each candidate's face
 *     value taken with his weights for its stencil, and the linear weights
 *     dₖ(i) found per column so that the three reproduce his five-cell
 *     weights exactly — computed now for the first thousand columns: exact
 *     (residual ≤ 10⁻¹²), all positive, 0.10/0.63/0.27 at the axis tending to
 *     0.1/0.6/0.3; the smoothness indicators stay Jiang and Shu's. The moments
 *     in coordinates centred on the cell, so large i loses no precision. The
 *     centre value for Simpson's rule from his weights for the centred
 *     three-cell stencil, held between the three averages (a continuous
 *     clamp, idle where the flow is smooth). The vertical direction is
 *     Cartesian and unchanged; at rest the source still balances the
 *     pressure's flux exactly (p uniform: (1 + 4 + 1)p/(6Rᵢ) = p/Rᵢ).
 * (c) ON rule 1277's limiter only (the old scheme stays as it was, on
 *     record); the CPU reference first, V1 run again with its criteria as
 *     fixed and the planar case beside it; then the GPU and G0 to G2. The
 *     second question of rule 1296 (primitive variables from conserved
 *     averages, his §4.1) is not taken up here.
 */
export const RULE_1297_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1298. V1 ON RULE 1297: NEAR, NOT YET — THE CENTRE'S CLAMP CUTS THE
 * AXIS; THE SOURCE FROM A PARABOLA THROUGH THE FACES INSTEAD (27 September
 * 2026, 10:34). Written before the code of (c).
 *
 * (a) V1 on rule 1297's scheme: relative L1 7.2·10⁻³, 3.6·10⁻⁴, 2.4·10⁻⁵,
 *     3.9·10⁻⁶ (rule 1296's: to 2.2·10⁻⁴) — observed orders 4.31, 3.89,
 *     2.63; the last below 3, V1 still FAILS. The largest error sits in the
 *     cell at the corner of the axis and the ground and falls at order 2.1.
 * (b) THE CAUSE: on the axis every smooth radial profile has zero slope — an
 *     extremum — and the value at the first cell's centre lies outside the
 *     three r-weighted averages (for f = f₀ + ar², the point value at Δ/2 is
 *     f₀ + aΔ²/4, the cell's r-weighted average f₀ + aΔ²/2): rule 1297 (b)'s
 *     clamp moved it by O(Δ²) at every step. A caution of this project's, not
 *     of the source.
 * (c) THE MEND: no separate centre value. In each cell the parabola through
 *     its two radial face values (the WENO's, after rule 1280's blend) that
 *     keeps the cell's r-weighted average; its plain integral over the cell
 *     gives the volume average of p/R exactly: with ξ in [−½, ½], κ = Δ/Rᵢ,
 *     c₁ = f₊ − f₋, c₂ = 6[(f₋ + f₊)/2 − ⟨p⟩ + κc₁/12], c₀ = (f₋ + f₊)/2 −
 *     c₂/4, ⟨p/R⟩ = (c₀ + c₂/12)/Rᵢ. At rest the faces equal the average and
 *     the source is p/Rᵢ, balancing the pressure's flux exactly as before;
 *     near a shock it is as bounded as the faces. V1 run again, its criteria
 *     as fixed.
 */
export const RULE_1298_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1299. V1 ON RULE 1298: THE AXIS MENDED; THE TEST'S OWN FLOOR REACHED
 * BY ITS FINEST GRID; THE ORDER MEASURED BY SELF-CONVERGENCE (27 September
 * 2026, 10:38). The measure written before its run.
 *
 * (a) V1 on rule 1298's scheme: relative L1 5.3·10⁻³, 2.2·10⁻⁴, 1.1·10⁻⁵,
 *     2.75·10⁻⁶ — orders 4.56, 4.33, 2.02; the largest error 8.2·10⁻⁴,
 *     3.8·10⁻⁵, 2.1·10⁻⁶, 2.0·10⁻⁷ of the amplitude — orders 4.4, 4.2, 3.4:
 *     the corner of rule 1298 is gone. As fixed, V1 FAILS on the last pair.
 * (b) THE FLOOR, a diagnostic: the same test at 10⁻⁸ and 10⁻⁴ p₀ (8, 16 and
 *     32 cells per width). At 10⁻⁸ the errors stall near 2·10⁻⁴ — an
 *     absolute noise of about 10⁻⁷ Pa, the double precision's rounding in
 *     pressures of 10⁵ Pa, relatively a hundred times larger than at 10⁻⁶;
 *     at 10⁻⁴ they stall near 3·10⁻⁵ — the nonlinearity of the equations
 *     against a linear exact solution, a hundred times larger than at 10⁻⁶.
 *     At 10⁻⁶ the two together make a floor of about 2·10⁻⁶, where the
 *     finest grid stopped: the test, not the scheme. Rule 1295 (c)'s V1 chose
 *     an amplitude and a finest grid that its own floor overlaps — a flaw of
 *     the test, found and declared.
 * (c) THE MEASURE NOW, standard where an exact solution carries a floor: the
 *     order by self-convergence — the same nonlinear pulse at 10⁻⁴ p₀ on the
 *     pulse's width over 8, 16, 32 and 64 cells, the L1 norm of the
 *     differences between successive grids' cell averages (brought to the
 *     coarser grid), the observed order at least 3 between the two finest
 *     differences — and, against the exact solution, the finest grid's
 *     relative L1 error at most 1 % (rule 1295's). Nothing in the scheme
 *     changes.
 */
export const RULE_1299_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1300. V1 BY SELF-CONVERGENCE: PASSES (27 September 2026, 10:46;
 * `verifyBlastV1Self.json`, `scripts/verify-blast-v1-self.ts`).
 *
 * (a) The pulse at 10⁻⁴ p₀ on 8, 16, 32 and 64 cells per width: the relative
 *     L1 differences between successive grids 2.14·10⁻⁴, 9.46·10⁻⁶,
 *     6.87·10⁻⁷ — observed orders 4.50 and 3.78, at least 3 required; the
 *     finest's error against the exact linear solution 2.56·10⁻⁵, at most
 *     10⁻² required. RULE 1299 (c) PASSES: the axisymmetric scheme of rules
 *     1297–1298 is of fourth order and more on a smooth solution.
 * (b) Rule 1299 (b)'s reading holds: against the exact linear solution the
 *     error stops at 2.61·10⁻⁵ and 2.56·10⁻⁵ on the two finest grids while
 *     the differences between grids go on falling by 14 — the equations'
 *     own nonlinearity, which the scheme resolves and the linear solution
 *     lacks.
 * (c) V1 as rule 1295 (c) fixed it stays FAILED on record (rule 1299 (a));
 *     what passes is the measure rule 1299 (c) wrote before its run.
 */
export const RULE_1300_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1301. V2'S MEASURE, WHAT RULE 1295 (c) LEFT OPEN (27 September 2026,
 * 10:48). Written before the code.
 *
 * (a) THE PROBLEM. Sod's (1978) tube as Toro sets it: ρ = 1, p = 1 below
 *     z = ½, ρ = 0.125, p = 0.1 above, at rest, γ = 1.4; uniform in r, no
 *     gravity, the background uniformAtmosphere(1, 1); the domain z ∈ [0, 1]
 *     (the ground's wall below, the open top above), 4 cells in r; read at
 *     t = 0.2, when the rarefaction's head is at 0.263 and the shock at
 *     0.850 — neither boundary reached. On rule 1277's limiter with rules
 *     1297–1298, CFL as the solver's own.
 * (b) THE EXACT SOLUTION: Toro's (Riemann Solvers, ch. 4) — the star
 *     pressure by Newton's iteration on his pressure functions to 10⁻¹⁴, the
 *     solution sampled in x/t — written in the project from the book's
 *     equations. Its cell averages exact: each cell split at the waves'
 *     positions inside it, each piece by eight-point Gauss–Legendre (exact on
 *     the constant states, far below the errors measured in the fan).
 * (c) THE ERROR: the L1 error of density along z (the mean over the four
 *     columns, which the problem makes equal), divided by nothing (Sod's
 *     densities are of order 1), on 100, 200, 400 and 800 cells in z; the
 *     observed order between the two finest at least 0.8 (rule 1295 (c)).
 * (d) THE SHOCK'S POSITION on the finest grid: the highest z at which the
 *     density, linearly interpolated between cell centres, crosses the mean
 *     of the exact post-shock and pre-shock densities; within one cell (1/800)
 *     of the exact shock (rule 1295 (c)).
 * (e) The columns' spread — the largest difference between the four columns'
 *     densities — reported: a planar problem must stay planar in the
 *     axisymmetric scheme (rule 1298's source balances the pressure's flux
 *     exactly where p is uniform in r).
 */
export const RULE_1301_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1302. V2: PASSES (27 September 2026, 10:48; `verifyBlastV2.json`,
 * `scripts/verify-blast-v2.ts`).
 *
 * (a) Toro's exact solution as written reproduces his table: p* = 0.303130,
 *     u* = 0.927453, the shock at 0.85043 at t = 0.2.
 * (b) The L1 error of density on 100, 200, 400 and 800 cells: 3.15·10⁻³,
 *     1.76·10⁻³, 8.43·10⁻⁴, 3.94·10⁻⁴ — observed orders 0.84, 1.06, 1.10,
 *     at least 0.8 required. The finest's shock at 0.85058, 0.12 of a cell
 *     from the exact, within one required. V2 PASSES.
 * (c) The four columns agree to 7.9·10⁻¹² at most (rule 1301 (e)): the
 *     axisymmetric scheme keeps a planar flow planar.
 */
export const RULE_1302_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1303. V4'S MEASURE, WHAT RULE 1295 (c) LEFT OPEN (27 September 2026,
 * 10:51). Written before the code.
 *
 * (a) THE ATMOSPHERE: isothermal, ρ₀ = 1.225 kg/m³, p₀ = 101 325 Pa, g =
 *     9.80665 m/s² (H = 8 434.5 m, γH = 11 808 m, c = 340.29 m/s).
 * (b) THE START: P(r, 0) = A·exp(−((r − R₀)/W)²), A = 10⁻⁵ p₀, R₀ = 10 km,
 *     W = 2 km; p' = P·E(z), E = e^{−z/(γH)}, ρ' = p'/c², at rest — as cell
 *     averages (r-weighted four-point Gauss in r, E averaged exactly in z)
 *     added to the solver's own rest state. Read at T = 30 s, just after
 *     the inward half has reached the axis (R₀/c = 29.4 s): the axis in play.
 * (c) THE DOMAIN: r ≤ 30 km, z ≤ 40 km — the top 14.7 km above 3H, more
 *     than cT = 10.2 km, and the outgoing ring's 4W edge at 28.2 km. Grids of
 *     500, 250, 125 and 62.5 m (the width over 4 to 32 cells). On rule
 *     1277's limiter with rules 1297–1298.
 * (d) THE EXACT P(r, T): the Hankel transform Φ(k) = ∫ r P(r, 0) J₀(kr) dr,
 *     then P(r, T) = ∫ k Φ(k) J₀(kr) cos(ckT) dk, composite Gauss–Legendre
 *     on both; J₀ by the trapezoid rule on its integral (1/π)∫₀^π cos(x sin θ)
 *     dθ, which converges geometrically. Checked in the script before use:
 *     at T = 0 it gives back the start within 10⁻⁶ A, and doubling every
 *     quadrature moves P(r, T) by less than 10⁻⁷ A.
 * (e) THE MEASURES, on the cells with their top at or below 3H:
 *     (1) VERTICAL VELOCITY: the largest |w| at most 1 % of the largest |u|,
 *         on the finest grid;
 *     (2) PROFILE: in the columns whose ground |p'| is at least half the
 *         largest, |(p'ᵢⱼ/p'ᵢ₀)/(Ēⱼ/Ē₀) − 1| at most 1 % (Ē the exact cell
 *         average of E), on the finest grid;
 *     (3) THE GROUND: Pᵢ = p'ᵢ₀/Ē₀ against the r-weighted cell average of the
 *         exact P(r, T), the relative L1 error (weighted by the cell's
 *         volume) at most 1 % on the finest grid, and the observed order at
 *         least 2 between the two finest.
 *     All three must hold. The u profile against e^{(γ−1)z/(γH)} is reported
 *     beside them, not judged.
 */
export const RULE_1303_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1304. V4: FAILED AS FIXED — FIRST ORDER IN THE GROUND'S ROW; THE GPU
 * ON RULES 1297–1298 PASSES G0 TO G2 (27 September 2026, 11:15;
 * `verifyBlastV4.json`, `blast2dG1.json`).
 *
 * (a) V4 (`scripts/verify-blast-v4.ts`). The exact solution passes its own
 *     checks (J₀ within 1.1·10⁻¹⁵, the start given back within 1.4·10⁻¹¹ A,
 *     doubled quadratures moving it by 7·10⁻¹⁵ A). On 500, 250, 125 and
 *     62.5 m: |w|/|u| 3.99·10⁻³ to 4.41·10⁻⁴, the profile 3.59·10⁻³ to
 *     3.47·10⁻⁴ — both within 1 %; the ground's P 6.75·10⁻³, 1.10·10⁻³,
 *     5.49·10⁻⁴, 2.75·10⁻⁴, within 1 %, but observed orders 2.61, 1.01,
 *     1.00 against at least 2. V4 FAILS.
 * (b) WHERE (a diagnostic, `scripts/tmp/v4-where.ts`, 250 and 125 m): the
 *     error of p' row by row falls from 1.1·10⁻⁵ to 7.4·10⁻⁷ of the ground's
 *     scale everywhere from the third row up — fourth order — but in the
 *     ground's row only from 5.1·10⁻⁵ to 2.5·10⁻⁵, first order (the second
 *     row by 2.9); along the ground the error is even in r, not the axis's;
 *     the largest |w| sits in the corner cell and halves with the cell.
 * (c) THE HYPOTHESIS: the ground's ghosts mirror ρ/α, u and p/β evenly.
 *     Without gravity an acoustic field has ∂p/∂z = 0 at the wall and the
 *     mirror is exact (V1); with gravity the wall imposes ∂p/∂z = −ρg, and
 *     in Berberich's variable q = p/(p₀β) the slope at the ground is
 *     (q − ρ/(ρ₀α))/H — (γ − 1)p'/(γp₀H) for Lamb's wave, not zero. The even
 *     mirror puts a kink there; a kink costs O(Δx) in the cells beside it,
 *     the first row, where every ground reading of this solver is made.
 * (d) THE TEST OF IT, one change, a diagnostic before any adoption: an
 *     option of the solver, off unless asked (nothing else changes), in
 *     which the ground's ghosts of q take the slope the vertical momentum
 *     equation imposes — q(ghost at −z) = q(z) − 2sz, s = (q₀ − r₀)/H from
 *     the first row's own q and r = ρ/(ρ₀α) — ρ/α and u still mirrored, v
 *     still odd. At rest q = r and s = 0; without gravity 1/H = 0: in both
 *     the ghosts are the mirror's to the bit. If V4's ground row then
 *     converges at second order or better on 250, 125 and 62.5 m, the
 *     hypothesis holds and the change is proposed for adoption under its
 *     own rule; if not, it is set aside and the next hypothesis (the kinks of
 *     ρ/α and u) is tested alone.
 * (e) THE GPU on rules 1297–1298 (the radial coefficients the reference's own
 *     in single precision, the parabola's mean kept per cell by a kernel of
 *     its own): G0 exactly at rest; G2 mass to 1.8·10⁻¹¹ and 8.2·10⁻¹²,
 *     energy to 3.7·10⁻⁹ and 1.6·10⁻⁷; G1 all eight cases in the
 *     reference's own number of steps, every reach within 0.002 %, every
 *     peak within 0.048 %. ALL PASS.
 */
export const RULE_1304_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1305. RULE 1304 (d)'S TEST: THE FIRST ORDER IS GONE; THE LAST PAIR
 * MEETS V4'S OWN FLOOR (27 September 2026, 11:31; `scripts/tmp/v4-momentum.ts`).
 * Written before the runs it names.
 *
 * (a) V4 with the ground's ghosts of q sloped by the momentum equation, all
 *     else as fixed: the ground's P 6.16·10⁻³, 2.53·10⁻⁴, 1.62·10⁻⁵,
 *     1.02·10⁻⁵ — orders 4.61, 3.97, 0.67 (the mirror: 2.61, 1.01, 1.00);
 *     |w|/|u| 4.7·10⁻⁵ to 3.1·10⁻⁶ (the mirror: 4.4·10⁻⁴ on the finest); the
 *     profile 1.05·10⁻⁴, then 6.4, 5.3 and 5.0·10⁻⁵. The hypothesis of rule
 *     1304 (c) holds where the grids are coarse enough to see it.
 * (b) THE LAST PAIR: the ground's error stops at 1.0·10⁻⁵ and the profile's
 *     at 5·10⁻⁵ on every grid from 250 m — the amplitude's own size: at
 *     A = 10⁻⁵ p₀, p'/p̄ reaches 2.4·10⁻⁵ at 3H, and the equations'
 *     nonlinearity departs from the linear exact solution by as much. Rule
 *     1299's flaw again, in V4's amplitude.
 * (c) THE DIAGNOSTIC THAT DECIDES: the same on 125 and 62.5 m at A = 10⁻⁶ p₀.
 *     If the floor is the nonlinearity, the relative errors fall by about
 *     ten — the ground's on 62.5 m to at most 3·10⁻⁶ and the profile's below
 *     10⁻⁵; if they do not, the floor is something else and is diagnosed.
 * (d) IF (c) CONFIRMS IT, V4's order is measured as rule 1299 (c) measured
 *     V1's: by self-convergence at V4's own amplitude, 10⁻⁵ p₀, on the four
 *     grids — the relative L1 difference (weighted by the cells' volume) of
 *     the ground's P between successive grids, the finer brought to the
 *     coarser by volume-weighted pairs of rings — the observed order at least
 *     2 between the two finest differences; the other criteria of rule 1303
 *     (e) as fixed, the finest against the exact solution within 1 %. With
 *     the momentum's slope; the mirror's outcome stays FAILED on record.
 * (e) Adoption of the slope as the solver's ground condition, and its GPU
 *     port with G0 to G2, under the rule that records (c) and (d).
 */
export const RULE_1305_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1306. V4 PASSES WITH THE MOMENTUM'S SLOPE AT THE GROUND, WHICH THE
 * SOLVER ADOPTS (27 September 2026, 11:56; `verifyBlastV4Self.json`,
 * `scripts/verify-blast-v4-self.ts`). The adoption written before its code.
 *
 * (a) Rule 1305 (c): at A = 10⁻⁶ p₀ the ground's error on 62.5 m is
 *     1.64·10⁻⁶ (at most 3·10⁻⁶ required) and the profile's 5.9·10⁻⁶ (below
 *     10⁻⁵): the floor of rule 1305 (b) was the amplitude's nonlinearity.
 * (b) Rule 1305 (d): the ground's P between successive grids 5.93·10⁻³,
 *     2.40·10⁻⁴, 1.10·10⁻⁵ — observed orders 4.63 and 4.45, at least 2
 *     required; the finest against the exact solution 1.0·10⁻⁵, |w|/|u|
 *     3.1·10⁻⁶, the profile 5.0·10⁻⁵, each within 1 %. V4 PASSES.
 * (c) ADOPTED: the solver's ground condition is the momentum's slope
 *     (`groundSlope: 'momentum'` the default; 'mirror' kept, so the runs made
 *     before can be made again). Without gravity and at rest it is the
 *     mirror to the bit; nothing measured in uniform air moves.
 * (d) THE GPU, the same: the slope's factor 1/H in the Params' last word (0
 *     for the mirror), the ghosts of the deviation of p/p̄ as the reference
 *     sets them (the deviations' difference is q − r, the 1s cancel); then
 *     G0, G1 and G2 with their criteria as fixed, G1's CPU runs made again
 *     under the adopted code.
 * (e) G1's new CPU runs beside its old ones answer, as a diagnostic, how much
 *     the ground's condition moved the stratified cases (T4's 5 Mt and T3's
 *     two heights on their coarse grids) — whether it bears on the lift near
 *     the ground of rules 1292–1293.
 */
export const RULE_1306_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1307. THE ADOPTION'S CHECKS PASS; WHAT IT MOVED (27 September 2026,
 * 12:19; `blast2dG1.json`).
 *
 * (a) The GPU with the slope (rule 1306 (d)): G0 exactly at rest; G2 mass to
 *     1.8·10⁻¹¹ and 9.1·10⁻¹², energy to 3.7·10⁻⁹ and 1.6·10⁻⁷; G1 all
 *     eight cases in the reference's own number of steps, every reach within
 *     0.002 %, every peak within 0.020 %. ALL PASS.
 * (b) Rule 1306 (e), a diagnostic — the same CPU runs under the mirror (made
 *     this morning) and under the slope: T4's 5 Mt, reaches within 0.15 %;
 *     T3 high (30 km), the largest peak 0.98 % higher, the 4 psi reach
 *     1.7 %; T3 low (3 km), the largest peak 4.2 % higher and the 2 psi reach
 *     4.2 % farther (a flat stretch of its curve). The ground's condition
 *     moves the stratified cases by a few per cent, upwards: it does not
 *     account for the lift near the ground of rules 1292–1293 (2 to 4.6
 *     times Cart3D), which stays an open question.
 */
export const RULE_1307_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1308. STEP 2 PREPARED WHILE V3 WAITS: THE EQUATION OF STATE OF REAL
 * AIR, AS A MODULE OF ITS OWN (27 September 2026, 12:20). Written before the
 * transcription and the code. Nothing of it enters the solver before V3 is
 * closed (rule 1295 (a)).
 *
 * (a) THE SOURCE: Srinivasan, Tannehill & Weilmuenster (1987), NASA RP-1181
 *     (sha-256 4ebf31de…), the fits p(e, ρ), a(e, ρ) and T(e, ρ) of
 *     equilibrium air — valid to 25 000 K and from 10⁻⁷ to 10³ times the
 *     sea-level density, their largest errors against NASA's RGAS 3.9, 4.5
 *     and 4.4 % as the report states them — from its equations and its
 *     tables of coefficients, never from its FORTRAN listing (TGAS). Above
 *     25 000 K (the fireball's core) Gilmore (1967, DASA 1917-1) under a rule
 *     of its own.
 * (b) THE TRANSCRIPTION, twice and blind: two independent transcriptions of
 *     the functional forms, the reference values, the regions and every
 *     coefficient, each from the page images, neither seeing the other; a
 *     script compares them entry by entry, and every disagreement is settled
 *     by reading the page again. The agreed data are a JSON file of the
 *     project with the pages they come from.
 * (c) THE MODULE: pure functions, `src/physics/solvers/blast2d/airEos.ts`,
 *     outside the solver.
 * (d) ITS VERIFICATION, criteria fixed now:
 *     (1) the report's own printed checks — the values it tabulates at its
 *         junctures (its Tables 12–14 and alike) — reproduced within the
 *         last printed digit;
 *     (2) against Hilsenrath & Klein (1965, AEDC-TR-65-58), independent of
 *         RGAS: at T = 2 000, 4 000, 6 000, 8 000, 10 000, 12 000 and
 *         14 000 K and log₁₀(ρ/ρ₀) = −5, −4, −3, −2, −1, 0, 1 (49 points,
 *         read from their tables, e from E/RT), the fit's p(e, ρ) within
 *         5 % everywhere (the report's 3.9 % against RGAS and the two tables'
 *         own difference) and within 2 % in the median;
 *     (3) the ideal-gas limit: at sea level and 300 K, p/(ρe) = 0.4 within
 *         0.5 %;
 *     (4) continuity: across every boundary between the fit's regions, the
 *         jump in p and in a below 1 % (reported entry by entry);
 *     (5) consistency: a² against ∂p/∂ρ|ₑ + (p/ρ²)∂p/∂e|_ρ from the p fit,
 *         within 5 % where T ≤ 25 000 K; which of the two the solver's
 *         fluxes take is decided under the rule that brings the module in.
 */
export const RULE_1308_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1309. THE PEAK A CELL RECORDS OVERSHOOTS BEHIND A MOVING SHOCK: THE
 * COMPONENTWISE RECONSTRUCTION; V5 TO MEASURE IT, THE CURE TO TRY (27
 * September 2026, 12:25). A diagnostic's outcome, then a test and a change
 * written before their code.
 *
 * (a) THE DIAGNOSIS (a sub-task, `scripts/tmp/diag1d-*.ts`): in the 1D
 *     spherical diagnostic the peak overpressure beyond λ ≈ 1.9 is jagged by
 *     ±2 %. Cause, shown alone: the fifth-order WENO-Z reconstruction of the
 *     primitive variables component by component leaves behind a moving
 *     shock a pressure overshoot that alternates between neighbouring cells;
 *     the maximum in time each cell records exceeds the post-shock pressure.
 *     On a planar shock with an exact uniform solution the records exceed it
 *     by 0.6–3.1 % at M = 1.045, 0.9–4.3 % at 1.125, 2.2–7.1 % at 1.3; with a
 *     characteristic reconstruction (the fields projected at each face) by
 *     0.01–0.03 %. Excluded one by one: a second wave, the grid's growth, the
 *     first-order fall-back (5–11 faces, all at r = 0), the time step (CFL
 *     0.2: 0.009 % on the mean).
 * (b) THE TWO-DIMENSIONAL SOLVER reconstructs w = (ρ/α, u, v, p/β) the same
 *     way: the ground's recorded peaks of a ground burst in uniform air on
 *     5 m cells alternate cell to cell from λ ≈ 1.3, by 8 % at λ = 1.5 and
 *     3.5 % at 2.5 (MOOD and the limiter alike; van Leer's scheme before rule
 *     1262 below 0.02 %; weak at 10 m, absent at 20 m). Every ground peak read
 *     from this solver since rule 1262 carries it; the tests' outcomes since
 *     then (T1–T4) are to be read with it in mind.
 * (c) THE HOT SPHERE IS NOT A POINT SOURCE (same sub-task): a second pulse
 *     from the sphere reaches the shock at a range set by R/ε, the same on 1,
 *     0.5 and 0.25 m cells — the source's physics, not the grid's. So V3
 *     (rule 1295 (c)) is set up as Brode set his: from the point source's
 *     similarity solution, under a rule of its own.
 * (d) V5 — THE PEAK RECORD, criteria fixed now. A planar shock along z in
 *     uniform air (ρ₀ = 1.225, p₀ = 101 325, no gravity, 4 cells in r), the
 *     shocked air above moving down, the shock moving down into air at rest,
 *     at M = 1.02, 1.05, 1.125, 1.3, 2 and 5 on 400 cells; each cell's
 *     largest pressure in time, over the cells the shock crosses from 20
 *     cells below its start to 20 cells above the ground: the largest
 *     excess over the exact post-shock pressure at most 0.5 % of the exact
 *     overpressure, at every Mach. And the radial direction, where the
 *     product reads: T2's 1 kt ground burst in uniform air on 5 m cells (a
 *     45 m sphere), the ground's recorded peaks from λ = 1 to 2.8 (ε for
 *     2 kt), the largest |second difference| between neighbours at most
 *     0.5 % of the local peak (the smooth decay's own second difference is
 *     about 10⁻³ of it).
 * (e) THE CURE to try if V5 fails as the diagnosis says it will: the
 *     reconstruction in characteristic fields — at each face, w's five
 *     values projected on the left eigenvectors of the Euler equations
 *     (their Jacobian in w, at the face's arithmetic mean of the two cells,
 *     α and β at the face), reconstructed each by the same WENO-Z (with rule
 *     1297's radial weights along r), and projected back. At rest the fields
 *     are constant and the projection linear: the atmosphere stays at rest.
 *     Then V1, V2, V4 (self-convergence) and V5 again with their criteria as
 *     fixed, and the GPU with G0–G2.
 */
export const RULE_1309_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1310. ERRATA FROM AN INDEPENDENT REVIEW OF RULES 1297–1308 (27
 * September 2026, 12:50; the review's proofs in `scripts/tmp/review-*.ts`).
 * What was claimed wrongly is corrected here; nothing measured is changed.
 *
 * (a) IN A STRATIFIED ATMOSPHERE THE SCHEME IS OF SECOND ORDER in the
 *     departures from its state at rest. The lift −g(2H/Δ)sinh(Δ/2H)
 *     overstates g on the density's departures by Δ²/(24H²), and the
 *     vertical flux of the departures takes ⟨p⟩/β(z_c) for the mean of p/β.
 *     Proof: the steady Lamb state with k = 0 (p = p̄ + A·E(z), exact in the
 *     nonlinear equations) drifts at the ground by 8.2·10⁻⁵ … 1.29·10⁻⁶ of A
 *     on 500 … 62.5 m in 30 s, order 2.00 on every pair. So: rule 1304 (b)'s
 *     «fourth order» from the third row up, and rule 1306 (b)'s orders 4.63
 *     and 4.45, are pre-asymptotic; V4 still passes (its criterion is at
 *     least 2); rule 1306 (a)'s «the floor was the amplitude's
 *     nonlinearity» is half wrong — of the 1.64·10⁻⁶ read at A = 10⁻⁶ p₀ on
 *     62.5 m, about 1.3·10⁻⁶ is this error. At a blast's cells (5 m) it is
 *     of order 10⁻⁸: negligible there, a limit of the verification.
 * (b) AT THE AXIS the Jiang–Shu smoothness indicators, taken on r-weighted
 *     averages, misjudge an odd variable (u = r gives Z weights 0.065,
 *     0.523, 0.412 in cell 0 instead of the linear 0.1, 0.6, 0.3): the
 *     faces' error there is of third order, not fifth, and the mass
 *     residual in cells 0–2 of second. V1's volume-weighted L1 hides it; a
 *     reading in the axis's column (the point below the burst) does not.
 *     Rule 1309's characteristic reconstruction inherits it.
 * (c) TEXT: rule 1297 (b)'s weights «0.10/0.63/0.27 at the axis» are cell
 *     1's; the axis cell's are exactly 0.1/0.6/0.3.
 * (d) DOUBTS, recorded: rule 1298's parabola misses a cubic's −a₃κ/120,
 *     third order in the axis's cells; the ground's slope (rule 1306) read
 *     half a cell up leaves a first-order error local to the first row
 *     (global order 2; the slope extrapolated to the wall brings that row
 *     to the interior's level); the test of rule 1297's weights cannot see a
 *     scheme exact only to degree 3 and exercises neither the WENO nor the
 *     mirrored ghosts; rule 1294 (b) read Brode at λ = 2.89, outside his Eq.
 *     17's range (λ < 2.8); the 1D diagnostic is of second order in its
 *     geometry.
 * (e) QUEUED, each under a rule of its own, after rule 1309's cure is on the
 *     GPU: the axis's indicators (b); the slope extrapolated to the wall;
 *     a stronger test of the radial reconstruction; then (a), a high-order
 *     treatment of gravity on the departures.
 */
export const RULE_1310_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1311. V5 ON RULE 1309'S CURE: THE PLANE PASSES, THE GROUND BURST
 * FAILS AS FIXED; WHAT IS LEFT (27 September 2026, 13:12;
 * `verifyBlastV5.json`, the scheme before the cure in
 * `verifyBlastV5.componentwise.json`).
 *
 * (a) THE CURE ON CPU AND GPU (charR and charZ, the same projection on the
 *     departures from the background; G0 exactly at rest, G2 mass to
 *     2.0·10⁻¹¹ and 2.4·10⁻¹¹, energy to 4.6·10⁻⁹ and 1.2·10⁻⁷). V1 again by
 *     self-convergence: orders 4.52 and 3.78 — passes. V2 again: 1.10 on the
 *     last pair, the shock 0.11 cells off — passes.
 * (b) V5, planar: the largest excess of a cell's record over the exact
 *     post-shock pressure 0.004, 0.013, 0.031, 0.049, 0.008 and 0.007 % of
 *     the overpressure at M = 1.02 … 5 (before: up to 7.2 %) — within 0.5 %,
 *     PASSES. V5, radial (GPU, 5 m): the largest |second difference| of the
 *     ground's peaks 1.22 % of the peak at λ = 1.02 (before: 18.2 %) — beyond
 *     0.5 %, FAILS AS FIXED.
 * (c) WHAT IS LEFT, diagnosed on the CPU one hypothesis at a time: an
 *     odd–even alternation of the record where the peak sits at the front of
 *     a DECAYING shock. A shock moving outward along r: 0.13 % (M 1.05) and
 *     0.65 % (M 1.3) of the overpressure, the sign changing at every cell;
 *     the same shock moving inward, its post-shock pressure growing behind
 *     it: 0.003 %, no alternation; a planar shock followed by a rarefaction
 *     (a 40-cell slab): 0.74 %, the same slab thick enough not to decay:
 *     0.10 %. Neither rule 1298's source nor rule 1297's weights: without
 *     either, 0.651 % unchanged. Its size does not follow the cell: 0.21,
 *     1.22 and 1.06 % on 10, 5 and 2.5 m — its mechanism is open.
 * (d) UNTIL IT IS UNDERSTOOD: every ground peak read from this solver
 *     carries a numerical uncertainty of half the local |second
 *     difference| of its record (about ±0.6 % at λ = 1, ±0.1 % at λ = 2.8 on
 *     5 m for 1 kt), stated beside it. The mechanism goes to the laboratory's
 *     numerics (Eulero) as an open problem.
 */
export const RULE_1311_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1312. RP-1181 TRANSCRIBED TWICE AND BLIND: THE DATA, AND WHAT THE
 * PRINTED REPORT GETS WRONG (27 September 2026, 13:13). Written before the
 * module's code (rule 1308 (b), (c)).
 *
 * (a) THE TRANSCRIPTIONS: two, independent, from the page images — the
 *     functional forms (Eqs. 22–28, A1–A6), the density bands (−7 ≤ Y ≤ −4.5,
 *     −4.5 < Y ≤ −0.5, −0.5 < Y ≤ 3), the energy columns, the signs before
 *     the Grabau exponential, 624 coefficients (Tables A1–A6) and the
 *     juncture tables 10–12: all 969 entries AGREE, character for character.
 * (b) TWO COEFFICIENTS MISPRINTED IN THE REPORT, found by both transcribers
 *     alone, the report's own Table 12 the arbiter: Table A5, 0.25 < Z ≤ 0.95,
 *     b4 printed −3.27402E-01 (T at the juncture 946 K against the 481 K
 *     printed; with −3.27402E-02, 481 K); Table A5, 1.40 < Z ≤ 2.00, b18
 *     printed 4.5413E-01, a digit short of its column's (7 524 K against
 *     10 364 K; with 4.45413E-01, 10 373 K). The corrected values are used;
 *     the printed ones stay in the data file beside them, with the page.
 * (c) THE APPENDIX'S FORMULAS READ FOR WHAT THEY STATE: (A1)–(A2), printed
 *     as f(Y_hi) + [f(Y_hi) − f(Y_lo)](Y − Y_lo)/ΔY, are discontinuous at
 *     their own ends; the text calls them the interpolation that keeps the
 *     fits continuous across the density boundaries, so the module uses the
 *     linear interpolation f(Y_lo) + [f(Y_hi) − f(Y_lo)](Y − Y_lo)/ΔY — rule
 *     1308 (d)(4) checks the choice. (A3)'s ∂γ is ∂Y; (A6)'s 2a₁₇Y² is a₁₇Y²
 *     (the derivative of a₁₇Y²Z): the module's derivatives are the exact
 *     ones, checked against finite differences of γ̃ to 10⁻⁶.
 * (d) THE REFERENCE VALUES, not printed as numbers: the subscript o is 1 atm
 *     and 273.15 K, R = 287.06 J/(kg K), so p₀ = 101 325 N/m², ρ₀ = p₀/(RT₀)
 *     = 1.29224 kg/m³ and e/RT₀ with RT₀ = 78 410.4 m²/s².
 * (e) THE JUNCTURE CHECKS of rule 1308 (d)(1) stand as fixed; the entries
 *     the transcribers could not reproduce (a at E, 10⁻⁷, upper: 4 776
 *     against 4 715; a at E, 10⁻⁵, lower: 5 267 against 5 259; T at C, 10²,
 *     upper: 6 946 against 6 960) are reported as they come, not corrected;
 *     the E entry printed in the 10⁻⁴ row, where that band has no fifth
 *     juncture and its value repeats the 10⁻³ row's A, is left out as
 *     spurious and listed.
 */
export const RULE_1312_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1313. V4 ON RULE 1309'S CURE, AND THE AIR MODULE'S VERIFICATION (27
 * September 2026, 13:18; `verifyBlastV4Self.json`, `verifyAirEos.json`).
 *
 * (a) V4 by self-convergence on the cure: differences 6.11·10⁻³, 2.52·10⁻⁴,
 *     1.12·10⁻⁵, orders 4.60 and 4.49 (pre-asymptotic, rule 1310 (a)), the
 *     other criteria within 1 % — PASSES. With rule 1311 (a): V1, V2 and V4
 *     hold on the characteristic reconstruction; V5 as rule 1311 states it.
 * (b) THE AIR MODULE (`airEos.ts`, `scripts/verify-air-eos.ts`), rule 1308
 *     (d) as fixed: (1) the report's juncture tables — 223 of 252 entries
 *     within the last printed digit; the 29 others off by 1 to 14 of it, at
 *     most 0.2 % (T at C, 10², upper: 6 946 against 6 960), the report's own
 *     rounding of its coefficients or misprints the transcriptions cannot
 *     tell apart — FAILS AS FIXED, by that much; 2 spurious entries left
 *     out. (3) p/(ρe) = 0.39880 at sea level and 300 K, 0.30 % from 0.4 —
 *     PASSES. (4) The fits jump across their energy columns' boundaries by
 *     up to 2.31 % in p and 2.90 % in a, 31 junctures beyond 1 % — FAILS AS
 *     FIXED: the report's discontinuities, its Tables 10–11 print them too.
 *     (5) a from Eq. (27) against ∂p/∂ρ|ₑ + (p/ρ²)∂p/∂e|_ρ from the p fit
 *     (the finite differences kept within one band and one column): equal to
 *     rounding at 2 266 points — PASSES, by construction, since Eq. (27) is
 *     that derivative of p = ρe(γ̃ − 1); it confirms the module's exact
 *     derivatives (rule 1312 (c)). (2), against Hilsenrath & Klein, waits
 *     for its two transcriptions.
 * (c) FOR THE SOLVER: a 3 % jump of the sound speed and a 2 % jump of the
 *     pressure across a line in (e, ρ) are what a conservative scheme turns
 *     into small spurious waves; the rule that brings the module in decides
 *     how they are bridged.
 */
export const RULE_1313_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1314. V3 SET UP AS BRODE SET HIS: FROM THE POINT SOURCE'S SIMILARITY
 * SOLUTION (27 September 2026, 13:21). What rule 1295 (c) left open, written
 * before the code; its criteria unchanged.
 *
 * (a) WHY: the hot sphere is not a point source (rule 1309 (c)); Brode's
 *     Eq. 17 is the point source's, integrated from the Taylor–Sedov
 *     similarity solution at 2 000 atm (RM-1363). V3 starts from the same
 *     solution, for γ = 1.4.
 * (b) THE SIMILARITY SOLUTION, derived and integrated in the project
 *     (`src/physics/solvers/blast2d/sedov.ts`): u = Uφ(η), ρ = ρ₀ψ(η),
 *     p = ρ₀U²χ(η), η = r/R, R = ξ₀(Et²/ρ₀)^(1/5), U = dR/dt — the
 *     spherical equations of mass, momentum and entropy as three ordinary
 *     differential equations in η, integrated from the strong shock's
 *     conditions at η = 1 (φ = 2/(γ+1), ψ = (γ+1)/(γ−1), χ = 2/(γ+1)) inward
 *     by fourth-order Runge–Kutta, ξ₀ from the energy integral. Checked
 *     before use: ξ₀ = 1.033 for γ = 1.4 (Taylor 1950) to three decimals,
 *     the energy integral stable to 10⁻⁶ on halving the step.
 * (c) THE START: the mirrored free-air burst of twice the ground burst's
 *     1 kt, at the moment its shock is 40 m out (8 cells of the coarsest
 *     grid; overpressure about 200 atm, where the strong shock's neglect of
 *     p₀ is 0.5 %): ρ, the radial momentum and the energy p/(γ−1) + ½ρu² with
 *     p = p₀ + ρ₀U²χ, as cell averages (16 × 16 points in a cell the shock
 *     crosses, 4 × 4 Gauss elsewhere, r-weighted), air at rest outside. The
 *     energy put in above the air at rest is reported; the run goes on as
 *     T2's does, uniform air, the limiter and rules 1297–1309.
 * (d) THE READING: the ground's recorded peak at λ = 1.0, 1.2, …, 2.8 (ε for
 *     2 kt, 435.5 m), linearly between the rings' centres, on 5, 2.5 and
 *     1.25 m (GPU); rule 1256 (c)'s extrapolation; each within 3 % of Eq. 17
 *     (rule 1295 (c)). Where the three grids do not converge monotonically
 *     the finest's value is judged with the last change as its band — the
 *     band wholly within 3 %. Rule 1311 (d)'s uncertainty stated beside.
 */
export const RULE_1314_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1315. V3'S START COMPLETED: THE EMPTY CORE GIVEN A FLOOR (27
 * September 2026, 13:25). Written before any run of V3.
 *
 * (a) THE CORE: the similarity solution's density falls as η^(3/(γ−1)) =
 *     η^7.5 while its pressure stays finite (ξ₀ = 1.03278, the central
 *     pressure 0.3655 of the shock's; `sedov.ts` checked to 10⁻⁶ on halving
 *     its step, its mass integral 1.000001): inside η = 0.5 lie 0.04 % of
 *     the mass and 7.5 % of the energy, at densities down to 10⁻⁵ ρ₀ — a
 *     sound speed without bound, a time step without floor on an Eulerian
 *     grid (Brode's was Lagrangian).
 * (b) THE FLOOR: in the start, ρ ≥ 0.01 ρ₀ with the pressure unchanged and
 *     the velocity scaled to keep each point's kinetic energy — the
 *     internal energy, and so the work the core does as it expands (set by
 *     its pressure, not its density), unchanged; the mass grows by about
 *     0.1 % of the swept air's; the core's sound speed about 6.5 times the
 *     shock's speed.
 * (c) The energy put in above the air at rest is reported beside the
 *     readings, as rule 1314 (c) says.
 */
export const RULE_1315_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1316. TWO OF RULE 1310 (e)'S QUEUE, BEFORE T3 AND T4 RUN AGAIN (27
 * September 2026, 13:27). Written before the code, which waits for G1 on
 * rule 1309's cure to finish.
 *
 * (a) THE GROUND'S SLOPE AT THE WALL: s = (q − r)/H with q and r
 *     extrapolated to z = 0 from the first two rows (1.5f₀ − 0.5f₁, second
 *     order) instead of read at the first row's centre; at rest and without
 *     gravity still the mirror to the bit. Measured as rule 1310 (d) says:
 *     the steady Lamb state's drift in the ground's row against the rows
 *     above, and V4 by self-convergence with its criteria as fixed.
 * (b) A STRONGER TEST of the radial reconstruction: weno5zCylindrical
 *     itself (not only its linear weights) on smooth data, even and odd
 *     across the axis through the mirrored ghosts, of degree 0 to 4, at
 *     columns −1 to 7 and 300 — within 10⁻⁹ where the Z weights stay
 *     linear, and the axis's odd case (rule 1310 (b)) reported, not hidden.
 * (c) Then the GPU with G0–G2, V1, V2, V4, V5 once more, and T3 and T4 on
 *     the scheme as it then stands.
 */
export const RULE_1316_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1317. ERRATA FROM THE SECOND REVIEW (OF 72650EC, RULES 1308–1313), AND
 * THE WALL'S MIRROR KEPT (27 September 2026, 13:40; the review's proofs in
 * `scripts/tmp/review2-*.ts`). Written before the code.
 *
 * (a) THE AIR MODULE'S CHECK (5) counted broken points as good: its filter
 *     T > 25 000 K let T = NaN through and its maximum skipped NaN; of its
 *     2 266 points 114 have p ≤ 0 and 21 an undefined a, and the «largest»
 *     it reported had p = −160 Pa. Rule 1313 (b)(5)'s «PASSES» is withdrawn;
 *     the check runs again counting every NaN or non-positive p as a failure.
 * (b) THE MODULE'S DOMAIN: «valid to 25 000 K» is not what the fits cover.
 *     Beyond the report's data (its Fig. 11: Z_max about 3.0 at ρ₀, 3.57 at
 *     10⁻⁷ ρ₀) γ̃ falls below 1: at ρ₀, T peaks at 18 068 K (Z = 3.0) and
 *     falls, a is undefined from Z = 3.15 and p < 0 from 3.20; for
 *     −4.5 ≤ Y ≤ −3.5 and −0.5 ≤ Y ≤ 1.25 the module never reaches 25 000 K.
 *     So the module refuses (a RangeError) where γ̃ ≤ 1 or a² ≤ 0, its
 *     comment states the fits' true reach, and the hand-over to Gilmore
 *     (rule 1308 (a)) is set by the data's edge, not by T.
 * (c) TEXT: rule 1313 (b)(1)'s «off by 1 to 14 of it, at most 0.2 %» is
 *     false — Table 11, 10⁻⁷, E upper is off by 61.5 of its last digit
 *     (1.30 %), and six more beyond 0.2 %. With the strict reading (half a
 *     digit, the rounding) 183 of 252 entries pass; with one digit, 223.
 * (d) TEXT: rule 1311 (d)'s «half the local |second difference|» is, for a
 *     pure odd–even alternation of ±δ, twice δ: a conservative bound, so
 *     stated.
 * (e) THE WALL'S MIRROR: rule 1309 (e) left the ghost row's lower face
 *     (below the ground) componentwise while its upper face (the wall's) is
 *     characteristic, and rule 1280's ramp takes the smaller of the two: in
 *     extreme states it rescales the wall's face without its mirror (96 of
 *     4 800 faces in a synthetic test, a mass flux through the wall up to
 *     2.6 ρc; never in the 1 kt ground burst). The ghost row's lower face
 *     becomes the mirror of the first row's upper face (v odd), the axis's
 *     ghost column likewise (u odd), before the ramp: in uniform air the
 *     wall is again exactly symmetric. CPU and GPU; then G0–G2 and the
 *     V-tests with rule 1316.
 */
export const RULE_1317_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1318. THE THIRD REVIEW: THE AIR MODULE STILL ACCEPTED NONSENSE; V3'S
 * EXTRAPOLATION BOUNDED BEFORE ITS NUMBERS ARE SEEN (27 September 2026,
 * 13:53). Written before the code; no reading of V3 has been looked at.
 *
 * (a) THE GUARD WAS TOO WEAK: between the fits' data and the point where γ̃
 *     falls below 1 the module accepted states where p and T fall as e
 *     rises (Y = 1, Z = 3.15: T = 3 954 K; 4 562 points of a fine grid with
 *     ∂p/∂e|ρ ≤ 0, 4 606 with T falling). Physics forbids both. The module
 *     now also refuses where ∂p/∂e|ρ = ρ[(γ̃ − 1) + γ̃_Z/ln 10] ≤ 0 and where
 *     T does not rise with e (∂log₁₀T/∂Z_T ≤ 0 in the T fit); in a band's
 *     blending both ends are checked. The data's own edge (the report's
 *     Fig. 11, Z_max(Y)) is to be read by two blind transcriptions and
 *     added as the refusal it should be.
 * (b) CHECK (5)'s label: its «largest within the data» was a point outside
 *     the data (Y = −4, Z = 3.6); it is renamed to the largest over the
 *     accepted points, and the count of refusals is a lower bound on the
 *     points beyond the data, as the review says.
 * (c) TEXT: rule 1317 (c)'s «six more beyond 0.2 %» is five more (six in
 *     all: 0.217 %, four A-upper values of 0.211–0.311 %, and the 1.303 %
 *     one). The module's comment «below 25 000 K at high densities» had it
 *     backwards: the report's data end near 17 700–23 000 K from 10⁻⁷ to
 *     10² ρ₀ and reach about 25 000 K only at 10³ ρ₀ (its Fig. 13; at the
 *     Fig. 11 edges the module gives 17 895, 18 068, 23 290 and 25 672 K).
 * (d) V3'S EXTRAPOLATION, completing rule 1314 (d) before any reading: an
 *     observed order below 1 is not extrapolated (1/(2^p − 1) grows without
 *     bound as p falls: at p = 0.14 it adds ten times the last change) and is
 *     judged as non-monotone convergence; the band of a non-monotone
 *     reading is the spread of the three grids, as rule 1256 (c) says, not
 *     the last change alone.
 */
export const RULE_1318_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1319. RULES 1316 (a) AND 1317 (e) IN THE CODE AND CHECKED; THE FITS'
 * DATA EDGE READ TWICE (27 September 2026, 14:17). The edge's use written
 * before its code.
 *
 * (a) IN THE CODE: the ground's slope from q and ρ/(ρ₀α) extrapolated to the
 *     wall (1.5f₀ − 0.5f₁), CPU `primitives` and GPU `ghostsZ`; the ghost's
 *     outer face the mirror of the first cell's, CPU `reconstruct` and GPU
 *     `mirrorR`/`mirrorZ`; `weno5zCylindrical` tested on smooth data even
 *     and odd through the mirrored ghosts, degrees 0–2 at columns −1 … 7 and
 *     300 (13 tests of the solver's pass).
 * (b) CHECKED, criteria as fixed: G0 exactly at rest; G2 mass to 2.0·10⁻¹¹
 *     and 8.7·10⁻¹¹, energy to 4.6·10⁻⁹ and 2.7·10⁻⁷; V1 by self-convergence
 *     4.52, 3.78; V2 1.10 on the last pair, the shock 0.11 cells off; V4 by
 *     self-convergence 4.60, 4.51; V5 planar within 0.049 % at every Mach;
 *     V5 radial 1.222 % (unchanged, uniform air). All as before or better.
 *     Rule 1310 (d)'s measure: the steady Lamb state's drift in the ground's
 *     row 6.04·10⁻⁵, 1.53·10⁻⁵, 3.84·10⁻⁶, 9.59·10⁻⁷ of A on 500 … 62.5 m
 *     (the review's with the first row's slope: 8.2·10⁻⁵ … 1.29·10⁻⁶), order
 *     2.00, and no longer worse than the rows above: what is left is rule
 *     1310 (a)'s second order of gravity on the departures.
 * (c) THE DATA'S EDGE (rule 1318 (a)), read by two blind transcriptions of
 *     RP-1181's Fig. 11 (p. 12): the figure is in (log₁₀(p/p₀), log₁₀(e/RT₀))
 *     with the 11 isochores 10⁻⁷ … 10³ ρ₀; the edge is the highest compared
 *     point on each, not an isotherm (it lies at 17 600–27 200 K, Fig. 13).
 *     The two readings agree within 0.005 in Z (each ±0.006): Z_max = 3.573,
 *     3.516, 3.456, 3.298, 3.288, 3.268, 3.219, 3.031, 2.961, 2.924, 2.883 at
 *     Y = −7 … 3, the means. The module refuses Z > Z_max(Y) (linear in Y
 *     between the isochores, the ends held beyond them); both readers note
 *     RGAS's line runs 0.02–0.03 further than the last point — the refusal
 *     keeps to the points.
 * (d) The laboratory's Kestenboym, Turetskaya & Chudov (1969, NASA TT
 *     F-13,012; free explosion, γ = 1.2, no ground, no gravity, the strong
 *     shock only, energy imbalance up to 30 %) does not bear on the weak
 *     far-field lift at the ground; it is kept as a possible check of the
 *     strong phase.
 */
export const RULE_1319_WRITTEN = '2026-09-27' as const;

/**
 * RULE 1320. ERRATA FROM THE FIFTH REVIEW (OF EFE52E2, RULE 1319) (27
 * September 2026, 14:27; the review's proofs in `scripts/tmp/review5-*.ts`).
 * The solver's code, CPU and GPU, found without numerical error; the rest
 * corrected before the push.
 *
 * (a) THE TEST OF RULE 1316 (b) DID NOT TEST WHAT IT SAID: on data of degree
 *     ≤ 2 every candidate is exact whatever the weights, and faults put in
 *     on purpose (linear weights 1/3 each, or 0.9/0.05/0.05; β₀ and β₂
 *     swapped; τ times 1 000) all passed it. The test is written again: the
 *     face values of smooth non-polynomial data (a cosine), even and odd
 *     through the mirrored ghosts, on two cells a factor 2 apart, at a
 *     column far from the axis — observed order at least 4.5, which each of
 *     those faults breaks — and at the axis, where rule 1310 (b)'s odd case
 *     is reported by the test's own numbers, not asserted small.
 * (b) TEXT, rule 1319 (b): «all as before or better» is false for G2 — mass
 *     8.7·10⁻¹¹ (was 2.4·10⁻¹¹), energy 2.7·10⁻⁷ (was 1.2·10⁻⁷), both within
 *     their criteria (10⁻⁶ and 10⁻⁴); «no longer worse than the rows above»
 *     is false — the ground's row stays the worst by a little (6.04·10⁻⁵
 *     against 5.62·10⁻⁵ in the row above on 500 m), now on the smooth trend
 *     of the rows above; the «13 tests» are 9 of the solver's and 4 of the
 *     air module's.
 * (c) TEXT, rule 1318 (c) and the air module's comment: the review's own
 *     readings of Fig. 11 there were taken off a scan tilted by 0.46°, 0.01–
 *     0.04 too low. At the edge of rule 1319 (c) the module's temperatures
 *     run from 16 609 K (10⁻⁴ ρ₀) to 25 192 K (10² ρ₀) and 27 522 K (10³ ρ₀);
 *     the comment says so.
 * (d) RECORDED: the module's effective reach is narrower than the data's
 *     edge where ∂p/∂e|ρ turns non-positive first (on ρ₀ from Z = 2.998, the
 *     edge 3.031; 720 points of a fine grid inside the edge refused) — the
 *     hand-over to Gilmore will take the effective reach, not the edge
 *     alone. V5 radial is run again on the GPU when it is free (the mirror
 *     of rule 1317 (e) acts in uniform air too).
 */
export const RULE_1320_WRITTEN = '2026-09-27' as const;
