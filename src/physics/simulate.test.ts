import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from './simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from './units.js';

describe('simulateImpact (deterministic Layer-2 evaluator)', () => {
  it('produces an identical snapshot on repeated calls (determinism)', () => {
    const a = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const b = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(a).toEqual(b);
  });

  it('Chicxulub preset: ≈1.06 × 10²⁴ J, ≈166 km complex crater, Mw ≈ 10', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    // Energy: (π/6)·3000·15000³·½·20000² ≈ 1.0603 × 10²⁴ J
    expect(r.impactor.kineticEnergy as number).toBeGreaterThan(1.0e24);
    expect(r.impactor.kineticEnergy as number).toBeLessThan(1.1e24);
    // Final crater within 10 % of the ≈180 km rim-to-rim figure.
    expect(Math.abs((r.crater.finalDiameter as number) - 180_000) / 180_000).toBeLessThan(0.1);
    // Complex morphology above the 3.2 km transition.
    expect(r.crater.morphology).toBe('complex');
    // M ≈ 10.2 by Collins et al. 2005 Eq. 40* (efficiency 10⁻⁴).
    expect(r.seismic.magnitude).toBeGreaterThan(9.5);
    expect(r.seismic.magnitude).toBeLessThan(10.5);
  });

  it('Tunguska preset: ≈3.8 × 10¹⁶ J ≈ 9 Mt TNT, simple-sized crater if it landed', () => {
    const r = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    // Energy in TNT-equivalent Mt.
    expect(r.impactor.kineticEnergyMegatons as number).toBeGreaterThan(7);
    expect(r.impactor.kineticEnergyMegatons as number).toBeLessThan(12);
    // Tunguska was an airburst — no crater formed. The hypothetical
    // ground-impact crater from the same parameters is simple.
    expect(r.crater.morphology).toBe('simple');
  });

  it('Meteor Crater preset: simple bowl about 1 km across', () => {
    const r = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    expect(r.crater.morphology).toBe('simple');
    // Collins et al. 2005: a fresh simple crater is 0.21 of its diameter
    // deep; Barringer today, eroded and partly filled, is shallower.
    expect(r.crater.depth).toBeLessThan(r.crater.finalDiameter);
  });

  it('round-trips inputs in the result so UIs can re-render from a single blob', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(r.inputs).toBe(IMPACT_PRESETS.CHICXULUB.input);
  });

  it('emits a four-ring damage footprint for every impact result', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(r.damage.craterRim).toBeGreaterThan(0);
    expect(r.damage.thirdDegreeBurn).toBeGreaterThan(0);
    // Blast rings order monotonically outward (1 psi is the widest).
    expect(r.damage.craterRim).toBeLessThan(r.damage.overpressure5psi);
    expect(r.damage.overpressure5psi).toBeLessThan(r.damage.overpressure1psi);
  });

  it('Chelyabinsk 2013 preset: ≈0.6 Mt, complete airburst, no ground crater', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHELYABINSK.input);
    // Popova et al. 2013 (Science 342): 590 ± 50 kt, main disruption at
    // ~27 km altitude, no ground crater recovered.
    expect(r.impactor.kineticEnergyMegatons as number).toBeGreaterThan(0.3);
    expect(r.impactor.kineticEnergyMegatons as number).toBeLessThan(0.7);
    expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(r.entry.burstAltitude).toBeGreaterThan(15_000);
    expect(r.entry.burstAltitude).toBeLessThan(35_000);
    expect(r.entry.energyFractionToGround).toBeLessThan(0.05);
    // Crater shrinks to a nominal few tens of metres — no meteoritic
    // crater field around Chelyabinsk other than the Chebarkul hole.
    expect(r.crater.finalDiameter as number).toBeLessThan(500);
  });

  it('Tunguska preset: an airburst 5–15 km up, and no crater', () => {
    const r = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(r.entry.burstAltitude).toBeGreaterThan(5_000);
    expect(r.entry.burstAltitude).toBeLessThan(15_000);
    expect(r.entry.energyFractionToGround).toBe(0);
    expect(r.crater.finalDiameter as number).toBe(0);
  });

  it('Meteor Crater and Chicxulub reach the ground, the iron slowed and Chicxulub barely', () => {
    // Both break up high (Collins et al. 2005 Eq. 11) and strike the
    // ground as a swarm (Eq. 20): the 50 m iron at 10.9 km/s of its 12.8,
    // the 15 km body with all but a thousandth of its energy.
    const mc = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    expect(mc.entry.regime).toBe('PARTIAL_AIRBURST');
    expect(mc.entry.energyFractionToGround).toBeGreaterThan(0.6);
    expect(mc.entry.energyFractionToGround).toBeLessThan(0.85);

    const chx = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(chx.entry.regime).not.toBe('COMPLETE_AIRBURST');
    expect(chx.entry.energyFractionToGround).toBeGreaterThan(0.99);
  });
});

