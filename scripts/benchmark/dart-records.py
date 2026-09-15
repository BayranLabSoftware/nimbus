#!/usr/bin/env python3
"""The deep-ocean records of BM-05 (docs/BENCHMARK_PROTOCOL.md, "After the
campaign: the far wave of a megathrust"), under the rules written there and
nothing else: it reads no model and computes no model value.

  - USGS ComCat, through its FDSN event service: the events, their preferred
    magnitude, origin and moment tensor;
  - NOAA NDBC: the station table (positions of the DART stations) and the
    historical DART files, <station>t<year>.txt.gz, of water-column height.

    python3 scripts/benchmark/dart-records.py <work dir>

Downloads are cached in the work directory. Writes benchmark/dart/records.json.
The archives are revised and extended, so a run on another day can write a
different file; the file in the repository is the one the models were scored
on, and it records the day it was read.
"""

import gzip
import html
import json
import math
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "benchmark" / "dart" / "records.json"

COMCAT = (
    "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson"
    "&starttime=2006-01-01&endtime=2026-01-01&minmagnitude=7.7&maxdepth=71&orderby=time-asc"
)
STATION_TABLE = "https://www.ndbc.noaa.gov/data/stations/station_table.txt"
DART_INDEX = "https://www.ndbc.noaa.gov/data/historical/dart/"
DART_FILE = DART_INDEX + "{station}t{year}.txt.gz"

MIN_MAGNITUDE = 7.7
MAX_DEPTH_KM = 71.0
MAX_DIP = 45.0
RAKE_RANGE = (45.0, 135.0)
OVERLAP_HOURS = 24.0

FIT_DAYS = 3.0
EXCLUDE_BEFORE_H = 1.0
EXCLUDE_AFTER_H = 30.0
FAST_MS, SLOW_MS = 250.0, 150.0
LEAD_S, TAIL_S, RAYLEIGH_S = 1800.0, 3 * 3600.0, 1200.0
MIN_COVERAGE = 0.90
MIN_RANGE_M = 0.02
NOISE_MULTIPLE = 5.0

# Periods (h) of the tidal constituents fitted.
CONSTITUENTS = {
    "M2": 12.4206012,
    "S2": 12.0,
    "N2": 12.65834751,
    "K2": 11.96723606,
    "K1": 23.93447213,
    "O1": 25.81933871,
    "P1": 24.06588766,
    "Q1": 26.868350,
}


def fetch(url, path=None, binary=False):
    if path is not None and path.exists():
        return path.read_bytes() if binary else path.read_text()
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "nimbus-validation"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            if path is not None:
                path.write_bytes(data)
            time.sleep(0.5)
            return data if binary else data.decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == 4:
                raise
        except Exception:  # noqa: BLE001 — retried, then raised
            if attempt == 4:
                raise
        time.sleep(2 * (attempt + 1))
    return None


