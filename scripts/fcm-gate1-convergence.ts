/**
 * Gate 1 (c) of the FCM round (rule 1141 (c), src/physics/validation/
 * fcmRoundRules.ts) — DEVELOPMENT, begun before the reviewer has read the
 * round's dossier (rule 1147): the branch's convergence on the same draws.
 * Writes src/physics/validation/fcmGate1Convergence.json and
 * docs/FCM_GATE1_CONVERGENCE.md.
 *
 *   pnpm exec tsx scripts/fcm-gate1-convergence.ts
 *
 * The draws, fixed before any run: 48 bodies from a seeded generator over the
 * branch's domain (rule 1137) — no development case — each with the
 * development priors of rule 1139 (α, the larger share, the cloud share,
 * C_disp, σ, two fragments per break), alternately a monolith (M1, its
 * strength the product's second stage, log-uniform on 0.9–5 MPa) and a
 * structured body (M2, released at the first stage's 40–120 kPa into a main
 * piece, ten rubble pieces and a strong piece, the rest debris), alternately
 * with clouds unlimited and capped at ten radii (rule 1140).
 *
 * The reference: steps of 10 m, energy in 10 m bins, a floor of 1 g, a bound
 * of 100 000 components. The variations: the step halved (5 m) and doubled
 * (20 m); the bins (100 m); the floor (0.1 g); the bound (1 000 000), which
 * can only complete a draw the reference could not — on a completed draw it
 * changes nothing, by construction, and is checked on the first sixteen.
 *
 * The decisional quantities: the main peak's value and altitude, taken on a
 * 1 km window sliding along the fine bins (a fixed 1 km grid quantises the
 * altitude to its bins, a kilometre, which no tolerance of rule 1141 (c)
 * could pass — reported apart as the grid's phase); the energy deposited
 * and the energy at the ground, as shares of the entry's; the survival, the
 * mass of solid pieces at the ground as a share of the body's; the largest
 * piece's share. A quantity passes where it moves by less than 2 % of the
 * reference, or by less than 0.1 km, 10⁻³ of the entry's energy (per km for
 * the peak) or 0.01 of the mass where it is near zero.
 */

import { writeFileSync } from 'node:fs';
import { type FcmBody, type FcmOptions, type FcmResult } from '../src/physics/effects/fcmBranch.js';
import { FCM_DOMAIN, FCM_GATE1, FCM_PRIORS } from '../src/physics/validation/fcmRoundRules.js';
import {
  FIRST_STAGE_STRENGTH_RANGE,
  MAIN_STAGE_STRENGTH_RANGE,
} from '../src/physics/effects/atmosphericEntry.js';
import { A_SIGMA_PRIOR_S2_M2 } from '../src/physics/validation/ablationStudyRules.js';
import { FCM_FLOOR_BODY } from '../src/physics/validation/fcmRound1Rules.js';
import { engineFromArgs } from './porta1Engine.js';

/** Rule 1229 (f)(1): `--engine settle` flies rule 1227's corrected settle
 *  condition, into its own outputs. */
const { engine: ENGINE, suffix: SUFFIX } = engineFromArgs(process.argv);

const KT = 4.184e12;
const DRAWS = 48;