describe('simulateImpact — land vs. ocean cascade', () => {
  it('land impact (no waterDepth) produces no tsunami block', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(r.tsunami).toBeUndefined();
  });

  it('Chicxulub ocean preset produces a literature-consistent K-Pg tsunami', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB_OCEAN.input);

    // The exit criterion for the Phase-18 audit: source amplitude
    // must sit inside the Range 2022 / Bralower 2018 hydrocode
    // envelope (100-1500 m for K-Pg-class) AND the cavity must be
    // sized by the WATER-COUPLED fraction of KE only (Crawford-Mader
    // 1998 / Gisler 2011 partition), not by the full post-atmospheric
    // KE. CHICXULUB_OCEAN is a 100 m carbonate-shelf strike, so
    // f_water ≈ 0.008 (almost everything punches through to the
    // seafloor) and the cavity is ≈ 25 km, not the 84 km the
    // pre-Phase-18 model produced. A₀ stays high (≈ 1.34 km) because
    // the η saturation asymptote dominates once R_C exceeds R_ref.
    expect(r.tsunami).toBeDefined();
    if (!r.tsunami) return;

    // Since rule 153 of validation/impactTsunamiRules.ts the water crater is
    // the Earth Impact Effects Program's, D_w = 0.826 (ρᵢ/ρ_w)^⅓ L^0.78
    // v^0.44 sin^⅓ θ, whatever share of the energy the shelf keeps: 150 km
    // across for this body. On a 100 m shelf its wave is held to the water
    // column, and falls as 1/r from one crater diameter out.
    expect(r.tsunami.cavityRadius as number).toBeGreaterThan(70_000);
    expect(r.tsunami.cavityRadius as number).toBeLessThan(80_000);
    expect(r.tsunami.farFieldLaw).toBe('program');
    expect(r.tsunami.rimWaveSourceAmplitude as number).toBeCloseTo(100, 6);
    expect(r.tsunami.amplitudeAt1000kmWunnemann as number).toBeCloseTo(
      (100 * 2 * (r.tsunami.cavityRadius as number)) / 1_000_000,
      6
    );

    // The Ward & Asphaug source stays as the historical row.
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(1_300);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(1_400);

    // Far-field at 1 000 km — undamped Ward 1/r reach scales as
    // A₀·R_C/r ≈ 1.34 km · 25 km / 1 000 km ≈ 33 m at continent
    // range. The Wünnemann hydrocode damping (separate function)
    // drops this further for the deep-ocean comparison.
    expect(r.tsunami.amplitudeAt1000km as number).toBeGreaterThan(20);
    expect(r.tsunami.amplitudeAt1000km as number).toBeLessThan(60);

    // Water-coupling partition exposed to the report panel.
    expect(r.tsunami.waterCouplingFraction).toBeGreaterThan(0);
    expect(r.tsunami.waterCouplingFraction).toBeLessThan(0.05);

    // Travel time at 3 000 m mean basin depth: t = 1 000 km / √(g·3 000)
    // ≈ 5 830 s (≈ 97 min). A 4 km basin would drop this to ≈ 84 min.
    expect(r.tsunami.travelTimeTo1000km as number).toBeGreaterThan(5_000);
    expect(r.tsunami.travelTimeTo1000km as number).toBeLessThan(7_000);

    // Open-ocean celerity at the 3 000 m Chicxulub-preset basin depth:
    // c = √(g · h) ≈ 171 m/s. Wavelength ≈ 2 × cavity ≈ 160 km;
    // dominant period ≈ λ/c ≈ 940 s ≈ 15 min.
    expect(r.tsunami.deepWaterCelerity as number).toBeGreaterThan(160);
    expect(r.tsunami.deepWaterCelerity as number).toBeLessThan(180);
    // Source wavelength = 2 × cavity: since rule 153 the program's water
    // crater, 150 km across, so the dominant period is ≈ 150 km / 171 m/s
    // ≈ 880 s.
    expect(r.tsunami.sourceWavelength as number).toBeCloseTo(
      2 * (r.tsunami.cavityRadius as number),
      6
    );
    expect(r.tsunami.dominantPeriod as number).toBeGreaterThan(800);
    expect(r.tsunami.dominantPeriod as number).toBeLessThan(950);
  });

  it('ocean cascade on a shallow shelf leaves crater/seismic essentially unchanged vs land', () => {
    // Phase-18: CHICXULUB_OCEAN sits on a 100 m carbonate shelf, so
    // f_seafloor ≈ exp(-100 / 12 832) ≈ 0.992. The crater shrinks by
    // less than 1 % (165.62 → 165.19 km), well within rounding for
    // popular-science output. Seismic moment scales with crater
    // volume so it tracks the same fractional change.
    const land = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const ocean = simulateImpact(IMPACT_PRESETS.CHICXULUB_OCEAN.input);
    const craterRatio =
      (ocean.crater.finalDiameter as number) / (land.crater.finalDiameter as number);
    expect(craterRatio).toBeGreaterThan(0.99);
    expect(craterRatio).toBeLessThanOrEqual(1.0);
    expect(ocean.seismic.magnitude).toBeCloseTo(land.seismic.magnitude, 1);
  });

  it('5 000 km tsunami amplitude is 1/5 of the 1 000 km amplitude (1/r decay)', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB_OCEAN.input);
    if (!r.tsunami) {
      expect.fail('expected tsunami block for ocean preset');
      return;
    }
    const ratio = (r.tsunami.amplitudeAt1000km as number) / (r.tsunami.amplitudeAt5000km as number);
    expect(ratio).toBeCloseTo(5, 6);
  });

  it("a water crater wider than the Earth stops at the antipode, and the wave stands at the water's depth", () => {
    // The program's crater grows as L^0.78: for a 10 000 km body at 40 km/s
    // it would be 38 000 km across. The invariants sweep of 16 September 2026
    // found it, and the crater's half, past the antipode.
    const r = simulateImpact({
      impactorDiameter: m(10_000_000),
      impactVelocity: mps(40_000),
      impactorDensity: kgPerM3(5_000),
      targetDensity: kgPerM3(2_500),
      impactAngle: degreesToRadians(deg(45)),
      waterDepth: m(4_000),
    });
    if (!r.tsunami) {
      expect.fail('expected a tsunami block');
      return;
    }
    const halfCircumference = Math.PI * 6_371_000;
    expect(r.tsunami.farFieldReferenceRadius as number).toBeCloseTo(halfCircumference, 0);
    expect(r.tsunami.cavityRadius as number).toBeLessThanOrEqual(halfCircumference);
    expect(r.tsunami.amplitudeAt1000kmWunnemann as number).toBeCloseTo(4_000, 6);
    expect(r.tsunami.amplitudeAt5000kmWunnemann as number).toBeCloseTo(4_000, 6);
  });

  it('airburst over ocean (gf < 0.10) emits no tsunami block', () => {
    // Chelyabinsk-class superbolide on a 4 km basin: the Chyba pancake
    // model returns COMPLETE_AIRBURST with energyFractionToGround ≈
    // 0.02, well below the 0.10 surface-coupling threshold required
    // to seed the Ward & Asphaug cavity. Without this guard, the
    // simulator would dump the bolide's full ≈ 0.4 Mt KE into a
    // water-cavity formula that assumes a piston-coupling regime,
    // producing a phantom kilometre-scale wave.
    const r = simulateImpact({
      ...IMPACT_PRESETS.CHELYABINSK.input,
      waterDepth: m(100),
      meanOceanDepth: m(4_000),
    });
    expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(r.entry.energyFractionToGround).toBeLessThan(0.1);
    expect(r.tsunami).toBeUndefined();
  });

  it('ejecta asymmetry heuristic: 45° impact → symmetric blanket, 15° → ~0.67 stretch', () => {
    // Chicxulub at 45° canonical angle: asymmetryFactor = 0.
    const sym = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(sym.ejecta.asymmetryFactor).toBe(0);
    expect(sym.ejecta.downrangeOffset as number).toBe(0);

    // Oblique surface-impactor at 15° grazing — must reach the ground
    // intact so a crater (and therefore an asymmetric ejecta blanket)
    // exists. Phase 14 explicitly suppresses the crater for high-
    // altitude airbursts (Tunguska / Chelyabinsk-class), so this
    // assertion uses a 1 km bolide at 18° instead, which is safely
    // INTACT regime and exercises the same asymmetry formula. The
    // pre-Phase-14 version of this test used Chelyabinsk and started
    // failing once the phantom-crater suppression landed.
    const oblique = simulateImpact({
      impactorDiameter: m(1000),
      impactVelocity: mps(20000),
      impactorDensity: kgPerM3(3000),
      targetDensity: kgPerM3(2700),
      impactAngle: degreesToRadians(deg(18)),
    });
    expect(oblique.entry.regime).not.toBe('COMPLETE_AIRBURST');
    expect(oblique.ejecta.asymmetryFactor).toBeGreaterThan(0.55);
    expect(oblique.ejecta.asymmetryFactor).toBeLessThan(0.65);
    expect(oblique.ejecta.downrangeOffset as number).toBeGreaterThan(0);
  });

  it('impactAzimuthDeg defaults to 90° (east-bound) but echoes user override', () => {
    const def = simulateImpact(IMPACT_PRESETS.CHELYABINSK.input);
    expect(def.ejecta.azimuthDeg).toBe(90);

    const overridden = simulateImpact({
      ...IMPACT_PRESETS.CHELYABINSK.input,
      impactAzimuthDeg: 250,
    });
    expect(overridden.ejecta.azimuthDeg).toBe(250);
  });

  it('ocean cavity radius scales with water-coupled fraction of KE (Phase-18)', () => {
    // Pre-Phase-18 the cavity used the full post-atmospheric KE
    // regardless of water depth. Phase-18 routes only `f_water · KE`
    // into the cavity, where f_water = 1 − exp(-d_water / d_critical)
    // and d_critical = β·L·√(ρ_i/ρ_water). For the Chicxulub shelf
    // preset (100 m water on a 15 km impactor) f_water ≈ 0.008, so
    // the cavity is ≈ 25 km — much smaller than the 84 km the old
    // model produced.
    const land = IMPACT_PRESETS.CHICXULUB.input;
    const ocean = IMPACT_PRESETS.CHICXULUB_OCEAN.input;
    const r = simulateImpact(ocean);
    expect(r.entry.energyFractionToGround).toBeGreaterThan(0.99);
    if (!r.tsunami) {
      expect.fail('expected tsunami for Chicxulub ocean preset');
      return;
    }
    // The partition still reads the shelf's share, for the seafloor crater
    // and the Ward row; the wave, since rule 153, is the program's and does
    // not take it.
    expect(r.tsunami.waterCouplingFraction).toBeLessThan(0.05);
    // Sanity: same impactor on land has no tsunami at all.
    expect(simulateImpact(land).tsunami).toBeUndefined();
  });

  it('Phase-18 deep-ocean strike suppresses the seafloor crater (Eltanin regime)', () => {
    // 1 km stony asteroid in a 5 km Pacific deep-ocean basin: the
    // Crawford-Mader d_critical = 0.5 · 1 km · √(3000/1025) ≈ 0.86 km
    // gives f_seafloor = exp(-5 km / 0.86 km) ≈ 0.003. The seafloor
    // crater therefore shrinks to ≈ 25 % of the equivalent land
    // crater (D ∝ KE^(1/3.4) so D drops by 0.003^0.294 ≈ 0.18×),
    // matching the Eltanin asteroid's geological "no observable
    // crater" record (1-4 km, 5 km Pacific basin, 2.5 Ma; Gersonde
    // et al. 1997 Nature 390:357). Tsunami branch fires fully.
    const land = simulateImpact({
      impactorDiameter: m(1_000),
      impactVelocity: mps(20_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(45)),
    });
    const ocean = simulateImpact({
      impactorDiameter: m(1_000),
      impactVelocity: mps(20_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(45)),
      waterDepth: m(5_000),
      meanOceanDepth: m(5_000),
    });
    const craterRatio =
      (ocean.crater.finalDiameter as number) / (land.crater.finalDiameter as number);
    // Aggressive suppression — ocean crater under 25 % of land crater.
    expect(craterRatio).toBeLessThan(0.25);
    // Tsunami branch fires with f_water close to 1.
    expect(ocean.tsunami).toBeDefined();
    if (ocean.tsunami) {
      expect(ocean.tsunami.waterCouplingFraction).toBeGreaterThan(0.99);
    }
  });

  it('every IMPACT_PRESETS entry simulates without throwing and yields plausible KE', () => {
    // Smoke test: catches typos in newly-added presets. All eight
    // canonical impactors should produce a positive kinetic energy
    // that fits into the physical envelope of "ranger from ≈ kt
    // chemical fall (Sikhote-Alin) up to ≈ 10²⁴ J K-Pg dinosaur
    // killer (Chicxulub)".
    for (const [id, preset] of Object.entries(IMPACT_PRESETS)) {
      const r = simulateImpact(preset.input);
      expect(r.impactor.kineticEnergy as number, `${id}: kineticEnergy positive`).toBeGreaterThan(
        0
      );
      expect(r.impactor.kineticEnergy as number, `${id}: kineticEnergy < 1e25 J`).toBeLessThan(
        1e25
      );
    }
  });

  it('damage rings for an airburst event match the atmospheric airburst, not the full-KE surface burst', () => {
    // Tunguska is an airburst: the ground sees shock waves and burns
    // from the burst at ≈ 10 km, NOT from a 9 Mt surface burst. The
    // simulator's `damage.*` rings must therefore be the airburst's
    // (the Earth Impact Effects Program's air blast at the burst
    // altitude), not surface ring radii for the full energy. The values
    // agree exactly with the entry block's radii — the max() collapses to
    // the airburst component because nothing reaches the ground.
    const r = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(r.entry.regime).not.toBe('INTACT');
    expect(r.damage.overpressure5psi).toBe(r.entry.shockWaveRadii.fivePsi);
    expect(r.damage.overpressure1psi).toBe(r.entry.shockWaveRadii.onePsi);
    expect(r.damage.lightDamage).toBe(r.entry.shockWaveRadii.lightDamage);
    expect(r.damage.thirdDegreeBurn).toBe(r.entry.flashBurnRadii.thirdDegree);
  });

  it('damage rings for a body that reaches the ground come from the surface burst', () => {
    // Chicxulub keeps all but a thousandth of its energy through the
    // air: the air's share draws smaller rings than the ground's, and
    // `damage.*` takes the larger.
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    expect(r.entry.regime).not.toBe('COMPLETE_AIRBURST');
    expect(r.entry.shockWaveRadii.fivePsi as number).toBeLessThan(r.damage.overpressure5psi);
    expect(r.damage.overpressure5psi as number).toBeGreaterThan(0);
    expect(r.damage.thirdDegreeBurn as number).toBeGreaterThan(0);
  });
});
