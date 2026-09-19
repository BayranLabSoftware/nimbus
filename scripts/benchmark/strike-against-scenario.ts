/**
 * Rule 308 of `src/physics/validation/strikeAgainstShakemapRules.ts`: what due
 * north cost, measured by ShakeMap, and whether our footprint has the shape of
 * its footprint on the same source.
 *
 * Two steps, because the middle one is a program that takes minutes:
 *
 *   pnpm exec tsx scripts/benchmark/strike-against-scenario.ts --cases <cases.json>
 *   <venv>/bin/python scripts/benchmark/strike-shakemap-scenario.py \
 *       --cases <cases.json> --work <dir> --config <install/config> --out <grids.json>
 *   pnpm exec tsx scripts/benchmark/strike-against-scenario.ts --compare <cases.json> <grids.json>
 *
 * Rule 307 — the comparison against the PUBLISHED map of each preset — is not
 * this, and is not passed by this. It stays pending.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRIKE_PRESETS } from '../../src/physics/validation/faultStrikeRules.js';
import {
  FOOTPRINT_MMI,
  MINIMUM_ASPECT_RATIO,
  footprintOrientation,
  intersectionOverUnion,
  type FootprintCell,
} from '../../src/physics/validation/strikeAgainstShakemapRules.js';
import { shippedSlabField } from '../../src/physics/validation/shippedSlab2.js';
import { shippedCoarseView } from '../../src/physics/validation/shippedPopulation.js';
import {
  decodeFault,
  faultTileKey,
  type FaultTileIndex,
  type PackedFault,
} from '../../src/physics/events/earthquake/faultLookup.js';
import { chooseStrike } from '../../src/physics/events/earthquake/strikeSource.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';

const EARTH_RADIUS_M = 6_371_000;
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FAULT_DIR = join(ROOT, 'public', 'data', 'faults');

/** Rule 308(c): the dip given to a rupture, from its source type. */
const INTERFACE_DIP_DEG = 15;
const CRUSTAL_DIP_DEG = 90;
/** Rule 308(c): the ground-motion model set, named per event because `select`
 *  needs STREC and STREC is not installed. */
const INTERFACE_GMPE = 'subduction_interface_nshmp2014';

/** When each preset happened, for the event.xml ShakeMap wants. */
const WHEN: Record<string, string> = {
  TOHOKU_2011: '2011-03-11T05:46:24Z',
  KUNLUN_2001: '2001-11-14T09:26:10Z',
  SUMATRA_2004: '2004-12-26T00:58:53Z',
  VALDIVIA_1960: '1960-05-22T19:11:20Z',
  ALASKA_1964: '1964-03-28T03:36:16Z',
  NEPAL_2015: '2015-04-25T06:11:25Z',
};

interface Case {
  id: string;
  preset: string;
  variant: 'strike' | 'north';
  lat: number;
  lon: number;
  magnitude: number;
  depthKm: number;
  time: string;
  place: string;
  mech: string;
  strikeDeg: number;
  dipDeg: number;
  lengthKm: number;
  widthKm: number;
  gmpe?: string;
  foundStrikeDeg: number | null;
  strikeSource: string;
  publishedStrikeDeg: number;
}

