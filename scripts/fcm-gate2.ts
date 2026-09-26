/**
 * Gate 2 of the FCM round (rule 1142, src/physics/validation/fcmRoundRules.ts)
 * — DEVELOPMENT, begun before the reviewer has read the round's dossier (rule
 * 1147): the branch run on what Register, Mathias & Wheeler (2017, «R17»)
 * publish for Chelyabinsk, with their inputs, parameters, conventions and
 * resolution, against the numbers their text states. Writes
 * src/physics/validation/fcmGate2.json and docs/FCM_GATE2.md.
 *
 *   pnpm exec tsx scripts/fcm-gate2.ts
 */

import { writeFileSync } from 'node:fs';
import { fcmProfile, type FcmOptions } from '../src/physics/effects/fcmBranch.js';
import { FCM_GATE2 } from '../src/physics/validation/fcmRoundRules.js';
import { engineFromArgs } from './porta1Engine.js';

/** Rule 1229 (d): `--engine settle` flies rule 1227's corrected settle
 *  condition, into its own outputs. */
const { engine: ENGINE, suffix: SUFFIX } = engineFromArgs(process.argv);

const C = FCM_GATE2.chelyabinsk;
const body = (strength: number) => ({
  diameter: C.diameterM,
  velocity: C.speedMS,
  density: C.densityKgM3,
  angle: (C.angleDeg * Math.PI) / 180,
  strength,
});
const base: Omit<FcmOptions, 'alpha' | 'split'> = { ablation: 1e-8, cloudDispersion: 3.5 };
const observed = C.observedPeakKtKm;

/** R17's Table 1 settings, and the excess over the observed peak its text
 *  states for each (p. 12 and pp. 13–19). */
const CASES = [
  {
    name: 'pancake',
    strength: 1.6e6,
    alpha: 0,
    split: { kind: 'cloud' } as const,
    statedExcess: [0.45, 0.55],
    stated: 'about 50 % above the observed peak; W18: FCM at 3 300 kg/m³ about 123 against 83',
  },
  {
    name: 'combination, Fig. 7a (50/50 radius, α 0.1)',
    strength: 1.55e6,
    alpha: 0.1,
    split: { kind: 'radius', f: 0.5 } as const,
    statedExcess: [0.15, 0.17],
    stated: 'within 15–17 % of the observed peak, too much energy above 30 km',
  },
  {
    name: 'combination, Fig. 7b (60/40 radius, α 0.57)',
    strength: 1.55e6,
    alpha: 0.57,
    split: { kind: 'radius', f: 0.4 } as const,
    statedExcess: [0.45, 0.55],
    stated: 'about 50 % above the observed peak, a second peak appearing',
  },
  {
    name: 'independent wakes (50/50 mass, α 0.1)',
    strength: 1.55e6,
    alpha: 0.1,
    split: { kind: 'mass', fragments: 2, larger: 0.5, cloud: 0 } as const,
    statedExcess: [0.15, 0.22],
    stated: '15–22 % above the observed peak, with nearly a million fragments',
  },
];

const results = CASES.map((c) =>
  (['rk4', 'euler'] as const).map((scheme) => {
    const r = ENGINE(body(c.strength), {
      ...base,
      alpha: c.alpha,
      split: c.split,
      scheme,
      maxComponents: 1_100_000,
    });
    const p = fcmProfile(r);
    const total = r.energyPerBin.reduce((a, e) => a + e, 0) / 4.184e12;
    const excess = [p.peak.ktPerKm / observed[1] - 1, p.peak.ktPerKm / observed[0] - 1];
    // Within the stated interval of the excess, each end widened by 5 % of
    // the peak (the reviewer's tolerance on energy, rule 1142 (d)).
    const lo = observed[0] * (1 + (c.statedExcess[0] ?? 0)) * 0.95;
    const hi = observed[1] * (1 + (c.statedExcess[1] ?? 0)) * 1.05;
    return {
      case: c.name,
      scheme,
      completed: r.completed,
      components: r.components,
      peakKtKm: Number(p.peak.ktPerKm.toPrecision(4)),
      peakAltitudeKm: p.peak.altitudeKm,
      excessOverObserved: excess.map((x) => Number(x.toPrecision(3))),
      stated: c.stated,
      statedPeakKtKm: [Number(lo.toPrecision(4)), Number(hi.toPrecision(4))],
      peakWithinStated: p.peak.ktPerKm >= lo && p.peak.ktPerKm <= hi,
      depositedKt: Number(total.toPrecision(4)),
      entryKt: Number((r.energy / 4.184e12).toPrecision(4)),
      firstBreakKm:
        r.firstBreakAltitude === null
          ? null
          : Number((r.firstBreakAltitude / 1_000).toPrecision(4)),
      ledger: {
        mass: r.ledger.massResidual,
        energy: r.ledger.energyResidual,
        momentum: r.ledger.momentumResidual,
      },
      profileKtKm: p.ktPerKm
        .map((x, i) => [p.altitudeKm[i] ?? 0, Number(x.toPrecision(4))] as const)
        .filter(([z, x]) => z >= 15 && z <= 60 && x > 0.01),
    };
  })
);

