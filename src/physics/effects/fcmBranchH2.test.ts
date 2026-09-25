import { describe, expect, it } from 'vitest';
import { H_SCALE, RHO_0 } from './entryConstants.js';
import { fcmEntryH2, type FcmH2Options } from './fcmBranchH2.js';
import { FCM_GATE1 } from '../validation/fcmRoundRules.js';
import { FCM_H2_SIGMA_RANGE } from '../validation/fcmSurvivalLightRules.js';

const rad = (deg: number): number => (deg * Math.PI) / 180;
const rhoExp = (h: number): number => RHO_0 * Math.exp(-h / H_SCALE);

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

const plain: FcmH2Options = {
  sigmaRange: FCM_H2_SIGMA_RANGE,
  sigmaDraw: lcg(1),
  cloudDispersion: 3.5,
  alpha: 0,
  split: { kind: 'cloud' },
  atmosphere: 'exponential',
  gravity: false,
  curvature: false,
};

describe('rule 1182 (c): H2 repeats gate 1’s limits (rule 1141 (b) unaffected by a per-fragment σ)', () => {
  it('flies an unbroken body as Collins’s Eq. 8, to 10⁻⁶ — no break, so one σ draw only', () => {
    for (const [D, v0, deg, rho, Cd] of [
      [2, 18_000, 45, 3_000, 1],
      [10, 25_000, 20, 2_500, 2],
    ] as const) {
      const r = fcmEntryH2(
        { diameter: D, velocity: v0, density: rho, angle: rad(deg), strength: Infinity },
        { ...plain, dragCoefficient: Cd, sigmaRange: [0, 0] }
      );
      const a = (3 * Cd * H_SCALE) / (4 * rho * D * Math.sin(rad(deg)));
      const expected = v0 * Math.exp(-a * (rhoExp(0) - rhoExp(100_000)));
      const piece = r.pieces[0];
      expect(piece).toBeDefined();
      expect(Math.abs((piece?.speed ?? 0) - expected) / expected).toBeLessThan(FCM_GATE1.limits);
    }
  });

  it('ablates an unbroken body along the closed form, to 10⁻⁶ — its one drawn σ', () => {
    const u = lcg(7);
    const sigma = u(); // the draw H2 would use, read once, so the closed form can use the same value
    const fixed = () => 0.5; // sigmaRange midpoint-independent: pin σ via a degenerate range instead
    const targetSigma = 5e-9;
    const [D, v0, rho] = [3, 20_000, 3_000];
    const r = fcmEntryH2(
      { diameter: D, velocity: v0, density: rho, angle: rad(40), strength: Infinity },
      { ...plain, sigmaRange: [targetSigma, targetSigma], sigmaDraw: fixed, floorKg: 1e-9 }
    );
    void sigma;
    const piece = r.pieces[0];
    expect(piece).toBeDefined();
    if (piece === undefined) return;
    const m0 = (Math.PI / 6) * rho * D ** 3;
    const expected = m0 * Math.exp((targetSigma * (piece.speed ** 2 - v0 ** 2)) / 2);
    expect(Math.abs(piece.mass - expected) / expected).toBeLessThan(FCM_GATE1.limits);
  });
});

