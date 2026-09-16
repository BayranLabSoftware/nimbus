import { describe, expect, it } from 'vitest';
import { DEFAULT_RADIATION_SOURCE } from '../../effects/initialRadiation.js';
import { initialRadiationRadii } from './radiation.js';

describe('initialRadiationRadii (project fit)', () => {
  // Every row here names `project`, so it reads the fit these tests were
  // written against. Since 16 September 2026 a scenario that names no source
  // reads Glasstone & Dolan's own dose–range figures instead (rules 85 to 89
  // of validation/doseRules.ts); the fit stays, named, and what it does has
  // not moved.
  const fit = (megatons: number) => initialRadiationRadii(megatons, { source: 'project' });

  it('1 kt reference yields LD50 ≈ 700 m', () => {
    const r = fit(0.001);
    expect(r.ld50Radius as number).toBeGreaterThan(650);
    expect(r.ld50Radius as number).toBeLessThan(750);
  });

  it('LD100 sits at ≈ 70 % of the LD50 distance', () => {
    const r = fit(0.015);
    const ratio = (r.ld100Radius as number) / (r.ld50Radius as number);
    expect(ratio).toBeCloseTo(0.7, 2);
  });

  it('ARS threshold sits at ≈ 1.4× the LD50 distance', () => {
    const r = fit(0.015);
    const ratio = (r.arsThresholdRadius as number) / (r.ld50Radius as number);
    expect(ratio).toBeCloseTo(1.4, 2);
  });

  it('scales as yield^0.18 between 1 kt and 1 Mt', () => {
    const r1kt = fit(0.001);
    const r1Mt = fit(1);
    const ratio = (r1Mt.ld50Radius as number) / (r1kt.ld50Radius as number);
    // Phase 10 audit: replaced yield^0.4 with yield^0.18 to honour
    // atmospheric attenuation. 1 000× yield ⇒ 1000^0.18 ≈ 3.47× radius.
    expect(ratio).toBeCloseTo(3.47, 1);
  });

  it('returns zero for zero or negative yield', () => {
    expect(initialRadiationRadii(0).ld50Radius).toBe(0);
    expect(initialRadiationRadii(-1).ld100Radius).toBe(0);
  });

  it('Hiroshima 15 kt LD50 radius is pinned near 1.0 km', () => {
    // Phase 10 audit: was 2.07 km (factor-2 over) under yield^0.4
    // scaling. After re-fit to yield^0.18 the value drops to ~1.1 km
    // matching Glasstone's anchor at 15 kt.
    const r = fit(0.015);
    expect(r.ld50Radius as number).toBeGreaterThan(900);
    expect(r.ld50Radius as number).toBeLessThan(1_400);
  });
});

describe("initialRadiationRadii (the book's figures)", () => {
  it('is what a scenario that names no source draws (rule 89)', () => {
    expect(DEFAULT_RADIATION_SOURCE).toBe('glasstone1977');
    const unnamed = initialRadiationRadii(0.015, { heightOfBurstM: 580 });
    const book = initialRadiationRadii(0.015, {
      source: 'glasstone1977',
      heightOfBurstM: 580,
    });
    expect(unnamed.ld50Radius).toBe(book.ld50Radius);
  });

  it("reads Hiroshima's LD50 a little wider than the fit did, and its LD100 much wider", () => {
    // The fit put LD₁₀₀ at a flat 0.7 of LD₅₀ whatever the yield; the book's
    // own curves crowd the doses far closer together than that.
    const r = initialRadiationRadii(0.015, { heightOfBurstM: 580 });
    expect((r.ld50Radius as number) / 1_000).toBeCloseTo(1.33, 1);
    expect((r.ld100Radius as number) / (r.ld50Radius as number)).toBeGreaterThan(0.85);
    expect((r.arsThresholdRadius as number) / (r.ld50Radius as number)).toBeLessThan(1.3);
  });

  it('draws nothing on the ground for a burst above where the dose reaches', () => {
    const r = initialRadiationRadii(0.001, { heightOfBurstM: 40_000 });
    expect(r.ld50Radius).toBe(0);
  });
});
