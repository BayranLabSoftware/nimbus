/**
 * Rules 772 to 779 — an airburst's flash from the field's model of it. For
 * impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, B-095, by Andrea's two
 * decisions of that evening; written and pushed with the option plumbed and
 * not the default, before the default moves or any sweep is run.
 *
 * RULE 772. WHAT THIS ROUND IS. `DEFAULT_AIRBURST_RADIATION` goes from
 * `efficiency` to `atap` (`effects/atapRadiation.ts`). The flash in the air
 * of an impact — today the energy left in the air at Collins et al.'s impact
 * luminous efficiency, 3 × 10⁻³ — becomes, at every range, the stronger of
 * that flash and the heat load Johnston & Stern's correlation lays on the
 * ground along the entry's path: their Eqs. (1), (2), (3) and (9), each point
 * of the path radiating for the time the body takes to cross it, and the
 * footprint reduced as PAIR reduces it, to the disc of the same area at each
 * exposure (Coates et al. 2023). The path is the entry's own
 * (`effects/atmosphericEntry.ts`, `entryPath`): Collins et al.'s Eqs. 8, 16
 * and 17 from 40 km down, the radiating radius held at four times the body's
 * as Johnston & Stern hold it, and below a complete airburst's burst its
 * cloud, at the pancake's seven diameters, slowed by drag to the ground. The
 * fireball on the ground is added to it as to the flash today, and the burns,
 * the fires, the panel's flash radii and the thermal field all read it. The
 * correlation is read inside the range it was fitted on, and at the range's
 * edge beyond it: a body faster than 18 km/s at 18, a cloud wider than 200 m
 * at 200 m, a body faster than 1.8 km/s for each kilometre of its altitude at
 * the altitude where it is not; nothing below 6 km/s, above 40 km or seen at
 * more than 150 degrees from its velocity; and below a radius of 25 m the
 * fitted (R/25)^1.7 continued, so that the flux falls to nothing with the
 * radius.
 *
 * RULE 773. WHY: B-095. The flash in the air at 3 × 10⁻³ lays no burn of any
 * degree on the ground under Tunguska's preset, where some 200 km² of forest
 * was radiantly burnt (Svetsov 2008, as Johnston & Stern cite it), and PAIR,
 * NASA's operational risk model, draws an airburst's thermal damage with the
 * same efficiency (Coates et al. 2023). The field's model of this radiation
 * is Johnston & Stern's (Icarus 327, 48–59, 2019), for NASA's Asteroid Threat
 * Assessment Project, whose correlation, integrated along Tunguska
 * trajectories, lays the 40 J/cm² at which wood chars within ±2 km of the
 * measured burn. Andrea decided, that evening, the two things the rules could
 * not: the flash is the stronger of the two at every range, never fainter than
 * PAIR's; and what the correlation cannot read is PAIR's nominal, the field's
 * own, printed beside it.
 *
 * RULE 774. THE SOURCE, and whose each part is. Johnston & Stern's: Eq. (9)
 * and its units (ϕ in degrees, R in m, L and H in km, V in km/s, W/cm²),
 * Eq. (3) for the atmosphere's absorption, the geometry of their Eqs. (1) and
 * (2), the maximum radius factor of four, the range of their simulation
 * matrix (6 to 18 km/s, 25 to 200 m, 10 to 30 km, 0 to 150 degrees), the
 * start at 40 km and the 40 J/cm² of visible charring (after Svetsov 1996).
 * PAIR's (Coates et al. 2023): the disc of equal area. Collins et al.'s: the
 * path down to the burst. This project's: the cloud below the burst, the
 * reading at the edge of the fitted range, and the continuation below 25 m.
 * Andrea's: the stronger of the two.
 *
 * RULE 775. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, by scripts
 * outside the product. Eq. (9) against the lines of the correlation in
 * Johnston & Stern's Figs. 15 to 17, read off the figures at twenty points:
 * −9 % to +6 %. Their six cases of Fig. 24 — 15, 17 and 19 km/s at 30 and 45
 * degrees, 3 000 kg/m³, 2 MPa, a factor of four — run through this path: the
 * smallest initial radius that lays 40 J/cm² over 20 km along the path is
 * 43.5, 39.0 and 35.75 m at 30 degrees and 41.5, 37.25 and 34.25 m at 45,
 * where theirs are 40.5, 36.8 and 33.5 m and 40.5, 37.5 and 35.0 m: within
 * 7 %. A sharp cut at the fitted range's edge drew the rings smaller as the
 * body grew — 122 falls and 96 steps of the field in 3 276 steps of 1 % over
 * twelve bodies — and reading at the edge left three, none of a ring; at the
 * radius of 25 m a cut stepped the field by up to 87 %, and the continuation
 * leaves no step of a field sample over 0.5 %. The presets: Tunguska's
 * first-degree flash radius goes from 3.6 to 10.4 km and its field from 4.6 to
 * 8.5 J/cm² at 10 km, but its peak is 11 J/cm² and it lays no burn of the
 * second or third degree and chars nothing — its 60 m body at the 0.34 MPa
 * Collins et al.'s Eq. 9 gives its density breaks at 52 km, where Johnston &
 * Stern's size and strength char 20 km along the path; Meteor Crater's burns
 * and fires grow by 9 to 11 % (third degree from 7.15 to 7.93 km); the field
 * of Chelyabinsk and Sikhote-Alin rises under every ring's threshold; the
 * others do not move. A radiating impact takes about 7 ms more.
 *
 * RULE 776. WHAT IT COSTS, DECLARED. The path is Collins et al.'s pancake, not
 * the Hills & Goda one Johnston & Stern integrated along; it gives their radii
 * within 7 %, but their footprint's shape, an egg centred some 2.5 km uprange
 * of the epicentre, is drawn as the disc of its area where the rings are
 * centred. Below a complete airburst's burst the cloud is this project's.
 * Beyond the fitted range the correlation is read at its edge, which reads a
 * faster body or a wider cloud no brighter than the edge; below 25 m its
 * scaling is continued. Tunguska's preset chars no forest: its size and
 * strength are the field's open question, not this round's. And what the
 * correlation cannot read is drawn at PAIR's nominal, the field's own.
 *
 * RULE 777. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) in CI: Eq. (9) within 10 % of the twenty points read off Figs. 15 to
 *       17; at Johnston & Stern's six cases the smallest initial radius that
 *       lays 40 J/cm² over 20 km along the path within 12 % of their Fig. 24
 *       — their own ±25 % in the heat load — and inside their 30 to 45 m;
 *       under `atap` no ring and no field sample below `efficiency`'s; a body
 *       none of whose path is read keeps every number to the bit; and no burn
 *       or fire ring falls as a body grows by 2 % through the fitted range's
 *       edges, on a grid of speeds, angles and strengths;
 *   (b) on one commit, 5 000 impacts of the own seed and of
 *       `ATAP_HELD_OUT_SEED`, which no run has used, both laws read by the
 *       same harness: no key G5 reads appears under `atap` that
 *       `efficiency`'s run on the same seed does not print; the scenarios
 *       whose failures differ are listed;
 *   (c) the presets move as rule 775 lists them, and no other;
 *   (d) the report regenerated on the new default keeps the release gate at
 *       PASS.
 *
 * RULE 778. WHAT DECIDES. Adopted when (a) to (d) hold: then B-095 is closed,
 * and G6 for impacts reads the flash as Andrea decided — the field's model
 * where it reads, and beyond it PAIR's nominal, the field's own, printed
 * beside it. Otherwise refused, the default stays `efficiency`, B-095 stays
 * open, and the failing items are printed.
 *
 * RULE 779. WHAT IT DOES NOT CLAIM. That an airburst's thermal radiation is
 * measured: Tunguska's burn is the one footprint the field has, and the
 * correlation was fitted on simulations, not on it. That Tunguska's body is
 * known. Only that the model draws the field's radiation model where the
 * model reads, and nowhere a flash fainter than the field's operational one.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: REFUSED
 * ===========================================================================
 *
 * The rules were pushed in `ca4686e` and the four sweeps made on that commit
 * (`benchmark/results/invariants-2026-09-21-48.json` and `-49` on the own
 * seed, `efficiency` and `atap`; `-50` and `-51` on
 * `benchmark-2026-09-21-heldout-atap`).
 *
 * (a) HOLDS. `atapRadiationRules.test.ts`: Eq. (9) within 10 % of the twenty
 *     points of Figs. 15 to 17; the six optimal radii of Fig. 24 within 12 %
 *     and inside 30 to 45 m; never fainter; a body none of whose path is read
 *     unchanged to the bit; no ring falling through the fitted range's edges
 *     on the grid.
 * (b) FAILS. On the own seed G5 reads 0 under `efficiency` and 2 under
 *     `atap`, a key the first does not print: "finite: the run does not
 *     return within 2 s", for a 47.4 m body of 6 511 kg/m³ at 17.5 km/s and
 *     41.7 degrees and a 48.0 m body of 4 816 kg/m³ at 14.7 km/s and 58.9
 *     degrees. Both burst within 200 m of the ground, where the field at
 *     1 km moves by 1.2 % on the step of continuity under either law — the
 *     fireball on the ground there — and the harness searches it by halving,
 *     as rule 662 does; a run takes 0.2 ms under `efficiency` and 6 to 12 ms
 *     under `atap`, and the search no longer returns within the watchdog's two
 *     seconds. On the unseen seed the keys are the same, 5 against 7, and two
 *     more bodies draw a burn ring that shrinks as they grow: a 14.7 m iron at
 *     27.3 km/s and 6.4 degrees, whose second-degree ring, born a hair above
 *     its threshold, falls from 555 m to 335 m, and a 56.5 m body of
 *     6 956 kg/m³ at 14.3 km/s and 17.6 degrees, whose third-degree ring
 *     falls by 1.6 %. Both burst below 5 km, where the body is faster than
 *     1.8 km/s for each kilometre of its altitude and the correlation is read
 *     at the altitude where it is not; the deeper the body goes, the higher
 *     that reading lifts it: the edge in V/H is not monotone for a body that
 *     reaches low and fast.
 * (c) HOLDS. The presets move as rule 775 lists them, and no other.
 * (d) Not read: the default did not move.
 *
 * So `DEFAULT_AIRBURST_RADIATION` stays `efficiency`, B-095 stays open and G6
 * with it. What a second round would have to answer, printed and not
 * decided here: a run cheap enough for the harness's searches, or a watchdog
 * that reads a run that does not return rather than one that returns slowly;
 * and a reading of the correlation below V/H = 1.8 that does not lift a
 * deeper body higher.
 */

/** Rule 777 (b): the seed of the run on scenarios nobody has seen. */
export const ATAP_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-atap';

export const ATAP_RADIATION_RULES = 'rules 772 to 779, fixed 21 September 2026';
