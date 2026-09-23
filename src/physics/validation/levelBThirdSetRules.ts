/**
 * Rules 933 to 940 — the third set of events, and what admits an event to it.
 * Written on 23 September 2026, evening, on Andrea's word («Sì, procedi»),
 * after the reviewer's reply to level B's second round, which set the order:
 * this set first, then the defect of the crater at low speed, then the round
 * on the dynamics of fragmentation, then the model that comes out of them
 * judged on this set. Written before any candidate is searched for.
 *
 * RULE 933. WHAT THIS IS. The bench on which the model that comes out of the
 * crater's defect and the round on fragmentation is judged — the only events
 * that can count for a new request of level B (rule 932). It is frozen before
 * the rules of the crater's defect are written, and nothing of its events —
 * beyond the search results and abstracts that name them — is read until the
 * model it judges is frozen, as rule 877 kept the second round's.
 *
 * RULE 934. AN ENTRY BODY IS ADMITTED if all hold:
 *   (a) an altitude of its fragmentation or of its flares was measured
 *       directly — by calibrated cameras, radar, or a light curve placed on a
 *       measured trajectory — with its uncertainty, in a peer-reviewed paper
 *       or one accepted by a journal; an altitude derived from an assumed
 *       strength or fitted by a model of the entry does not admit it (rules
 *       904 and 921);
 *   (b) its speed and angle come from its measured trajectory or its orbit
 *       before impact;
 *   (c) its size comes from its brightness in a telescope before impact, or
 *       else from the mass its source gives — photometric or dynamic — which
 *       leans on the light curve: then it is declared an input that depends
 *       on a target (rule 872), and a stress run widens it by a factor of
 *       three each way, reported and never scored;
 *   (d) its outcome is known: meteorites recovered or searched for, and no
 *       crater.
 *
 * RULE 935. A GROUND CASE IS ADMITTED — a body that reached the ground at
 * speed, or dug a crater — if its speed and angle come from an instrumental
 * trajectory or an orbit, and its mass from what was recovered, from the
 * fireball's dynamics, or from a telescope: never from the crater or the
 * pit it made (rule 860(c)).
 *
 * RULE 936. EXCLUDED, whatever their sources: every event of level B's first
 * and second rounds and of their development, seen and diagnostic sets
 * (rules 857, 867 and 876, candidates not counted included); every row of
 * I2's 357 CNEOS fireballs; every fall in the sample of Borovička, Spurný &
 * Shrbený (2020), from which the strength's priors came; every event named in
 * a preset, a test, a fixture, a benchmark result or a table of thresholds.
 *
 * RULE 937. AN EVENT READ FOR DEVELOPMENT LEAVES THE SET FOR GOOD (the
 * reviewer): one that is used to write, choose or tune any part of the model —
 * the crater's defect, the round on fragmentation, or anything after — can
 * never count for level B; its leaving is written down with its reason, and
 * the counts of rule 939 are read on what remains.
 *
 * RULE 938. THE AUDIT, before the set is frozen: the repository searched by
 * each candidate's name, date and place, as rule 903 searched the second
 * round's; a candidate found in any data is excluded by rule 936.
 *
 * RULE 939. WHAT MAY NOT HAPPEN. After the set is frozen no event is added to
 * it. A request of level B needs, when its sources are pinned, at least three
 * admitted entry bodies and at least one admitted ground case still in the
 * set; with fewer, the round that tests the new model reports compatibility
 * case by case and asks for no class B.
 *
 * RULE 940. THE OBSERVABLES, as the rounds before fixed them: E1 the outcome;
 * E2 the altitude of the first fragmentation, only where it was measured and
 * is unique; E3 the compatibility with the flare heights, read on the draws
 * that satisfy E1 (rules 921, 928 to 930); for a ground case, its outcome, and
 * its crater's or pit's size only where no input was fitted to it. The model's
 * three states for the ground — a crater it can compute, no crater, and out of
 * its domain (the reviewer, on the defect of the crater at low speed) — are
 * read as three: "out of its domain" never counts as "no crater".
 */

/** Rule 939: what a request of level B needs from this set. */
export const THIRD_SET_MIN_ENTRY_BODIES = 3;
export const THIRD_SET_MIN_GROUND_CASES = 1;

/** Rule 934(c): the stress run of a mass that leans on the light curve. */
export const THIRD_SET_MASS_STRESS_FACTOR = 3;

