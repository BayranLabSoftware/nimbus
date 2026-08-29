import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ORBIT,
  FOV_Y,
  autoFrameDistance,
  clampOrbit,
  poseFor,
  projectPoint,
  rayBasis,
  viewProjection,
} from './camera.js';

const framing = { reach: 1_560, fireballRadius: 694, fireballAltitude: 380, craterRadius: 600 };

describe('clampOrbit', () => {
  it('keeps pitch off both poles so the up vector never degenerates', () => {
    expect(clampOrbit({ yaw: 0, pitch: -5, zoom: 1 }).pitch).toBeGreaterThan(0);
    expect(clampOrbit({ yaw: 0, pitch: 99, zoom: 1 }).pitch).toBeLessThan(Math.PI / 2);
  });

  it('bounds zoom on both sides', () => {
    expect(clampOrbit({ yaw: 0, pitch: 0.3, zoom: 0 }).zoom).toBeGreaterThan(0);
    expect(clampOrbit({ yaw: 0, pitch: 0.3, zoom: 1e6 }).zoom).toBeLessThanOrEqual(4);
  });

  it('leaves yaw free to wrap', () => {
    expect(clampOrbit({ yaw: 12.5, pitch: 0.3, zoom: 1 }).yaw).toBe(12.5);
  });
});

describe('autoFrameDistance', () => {
  it('never pulls closer than the framing reach', () => {
    expect(autoFrameDistance(framing)).toBeGreaterThan(framing.reach);
  });

  it('widens as the fireball grows', () => {
    const small = autoFrameDistance({ ...framing, fireballRadius: 100 });
    const large = autoFrameDistance({ ...framing, fireballRadius: 5_000 });
    expect(large).toBeGreaterThan(small);
  });

  it('widens as the column rises', () => {
    const low = autoFrameDistance({ ...framing, fireballAltitude: 0 });
    const high = autoFrameDistance({ ...framing, fireballAltitude: 20_000 });
    expect(high).toBeGreaterThan(low * 2);
  });

  it('survives a degenerate scene', () => {
    const d = autoFrameDistance({
      reach: 0,
      fireballRadius: 0,
      fireballAltitude: 0,
      craterRadius: 0,
    });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(0);
  });
});

describe('poseFor', () => {
  const pose = poseFor(framing, DEFAULT_ORBIT);

  it('produces an orthonormal basis', () => {
    const len = (v: readonly [number, number, number]): number => Math.hypot(v[0], v[1], v[2]);
    const dot = (
      a: readonly [number, number, number],
      b: readonly [number, number, number]
    ): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (const v of [pose.right, pose.up, pose.forward]) expect(len(v)).toBeCloseTo(1, 9);
    expect(dot(pose.right, pose.up)).toBeCloseTo(0, 9);
    expect(dot(pose.right, pose.forward)).toBeCloseTo(0, 9);
    expect(dot(pose.up, pose.forward)).toBeCloseTo(0, 9);
  });

  it('sits above the ground and looks down at the target', () => {
    expect(pose.position[1]).toBeGreaterThan(0);
    expect(pose.forward[1]).toBeLessThan(0);
  });

  it('orbits: yaw moves the camera around ground zero at constant range', () => {
    const a = poseFor(framing, { ...DEFAULT_ORBIT, yaw: 0 });
    const b = poseFor(framing, { ...DEFAULT_ORBIT, yaw: Math.PI / 2 });
    const ground = (p: typeof a): number => Math.hypot(p.position[0], p.position[2]);
    expect(ground(a)).toBeCloseTo(ground(b), 6);
    expect(a.position[0]).not.toBeCloseTo(b.position[0], 3);
  });

  it('holds a stable pose even when the fireball is exactly overhead', () => {
    const overhead = poseFor({ ...framing, fireballAltitude: 1e9 }, DEFAULT_ORBIT);
    for (const v of [overhead.right, overhead.up, overhead.forward]) {
      expect(Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2])).toBe(true);
    }
  });
});

