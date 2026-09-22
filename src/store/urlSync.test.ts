import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAppStore, useAppStore } from './useAppStore.js';
import { hydrateStoreFromUrl, maybeAutoEvaluate, writeStoreToHistory } from './urlSync.js';
import { fetchTerrainGridForLocation } from '../scene/terrainSampling.js';
import type * as TerrainSampling from '../scene/terrainSampling.js';

// La tessera di terreno arriva dalla rete: qui si intercetta per
// osservare SE viene chiesta, che è il punto del test di regressione.
vi.mock('../scene/terrainSampling.js', async (originale) => {
  const vero = await originale<typeof TerrainSampling>();
  return {
    ...vero,
    fetchTerrainGridForLocation: vi.fn(() => Promise.reject(new Error('rete assente'))),
  };
});

/** Minimal window-like stub that satisfies writeStoreToHistory — the
 *  function only uses `location.{pathname,search,hash,href}` and
 *  `history.replaceState`. */
function createFakeWindow(initialUrl: string): {
  win: Window;
  pushed: string[];
} {
  const url = new URL(initialUrl);
  const pushed: string[] = [];
  const history = {
    replaceState: (_state: unknown, _title: string, next: string): void => {
      pushed.push(next);
      const resolved = new URL(next, url.origin);
      url.pathname = resolved.pathname;
      url.search = resolved.search;
      url.hash = resolved.hash;
    },
  };
  const location = {
    get href(): string {
      return url.toString();
    },
    get pathname(): string {
      return url.pathname;
    },
    get search(): string {
      return url.search;
    },
    get hash(): string {
      return url.hash;
    },
  };
  const win = { location, history } as unknown as Window;
  return { win, pushed };
}

beforeEach(() => {
  resetAppStore();
});

describe('hydrateStoreFromUrl', () => {
  it('applies an impact preset from the search fragment', () => {
    hydrateStoreFromUrl(
      'http://localhost/?t=impact&p=TUNGUSKA&lat=60.886&lon=101.894&m=globe',
      useAppStore.getState()
    );
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('TUNGUSKA');
    expect(s.location).toEqual({ latitude: 60.886, longitude: 101.894 });
    expect(s.mode).toBe('globe');
  });

  it('opens on the impacts when the link asks for a module the site has hidden', () => {
    // Andrea, 22 September 2026: the site is for cosmic impacts alone
    // (visibleEvents.ts). An old shared link keeps its place and its view.
    hydrateStoreFromUrl(
      'http://localhost/?t=earthquake&p=TOHOKU_2011&lat=38.1&lon=142.4&m=globe',
      useAppStore.getState()
    );
    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.location).toEqual({ latitude: 38.1, longitude: 142.4 });
    expect(s.mode).toBe('globe');
  });

  it('is a no-op for a URL without recognised keys', () => {
    const before = useAppStore.getState();
    hydrateStoreFromUrl('http://localhost/?unrelated=1', useAppStore.getState());
    const after = useAppStore.getState();
    expect(after.eventType).toBe(before.eventType);
    expect(after.impact.preset).toBe(before.impact.preset);
  });
});

describe('maybeAutoEvaluate', () => {
  it('runs evaluate when location and non-landing mode are set', async () => {
    useAppStore.getState().setLocation({ latitude: 38.1, longitude: 142.4 });
    useAppStore.getState().setMode('globe');
    await maybeAutoEvaluate(useAppStore.getState());
    expect(useAppStore.getState().result).not.toBeNull();
  });

  // Regressione: un report aperto dal proprio indirizzo usciva senza
  // tsunami, perché la tessera di terreno la scaricava il componente
  // del globo — che in modalità report non viene mai montato — e la
  // simulazione partiva senza. Un link condiviso deve riprodurre la
  // stessa scienza di chi passa dal globo.
  it('chiede la tessera di terreno prima di simulare, anche fuori dal globo', async () => {
    const finto = vi.mocked(fetchTerrainGridForLocation);
    finto.mockClear();
    useAppStore.getState().setLocation({ latitude: 25.4102, longitude: -81.0466 });
    useAppStore.getState().setMode('report');
    await maybeAutoEvaluate(useAppStore.getState());
    // The span is undefined for anything but an oriented rupture; the
    // point of this row is that the tile is asked for before the sim.
    expect(finto).toHaveBeenCalledWith(25.4102, -81.0466, undefined);
    // E la simulazione gira comunque quando la rete non risponde.
    expect(useAppStore.getState().result).not.toBeNull();
  });

  it('is a no-op when location is missing', async () => {
    useAppStore.getState().setMode('globe');
    await maybeAutoEvaluate(useAppStore.getState());
    expect(useAppStore.getState().result).toBeNull();
  });

  it('is a no-op in landing mode even with a location', async () => {
    useAppStore.getState().setLocation({ latitude: 0, longitude: 0 });
    await maybeAutoEvaluate(useAppStore.getState());
    expect(useAppStore.getState().result).toBeNull();
  });
});

describe('writeStoreToHistory', () => {
  it('writes the schema keys and preserves unrelated query params', () => {
    const { win, pushed } = createFakeWindow('http://app.test/?lng=en&debug=1');
    useAppStore.getState().selectPreset('TUNGUSKA');
    useAppStore.getState().setLocation({ latitude: 60.9, longitude: 101.9 });
    useAppStore.getState().setMode('globe');

    writeStoreToHistory(useAppStore.getState(), win);

    expect(pushed).toHaveLength(1);
    const writtenUrl = new URL(pushed[0]!, 'http://app.test/');
    expect(writtenUrl.searchParams.get('t')).toBe('impact');
    expect(writtenUrl.searchParams.get('p')).toBe('TUNGUSKA');
    expect(writtenUrl.searchParams.get('m')).toBe('globe');
    // Preserved params from the initial URL.
    expect(writtenUrl.searchParams.get('lng')).toBe('en');
    expect(writtenUrl.searchParams.get('debug')).toBe('1');
  });

  it('is a no-op when the resulting URL is byte-identical', () => {
    const { win, pushed } = createFakeWindow('http://app.test/?v=1&t=impact&p=CHICXULUB');
    // Store already defaults to impact + CHICXULUB, landing mode.
    // Writing should produce the same URL → no history entry.
    writeStoreToHistory(useAppStore.getState(), win);
    expect(pushed).toHaveLength(0);
  });

  it('round-trips through a shared-link flow', async () => {
    // 1. User A builds a scenario and publishes the URL.
    useAppStore.getState().selectPreset('METEOR_CRATER');
    useAppStore.getState().setLocation({ latitude: 35.0275, longitude: -111.0225 });
    useAppStore.getState().setMode('globe');
    const { win, pushed } = createFakeWindow('http://app.test/');
    writeStoreToHistory(useAppStore.getState(), win);
    const sharedUrl = `http://app.test${pushed[0] ?? ''}`;

    // 2. User B lands on the URL in a fresh session.
    resetAppStore();
    hydrateStoreFromUrl(sharedUrl, useAppStore.getState());
    await maybeAutoEvaluate(useAppStore.getState());

    const s = useAppStore.getState();
    expect(s.eventType).toBe('impact');
    expect(s.impact.preset).toBe('METEOR_CRATER');
    expect(s.location).toEqual({ latitude: 35.0275, longitude: -111.0225 });
    expect(s.mode).toBe('globe');
    expect(s.result?.type).toBe('impact');
  });
});
