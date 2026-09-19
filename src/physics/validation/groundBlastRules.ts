/**
 * The air blast of an impact that reaches the ground, and whether Nimbus
 * should draw it as the Earth Impact Effects Program does. Class A: the
 * program is the reference, and I1 of docs/GOLD_STANDARD.md, G1 against it,
 * is not met while this is open (BM-21).
 *
 * BM-21 found the model's ground blast answering the impact angle backwards —
 * rising with a steeper impact where the program's falls — and 0.24× to 8.4×
 * the program. Four candidates were measured against the program's 57 ground
 * points of `validation/eiepReference.ts` and none was a fix
 * (docs/BENCHMARK_REPORT.md, "BM-21: what was tried"). What was not tried is
 * what the program does to an airburst: rules 129 to 131 had just shown it
 * reads its airburst law to seven digits, and that law has an altitude in it.
 *
 * The rules, numbered after the hundred and thirty-seven before them:
 *
 *  138. **What was looked at, and the law read off it.** On 16 September 2026,
 *       before this was written: a 100 m body of 3 000 kg/m³ at 12 km/s on a
 *       sedimentary target, at six angles from 100 km, and at 90° and 60° at
 *       six more ranges from 0.3 to 300 km — 18 printed overpressures, of which
 *       16 on the ground; the 57 ground points of the validation grid, already
 *       read for BM-21's candidates; and five questions the program answered
 *       with an error (HTTP 500), on a 30 m and a 40 m iron at 11.2 km/s
 *       straight down and on a 3 m iron at the same speed.
 *
 *       - At every angle that reaches the ground, one scale reproduces all
 *         ranges from 0.3 to 300 km to six digits with 2005 Eq. 54 of a burst
 *         on the ground: the shape is the Mach relation and nothing else.
 *       - The energy that scale implies is not the energy that reaches the
 *         ground: 84 kt straight down against 13 600 kt, falling a hundredfold
 *         from 45° to 90°. It is the program's airburst law read at Eq. 18's
 *         altitude where that altitude lies **below** the ground: the energy
 *         W = E₀ · max(f, 1 − f), f the share of E₀ at the ground; and at every
 *         range the Mach relation with r_x = 290 + 0.65 z₁, where z₁ = z_b /
 *         W_kt^⅓ is negative, so the crossover shortens and the blast weakens
 *         as a steeper entry puts z_b deeper. Fed Nimbus's own entry — its
 *         z_b and its speed at the ground — that law gives all 16 ground points
 *         of the 100 m body within 0.27 % and all 57 of the grid within
 *         0.18 %, from 100 m to 10 km, 12 to 50 km/s, 15° to 90°, 10 to
 *         1 000 km, both targets.
 *       - Where that law's r_x would be zero or less, the program errors: the
 *         two irons straight down, whose r_x on Nimbus's entry is −75 and
 *         −88 m. And the 3 m iron, which never breaks (I_f ≥ 1), errors too:
 *         Eq. 11 takes √(1 − I_f).
 *
 *       That law is `GroundBlast` `program` in effects/airburstBlast.ts, not
 *       the default; `airburstBlast.test.ts` holds it to these points. Where
 *       the program errors, this project chooses, and declares: no blast where
 *       r_x ≤ 0, the limit the program's own relation falls to, and a body
 *       that never breaks read at z₁ = 0.
 *
 *  139. **The held-out check.** Twelve bodies nobody has asked the program
 *       about, drawn by `scripts/benchmark/ground-blast-bodies.ts` (seed
 *       1 380 916: diameter log-uniform from 5 to 5 000 m, density from 1 000
 *       to 8 000 kg/m³, speed from 11.2 to 72 km/s, angle from 10 to 90°, a
 *       sedimentary or crystalline target at even odds, five ranges
 *       log-uniform from 0.5 to 500 km; kept where Nimbus's entry brings the
 *       swarm to the ground with r_x > 0, until twelve): `GROUND_BLAST_BODIES`
 *       below. The program is asked at each range. A point **agrees** when
 *       `groundImpactOverpressure`, fed Nimbus's own entry for the body, is
 *       within 1 % of the program's printed low end plus half its last
 *       printed digit (0.0005 Pa). The model in place — the larger of the two
 *       Kinney–Graham overpressures — is scored beside it. A point the program
 *       answers with an error, or on a body it bursts in the air, is counted
 *       apart and does not count for or against.
 *
 *  140. **What decides.** `program` is **adopted** as the default when at
 *       least 48 points of at least 8 bodies are compared and every one
 *       agrees. Otherwise it is **refused**, the points outside are printed,
 *       and BM-21 stays open. Adopted, the rings of every impact that reaches
 *       the ground move, and the sweep of rule 134's kind is run in the same
 *       session under both laws and printed: what the program's law does to
 *       G5 is measured and declared, and does not decide, because the reference
 *       does.
 *
 * What these rules cannot settle. That the program is right to read a blast
 * from an altitude under the ground: no paper derives it, and a burst below
 * the surface is not a physical source. It is what the field's tool computes,
 * and a 9 on I1 is as good as that tool. And the two choices where the program
 * errors, which no reference can decide.
 */

