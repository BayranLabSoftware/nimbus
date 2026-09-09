import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../physics/events/earthquake/index.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../physics/events/explosion/index.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from '../physics/events/landslide/index.js';
import { makeElevationGrid } from '../physics/elevation/index.js';
import { IMPACT_PRESETS, simulateImpact } from '../physics/simulate.js';
import { m } from '../physics/units.js';
import {
  gateEarthquakeByTerrain,
  gateExplosionByTerrain,
  gateImpactByTerrain,
  resetAppStore,
  useAppStore,
} from './useAppStore.js';

// Bigger Chicxulub-class baseline so the entry pipeline classifies
// the impact as INTACT (gf = 1) and the post-evaluate gates have
// real numbers to zero out. Tunguska is too small for the firestorm
// branch to fire on its own.
const CHICXULUB_LAND = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
// Same impactor with explicit ocean inputs — drives the tsunami
// branch into the result, plus non-zero firestorm + liquefaction.
const CHICXULUB_OCEAN = simulateImpact(IMPACT_PRESETS.CHICXULUB_OCEAN.input);

describe('gateImpactByTerrain', () => {
  it('hands back the original result when the click is on land and tsunami is absent', () => {
    const out = gateImpactByTerrain(CHICXULUB_LAND, false);
    expect(out).toBe(CHICXULUB_LAND);
  });

  it('zeroes firestorm + liquefaction when the click is in open water', () => {
    expect(CHICXULUB_OCEAN.firestorm.ignitionRadius as number).toBeGreaterThan(0);
    expect(CHICXULUB_OCEAN.seismic.liquefactionRadius as number).toBeGreaterThan(0);
    const out = gateImpactByTerrain(CHICXULUB_OCEAN, true);
    expect(out.firestorm.ignitionRadius as number).toBe(0);
    expect(out.firestorm.sustainRadius as number).toBe(0);
    expect(out.firestorm.ignitionArea as number).toBe(0);
    expect(out.seismic.liquefactionRadius as number).toBe(0);
  });

  it('preserves crater + tsunami output for an oceanic impact', () => {
    const out = gateImpactByTerrain(CHICXULUB_OCEAN, true);
    expect(out.crater.finalDiameter as number).toBeGreaterThan(0);
    expect(out.tsunami).not.toBeNull();
    expect(out.tsunami).toEqual(CHICXULUB_OCEAN.tsunami);
  });

  // The coastal credibility rule moved into the physics: the sea is
  // within reach of an impact on land when the crater rim, the water
  // cavity or the 1 m ejecta isopach crosses the shoreline, and the
  // energy entering the water is scaled by the ejecta fraction that
  // lands beyond it (McGetchin 1973). The store now only hands the
  // shoreline distance over; the gate here just leaves land results
  // alone.
  it('leaves a coastal-synth result untouched — the physics already decided', () => {
    const synth = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(85_000),
    });
    expect(synth.tsunami).toBeDefined();
    expect(gateImpactByTerrain(synth, false)).toBe(synth);
  });
});

