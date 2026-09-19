#!/usr/bin/env python3
"""The slabs an earthquake can point along: Slab2, cut into the tiles a
reader's click loads one of.

The source is the Slab2 distribution of Hayes, G. P., Moore, G. L., Portner,
D. E., Hearne, M., Flamme, H., Furtney, M. & Smoczyk, G. M. (2018), "Slab2, a
comprehensive subduction zone geometry model", Science 362(6410), 58-61,
doi:10.1126/science.aat4723; data doi:10.5066/F7PV6JNV, U.S. Geological
Survey, public domain. 27 zones, five grids each, sampled every 0.05 degrees
(0.02 in five zones), NaN outside each model's own clipping mask.

Rules 295 to 303 of `src/physics/validation/slabStrikeRules.ts` say what this
is for and what it may cost. Three of the five grids are read: strike, depth
and the model's own depth uncertainty. The dip is not read, because rule 302
keeps this round out of the dip.

Three choices are made here and not in the rules, because they are choices of
construction:

  1. THE LATTICE IS 0.1 DEGREES, one node in two of the distribution's own. A
     slab surface is smooth over eleven kilometres - it is a surface fitted to
     earthquake locations, not a coastline - and the full lattice costs four
     times the bytes for a strike that moves by a fraction of a degree between
     neighbouring nodes. Rule 301(f)'s budget was set against this count.
  2. SAMPLING IS NEAREST-NODE, not interpolated. Every second node of a 0.05
     degree grid falls exactly on the lattice, so nearest IS the value there;
     and interpolating across the edge of a clipping mask would invent a slab
     where the model says it has none.
  3. WHERE TWO ZONES OVERLAP, THE SHALLOWER WINS. Rule 296 asks whether a
     hypocentre sits on the seismogenic interface, and the seismogenic
     interface is the shallowest contact at that point; a deeper slab beneath
     another is not what the point is on.

Writes `public/data/slab2/`. Nothing here runs Nimbus.

    <venv>/bin/python scripts/build-slab2.py <Slab2Distribute_Mar2018 dir>
"""

import json
import math
import re
import sys
from pathlib import Path

import netCDF4 as nc
import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "public" / "data" / "slab2"

# The lattice and the tiles: the same ten-degree grid `faultTileKey` uses, so
# that one click reads one tile of each.
CELL_DEG = 0.1
TILE_DEG = 10
TILE_PX = int(round(TILE_DEG / CELL_DEG))
N_LON = int(round(360 / CELL_DEG))
N_LAT = int(round(180 / CELL_DEG))

# The quantisation of `slabStrikeRules.ts`, which the reader undoes.
STRIKE_STEP_DEG = 360 / 256
DEPTH_STEP_M = 3000
UNCERTAINTY_STEP_M = 1000


def zone_grids(src: Path):
    """The zones, each with its strike, depth and uncertainty grid."""
    out = {}
    for path in sorted(src.glob("*_slab2_*.grd")):
        m = re.match(r"([a-z]{3})_slab2_(dep|str|dip|thk|unc)_", path.name)
        if m is None:
            continue
        zone, field = m.group(1), m.group(2)
        if field not in ("dep", "str", "unc"):
            continue
        out.setdefault(zone, {})[field] = path
    return {z: g for z, g in out.items() if {"dep", "str", "unc"} <= set(g)}


