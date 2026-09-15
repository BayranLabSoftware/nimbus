#!/usr/bin/env python3
"""The deep-ocean records of BM-05 (docs/BENCHMARK_PROTOCOL.md, "After the
campaign: the far wave of a megathrust", as amended on 15 September 2026),
under the rules written there and nothing else: it reads no model and computes
no model value.

  - USGS ComCat, through its FDSN event service: the events, their preferred
    magnitude, origin and moment tensor;
  - NOAA NDBC: the station table (positions of the DART stations) and the
    historical DART files, <station>t<year>.txt.gz, of water-column height.

Needs numpy and scipy:

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
from scipy.signal import butter, filtfilt

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
MIN_RANGE_M = 0.02
NOISE_MULTIPLE = 5.0
MIN_EVENT_RECORDS = 4

# The amendment of 15 September 2026.
# Bad samples: Hampel's identifier on the tide residual, among the neighbours
# of the same kind (T 1 = 15 min, 2 = 1 min, 3 = 15 s) within these spans.
SCREEN_HALF_S = {1: 4500.0, 2: 300.0, 3: 300.0}
SCREEN_MADS = 5.0
SCREEN_FLOOR_M = 0.01
MAX_BAD_SHARE = 0.05
MAX_FIT_RMS_M = 0.02
# Seismic noise: one-minute means, short gaps bridged, low-passed at 3 min.
BRIDGE_MIN = 3
MIN_STRETCH_MIN = 30
LOWPASS_PERIOD_MIN = 3.0
# The two coverage rules and the two crest floors, crossed into four variants.
MIN_COVERAGE = 0.90
MIN_SERIES_MIN = 60
CREST_MARGIN_S = 1800.0
EDGE_S = 90.0
CREST_FLOORS_M = {"2cm": 0.02, "1cm": 0.01}
CREST_NOISE_MULTIPLE = 2.5

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


def tide_design(hours):
    cols = [np.ones_like(hours), hours / 72.0, (hours / 72.0) ** 2]
    for period in CONSTITUENTS.values():
        w = 2 * math.pi / period
        cols += [np.cos(w * hours), np.sin(w * hours)]
    return np.stack(cols, axis=1)


def spikes(secs, kinds, resid, good):
    """Hampel's identifier: a sample further from the median of its neighbours
    of the same kind than five scaled median absolute deviations, and than
    1 cm. Transmitted DART values carry bit errors of metres (4.9, 16.4,
    32.8 m); a tsunami moves a minute's mean by nothing like that."""
    bad = np.zeros(resid.size, dtype=bool)
    for kind, half in SCREEN_HALF_S.items():
        idx = np.flatnonzero(good & (kinds == kind))
        if idx.size == 0:
            continue
        s, r = secs[idx], resid[idx]
        lo = np.searchsorted(s, s - half, side="left")
        hi = np.searchsorted(s, s + half, side="right")
        for j in range(idx.size):
            near = np.concatenate([r[lo[j] : j], r[j + 1 : hi[j]]])
            if near.size < 4:
                continue
            med = np.median(near)
            mad = np.median(np.abs(near - med))
            if abs(r[j] - med) > max(SCREEN_MADS * 1.4826 * mad, SCREEN_FLOOR_M):
                bad[idx[j]] = True
    return bad


def lowpassed(secs, resid):
    """One-minute means of the high-rate residuals, gaps of up to 3 min bridged,
    every stretch of 30 min or more low-passed at a 3-min period (Butterworth,
    fourth order, forward and back): near the source the 15-s values swing by
    metres with the seismic waves long after 20 min."""
    if secs.size == 0:
        return []
    minute = np.floor(secs / 60.0).astype(int)
    mins, inverse = np.unique(minute, return_inverse=True)
    means = np.bincount(inverse, weights=resid) / np.bincount(inverse)
    b, a = butter(4, 2.0 / LOWPASS_PERIOD_MIN)
    out = []
    breaks = np.flatnonzero(np.diff(mins) > BRIDGE_MIN + 1) + 1
    for part in np.split(np.arange(mins.size), breaks):
        m = mins[part]
        full = np.arange(m[0], m[-1] + 1)
        if full.size < MIN_STRETCH_MIN:
            continue
        out.append((full * 60.0 + 30.0, filtfilt(b, a, np.interp(full, m, means[part]))))
    return out


