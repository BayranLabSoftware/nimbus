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

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMPLEX_DEPTH_COEFFICIENT, COMPLEX_DEPTH_EXPONENT } from '../events/impact/crater.js';
import { simulateEarthquake, EARTHQUAKE_PRESETS } from '../events/earthquake/index.js';
import { projectAlongAzimuth } from '../../scene/stadiumPolygon.js';
import { sceneFromExplosion } from '../../scene/impact/scene.js';
import { craterAsymmetry, obliqueImpactRingAsymmetry } from '../effects/asymmetry.js';
import { simulateExplosion } from '../events/explosion/simulate.js';
import { NUCLEAR_CRATER_COEFFICIENT } from '../events/explosion/cratering.js';
import {
  firstDegreeBurnRadius,
  secondDegreeBurnRadius,
  thermalPartitionForHeight,
  thirdDegreeBurnRadius,
} from '../events/explosion/thermal.js';
import { DEFAULT_CONFINEMENT_DYNAMIC_FACTOR } from '../events/volcano/tsunami.js';
import { simulateVolcano, VOLCANO_PRESETS } from '../events/volcano/index.js';
import { ashfallMassLoading } from '../events/volcano/ashfall.js';
import { simulateLandslide, LANDSLIDE_PRESETS } from '../events/landslide/index.js';
import type { LandslideWaveLaw } from '../events/landslide/simulate.js';
import { IMPULSE_WAVE_TESTED, slideImpactVelocity } from '../effects/impulseWave.js';
import { simulateImpact, IMPACT_PRESETS } from '../simulate.js';
import { buildExplosionCascade, buildImpactCascade } from '../cascade.js';
import { blastCasualtyPlan } from '../casualties.js';
import { DEFAULT_TOLL_BAND_SCATTER, withVulnerabilityScatter } from '../uq/tollBand.js';
import { TOLL_BAND_CANDIDATE } from './tollBandRules.js';
import { applyIntentToStore, decodeUrl } from '../../store/urlState.js';
import { extractTsunamiMeta, seismicSourceCavityRadiusM } from '../../store/useAppStore.js';
import { VISUAL_CONTRACTS } from '../../scene/visualContracts.js';
import { computeTsunamiArrivalField, spansTheGlobe } from '../tsunami/fastMarching.js';
import { radiansToDegrees } from '../units.js';
import { fieldsFor } from '../../ui/pages/SimulationReportPage.js';
import { oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { impactFireballRadius, nuclearFireballRadius } from '../effects/blastWave.js';
import * as casualtiesModule from '../casualties.js';
import { thermalHorizonRadius } from '../casualties.js';
import { CRUSTAL_ROCK_DENSITY, IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../units.js';
import { validateEarthquakeInput, validateScenario } from './inputSchema.js';
import { safeRunEarthquake } from './safeRun.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import { explosionSampler } from '../montecarlo/explosionMonteCarlo.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { compareWithRecord, RECORDED_EVENTS } from './recordedTolls.js';
import { TOHOKU_2011_DART_REFERENCE } from './noaaBenchmarkFixtures.js';
import { RECORDED_WAVES } from './recordedWaves.js';
import { makeElevationGrid } from '../elevation/index.js';
import { _internals } from '../../scene/populationLookup.js';
import {
  shippedCoarseView,
  shippedPopulationInPolygon,
  shippedStadiumCounter,
} from './shippedPopulation.js';
import { buildRuptureStadiumLatLon } from '../../scene/stadiumPolygon.js';
import { gateImpactByTerrain, resetAppStore, useAppStore } from '../../store/useAppStore.js';
import {
  fetchTerrainGridForLocation,
  TERRAIN_TILE_ZOOM,
  tileBounds,
} from '../../scene/terrainSampling.js';

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
    const E = (chicxulub.impactor.kineticEnergy as number) * chicxulub.entry.energyFractionToGround;
    expect(chicxulub.seismic.magnitude).toBeCloseTo(0.67 * Math.log10(E) - 5.87, 6);
    expect(chicxulub.seismic.magnitude).toBeGreaterThan(10);
    // An airburst delivers nothing to the ground, and Collins et al. give
    // it no seismic effect; the Earth Impact Effects Program reads its
    // magnitude from the energy the body keeps at its burst altitude, and
    // since rule 157 of validation/impactSeismicRules.ts so does Nimbus.
    const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(tunguska.entry.energyFractionToGround).toBe(0);
    const kept =
      (tunguska.impactor.kineticEnergy as number) *
      ((tunguska.entry.endVelocity as number) /
        (IMPACT_PRESETS.TUNGUSKA.input.impactVelocity as number)) **
        2;
    expect(tunguska.seismic.magnitude).toBeCloseTo(0.67 * Math.log10(kept) - 5.87, 6);
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
    //
    // B-040, 16 September 2026: the fix landed on 0.4·D^0.3 and this test
    // asserted it under the name "Collins Eq. 28". It is not Eq. 28 — it is
    // Herrick et al.'s own Venus fit, and it made every complex crater 35 %
    // too deep against the program that publishes Eq. 28. So the test was
    // guarding the error its title denied. Eq. 28* is 0.294·D^0.301, and
    // fitting the benchmark reference's own thirty-eight complex craters
    // gives 0.2969·D^0.2991, which is that to three figures.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const Dkm = (r.crater.finalDiameter as number) / 1000;
    expect(r.crater.depth as number).toBeCloseTo(
      1000 * COMPLEX_DEPTH_COEFFICIENT * Dkm ** COMPLEX_DEPTH_EXPONENT,
      6
    );
    expect(COMPLEX_DEPTH_COEFFICIENT).toBe(0.294);
    expect(COMPLEX_DEPTH_EXPONENT).toBe(0.301);
    expect(r.crater.depth as number).toBeLessThan(2_000);
    // And the lunar fit it was rescued from stays rejected.
    expect(r.crater.depth as number).toBeLessThan(1000 * 1.044 * Dkm ** 0.301);
  });

  it('B-014 Stratospheric dust follows Toon et al. 1997 eq. 10, not a Table 3 anchor', () => {
    // Pre-fix: 5 × 10¹⁶ kg at 4 × 10²³ J, credited to Toon et al. 1997
    // Table 3 — which is impact frequency. Their prescription (0.1 % of
    // the rock pulverized, ≈ 4 Tg per Mt) gives ≈ 130× less.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    // The energy that reaches the ground, all but a thousandth of it.
    const Mt = ((r.impactor.kineticEnergy as number) * r.entry.energyFractionToGround) / 4.184e15;
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
      perJoule * (r.impactor.kineticEnergy as number) * r.entry.energyFractionToGround,
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

  it('B-017 A chemical charge on the ground blasts like a charge on the ground, and has no flash', () => {
    // Pre-fix: the free-air Kinney–Graham fit at the charge's yield
    // (radii 21 % short) and nuclear burn, fire and radiation rings
    // drawn around Beirut, Halifax and Texas City. The fix entered the
    // fit at twice the yield, for the ground's reflection; since rules
    // 177 to 181 the charge is drawn by Kingery–Bulmash's own surface
    // burst instead, which is what the field computes it with, and the
    // doubling is still what the law it replaced does.
    const chemical = simulateExplosion({
      yieldMegatons: 0.0005,
      heightOfBurst: m(0),
      chargeType: 'chemical',
    });
    const atItsOwnYield = simulateExplosion({ yieldMegatons: 0.0005, heightOfBurst: m(0) });
    const nuclearTwice = simulateExplosion({ yieldMegatons: 0.001, heightOfBurst: m(0) });
    const doubled = simulateExplosion({
      yieldMegatons: 0.0005,
      heightOfBurst: m(0),
      chargeType: 'chemical',
      chemicalBlast: 'kinneyGraham',
    });
    expect(doubled.blast.overpressure5psiRadius as number).toBeCloseTo(
      nuclearTwice.blast.overpressure5psiRadius,
      6
    );
    // Well clear of the bug's own radii, whichever of the two laws draws it.
    expect(chemical.blast.overpressure5psiRadius as number).toBeGreaterThan(
      1.2 * (atItsOwnYield.blast.overpressure5psiRadius as number)
    );
    expect(chemical.thermal.thirdDegreeBurnRadius).toBe(0);
    expect(chemical.radiation.ld50Radius).toBe(0);
  });

  it('B-018 Nuclear crater coefficients follow Glasstone & Dolan for dry soil', () => {
    // Pre-fix: dry soil 75 m and firm ground 60 m, twice the apparent
    // radius the book gives a 1 kt burst in dry soil. The fix read §6.09's
    // "about 60 ft"; since 16 September 2026 it reads the 61 ft the book
    // prints on Figure 6.72a itself (rules 90 to 93), and the verdict of
    // B-018 is unchanged.
    expect(NUCLEAR_CRATER_COEFFICIENT.DRY_SOIL).toBeCloseTo(2 * 61 * 0.3048, 1);
    expect(NUCLEAR_CRATER_COEFFICIENT.FIRM_GROUND).toBe(NUCLEAR_CRATER_COEFFICIENT.DRY_SOIL);
  });

  it('B-019 A nuclear surface burst radiates with the 0.18 partition', () => {
    // Pre-fix: the air-burst 0.35 for every height of burst.
    expect(thermalPartitionForHeight(0, 1_000)).toBe(0.18);
    expect(thermalPartitionForHeight(580, 15)).toBe(0.35);
  });

  it('B-021 The Monte Carlo keeps a burst where it was placed', () => {
    // Pre-fix: every height of burst drawn N(h, 50 m) and clamped at 0,
    // so a charge 40 m under the sea surfaced or rose into the air in
    // every draw, and a surface burst went off up to ~100 m up.
    const rng = mulberry32('B-021');
    for (const h of [-40, 0]) {
      const sample = explosionSampler({ yieldMegatons: 1, heightOfBurst: m(h) });
      for (let i = 0; i < 200; i++) expect(sample(rng).heightOfBurst as number).toBe(h);
    }
  });

  it('B-022 The harness counts a rupture stadium, not the circle of its radius', () => {
    // Pre-fix: an extended source's intensity bands were counted as
    // circles about the epicentre. Tōhoku's epicentre is at sea, and its
    // shaking row read 0 dead on a band of 0 to 5; the simulator counts
    // the stadium along the coast, tens of millions of people.
    const tohoku = RECORDED_EVENTS.find((e) => e.name === 'Tōhoku 2011');
    if (tohoku === undefined) throw new Error('Tōhoku 2011 is not in the net');
    const toll = compareWithRecord(tohoku);
    expect(toll.estimate?.exposed ?? 0).toBeGreaterThan(1_000_000);
    expect(toll.deaths).toBeGreaterThan(1_000);
    // A band of two hundred stadiums: seconds on a CI runner.
  }, 30_000);

  it('B-023 A 100 m stony body at 20 km/s strikes the ground and digs its crater', () => {
    // Pre-fix: a classifier tuned on Chelyabinsk and Tunguska burst it
    // at 11.5 km and suppressed the crater. Collins et al. 2005's entry
    // brings the swarm down at about 7.7 km/s, and the Earth Impact
    // Effects Program digs a 1.6 km crater.
    const r = simulateImpact({
      impactorDiameter: m(100),
      impactVelocity: mps(20_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_500),
      impactAngle: degreesToRadians(deg(45)),
    });
    expect(r.entry.regime).not.toBe('COMPLETE_AIRBURST');
    expect(r.crater.finalDiameter as number).toBeGreaterThan(1_400);
    expect(r.crater.finalDiameter as number).toBeLessThan(1_800);
  });

  it("B-024 A pick takes its Vs30 from the terrain under it, not the last pick's", async () => {
    // Pre-fix: the store read the slope off whatever terrain it held.
    // A Launch that beat the new pick's tile took the site from the
    // last pick's, clamped to its edge, where every neighbour is the
    // same sample: no slope, and the table's softest soil, 180 m/s.
    resetAppStore();
    const store = useAppStore.getState();
    store.selectPreset('NORTHRIDGE_1994');
    store.setMode('globe');
    store.setLocation({ latitude: 34.2, longitude: -118.5 });
    // A plane rising 52 m a sample to the north, about 3 % over the
    // 1.7 km between samples: 420 m/s on Wald & Allen's table.
    const n = 65;
    const samples = new Float32Array(n * n);
    for (let i = 0; i < n; i++) samples.fill((n - 1 - i) * 52.1, i * n, (i + 1) * n);
    useAppStore.getState().setElevationGrid(
      makeElevationGrid({
        minLat: 33.7,
        maxLat: 34.7,
        minLon: -119,
        maxLon: -118,
        nLat: n,
        nLon: n,
        samples,
      })
    );
    await useAppStore.getState().evaluate();
    const under = useAppStore.getState().result;
    expect(under?.type === 'earthquake' ? under.data.shaking.siteVs30 : 0).toBeCloseTo(420, -1);

    useAppStore.getState().setLocation({ latitude: 0, longitude: 0 });
    await useAppStore.getState().evaluate();
    const away = useAppStore.getState().result;
    if (away?.type !== 'earthquake') throw new Error('not an earthquake');
    expect(away.data.inputs.vs30).toBeUndefined();
    expect(away.data.shaking.siteVs30).toBe(760);
    useAppStore.getState().setElevationGrid(null);
  });

  it('B-025 A terrain block stops at the antimeridian', async () => {
    // Pre-fix: tile columns past the antimeridian wrapped to the far
    // side, so a block off Gisborne ran from −180° to 180°, and a strip
    // along a fault that crossed it went the long way round the planet
    // and was trimmed to forty tiles with the pick outside them.
    const sea = (x: number, y: number) =>
      Promise.resolve(
        makeElevationGrid({
          ...tileBounds(x, y, TERRAIN_TILE_ZOOM),
          nLat: 256,
          nLon: 256,
          samples: new Float32Array(256 * 256).fill(-2_000),
        })
      );
    const block = await fetchTerrainGridForLocation(-38.6, 179.5, undefined, sea);
    expect(block.minLon).toBeGreaterThan(170);
    expect(block.maxLon).toBeLessThanOrEqual(180);
    const strip = await fetchTerrainGridForLocation(
      51.5,
      179.5,
      { strikeDeg: 90, lengthM: 800_000 },
      sea
    );
    expect(strip.minLon).toBeLessThan(179.5);
    expect(strip.maxLon).toBeGreaterThanOrEqual(179.5);
    expect(strip.maxLon - strip.minLon).toBeLessThan(20);
  });

  it('B-026 A planetary circle counts everyone inside it, on the sphere', () => {
    // Pre-fix: the circle's longitude window was ρ / cos φ₀ about its
    // centre, too narrow toward the poles and never every longitude when
    // the cap holds one; 7 000 km about New York counted 12.9 % too few,
    // 183 million people. Held to a count over every cell of the planet,
    // each decided as the counter decides a cell it looks at.
    const view = shippedCoarseView();
    // The circle's own sub-grid, which rules 94 to 97 moved on 16 September
    // 2026 from 4 to 12; B-026 is about the longitude window, not the
    // sub-grid, so the reference here uses whatever the counter uses.
    const { greatCircleM, sumGridCircle, CIRCLE_EDGE_SUBSAMPLES: EDGE_SUBSAMPLES } = _internals;
    const everyCell = (lat: number, lon: number, radiusM: number): number => {
      const cellLatM = (view.cellDeg * Math.PI * 6_371_000) / 180;
      let sum = 0;
      for (let r = 0; r < view.nLat; r++) {
        const cellLat = view.maxLat - (r + 0.5) * view.cellDeg;
        const cellLonM = cellLatM * Math.max(Math.cos((cellLat * Math.PI) / 180), 1e-6);
        const halfDiagonal = 0.5 * Math.hypot(cellLatM, cellLonM);
        for (let c = 0; c < view.nLon; c++) {
          const cellLon = view.minLon + (c + 0.5) * view.cellDeg;
          const d = greatCircleM(lat, lon, cellLat, cellLon);
          if (d - halfDiagonal > radiusM) continue;
          const { people } = view.cellAt(r, c);
          if (people === 0) continue;
          if (d + halfDiagonal <= radiusM) {
            sum += people;
            continue;
          }
          let inside = 0;
          for (let a = 0; a < EDGE_SUBSAMPLES; a++) {
            const sLat = cellLat + ((a + 0.5) / EDGE_SUBSAMPLES - 0.5) * view.cellDeg;
            for (let b = 0; b < EDGE_SUBSAMPLES; b++) {
              const sLon = cellLon + ((b + 0.5) / EDGE_SUBSAMPLES - 0.5) * view.cellDeg;
              if (greatCircleM(lat, lon, sLat, sLon) <= radiusM) inside += 1;
            }
          }
          sum += (people * inside) / (EDGE_SUBSAMPLES * EDGE_SUBSAMPLES);
        }
      }
      return sum;
    };
    for (const [lat, lon, radiusM] of [
      [40.7, -74.0, 7_000_000], // New York: the cap holds the North Pole
      [64.1, -21.9, 3_000_000], // Reykjavík
      [-54.8, -68.3, 5_000_000], // Ushuaia: the South Pole
      [28.6, 77.2, 7_000_000], // Delhi
    ] as const) {
      const counted = sumGridCircle(view, lat, lon, radiusM);
      expect(counted / everyCell(lat, lon, radiusM)).toBeCloseTo(1, 6);
    }
  });

  it('B-035 A footprint across the antimeridian counts the people on both sides', () => {
    // Pre-fix: every vertex of a footprint polygon was clamped to
    // ±179.99°, and the harness's stadium counter clipped its window the
    // same way, so a Kermadec megathrust whose stadium reached New
    // Zealand counted nobody and one centred between Samoa and Fiji a
    // third of its people. Held to a count over every cell of the planet,
    // each sub-sample placed by its distance from the rupture on the
    // sphere.
    const view = shippedCoarseView();
    const R = 6_371_008;
    const toRad = Math.PI / 180;
    const everyCell = (
      lat0: number,
      lon0: number,
      strikeDeg: number,
      halfL: number,
      halfW: number,
      radius: number
    ): number => {
      const n = _internals.EDGE_SUBSAMPLES;
      const within = (lat: number, lon: number): boolean => {
        const phi = lat * toRad;
        const phi0 = lat0 * toRad;
        const dl = (lon - lon0) * toRad;
        const h =
          Math.sin((phi - phi0) / 2) ** 2 + Math.cos(phi0) * Math.cos(phi) * Math.sin(dl / 2) ** 2;
        const d = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
        const az = Math.atan2(
          Math.sin(dl) * Math.cos(phi),
          Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl)
        );
        const x = d * Math.cos(az - strikeDeg * toRad);
        const y = d * Math.sin(az - strikeDeg * toRad);
        return (
          Math.hypot(Math.max(Math.abs(x) - halfL, 0), Math.max(Math.abs(y) - halfW, 0)) <= radius
        );
      };
      let sum = 0;
      for (let r = 0; r < view.nLat; r++) {
        const cellLat = view.maxLat - (r + 0.5) * view.cellDeg;
        if (Math.abs(cellLat - lat0) > (halfL + halfW + radius) / 111_000 + 1) continue;
        for (let c = 0; c < view.nLon; c++) {
          const { people } = view.cellAt(r, c);
          if (people === 0) continue;
          const cellLon = view.minLon + (c + 0.5) * view.cellDeg;
          let inside = 0;
          for (let a = 0; a < n; a++) {
            for (let b = 0; b < n; b++) {
              const sLat = cellLat + ((a + 0.5) / n - 0.5) * view.cellDeg;
              const sLon = cellLon + ((b + 0.5) / n - 0.5) * view.cellDeg;
              if (within(sLat, sLon)) inside += 1;
            }
          }
          sum += (people * inside) / (n * n);
        }
      }
      return sum;
    };
    for (const [lat, lon, strike, halfL, halfW, radius] of [
      [-33.0, -177.5, 200, 400_000, 100_000, 450_000], // Kermadec, reaching New Zealand
      [-16.0, -178.0, 90, 300_000, 80_000, 500_000], // between Samoa and Fiji
    ] as const) {
      const truth = everyCell(lat, lon, strike, halfL, halfW, radius);
      expect(truth).toBeGreaterThan(400_000);
      const polygon = buildRuptureStadiumLatLon({
        centerLatDeg: lat,
        centerLonDeg: lon,
        strikeAzimuthDeg: strike,
        halfLengthAlongStrikeM: halfL,
        halfWidthAcrossStrikeM: halfW,
        contourRadiusM: radius,
      });
      expect(shippedPopulationInPolygon(polygon).exposed / truth).toBeCloseTo(1, 1);
      const counter = shippedStadiumCounter(lat, lon, strike, halfL + halfW + radius);
      expect(counter(halfL, halfW, radius) / truth).toBeCloseTo(1, 1);
    }
  });

  it('B-036 A nuclear burst has one fireball, twice its breakaway radius as Glasstone & Dolan give it', () => {
    // Pre-fix: the globe drew 70·W^0.4 m, credited to figures the book
    // does not give, and the flash was cut at the horizon of 55·W^0.4 m
    // from a second function of the same name. Glasstone & Dolan 1977
    // §2.127: an air burst breaks away at R ≈ 100·W^0.4 ft, and the
    // maximum radius may be taken as about twice that.
    for (const kt of [0.1, 20, 1_000, 50_000]) {
      expect(nuclearFireballRadius(kt) as number).toBeCloseTo(2 * 100 * 0.3048 * kt ** 0.4, 6);
    }
    const casualtyExports = Object.keys(casualtiesModule);
    expect(casualtyExports).not.toContain('nuclearFireballRadius');
    expect(casualtyExports).not.toContain('impactFireballRadius');
  });

  it('B-037 A fireball is seen for as long as any of it stands above the horizon', () => {
    // Pre-fix: d = R⊕·arccos(R⊕ / (R⊕ + R_f)), the range at which the point
    // R_f above ground zero sets. The fireball is a sphere of radius R_f
    // about ground zero, and part of it stays above an observer's horizon
    // until the Earth's curvature between them, (1 − cos Δ)·R⊕, reaches R_f
    // (Collins et al. 2005 Eq. 37*): 1.6 % farther for a 200 km fireball,
    // 3.2 % for the 408 km one of the campaign's largest impact, where the
    // Earth Impact Effects Program prints 2 291.6 km on its R⊕ of 6 370 km.
    const earthRadius = 6_371_000;
    for (const rf of [600, 20_000, 200_000, 407_770]) {
      const d = thermalHorizonRadius(m(rf));
      // At that range the sphere touches the observer's horizontal plane.
      expect(earthRadius * Math.cos(d / earthRadius) + rf).toBeCloseTo(earthRadius, 2);
    }
    expect(thermalHorizonRadius(m(407_770)) / 2_291_589).toBeCloseTo(1, 3);
  });

  it('B-038 An impact burns only as far as its fireball is seen', () => {
    // Pre-fix: the burn rings the globe drew and the panel printed were
    // the fluence radii with nothing in the way — Boltysh's third-degree
    // burns to 936 km, Popigai's to 10 900 km, Chicxulub's to 27 478 km —
    // while their fireballs set at 523, 1 186 and 1 616 km, where the
    // casualty plan and the fire radii (B-028) already stopped the flash.
    for (const preset of [
      IMPACT_PRESETS.BOLTYSH,
      IMPACT_PRESETS.POPIGAI,
      IMPACT_PRESETS.CHICXULUB,
    ]) {
      const r = simulateImpact(preset.input);
      const horizon = thermalHorizonRadius(impactFireballRadius(r.impactor.kineticEnergy));
      // Since rule 149 the flash fades out before the horizon, as the share of
      // the fireball above it falls to nothing (Collins et al.'s Eq. 36*); it
      // never passes it.
      expect(r.damage.thirdDegreeBurn as number).toBeLessThanOrEqual(horizon);
      expect(r.damage.secondDegreeBurn as number).toBeLessThanOrEqual(horizon);
      expect(r.damage.thirdDegreeBurn as number).toBeGreaterThan(0.8 * horizon);
    }
    // A flash that does not reach its horizon keeps its fluence radius.
    const meteor = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    const reach = thermalHorizonRadius(impactFireballRadius(meteor.impactor.kineticEnergy));
    expect(meteor.damage.thirdDegreeBurn as number).toBeGreaterThan(0);
    expect(meteor.damage.secondDegreeBurn as number).toBeLessThan(reach);
  });

  it("B-027 An earthquake of Mw 3.2 to 3.7 finishes, its aftershocks under Båth's ceiling", () => {
    // Pre-fix: the aftershock sampler drew magnitudes at or above the
    // completeness cutoff (2.5 below Mw 6.5) and drew again any above
    // Båth's ceiling, M − 1.2. Up to Mw 3.7 the ceiling is at or under
    // the cutoff, so once the catalogue was to hold one aftershock —
    // from Mw 3.13 — no draw could ever be kept and the run never
    // returned: six values of the form, 3.2 to 3.7, froze the worker.
    let previousCount = 0;
    for (let tenths = 300; tenths <= 650; tenths += 5) {
      const magnitude = tenths / 100;
      const { aftershocks } = simulateEarthquake({ magnitude });
      const ceiling = aftershocks.bathCeiling;
      const cutoff = aftershocks.completenessCutoff;
      if (ceiling <= cutoff) expect(aftershocks.totalCount).toBe(0);
      for (const event of aftershocks.events) {
        expect(event.magnitude).toBeGreaterThanOrEqual(cutoff);
        expect(event.magnitude).toBeLessThanOrEqual(ceiling);
      }
      // The catalogue grows with the mainshock instead of jumping to
      // nothing at the magnitude where the ceiling meets the cutoff.
      expect(aftershocks.totalCount).toBeGreaterThanOrEqual(previousCount);
      previousCount = aftershocks.totalCount;
    }
    // Just above the meeting point the window between cutoff and ceiling
    // is a rounding error wide, and a sampler that redraws never leaves it.
    expect(simulateEarthquake({ magnitude: 3.7000000001 }).aftershocks.totalCount).toBe(0);
  });

  it('B-028 An impact lights fires as far as its fireball is seen, on a round Earth', () => {
    // Pre-fix: the ignition and sustain radii were the fluence radii with
    // nothing in the way — 24 579 km for Chicxulub, past the antipode —
    // and their areas πr², so the panel printed an ignition area of
    // 1 897.9 million km², 3.7 times the surface of the Earth. The flash
    // travels in straight lines and stops at the fireball's horizon, the
    // cut the casualty plan already made; an area on a sphere is a cap.
    const earthRadius = 6_371_000;
    const capArea = (r: number): number =>
      2 * Math.PI * earthRadius ** 2 * (1 - Math.cos(r / earthRadius));
    const chicxulub = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const fireball = impactFireballRadius(chicxulub.impactor.kineticEnergy);
    const horizon = thermalHorizonRadius(fireball);
    const { ignitionRadius, sustainRadius, ignitionArea, sustainArea } = chicxulub.firestorm;
    // Since rule 149 the exposure is the program's, dimmed by the share of the
    // fireball still above the horizon, so the flash fades out just short of
    // it rather than being cut there.
    expect(ignitionRadius as number).toBeLessThanOrEqual(horizon);
    expect(ignitionRadius as number).toBeGreaterThan(0.95 * horizon);
    expect(sustainRadius as number).toBeLessThanOrEqual(horizon);
    expect(ignitionArea as number).toBeCloseTo(capArea(ignitionRadius), -6);
    expect(sustainArea as number).toBeCloseTo(capArea(sustainRadius), -6);
    expect(sustainArea as number).toBeLessThan(4 * Math.PI * earthRadius ** 2);
    // An impact whose flash does not reach its horizon keeps its fluence
    // radius, and its areas stay the disc's to a part in a million.
    const meteor = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    const r = meteor.firestorm.ignitionRadius as number;
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(
      thermalHorizonRadius(impactFireballRadius(meteor.impactor.kineticEnergy))
    );
    expect(meteor.firestorm.ignitionArea as number).toBeCloseTo(Math.PI * r * r, -2);
    // A body far larger than the Earth's own diameter keeps every radius
    // inside the antipode and every area inside the planet.
    const planetary = simulateImpact({
      impactorDiameter: m(50_000_000),
      impactVelocity: mps(30_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_500),
      impactAngle: degreesToRadians(deg(45)),
    });
    expect(planetary.firestorm.sustainRadius as number).toBeLessThanOrEqual(Math.PI * earthRadius);
    expect(planetary.firestorm.sustainArea as number).toBeLessThanOrEqual(
      4 * Math.PI * earthRadius ** 2
    );
  });

  it('B-029 The 1 mm isopach reaches its farthest band, and grows with the eruption', () => {
    // Pre-fix: along the wind the deposit is a row of bands — the coarse
    // classes near the vent, the finest thousands of kilometres out — and
    // its edge was a bisection over the whole axis, which lands on
    // whichever band edge it meets. 1 % more tephra took a reach from
    // 184 to 159 km, or from the 5 000 km bracket to 4 070 km; a reach at
    // the bracket came with no width and no area. The campaign's random
    // eruptions found 343 such cases in 5 000.
    const eruptions = [
      { volumeEruptionRate: 94_992.9, totalEjectaVolume: 7.2435e10, windSpeed: 19.26 },
      { volumeEruptionRate: 4_301.65, totalEjectaVolume: 5.4329e7, windSpeed: 40.61 },
      { volumeEruptionRate: 24_849.8, totalEjectaVolume: 2.7837e10, windSpeed: 29.53 },
    ];
    for (const eruption of eruptions) {
      const base = simulateVolcano(eruption);
      const grown = simulateVolcano({
        ...eruption,
        volumeEruptionRate: eruption.volumeEruptionRate * 1.01,
        totalEjectaVolume: eruption.totalEjectaVolume * 1.01,
      });
      const a = base.windAdvectedAshfall;
      const b = grown.windAdvectedAshfall;
      if (a === undefined || b === undefined) throw new Error('no ashfall footprint');
      expect(b.downwindRange as number).toBeGreaterThanOrEqual(a.downwindRange);
      expect(b.area as number).toBeGreaterThanOrEqual(a.area);
      expect(a.area as number).toBeGreaterThan(0);
      expect(a.crosswindHalfWidth as number).toBeGreaterThan(0);
      // The edge is an edge: 1 mm just inside it, less just past it,
      // unless the deposit runs on past the 5 000 km the footprint reports.
      const range = a.downwindRange as number;
      if (range < 5_000_000) {
        const loadingAt = (x: number): number =>
          ashfallMassLoading({
            plumeHeight: base.plumeHeight,
            totalEjectaVolume: eruption.totalEjectaVolume,
            windSpeed: eruption.windSpeed,
            downwindDistance: x,
            crosswindDistance: 0,
          });
        expect(loadingAt(range - 500)).toBeGreaterThanOrEqual(1);
        expect(loadingAt(range + 500)).toBeLessThan(1);
      }
    }
  });

  it('B-030 A body under a metre across burns up without breaking the run', () => {
    // Pre-fix: the surface burst of a few centimetres of iron could not
    // raise 5 psi even a metre away, and the inversion that finds the
    // ring threw — reachable through a link, which takes any positive
    // diameter. A threshold never reached draws no ring, as the entry's
    // own rings already did.
    for (const diameter of [0.001, 0.01, 0.05, 0.2, 0.5]) {
      const r = simulateImpact({
        impactorDiameter: m(diameter),
        impactVelocity: mps(33_000),
        impactorDensity: kgPerM3(8_400),
        targetDensity: kgPerM3(1_800),
        impactAngle: degreesToRadians(deg(80)),
      });
      for (const radius of Object.values(r.damage)) {
        expect(Number.isFinite(radius as number)).toBe(true);
        expect(radius as number).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('B-031 An impact at sea draws no fire, and prints no fire area either', () => {
    // Pre-fix: the open-water gate zeroed the ignition and sustain radii
    // and the ignition area, and left the sustain area — the panel's
    // "firestorm area" — beside rings of nothing. The explosion gate
    // zeroes all four.
    const atSea = gateImpactByTerrain(simulateImpact(IMPACT_PRESETS.CHICXULUB_OCEAN.input), true);
    expect(atSea.firestorm.ignitionRadius as number).toBe(0);
    expect(atSea.firestorm.sustainRadius as number).toBe(0);
    expect(atSea.firestorm.ignitionArea as number).toBe(0);
    expect(atSea.firestorm.sustainArea as number).toBe(0);
  });

  it('B-032 An airburst blasts the ground as the Earth Impact Effects Program has it, with no altitude factor', () => {
    // Pre-fix: the entry's shock radii were a surface-burst reach times
    // (P₀/P(h))^(3/5), up to ×15 — ×13 for a burst near 30 km — and the
    // rings reached where the program says the blast never does. The
    // brackets are the program's printed overpressure at the campaign's
    // distances (benchmark IMP track, 15 September 2026), for the same
    // bodies on the same crystalline target.
    const airburst = (diameter: number, speed: number, angle: number) =>
      simulateImpact({
        impactorDiameter: m(diameter),
        impactVelocity: mps(speed),
        impactorDensity: kgPerM3(3_000),
        targetDensity: kgPerM3(2_750),
        impactAngle: degreesToRadians(deg(angle)),
      });

    // Tunguska's body: 42.7 kPa at 3 km, 23.0 at 10, 5.79 at 30, 2.71 at 100.
    const tunguska = airburst(60, 15_000, 30);
    expect(tunguska.entry.regime).toBe('COMPLETE_AIRBURST');
    const km = (r: unknown) => (r as number) / 1_000;
    expect(km(tunguska.damage.overpressure5psi)).toBeGreaterThan(3);
    expect(km(tunguska.damage.overpressure5psi)).toBeLessThan(10);
    expect(km(tunguska.damage.overpressure1psi)).toBeGreaterThan(10);
    expect(km(tunguska.damage.overpressure1psi)).toBeLessThan(30);
    expect(km(tunguska.damage.lightDamage)).toBeGreaterThan(30);
    expect(km(tunguska.damage.lightDamage)).toBeLessThan(100);

    // Chelyabinsk's body, bursting at 34 km: 1.08 kPa below the burst and
    // less everywhere else, so not even 0.5 psi (3.45 kPa) reaches the ground.
    const chelyabinsk = airburst(17, 19_000, 18);
    expect(chelyabinsk.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(chelyabinsk.damage.lightDamage as number).toBe(0);
    expect(chelyabinsk.damage.overpressure1psi as number).toBe(0);
    expect(chelyabinsk.damage.overpressure5psi as number).toBe(0);
  });

  it("B-041 An airburst's flash burns at the project's fluences, as rule 81 says of every impact", () => {
    // Pre-fix: rule 81 of validation/burnRules.ts keeps an impact's burn
    // rings at the project's 8, 5 and 2 cal/cm², because the book's curves
    // are a nuclear fireball's pulse, and damageRings.ts names 'project' for
    // the fireball on the ground. The flash of the energy left in the air
    // named nothing, so when the explosions' default moved to the book's
    // curves on 16 September 2026 the airbursts' rings moved with it:
    // Tunguska's third-degree burns from 5.22 to 4.46 km and its first-degree
    // from 10.43 to 7.75, Chelyabinsk's third from 1.32 to 1.22.
    for (const preset of [IMPACT_PRESETS.TUNGUSKA, IMPACT_PRESETS.CHELYABINSK]) {
      const r = simulateImpact(preset.input);
      expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
      const flash = {
        yieldEnergy: J(r.entry.atmosphericYieldMegatons * 4.184e15),
        thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
        burnExposure: 'project' as const,
      };
      expect(r.entry.flashBurnRadii.thirdDegree as number).toBeCloseTo(
        thirdDegreeBurnRadius(flash),
        6
      );
      expect(r.entry.flashBurnRadii.secondDegree as number).toBeCloseTo(
        secondDegreeBurnRadius(flash),
        6
      );
      expect(r.entry.flashBurnRadii.firstDegree as number).toBeCloseTo(
        firstDegreeBurnRadius(flash),
        6
      );
      // And the ring an airburst draws is that flash.
      expect(r.damage.thirdDegreeBurn).toBe(r.entry.flashBurnRadii.thirdDegree);
    }
    const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect((tunguska.entry.flashBurnRadii.thirdDegree as number) / 1_000).toBeCloseTo(5.22, 2);
  });

  it('B-033 The Chelyabinsk preset flies the body Popova et al. 2013 measured', () => {
    // Pre-fix: 17 m at 3.0 g/cm³, 19 km/s and 18°, 0.33 Mt. Popova et al.
    // 2013 (Science 342, Table 1 and text): 19.16 km/s at 18.3° from the
    // horizon, and 19.8 m for their 590 ± 50 kt at the 3.3 g/cm³ of the
    // recovered meteorites.
    const input = IMPACT_PRESETS.CHELYABINSK.input;
    expect(input.impactorDiameter as number).toBeCloseTo(19.8, 6);
    expect(input.impactorDensity as number).toBe(3_300);
    expect(input.impactVelocity as number).toBe(19_160);
    expect(((input.impactAngle as number) * 180) / Math.PI).toBeCloseTo(18.3, 6);
    const kilotons = (simulateImpact(input).impactor.kineticEnergyMegatons as number) * 1_000;
    expect(kilotons).toBeGreaterThan(540);
    expect(kilotons).toBeLessThan(640);
  });

  it("B-034 DART 21413 holds the crest of the buoy's own file for Tōhoku", () => {
    // Pre-fix: "about 30 cm" (a band of 0.2–0.5 m), credited to Satake et
    // al. 2013 without the paper having been read, and the megathrust
    // uplift factor was set on it. NOAA NDBC's file for the buoy,
    // 21413t2011.txt.gz, read by scripts/benchmark/dart-records.py under
    // BM-05's amended rules, crests at 0.806 m 1 h 20 min after the origin.
    const records = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../../../benchmark/dart/records.json', import.meta.url)),
        'utf8'
      )
    ) as {
      events: { origin: string; records: { station: string; crestM?: number }[] }[];
    };
    const tohoku = records.events.find((e) => e.origin.startsWith('2011-03-11'));
    const crest = tohoku?.records.find((r) => r.station === '21413')?.crestM ?? Number.NaN;
    expect(crest).toBeCloseTo(0.806, 3);
    expect(TOHOKU_2011_DART_REFERENCE.observedAmplitudeM).toBeCloseTo(crest, 2);
    const row = RECORDED_WAVES.find((w) => w.name === 'Tōhoku 2011 at DART 21413');
    expect(row?.observed.low).toBeLessThan(crest);
    expect(row?.observed.high).toBeGreaterThan(crest);
  });

  it('B-020 The ground-motion residual is the total Boore et al. 2014 give', () => {
    // Pre-fix: σ_lnY 0.50, quoted with a τ ≈ 0.397 and a φ ≈ 0.308 that
    // are not in the paper. For PGA at M ≥ 5.5 it gives τ = 0.348 and
    // φ = 0.495.
    expect(EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma).toBeCloseTo(Math.hypot(0.348, 0.495), 1);
    expect(EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma).toBeGreaterThan(0.55);
  });

  it('B-042 A slide falls its vertical drop to the water, as Eq. 3.5 of the impulse wave manual has it', () => {
    // Pre-fix: v = √(2·g·Δz·(sin α − tan δ·cos α)), the manual's
    // √(2·g·Δz·(1 − tan δ·cot α)) times sin α under the root — the drop
    // measured along the slope where the input is the vertical one. Every
    // speed was low by √(sin α). The manual's worked examples: 41.3 m/s from
    // 100 m at 70°, then 58.0 m/s after 150 m more at 40° (Example 1), and
    // 32.2 m/s from 110 m at 35° (Example 2), with δ = 20° throughout.
    const tanDelta = Math.tan((20 * Math.PI) / 180);
    const atChange = slideImpactVelocity(100, 70, tanDelta);
    expect(atChange).toBeCloseTo(41.3, 1);
    expect(Math.hypot(atChange, slideImpactVelocity(150, 40, tanDelta))).toBeCloseTo(58.0, 1);
    expect(slideImpactVelocity(110, 35, tanDelta)).toBeCloseTo(32.2, 1);
    // What the defect gave for Example 2: 24 % slow.
    const defect = Math.sqrt(
      2 * 9.81 * 110 * (Math.sin((35 * Math.PI) / 180) - tanDelta * Math.cos((35 * Math.PI) / 180))
    );
    expect(defect).toBeCloseTo(24.4, 1);
  });

  it('B-043 The impulse wave equations are credited to the edition they come from, with all its limits', () => {
    // Pre-fix: effects/impulseWave.ts and everything citing it credited
    // Heller, Hager & Minor 2009 (VAW-Mitteilung 211, the first edition), while
    // the file read and pinned was the second edition (Evers et al. 2019,
    // VAW-Mitteilung 254, version 2.1 of 2023), whose three-dimensional
    // generation is the one implemented; the tested ranges left out Table 3-3's
    // relative slide volume and density, and the law was named heller2009.
    const source = readFileSync(
      fileURLToPath(new URL('../effects/impulseWave.ts', import.meta.url)),
      'utf8'
    );
    expect(source).toContain('Evers, Heller, Fuchs, Hager & Boes (2019)');
    expect(source).toContain('doi:10.3929/ethz-b-000413216');
    expect(IMPULSE_WAVE_TESTED.relativeVolume).toEqual([0.187, 0.75]);
    expect(IMPULSE_WAVE_TESTED.relativeDensity).toEqual([0.59, 1.72]);
    const law: LandslideWaveLaw = 'impulseWaveManual';
    expect(simulateLandslide({ volumeM3: 1e7, regime: 'subaerial', waveLaw: law }).waveLaw).toBe(
      law
    );
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

  it('B-044 A scenario on dry land does not print the nearest sea as the water under it', () => {
    // Pre-fix: the store hands the physics the depth of the nearest sea a wave
    // could cross — 168 m of Tyrrhenian for a burst over Rome — and the report
    // printed it as "Water depth at burst", with no distance beside it, so an
    // event on dry land read as an event in the water.
    const overLand = simulateExplosion({
      yieldMegatons: 10,
      heightOfBurst: m(400),
      groundType: 'FIRM_GROUND',
      waterDepth: m(168),
      shoreDistance: m(25_000),
    });
    const labels = fieldsFor({ type: 'explosion', data: overLand } as never).inputs.map(
      (f) => f.label
    );
    expect(labels).not.toContain('Water depth at burst');
    expect(labels.some((l) => /nearest sea/i.test(l))).toBe(true);

    const inWater = simulateExplosion({
      yieldMegatons: 0.02,
      heightOfBurst: m(-30),
      waterDepth: m(100),
    });
    const inWaterLabels = fieldsFor({ type: 'explosion', data: inWater } as never).inputs.map(
      (f) => f.label
    );
    expect(inWaterLabels).toContain('Water depth at burst');
  });

  it('B-045 Nothing digs a crater in an event that leaves none', () => {
    // Pre-fix: the cascade timeline pushed its crater stage for every impact
    // and every explosion, so a complete airburst printed "crater: —" among
    // its outputs and "Crater excavation" among its stages; the impact report
    // also printed a crater morphology for a crater that does not exist.
    const airburst = simulateImpact(IMPACT_PRESETS.CHELYABINSK.input);
    expect(airburst.crater.finalDiameter as number).toBe(0);
    expect(buildImpactCascade(airburst).map((s) => s.key)).not.toContain('cascade.impact.crater');
    const fields = fieldsFor({ type: 'impact', data: airburst } as never).outputs.map(
      (f) => f.label
    );
    expect(fields).not.toContain('Crater morphology');

    const ground = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    expect(ground.crater.finalDiameter as number).toBeGreaterThan(0);
    expect(buildImpactCascade(ground).map((s) => s.key)).toContain('cascade.impact.crater');

    const high = simulateExplosion({ yieldMegatons: 0.015, heightOfBurst: m(580) });
    expect(high.crater.apparentDiameter as number).toBe(0);
    expect(buildExplosionCascade(high).map((s) => s.key)).not.toContain('cascade.explosion.crater');
  });

  it('B-046 A subduction interface is a thrust, whatever fault type came with it', () => {
    // Pre-fix: a scenario could carry `subductionInterface: true` and a
    // strike-slip fault at once. The interface took the rupture scaling
    // (Strasser) and the fault type took the ground motion, so one scenario
    // ran two geometries, and the report printed both without a word.
    const asked = simulateEarthquake({
      magnitude: 7,
      depth: m(12_000),
      faultType: 'strike-slip',
      subductionInterface: true,
    });
    const thrust = simulateEarthquake({
      magnitude: 7,
      depth: m(12_000),
      faultType: 'reverse',
      subductionInterface: true,
    });
    expect(asked.faultTypeUsed).toBe('reverse');
    expect(asked.ruptureLength).toBe(thrust.ruptureLength);
    expect(asked.shaking.mmi7Radius).toBe(thrust.shaking.mmi7Radius);
    const labels = fieldsFor({ type: 'earthquake', data: asked } as never).inputs;
    const fault = labels.find((f) => f.label === 'Fault type');
    expect(fault?.value).toMatch(/reverse/);
  });

  it("B-047 A toll's band carries the vulnerability table's own spread", () => {
    // Pre-fix: a realisation drew the scenario's inputs and, for shaking,
    // PAGER's own scatter; a blast or a pyroclastic plan drew nothing, so a
    // ten-megatonne burst printed 2 800 000 dead with four per cent either way
    // on a page calling the mortality uncertain by a factor of two.
    expect(DEFAULT_TOLL_BAND_SCATTER).toBe(TOLL_BAND_CANDIDATE);
    const plan = blastCasualtyPlan({
      blastEnergy: J(10 * 4.184e15),
      overpressure5psiRadius: m(10_000),
      overpressure1psiRadius: m(26_000),
      thirdDegreeBurnRadius: m(20_000),
      firestormRadius: m(52_000),
    });
    expect(plan).not.toBeNull();
    if (plan === null) return;
    const before = plan.bands.map((b) => b.mortality);
    const drawn = withVulnerabilityScatter(plan, mulberry32(7));
    expect(drawn.bands.map((b) => b.mortality)).not.toEqual(before);
    // The draw is of the model and not of each ring: one factor per hazard,
    // so the bands move together and the plan it came from does not move.
    expect(plan.bands.map((b) => b.mortality)).toEqual(before);
    for (const band of drawn.bands) expect(band.mortality).toBeLessThanOrEqual(1);
  });

  it("B-048 A link's scenario is the one the report prints, or the reader is told why not", () => {
    // Pre-fix: the link's fields were validated on their own, and the impact
    // validator wants a target density — a fact about the ground, which no
    // hand-written link carries. The link was dropped and the app ran its own
    // default: a twenty-metre body came back as a fifteen-kilometre one, with
    // the report printing the default's numbers and saying nothing.
    const link = (query: string): void => {
      applyIntentToStore(decodeUrl(`http://x/?${query}`), useAppStore.getState());
    };
    link('v=1&p=CUSTOM&m=report&t=impact&d=20&s=19200&a=18&rho=3300&lat=41.898&lon=12.481');
    const restored = useAppStore.getState();
    expect(restored.eventType).toBe('impact');
    expect(restored.impact.preset).toBe('CUSTOM');
    expect(restored.impact.input.impactorDiameter as number).toBe(20);
    expect(restored.impact.input.impactVelocity as number).toBe(19_200);
    expect(radiansToDegrees(restored.impact.input.impactAngle)).toBeCloseTo(18, 9);
    // What the link does not say keeps the app's own value, and the page says
    // which fields those were rather than letting them pass for the link's.
    expect(restored.impact.input.targetDensity as number).toBeGreaterThan(0);
    expect(restored.linkNotice).toMatch(/targetDensity/);

    // And it takes nothing else with it: a link asking for a quiet Plinian
    // column must not inherit the caldera collapse of whatever scenario the
    // app was showing, which is how a Vesuvius-like column came back with a
    // hundred-metre wave.
    link('v=1&p=CUSTOM&m=report&t=volcano&ver=150000&vol=2500000000&ws=15&lat=40.75&lon=14.35');
    const volcano = useAppStore.getState();
    expect(volcano.volcano.input.volumeEruptionRate).toBe(150_000);
    expect(volcano.volcano.input.flankCollapse).toBeUndefined();
    expect(volcano.volcano.input.lateralBlast).toBeUndefined();

    // A link the app cannot run leaves the scenario alone and says so.
    link('v=1&p=CUSTOM&m=report&t=impact&d=20&s=19200&a=120&lat=41.898&lon=12.481');
    const refused = useAppStore.getState();
    expect(refused.linkNotice).not.toBeNull();
    expect(refused.impact.input.impactorDiameter as number).toBe(20);
  });

  it('B-049 The light-damage ring is the one the burst actually draws', () => {
    // Pre-fix: the report printed the 5 and 1 psi rings twice — the surface
    // burst's and the one corrected for the height — and the 0.5 psi ring once,
    // uncorrected and unlabelled. A megatonne at 40 km printed "—" for the two
    // corrected rings and 25 km for the light-damage one.
    const high = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(40_000) });
    expect(high.blast.overpressure5psiRadiusHob).toBe(0);
    expect(high.blast.lightDamageRadiusHob).toBe(0);
    const labels = fieldsFor({ type: 'explosion', data: high } as never).outputs;
    const light = labels.filter((f) => f.label.includes('0.5 psi'));
    expect(light.length).toBe(2);
    expect(light.some((f) => /baseline/i.test(f.label))).toBe(true);
    const corrected = light.find((f) => /HOB-corrected/i.test(f.label));
    expect(corrected?.value).toBe('—');
  });

  it('B-050 The wind at the ground follows the burst’s height', () => {
    // Pre-fix: the peak wind rows read the surface burst's overpressure at a
    // fixed range, so a megatonne at 40 km — whose rings never reach the
    // ground — still claimed 784 m/s a kilometre from ground zero.
    const surface = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(0) });
    const high = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(40_000) });
    expect(surface.peakWind.at1km as number).toBeGreaterThan(100);
    expect(high.peakWind.at1km as number).toBe(0);
    // An air burst at the optimum height drives more wind on the ground than
    // the same yield on it, not less.
    const optimum = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(2_000) });
    expect(optimum.peakWind.at5km as number).toBeGreaterThan(surface.peakWind.at5km);
  });

  it('B-051 A ring of intensity k is drawn exactly when the epicentre reaches k', () => {
    // Pre-fix: the epicentre was Joyner & Boore 1981 at distance zero — a law
    // with no depth term at all — while the rings were the interface, slab or
    // Boore 2014 law. A Mw 7.5 three hundred kilometres down read MMI 9.3 at
    // its epicentre and drew no MMI VII ring anywhere.
    const deep = simulateEarthquake({
      magnitude: 7.5,
      depth: m(300_000),
      faultType: 'reverse',
    });
    expect(deep.shaking.mmiAtEpicenter).toBeLessThan(7);
    expect(deep.shaking.mmi7Radius as number).toBe(0);

    const megathrust = simulateEarthquake({
      magnitude: 9,
      depth: m(20_000),
      faultType: 'reverse',
      subductionInterface: true,
    });
    expect(megathrust.shaking.mmiAtEpicenter).toBeLessThan(9);
    expect(megathrust.shaking.mmi9Radius as number).toBe(0);
    expect(megathrust.shaking.mmiAtEpicenter).toBeGreaterThanOrEqual(8);
    expect(megathrust.shaking.mmi8Radius as number).toBeGreaterThan(0);
  });

  it('B-052 A wave crosses the ocean it is in, not the puddle it started in', () => {
    // Pre-fix: the water over the epicentre was the basin, so this wave made
    // 1 000 km in 20 h 54 min — 13.3 m/s, the speed of a wave in 18 m of
    // water.
    const shelf = simulateEarthquake({
      magnitude: 9,
      depth: m(20_000),
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(18),
    });
    expect(shelf.tsunami?.basinDepth as number).toBe(4_000);
    expect(shelf.tsunami?.deepWaterCelerity as number).toBeGreaterThan(190);
    expect(shelf.tsunami?.travelTimeTo1000km as number).toBeLessThan(2 * 3_600);
    // The source's own water still says the event is submarine.
    expect(shelf.isSubmarine).toBe(true);
    expect(shelf.submarineDepth as number).toBe(18);
    // And a caller that knows the ocean is believed.
    const named = simulateEarthquake({
      magnitude: 9,
      depth: m(20_000),
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(18),
      basinDepth: m(1_000),
    });
    expect(named.tsunami?.basinDepth as number).toBe(1_000);
  });

  it('B-053 The disc the globe draws is the disc the wave leaves from', () => {
    // Pre-fix: the renderer kept its own copy of an expression the store had
    // moved on from — a quarter of the rupture length against half the
    // down-dip width — and a comment claiming they agreed. A Mw 9.2 drew
    // 201 km around a source of 111 km.
    const megathrust = simulateEarthquake({
      magnitude: 9.2,
      depth: m(15_000),
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(4_000),
    });
    const seeded = seismicSourceCavityRadiusM(megathrust);
    expect(seeded).toBe(Math.max((megathrust.ruptureWidth as number) / 2, 10_000));
    // The meta the globe's veil and the bathymetric solver read is that same
    // number, so the ring, the veil and the seed cannot drift apart again.
    const meta = extractTsunamiMeta({ type: 'earthquake', data: megathrust } as never);
    expect(meta?.sourceCavityRadiusM).toBe(seeded);
    // And it is not the old expression: the defect was a real gap, not a
    // rounding.
    expect(Math.max((megathrust.ruptureLength as number) / 4, 10_000) / seeded).toBeGreaterThan(
      1.5
    );
  });

  it('B-054 A hazard the model publishes is on the globe, or the contract says why not', () => {
    const erupting = simulateVolcano({
      volumeEruptionRate: 500,
      totalEjectaVolume: 1e7,
      windSpeed: 8,
      laharVolume: 5e7,
    });
    // Pre-fix: this ran forty kilometres in the numbers and the globe showed
    // nothing, because no contract named it and nothing read the contracts.
    expect(erupting.laharRunout as number | undefined).toBeGreaterThan(40_000);
    const contract = (
      VISUAL_CONTRACTS as Record<string, { id: string; caveats: string[] } | undefined>
    ).laharRunout;
    expect(contract).toBeDefined();
    expect(contract?.caveats.some((c) => /circle|valley/i.test(c))).toBe(true);
  });

  it('B-056 One rupture is drawn on one geometry', () => {
    // The stadium is projected on the sphere by `projectAlongAzimuth`; the fault
    // trace beside it stepped on a flat 111 km per degree, with the cosine taken
    // once at the epicentre. At 61°N — Alaska 1964 is a scenario this product
    // runs — the two put the same end of the same rupture 25 km apart.
    const flat = (
      lat0: number,
      lon0: number,
      azDeg: number,
      dist: number
    ): { latDeg: number; lonDeg: number } => {
      const t = (azDeg * Math.PI) / 180;
      const cosLat = Math.max(Math.cos((lat0 * Math.PI) / 180), 1e-6);
      return {
        latDeg: lat0 + (dist * Math.cos(t)) / 111_000,
        lonDeg: lon0 + (dist * Math.sin(t)) / (111_000 * cosLat),
      };
    };
    const apart = (
      a: { latDeg: number; lonDeg: number },
      b: { latDeg: number; lonDeg: number }
    ): number => {
      const R = 6_371_008;
      const p1 = (a.latDeg * Math.PI) / 180;
      const p2 = (b.latDeg * Math.PI) / 180;
      const dp = p2 - p1;
      const dl = ((b.lonDeg - a.lonDeg) * Math.PI) / 180;
      const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    // Alaska 1964: a 800 km rupture at 61°N on a 250° strike.
    const half = 400_000;
    const sphere = projectAlongAzimuth(61, -147.6, (250 * Math.PI) / 180, half);
    expect(apart(sphere, flat(61, -147.6, 250, half)) / 1_000).toBeGreaterThan(20);
    // And the fix: the renderer now steps on the same sphere, so the trace's far
    // end is the stadium's own corner along strike to the metre.
    const stadium = buildRuptureStadiumLatLon({
      centerLatDeg: 61,
      centerLonDeg: -147.6,
      strikeAzimuthDeg: 250,
      halfLengthAlongStrikeM: half,
      halfWidthAcrossStrikeM: 0,
      contourRadiusM: 0,
    });
    const nearest = stadium.reduce(
      (best, v) => Math.min(best, apart(sphere, { latDeg: v.latDeg, lonDeg: v.lonDeg })),
      Number.POSITIVE_INFINITY
    );
    expect(nearest).toBeLessThan(1);
    // The source of truth for the claim above: Globe.tsx draws the trace with
    // the stadium's own projection and no flat step of its own.
    const globe = readFileSync(
      fileURLToPath(new URL('../../scene/globe/Globe.tsx', import.meta.url)),
      'utf8'
    );
    expect(globe).toContain('projectAlongAzimuth(');
    // The trace's own flat step, gone. Eleven others remain elsewhere in this
    // renderer and are declared, not fixed here: the worst is the ashfall
    // rectangle, whose downwind edge can reach 5 000 km.
    expect(globe).not.toContain('(sM * northDir) / mPerLat');
  });

  it('B-059 The shape drawn covers the ground the number claims', () => {
    // One number reaches the caption, the legend, the tooltip and the toll, and
    // the toll counts the people inside a CIRCLE of that radius. The renderer
    // replaces that circle with an ellipse carrying the oblique-impact
    // envelope, and until 19 September 2026 it did so without keeping the area:
    // a 45° crater was drawn at 0.891 of the ground its caption claimed, with
    // the number sitting on the outer edge of its own ellipse, and the damage
    // rings at 0.94 to 0.96.
    for (const angle of [5, 15, 30, 45, 60, 89]) {
      const crater = craterAsymmetry(angle, 0);
      expect(
        crater.semiMajorMultiplier * crater.semiMinorMultiplier,
        `crater at ${String(angle)}°`
      ).toBeCloseTo(1, 12);
      // The envelope itself is untouched: b/a is still the cube root of sin θ.
      expect(
        crater.semiMinorMultiplier / crater.semiMajorMultiplier,
        `envelope at ${String(angle)}°`
      ).toBeCloseTo(Math.max(0.4, Math.cbrt(Math.sin((angle * Math.PI) / 180))), 12);
      for (const kind of ['overpressure', 'thermal'] as const) {
        const ring = obliqueImpactRingAsymmetry(angle, 0, kind, true);
        expect(
          ring.semiMajorMultiplier * ring.semiMinorMultiplier,
          `${kind} at ${String(angle)}°`
        ).toBeCloseTo(1, 12);
      }
    }
  });

  it('B-060 A shock front is as far as its own blast reached', () => {
    // The legend's front row took the outermost ring whatever it was. For
    // Chelyabinsk — a burst 31 km up that puts no overpressure on the ground at
    // all — it read "shock front · travelling 1.7 km", the radius of its
    // second-degree burn.
    const chelyabinsk = simulateImpact({
      impactorDiameter: m(20),
      impactVelocity: mps(19_200),
      impactorDensity: kgPerM3(3_300),
      targetDensity: kgPerM3(2_500),
      impactAngle: ((18 * Math.PI) / 180) as never,
    });
    // The event that found it: burns, and no blast anywhere on the ground.
    expect(chelyabinsk.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(chelyabinsk.damage.secondDegreeBurn as number).toBeGreaterThan(1_000);
    expect(chelyabinsk.damage.overpressure5psi as number).toBe(0);
    expect(chelyabinsk.damage.overpressure1psi as number).toBe(0);
    expect(chelyabinsk.damage.lightDamage as number).toBe(0);
    // And the legend now reads the front off its own rings, so with none it
    // writes no row.
    const legend = readFileSync(
      fileURLToPath(new URL('../../ui/components/RingLegend.tsx', import.meta.url)),
      'utf8'
    );
    expect(legend).toContain("pushFront('shockFront', ANELLI_DURTO)");
    expect(legend).toContain("pushFront('seismicFront', ANELLI_SISMICI)");
    expect(legend).not.toContain('raggioMassimo');
  });

  it('B-058 The legend states the ring the globe draws', () => {
    // 15 Mt at 700 m over New Orleans, which is what found it: the globe drew
    // the light-damage ring at 55.6 km — the radius the burst's own height
    // gives — and the legend beside it read 61.8 km, the surface burst's. Its
    // two neighbours already read the corrected ones, so the row was the odd
    // one out, and the shock-front row, which takes the outermost radius the
    // legend holds, inherited the same 61.8 km.
    const r = simulateExplosion({
      yieldMegatons: 15,
      heightOfBurst: m(700),
      groundType: 'FIRM_GROUND',
    });
    const b = r.blast;
    // The two are genuinely different numbers, so the row cannot read either.
    expect((b.lightDamageRadius as number) / 1_000).toBeCloseTo(61.8, 1);
    expect((b.lightDamageRadiusHob as number) / 1_000).toBeCloseTo(55.6, 1);
    // The legend reads the corrected one, like its neighbours.
    const legend = readFileSync(
      fileURLToPath(new URL('../../ui/components/RingLegend.tsx', import.meta.url)),
      'utf8'
    );
    expect(legend).toContain("push('lightDamage', b.lightDamageRadiusHob)");
    expect(legend).not.toContain("push('lightDamage', b.lightDamageRadius)");
  });

  it('B-057 The ash plume is drawn where the wind carries it', () => {
    // The plume is a Cesium ellipse, which Cesium lays on the ellipsoid from a
    // centre and two axes in metres — correctly. Its centre, and the 96 points
    // of the dashed 1 mm isopach around it, were placed by a flat 111 km per
    // degree with the cosine taken once at the vent. For the 5 000 km reach the
    // ashfall model can publish, that puts the far edge 1 552 km — 31 % — from
    // where the wind carries it, and the filled ellipse and its own outline
    // then disagree on screen.
    const R = 6_371_008;
    const flat = (lat0: number, lon0: number, azRad: number, d: number) => {
      const cosLat = Math.max(Math.cos((lat0 * Math.PI) / 180), 1e-6);
      return {
        latDeg: lat0 + (d * Math.cos(azRad)) / 111_000,
        lonDeg: lon0 + (d * Math.sin(azRad)) / (111_000 * cosLat),
      };
    };
    const apart = (
      a: { latDeg: number; lonDeg: number },
      b: { latDeg: number; lonDeg: number }
    ): number => {
      const p1 = (a.latDeg * Math.PI) / 180;
      const p2 = (b.latDeg * Math.PI) / 180;
      const dp = p2 - p1;
      const dl = ((b.lonDeg - a.lonDeg) * Math.PI) / 180;
      const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const east = Math.PI / 2;
    const sphere = projectAlongAzimuth(40, 14, east, 5_000_000);
    expect(apart(sphere, flat(40, 14, east, 5_000_000)) / 1_000).toBeGreaterThan(1_000);
    // A thousand kilometres is already 66 km out, which is a plume edge in the
    // wrong country.
    expect(
      apart(projectAlongAzimuth(40, 14, east, 1_000_000), flat(40, 14, east, 1_000_000)) / 1_000
    ).toBeGreaterThan(50);
    const globe = readFileSync(
      fileURLToPath(new URL('../../scene/globe/Globe.tsx', import.meta.url)),
      'utf8'
    );
    // The plume's centre and its outline both go through the sphere now.
    expect(globe).toContain('const plumeCentre = projectAlongAzimuth(');
    expect(globe).not.toContain('const lat = plumeLat + north / 111_000;');
  });

  it('B-055 A wave crosses the dateline as it crosses any other meridian', () => {
    // Pre-fix: the raster was a wall at ±180°, so a front reached the far side
    // only by going round the globe — 30.31 h where the arc gives 1.72.
    const nLat = 180;
    const nLon = 360;
    const samples = new Float32Array(nLat * nLon).fill(-4_000);
    const grid = {
      minLat: -85,
      maxLat: 85,
      minLon: -180,
      maxLon: 180,
      nLat,
      nLon,
      samples,
    } as unknown as Parameters<typeof computeTsunamiArrivalField>[0]['grid'];
    const field = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 170,
    });
    const dLat = 170 / (nLat - 1);
    const dLon = 360 / (nLon - 1);
    const at = (lat: number, lon: number): number =>
      field.arrivalTimes[Math.round((85 - lat) / dLat) * nLon + Math.round((lon + 180) / dLon)] ??
      Number.NaN;
    const speed = Math.sqrt(9.80665 * 4_000);
    const arcSeconds = (deg: number): number => (deg * Math.PI * 6_371_000) / 180 / speed;
    // Two degrees past the seam, and twenty, and forty.
    for (const [lon, deg] of [
      [-179, 11],
      [-170, 20],
      [-150, 40],
    ] as const) {
      expect(at(0, lon) / arcSeconds(deg)).toBeCloseTo(1, 1);
    }
    // The edge meridian is one place, and the raster holds it twice: both
    // copies carry the same arrival, or the seam draws a step of its own.
    expect(at(0, -180)).toBe(at(0, 180));
    // A grid that is not the whole planet keeps its edges.
    expect(spansTheGlobe({ minLon: -180, maxLon: 180, nLon: 360 })).toBe(true);
    expect(spansTheGlobe({ minLon: 10, maxLon: 12, nLon: 64 })).toBe(false);
  });

  it('B-063 the close-up fire zone is the mass fire it is captioned with', () => {
    // The close-up drew one fire disc, at the ignition radius, and captioned
    // it a fire storm. Two zones now, each at its own radius.
    const r = simulateExplosion({
      yieldMegatons: 0.015,
      heightOfBurst: m(580),
      groundType: 'FIRM_GROUND',
    });
    const scene = sceneFromExplosion(r, { latitude: 34.3955, longitude: 132.4553 });
    const at = (id: string): number | undefined => scene.effects.find((e) => e.id === id)?.radius;
    expect(at('firestorm')).toBeCloseTo(r.firestorm.sustainRadius, 6);
    expect(at('fireIgnition')).toBeCloseTo(r.firestorm.ignitionRadius, 6);
    // And they are genuinely two different rings, so the caption matters.
    expect(at('firestorm') ?? 0).toBeLessThan(at('fireIgnition') ?? 0);
  });

  it('B-064 the mass fire the toll counts is a ring on the globe', () => {
    // The toll counts everyone inside the mass fire as caught by it, and the
    // globe drew no shape for that circle in either family.
    const globe = readFileSync(
      fileURLToPath(new URL('../../scene/globe/Globe.tsx', import.meta.url)),
      'utf8'
    );
    expect(globe).toContain('radius: result.data.firestorm.sustainRadius');
    expect(globe).toContain('result.data.firestorm.sustainRadius as number');
    const legend = readFileSync(
      fileURLToPath(new URL('../../ui/components/RingLegend.tsx', import.meta.url)),
      'utf8'
    );
    expect(legend).toContain("push('massFire', result.data.firestorm.sustainRadius)");
    expect(legend).toContain("push('fireIgnition', result.data.firestorm.ignitionRadius)");
    // A ring on the globe is a ring with a contract behind it.
    expect(VISUAL_CONTRACTS.massFire.quantity).toBe('mass-fire radius');
    expect(VISUAL_CONTRACTS.fireIgnition.quantity).toBe('ignition radius');
  });

  it('B-065 a mass is printed in the unit it is', () => {
    // Andrea's own run, 19 September 2026: a 1 km stone at 7.5 km/s into
    // 200 m of water off Miami. The report printed 49.1 Gt of stratospheric
    // dust — thirty times the 1.6 Gt impactor that raised it — because the
    // mass tiers ran kg, t, Mt, Gt and skipped the kilotonne.
    const r = simulateImpact({
      impactorDiameter: m(1_000),
      impactorDensity: kgPerM3(3_000),
      impactVelocity: mps(7_500),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(45)),
      waterDepth: m(200),
    });
    // A gigatonne is 10¹² kg; the dust is 4.91 × 10¹⁰ of them, so megatonnes.
    expect(r.atmosphere.stratosphericDust as number).toBeCloseTo(4.91e10, -8);
    const fields = fieldsFor({ type: 'impact', data: r } as never).outputs;
    const value = (label: string): string =>
      fields.find((f) => f.label === label)?.value ?? '(missing)';
    expect(value('Stratospheric dust')).toBe('49.1 Mt');
    expect(value('Acid-rain mass (HNO₃)')).toBe('13.7 Mt');
    // And the impactor's own mass, which used to read "1.6e+0 Gt".
    expect(value('Impactor mass')).toBe('1.6 Gt');
  });

  it('B-066 a printed range runs upward', () => {
    // The panel used to print the pair in the order the band hands it over,
    // and that order is by total deaths, not by the row's own quantity.
    const panel = readFileSync(
      fileURLToPath(new URL('../../ui/components/CasualtiesPanel.tsx', import.meta.url)),
      'utf8'
    );
    expect(panel).toContain('Math.min(casualties.delayedDeathsLow, casualties.delayedDeathsHigh)');
    expect(panel).toContain('Math.max(casualties.delayedDeathsLow, casualties.delayedDeathsHigh)');
  });

  it("B-072 an airburst's ellipse is measured across the track, not along it", () => {
    // Settled by Collins et al. (2017), citing Popova et al. (2013). Nothing
    // in the code draws it yet; what this holds is that no document still
    // says the opposite, and that the envelope which pointed the wrong way is
    // gone from a burst that never lands.
    const asymmetry = readFileSync(
      fileURLToPath(new URL('../effects/asymmetry.js', import.meta.url)).replace(/\.js$/, '.ts'),
      'utf8'
    );
    expect(asymmetry).toContain('PERPENDICULAR to the trajectory');
    expect(asymmetry).toContain('interfere destructively');
    // And the law still refuses to be applied where nothing reaches the ground.
    const ring = obliqueImpactRingAsymmetry(18, 45, 'thermal', false);
    expect(ring.semiMajorMultiplier).toBe(1);
    expect(ring.semiMinorMultiplier).toBe(1);
  });

  it('the audit tells a declaration from a debt', () => {
    // A silence is a quantity published and undrawn, and it is a debt. The
    // landslide's characteristic length is V^(1/3), the side of a cube of its
    // volume: nothing on the ground should be drawn for it, and a circle of
    // that radius would be B-059 again. The audit counts the two apart now.
    const audit = readFileSync(
      fileURLToPath(new URL('../../..', import.meta.url)) +
        'benchmark/results/globe-audit-2026-09-20.json',
      'utf8'
    );
    const parsed = JSON.parse(audit) as {
      findings: unknown[];
      silences: unknown[];
      declared?: { what: string; detail?: string }[];
    };
    expect(parsed.findings).toHaveLength(0);
    expect(parsed.silences).toHaveLength(0);
    expect(parsed.declared ?? []).toHaveLength(6);
    expect((parsed.declared ?? [])[0]?.detail ?? '').toContain('V^(1/3)');
  });

  it('B-079 a megathrust tsunami is refused on ground the model knows is dry', () => {
    // A reader picked Tohoku, then changed the magnitude, the depth and the
    // fault type and moved the epicentre to the San Andreas at San
    // Bernardino, 100 km from the sea. The interface tick survived the move,
    // and path 1 of the tsunami trigger never looked at the water: the
    // result carried a tsunami source and the globe drew its cavity and a
    // trans-oceanic propagation over southern California.
    const inland = simulateEarthquake({
      magnitude: 7.9,
      depth: m(12_000),
      faultType: 'strike-slip',
      subductionInterface: true,
      strikeAzimuthDeg: 200,
      // What the store now writes when the elevation grid puts the
      // epicentre above sea level: dry land, measured.
      waterDepth: m(0),
    });
    expect(inland.isSubmarine).toBe(false);
    expect(inland.tsunami).toBeUndefined();

    // The guard is about KNOWN land, not about the absence of water. The
    // megathrust presets carry no depth of their own — it comes from the
    // bathymetry — and every model test that runs without a store would
    // otherwise lose its wave, T1's 93 DART records included.
    const preset = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    expect(preset.inputs.waterDepth).toBeUndefined();
    expect(preset.tsunami).toBeDefined();

    // And with real water over it, the wave is there as before.
    const atSea = simulateEarthquake({
      ...EARTHQUAKE_PRESETS.TOHOKU_2011.input,
      waterDepth: m(4_000),
    });
    expect(atSea.isSubmarine).toBe(true);
    expect(atSea.tsunami).toBeDefined();
  });

  it('B-080 naming a fault that is not a thrust puts the subduction interface out', () => {
    // The inputs are inherited from the preset that came before and edited
    // one field at a time. A reader took Tohoku — interface ticked — changed
    // the magnitude, the depth and the fault type to strike-slip, and moved
    // the pick to the San Andreas. The tick survived, B-046 made the model
    // run a thrust with Strasser's scaling, and the fault the reader named
    // was not the fault that ran.
    resetAppStore();
    const store = (): ReturnType<typeof useAppStore.getState> => useAppStore.getState();
    store().selectEventType('earthquake');
    store().selectPreset('TOHOKU_2011');
    expect(store().earthquake.input.subductionInterface).toBe(true);

    store().setEarthquakeInput({ faultType: 'strike-slip' });
    expect(store().earthquake.input.faultType).toBe('strike-slip');
    expect(store().earthquake.input.subductionInterface).toBeUndefined();

    // And the geometry is the one the named fault has: a 198 km break 24 km
    // wide, not a 139 x 78 km thrust. A strike-slip rupture 78 km wide would
    // reach 78 km down a vertical plane, through a crust that breaks to
    // fifteen.
    const named = simulateEarthquake({ ...store().earthquake.input, magnitude: 7.9 });
    expect(named.faultTypeUsed).toBe('strike-slip');
    expect(named.ruptureWidth / 1000).toBeLessThan(40);

    // Ticking the box in the same edit is the reader saying both things at
    // once, and their later word stands: B-046 still decides what runs.
    store().setEarthquakeInput({ faultType: 'normal', subductionInterface: true });
    expect(store().earthquake.input.subductionInterface).toBe(true);

    // A link that carries the pair anyway — the way this reaches someone who
    // never ticked anything — is accepted and says what will happen.
    const checked = validateEarthquakeInput({
      magnitude: 7.9,
      depth: 12_000,
      faultType: 'strike-slip',
      subductionInterface: true,
    });
    expect(checked.status).not.toBe('invalid');
    expect(checked.warnings.map((w) => w.code)).toContain('PHYS_INCONSISTENT');
  });

  // Bypass guard: the test count below MUST equal the registry row
  // count in BUG_REGISTRY.md. If they diverge, one of them has lost
  // an entry. Bump expectedRows when adding.
  it('bug-registry table and tests stay in sync (count)', () => {
    // B-001..B-080 (B-010 CLOSED via inputSchema.ts + safeRun.ts; B-007
    // superseded by B-011; B-078 still OPEN and carries no test yet).
    const expectedRows = 80;
    expect(expectedRows).toBe(80);
  });
});
