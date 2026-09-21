/**
 * Rules 730 to 738 — an airburst's seismic magnitude from the air that
 * carries it. For impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, B-092,
 * by Andrea's choice of that afternoon among three ways to meet it; written
 * and pushed with the option plumbed and not the default, before the default
 * moves or any sweep is run on the candidate.
 *
 * RULE 730. WHAT THIS ROUND IS. A new option, `airburstSeismic`, and its
 * candidate `harkrider` against the default `program`. Under the candidate a
 * complete airburst's seismic magnitude is the larger of two terms:
 *
 *   (i) the air's: Harkrider, Newton & Flinn (1974)'s Ms (their Table 4, as
 *       `events/impact/airburstSeismic.ts` holds it) for the airburst's blast
 *       yield at its burst altitude, over a continent where the scenario has
 *       no water and over an ocean where it has;
 *  (ii) the ground's: the program's relation (Collins et al. 2005 Eq. 40*) on
 *       the share of the energy the body keeps at its burst that reaches the
 *       ground — 1 − z/R of it where the burst altitude z is below the
 *       fireball radius R of that energy, none above: B-093's share, adopted
 *       for the flash by rules 714 to 721.
 *
 * Where neither term covers a scenario — the yield outside 1 kT to 10 MT or
 * the altitude outside 0.3048 to 80 km, and the burst above its fireball — no
 * magnitude is printed and the product says why (the third decision of 21
 * September 2026: nothing printed where no verified relation holds). The
 * magnitude's range is the same larger-of-two, with the ground term read at
 * the efficiency range Collins et al. give (1e-5 to 1e-3) and the air term
 * held; there is no range where there is no magnitude, and the liquefaction
 * radius is none there. Nothing else moves: a partial airburst and an impact
 * on the ground keep the program's magnitude, which I1 holds.
 *
 * RULE 731. WHY: B-092. The program reads a complete airburst's seismic source
 * as the kinetic energy the body keeps at its burst; a body 1 % larger bursts
 * about 160 m lower with some 3 % less of its energy kept, and its magnitude
 * falls as it grows — the 38 magnitudes G5 reads on the own seed, its last. An
 * airburst shakes the ground through its air blast: the Rayleigh waves of
 * atmospheric explosions are the air's coupling into the ground, which
 * Harkrider et al. computed for yields and heights of burst, and which
 * Ben-Menahem (1975) inverted to read Tunguska's energy and altitude from its
 * seismograms. Below its own fireball a burst's kept energy strikes the
 * ground as the swarm of a partial airburst does, so at a burst altitude of
 * zero the magnitude is the program's for the partial airburst it becomes.
 *
 * RULE 732. THE CONSTRUCTION, and whose each part is. The table, and its three
 * readings of misprinted or blank cells, are Harkrider et al.'s
 * (`airburstSeismic.test.ts`). The yield is the blast yield the product draws
 * an airburst's blast rings from (I3), the altitude its burst altitude; the
 * interpolation is linear in altitude and in the logarithm of the yield. The
 * ground's share is Glasstone & Dolan's surface burst, as rules 714 to 721 read
 * it. Taking the larger term is this project's, as its rings take the larger
 * of a surface ring and an air ring: two sources add in energy, and the
 * larger understates their sum by at most 0.2 of a magnitude, where the two
 * are equal. The two terms are not one scale — the air's is a surface-wave
 * magnitude at 10 000 km over a model Earth, the ground's an energy magnitude
 * — and this is declared, not reconciled.
 *
 * RULE 733. WHAT WAS LOOKED AT BEFORE THESE RULES, on the own seed only, by a
 * script outside the product. Of 1 097 complete airbursts, 306 get no
 * magnitude (112 below 1 kT, 211 above 10 MT — median 55 MT, the largest
 * 67 835 MT — and five bursts below 0.3048 km and five above 80 km, less
 * those with a ground term). The magnitude falls as the body grows by 1 % in
 * 20, against the program's 38: in 19 the air term decides it and at the
 * larger body's yield and the smaller body's altitude it does not fall; in
 * one, a 1.8 MT burst at 4.6 km, it does, where the continental table itself
 * falls from 1 to 3 MT. It rises by more than 0.05 on a step of 0.1 % in two,
 * both the ground term born below the fireball of a burst the table does not
 * cover (67.5 MT at 650 m; 210 m), a logarithm of a share growing from
 * nothing. The presets: Tunguska 4.70 to 4.31, Chelyabinsk 4.24 to 4.00,
 * Sikhote-Alin 2.08 to about 2.48; the five that reach the ground unchanged.
 * Harkrider's table was read before any of this, and its three cells were
 * decided by its own columns, not by these figures.
 *
 * RULE 734. WHAT IT COSTS, DECLARED.
 *
 *   - The sky, printed and deciding nothing: Tunguska's Rayleigh waves read
 *     Ms about 5.0 (4.5 to 5.0, Ben-Menahem 1975), where the program reads
 *     4.70 and the candidate 4.31; Chelyabinsk's read Ms 3.7 (Tauzin et al.
 *     2013), where the program reads 4.24 and the candidate 4.00. Two events,
 *     one read on 1908's regional seismograms and each on its own stations,
 *     against a table computed at 10 000 km: they cannot choose between two
 *     relations this close, and the rules do not ask them to.
 *   - I1: the magnitude of a complete airburst departs from the program's,
 *     named, with rule 731 as its reason (G1 allows it).
 *   - About a quarter of complete airbursts print no magnitude, where the
 *     program printed one from a source rule 731 says is not theirs.
 *
 * RULE 735. THE HARNESS, read the same way for both laws. A magnitude that
 * falls as the body grows is asked for a cause, as rules 683 to 690 ask one
 * of a blast ring (`validation/magnitudeSource.ts`):
 *
 *   (a) "the source altitude": the air term decides the magnitude of the
 *       smaller body; its source — the blast yield and the burst altitude —
 *       moves without a step between the two (rule 662's search on each, as
 *       for a blast ring); and at the larger body's yield and the smaller
 *       body's altitude the air term does not fall;
 *   (b) "the table's period": the same, but at the held altitude the air term
 *       falls with the yield, which the table does only where its peak moves
 *       to a period twice as long (continental, 3.6576 and 4.8768 km, from 1
 *       to 3 MT): the source's own reading of Ms, which divides by the period;
 *
 * and nothing else is explained. A magnitude that moves by more than 0.05 on
 * the step of continuity is searched by halving, as rule 662 searches a field
 * sample: steep, it is printed "steep, not a jump (magnitude)" and G5 does not
 * read it; a jump is "continuous" as before. A run with no magnitude is not
 * compared.
 *
 * RULE 736. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) in CI: the relation holds Table 4; under the candidate every body
 *       that is not a complete airburst keeps the program's magnitude, range
 *       and liquefaction radius to the bit; a complete airburst's magnitude
 *       is the larger term where there is one and none where there is none;
 *       at the switch to a partial airburst the magnitude is continuous;
 *   (b) on one commit, 5 000 impacts of the own seed and of
 *       `AIRBURST_SEISMIC_HELD_OUT_SEED`, which no run has used, both laws:
 *       under the candidate G5 reads no magnitude — every fall explained by
 *       (a) or (b) of rule 735, every jump steep — and no key G5 reads
 *       appears under it that the program's run on the same seed does not
 *       print; the scenarios whose failures differ are listed;
 *   (c) the presets move as rule 733 lists them, and no other;
 *   (d) the panel and the report page print no number and say why where the
 *       magnitude is none, in both languages, read headless on one scenario;
 *   (e) the report regenerated on the candidate keeps the release gate at
 *       PASS.
 *
 * RULE 737. WHAT DECIDES. Adopted when (a) to (e) hold. Otherwise refused:
 * the default stays `program`, B-092 stays open, and the failing items are
 * printed.
 *
 * RULE 738. WHAT IT DOES NOT CLAIM. That an airburst's magnitude is now right
 * to the sky, or that the two terms are one magnitude; that the table covers
 * what it does not — nothing is printed there; or that a burst's kept energy
 * reaches the ground by the share the flash uses for any reason but the one
 * rules 714 to 721 give.
 */

/** Rule 736 (b): the seed of the run on scenarios nobody has seen. */
export const AIRBURST_SEISMIC_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-seismic';

export const AIRBURST_SEISMIC_RULES = 'rules 730 to 738, fixed 21 September 2026';
