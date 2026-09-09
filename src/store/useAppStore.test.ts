import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EARTHQUAKE_PRESETS } from '../physics/events/earthquake/index.js';
import { VOLCANO_PRESETS } from '../physics/events/volcano/index.js';
import { IMPACT_PRESETS } from '../physics/simulate.js';
import { makeElevationGrid, type ElevationGrid } from '../physics/elevation/index.js';
import {
  TRANSITION_HALF_MS,
  configurePopulationDensity,
  configurePopulationLookup,
  configureTerrainLoaders,
  resetAppStore,
  useAppStore,
} from './useAppStore.js';

beforeEach(() => {
  resetAppStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAppStore — initial state', () => {
  it('starts on the impact event with a Chicxulub preset loaded', () => {
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('CHICXULUB');
    expect(s.impact.input).toBe(IMPACT_PRESETS.CHICXULUB.input);
    expect(s.result).toBeNull();
    expect(s.status).toBe('idle');
    expect(s.mode).toBe('landing');
  });

  it('pre-loads a Tōhoku earthquake preset and Krakatau volcano preset', () => {
    const s = useAppStore.getState();
    expect(s.earthquake.preset).toBe('TOHOKU_2011');
    expect(s.earthquake.input).toBe(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
    expect(s.volcano.preset).toBe('KRAKATAU_1883');
    expect(s.volcano.input).toBe(VOLCANO_PRESETS.KRAKATAU_1883.input);
  });
});

describe('useAppStore — selectEventType', () => {
  it('flips the active category and clears any stale result', async () => {
    await useAppStore.getState().evaluate();
    expect(useAppStore.getState().result).not.toBeNull();

    useAppStore.getState().selectEventType('earthquake');
    const s = useAppStore.getState();
    expect(s.eventType).toBe('earthquake');
    expect(s.result).toBeNull();
    expect(s.status).toBe('idle');
  });
});

describe('useAppStore — selectPreset', () => {
  it('switches to impact mode and loads an impact preset', () => {
    useAppStore.getState().selectPreset('TUNGUSKA');
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('TUNGUSKA');
    expect(s.impact.input).toBe(IMPACT_PRESETS.TUNGUSKA.input);
  });

  it('switches to earthquake mode when given an earthquake preset', () => {
    useAppStore.getState().selectPreset('NORTHRIDGE_1994');
    const s = useAppStore.getState();
    expect(s.eventType).toBe('earthquake');
    expect(s.earthquake.preset).toBe('NORTHRIDGE_1994');
    expect(s.earthquake.input).toBe(EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input);
  });

  it('switches to volcano mode when given a volcano preset', () => {
    useAppStore.getState().selectPreset('TAMBORA_1815');
    const s = useAppStore.getState();
    expect(s.eventType).toBe('volcano');
    expect(s.volcano.preset).toBe('TAMBORA_1815');
    expect(s.volcano.input).toBe(VOLCANO_PRESETS.TAMBORA_1815.input);
  });

  it('drops the stale result after a preset switch', async () => {
    await useAppStore.getState().evaluate();
    expect(useAppStore.getState().result).not.toBeNull();
    useAppStore.getState().selectPreset('KRAKATAU_1883');
    expect(useAppStore.getState().result).toBeNull();
  });
});

describe('useAppStore — setImpactInput', () => {
  it('marks the impact preset as CUSTOM and preserves unchanged fields', () => {
    useAppStore.getState().setImpactInput({ impactorDiameter: 5_000 });
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('CUSTOM');
    expect(s.impact.input.impactorDiameter as number).toBe(5_000);
    expect(s.impact.input.impactVelocity as number).toBe(20_000);
  });

  it('converts impact angle from degrees to radians', () => {
    useAppStore.getState().setImpactInput({ impactAngle: 90 });
    expect(useAppStore.getState().impact.input.impactAngle as number).toBeCloseTo(Math.PI / 2, 12);
  });

  it('invalidates the current result and switches back to impact mode', async () => {
    useAppStore.getState().selectEventType('volcano');
    await useAppStore.getState().evaluate();
    expect(useAppStore.getState().result).not.toBeNull();
    useAppStore.getState().setImpactInput({ impactorDiameter: 1_000 });
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.result).toBeNull();
  });

  it('normalises impactAzimuthDeg into [0, 360) and persists it', () => {
    useAppStore.getState().setImpactInput({ impactAzimuthDeg: 405 });
    expect(useAppStore.getState().impact.input.impactAzimuthDeg).toBe(45);
    useAppStore.getState().setImpactInput({ impactAzimuthDeg: -90 });
    expect(useAppStore.getState().impact.input.impactAzimuthDeg).toBe(270);
  });
});

