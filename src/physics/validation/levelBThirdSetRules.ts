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