function buildCases(): Case[] {
  const faultIndex = JSON.parse(
    readFileSync(join(FAULT_DIR, 'index.json'), 'utf8')
  ) as FaultTileIndex;
  const field = shippedSlabField();
  if (field === null) throw new Error('no slab tiles: run scripts/build-slab2.py first');
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0]; name?: string }
  >;

  const cases: Case[] = [];
  for (const p of STRIKE_PRESETS) {
    const preset = presets[p.preset];
    if (preset === undefined) throw new Error(`no preset ${p.preset}`);
    const sim = simulateEarthquake(preset.input);
    const lengthKm = (sim.ruptureLength as number) / 1000;
    const widthKm = (sim.ruptureWidth as number) / 1000;
    const depthKm = ((preset.input.depth as number | undefined) ?? 10_000) / 1000;

    const key = faultTileKey(p.latitude, p.longitude, faultIndex.tileDeg);
    const packed = (
      JSON.parse(readFileSync(join(FAULT_DIR, `${key}.json`), 'utf8')) as {
        faults: PackedFault[];
      }
    ).faults;
    const faults = packed.map((f) => decodeFault(f, faultIndex)).filter((f) => f !== null);
    const answer = chooseStrike(
      {
        latitude: p.latitude,
        longitude: p.longitude,
        hypocentreDepthM: depthKm * 1000,
        ruptureLengthM: lengthKm * 1000,
      },
      field,
      faults
    );
    const isInterface = answer.source.startsWith('interface');
    for (const variant of ['strike', 'north'] as const) {
      cases.push({
        id: `${p.preset.toLowerCase()}_${variant}`,
        preset: p.preset,
        variant,
        lat: p.latitude,
        lon: p.longitude,
        magnitude: preset.input.magnitude,
        depthKm,
        time: WHEN[p.preset] ?? '2020-01-01T00:00:00Z',
        place: p.name,
        mech: isInterface ? 'RS' : 'SS',
        strikeDeg: variant === 'north' ? 0 : (answer.strikeDeg ?? 0),
        dipDeg: isInterface ? INTERFACE_DIP_DEG : CRUSTAL_DIP_DEG,
        lengthKm,
        widthKm,
        ...(isInterface ? { gmpe: INTERFACE_GMPE } : {}),
        foundStrikeDeg: answer.strikeDeg,
        strikeSource: answer.source,
        publishedStrikeDeg: p.publishedStrikeDeg,
      });
    }
  }
  return cases;
}

interface Grid {
  id: string;
  ok: boolean;
  nx: number;
  ny: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  dx: number;
  dy: number;
  maxMmi: number;
  mmi10: string;
  modules?: Record<string, string>;
  stderr?: string;
}

/** ShakeMap chooses its own grid per run — two runs of one event came back
 *  with origins 0.07° apart and cell sizes differing in the fourth decimal —
 *  so two masks read off their native cells never share a cell and their
 *  agreement comes out near zero whatever the shapes are. Both are sampled
 *  onto one fixed lattice instead, finer than either grid. */
const LATTICE_DEG = 0.02;

/** The footprint of a grid: the lattice nodes at or above the footprint
 *  intensity, with their areas, and their keys on the common lattice. */
function footprint(grid: Grid): { cells: FootprintCell[]; keys: Set<string> } {
  const bytes = Buffer.from(grid.mmi10, 'base64');
  const threshold = FOOTPRINT_MMI * 10;
  const cells: FootprintCell[] = [];
  const keys = new Set<string>();
  const i0 = Math.ceil(grid.ymin / LATTICE_DEG);
  const i1 = Math.floor(grid.ymax / LATTICE_DEG);
  const j0 = Math.ceil(grid.xmin / LATTICE_DEG);
  const j1 = Math.floor(grid.xmax / LATTICE_DEG);
  for (let i = i0; i <= i1; i += 1) {
    const latitude = i * LATTICE_DEG;
    // The container's first row is the north edge.
    const row = Math.round((grid.ymax - latitude) / grid.dy);
    if (row < 0 || row >= grid.ny) continue;
    const latM = LATTICE_DEG * (Math.PI / 180) * EARTH_RADIUS_M;
    const areaM2 =
      latM * LATTICE_DEG * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180);
    for (let j = j0; j <= j1; j += 1) {
      const longitude = j * LATTICE_DEG;
      const col = Math.round((longitude - grid.xmin) / grid.dx);
      if (col < 0 || col >= grid.nx) continue;
      if ((bytes[row * grid.nx + col] ?? 0) < threshold) continue;
      cells.push({ latitude, longitude, areaM2 });
      keys.add(`${i.toString()}:${j.toString()}`);
    }
  }
  return { cells, keys };
}

/** How many people live under a footprint, on the 0.125° planet the project
 *  ships — the coarse view, because a footprint this size spans tiles. */
function populationUnder(cells: readonly FootprintCell[]): number {
  const view = shippedCoarseView();
  const seen = new Set<number>();
  let people = 0;
  for (const cell of cells) {
    const row = Math.floor((view.maxLat - cell.latitude) / view.cellDeg);
    const col =
      ((Math.floor((cell.longitude - view.minLon) / view.cellDeg) % view.nLon) + view.nLon) %
      view.nLon;
    if (row < 0 || row >= view.nLat) continue;
    const at = row * view.nLon + col;
    if (seen.has(at)) continue;
    seen.add(at);
    people += view.cellAt(row, col).people;
  }
  return people;
}

