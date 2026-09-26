/**
 * Gate 2 (c) of the FCM round (rule 1142 (c), src/physics/validation/
 * fcmRoundRules.ts) — DEVELOPMENT, begun before the reviewer has read the
 * round's dossier (rule 1147): W18's Košice, Chelyabinsk and Tagish Lake with
 * their structures as W18's text prints them, against what the text states.
 * W18's figures — the groups' exact shares and strengths — are images and are
 * not read. Where the text gives a range, the case runs at the middle (the
 * nominal) and at every corner of the ranges; where it says nothing, a choice
 * is listed, or — for a parameter that matters — a declared development range
 * is explored like W18's. Every row is therefore a partial comparison (rule
 * 1142 (d)). Writes src/physics/validation/fcmGate2W18.json and
 * docs/FCM_GATE2_W18.md.
 *
 *   pnpm exec tsx scripts/fcm-gate2-w18.ts
 */

import { writeFileSync } from 'node:fs';
import {
  fcmProfile,
  type FcmBody,
  type FcmOptions,
  type FcmResult,
} from '../src/physics/effects/fcmBranch.js';
import { engineFromArgs } from './porta1Engine.js';

/** Rule 1229 (d): `--engine settle` flies rule 1227's corrected settle
 *  condition, into its own outputs. */
const { engine: ENGINE, suffix: SUFFIX } = engineFromArgs(process.argv);

const rad = (deg: number): number => (deg * Math.PI) / 180;
const diameterOf = (mass: number, density: number): number =>
  Math.cbrt((6 * mass) / (Math.PI * density));

/** A parameter W18 gives as a range — or, where W18 is silent, a declared
 *  development range — explored at its ends; the middle is the nominal. */
interface Range {
  key: string;
  range: [number, number];
  source: 'W18' | 'unstated';
  what: string;
}

interface Case {
  name: string;
  ranges: Range[];
  build: (p: Record<string, number>) => { body: FcmBody; options: FcmOptions };
  /** What W18's text states. */
  stated: string[];
  /** Choices made where W18 is silent and no range is explored. */
  choices: string[];
  /** The flares W18 names, altitudes in km, to compare within 1 km. */
  flaresKm: number[];
  /** A peak W18's fit matched (kt/km), where its text gives one, and the
   *  band its fits fall inside. */
  peakKtKm?: number;
  peakBand?: [number, number];
  /** The landed mass W18's shown case gives (kg), and its range over W18's fits. */
  landedKg?: { shown: number; range: [number, number] };
  largestKg?: number;
  /** What W18 says of the landed mass by group: the group's index, its name,
   *  its stated share of the landed mass and of its own mass. */
  landedByGroup?: { group: number; name: string; ofLanded: number; ofGroup: number }[];
}

const r5050 = { kind: 'mass', fragments: 2, larger: 0.5 } as const;
const v = (p: Record<string, number>, k: string): number => {
  const x = p[k];
  if (x === undefined) throw new Error(`no parameter ${k}`);
  return x;
};

