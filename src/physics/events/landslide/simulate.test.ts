import { describe, expect, it } from 'vitest';
import {
  impulseWaveAmplitudes,
  outsideTestedRange,
  slideFromVolume,
} from '../../effects/impulseWave.js';
import { m } from '../../units.js';
import { SOURCE_AMPLITUDE_CEILING } from '../volcano/tsunami.js';
import { LANDSLIDE_PRESETS, simulateLandslide } from './simulate.js';

describe('simulateLandslide', () => {
  it('produces a deterministic snapshot on repeated calls', () => {
    const a = simulateLandslide(LANDSLIDE_PRESETS.ANAK_KRAKATAU_2018.input);
    const b = simulateLandslide(LANDSLIDE_PRESETS.ANAK_KRAKATAU_2018.input);
    expect(a).toEqual(b);
  });

  it('Storegga preset keeps the 2-15 m source amplitude its prefactor was set on', () => {
    // Submarine regime → K_submarine = 0.005, set on a 5-10 m source
    // amplitude that was credited to Bondevik et al. 2005. The paper
    // reads run-up from deposits (10-12 m in western Norway) and gives
    // no source amplitude, so this pins a calibration, not a record —
    // a declared gap of the validation report. The previous test
    // pinned the unphysical 126 m produced by the rigid-block K = 0.10
    // prefactor.
    const r = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(2);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(15);
  });

  it('Storegga preset reaches metre-scale amplitudes at 1 000 km via the slide-footprint cavity', () => {
    // The metre-scale band is this project's inference from the run-up
    // Bondevik et al. 2005 read from deposits, not a figure they give.
    // The 1/r far-field decay needs the actual slide-footprint radius
    // (≈ 96 km from the 290 × 100 km Bondevik 2005 Fig. 1 outline),
    // NOT the V^(1/3) generic estimate (≈ 14 km). Pre-fix the cavity
    // was 12.6 m (back-derived from η₀), giving sub-millimetre
    // amplitudes at trans-Atlantic ranges. With the proper cavity:
    //   - cavityRadius ≈ 96 km
    //   - amp @ 1000 km ≈ 0.6-1.0 m (deep-water; Sula coast at
    //     ~600 km gets 1.5-2 m before Norwegian-shelf shoaling × 2-3
    //     and run-up ×2-3, reproducing the 10 m sediment scour).
    const r = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.cavityRadius as number).toBeGreaterThan(50_000);
    expect(r.tsunami.cavityRadius as number).toBeLessThan(200_000);
    expect(r.tsunami.amplitudeAt1000km as number).toBeGreaterThan(0.3);
    expect(r.tsunami.amplitudeAt1000km as number).toBeLessThan(3);
  });

  it('Vaiont preset stands ≈ 162 m above the lake, the 140 m over the dam crest of Genevois 2005', () => {
    // Confined-basin formula η = V/A × 1.8 = 2.7e8/3e6 × 1.8 = 162 m,
    // under the 238 m of water. The wave crested 140 m above the dam
    // top, which stood 25 m above the lake: 165 m. Open-ocean Watts
    // (used by an earlier version) gave only 56 m for this event
    // because radial spreading does not apply in a 3 km² reservoir.
    const r = simulateLandslide(LANDSLIDE_PRESETS.VAIONT_1963.input);
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.sourceAmplitude as number).toBeCloseTo(162, 0);
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(125);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(165);
  });

  it("Lituya preset draws the impulse wave manual's crest, and still falls far short of the 524 m run-up", () => {
    // Until 17 September 2026 the preset sat on the project's ceiling, 0.4 ×
    // 120 m = 48 m, which decided the wave outright (B-039). It is the manual's
    // first crest now, with no ceiling: 94 m on the closures — a slide of
    // V^(1/3) thickness and width reaching 45 m/s, where Fritz et al. give it
    // 110 m/s — and outside the manual's experiments on S, M, V, D and P, which
    // the result names. The fjord's far wall is what made 524 m of run-up, and
    // no generation relation reaches that.
    const r = simulateLandslide(LANDSLIDE_PRESETS.LITUYA_BAY_1958.input);
    expect(r.waveLaw).toBe('impulseWaveManual');
    expect(r.tsunami).not.toBeNull();
    if (r.tsunami === null) return;
    expect(r.tsunami.sourceAmplitude as number).toBeCloseTo(93.9, 1);
    expect(r.tsunami.sourceAmplitude as number).toBeGreaterThan(48);
    expect(r.tsunami.sourceAmplitude as number).toBeLessThan(524 / 4);
    expect(r.impulseWave?.outsideTestedRange).toEqual(['S', 'M', 'V', 'D', 'P']);
  });

  describe('Watts submerged-density-contrast factor (slideDensity)', () => {
    // Deep basin so the McCowan breaking cap (0.4·depth) never binds and
    // the density factor is visible in the source amplitude.
    // The project law, named: above the water the impulse wave manual reads the
    // density as a mass, not a buoyancy (rule 163 of impulseWaveRules.ts).
    const baseInput = {
      volumeM3: 1e7,
      slopeAngleDeg: 20,
      meanOceanDepth: m(4_000),
      regime: 'subaerial' as const,
      waveLaw: 'project' as const,
    };
    const sourceAmp = (slideDensity?: number): number => {
      const r = simulateLandslide(
        slideDensity === undefined ? baseInput : { ...baseInput, slideDensity }
      );
      return (r.tsunami?.sourceAmplitude as number | undefined) ?? 0;
    };

    it('default (omitted) equals the subaerial reference density 2500', () => {
      // Factor 1 at the reference density → historic calibration intact.
      expect(sourceAmp()).toBeCloseTo(sourceAmp(2_500), 6);
    });

    it('a denser slide makes a bigger wave; a softer one a smaller wave', () => {
      const dflt = sourceAmp();
      expect(sourceAmp(2_900)).toBeGreaterThan(dflt); // dense basalt block
      expect(sourceAmp(1_500)).toBeLessThan(dflt); // soft sediment
    });

    it('a near-neutrally-buoyant slide (ρ ≈ seawater) makes essentially no wave', () => {
      expect(sourceAmp(1_025)).toBeLessThan(0.5);
      expect(sourceAmp(1_000)).toBe(0); // less dense than water → buoyant
    });
  });

  it('characteristicLength matches V^(1/3)', () => {
    const r = simulateLandslide({ volumeM3: 1e9 });
    expect(r.characteristicLength as number).toBeCloseTo(1_000, 1);
  });

  it('the regime is the coupling, not a tag: the same slide falling in is 80 times taller', () => {
    // Until 14 September 2026 the input's comment called the regime
    // metadata. It picks K = 0.4 or 0.005. Deep water, so neither wave
    // meets the 0.4·h breaking cap, and no density, so both sit at
    // their reference.
    // Under the project law, which both regimes kept until 17 September 2026;
    // above the water the impulse wave manual now draws the wave instead.
    const slide = {
      volumeM3: 1e8,
      slopeAngleDeg: 20,
      meanOceanDepth: m(10_000),
      waveLaw: 'project' as const,
    };
    const above = simulateLandslide({ ...slide, regime: 'subaerial' }).tsunami;
    const below = simulateLandslide({ ...slide, regime: 'submarine' }).tsunami;
    expect(above).not.toBeNull();
    expect(below).not.toBeNull();
    if (above === null || below === null) return;
    expect((above.sourceAmplitude as number) / (below.sourceAmplitude as number)).toBeCloseTo(
      80,
      6
    );
  });

  it('regime defaults to submarine when unspecified', () => {
    const r = simulateLandslide({ volumeM3: 1e9 });
    expect(r.regime).toBe('submarine');
  });

  it('returns a tsunami null when the inputs are ill-formed', () => {
    expect(simulateLandslide({ volumeM3: 0 }).tsunami).toBeNull();
    expect(simulateLandslide({ volumeM3: 1e9, slopeAngleDeg: 0 }).tsunami).toBeNull();
  });

  it('every LANDSLIDE_PRESETS entry simulates without throwing', () => {
    // Smoke test for newly-added presets (Vaiont, Elm). The Watts
    // 2000 source amplitude is positive for any positive volume
    // with a non-zero slope.
    for (const [id, preset] of Object.entries(LANDSLIDE_PRESETS)) {
      const r = simulateLandslide(preset.input);
      expect(r.characteristicLength as number, `${id}: char length > 0`).toBeGreaterThan(0);
      expect(r.regime, `${id}: regime defined`).toBeDefined();
    }
  });
});

