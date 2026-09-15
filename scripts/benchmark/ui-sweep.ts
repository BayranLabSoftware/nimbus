import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { EARTH_RADIUS, STANDARD_GRAVITY } from '../../src/physics/constants.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
} from '../../src/physics/events/explosion/simulate.js';
import {
  LANDSLIDE_PRESETS,
  simulateLandslide,
} from '../../src/physics/events/landslide/simulate.js';
import { simulateVolcano, VOLCANO_PRESETS } from '../../src/physics/events/volcano/simulate.js';
import { IMPACT_PRESETS, simulateImpact } from '../../src/physics/simulate.js';

/**
 * Track UI of the benchmark protocol: every preset of every hazard run in
 * the application (the dev server, headless Chromium), against the same
 * inputs through the physics in Node.
 *
 *   pnpm exec tsx scripts/benchmark/ui-sweep.ts [base URL] [hazard]
 *
 * For each preset the page is opened on a site (inland, or at sea for the
 * presets whose source is in the water), launched, and read twice:
 *
 * 1. the result object the application's store holds — its inputs are
 *    run through the same simulate function in Node and every number of
 *    the two results compared (the browser's engine against Node's);
 * 2. the numbers the panel prints — each headline value parsed with its
 *    unit and held to the Node value at the precision it is printed with
 *    (a value marked GLOBAL against the Node value capped at half the
 *    Earth's circumference, as the panel caps it).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = process.argv[2] ?? 'http://localhost:5178';
/** One hazard only, merged into the results already written. */
const ONLY = process.argv[3];
const HALF_CIRCUMFERENCE = Math.PI * (EARTH_RADIUS as number);
const LAND = { lat: 40, lon: -100 };
const SEA = { lat: -10, lon: -140 };

type Json = Record<string, unknown>;
type EventType = 'impact' | 'explosion' | 'earthquake' | 'volcano' | 'landslide';

const SIMULATE: Record<EventType, (input: Json) => unknown> = {
  impact: (i) => simulateImpact(i as never),
  explosion: (i) => simulateExplosion(i as never),
  earthquake: (i) => simulateEarthquake(i as never),
  volcano: (i) => simulateVolcano(i as never),
  landslide: (i) => simulateLandslide(i as never),
};

const PRESETS: Record<EventType, Record<string, { input: unknown }>> = {
  impact: IMPACT_PRESETS,
  explosion: EXPLOSION_PRESETS,
  earthquake: EARTHQUAKE_PRESETS,
  volcano: VOLCANO_PRESETS,
  landslide: LANDSLIDE_PRESETS,
};

type Kind = 'length' | 'area' | 'time' | 'acceleration' | 'plain';

/** Panel label → result path and the kind of quantity it prints. */
const DISPLAYED: Record<EventType, readonly [string, string, Kind][]> = {
  impact: [
    ['Final crater', 'crater.finalDiameter', 'length'],
    ['Transient crater', 'crater.transientDiameter', 'length'],
    ['Crater depth', 'crater.depth', 'length'],
    ['Seismic magnitude', 'seismic.magnitude', 'plain'],
    ['5 psi ring (collapse)', 'damage.overpressure5psi', 'length'],
    ['1 psi ring (windows)', 'damage.overpressure1psi', 'length'],
    ['3rd-degree burn radius', 'damage.thirdDegreeBurn', 'length'],
    ['Outer edge (≥ 1 m)', 'ejecta.blanketEdge1m', 'length'],
    ['Outer edge (≥ 1 mm)', 'ejecta.blanketEdge1mm', 'length'],
  ],
  explosion: [
    ['5 psi ring (collapse)', 'blast.overpressure5psiRadius', 'length'],
    ['1 psi ring (windows)', 'blast.overpressure1psiRadius', 'length'],
    ['5 psi ring (HOB-corrected)', 'blast.overpressure5psiRadiusHob', 'length'],
    ['1 psi ring (HOB-corrected)', 'blast.overpressure1psiRadiusHob', 'length'],
    ['3° burn radius', 'thermal.thirdDegreeBurnRadius', 'length'],
    ['LD₅₀ radius (≈ 4.5 Gy)', 'radiation.ld50Radius', 'length'],
    ['LD₁₀₀ radius (≈ 8 Gy)', 'radiation.ld100Radius', 'length'],
    ['ARS threshold (1 Gy)', 'radiation.arsThresholdRadius', 'length'],
    ['Ignition radius (kindling)', 'firestorm.ignitionRadius', 'length'],
  ],
  earthquake: [
    ['Rupture length', 'ruptureLength', 'length'],
    ['MMI VII reach', 'shaking.mmi7Radius', 'length'],
    ['MMI VIII reach', 'shaking.mmi8Radius', 'length'],
    ['MMI IX reach', 'shaking.mmi9Radius', 'length'],
    ['Liquefaction radius', 'shaking.liquefactionRadius', 'length'],
    ['PGA at 20 km', 'shaking.pgaAt20km', 'acceleration'],
    ['PGA at 100 km', 'shaking.pgaAt100km', 'acceleration'],
  ],
  volcano: [
    ['Plume height', 'plumeHeight', 'length'],
    ['Pyroclastic reach', 'pyroclasticRunout', 'length'],
    ['PDC runout (energy-line)', 'pyroclasticRunoutEnergyLine', 'length'],
    ['Ashfall area (≥ 1 mm)', 'ashfallArea1mm', 'area'],
  ],
  landslide: [
    ['Characteristic length (V^⅓)', 'characteristicLength', 'length'],
    ['Tsunami source amplitude', 'tsunami.sourceAmplitude', 'length'],
    ['Tsunami travel to 100 km', 'tsunami.travelTimeTo100km', 'time'],
  ],
};