const CASES: Case[] = [
  {
    name: 'Košice',
    ranges: [
      {
        key: 'smallShare',
        range: [0.02, 0.03],
        source: 'W18',
        what: 'each small piece’s share (2–4 %, 4–6 % together)',
      },
      {
        key: 'weakStrength',
        range: [35e3, 40e3],
        source: 'W18',
        what: 'the weaker small piece’s strength (Pa)',
      },
      {
        key: 'strongStrength',
        range: [55e3, 70e3],
        source: 'W18',
        what: 'the stronger small piece’s strength (Pa)',
      },
      {
        key: 'strongAlpha',
        range: [0.6, 0.8],
        source: 'W18',
        what: 'the stronger small piece’s α',
      },
      {
        key: 'cloud',
        range: [0.4, 0.6],
        source: 'W18',
        what: 'the cloud share of the main flares’ breaks',
      },
      { key: 'rubbleShare', range: [0.14, 0.16], source: 'W18', what: 'the rubble’s share' },
      { key: 'rubblePieces', range: [300, 600], source: 'W18', what: 'the rubble’s pieces' },
    ],
    build: (p) => {
      const split = { kind: 'mass', fragments: 2, larger: 0.8, cloud: v(p, 'cloud') } as const;
      const small = v(p, 'smallShare');
      const rubble = v(p, 'rubbleShare');
      return {
        body: {
          diameter: 1.388,
          velocity: 15_000,
          density: 2_500,
          materialDensity: 3_400,
          angle: rad(60),
          strength: Infinity,
          structure: {
            initialStrength: 1_900,
            groups: [
              { massShare: 1 - 2 * small - rubble, pieces: 1, strength: 1.15e6, alpha: 0.3, split },
              { massShare: small, pieces: 1, strength: v(p, 'weakStrength'), alpha: 0.1, split },
              {
                massShare: small,
                pieces: 1,
                strength: v(p, 'strongStrength'),
                alpha: v(p, 'strongAlpha'),
                split,
              },
              {
                massShare: rubble,
                pieces: Math.round(v(p, 'rubblePieces')),
                strength: 1_900,
                alpha: 2,
                split: { kind: 'mass', fragments: 2, larger: 0.8, cloud: 0.002 },
              },
            ],
          },
        },
        options: { ablation: 1e-8, cloudDispersion: 2, alpha: 0.3, split },
      };
    },
    stated: [
      '3 500 kg, 15.0 km/s, 60°, bulk 2 500 kg/m³ and 1.388 m, rubble 3 400 kg/m³',
      'disrupted at 1.8–2 kPa into four groups, no debris',
      'the main piece ~80 %, breaking at ~1.15 MPa, α 0.3, cloud 50 %',
      'two pieces of ~2–4 % each (4–6 % together), at 35–40 kPa (α 0.1) and 55–70 kPa (α 0.6–0.8)',
      '300–600 pieces, 14–16 %, α 2, cloud 0.2 %, breaking at the top of the profile',
      'cloud 40–60 % (50 % shown), splits ~80/20, σ 1·10⁻⁸ s²/m², C_disp 2',
      'the large lower flare at ~37 km, the smaller upper flare near 53 km',
    ],
    choices: [
      'disruption at 1.9 kPa; the main piece the remainder of the shares (≈ 78–82 %), as «no debris» asks',
      'the rubble’s strength the disruption’s, 1.9 kPa («at the top of the observed profile»)',
      'two fragments per break (not stated for Košice)',
    ],
    flaresKm: [37, 53],
  },
  {
    name: 'Chelyabinsk',
    ranges: [
      { key: 'bulk', range: [2_200, 2_600], source: 'W18', what: 'the bulk density (kg/m³)' },
      { key: 'cDisp', range: [1.5, 2.5], source: 'W18', what: 'C_disp' },
      { key: 'sigma', range: [4e-9, 8e-9], source: 'W18', what: 'σ (s²/m²)' },
      { key: 'cloud', range: [0.75, 0.85], source: 'W18', what: 'the main group’s cloud share' },
      {
        key: 'mainStrength',
        range: [1.4e6, 1.6e6],
        source: 'W18',
        what: 'the main group’s strength (Pa)',
      },
      { key: 'debris', range: [0.002, 0.003], source: 'W18', what: 'the initial debris' },
      {
        key: 'mainAlpha',
        range: [0.05, 0.3],
        source: 'unstated',
        what: 'the main group’s α (W18’s Chelyabinsk values run from < 0.1 to 0.3–0.5)',
      },
      {
        key: 'weakAlpha',
        range: [0.08, 0.5],
        source: 'unstated',
        what: 'the weak group’s α (W18’s Chelyabinsk values, < 0.1 to 0.3–0.5)',
      },
      {
        key: 'weakCloud',
        range: [0.2, 0.75],
        source: 'unstated',
        what: 'the weak group’s cloud share (W18’s low values of 10–30 % to the 75 % of its alternative)',
      },
    ],
    build: (p) => {
      const split = { kind: 'mass', fragments: 2, larger: 0.6, cloud: v(p, 'cloud') } as const;
      const fixed = 0.0025 + 0.014 + 0.014 + 0.013 + 0.024;
      return {
        body: {
          diameter: 19.8,
          velocity: 19_160,
          density: v(p, 'bulk'),
          materialDensity: 3_300,
          angle: rad(18.3),
          strength: Infinity,
          structure: {
            initialStrength: 0.55e6,
            groups: [
              {
                massShare: 0.0025,
                pieces: 1,
                strength: 0.6e6,
                alpha: v(p, 'weakAlpha'),
                split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: v(p, 'weakCloud') },
              },
              { massShare: 1 - fixed - v(p, 'debris'), pieces: 1, strength: v(p, 'mainStrength') },
              { massShare: 0.014, pieces: 7, strength: 1.75e6 },
              { massShare: 0.014, pieces: 7, strength: 2.5e6 },
              { massShare: 0.013, pieces: 5, strength: 3.5e6 },
              {
                massShare: 0.024,
                pieces: 3,
                strength: 15.5e6,
                alpha: 0.07,
                split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.75 },
              },
            ],
          },
        },
        options: {
          ablation: v(p, 'sigma'),
          cloudDispersion: v(p, 'cDisp'),
          alpha: v(p, 'mainAlpha'),
          split,
        },
      };
    },
    stated: [
      '19.8 m, 19.16 km/s, 18.3°; bulk 2 200–2 600 kg/m³, rubble 3 300 kg/m³; six groups',
      'debris of 0.2–0.3 % released at 0.5–0.6 MPa; a weak group of 0.25 % breaking near 45 km (~0.6 MPa)',
      'the main group ~93 %, from 1.4–1.6 MPa, cloud 75–85 % at each break',
      '10–30 rubble pieces of ~0.1–0.3 % each, strengths 1.75–3.5 MPa',
      'a strong group of ~2.4–2.5 % at 15.5 MPa, α ~0.07, cloud ~75 %, splits ~60/40',
      'C_disp 1.5–2.5, σ 4–8·10⁻⁹ s²/m²; the fits inside the observed band, whose nominal peak is 83 kt/km',
      'landed 5 600 kg in the case shown (5 000–6 500 over the fits), pieces from 9 g to ~340 kg',
    ],
    choices: [
      'disruption at 0.55 MPa; the main group the remainder (≈ 93 %)',
      'the weak group one piece at 0.6 MPa, splits 60/40',
      'the main group one piece, splits 60/40; the rubble 7, 7 and 5 pieces (0.2, 0.2, 0.26 %) at 1.75, 2.5 and 3.5 MPa with the main group’s α, cloud and split',
      'the strong group three pieces of 0.8 %',
    ],
    flaresKm: [],
    peakKtKm: 83,
    // The observed curve's band, 13–21 % luminous efficiency about the 17 %
    // of its nominal (W18 after Brown et al. 2013): 83 × 17/21 to 83 × 17/13.
    peakBand: [(83 * 17) / 21, (83 * 17) / 13],
    landedKg: { shown: 5_600, range: [5_000, 6_500] },
    largestKg: 340,
    landedByGroup: [
      {
        group: 0,
        name: 'the weak group (0.25 %, breaking near 45 km)',
        ofLanded: 0.5,
        ofGroup: 0.18,
      },
      { group: 1, name: 'the main group (93 %)', ofLanded: 0.4, ofGroup: 0.0004 },
      { group: 5, name: 'the strong group (2.4 %)', ofLanded: 0.09, ofGroup: 0.004 },
    ],
  },
  {
    name: 'Tagish Lake',
    ranges: [
      { key: 'finalShare', range: [0.48, 0.5], source: 'W18', what: 'the final flare’s share' },
      {
        key: 'debris36',
        range: [0.98, 1],
        source: 'W18',
        what: 'the debris share of the 36 km flare’s breaks',
      },
      {
        key: 'alpha',
        range: [0.01, 0.05],
        source: 'W18',
        what: 'the main flares’ fragments’ α (< 0.05)',
      },
      {
        key: 'between',
        range: [0.02, 0.03],
        source: 'W18',
        what: 'the share breaking between 45 and 40 km',
      },
      {
        key: 'upper',
        range: [0.045, 0.07],
        source: 'W18',
        what: 'the upper share, breaking at 1–90 kPa',
      },
      {
        key: 'sigma',
        range: [1e-9, 1.6e-8],
        source: 'unstated',
        what: 'σ (s²/m²), the dossier’s prior (rule 1131)',
      },
    ],
    build: (p) => {
      const final = v(p, 'finalShare');
      const between = v(p, 'between');
      const upper = v(p, 'upper');
      const a = v(p, 'alpha');
      // The 36 km flare takes what the others leave (W18: ~38 %).
      const mid = 1 - final - 0.046 - between - upper;
      return {
        body: {
          diameter: diameterOf(7.8e4, 1_640),
          velocity: 15_800,
          density: 1_640,
          angle: rad(18),
          strength: Infinity,
          structure: {
            initialStrength: 1_000,
            groups: [
              ...[2.5e6, 3.05e6, 3.6e6].map((strength) => ({
                massShare: final / 3,
                pieces: 1,
                strength,
                alpha: a,
                split: { kind: 'cloud' } as const,
              })),
              ...[0.9e6, 1.4e6, 1.9e6].map((strength) => ({
                massShare: mid / 3,
                pieces: 1,
                strength,
                alpha: a,
                split: { ...r5050, cloud: v(p, 'debris36') },
              })),
              {
                massShare: 0.046,
                pieces: 1,
                strength: 0.14e6,
                alpha: 0.3,
                split: { ...r5050, cloud: 0.8 },
              },
              {
                massShare: between,
                pieces: 1,
                strength: 0.3e6,
                alpha: 0.3,
                split: { ...r5050, cloud: 0.8 },
              },
              ...[1e3, 2.1e3, 4.5e3, 9.5e3, 20e3, 42e3, 90e3].map((strength) => ({
                massShare: upper / 7,
                pieces: 1,
                strength,
                alpha: 0.1,
                split: { ...r5050, cloud: 0.2 },
              })),
            ],
          },
        },
        options: {
          ablation: v(p, 'sigma'),
          cloudDispersion: 1,
          alpha: 0.1,
          split: { ...r5050, cloud: 0.2 },
        },
      };
    },
    stated: [
      '7.8·10⁴ kg (fitted), 4.5 m at 1 640 kg/m³, 15.8 km/s, 18°; fifteen groups; C_disp 1',
      'the final flare (~32 km): 48–50 % at 2.5–3.6 MPa, all debris, in three groups',
      'the flare at ~36 km: ~38 % at 0.9–1.9 MPa, 98–100 % debris, in three groups; fragments α < 0.05',
      'the small flare at ~47 km: 4.6 % at ~0.14 MPa, cloud 80 %, α 0.3; another 2–3 % between 45 and 40 km',
      'above: 4.5–7 % breaking at 1–90 kPa, a handful of small pieces, α 0.1, two fragments, cloud 20 %',
      'landed 190 kg in the case shown (100–1 000 kg over the fits), the largest 2 kg',
    ],
    choices: [
      'the final flare in three equal groups at 2.5, 3.05, 3.6 MPa; the 36 km flare, the remainder (≈ 36–40 %), at 0.9, 1.4, 1.9 MPa',
      'splits 50/50 where unstated; the 2–3 % between 45 and 40 km one piece at 0.3 MPa, as the small flare’s group',
      'the upper share in seven pieces at 1 to 90 kPa, log-spaced (fifteen groups in all); disruption at 1 kPa, no debris',
    ],
    flaresKm: [32, 36, 47],
    landedKg: { shown: 190, range: [100, 1_000] },
    largestKg: 2,
  },
];

