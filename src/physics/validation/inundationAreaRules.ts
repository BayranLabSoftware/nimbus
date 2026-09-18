/**
 * What a flow covers, which is the thing the field actually predicts.
 *
 * Nimbus publishes a lahar's *runout length*, `L = 0.05 · V^0.38` km, and the
 * module that carries it says plainly what it is: "a runout-LENGTH recast" of
 * Iverson, Schilling & Vallance (1998), whose published relation is for
 * inundation *area* and not for length, "calibrated to the MSH observation —
 * not a transcription of a numbered Iverson equation".
 *
 * On 18 September 2026 the globe was made to draw that runout, because the
 * model published it and the picture said nothing (B-054). Drawing it as a
 * disc is what this round is about: a lahar of 5 × 10⁷ m³ runs 42.1 km by our
 * law, and a disc of that radius covers 5 576 km² where the field's own
 * relation gives **27.1 km²** — two hundred times more ground claimed than the
 * literature puts at risk. The reach is defensible; the shape is not, and the
 * visual contract's word "placeholder" does not carry a factor of two hundred.
 *
 * Meanwhile the landslide module computes `characteristicArea = V^(2/3)` and
 * calls it "cosmetic for the report; not consumed downstream". That is the
 * field's own variable, missing only its coefficient.
 *
 * The source, read for this round: Griswold, J. P. & Iverson, R. M. (2008),
 * "Mobility Statistics and Automated Hazard Mapping for Debris Flows and Rock
 * Avalanches", USGS Scientific Investigations Report 2007-5276 (the PDF has
 * been in `scratchpad/flows` since 16 September). Its Table 6 gives, for a
 * fixed 2/3 slope:
 *
 *   lahars (Iverson et al. 1998)  A = 0.05 V^(2/3)   B = 200 V^(2/3)
 *   debris flows                  A = 0.1  V^(2/3)   B = 20  V^(2/3)
 *   rock avalanches               A = 0.2  V^(2/3)   B = 20  V^(2/3)
 *
 * with A the maximum inundated cross-sectional area and B the total inundated
 * planimetric area, both in m² for V in m³.
 *
 * The rules, fixed on 19 September 2026 and numbered after the two hundred and
 * one before them, written before any number of ours is scored:
 *
 *  202. **What was looked at, and what was done to it.** The report's text and
 *       its Appendix A, extracted from the PDF to
 *       `scratchpad/flows/griswold-appendix-a.json`: 207 events with a volume,
 *       and with a cross-sectional area or a planimetric area or both. The
 *       extraction is verified against the report's own counts — 64 debris
 *       flows of which 50 carry A and 44 carry B, 143 rock avalanches of which
 *       142 carry B — and it matches on five of those six figures. It finds
 *       **thirteen** rock avalanches with a cross-sectional area where the
 *       report says twelve; the thirteen are listed in the outcome below and
 *       the discrepancy is declared rather than reconciled by dropping one.
 *
 *       The laws were then re-derived from the extracted data, as a check on
 *       both: with the slope free, debris flows give A = 0.219 V^0.587 against
 *       a published 0.22 V^0.59 and B = 10.17 V^0.731 against 10 V^0.73; rock
 *       avalanches give A = 0.097 V^0.713 against 0.10 V^0.71. The one that
 *       does not land is the rock avalanches' planimetric fit, 2.35 V^0.787
 *       against a published 5.3 V^0.75 — two parameterisations of the same
 *       cloud, 12 % apart at the middle of the range and far apart at its
 *       ends. No Nimbus quantity has been compared with any of it.
 *
 *  203. **The candidate (`inundationArea`).** A flow publishes the two areas
 *       the field publishes: the planimetric area it covers and its maximum
 *       cross-section, each α · V^(2/3) with α from the table above, chosen by
 *       what the flow is — a lahar, a debris flow, a rock avalanche. Nothing
 *       is fitted here and no coefficient is ours: they are transcribed, and
 *       rule 202's re-derivation is the check on the transcription.
 *
 *       The runout length stays. The field publishes none — LaharZ does not
 *       predict a distance, it fills a valley from a DEM until the accumulated
 *       area reaches B — and ours is calibrated on Mount St Helens 1980, where
 *       it gives 42.1 km against about 50 observed. What the two together give
 *       is the thing neither gives alone: a **swath width**, B / L, which for
 *       that lahar is 640 m. A flow is then a ribbon, and a ribbon is what the
 *       globe can draw without claiming the wrong ground.
 *
 *  204. **What decides.** Adopted unless a guard fails:
 *       (a) the transcribed coefficients reproduce the report's own fits on
 *           the extracted data, which rule 202 has already checked;
 *       (b) no number that a rule has read moves: the runout length is
 *           untouched, and `docs/VALIDATION_REPORT.json` regenerates byte for
 *           byte;
 *       (c) the release gate stays PASS and the suite stays green;
 *       (d) the globe stops claiming the area it does not have — the audit of
 *           `scripts/benchmark/globe-audit.ts` finds the drawn shape carrying
 *           the published area, and no contradiction anywhere else.
 *
 *  205. **What is measured, and what it is worth.** The scatter of the 207
 *       events about the law, in log10: this becomes the published band, in
 *       place of the factor of two that `uq/conventions.ts` asserts today
 *       without a source. It is measured **in sample** — on the very events
 *       the coefficients were fitted to — and is therefore a statement about
 *       the spread of the relation, not a validation of it. G3 asks for a band
 *       scored on a held-out set and this is not one; the report must say so
 *       where it prints it.
 *
 *  206. **What an adoption does.** The result carries the two areas and the
 *       swath width; the report and the panel print them with Griswold &
 *       Iverson's citation; the globe draws the flow as a ribbon of that width
 *       along the runout rather than as a disc; and the visual contract stops
 *       saying "placeholder" about a shape that is no longer a placeholder for
 *       the area, while still saying that the *route* is not the valley's.
 *
 *  207. **What these rules cannot settle.** Where the flow goes. B is how much
 *       ground a flow covers, not which ground: that is a DEM and a drainage
 *       network, which is what LaharZ is and what this project has not
 *       written. A ribbon along a straight runout is honest about area and
 *       silent about route, and the contract has to keep saying the second
 *       part. Nor does this touch the pyroclastic reach, which is still a
 *       Nimbus volume scaling with no published law behind it — that is V4's
 *       other half and it waits for the energy cone.
 */

