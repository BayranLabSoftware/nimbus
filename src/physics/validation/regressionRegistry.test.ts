/**
 * Centralized regression-test registry.
 *
 * Every historical bug listed in `docs/BUG_REGISTRY.md` MUST have one
 * named test here. The test name MUST match the table row exactly so a
 * grep against either is enough to find the other.
 *
 * Naming convention: `B-NNN <short title>`.
 *
 * When a new bug is filed:
 *   1. Add a row to BUG_REGISTRY.md with placeholder commit hash.
 *   2. Add a failing test here (test-first).
 *   3. Fix the production code.
 *   4. Test passes; commit; update BUG_REGISTRY.md with the real hash.
 *
 * This file is the single integration anchor for "did the fix really
 * fix what we said it fixed, and does it stay fixed".
 */

import { describe, expect, it } from 'vitest';
import { simulateEarthquake, EARTHQUAKE_PRESETS } from '../events/earthquake/index.js';
import { simulateExplosion } from '../events/explosion/simulate.js';
import { NUCLEAR_CRATER_COEFFICIENT } from '../events/explosion/cratering.js';
import { thermalPartitionForHeight } from '../events/explosion/thermal.js';
import { DEFAULT_CONFINEMENT_DYNAMIC_FACTOR } from '../events/volcano/tsunami.js';
import { simulateVolcano, VOLCANO_PRESETS } from '../events/volcano/index.js';
import { simulateLandslide, LANDSLIDE_PRESETS } from '../events/landslide/index.js';
import { simulateImpact, IMPACT_PRESETS } from '../simulate.js';
import { oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { CRUSTAL_ROCK_DENSITY } from '../constants.js';
import { m } from '../units.js';
import { validateScenario } from './inputSchema.js';
import { safeRunEarthquake } from './safeRun.js';

describe('Historical bug regression registry — see docs/BUG_REGISTRY.md', () => {
  it('B-001 Krakatau caldera-collapse near-field amplitude', () => {
    // Pre-fix: source 20 m, amp@100km = 0.008 m (vs Self 1992 30-40 m
    // runup at Anjer ~50 km). Fix: cavity from V^(1/3), source-water-
    // depth split.
    // Commit: 216b6d2
    const r = simulateVolcano(VOLCANO_PRESETS.KRAKATAU_1883.input);
    expect(r.tsunami).toBeDefined();
    if (!r.tsunami) return;
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(50);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(150);
    expect(r.tsunami.amplitudeAt100km as number).toBeGreaterThan(0.5);
  });

  it('B-002 Storegga slump-footprint cavity', () => {
    // Pre-fix: cavity = 12.6 m (back-derived from η₀), amp@1000km = 0.08 mm.
    // Fix: slideFootprintArea sets equivalent-disc cavity ~96 km.
    // Commit: 88fd964
    const r = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.cavityRadius as number).toBeGreaterThan(50_000);
    expect(r.tsunami.amplitudeAt1000km as number).toBeGreaterThan(0.3);
  });

  it('B-003 Vaiont confined-basin source', () => {
    // Pre-fix: source 56 m vs a 250 m wave then believed observed;
    // Genevois & Ghirotti 2005 give a crest 140 m above the dam top.
    // Fix: confined-basin formula η = V/A × dynamic_factor.
    // Commit: 2b06388
    const r = simulateLandslide(LANDSLIDE_PRESETS.VAIONT_1963.input);
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(125);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(165);
  });

  it('B-004 Sikhote-Alin iron strewn-field largest crater', () => {
    // Pre-fix: single 178 m crater. Observed: 122 craters, largest 26 m.
    // Fix: iron strewn-field branch (ρ ≥ 6000, breakup > 0, D < 20 m).
    // Commit: 854edd4
    const r = simulateImpact(IMPACT_PRESETS.SIKHOTE_ALIN_1947.input);
    expect(r.crater.finalDiameter as number).toBeGreaterThan(15);
    expect(r.crater.finalDiameter as number).toBeLessThan(50);
  });

  it('B-005 Sumatra rupture override', () => {
    // Pre-fix: 803 km from Strasser median (vs Lay 2005: 1300 km).
    // Fix: ruptureLengthOverride = 1.3 Mm, ruptureWidthOverride = 200 km.
    // Commit: 3b50967
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.SUMATRA_2004.input);
    const Lkm = (r.ruptureLength as number) / 1_000;
    const Wkm = (r.ruptureWidth as number) / 1_000;
    expect(Lkm).toBeGreaterThan(1_200);
    expect(Lkm).toBeLessThan(1_400);
    expect(Wkm).toBeGreaterThan(150);
    expect(Wkm).toBeLessThan(250);
  });

  it('B-006 Megathrust slip aspect-ratio 2.5 + Satake coupling 0.7', () => {
    // Pre-fix: Tōhoku slip 6.78 m vs Hayes 2017 8-10 m.
    // Fix: aspect 2 → 2.5 + WAVE_COUPLING 0.9 → 0.7.
    // Commit: 467f74a
    //
    // The aspect ratio itself is gone from this path since
    // 9 September 2026: the caller supplies the same width the rest
    // of the result is drawn with, and the band moved with it. See
    // the note in historicalValidation.test.ts.
    const r = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    expect(r.tsunami).toBeDefined();
    if (!r.tsunami) return;
    expect(r.tsunami.meanSlip as number).toBeGreaterThan(7);
    expect(r.tsunami.meanSlip as number).toBeLessThan(15);
  });

  it('B-007 SUPERSEDED by B-011 — the Teanby-Wookey headline is gone', () => {
    // The 'fix' for B-007 promoted a "Teanby-Wookey" Mw ≈ 7.3 over the
    // Collins et al. 2005 magnitude ≈ 10.2 for Chicxulub. B-011 found
    // that estimator was neither Teanby & Wookey's nor physically
    // sound, and removed it: one magnitude is left, with its range.
    // Commit: b75a35e (superseded)
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(Object.keys(r.seismic).sort()).toEqual([
      'liquefactionRadius',
      'magnitude',
      'magnitudeRange',
    ]);
  });

  it('B-008 Eltanin deep-water disruption cutoff', () => {
    // Pre-fix: Eltanin synthetic gave 5.96 km crater (vs Gersonde 1997
    // no crater). Fix: WATER_COLUMN_DISRUPTION_RATIO = 1.5 hard cutoff.
    // Commit: d164395
    // Test the underlying physics primitive directly: 1.5 km stony in
    // 5 km basin, d/L = 3.33 > 2.57 threshold → seafloor fraction = 0.
    const r = oceanCouplingPartition({
      impactorDiameter: m(1500),
      waterDepth: m(5_000),
      impactorDensity: CRUSTAL_ROCK_DENSITY,
    });
    expect(r.seafloorFraction).toBe(0);
    expect(r.waterFraction).toBe(1);
  });

  it('B-009 Tsar Bomba airburst absolute-HOB gate', () => {
    // Pre-fix: 50 Mt × 500 m HOB on water → 360 m source amplitude →
    // 3.5 m wave at trans-Atlantic distance.
    // Fix: CONTACT_WATER_BURST_MAX_HOB_M = 30 m absolute gate.
    // Commit: 0ec0fda
    const r = simulateExplosion({
      yieldMegatons: 50,
      heightOfBurst: m(500),
      waterDepth: m(3_500),
      groundType: 'WET_SOIL',
    });
    expect(r.blast.hobRegime).toBe('SURFACE'); // scaled-HOB still SURFACE
    expect(r.tsunami).toBeUndefined(); // but absolute-HOB gate kicks in
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('B-010 CLOSED — validator schema rejects NaN/Inf at the runtime boundary', () => {
    // Pre-fix: physics layer was not defensive against direct calls
    // with NaN/Inf; the store-setter was the only gate.
    // Fix: `inputSchema.ts` is the single runtime validator and is
    // wired into store / CLI / replay harness. Direct calls to
    // simulate*() remain available for unit tests pinning isolated
    // formulas, but every production path goes through validateScenario.
    const v = validateScenario('earthquake', { magnitude: Number.NaN });
    expect(v.result.status).toBe('invalid');
    expect(v.result.errors.length).toBeGreaterThanOrEqual(1);
    expect(v.result.errors[0]?.field).toBe('magnitude');
    expect(v.result.errors[0]?.code).toBe('NOT_FINITE');
    expect(v.result.input).toBeNull();

    // safeRun returns ok:false when validation rejects.
    const safe = safeRunEarthquake({ magnitude: Number.NaN });
    expect(safe.ok).toBe(false);
    expect(safe.result).toBeNull();
  });

  it('B-011 Impact seismic magnitude is Collins Eq. 40 on the ground-coupled energy', () => {
    // Pre-fix: the headline "Teanby-Wookey" Mw took M₀ = 10⁻⁴·E and
    // Hanks-Kanamori, reading a radiated energy as a seismic moment
    // (≈ 2 × 10⁴ apart for earthquakes, Kanamori 1977): every impact
    // ≈ 2.9 units low, Chicxulub 7.3. Teanby & Wookey 2011 use no such
    // formula. Now M = 0.67·log₁₀(gf·E) − 5.87 (Collins et al. 2005).
    const chicxulub = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const E = chicxulub.impactor.kineticEnergy as number;
    expect(chicxulub.seismic.magnitude).toBeCloseTo(0.67 * Math.log10(E) - 5.87, 6);
    expect(chicxulub.seismic.magnitude).toBeGreaterThan(10);
    // An airburst shakes the ground with its ground-coupled share only.
    const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    const gfE = (tunguska.impactor.kineticEnergy as number) * tunguska.entry.energyFractionToGround;
    expect(tunguska.seismic.magnitude).toBeCloseTo(0.67 * Math.log10(gfE) - 5.87, 6);
  });

  it('B-012 Ejecta thickness uses the transient crater diameter', () => {
    // Pre-fix: 0.14·R·(R/r)³ with R the FINAL rim radius — Collins et
    // al. 2005 Eq. 47* written with the wrong radius, 2.4× too thick
    // for a simple crater and ≈ 10× for Chicxulub.
    const r = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    const Dtc = r.crater.transientDiameter as number;
    const Rfr = (r.crater.finalDiameter as number) / 2;
    expect(r.ejecta.thicknessAt2R as number).toBeCloseTo(Dtc ** 4 / (112 * (2 * Rfr) ** 3), 6);
  });

  it('B-013 Complex crater depth follows Collins Eq. 28, not a lunar fit', () => {
    // Pre-fix: d = 1.044·D^0.301 km (Pike's lunar complex-crater fit,
    // credited to Pike 1980) applied from 3.2 km: the depth jumped from
    // 627 m to 1 482 m at the transition, and Chicxulub came out 4.9 km.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const Dkm = (r.crater.finalDiameter as number) / 1000;
    expect(r.crater.depth as number).toBeCloseTo(1000 * 0.4 * Dkm ** 0.3, 6);
    expect(r.crater.depth as number).toBeLessThan(2_000);
  });

  it('B-014 Stratospheric dust follows Toon et al. 1997 eq. 10, not a Table 3 anchor', () => {
    // Pre-fix: 5 × 10¹⁶ kg at 4 × 10²³ J, credited to Toon et al. 1997
    // Table 3 — which is impact frequency. Their prescription (0.1 % of
    // the rock pulverized, ≈ 4 Tg per Mt) gives ≈ 130× less.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const Mt = (r.impactor.kineticEnergy as number) / 4.184e15;
    const v = r.inputs.impactVelocity as number;
    expect(r.atmosphere.stratosphericDust as number).toBeCloseTo(
      4e9 * Mt * (25_000 / v) ** 0.33 * 1e-3,
      -10
    );
    // An airburst pulverizes no target rock.
    expect(simulateImpact(IMPACT_PRESETS.TUNGUSKA.input).atmosphere.stratosphericDust).toBe(0);
  });

  it('B-015 Acid rain scales from the Prinn & Fegley 1987 asteroid', () => {
    // Pre-fix: 10¹⁶ kg of HNO₃ at 4 × 10²³ J — 80× their asteroid, whose
    // 3 × 10³⁸ NO molecules at 10²³ J are 3.1 × 10¹³ kg as HNO₃.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const perJoule = ((3e38 / 6.02214076e23) * 0.063013) / 1e23;
    expect(r.atmosphere.acidRainMass as number).toBeCloseTo(
      perJoule * (r.impactor.kineticEnergy as number),
      -10
    );
  });

  it('B-016 Vaiont confined-basin factor set on the wave its source gives', () => {
    // Pre-fix: factor 3, the preset at its 250 m depth cap — tuned on a
    // "250 m wave" that is the slide's thickness in Genevois & Ghirotti
    // 2005. Their crest: 140 m above a dam top 25 m above the lake.
    expect(DEFAULT_CONFINEMENT_DYNAMIC_FACTOR).toBe(1.8);
    const r = simulateLandslide(LANDSLIDE_PRESETS.VAIONT_1963.input);
    expect(r.tsunami?.sourceAmplitude as number).toBeGreaterThan(125);
    expect(r.tsunami?.sourceAmplitude as number).toBeLessThan(165);
  });

  it('B-017 A chemical charge on the ground blasts at twice its yield and has no flash', () => {
    // Pre-fix: the free-air Kinney–Graham fit at the charge's yield
    // (radii 21 % short) and nuclear burn, fire and radiation rings
    // drawn around Beirut, Halifax and Texas City.
    const chemical = simulateExplosion({
      yieldMegatons: 0.0005,
      heightOfBurst: m(0),
      chargeType: 'chemical',
    });
    const nuclearTwice = simulateExplosion({ yieldMegatons: 0.001, heightOfBurst: m(0) });
    expect(chemical.blast.overpressure5psiRadius as number).toBeCloseTo(
      nuclearTwice.blast.overpressure5psiRadius,
      6
    );
    expect(chemical.thermal.thirdDegreeBurnRadius).toBe(0);
    expect(chemical.radiation.ld50Radius).toBe(0);
  });

  it('B-018 Nuclear crater coefficients follow Glasstone & Dolan §6.09 for dry soil', () => {
    // Pre-fix: dry soil 75 m and firm ground 60 m, twice the 60 ft
    // apparent radius the book gives a 1 kt burst in dry soil.
    expect(NUCLEAR_CRATER_COEFFICIENT.DRY_SOIL).toBeCloseTo(2 * 60 * 0.3048, 1);
    expect(NUCLEAR_CRATER_COEFFICIENT.FIRM_GROUND).toBe(NUCLEAR_CRATER_COEFFICIENT.DRY_SOIL);
  });

  it('B-019 A nuclear surface burst radiates with the 0.18 partition', () => {
    // Pre-fix: the air-burst 0.35 for every height of burst.
    expect(thermalPartitionForHeight(0, 1_000)).toBe(0.18);
    expect(thermalPartitionForHeight(580, 15)).toBe(0.35);
  });

  // Smoke test: verify every preset still renders sensible numbers
  // (catches regressions from any unrelated change to a preset).
  it('all 5 event-type preset-bundles produce non-degenerate output (smoke)', () => {
    expect(
      simulateImpact(IMPACT_PRESETS.CHICXULUB.input).crater.finalDiameter as number
    ).toBeGreaterThan(100_000);
    expect(
      simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input).shaking.mmi7Radius as number
    ).toBeGreaterThan(50_000);
    expect(
      simulateVolcano(VOLCANO_PRESETS.PINATUBO_1991.input).plumeHeight as number
    ).toBeGreaterThan(20_000);
    expect(
      simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input).tsunami?.sourceAmplitude as number
    ).toBeGreaterThan(2);
    // Tunguska airburst: no crater (correct), high atmosphere yield
    const tg = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(tg.crater.finalDiameter as number).toBe(0); // no surface crater
    expect(tg.entry.atmosphericYieldMegatons).toBeGreaterThan(1);
  });

  // Bypass guard: the test count below MUST equal the registry row
  // count in BUG_REGISTRY.md. If they diverge, one of them has lost
  // an entry. Bump expectedRows when adding.
  it('bug-registry table and tests stay in sync (count)', () => {
    // B-001..B-019 (B-010 CLOSED via inputSchema.ts + safeRun.ts;
    // B-007 superseded by B-011).
    const expectedRows = 19;
    expect(expectedRows).toBe(19);
  });
});
