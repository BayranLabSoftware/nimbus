#!/usr/bin/env python3
"""ShakeMap 4 run as a scenario with a FINITE RUPTURE, for rule 308 of
`src/physics/validation/strikeAgainstShakemapRules.ts`.

`shakemap-scenario.py` runs an event with a source and nothing else, which is
what E1 asks for. This runs an event with a source AND a rupture rectangle at a
given azimuth, which is what rule 308 asks for: the same earthquake twice, once
at the strike the lookup found and once at due north, so that the difference
between the two footprints is the size of the error the default was making.

The rupture is written as ShakeMap's own rupture GeoJSON — a MultiPolygon whose
one quadrilateral is the top edge then the bottom edge, as
`esi_shakelib.rupture.factory._check_polygon` requires. Nothing here computes
ground motion: ShakeMap does.

    export CALLED_FROM_PYTEST=<repo>/tests
    <venv>/bin/python scripts/benchmark/strike-shakemap-scenario.py \\
        --cases <cases.json> --work <dir> --config <install/config> --out <out.json>

Writes each run's whole MMI grid, base64 of one byte a cell at MMI x 10, so
that the comparison is done once and in one place — `strike-against-scenario.ts`
and the functions rule 305 is tested on.
"""

import argparse
import base64
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

EVENT_XML = """<?xml version="1.0" encoding="US-ASCII" standalone="yes"?>
<earthquake id="{id}" lat="{lat}" lon="{lon}" mag="{mag}" time="{time}"
 depth="{depth}" locstring="{place}" description="{place}" mech="{mech}"
 netid="{netid}" network=""/>
"""

EARTH_RADIUS_KM = 6371.0


def offset(lat, lon, bearing_deg, distance_km):
    """A point at a bearing and a distance, on a sphere."""
    d = distance_km / EARTH_RADIUS_KM
    b = math.radians(bearing_deg)
    p1 = math.radians(lat)
    l1 = math.radians(lon)
    p2 = math.asin(math.sin(p1) * math.cos(d) + math.cos(p1) * math.sin(d) * math.cos(b))
    l2 = l1 + math.atan2(
        math.sin(b) * math.sin(d) * math.cos(p1), math.cos(d) - math.sin(p1) * math.sin(p2)
    )
    return math.degrees(p2), (math.degrees(l2) + 540) % 360 - 180


def rupture_json(case):
    """The rupture rectangle: a top edge along the strike at the top depth, and
    a bottom edge one down-dip width away in the dip direction (strike + 90,
    right-hand rule), deeper by W sin(dip)."""
    lat, lon = case["lat"], case["lon"]
    strike, dip = case["strikeDeg"], case["dipDeg"]
    half_length = case["lengthKm"] / 2
    width = case["widthKm"]
    ztor = max(0.0, case["depthKm"] - 0.5 * width * math.sin(math.radians(dip)))
    zbot = ztor + width * math.sin(math.radians(dip))
    horizontal = width * math.cos(math.radians(dip))

    # The top edge is centred on the epicentre, shifted up-dip by half the
    # horizontal projection so that the hypocentre lies on the plane.
    up_dip = (strike - 90) % 360
    clat, clon = offset(lat, lon, up_dip, horizontal / 2)
    t0 = offset(clat, clon, (strike + 180) % 360, half_length)
    t1 = offset(clat, clon, strike, half_length)
    down_dip = (strike + 90) % 360
    b1 = offset(t1[0], t1[1], down_dip, horizontal)
    b0 = offset(t0[0], t0[1], down_dip, horizontal)

    polygon = [
        [t0[1], t0[0], ztor],
        [t1[1], t1[0], ztor],
        [b1[1], b1[0], zbot],
        [b0[1], b0[0], zbot],
        [t0[1], t0[0], ztor],
    ]
    return {
        "type": "FeatureCollection",
        "metadata": {
            "reference": "Nimbus rule 308: rupture rectangle from the project's own "
            "length, width and strike"
        },
        "features": [
            {
                "type": "Feature",
                "properties": {"rupture type": "rupture extent"},
                "geometry": {"type": "MultiPolygon", "coordinates": [[polygon]]},
            }
        ],
    }