describe('useAppStore — evaluate', () => {
  it('runs simulateImpact on the current impact input and tags the result', async () => {
    await useAppStore.getState().evaluate();
    const s = useAppStore.getState();
    expect(s.result).not.toBeNull();
    expect(s.result?.type).toBe('impact');
    if (s.result?.type === 'impact') {
      expect(s.result.data.crater.morphology).toBe('complex');
    }
  });

  it('runs simulateEarthquake when eventType is earthquake', async () => {
    useAppStore.getState().selectPreset('NORTHRIDGE_1994');
    await useAppStore.getState().evaluate();
    const s = useAppStore.getState();
    expect(s.result?.type).toBe('earthquake');
    if (s.result?.type === 'earthquake') {
      expect(s.result.data.shaking.mmiAtEpicenter).toBeGreaterThan(5);
    }
  });

  it('runs simulateVolcano when eventType is volcano', async () => {
    useAppStore.getState().selectPreset('KRAKATAU_1883');
    await useAppStore.getState().evaluate();
    const s = useAppStore.getState();
    expect(s.result?.type).toBe('volcano');
    if (s.result?.type === 'volcano') {
      expect(s.result.data.vei).toBe(6);
    }
  });
});

describe('useAppStore — location', () => {
  it('setLocation stores valid WGS84 coordinates and clearLocation resets', () => {
    useAppStore.getState().setLocation({ latitude: 21.3, longitude: -89.5 });
    expect(useAppStore.getState().location).toEqual({ latitude: 21.3, longitude: -89.5 });
    useAppStore.getState().clearLocation();
    expect(useAppStore.getState().location).toBeNull();
  });

  it('setLocation rejects out-of-range coordinates', () => {
    expect(() => {
      useAppStore.getState().setLocation({ latitude: 200, longitude: 0 });
    }).toThrow(/Invalid/);
  });
});

describe('useAppStore — view mode + transitionTo', () => {
  it('setMode updates the view instantly', () => {
    useAppStore.getState().setMode('globe');
    expect(useAppStore.getState().mode).toBe('globe');
  });

  it('transitionTo animates through fading-out → swap → fading-in → idle', () => {
    vi.useFakeTimers();
    useAppStore.getState().setMode('landing');
    useAppStore.getState().transitionTo('globe');

    expect(useAppStore.getState().transitionPhase).toBe('fading-out');
    expect(useAppStore.getState().mode).toBe('landing');

    vi.advanceTimersByTime(TRANSITION_HALF_MS);
    expect(useAppStore.getState().mode).toBe('globe');
    expect(useAppStore.getState().transitionPhase).toBe('fading-in');

    vi.advanceTimersByTime(TRANSITION_HALF_MS);
    expect(useAppStore.getState().transitionPhase).toBe('idle');
  });

  it('transitionTo { instant: true } skips the animation', () => {
    useAppStore.getState().setMode('landing');
    useAppStore.getState().transitionTo('globe', { instant: true });
    expect(useAppStore.getState().mode).toBe('globe');
    expect(useAppStore.getState().transitionPhase).toBe('idle');
  });
});

