import { simulateExplosion } from '../events/explosion/simulate.js';
import { simulateEarthquake, EARTHQUAKE_PRESETS } from '../events/earthquake/simulate.js';
import { simulateLandslide, LANDSLIDE_PRESETS } from '../events/landslide/simulate.js';
import { dispersionAmplitudeFactor } from '../events/tsunami/extendedEffects.js';
import { m } from '../units.js';
import { dispersionDecay, dispersionParameter } from '../tsunami/dispersion.js';

/**
 * Waves that were measured, and where the simulator puts them.
 *
 * The toll harness measures what the model does to people; this one
 * measures what it does to water, and it exists because the first
 * thing outside the toll harness's reach — a half-kilotonne charge on
 * the Beirut quay — was wrong by a factor of three hundred and nobody
 * saw it until it was on the live site.
 *
 * Waves are easier to check than deaths. A death toll depends on who
 * happened to live there; a wave height was written down by people
 * with instruments, and the same charge in the same water makes the
 * same wave whoever is watching. Crossroads Baker in particular is
 * the best-instrumented explosion-generated wave there will ever be:
 * a known yield at a known depth in a lagoon of known depth, with the
 * wave height recorded at known ranges.
 *
 * What this can and cannot reach, said here rather than discovered
 * later: there is no bathymetry in a test, so nothing here propagates
 * over real seafloor. Every model figure is the source amplitude and
 * its geometric spreading, A₀·√(R₀/r), which is the law the globe's
 * veil uses. The dispersion that the published far-field rows carry
 * is applied where a row is being compared with a far-field
 * measurement, and named where it is.
 */

export interface RecordedWave {
  name: string;
  /** What was observed, in metres, and where. */
  observed: { low: number; high: number; atRangeM: number };
  source: string;
  /** What the model says at that range, in metres. */
  model: () => number;
  /** Whether a miss fails the suite. */
  gated: boolean;
  caveat?: string;
}

/** Spreading and dispersion from a source amplitude at its cavity
 *  rim — the two laws the amplitude veil uses, with no seafloor in
 *  the way. Reading them from the modules rather than restating them
 *  is the point: a harness that reconstructs the physics ends up
 *  measuring the reconstruction. */
function spreadFrom(
  sourceAmplitudeM: number,
  cavityRadiusM: number,
  rangeM: number,
  depthM: number
): number {
  const r = Math.max(rangeM, cavityRadiusM);
  const geometric = sourceAmplitudeM * Math.sqrt(cavityRadiusM / r);
  const dispersion = dispersionDecay(
    dispersionParameter({ rangeM: r, depthM, wavelengthM: 2 * cavityRadiusM })
  );
  return geometric * dispersion;
}

function burst(yieldMegatons: number, hobM: number, waterDepthM: number, rangeM: number): number {
  const r = simulateExplosion({
    yieldMegatons,
    groundType: 'WET_SOIL',
    heightOfBurst: m(hobM),
    waterDepth: m(waterDepthM),
    meanOceanDepth: m(Math.max(waterDepthM, 1_000)),
  });
  if (r.tsunami === undefined) return 0;
  return spreadFrom(r.tsunami.sourceAmplitude, r.tsunami.cavityRadius, rangeM, waterDepthM);
}