describe('impact sea coupling (shoreDistance)', () => {
  it('Chicxulub 70 km inland (Winter Haven → Tampa Bay): the 82 km crater rim reaches the sea, full coupling', () => {
    const r = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(70_000),
    });
    expect(r.tsunami).toBeDefined();
    expect(r.tsunami?.seaCoupling.mechanism).toBe('crater');
    expect(r.tsunami?.seaCoupling.fraction).toBe(1);
  });

  it('Chicxulub 85 km inland: just past the rim, the ejecta couple ≈ 97 % of the energy', () => {
    const r = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(85_000),
    });
    expect(r.tsunami?.seaCoupling.mechanism).toBe('ejecta');
    expect(r.tsunami?.seaCoupling.fraction).toBeGreaterThan(0.9);
    expect(r.tsunami?.seaCoupling.fraction).toBeLessThan(1);
  });

  it('Chicxulub 1 000 km inland (Kansas): the ejecta still reach the Gulf, coupling ≈ R/d', () => {
    const coast = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(0),
    });
    const kansas = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(1_000_000),
    });
    expect(kansas.tsunami).toBeDefined();
    expect(kansas.tsunami?.seaCoupling.mechanism).toBe('ejecta');
    const f = kansas.tsunami?.seaCoupling.fraction ?? 0;
    expect(f).toBeGreaterThan(0.03);
    expect(f).toBeLessThan(0.2);
    // Less energy in the water → smaller cavity, but a fourth root away.
    const cavityCoast = coast.tsunami?.cavityRadius as number;
    const cavityKansas = kansas.tsunami?.cavityRadius as number;
    expect(cavityKansas).toBeLessThan(cavityCoast);
    expect(cavityKansas / cavityCoast).toBeCloseTo(f ** 0.25, 2);
  });

  it('beyond the 1 m ejecta isopach the sea is not moved: no tsunami block', () => {
    const r = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(200),
      shoreDistance: m(20_000_000),
    });
    expect(r.tsunami).toBeUndefined();
  });

  it('Tunguska-class on Sicily: no crater, no ejecta, no tsunami 5 km from the coast', () => {
    const r = simulateImpact({
      ...IMPACT_PRESETS.TUNGUSKA.input,
      waterDepth: m(200),
      shoreDistance: m(5_000),
    });
    expect(r.tsunami).toBeUndefined();
  });

  it('coupling fraction never grows with distance', () => {
    let last = 2;
    for (const d of [0, 10_000, 50_000, 100_000, 300_000, 1_000_000, 1_500_000]) {
      const r = simulateImpact({
        ...IMPACT_PRESETS.CHICXULUB.input,
        waterDepth: m(200),
        shoreDistance: m(d),
      });
      const f = r.tsunami?.seaCoupling.fraction ?? 0;
      expect(f).toBeLessThanOrEqual(last + 1e-12);
      last = f;
    }
  });
});

describe('gateExplosionByTerrain', () => {
  // 50 Mt thermonuclear groundburst — Tsar Bomba scaled to a yield
  // that produces non-zero firestorm and crater radii so the gating
  // is observable.
  const tsarLand = simulateExplosion(EXPLOSION_PRESETS.TSAR_BOMBA_1961.input);

  it('passes the result through on land', () => {
    expect(gateExplosionByTerrain(tsarLand, false)).toBe(tsarLand);
  });

  it('zeroes crater + firestorm on a deep-ocean burst', () => {
    expect(tsarLand.firestorm.ignitionRadius as number).toBeGreaterThan(0);
    const out = gateExplosionByTerrain(tsarLand, true);
    expect(out.crater.apparentDiameter as number).toBe(0);
    expect(out.firestorm.ignitionRadius as number).toBe(0);
    expect(out.firestorm.sustainRadius as number).toBe(0);
    expect(out.firestorm.ignitionArea as number).toBe(0);
    expect(out.firestorm.sustainArea as number).toBe(0);
  });

  it('keeps the blast / thermal / radiation outputs (those happen above the surface regardless)', () => {
    const out = gateExplosionByTerrain(tsarLand, true);
    expect(out.blast).toEqual(tsarLand.blast);
    expect(out.thermal).toEqual(tsarLand.thermal);
    expect(out.radiation).toEqual(tsarLand.radiation);
    expect(out.emp).toEqual(tsarLand.emp);
  });
});

describe('gateEarthquakeByTerrain', () => {
  it('hands a continental-fault result back unchanged', () => {
    const continental = simulateEarthquake({
      magnitude: 7.0,
      faultType: 'reverse',
    });
    expect(continental.isSubmarine).toBe(false);
    expect(gateEarthquakeByTerrain(continental)).toBe(continental);
  });

  it('zeroes shaking.liquefactionRadius for a submarine megathrust', () => {
    const submarine = simulateEarthquake({
      magnitude: 9.1,
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(7_000),
    });
    expect(submarine.isSubmarine).toBe(true);
    expect(submarine.shaking.liquefactionRadius as number).toBeGreaterThan(0);
    const gated = gateEarthquakeByTerrain(submarine);
    expect(gated.shaking.liquefactionRadius as number).toBe(0);
    // MMI rings + tsunami stay — those are the right channel for the
    // coastal effects of a submarine event.
    expect(gated.shaking.mmi7Radius).toEqual(submarine.shaking.mmi7Radius);
    expect(gated.tsunami).toEqual(submarine.tsunami);
  });
});

