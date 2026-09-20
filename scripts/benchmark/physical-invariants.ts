/**
 * The audit of rules 548 to 554: the seven questions G5 does not ask, put to
 * the same 5 000 scenarios per domain that `invariants.ts` already draws.
 *
 * It repairs nothing (rule 554) and scores nothing (rule 548). It prints
 * every answer, zeroes included (rule 552).
 *
 * The field names below were read off the model's own output before this was
 * written, not guessed. The first draft guessed — `overpressure.psi20Radius`,
 * `crater.finalDepth`, `deaths`/`exposed` — and not one of those paths
 * exists, so it would have reported zero violations for four of the seven
 * questions and looked like an all-clear. A question asked of a field that
 * is not there is worse than a question not asked.
 *
 *   pnpm exec tsx scripts/benchmark/physical-invariants.ts
 */
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import {
  INVARIANT_QUESTIONS,
  SWEEP_SEED,
  type InvariantQuestion,
} from '../../src/physics/validation/physicalInvariantRules.js';
import { HAZARDS, type Json } from './invariants.js';

const SCENARIOS = Number(process.env.NIMBUS_INV_SCENARIOS ?? 5_000);

interface Hit {
  hazard: string;
  detail: string;
  ratio: number;
  declared: boolean;
}

const hits = new Map<InvariantQuestion, Hit[]>();
for (const q of INVARIANT_QUESTIONS) hits.set(q, []);
/** Questions whose fields were found in at least one result, so that a zero
 *  can be told apart from a question that never had anything to read. */
const asked = new Map<InvariantQuestion, number>();
for (const q of INVARIANT_QUESTIONS) asked.set(q, 0);

const note = (q: InvariantQuestion, h: Hit): void => {
  hits.get(q)?.push(h);
};
const wasAsked = (q: InvariantQuestion): void => {
  asked.set(q, (asked.get(q) ?? 0) + 1);
};

