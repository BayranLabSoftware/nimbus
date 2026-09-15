import { describe, expect, it } from 'vitest';
import { m, mps } from '../../units.js';
import { distanceForPgaNGAWest2, distanceForPgvNGAWest2 } from './attenuation.js';
import { pgaFromMercalliIntensity, pgvFromMercalliIntensity } from './intensity.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from './simulate.js';

describe('simulateEarthquake', () => {
  it('Northridge 1994 Mw 6.7 → ~20 km reverse rupture, MMI VIII epicentre', () => {
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input);
    // Wells–Coppersmith reverse at Mw 6.7 ≈ 23 km (test bracket matches
    // the existing ruptureLength tests).
    expect(r.ruptureLength as number).toBeGreaterThan(15_000);
    expect(r.ruptureLength as number).toBeLessThan(30_000);
    expect(r.shaking.mmiAtEpicenter).toBeGreaterThan(7);
    expect(r.shaking.mmiAtEpicenter).toBeLessThan(10);
    // Boore et al. 2014's median on reference rock puts MMI VII at about
    // 10 km; the ShakeMap's grid and Wald's survey put it at 25–30 km, the
    // gap the validation report declares.
    expect(r.shaking.mmi7Radius as number).toBeGreaterThan(8_000);
    expect(r.shaking.mmi7Radius as number).toBeLessThan(12_000);
  });

  it('Tōhoku 2011 Mw 9.1 → M₀ ≈ 5 × 10²² N·m, and no MMI IX anywhere, as its ShakeMap', () => {
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    // Hanks–Kanamori moment for Mw 9.1 ≈ 5.6 × 10²² N·m.
    expect(r.seismicMoment as number).toBeGreaterThan(4e22);
    expect(r.seismicMoment as number).toBeLessThan(8e22);
    // The 2011 ShakeMap's highest intensity anywhere was 8.18. Joyner &
    // Boore 1981, extrapolated past its data, painted 180 000 km² of Japan
    // at IX; Boore et al. 2014's saturation paints none.
    expect(r.shaking.mmi9Radius as number).toBe(0);
    expect(r.shaking.mmi8Radius as number).toBeGreaterThan(10_000);
  });

  it('defaults faultType to "all" when omitted', () => {
    const r = simulateEarthquake({ magnitude: 7 });
    const rExplicit = simulateEarthquake({ magnitude: 7, faultType: 'all' });
    expect(r.ruptureLength).toBe(rExplicit.ruptureLength);
  });

  describe('ground-motion aleatory residual (groundMotionResidualLn)', () => {
    const base = { magnitude: 7.0, faultType: 'reverse' as const };

    it('default (omitted) is identical to an explicit residual of 0', () => {
      const a = simulateEarthquake(base);
      const b = simulateEarthquake({ ...base, groundMotionResidualLn: 0 });
      expect(a.shaking.pgaAt20kmNGA).toBe(b.shaking.pgaAt20kmNGA);
      expect(a.shaking.mmi8Radius).toBe(b.shaking.mmi8Radius);
      expect(a.shaking.liquefactionRadius).toBe(b.shaking.liquefactionRadius);
    });

    it('a positive residual scales every PGA by exp(residual)', () => {
      const r0 = simulateEarthquake(base);
      const rUp = simulateEarthquake({ ...base, groundMotionResidualLn: Math.log(2) });
      // exp(ln 2) = 2× on the ground motion.
      expect(rUp.shaking.pgaAt20kmNGA as number).toBeCloseTo(
        2 * (r0.shaking.pgaAt20kmNGA as number),
        6
      );
      expect(rUp.shaking.pgaAt20km as number).toBeCloseTo(2 * (r0.shaking.pgaAt20km as number), 6);
    });

    it('a positive residual pushes the MMI contour & liquefaction radii outward', () => {
      const r0 = simulateEarthquake(base);
      const rUp = simulateEarthquake({ ...base, groundMotionResidualLn: Math.log(2) });
      expect(rUp.shaking.mmi8Radius as number).toBeGreaterThan(r0.shaking.mmi8Radius);
      expect(rUp.shaking.liquefactionRadius as number).toBeGreaterThan(
        r0.shaking.liquefactionRadius
      );
      // …and a negative residual pulls them in.
      const rDown = simulateEarthquake({ ...base, groundMotionResidualLn: -Math.log(2) });
      expect(rDown.shaking.mmi8Radius as number).toBeLessThan(r0.shaking.mmi8Radius);
    });

    it('raises the epicentral MMI but leaves rupture length untouched', () => {
      const r0 = simulateEarthquake(base);
      const rUp = simulateEarthquake({ ...base, groundMotionResidualLn: Math.log(2) });
      expect(rUp.shaking.mmiAtEpicenter).toBeGreaterThan(r0.shaking.mmiAtEpicenter);
      // Rupture length is a magnitude regression — independent of ground motion.
      expect(rUp.ruptureLength).toBe(r0.ruptureLength);
    });
  });

  it('preserves inputs in the result blob', () => {
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input);
    expect(r.inputs).toBe(EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input);
  });

  it('weak earthquakes do not yield an MMI IX ring (zero radius)', () => {
    const r = simulateEarthquake({ magnitude: 4.0 });
    expect(r.shaking.mmi9Radius as number).toBe(0);
  });

  it('flags continental scenarios as non-submarine and emits no auto-tsunami', () => {
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input);
    expect(r.isSubmarine).toBe(false);
    expect(r.submarineDepth as number).toBe(0);
    expect(r.tsunami).toBeUndefined();
  });

  it('submarine epicentre with shallow-thrust Mw ≥ 6.5 auto-triggers a tsunami', () => {
    // Mw 7.5 reverse fault under 3 000 m of water — the shallow
    // thrust component lifts the seafloor enough to seed a basin-
    // crossing wave, even without the explicit subductionInterface
    // megathrust label.
    const r = simulateEarthquake({
      magnitude: 7.5,
      faultType: 'reverse',
      waterDepth: m(3_000),
    });
    expect(r.isSubmarine).toBe(true);
    expect(r.submarineDepth as number).toBe(3_000);
    expect(r.tsunami).toBeDefined();
    expect((r.tsunami?.initialAmplitude as number | undefined) ?? 0).toBeGreaterThan(0);
  });

  it('submarine strike-slip earthquakes do not auto-trigger a tsunami', () => {
    // Strike-slip displaces the seafloor laterally; the dip-slip
    // uplift component is small; Nimbus conservatively skips the
    // auto-trigger for this fault style.
    const r = simulateEarthquake({
      magnitude: 7.5,
      faultType: 'strike-slip',
      waterDepth: m(3_000),
    });
    expect(r.isSubmarine).toBe(true);
    expect(r.tsunami).toBeUndefined();
  });

  it('submarine trigger respects the Mw ≥ 6.5 threshold', () => {
    const small = simulateEarthquake({
      magnitude: 6.0,
      faultType: 'reverse',
      waterDepth: m(2_000),
    });
    expect(small.isSubmarine).toBe(true);
    expect(small.tsunami).toBeUndefined();
  });

  it('explicit subductionInterface flag still wins regardless of waterDepth', () => {
    const r = simulateEarthquake({
      ...EARTHQUAKE_PRESETS.TOHOKU_2011.input,
      waterDepth: m(7_000), // a Japan Trench depth
    });
    expect(r.isSubmarine).toBe(true);
    expect(r.submarineDepth as number).toBe(7_000);
    expect(r.tsunami).toBeDefined();
  });

  it('every EARTHQUAKE_PRESETS entry simulates without throwing and produces a positive seismic moment', () => {
    // Smoke test: catches typos in the new presets (Valdivia, Alaska,
    // L'Aquila, Amatrice, Nepal). M0 = 10^(1.5·Mw + 9.1), so for any
    // Mw > 0 the moment is strictly positive.
    for (const [id, preset] of Object.entries(EARTHQUAKE_PRESETS)) {
      const r = simulateEarthquake(preset.input);
      expect(r.seismicMoment as number, `${id}: M0 positive`).toBeGreaterThan(0);
      expect(r.ruptureLength as number, `${id}: rupture > 0`).toBeGreaterThan(0);
    }
  });
});