/** A seeded generator (the verification's own, as in the branch's tests). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

const u = lcg(11_413);
const uniform = (r: readonly [number, number]): number => r[0] + (r[1] - r[0]) * u();
const logUniform = (r: readonly [number, number]): number => r[0] * (r[1] / r[0]) ** u();

interface Draw {
  id: number;
  structure: 'M1' | 'M2';
  cloud: 'unlimited' | 'capped';
  body: FcmBody;
  options: FcmOptions;
}

const draws: Draw[] = Array.from({ length: DRAWS }, (_, id) => {
  const structured = id % 2 === 1;
  const capped = Math.floor(id / 2) % 2 === 1;
  const diameter = logUniform(FCM_DOMAIN.diameterM);
  const velocity = uniform(FCM_DOMAIN.speedMS);
  const density = uniform(FCM_DOMAIN.densityKgM3);
  const angle = (uniform(FCM_DOMAIN.angleDeg) * Math.PI) / 180;
  const s2 = logUniform(MAIN_STAGE_STRENGTH_RANGE);
  const body: FcmBody = { diameter, velocity, density, angle, strength: s2 };
  if (structured) {
    const main = uniform([0.5, 0.85]);
    const rubble = uniform([0.02, 0.1]);
    const strong = uniform([0.01, 0.05]);
    body.structure = {
      initialStrength: logUniform(FIRST_STAGE_STRENGTH_RANGE),
      groups: [
        { massShare: main, pieces: 1, strength: s2 },
        { massShare: rubble, pieces: 10, strength: s2 * uniform([1, 3]) },
        { massShare: strong, pieces: 1, strength: s2 * uniform([3, 10]) },
      ],
    };
  }
  const options: FcmOptions = {
    ablation: logUniform(A_SIGMA_PRIOR_S2_M2),
    cloudDispersion: logUniform(FCM_PRIORS.cDispersionLog),
    cloudCapRadii: capped ? 10 : null,
    alpha: uniform(FCM_PRIORS.alpha),
    split: {
      kind: 'mass',
      fragments: FCM_PRIORS.fragmentsPerBreak,
      larger: uniform(FCM_PRIORS.largerShare),
      cloud: uniform(FCM_PRIORS.cloudShare),
    },
  };
  return {
    id,
    structure: structured ? 'M2' : 'M1',
    cloud: capped ? 'capped' : 'unlimited',
    body,
    options,
  };
});

const REFERENCE: Partial<FcmOptions> = {
  stepM: 10,
  binM: 10,
  floorKg: 1e-3,
  maxComponents: 100_000,
};
const VARIATIONS: { name: string; options: Partial<FcmOptions> }[] = [
  { name: 'step 5 m', options: { stepM: 5 } },
  { name: 'step 20 m', options: { stepM: 20 } },
  { name: 'bins 100 m', options: { binM: 100 } },
  { name: 'floor 0.1 g', options: { floorKg: 1e-4 } },
];

interface Quantities {
  peakKtKm: number;
  peakAltitudeKm: number;
  depositedShare: number;
  groundEnergyShare: number;
  survivalShare: number;
  largestShare: number;
  /** The peak on the fixed 1 km grid, and on the grid shifted by half. */
  gridPeakKtKm: number;
  gridPeakShiftedKtKm: number;
}

/** The main peak on a 1 km window sliding along the result's bins. */
function slidingPeak(r: FcmResult): { value: number; altitudeKm: number } {
  const e = r.energyPerBin;
  const w = Math.round(1_000 / r.binM);
  let sum = 0;
  for (let i = 0; i < w && i < e.length; i++) sum += e[i] ?? 0;
  let best = sum;
  let at = 0;
  for (let i = w; i < e.length; i++) {
    sum += (e[i] ?? 0) - (e[i - w] ?? 0);
    if (sum > best) {
      best = sum;
      at = i - w + 1;
    }
  }
  return { value: best / KT, altitudeKm: ((at + w / 2) * r.binM) / 1_000 };
}

/** The 1 km window centred at `altitudeKm`, in kt/km. */
function windowAt(r: FcmResult, altitudeKm: number): number {
  const w = Math.round(1_000 / r.binM);
  const start = Math.round((altitudeKm * 1_000) / r.binM - w / 2);
  let s = 0;
  for (let i = Math.max(start, 0); i < start + w; i++) s += r.energyPerBin[i] ?? 0;
  return s / KT;
}

/** The peak on a fixed 1 km grid whose edges sit at `offsetM` + k km. */
function gridPeak(r: FcmResult, offsetM: number): number {
  const w = Math.round(1_000 / r.binM);
  const o = Math.round(offsetM / r.binM);
  let best = 0;
  for (let start = o; start < r.energyPerBin.length; start += w) {
    let s = 0;
    for (let i = start; i < start + w; i++) s += r.energyPerBin[i] ?? 0;
    best = Math.max(best, s);
  }
  return best / KT;
}

function quantities(r: FcmResult): Quantities {
  const p = slidingPeak(r);
  const solid = r.pieces.reduce((a, x) => a + x.count * x.mass, 0);
  const largest = r.pieces.reduce((a, x) => Math.max(a, x.mass), 0);
  return {
    peakKtKm: p.value,
    peakAltitudeKm: p.altitudeKm,
    depositedShare: r.ledger.deposited / r.energy,
    groundEnergyShare: r.ledger.groundEnergy / r.energy,
    survivalShare: solid / r.mass,
    largestShare: largest / r.mass,
    gridPeakKtKm: gridPeak(r, 0),
    gridPeakShiftedKtKm: gridPeak(r, 500),
  };
}

type Key =
  | 'peakKtKm'
  | 'peakAltitudeKm'
  | 'depositedShare'
  | 'groundEnergyShare'
  | 'survivalShare'
  | 'largestShare';