function leaves(value: unknown, path: string, out: Map<string, number>): void {
  if (typeof value === 'number') {
    out.set(path, value);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => leaves(v, `${path}[${i.toString()}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (path === '' && k === 'inputs') continue;
    leaves(v, path === '' ? k : `${path}.${k}`, out);
  }
}

/**
 * (a) NESTING. Each chain is most severe first; a pair is a violation when
 * the more severe radius is the larger. Only pairs where both are positive
 * are read, because a ring that is not drawn is not a bigger ring.
 */
const NESTED: Readonly<Record<string, readonly (readonly string[])[]>> = {
  impact: [
    // `damage.craterRim` was in this chain and is WITHDRAWN; see
    // WITHDRAWN below. Only the graded overpressure thresholds are here.
    ['damage.overpressure5psi', 'damage.overpressure1psi', 'damage.lightDamage'],
    ['damage.thirdDegreeBurn', 'damage.secondDegreeBurn'],
    [
      'entry.shockWaveRadii.fivePsi',
      'entry.shockWaveRadii.onePsi',
      'entry.shockWaveRadii.lightDamage',
    ],
    [
      'entry.shockWaveRadiiHigh.fivePsi',
      'entry.shockWaveRadiiHigh.onePsi',
      'entry.shockWaveRadiiHigh.lightDamage',
    ],
    [
      'entry.flashBurnRadii.thirdDegree',
      'entry.flashBurnRadii.secondDegree',
      'entry.flashBurnRadii.firstDegree',
    ],
    ['crater.transientDiameter', 'crater.finalDiameter'],
    ['ejecta.blanketEdge1m', 'ejecta.blanketEdge1mm'],
    ['firestorm.sustainRadius', 'firestorm.ignitionRadius'],
  ],
  explosion: [
    ['blast.overpressure5psiRadius', 'blast.overpressure1psiRadius', 'blast.lightDamageRadius'],
    [
      'blast.overpressure5psiRadiusHob',
      'blast.overpressure1psiRadiusHob',
      'blast.lightDamageRadiusHob',
    ],
    [
      'thermal.thirdDegreeBurnRadius',
      'thermal.secondDegreeBurnRadius',
      'thermal.firstDegreeBurnRadius',
    ],
    ['radiation.ld100Radius', 'radiation.ld50Radius', 'radiation.arsThresholdRadius'],
    ['firestorm.sustainRadius', 'firestorm.ignitionRadius'],
  ],
  earthquake: [['shaking.mmi9Radius', 'shaking.mmi8Radius', 'shaking.mmi7Radius']],
  // volcano and landslide have no graded chain: see WITHDRAWN.
  volcano: [],
  landslide: [],
};

/**
 * Rule 552 applies to the questions this audit ASKED WRONGLY as much as to
 * the ones it asked well. Three readings were specified, produced hits, and
 * were then found not to be laws at all — so they are withdrawn here with
 * what they found, rather than deleted as if they had never been tried. The
 * test for withdrawal is whether the pair states something true of the
 * world, and it was applied to each independently of the fact that it
 * failed:
 *
 *   impact  `damage.craterRim` inside `damage.overpressure5psi`
 *           19 of 200. NOT A LAW. A crater rim is ground excavated by the
 *           impact and a 5 psi contour is an air-blast threshold; nothing
 *           requires one inside the other, and they scale differently in
 *           energy.
 *
 *   volcano `pyroclasticRunoutEnergyLine` inside `laharRunout`
 *           40 of 200, up to 132 times. NOT A LAW. A pyroclastic current
 *           and a lahar are different phenomena, not graded thresholds of
 *           one. Either can outrun the other.
 *
 *   landslide `impulseWave.secondCrestM` under `impulseWave.firstCrestM`
 *           48 of 200. NOT A LAW, and the reference says so: the impulse
 *           wave manual's own worked Example 2 reads "As a_c2 > a_c1, the
 *           decay of the wave amplitude a_c2 ... will be determined using
 *           the 2D decay terms". The second crest outrunning the first is
 *           something the field measured, not a defect.
 *
 * And two fields were read by question (g) that are legitimately signed:
 * `entry.virtualBurstAltitude`, whose virtual source sits below the ground
 * for a body that reaches it, and `blast.hobScaled`, which is negative for a
 * buried burst. Both are in MAY_BE_NEGATIVE below.
 */
export const WITHDRAWN = [
  'impact: damage.craterRim inside damage.overpressure5psi — 19 of 200, not a law',
  'volcano: pyroclasticRunoutEnergyLine inside laharRunout — 40 of 200, not a law',
  'landslide: impulseWave.secondCrestM under firstCrestM — 48 of 200, the manual says otherwise',
  'impact: entry.virtualBurstAltitude negative — a virtual source below ground is meaningful',
  'explosion: blast.hobScaled negative — a buried burst has a negative height of burst',
  'impact: seismic.magnitude and its range negative — 38 of 25 000, down to -1.85. The moment magnitude scale is logarithmic and has no floor; microearthquakes at M -1 and -2 are recorded every day, so a small impact having one is arithmetic, not a defect. Whether a public instrument should PRINT "M -1.85" is a question about presentation, which rule 550 puts outside this audit',
] as const;

/** (b) A WAVE INSIDE ITS WATER: the amplitude, and the depth it is in. */
const WAVE_VS_DEPTH: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  impact: [['tsunami.sourceAmplitude', 'tsunami.meanOceanDepth']],
  explosion: [
    ['tsunami.sourceAmplitude', 'tsunami.waterDepth'],
    ['tsunami.sourceAmplitude', 'tsunami.meanOceanDepth'],
  ],
  earthquake: [['tsunami.initialAmplitude', 'tsunami.basinDepth']],
  landslide: [['tsunami.sourceAmplitude', 'tsunami.meanOceanDepth']],
};

/** (d) fractions that must lie in [0, 1]. Named explicitly rather than by a
 *  regular expression, so a field that is called a factor but is not one
 *  cannot wander in. */
const FRACTIONS: readonly string[] = [
  'entry.energyFractionToGround',
  'tsunami.waterCouplingFraction',
  'tsunami.seaCoupling.fraction',
  'seaCoupling.fraction',
];

/** (d) energy: what came out, and what came in. */
const ENERGY_PAIRS: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  impact: [
    ['entry.blastYieldMegatons', 'impactor.kineticEnergyMegatons'],
    ['entry.atmosphericYieldMegatons', 'impactor.kineticEnergyMegatons'],
  ],
};

/** (e) a crater's shape. */
const CRATER: Readonly<Record<string, readonly [string, string]>> = {
  impact: ['crater.depth', 'crater.finalDiameter'],
};

/** (g) quantities that are legitimately signed. */
const MAY_BE_NEGATIVE =
  /(azimuthDeg|Offset|offset|eastOffsetM|northOffsetM|climateCoolingK|Celsius|celsius|residual|Residual|bias|Bias|virtualBurstAltitude|hobScaled|seismic\.magnitude)/;

for (const hazard of HAZARDS) {
  const rng = mulberry32(SWEEP_SEED(hazard.name));
  const u = (): number => rng.next();
  for (let i = 0; i < SCENARIOS; i++) {
    const input = hazard.sample(u);
    let result: Json;
    try {
      result = hazard.run(input);
    } catch {
      continue;
    }
    const out = new Map<string, number>();
    leaves(result, '', out);
    const declared = /"outsideTestedRange":\s*\[\s*"/.test(JSON.stringify(result));
    const at = (p: string): number | undefined => out.get(p);

    // (a) nesting
    for (const chain of NESTED[hazard.name] ?? []) {
      for (let k = 1; k < chain.length; k++) {
        const severePath = chain[k - 1] ?? '';
        const mildPath = chain[k] ?? '';
        const severe = at(severePath);
        const mild = at(mildPath);
        if (severe === undefined || mild === undefined) continue;
        if (!(severe > 0 && mild > 0)) continue;
        wasAsked('nesting');
        if (severe > mild) {
          note('nesting', {
            hazard: hazard.name,
            detail: `${severePath} ${severe.toPrecision(5)} > ${mildPath} ${mild.toPrecision(5)}`,
            ratio: severe / mild,
            declared,
          });
        }
      }
    }

    // (b) a wave inside its water
    for (const [ampPath, depthPath] of WAVE_VS_DEPTH[hazard.name] ?? []) {
      const a = at(ampPath);
      const d = at(depthPath);
      if (a === undefined || d === undefined || !(d > 0) || !(a > 0)) continue;
      wasAsked('waveInsideItsWater');
      if (a > d) {
        note('waveInsideItsWater', {
          hazard: hazard.name,
          detail: `${ampPath} ${a.toPrecision(5)} m in ${d.toPrecision(5)} m of water`,
          ratio: a / d,
          declared,
        });
      }
    }

    // (c) a toll inside its exposure — the sweep's results carry no toll at
    // all, which is itself the answer and is printed as such.
    for (const [path] of out) {
      if (/deaths$|Deaths$/.test(path)) wasAsked('tollInsideItsExposure');
    }

    // (d) energy and fractions
    for (const p of FRACTIONS) {
      const v = at(p);
      if (v === undefined) continue;
      wasAsked('energy');
      if (v < 0 || v > 1) {
        note('energy', {
          hazard: hazard.name,
          detail: `${p} = ${v.toPrecision(5)}`,
          ratio: v,
          declared,
        });
      }
    }
    for (const [outPath, inPath] of ENERGY_PAIRS[hazard.name] ?? []) {
      const o = at(outPath);
      const n = at(inPath);
      if (o === undefined || n === undefined || !(n > 0)) continue;
      wasAsked('energy');
      if (o > n * (1 + 1e-9)) {
        note('energy', {
          hazard: hazard.name,
          detail: `${outPath} ${o.toPrecision(5)} of ${inPath} ${n.toPrecision(5)}`,
          ratio: o / n,
          declared,
        });
      }
    }

    // (e) a crater's shape
    const shape = CRATER[hazard.name];
    if (shape !== undefined) {
      const dep = at(shape[0]);
      const dia = at(shape[1]);
      if (dep !== undefined && dia !== undefined && dia > 0 && dep > 0) {
        wasAsked('craterShape');
        if (dep > dia) {
          note('craterShape', {
            hazard: hazard.name,
            detail: `depth ${dep.toPrecision(5)} m of a diameter ${dia.toPrecision(5)} m`,
            ratio: dep / dia,
            declared,
          });
        }
      }
    }

    // (f) an airburst is in the air
    const regime = (result as { entry?: { regime?: string } }).entry?.regime;
    if (regime !== undefined) {
      const burst = at('entry.burstAltitude');
      if (burst !== undefined) {
        wasAsked('airburstIsInTheAir');
        if (regime === 'COMPLETE_AIRBURST' && !(burst > 0)) {
          note('airburstIsInTheAir', {
            hazard: hazard.name,
            detail: `complete airburst at ${burst.toPrecision(5)} m`,
            ratio: 0,
            declared,
          });
        }
      }
    }

    // (g) nothing negative
    for (const [path, v] of out) {
      if (!Number.isFinite(v)) continue;
      if (MAY_BE_NEGATIVE.test(path)) continue;
      wasAsked('nothingNegative');
      if (v < 0) {
        note('nothingNegative', {
          hazard: hazard.name,
          detail: `${path} = ${v.toPrecision(5)}`,
          ratio: v,
          declared,
        });
      }
    }
  }
}

// ---- rule 552: every answer, zeroes included --------------------------
console.log(
  `Rules 548 to 554 — ${String(SCENARIOS)} scenarios per domain, the sweep's own seeds\n`
);
console.log('question                 violations  readings  where');
for (const q of INVARIANT_QUESTIONS) {
  const found = hits.get(q) ?? [];
  const reads = asked.get(q) ?? 0;
  const byHazard = new Map<string, number>();
  for (const h of found) byHazard.set(h.hazard, (byHazard.get(h.hazard) ?? 0) + 1);
  const where =
    reads === 0
      ? 'NOTHING TO READ — no field of this kind exists in any result'
      : [...byHazard.entries()].map(([k, v]) => `${k}=${String(v)}`).join(' ') || '—';
  console.log(
    `${q.padEnd(24)} ${String(found.length).padStart(10)}  ${String(reads).padStart(8)}  ${where}`
  );
  const kinds = new Map<string, number>();
  for (const f of found) {
    const head = f.detail.split(' ')[0] ?? '';
    const tail = f.detail.includes('>')
      ? ((f.detail.split('> ')[1] ?? '').split(' ')[0] ?? '')
      : '';
    const k = tail === '' ? `${f.hazard}: ${head}` : `${f.hazard}: ${head} > ${tail}`;
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  }
  for (const [k, n] of [...kinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6))
    console.log(`    ${String(n).padStart(5)}  ${k}`);
  for (const w of [...found].sort((a, b) => Math.abs(b.ratio) - Math.abs(a.ratio)).slice(0, 2)) {
    console.log(
      `    ${w.hazard}: ${w.detail}  (${Math.abs(w.ratio).toPrecision(4)}x, ${w.declared ? 'declared' : 'SILENT'})`
    );
  }
  if (found.length > 0) {
    console.log(
      `    silent: ${String(found.filter((h) => !h.declared).length)} of ${String(found.length)}`
    );
  }
}
console.log('\nwithdrawn readings — asked, answered, and then found not to be laws:');
for (const w of WITHDRAWN) console.log(`  ${w}`);
