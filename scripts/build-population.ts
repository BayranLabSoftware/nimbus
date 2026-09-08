import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';

/**
 * Build the coarse global population raster the casualty model uses
 * for rings the WorldPop API refuses (its zonal-statistics service
 * caps a request at 100 000 km², i.e. a circle of ≈ 178 km).
 *
 * Input: the WorldPop 2020 "Global 1 km Aggregated" GeoTIFF
 * (https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif,
 * ≈ 870 MB, CC-BY 4.0, Tatem 2017). Read in row windows and summed
 * into 0.125° cells (≈ 14 km at the equator, 2 880 × 1 440 cells).
 *
 * Output: `public/data/population-0p125.png` — an 8-bit greyscale
 * PNG whose pixel value encodes the cell population on a log scale,
 *   v = round(255 · ln(1 + P) / ln(1 + P_MAX)),  P_MAX = 2 × 10⁷,
 * so a 14 km cell holding twenty million people (the densest on
 * Earth) saturates at 255 and one person is v ≈ 10. The quantisation
 * step is ≈ 6.8 % of the value, well below the WorldPop cell scatter,
 * and a PNG decodes in every browser through a 2D canvas — no raster
 * library shipped. The sidecar `population-0p125.json` records the
 * grid geometry, the encoding and the source.
 *
 * Usage: pnpm population:build <path/to/grid.tif> [source label] [source url]
 * The input may be any global population-count GeoTIFF in EPSG:4326
 * (WorldPop 2020 1 km aggregated, or the JRC GHS-POP 2020 30 arc-second
 * grid — GHSL R2023A, also CC-BY 4.0 — whose per-cell counts have the
 * same semantics). The label and URL are written to the sidecar so the
 * UI credits the right dataset. Re-run only when upgrading the source
 * release; the output is committed.
 */

const CELL_DEG = 0.125;
const N_LON = Math.round(360 / CELL_DEG);
const N_LAT = Math.round(180 / CELL_DEG);
const P_MAX = 2e7;
const ROWS_PER_WINDOW = 512;

// ---- minimal PNG writer (greyscale 8-bit) ----------------------------

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

function encodeGreyPng(width: number, height: number, pixels: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // filter: none
    raw.set(pixels.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, width);
  v.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
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

// ---- aggregation --------------------------------------------------------

async function main(): Promise<void> {
  const source = process.argv[2];
  if (source === undefined) {
    console.error('usage: pnpm population:build <grid.tif> [source label] [source url]');
    process.exit(2);
  }
  const sourceLabel =
    process.argv[3] ?? 'WorldPop 2020 Global 1 km Aggregated (Tatem 2017), CC-BY 4.0';
  const sourceUrl =
    process.argv[4] ??
    'https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif';
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

  const cells = new Float64Array(N_LON * N_LAT);
  let total = 0;
  for (let y0 = 0; y0 < height; y0 += ROWS_PER_WINDOW) {
    const y1 = Math.min(height, y0 + ROWS_PER_WINDOW);
    const rasters = await image.readRasters({ window: [0, y0, width, y1], samples: [0] });
    const band = (Array.isArray(rasters) ? rasters[0] : rasters) as ArrayLike<number>;
    for (let y = y0; y < y1; y++) {
      const lat = originY + (y + 0.5) * resY;
      const row = Math.min(N_LAT - 1, Math.max(0, Math.floor((90 - lat) / CELL_DEG)));
      const base = (y - y0) * width;
      for (let x = 0; x < width; x++) {
        const value = band[base + x];
        if (value === undefined || !Number.isFinite(value) || value <= 0) continue;
        if (noData !== null && value === noData) continue;
        const lon = originX + (x + 0.5) * resX;
        const col = Math.min(N_LON - 1, Math.max(0, Math.floor((lon + 180) / CELL_DEG)));
        const idx = row * N_LON + col;
        cells[idx] = (cells[idx] ?? 0) + value;
        total += value;
      }
    }
    console.error(
      `rows ${y1.toString()} / ${height.toString()} — running total ${Math.round(total).toLocaleString('en-US')}`
    );
  }

  const pixels = new Uint8Array(N_LON * N_LAT);
  const scale = 255 / Math.log(1 + P_MAX);
  let maxCell = 0;
  for (let i = 0; i < cells.length; i++) {
    const p = cells[i] ?? 0;
    if (p > maxCell) maxCell = p;
    pixels[i] = Math.min(255, Math.round(Math.log(1 + p) * scale));
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = join(repoRoot, 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'population-0p125.png'), encodeGreyPng(N_LON, N_LAT, pixels));
  writeFileSync(
    join(outDir, 'population-0p125.json'),
    `${JSON.stringify(
      {
        source: sourceLabel,
        url: sourceUrl,
        cellDeg: CELL_DEG,
        nLon: N_LON,
        nLat: N_LAT,
        minLat: -90,
        maxLat: 90,
        minLon: -180,
        maxLon: 180,
        encoding: 'v = round(255 · ln(1 + P) / ln(1 + pMax)); P = exp(v · ln(1 + pMax) / 255) − 1',
        pMax: P_MAX,
        totalPopulation: Math.round(total),
        maxCellPopulation: Math.round(maxCell),
        builtAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );
  console.error(
    `wrote ${N_LON.toString()}×${N_LAT.toString()} cells, total ${Math.round(total).toLocaleString('en-US')} people, densest cell ${Math.round(maxCell).toLocaleString('en-US')}`
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