const KEYS: Key[] = [
  'peakKtKm',
  'peakAltitudeKm',
  'depositedShare',
  'groundEnergyShare',
  'survivalShare',
  'largestShare',
];

/** Rule 1141 (c): within 2 %, or within the near-zero bound. */
function passes(key: Key, ref: number, x: number, entryKt: number): boolean {
  const d = Math.abs(x - ref);
  if (d <= FCM_GATE1.convergence * Math.abs(ref)) return true;
  const z = FCM_GATE1.nearZero;
  switch (key) {
    case 'peakKtKm':
      return d <= z.energyShare * entryKt;
    case 'peakAltitudeKm':
      return d * 1_000 <= z.altitudeM;
    case 'depositedShare':
    case 'groundEnergyShare':
      return d <= z.energyShare;
    case 'survivalShare':
    case 'largestShare':
      return d <= z.share;
  }
}

const run = (d: Draw, extra: Partial<FcmOptions>): FcmResult =>
  ENGINE(d.body, { ...d.options, ...REFERENCE, ...extra });

const rows = draws.map((d) => {
  const ref = run(d, {});
  const entryKt = ref.energy / KT;
  const base = {
    id: d.id,
    structure: d.structure,
    cloud: d.cloud,
    diameterM: Number(d.body.diameter.toPrecision(4)),
    speedKmS: Number((d.body.velocity / 1_000).toPrecision(4)),
    angleDeg: Number(((d.body.angle * 180) / Math.PI).toPrecision(3)),
    entryKt: Number(entryKt.toPrecision(4)),
    completed: ref.completed,
    components: ref.components,
  };
  if (!ref.completed) {
    const big = run(d, { maxComponents: 1_000_000 });
    // Whether the strength ceiling keeps the cascade going: the same without it.
    const free = run(d, { strengthCeilingPa: Infinity });
    const split = d.options.split;
    return {
      ...base,
      bound: {
        completedAtMillion: big.completed,
        components: big.components,
        completedWithoutCeiling: free.completed,
        alpha: Number(d.options.alpha.toPrecision(3)),
        larger: split.kind === 'mass' ? Number(split.larger.toPrecision(3)) : null,
        cloud: split.kind === 'mass' ? Number(split.cloud.toPrecision(3)) : null,
      },
      reference: null,
      variations: [],
    };
  }
  const q = quantities(ref);
  const variations = VARIATIONS.map((v) => {
    const r = run(d, v.options);
    if (!r.completed)
      return {
        name: v.name,
        completed: false,
        moved: {},
        failed: [] as Key[],
        nearZero: [] as Key[],
        refAtMovedPeak: null,
      };
    const x = quantities(r);
    const failed = KEYS.filter((k) => !passes(k, q[k], x[k], entryKt));
    // Passed only by the near-zero bound, not by the 2 %.
    const nearZero = KEYS.filter(
      (k) => !failed.includes(k) && Math.abs(x[k] - q[k]) > FCM_GATE1.convergence * Math.abs(q[k])
    );
    const moved = Object.fromEntries(
      KEYS.map((k) => [k, Number((x[k] - q[k]).toPrecision(3))])
    ) as Record<Key, number>;
    // Where the peak's altitude moved, the reference's own window there, as a
    // share of its peak: near one, the profile has two peaks nearly equal.
    const refAtMovedPeak = failed.includes('peakAltitudeKm')
      ? Number((windowAt(ref, x.peakAltitudeKm) / q.peakKtKm).toPrecision(4))
      : null;
    return {
      name: v.name,
      completed: true,
      moved,
      failed,
      nearZero,
      refAtMovedPeak,
      flightAbsResidual: r.ledger.flightAbsResidual,
    };
  });
  const bound =
    d.id < 16
      ? (() => {
          const big = run(d, { maxComponents: 1_000_000 });
          const same =
            big.completed &&
            big.energyPerBin.every((e, i) => e === ref.energyPerBin[i]) &&
            big.ledger.groundEnergy === ref.ledger.groundEnergy &&
            big.components === ref.components;
          return { identical: same };
        })()
      : null;
  return {
    ...base,
    bound,
    // The mass the floor turned to dust, as a share of the body's.
    dustShare: Number((ref.ledger.dustMass / ref.mass).toPrecision(3)),
    // Rule 1154 (b): the balance in flight at the reference.
    flightAbsResidual: ref.ledger.flightAbsResidual,
    reference: Object.fromEntries(
      Object.entries(q as unknown as Record<string, number>).map(([k, x]) => [
        k,
        Number(x.toPrecision(5)),
      ])
    ) as unknown as Quantities,
    variations,
  };
});

