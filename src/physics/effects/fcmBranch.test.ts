import { describe, expect, it } from 'vitest';
import { H_SCALE, RHO_0 } from './entryConstants.js';
import { fcmEntry, type FcmOptions } from './fcmBranch.js';
import { FCM_GATE1 } from '../validation/fcmRoundRules.js';

const rad = (deg: number): number => (deg * Math.PI) / 180;
const rhoExp = (h: number): number => RHO_0 * Math.exp(-h / H_SCALE);

/** A seeded generator: the verification's bodies are no development cases. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

const plain: FcmOptions = {
  ablation: 0,
  cloudDispersion: 3.5,
  alpha: 0,
  split: { kind: 'cloud' },
  atmosphere: 'exponential',
  gravity: false,
  curvature: false,
};

describe('rule 1141 (b): the branch’s limits', () => {
  it('flies a body that never breaks as Collins’s Eq. 8, to 10⁻⁶', () => {
    for (const [D, v0, deg, rho, Cd] of [
      [2, 18_000, 45, 3_000, 1],
      [10, 25_000, 20, 2_500, 2],
      [0.5, 14_000, 70, 3_500, 1],
    ] as const) {
      const r = fcmEntry(
        { diameter: D, velocity: v0, density: rho, angle: rad(deg), strength: Infinity },
        { ...plain, dragCoefficient: Cd }
      );
      const a = (3 * Cd * H_SCALE) / (4 * rho * D * Math.sin(rad(deg)));
      const expected = v0 * Math.exp(-a * (rhoExp(0) - rhoExp(100_000)));
      const piece = r.pieces[0];
      expect(piece).toBeDefined();
      expect(Math.abs((piece?.speed ?? 0) - expected) / expected).toBeLessThan(FCM_GATE1.limits);
    }
  });

  it('ablates a body along m₀ exp(σ (v² − v₀²) / (2 C_d)), to 10⁻⁶', () => {
    const sigma = 1e-8;
    const [D, v0, rho] = [3, 20_000, 3_000];
    const r = fcmEntry(
      { diameter: D, velocity: v0, density: rho, angle: rad(40), strength: Infinity },
      { ...plain, ablation: sigma, floorKg: 1e-9 }
    );
    const piece = r.pieces[0];
    expect(piece).toBeDefined();
    if (piece === undefined) return;
    const m0 = (Math.PI / 6) * rho * D ** 3;
    const expected = m0 * Math.exp((sigma * (piece.speed ** 2 - v0 ** 2)) / 2);
    expect(Math.abs(piece.mass - expected) / expected).toBeLessThan(FCM_GATE1.limits);
  });
});

describe('W18’s bulk and material densities', () => {
  it('flies the unbroken body on its bulk diameter, whatever its material', () => {
    const b = { diameter: 4, velocity: 17_000, density: 2_400, angle: rad(35), strength: Infinity };
    const bulk = fcmEntry(b, plain);
    const porous = fcmEntry({ ...b, materialDensity: 3_400 }, plain);
    expect(porous.pieces[0]?.speed).toBe(bulk.pieces[0]?.speed);
  });

  it('breaks it into pieces of the material’s density, smaller and so faster', () => {
    const b = { diameter: 4, velocity: 17_000, density: 2_400, angle: rad(35), strength: 1e6 };
    const o: FcmOptions = {
      ...plain,
      alpha: 0.2,
      split: { kind: 'mass', fragments: 2, larger: 0.5, cloud: 0 },
      gravity: true,
      curvature: true,
    };
    const bulk = fcmEntry(b, o);
    const dense = fcmEntry({ ...b, materialDensity: 3_400 }, o);
    const fastest = (r: typeof bulk): number => Math.max(...r.pieces.map((p) => p.speed));
    expect(fastest(dense)).toBeGreaterThan(fastest(bulk));
  });
});

describe('W18’s structure groups', () => {
  it('keeps each group’s parameters in its descendants and tags what lands', () => {
    const r = fcmEntry(
      {
        diameter: 2,
        velocity: 15_000,
        density: 2_500,
        materialDensity: 3_400,
        angle: rad(60),
        strength: Infinity,
        structure: {
          initialStrength: 2_000,
          groups: [
            // Never breaks: lands whole, as one piece of group 0.
            { massShare: 0.5, pieces: 1, strength: 1e9 },
            // Breaks, all to one cloud: nothing of group 1 lands.
            { massShare: 0.5, pieces: 1, strength: 1e5, split: { kind: 'cloud' } },
          ],
        },
      },
      { ablation: 1e-8, cloudDispersion: 2, alpha: 0.3, split: { kind: 'radius', f: 0.5 } }
    );
    expect(r.firstBreakByGroup[0]).toBeNull();
    expect(r.firstBreakByGroup[1]).toBeGreaterThan(40_000);
    expect(r.pieces.length).toBeGreaterThan(0);
    for (const p of r.pieces) expect(p.group).toBe(0);
    expect(r.pieces.reduce((a, p) => a + p.count, 0)).toBe(1);
  });
});

describe('rule 1141 (a): the ledger closes at every break and at the end', () => {
  it('on random bodies, splits, structures and clouds, gravity and curvature on', () => {
    const r = lcg(1_141);
    const splits: FcmOptions['split'][] = [
      { kind: 'cloud' },
      { kind: 'radius', f: 0.4 },
      { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.5 },
      { kind: 'mass', fragments: 3, larger: 0.5, cloud: 0.2 },
    ];
    let completed = 0;
    for (let i = 0; i < 40; i++) {
      const structured = i % 3 === 0;
      const res = fcmEntry(
        {
          diameter: 0.3 * 16 ** r(),
          velocity: 12_000 + 18_000 * r(),
          density: 2_000 + 1_500 * r(),
          angle: rad(15 + 75 * r()),
          strength: 1e5 * 50 ** r(),
          ...(structured
            ? {
                materialDensity: 3_300,
                structure: {
                  initialStrength: 5e4 * 4 ** r(),
                  groups: [
                    { massShare: 0.5, pieces: 1, strength: 1e6 * 5 ** r() },
                    {
                      massShare: 0.3,
                      pieces: 3,
                      strength: 2e6,
                      alpha: 0.05,
                      split: { kind: 'mass', fragments: 2, larger: 0.8, cloud: 0.75 },
                    },
                    { massShare: 0.1, pieces: 10, strength: 4e6, materialDensity: 3_400, alpha: 1 },
                  ],
                },
              }
            : {}),
        },
        {
          ablation: 1e-9 * 16 ** r(),
          cloudDispersion: 1 + 2.5 * r(),
          cloudCapRadii: i % 2 === 0 ? null : 10,
          alpha: 0.05 + 0.55 * r(),
          split: splits[i % splits.length] ?? { kind: 'cloud' },
          maxComponents: 3_000,
        }
      );
      if (!res.completed) continue;
      completed += 1;
      const l = res.ledger;
      expect(Math.abs(l.massResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(Math.abs(l.energyResidual)).toBeLessThan(FCM_GATE1.ledger);
      expect(l.momentumResidual).toBeLessThan(FCM_GATE1.ledger);
      for (const e of res.energyPerBin) expect(e).toBeGreaterThanOrEqual(-1e-9 * res.energy);
      for (const p of res.pieces) {
        expect(p.mass).toBeGreaterThan(0);
        expect(p.speed).toBeGreaterThan(0);
      }
    }
    expect(completed).toBeGreaterThan(30);
  }, 60_000);
});

describe('rule 1138 (b) and the bound: a cascade that does not end stops', () => {
  it('declares the draw not completed past the bound', () => {
    const res = fcmEntry(
      { diameter: 5, velocity: 20_000, density: 3_000, angle: rad(45), strength: 1e6 },
      {
        ablation: 0,
        cloudDispersion: 3.5,
        alpha: 0,
        split: { kind: 'mass', fragments: 2, larger: 0.5, cloud: 0.05 },
        maxComponents: 500,
      }
    );
    expect(res.completed).toBe(false);
  });
});

describe('identical fragments flying as one', () => {
  it('gives the same ledger, profile and ground as flying each member apart', () => {
    const b = { diameter: 3, velocity: 18_000, density: 3_000, angle: rad(50), strength: 5e5 };
    const o: FcmOptions = {
      ablation: 5e-9,
      cloudDispersion: 2,
      alpha: 0.2,
      split: { kind: 'mass', fragments: 3, larger: 1 / 3, cloud: 0.3 },
    };
    const together = fcmEntry(b, o);
    const apart = fcmEntry(b, { ...o, bundle: false });
    expect(together.components).toBe(apart.components);
    const sum = (xs: number[]): number => xs.reduce((a, x) => a + x, 0);
    expect(
      Math.abs(sum(together.energyPerBin) - sum(apart.energyPerBin)) / together.energy
    ).toBeLessThan(1e-12);
    together.energyPerBin.forEach((e, i) =>
      expect(Math.abs(e - (apart.energyPerBin[i] ?? 0))).toBeLessThanOrEqual(
        1e-12 * together.energy
      )
    );
    const ground = (r: typeof together): number =>
      sum(r.pieces.map((p) => p.count * p.mass)) + r.swarm.mass;
    expect(Math.abs(ground(together) - ground(apart))).toBeLessThanOrEqual(1e-12 * together.mass);
    expect(sum(together.pieces.map((p) => p.count))).toBe(sum(apart.pieces.map((p) => p.count)));
    // Flying every member apart is the slow way, by design: 2 s here, more
    // than vitest's default 5 s on the CI runner under the whole suite.
  }, 60_000);
});