def record(work, event, sid, pos):
    origin = datetime.fromisoformat(event["origin"])
    start, end = origin - timedelta(days=FIT_DAYS), origin + timedelta(days=FIT_DAYS)
    rows = []
    for year in sorted({start.year, origin.year, end.year}):
        rows += [r for r in read_dart(work, sid, year) if start <= r[0] <= end]
    if not rows:
        return None
    # A time stamped twice for the same kind of sample keeps the mean.
    grouped = {}
    for t, kind, h in rows:
        grouped.setdefault((t, kind), []).append(h)
    keys = sorted(grouped)
    secs = np.array([(t - origin).total_seconds() for t, _ in keys])
    kinds = np.array([kind for _, kind in keys])
    height = np.array([sum(grouped[k]) / len(grouped[k]) for k in keys])
    dist_km = km_between(event["lat"], event["lon"], pos[0], pos[1])
    t_open = max(dist_km * 1_000 / FAST_MS - LEAD_S, RAYLEIGH_S)
    t_close = dist_km * 1_000 / SLOW_MS + TAIL_S
    # Tide: constituents and a quadratic drift, fitted outside the event, with
    # bad samples screened out of the residual and the fit repeated.
    fit = (secs < -EXCLUDE_BEFORE_H * 3600) | (secs > EXCLUDE_AFTER_H * 3600)
    if fit.sum() < 100:
        return None
    A = tide_design(secs / 3600.0)
    good = np.ones(height.size, dtype=bool)
    for _ in range(10):
        coef, *_ = np.linalg.lstsq(A[fit & good], height[fit & good], rcond=None)
        bad = spikes(secs, kinds, height - A @ coef, good)
        if not bad.any():
            break
        good &= ~bad
    coef, *_ = np.linalg.lstsq(A[fit & good], height[fit & good], rcond=None)
    resid = height - A @ coef
    fit_rms = float(np.std(resid[fit & good]))
    before = good & (secs >= -3 * 3600) & (secs < 0)
    noise = float(np.std(resid[before])) if before.sum() >= 5 else float("nan")
    fast = (kinds == 2) | (kinds == 3)
    window = (secs >= t_open) & (secs <= t_close)
    fast_in_window = int((fast & window).sum())
    bad_share = float((fast & window & ~good).sum() / fast_in_window) if fast_in_window else 0.0
    base = {
        "station": sid,
        "lat": pos[0],
        "lon": pos[1],
        "distanceKm": round(dist_km, 1),
        "bearingDeg": round(bearing_deg(event["lat"], event["lon"], pos[0], pos[1]), 1),
    }
    pieces = []
    for t, v in lowpassed(secs[fast & good], resid[fast & good]):
        inside = (t >= t_open) & (t <= t_close)
        if inside.any():
            pieces.append((t[inside], v[inside]))
    minutes = sum(t.size for t, _ in pieces)
    if minutes == 0:
        return {**base, "coverage": 0.0, "keptBy": {}, "reason": "no high-rate samples in the window"}
    t_all = np.concatenate([t for t, _ in pieces])
    v_all = np.concatenate([v for _, v in pieces])
    level = float(np.median(v_all))
    i = int(np.argmax(v_all))
    crest = float(v_all[i]) - level
    at = float(t_all[i])
    rng = float(v_all.max() - v_all.min())
    coverage = min(minutes * 60.0 / (t_close - t_open), 1.0)
    seg = next(t for t, _ in pieces if t[0] <= at <= t[-1])
    bracketed = (
        minutes >= MIN_SERIES_MIN
        and (at - seg[0] >= CREST_MARGIN_S or seg[0] - t_open <= EDGE_S)
        and (seg[-1] - at >= CREST_MARGIN_S or t_close - seg[-1] <= EDGE_S)
    )
    quiet = math.isnan(noise)
    sound = fit_rms <= MAX_FIT_RMS_M and bad_share <= MAX_BAD_SHARE
    ranged = rng >= MIN_RANGE_M and (quiet or rng >= NOISE_MULTIPLE * noise)
    kept_by = {}
    for name, floor in CREST_FLOORS_M.items():
        crested = crest >= floor and (quiet or crest >= CREST_NOISE_MULTIPLE * noise)
        kept_by[f"bracketed-{name}"] = bool(sound and ranged and crested and bracketed)
        kept_by[f"covered-{name}"] = bool(sound and ranged and crested and coverage >= MIN_COVERAGE)
    waterline = good & window
    return {
        **base,
        "waterDepthM": round(float(np.median(height[waterline])), 1) if waterline.any() else None,
        "crestM": round(crest, 4),
        "rangeM": round(rng, 4),
        "levelM": round(level, 4),
        "crestAfterS": round(at),
        "noiseM": None if quiet else round(noise, 4),
        "tideFitRmsM": round(fit_rms, 4),
        "badShare": round(bad_share, 3),
        "coverage": round(coverage, 3),
        "bracketed": bool(bracketed),
        "keptBy": kept_by,
    }


VARIANTS = ("bracketed-2cm", "bracketed-1cm", "covered-2cm", "covered-1cm")


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
        kept_by = {v: sum(1 for r in recs if r["keptBy"].get(v)) >= MIN_EVENT_RECORDS for v in VARIANTS}
        out_events.append({**e, "keptBy": kept_by, "records": recs})
        counts = " ".join(f"{v} {sum(1 for r in recs if r['keptBy'].get(v))}" for v in VARIANTS)
        print(e["origin"][:10], e["magnitude"], e["place"], "records", len(recs), counts, flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "readOn": datetime.now(timezone.utc).date().isoformat(),
                "protocol": "docs/BENCHMARK_PROTOCOL.md, After the campaign: the far wave of a megathrust (BM-05), amended 15 September 2026",
                "sources": [COMCAT, STATION_TABLE, DART_INDEX],
                "variants": list(VARIANTS),
                "events": out_events,
            },
            indent=1,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