// The summary: per variation and quantity, the draws compared, passed, and
// the worst move relative to the reference.
const summary = VARIATIONS.map((v) => ({
  variation: v.name,
  byQuantity: KEYS.map((k) => {
    let compared = 0;
    let passed = 0;
    let worst = 0;
    let byNearZero = 0;
    const failing: number[] = [];
    for (const r of rows) {
      const ref = r.reference;
      const x = r.variations.find((y) => y.name === v.name);
      if (ref === null || x?.completed !== true) continue;
      compared += 1;
      if (x.failed.includes(k)) failing.push(r.id);
      else passed += 1;
      if (x.nearZero.includes(k)) byNearZero += 1;
      const rel =
        Math.abs(ref[k]) > 0 ? Math.abs((x.moved as Record<Key, number>)[k]) / Math.abs(ref[k]) : 0;
      worst = Math.max(worst, rel);
    }
    return {
      quantity: k,
      compared,
      passed,
      byNearZero,
      worstRelative: Number(worst.toPrecision(3)),
      failing,
    };
  }),
}));

const completedRows = rows.filter((r) => r.reference !== null);
const phase = completedRows.map((r) => {
  const ref = r.reference;
  return Math.abs(ref.gridPeakShiftedKtKm - ref.gridPeakKtKm) / Math.max(ref.gridPeakKtKm, 1e-30);
});
const phaseSorted = [...phase].sort((a, b) => a - b);
const median = phaseSorted[Math.floor(phaseSorted.length / 2)] ?? 0;
const maxPhase = phaseSorted[phaseSorted.length - 1] ?? 0;

/** The floor on R17's independent wakes, the published case with the most
 *  pieces (gate 2): whether it binds there. */
const r17Floor = [1e-2, 1e-3, 1e-4].map((floorKg) => {
  const r = ENGINE(
    {
      diameter: 19.8,
      velocity: 19_160,
      density: 3_300,
      angle: (18.3 * Math.PI) / 180,
      strength: 1.55e6,
    },
    {
      ablation: 1e-8,
      cloudDispersion: 3.5,
      alpha: 0.1,
      split: { kind: 'mass', fragments: 2, larger: 0.5, cloud: 0 },
      maxComponents: 1_100_000,
      floorKg,
    }
  );
  const smallest = r.pieces.reduce((a, x) => Math.min(a, x.mass), Infinity);
  return {
    floorKg,
    components: r.components,
    dustShare: r.ledger.dustMass / r.mass,
    peakKtKm: Number(slidingPeak(r).value.toPrecision(6)),
    smallestPieceKg: Number(smallest.toPrecision(3)),
  };
});

/** Rule 1155: the body built to cascade to the floor, at 1 g and at 0.1 g. */
const floorBody = (() => {
  const f = FCM_FLOOR_BODY;
  const fly = (floorKg: number): FcmResult =>
    ENGINE(
      {
        diameter: f.diameterM,
        velocity: f.speedMS,
        density: f.densityKgM3,
        angle: (f.angleDeg * Math.PI) / 180,
        strength: f.strengthPa,
      },
      {
        ablation: 1e-8,
        cloudDispersion: 3.5,
        alpha: f.alpha,
        split: { kind: 'mass', fragments: 2, larger: 0.5, cloud: 0 },
        binM: 10,
        floorKg,
        maxComponents: 10_000_000,
      }
    );
  const [a, b] = f.floorsKg.map(fly);
  if (a === undefined || b === undefined) throw new Error('rule 1155: two floors');
  const qa = quantities(a);
  const qb = quantities(b);
  const entryKt = a.energy / KT;
  return {
    dustShare: [a.ledger.dustMass / a.mass, b.ledger.dustMass / b.mass].map((x) =>
      Number(x.toPrecision(3))
    ),
    ledger: Math.max(
      ...[a, b].map((r) =>
        Math.max(
          Math.abs(r.ledger.massResidual),
          Math.abs(r.ledger.energyResidual),
          r.ledger.momentumResidual
        )
      )
    ),
    moved: Object.fromEntries(KEYS.map((k) => [k, Number((qb[k] - qa[k]).toPrecision(3))])),
    failed: KEYS.filter((k) => !passes(k, qa[k], qb[k], entryKt)),
  };
})();

