/**
 * Rules 908 to 918 — the entry's atmosphere, round 3 of phase 4. Written on
 * 23 September 2026, after the two-stage strength was adopted (c9d35e8), in
 * the order the reviewer set that day: Collins's exponential frozen as the
 * legacy branch; the same model integrated numerically on the same
 * exponential and shown to give the closed forms within a tolerance fixed
 * here; then only ρ(z) changed, to the U.S. Standard Atmosphere 1976, as a
 * branch of its own, adopted or refused by a comparative criterion fixed
 * here. No line of the integrated model exists yet.
 *
 * RULE 908. WHAT THIS IS. Three branches of the paper's entry model (Collins,
 * Melosh & Marcus 2005, Eqs. 5 to 20, under the product's options: the paper's
 * equations, the switch boundary):
 *   A      "Collins, exponential (legacy)": the closed forms as they are today,
 *          ρ = ρ0 e^(−z/H), ρ0 = 1 kg/m³, H = 8 km. Unchanged; it stays the
 *          branch level A and every check against the program run on;
 *   N-exp  the same model integrated numerically (rule 909) on that same
 *          exponential;
 *   N-USSA the model of N-exp with ρ(z) of the U.S. Standard Atmosphere 1976
 *          (rule 912), and nothing else changed.
 * The steps: (1) these rules, pushed alone; (2) N, dormant, and its
 * verification (rule 910) on N-exp; (3) the USSA profile, its own
 * verification, and the table of rule 913, published; (4) the one run of
 * rule 914, and its outcome.
 *
 * RULE 909. THE INTEGRATED MODEL — what N computes for any profile ρ(z):
 *   (a) the whole body: Eq. 7 integrated exactly, v(z) = v0 exp(−3 C_D M(z) /
 *       (4 ρi L0 sin θ)), M(z) the column mass above z — Eq. 8 where ρ is
 *       exponential;
 *   (b) the breakup: the highest altitude z* ≥ 0 at which ρ(z) v(z)² reaches
 *       the strength — Eq. 10 solved, where A takes Eq. 11's approximation of
 *       its root. Where ρ v² stays below the strength down to the ground the
 *       body stays whole (A reads that from Eq. 12's I_f ≥ 1, the
 *       exponential's approximation of the same condition), with the speed at
 *       the ground A gives it (never below terminal);
 *   (c) the pancake: L(z)² = L0² + τ(z)², τ(z) = (1 / sin θ) ∫ from z to z* of
 *       √(C_D ρ / ρi) dz′ — Eq. 15 written for any profile: where ρ is
 *       exponential it is Eq. 15 with Eq. 16's l, identically. It is the
 *       spread of fragments moving apart at v √(C_D ρ / ρi), summed in
 *       quadrature with L0. (Eq. 15 is the paper's approximation of Eq. 14,
 *       not its solution: this round keeps it, as it keeps C_D, f_p and the
 *       strengths — rule 917.);
 *   (d) the burst altitude: where L reaches f_p L0 (Eq. 18's condition); where
 *       it would be below the ground, the virtual altitude A gives, with the
 *       profile continued below the ground by its lowest layer's law (as
 *       Eq. 18 continues the exponential), to 150 km below it;
 *   (e) the speed after the breakup: Eq. 17, its integral of ρ L² taken on
 *       the profile; below a burst, the cloud held at f_p L0 and slowed by the
 *       same drag on it, as `entryPath` slows it today;
 *   (f) the first fragmentation at S1 (rules 896 to 902): Eq. 10 at S1 on the
 *       same profile; the swarm's spread at the ground: L(0) of (c);
 *   (g) the column mass and the integral of √ρ tabulated once per profile
 *       from 150 km below the ground to 150 km above it, on a 10 m grid, by
 *       the trapezoid rule, and read between nodes linearly; above 150 km,
 *       the column mass of the profile's top layer continued at its local
 *       scale height; the integral of ρ L² of (e) taken body by body from z*
 *       down, by the trapezoid rule on the same grid.
 *
 * RULE 910. THE VERIFICATION OF N (the variant's own level A: integration,
 * conservation, convergence, units, the exponential limit). It reads no
 * observation.
 *   (a) The exponential limit. On every case of rule 911, N-exp against A*,
 *       the closed forms of Eqs. 8 and 15 to 20 evaluated at Eq. 10's exact
 *       root instead of Eq. 11's: the breakup, burst and virtual burst
 *       altitudes, and the first fragmentation's, within 1 m; the speed at
 *       the burst or at the ground, the swarm's spread at the ground and
 *       every speed `entryPath` samples, within 1e-5 of their value or
 *       1 mm/s, whichever is larger; the energy's share reaching the ground
 *       within 1e-5; the regime the same —
 *       except where A*'s own condition for it (ρ v² against the strength at
 *       the ground, the burst against the ground) lies within these
 *       tolerances of its edge, each such case listed.
 *   (b) Convergence. Every quantity of (a), under both profiles, moves by
 *       less than (a)'s tolerance when rule 909(g)'s grid is taken at 5 m.
 *   (c) Conservation. The speed after the breakup, integrated independently
 *       of the tables — Eq. 17 and τ of (c) as differential equations in
 *       altitude from z*, fourth-order Runge–Kutta with a step of 10 m —
 *       within (a)'s tolerance of N's, on every case.
 *   (d) Units. The profile is held in SI (kg/m³, m) and the USSA profile
 *       gives the standard's printed values (rule 912).
 *   (e) Where (a) to (c) fail, the fault is N's numerics: it may be mended and
 *       the verification run again, each run recorded; the tolerances never
 *       move. Until (a) to (c) pass, no USSA profile is run on any fireball.
 *   Reported, never deciding: A against A* over the same cases — what
 *   Eq. 11's and Eq. 12's approximations move.
 *
 * RULE 911. THE ENTRY GRID of rule 910: every input of level A's wide grid
 * (validation/eiepGrid.json: 1 782 cases, 1 m to 30 km, 12 to 70 km/s, 15° to
 * 90°, 1 000 to 8 000 kg/m³), each under Eq. 9's strength and under the
 * two-stage law with S2 at its midpoint and at both ends of its interval
 * where the law covers the density; and every body of I2's set (the 357
 * fireballs, rule 77's body) under both laws.
 *
 * RULE 912. THE USSA PROFILE. The U.S. Standard Atmosphere 1976 (NOAA,
 * NASA, USAF; NOAA-S/T 76-1562, NASA-TM-X-74335): from its defining
 * constants — g0 = 9.80665 m/s², r0 = 6 356 766 m, R* = 8.31432 J/(mol K),
 * M0 = 28.9644 kg/kmol, P0 = 101 325 Pa, and its seven layers of
 * molecular-scale temperature in geopotential altitude — with the geometric
 * altitude converted to geopotential, H = r0 z / (r0 + z), up to 86 km
 * geometric; above, the densities of the standard's own table, read
 * log-linearly between its rows, to 150 km. Its implementation must give the
 * standard's printed density, pressure and temperature, within the last
 * printed digit, at every 5 km from 0 to 85 km and at 86, 90, 100, 110, 120
 * and 150 km — the values read from the standard, with their pages, pinned
 * in the repository. It is a profile of the impacts' own: the project's
 * `atmosphere/ussa1976.ts`, which the volcanic ashfall reads, is not
 * touched — it takes geometric altitude for geopotential, uses the 2018 gas
 * constant, and holds the density constant above 86 km; written here for
 * when that module is taken up again.
 *
 * RULE 913. THE TABLE the reviewer asked for, published before step 4:
 * `docs/ATMOSPHERE_TABLE.md`, written by a script and held by a test. At
 * every 5 km from 20 to 80 km: Collins's density, the standard's, and their
 * ratio; the standard's pressure; and the altitude at which the dynamic
 * pressure ρ v² reaches S1's and S2's bounds and midpoints at 15, 20 and
 * 30 km/s, under each profile, for a body not yet slowed (ρ = S / v²).
 *
 * RULE 914. WHAT DECIDES — the comparative criterion, fixed before the run.
 * On I2's development set (the 357 fireballs, rule 77's default body, the
 * product's strength law), A and N-USSA are read on three metrics:
 *   (i)  the absolute error: the median absolute miss of the burst altitude,
 *        as rule 78 reads it;
 *   (ii) the signed bias: the mean miss, as rule 78 reads it, taken by its
 *        size;
 *   (iii) the band's coverage: the share of the fireballs whose recorded
 *        altitude lies between the burst altitudes the branch gives with S2
 *        at the 10th and at the 90th percentile of its log-uniform prior,
 *        S2(p) = 0.9 (5 / 0.9)^p MPa — 1.068 and 4.21 MPa — a body brought to
 *        the ground reading 0 km; for a body the two-stage law does not
 *        cover, its one strength, and its band a line.
 * A metric improves when (i) falls by 0.1 km or more, (ii) falls by 0.1 km or
 * more, (iii) rises by 1 point or more; it worsens materially when (i) rises
 * by more than 0.25 km, (ii) by more than 0.5 km, (iii) falls by more than 2
 * points, or when N-USSA brings more than 7 more fireballs to the ground
 * (2 % of the set: rule 78 leaves them out of (i) and (ii)). N-USSA is
 * adopted only if it improves at least two metrics and worsens none
 * materially, and:
 *   (a) rule 910 (a) to (c) have passed;
 *   (b) G5 reads nothing under it, on the benchmark's own draw and the unseen
 *       seed;
 *   (c) level A does not move: its harness and every check against the
 *       program run on A;
 *   (d) I3's claim for Tunguska holds — the felled forest's 26.5 km inside
 *       its band, re-taken under N-USSA;
 *   (e) typecheck, lint, format, the whole suite, the strict gate PASS, and
 *       Chromium's end-to-end suite.
 *
 * RULE 915. REPORTED, NEVER DECIDING: the same three metrics for N-exp —
 * what solving Eq. 10 alone moves, and, against N-USSA, what the atmosphere
 * alone moves; (i) and (ii) on the fireballs that burst under both branches;
 * the regression cases (2023 CX1, 2024 BX1, Carancas) and the development
 * events (Chelyabinsk, Tunguska) under every branch; the grid's breakup and
 * burst altitudes, A against N-USSA. The validation report keeps A and the
 * adopted branch side by side, labelled "Collins, exponential (legacy)" and
 * "integrated, USSA 1976", until a later rule retires one.
 *
 * RULE 916. WHAT WAS SEEN BEFORE THESE RULES: the claim, made after round 2
 * from the standard's densities as remembered, that Collins's exponential is
 * 1.5 to 1.9 times denser than the standard between 40 and 60 km, so that
 * breakups under the standard would come 4 to 5 km lower — a motivation for
 * rule 913's table to check, not a result; the project's `ussa1976.ts` and
 * its test; the derivation that Eq. 15 does not solve Eq. 14 (rule 909(c)).
 * Neither N nor any USSA profile has been run on a fireball, a grid case or
 * a scenario.
 *
 * RULE 917. WHAT MAY NOT HAPPEN. No coefficient of the model moves — C_D = 2,
 * f_p = 7, the strengths and their intervals, Eq. 15's form. The tolerances
 * of rule 910, the grid of rule 911, the thresholds of rule 914 and the 80 %
 * band are fixed here. The USSA's values come from the standard only. One
 * run of rule 914. If rule 910 does not pass, the round stops before the
 * USSA profile touches a fireball.
 *
 * RULE 918. WHAT AN ADOPTION DOES, AND MAY UPDATE. The product's entry runs
 * on N-USSA; A stays, pinned, for level A and every check against the
 * program. An adoption may update — every test that fails with the default
 * switched, each for its reason, and nothing else:
 *   (a) checks against the program, pinned to A as they are pinned to Eq. 9;
 *   (b) records of earlier rounds, pinned to the branch they were measured
 *       on;
 *   (c) records of the model, re-taken with what moved: the seal (rule 833);
 *       the entry band's numbers, as rules 739 to 747 compute them; I3's band
 *       for Tunguska, its claim still holding; the evidence table's figure
 *       for the bolides; the candidate's own tests.
 * Any other test that fails is a failure of rule 914(e). The entry's card
 * says which atmosphere; the report is regenerated once; the CHANGELOG and
 * the ROADMAP record it. A refusal records why, and N stays, dormant, for a
 * later round.
 */

