#!/usr/bin/env python3
"""Model C2 of BM-05: GeoClaw over real bathymetry at every DART record the set
keeps (rules 208 to 214 of src/physics/validation/farFieldReferenceRules.ts).

C2 takes C1's source exactly — Okada's deformation of a uniform slip over the
rupture Nimbus builds, from benchmark/dart/c0.json — and propagates it with
GeoClaw's nonlinear shallow-water solver in spherical coordinates over the
seafloor the product itself propagates over, dumped at about 10 km by
scripts/benchmark/dart-c2-topo.ts. Each event is run twice: at two cells of the
raster and at one. Rule 210 asks for the second to be a further level of
refinement over the source and the gauges; a uniform refinement of the whole
basin is done instead, which refines those and everything between them, and the
outcome says so. C2 is the finer run; the coarser exists to test it.

    export CLAW=/tmp/nclaw PYTHONPATH=/tmp/nclaw FC=gfortran
    python3 scripts/benchmark/dart-c2.py --work <dir> --mosaic <dir>/mosaic-z4 \
        [--events id,...] [--jobs 6] [--stage all|prepare|build|run|collect]

Writes benchmark/dart/c2.json. Long paths break the Fortran: keep --work short
(/tmp/c2), as docs/GEOCLAW_SETUP.md says.
"""

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent.parent
READING = "bracketed-2cm"
PAD_DEG = 3.0
LAT_LIMIT = 84.0
TOP_M = 5.0e3          # the top of the rupture, as model C1 puts it
# How fine the computational grid is, in raster cells. The fine run is C2; the
# coarse run is twice its cell and exists to test it (rule 210(b)). The fine
# grid puts at least twenty cells across the source's own wavelength, 2·W, or
# one raster cell if that is already finer: a ladder run on the smallest event
# of the set — 19.5, 9.8 and 4.9 km, costing 8, 63 and 530 s — showed the crest
# still climbing 31 to 41 % between the last two there, where 2·W is 143 km,
# and settled to within 5 % at the two gauges the coarse grid already resolved.
# This is a criterion on cells per wavelength, not on agreement with anything.
CELLS_PER_WAVELENGTH = 20
GAUGE_SAMPLE_S = 60.0  # the records are one-minute samples; so is the model


# --------------------------------------------------------------------------
# the set, and the frame each event is run in
# --------------------------------------------------------------------------

def wrap180(d):
    return (d + 180.0) % 360.0 - 180.0


def load_set():
    rec = json.loads((ROOT / "benchmark/dart/records.json").read_text())
    c0 = {e["id"]: e for e in json.loads((ROOT / "benchmark/dart/c0.json").read_text())["events"]}
    events = []
    for ev in rec["events"]:
        if not ev["keptBy"].get(READING):
            continue
        kept = [r for r in ev["records"] if r["keptBy"].get(READING)]
        events.append({**ev, "records": kept, "rupture": c0[ev["id"]]["rupture"]})
    return events


def frame(ev):
    """A longitude origin that makes the event and all its buoys one arc, and
    the smallest box in that frame. Chosen from the widest empty gap in
    longitude, so a Pacific event whose buoys sit either side of the
    antimeridian gets one window and not two."""
    lons = sorted([ev["lon"]] + [r["lon"] for r in ev["records"]])
    n = len(lons)
    gaps = [(lons[(i + 1) % n] - lons[i]) % 360.0 for i in range(n)]
    widest = max(range(n), key=lambda i: gaps[i])
    start = lons[(widest + 1) % n]                  # just past the gap
    span = 360.0 - gaps[widest]
    shift = lambda lon: start + (lon - start) % 360.0
    lats = [ev["lat"]] + [r["lat"] for r in ev["records"]]
    return {
        "shift": shift,
        "lon": (start - PAD_DEG, start + span + PAD_DEG),
        "lat": (
            max(-LAT_LIMIT, min(lats) - PAD_DEG),
            min(LAT_LIMIT, max(lats) + PAD_DEG),
        ),
    }


def cell_factor(ev):
    """Raster cells per computational cell for the fine run: a power of two, so
    the two grids nest."""
    raster_km = 360.0 / 4095.0 * 111.2
    target_km = 2.0 * ev["rupture"]["widthM"] / 1_000.0 / CELLS_PER_WAVELENGTH
    f = min(1.0, target_km / raster_km)
    return 2.0 ** math.floor(math.log2(f)) if f < 1.0 else 1.0