describe('useAppStore — reset', () => {
  it('restores every slice to its initial value', async () => {
    useAppStore.getState().selectPreset('TAMBORA_1815');
    useAppStore.getState().setLocation({ latitude: 21.3, longitude: -89.5 });
    await useAppStore.getState().evaluate();
    useAppStore.getState().setMode('globe');

    useAppStore.getState().reset();

    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('CHICXULUB');
    expect(s.location).toBeNull();
    expect(s.result).toBeNull();
    expect(s.mode).toBe('landing');
  });
});

describe('useAppStore — terrain before physics', () => {
  /** A flat 4 km ocean tile centred on the given point, wide enough to
   *  cover any nearby click. */
  function oceanTile(lat: number, lon: number): ElevationGrid {
    const N = 32;
    const samples = new Float32Array(N * N);
    samples.fill(-4_000);
    return makeElevationGrid({
      minLat: lat - 1,
      maxLat: lat + 1,
      minLon: lon - 1,
      maxLon: lon + 1,
      nLat: N,
      nLon: N,
      samples,
    });
  }

  afterEach(() => {
    configureTerrainLoaders(null);
  });

  it('awaits the local tile under the pick, so an ocean click gets its tsunami on the first Launch', async () => {
    const local = vi.fn((lat: number, lon: number) => Promise.resolve(oceanTile(lat, lon)));
    // The mosaic fails fast (offline): evaluate must not wait for it.
    configureTerrainLoaders({ local, global: () => Promise.reject(new Error('offline')) });
    useAppStore.getState().selectPreset('CHICXULUB');
    useAppStore.getState().setLocation({ latitude: 30, longitude: -40 });
    await useAppStore.getState().evaluate();
    expect(local).toHaveBeenCalledWith(30, -40);
    const s = useAppStore.getState();
    expect(s.elevationGrid).not.toBeNull();
    expect(s.result?.type).toBe('impact');
    if (s.result?.type === 'impact') {
      // Water under the pick → the tsunami branch fired → the
      // bathymetric layer exists (local only: the mosaic never came).
      expect(s.result.data.tsunami).toBeDefined();
    }
    expect(s.bathymetricTsunami).not.toBeNull();
    expect(s.bathymetricTsunami?.global).toBeUndefined();
  }, 20_000);

  it('does not touch the network when no loaders are configured', async () => {
    useAppStore.getState().setLocation({ latitude: 30, longitude: -40 });
    await useAppStore.getState().evaluate();
    expect(useAppStore.getState().elevationGrid).toBeNull();
    expect(useAppStore.getState().result).not.toBeNull();
  });

  it('a mosaic that lands after Launch completes the tsunami layer of the result on screen', async () => {
    configureTerrainLoaders({
      local: (lat, lon) => Promise.resolve(oceanTile(lat, lon)),
      global: () => Promise.reject(new Error('offline')),
    });
    useAppStore.getState().selectPreset('CHICXULUB');
    useAppStore.getState().setLocation({ latitude: 30, longitude: -40 });
    await useAppStore.getState().evaluate();
    const before = useAppStore.getState();
    expect(before.bathymetricTsunami?.global).toBeUndefined();
    const result = before.result;

    // The planetary mosaic arrives late: a coarse flat ocean.
    const N = 64;
    const samples = new Float32Array(N * N);
    samples.fill(-4_000);
    const mosaic = makeElevationGrid({
      minLat: -85,
      maxLat: 85,
      minLon: -180,
      maxLon: 180,
      nLat: N,
      nLon: N,
      samples,
    });
    useAppStore.getState().setGlobalBathymetricGrid(mosaic);
    await vi.waitFor(
      () => {
        expect(useAppStore.getState().bathymetricTsunami?.global).toBeDefined();
      },
      { timeout: 15_000 }
    );
    // Same physics result — only the propagation layer was completed.
    expect(useAppStore.getState().result).toBe(result);
  }, 30_000);
});

