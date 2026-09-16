/**
 * I2, read against the field's own tool, as the amendment of 16 September 2026
 * to docs/GOLD_STANDARD.md asks.
 *
 * I2 as first written asked that an entering body deposit its energy within
 * 5 km of where the sensors saw it peak, in median absolute error, and within
 * 3 km in the mean. Rules 76 to 79 measured the model on 357 fireballs of
 * NASA JPL's CNEOS catalogue and it missed: 13.7 km in the median. That
 * verdict stays recorded. The amendment reads I2 instead against the Earth
 * Impact Effects Program's entry on the same fireballs, and
 * `scripts/eiep-fireballs.py` runs the program on them — the first time
 * anybody has.
 *
 * **Written while that run was in flight, before its results were read**, and
 * for a reason worth stating. On the one fireball tried by hand to check the
 * service answered, the model burst 70 m above the program: 49.23 km against
 * 49.16, with the sensors at 30. A bare comparison — the model's error no
 * larger than the program's — would fail the model by 70 m on a body it
 * reproduces to 0.15 %. That is not the question I2 asks of a software whose
 * aim is to be the field's tool, and deciding how to treat it after seeing the
 * 357 would be deciding the answer.
 *
 * The rules, numbered after the hundred and twenty-five before them:
 *
 *  126. **What "the model implements the reference" means on this set.** G1
 *       holds a relation to its reference within 1 % or the reference's
 *       printed rounding, and allows a deliberate departure the report names
 *       and gives the reason for. The entry has exactly one such departure,
 *       BM-13: the program breaks a body up on twice the I_f of Collins et
 *       al.'s Eq. 12, and the model keeps Eq. 12 as printed. So on each
 *       fireball both burst in the air, the model agrees with the program
 *       when its burst altitude is within 1 % of the program's — or, where it
 *       is not, when recomputing it on the program's I_f by the very formula
 *       `eiepComparison.test.ts` already holds to 0.1 % in CI brings it within
 *       1 %, which makes the whole difference BM-13's.
 *
 *  127. **Where one bursts and the other does not.** A fireball the model
 *       brings to the ground and the program bursts in the air, or the other
 *       way, does not agree. One the program refuses to answer is counted and
 *       printed, and does not count for or against.
 *
 *  128. **What decides.** I2, as read against the field, is **met** when the
 *       model agrees with the program on every fireball of rule 126 and 127
 *       that both answer: the model then is the field's tool on this set, the
 *       amendment's "agree by construction" applies, and the held-out miss is
 *       printed as what it says of the field and not as the model's. If any
 *       fireball departs by more than BM-13 explains, I2 is read the bare way
 *       instead — the model's median absolute error and the magnitude of its
 *       mean error no larger than the program's — and is met only if both
 *       hold.
 *
 * What these rules cannot settle. That the program's own miss is right to
 * accept: a 9 here is as good as the field, and where the field's entry model
 * bursts fireballs 13.7 km too high, so does the model, and the validation
 * report says so in kilometres. And that "the same fireballs" means the same
 * bodies: the catalogue gives an energy and a speed, not a size or a density,
 * so every body is rule 77's — 3 000 kg/m³, the diameter those give — for the
 * program exactly as for the model.
 */

/** Rule 126: G1's tolerance, and the scale height the BM-13 formula uses. */
export const FIREBALL_ANCHOR_TOLERANCE = 0.01;
export const FIREBALL_ANCHOR_SCALE_HEIGHT_M = 8_000;

export interface FireballAnchorRow {
  date: string;
  observedKm: number;
  /** The model's burst altitude (km), null where it reaches the ground. */
  nimbusBurstKm: number | null;
  /** The program's burst altitude (km), null where it reaches the ground. */
  eiepBurstKm: number | null;
  /** The program refused the input. */
  eiepError: string | null;
  /** The model's burst altitude recomputed on the program's I_f (km), where
   *  the BM-13 formula applies. */
  nimbusOnEiepIfKm: number | null;
}

export type FireballAgreement = 'within' | 'bm13' | 'departs' | 'regime' | 'unanswered';

/** Rules 126 and 127, for one fireball. */
export function fireballAgreement(r: FireballAnchorRow): FireballAgreement {
  if (r.eiepError !== null) return 'unanswered';
  const nimbusAir = r.nimbusBurstKm !== null;
  const eiepAir = r.eiepBurstKm !== null;
  if (nimbusAir !== eiepAir) return 'regime';
  if (!nimbusAir || r.nimbusBurstKm === null || r.eiepBurstKm === null) return 'within';
  const off = Math.abs(r.nimbusBurstKm - r.eiepBurstKm) / r.eiepBurstKm;
  if (off <= FIREBALL_ANCHOR_TOLERANCE) return 'within';
  if (r.nimbusOnEiepIfKm !== null) {
    const recomputed = Math.abs(r.nimbusOnEiepIfKm - r.eiepBurstKm) / r.eiepBurstKm;
    if (recomputed <= FIREBALL_ANCHOR_TOLERANCE) return 'bm13';
  }
  return 'departs';
}

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

export interface FireballAnchorVerdict {
  counts: Record<FireballAgreement, number>;
  /** Rule 128's first branch: the model is the field's tool on this set. */
  implementsReference: boolean;
  nimbus: { medianAbsKm: number; meanKm: number };
  eiep: { medianAbsKm: number; meanKm: number };
  /** Rule 128: I2 as read against the field. */
  met: boolean;
}

/** Rule 128. The error figures are over the fireballs both burst in the air. */
export function fireballAnchorVerdict(rows: readonly FireballAnchorRow[]): FireballAnchorVerdict {
  const counts: Record<FireballAgreement, number> = {
    within: 0,
    bm13: 0,
    departs: 0,
    regime: 0,
    unanswered: 0,
  };
  for (const r of rows) counts[fireballAgreement(r)]++;
  const both = rows.filter(
    (r) => r.eiepError === null && r.nimbusBurstKm !== null && r.eiepBurstKm !== null
  );
  const errors = (
    pick: (r: FireballAnchorRow) => number
  ): { medianAbsKm: number; meanKm: number } => {
    const e = both.map((r) => pick(r) - r.observedKm);
    return {
      medianAbsKm: median(e.map(Math.abs)),
      meanKm: e.reduce((a, b) => a + b, 0) / e.length,
    };
  };
  const nimbus = errors((r) => r.nimbusBurstKm ?? 0);
  const eiep = errors((r) => r.eiepBurstKm ?? 0);
  const implementsReference = counts.departs === 0 && counts.regime === 0;
  const bare =
    nimbus.medianAbsKm <= eiep.medianAbsKm && Math.abs(nimbus.meanKm) <= Math.abs(eiep.meanKm);
  return { counts, implementsReference, nimbus, eiep, met: implementsReference || bare };
}
