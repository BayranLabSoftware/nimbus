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

/** Rule 203: the flow types the field distinguishes, and what tells them
 *  apart — a lahar is volcanic mud, a debris flow is the same physics without
 *  a volcano, a rock avalanche is dry rock. */
export type FlowType = 'lahar' | 'debrisFlow' | 'rockAvalanche';

/** Rule 203: Griswold & Iverson (2008), Table 6 — α₁ for the maximum
 *  inundated cross-section, α₂ for the total inundated planimetric area, both
 *  on V^(2/3). The lahar row is Iverson, Schilling & Vallance (1998)'s. */
export const INUNDATION_COEFFICIENTS: Readonly<
  Record<FlowType, { crossSection: number; planimetric: number }>
> = {
  lahar: { crossSection: 0.05, planimetric: 200 },
  debrisFlow: { crossSection: 0.1, planimetric: 20 },
  rockAvalanche: { crossSection: 0.2, planimetric: 20 },
};

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

/** Rule 203: the area a flow of this volume covers (m², V in m³). */
export function inundatedPlanimetricArea(volumeM3: number, flow: FlowType): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  return INUNDATION_COEFFICIENTS[flow].planimetric * Math.cbrt(volumeM3 * volumeM3);
}

/** Rule 203: the largest cross-section it fills on the way (m²). */
export function inundatedCrossSection(volumeM3: number, flow: FlowType): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  return INUNDATION_COEFFICIENTS[flow].crossSection * Math.cbrt(volumeM3 * volumeM3);
}

/** Rule 203: the width of the swath a runout of `lengthM` implies, given the
 *  area the flow covers. Zero where either is zero — a flow that goes nowhere
 *  has no swath. */
export function swathWidth(volumeM3: number, lengthM: number, flow: FlowType): number {
  if (!Number.isFinite(lengthM) || lengthM <= 0) return 0;
  return inundatedPlanimetricArea(volumeM3, flow) / lengthM;
}
