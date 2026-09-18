import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { SWEEP_SCENARIOS, type Scenario } from './sweepScenarios.js';

/**
 * Thirty scenarios read the way a visitor reads them: the application's own
 * report page, opened on a link a visitor could paste, with its text taken off
 * the page.
 *
 *   pnpm exec tsx scripts/benchmark/report-sweep.ts [base URL] [out dir]
 *
 * Andrea ran four scenarios by hand on 17 September 2026 and found four
 * defects that 2 244 tests had not — because the tests read numbers and a
 * report is read by a person. This does the same at scale, and deliberately in
 * the corners of the input space: an airburst over the sea, a burst a metre
 * under water beside a shore, a slide into a narrow basin, a submarine
 * earthquake off a coast, an eruption with a cleared zone, a body a metre
 * across and one ten kilometres across.
 *
 * Nothing is asserted here. The output is the text of each report, for reading.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = process.argv[2] ?? 'http://localhost:5178';
const OUT = process.argv[3] ?? join(ROOT, 'benchmark', 'results', 'report-sweep');

function link(s: Scenario): string {
  const params = new URLSearchParams({ v: '1', p: 'CUSTOM', m: 'report' });
  for (const [key, value] of Object.entries(s.params)) {
    params.set(key === 'lat' || key === 'lon' ? key : key, String(value));
  }
  return `${BASE}/?${params.toString()}`;
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1_280, height: 2_400 } });
  const index: { id: string; family: string; note: string; url: string; chars: number }[] = [];
  for (const scenario of SWEEP_SCENARIOS) {
    const url = link(scenario);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // The report renders once the scenario has run; the panel's headline is
    // the last thing to land.
    try {
      await page.waitForSelector('main', { timeout: 30_000 });
      await page.waitForTimeout(6_000);
    } catch {
      /* recorded as a short page below */
    }
    const text = await page.evaluate(() => document.body.innerText);
    writeFileSync(join(OUT, `${scenario.id}.txt`), `${url}\n\n${text}\n`);
    index.push({
      id: scenario.id,
      family: scenario.family,
      note: scenario.note,
      url,
      chars: text.length,
    });
    console.log(`${scenario.id.padEnd(26)} ${String(text.length).padStart(6)} chars  ${url}`);
  }
  writeFileSync(join(OUT, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
  await browser.close();
  console.log(`\nwrote ${String(index.length)} reports to ${OUT}`);
}

await main();