describe('the impulse wave manual as the law that makes the wave (rule 163)', () => {
  const law = 'impulseWaveManual' as const;
  const lituya = { ...LANDSLIDE_PRESETS.LITUYA_BAY_1958.input, waveLaw: law };

  it("draws the manual's first crest for a subaerial slide in open water, with no ceiling", () => {
    const r = simulateLandslide(lituya);
    const closure = slideFromVolume({
      volumeM3: 3e7,
      angleDeg: 35,
      depthM: 120,
      densityKgM3: 2_500,
    });
    const crest = impulseWaveAmplitudes(closure.slide).firstCrest;
    expect(Number(r.tsunami?.sourceAmplitude ?? 0)).toBeCloseTo(crest, 9);
    // Above the 0.4 of the depth the project law is held to.
    expect(crest / 120).toBeGreaterThan(SOURCE_AMPLITUDE_CEILING);
    expect(r.impulseWave?.firstCrestM).toBeCloseTo(crest, 9);
    expect(r.impulseWave?.held).toBe(false);
  });

  it('names the limits the slide falls outside of, and what it had to close', () => {
    const r = simulateLandslide(lituya);
    const closure = slideFromVolume({
      volumeM3: 3e7,
      angleDeg: 35,
      depthM: 120,
      densityKgM3: 2_500,
    });
    expect(r.impulseWave?.outsideTestedRange).toEqual(outsideTestedRange(closure.slide));
    expect(r.impulseWave?.closed).toEqual({
      thickness: true,
      width: true,
      velocity: 'fromVolume',
    });
    const given = simulateLandslide({
      ...lituya,
      slideThicknessM: 90,
      slideWidthM: 800,
      impactVelocityMS: 110,
    });
    expect(given.impulseWave?.closed).toEqual({
      thickness: false,
      width: false,
      velocity: 'given',
    });
    expect(given.impulseWave?.impactVelocityMS).toBe(110);
  });

  it('keeps the basin formula in a confined basin, and says nothing of the manual there', () => {
    const vaiont = simulateLandslide({ ...LANDSLIDE_PRESETS.VAIONT_1963.input, waveLaw: law });
    const project = simulateLandslide(LANDSLIDE_PRESETS.VAIONT_1963.input);
    expect(Number(vaiont.tsunami?.sourceAmplitude)).toBe(Number(project.tsunami?.sourceAmplitude));
    expect(vaiont.impulseWave).toBeUndefined();
  });

  it('keeps Watts for a submarine slide', () => {
    const storegga = simulateLandslide({
      ...LANDSLIDE_PRESETS.STOREGGA_8200_BP.input,
      waveLaw: law,
    });
    const project = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(Number(storegga.tsunami?.sourceAmplitude)).toBe(
      Number(project.tsunami?.sourceAmplitude)
    );
    expect(storegga.impulseWave).toBeUndefined();
  });

  it('makes no wave where the bed friction holds the slide, and says why', () => {
    // tan δ = 0.3: a slide on 15° never gathers speed (Eq. 3.5), so the manual
    // gives nothing — and nothing falls back on another law.
    const r = simulateLandslide({
      volumeM3: 1e8,
      slopeAngleDeg: 15,
      meanOceanDepth: m(300),
      regime: 'subaerial',
      waveLaw: law,
    });
    expect(r.tsunami).toBeNull();
    expect(r.impulseWave?.held).toBe(true);
    expect(r.impulseWave?.impactVelocityMS).toBe(0);
    const given = simulateLandslide({
      volumeM3: 1e8,
      slopeAngleDeg: 15,
      meanOceanDepth: m(300),
      regime: 'subaerial',
      waveLaw: law,
      impactVelocityMS: 30,
    });
    expect(Number(given.tsunami?.sourceAmplitude ?? 0)).toBeGreaterThan(0);
  });

  it('says how much the regime decides under the law it runs', () => {
    const r = simulateLandslide(lituya);
    expect(Number(r.regimeSensitivity?.subaerialAmplitude)).toBeCloseTo(
      Number(r.tsunami?.sourceAmplitude),
      9
    );
    const below = simulateLandslide({ ...lituya, regime: 'submarine' });
    expect(Number(r.regimeSensitivity?.submarineAmplitude)).toBeCloseTo(
      Number(below.tsunami?.sourceAmplitude),
      9
    );
  });

  it('grows with the volume', () => {
    let last = 0;
    for (const volumeM3 of [1e5, 1e6, 1e7, 1e8, 1e9, 1e10]) {
      const a = Number(simulateLandslide({ ...lituya, volumeM3 }).tsunami?.sourceAmplitude ?? 0);
      expect(a).toBeGreaterThan(last);
      last = a;
    }
  });
});
