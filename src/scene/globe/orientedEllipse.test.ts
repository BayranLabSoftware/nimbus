import { describe, expect, it } from 'vitest';
import { orientedEllipse } from './orientedEllipse.js';

describe('orientedEllipse', () => {
  it('satisfies the Cesium invariant on the exact St Helens numbers', () => {
    // Lateral blast, sector 180 degrees: crosswind = runout * sin(90)
    // = runout, downrange semi-axis = runout / 2. This is the pair
    // that stopped the globe's rendering on the St Helens and Pelee
    // presets.
    const runout = 26_600;
    const out = orientedEllipse(runout / 2, runout, 0.4);
    expect(out.semiMajorAxis).toBeGreaterThanOrEqual(out.semiMinorAxis);
    expect(out.semiMajorAxis).toBe(runout);
    expect(out.rotation).toBeCloseTo(0.4 + Math.PI / 2, 12);
  });

  it('leaves a compliant ellipse untouched', () => {
    const out = orientedEllipse(10_000, 4_000, 1.1);
    expect(out).toEqual({ semiMajorAxis: 10_000, semiMinorAxis: 4_000, rotation: 1.1 });
  });

  it('describes the same ellipse either way', () => {
    // A point on the ellipse in world coordinates must not move when
    // the axes are swapped: sample the parametric boundary through
    // both descriptions and compare.
    const along = 3_000;
    const across = 7_000;
    const rotation = 0.7;
    const out = orientedEllipse(along, across, rotation);
    for (const t of [0, 0.5, 1.3, 2.9, 4.2]) {
      // Original description: x along the bearing, y across it.
      const x = along * Math.cos(t);
      const y = across * Math.sin(t);
      const worldX = x * Math.cos(rotation) - y * Math.sin(rotation);
      const worldY = x * Math.sin(rotation) + y * Math.cos(rotation);
      // Guarded description: its own major axis, its own rotation.
      // The same world point sits at parameter t' = t - pi/2 on the
      // swapped ellipse.
      const tp = t - Math.PI / 2;
      const xg = out.semiMajorAxis * Math.cos(tp);
      const yg = out.semiMinorAxis * Math.sin(tp);
      const gX = xg * Math.cos(out.rotation) - yg * Math.sin(out.rotation);
      const gY = xg * Math.sin(out.rotation) + yg * Math.cos(out.rotation);
      expect(gX).toBeCloseTo(worldX, 6);
      expect(gY).toBeCloseTo(worldY, 6);
    }
  });
});
