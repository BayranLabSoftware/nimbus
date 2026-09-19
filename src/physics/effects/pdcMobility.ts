import type { Meters } from '../units.js';
import { m } from '../units.js';

/**
 * How mobile a pyroclastic current is, from the volume that made it.
 *
 * The Heim coefficient H/L — the vertical drop over the runout, which is the
 * energy line's slope — falls with the size of the flow. That has been known
 * since Heim (1932) and was quantified for pyroclastic density currents by
 *
 *   Ogburn, S., Berger, J., Calder, E., Lopes, D., Patra, A., Pitman, E.,
 *   Rutarindwa, R., Spiller, E. & Wolpert, R. (2016). "Pooling strength amongst
 *   limited datasets using hierarchical Bayesian analysis, with application to
 *   pyroclastic density current mobility metrics." Statistics in Volcanology
 *   2: 1–26. doi:10.5038/2163-338X.2.1
 *
 * whose model is a straight line in the logarithms,
 *
 *     log10(H/L) = α + β · log10(V / 10^5.5),
 *
 * the origin of the volume axis being 10^5.5 m³ — the paper's own choice,
 * "roughly where the slope and intercept are least correlated". Its Table 1
 * fits that line at five volcanoes on dome-collapse block-and-ash flows from
 * the FlowDat database, and those five pairs are transcribed below. Nothing
 * here is fitted by this project.
 *
 * Two things this module does not do, said here because the numbers it returns
 * invite both. It does not know which volcano it is standing on, so it takes the
 * median of the five and carries their spread as a band — the paper's own
 * hierarchical posterior, which is what a pooled estimate should come from, is
 * published as figures and not as coefficients. And it does not extrapolate
 * quietly: `pdcMobilityHoverL` answers for any volume, and
 * {@link OGBURN_2016_MOBILITY.fittedDecades} says where the data were, so a
 * caller drawing a Tambora at 1.4 × 10^11 m³ can see that it is five and a half
 * orders of magnitude past them and in a different kind of current.
 */

/** The volume the paper measures its intercept at (m³): 10^5.5. */
export const OGBURN_X_ORIGIN_M3 = 10 ** 5.5;

export interface MobilityFit {
  /** Slope β of log10(H/L) against log10(V / 10^5.5). */
  slope: number;
  /** Intercept α: log10(H/L) at the origin volume. */
  intercept: number;
  /** Mean square residual of the paper's own fit. */
  msr: number;
  /** Whether that volcano's flows are channelized, as the paper groups them. */
  channelized: boolean;
}

/** Table 1 of Ogburn et al. (2016), transcribed. */
export const OGBURN_2016_MOBILITY = {
  fits: {
    colima: { slope: -0.224, intercept: -0.386, msr: 66.5e-4, channelized: false },
    merapi: { slope: -0.183, intercept: -0.384, msr: 95.2e-4, channelized: false },
    soufriereHills: { slope: -0.201, intercept: -0.531, msr: 24.8e-4, channelized: true },
    unzen: { slope: -0.156, intercept: -0.493, msr: 26.3e-4, channelized: true },
    semeru: { slope: -0.314, intercept: -0.172, msr: 24.3e-4, channelized: true },
  } as Readonly<Record<string, MobilityFit>>,
  /** Where the data are, in log10 of cubic metres: dome-collapse block-and-ash
   *  flows, 14 to 80 per volcano, about the origin at 10^5.5. The paper prints
   *  the range only in its Figure 1, so this is the origin and not a measured
   *  envelope, and callers must treat anything far from it as extrapolation. */
  fittedAboutLog10M3: 5.5,
  source: 'Ogburn et al. (2016), Statistics in Volcanology 2: 1–26, Table 1',
} as const;

const FITS = Object.values(OGBURN_2016_MOBILITY.fits);

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

/** The pair a model that does not know its volcano uses: the median of the
 *  five. */
export const POOLED_FIT: MobilityFit = {
  slope: median(FITS.map((f) => f.slope)),
  intercept: median(FITS.map((f) => f.intercept)),
  msr: median(FITS.map((f) => f.msr)),
  channelized: true,
};

/** log10(H/L) for one fit at a volume in m³. */
function log10HoverL(fit: MobilityFit, volumeM3: number): number {
  return fit.intercept + fit.slope * Math.log10(volumeM3 / OGBURN_X_ORIGIN_M3);
}

/**
 * The Heim coefficient H/L of a current of this bulk volume, from the pooled
 * fit. Zero for a volume that is not there, so a caller cannot divide by it.
 */
export function pdcMobilityHoverL(volumeM3: number, fit: MobilityFit = POOLED_FIT): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  return 10 ** log10HoverL(fit, volumeM3);
}

/**
 * Rule 224's band: the spread of the five fitted lines at this volume, as a
 * standard deviation in natural logarithms, widened by the within-volcano
 * scatter the paper reports. In sample for the paper; this project has not
 * scored it on anything.
 */
export function pdcMobilityBandLn(volumeM3: number): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  const logs = FITS.map((f) => log10HoverL(f, volumeM3));
  const mu = logs.reduce((a, b) => a + b, 0) / logs.length;
  const between = logs.reduce((a, b) => a + (b - mu) ** 2, 0) / (logs.length - 1);
  const within = median(FITS.map((f) => f.msr));
  return Math.sqrt(between + within) * Math.LN10;
}

/**
 * The reach of the energy line: the drop height over the mobility. The drop
 * height is the caller's — this module does not decide what falls how far.
 */
export function pdcReachFromEnergyLine(dropHeightM: Meters, volumeM3: number): Meters {
  const h = dropHeightM as number;
  const hOverL = pdcMobilityHoverL(volumeM3);
  if (!Number.isFinite(h) || h <= 0 || hOverL <= 0) return m(0);
  return m(h / hOverL);
}
