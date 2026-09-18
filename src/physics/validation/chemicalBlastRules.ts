import type { ChemicalBlastSource } from '../events/explosion/overpressure.js';

/**
 * A charge on the ground: the field's own curves instead of a free-air fit
 * doubled.
 *
 * N1 of docs/GOLD_STANDARD.md asks that an explosion be held "against
 * Kingery–Bulmash within 10 % in range for a charge on the ground", and ends:
 * "where the book gives a curve, no fit of the project's stands in for it".
 * The rings of a chemical charge are drawn today by the Kinney–Graham free-air
 * fit at twice the yield — the doubling standing in for the ground's
 * reflection — and the campaign of 15 September measured that against
 * Kingery–Bulmash: the rings came out 0.990× with a scatter of 0.04 in the
 * log, the overpressure at a scaled distance 1.069× with 0.118
 * (`benchmark/results/chemical.json`, docs/BENCHMARK_REPORT.md, "CHEM").
 *
 * Within ten per cent, and not the same relation. That matters beyond N1
 * because N2 — a held-out set of accidental explosions, read under the
 * amendment of 16 September against "Glasstone & Dolan's and Kingery–Bulmash's
 * scaling on the same accidental explosions" — is then decided by whichever
 * way those few per cent fall, rather than by whether the model is the field's
 * relation. These rules make it the field's relation, so that the set to come
 * measures the field and not the difference between two fits.
 *
 * The rules, fixed on 18 September 2026 and numbered after the hundred and
 * seventy-six before them, pushed before the candidate draws a ring for any
 * preset of the product or any row of the calibration net:
 *
 *  177. **What was looked at.** Swisdak's paper itself — Table 1's
 *       incident-pressure blocks in both unit systems, and the text on what
 *       the curves are and are not (they carry the weather and the charge
 *       performance of the trials; they must not be extrapolated beyond the
 *       ranges printed; at low pressures a measurement may differ from them by
 *       a long way). The three worked examples of IATG 01.80 (2021) Table 5.
 *       The campaign's CHEM figures above, read on 15 September, which are
 *       therefore not held out. And, printed while judging whether the round
 *       was worth running, the ratio between the law in place and the
 *       candidate on seven charge masses from 100 kg to 10⁹ kg: the same at
 *       every mass, because both scale with the cube root —
 *       {@link CHEMICAL_LOOKED_AT_RATIO}, 1.009 at 5 psi, 0.934 at 1 psi and
 *       1.029 at 0.5 psi, the law in place over the candidate. No preset, no
 *       toll and no row of the release gate has been run under the candidate.
 *
 *  178. **The relation.** `effects/kingeryBulmash.ts`: the coefficients Table 1
 *       prints for the incident pressure of a hemispherical TNT surface burst
 *       in metric units, over its three ranges of scaled distance (0.2 to 2.9,
 *       2.9 to 23.8 and 23.8 to 198.5 m·kg⁻¹ᐟ³), read from the copy of the
 *       paper whose SHA-256 is {@link SWISDAK_1994_SHA256}, and nothing of
 *       anyone's code. `kingeryBulmash.test.ts` holds the transcription in CI,
 *       three ways: the IATG examples within 1 % — the paper's own claim
 *       against the original Kingery & Bulmash curves — the paper's English
 *       coefficients, converted, within 0.1 %, and the two joins between
 *       ranges within 1 %. The curve falls with distance inside each range and
 *       steps up by 0.65 % where the third begins, which the test records and
 *       no ring the product draws sits in.
 *
 *  179. **The candidate (`kingeryBulmash`).** A chemical charge draws its
 *       5 psi, 1 psi and 0.5 psi rings from that curve at its own TNT mass
 *       (a kilotonne of TNT equivalent being a million kilogrammes of TNT),
 *       and the inner edges of its casualty bands — 12 psi from the 5 psi ring
 *       and 2 psi from the 1 psi ring — from the same curve. Everything else
 *       stands: the change with height of burst is still the book's figure at
 *       twice the yield (rule 170), a charge in the water still keeps the
 *       surface relation (rule 175), and a nuclear burst is untouched.
 *
 *  180. **What decides.** Adopted unless a guard fails:
 *       (a) every check of rule 178 passes in CI;
 *       (b) the release gate stays PASS;
 *       (c) the explosion family's invariants sweep, read under the law in
 *           place in the same run, comes back with no more failures under the
 *           candidate than under it;
 *       (d) the application prints what Node computes on every preset;
 *       (e) the only rows of the validation report that move are those of the
 *           three chemical presets, and each ring of theirs moves by the ratio
 *           of rule 177 within {@link CHEMICAL_RATIO_TOLERANCE}.
 *       Printed, deciding nothing: the tolls of those presets under both laws,
 *       and their distance from the record. Beirut's toll is tuned (rule 5 of
 *       docs/BENCHMARK_PROTOCOL.md forbids re-tuning it), so it moves with the
 *       ring and is recorded, not corrected.
 *
 *  181. **What an adoption does.** `DEFAULT_CHEMICAL_BLAST_SOURCE` becomes
 *       `kingeryBulmash`; N1's Kingery–Bulmash clause reads the relation
 *       itself rather than a fit within 10 % of it; docs/SCIENCE.md and the
 *       methodology page name Swisdak's table and its limits; the campaign's
 *       CHEM figures stay where they are with the new ones beside them. The
 *       held-out set of accidental explosions (N2) is a separate round, with
 *       its own rules, and nothing of it is read here.
 */