def crest_window(distance_km):
    """The window the record's own crest was read in (rule 209)."""
    r = distance_km * 1_000.0
    return max(20 * 60.0, r / 250.0 - 30 * 60.0), r / 150.0 + 3 * 3_600.0


# --------------------------------------------------------------------------
# the seafloor, cut from the product's own mosaic
# --------------------------------------------------------------------------

class Mosaic:
    def __init__(self, stem):
        self.header = json.loads(Path(f"{stem}.json").read_text())
        h = self.header
        self.z = np.memmap(f"{stem}.f32", dtype="<f4", mode="r",
                           shape=(h["nLat"], h["nLon"]))
        # The product's own convention: sample j is at minLon + j·span/(n−1).
        self.dlon = (h["maxLon"] - h["minLon"]) / (h["nLon"] - 1)
        row = (h["maxLat"] - h["minLat"]) / (h["nLat"] - 1)
        # The mosaic has twice as many rows as it needs: the Mercator
        # reprojection lands 4 096 of them on 170° of latitude, 0.042° apart,
        # against 0.088° in longitude. A reference asked for cells twice as
        # tall as they are wide would pay for the shorter side twice over, so
        # the window takes every second row and comes out very nearly square.
        self.rowStep = max(1, round(self.dlon / row))
        self.rowDeg = row
        self.dlat = row * self.rowStep

    def column(self, lon):
        """Grid column for a longitude in any frame, wrapped into the raster."""
        j = round((wrap180(lon) - self.header["minLon"]) / self.dlon)
        return int(j) % (self.header["nLon"] - 1)

    def row(self, lat):
        """The nearest row of the raster, on the rows the window keeps."""
        r = int(round((self.header["maxLat"] - lat) / self.rowDeg))
        return r - r % self.rowStep

    def window(self, lat_range, lon_range):
        """Z on the raster's own cell centres, inside the box, plus the x and y
        those cells sit at in the box's own longitude frame."""
        i1, i0 = self.row(lat_range[0]), self.row(lat_range[1])
        i0, i1 = max(0, i0), min(self.header["nLat"] - 1, i1)
        lon0 = math.floor(lon_range[0] / self.dlon) * self.dlon
        ncol = int(math.ceil((lon_range[1] - lon0) / self.dlon)) + 1
        cols = [self.column(lon0 + k * self.dlon) for k in range(ncol)]
        rows = list(range(i0, i1 + 1, self.rowStep))
        z = np.asarray(self.z[rows, :])[:, cols]               # north to south
        y = self.header["maxLat"] - np.array(rows) * self.rowDeg
        x = lon0 + np.arange(ncol) * self.dlon
        return x, y[::-1], z[::-1, :]                          # south to north

    def at(self, lat, lon):
        return float(self.z[self.row(lat), self.column(lon)])


def write_topo(path, x, y, z):
    """GeoClaw's own writer, so no header convention is transcribed."""
    from clawpack.geoclaw import topotools
    topo = topotools.Topography()
    topo.x, topo.y, topo.Z = x, y, np.asarray(z, dtype=float)
    topo.write(str(path), topo_type=3, header_style="geoclaw",
               grid_registration="lower", Z_format="%.0f")


def write_dtopo(path, ev):
    """Okada on Nimbus's own rectangle: model C1's source, at the epicentre."""
    from clawpack.geoclaw import dtopotools
    r = ev["rupture"]
    sf = dtopotools.SubFault()
    sf.strike = r["strikeDeg"] % 360.0
    sf.dip = r["dipDeg"]
    sf.rake = 90.0
    sf.slip = r["meanSlipM"]
    sf.length = r["lengthM"]
    sf.width = r["widthM"]
    sf.depth = TOP_M + 0.5 * r["widthM"] * math.sin(math.radians(r["dipDeg"]))
    sf.longitude = ev["lonFrame"]
    sf.latitude = ev["lat"]
    sf.coordinate_specification = "centroid"
    fault = dtopotools.Fault()
    fault.subfaults = [sf]
    half_km = 0.6 * max(r["lengthM"], r["widthM"]) / 1e3 + 3.0 * TOP_M / 1e3 + 60.0
    half = half_km / (6371.0 * math.pi / 180.0)
    dd = 0.025
    x = np.arange(sf.longitude - half, sf.longitude + half + dd / 2, dd)
    y = np.arange(sf.latitude - half, sf.latitude + half + dd / 2, dd)
    dtopo = fault.create_dtopography(x, y, times=[1.0], verbose=False)
    dtopo.write(str(path), dtopo_type=3)
    return float(np.max(dtopo.dZ[-1])), float(np.min(dtopo.dZ[-1]))


