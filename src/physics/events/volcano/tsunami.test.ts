import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import type { SquareMeters } from '../../units.js';
import {
  VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL,
  VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE,
  volcanoTsunami,
  type VolcanoTsunamiInput,
} from './tsunami.js';

/**
 * Coverage for the volcanic / landslide tsunami source. The landslide
 * smoke tests only exercised the default subaerial open-ocean path; this
 * file pins the previously-untested branches the V&V audit flagged:
 * regime prefactor split, confined-basin formula, the source-water-depth
 * breaking cap, the footprint-area cavity, and the far-field 1/r decay.
 */

const base = (over: Partial<VolcanoTsunamiInput> = {}): VolcanoTsunamiInput => ({
  collapseVolumeM3: 1e6,
  slopeAngleRad: (20 * Math.PI) / 180,
  meanOceanDepth: m(4_000), // deep so the McCowan cap never binds
  ...over,
});

describe('volcanoTsunami — null guards', () => {
  it('returns null for non-positive volume, slope, or basin depth', () => {
    expect(volcanoTsunami(base({ collapseVolumeM3: 0 }))).toBeNull();
    expect(volcanoTsunami(base({ slopeAngleRad: 0 }))).toBeNull();
    expect(volcanoTsunami(base({ meanOceanDepth: m(0) }))).toBeNull();
    expect(volcanoTsunami(base({ collapseVolumeM3: Number.NaN }))).toBeNull();
  });
});

describe('volcanoTsunami — regime prefactor split (subaerial vs submarine)', () => {
  it('subaerial source is exactly K_sub/K_mar = 80× the submarine source', () => {
    // Both regimes default to their own reference density (γ-factor = 1),
    // so the ratio is purely the prefactor ratio 0.4 / 0.005 = 80.
    const sub = volcanoTsunami(base({ regime: 'subaerial' }));
    const mar = volcanoTsunami(base({ regime: 'submarine' }));
    expect(sub).not.toBeNull();
    expect(mar).not.toBeNull();
    if (!sub || !mar) return;
    const ratio = (sub.sourceAmplitude as number) / (mar.sourceAmplitude as number);
    expect(ratio).toBeCloseTo(
      VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL / VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE,
      6
    );
    expect(ratio).toBeCloseTo(80, 6);
  });
});

describe('volcanoTsunami — confined-basin branch (Vaiont)', () => {
  it('η = min(V/A·factor, depth) and is capped by the basin depth, NOT the McCowan 0.4·h limit', () => {
    // Vaiont: V = 2.7e8 m³, A = 3e6 m², factor 3, depth 250 m.
    // V/A·3 = 90·3 = 270 m → capped at the 250 m reservoir depth.
    const r = volcanoTsunami(
      base({
        collapseVolumeM3: 2.7e8,
        slopeAngleRad: (35 * Math.PI) / 180,
        meanOceanDepth: m(250),
        confinedBasinArea: 3e6 as SquareMeters,
      })
    );
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.sourceAmplitude as number).toBeCloseTo(250, 0);
    // The McCowan open-ocean cap would have been 0.4·250 = 100 m; the
    // confined-basin branch deliberately exceeds it (sloshing modes).
    expect(r.sourceAmplitude as number).toBeGreaterThan(0.4 * 250);
  });

  it('uncapped confined-basin case returns the V/A·factor static-plus-dynamic rise', () => {
    const r = volcanoTsunami(
      base({
        collapseVolumeM3: 1e6,
        meanOceanDepth: m(250),
        confinedBasinArea: 1e6 as SquareMeters,
        confinementDynamicFactor: 3,
      })
    );
    expect(r).not.toBeNull();
    if (!r) return;
    // 1e6 / 1e6 · 3 = 3 m, below the 250 m cap.
    expect(r.sourceAmplitude as number).toBeCloseTo(3, 6);
  });
});