/*
 * ===========================================================================
 * The outcome of rules 177 to 181, 18 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `7b83b39` and the candidate, reachable but drawn by
 * nothing, in `f912819`; then the guard ran.
 *
 * (a) The checks of rule 178 pass: the IATG examples come out at +0.53 %,
 *     +0.07 % and +0.46 % of the printed bars — Swisdak's own claim against
 *     the 1984 curves is 1 % — the paper's English coefficients agree within
 *     0.02 % over the whole range, and the joins within 0.05 % and 0.70 %.
 * (b) The release gate stays PASS (strict mode, exit 0).
 * (c) The explosion sweep, both readings taken in the same session on the same
 *     5 000 scenarios, gives 2 failures under the law in place
 *     (`benchmark/results/invariants-2026-09-18.json`) and the same 2 under the
 *     candidate (`-1.json`): the lethal-dose ring where the sphere meets the
 *     ground tangentially, and a 5 psi ring just under the top of the book's
 *     contour. Both were already declared.
 * (d) The application prints what Node computes on every preset: ten
 *     explosions, 57 numbers each, none different, and nine printed panel
 *     values each, none off (`benchmark/results/ui.json`).
 * (e) The three chemical presets move by the ratios of rule 177 and by nothing
 *     else: 1.00923 at 5 psi, 0.93387 at 1 psi and 1.02908 at 0.5 psi, the law
 *     in place over the candidate, on Beirut, Halifax and Texas City alike —
 *     3 × 10⁻⁵ from the numbers rule 177 wrote down. The validation report
 *     moves in three places, all of them Beirut's: its toll from 1 432 to
 *     1 423 against a record of 218 (6.57× to 6.53×), its band with it, and
 *     the explosion family's bias from 2.61× to 2.60×. Nothing else moves.
 *
 * **Read after the adoption, at Andrea's request, and declared as such.** The
 * guard above holds the relation to what the reference prints, which is a
 * step below what the other domains do: the impulse wave manual was asked 143
 * cases by its own spreadsheet, and the Earth Impact Effects Program was asked
 * 357 bolides. So an implementation of the same fits written by somebody else
 * — the MIT-licensed `kingery-bulmash` package — was run as a black box on
 * 488 points, eight charges from 1 kg to 1 kt at sixty-one scaled distances
 * each (`scripts/benchmark/kb-grid.py`, the answers in
 * `validation/kingeryBulmashReference.ts`). The relation here agrees with it
 * within 1.9 × 10⁻⁶ everywhere, and `kingeryBulmash.test.ts` holds that in CI.
 * It changes no verdict: the adoption stood on the guard as written.
 *
 * `DEFAULT_CHEMICAL_BLAST_SOURCE` is `kingeryBulmash`, and N1's clause for a
 * charge on the ground is the relation itself rather than a fit within 10 % of
 * it. What it costs is written beside it: Beirut's toll is tuned and moves with
 * its rings, and the campaign's CHEM figures stay where they are, with the new
 * ones beside them.
 */

/** Rule 179's candidate and the law in place. */
export const CHEMICAL_IN_PLACE: ChemicalBlastSource = 'kinneyGraham';
export const CHEMICAL_CANDIDATE: ChemicalBlastSource = 'kingeryBulmash';

/** Rule 178: the copy of Swisdak (1994) the coefficients were read from —
 *  DTIC ADA526744, the Internet Archive's copy of the DTIC scan, 517 341
 *  bytes, downloaded 18 September 2026 with Andrea's permission. */
export const SWISDAK_1994_SHA256 =
  'd7458e152237129596907e0daebb389a78aadeb5c338026fbc83d3c513ec6b82';

/** Rule 178: the copy of IATG 01.80 (2021) whose Table 5 the test reads,
 *  1 007 796 bytes from data.unsaferguard.org, downloaded the same day. */
export const IATG_0180_SHA256 = 'd5d9762127ce3be0297069efb15fcd865bf0250cb10e9187f885aef56654a99e';

/** Rule 177: the law in place over the candidate, by ring, on seven charge
 *  masses from 100 kg to 10⁹ kg — one number each, because both laws scale
 *  with the cube root of the charge. */
export const CHEMICAL_LOOKED_AT_RATIO: Readonly<Record<string, number>> = {
  '5 psi': 1.0092,
  '1 psi': 0.9339,
  '0.5 psi': 1.0291,
};

/** Rule 180 (e): how far a preset's ring may sit from the ratio rule 177
 *  names, as a fraction. */
export const CHEMICAL_RATIO_TOLERANCE = 0.005;

export interface ChemicalGuard {
  /** (a) The checks of rule 178, as CI runs them. */
  transcriptionChecksPass: boolean;
  /** (b) */
  releaseGatePasses: boolean;
  /** (c) Failures of the explosion sweep, both read in the same session. */
  sweepInPlace: number;
  sweepCandidate: number;
  /** (d) Numbers the application prints that Node does not, over the presets. */
  applicationDepartures: number;
  /** (e) The worst departure of a preset's ring from the ratio of rule 177. */
  worstRingDeparture: number;
  /** (e) Rows of the validation report that move and are not a chemical
   *  preset's. */
  otherRowsMoved: number;
}

/** Rule 180: whether the candidate is adopted. */
export function chooseChemicalBlastSource(guard: ChemicalGuard): ChemicalBlastSource {
  const passes =
    guard.transcriptionChecksPass &&
    guard.releaseGatePasses &&
    Number.isFinite(guard.sweepCandidate) &&
    guard.sweepCandidate <= guard.sweepInPlace &&
    guard.applicationDepartures === 0 &&
    guard.otherRowsMoved === 0 &&
    Number.isFinite(guard.worstRingDeparture) &&
    guard.worstRingDeparture <= CHEMICAL_RATIO_TOLERANCE;
  return passes ? CHEMICAL_CANDIDATE : CHEMICAL_IN_PLACE;
}
