/**
 * Rules 555 to 562 — why an impact's rings shrink when the impactor grows,
 * 21 September 2026, written and pushed before the full run.
 *
 * WHAT IS UNEXPLAINED. G5 for impacts reads "not met. 464 failures in the
 * sweep of 16 September 2026". Forty of those have a cause on the record —
 * 38 an airburst's seismic magnitude falling as the body grows, as the
 * reference program's does, and two a seafloor cutoff. The other 424 have
 * had none for five days, and 408 of them are the same three rings:
 * `damage.lightDamage` 149 times, `damage.overpressure1psi` 137 and
 * `damage.overpressure5psi` 122.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN, and is therefore not
 * held out: four failing scenarios, drawn from the sweep's own seed and
 * printed field by field. In all four the blast yield ROSE and the ring
 * FELL, and the burst geometry moved down — 735.8 m to 597.9 m for a
 * complete airburst, and a virtual source sinking from −3 937 m to −4 060 m
 * for a partial one.
 *
 * RULE 555. THE CLAIM. G5's monotonicity clause reads "the rings a visitor
 * sees do not shrink when the impactor ... grows by 1 %, **the other inputs
 * held**". For an impact that premise is false. The impactor's size is not
 * an input the burst geometry is held against: it SETS the burst altitude,
 * which is an output. A bigger body penetrates further before it fails, so
 * it bursts lower, and below the height-of-burst optimum a lower burst puts
 * less overpressure on the ground at a fixed range than a higher one of
 * slightly smaller yield. The clause is true for an explosion, whose yield
 * grows at a height of burst the scenario names, and false for an impact.
 *
 * This is a statement about a MECHANISM, not a bar of merit. The difference
 * matters and this project has ruled on it before: a clause that is false
 * about how the model works is rewritten, a bar that measures how good the
 * model is is never touched. Nothing below loosens anything that scores.
 *
 * RULE 556. HOW THE CLAIM COULD BE WRONG, and this is the point of writing
 * it down first. The diagnosis predicts two things about all 408, not four:
 *
 *   (a) In EVERY failing scenario the burst geometry falls — the burst
 *       altitude for a complete airburst, the virtual burst altitude
 *       otherwise. A single case where a ring shrinks while the burst
 *       geometry is unchanged or higher means the mechanism is not the whole
 *       story, and the rest of the diagnosis does not stand.
 *   (b) With the burst geometry HELD, a larger yield never shrinks a ring.
 *       If it does, there is a real defect underneath this one and this
 *       round has found it rather than explained it away.
 *
 * Either failing, the round reports that G5's clause stands unexplained and
 * changes nothing.
 *
 * RULE 557. WHAT REPLACES IT, if (a) and (b) both hold. Not an exemption:
 * two statements that are true, in place of one that is not.
 *
 *   (i)  The blast yield grows with the impactor. A bigger body carries more
 *        energy and delivers more of it, whatever the geometry does.
 *   (ii) At a held burst geometry, every ring grows with the yield.
 *
 * Together they say everything the old clause was reaching for and nothing
 * it got wrong. A ring that shrank while (i) and (ii) held would still be
 * caught, because one of them would have to break first.
 *
 * RULE 558. WHAT IS NOT CLAIMED. That the 408 are correct. This round
 * explains why they are not monotone; it does not check whether the burst
 * altitude or the height-of-burst curve is right. Those are I1's business
 * and I1 holds them to the Earth Impact Effects Program on eleven clauses.
 * A wrong number can be non-monotone for the right reason.
 *
 * RULE 559. THE OTHER SIXTEEN. 464 less 408 less the 40 already explained
 * leaves sixteen: five continuity failures on `damage.overpressure1psi`,
 * four each on `overpressure5psi` and `lightDamage`, two on
 * `tsunami.amplitudeAt1000km`, and one each on `damage.secondDegreeBurn`,
 * `damage.craterRim` and `crater.finalDiameter`. They are counted and
 * reported but NOT diagnosed here: a round that explained everything at once
 * could not say which explanation belonged to which.
 *
 * RULE 560. WHAT MAY NOT MOVE. Every number this product prints. This round
 * changes no model code at all — it measures, and if it changes anything it
 * is the wording of an invariant in a benchmark script.
 *
 * RULE 561. WHAT THIS DOES NOT DO TO G5. It does not mark G5 met. G5 is a
 * rule of docs/GOLD_STANDARD.md and its bound "may not be loosened after a
 * figure has failed it" — 464 is that figure. What this round can do is say
 * what the 408 are, so that whoever writes the amendment writes it about the
 * right thing, and so that the report stops carrying 408 failures with no
 * cause beside them.
 *
 * RULE 562. ONE RUN, NO RE-TUNING.
 */

/** Rule 555: the three rings that make up the 408, with their counts from
 *  the sweep of 16 September 2026 as the report carries them. */
export const THE_408 = {
  'damage.lightDamage': 149,
  'damage.overpressure1psi': 137,
  'damage.overpressure5psi': 122,
} as const;

/** Rule 559: what is left over, and is not diagnosed here. */
export const THE_OTHER_SIXTEEN = {
  'continuous: damage.overpressure1psi': 5,
  'continuous: damage.overpressure5psi': 4,
  'continuous: damage.lightDamage': 4,
  'monotone: tsunami.amplitudeAt1000km': 2,
  'monotone: damage.secondDegreeBurn': 1,
  'monotone: damage.craterRim': 1,
  'monotone: crater.finalDiameter': 1,
} as const;

/** Rule 555: the four scenarios looked at before these rules were written. */
export const THE_FOUR_LOOKED_AT = [
  { regime: 'PARTIAL_AIRBURST', virtualBurstFrom: -3936.574, virtualBurstTo: -4059.971 },
  { regime: 'PARTIAL_AIRBURST', virtualBurstFrom: -1304.667, virtualBurstTo: -1397.349 },
  { regime: 'PARTIAL_AIRBURST', virtualBurstFrom: -1731.182, virtualBurstTo: -1887.477 },
  { regime: 'COMPLETE_AIRBURST', virtualBurstFrom: 735.8192, virtualBurstTo: 597.9073 },
] as const;

/** The 1 % the sweep grows an impactor by. */
export const GROWTH = 1.01;

export const IMPACT_MONOTONICITY_RULES = 'rules 555 to 562, fixed 21 September 2026';