/*
 * ===========================================================================
 * The outcome, written after the run of 16 September 2026: REFUSED
 * ===========================================================================
 *
 * The rules were pushed in `7bd4a72` and the program asked afterwards
 * (`benchmark/results/ground-blast-eiep-2026-09-16.json`, scored in
 * `ground-blast-against-eiep-2026-09-16.json`). It answered all 60 ranges, on
 * the ground for all twelve bodies.
 *
 * The program's law, fed Nimbus's own entry, agrees on **55 of 60**, those
 * within 0.054 %; the model in place on 1, from 0.0001 to 10.3 times the
 * program. The five outside are all of one body, the twelfth — a 39 m iron of
 * 7 853 kg/m³ at 13.6 km/s and 49.9° — at 1.044 to 1.094. Rule 140 asks every
 * point, so `project` stays the default and BM-21 stays open.
 *
 * What the refusal found. The law is not what departs on that body. The
 * program's five overpressures there imply one crossover distance, 1 285.87 m
 * to within 0.01 m at every range, so its shape holds; it is the crossover
 * Nimbus's entry feeds it, 1 342 m, that is long. Two things make it so. BM-13,
 * the program's doubled I_f, which this project keeps out of Eq. 12 and which
 * these rules did not allow for as rule 126 did for the fireballs: with it the
 * breakup altitude is the program's to the metre and the departure falls to
 * 1.027–1.057. And the speed at the ground: at the program's breakup altitude
 * the entry gives 9.812 km/s where the program's blast implies 9.688, a pancake
 * deceleration 4 % stronger, on the one body whose breakup is low (11.3 km) and
 * whose deceleration is not negligible. On the other eleven the implied speed
 * is the entry's within 0.22 %, nine of them within 0.03 %. A scaled crossover
 * this short — r_x = 92 m, against 290 for a burst on the ground — turns that
 * 1.3 % in speed into 5 % in overpressure. The next round has two things to settle first: the ground
 * speed of a slow strong body, which the program prints to two figures and
 * its blast reveals to five, and whether BM-13 is kept out of a ground blast
 * it moves this much.
 *
 * ===========================================================================
 * WHAT HAPPENED NEXT, the same day: ADOPTED by rules 141 to 144
 * ===========================================================================
 *
 * This refusal was not the end of it, and a reader who stops here is left with
 * the wrong picture of what the product does. The next round changed one thing
 * — the entry — and asked again. On the program's own entry equations (Eq. 11
 * on twice Eq. 12's I_f, and Eq. 20 without the −3(l/H)² it lacks) its ground
 * blast agreed on **60 of 60** ground overpressures, worst ×1.0019, with 8 of 8
 * airburst ones, 16 breakup altitudes within 1.6 m and 4 burst altitudes within
 * 10 cm. It was adopted in `9cd0935`, `DEFAULT_GROUND_BLAST` is `program`, and
 * BM-21 is closed.
 *
 * So the five bodies that failed here failed on the paper's entry and not on
 * the blast law, exactly as the paragraph above suspected: "the law is not what
 * departs on that body". Kinney & Graham is no longer what an impact's
 * overpressure rings are drawn with. Recorded on 19 September 2026, when the
 * impact audit found this outcome standing alone and a visual contract written
 * from it saying the wrong thing on the globe.
 */

/** Rule 139: G1's tolerance, and half the program's last printed digit (Pa). */
export const GROUND_BLAST_TOLERANCE = 0.01;
export const GROUND_BLAST_ROUNDING_PA = 0.0005;
/** Rule 140: how much must be compared for a verdict. */
export const GROUND_BLAST_MIN_POINTS = 48;
export const GROUND_BLAST_MIN_BODIES = 8;

export interface GroundBlastBody {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: 'sedimentary' | 'crystalline';
  rangesKm: readonly number[];
}

/** Rule 139: the twelve bodies, as `scripts/benchmark/ground-blast-bodies.ts`
 *  drew them on 16 September 2026 (20 drawn, 12 kept). */