# --------------------------------------------------------------------------
# a case on disk
# --------------------------------------------------------------------------

SETRUN = '''"""Written by scripts/benchmark/dart-c2.py. Every setting that is not
forced by the event comes from GeoClaw's own chile2010 example, unchanged: the
reference is run as the tool configures itself."""
import json, os
from clawpack.clawutil import data

P = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "params.json")))


def setrun(claw_pkg="geoclaw"):
    rundata = data.ClawRunData(claw_pkg, 2)
    c = rundata.clawdata
    c.num_dim = 2
    c.lower[0], c.upper[0] = P["lon"][0], P["lon"][1]
    c.lower[1], c.upper[1] = P["lat"][0], P["lat"][1]
    c.num_cells[0], c.num_cells[1] = P["cells"][0], P["cells"][1]
    c.num_eqn, c.num_aux, c.capa_index = 3, 3, 2
    c.t0 = 0.0
    c.output_style = 1
    c.num_output_times = 2
    c.tfinal = P["tfinal"]
    c.output_t0 = False
    c.output_format = "binary"
    c.dt_initial = 2.0
    c.dt_max = 1e9
    c.cfl_desired = 0.75
    c.cfl_max = 1.0
    c.steps_max = 500000
    c.dt_variable = True
    c.order = 2
    c.transverse_waves = 2
    c.num_waves = 3
    c.limiter = ["mc", "mc", "mc"]
    c.use_fwaves = True
    c.source_split = "godunov"
    c.num_ghost = 2
    c.bc_lower = ["extrap", "extrap"]
    c.bc_upper = ["extrap", "extrap"]
    c.checkpt_style = 0
    c.verbosity = 0

    a = rundata.amrdata
    ratios = P.get("ratios", [2])
    a.amr_levels_max = P.get("levels", 1)
    a.refinement_ratios_x = ratios
    a.refinement_ratios_y = ratios
    a.refinement_ratios_t = ratios
    a.aux_type = ["center", "capacity", "yleft"]
    a.flag_richardson = False
    a.flag2refine = True
    a.regrid_interval = 3
    a.regrid_buffer_width = 2
    a.clustering_cutoff = 0.7
    a.verbosity_regrid = 0
    a.max1d = P.get("max1d", 60)
    a.tprint = False

    rundata.regiondata.regions = [list(r) for r in P.get("regions", [])]
    rundata.gaugedata.gauges = [[int(g[0]), g[1], g[2], g[3], g[4]] for g in P["gauges"]]
    rundata.gaugedata.min_time_increment = P["gaugeSampleS"]

    g = rundata.geo_data
    g.gravity = 9.81
    g.coordinate_system = 2
    g.earth_radius = 6367.5e3
    g.coriolis_forcing = False
    g.sea_level = 0.0
    g.dry_tolerance = 1.0e-3
    g.friction_forcing = True
    g.manning_coefficient = 0.025
    g.friction_depth = 1e6

    rundata.refinement_data.variable_dt_refinement_ratios = True
    rundata.refinement_data.wave_tolerance = P.get("waveTolerance", 1.0e-1)
    rundata.topo_data.topofiles.append([3, P["topo"]])
    rundata.dtopo_data.dtopofiles.append([3, P["dtopo"]])
    rundata.dtopo_data.dt_max_dtopo = 0.2
    rundata.qinit_data.qinit_type = 0
    return rundata


if __name__ == "__main__":
    setrun().write()
'''

MAKEFILE = '''CLAWMAKE = $(CLAW)/clawutil/src/Makefile.common
CLAW_PKG = geoclaw
EXE = xgeoclaw
SETRUN_FILE = setrun.py
OUTDIR = _output
SETPLOT_FILE = setplot.py
PLOTDIR = _plots
FFLAGS ?= -O2
GEOLIB = $(CLAW)/geoclaw/src/2d/shallow
include $(GEOLIB)/Makefile.geoclaw
EXCLUDE_MODULES =
EXCLUDE_SOURCES =
MODULES =
SOURCES = \\
  $(CLAW)/riemann/src/rpn2_geoclaw.f \\
  $(CLAW)/riemann/src/rpt2_geoclaw.f \\
  $(CLAW)/riemann/src/geoclaw_riemann_utils.f \\

include $(CLAWMAKE)
'''