/*
 * ===========================================================================
 * The outcome of rules 202 to 207, 19 September 2026: ADOPTED, in part
 * ===========================================================================
 *
 * The rules were pushed in `cb0286b`, with the extracted set beside them and
 * nothing of ours yet compared to it.
 *
 * What was adopted. A lahar now publishes the ground it covers, B = 200·V^(2/3),
 * its maximum cross-section A = 0.05·V^(2/3), and the swath width the area and
 * the runout imply. The law lives in `effects/inundationArea.ts` and the rules
 * name it rather than holding a second copy — the same correction rule 198
 * needed, made here before it could bite.
 *
 * The guards.
 * (a) The transcription is checked by rule 202's re-derivation: the extracted
 *     data give back 0.219·V^0.587 where the report publishes 0.22·V^0.59, and
 *     10.17·V^0.731 where it publishes 10·V^0.73.
 * (b) No number of `docs/VALIDATION_REPORT.json` moved: it regenerates byte for
 *     byte. The runout length is untouched.
 * (c) The suite is green, 2 273 tests.
 * (d) The globe no longer claims the ground it does not have — see below.
 *
 * Rule 205's band, measured on the 207 events: σ(log10) is 0.32 for the debris
 * flows' planimetric areas, 0.42 for the rock avalanches', 0.44 for both
 * cross-sections — a factor of 2.1 to 2.8 at one sigma, with the bias within
 * 7 % of one, which is what a transcribed coefficient sitting on its own data
 * looks like. **In sample**, as rule 205 said in advance: the spread of the
 * relation, not a validation of it.
 *
 * One correction to the rules, made rather than hidden. Rule 203 proposed
 * drawing the flow as a ribbon of the swath width, and rule 207 forbids it in
 * the same breath: a ribbon needs a direction, the direction is the valley's,
 * and this project does not compute valleys. So the globe draws the reach as
 * an **unfilled** outline and the area is published beside it. The fill was the
 * defect all along — a filled disc of the 42.1 km runout claims 5 576 km²
 * where the field gives 27.1, and an outline claims only that a valley can
 * carry the flow that far.
 *
 * What the energy cone said, and why V4 is not closed. ECMapProb (Aravena et
 * al.) was run offline on the package's own Vesuvius topography with the
 * distribution its example carries — collapse height 600 ± 400 m, H/L
 * 0.40 ± 0.05, 30 draws. It gives a median maximum reach of 4.11 km (0.30 to
 * 6.99) and a median inundated area of 37.7 km². Our own model, for the
 * Vesuvius 79 CE preset and its 2.5 km³, gives 13.57 km from the volume
 * scaling and 88.39 km from the energy line. The historical currents reached
 * Pompeii at about 9 km and left deposits beyond 15.
 *
 * So the three numbers straddle the record and the comparison is dominated by
 * a parameter: H/L, which the energy cone takes and we do not have. Setting it
 * from an eruption's volume is exactly what Aravena et al. (2022)'s calibration
 * strategies are for, and it is a round of its own. **V4 stays open**: the tool
 * runs, offline, on real topography, and what is missing is the calibration
 * that would let the two models be asked the same question.
 *
 * And one thing found on the way, of the same family as the report defects of
 * 18 September: the page printed two reaches for one flow, six and a half times
 * apart, the first labelled "PDC runout (Sheridan H/L = 0.1)" for a relation
 * that is the project's own volume scaling and carries no H/L — its own
 * citation says so — and the second with no hint that `extendedEffects.ts`
 * calls it an order-of-magnitude upper bound. Both labels now say what they
 * are.
 */