const mode = process.argv[2];
if (mode === '--cases') {
  const out = process.argv[3];
  if (out === undefined) throw new Error('usage: --cases <out.json>');
  const cases = buildCases();
  writeFileSync(out, `${JSON.stringify(cases, null, 1)}\n`);
  console.log(`scritti ${cases.length.toString()} casi in ${out}`);
  for (const c of cases) {
    console.log(
      `  ${c.id.padEnd(24)} Mw ${c.magnitude.toFixed(1)}  L ${c.lengthKm.toFixed(0)} km  W ${c.widthKm.toFixed(0)} km  strike ${c.strikeDeg.toFixed(1)}°  dip ${c.dipDeg.toString()}°  ${c.gmpe ?? 'active_crustal_nshmp2014'}`
    );
  }
} else if (mode === '--compare') {
  const casesPath = process.argv[3];
  const gridsPath = process.argv[4];
  if (casesPath === undefined || gridsPath === undefined) {
    throw new Error('usage: --compare <cases.json> <grids.json>');
  }
  const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Case[];
  const grids = (JSON.parse(readFileSync(gridsPath, 'utf8')) as { rows: Grid[] }).rows;
  const byId = new Map(grids.map((g) => [g.id, g]));

  console.log(
    '| preset | strike trovato | asse(strike) | asse(nord) | allung. | IoU dei due run | area VII strike | area VII nord | gente strike | gente nord |'
  );
  console.log('| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |');
  for (const p of STRIKE_PRESETS) {
    const withStrike = byId.get(`${p.preset.toLowerCase()}_strike`);
    const withNorth = byId.get(`${p.preset.toLowerCase()}_north`);
    const spec = cases.find((c) => c.preset === p.preset && c.variant === 'strike');
    if (withStrike === undefined || withNorth === undefined || spec === undefined) {
      console.log(`| ${p.name} | — | non eseguito | | | | | | | |`);
      continue;
    }
    if (!withStrike.ok || !withNorth.ok) {
      console.log(
        `| ${p.name} | — | FALLITO: ${(withStrike.stderr ?? withNorth.stderr ?? '').slice(0, 120)} | | | | | | | |`
      );
      continue;
    }
    const a = footprint(withStrike);
    const b = footprint(withNorth);
    const oa = footprintOrientation(a.cells);
    const ob = footprintOrientation(b.cells);
    const iou = intersectionOverUnion(a.keys, b.keys);
    const areaA = a.cells.reduce((s, c) => s + c.areaM2, 0) / 1e6;
    const areaB = b.cells.reduce((s, c) => s + c.areaM2, 0) / 1e6;
    const peopleA = populationUnder(a.cells);
    const peopleB = populationUnder(b.cells);
    console.log(
      `| ${p.name} | ${spec.foundStrikeDeg?.toFixed(1) ?? '—'}° | ${oa?.axisDeg.toFixed(1) ?? '—'}° | ${ob?.axisDeg.toFixed(1) ?? '—'}° | ${oa?.aspectRatio.toFixed(2) ?? '—'} | **${iou.toFixed(3)}** | ${areaA.toFixed(0)} km² | ${areaB.toFixed(0)} km² | ${(peopleA / 1e6).toFixed(2)} M | ${(peopleB / 1e6).toFixed(2)} M |`
    );
  }
  console.log('');
  // Rule 308(c): the configuration, with the result.
  const first = grids.find((g) => g.ok);
  if (first?.modules !== undefined) {
    console.log(
      `moduli: ${Object.entries(first.modules)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`
    );
  }
  console.log(
    `asse: principale della maschera MMI ≥ ${FOOTPRINT_MMI.toString()}, allungamento minimo per contare ${MINIMUM_ASPECT_RATIO.toString()}`
  );
} else {
  console.error('usage: --cases <out.json> | --compare <cases.json> <grids.json>');
  process.exit(2);
}