/** Local maxima of the 1 km profile above 5 % of the main peak (W18 plots at
 *  1 km). */
function flares(r: FcmResult): { altitudeKm: number; ktPerKm: number }[] {
  const p = fcmProfile(r);
  const top = p.peak.ktPerKm;
  const out: { altitudeKm: number; ktPerKm: number }[] = [];
  p.ktPerKm.forEach((x, i) => {
    const below = p.ktPerKm[i - 1] ?? 0;
    const above = p.ktPerKm[i + 1] ?? 0;
    if (x > below && x >= above && x >= 0.05 * top)
      out.push({ altitudeKm: p.altitudeKm[i] ?? 0, ktPerKm: Number(x.toPrecision(3)) });
  });
  return out.sort((a, b) => b.ktPerKm - a.ktPerKm);
}

interface Outcome {
  completed: boolean;
  components: number;
  massKg: number;
  entryKt: number;
  depositedKt: number;
  peak: { altitudeKm: number; ktPerKm: number };
  flares: { altitudeKm: number; ktPerKm: number }[];
  landedKg: number;
  largestKg: number;
  smallestKg: number | null;
  ledger: { mass: number; energy: number; momentum: number };
  profile: FcmResult;
  /** Per structure group: the landed mass (kg), its share of all landed, and
   *  the share of the group's own mass that landed. */
  byGroup: {
    group: number;
    landedKg: number;
    ofLanded: number;
    ofGroup: number;
    firstBreakKm: number | null;
  }[];
}

