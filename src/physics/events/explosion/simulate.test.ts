import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { EXPLOSION_PRESETS, simulateExplosion } from './simulate.js';

describe('simulateExplosion — composition', () => {
  it('Hiroshima 15 kt: 1 psi ring in the 2–5 km band, 3rd-degree burn ≈ 2–3 km', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input);
    expect(r.yield.kilotons).toBe(15);
    // 1 psi for 15 kt surface-burst Kinney–Graham ≈ 3.3 km (see existing
    // damage-rings tests); generous band covers the ±10 % modelling
    // scatter vs observed airburst-optimised historical figures.
    expect(r.blast.overpressure1psiRadius as number).toBeGreaterThan(2_000);
    expect(r.blast.overpressure1psiRadius as number).toBeLessThan(5_000);
    // Burn radius ≈ 2.3 km unshielded (see thermal.test.ts).
    expect(r.thermal.thirdDegreeBurnRadius as number).toBeGreaterThan(2_000);
    expect(r.thermal.thirdDegreeBurnRadius as number).toBeLessThan(3_000);
  });

  it('Castle Bravo 15 Mt (wet coral) opens a ~1.5–2 km apparent crater', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.CASTLE_BRAVO_1954.input);
    expect(r.yield.megatons).toBe(15);
    expect(r.crater.apparentDiameter as number).toBeGreaterThan(1_500);
    expect(r.crater.apparentDiameter as number).toBeLessThan(2_000);
  });

  it('Tsar Bomba 50 Mt: 1 psi ring ≈ 45–60 km (surface-burst envelope)', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.TSAR_BOMBA_1961.input);
    // K–G surface burst gives ≈ 49 km at 50 Mt. Tsar Bomba's observed
    // 900 km window-breakage range was a tropospheric-duct artefact
    // of the high-altitude airburst, not the surface-burst envelope
    // this formula describes.
    expect(r.blast.overpressure1psiRadius as number).toBeGreaterThan(40_000);
    expect(r.blast.overpressure1psiRadius as number).toBeLessThan(65_000);
  });

  it('One-megaton reference has a 5 psi ring an order of magnitude bigger than Hiroshima', () => {
    const hiroshima = simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input);
    const oneMt = simulateExplosion(EXPLOSION_PRESETS.ONE_MEGATON.input);
    // Yield ratio ≈ 67 → radius ratio ≈ 67^(1/3) ≈ 4.06 for a pure
    // cube-root formula. K–G bends the curve a bit, so we check for
    // at least 3× rather than the exact algebraic value.
    expect(
      (oneMt.blast.overpressure5psiRadius as number) /
        (hiroshima.blast.overpressure5psiRadius as number)
    ).toBeGreaterThan(3);
  });

  it('defaults groundType to FIRM_GROUND when omitted', () => {
    const defaultCrater = simulateExplosion({ yieldMegatons: 1 }).crater.apparentDiameter;
    const explicit = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'FIRM_GROUND',
    }).crater.apparentDiameter;
    expect(defaultCrater).toBe(explicit);
  });

  it('preserves inputs in the result blob', () => {
    const input = EXPLOSION_PRESETS.HIROSHIMA_1945.input;
    expect(simulateExplosion(input).inputs).toBe(input);
  });

  it('land burst (no waterDepth) emits no tsunami block', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input);
    expect(r.tsunami).toBeUndefined();
  });

  it('underwater burst exposes celerity, wavelength, period, runup and inundation', () => {
    const r = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      // Actually under the water, which this used to say and not do:
      // a megatonne is a thousand kilotonnes, so its optimum sits at
      // 4 · 1000^(1/3) = 40 m down.
      heightOfBurst: m(-40),
      waterDepth: m(50),
      meanOceanDepth: m(4_000),
    });
    expect(r.tsunami).toBeDefined();
    if (!r.tsunami) return;
    // The peak wave's period is Glasstone & Dolan's 14.1·W^0.144 s:
    // 38 s for a megatonne.
    expect(r.tsunami.dominantPeriod as number).toBeCloseTo(14.1 * 1_000 ** 0.144, 6);
    // Over 4 km of ocean a 38 s wave is a deep-water wave, and its
    // energy crosses at g·T/(4π) ≈ 30 m/s — not the 198 m/s of a long
    // wave, which is what this used to report.
    expect(r.tsunami.deepWaterCelerity as number).toBeGreaterThan(28);
    expect(r.tsunami.deepWaterCelerity as number).toBeLessThan(32);
    // In the 50 m it was fired in, the same period is a long wave:
    // √(g · 50) · 38 s ≈ 840 m.
    expect(r.tsunami.sourceWavelength as number).toBeGreaterThan(750);
    expect(r.tsunami.sourceWavelength as number).toBeLessThan(900);
    // Runup is positive and inundation = 100 × runup.
    expect(r.tsunami.runupAt100km as number).toBeGreaterThan(0);
    expect(r.tsunami.inundationDistanceAt100km as number).toBeCloseTo(
      (r.tsunami.runupAt100km as number) * 100,
      3
    );
  });

  it("a megatonne in 50 m of water makes Glasstone & Dolan's shallow-water wave", () => {
    const r = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(-40),
      waterDepth: m(50),
    });
    expect(r.tsunami).toBeDefined();
    if (!r.tsunami) return;
    // 50 m is 164 ft, far below 100·W^0.25 = 562 ft: §6.121,
    // H·R = 150·d_w·W^0.25 ft², and the amplitude is half the height.
    expect(r.tsunami.regime).toBe('shallow');
    const FT = 0.3048;
    const heightTimesRange = 150 * (50 / FT) * 1_000 ** 0.25 * FT * FT;
    expect(r.tsunami.amplitudeAt100km as number).toBeCloseTo(heightTimesRange / 200_000, 9);
    // The version this replaced dug a 350 m cavity and called its rim
    // 175 m high, calibrated on "Glasstone Table 6.50", which the 1977
    // edition does not have. Glasstone's own relation says 6 cm here.
    expect(r.tsunami.amplitudeAt100km as number).toBeCloseTo(0.064, 3);
  });

  it('non-surface burst over water still suppresses the tsunami branch', () => {
    // Hiroshima at 580 m HOB sits in LOW_AIRBURST / OPTIMUM regime
    // depending on yield-scaling. Even with waterDepth > 0, the
    // mechanical coupling is essentially zero — the simulator must
    // skip the underwater-burst cascade for any non-SURFACE detonation.
    const r = simulateExplosion({
      ...EXPLOSION_PRESETS.HIROSHIMA_1945.input,
      waterDepth: m(50),
    });
    expect(r.blast.hobRegime).not.toBe('SURFACE');
    expect(r.tsunami).toBeUndefined();
  });

  it('Tsar Bomba 50 Mt at 500 m HOB over deep water emits NO tsunami (audit fix: HOB > 30 m gate)', () => {
    // Tsar Bomba scaled HOB at 500 m absolute = 500/cbrt(50000) = 13.6
    // m·kt⁻¹ᐟ³, which sits comfortably under the SURFACE regime
    // boundary (50). Without an absolute-HOB gate the cube-root scaling
    // mis-classifies a 500 m airburst over water as a contact-water
    // burst, then the 8 % underwater-coupling fraction of the source
    // of the time inflates the source amplitude to ~360 m and the bathymetric
    // pipeline propagates that nonsense across the basin (the user's
    // bug report: 3.5 m wave at trans-Atlantic distance from a
    // Tsar-Bomba airburst in the Gulf of Mexico). No nuclear test in
    // history has produced a measurable open-ocean wave from an
    // airburst > 30 m HOB; the gate now enforces this.
    const r = simulateExplosion({
      yieldMegatons: 50,
      groundType: 'WET_SOIL',
      heightOfBurst: m(500),
      waterDepth: m(3_500),
      meanOceanDepth: m(3_500),
    });
    expect(r.blast.hobRegime).toBe('SURFACE');
    expect(r.tsunami).toBeUndefined();
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('a burst resting on the water makes no wave, because it is not within the water', () => {
    // This used to fire at full coupling and was how a half-kilotonne
    // charge on the Beirut quay came to drown seventy-seven thousand
    // people. Glasstone & Dolan's relations are for a burst within the
    // water (§6.119); a charge on its surface is not one.
    const r = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      waterDepth: m(50),
    });
    expect(r.tsunami).toBeUndefined();
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('any depth within the water makes the same wave, and none outside it', () => {
    const amplitudeAt = (hobM: number): number => {
      const r = simulateExplosion({
        yieldMegatons: 1,
        groundType: 'WET_SOIL',
        heightOfBurst: m(hobM),
        waterDepth: m(50),
        meanOceanDepth: m(4_000),
      });
      return r.tsunami === undefined ? 0 : r.tsunami.amplitudeAt100km;
    };
    // "The relation is valid for any depth of burst within the water"
    // (§6.119). The curve this replaced peaked at 40 m and fell away on
    // both sides, a shape of the project's own.
    expect(amplitudeAt(-10)).toBeGreaterThan(0);
    expect(amplitudeAt(-10)).toBe(amplitudeAt(-40));
    expect(amplitudeAt(0)).toBe(0);
    // 60 m down in 50 m of water is in the seabed, not the water.
    expect(amplitudeAt(-60)).toBe(0);
  });

  it('contact-water burst at HOB = 31 m does NOT fire (just above gate)', () => {
    const r = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(31),
      waterDepth: m(50),
    });
    expect(r.tsunami).toBeUndefined();
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('flags a burst that put energy into the water, and only that', () => {
    const submerged = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(-40),
      waterDepth: m(50),
    });
    expect(submerged.isContactWaterBurst).toBe(true);
    expect(submerged.tsunami).toBeDefined();

    // Sitting on the surface is not being in the water: the globe
    // vents, and the flag follows the source rather than the sea
    // happening to be nearby.
    const onTheSurface = simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      waterDepth: m(50),
    });
    expect(onTheSurface.isContactWaterBurst).toBe(false);
    expect(onTheSurface.tsunami).toBeUndefined();
  });

  it('continental land bursts are not flagged as contact-water', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input);
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('airburst over water is not flagged as contact-water', () => {
    // The HOB regime path keeps the energy in the atmosphere; the
    // contact-water branch must not be taken even with waterDepth > 0.
    const r = simulateExplosion({
      ...EXPLOSION_PRESETS.HIROSHIMA_1945.input,
      waterDepth: m(50),
    });
    expect(r.isContactWaterBurst).toBe(false);
  });

  it('every EXPLOSION_PRESETS entry simulates without throwing and matches yield bookkeeping', () => {
    // Smoke test for newly-added presets (Halifax, Texas City, Ivy
    // Mike). yieldKilotons should equal yieldMegatons × 1 000 by
    // definition (see line ~180 of simulate.ts).
    for (const [id, preset] of Object.entries(EXPLOSION_PRESETS)) {
      const r = simulateExplosion(preset.input);
      expect(r.yield.megatons, `${id}: positive yield`).toBeGreaterThan(0);
      expect(r.yield.kilotons, `${id}: kt = Mt × 1000`).toBeCloseTo(r.yield.megatons * 1000, 6);
    }
  });
});