/** Rules 203: the law itself lives with the physics, in
 *  `effects/inundationArea.ts`, and is named here rather than copied — a copy
 *  of a definition in two places is what B-053 was made of, and rule 198's
 *  own correction said the same. */
export {
  INUNDATION_COEFFICIENTS,
  inundatedCrossSection,
  inundatedPlanimetricArea,
  swathWidth,
  type FlowType,
} from '../effects/inundationArea.js';

/** Rule 202's re-derivation, as numbers: what the extracted data give when the
 *  report's own regression is repeated on them, against what it published.
 *  Slope free (the report's Model 1). */
export const REDERIVED_MODEL_1 = {
  debrisFlowCrossSection: { found: [0.219, 0.587], published: [0.22, 0.59] },
  debrisFlowPlanimetric: { found: [10.17, 0.731], published: [10, 0.73] },
  rockAvalancheCrossSection: { found: [0.097, 0.713], published: [0.1, 0.71] },
  rockAvalanchePlanimetric: { found: [2.346, 0.787], published: [5.3, 0.75] },
} as const;

/** Rule 202: the set, as the report describes it and as the extraction found
 *  it. The one figure that differs is the rock avalanches' cross-sections. */
export const APPENDIX_A_COUNTS = {
  debrisFlows: { reported: 64, extracted: 64 },
  debrisFlowsWithCrossSection: { reported: 50, extracted: 50 },
  debrisFlowsWithPlanimetric: { reported: 44, extracted: 44 },
  rockAvalanches: { reported: 143, extracted: 143 },
  rockAvalanchesWithCrossSection: { reported: 12, extracted: 13 },
  rockAvalanchesWithPlanimetric: { reported: 142, extracted: 142 },
} as const;
