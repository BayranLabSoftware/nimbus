import { describe, expect, it } from 'vitest';
import {
  BLUR_FS,
  BRIGHT_FS,
  COMPOSITE_FS,
  PARTICLE_FS,
  PARTICLE_VS,
  QUAD_VS,
  SCENE_FS,
} from './shaders.js';

const SOURCES: readonly (readonly [string, string])[] = [
  ['QUAD_VS', QUAD_VS],
  ['SCENE_FS', SCENE_FS],
  ['PARTICLE_VS', PARTICLE_VS],
  ['PARTICLE_FS', PARTICLE_FS],
  ['BRIGHT_FS', BRIGHT_FS],
  ['BLUR_FS', BLUR_FS],
  ['COMPOSITE_FS', COMPOSITE_FS],
];

describe('shader sources', () => {
  it('contain no backtick, which would close the template literal early', () => {
    // This has bitten three times. A stray backtick inside a GLSL
    // comment ends the JS template, the rest of the shader is parsed
    // as JavaScript, and the failure surfaces as an unrelated syntax
    // error hundreds of lines away.
    for (const [name, source] of SOURCES) {
      expect(source.includes('`'), `${name} contains a backtick`).toBe(false);
    }
  });

  it('contain no ${ sequence, which would interpolate silently', () => {
    for (const [name, source] of SOURCES) {
      expect(source.includes('${'), `${name} interpolates`).toBe(false);
    }
  });

  it('declare the GLSL ES 3.00 version on the very first line', () => {
    for (const [name, source] of SOURCES) {
      expect(source.startsWith('#version 300 es'), name).toBe(true);
    }
  });

  it('balance braces and parentheses', () => {
    const count = (s: string, ch: string): number => s.split(ch).length - 1;
    for (const [name, source] of SOURCES) {
      expect(count(source, '{'), `${name} braces`).toBe(count(source, '}'));
      expect(count(source, '('), `${name} parens`).toBe(count(source, ')'));
    }
  });

  it('give every fragment shader an output and a main', () => {
    for (const [name, source] of SOURCES) {
      expect(source.includes('void main('), name).toBe(true);
      if (name.endsWith('_FS')) expect(source.includes('out vec4'), name).toBe(true);
    }
  });

  it('size the effect palette to match the table that fills it', () => {
    // The shader indexes uEffectColor[0..10]; effectStyle.ts owns the
    // slots. A mismatch is a silent out-of-range read.
    expect(SCENE_FS).toContain('uniform vec3  uEffectColor[11]');
    for (let slot = 0; slot < 11; slot++) {
      expect(SCENE_FS, `slot ${String(slot)} unused`).toContain(`uEffectColor[${String(slot)}]`);
    }
  });

  it('never samples a mosaic without clamping into range', () => {
    // An unclamped UV smears the edge texel across the whole horizon.
    const samples = SCENE_FS.match(/texture\(u(Img|Dem)\w*,\s*([^)]+)\)/g) ?? [];
    expect(samples.length).toBeGreaterThan(0);
    for (const call of samples) {
      expect(call, call).toContain('clamp(');
    }
  });
});
