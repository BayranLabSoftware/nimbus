import { describe, expect, it } from 'vitest';
import { tileSpanMeters } from './mercator.js';
import { AWS_TERRARIUM, ESRI_WORLD_IMAGERY, planMosaic } from './tileMosaic.js';

describe('tile sources', () => {
  it('Esri uses {z}/{y}/{x} — row before column', () => {
    // Getting this backwards produces a mosaic that is silently
    // transposed: it renders, it just shows the wrong place.
    expect(ESRI_WORLD_IMAGERY.url(1620, 3222, 13)).toMatch(/\/13\/3222\/1620$/);
  });

  it('terrarium uses {z}/{x}/{y}.png', () => {
    expect(AWS_TERRARIUM.url(1620, 3222, 13)).toMatch(/\/13\/1620\/3222\.png$/);
  });

  it('both carry an attribution string', () => {
    expect(ESRI_WORLD_IMAGERY.attribution).toMatch(/Esri/);
    expect(AWS_TERRARIUM.attribution.length).toBeGreaterThan(0);
  });
});

describe('planMosaic', () => {
  const barringer = { latitude: 35.0272, longitude: -111.0225, spanMeters: 16_000, tiles: 8 };

  it('covers the requested span', () => {
    const { block } = planMosaic(barringer, ESRI_WORLD_IMAGERY);
    expect(block.tiles * tileSpanMeters(barringer.latitude, block.z)).toBeGreaterThanOrEqual(
      16_000
    );
  });

  it('brackets the requested point', () => {
    const { block } = planMosaic(barringer, ESRI_WORLD_IMAGERY);
    expect(block.bounds.lonWest).toBeLessThan(barringer.longitude);
    expect(block.bounds.lonEast).toBeGreaterThan(barringer.longitude);
    expect(block.bounds.latSouth).toBeLessThan(barringer.latitude);
    expect(block.bounds.latNorth).toBeGreaterThan(barringer.latitude);
  });

  it('never plans more requests than the block area', () => {
    const { requests } = planMosaic(barringer, ESRI_WORLD_IMAGERY);
    expect(requests).toBe(64);
  });

  it('respects each provider maximum zoom independently', () => {
    // Terrarium stops three levels below Esri; a tight span must not
    // make us ask it for a level it does not serve.
    const tight = { latitude: 35.0272, longitude: -111.0225, spanMeters: 500, tiles: 4 };
    expect(planMosaic(tight, ESRI_WORLD_IMAGERY).block.z).toBeLessThanOrEqual(
      ESRI_WORLD_IMAGERY.maxZoom
    );
    expect(planMosaic(tight, AWS_TERRARIUM).block.z).toBeLessThanOrEqual(AWS_TERRARIUM.maxZoom);
    expect(planMosaic(tight, AWS_TERRARIUM).block.z).toBe(AWS_TERRARIUM.maxZoom);
  });

  it('handles a continental span without exploding the request count', () => {
    const chicxulub = { latitude: 21.4, longitude: -89.5, spanMeters: 2_915_000, tiles: 5 };
    const plan = planMosaic(chicxulub, ESRI_WORLD_IMAGERY);
    expect(plan.requests).toBe(25);
    expect(plan.block.z).toBeLessThan(8);
  });

  it('is deterministic', () => {
    const a = planMosaic(barringer, ESRI_WORLD_IMAGERY).block;
    const b = planMosaic(barringer, ESRI_WORLD_IMAGERY).block;
    expect(a).toEqual(b);
  });
});
