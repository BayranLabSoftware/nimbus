#!/usr/bin/env python3
"""The site map an earthquake's shaking is amplified on: USGS's global Vs30
grid, reduced to the 2.5 arc-minute tiles the population already ships in.

The source is the grid ShakeMap and PAGER read (global_vs30.grd,
https://apps.usgs.gov/shakemap_geodata/vs30/global_vs30.grd, public domain):
Allen & Wald's topographic-slope proxy on 30 arc-second GMTED elevation, with
regional maps merged in for California, Washington and Oregon, Utah, Japan and
Taiwan. It is a netCDF-4 (HDF5) grid, gridline-registered, from 56° S to 84° N,
with no value at sea.

Each 2.5 arc-minute cell of `public/data/population-2p5` holds five of the
grid's rows and five of its columns — the points at its south-west corner and
the four steps of 30 seconds after it along each axis. The cell gets the
geometric mean of the ones that have a value, because a site term is linear in
ln Vs30, and nothing where none has. It is written in the same 60° × 30° tiles
of 1 440 × 720 pixels, as an 8-bit grey PNG:

    v = 0 for no value; v = 1 + round(254 · ln(Vs30 / 90) / ln(2 300 / 90))

so a step is 1.3 % of Vs30 and a site term read off it moves by less than 1 %.

    scripts/build-vs30.py <global_vs30.grd> <out directory>

Needs numpy and h5py. Nothing here runs Nimbus.
"""

import json
import math
import os
import struct
import sys
import warnings
import zlib

import h5py
import numpy as np

CELL_DEG = 2.5 / 60
TILE_W_DEG = 60
TILE_H_DEG = 30
TILE_W_PX = 1440
TILE_H_PX = 720
VS30_LOW = 90.0
VS30_HIGH = 2300.0


def encode(vs30):
    v = np.zeros(vs30.shape, dtype=np.uint8)
    ok = np.isfinite(vs30)
    clipped = np.clip(vs30[ok], VS30_LOW, VS30_HIGH)
    v[ok] = 1 + np.rint(254 * np.log(clipped / VS30_LOW) / math.log(VS30_HIGH / VS30_LOW)).astype(np.uint8)
    return v


def write_png(path, grey):
    h, w = grey.shape
    raw = b"".join(b"\x00" + grey[r].tobytes() for r in range(h))

    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 0, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: build-vs30.py <global_vs30.grd> <out directory>")
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    f = h5py.File(src, "r")
    lat = f["lat"][:]
    lon = f["lon"][:]
    z = f["z"]
    step = 30 / 3600
    # The grid runs south to north; index it by its own south-west corner.
    lat0, lon0 = float(lat[0]), float(lon[0])
    assert abs(lat[1] - lat[0] - step) < 1e-9 and abs(lon[1] - lon[0] - step) < 1e-9

    rows_total = int(round(180 / CELL_DEG))
    cols_total = int(round(360 / CELL_DEG))
    world = np.zeros((rows_total, cols_total), dtype=np.uint8)
    # Row r of the world runs from the north: its cell spans latitudes
    # [90 − (r + 1)·cell, 90 − r·cell), whose south-west corner is the grid row
    # at 90 − (r + 1)·cell.
    for r in range(rows_total):
        south = 90 - (r + 1) * CELL_DEG
        g0 = int(round((south - lat0) / step))
        if g0 < 0 or g0 + 5 > len(lat):
            continue
        block = z[g0 : g0 + 5, :]
        # Columns: cell c spans [−180 + c·cell, −180 + (c + 1)·cell).
        c0 = int(round((-180 - lon0) / step))
        usable = block[:, c0 : c0 + cols_total * 5].reshape(5, cols_total, 5)
        logs = np.log(np.where(np.isfinite(usable) & (usable > 0), usable, np.nan))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=RuntimeWarning)
            mean = np.nanmean(np.transpose(logs, (1, 0, 2)).reshape(cols_total, 25), axis=1)
        world[r] = encode(np.exp(mean))
        if r % 240 == 0:
            print(f"row {r}/{rows_total}", file=sys.stderr, flush=True)

    tiles = []
    for ty in range(6):
        for tx in range(6):
            tile = world[ty * TILE_H_PX : (ty + 1) * TILE_H_PX, tx * TILE_W_PX : (tx + 1) * TILE_W_PX]
            if not tile.any():
                continue
            name = f"{tx}_{ty}"
            write_png(os.path.join(out, f"{name}.png"), tile)
            tiles.append(name)
    index = {
        "source": "USGS global Vs30 (global_vs30.grd: Allen & Wald slope proxy with the CA, WA/OR, UT, JP and TW maps), public domain",
        "url": "https://apps.usgs.gov/shakemap_geodata/vs30/global_vs30.grd",
        "cellDeg": CELL_DEG,
        "tileWidthDeg": TILE_W_DEG,
        "tileHeightDeg": TILE_H_DEG,
        "tileCols": 6,
        "tileRows": 6,
        "tileWidthPx": TILE_W_PX,
        "tileHeightPx": TILE_H_PX,
        "minLat": -90,
        "maxLat": 90,
        "minLon": -180,
        "maxLon": 180,
        "aggregation": "geometric mean of the 5 x 5 grid points from the cell's south-west corner",
        "encoding": "v = 0: no value; Vs30 = 90 * exp((v - 1) * ln(2300 / 90) / 254)",
        "tiles": tiles,
    }
    with open(os.path.join(out, "index.json"), "w") as fh:
        json.dump(index, fh, indent=2)
        fh.write("\n")
    print(f"wrote {len(tiles)} tiles", file=sys.stderr)


if __name__ == "__main__":
    main()