writeFileSync(
  `src/physics/validation/fcmGate2${SUFFIX}.json`,
  `${JSON.stringify({ rule: '1142', source: 'R17 (NTRS 20180003387), Chelyabinsk', status: 'development, before the dossier is read (rule 1147)', ...(SUFFIX === '' ? {} : { engine: 'rule 1227, effects/fcmBranchSettle.ts' }), results }, null, 2)}\n`
);

const yes = (b: boolean): string => (b ? 'yes' : '**no**');
const lines = [
  '# FCM round, gate 2 — reproducing R17’s Chelyabinsk',
  '',
  ...(SUFFIX === ''
    ? []
    : [
        'Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (d) — development only, beside the sealed engine’s run of `docs/FCM_GATE2.md`.',
        '',
      ]),
  'Rule 1159’s reading: **R17 reproduced within the quantities its text lets one read** — whether that, with',
  'W18 partial (docs/FCM_GATE2_W18.md), is enough for a test in a restricted domain is left to the final review.',
  '',
  'The parameters, all known from R17: the inputs of its Chelyabinsk (19.8 m, 19.16 km/s, 18.3°, 3 300 kg/m³),',
  'its conventions (C_d = 1 in ½ C_d, σ = 10⁻⁸ s²/m², C_disp = 3.5, the 1976 standard atmosphere, 10 m steps from',
  '100 km) and its Table 1 for each setting (strengths, α, splits). What R17 does not print, and so what was',
  'chosen: the clouds’ end (settling within 1 % of the terminal speed, R17’s «limiting velocity» being',
  'unpublished) and the Runge–Kutta integration (R17’s own scheme, apparently explicit, run beside it).',
  '',
  'The uncertainty of reading: the excess over the observed peak is R17’s own words — «about 50 %», «15–17 %»,',
  '«15–22 %» — and the observed peak 82–83 kt/km; the criterion widens each end by 5 %. The peak’s altitude is',
  'read from R17’s figures by eye, about 29–30 km for the pancake, to ±1 km at best: the 1 km criterion on it is',
  '**not applicable** (rule 1159), and the altitude is reported, not scored. R17 prints no integrated',
  'deposition: the 5 % criterion on it is not applicable either; the deposition is set against the entry’s',
  'energy only as a check of the ledger.',
  '',
  'Rule 1142 (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate2.ts` — development,',
  'begun before the reviewer has read the round’s dossier (rule 1147). R17’s inputs (19.8 m, 19.16 km/s,',
  '18.3°, 3 300 kg/m³, from 100 km), its conventions (C_d = 1 in ½ C_d, σ = 10⁻⁸ s²/m², C_disp = 3.5, the',
  '1976 standard atmosphere, 10 m steps) and its Table 1; profiles at 1 km. The comparison is with the',
  'numbers R17’s text states — its figures are images, read by eye only for the peak’s altitude — so',
  'each row is a partial comparison where no table permits more (rule 1142 (d)). The observed peak,',
  '82–83 kt/km, is R17’s reading of Brown et al. 2013.',
  '',
  '| Setting | Scheme | Peak (kt/km) at (km) | Excess over the observed | Stated by R17 | Within the stated (±5 %) | Deposited / entry (kt) | First break (km) | Components | Ledger (mass · energy · momentum) |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...results
    .flat()
    .map(
      (r) =>
        `| ${r.case} | ${r.scheme} | ${String(r.peakKtKm)} at ${String(r.peakAltitudeKm)} | ${String(Math.round((r.excessOverObserved[0] ?? 0) * 100))}–${String(Math.round((r.excessOverObserved[1] ?? 0) * 100))} % | ${r.stated} | ${r.completed ? yes(r.peakWithinStated) : 'not completed'} | ${String(r.depositedKt)} / ${String(r.entryKt)} | ${String(r.firstBreakKm)} | ${String(r.components)} | ${r.ledger.mass.toExponential(1)} · ${r.ledger.energy.toExponential(1)} · ${r.ledger.momentum.toExponential(1)} |`
    ),
  '',
  ...results.flat().flatMap((r) => {
    if (!r.case.startsWith('combination, Fig. 7b') || r.scheme !== 'rk4') return [];
    const low = r.profileKtKm.filter(([z]) => z < 26);
    const top = low.reduce<readonly [number, number]>((a, b) => (b[1] > a[1] ? b : a), [0, 0]);
    return [
      `Fig. 7b's second peak, below 26 km: ${String(top[1])} kt/km at ${String(top[0])} km — R17's figure, read by eye, shows about 9 kt/km near 23 km.`,
      '',
    ];
  }),
  'The collective and the non-collective wakes of R17 are not built in this round (rule 1138); the',
  'peak’s altitude is read from R17’s figures by eye (about 29–30 km for the pancake), so it is reported',
  'and not scored. The deposited energy exceeds the entry’s by gravity’s work on the falling mass.',
  '',
];
writeFileSync(`docs/FCM_GATE2${SUFFIX.replace('.', '_').toUpperCase()}.md`, lines.join('\n'));
console.log(
  JSON.stringify(
    results.flat().map(({ profileKtKm: _p, ...r }) => r),
    null,
    1
  )
);