describe('a chemical charge (Glasstone & Dolan §1.23–1.25; Takazawa et al. 2023)', () => {
  const surface = (yieldMegatons: number, chargeType: 'nuclear' | 'chemical') =>
    simulateExplosion({
      yieldMegatons,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      chargeType,
    });

  it('on the ground blasts like a nuclear surface burst of twice its yield', () => {
    // Kinney–Graham is a free-air fit: perfect reflection doubles a
    // charge on the ground. A nuclear burst's half-blast yield takes
    // that back, so the nuclear surface burst is the fit at W.
    const chemical = surface(0.0005, 'chemical');
    const nuclearTwice = surface(0.001, 'nuclear');
    expect(chemical.blast.overpressure5psiRadius as number).toBeCloseTo(
      nuclearTwice.blast.overpressure5psiRadius,
      6
    );
    expect(chemical.blast.overpressure1psiRadius as number).toBeCloseTo(
      nuclearTwice.blast.overpressure1psiRadius,
      6
    );
  });

  it('has no burns, no mass fire, no initial radiation and no pulse', () => {
    const r = surface(0.0005, 'chemical');
    expect(r.thermal.thirdDegreeBurnRadius).toBe(0);
    expect(r.thermal.secondDegreeBurnRadius).toBe(0);
    expect(r.thermal.firstDegreeBurnRadius).toBe(0);
    expect(r.firestorm.ignitionRadius).toBe(0);
    expect(r.firestorm.sustainArea).toBe(0);
    expect(r.radiation.ld50Radius).toBe(0);
    expect(r.emp.regime).toBe('NEGLIGIBLE');
  });

  it('Beirut 2020: the 5 psi ring grows by 2^(1/3) over the free-air figure', () => {
    const r = simulateExplosion(EXPLOSION_PRESETS.BEIRUT_2020.input);
    const nuclear = surface(0.0005, 'nuclear');
    expect(
      (r.blast.overpressure5psiRadius as number) / (nuclear.blast.overpressure5psiRadius as number)
    ).toBeGreaterThan(1.2);
  });
});

