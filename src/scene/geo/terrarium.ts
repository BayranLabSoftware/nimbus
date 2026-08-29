/**
 * Terrarium elevation decoding.
 *
 * AWS Terrain Tiles ("terrarium" encoding) pack a signed elevation in
 * metres into an ordinary RGB PNG:
 *
 *     elevation = R · 256 + G + B / 256 − 32768
 *
 * That gives 1/256 m resolution over ±32 km, which covers the ocean
 * trenches and the Himalaya with room to spare.
 *
 * The catch: the encoding is NOT interpolatable. Bilinear filtering
 * across a boundary where R steps by one produces a 256 m cliff out of
 * nowhere. So a terrarium mosaic can never be handed to the GPU as-is
 * with LINEAR filtering, and it can never be resampled in encoded
 * space. This module decodes first, then re-encodes into a single
 * 8-bit channel with an explicit per-mosaic range — which IS safe to
 * filter, and is all the precision a rendered landscape needs (a
 * 1 300 m relief over 256 levels is 5 m per step).
 *
 * Reference:
 *   Mapzen / AWS Terrain Tiles, terrarium encoding.
 *   https://registry.opendata.aws/terrain-tiles/
 */

/** The offset that makes the encoding signed. */
const TERRARIUM_OFFSET = 32_768;

export interface ElevationField {
  /** Elevation in metres, row-major, north-to-south. */
  readonly meters: Float32Array;
  readonly width: number;
  readonly height: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Decode an RGBA byte buffer (as produced by `getImageData`) into
 * metres. Alpha is ignored. Throws on a buffer whose length does not
 * match the declared dimensions — a silent partial decode would show
 * up as a torn landscape hundreds of frames later.
 */
export function decodeTerrarium(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): ElevationField {
  const n = width * height;
  if (rgba.length < n * 4) {
    throw new Error(
      `decodeTerrarium: buffer holds ${String(rgba.length)} bytes, need ${String(n * 4)} for ${String(width)}x${String(height)}`
    );
  }
  const meters = new Float32Array(n);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const r = rgba[i * 4] ?? 0;
    const g = rgba[i * 4 + 1] ?? 0;
    const b = rgba[i * 4 + 2] ?? 0;
    const e = r * 256 + g + b / 256 - TERRARIUM_OFFSET;
    meters[i] = e;
    if (e < min) min = e;
    if (e > max) max = e;
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 0;
  }
  return { meters, width, height, min, max };
}

export interface NormalisedElevation {
  /** One byte per sample: 0 → `min`, 255 → `max`. Safe to upload as a
   *  LINEAR-filtered texture. */
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Re-encode a decoded field into a filterable 8-bit channel. The
 * range is stored alongside so the shader can undo it exactly:
 *
 *     metres = min + byte/255 · (max − min)
 *
 * A flat field (max == min) is given a 1 m artificial range so the
 * division downstream can never be by zero.
 */
export function normaliseElevation(field: ElevationField): NormalisedElevation {
  const { meters, width, height, min } = field;
  const max = field.max - min < 1 ? min + 1 : field.max;
  const span = max - min;
  const bytes = new Uint8Array(meters.length);
  for (let i = 0; i < meters.length; i++) {
    const v = ((meters[i] ?? min) - min) / span;
    bytes[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  return { bytes, width, height, min, max };
}

/** Undo {@link normaliseElevation} for a single sample. Mirrors what
 *  the fragment shader does, so a test can pin the two together. */
export function decodeNormalised(byte: number, min: number, max: number): number {
  return min + (byte / 255) * (max - min);
}

/**
 * Elevation at a fractional sample position, bilinearly interpolated.
 * Used to read the ground height at the impact point so the local
 * frame's y = 0 sits on the real terrain rather than on the ellipsoid.
 */
export function sampleElevation(field: ElevationField, u: number, v: number): number {
  const { meters, width, height } = field;
  const x = Math.min(Math.max(u, 0), 1) * (width - 1);
  const y = Math.min(Math.max(v, 0), 1) * (height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const at = (px: number, py: number): number => meters[py * width + px] ?? 0;
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Elevation in metres at a fractional position of a NORMALISED field,
 * bilinearly interpolated. The renderer keeps only the normalised form
 * after upload; this is how CPU-side consumers — the building layer
 * seating its foundations, the datum at ground zero — read it back
 * without holding the raw decode alive.
 */
export function sampleNormalised(elevation: NormalisedElevation, u: number, v: number): number {
  const { bytes, width, height, min, max } = elevation;
  const x = Math.min(Math.max(u, 0), 1) * (width - 1);
  const y = Math.min(Math.max(v, 0), 1) * (height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const at = (px: number, py: number): number => bytes[py * width + px] ?? 0;
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return decodeNormalised(top * (1 - fy) + bottom * fy, min, max);
}
