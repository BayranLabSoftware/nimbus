#!/usr/bin/env python3
"""ShakeMap 4 as a scenario, which is what E1 of docs/GOLD_STANDARD.md asks for:
"a ShakeMap scenario run on its own ground-motion models without stations,
scored the same way on the same maps".

Given an event's source parameters and nothing else — no seismic stations, no
DYFI, no finite rupture — this writes an `event.xml`, runs ShakeMap's own
`assemble` and `model` modules, and reads the MMI grid they produce: the area
above each intensity threshold and the radius of the circle with that area,
which is the quantity rule 28's score compares against a published map.

    export CALLED_FROM_PYTEST=<shakemap repo>/tests
    <venv>/bin/python scripts/benchmark/shakemap-scenario.py \
        --work <dir> --events <json> [--out <out.json>]

See docs/SHAKEMAP_SETUP.md for what it took to make ShakeMap run, and for the
two things about this harness that are choices rather than ShakeMap's defaults.
"""

import argparse
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

THRESHOLDS = (6.5, 7.0, 8.0, 9.0)


def equivalent_radii(hdf):
    """The area above each threshold, and the radius of the circle with it."""
    from esi_utils_io.smcontainers import ShakeMapOutputContainer

    c = ShakeMapOutputContainer.load(str(hdf))
    component = c.getComponents("MMI")[0]
    g = c.getIMTGrids("MMI", component)
    mmi = np.array(g["mean"])
    md = g["mean_metadata"]
    ny, nx = mmi.shape
    lats = md["ymax"] - np.arange(ny) * md["dy"]
    # A cell's area on the sphere, near enough at these sizes: the cell is
    # dx by dy in degrees and shrinks with the cosine of its own latitude.
    cell_km2 = (md["dx"] * 111.195) * (md["dy"] * 111.195) * np.cos(np.radians(lats))[:, None]
    out = {"maxMmi": float(np.nanmax(mmi)), "gridPoints": [int(nx), int(ny)]}
    for thr in THRESHOLDS:
        area = float(np.nansum(np.where(mmi >= thr, cell_km2, 0.0)))
        out[f"mmi{thr:g}"] = {
            "areaKm2": area,
            "equivalentRadiusKm": math.sqrt(area / math.pi) if area > 0 else 0.0,
        }
    meta = c.getMetadata()
    gm = meta["processing"]["ground_motion_modules"]
    out["modules"] = {k: gm[k]["module"] for k in ("gmpe", "gmice", "ipe") if k in gm}
    return out


def run_event(ev, work, config, venv_bin):
    case = Path(work) / ev["id"] / "current"
    if case.exists():
        shutil.rmtree(case)
    (case / "logs").mkdir(parents=True)
    (case / "event.xml").write_text(
        EVENT_XML.format(
            id=ev["id"],
            lat=ev["lat"],
            lon=ev["lon"],
            mag=ev["magnitude"],
            time=ev["time"],
            depth=ev["depthKm"],
            place=ev.get("place", ev["id"]),
            mech=ev.get("mech", "ALL"),
            netid=ev.get("netid", "us"),
        )
    )
    env = dict(os.environ)
    steps = []
    for module, extra in (("assemble", ["-n", config]), ("model", [])):
        cmd = [str(Path(venv_bin) / module), ev["id"], "-d", str(case), "-o", str(case),
               "-l", str(case / "logs")] + extra
        r = subprocess.run(cmd, cwd=case, env=env, capture_output=True, text=True)
        steps.append({"module": module, "returncode": r.returncode})
        if r.returncode != 0:
            return {"id": ev["id"], "ok": False, "steps": steps,
                    "stderr": r.stderr[-1500:]}
    return {"id": ev["id"], "ok": True, "steps": steps,
            **equivalent_radii(case / "shake_result.hdf")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", required=True)
    ap.add_argument("--events", required=True, help="JSON array of event records")
    ap.add_argument("--config", required=True, help="ShakeMap install config directory")
    ap.add_argument("--out")
    args = ap.parse_args()

    events = json.loads(Path(args.events).read_text())
    venv_bin = Path(sys.executable).parent
    Path(args.work).mkdir(parents=True, exist_ok=True)
    rows = []
    for ev in events:
        row = run_event(ev, args.work, args.config, venv_bin)
        rows.append(row)
        if row["ok"]:
            r7 = row["mmi7"]["equivalentRadiusKm"]
            print(
                f"{ev['id']:<24} Mw {ev['magnitude']:.1f} at {ev['depthKm']:>5.1f} km: "
                f"max MMI {row['maxMmi']:.2f}, MMI VII over {row['mmi7']['areaKm2']:.0f} km² "
                f"(r {r7:.2f} km)",
                flush=True,
            )
        else:
            print(f"{ev['id']:<24} FAILED: {row['steps']}", flush=True)
    if args.out:
        Path(args.out).write_text(
            json.dumps({"track": "E1", "reference": "ShakeMap 4 scenario, no stations",
                        "rows": rows}, indent=1) + "\n"
        )
        print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
