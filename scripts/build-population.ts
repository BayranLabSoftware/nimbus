import { deflateSync } from 'node:zlib';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';

/**
 * Build the population rasters the casualty model reads when the
 * WorldPop API cannot answer — rings above its 100 000 km² cap, and
 * the provisional figure shown while it works.
 *
 * Input: a global population-count GeoTIFF in EPSG:4326 — the JRC
 * GHS-POP 2020 30 arc-second grid (GHSL R2023A, CC-BY 4.0), or the
 * WorldPop 2020 1 km aggregate (Tatem 2017), whose per-cell counts have
 * the same semantics. Sea and no-data cells are the GeoTIFF's nodata.
 *
 * Two outputs, both 8-bit RGB PNGs a browser decodes through a 2D
 * canvas (no raster library shipped; RGB rather than grey + alpha
 * because a canvas premultiplies alpha and would corrupt the data):
 *
 *   R  population of the cell on a log scale,
 *        v = round(255 · ln(1 + P) / ln(1 + P_MAX)),  P_MAX = 2 × 10⁷,
 *      so a cell holding twenty million people saturates at 255 and
 *      one person is v ≈ 10; the quantisation step is ≈ 6.8 % of the
 *      value, well below the source's cell scatter;
 *   G  land fraction of the cell, 0–255, the share of its source
 *      cells that are not nodata — so a coastal cell's people are
 *      spread over its land, not over the sea it also covers;
 *   B  unused.
 *
 * 1. `public/data/population-0p125.png` — the whole planet at 0.125°
 *    (≈ 14 km, 2 880 × 1 440), for planetary rings.
 * 2. `public/data/population-2p5/<col>_<row>.png` — 60° × 30° tiles at
 *    2.5′ (≈ 4.6 km, 1 440 × 720 each), for city-scale rings and the
 *    coast; tiles without a single person are not written and the
 *    index lists the ones that exist.
 *
 * Usage: pnpm population:build <path/to/grid.tif> [source label] [source url]
 * Re-run only when upgrading the source release; the output is committed.
 */

const FINE_CELL_DEG = 1 / 24; // 2.5 arc-minutes
const FINE_N_LON = Math.round(360 / FINE_CELL_DEG);
const FINE_N_LAT = Math.round(180 / FINE_CELL_DEG);
const COARSE_PER_FINE = 3; // 0.125° = 3 × 2.5′
const COARSE_CELL_DEG = FINE_CELL_DEG * COARSE_PER_FINE;
const COARSE_N_LON = FINE_N_LON / COARSE_PER_FINE;
const COARSE_N_LAT = FINE_N_LAT / COARSE_PER_FINE;
const TILE_WIDTH_DEG = 60;
const TILE_HEIGHT_DEG = 30;
const TILE_COLS = 360 / TILE_WIDTH_DEG;
const TILE_ROWS = 180 / TILE_HEIGHT_DEG;
const TILE_W = Math.round(TILE_WIDTH_DEG / FINE_CELL_DEG);
const TILE_H = Math.round(TILE_HEIGHT_DEG / FINE_CELL_DEG);
const P_MAX = 2e7;
const ROWS_PER_WINDOW = 480;

// ---- minimal PNG writer (RGB 8-bit) -----------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let k = 0; k < type.length; k++) out[4 + k] = type.charCodeAt(k);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Encode an RGB image whose channels are given as separate planes. */
function encodeRgbPng(
  width: number,
  height: number,
  red: Uint8Array,
  green: Uint8Array
): Uint8Array {
  const stride = width * 3 + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const src = y * width + x;
      const dst = y * stride + 1 + x * 3;
      raw[dst] = red[src] ?? 0;
      raw[dst + 1] = green[src] ?? 0;
      raw[dst + 2] = 0;
    }
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, width);
  v.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(deflateSync(raw, { level: 9 }))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    png.set(p, offset);
    offset += p.length;
  }
  return png;
}

const encodePopulation = (p: number): number =>
  Math.min(255, Math.round((255 * Math.log(1 + p)) / Math.log(1 + P_MAX)));