export const GROUND_BLAST_BODIES: readonly GroundBlastBody[] = [
  {
    diameterM: 2323.357,
    densityKgM3: 4748.7,
    velocityKmS: 18.911,
    angleDeg: 14.27,
    target: 'sedimentary',
    rangesKm: [79.162, 1.727, 0.618, 5.155, 1.938],
  },
  {
    diameterM: 85.039,
    densityKgM3: 3929.4,
    velocityKmS: 55.145,
    angleDeg: 40.64,
    target: 'crystalline',
    rangesKm: [1.046, 436.594, 0.857, 345.389, 2.099],
  },
  {
    diameterM: 2996.883,
    densityKgM3: 5684,
    velocityKmS: 11.605,
    angleDeg: 41.24,
    target: 'crystalline',
    rangesKm: [23.211, 12.09, 2.4, 1.981, 4.218],
  },
  {
    diameterM: 1686.916,
    densityKgM3: 6782.6,
    velocityKmS: 40.88,
    angleDeg: 13.45,
    target: 'crystalline',
    rangesKm: [6.777, 4.37, 0.561, 60.515, 292.31],
  },
  {
    diameterM: 111.86,
    densityKgM3: 2787.3,
    velocityKmS: 61.399,
    angleDeg: 50.39,
    target: 'crystalline',
    rangesKm: [35.75, 2.635, 0.958, 69.735, 1.995],
  },
  {
    diameterM: 279.286,
    densityKgM3: 6756.8,
    velocityKmS: 60.777,
    angleDeg: 77.63,
    target: 'crystalline',
    rangesKm: [12.754, 4.063, 56.747, 78.171, 33.036],
  },
  {
    diameterM: 4563.716,
    densityKgM3: 4608,
    velocityKmS: 34.228,
    angleDeg: 76.81,
    target: 'crystalline',
    rangesKm: [1.386, 0.707, 25.619, 33.097, 14.887],
  },
  {
    diameterM: 84.949,
    densityKgM3: 4884.6,
    velocityKmS: 62.306,
    angleDeg: 70.46,
    target: 'crystalline',
    rangesKm: [441.082, 1.556, 7.93, 152.22, 124.083],
  },
  {
    diameterM: 193.636,
    densityKgM3: 2135.3,
    velocityKmS: 38.4,
    angleDeg: 55.37,
    target: 'sedimentary',
    rangesKm: [145.947, 103.134, 139.919, 62.228, 10.809],
  },
  {
    diameterM: 1640.718,
    densityKgM3: 3590.6,
    velocityKmS: 35.394,
    angleDeg: 68.01,
    target: 'crystalline',
    rangesKm: [0.672, 6.652, 30.043, 288.095, 189.733],
  },
  {
    diameterM: 659.984,
    densityKgM3: 4775.3,
    velocityKmS: 52.826,
    angleDeg: 46.68,
    target: 'sedimentary',
    rangesKm: [5.415, 202.24, 9.425, 5.847, 14.227],
  },
  {
    diameterM: 39.146,
    densityKgM3: 7853,
    velocityKmS: 13.647,
    angleDeg: 49.88,
    target: 'sedimentary',
    rangesKm: [297.229, 3.246, 2.301, 207.169, 0.859],
  },
];

export interface GroundBlastPoint {
  body: number;
  rangeKm: number;
  /** The program's printed low end (Pa); null where it errs or bursts the
   *  body in the air. */
  programPa: number | null;
  /** `groundImpactOverpressure` on Nimbus's entry (Pa). */
  programLawPa: number;
  /** The model in place (Pa). */
  inPlacePa: number;
}

/** Rule 139, for one point. */
export function groundBlastAgrees(programPa: number, modelPa: number): boolean {
  return (
    Math.abs(modelPa - programPa) <= GROUND_BLAST_TOLERANCE * programPa + GROUND_BLAST_ROUNDING_PA
  );
}

export interface GroundBlastVerdict {
  compared: number;
  bodies: number;
  lawAgrees: number;
  inPlaceAgrees: number;
  enough: boolean;
  /** Rule 140. */
  adopted: boolean;
}

/** Rule 140. */
export function groundBlastVerdict(points: readonly GroundBlastPoint[]): GroundBlastVerdict {
  const compared = points.filter(
    (p): p is GroundBlastPoint & { programPa: number } => p.programPa !== null
  );
  const bodies = new Set(compared.map((p) => p.body)).size;
  const lawAgrees = compared.filter((p) => groundBlastAgrees(p.programPa, p.programLawPa)).length;
  const inPlaceAgrees = compared.filter((p) => groundBlastAgrees(p.programPa, p.inPlacePa)).length;
  const enough = compared.length >= GROUND_BLAST_MIN_POINTS && bodies >= GROUND_BLAST_MIN_BODIES;
  return {
    compared: compared.length,
    bodies,
    lawAgrees,
    inPlaceAgrees,
    enough,
    adopted: enough && lawAgrees === compared.length,
  };
}
