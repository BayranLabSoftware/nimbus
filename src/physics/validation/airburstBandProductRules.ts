/**
 * Rules 706 to 713 — I3's band, carried by the product, and I3 read. For
 * impacts, 21 September 2026, IMP-3 of ROADMAP.md M11, written before the
 * band is built and before I3 is read, and after the two amendments of the
 * same day to I3 in docs/GOLD_STANDARD.md, both by Andrea's decision.
 *
 * RULE 706. WHAT THIS ROUND IS. The result of every complete airburst gains,
 * for each of its three blast rings — 5 psi, 1 psi and light damage — the
 * band Collins et al. (2017) give their own three approximations about the
 * static source the product draws: the static source's reach at twice the
 * ring's threshold for the low edge (their line source, half the
 * overpressure) and at half of it for the high edge (their moving source,
 * twice), both within three burst altitudes; and the static reach itself
 * beyond three burst altitudes, where the paper says the three agree. That is
 * the construction of rules 571 to 578 and of the first amendment. No ring,
 * no preset and no figure of the report moves: the band is new, and the
 * report prints it. A body that reaches the ground carries no band: the
 * reference is about airbursts, and its ground blast is the program's own
 * construct, not the static source the band is drawn about.
 *
 * RULE 707. I3's FOOTPRINTS (the first clause), at the energy and burst
 * altitude the product gives each preset, and at the threshold the field
 * gives each footprint. The threshold of a footprint is not one number, so
 * the band a footprint is read against is the union of the bands over its
 * range — from the low edge at the range's high end to the high edge at its
 * low end.
 *
 *   (a) TUNGUSKA. The felled forest, 2 200 km², 26.5 km of equivalent radius
 *       (`TUNGUSKA_FELLED`). Collins et al.: 10 and 20 kPa are "lower and
 *       upper limits for extensive tree damage", and the nominal 20 kPa "may
 *       represent conservative thresholds by a factor of two". Range 10 to
 *       20 kPa.
 *   (b) CHELYABINSK. The broken windows, "a ~50 km radius damage zone" in
 *       the same paper, which gives window damage "~1 kPa (0.5–5 kPa,
 *       Glasstone and Dolan 1977, p. 221; Popova et al. 2013)". Range 0.5 to
 *       5 kPa, footprint 50 km.
 *
 * RULE 708. I3's RUNS (the second clause, as amended). At the altitudes the
 * paper prints for its Table 2 — 21.5, 14, 10 and 11 km for 0.5, 5, 15 and
 * 50 Mt — and the full energy of each row, the energy the paper's static
 * source is given, the band about this product's static source is counted
 * against every entry of the table that is a number or "n/a" (n/a is a reach
 * of zero, held by a band whose low edge is zero); an entry too low for the
 * paper's mesh is not scored. The static source is the Earth Impact Effects
 * Program's, held to it by I1, so the band about the field's tool holds the
 * same runs by construction; the share is printed, not barred.
 *
 * RULE 709. I3's WIDTH (the third clause, as amended) is met by construction:
 * the band is the reference's own. A test holds that construction, so that a
 * band that drifted from it could not pass as the reference's.
 *
 * RULE 710. WHAT IS EXPECTED, written before the band is built. Seen before
 * these rules, in exploration, and declared: at 10 and 20 kPa the Tunguska
 * preset's union band is 4.0 to 29.4 km; at 1 kPa Chelyabinsk's is 0 to
 * 68 km; and the runs held are 27 of 43. So nothing here is evidence found by
 * this round; what the round can get wrong is the product — a band the
 * result carries that is not the one measured, a ring that moves, a body on
 * the ground given a band.
 *
 *   (a) both footprints lie in their union bands;
 *   (b) the runs held are 27 of 43, printed;
 *   (c) every complete airburst of the presets and of a sweep of 5 000
 *       scenarios carries a band that contains each ring, and no other body
 *       carries one;
 *   (d) no ring, no preset and no figure of the report moves but the lines
 *       that print the band and I3's verdict;
 *   (e) the release gate stays at PASS.
 *
 * RULE 711. WHAT DECIDES. I3 is met when (a) to (e) hold. Otherwise it stays
 * not met, the band stays in the product if (c) and (d) hold, and the
 * failing items are printed.
 *
 * RULE 712. WHAT THE GLOBE DRAWS is not this round's. Until it draws the
 * band, it draws the generic dashed line at a published scatter, and the
 * seven checks of IMP-7 say so; drawing the band is IMP-7's check 3.
 *
 * RULE 713. WHAT IS NOT CLAIMED. That the band is the uncertainty of the
 * true blast: it is the reference's statement of how far its approximations
 * disagree. That the program's static source is right: it reads 0.71× to
 * 1.34× of the paper's own shock-physics static source at the same inputs,
 * and the report prints so. And that the airburst draws the footprints: its
 * rings are at 5 psi, 1 psi and 0.5 psi, and neither footprint is at one of
 * them.
 */

/** Rule 707(a): the field's range for extensive tree damage, kPa. */
export const TREE_DAMAGE_RANGE_KPA = [10, 20] as const;

/** Rule 707(b): the field's range for window damage, kPa, and the damage
 *  zone's radius at Chelyabinsk, km. */
export const WINDOW_DAMAGE_RANGE_KPA = [0.5, 5] as const;
export const CHELYABINSK_WINDOWS_RADIUS_KM = 50;

/** Rule 710(b): the runs held, seen before the rules and declared. */
export const RUNS_HELD_SEEN = { held: 27, of: 43 } as const;

export const AIRBURST_BAND_PRODUCT_RULES = 'rules 706 to 713, fixed 21 September 2026';