function outcome(c: Case, p: Record<string, number>): Outcome {
  const { body, options } = c.build(p);
  const r = ENGINE(body, { ...options, maxComponents: 1_000_000 });
  const prof = fcmProfile(r);
  return {
    completed: r.completed,
    components: r.components,
    massKg: Number(r.mass.toPrecision(4)),
    entryKt: Number((r.energy / 4.184e12).toPrecision(4)),
    depositedKt: Number((r.ledger.deposited / 4.184e12).toPrecision(4)),
    peak: { altitudeKm: prof.peak.altitudeKm, ktPerKm: Number(prof.peak.ktPerKm.toPrecision(4)) },
    flares: flares(r).slice(0, 6),
    landedKg: Number(r.pieces.reduce((a, x) => a + x.count * x.mass, 0).toPrecision(3)),
    largestKg: Number(r.pieces.reduce((a, x) => Math.max(a, x.mass), 0).toPrecision(3)),
    smallestKg:
      r.pieces.length === 0
        ? null
        : Number(Math.min(...r.pieces.map((x) => x.mass)).toPrecision(3)),
    ledger: {
      mass: r.ledger.massResidual,
      energy: r.ledger.energyResidual,
      momentum: r.ledger.momentumResidual,
    },
    profile: r,
    byGroup: (body.structure?.groups ?? []).map((g, k) => {
      const landed = r.pieces
        .filter((x) => x.group === k)
        .reduce((a, x) => a + x.count * x.mass, 0);
      const all = r.pieces.reduce((a, x) => a + x.count * x.mass, 0);
      return {
        group: k,
        landedKg: Number(landed.toPrecision(3)),
        ofLanded: Number((all > 0 ? landed / all : 0).toPrecision(3)),
        ofGroup: Number((landed / (g.massShare * r.mass)).toPrecision(3)),
        firstBreakKm: (() => {
          const z = r.firstBreakByGroup[k] ?? null;
          return z === null ? null : Number((z / 1_000).toPrecision(3));
        })(),
      };
    }),
  };
}