describe('useAppStore — casualty estimate', () => {
  afterEach(() => {
    configurePopulationLookup(null);
  });

  it('stays idle when no population backend is registered (unit tests, offline builds)', async () => {
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    useAppStore.getState().setLocation({ latitude: 40.85, longitude: 14.27 });
    await useAppStore.getState().evaluate();
    await vi.waitFor(() => {
      expect(useAppStore.getState().casualtyStatus).toBe('idle');
    });
    expect(useAppStore.getState().casualties).toBeNull();
  });

  it('turns the population inside each blast band into deaths, injured and exposure', async () => {
    // A uniform city of 5 000 people per km²: population ∝ area.
    configurePopulationLookup((lat, lon, radiusM) =>
      Promise.resolve({
        exposed: Math.round(5_000 * Math.PI * (radiusM / 1_000) ** 2),
        source: 'test',
        method: 'worldpop-api' as const,
        radiusM,
        bbox: { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon },
      })
    );
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    useAppStore.getState().setLocation({ latitude: 40.85, longitude: 14.27 });
    await useAppStore.getState().evaluate();
    await vi.waitFor(
      () => {
        expect(useAppStore.getState().casualties).not.toBeNull();
      },
      { timeout: 10_000 }
    );
    const c = useAppStore.getState().casualties;
    if (c === null) throw new Error('casualties');
    expect(c.model).toBe('blast');
    // Four OTA annuli, split further by the burn and firestorm radii.
    expect(c.bands.length).toBeGreaterThanOrEqual(4);
    expect(c.bands.some((b) => b.hazards.includes('thermal'))).toBe(true);
    expect(c.delayedDeaths).toBeGreaterThan(0);
    expect(c.deaths).toBe(c.promptDeaths + c.delayedDeaths);
    expect(c.deaths).toBeGreaterThan(0);
    expect(c.deathsLow).toBeLessThan(c.deaths);
    expect(c.deathsHigh).toBeGreaterThan(c.deaths);
    expect(c.injured).toBeGreaterThan(0);
    // Exposure = everyone inside the 1 psi ring, and the population
    // exposure row reports the 5 psi ring from the same lookups.
    const outermost = Math.max(...c.bands.map((b) => b.outerRadiusM));
    expect(c.exposed).toBe(Math.round(5_000 * Math.PI * (outermost / 1_000) ** 2));
    expect(useAppStore.getState().populationExposure?.ringLabel).toBe(
      'population.ring.overpressure5psi'
    );
    await vi.waitFor(() => {
      expect(useAppStore.getState().casualtyStatus).toBe('idle');
    });
    expect(useAppStore.getState().casualties?.provisional).toBe(false);
    // The estimate comes with its sweep and the bar's clock started.
    const timeline = useAppStore.getState().casualtyTimeline;
    if (timeline === null) throw new Error('timeline');
    expect(timeline.model).toBe('blast');
    expect(timeline.promptDeathsEndS).toBeGreaterThan(1);
    // The later deaths run to a month; the sweep ends with them.
    expect(timeline.deathsEndS).toBeGreaterThan(timeline.promptDeathsEndS);
    expect(timeline.endS).toBeGreaterThanOrEqual(timeline.deathsEndS);
    expect(timeline.deaths).toBeGreaterThan(0);
    expect(useAppStore.getState().casualtyClockStartedAt).not.toBeNull();
  });

  it('prints a predictive band, not the width of the vulnerability table', async () => {
    const radii: number[] = [];
    configurePopulationLookup((lat, lon, radiusM) => {
      radii.push(radiusM);
      return Promise.resolve({
        exposed: Math.round(5_000 * Math.PI * (radiusM / 1_000) ** 2),
        source: 'test',
        method: 'worldpop-api' as const,
        radiusM,
        bbox: { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon },
      });
    });
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    useAppStore.getState().setLocation({ latitude: 40.85, longitude: 14.27 });
    await useAppStore.getState().evaluate();
    await vi.waitFor(
      () => {
        expect(useAppStore.getState().casualtyStatus).toBe('idle');
        expect(useAppStore.getState().casualties?.provisional).toBe(false);
      },
      { timeout: 10_000 }
    );
    const c = useAppStore.getState().casualties;
    if (c === null) throw new Error('casualties');

    // The pair beside the headline is the fifth and ninety-fifth
    // percentile of the toll under the published yield and burst-
    // height scatter. Against a device whose yield is known to ten
    // per cent that is a tight claim — where the vulnerability
    // table's gentlest and harshest settings spanned a factor of four.
    expect(c.deathsHigh / Math.max(c.deathsLow, 1)).toBeLessThan(2);

    // ...and it says so, because a range of parameters and a
    // predictive interval look identical in a pair of brackets.
    expect(c.predictiveBand).toBe(true);

    // Each end is one realisation taken whole, so the rows total to
    // it. A column of per-band percentiles would not.
    const bands = c.bands;
    const sum = (f: (b: (typeof bands)[number]) => number): number =>
      bands.reduce((acc, b) => acc + f(b), 0);
    expect(sum((b) => b.deathsLow)).toBeCloseTo(c.deathsLow, -1);
    expect(sum((b) => b.deathsHigh)).toBeCloseTo(c.deathsHigh, -1);

    // What the band costs: two footprints beyond the plan's own
    // rings, bracketing the radii the draws reach so that nothing
    // outside the measured range is ever read off the curve. Plus the
    // headline ring, when it is not already one of them.
    const distinct = new Set(radii.map((r) => Math.round(r)));
    expect(distinct.size).toBeGreaterThanOrEqual(c.bands.length + 2);
    expect(distinct.size).toBeLessThanOrEqual(c.bands.length + 3);
    expect(Math.min(...distinct)).toBeLessThan(Math.min(...c.bands.map((b) => b.outerRadiusM)));
    expect(Math.max(...distinct)).toBeGreaterThan(Math.max(...c.bands.map((b) => b.outerRadiusM)));
  });

  it('asks the coarse raster first for a provisional figure, then the fine backends', async () => {
    const calls: (boolean | undefined)[] = [];
    configurePopulationLookup((lat, lon, radiusM, _polygon, options) => {
      calls.push(options?.fast);
      // The raster sees 80 % of what WorldPop will count.
      const scale = options?.fast === true ? 0.8 : 1;
      return Promise.resolve({
        exposed: Math.round(scale * 5_000 * Math.PI * (radiusM / 1_000) ** 2),
        source: options?.fast === true ? 'raster' : 'api',
        method: options?.fast === true ? ('coarse-raster' as const) : ('worldpop-api' as const),
        radiusM,
        bbox: { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon },
      });
    });
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    useAppStore.getState().setLocation({ latitude: 40.85, longitude: 14.27 });
    await useAppStore.getState().evaluate();
    await vi.waitFor(
      () => {
        expect(useAppStore.getState().casualtyStatus).toBe('idle');
        expect(useAppStore.getState().casualties?.provisional).toBe(false);
      },
      { timeout: 10_000 }
    );
    // Every footprint was asked twice: the fast pass first, then the fine one.
    const fastCalls = calls.filter((c) => c === true).length;
    const fineCalls = calls.filter((c) => c !== true).length;
    expect(fastCalls).toBeGreaterThan(0);
    expect(fineCalls).toBe(fastCalls);
    expect(calls.indexOf(true)).toBeLessThan(calls.findIndex((c) => c !== true));
    const c = useAppStore.getState().casualties;
    if (c === null) throw new Error('casualties');
    expect(c.method).toBe('worldpop-api');
    expect(c.source).toBe('api');
    // The clock started with the provisional figure and was not restarted.
    const started = useAppStore.getState().casualtyClockStartedAt;
    expect(started).not.toBeNull();
    // Changing the scenario drops the sweep and the clock with the result.
    useAppStore.getState().selectEventType('earthquake');
    expect(useAppStore.getState().casualtyTimeline).toBeNull();
    expect(useAppStore.getState().casualtyClockStartedAt).toBeNull();
  });

  it('reports unsupported for a landslide, whose only hazard is the tsunami', async () => {
    configurePopulationLookup(() => Promise.resolve(null));
    useAppStore.getState().selectEventType('landslide');
    useAppStore.getState().setLocation({ latitude: 63, longitude: 4 });
    await useAppStore.getState().evaluate();
    expect(useAppStore.getState().casualtyStatus).toBe('unsupported');
  });
});