describe('rule 1182 (c): the ledger closes with an independent σ per solid fragment', () => {
  it('on random bodies, splits, structures and clouds, to rule 1141 (a)’s tolerance', () => {
    const r = lcg(1_186);
    const splits: FcmH2Options['split'][] = [
      { kind: 'cloud' },
      { kind: 'radius', f: 0.4 },
      { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.5 },
      { kind: 'mass', fragments: 3, larger: 0.5, cloud: 0.2 },
    ];
    let completed = 0;
    for (let i = 0; i < 40; i++) {
      const structured = i % 3 === 0;
      const res = fcmEntryH2(
        {
          diameter: 0.3 * 10 ** r(),
          velocity: 12_000 + 18_000 * r(),
          density: 2_000 + 1_500 * r(),
          angle: rad(15 + 75 * r()),
          strength: 1e5 * 50 ** r(),
          ...(structured
            ? {
                structure: {
                  initialStrength: 5e4 * 4 ** r(),
                  groups: [
                    { massShare: 0.5, pieces: 1, strength: 1e6 * 5 ** r() },
                    { massShare: 0.3, pieces: 2, strength: 2e6 },
                    { massShare: 0.1, pieces: 3, strength: 4e6 },
                  ],
                },
              }
            : {}),
        },
        {
          sigmaRange: FCM_H2_SIGMA_RANGE,
          sigmaDraw: r,
          cloudDispersion: 1 + 2.5 * r(),
          cloudCapRadii: i % 2 === 0 ? null : 10,
          alpha: 0.05 + 0.55 * r(),
          split: splits[i % splits.length] ?? { kind: 'cloud' },
          maxComponents: 2_000,
        }
      );
      if (!res.completed) continue;
      completed += 1;
      const l = res.ledger;
      expect(Math.abs(l.massResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(Math.abs(l.energyResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(l.momentumResidual).toBeLessThan(FCM_GATE1.ledger);
      for (const p of res.pieces) {
        expect(p.mass).toBeGreaterThan(0);
        expect(p.speed).toBeGreaterThan(0);
      }
    }
    expect(completed).toBeGreaterThan(25);
  }, 60_000);

  it('closes the balance in flight (rule 1154 (b)) the same way, per-fragment σ included', () => {
    const b = { diameter: 2, velocity: 19_000, density: 3_000, angle: rad(35), strength: 8e5 };
    const r = fcmEntryH2(b, {
      sigmaRange: FCM_H2_SIGMA_RANGE,
      sigmaDraw: lcg(42),
      cloudDispersion: 2.5,
      alpha: 0.15,
      split: { kind: 'mass', fragments: 2, larger: 0.55, cloud: 0.3 },
    });
    expect(r.ledger.flightAbsResidual).toBeLessThan(1e-4);
  }, 30_000);
});

describe('rule 1186: σ is redrawn once per break, and identical fragments still bundle', () => {
  it('flies a structure group’s many identical pieces as one flight, its own σ', () => {
    // A group's bundling is exact by construction (n: g.pieces, no float-key
    // matching): the case rule 1186's per-group draw must not disturb. Both
    // groups never break again (a high strength), so each lands as one
    // FcmPiece entry carrying its full count — one flight per group, not one
    // per member (`steps`, not `components`, measures flights actually
    // simulated: `components` counts physical members, multiplicity included,
    // as it always has).
    const b = {
      diameter: 4,
      velocity: 18_000,
      density: 2_800,
      angle: rad(80),
      strength: Infinity,
      structure: {
        initialStrength: 8e4,
        groups: [
          { massShare: 0.6, pieces: 1, strength: Infinity },
          { massShare: 0.3, pieces: 500, strength: Infinity },
        ],
      },
    };
    const r = fcmEntryH2(b, {
      sigmaRange: FCM_H2_SIGMA_RANGE,
      sigmaDraw: lcg(3),
      cloudDispersion: 2,
      alpha: 0.2,
      split: { kind: 'cloud' },
    });
    expect(r.completed).toBe(true);
    expect(r.pieces.some((p) => p.count === 500)).toBe(true);
    // A handful of flights (the whole body's, then one per group) at 10 m
    // steps from 100 km: tens of thousands of steps, not the hundreds of
    // thousands 501 separate physical members would need without bundling.
    expect(r.steps).toBeLessThan(50_000);
  }, 30_000);

  it('completes a cascade with per-break σ within a reasonable bound', () => {
    const values = [0.1, 0.5, 0.9]; // distinct points of the log-uniform range, one per break
    let call = 0;
    const cycling = (): number => values[call++ % values.length] ?? 0.5;
    const b = { diameter: 3, velocity: 19_000, density: 3_000, angle: rad(45), strength: 6e5 };
    const r = fcmEntryH2(b, {
      sigmaRange: FCM_H2_SIGMA_RANGE,
      sigmaDraw: cycling,
      cloudDispersion: 2,
      alpha: 0.3,
      split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
      maxComponents: 2_000,
    });
    expect(r.completed).toBe(true);
  }, 30_000);

  it('closes the ledger the same way whether fragments bundle or fly apart', () => {
    const b = { diameter: 3, velocity: 18_000, density: 3_000, angle: rad(50), strength: 5e5 };
    const o: FcmH2Options = {
      sigmaRange: FCM_H2_SIGMA_RANGE,
      sigmaDraw: lcg(9),
      cloudDispersion: 2,
      alpha: 0.2,
      split: { kind: 'mass', fragments: 3, larger: 1 / 3, cloud: 0.3 },
    };
    // σ is drawn once per break from a stream read in the simulation's own
    // processing order, which itself changes with bundling — so, unlike the
    // sealed engine's shared-σ case, the two runs need not reach the same
    // ledger value; each must still close its own to the tolerance.
    for (const r of [fcmEntryH2(b, o), fcmEntryH2(b, { ...o, sigmaDraw: lcg(9), bundle: false })]) {
      expect(Math.abs(r.ledger.massResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(Math.abs(r.ledger.energyResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(r.ledger.momentumResidual).toBeLessThan(FCM_GATE1.ledger);
    }
  }, 30_000);
});