def read_grid(hdf):
    """The whole MMI grid, one byte a cell at MMI x 10."""
    from esi_utils_io.smcontainers import ShakeMapOutputContainer

    c = ShakeMapOutputContainer.load(str(hdf))
    component = c.getComponents("MMI")[0]
    g = c.getIMTGrids("MMI", component)
    mmi = np.array(g["mean"], dtype="float64")
    md = g["mean_metadata"]
    quantised = np.clip(np.rint(np.nan_to_num(mmi, nan=0.0) * 10), 0, 255).astype(np.uint8)
    meta = c.getMetadata()
    gm = meta["processing"]["ground_motion_modules"]
    return {
        "nx": int(mmi.shape[1]),
        "ny": int(mmi.shape[0]),
        "xmin": float(md["xmin"]),
        "xmax": float(md["xmax"]),
        "ymin": float(md["ymin"]),
        "ymax": float(md["ymax"]),
        "dx": float(md["dx"]),
        "dy": float(md["dy"]),
        "maxMmi": float(np.nanmax(mmi)),
        "mmi10": base64.b64encode(quantised.tobytes()).decode("ascii"),
        "modules": {k: gm[k]["module"] for k in ("gmpe", "gmice", "ipe") if k in gm},
    }


def run_case(case, work, config, venv_bin, gmpe=None):
    case_dir = Path(work) / case["id"] / "current"
    if case_dir.exists():
        shutil.rmtree(case_dir)
    (case_dir / "logs").mkdir(parents=True)
    (case_dir / "event.xml").write_text(
        EVENT_XML.format(
            id=case["id"],
            lat=case["lat"],
            lon=case["lon"],
            mag=case["magnitude"],
            time=case["time"],
            depth=case["depthKm"],
            place=case.get("place", case["id"]),
            mech=case.get("mech", "ALL"),
            netid=case.get("netid", "us"),
        )
    )
    (case_dir / "rupture.json").write_text(json.dumps(rupture_json(case), indent=1))
    if gmpe is not None:
        (case_dir / "model.conf").write_text(f"[modeling]\n    gmpe = {gmpe}\n")

    steps = []
    for module, extra in (("assemble", ["-n", config]), ("model", [])):
        cmd = [
            str(Path(venv_bin) / module),
            case["id"],
            "-d",
            str(case_dir),
            "-o",
            str(case_dir),
            "-l",
            str(case_dir / "logs"),
        ] + extra
        r = subprocess.run(cmd, cwd=case_dir, env=dict(os.environ), capture_output=True, text=True)
        steps.append({"module": module, "returncode": r.returncode})
        if r.returncode != 0:
            return {"id": case["id"], "ok": False, "steps": steps, "stderr": r.stderr[-2000:]}
    return {"id": case["id"], "ok": True, "steps": steps, **read_grid(case_dir / "shake_result.hdf")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", required=True)
    ap.add_argument("--work", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cases = json.loads(Path(args.cases).read_text())
    venv_bin = Path(sys.executable).parent
    Path(args.work).mkdir(parents=True, exist_ok=True)
    rows = []
    for case in cases:
        row = run_case(case, args.work, args.config, venv_bin, case.get("gmpe"))
        rows.append(row)
        if row["ok"]:
            print(f"{case['id']:<36} max MMI {row['maxMmi']:.2f}  grid {row['nx']}x{row['ny']}", flush=True)
        else:
            print(f"{case['id']:<36} FAILED {row['steps']}\n{row.get('stderr','')}", flush=True)
        Path(args.out).write_text(json.dumps({"rows": rows}, indent=1) + "\n")
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