describe('useAppStore — coastal toll of the wave', () => {
  afterEach(() => {
    configurePopulationLookup(null);
    configurePopulationDensity(null);
  });

  it('adds the wave toll to the blast toll from the run-up cells and their land density', async () => {
    configurePopulationLookup((lat, lon, radiusM) =>
      Promise.resolve({
        exposed: Math.round(5_000 * Math.PI * (radiusM / 1_000) ** 2),
        source: 'test',
        method: 'worldpop-api' as const,
        radiusM,
        bbox: { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon },
      })
    );
    const asked: number[] = [];
    configurePopulationDensity((points) => {
      asked.push(points.length);
      return Promise.resolve(new Float32Array(points.length).fill(3_000));
    });
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    useAppStore.getState().setLocation({ latitude: 40.85, longitude: 14.27 });
    await useAppStore.getState().evaluate();
    await vi.waitFor(() => {
      expect(useAppStore.getState().casualtyStatus).toBe('idle');
      expect(useAppStore.getState().casualties?.provisional).toBe(false);
    });
    const before = useAppStore.getState().casualties;
    if (before === null) throw new Error('casualties');
    // No wave map in a unit test: fake one with a coast of run-up cells.
    const cells = Array.from({ length: 30 }, (_, i) => ({
      latitude: 40.8 + i * 0.01,
      longitude: 14.3,
      runupM: 6,
      slopeRad: Math.atan(1 / 100),
      spacingM: 1_000,
      arrivalS: 1_800 + i * 60,
    }));
    const result = useAppStore.getState().result;
    if (result === null) throw new Error('result');
    useAppStore.setState({
      bathymetricTsunami: {
        field: { arrivalTimes: new Float32Array(0), nLat: 0, nLon: 0, reachableCount: 0 },
        isochrones: [],
        sourceLatitude: 40.85,
        sourceLongitude: 14.27,
        seeds: [],
        globalSeeds: [],
        runup: { cells, maxRunupM: 6 },
      } as unknown as NonNullable<ReturnType<typeof useAppStore.getState>['bathymetricTsunami']>,
    });
    await useAppStore.getState().recomputeTsunamiCasualties();
    const after = useAppStore.getState().casualties;
    if (after === null) throw new Error('casualties');
    expect(asked).toEqual([30]);
    expect(after.tsunamiDeaths ?? 0).toBeGreaterThan(0);
    expect(after.deaths).toBe(before.deaths + (after.tsunamiDeaths ?? 0));
    expect(after.model).toBe('blast');
    expect(after.bands.some((b) => b.hazards[0] === 'tsunami' && b.window !== undefined)).toBe(
      true
    );
    const timeline = useAppStore.getState().casualtyTimeline;
    if (timeline === null) throw new Error('timeline');
    expect(timeline.bands.some((b) => b.hazard === 'tsunami')).toBe(true);
    // The wave lands after the blast: its first band starts at the first arrival.
    const wave = timeline.bands.filter((b) => b.hazard === 'tsunami');
    expect(Math.min(...wave.map((b) => b.startS))).toBeGreaterThanOrEqual(1_800);
  });
});
