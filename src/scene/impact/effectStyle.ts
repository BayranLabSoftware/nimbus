import type { EffectKind } from './scene.js';

/**
 * The single source of truth for what each effect looks like.
 *
 * The Cesium layer keeps its ring palette in `Globe.tsx` and a copy in
 * `RingLegend.tsx`, with a comment asking whoever edits one to
 * remember the other. They drifted: the legend still advertises three
 * tsunami contours that were removed from the scene, in colours that
 * appear nowhere on screen.
 *
 * So this table is not duplicated into GLSL. It is uploaded as a
 * uniform array and indexed by {@link EFFECT_SLOT}; the legend reads
 * the same object. A colour can only ever be wrong in both places at
 * once, which is a thing a reviewer can see.
 */

export interface EffectStyle {
  /** Position in the `uEffectColor[]` uniform array. */
  readonly slot: number;
  readonly rgb: readonly [number, number, number];
  readonly kind: EffectKind;
}

export const EFFECT_STYLE: Readonly<Record<string, EffectStyle>> = {
  crater: { slot: 0, rgb: [0.73, 0.11, 0.11], kind: 'crater' },
  ejecta: { slot: 1, rgb: [0.47, 0.34, 0.2], kind: 'ejecta' },
  thermal3: { slot: 2, rgb: [0.98, 0.45, 0.09], kind: 'thermal' },
  thermal2: { slot: 3, rgb: [0.99, 0.58, 0.25], kind: 'thermal' },
  thermal1: { slot: 4, rgb: [1.0, 0.72, 0.45], kind: 'thermal' },
  firestorm: { slot: 5, rgb: [1.0, 0.34, 0.1], kind: 'firestorm' },
  blast5: { slot: 6, rgb: [0.98, 0.8, 0.08], kind: 'blast' },
  blast1: { slot: 7, rgb: [0.99, 0.88, 0.28], kind: 'blast' },
  blastLight: { slot: 8, rgb: [1.0, 0.95, 0.78], kind: 'blast' },
  radiation: { slot: 9, rgb: [0.66, 0.35, 0.97], kind: 'radiation' },
  emp: { slot: 10, rgb: [0.02, 0.71, 0.83], kind: 'emp' },
};

/** Number of slots the uniform array must declare. */
export const EFFECT_SLOTS = 11;

/** Flatten the palette into the array the shader binds. */
export function effectColorArray(): Float32Array {
  const out = new Float32Array(EFFECT_SLOTS * 3);
  for (const style of Object.values(EFFECT_STYLE)) {
    out[style.slot * 3] = style.rgb[0];
    out[style.slot * 3 + 1] = style.rgb[1];
    out[style.slot * 3 + 2] = style.rgb[2];
  }
  return out;
}

/** CSS colour for the legend swatch, from the same numbers. */
export function effectCss(id: string): string {
  const style = EFFECT_STYLE[id];
  if (style === undefined) return 'transparent';
  const to255 = (v: number): number => Math.round(Math.min(Math.max(v, 0), 1) * 255);
  return `rgb(${String(to255(style.rgb[0]))} ${String(to255(style.rgb[1]))} ${String(to255(style.rgb[2]))})`;
}