/** The draws on which the floor turned any mass to dust. */
function completedRowsDust(): number {
  return rows.filter((r) => 'dustShare' in r && r.dustShare > 0).length;
}

/** Rule 1154 (b): the balance in flight, per draw, and its order under the
 *  step halved — log2 of the residual at 10 m over that at 5 m. */
const flight = rows.flatMap((r) => {
  if (!('flightAbsResidual' in r)) return [];
  const halved = r.variations.find((v) => v.name === 'step 5 m');
  const h = halved !== undefined && 'flightAbsResidual' in halved ? halved.flightAbsResidual : null;
  return [
    {
      id: r.id,
      residual: r.flightAbsResidual,
      halved: h,
      order: h === null || h <= 0 ? null : Math.log2(r.flightAbsResidual / h),
    },
  ];
});
const flightSorted = [...flight].sort((a, b) => a.residual - b.residual);
const orders = flight.flatMap((f) => (f.order === null ? [] : [f.order])).sort((a, b) => a - b);

const out = {
  rule: '1141 (c)',
  status: 'development, before the dossier is read (rule 1147)',
  draws: DRAWS,
  completedAtReference: completedRows.length,
  notCompleted: rows
    .filter((r) => r.reference === null)
    .map((r) => ({ id: r.id, diameterM: r.diameterM, components: r.components, bound: r.bound })),
  boundIdenticalOnCompleted: rows.filter(
    (r) => r.bound !== null && 'identical' in r.bound && r.bound.identical
  ).length,
  boundChecked: rows.filter((r) => r.bound !== null && 'identical' in r.bound).length,
  floorBound: completedRowsDust(),
  r17Floor,
  floorBody,
  flight: {
    medianResidual: Number(
      (flightSorted[Math.floor(flightSorted.length / 2)]?.residual ?? 0).toPrecision(3)
    ),
    maxResidual: Number((flightSorted[flightSorted.length - 1]?.residual ?? 0).toPrecision(3)),
    medianOrder: Number((orders[Math.floor(orders.length / 2)] ?? 0).toPrecision(3)),
    leastOrder: Number((orders[0] ?? 0).toPrecision(3)),
  },
  gridPhase: {
    medianRelative: Number(median.toPrecision(3)),
    maxRelative: Number(maxPhase.toPrecision(3)),
  },
  summary,
  rows,
};
writeFileSync(
  `src/physics/validation/fcmGate1Convergence${SUFFIX}.json`,
  `${JSON.stringify(SUFFIX === '' ? out : { engine: 'rule 1227, effects/fcmBranchSettle.ts', ...out }, null, 2)}\n`
);

