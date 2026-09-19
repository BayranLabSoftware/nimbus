/**
 * Rule 328 of `src/physics/validation/wiredStrikeRules.ts`, the half that only
 * a browser can answer: does an earthquake a READER places point where its
 * fault points?
 *
 * The net cannot say — its twelve rows are four presets with published strikes
 * and seven point sources, and a point source has no orientation. So this
 * drives the product itself: three scenarios placed the way a reader places
 * one, through the URL, with no strike given and no preset chosen, and reads
 * back the strike the store derived and the shape the globe drew.
 *
 *   pnpm exec tsx scripts/benchmark/strike-in-the-globe.ts [base URL] [out dir]
 *
 * Needs the dev server. The Browser pane renders this globe as a black canvas,
 * so the screenshots are taken here, headless.
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:5178';
const OUT = process.argv[3] ?? '/tmp';

/** Three places where the structure is not north, and is not in doubt. */
const CASES = [
  {
    id: 'tohoku-offshore',
    note: 'Mw 9.0 off Tōhoku: the Japan Trench runs about 200°',
    params: { t: 'earthquake', mw: 9.0, dep: 29_000, ft: 'reverse', lat: 38.297, lon: 142.373 },
  },
  {
    id: 'chile-offshore',
    note: 'Mw 8.8 off Concepción: the Chile Trench runs about 10 to 20°',
    params: { t: 'earthquake', mw: 8.8, dep: 25_000, ft: 'reverse', lat: -36.0, lon: -73.5 },
  },
  {
    id: 'garlock',
    note: 'Mw 7.8 in the Tehachapi: the Garlock fault runs east-north-east',
    params: { t: 'earthquake', mw: 7.8, dep: 10_000, ft: 'strike-slip', lat: 35.0, lon: -118.9 },
  },
];

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const one of CASES) {
    const page = await browser.newPage({ viewport: { width: 1_280, height: 860 } });
    // The bundler rewrites function names through a `__name` helper that the
    // page does not have; an evaluated closure carrying one throws first.
    await page.addInitScript('globalThis.__name = globalThis.__name || ((f) => f);');
    const params = new URLSearchParams({ v: '1', p: 'CUSTOM', m: 'globe', probe: '1' });
    for (const [key, value] of Object.entries(one.params)) params.set(key, String(value));
    await page.goto(`${BASE}/?${params.toString()}`, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(
        () =>
          ((
            window as unknown as { __nimbusStore?: { getState: () => { result?: unknown } } }
          ).__nimbusStore?.getState().result ?? null) !== null,
        undefined,
        { timeout: 45_000 }
      );
    } catch {
      console.log(`${one.id}: nessun risultato`);
      await page.close();
      continue;
    }
    // The store re-evaluates when the terrain tile and the fault tile land;
    // read after the dust settles rather than during the cascade.
    await page.waitForTimeout(6_000);
    const read = await page.evaluate(() => {
      const store = (
        window as unknown as { __nimbusStore?: { getState: () => Record<string, unknown> } }
      ).__nimbusStore;
      const result = store?.getState().result as
        | {
            data?: {
              inputs?: Record<string, unknown>;
              ruptureLength?: number;
              isExtendedSource?: boolean;
            };
          }
        | null
        | undefined;
      return {
        strike: result?.data?.inputs?.strikeAzimuthDeg ?? null,
        lengthKm:
          result?.data?.ruptureLength === undefined
            ? null
            : Math.round(result.data.ruptureLength / 1000),
        extended: result?.data?.isExtendedSource ?? null,
      };
    });
    console.log(
      `${one.id.padEnd(18)} strike ${read.strike === null ? 'NESSUNO (ignoto)' : `${Number(read.strike).toFixed(1)}°`}  L ${read.lengthKm?.toString() ?? '—'} km  esteso ${String(read.extended)}  — ${one.note}`
    );
    await page.screenshot({ path: join(OUT, `strike-${one.id}.png`) });
    await page.close();
  }
  await browser.close();
}

void main();