const span = (xs: number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];

const results = CASES.map((c) => {
  const nominal = Object.fromEntries(c.ranges.map((x) => [x.key, (x.range[0] + x.range[1]) / 2]));
  const n = outcome(c, nominal);
  // Every corner of the ranges.
  const corners: Outcome[] = [];
  const cornerRows: Record<string, unknown>[] = [];
  for (let mask = 0; mask < 2 ** c.ranges.length; mask++) {
    const p = Object.fromEntries(
      c.ranges.map((x, i) => [x.key, x.range[(mask >> i) & 1] ?? x.range[0]])
    );
    const o = outcome(c, p);
    corners.push(o);
    cornerRows.push({
      ...p,
      peakKtKm: o.peak.ktPerKm,
      peakAltitudeKm: o.peak.altitudeKm,
      flaresKm: o.flares.map((f) => f.altitudeKm),
      landedKg: o.landedKg,
      largestKg: o.largestKg,
    });
  }
  const all = [n, ...corners];
  // A run behaving as W18 says its fit did, on every count the text gives.
  const behaves = (o: Outcome): boolean =>
    c.flaresKm.every((z) => o.flares.some((f) => Math.abs(f.altitudeKm - z) <= 1)) &&
    (c.peakBand === undefined ||
      (o.peak.ktPerKm >= c.peakBand[0] && o.peak.ktPerKm <= c.peakBand[1])) &&
    (c.landedKg === undefined ||
      (o.landedKg >= c.landedKg.range[0] && o.landedKg <= c.landedKg.range[1]));
  const flareMatch = c.flaresKm.map((z) => {
    const found = (o: Outcome): boolean => o.flares.some((f) => Math.abs(f.altitudeKm - z) <= 1);
    return {
      statedKm: z,
      nominal: n.flares.find((f) => Math.abs(f.altitudeKm - z) <= 1) ?? null,
      corners: corners.filter(found).length,
    };
  });
  const peaks = span(all.map((o) => o.peak.ktPerKm));
  const landed = span(all.map((o) => o.landedKg));
  const largest = span(all.map((o) => o.largestKg));
  const p = fcmProfile(n.profile);
  return {
    case: c.name,
    stated: c.stated,
    choices: c.choices,
    ranges: c.ranges,
    corners: corners.length,
    joint: { nominal: behaves(n), corners: corners.filter(behaves).length },
    peakBand: c.peakBand ?? null,
    allCompleted: all.every((o) => o.completed),
    nominal: { ...n, profile: undefined },
    envelope: {
      peakKtKm: peaks,
      peakAltitudeKm: span(all.map((o) => o.peak.altitudeKm)),
      landedKg: landed,
      largestKg: largest,
    },
    flareMatch,
    peakStated: c.peakKtKm ?? null,
    peakReached: c.peakKtKm === undefined ? null : peaks[0] <= c.peakKtKm && c.peakKtKm <= peaks[1],
    landedStated: c.landedKg ?? null,
    landedByGroup: (c.landedByGroup ?? []).map((g) => {
      const at = n.byGroup.find((x) => x.group === g.group);
      const of = (o: Outcome): { ofLanded: number; ofGroup: number } =>
        o.byGroup.find((x) => x.group === g.group) ?? { ofLanded: 0, ofGroup: 0 };
      return {
        ...g,
        nominal: at ?? null,
        ofLandedSpan: span(all.map((o) => of(o).ofLanded)),
        ofGroupSpan: span(all.map((o) => of(o).ofGroup)),
      };
    }),
    firstBreaksKm: n.byGroup.map((x) => x.firstBreakKm),
    landedNominalWithin:
      c.landedKg === undefined
        ? null
        : n.landedKg >= c.landedKg.range[0] && n.landedKg <= c.landedKg.range[1],
    landedReached:
      c.landedKg === undefined
        ? null
        : landed[0] <= c.landedKg.range[1] && landed[1] >= c.landedKg.range[0],
    largestStated: c.largestKg ?? null,
    cornerRows,
    worstLedger: Math.max(
      ...all.map((o) =>
        Math.max(Math.abs(o.ledger.mass), Math.abs(o.ledger.energy), o.ledger.momentum)
      )
    ),
    profileKtKm: p.ktPerKm
      .map((x, i) => [p.altitudeKm[i] ?? 0, Number(x.toPrecision(4))] as const)
      .filter(([, x]) => x > 1e-4 * p.peak.ktPerKm),
  };
});

