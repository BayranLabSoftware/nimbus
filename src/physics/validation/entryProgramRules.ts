/**
 * An impact computed with the Earth Impact Effects Program's own entry
 * equations and its own ground blast, where they part from Collins et al.'s
 * paper. Class A: the program is the reference (G1, I1 of
 * docs/GOLD_STANDARD.md).
 *
 * Rules 138 to 140 read the program's blast of an impact that reaches the
 * ground and refused it on one body of twelve: a 39 m iron at 13.6 km/s, off by
 * 4.4 % to 9.4 % while the other 55 points agreed within 0.054 %. The refusal
 * said the departure was the entry's, not the blast's.
 *
 * The rules, numbered after the hundred and forty before them:
 *
 *  141. **What was looked at, and what it shows.** Rule 139's 60 points, now
 *       read; the validation grid's 81 breakup altitudes, 24 burst altitudes
 *       and 57 ground overpressures; rule 138's 16 ground points. The program's
 *       entry departs from the paper in two places. BM-13, known since the
 *       campaign and kept out of the model until now: Eq. 11 takes twice
 *       Eq. 12's I_f. And Eq. 20, the speed at the ground of a broken body:
 *       the program's bracket lacks the −3(l/H)² term. The bracket is a small
 *       difference of large terms when the body breaks low, so that term is
 *       4 % of it for the 39 m iron, which breaks at 11.3 km, and nothing for a
 *       body that breaks high. With both, and the ground blast of rule 138:
 *       rule 139's 60 points within 0.12 % where the paper's entry gave 9.4 %;
 *       the grid's 57 ground points within 0.088 % (0.18 %); its 24 burst
 *       altitudes within 0.019 % (4.9 %); its 81 breakup altitudes within
 *       0.005 % (0.82 %). The program errs where the doubled I_f reaches 1,
 *       taking a square root of a negative number; this project reads such a
 *       body as one that never breaks, and declares it.
 *
 *  142. **The candidate.** Both together, as one: `EntryEquations` `program`
 *       in effects/atmosphericEntry.ts and `GroundBlast` `program` in
 *       effects/airburstBlast.ts. Neither is the default when this is pushed.
 *       They go together because the ground blast agrees with the program only
 *       on the program's entry, and the entry is what the rest of an impact —
 *       crater, burns, blast — is computed from.
 *
 *  143. **The held-out check.** Sixteen bodies nobody has asked the program
 *       about, drawn by `scripts/benchmark/entry-program-bodies.ts` (seed
 *       1 410 916) and kept on the candidate's own entry: eight slow dense
 *       bodies that reach the ground (20 to 300 m, 4 000 to 8 000 kg/m³, 11.2
 *       to 25 km/s, 20 to 90°), where the program's entry departs most; four
 *       that reach the ground drawn as rule 139 drew its; five ranges each,
 *       log-uniform from 0.5 to 500 km; and four airbursts (5 to 200 m, 1 000
 *       to 8 000 kg/m³, 11.2 to 72 km/s, 10 to 90°) with two ranges each from
 *       1 to 300 km. `ENTRY_PROGRAM_BODIES` below. At every range, the
 *       candidate's overpressure — the ground blast on the program's entry, or
 *       for an airburst the airburst law with its default passage to the Mach
 *       region on that entry — **agrees** within 1 % of the program's printed
 *       low end plus 0.0005 Pa. On every body, the candidate's breakup altitude
 *       agrees within 1 % plus half a metre of the one the program prints, and
 *       for an airburst its burst altitude likewise. A body the candidate
 *       brings to the ground and the program bursts in the air, or the other
 *       way, does not agree. A question the program answers with an error is
 *       counted apart.
 *
 *  144. **What decides.** Adopted — both defaults at once — when every point,
 *       breakup altitude and burst altitude compared agrees, with at least 48
 *       ground points on at least 8 bodies and at least 3 airbursts answered,
 *       and the validation report regenerated with both defaults keeps the
 *       release gate at PASS: Meteor Crater's gated crater is a slow iron's,
 *       and the ground speed moves it. Otherwise refused, and the failing
 *       items printed. Adopted, the impact family's sweep (rule 134) is run in
 *       the same session under both and printed; it does not decide.
 *
 *  145. **Amended after rule 144's run, and said so.** Rule 141 read a body
 *       whose doubled I_f reaches 1, where the program has no answer, as one
 *       that never breaks. Adopting the candidate showed what that choice does:
 *       the Sikhote-Alin preset, a 3 m iron at 14.5 km/s with 50 MPa, has an
 *       I_f of 0.936 — the paper breaks it at 6.0 km, as the fall broke at
 *       about 5.6 — and doubled it is 1.87, so the candidate brought it to the
 *       ground whole and dug a crater of 129 m where the largest observed is
 *       26 m. The choice was arbitrary and the observation is not. From here,
 *       where the program has no answer, the paper's equations are used, Eq. 11
 *       and Eq. 20 both. No question the held-out check asked is touched: the
 *       program answered all 68, so every one of its bodies has a doubled I_f
 *       below 1. The rest of rule 144 is read on the amended candidate.
 *
 * What these rules cannot settle. Whether the program or its paper is right
 * where they differ: a doubled I_f and a dropped term are what the field's
 * tool computes, and this project, whose aim is the tool's results, follows
 * the tool and declares that it does. The paper's equations stay reachable.
 */

