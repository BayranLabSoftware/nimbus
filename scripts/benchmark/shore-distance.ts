import { chromium, type Browser } from '@playwright/test';
import { SHORE_TEST_POINTS } from '../../src/physics/validation/shoreDistanceRules.js';

/**
 * Rule 243 of src/physics/validation/shoreDistanceRules.ts: the four points,
 * read off the running app so the terrain is the real one.
 *
 *   pnpm exec tsx scripts/benchmark/shore-distance.ts [base URL]
 *
 * A distance from a place to the sea is a fact, so this round can be scored
 * against the world rather than against itself. The bounds are in the rules,
 * fixed before the candidate was written; this prints what the model answers
 * and whether each lands inside its own.
 *
 * Nothing here computes anything: it drives the product through the `probe`
 * hook and reads the store, exactly as scripts/benchmark/globe-audit.ts does.
 */

const BASE = process.argv[2] ?? 'http://localhost:5178';

interface Reading {
  waterDepth?: number;
  shoreDistance?: number;
  mechanism?: string;
  fraction?: number;
  cavityRadius?: number;
  fireIgnition?: number;
}

async function read(browser: Browser, lat: number, lon: number): Promise<Reading> {
  const params = new URLSearchParams({
    v: '1',
    t: 'impact',
    p: 'CUSTOM',
    m: 'globe',
    probe: '1',
    // The body of Andrea's own run of 19 September 2026, which found this.
    d: '1000',
    s: '7500',
    a: '45',
    rho: '3000',
    trho: '2700',
    g: '9.80665',
    lat: String(lat),
    lon: String(lon),
  });
  const page = await browser.newPage({ viewport: { width: 1_280, height: 800 } });
  await page.goto(`${BASE}/?${params.toString()}`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(
      () => (window as unknown as { __nimbusStore?: unknown }).__nimbusStore !== undefined,
      undefined,
      { timeout: 60_000 }
    )
    .catch(() => undefined);
  // The terrain tile lands after the first run and the store runs again on it;
  // the shore distance is only meaningful once it has.
  await page.waitForTimeout(20_000);
  const out = (await page.evaluate(() => {
    const w = window as unknown as { __nimbusStore?: { getState: () => Record<string, unknown> } };
    const d = (w.__nimbusStore?.getState().result as { data?: Record<string, unknown> } | undefined)
      ?.data;
    const inputs = d?.inputs as Record<string, number> | undefined;
    const ts = d?.tsunami as Record<string, unknown> | undefined;
    const sc = ts?.seaCoupling as Record<string, number | string> | undefined;
    return {
      waterDepth: inputs?.waterDepth,
      shoreDistance: inputs?.shoreDistance,
      mechanism: sc?.mechanism as string | undefined,
      fraction: sc?.fraction as number | undefined,
      cavityRadius: ts?.cavityRadius as number | undefined,
      fireIgnition: (d?.firestorm as Record<string, number> | undefined)?.ignitionRadius,
    };
  })) as Reading;
  await page.close();
  return out;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const km = (x: number | undefined): string =>
    x === undefined ? '—' : `${(x / 1_000).toFixed(2)} km`;
  let allInside = true;
  console.log('| point | bound | shore | depth | coupling | cavity | fire | verdict |');
  console.log('| --- | --- | --: | --: | --- | --: | --: | --- |');
  for (const p of SHORE_TEST_POINTS) {
    const r = await read(browser, p.latitude, p.longitude);
    const shore = r.shoreDistance;
    const bound = p.maxM === null ? `> ${km(p.minM)}` : `${km(p.minM)} – ${km(p.maxM)}`;
    const inside =
      shore === undefined
        ? p.maxM === null
        : shore >= p.minM && (p.maxM === null || shore <= p.maxM);
    if (!inside) allInside = false;
    console.log(
      `| ${p.name} | ${bound} | ${km(shore)} | ${km(r.waterDepth)} | ${r.mechanism ?? '—'}${r.fraction === undefined ? '' : ` ${(100 * r.fraction).toFixed(0)} %`} | ${km(r.cavityRadius)} | ${km(r.fireIgnition)} | ${inside ? 'inside' : 'OUTSIDE'} |`
    );
  }
  console.log(`\nrule 243: ${allInside ? 'MET' : 'NOT met'}`);
  await browser.close();
}

void main();