describe('a nuclear surface burst radiates less than an air burst (§7.101)', () => {
  it('uses the 0.18 partition on the ground and the 0.35 one in the air', () => {
    const ground = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(0) });
    const air = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(2_000) });
    expect(ground.thermal.thirdDegreeBurnRadius as number).toBeLessThan(
      air.thermal.thirdDegreeBurnRadius
    );
    expect(ground.firestorm.ignitionRadius as number).toBeLessThan(air.firestorm.ignitionRadius);
  });
});

describe('where the burst is', () => {
  const burst = (
    heightOfBurst: number,
    extra: Partial<Parameters<typeof simulateExplosion>[0]> = {}
  ) =>
    simulateExplosion({
      yieldMegatons: 1,
      groundType: 'WET_SOIL',
      heightOfBurst: m(heightOfBurst),
      ...extra,
    });

  it('in the air, on the surface, within the water, or buried', () => {
    expect(burst(500).placement.medium).toBe('air');
    expect(burst(0).placement.medium).toBe('surface');
    expect(burst(-40, { waterDepth: m(800) }).placement.medium).toBe('water');
    // Deeper than the sea, under land, or on land beside the sea.
    expect(burst(-900, { waterDepth: m(800) }).placement.medium).toBe('buried');
    expect(burst(-10).placement.medium).toBe('buried');
    expect(burst(-10, { waterDepth: m(100), shoreDistance: m(2_000) }).placement.medium).toBe(
      'buried'
    );
  });

  it('within the water: no flash, no fires, no initial radiation, and the air blast shortened by the depth', () => {
    const surface = burst(0, { waterDepth: m(800) });
    const under = burst(-40, { waterDepth: m(800) });
    // "Much of the thermal radiation and of the initial nuclear
    // radiation will be absorbed within a short distance" — Glasstone &
    // Dolan; the BAKER fireball was gone in milliseconds (§2.64).
    expect(under.thermal.thirdDegreeBurnRadius as number).toBe(0);
    expect(under.thermal.firstDegreeBurnRadius as number).toBe(0);
    expect(under.firestorm.sustainRadius as number).toBe(0);
    expect(under.radiation.ld50Radius as number).toBe(0);
    expect(under.crater.apparentDiameter as number).toBe(0);
    expect(under.blast.hobRegime).toBe('UNDERWATER');
    // §6.81: e^(−ρ·λ_d/126), λ_d = 40 m in feet over the cube root of
    // a thousand kilotonnes.
    const expected = Math.exp(-(1.025 * (40 / 0.3048)) / 10 / 126);
    expect(under.placement.airBlastDepthFactor).toBeCloseTo(expected, 9);
    // Shortened from the surface burst's radius the project's relation gives
    // (§6.53): since 17 September 2026 a burst on the surface draws its rings
    // off Glasstone & Dolan's curves at a height of zero instead, and rule 170
    // of validation/hobRules.ts left a burst in the water as it was.
    expect(
      (under.blast.overpressure5psiRadiusHob as number) /
        (surface.blast.overpressure5psiRadius as number)
    ).toBeCloseTo(expected, 9);
    expect(under.tsunami).toBeDefined();
  });

  it('a deeper charge reaches less far through the air, and the same far through the water', () => {
    const shallow = burst(-40, { waterDepth: m(800) });
    const deep = burst(-400, { waterDepth: m(800) });
    expect(deep.blast.overpressure1psiRadiusHob as number).toBeLessThan(
      shallow.blast.overpressure1psiRadiusHob
    );
    expect(deep.tsunami?.amplitudeAt100km).toBe(shallow.tsunami?.amplitudeAt100km);
  });

  it('a buried charge is drawn as a burst on the surface, and makes no wave', () => {
    const surface = burst(0, { waterDepth: m(800) });
    const belowFloor = burst(-900, { waterDepth: m(800) });
    expect(belowFloor.blast.overpressure5psiRadiusHob).toBe(
      surface.blast.overpressure5psiRadiusHob
    );
    expect(belowFloor.thermal.thirdDegreeBurnRadius).toBe(surface.thermal.thirdDegreeBurnRadius);
    expect(belowFloor.tsunami).toBeUndefined();
    const besideTheSea = burst(-10, { waterDepth: m(100), shoreDistance: m(2_000) });
    expect(besideTheSea.tsunami).toBeUndefined();
  });
});