/*
 * ===========================================================================
 * The outcome, written after the run of 16 September 2026: ADOPTED, with
 * rule 145's amendment
 * ===========================================================================
 *
 * The rules were pushed in `8235974` and the program asked afterwards
 * (`benchmark/results/entry-program-eiep-2026-09-16.json`, scored in
 * `entry-program-against-eiep-2026-09-16.json`). It answered all 68
 * questions, and every body where the candidate put it — twelve on the ground,
 * four in the air.
 *
 * **Everything compared agrees.** The 60 ground overpressures, the worst
 * ×1.00186 (a slow body of 127 m at 13 km/s, 1.4 km out); the 16 breakup
 * altitudes, the worst 1.6 m off; the 4 burst altitudes, within 10 cm; the 8
 * airburst overpressures, the worst ×0.99832. Rule 145's amendment, written
 * after the adoption's first test run showed Sikhote-Alin's preset digging a
 * 129 m crater, changes none of these: rescored, the same.
 *
 * **The release gate stays PASS**, with both defaults, and Meteor Crater's
 * crater inside its band. The validation report moves where it should: the
 * grid's 57 ground overpressures from 0.24–8.44× to 1.00–1.00×, now gated at
 * 1 % in `eiepComparison.test.ts`; its 81 breakup altitudes from 1.00–1.01× and
 * 24 burst altitudes from 1.00–1.05× to 1.00–1.00×, gated at 0.2 %; the
 * fireballs' median miss unchanged at 13.7 km and the mean from +12.8 to
 * +12.7 km. Sikhote-Alin's largest crater is 26.7 m, the observed 26.
 *
 * Four tests changed, and why: two named the old defaults; the breakup's check
 * against the root of Eq. 10 now runs on the paper's equations, which are what
 * that root belongs to; and the grid test that rebuilt the program's altitudes
 * from Eq. 12 now reads them from the model directly.
 *
 * **The sweep, as rule 144 asked, in the same session**
 * (`invariants-2026-09-16-8.json` with both, `-9` without): 425 impact
 * failures against 181. The blast rings that shrink as a body grows by 1 % go
 * from 167 to 407, the jumps from 8 to 14, the crater sizes from 4 to 2, the
 * tsunami amplitudes stay at 2. The new shrinking rings are the program's
 * ground blast: a larger body puts Eq. 18's altitude deeper, its crossover
 * shortens, and at a fixed range it blasts less. Asked at the ring of two of
 * them, the program falls with the model — 3 444.6 to 3 365.2 Pa, and 3 446.1
 * to 3 423.0 Pa, for the body and the body 1 % larger. It does not decide, and
 * it is declared.
 *
 * `DEFAULT_ENTRY_EQUATIONS` is `program` and `DEFAULT_GROUND_BLAST` is
 * `program`. I1's air blast clause (BM-21) is closed.
 */

