import { inflateSync } from 'node:zlib';

/**
 * An 8-bit PNG decoded with nothing but zlib.
 *
 * The browser decodes the shipped population rasters and the terrain
 * tiles through an `OffscreenCanvas`; the offline harness has none, and
 * reads the same files with this. Grey, RGB and RGBA, not interlaced,
 * eight bits a sample: what both kinds of file are.
 */

export interface DecodedPng {
  width: number;
  height: number;
  /** Red plane, row-major from the top — the grey level of a grey PNG. */
  red: Uint8Array;
  /** Green plane; 255 throughout for a grey PNG, which the population
   *  rasters read as all land. */
  green: Uint8Array;
  /** Blue plane; zero throughout for a grey PNG. */
  blue: Uint8Array;
}

/** Undo one PNG scanline filter in place. `bpp` is bytes per pixel. */
function unfilter(type: number, row: Uint8Array, previous: Uint8Array, bpp: number): void {
  const n = row.length;
  switch (type) {
    case 0:
      return;
    case 1:
      for (let i = bpp; i < n; i++) row[i] = ((row[i] ?? 0) + (row[i - bpp] ?? 0)) & 0xff;
      return;
    case 2:
      for (let i = 0; i < n; i++) row[i] = ((row[i] ?? 0) + (previous[i] ?? 0)) & 0xff;
      return;
    case 3:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? (row[i - bpp] ?? 0) : 0;
        row[i] = ((row[i] ?? 0) + ((left + (previous[i] ?? 0)) >> 1)) & 0xff;
      }
      return;
    case 4:
      for (let i = 0; i < n; i++) {
        const a = i >= bpp ? (row[i - bpp] ?? 0) : 0;
        const b = previous[i] ?? 0;
        const c = i >= bpp ? (previous[i - bpp] ?? 0) : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        row[i] = ((row[i] ?? 0) + pred) & 0xff;
      }
      return;
    default:
      throw new Error(`unknown PNG filter ${type.toString()}`);
  }
}

export function decodePng(bytes: Buffer): DecodedPng {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8; // signature
  let width = 0;
  let height = 0;
  let channels = 3;
  const idat: Buffer[] = [];
  while (offset < bytes.length) {
    const length = view.getUint32(offset);
    const type = bytes.toString('latin1', offset + 4, offset + 8);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const depth = bytes[offset + 16];
      const colour = bytes[offset + 17];
      if (depth !== 8) throw new Error(`unsupported bit depth ${String(depth)}`);
      channels = colour === 2 ? 3 : colour === 0 ? 1 : colour === 6 ? 4 : 0;
      if (channels === 0) throw new Error(`unsupported colour type ${String(colour)}`);
      if (bytes[offset + 20] !== 0) throw new Error('interlaced PNGs are not supported');
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(body));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const red = new Uint8Array(width * height);
  const green = new Uint8Array(width * height);
  const blue = new Uint8Array(width * height);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start] ?? 0;
    const row = new Uint8Array(raw.subarray(start + 1, start + 1 + stride));
    unfilter(filter, row, previous, channels);
    for (let x = 0; x < width; x++) {
      red[y * width + x] = row[x * channels] ?? 0;
      green[y * width + x] = channels >= 3 ? (row[x * channels + 1] ?? 0) : 255;
      blue[y * width + x] = channels >= 3 ? (row[x * channels + 2] ?? 0) : 0;
    }
    previous = row;
  }
  return { width, height, red, green, blue };
}