export const RECORDED_WAVES: RecordedWave[] = [
  {
    name: 'Crossroads Baker 1946, near field',
    observed: { low: 20, high: 45, atRangeM: 300 },
    source:
      'Glasstone & Dolan 1977 §6.55 and the Operation Crossroads reports: 23 kt suspended 27 m below the surface of Bikini lagoon, first wave about 30 m high at 300 m from surface zero',
    model: () => burst(0.023, -27, 60, 300),
    gated: true,
    caveat:
      'The one loud data point in the whole of explosion-generated wave physics: a known yield, at a known depth, in a lagoon of known depth, with the wave measured at known ranges. If the depth-of-burst curve is wrong anywhere, it is wrong here first.',
  },
  {
    name: 'Castle Bravo 1954',
    observed: { low: 0, high: 0, atRangeM: 300 },
    source:
      '15 Mt fired at the surface on the Bikini reef; remembered for its crater and its fallout, not for a wave',
    model: () => burst(15, 0, 50, 300),
    gated: true,
    caveat:
      'A thousand times the energy of Baker and no wave, because the charge never entered the water. Six hundred times, in fact, and this row is the one that says the curve is about placement and not about size.',
  },
  {
    name: 'Ivy Mike 1952',
    observed: { low: 0, high: 0, atRangeM: 300 },
    source: '10.4 Mt fired on the islet of Elugelab, which it vapourised; no recorded wave',
    model: () => burst(10.4, 0, 50, 300),
    gated: true,
  },
  {
    name: 'Beirut 2020',
    observed: { low: 0, high: 2, atRangeM: 300 },
    source:
      '≈ 0.5 kt TNT-equivalent on a portside quay; the harbour wave was of the order of a metre and drowned nobody',
    model: () => burst(0.0005, 0, 15, 300),
    gated: true,
    caveat: 'The row this harness was built for: it read 77 000 dead from this wave.',
  },
  {
    name: 'Crossroads Baker 1946, five kilometres out',
    observed: { low: 1, high: 3, atRangeM: 5_500 },
    source: 'Operation Crossroads wave records: about 1.8 m at 5.5 km',
    model: () => burst(0.023, -27, 60, 5_500),
    gated: true,
    caveat:
      'Baker is the only event anyone has measured with the same wave written down at two ranges, and the pair is what the dispersive decay is calibrated on: one exponent puts the model at 25.6 m where thirty were seen and 2.95 m where 1.8 were, and leaves a megathrust untouched across an ocean. Before the veil carried dispersion this row read 7.17 m.',
  },
  {
    name: 'Tōhoku 2011 at DART 21413',
    observed: { low: 0.2, high: 0.5, atRangeM: 1_500_000 },
    source:
      'DART buoy 21413, 1 500 km offshore, recorded a peak of about 30 cm; the reference is already in extendedEffects.ts',
    model: () => {
      const r = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
      if (r.tsunami === undefined) return 0;
      const a0 = r.tsunami.initialAmplitude as number;
      const r0 = Math.max((r.ruptureLength as number) / 2, 10_000);
      // A line source spreads cylindrically, and at this range the
      // published row carries the Kajiura/Watada dispersion too.
      const geometric = a0 * Math.sqrt(r0 / 1_500_000);
      return geometric * dispersionAmplitudeFactor(m(1_500_000));
    },
    gated: false,
    caveat:
      'Ungated because what it measures is a divergence already known and deliberately left open, and it puts a number on it. This project has two far-field laws for the same wave and they bracket the buoy from opposite sides: the seismic module spreads cylindrically from half the rupture and lands at 1.06 m, three and a half times the 30 cm recorded, while tohoku2011DARTReference in extendedEffects.ts spreads as 1/r from a 2 m source and lands at about 7 cm, four times under. The recorded value sits between them. Closing that gap is the dispersion-in-the-field work in the roadmap, and neither law should be bent to pass a test in the meantime.',
  },
  {
    name: 'Storegga 8200 BP on the Norwegian coast',
    observed: { low: 0.3, high: 3, atRangeM: 1_000_000 },
    source:
      'Bondevik et al. 2005 read 10–25 m of run-up from the Norwegian deposits, implying a metre-scale open-ocean wave at a thousand kilometres',
    model: () => {
      const r = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
      if (r.tsunami === null) return 0;
      return r.tsunami.amplitudeAt1000km;
    },
    gated: true,
    caveat:
      'Open-ocean amplitude inferred from run-up rather than measured, so the band is wide; it is here because it is the only prehistoric event with deposits good enough to argue from.',
  },
];

export interface WaveComparison {
  wave: RecordedWave;
  model: number;
  contains: boolean;
}

export function compareWave(wave: RecordedWave): WaveComparison {
  const model = wave.model();
  return {
    wave,
    model,
    contains: model >= wave.observed.low && model <= wave.observed.high,
  };
}