/** Rule 143: G1's tolerance, and the rounding of what the program prints. */
export const ENTRY_PROGRAM_TOLERANCE = 0.01;
export const ENTRY_PROGRAM_ROUNDING_PA = 0.0005;
export const ENTRY_PROGRAM_ROUNDING_M = 0.5;
/** Rule 144: how much must be compared for a verdict. */
export const ENTRY_PROGRAM_MIN_GROUND_POINTS = 48;
export const ENTRY_PROGRAM_MIN_GROUND_BODIES = 8;
export const ENTRY_PROGRAM_MIN_AIRBURSTS = 3;

export interface EntryProgramBody {
  kind: 'slow' | 'general' | 'airburst';
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: 'sedimentary' | 'crystalline';
  rangesKm: readonly number[];
}

/** Rule 143: the sixteen bodies, as `scripts/benchmark/entry-program-bodies.ts`
 *  drew them on 16 September 2026 (slow: 9 drawn, 8 kept; general: 4 drawn,
 *  4 kept; airburst: 8 drawn, 4 kept). */
export const ENTRY_PROGRAM_BODIES: readonly EntryProgramBody[] = [
  {
    kind: 'slow',
    diameterM: 131.611,
    densityKgM3: 4406.2,
    velocityKmS: 21.781,
    angleDeg: 29.52,
    target: 'sedimentary',
    rangesKm: [3.069, 4.822, 85.962, 312.769, 6.01],
  },
  {
    kind: 'slow',
    diameterM: 226.058,
    densityKgM3: 4169.8,
    velocityKmS: 12.005,
    angleDeg: 68.06,
    target: 'sedimentary',
    rangesKm: [11.769, 49.989, 44.466, 2.741, 1.822],
  },
  {
    kind: 'slow',
    diameterM: 126.955,
    densityKgM3: 4803.2,
    velocityKmS: 13.021,
    angleDeg: 82.05,
    target: 'sedimentary',
    rangesKm: [3.805, 98.384, 1.389, 344.698, 72.064],
  },
  {
    kind: 'slow',
    diameterM: 74.872,
    densityKgM3: 6711.5,
    velocityKmS: 17.17,
    angleDeg: 47.08,
    target: 'crystalline',
    rangesKm: [2.748, 34.003, 4.626, 0.874, 204.191],
  },
  {
    kind: 'slow',
    diameterM: 49.339,
    densityKgM3: 7847.7,
    velocityKmS: 12.027,
    angleDeg: 27.78,
    target: 'crystalline',
    rangesKm: [6.039, 349.162, 4.654, 13.66, 0.852],
  },
  {
    kind: 'slow',
    diameterM: 65.966,
    densityKgM3: 5586.4,
    velocityKmS: 15.943,
    angleDeg: 84.95,
    target: 'sedimentary',
    rangesKm: [166.861, 48.058, 0.802, 1.073, 167.328],
  },
  {
    kind: 'slow',
    diameterM: 38.654,
    densityKgM3: 6707.7,
    velocityKmS: 22.014,
    angleDeg: 68.51,
    target: 'crystalline',
    rangesKm: [0.596, 23.963, 235.483, 2.212, 397.102],
  },
  {
    kind: 'slow',
    diameterM: 277.627,
    densityKgM3: 4242.1,
    velocityKmS: 12.658,
    angleDeg: 42.44,
    target: 'sedimentary',
    rangesKm: [290.664, 120.094, 1.975, 55.43, 311.234],
  },
  {
    kind: 'general',
    diameterM: 4401.104,
    densityKgM3: 6769.8,
    velocityKmS: 29.861,
    angleDeg: 46.19,
    target: 'sedimentary',
    rangesKm: [152.423, 244.16, 47.215, 31.012, 75.54],
  },
  {
    kind: 'general',
    diameterM: 94.457,
    densityKgM3: 4878.4,
    velocityKmS: 59.068,
    angleDeg: 79.56,
    target: 'crystalline',
    rangesKm: [0.726, 152.123, 92.637, 294.008, 292.271],
  },
  {
    kind: 'general',
    diameterM: 57.47,
    densityKgM3: 6453.2,
    velocityKmS: 40.186,
    angleDeg: 58.98,
    target: 'sedimentary',
    rangesKm: [486.638, 96.069, 224.6, 2.131, 174.453],
  },
  {
    kind: 'general',
    diameterM: 4422.97,
    densityKgM3: 3667.8,
    velocityKmS: 46.712,
    angleDeg: 51.47,
    target: 'crystalline',
    rangesKm: [12.405, 12.439, 9.129, 0.675, 192.93],
  },
  {
    kind: 'airburst',
    diameterM: 12.238,
    densityKgM3: 6904.4,
    velocityKmS: 58.258,
    angleDeg: 59.31,
    target: 'crystalline',
    rangesKm: [104.269, 3.504],
  },
  {
    kind: 'airburst',
    diameterM: 16.717,
    densityKgM3: 3287.4,
    velocityKmS: 17.621,
    angleDeg: 24.81,
    target: 'sedimentary',
    rangesKm: [3.495, 63.785],
  },
  {
    kind: 'airburst',
    diameterM: 11.651,
    densityKgM3: 6583.4,
    velocityKmS: 27.75,
    angleDeg: 59.27,
    target: 'sedimentary',
    rangesKm: [1.235, 13.171],
  },
  {
    kind: 'airburst',
    diameterM: 8.929,
    densityKgM3: 2772,
    velocityKmS: 45.333,
    angleDeg: 22.52,
    target: 'crystalline',
    rangesKm: [9.987, 3.517],
  },
];

