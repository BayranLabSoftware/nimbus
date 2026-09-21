/**
 * Rules 764 to 771 — an iron's crater field ends where its fragments dig as
 * one. For impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, B-098, by
 * Andrea's order of that evening; written and pushed with the option plumbed
 * and not the default, before the default moves or any sweep is run.
 *
 * RULE 764. WHAT THIS ROUND IS. `DEFAULT_IRON_CRATER_FIELD` goes from `cut`
 * to `mass` (`events/impact/ironCraterField.ts`). An iron that breaks up — a
 * density of at least 6 000 kg/m³, breaking above the ground — falls as a
 * strewn field up to 3 × 10⁶ kg, its largest crater 0.15 of the whole body's
 * at its entry speed, Sikhote-Alin's calibration (B-004), as it did below
 * 20 m; from 10⁷ kg its fragments dig one crater, the whole body's at the
 * speed the entry leaves it (Eq. 21* at v_end, with the water's share),
 * whatever the pancake calls its burst; between, the largest crater is the
 * geometric mean of the two, weighted by the logarithm of the mass. The cut
 * at 20 m is gone.
 *
 * RULE 765. WHY: B-098. The strewn field ends at 20 m, which has no source,
 * and a crater vanishes there: a 19.83 m iron at 39.4 km/s and 72.6 degrees
 * digs 188.8 m, and 1 % larger nothing. G5 has read it on four unseen seeds.
 * Past 20 m the pancake's complete airburst leaves an iron no crater at all,
 * where the Earth Impact Effects Program, asked about the same body, prints
 * "Large fragments strike the surface and may create a crater strewn field" —
 * as it does for every airburst of 5 000 kg/m³ or more asked of it on 21
 * September 2026, of 10 to 40 m, and "No crater is formed" for every one of
 * 4 000 kg/m³ or less.
 *
 * RULE 766. THE SOURCE, and whose each part is. Bland & Artemieva (2006, "The
 * rate of small impacts on Earth", Meteoritics & Planetary Science 41,
 * 607–631) ran their separated-fragments model on irons of 1 kg to 10⁸ kg at
 * an average 18 km/s and 45 degrees: fragmented irons under 2–3 × 10⁶ kg form
 * multiple craters; above 10⁷ kg closely spaced fragments form single simple
 * craters, as Melosh (1981) had proposed; between, a strewn field becomes an
 * irregular crater and then a single one (their Fig. 13). The record they
 * cite agrees: nine of the fourteen terrestrial craters under 0.3 km are
 * multiple, and none of 0.3 to 1.5 km is. Theirs are the two masses, the
 * upper end of 2–3 × 10⁶ kg and 10⁷ kg. Sikhote-Alin's is the 0.15. Collins
 * et al.'s is the single crater, their crater of a swarm that reaches the
 * ground, and Bland & Artemieva's Fig. 2 bears it out: their 10⁸ kg iron at
 * 18 km/s digs about 1 km at 90 degrees and 0.9 km at 45, and it digs 992 m
 * and 727 m here, where the cut digs 992 m and nothing. The geometric mean in
 * the logarithm of the mass is this project's.
 *
 * RULE 767. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, by a script
 * outside the product. B-098's body keeps its crater across 20 m (817.8 m to
 * 822.3 m). Irons of 10⁶, 3 × 10⁶, 5 × 10⁶ and 10⁷ kg at 18 km/s and 45
 * degrees dig 53, 71, 158 and 454 m. No preset moves. On the own seed 161
 * craters move, the largest to 3 200 m; none falls as its body grows under
 * either law, and no step of 0.1 % moves one by more than 5 %, where under
 * the cut two did: the two irons of rules 756 to 763 whose crater is born, or
 * nearly, below their fireball, which here dig as one (1 654 m and 573 m). On
 * the unseen seed of rules 714 to 721, 133 move, and two craters fall under
 * each law: under both, a 1.07 m iron that the paper's strength turns from
 * whole to burst (B-091's switch); under the cut, B-098's iron; under `mass`,
 * a 16.3 m iron at 5.8 km/s whose breakup rises as it grows (B-091's
 * neighbourhood, 205.7 m to 201.0 m).
 *
 * RULE 768. WHAT IT COSTS, DECLARED. Irons of more than 3 × 10⁶ kg that the
 * pancake calls complete airbursts dig a crater and throw ejecta where they
 * drew none, and their flash and blast are still drawn from the air as an
 * airburst's: the energy they keep is in their crater and in the air's
 * effects both, as the program's partial airburst has it in its crater and in
 * its blast. The masses do not depend on speed or angle, which Bland &
 * Artemieva's averages do not give; their Fig. 2 shows a shallower entry
 * keeping a field longer. The wave of such a burst over water is not changed.
 *
 * RULE 769. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) in CI: under `mass`, no crater moves of a body that is not an iron
 *       that breaks up; B-098's body keeps its crater across 20 m to 1 %; the
 *       crater is continuous to 1 % at 3 × 10⁶ and 10⁷ kg, and grows across
 *       them, on a grid of speeds and angles; the 10⁸ kg iron at 18 km/s digs
 *       within 25 % of Bland & Artemieva's 1 km at 90 degrees and 0.9 km at
 *       45;
 *   (b) on one commit, 5 000 impacts of the own seed and of
 *       `IRON_FIELD_HELD_OUT_SEED`, which no run has used, both laws read by
 *       the same harness: no key G5 reads appears under `mass` that `cut`'s
 *       run on the same seed does not print; the scenarios whose failures
 *       differ are listed;
 *   (c) no preset moves;
 *   (d) the report regenerated on the new default keeps the release gate at
 *       PASS.
 *
 * RULE 770. WHAT DECIDES. Adopted when (a) to (d) hold. Otherwise refused,
 * the default stays `cut`, B-098 stays open, and the failing items are
 * printed.
 *
 * RULE 771. WHAT IT DOES NOT CLAIM. That an iron's crater field is modelled:
 * the largest crater of a field is still one calibration on one fall, and
 * where the craters overlap the law is this project's. Only that the field
 * ends where the field's model and record put its end, and that no crater
 * vanishes there.
 */

/** Rule 769 (b): the seed of the run on scenarios nobody has seen. */
export const IRON_FIELD_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-iron';

export const IRON_CRATER_FIELD_RULES = 'rules 764 to 771, fixed 21 September 2026';
