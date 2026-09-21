/**
 * Rules 780 to 787 — an airburst's flash from the field's model of it, asked
 * again. For impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, B-095, by
 * Andrea's order of that night after rules 772 to 779 were refused; written
 * and pushed with the option plumbed and not the default, before the default
 * moves or any sweep is run.
 *
 * RULE 780. WHAT THIS ROUND IS. The candidate of rules 772 to 779, with what
 * refused it answered. `DEFAULT_AIRBURST_RADIATION` goes from `efficiency` to
 * `atap`: the flash in the air is, at every range, the stronger of the
 * luminous efficiency's and the heat load Johnston & Stern's correlation lays
 * along the entry's path (`effects/atapRadiation.ts`), as rule 772 describes.
 * Three things change from that round. (i) The correlation is read at the
 * edge of its fitted range one input at a time, none through another: a
 * faster body as one at 18 km/s, both its flux and the time it takes to cross
 * a step; a wider cloud as one of 200 m; the view angle's exponent
 * a = 0.69 (V/H)² at most its fitted 2.24; the altitude always the body's
 * own, below 10 km as Johnston & Stern read it along their Tunguska paths.
 * Rules 772 to 779 lifted the altitude to V/1.8 where V/H passed 1.8, which
 * read a faster body lower in the sky as a slower one higher up. (ii) The
 * footprint's area is summed segment by segment where the exposure reaches it,
 * on a polar grid centred on the path's samples weighted by the heat each lays
 * straight beneath it. Rules 772 to 779 took each ray's farthest crossing
 * about the point under the burst, which counted the ground between that point
 * and a footprint far uprange, as a shallow entry lays it. (iii) The harness
 * (`scripts/benchmark/invariants.ts`): the cause of a blast ring that shrinks
 * is read from runs without the radiation's integral — a burst's altitude and
 * energy, which no flash moves — and the watchdog, which reads a scenario's
 * runs that do not return, waits 10 s, not 2.
 *
 * RULE 781. WHY: B-095, as rule 773 says, and what refused rules 772 to 779.
 * Their condition (b) failed on the own seed by two scenarios whose four
 * hundred runs, 390 of them to read a blast ring's cause, took 2.6 s at 6.5 ms
 * a run; and on the unseen seed two bodies drew burn rings that shrank as they
 * grew: a 56.5 m body at 14.3 km/s and 17.6 degrees, whose footprint lay far
 * from the point under its burst, and a 14.7 m iron at 27.3 km/s and 6.4
 * degrees.
 *
 * RULE 782. THE SOURCE, and whose each part is: as rule 774. This project's,
 * besides: the reading at the edge one input at a time, the time read at the
 * edge speed, the centre and the summed area.
 *
 * RULE 783. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, by scripts
 * outside the product. Johnston & Stern's six cases of Fig. 24 give optimal
 * radii of 43.4, 38.9 and 35.6 m at 30 degrees and 41.2, 37.1 and 34.2 m at
 * 45, against their 40.5, 36.8, 33.5, 40.5, 37.5 and 35.0: within 7.2 %.
 * Across 10 560 steps of 2 % — 12 to 30 km/s, 8 to 70 degrees, 3 000 and
 * 7 000 kg/m³, 0.3 and 2 MPa, 10 to 260 m — no burn or fire ring falls, where
 * the lifted altitude let five fall and a sharp cut at the fitted range's edge
 * more than a hundred. The 56.5 m body's third-degree ring now grows with it,
 * 8 196 to 8 637 m. The 14.7 m iron's second-degree ring still falls, 3 442 to
 * 3 406 m, and not by the radiation: a 1 % larger body breaks higher, 5.81 to
 * 6.01 km, and bursts higher, 4.72 to 4.89 km — the neighbourhood of B-091,
 * where the paper's breakup rises with the body's size, which the unseen seeds
 * have printed under the luminous efficiency too. The two scenarios the
 * watchdog stopped take 53 and 132 ms with the causes read from runs without
 * the integral, and print the same findings to the letter as with it. The
 * presets: Tunguska's first-degree flash radius from 3.6 to 10.1 km, its field
 * at 10 km from 4.6 to 8.4 J/cm², and still no burn of the second or third
 * degree nor any char; Meteor Crater's third-degree ring from 7.15 to 8.42 km
 * and its fires likewise, the iron's own radiation near the ground added to
 * its fireball; the field of Chelyabinsk and Sikhote-Alin rises under every
 * ring's threshold; the others do not move. A radiating impact takes 4 to
 * 15 ms.
 *
 * RULE 784. WHAT IT COSTS, DECLARED: rule 776's, and the reading at the edge
 * as rule 780 (i) makes it. The altitude below 10 km is read as Johnston &
 * Stern read it, which extends their density factor below their matrix; a body
 * faster than 18 km/s is read at the least it lays. An impact that reaches the
 * ground adds its path's radiation to its fireball, as Meteor Crater's rings
 * show, where the Earth Impact Effects Program draws the fireball alone: I1's
 * clause of the thermal exposure names it. And the harness's watchdog waits
 * five times longer.
 *
 * RULE 785. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) in CI: rule 777 (a) (`atapRadiationRules.test.ts`); across a grid of
 *       speeds, angles and densities no burn or fire ring falls as a body
 *       grows by 3 %; the 56.5 m body's rings grow; and the harness's causes
 *       read from runs without the integral are those read with it;
 *   (b) on one commit, 5 000 impacts of the own seed and of
 *       `ATAP_AGAIN_HELD_OUT_SEED`, which no run has used, both laws read by
 *       the same harness: no key G5 reads appears under `atap` that
 *       `efficiency`'s run on the same seed does not print; the scenarios
 *       whose failures differ are listed;
 *   (c) the presets move as rule 783 lists them, and no other;
 *   (d) the report regenerated on the new default keeps the release gate at
 *       PASS.
 *
 * RULE 786. WHAT DECIDES: as rule 778. Adopted when (a) to (d) hold: then
 * B-095 is closed, and G6 for impacts reads the flash as Andrea decided — the
 * field's model where it reads, and beyond it PAIR's nominal, the field's own,
 * printed beside it. Otherwise refused, the default stays `efficiency`, B-095
 * stays open, and the failing items are printed.
 *
 * RULE 787. WHAT IT DOES NOT CLAIM: as rule 779.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `cfaf022` and the four sweeps made on that commit
 * (`benchmark/results/invariants-2026-09-21-52.json` and `-53` on the own
 * seed, `efficiency` and `atap`; `-54` and `-55` on
 * `benchmark-2026-09-21-heldout-atap-2`). Then the default moved.
 *
 * (a) HOLDS. `atapRadiationRules.test.ts` and `atapRadiationAgainRules.test.ts`,
 *     in CI on `cfaf022`: rule 777 (a); no burn or fire ring falling at
 *     shallow entries; the 56.5 m body's rings growing; the causes read from
 *     runs without the integral the same as with it, the two stopped
 *     scenarios well within the watchdog.
 * (b) HOLDS. On the own seed G5 reads 0 under both laws. On the unseen seed
 *     it reads 8 under both, the same keys and the same scenario: a 1.59 m
 *     body at 9.9 km/s whose burns and blast vanish at B-091's switch. The
 *     scenarios whose failures differ print only keys G5 does not read: burn
 *     rings that move by more than 5 % on a step inside a regime — contours
 *     born or steep there, which G5 reads only where the regime switches —
 *     printed as the check was; and on the unseen seed one field sample at
 *     3 km, steep and not a jump.
 * (c) HOLDS. The presets move as rule 783 lists them, and no other.
 * (d) HOLDS. The report regenerated on the new default: release gate PASS.
 *
 * What the new default asked of the tests of other rounds, each named: B-041
 * and rules 698 to 705 read the luminous efficiency's flash, whose fluences
 * and placement they hold; rules 683 to 690 and 764 to 771 read blast sources
 * and craters, which no flash moves, from runs without the integral. And
 * time: a radiating impact takes 3 to 8 ms on the presets, where it took
 * under 0.2, so the tests that run such impacts by the hundred have a budget
 * of their own — the Monte Carlo's determinism and wrappers, rules 255 to
 * 260, 548 to 554, 630 to 637, 691 to 697, 714 to 721, 730 to 738 and 756 to
 * 763, and the comparison with the Earth Impact Effects Program — and nothing
 * else of theirs moved.
 *
 * What it asked of the product, measured on the machine that ran the sweeps,
 * in Chromium on its GPU. The toll band's two hundred draws, which the
 * application makes after every Launch on the globe's own thread, take 0.8 to
 * 1.4 s for a radiating preset where they took 4 to 14 ms: launched on Meteor
 * Crater, the globe stopped for some 0.95 s. They are drawn in slices that
 * hand the thread back to the browser (`useAppStore.ts`), the same draws in
 * the same order (`tollBand.test.ts`): the globe then draws some 110 frames
 * while the band is drawn, none more than 55 ms apart, and the toll comes
 * some 0.6 s later than it did. The Monte Carlo's thousand runs take 5 to
 * 8 s in their worker, where they took 60 to 200 ms: declared, not changed.
 *
 * So `DEFAULT_AIRBURST_RADIATION` is `atap`, B-095 is closed, and G6 for
 * impacts is read as Andrea decided: the flash is the field's model where it
 * reads, and PAIR's nominal, the field's own, beyond it.
 */

/** Rule 785 (b): the seed of the run on scenarios nobody has seen. */
export const ATAP_AGAIN_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-atap-2';

export const ATAP_RADIATION_AGAIN_RULES = 'rules 780 to 787, fixed 21 September 2026';