const UNITS: Record<string, number> = {
  km: 1_000,
  m: 1,
  cm: 0.01,
  'M km²': 1e12,
  'km²': 1e6,
  h: 3_600,
  min: 60,
  s: 1,
  g: STANDARD_GRAVITY,
};

function leaves(value: unknown, path: string, out: Map<string, number>): void {
  if (typeof value === 'number') {
    out.set(path, value);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    if (value.length > 2_000) return;
    value.forEach((v, i) => leaves(v, `${path}[${i.toString()}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(value)) leaves(v, path === '' ? k : `${path}.${k}`, out);
}

/** The first number printed on the line after a label, its unit and its decimals. */
function readDisplayed(
  lines: readonly string[],
  label: string
): { value: number; unit: string; decimals: number; global: boolean; text: string } | null {
  const i = lines.findIndex((l) => l.trim() === label);
  const text = i >= 0 ? lines[i + 1]?.trim() : undefined;
  if (text === undefined) return null;
  const match = /^(?:M|Mw|VEI|MMI)?\s*(-?[\d,]+(?:\.(\d+))?)\s*(M km²|km²|km|cm|min|m|h|s|g)?/.exec(
    text
  );
  if (match === null) return null;
  return {
    value: Number((match[1] ?? '').replace(/,/g, '')),
    unit: match[3] ?? '',
    decimals: match[2]?.length ?? 0,
    global: text.includes('GLOBAL'),
    text,
  };
}

interface PresetReport {
  type: EventType;
  preset: string;
  site: { lat: number; lon: number };
  launched: boolean;
  numbersCompared: number;
  numbersDifferingCount: number;
  /** The first twenty. */
  numbersDiffering: { path: string; browser: number | string; node: number | string }[];
  browserOnly: number;
  displayedChecked: number;
  displayedFailures: { label: string; text: string; node: number }[];
  displayedMissing: string[];
  error?: string;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reports: PresetReport[] = [];
  for (const type of (Object.keys(PRESETS) as EventType[]).filter(
    (t) => ONLY === undefined || t === ONLY
  )) {
    for (const [key, preset] of Object.entries(PRESETS[type])) {
      const input = preset.input as Json;
      const atSea =
        type === 'landslide' ||
        ((input.waterDepth as number | undefined) ?? 0) > 0 ||
        input.subductionInterface === true;
      const site = atSea ? SEA : LAND;
      const report: PresetReport = {
        type,
        preset: key,
        site,
        launched: false,
        numbersCompared: 0,
        numbersDifferingCount: 0,
        numbersDiffering: [],
        browserOnly: 0,
        displayedChecked: 0,
        displayedFailures: [],
        displayedMissing: [],
      };
      reports.push(report);
      try {
        await page.goto(
          `${BASE}/?lng=en&t=${type}&p=${key}&m=globe&lat=${site.lat.toString()}&lon=${site.lon.toString()}`,
          { waitUntil: 'domcontentloaded' }
        );
        const panel = page.getByRole('complementary', { name: 'Simulator controls' });
        await panel.waitFor({ timeout: 60_000 });
        await page.getByRole('button', { name: 'Launch simulation' }).click({ timeout: 60_000 });
        const storeUrl = await page.evaluate(
          () =>
            performance
              .getEntriesByType('resource')
              .map((e) => e.name)
              .find((n) => n.includes('/src/store/useAppStore.ts')) ?? null
        );
        if (storeUrl === null) throw new Error('store module not found');
        let browserResult: { type: string; data: Json } | null = null;
        for (let tries = 0; tries < 60 && browserResult === null; tries++) {
          browserResult = await page.evaluate(async (url) => {
            const store = (await import(url)) as {
              useAppStore: { getState: () => { result: { type: string; data: unknown } | null } };
            };
            const r = store.useAppStore.getState().result;
            if (r === null) return null;
            // Numbers only, with the ones JSON cannot carry spelt out.
            return JSON.parse(
              JSON.stringify(r, (_k, v: unknown) =>
                typeof v === 'number' && !Number.isFinite(v) ? String(v) : v
              )
            ) as { type: string; data: Json };
          }, storeUrl);
          if (browserResult === null) await page.waitForTimeout(500);
        }
        if (browserResult === null) throw new Error('no result after launch');
        report.launched = true;
        await page.waitForTimeout(1_500);
        const inputs = browserResult.data.inputs as Json;
        const node = new Map<string, number>();
        leaves(SIMULATE[type](inputs), '', node);
        const fromBrowser = new Map<string, number | string>();
        const walk = (value: unknown, path: string): void => {
          if (
            typeof value === 'number' ||
            value === 'Infinity' ||
            value === '-Infinity' ||
            value === 'NaN'
          ) {
            fromBrowser.set(path, value);
            return;
          }
          if (value === null || typeof value !== 'object') return;
          if (Array.isArray(value)) {
            if (value.length > 2_000) return;
            value.forEach((v, i) => walk(v, `${path}[${i.toString()}]`));
            return;
          }
          for (const [k, v] of Object.entries(value)) walk(v, path === '' ? k : `${path}.${k}`);
        };
        walk(browserResult.data, '');
        for (const [path, b] of fromBrowser) {
          if (path.startsWith('inputs.')) continue;
          const n = node.get(path);
          if (n === undefined) {
            report.browserOnly += 1;
            continue;
          }
          report.numbersCompared += 1;
          const bn = typeof b === 'number' ? b : Number(b);
          const same =
            Object.is(bn, n) ||
            (Number.isFinite(bn) &&
              Number.isFinite(n) &&
              Math.abs(bn - n) <= 1e-12 * Math.max(Math.abs(bn), Math.abs(n)));
          if (!same) {
            report.numbersDifferingCount += 1;
            if (report.numbersDiffering.length < 20)
              report.numbersDiffering.push({ path, browser: b, node: n });
          }
        }
        const lines = (await panel.innerText()).split('\n');
        for (const [label, path, kind] of DISPLAYED[type]) {
          const shown = readDisplayed(lines, label);
          const n = node.get(path);
          if (shown === null || n === undefined) {
            report.displayedMissing.push(label);
            continue;
          }
          report.displayedChecked += 1;
          const scale = kind === 'plain' ? 1 : (UNITS[shown.unit] ?? NaN);
          const capped = kind === 'length' && shown.global ? Math.min(n, HALF_CIRCUMFERENCE) : n;
          const expected = capped / scale;
          const tolerance = 0.5 * 10 ** -shown.decimals + 1e-9 * Math.abs(expected);
          if (!(Math.abs(expected - shown.value) <= tolerance))
            report.displayedFailures.push({ label, text: shown.text, node: n });
        }
      } catch (e) {
        report.error = String(e).slice(0, 300);
      }
      console.log(
        `${type} ${key}: ${report.launched ? 'launched' : 'NOT LAUNCHED'}; numbers ${report.numbersCompared.toString()} compared, ${report.numbersDifferingCount.toString()} differ; panel ${report.displayedChecked.toString()} checked, ${report.displayedFailures.length.toString()} off${report.error === undefined ? '' : `; error ${report.error}`}`
      );
    }
  }
  await browser.close();
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  const file = join(ROOT, 'benchmark', 'results', 'ui.json');
  const kept =
    ONLY === undefined || !existsSync(file)
      ? []
      : (JSON.parse(readFileSync(file, 'utf8')) as { presets: PresetReport[] }).presets.filter(
          (p) => p.type !== ONLY
        );
  const order = Object.keys(PRESETS);
  const presets = [...kept, ...reports].sort(
    (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
  );
  writeFileSync(file, `${JSON.stringify({ track: 'UI', base: BASE, presets }, null, 1)}\n`);
}

await main();