// ---- aggregation --------------------------------------------------------

async function main(): Promise<void> {
  const source = process.argv[2];
  if (source === undefined) {
    console.error('usage: pnpm population:build <grid.tif> [source label] [source url]');
    process.exit(2);
  }
  const sourceLabel = process.argv[3] ?? 'GHS-POP 2020 30 arc-second (GHSL R2023A, JRC), CC-BY 4.0';
  const sourceUrl =
    process.argv[4] ?? 'https://human-settlement.emergency.copernicus.eu/download.php?ds=pop';
  const tiff = await fromFile(source);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const [originX, originY] = image.getOrigin() as [number, number];
  const [resX, resY] = image.getResolution() as [number, number];
  const noData = image.getGDALNoData();
  console.error(
    `source ${width.toString()}×${height.toString()} px, origin (${originX.toString()}, ${originY.toString()}), res (${resX.toString()}, ${resY.toString()}), nodata ${String(noData)}`
  );

  // Fine grid accumulators: people, land source cells, all source cells.
  const people = new Float64Array(FINE_N_LON * FINE_N_LAT);
  const landCells = new Uint16Array(FINE_N_LON * FINE_N_LAT);
  const allCells = new Uint16Array(FINE_N_LON * FINE_N_LAT);
  let total = 0;
  for (let y0 = 0; y0 < height; y0 += ROWS_PER_WINDOW) {
    const y1 = Math.min(height, y0 + ROWS_PER_WINDOW);
    const rasters = await image.readRasters({ window: [0, y0, width, y1], samples: [0] });
    const band = (Array.isArray(rasters) ? rasters[0] : rasters) as ArrayLike<number>;
    for (let y = y0; y < y1; y++) {
      const lat = originY + (y + 0.5) * resY;
      const row = Math.min(FINE_N_LAT - 1, Math.max(0, Math.floor((90 - lat) / FINE_CELL_DEG)));
      const base = (y - y0) * width;
      for (let x = 0; x < width; x++) {
        const lon = originX + (x + 0.5) * resX;
        const col = Math.min(FINE_N_LON - 1, Math.max(0, Math.floor((lon + 180) / FINE_CELL_DEG)));
        const idx = row * FINE_N_LON + col;
        allCells[idx] = (allCells[idx] ?? 0) + 1;
        const value = band[base + x];
        if (value === undefined || !Number.isFinite(value)) continue;
        if (noData !== null && value === noData) continue;
        landCells[idx] = (landCells[idx] ?? 0) + 1;
        if (value <= 0) continue;
        people[idx] = (people[idx] ?? 0) + value;
        total += value;
      }
    }
    console.error(
      `rows ${y1.toString()} / ${height.toString()} — running total ${Math.round(total).toLocaleString('en-US')}`
    );
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = join(repoRoot, 'public', 'data');
  mkdirSync(outDir, { recursive: true });

  // ---- fine tiles ----
  const tileDir = join(outDir, 'population-2p5');
  rmSync(tileDir, { recursive: true, force: true });
  mkdirSync(tileDir, { recursive: true });
  const tiles: string[] = [];
  let maxFineCell = 0;
  let tileBytes = 0;
  for (let tr = 0; tr < TILE_ROWS; tr++) {
    for (let tc = 0; tc < TILE_COLS; tc++) {
      const red = new Uint8Array(TILE_W * TILE_H);
      const green = new Uint8Array(TILE_W * TILE_H);
      let tilePeople = 0;
      for (let y = 0; y < TILE_H; y++) {
        const row = tr * TILE_H + y;
        for (let x = 0; x < TILE_W; x++) {
          const col = tc * TILE_W + x;
          const idx = row * FINE_N_LON + col;
          const p = people[idx] ?? 0;
          const all = allCells[idx] ?? 0;
          const land = landCells[idx] ?? 0;
          if (p > maxFineCell) maxFineCell = p;
          tilePeople += p;
          red[y * TILE_W + x] = encodePopulation(p);
          green[y * TILE_W + x] = all > 0 ? Math.round((255 * land) / all) : 0;
        }
      }
      if (tilePeople < 1) continue;
      const name = `${tc.toString()}_${tr.toString()}`;
      const png = encodeRgbPng(TILE_W, TILE_H, red, green);
      writeFileSync(join(tileDir, `${name}.png`), png);
      tileBytes += png.length;
      tiles.push(name);
      console.error(
        `tile ${name}: ${Math.round(tilePeople).toLocaleString('en-US')} people, ${Math.round(png.length / 1024).toString()} KB`
      );
    }
  }
  writeFileSync(
    join(tileDir, 'index.json'),
    `${JSON.stringify(
      {
        source: sourceLabel,
        url: sourceUrl,
        cellDeg: FINE_CELL_DEG,
        tileWidthDeg: TILE_WIDTH_DEG,
        tileHeightDeg: TILE_HEIGHT_DEG,
        tileCols: TILE_COLS,
        tileRows: TILE_ROWS,
        tileWidthPx: TILE_W,
        tileHeightPx: TILE_H,
        minLat: -90,
        maxLat: 90,
        minLon: -180,
        maxLon: 180,
        channels: { population: 'R', landFraction: 'G' },
        encoding: 'v = round(255 · ln(1 + P) / ln(1 + pMax)); P = exp(v · ln(1 + pMax) / 255) − 1',
        pMax: P_MAX,
        tiles,
        totalPopulation: Math.round(total),
        maxCellPopulation: Math.round(maxFineCell),
        builtAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );
  console.error(
    `wrote ${tiles.length.toString()} tiles, ${Math.round(tileBytes / 1024 / 1024).toString()} MB, densest 2.5′ cell ${Math.round(maxFineCell).toLocaleString('en-US')}`
  );

  // ---- coarse planet ----
  const coarseRed = new Uint8Array(COARSE_N_LON * COARSE_N_LAT);
  const coarseGreen = new Uint8Array(COARSE_N_LON * COARSE_N_LAT);
  let maxCoarseCell = 0;
  for (let r = 0; r < COARSE_N_LAT; r++) {
    for (let c = 0; c < COARSE_N_LON; c++) {
      let p = 0;
      let land = 0;
      let all = 0;
      for (let dy = 0; dy < COARSE_PER_FINE; dy++) {
        for (let dx = 0; dx < COARSE_PER_FINE; dx++) {
          const idx = (r * COARSE_PER_FINE + dy) * FINE_N_LON + c * COARSE_PER_FINE + dx;
          p += people[idx] ?? 0;
          land += landCells[idx] ?? 0;
          all += allCells[idx] ?? 0;
        }
      }
      if (p > maxCoarseCell) maxCoarseCell = p;
      coarseRed[r * COARSE_N_LON + c] = encodePopulation(p);
      coarseGreen[r * COARSE_N_LON + c] = all > 0 ? Math.round((255 * land) / all) : 0;
    }
  }
  writeFileSync(
    join(outDir, 'population-0p125.png'),
    encodeRgbPng(COARSE_N_LON, COARSE_N_LAT, coarseRed, coarseGreen)
  );
  writeFileSync(
    join(outDir, 'population-0p125.json'),
    `${JSON.stringify(
      {
        source: sourceLabel,
        url: sourceUrl,
        cellDeg: COARSE_CELL_DEG,
        nLon: COARSE_N_LON,
        nLat: COARSE_N_LAT,
        minLat: -90,
        maxLat: 90,
        minLon: -180,
        maxLon: 180,
        channels: { population: 'R', landFraction: 'G' },
        encoding: 'v = round(255 · ln(1 + P) / ln(1 + pMax)); P = exp(v · ln(1 + pMax) / 255) − 1',
        pMax: P_MAX,
        totalPopulation: Math.round(total),
        maxCellPopulation: Math.round(maxCoarseCell),
        builtAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );
  console.error(
    `wrote ${COARSE_N_LON.toString()}×${COARSE_N_LAT.toString()} planet, total ${Math.round(total).toLocaleString('en-US')} people, densest 0.125° cell ${Math.round(maxCoarseCell).toLocaleString('en-US')}`
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
