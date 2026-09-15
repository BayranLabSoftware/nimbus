#!/usr/bin/env python3
"""Reference values for rule 71 of src/physics/validation/residualRules.ts.

With the OpenQuake Engine (GEM Foundation, AGPL-3.0-or-later):
  - Boore et al. 2014's between-event tau and within-event phi for PGA
    (BooreEtAl2014) on a grid of magnitudes, Joyner-Boore distances and Vs30;
  - Abrahamson, Gregor & Addo 2016's intraslab tau and phi for PGA
    (AbrahamsonEtAl2015SSlab);
  - Jayaram & Baker 2009's correlation for PGA (jbcorrelation), with and
    without Vs30 clustering, at a set of distances.
With SciPy, the mean of that correlation over two points drawn uniformly and
independently in a disc, as the one-dimensional integral over their distance
of the disc's set covariance, on a grid of radii; and, printed only, a Monte
Carlo estimate of the same mean to check the integral.

Writes src/physics/validation/residualReference.ts. Nothing here runs Nimbus.

    <python with openquake.engine installed> scripts/benchmark/residual-reference.py
"""

import math
from pathlib import Path

import numpy as np
from scipy import integrate
from openquake.baselib import __version__ as OQ_VERSION
from openquake.hazardlib.contexts import ContextMaker, RuptureContext
from openquake.hazardlib.correlation import jbcorrelation
from openquake.hazardlib.gsim.abrahamson_2015 import AbrahamsonEtAl2015SSlab
from openquake.hazardlib.gsim.boore_2014 import BooreEtAl2014
from openquake.hazardlib.imt import PGA

ROOT = Path(__file__).resolve().parents[2]
MAGNITUDES = [3.0, 4.5, 4.8, 5.0, 5.3, 5.5, 6.0, 7.0, 8.5]
RJB_KM = [0.0, 50.0, 110.0, 150.0, 270.0, 400.0]
# Not 225 m/s itself: there OpenQuake subtracts the site term twice, once
# for Vs30 <= v1 and once more for v1 <= Vs30 <= v2 (boore_2014.py).
VS30 = [150.0, 224.0, 226.0, 250.0, 300.0, 450.0, 760.0, 1500.0]
DISTANCES_KM = [0.0, 1.0, 5.0, 8.5, 20.0, 40.7, 100.0, 300.0]
RADII_KM = [0.1, 1.0, 3.0, 10.0, 25.0, 50.0, 100.0, 200.0, 400.0, 800.0, 1600.0]
RANGES_KM = [8.5, 40.7]


def stds(gsim, mag, rjb, vs30, depth=10.0):
    n = len(rjb)
    ctx = RuptureContext()
    ctx.sids = np.arange(n)
    ctx.mag = float(mag)
    ctx.rake, ctx.dip, ctx.ztor, ctx.width = 0.0, 90.0, 0.0, 10.0
    ctx.hypo_depth = float(depth)
    ctx.vs30 = np.full(n, float(vs30))
    ctx.vs30measured = np.zeros(n, bool)
    ctx.backarc = np.zeros(n, bool)
    ctx.rjb = np.asarray(rjb, float)
    ctx.rrup = np.hypot(ctx.rjb, depth)
    ctx.rhypo = np.hypot(ctx.rjb, depth)
    ctx.rx = ctx.rjb
    ctx.ry0 = np.zeros(n)
    cm = ContextMaker("*", [gsim], dict(imtls={"PGA": [0]}))
    _mean, sig, tau, phi = cm.get_mean_stds([ctx])
    return tau[0, 0], phi[0, 0], sig[0, 0]


def disc_mean_correlation(radius, rng_km):
    """E[exp(-3h/b)] for two uniform points in a disc of radius R."""
    area = math.pi * radius * radius
    k = 3.0 / rng_km

    def covariance(u):
        x = min(1.0, u / (2.0 * radius))
        return 2.0 * radius * radius * math.acos(x) - (u / 2.0) * math.sqrt(max(0.0, 4.0 * radius * radius - u * u))

    def integrand(u):
        return 2.0 * math.pi * u * covariance(u) * math.exp(-k * u) / (area * area)

    upper = 2.0 * radius
    value, _ = integrate.quad(integrand, 0.0, upper, epsabs=0.0, epsrel=1e-13, limit=500, points=[min(upper, 1.0 / k), min(upper, 10.0 / k)] if upper > 10.0 / k else None)
    return value


def monte_carlo_check(radius, rng_km, pairs=2_000_000, seed=7):
    gen = np.random.default_rng(seed)
    r1 = radius * np.sqrt(gen.random(pairs))
    t1 = 2 * np.pi * gen.random(pairs)
    r2 = radius * np.sqrt(gen.random(pairs))
    t2 = 2 * np.pi * gen.random(pairs)
    h = np.hypot(r1 * np.cos(t1) - r2 * np.cos(t2), r1 * np.sin(t1) - r2 * np.sin(t2))
    return float(np.mean(np.exp(-3.0 * h / rng_km)))


def main():
    bssa = BooreEtAl2014()
    boore_rows = []
    for mag in MAGNITUDES:
        for vs30 in VS30:
            tau, phi, _sig = stds(bssa, mag, RJB_KM, vs30)
            for i, rjb in enumerate(RJB_KM):
                boore_rows.append((mag, rjb, vs30, float(tau[i]), float(phi[i])))

    slab = AbrahamsonEtAl2015SSlab()
    slab_rows = []
    for mag in [6.0, 7.5]:
        for vs30 in [250.0, 760.0]:
            tau, phi, _sig = stds(slab, mag, [0.0, 100.0], vs30, depth=100.0)
            slab_rows.append((mag, vs30, float(tau[0]), float(phi[0])))

    corr_rows = []
    distances = np.asarray(DISTANCES_KM)
    for clustering in (False, True):
        values = jbcorrelation(distances, PGA(), vs30_clustering=clustering)
        for d, v in zip(DISTANCES_KM, values):
            corr_rows.append((1 if clustering else 0, d, float(v)))

    disc_rows = []
    for rng_km in RANGES_KM:
        for radius in RADII_KM:
            value = disc_mean_correlation(radius, rng_km)
            disc_rows.append((radius, rng_km, value))
            if radius in (3.0, 50.0, 400.0):
                mc = monte_carlo_check(radius, rng_km)
                print(f"disc R={radius} b={rng_km}: integral {value:.6f}, Monte Carlo {mc:.6f}")

    fmt = lambda rows: "\n".join("    [" + ", ".join(repr(x) for x in row) + "]," for row in rows)
    body = f"""// Generated by scripts/benchmark/residual-reference.py with OpenQuake
// {OQ_VERSION} (GEM Foundation, AGPL-3.0-or-later) and SciPy. Do not edit by hand.

/** Rule 71's references. `boore2014`: [magnitude, R_JB (km), Vs30 (m/s), tau,
 *  phi] for PGA; `abrahamson2016Slab`: [magnitude, Vs30, tau, phi];
 *  `jb2009`: [Vs30 clustering (1) or not (0), distance (km), correlation];
 *  `discMeanCorrelation`: [disc radius (km), range b (km), mean correlation
 *  of two uniform points]. */
// prettier-ignore
export const RESIDUAL_REFERENCE = {{
  boore2014: [
{fmt(boore_rows)}
  ],
  abrahamson2016Slab: [
{fmt(slab_rows)}
  ],
  jb2009: [
{fmt(corr_rows)}
  ],
  discMeanCorrelation: [
{fmt(disc_rows)}
  ],
}} as const;
"""
    out = ROOT / "src" / "physics" / "validation" / "residualReference.ts"
    out.write_text(body)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
