import { describe, expect, it } from 'vitest';
import { fcmEntry, type FcmBody, type FcmOptions } from './fcmBranch.js';
import { fcmEntryH5 } from './fcmBranchH5.js';

const rad = (deg: number): number => (deg * Math.PI) / 180;

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('rule 1188 (d): H5’s fork carries no physics change — exact equality with the sealed engine', () => {
  it('reproduces the sealed candidate’s own output, bit for bit, on random M1 and M2 cases', () => {
    const r = lcg(1_188);
    const splits: FcmOptions['split'][] = [
      { kind: 'cloud' },
      { kind: 'radius', f: 0.4 },
      { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.5 },
      { kind: 'mass', fragments: 3, larger: 0.5, cloud: 0.2 },
    ];
    let completed = 0;
    for (let i = 0; i < 40; i++) {
      const structured = i % 3 === 0;
      const body: FcmBody = {
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
      };
      const options: FcmOptions = {
        ablation: 1e-9 * 16 ** r(),
        cloudDispersion: 1 + 2.5 * r(),
        cloudCapRadii: i % 2 === 0 ? null : 10,
        alpha: 0.05 + 0.55 * r(),
        split: splits[i % splits.length] ?? { kind: 'cloud' },
        maxComponents: 2_000,
      };
      const sealed = fcmEntry(body, options);
      const forked = fcmEntryH5(body, options);
      if (!sealed.completed) continue;
      completed += 1;
      expect(forked.completed).toBe(true);
      expect(forked.components).toBe(sealed.components);
      expect(forked.steps).toBe(sealed.steps);
      expect(forked.mass).toBe(sealed.mass);
      expect(forked.energy).toBe(sealed.energy);
      expect(forked.energyPerBin).toEqual(sealed.energyPerBin);
      expect(forked.firstBreakAltitude).toBe(sealed.firstBreakAltitude);
      expect(forked.firstBreakByGroup).toEqual(sealed.firstBreakByGroup);
      expect(forked.swarm).toEqual(sealed.swarm);
      expect(forked.ledger).toEqual(sealed.ledger);
      expect(forked.aggregated).toBe(sealed.aggregated);
      expect(forked.pieces.length).toBe(sealed.pieces.length);
      forked.pieces.forEach((p, j) => {
        const s = sealed.pieces[j];
        expect(s).toBeDefined();
        expect(p.count).toBe(s?.count);
        expect(p.mass).toBe(s?.mass);
        expect(p.speed).toBe(s?.speed);
        expect(p.atTerminal).toBe(s?.atTerminal);
        expect(p.group).toBe(s?.group);
      });
    }
    expect(completed).toBeGreaterThan(25);
  }, 60_000);

  it('records a landed piece’s own generation, birth state and mass trace consistently', () => {
    const body: FcmBody = {
      diameter: 4,
      velocity: 19_000,
      density: 3_000,
      angle: rad(45),
      strength: 6e5,
    };
    const r = fcmEntryH5(body, {
      ablation: 8e-9,
      cloudDispersion: 2,
      alpha: 0.3,
      split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
      maxComponents: 5_000,
    });
    expect(r.completed).toBe(true);
    expect(r.pieces.length).toBeGreaterThan(0);
    for (const p of r.pieces) {
      expect(p.generation).toBeGreaterThanOrEqual(0);
      expect(p.birthMassKg).toBeGreaterThanOrEqual(p.mass);
      expect(p.birthAltitudeM).toBeGreaterThanOrEqual(0);
      expect(p.birthSpeedMS).toBeGreaterThan(0);
      const [birth, mid, landing] = p.massTraceKg;
      expect(birth).toBe(p.birthMassKg);
      expect(landing).toBe(p.mass);
      // Monotone non-increasing: ablation only ever removes mass.
      expect(mid).toBeLessThanOrEqual(birth);
      expect(landing).toBeLessThanOrEqual(mid);
    }
    // The unbroken body never breaks here unless strength is reached; every
    // piece born at the very first break is generation 1, exactly rule
    // 1188 (a)'s definition.
    const atFirstBreak = r.pieces.filter((p) => p.birthAltitudeM === r.firstBreakAltitude);
    expect(atFirstBreak.every((p) => p.generation === 1)).toBe(true);
  }, 30_000);

  it('lands the whole body at generation 0 when it never breaks', () => {
    const r = fcmEntryH5(
      { diameter: 2, velocity: 15_000, density: 8_000, angle: rad(80), strength: Infinity },
      { ablation: 1e-9, cloudDispersion: 2, alpha: 0.2, split: { kind: 'cloud' } }
    );
    expect(r.completed).toBe(true);
    expect(r.pieces).toHaveLength(1);
    expect(r.pieces[0]?.generation).toBe(0);
    expect(r.pieces[0]?.birthAltitudeM).toBe(100_000);
  });
});