/**
 * Rules 941 to 944 — the third set, frozen. Written on 23 September 2026,
 * evening, after rules 933 to 940 were pushed (11e3062), from search results
 * and abstracts only: no source of these events has been opened.
 *
 * RULE 941. THE SET.
 *   (a) Entry bodies, each admitted or dropped by rule 934 when its sources
 *       are pinned: Winchcombe (28 February 2021, CM2; McMullan et al. 2024,
 *       MAPS), Golden (4 October 2021, L/LL5; Brown et al. 2023, MAPS), Madura
 *       Cave (19 June 2020, L5; Devillepoix et al. 2022, MAPS), Hamburg,
 *       Michigan (17 January 2018, H4; Brown et al. 2019, MAPS), Traspena
 *       (18 January 2021, L5; Andrade et al. 2023, MNRAS) and Cavezzo (1
 *       January 2020, L5; Gardiol et al. 2021, MNRAS).
 *   (b) Conditional entry bodies: Arpu Kuilpu (1 June 2019, H5; Shober et
 *       al. 2022, MAPS), whose fireball the abstract says fragmented very
 *       little — admitted only if an altitude was measured; Kindberg (19
 *       November 2020, L6), admitted only if a peer-reviewed analysis of its
 *       fireball exists when the sources are pinned.
 *   (c) Ground cases: none admissible was found. Ådalen (7 November 2020, the
 *       first instrumentally documented fall of an iron) is the row
 *       2020-11-07T21:27:04Z of I2's CNEOS set; Carancas and Sterlitamak
 *       belong to the earlier rounds, Sikhote-Alin to development. As rule 939
 *       stands, no request of level B can rest on this set until a ground case
 *       is admitted; the reviewer is asked whether one may be added later by
 *       rules of its own, pinned before its model is run, as rule 867 allowed
 *       a further body of the entry. Until he answers, nothing is added.
 *   (d) Excluded by rule 936, found while searching: Flensburg (12 September
 *       2019; CNEOS row 12:49:47), Novo Mesto (28 February 2020; 09:30:34),
 *       Ozerki (21 June 2018; 01:16:20) and Viñales (1 February 2019;
 *       18:17:09); and every fall of Borovička et al. 2020 — Jesenice,
 *       Renchen, Hradec Králové, Košice, Stubenberg, Žďár nad Sázavou, Maribo,
 *       Križevci, Benešov, Morávka and Ejby among them.
 *
 * RULE 942. THE AUDIT (rule 938), 23 September 2026, evening: the repository
 * searched by each candidate's date and name. None is in any data. The hits
 * are other things: 2020-01-01, a placeholder date in the fireball tests and
 * the shaking-field script; 2021-10-04 and 2019-06-01, earthquakes; "Madura",
 * the island's earthquakes off Java; "Hamburg", the firestorm of 1943;
 * "Cavezzo", the Emilia earthquake of 2012; "Golden", the golden dataset.
 *
 * RULE 943. WHAT WAS SEEN, declared as rule 878 declared the second round's:
 * the search results quoted, for Winchcombe, fragmentation from 0.08 to
 * 0.1 MPa and a last flare near 35 km under about 0.6 MPa; for Golden, a 54°
 * entry at 18 km/s, a mass of about 70 to 78 kg and a major flare near 31 km
 * under 3.3 MPa; for Madura Cave, 14.00 km/s at 58° and fragmentations at 36
 * and about 26 km; for Hamburg, 15.83 km/s and two flares at 24.1 and
 * 21.7 km under 5 to 7 MPa; for Traspena, 76.7°, about 1.15 m and 2 620 kg,
 * and three flares under 1.5 to 4.2 MPa; for Cavezzo, 68°, 12.8 km/s and
 * fragmentations at 32.6 and 30.7 km; for Arpu Kuilpu, very little
 * fragmentation. These pressures bear on the physics the round on
 * fragmentation will write: they are written here so that its priors can be
 * seen to come from elsewhere. The compilation "Bolide light curve
 * systematics from 75 recovered meteorites" (Jenniskens 2026, MAPS) may hold
 * several of them; it is not read while the model is developed.
 *
 * RULE 944. FROM THIS COMMIT no event is added to the set, save a ground case
 * by the reviewer's leave (rule 941(c)); none of its sources is opened until
 * the model it judges is frozen; an event read for development leaves it for
 * good (rule 937).
 */

export type ThirdSetRole = 'entry' | 'entry-conditional' | 'excluded';

/** Rule 941: every candidate named, with its role. */
export const THIRD_SET_EVENTS: Readonly<Record<string, ThirdSetRole>> = {
  Winchcombe: 'entry',
  Golden: 'entry',
  'Madura Cave': 'entry',
  Hamburg: 'entry',
  Traspena: 'entry',
  Cavezzo: 'entry',
  'Arpu Kuilpu': 'entry-conditional',
  Kindberg: 'entry-conditional',
  Ådalen: 'excluded',
  Flensburg: 'excluded',
  'Novo Mesto': 'excluded',
  Ozerki: 'excluded',
  Viñales: 'excluded',
};

/** Rule 941(c): the ground cases admitted — none yet. */
export const THIRD_SET_GROUND_CASES: readonly string[] = [];

/** Rule 942: each candidate's date (UTC), as the audit searched it. */
export const THIRD_SET_DATES: Readonly<Record<string, string>> = {
  Winchcombe: '2021-02-28',
  Golden: '2021-10-04',
  'Madura Cave': '2020-06-19',
  Hamburg: '2018-01-17',
  Traspena: '2021-01-18',
  Cavezzo: '2020-01-01',
  'Arpu Kuilpu': '2019-06-01',
  Kindberg: '2020-11-19',
};
