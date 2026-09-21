/**
 * Rules 698 to 705 — an airburst's flash, where the airburst is. For impacts,
 * 21 September 2026, IMP-2 and IMP-7 of ROADMAP.md M11, written and pushed
 * before the default moves or the sweep is run. B-094.
 *
 * RULE 698. WHAT THIS ROUND IS. `DEFAULT_AIR_FLASH` goes from `ground` to
 * `burst`: the flash of a complete airburst is placed at its burst altitude.
 * Its burn and fire rings become the ground ranges at which the slant
 * distance to the burst equals the range the flash reaches at each exposure,
 * √(R² − z²), or none where the burst is farther than R; the thermal field's
 * air term is read at the slant distance. Nothing else moves: not a partial
 * airburst or a ground impact, whose air share stays at the ground, where the
 * two placements meet as a burst altitude falls to zero; not the program's
 * fireball on the ground (I1); not the luminous efficiency, the exposures, or
 * the horizon's cut.
 *
 * RULE 699. WHY: WHAT THE MODEL DRAWS IS IMPOSSIBLE. No point of the ground is
 * nearer a burst at altitude z than z, so none receives more than η E/(4π z²).
 * For the Chelyabinsk preset, 0.588 Mt at 27.1 km with the model's η = 3e-3,
 * that is 799 J/m², 0.019 cal/cm²; the model draws third-degree burns
 * (8 cal/cm²) within 1.32 km and a mass fire within 0.99 km. For Tunguska's,
 * 9.1 Mt at 9.8 km: at most 2.27 cal/cm² anywhere, and the model draws
 * third-degree burns to 5.2 km and a mass fire to 3.4 km. The radii the flash
 * is given are slant distances — `events/explosion/thermal.ts` says so,
 * "Slant distance at which the thermal fluence equals a given threshold" —
 * and they are drawn as ground ranges of a flash on the ground. The entry's
 * own comment has said as much since B-041: "for the Chelyabinsk preset the
 * first-degree radius is ≈ 2.7 km, while Popova et al. (2013) report a mild
 * sunburn, from ultraviolet, 30 km from the point of peak brightness".
 *
 * RULE 700. THE SOURCE. Glasstone & Dolan (1977) §7.94–7.96: Q = f τ W /
 * (4π D²), D the slant range from the point of burst. And every model of an
 * airburst's flash the field uses puts its source in the air: IDG RAS's
 * (Popova et al. 2021) at a radiation source height, Q ∝ 1/(H² + x² + y²);
 * NASA ATAP's (Johnston & Stern 2019) at the distance L from the meteor to
 * the ground point, its altitude H inside it — both as Coates et al. (2024,
 * Acta Astronautica, "Sensitivity study of impact risk model results to
 * thermal radiation damage model for large objects") set them out.
 *
 * RULE 701. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, the old
 * placement against the new. The presets: Tunguska's third- and
 * second-degree rings 5.22 and 6.60 km to none, its ignition and mass fire
 * 4.78 and 3.40 km to none; Chelyabinsk's 1.32, 1.68, 1.59 and 0.99 km to
 * none; Sikhote-Alin's 0.09, 0.12 and 0.13 km to none; the five crater-forming
 * presets unchanged. The I1 grid: the thermal rings of 24 rows move, every one
 * a complete airburst.
 *
 * RULE 702. WHAT IT COSTS, DECLARED (B-095). With the model's own luminous
 * efficiency, 3e-3 — Collins et al. 2005's for the plume of an impact on the
 * ground, which the field holds uncertain from 1e-4 to 1e-2 (Coates et al.) —
 * no complete airburst of the presets burns anything. Tunguska scorched
 * forest over 100 to 200 km² (Vasilyev 1998), and a flash of 3e-3 at 9.8 km
 * cannot. Superbolides radiate 3 to 20 % of their energy (Svetsov & Shuvalov
 * 2018): the efficiency is wrong for an airburst, and it is the next round's,
 * with its own source. Today the model draws Tunguska's burns for a reason
 * that is impossible; after this round it draws none, for a parameter that is
 * wrong. An impossibility goes first.
 *
 * RULE 703. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) on one commit, on the I1 grid, the presets and 5 000 impacts of the
 *       own seed and of `AIR_FLASH_HELD_OUT_SEED`, which no run has used: no
 *       burn ring, fire ring or thermal field sample of a body that is not a
 *       complete airburst moves;
 *   (b) every complete airburst's burn and fire rings are √(R² − z²), or
 *       none, of what they were, and its field samples at most what they
 *       were — a test in CI;
 *   (c) `impactField.test.ts` passes: at the radius of each burn ring the
 *       horizon does not cut, the published field is the burn's threshold;
 *   (d) G5, on both seeds: no key G5 reads appears under the new placement
 *       that the old one's run on the same seed does not print, and the
 *       scenarios whose failures differ are listed;
 *   (e) the report regenerated on the new placement keeps the release gate at
 *       PASS;
 *   (f) the presets move as rule 701 lists, and no other.
 *
 * RULE 704. WHAT DECIDES. Adopted when (a) to (f) hold. Otherwise refused,
 * the default stays `ground`, and the failing items are printed.
 *
 * RULE 705. WHAT IT DOES NOT CLAIM. That an airburst burns nothing: that is
 * B-095's to say. Only that the model stops burning what its own flash cannot
 * reach. And the explosions draw an air burst's burns the same way; they are
 * another domain, and B-094 records it for them.
 */

/** Rule 703: the seed of the run on scenarios nobody has seen. */
export const AIR_FLASH_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-flash';

export const AIR_FLASH_RULES = 'rules 698 to 705, fixed 21 September 2026';