describe('viewProjection', () => {
  const pose = poseFor(framing, DEFAULT_ORBIT);
  const vp = viewProjection(pose, 16 / 9);

  it('projects the aim point to the centre of the frame', () => {
    const p = projectPoint(vp, pose.target);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.w).toBeGreaterThan(0);
  });

  it('puts ground zero inside the frame', () => {
    const p = projectPoint(vp, [0, 0, 0]);
    expect(Math.abs(p.x)).toBeLessThan(1);
    expect(Math.abs(p.y)).toBeLessThan(1);
    expect(p.w).toBeGreaterThan(0);
  });

  it('keeps the subject inside the frame at default zoom', () => {
    // What "framed" actually promises: the crater rim across the view
    // axis, and the top of the fireball, are visible. It deliberately
    // does NOT promise the whole ground disc — see the next test.
    const across: readonly [number, number, number] = [
      -Math.sin(DEFAULT_ORBIT.yaw) * framing.craterRadius,
      0,
      Math.cos(DEFAULT_ORBIT.yaw) * framing.craterRadius,
    ];
    const rim = projectPoint(vp, across);
    expect(rim.w).toBeGreaterThan(0);
    expect(Math.abs(rim.x)).toBeLessThan(1);
    expect(Math.abs(rim.y)).toBeLessThan(1);

    const top = projectPoint(vp, [0, framing.fireballAltitude + framing.fireballRadius, 0]);
    expect(top.w).toBeGreaterThan(0);
    expect(Math.abs(top.y)).toBeLessThan(1);
  });

  it('crops the near ground edge at oblique pitch, and that is intended', () => {
    // A low oblique camera cannot hold a whole ground disc: the near
    // rim subtends a larger angle than the far one. Recording it here
    // so a future "fix" does not pull the camera back and shrink the
    // event to a dot — which is exactly the mistake this framing
    // replaced.
    const near = projectPoint(vp, [
      Math.cos(DEFAULT_ORBIT.yaw) * framing.reach,
      0,
      Math.sin(DEFAULT_ORBIT.yaw) * framing.reach,
    ]);
    const far = projectPoint(vp, [
      -Math.cos(DEFAULT_ORBIT.yaw) * framing.reach,
      0,
      -Math.sin(DEFAULT_ORBIT.yaw) * framing.reach,
    ]);
    expect(Math.abs(far.y)).toBeLessThan(1);
    expect(Math.abs(near.y)).toBeGreaterThan(Math.abs(far.y));
  });

  it('puts points behind the camera at negative w', () => {
    const behind: readonly [number, number, number] = [
      pose.position[0] * 3,
      pose.position[1] * 3,
      pose.position[2] * 3,
    ];
    expect(projectPoint(vp, behind).w).toBeLessThan(0);
  });

  it('respects the aspect ratio', () => {
    const wide = viewProjection(pose, 3);
    const tall = viewProjection(pose, 0.5);
    expect(wide[0]).toBeLessThan(tall[0] ?? 0);
  });

  it('scales with the field of view', () => {
    const narrow = viewProjection(pose, 1, FOV_Y / 2);
    const broad = viewProjection(pose, 1, FOV_Y);
    expect(narrow[0]).toBeGreaterThan(broad[0] ?? 0);
  });
});

describe('rayBasis', () => {
  it('reconstructs the forward direction for a centre-of-frame ray', () => {
    const pose = poseFor(framing, DEFAULT_ORBIT);
    const b = rayBasis(pose);
    // basis * (0, 0, -1) = forward
    const dir = [-(b[6] ?? 0), -(b[7] ?? 0), -(b[8] ?? 0)];
    // Float32Array on purpose — this goes straight to a uniform, so
    // it carries GPU precision, not double precision.
    expect(dir[0]).toBeCloseTo(pose.forward[0], 6);
    expect(dir[1]).toBeCloseTo(pose.forward[1], 6);
    expect(dir[2]).toBeCloseTo(pose.forward[2], 6);
  });

  it('is nine finite numbers', () => {
    const b = rayBasis(poseFor(framing, DEFAULT_ORBIT));
    expect(b.length).toBe(9);
    expect([...b].every(Number.isFinite)).toBe(true);
  });
});