def prepare(ev, work, mosaic):
    case = work / ev["id"]
    case.mkdir(parents=True, exist_ok=True)
    f = frame(ev)
    ev["lonFrame"] = f["shift"](ev["lon"])
    x, y, z = mosaic.window(f["lat"], f["lon"])
    topo = case / "topo.tt3"
    if not topo.exists():
        write_topo(topo, x, y, z)
    dtopo = case / "dtopo.tt3"
    up, down = write_dtopo(dtopo, ev)

    gauges, meta = [], []
    tfinal = 0.0
    for r in ev["records"]:
        lon = f["shift"](r["lon"])
        t1, t2 = crest_window(r["distanceKm"])
        tfinal = max(tfinal, t2)
        gauges.append([r["station"], lon, r["lat"], 0.0, 1.0e10])
        meta.append({
            "station": r["station"], "lon": lon, "lat": r["lat"],
            "windowS": [t1, t2], "rasterDepthM": -mosaic.at(r["lat"], lon),
            "reportedDepthM": r.get("waterDepthM"), "distanceKm": r["distanceKm"],
        })
    lon_lo, lon_hi = float(x[0]), float(x[-1])
    lat_lo, lat_hi = float(y[0]), float(y[-1])
    params = {
        "id": ev["id"], "lon": [lon_lo, lon_hi], "lat": [lat_lo, lat_hi],
        "tfinal": math.ceil(tfinal / 600.0) * 600.0,
        "gauges": gauges, "gaugeSampleS": GAUGE_SAMPLE_S,
        "topo": str(topo), "dtopo": str(dtopo),
        "rasterCell": [mosaic.dlon, mosaic.dlat],
        "dtopoUpliftM": [up, down], "records": meta,
        "epicentre": [ev["lonFrame"], ev["lat"]], "rupture": ev["rupture"],
        "fineFactor": cell_factor(ev),
    }
    (case / "prepared.json").write_text(json.dumps(params, indent=1) + "\n")
    print(f"{ev['id']}: topo {z.shape[1]}x{z.shape[0]} over "
          f"{lon_lo:.1f}..{lon_hi:.1f} / {lat_lo:.1f}..{lat_hi:.1f}, "
          f"{len(gauges)} gauges, tfinal {params['tfinal'] / 3600:.1f} h, "
          f"uplift {up:+.2f}/{down:+.2f} m, fine grid "
          f"{params['fineFactor'] * mosaic.dlon * 111.2:.1f} km", flush=True)
    return params


def build(work, env):
    """One executable for every run: GeoClaw's own Makefile, compiled once."""
    b = work / "build"
    b.mkdir(parents=True, exist_ok=True)
    (b / "Makefile").write_text(MAKEFILE)
    (b / "setrun.py").write_text(SETRUN)
    (b / "params.json").write_text(json.dumps(
        {"lon": [0, 1], "lat": [0, 1], "cells": [4, 4], "tfinal": 1.0,
         "gauges": [], "gaugeSampleS": 60.0, "topo": "", "dtopo": ""}) + "\n")
    subprocess.run(["make", "xgeoclaw"], cwd=b, env=env, check=True,
                   stdout=subprocess.DEVNULL)
    return b / "xgeoclaw"


def run_one(job):
    """One GeoClaw run. Returns the gauge series it produced."""
    case, which, cells, exe, env = (Path(job["case"]), job["which"], job["cells"],
                                    job["exe"], job["env"])
    p = json.loads((case / "prepared.json").read_text())
    d = case / which
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    dlon, dlat = p["rasterCell"]
    step = cells * p["fineFactor"]
    params = {**p, "cells": [
        max(4, int(round((p["lon"][1] - p["lon"][0]) / (step * dlon)))),
        max(4, int(round((p["lat"][1] - p["lat"][0]) / (step * dlat)))),
    ]}
    (d / "params.json").write_text(json.dumps(params, indent=1) + "\n")
    (d / "setrun.py").write_text(SETRUN)
    (d / "Makefile").write_text(MAKEFILE)
    shutil.copy2(exe, d / "xgeoclaw")
    t0 = time.time()
    with open(d / "run.log", "w") as log:
        subprocess.run([sys.executable, "setrun.py"], cwd=d, env=env, check=True,
                       stdout=log, stderr=subprocess.STDOUT)
        out = d / "_output"
        out.mkdir(exist_ok=True)
        for f in d.glob("*.data"):
            shutil.copy2(f, out / f.name)
        r = subprocess.run(["../xgeoclaw"], cwd=out, env=env,
                           stdout=log, stderr=subprocess.STDOUT)
    took = time.time() - t0
    ok = r.returncode == 0
    series = {}
    for g in params["gauges"]:
        f = out / f"gauge{int(g[0]):05d}.txt"
        if not f.exists():
            continue
        a = np.loadtxt(f, comments="#")
        if a.ndim == 1:
            a = a.reshape(1, -1)
        series[str(g[0])] = {"t": a[:, 1].tolist(), "eta": a[:, 5].tolist(),
                             "h": a[:, 2].tolist()}
    result = {"id": params["id"], "which": which, "cells": params["cells"],
              "ok": ok, "seconds": took, "series": series}
    (case / f"{which}.json").write_text(json.dumps(result) + "\n")
    print(f"{params['id']} {which}: {params['cells'][0]}x{params['cells'][1]} cells, "
          f"{'ok' if ok else 'FAILED'} in {took / 60:.1f} min, "
          f"{len(series)} gauge series", flush=True)
    return {**result, "series": None}