const NAMES: Record<Key, string> = {
  peakKtKm: 'peak value',
  peakAltitudeKm: 'peak altitude',
  depositedShare: 'deposited energy',
  groundEnergyShare: 'energy at the ground',
  survivalShare: 'survival (solid mass at the ground)',
  largestShare: 'largest piece',
};
const pct = (x: number): string => `${(x * 100).toPrecision(2)} %`;
const lines = [
  '# FCM round, gate 1 (c) — convergence on the same draws',
  '',
  ...(SUFFIX === ''
    ? []
    : [
        'Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (f)(1) — development only, beside the sealed engine’s run of `docs/FCM_GATE1_CONVERGENCE.md`.',
        '',
      ]),
  'Rule 1141 (c) (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate1-convergence.ts` —',
  'development, begun before the reviewer has read the round’s dossier (rule 1147). The design of the',
  'draws, the reference and the variations is in the script’s header, fixed before any run.',
  '',
  `${String(DRAWS)} draws over the branch’s domain, half monoliths (M1) and half structured bodies (M2), half`,
  `with clouds unlimited and half capped at ten radii; ${String(out.completedAtReference)} completed within the reference’s bound of`,
  '100 000 components. A quantity passes where it moves by less than 2 % of the reference, or by less',
  'than 0.1 km, 10⁻³ of the entry’s energy (per km for the peak) or 0.01 of the mass where it is near zero.',
  '',
  '| Variation | Quantity | Draws compared | Passed | of which by the near-zero bound | Worst move (relative) | Failing draws |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...summary.flatMap((s) =>
    s.byQuantity.map(
      (q) =>
        `| ${s.variation} | ${NAMES[q.quantity]} | ${String(q.compared)} | ${String(q.passed)} | ${String(q.byNearZero)} | ${pct(q.worstRelative)} | ${q.failing.length === 0 ? '—' : q.failing.map(String).join(', ')} |`
    )
  ),
  '',
  ...rows.flatMap((r) =>
    r.variations
      .filter((x) => x.failed.length > 0)
      .map(
        (x) =>
          `Draw ${String(r.id)} under «${x.name}» fails on ${x.failed.map((k) => NAMES[k]).join(', ')}${
            x.refAtMovedPeak === null
              ? '.'
              : `: the reference’s own profile, at the altitude the peak moved to, reaches ${(x.refAtMovedPeak * 100).toFixed(1)} % of its peak — two peaks nearly equal, between which «the main peak» is decided by less than the tolerance, not by the integration; the altitude of the main peak is not a converged quantity where the two highest peaks differ by less than the convergence tolerance, and is to be reported as both.`
          }`
      )
  ),
  '',
  `The floor turned some mass to dust on ${String(out.floorBound)} of the ${String(out.completedAtReference)} completed draws${out.floorBound === 0 ? ': no piece and no cloud fell below 1 g, so the floor’s convergence is vacuous on these draws' : ''}. On R17’s independent wakes (gate 2), ${String(r17Floor[0]?.components)} components, floors of 10 g, 1 g and 0.1 g turned ${r17Floor.every((f) => f.dustShare === 0) ? 'nothing' : 'some mass'} to dust and left the peak at ${r17Floor.map((f) => String(f.peakKtKm)).join(', ')} kt/km: the children’s strength stops the cascade first — the smallest piece there is ${String(r17Floor[0]?.smallestPieceKg)} kg. The floor binds only where a cascade would run past it, which the priors of rule 1139 did not produce here.`,
  '',
  `The bound: on ${String(out.boundChecked)} completed draws a bound of 1 000 000 left every bin, the ground’s energy and the`,
  `count identical on ${String(out.boundIdenticalOnCompleted)}. The draws the reference did not complete:`,
  ...(out.notCompleted.length === 0
    ? ['none.']
    : out.notCompleted.map(
        (n) =>
          `- draw ${String(n.id)}, ${String(n.diameterM)} m: ${
            n.bound.completedAtMillion
              ? `completed at 1 000 000 with ${String(n.bound.components)} components`
              : 'not completed at 1 000 000 either'
          }; α ${String(n.bound.alpha)}, splits ${String(n.bound.larger)} of the pieces’ mass to the larger, ${String(n.bound.cloud)} to the cloud${
            n.bound.larger !== 0.5
              ? ' — unequal pieces, none flying as one, each generation doubling the distinct pieces'
              : ''
          }; ${
            n.bound.completedWithoutCeiling
              ? 'completed without the strength ceiling, so the ceiling drives it'
              : 'not completed without the strength ceiling either, so it is the cascade’s size, not the ceiling — a cost the bound declares (rule 1138 (b)), for the register of deviations'
          }.`
      )),
  '',
  `The floor where it acts (rule 1155): a body built to cascade to it (0.5 m, 3 000 kg/m³, 20 km/s, 45°, 100 kPa, α 0, two equal fragments, no cloud) turns ${String(floorBody.dustShare[0])} of its mass to dust at 1 g and ${String(floorBody.dustShare[1])} at 0.1 g, the ledger closed to ${floorBody.ledger.toExponential(1)}; ${floorBody.failed.length === 0 ? 'every decisional quantity moves by less than its tolerance between the two floors' : `between the two floors ${floorBody.failed.map((k) => NAMES[k]).join(', ')} move beyond the tolerance — the floor is then a parameter of the branch, published with its effect`}.`,
  '',
  `The balance in flight (rule 1154 (b)): the energy given to the air, set against the drag’s work and the ablated mass’s energy integrated apart, differs by ${String(out.flight.medianResidual)} of the entry’s energy at the median draw and ${String(out.flight.maxResidual)} at most (summed step by step in absolute value); halving the step divides it by 2^${String(out.flight.medianOrder)} at the median and 2^${String(out.flight.leastOrder)} at the least — at the balance of a break, by contrast, mass, energy and momentum close to rounding (the ledger, rule 1141 (a)).`,
  '',
  `The fixed 1 km grid’s phase: shifting its edges by half a kilometre moves the peak by ${pct(median)} at the`,
  `median and ${pct(maxPhase)} at most — the reason the peak is read on a sliding window.`,
  '',
];
writeFileSync(
  `docs/FCM_GATE1_CONVERGENCE${SUFFIX.replace('.', '_').toUpperCase()}.md`,
  lines.join('\n')
);
console.log(JSON.stringify({ ...out, rows: undefined }, null, 1));
