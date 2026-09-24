/**
 * Rule 1127 — the round on the third set closed, and its audit. The reviewer,
 * 24 September 2026, read the account of rule 1126's run: «S not adoptable
 * under version 2» confirmed — the ground outcome improves, O1 does not; F a
 * diagnostic; no class B. He asked for one reading to be made more cautious and
 * said what he had not verified: every draw of the record, and the chronology
 * of what was published. Andrea's word: the closing with its audit.
 *
 * RULE 1127. THE ROUND CLOSED.
 *   (a) THE VERDICT STANDS, as the frozen judge gave it: S is not adoptable
 *       under version 2; nothing is adopted; no class B.
 *   (b) THE MASSES, READ WITH CAUTION. That S's median largest piece is 17 to
 *       250 times the recovered mass measures no overestimate of the mass that
 *       reached the ground: every recovered mass is a lower bound. It is a sign
 *       of the comparison's limit and of the missing ablation, not a verdict of
 *       accuracy on O2 (rule 1114), and the account says so where the masses
 *       are shown.
 *   (c) THE VERDICT RE-DERIVED (`auditThirdSetRun`, tested on every commit):
 *       from the record's published per-body readings, by code written apart
 *       from the judge's functions, following the rules' text — the counts of
 *       O1's draws summing to the draws, each compatibility from its band and
 *       its interval widened by 5 km, each comparability from its 50 paired
 *       draws, each void from its widths, the gains and the losses, D1's mean
 *       gain and its worsenings, the worsening by arrivals at the law's speeds,
 *       the verdict; F's non-converging draws recounted from its per-draw
 *       record.
 *   (d) THE CHRONOLOGY, from the times GitHub recorded as each push arrived
 *       (Central European Summer Time): version 2 frozen, 11:23:36 — the first
 *       source downloaded, by the local file's time, at 11:23:43; the table
 *       (rules 1120–1125), rule 1126 and the run's script arrived together at
 *       12:04:51 — the table had been approved by the reviewer on the text
 *       sent to him, not on GitHub, and reached GitHub only then; the run wrote
 *       its record at 12:05:34, by the local file's time; the account arrived
 *       at 12:46:54. The commits' own dates are local and prove nothing alone.
 *   (e) WHAT THE AUDIT CANNOT DO. The run kept the baseline's and S's readings
 *       per body, not per draw (F's release it kept per draw): a recount draw
 *       by draw needs the run reproduced. The run is deterministic and its
 *       inputs, seeds and code are published; a reproduction — the same
 *       script at the same commit, its record required to match the published
 *       one to the byte, deciding nothing — is put to the reviewer, not done.
 */

/** The parts of thirdSetRun.json the audit reads. */
export interface ThirdSetRecord {
  judge: {
    o1: {
      assessable: boolean;
      improves: boolean;
      worsens: boolean;
      gains: string[];
      losses: string[];
    };
    ground: { assessable: boolean; improves: boolean; worsens: boolean };
    verdict: { adoptable: boolean; reason: string };
  };
  bodies: {
    event: string;
    reading: string;
    draws: number;
    o1: {
      interval: [number, number];
      counts: Record<'baseline' | 'S', Record<string, number>>;
      baseline: { produced: number; band: { p5: number; p95: number } | null; compatible: boolean };
      S: { produced: number; band: { p5: number; p95: number } | null; compatible: boolean };
      pairedProduced: number;
      comparable: boolean;
      widthsOnPaired: { baseline: number | null; S: number | null; voidsGain: boolean };
    };
    ground: Record<'baseline' | 'S', { d1: number; lawSpeedShareAll: number }>;
    F: { releasePerDraw: (number | null)[][] | null[]; releaseNotConverging: number };
  }[];
}

export interface AuditResult {
  failures: string[];
  verdict: { adoptable: boolean; o1Improves: boolean; groundImproves: boolean };
}

