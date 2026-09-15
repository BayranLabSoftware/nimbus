import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NCEI_EARTHQUAKE_ROWS } from '../../src/physics/validation/heldOutByRuleData.js';
import { UNSEEN_EARTHQUAKES } from '../../src/physics/validation/unseenSetData.js';

/**
 * Benchmark track EQ-PAGER: USGS PAGER's loss product for every earthquake
 * of rule 11's set, rule 23's recorded earthquakes and the net's
 * earthquakes that have one — population exposed at each intensity, the
 * empirical fatality estimate and the alert levels. One ComCat request at
 * a time, cached; nothing here runs Nimbus.
 *
 *   pnpm exec tsx scripts/benchmark/pager-bench.ts <work directory>
 */

const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const WORK = resolve(process.argv[2] ?? '');
if (process.argv[2] === undefined) throw new Error('usage: pager-bench.ts <work directory>');
const CACHE = join(WORK, 'cache');
const OUT = join(WORK, 'pager.jsonl');

/** The net's earthquakes, by the ComCat ids their fixtures carry. */
const NET: Readonly<Record<string, string>> = {
  ci3144585: 'Northridge 1994',
  usp000gvtu: "L'Aquila 2009",
  us10006g7d: 'Amatrice 2016',
  us20002926: 'Gorkha (Nepal) 2015',
  official20110311054624120_30: 'Tōhoku 2011',
  usp000asvm: 'Kokoxili (Kunlun) 2001',
  usp000huvq: 'Christchurch 2011',
  us20005iis: 'Kumamoto 2016',
  us1000778i: 'Kaikōura 2016',
  us70006d0m: 'Durrës (Albania) 2019',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function json(url: string): Promise<unknown> {
  const file = join(CACHE, `${createHash('sha256').update(url).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as unknown;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'nimbus-benchmark' } }).catch(
      () => null
    );
    if (res?.ok === true) {
      const text = await res.text();
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, text);
      await sleep(700);
      return JSON.parse(text) as unknown;
    }
    if (res !== null && (res.status === 404 || res.status === 409)) {
      return { gone: res.status };
    }
    if (attempt >= 8) throw new Error(`fetch ${url}: ${String(res?.status ?? 'network')}`);
    await sleep(15_000 * (attempt + 1));
  }
}

interface Product {
  properties: Record<string, string | undefined>;
  contents: Record<string, { url: string } | undefined>;
}

async function main(): Promise<void> {
  mkdirSync(WORK, { recursive: true });
  const done = new Set<string>();
  if (existsSync(OUT)) {
    for (const line of readFileSync(OUT, 'utf8').split('\n')) {
      if (line.trim() !== '') done.add((JSON.parse(line) as { comcat: string }).comcat);
    }
  }
  const ids = [
    ...new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.filter((q) => q.ncei.length > 0).map((q) => q.comcat),
      ...Object.keys(NET),
    ]),
  ];
  let n = done.size;
  for (const comcat of ids) {
    if (done.has(comcat)) continue;
    const detail = (await json(`${COMCAT}?eventid=${comcat}&format=geojson`)) as {
      gone?: number;
      id?: string;
      properties?: { products?: Record<string, Product[] | undefined> };
    };
    const row: Record<string, unknown> = { comcat };
    const pager = detail.properties?.products?.losspager?.[0];
    if (detail.gone !== undefined) row.status = `ComCat ${String(detail.gone)}`;
    else if (pager === undefined) row.status = 'no losspager product';
    else {
      row.status = 'ok';
      row.preferredId = detail.id;
      row.alertlevel = pager.properties.alertlevel ?? null;
      row.maxmmi = pager.properties.maxmmi ?? null;
      row.pagerVersion = pager.properties['pager-version'] ?? pager.properties.version ?? null;
      const exposureUrl = pager.contents['json/exposures.json']?.url;
      const lossUrl = pager.contents['json/losses.json']?.url;
      row.exposures = exposureUrl === undefined ? null : await json(exposureUrl);
      row.losses = lossUrl === undefined ? null : await json(lossUrl);
    }
    appendFileSync(OUT, `${JSON.stringify(row)}\n`);
    n += 1;
    if (n % 25 === 0) console.error(`${n.toString()}/${ids.length.toString()}`);
  }
  console.error(`done ${n.toString()}/${ids.length.toString()}`);
}

await main();
