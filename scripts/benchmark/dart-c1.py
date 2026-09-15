#!/usr/bin/env python3
"""Model C1 of BM-05 (docs/BENCHMARK_PROTOCOL.md, "After the campaign: the far
wave of a megathrust"): Okada's deformation of a uniform slip over the rupture
Nimbus builds (benchmark/dart/c0.json), on the thrust plane's strike and dip,
rake 90, top at 5 km, centred on the epicentre, propagated with the exact
solution of the linear non-dispersive shallow-water equations on a flat ocean
(Poisson's formula for the 2-D wave equation), at the distance and azimuth of
every record of benchmark/dart/records.json that one of the four readings
keeps.

Needs numpy, scipy and clawpack (for clawpack.geoclaw.dtopotools, Okada 1985):

    python3 scripts/benchmark/dart-c1.py

Writes benchmark/dart/c1.json.
"""

import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from clawpack.geoclaw import dtopotools
from scipy.interpolate import RegularGridInterpolator

ROOT = Path(__file__).resolve().parent.parent.parent
KM_PER_DEG = 6371.0 * np.pi / 180.0
G = 9.81
DEPTH_M = 4000.0  # the wave's amplitude on a flat ocean does not depend on it
TOP_M = 5.0e3


def deformation(rupture, local_strike):
    L, W, slip, dip = rupture["lengthM"], rupture["widthM"], rupture["meanSlipM"], rupture["dipDeg"]
    sf = dtopotools.SubFault()
    sf.strike = local_strike % 360.0
    sf.dip = dip
    sf.rake = 90.0
    sf.slip = slip
    sf.length = L
    sf.width = W
    sf.depth = TOP_M + 0.5 * W * np.sin(np.radians(dip))
    sf.longitude = 0.0
    sf.latitude = 0.0
    sf.coordinate_specification = "centroid"
    fault = dtopotools.Fault()
    fault.subfaults = [sf]
    half = (0.6 * max(L, W) / 1e3 + 3.0 * TOP_M / 1e3 + 60.0) / KM_PER_DEG
    # Converged on the campaign's Mw 9 case: 1.851 m at 1 000 km and 1.536 m at
    # 3 000 km, against 1.818 and 1.52 on its coarser grid.
    dd = 0.00625
    x = np.arange(-half, half + dd / 2, dd)
    y = np.arange(-half, half + dd / 2, dd)
    z = fault.create_dtopography(x, y, times=[1.0]).dZ[-1]
    return x, y, z


def S_of_rho(interp, xg_km, bbox_km, rho, nphi=2000):
    x1, x2, y1, y2 = bbox_km
    corners = np.array([[x1, y1], [x1, y2], [x2, y1], [x2, y2]]) - np.array([xg_km, 0.0])
    a = np.mod(np.arctan2(corners[:, 1], corners[:, 0]), 2 * np.pi)
    lo, hi = a.min(), a.max()
    if hi - lo > np.pi:
        a = np.where(a > np.pi, a - 2 * np.pi, a)
        lo, hi = a.min(), a.max()
    pad = 0.02 * (hi - lo) + 1e-4
    phis = np.linspace(lo - pad, hi + pad, nphi)
    dphi = phis[1] - phis[0]
    S = np.zeros(len(rho))
    cph, sph = np.cos(phis), np.sin(phis)
    for k0 in range(0, len(rho), 256):
        r = rho[k0 : k0 + 256]
        px = xg_km + r[:, None] * cph[None, :]
        py = r[:, None] * sph[None, :]
        vals = interp(np.stack([(py / KM_PER_DEG).ravel(), (px / KM_PER_DEG).ravel()], axis=1)).reshape(px.shape)
        S[k0 : k0 + 256] = r * vals.sum(axis=1) * dphi
    return S


def M_of_T(rho, S, T):
    out = np.zeros(len(T))
    r0, r1 = rho[:-1], rho[1:]
    b = (S[1:] - S[:-1]) / (r1 - r0)
    a = S[:-1] - b * r0
    for i, TT in enumerate(T):
        hi = np.minimum(r1, TT)
        lo = np.minimum(r0, TT)
        m = hi > lo
        if not m.any():
            continue
        hi_, lo_ = hi[m], lo[m]
        out[i] = np.sum(
            a[m] * (np.arcsin(hi_ / TT) - np.arcsin(lo_ / TT))
            - b[m] * (np.sqrt(np.maximum(TT * TT - hi_ * hi_, 0)) - np.sqrt(np.maximum(TT * TT - lo_ * lo_, 0)))
        )
    return out


def crest_and_range(x, y, z, r_km):
    interp = RegularGridInterpolator((y, x), z, method="linear", bounds_error=False, fill_value=0.0)
    bbox = (x[0] * KM_PER_DEG, x[-1] * KM_PER_DEG, y[0] * KM_PER_DEG, y[-1] * KM_PER_DEG)
    x1, x2, y1, y2 = bbox
    dmin = max(0.0, np.hypot(max(x1 - r_km, 0, r_km - x2), max(y1, 0, -y2)))
    dmax = max(np.hypot(r_km - x1, y1), np.hypot(r_km - x1, y2), np.hypot(r_km - x2, y1), np.hypot(r_km - x2, y2))
    drho = 0.1
    rho = np.arange(max(dmin - 1.0, 0.0), dmax + 1.0, drho)
    S = S_of_rho(interp, r_km, bbox, rho)
    c = np.sqrt(G * DEPTH_M)
    dt = max(1.0, drho * 1e3 / c)
    t = np.arange(max(0.0, (dmin - 60.0) * 1e3 / c), (dmax + 200.0) * 1e3 / c, dt)
    T = np.maximum(c * t / 1e3, 1e-9)
    eta = np.gradient(M_of_T(rho, S, T), T) / (2 * np.pi)
    return float(eta.max()), float(eta.max() - eta.min())


def one(task):
    ev_id, station, distance_km, alpha, rupture = task
    x, y, z = deformation(rupture, 90.0 - alpha)
    crest, rng = crest_and_range(x, y, z, distance_km)
    print(ev_id, station, distance_km, round(crest, 4), flush=True)
    return {"station": station, "crestM": crest, "rangeM": rng}


def main():
    records = json.loads((ROOT / "benchmark" / "dart" / "records.json").read_text())
    c0 = {e["id"]: e for e in json.loads((ROOT / "benchmark" / "dart" / "c0.json").read_text())["events"]}
    events = [ev for ev in records["events"] if any(ev["keptBy"].values())]
    tasks = [
        (ev["id"], rec["station"], rec["distanceKm"], rec["bearingDeg"] - ev["strikeDeg"], c0[ev["id"]]["rupture"])
        for ev in events
        for rec in ev["records"]
        if any(rec.get("keptBy", {}).values())
    ]
    with ProcessPoolExecutor(max_workers=max(1, (os.cpu_count() or 2) - 1)) as pool:
        results = list(pool.map(one, tasks))
    out = [{"id": ev["id"], "records": []} for ev in events]
    by_id = {e["id"]: e for e in out}
    for task, result in zip(tasks, results):
        by_id[task[0]]["records"].append(result)
    (ROOT / "benchmark" / "dart" / "c1.json").write_text(json.dumps({"model": "C1", "events": out}, indent=1) + "\n")


if __name__ == "__main__":
    sys.exit(main())