def read(path: Path):
    d = nc.Dataset(str(path))
    x = np.asarray(d.variables["x"][:], dtype="float64")
    y = np.asarray(d.variables["y"][:], dtype="float64")
    z = np.ma.filled(np.asarray(d.variables["z"][:], dtype="float64"), np.nan)
    return x, y, z


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: build-slab2.py <Slab2Distribute_Mar2018 dir>", file=sys.stderr)
        return 2
    src = Path(sys.argv[1]).expanduser()
    grids = zone_grids(src)
    if not grids:
        print(f"no Slab2 grids under {src}", file=sys.stderr)
        return 2

    strike_b = np.zeros((N_LAT, N_LON), dtype=np.uint8)
    depth_b = np.zeros((N_LAT, N_LON), dtype=np.uint8)
    unc_b = np.zeros((N_LAT, N_LON), dtype=np.uint8)
    depth_m = np.full((N_LAT, N_LON), np.inf, dtype="float64")

    zones_written = []
    for zone in sorted(grids):
        xs, ys, strike = read(grids[zone]["str"])
        _, _, depth = read(grids[zone]["dep"])
        _, _, unc = read(grids[zone]["unc"])
        dx = float(xs[1] - xs[0])
        dy = float(ys[1] - ys[0])

        # The lattice nodes inside this zone's box.
        j0 = int(math.ceil(float(xs.min()) / CELL_DEG))
        j1 = int(math.floor(float(xs.max()) / CELL_DEG))
        i0 = int(math.ceil(float(ys.min()) / CELL_DEG))
        i1 = int(math.floor(float(ys.max()) / CELL_DEG))
        lons = np.arange(j0, j1 + 1) * CELL_DEG
        lats = np.arange(i0, i1 + 1) * CELL_DEG
        if lons.size == 0 or lats.size == 0:
            continue
        # Nearest node of the distribution's own grid (choice 2).
        jx = np.clip(np.rint((lons - float(xs[0])) / dx).astype(int), 0, xs.size - 1)
        iy = np.clip(np.rint((lats - float(ys[0])) / dy).astype(int), 0, ys.size - 1)
        sub_s = strike[np.ix_(iy, jx)]
        sub_d = depth[np.ix_(iy, jx)]
        sub_u = unc[np.ix_(iy, jx)]

        good = np.isfinite(sub_s) & np.isfinite(sub_d)
        if not good.any():
            continue
        # Slab2 writes depth negative, downwards.
        d_m = np.abs(sub_d) * 1000.0
        u_m = np.where(np.isfinite(sub_u), np.abs(sub_u) * 1000.0, 0.0)

        # Rows from the south pole, columns from the ANTIMERIDIAN: the origin
        # `faultTileKey` counts tiles from, so that one click reads tile c_r of
        # the faults and tile c_r of the slabs.
        rows = ((np.rint(lats / CELL_DEG).astype(int)) + N_LAT // 2) % N_LAT
        cols = (np.rint(np.mod(lons + 180.0, 360.0) / CELL_DEG).astype(int)) % N_LON
        rr, cc = np.meshgrid(rows, cols, indexing="ij")

        # Choice 3: the shallower zone wins where two overlap.
        shallower = good & (d_m < depth_m[rr, cc])
        if not shallower.any():
            continue
        r = rr[shallower]
        c = cc[shallower]
        depth_m[r, c] = d_m[shallower]
        strike_b[r, c] = np.rint(np.mod(sub_s[shallower], 360.0) / STRIKE_STEP_DEG).astype(int) % 256
        depth_b[r, c] = np.minimum(255, np.rint(d_m[shallower] / DEPTH_STEP_M).astype(int) + 1)
        unc_b[r, c] = np.minimum(255, np.rint(u_m[shallower] / UNCERTAINTY_STEP_M).astype(int))
        zones_written.append(zone)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.png"):
        old.unlink()

    tiles = []
    total_bytes = 0
    worst_tile = ("", 0)
    nodes = 0
    for row in range(N_LAT // TILE_PX):
        for col in range(N_LON // TILE_PX):
            r0, c0 = row * TILE_PX, col * TILE_PX
            block_d = depth_b[r0 : r0 + TILE_PX, c0 : c0 + TILE_PX]
            if not block_d.any():
                continue
            nodes += int((block_d > 0).sum())
            # Row 0 of the image is the NORTH edge of the tile.
            rgb = np.zeros((TILE_PX, TILE_PX, 3), dtype=np.uint8)
            rgb[:, :, 0] = strike_b[r0 : r0 + TILE_PX, c0 : c0 + TILE_PX][::-1, :]
            rgb[:, :, 1] = block_d[::-1, :]
            rgb[:, :, 2] = unc_b[r0 : r0 + TILE_PX, c0 : c0 + TILE_PX][::-1, :]
            name = f"{col}_{row}"
            path = OUT_DIR / f"{name}.png"
            Image.fromarray(rgb, mode="RGB").save(path, optimize=True)
            size = path.stat().st_size
            total_bytes += size
            if size > worst_tile[1]:
                worst_tile = (name, size)
            tiles.append(name)

    index = {
        "source": "Slab2Distribute_Mar2018",
        "citation": (
            "Hayes, G. P., Moore, G. L., Portner, D. E., Hearne, M., Flamme, H., "
            "Furtney, M. & Smoczyk, G. M. (2018). \"Slab2, a comprehensive subduction "
            "zone geometry model.\" Science 362(6410), 58-61."
        ),
        "doi": "10.1126/science.aat4723",
        "dataDoi": "10.5066/F7PV6JNV",
        "licence": "public domain (U.S. Geological Survey)",
        "zones": sorted(set(zones_written)),
        "cellDeg": CELL_DEG,
        "tileDeg": TILE_DEG,
        "tilePx": TILE_PX,
        "rowsFromNorth": True,
        "strikeStepDeg": STRIKE_STEP_DEG,
        "depthStepM": DEPTH_STEP_M,
        "uncertaintyStepM": UNCERTAINTY_STEP_M,
        "nodes": nodes,
        "tiles": tiles,
    }
    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=1) + "\n")

    print(f"zones      {len(set(zones_written))}")
    print(f"nodes      {nodes}")
    print(f"tiles      {len(tiles)}")
    print(f"total      {total_bytes} bytes ({total_bytes / 1e6:.2f} MB)")
    print(f"worst tile {worst_tile[0]} at {worst_tile[1]} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
