import { chromium, type Browser } from '@playwright/test';

/**
 * Rule 801 of validation/craterWaterDepthRules.ts: the water a land impact's
 * wave rises in, read off the running app so the terrain is the real one.
 *
 *   pnpm exec tsx scripts/benchmark/crater-water.ts [base URL]
 *
 * Nothing here computes the model: it drives the product through the `probe`
 * hook and reads the store, as shore-distance.ts does. Served by Vite's dev
 * server it also reads the lattice itself (`craterWaterDepth`), which a
 * production build does not expose; the table then prints a dash there.
 */

const BASE = process.argv[2] ?? 'http://localhost:5178';

/** Rule 801's rows: Chicxulub on three coasts, and rule 250's 1 km stone. */
const CASES: readonly { name: string; lat: number; lon: number; query: Record<string, string> }[] =
  [
    { name: 'Chicxulub · New Orleans', lat: 29.9511, lon: -90.0715, query: { p: 'CHICXULUB' } },
    { name: 'Chicxulub · Tampa', lat: 27.9506, lon: -82.4572, query: { p: 'CHICXULUB' } },
    { name: 'Chicxulub · Lisbon', lat: 38.7223, lon: -9.1393, query: { p: 'CHICXULUB' } },
    {
      name: '1 km stone · Lisbon',
      lat: 38.7223,
      lon: -9.1393,
      query: {
        p: 'CUSTOM',
        d: '1000',
        s: '7500',
        a: '45',
        rho: '3000',
        trho: '2700',
        g: '9.80665',
      },
    },
  ];

interface Reading {
  shoreDistance?: number;
  waterDepth?: number;
  lattice?: { points: number; onTile: number; water: number; meanDepthM: number | null };
  segment?: number;
  source?: number;
  amplitudeAt1000km?: number;
  drowned?: number;
}

async function read(browser: Browser, c: (typeof CASES)[number]): Promise<Reading> {
  const params = new URLSearchParams({
    v: '1',
    t: 'impact',
    m: 'globe',
    probe: '1',
    lat: String(c.lat),
    lon: String(c.lon),
    ...c.query,
  });
  const page = await browser.newPage({ viewport: { width: 1_280, height: 800 } });
  await page.goto(`${BASE}/?${params.toString()}`, { waitUntil: 'load' });
  // The terrain tile lands after the first run and the store runs again on
  // it; the shore is only meaningful once it has.
  await page.waitForTimeout(20_000);
  const out = (await page.evaluate(async () => {
    interface Store {
      getState: () => Record<string, unknown>;
    }
    const store = (window as unknown as { __nimbusStore?: Store }).__nimbusStore;
    const state = store?.getState() ?? {};
    const data = (state.result as { data?: Record<string, unknown> } | undefined)?.data;
    const inputs = data?.inputs as Record<string, number> | undefined;
    const wave = data?.tsunami as Record<string, unknown> | undefined;
    const coupling = wave?.seaCoupling as Record<string, number> | undefined;
    const toll = (state.casualties ?? {}) as Record<string, number>;
    let lattice: Reading['lattice'];
    try {
      const path = '/src/store/useAppStore.ts';
      const mod = (await import(/* @vite-ignore */ path)) as {
        craterWaterDepth: (...a: unknown[]) => { reading: Reading['lattice'] } | null;
      };
      lattice =
        mod.craterWaterDepth(data, state.elevationGrid, state.globalBathymetricGrid, state.location)
          ?.reading ?? undefined;
    } catch {
      lattice = undefined;
    }
    return {
      shoreDistance: inputs?.shoreDistance,
      waterDepth: inputs?.waterDepth,
      lattice,
      segment: coupling?.fraction,
      source: wave?.rimWaveSourceAmplitude as number | undefined,
      amplitudeAt1000km: wave?.amplitudeAt1000kmWunnemann as number | undefined,
      drowned: toll.tsunamiDeaths,
    };
  })) as Reading;
  await page.close();
  return out;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const km = (x: number | undefined): string =>
    x === undefined ? '—' : `${(x / 1_000).toFixed(2)} km`;
  const n = (x: number | undefined, dp: number): string => (x === undefined ? '—' : x.toFixed(dp));
  console.log(
    '| case | shore | depth used | lattice pts/tile/wet | lattice mean | segment | source | A @ 1000 km | drowned |'
  );
  console.log('| --- | --: | --: | --: | --: | --: | --: | --: | --: |');
  for (const c of CASES) {
    const r = await read(browser, c);
    const l = r.lattice;
    console.log(
      `| ${c.name} | ${km(r.shoreDistance)} | ${n(r.waterDepth, 2)} m | ${
        l === undefined
          ? '—'
          : `${l.points.toString()}/${l.onTile.toString()}/${l.water.toString()}`
      } | ${l?.meanDepthM === undefined ? '—' : `${n(l.meanDepthM ?? undefined, 2)} m`} | ${
        r.segment === undefined ? '—' : `${(100 * r.segment).toFixed(1)} %`
      } | ${n(r.source, 3)} m | ${n(r.amplitudeAt1000km, 3)} m | ${n(r.drowned, 0)} |`
    );
  }
  await browser.close();
}

void main();