/** The branches of rule 908. */
export type EntryAtmosphere = 'closed' | 'integratedExponential' | 'integratedUssa';

/** Rule 909(g): the grid of the tabulated integrals (m), and its span
 *  above and below the ground. */
export const ENTRY_ATMOSPHERE_STEP_M = 10;
export const ENTRY_ATMOSPHERE_TOP_M = 150_000;
export const ENTRY_ATMOSPHERE_FLOOR_M = -150_000;

/** Rule 910(a): the tolerances of the exponential limit. */
export const ENTRY_ATMOSPHERE_ALTITUDE_TOLERANCE_M = 1;
export const ENTRY_ATMOSPHERE_RELATIVE_TOLERANCE = 1e-5;

/** Rule 910(a): the floor under the relative tolerance of a speed (m/s). */
export const ENTRY_ATMOSPHERE_SPEED_FLOOR_MS = 1e-3;

/** Rule 910(b) and (c): the finer grid, and the Runge–Kutta step (m). */
export const ENTRY_ATMOSPHERE_FINE_STEP_M = 5;
export const ENTRY_ATMOSPHERE_RK_STEP_M = 10;

/** Rule 914: what improves a metric, and what worsens it materially. */
export const ENTRY_ATMOSPHERE_CRITERION = {
  improve: { medianAbsoluteKm: 0.1, biasKm: 0.1, coveragePoints: 1 },
  worsen: { medianAbsoluteKm: 0.25, biasKm: 0.5, coveragePoints: 2, moreToTheGround: 7 },
  /** The 80 % band of S2's log-uniform prior (Pa). */
  bandStrengthsPa: [0.9e6 * (5 / 0.9) ** 0.1, 0.9e6 * (5 / 0.9) ** 0.9] as const,
} as const;

/** The outcome, written after the one run of rule 914. */
export const ENTRY_ATMOSPHERE_OUTCOME: string | null = null;
