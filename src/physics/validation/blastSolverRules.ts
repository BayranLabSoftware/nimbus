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