/**
 * 9 × 9 sample grid where the centre cell sits at sea level (a quay,
 * a reef, an atoll) and the surrounding cells are 50 m below — the
 * minimal shape that lets `findNearbyOceanDepth` succeed without
 * dragging in a real Terrarium tile.
 */
function makeCoastalGrid() {
  const N = 9;
  const samples = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      samples[i * N + j] = i === 4 && j === 4 ? 0 : -50;
    }
  }
  return makeElevationGrid({
    minLat: 11.0,
    maxLat: 12.0,
    minLon: 164.5,
    maxLon: 166.0,
    nLat: N,
    nLon: N,
    samples,
  });
}

describe('coastal-explosion tsunami flow', () => {
  beforeEach(() => {
    resetAppStore();
  });
  afterEach(() => {
    useAppStore.getState().setElevationGrid(null);
  });

  it('a coastal click carries the shore distance and the sea depth into the physics', async () => {
    const s = useAppStore.getState();
    s.selectPreset('CASTLE_BRAVO_1954');
    s.setMode('globe');
    s.setLocation({ latitude: 11.583, longitude: 165.383 });
    // Tile arrives BEFORE the user presses Launch. The store no
    // longer auto-fires a catch-up evaluate — Launch is the sole
    // trigger — so the test mirrors the user-facing flow: place
    // the pin, wait for the tile, then evaluate.
    useAppStore.getState().setElevationGrid(makeCoastalGrid());
    await s.evaluate();

    const r = useAppStore.getState().result;
    expect(r?.type).toBe('explosion');
    if (r?.type === 'explosion') {
      // The sea was found and both numbers reached the physics — the
      // depth it is, and how far away it lies.
      expect(r.data.inputs.waterDepth as number | undefined).toBeGreaterThan(0);
      // The click landed on water here, so there is no shore to cross
      // and the coupling law says so rather than being skipped.
      expect(r.data.seaCoupling).toBeDefined();
      expect(r.data.seaCoupling?.mechanism).toBe('water');
      // Castle Bravo was fired on a reef, at the surface, and is
      // remembered for its crater and its fallout rather than for any
      // wave. A burst that never entered the water vents its globe to
      // the air, so the depth-of-burst curve gives it no source —
      // unlike Crossroads Baker, which was hung twenty-seven metres
      // down and made the famous one.
      expect(r.data.isContactWaterBurst).toBe(false);
      expect(r.data.tsunami).toBeUndefined();
    }
  });

  it('does not re-evaluate when the user pans to a new pin without pressing Launch', async () => {
    const s = useAppStore.getState();
    s.selectPreset('CASTLE_BRAVO_1954');
    s.setMode('globe');
    s.setLocation({ latitude: 11.583, longitude: 165.383 });
    useAppStore.getState().setElevationGrid(makeCoastalGrid());
    await s.evaluate();
    const stampA = useAppStore.getState().lastEvaluatedAt;
    expect(stampA).not.toBeNull();

    // Move the pin elsewhere and let a fresh tile land. With the
    // DEM catch-up removed, evaluate stays put — only handleLaunch
    // can fire a new run.
    useAppStore.getState().setLocation({ latitude: 0, longitude: 0 });
    useAppStore.getState().setElevationGrid(makeCoastalGrid());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(useAppStore.getState().lastEvaluatedAt).toBe(stampA);
  });
});

describe('landslide tsunami gate (volcanoTsunami null on dry runout)', () => {
  it('Elm 1881 (meanOceanDepth = 0) produces no tsunami', () => {
    const elm = simulateLandslide(LANDSLIDE_PRESETS.ELM_1881.input);
    expect(elm.tsunami).toBeNull();
  });

  it('Storegga (submarine, meanOceanDepth > 0) still produces a tsunami', () => {
    const storegga = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(storegga.tsunami).not.toBeNull();
  });
});