/** Rule 143, for a printed pressure. */
export function entryProgramPressureAgrees(programPa: number, modelPa: number): boolean {
  return (
    Math.abs(modelPa - programPa) <= ENTRY_PROGRAM_TOLERANCE * programPa + ENTRY_PROGRAM_ROUNDING_PA
  );
}

/** Rule 143, for a printed altitude. */
export function entryProgramAltitudeAgrees(programM: number, modelM: number): boolean {
  return (
    Math.abs(modelM - programM) <= ENTRY_PROGRAM_TOLERANCE * programM + ENTRY_PROGRAM_ROUNDING_M
  );
}

export interface EntryProgramItem {
  body: number;
  kind: EntryProgramBody['kind'];
  what: 'overpressure' | 'breakup altitude' | 'burst altitude' | 'regime';
  /** Null where the program answered with an error. */
  agrees: boolean | null;
}

export interface EntryProgramVerdict {
  groundPoints: number;
  groundBodies: number;
  airbursts: number;
  failing: number;
  apart: number;
  enough: boolean;
  /** Rule 144, before the release gate is read. */
  heldOutPasses: boolean;
}

/** Rule 144, the held-out part. The release gate is read when the report is
 *  regenerated with both defaults. */
export function entryProgramVerdict(items: readonly EntryProgramItem[]): EntryProgramVerdict {
  const compared = items.filter((i) => i.agrees !== null);
  const ground = compared.filter((i) => i.kind !== 'airburst' && i.what === 'overpressure');
  const airbursts = new Set(compared.filter((i) => i.kind === 'airburst').map((i) => i.body)).size;
  const groundBodies = new Set(ground.map((i) => i.body)).size;
  const failing = compared.filter((i) => i.agrees === false).length;
  const enough =
    ground.length >= ENTRY_PROGRAM_MIN_GROUND_POINTS &&
    groundBodies >= ENTRY_PROGRAM_MIN_GROUND_BODIES &&
    airbursts >= ENTRY_PROGRAM_MIN_AIRBURSTS;
  return {
    groundPoints: ground.length,
    groundBodies,
    airbursts,
    failing,
    apart: items.length - compared.length,
    enough,
    heldOutPasses: enough && failing === 0,
  };
}
