import { describe, expect, it } from 'vitest';
import { fcmEntry, type FcmBody, type FcmOptions } from './fcmBranch.js';
import { fcmEntryAudit } from './fcmBranchAudit.js';

const rad = (deg: number): number => (deg * Math.PI) / 180;

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('rule 1189 (b): the audit’s fork carries no physics change — exact equality with the sealed engine', () => {
  it('reproduces the sealed candidate’s own output, bit for bit, on random M1 and M2 cases', () => {
    const r = lcg(1_189);
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
      const audited = fcmEntryAudit(body, options);
      if (!sealed.completed) continue;
      completed += 1;
      expect(audited.completed).toBe(true);
      expect(audited.components).toBe(sealed.components);
      expect(audited.steps).toBe(sealed.steps);
      expect(audited.mass).toBe(sealed.mass);
      expect(audited.energy).toBe(sealed.energy);
      expect(audited.energyPerBin).toEqual(sealed.energyPerBin);
      expect(audited.firstBreakAltitude).toBe(sealed.firstBreakAltitude);
      expect(audited.firstBreakByGroup).toEqual(sealed.firstBreakByGroup);
      expect(audited.swarm).toEqual(sealed.swarm);
      expect(audited.ledger).toEqual(sealed.ledger);
      expect(audited.aggregated).toBe(sealed.aggregated);
      expect(audited.pieces.length).toBe(sealed.pieces.length);
      audited.pieces.forEach((p, j) => {
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
});

describe('rule 1189 (a): every break and every component’s fate are recorded consistently', () => {
  it('gives every component exactly one terminal fate, or none if it broke again', () => {
    const r = fcmEntryAudit(
      { diameter: 4, velocity: 19_000, density: 3_000, angle: rad(45), strength: 6e5 },
      {
        ablation: 8e-9,
        cloudDispersion: 2,
        alpha: 0.3,
        split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
        maxComponents: 5_000,
      }
    );
    expect(r.completed).toBe(true);
    expect(r.records.length).toBeGreaterThan(1);
    for (const rec of r.records) {
      if (rec.fate === 'brokeAgain') {
        expect(rec.breaksAtSeq).not.toBeNull();
        expect(rec.finalMassKg).toBeNull();
      } else {
        expect(rec.breaksAtSeq).toBeNull();
        expect(rec.finalMassKg).not.toBeNull();
        expect(rec.finalMassKg).toBeLessThanOrEqual(rec.birthMassKg);
      }
    }
    // Every landed solid piece has a matching terminal record.
    const landedSolid = r.records.filter((rec) => rec.fate === 'landedSolid');
    expect(landedSolid.length).toBe(r.pieces.length);
  }, 30_000);

  it('conserves mass at every break: the children’s total mass equals the parent’s, count included', () => {
    const r = fcmEntryAudit(
      { diameter: 4, velocity: 19_000, density: 3_000, angle: rad(45), strength: 6e5 },
      {
        ablation: 8e-9,
        cloudDispersion: 2,
        alpha: 0.3,
        split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
        maxComponents: 5_000,
      }
    );
    expect(r.completed).toBe(true);
    expect(r.breaks.length).toBeGreaterThan(0);
    for (const b of r.breaks) {
      const childrenMass = b.childRecordIndices.reduce((a, idx) => {
        const rec = r.records[idx];
        return a + (rec === undefined ? 0 : rec.count * rec.birthMassKg);
      }, 0);
      expect(Math.abs(childrenMass - b.parentMassKg) / b.parentMassKg).toBeLessThan(1e-9);
      // The bisection's own precision: dynamic pressure at the break equals
      // the parent's strength almost exactly.
      expect(Math.abs(b.pressureRatio - 1)).toBeLessThan(1e-3);
    }
  }, 30_000);

  it('gives every child one generation more than its parent, from the entry body’s own 0', () => {
    const r = fcmEntryAudit(
      { diameter: 4, velocity: 19_000, density: 3_000, angle: rad(45), strength: 6e5 },
      {
        ablation: 8e-9,
        cloudDispersion: 2,
        alpha: 0.3,
        split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
        maxComponents: 5_000,
      }
    );
    expect(r.completed).toBe(true);
    expect(r.records[0]?.generation).toBe(0);
    expect(r.records[0]?.bornAtBreakSeq).toBeNull();
    for (const b of r.breaks) {
      for (const idx of b.childRecordIndices) {
        expect(r.records[idx]?.generation).toBe(b.generation + 1);
        expect(r.records[idx]?.bornAtBreakSeq).toBe(b.seq);
      }
    }
  }, 30_000);

  it('records a structured body’s initial disruption as break 0, its groups at generation 1', () => {
    const body: FcmBody = {
      diameter: 4,
      velocity: 19_000,
      density: 3_000,
      angle: rad(45),
      strength: 6e5,
      structure: {
        initialStrength: 5e4,
        groups: [
          { massShare: 0.6, pieces: 1, strength: 1e6 },
          { massShare: 0.3, pieces: 3, strength: 2e6 },
        ],
      },
    };
    const r = fcmEntryAudit(body, {
      ablation: 8e-9,
      cloudDispersion: 2,
      alpha: 0.3,
      split: { kind: 'cloud' },
      maxComponents: 5_000,
    });
    expect(r.completed).toBe(true);
    expect(r.breaks.length).toBeGreaterThanOrEqual(1);
    const initial = r.breaks[0];
    expect(initial?.generation).toBe(0);
    // The whole-body disruption's two groups (and, if the shares leave a
    // remainder, its debris cloud) all born one generation past the entry.
    expect(initial?.childRecordIndices.length).toBeGreaterThanOrEqual(2);
    for (const idx of initial?.childRecordIndices ?? []) {
      expect(r.records[idx]?.generation).toBe(1);
      expect(r.records[idx]?.bornAtBreakSeq).toBe(0);
    }
  }, 30_000);
});

describe('rule 1190 (a): the exact reason every stopped component stopped, and a cloud’s own metrics there', () => {
  it('gives every terminal record a stop reason consistent with its fate, and none to a break or a landing', () => {
    const r = fcmEntryAudit(
      { diameter: 4, velocity: 19_000, density: 3_000, angle: rad(45), strength: 6e5 },
      {
        ablation: 8e-9,
        cloudDispersion: 2,
        alpha: 0.3,
        split: { kind: 'mass', fragments: 2, larger: 0.6, cloud: 0.2 },
        maxComponents: 5_000,
      }
    );
    expect(r.completed).toBe(true);
    let settledCount = 0;
    for (const rec of r.records) {
      if (rec.fate === 'brokeAgain' || rec.fate === 'aggregated') {
        expect(rec.stopReason).toBeNull();
        expect(rec.finalRadiusM).toBeNull();
        expect(rec.localTerminalSpeedMS).toBeNull();
      } else if (rec.fate === 'landedSolid' || rec.fate === 'landedCloud') {
        expect(rec.stopReason).toBeNull();
      } else if (rec.fate === 'settled') {
        settledCount += 1;
        expect(rec.stopReason).not.toBeNull();
        expect(['terminalVelocity', 'nonPhysicalStep']).toContain(rec.stopReason);
        expect(rec.isCloud).toBe(true);
        expect(rec.finalRadiusM).not.toBeNull();
        expect(rec.finalRadiusM).toBeGreaterThan(0);
        expect(rec.localTerminalSpeedMS).not.toBeNull();
      } else {
        expect(rec.fate).toBe('dust');
        expect(rec.stopReason).not.toBeNull();
        expect(['massFloor', 'nonPhysicalStep']).toContain(rec.stopReason);
      }
    }
    expect(settledCount).toBeGreaterThan(0);
  }, 30_000);

  it('stops a settled cloud within `settleWithin` of its own recorded local terminal speed', () => {
    const r = fcmEntryAudit(
      { diameter: 6, velocity: 18_000, density: 3_000, angle: rad(35), strength: 4e5 },
      {
        ablation: 6e-9,
        cloudDispersion: 3,
        alpha: 0.25,
        split: { kind: 'cloud' },
        maxComponents: 5_000,
      }
    );
    expect(r.completed).toBe(true);
    const settledByTerminal = r.records.filter(
      (rec) => rec.fate === 'settled' && rec.stopReason === 'terminalVelocity'
    );
    expect(settledByTerminal.length).toBeGreaterThan(0);
    for (const rec of settledByTerminal) {
      const speed = rec.finalSpeedMS ?? 0;
      const localTerminal = rec.localTerminalSpeedMS ?? 0;
      expect(speed).toBeLessThanOrEqual(1.01 * localTerminal + 1e-9);
    }
  });
});