/** Rule 1127 (c): the verdict re-derived from the record, apart from the judge. */
export function auditThirdSetRun(record: ThirdSetRecord): AuditResult {
  const failures: string[] = [];
  const check = (ok: boolean, what: string): void => {
    if (!ok) failures.push(what);
  };
  const counted = record.bodies.filter((b) => b.reading === 'counted');
  let comparable = 0;
  let gains = 0;
  let losses = 0;
  for (const b of record.bodies) {
    for (const k of ['baseline', 'S'] as const) {
      const c = b.o1.counts[k];
      const sum = Object.values(c).reduce((a, x) => a + x, 0);
      check(
        sum === b.draws,
        `${b.event} ${k}: O1's counts sum to ${String(sum)}, not ${String(b.draws)}`
      );
      check(c.produced === b.o1[k].produced, `${b.event} ${k}: produced counts disagree`);
      const band = b.o1[k].band;
      const lo = b.o1.interval[0] * 1_000 - 5_000;
      const hi = b.o1.interval[1] * 1_000 + 5_000;
      const compatible = band !== null && band.p95 >= lo && band.p5 <= hi;
      check(compatible === b.o1[k].compatible, `${b.event} ${k}: compatibility re-derived differs`);
    }
    check(
      b.o1.comparable === b.o1.pairedProduced >= 50,
      `${b.event}: comparability re-derived differs`
    );
    const w = b.o1.widthsOnPaired;
    const voids = w.baseline !== null && w.S !== null && w.S > Math.max(1.5 * w.baseline, 500);
    check(voids === w.voidsGain, `${b.event}: the band's void re-derived differs`);
    const releases = (b.F.releasePerDraw as ((number | null)[] | null)[]).filter(
      (x): x is (number | null)[] => x !== null
    );
    const notConverging = releases.filter((x) => x[3] === 0).length;
    check(
      notConverging === b.F.releaseNotConverging,
      `${b.event}: F's non-converging recount differs`
    );
    if (b.reading !== 'counted' || !b.o1.comparable) continue;
    comparable += 1;
    if (b.o1.S.compatible && !b.o1.baseline.compatible && !voids) gains += 1;
    if (b.o1.baseline.compatible && !b.o1.S.compatible) losses += 1;
  }
  const o1Assessable = comparable >= 3;
  const o1Improves = gains >= 1 && losses === 0;
  const o1Worsens = losses >= 1;
  check(o1Assessable === record.judge.o1.assessable, 'O1: assessable re-derived differs');
  check(o1Improves === record.judge.o1.improves, 'O1: improves re-derived differs');
  check(o1Worsens === record.judge.o1.worsens, 'O1: worsens re-derived differs');

  // The ground: D1 decides (J not admissible, rule 1123 (c)).
  const mean = (xs: number[]): number => xs.reduce((a, x) => a + x, 0) / xs.length;
  const base = counted.map((b) => b.ground.baseline);
  const s = counted.map((b) => b.ground.S);
  const gain = mean(s.map((x) => x.d1)) - mean(base.map((x) => x.d1));
  const lost = counted.some((b) => b.ground.baseline.d1 >= 0.9 && b.ground.S.d1 < 0.9);
  const lawSpeed = counted.some(
    (b) =>
      b.ground.S.lawSpeedShareAll > 0.1 ||
      b.ground.S.lawSpeedShareAll > b.ground.baseline.lawSpeedShareAll + 0.1
  );
  const groundWorsens = lost || gain < -0.1 || lawSpeed;
  const groundImproves = counted.length >= 3 && gain >= 0.1 && !groundWorsens;
  check(groundImproves === record.judge.ground.improves, 'ground: improves re-derived differs');
  check(groundWorsens === record.judge.ground.worsens, 'ground: worsens re-derived differs');

  const adoptable =
    o1Assessable &&
    counted.length >= 3 &&
    o1Improves &&
    groundImproves &&
    !o1Worsens &&
    !groundWorsens;
  check(adoptable === record.judge.verdict.adoptable, 'the verdict re-derived differs');
  return { failures, verdict: { adoptable, o1Improves, groundImproves } };
}