def km_between(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def bearing_deg(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


# ------------------------------------------------------------------ events


def events(work):
    cat = json.loads(fetch(COMCAT, work / "comcat.json"))
    chosen = []
    for f in cat["features"]:
        p, (lon, lat, depth) = f["properties"], f["geometry"]["coordinates"]
        if p["mag"] < MIN_MAGNITUDE or depth > MAX_DEPTH_KM:
            continue
        detail = json.loads(fetch(p["detail"], work / f"detail-{f['id']}.json"))
        tensors = sorted(
            detail["properties"].get("products", {}).get("moment-tensor", []),
            key=lambda m: -m.get("preferredWeight", 0),
        )
        thrust = None
        for m in tensors:
            q = m["properties"]
            if "nodal-plane-1-strike" not in q:
                continue
            planes = []
            for k in (1, 2):
                rake = q.get(f"nodal-plane-{k}-rake", q.get(f"nodal-plane-{k}-slip"))
                planes.append(
                    (float(q[f"nodal-plane-{k}-strike"]), float(q[f"nodal-plane-{k}-dip"]), float(rake))
                )
            for strike, dip, rake in sorted(planes, key=lambda s: s[1]):
                r = ((rake + 180.0) % 360.0) - 180.0
                if dip <= MAX_DIP and RAKE_RANGE[0] <= r <= RAKE_RANGE[1]:
                    thrust = (strike, dip, r)
                    break
            break
        if thrust is None:
            continue
        chosen.append(
            {
                "id": f["id"],
                "origin": datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc).isoformat(),
                "magnitude": p["mag"],
                "magnitudeType": p["magType"],
                "lat": lat,
                "lon": lon,
                "depthKm": depth,
                "place": p["place"],
                "strikeDeg": thrust[0],
                "dipDeg": thrust[1],
                "rakeDeg": thrust[2],
            }
        )
    # Leave out an event that follows a larger one of the set within a day.
    kept = []
    for e in chosen:
        t = datetime.fromisoformat(e["origin"])
        later = [
            o
            for o in chosen
            if o is not e
            and o["magnitude"] > e["magnitude"]
            and timedelta(0) <= t - datetime.fromisoformat(o["origin"]) <= timedelta(hours=OVERLAP_HOURS)
        ]
        if not later:
            kept.append(e)
    return kept


# ---------------------------------------------------------------- stations


def stations(work):
    table = fetch(STATION_TABLE, work / "station_table.txt")
    out = {}
    for line in table.splitlines():
        if line.startswith("#"):
            continue
        cells = line.split("|")
        if len(cells) < 7:
            continue
        sid, ttype, payload, location = cells[0], cells[2], cells[5], html.unescape(cells[6])
        if not re.fullmatch(r"\d{5}", sid):
            continue
        if "tsunami" not in ttype.lower() and "dart" not in payload.lower():
            continue
        m = re.match(r"\s*([\d.]+)\s*([NS])\s+([\d.]+)\s*([EW])", location)
        if m is None:
            continue
        lat = float(m.group(1)) * (1 if m.group(2) == "N" else -1)
        lon = float(m.group(3)) * (1 if m.group(4) == "E" else -1)
        out[sid] = (lat, lon)
    return out


# ----------------------------------------------------------------- records


def available(work):
    """The station-years NDBC's historical DART directory lists."""
    index = fetch(DART_INDEX, work / "dart_index.html")
    return {(m.group(1), int(m.group(2))) for m in re.finditer(r"(\d{5})t(\d{4})\.txt\.gz", index)}


AVAILABLE = set()


def read_dart(work, station, year):
    if (station, year) not in AVAILABLE:
        return []
    raw = fetch(
        DART_FILE.format(station=station, year=year),
        work / f"{station}t{year}.txt.gz",
        binary=True,
    )
    if raw is None:
        return []
    rows = []
    for line in gzip.decompress(raw).decode("ascii", "replace").splitlines():
        if line.startswith("#"):
            continue
        p = line.split()
        if len(p) < 8:
            continue
        try:
            t = datetime(int(p[0]), int(p[1]), int(p[2]), int(p[3]), int(p[4]), int(p[5]), tzinfo=timezone.utc)
            h = float(p[7])
        except ValueError:
            continue
        if h >= 9000 or h <= 0:
            continue
        rows.append((t, int(p[6]), h))
    return rows


def record(work, event, sid, pos):
    origin = datetime.fromisoformat(event["origin"])
    start, end = origin - timedelta(days=FIT_DAYS), origin + timedelta(days=FIT_DAYS)
    rows = []
    for year in sorted({start.year, origin.year, end.year}):
        rows += [r for r in read_dart(work, sid, year) if start <= r[0] <= end]
    if not rows:
        return None
    rows.sort()
    dist_km = km_between(event["lat"], event["lon"], pos[0], pos[1])
    t_open = max(dist_km * 1_000 / FAST_MS - LEAD_S, RAYLEIGH_S)
    t_close = dist_km * 1_000 / SLOW_MS + TAIL_S
    secs = np.array([(r[0] - origin).total_seconds() for r in rows])
    kinds = np.array([r[1] for r in rows])
    height = np.array([r[2] for r in rows])
    # Tide: constituents and a quadratic drift, fitted outside the event.
    fit = (secs < -EXCLUDE_BEFORE_H * 3600) | (secs > EXCLUDE_AFTER_H * 3600)
    if fit.sum() < 100:
        return None
    hours = secs / 3600.0
    cols = [np.ones_like(hours), hours / 72.0, (hours / 72.0) ** 2]
    for period in CONSTITUENTS.values():
        w = 2 * math.pi / period
        cols += [np.cos(w * hours), np.sin(w * hours)]
    A = np.stack(cols, axis=1)
    coef, *_ = np.linalg.lstsq(A[fit], height[fit], rcond=None)
    resid = height - A @ coef
    window = (secs >= t_open) & (secs <= t_close)
    fast = window & (kinds >= 2)
    if not window.any():
        return None
    # Coverage by samples of 1 min or finer: the share of the window within
    # 60 s of such a sample.
    fast_secs = np.sort(secs[fast])
    covered = 0.0
    if fast_secs.size:
        lo = np.maximum(fast_secs - 30.0, t_open)
        hi = np.minimum(fast_secs + 30.0, t_close)
        edges = [(a, b) for a, b in zip(lo, hi) if b > a]
        merged = []
        for a, b in edges:
            if merged and a <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], b)
            else:
                merged.append([a, b])
        covered = sum(b - a for a, b in merged) / (t_close - t_open)
    before = (secs >= -3 * 3600) & (secs < 0)
    noise = float(np.std(resid[before])) if before.sum() >= 5 else float("nan")
    if covered < MIN_COVERAGE:
        return {
            "station": sid,
            "kept": False,
            "reason": f"1-min coverage {covered:.2f}",
            "distanceKm": round(dist_km, 1),
        }
    crest = float(resid[fast].max())
    trough = float(resid[fast].min())
    rng = crest - trough
    kept = rng >= MIN_RANGE_M and (math.isnan(noise) or rng >= NOISE_MULTIPLE * noise)
    at = float(secs[fast][int(np.argmax(resid[fast]))])
    return {
        "station": sid,
        "lat": pos[0],
        "lon": pos[1],
        "distanceKm": round(dist_km, 1),
        "bearingDeg": round(bearing_deg(event["lat"], event["lon"], pos[0], pos[1]), 1),
        "waterDepthM": round(float(np.median(height[window])), 1),
        "crestM": round(crest, 4),
        "rangeM": round(rng, 4),
        "crestAfterS": round(at),
        "noiseM": None if math.isnan(noise) else round(noise, 4),
        "fastCoverage": round(covered, 3),
        "tideFitRmsM": round(float(np.std(resid[fit])), 4),
        "kept": bool(kept),
        **({} if kept else {"reason": "below the detection rule"}),
    }


def main():
    work = Path(sys.argv[1])
    work.mkdir(parents=True, exist_ok=True)
    evs = events(work)
    dart = stations(work)
    AVAILABLE.update(available(work))
    out_events = []
    for e in evs:
        recs = []
        for sid, pos in sorted(dart.items()):
            r = record(work, e, sid, pos)
            if r is not None:
                recs.append(r)
        kept = [r for r in recs if r.get("kept")]
        out_events.append({**e, "kept": len(kept) >= 4, "records": recs})
        print(e["origin"][:10], e["magnitude"], e["place"], "records", len(recs), "kept", len(kept), flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "readOn": datetime.now(timezone.utc).date().isoformat(),
                "protocol": "docs/BENCHMARK_PROTOCOL.md, After the campaign: the far wave of a megathrust (BM-05)",
                "sources": [COMCAT, STATION_TABLE, DART_INDEX],
                "events": out_events,
            },
            indent=1,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