describe('volcanoTsunami — source-water-depth breaking cap (split from basin depth)', () => {
  it('the McCowan 0.4·h cap uses sourceWaterDepth, not the propagation meanOceanDepth', () => {
    const big = base({
      collapseVolumeM3: 2e10,
      slopeAngleRad: (45 * Math.PI) / 180,
      meanOceanDepth: m(4_000),
    });
    const deep = volcanoTsunami(big); // cap = 0.4·4000 = 1600 m (not binding)
    const shallow = volcanoTsunami({ ...big, sourceWaterDepth: m(50) }); // cap = 0.4·50 = 20 m
    expect(deep).not.toBeNull();
    expect(shallow).not.toBeNull();
    if (!deep || !shallow) return;
    expect(shallow.sourceAmplitude as number).toBeCloseTo(20, 6); // 0.4·50
    expect(deep.sourceAmplitude as number).toBeGreaterThan(shallow.sourceAmplitude);
  });
});

describe('volcanoTsunami — cavity radius', () => {
  it('defaults to V^(1/3) but uses √(area/π) when a slide footprint is supplied', () => {
    const noFootprint = volcanoTsunami(base({ collapseVolumeM3: 3e12, regime: 'submarine' }));
    const withFootprint = volcanoTsunami(
      base({
        collapseVolumeM3: 3e12,
        regime: 'submarine',
        slideFootprintArea: 2.9e10 as SquareMeters, // Storegga 290×100 km
      })
    );
    expect(noFootprint).not.toBeNull();
    expect(withFootprint).not.toBeNull();
    if (!noFootprint || !withFootprint) return;
    // V^(1/3) of 3e12 ≈ 14.4 km.
    expect(noFootprint.cavityRadius as number).toBeCloseTo(Math.cbrt(3e12), 0);
    // √(2.9e10/π) ≈ 96 km — the elongated-slump equivalent disc.
    expect(withFootprint.cavityRadius as number).toBeCloseTo(Math.sqrt(2.9e10 / Math.PI), 0);
    expect(withFootprint.cavityRadius as number).toBeGreaterThan(noFootprint.cavityRadius);
  });
});

describe('volcanoTsunami — density contrast (γ/γ_ref) on the open-ocean branch', () => {
  it('denser slide makes a bigger wave; near-neutral buoyancy makes none', () => {
    const amp = (slideDensity?: number): number => {
      const r = volcanoTsunami(slideDensity === undefined ? base() : base({ slideDensity }));
      return (r?.sourceAmplitude as number | undefined) ?? 0;
    };
    expect(amp(2_900)).toBeGreaterThan(amp()); // dense basalt vs 2500 reference
    expect(amp(1_500)).toBeLessThan(amp()); // soft sediment
    expect(amp(1_000)).toBe(0); // less dense than seawater → buoyant
  });
});

describe('volcanoTsunami — far-field 1/r decay', () => {
  it('amplitude beyond the cavity falls as 1/r (10× distance → 1/10)', () => {
    const r = volcanoTsunami(
      base({
        collapseVolumeM3: 3e12,
        regime: 'submarine',
        slideFootprintArea: 2.9e10 as SquareMeters, // cavity ≈ 96 km < 100 km
      })
    );
    expect(r).not.toBeNull();
    if (!r) return;
    const a100 = r.amplitudeAt100km as number;
    const a1000 = r.amplitudeAt1000km as number;
    expect(a100).toBeGreaterThan(0);
    expect(a100 / a1000).toBeCloseTo(10, 1); // 1/r over a 10× range
  });
});

describe('volcanoTsunami — travel-time echo', () => {
  it('travel time to 1000 km exceeds the 100 km time and both are positive', () => {
    const r = volcanoTsunami(base());
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.travelTimeTo100km as number).toBeGreaterThan(0);
    expect(r.travelTimeTo1000km as number).toBeGreaterThan(r.travelTimeTo100km);
    expect(r.meanOceanDepth as number).toBe(4_000);
  });
});
