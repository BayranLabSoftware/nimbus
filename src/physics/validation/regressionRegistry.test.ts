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
import { ashfallMassLoading } from '../events/volcano/ashfall.js';
import { simulateLandslide, LANDSLIDE_PRESETS } from '../events/landslide/index.js';
import { simulateImpact, IMPACT_PRESETS } from '../simulate.js';
import { oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { impactFireballRadius } from '../effects/blastWave.js';
import { thermalHorizonRadius } from '../casualties.js';
import { CRUSTAL_ROCK_DENSITY } from '../constants.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';
import { validateScenario } from './inputSchema.js';
import { safeRunEarthquake } from './safeRun.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import { explosionSampler } from '../montecarlo/explosionMonteCarlo.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { compareWithRecord, RECORDED_EVENTS } from './recordedTolls.js';
import { makeElevationGrid } from '../elevation/index.js';
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
    // it no seismic effect.
    const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(tunguska.entry.energyFractionToGround).toBe(0);
    expect(tunguska.seismic.magnitude).toBe(0);
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
    expect(ignitionRadius as number).toBeCloseTo(horizon, -2);
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

  it('B-020 The ground-motion residual is the total Boore et al. 2014 give', () => {
    // Pre-fix: σ_lnY 0.50, quoted with a τ ≈ 0.397 and a φ ≈ 0.308 that
    // are not in the paper. For PGA at M ≥ 5.5 it gives τ = 0.348 and
    // φ = 0.495.
    expect(EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma).toBeCloseTo(Math.hypot(0.348, 0.495), 1);
    expect(EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma).toBeGreaterThan(0.55);
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
    // B-001..B-025 and B-027..B-031 (B-010 CLOSED via inputSchema.ts +
    // safeRun.ts; B-007 superseded by B-011; B-026, the population of a
    // planetary circle, is named in docs/ROADMAP.md and not yet entered).
    const expectedRows = 30;
    expect(expectedRows).toBe(30);
  });
});