writeFileSync(
  `src/physics/validation/fcmGate2W18${SUFFIX}.json`,
  `${JSON.stringify({ rule: '1142 (c)', source: 'W18 (NTRS 20180002835)', status: 'development, before the dossier is read (rule 1147)', ...(SUFFIX === '' ? {} : { engine: 'rule 1227, effects/fcmBranchSettle.ts' }), results }, null, 2)}\n`
);

const f3 = (x: number): string => String(Number(x.toPrecision(3)));

/** Rule 1159: every corner, as a distribution, and each target met alone. */
function cornerTable(r: (typeof results)[number]): string[] {
  const rows = r.cornerRows as {
    peakKtKm: number;
    peakAltitudeKm: number;
    flaresKm: number[];
    landedKg: number;
    largestKg: number;
  }[];
  const q = (xs: number[], f: number): number => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1) + 0.5))] ?? 0;
  };
  const line = (name: string, xs: number[]): string =>
    `| ${name} | ${[0, 0.25, 0.5, 0.75, 1].map((f) => f3(q(xs, f))).join(' | ')} |`;
  const alone = [
    ...r.flareMatch.map(
      (m) => `the flare near ${String(m.statedKm)} km: ${String(m.corners)} of ${String(r.corners)}`
    ),
    ...(r.peakBand === null
      ? []
      : [
          `the peak in ${f3(r.peakBand[0])}–${f3(r.peakBand[1])} kt/km: ${String(rows.filter((x) => x.peakKtKm >= (r.peakBand?.[0] ?? 0) && x.peakKtKm <= (r.peakBand?.[1] ?? 0)).length)} of ${String(r.corners)}`,
        ]),
    ...(r.landedStated === null
      ? []
      : [
          `the landed mass in ${String(r.landedStated.range[0])}–${String(r.landedStated.range[1])} kg: ${String(rows.filter((x) => x.landedKg >= (r.landedStated?.range[0] ?? 0) && x.landedKg <= (r.landedStated?.range[1] ?? 0)).length)} of ${String(r.corners)}`,
        ]),
  ];
  return [
    `Every corner, as a distribution (${String(r.corners)} corners):`,
    '',
    '| Quantity | least | first quartile | median | third quartile | most |',
    '| --- | --- | --- | --- | --- | --- |',
    line(
      'main peak (kt/km)',
      rows.map((x) => x.peakKtKm)
    ),
    line(
      'its altitude (km)',
      rows.map((x) => x.peakAltitudeKm)
    ),
    line(
      'landed (kg)',
      rows.map((x) => x.landedKg)
    ),
    line(
      'largest piece (kg)',
      rows.map((x) => x.largestKg)
    ),
    '',
    `Each target alone: ${alone.join('; ')}.`,
    '',
  ];
}
const pct = (x: number): string => `${String(Number((x * 100).toPrecision(2)))} %`;
const lines = [
  '# FCM round, gate 2 (c) — W18’s structured bodies',
  '',
  ...(SUFFIX === ''
    ? []
    : [
        'Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (d) — development only, beside the sealed engine’s run of `docs/FCM_GATE2_W18.md`.',
        '',
      ]),
  'Rule 1142 (c) (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate2-w18.ts` —',
  'development, begun before the reviewer has read the round’s dossier (rule 1147). W18’s figures, which',
  'hold the groups’ exact shares and strengths, are images and are not read: each structure is rebuilt',
  'from W18’s text. Where the text gives a range, the case is run at the middle (the nominal) and at',
  'every corner of the ranges; where it is silent, a choice is listed, or — for a parameter that matters —',
  'a declared development range is explored like W18’s. Each row is a partial comparison (rule 1142',
  '(d)): whether the branch, given the structure W18 describes, can behave as W18 says its own did —',
  'the flares’ altitudes within 1 km on the 1 km profile, the peak, the landed mass.',
  '',
  'Rule 1159’s reading: **W18 partial, with its discrepancies named** — rebuilding W18’s groups from its text',
  'and trying the corners of its ranges is a study of sensitivity, not a reproduction with W18’s parameters,',
  'which W18 does not print. No corner is selected afterwards: every one is counted below, and the few that',
  'meet a case’s targets together may inform the development tuning, never stand for the gate.',
  '',
  'The uncertainty of reading: W18 gives its flares in words («around 37 km», «near 53 km», «around 32 and 36',
  'km»), read here ±1 km; its figures are not read at all. Where several peaks, the figures’ resolution or the',
  'parameters W18 leaves unsaid do not let the 1 km criterion decide, it is **not applicable**, and the',
  'comparison says what the branch does, not whether it passes. The Chelyabinsk band 67–109 kt/km is derived',
  'from W18’s luminous efficiencies (13–21 % about 17 %), not printed by W18.',
  '',
  ...results.flatMap((r) => [
    `## ${r.case}`,
    '',
    'What W18 states:',
    ...r.stated.map((s) => `- ${s};`),
    '',
    'Explored at the ends of their ranges:',
    ...r.ranges.map(
      (x) =>
        `- ${x.what}: ${f3(x.range[0])} to ${f3(x.range[1])}${x.source === 'unstated' ? ' — **not stated by W18**, a development range' : ''};`
    ),
    '',
    'Chosen where W18 is silent:',
    ...r.choices.map((s) => `- ${s};`),
    '',
    `The nominal: ${String(r.nominal.massKg)} kg, ${String(r.nominal.entryKt)} kt at entry, ${String(r.nominal.depositedKt)} kt deposited; ${String(r.nominal.components)} components; the main peak ${String(r.nominal.peak.ktPerKm)} kt/km at ${String(r.nominal.peak.altitudeKm)} km; the flares (1 km profile, above 5 % of the peak): ${r.nominal.flares.map((f) => `${String(f.ktPerKm)} at ${String(f.altitudeKm)} km`).join('; ')}.`,
    '',
    `The groups’ first breaks, nominal, in the order above: ${r.firstBreaksKm.map((z) => (z === null ? 'never' : `${String(z)} km`)).join(', ')}.`,
    '',
    `Over the ${String(r.corners)} corners and the nominal${r.allCompleted ? '' : ' (**not all completed**)'}: the peak ${f3(r.envelope.peakKtKm[0])}–${f3(r.envelope.peakKtKm[1])} kt/km at ${String(r.envelope.peakAltitudeKm[0])}–${String(r.envelope.peakAltitudeKm[1])} km; landed ${f3(r.envelope.landedKg[0])}–${f3(r.envelope.landedKg[1])} kg; the largest piece ${f3(r.envelope.largestKg[0])}–${f3(r.envelope.largestKg[1])} kg.`,
    '',
    ...(r.flareMatch.length > 0
      ? [
          `W18’s flares: ${r.flareMatch
            .map(
              (m) =>
                `${String(m.statedKm)} km — nominal ${m.nominal === null ? '**not within 1 km**' : `at ${String(m.nominal.altitudeKm)} km`}, found within 1 km in ${String(m.corners)} of ${String(r.corners)} corners`
            )
            .join('; ')}.`,
          '',
        ]
      : []),
    ...(r.peakStated !== null
      ? [
          `The peak W18’s fit matched, ${String(r.peakStated)} kt/km: ${r.peakReached === true ? 'inside' : '**outside**'} the envelope.`,
          '',
        ]
      : []),
    ...(r.landedStated !== null
      ? [
          `Landed: nominal ${String(r.nominal.landedKg)} kg against W18’s ${String(r.landedStated.shown)} kg (${String(r.landedStated.range[0])}–${String(r.landedStated.range[1])} over its fits) — ${r.landedNominalWithin === true ? 'inside' : '**outside**'} that range; the envelope ${r.landedReached === true ? 'reaches' : '**does not reach**'} it. The largest piece: nominal ${String(r.nominal.largestKg)} kg against W18’s ${String(r.largestStated)} kg.`,
          '',
          ...(r.landedByGroup.length > 0
            ? [
                'Where the landed mass comes from, W18’s shown case against the nominal:',
                '',
                '| Group | Share of the landed mass, W18 | nominal | over the corners | Share of the group’s mass landed, W18 | nominal | over the corners |',
                '| --- | --- | --- | --- | --- | --- | --- |',
                ...r.landedByGroup.map(
                  (g) =>
                    `| ${g.name} | ~${pct(g.ofLanded)} | ${g.nominal === null ? '—' : pct(g.nominal.ofLanded)} | ${pct(g.ofLandedSpan[0])}–${pct(g.ofLandedSpan[1])} | ~${pct(g.ofGroup)} | ${g.nominal === null ? '—' : pct(g.nominal.ofGroup)} | ${pct(g.ofGroupSpan[0])}–${pct(g.ofGroupSpan[1])} |`
                ),
                '',
              ]
            : []),
        ]
      : []),
    `Every count at once — ${[
      ...(r.flareMatch.length > 0 ? ['the flares within 1 km'] : []),
      ...(r.peakBand !== null
        ? [`the peak inside the observed band, ${f3(r.peakBand[0])}–${f3(r.peakBand[1])} kt/km`]
        : []),
      ...(r.landedStated !== null ? ['the landed mass inside W18’s range'] : []),
    ].join(
      ', '
    )}: the nominal ${r.joint.nominal ? 'does' : '**does not**'}; ${String(r.joint.corners)} of ${String(r.corners)} corners do.`,
    '',
    ...cornerTable(r),
    `The ledger’s worst residual over every run: ${r.worstLedger.toExponential(1)}.`,
    '',
  ]),
];
writeFileSync(`docs/FCM_GATE2_W18${SUFFIX.replace('.', '_').toUpperCase()}.md`, lines.join('\n'));
console.log(
  JSON.stringify(
    results.map(
      ({ profileKtKm: _p, stated: _s, choices: _c, ranges: _r, cornerRows: _k, ...x }) => x
    ),
    null,
    1
  )
);