describe('the ground the rings stand on', () => {
  it('softer ground widens the MMI contours, and very soft ground saturates', () => {
    // `vs30` used to be accepted, fed to the reported accelerations,
    // and dropped before the rings were drawn: every one of these
    // gave the same 17.0 km.
    const ring = (vs30: number): number =>
      (simulateEarthquake({ magnitude: 6.7, depth: m(19_000), faultType: 'reverse', vs30 }).shaking
        .mmi7Radius as number) / 1000;
    const rock = ring(760);
    expect(ring(500)).toBeGreaterThan(rock);
    expect(ring(400)).toBeGreaterThan(ring(500));
    // And then it gains less and less, because the published site term
    // saturates: soil that is already shaking hard stops behaving
    // elastically, which a power law could not have said.
    expect(ring(300) - ring(400)).toBeGreaterThan(ring(250) - ring(300));
    // Rock, where every preset in the calibration net stands.
    expect(rock).toBeCloseTo(10.1, 0);
  });
});

describe('rule 31 of validation/pagerChain.ts: the chain the rings are drawn with', () => {
  const quake = { magnitude: 7.6, faultType: 'reverse', vs30: 400 } as const;

  it('draws the rings from PGV when asked, and from PGA otherwise', () => {
    const pga = simulateEarthquake(quake);
    const pgv = simulateEarthquake({ ...quake, intensityMeasure: 'pgv' });
    const site = { magnitude: 7.6, faultType: 'reverse', vs30: 400 } as const;
    expect(pga.shaking.mmi8Radius).toBe(distanceForPgaNGAWest2(site, pgaFromMercalliIntensity(8)));
    expect(pgv.shaking.mmi8Radius).toBe(distanceForPgvNGAWest2(site, pgvFromMercalliIntensity(8)));
    expect(pga.shaking.mmi5Radius).toBeUndefined();
  });

  it("stands the rings at the edges of PAGER's bands when asked, V and VI included", () => {
    const r = simulateEarthquake({ ...quake, intensityMeasure: 'pgv', intensityBanding: 'pager' });
    const site = { magnitude: 7.6, faultType: 'reverse', vs30: 400 } as const;
    const at = (mmi: number) => distanceForPgvNGAWest2(site, pgvFromMercalliIntensity(mmi));
    expect(r.shaking.mmi5Radius).toBe(at(4.5));
    expect(r.shaking.mmi6Radius).toBe(at(5.5));
    expect(r.shaking.mmi7Radius).toBe(at(6.5));
    expect(r.shaking.mmi8Radius).toBe(at(7.5));
    expect(r.shaking.mmi9Radius).toBe(at(8.5));
  });

  it('moves a PGV ring out for a positive residual as it does a PGA ring', () => {
    const median = simulateEarthquake({ ...quake, intensityMeasure: 'pgv' });
    const strong = simulateEarthquake({
      ...quake,
      intensityMeasure: 'pgv',
      groundMotionResidualLn: 0.5,
    });
    const site = { magnitude: 7.6, faultType: 'reverse', vs30: 400 } as const;
    expect(strong.shaking.mmi7Radius).toBe(
      distanceForPgvNGAWest2(site, mps((pgvFromMercalliIntensity(7) as number) / Math.exp(0.5)))
    );
    expect(strong.shaking.mmi7Radius as number).toBeGreaterThan(median.shaking.mmi7Radius);
  });
});