def collect(events, work):
    """Crest and its time, in the record's own window, from the finer run, with
    the coarser beside it as rule 210(b)'s check."""
    out = []
    for ev in events:
        case = work / ev["id"]
        p = json.loads((case / "prepared.json").read_text())
        runs = {}
        for which in ("coarse", "fine"):
            f = case / f"{which}.json"
            runs[which] = json.loads(f.read_text()) if f.exists() else None
        records = []
        for rec in p["records"]:
            row = {"station": rec["station"], "rasterDepthM": rec["rasterDepthM"],
                   "reportedDepthM": rec["reportedDepthM"]}
            for which in ("coarse", "fine"):
                r = runs[which]
                s = (r or {}).get("series", {}).get(rec["station"])
                if s is None:
                    row[which] = None
                    continue
                t = np.array(s["t"])
                eta = np.array(s["eta"])
                lo, hi = rec["windowS"]
                inside = (t >= lo) & (t <= hi)
                covered = bool(inside.any() and t.max() >= hi - 60.0)
                if not inside.any():
                    row[which] = None
                    continue
                k = int(np.argmax(eta[inside]))
                row[which] = {"crestM": float(eta[inside][k]),
                              "crestAfterS": float(t[inside][k]),
                              "covered": covered,
                              "depthM": float(np.median(s["h"][:3]))}
            records.append(row)
        out.append({"id": ev["id"], "runs": {k: (None if v is None else
                    {"ok": v["ok"], "cells": v["cells"], "seconds": v["seconds"]})
                    for k, v in runs.items()}, "records": records})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", required=True)
    ap.add_argument("--mosaic", required=True)
    ap.add_argument("--events", default="")
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--stage", default="all")
    ap.add_argument("--threads", type=int, default=1)
    args = ap.parse_args()

    work = Path(args.work)
    work.mkdir(parents=True, exist_ok=True)
    events = load_set()
    if args.events:
        wanted = set(args.events.split(","))
        events = [e for e in events if e["id"] in wanted]
    env = dict(os.environ)
    env["OMP_NUM_THREADS"] = str(args.threads)
    # Clawpack's Makefile shells out to `python`, which this machine does not
    # have on the PATH: the interpreter running this script is the one that has
    # clawpack in it, so hand the Makefile that one.
    env["CLAW_PYTHON"] = sys.executable
    env.setdefault("PYTHON", sys.executable)

    if args.stage in ("all", "prepare"):
        mosaic = Mosaic(args.mosaic)
        for ev in events:
            prepare(ev, work, mosaic)
    if args.stage in ("all", "build"):
        build(work, env)
    exe = work / "build" / "xgeoclaw"
    if args.stage in ("all", "run"):
        jobs = []
        for ev in events:
            for which, cells in (("coarse", 2), ("fine", 1)):
                jobs.append({"case": str(work / ev["id"]), "which": which,
                             "cells": cells, "exe": str(exe), "env": env})
        jobs.sort(key=lambda j: j["which"])          # the cheap ones first
        with ProcessPoolExecutor(max_workers=args.jobs) as pool:
            for _ in pool.map(run_one, jobs):
                pass
    if args.stage in ("all", "collect"):
        rows = collect(events, work)
        (ROOT / "benchmark/dart/c2-raw.json").write_text(
            json.dumps({"model": "C2", "events": rows}, indent=1) + "\n")
        print(f"collected {len(rows)} events")


if __name__ == "__main__":
    main()
