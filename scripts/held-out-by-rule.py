#!/usr/bin/env python3
"""Rows of the held-out sets chosen by rule.

Writes src/physics/validation/heldOutByRuleData.ts from three sources,
under rules 11 to 16 of src/physics/validation/heldOutByRule.ts, and
nothing else: it reads no model and computes no model value.

  - NOAA NCEI/WDS Global Significant Earthquake Database
    (doi:10.7289/V5TD9V7K), through its hazard-service API;
  - USGS ComCat, through its FDSN event service: the preferred origin
    and magnitude of each earthquake, and its preferred moment tensor;
  - IVESPA (Aubry et al. 2021; data CC0), in the file the IVESPA working
    group published with its 2023 GRL paper, IVESPA_GRL2023_data.xlsx
    (github.com/thomasaubry/IVESPA_GRL2023_scripts), given on the
    command line.

Standard library only:

    python3 scripts/held-out-by-rule.py path/to/IVESPA_GRL2023_data.xlsx

The databases change as records are revised, so a run on another day can
write a different file; the file in the repository is the one the rules
were applied to, and it records the day it was read.
"""

import hashlib
import json
import math
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "physics" / "validation" / "heldOutByRuleData.ts"

NCEI_QUERY = (
    "https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes"
    "?minYear=2008&maxYear=2025&minEqMagnitude=6&maxEqDepth=40"
)
COMCAT = "https://earthquake.usgs.gov/fdsnws/event/1/query"
MATCH_SECONDS = 120
MATCH_KM = 200.0
IVESPA_FIRST_YEAR = 2009


def get_json(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "nimbus-validation"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception:  # noqa: BLE001 — retried, then raised
            if attempt == 4:
                raise
            time.sleep(2 * (attempt + 1))
    return None


def clean(x):
    """A spreadsheet float without its binary noise: 7.0000000000000007E-2 is 0.07."""
    return float(f"{float(x):.12g}")


def km_between(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


# ---------------------------------------------------------------- NCEI


def ncei_items():
    items, page = [], 1
    while True:
        d = get_json(f"{NCEI_QUERY}&itemsPerPage=200&page={page}")
        items += d["items"]
        if page >= d["totalPages"]:
            return items
        page += 1


def ncei_time(it):
    """Epoch seconds, and whether the database gives the time of day."""
    if it.get("hour") is None:
        t = datetime(it["year"], it["month"], it["day"], 12, tzinfo=timezone.utc)
        return t.timestamp(), False
    sec = float(it.get("second") or 0)
    t = datetime(
        it["year"], it["month"], it["day"], it["hour"], it.get("minute") or 0, tzinfo=timezone.utc
    ) + timedelta(seconds=sec)
    return t.timestamp(), True


# -------------------------------------------------------------- ComCat


def comcat_year(year):
    url = (
        f"{COMCAT}?format=geojson&starttime={year}-01-01&endtime={year + 1}-01-01"
        "&minmagnitude=5.5&orderby=time-asc"
    )
    return get_json(url)["features"]


def match(it, catalogue):
    t, has_time = ncei_time(it)
    window = MATCH_SECONDS if has_time else 86_400
    best = None
    for f in catalogue:
        dt = abs(f["properties"]["time"] / 1000 - t)
        if dt > window:
            continue
        lon, lat = f["geometry"]["coordinates"][:2]
        dist = km_between(it["latitude"], it["longitude"], lat, lon)
        if dist > MATCH_KM:
            continue
        key = (dt, dist) if has_time else (dist, dt)
        if best is None or key < best[0]:
            best = (key, f["id"])
    return best[1] if best else None


def rake_bin(rake):
    r = (rake + 180.0) % 360.0 - 180.0
    if abs(r) <= 30 or abs(r) >= 150:
        return "strike-slip"
    return "reverse" if r > 0 else "normal"


def comcat_detail(event_id):
    d = get_json(f"{COMCAT}?eventid={event_id}&format=geojson")
    p = d["properties"]
    lon, lat, depth = d["geometry"]["coordinates"]
    tensors = p["products"].get("moment-tensor", [])
    rakes = None
    if tensors:
        best = max(tensors, key=lambda pr: pr.get("preferredWeight", 0))
        q = best["properties"]
        if q.get("nodal-plane-1-rake") is not None and q.get("nodal-plane-2-rake") is not None:
            rakes = [clean(q["nodal-plane-1-rake"]), clean(q["nodal-plane-2-rake"])]
    if rakes is None:
        fault = "all"
    else:
        bins = {rake_bin(r) for r in rakes}
        fault = bins.pop() if len(bins) == 1 else "all"
    return {
        "comcat": d["id"],
        "time": datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "magnitude": clean(p["mag"]),
        "magnitudeType": p["magType"],
        "depthKm": clean(depth),
        "latitude": clean(lat),
        "longitude": clean(lon),
        "rakes": rakes,
        "faultType": fault,
    }


def earthquakes():
    items = ncei_items()
    years = sorted({it["year"] for it in items})
    catalogue = {y: comcat_year(y) for y in years}
    matched, unmatched = {}, []
    for it in items:
        pool = catalogue[it["year"]] + catalogue.get(it["year"] + 1, [])[:50]
        cid = match(it, pool)
        entry = {
            "ncei": it["id"],
            "date": f"{it['year']:04d}-{it['month']:02d}-{it['day']:02d}",
            "place": re.sub(r"\s+", " ", it.get("locationName") or "").strip(),
            "deaths": int(it.get("deaths") or 0),
            "missing": int(it.get("missing") or 0),
        }
        if cid is None:
            unmatched.append(entry)
            continue
        matched.setdefault(cid, []).append(entry)
    with ThreadPoolExecutor(max_workers=4) as pool:
        details = dict(zip(matched, pool.map(comcat_detail, matched)))
    rows = []
    for cid, entries in matched.items():
        entries.sort(key=lambda e: e["ncei"])
        rows.append(
            {
                "nceiIds": [e["ncei"] for e in entries],
                "date": entries[0]["date"],
                "place": " / ".join(e["place"] for e in entries),
                **details[cid],
                "deaths": sum(e["deaths"] for e in entries),
                "missing": sum(e["missing"] for e in entries),
            }
        )
    rows.sort(key=lambda r: (r["time"], r["comcat"]))
    return len(items), rows, unmatched


# -------------------------------------------------------------- IVESPA

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def sheet_rows(path, wanted):
    z = zipfile.ZipFile(path)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    for s in wb.find("m:sheets", NS):
        if s.get("name") != wanted:
            continue
        target = rels[s.get(f"{{{NS['r']}}}id")]
        target = target if target.startswith("xl/") else "xl/" + target.lstrip("/")
        out = []
        for row in ET.fromstring(z.read(target)).iter(f"{{{NS['m']}}}row"):
            cells = {}
            for c in row.findall("m:c", NS):
                col = 0
                for ch in re.match(r"[A-Z]+", c.get("r")).group(0):
                    col = col * 26 + ord(ch) - 64
                v = c.find("m:v", NS)
                if v is None:
                    continue
                cells[col - 1] = shared[int(v.text)] if c.get("t") == "s" else v.text
            if cells:
                out.append([cells.get(i) for i in range(max(cells) + 1)])
        return out
    raise SystemExit(f"no sheet {wanted}")


def plumes(path):
    rows = sheet_rows(path, "Consensual_ESP_values")
    header = rows[1]
    col = {h: i for i, h in enumerate(header) if h}

    def cell(r, name):
        i = col[name]
        return r[i] if i < len(r) else None

    out = []
    for r in rows[2:]:
        if int(cell(r, "Event Year")) < IVESPA_FIRST_YEAR:
            continue
        start = datetime(1899, 12, 30) + timedelta(
            days=float(cell(r, "Date  & Time ( dd/mm/yyyy hh:mm:ss UTC)"))
        )
        out.append(
            {
                "ivespa": cell(r, "IVESPA ID"),
                "volcano": cell(r, "Volcano"),
                "phase": re.sub(r"\s+", " ", str(cell(r, "Event Name"))).strip(),
                "start": (start + timedelta(seconds=0.5)).strftime("%Y-%m-%dT%H:%MZ"),
                "style": cell(r, "Eruption style"),
                "morphology": cell(r, "Plume morphology"),
                "latitude": clean(cell(r, "Latitude (deg. N)")),
                "longitude": clean(cell(r, "Longitude (deg. E)")),
                "ventAltitudeM": clean(cell(r, "Vent altitude (m a.s.l.)")),
                "durationH": clean(cell(r, "Duration Best estimate (hours)")),
                "temKg": clean(cell(r, "TEM Best estimate (kg)")),
                "plumeTopKmAsl": clean(cell(r, "Ash Plume Top (km asl) Best estimate")),
                "plumeTopUncertaintyKm": clean(cell(r, "Ash Plume Top (km asl) Uncertainty")),
            }
        )
    out.sort(key=lambda p: (p["start"], p["ivespa"]))
    return len(rows) - 2, out


# --------------------------------------------------------------- write


def ts(value):
    return json.dumps(value, ensure_ascii=False, indent=2)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    xlsx = Path(sys.argv[1])
    sha = hashlib.sha256(xlsx.read_bytes()).hexdigest()
    read_on = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ncei_count, quakes, unmatched = earthquakes()
    ivespa_count, eruptions = plumes(xlsx)
    OUT.write_text(
        f"""// Generated by scripts/held-out-by-rule.py on {read_on}. Do not edit by
// hand: the rules that chose these rows are in heldOutByRule.ts, and a
// row changed by hand is a row chosen by hand.
//
// Earthquakes: {ncei_count} records of the NCEI/WDS Global Significant Earthquake
// Database (doi:10.7289/V5TD9V7K) returned by
//   {NCEI_QUERY}
// matched to {len(quakes)} USGS ComCat events ({len(unmatched)} unmatched).
// Plumes: {len(eruptions)} of the {ivespa_count} IVESPA phases in IVESPA_GRL2023_data.xlsx,
// SHA-256 {sha}.

export interface RuleEarthquakeRow {{
  /** NCEI record ids; more than one where the database lists one
   *  earthquake twice. */
  readonly nceiIds: readonly number[];
  /** The NCEI record's date and place. */
  readonly date: string;
  readonly place: string;
  /** The ComCat event, its preferred origin and magnitude. */
  readonly comcat: string;
  readonly time: string;
  readonly magnitude: number;
  readonly magnitudeType: string;
  readonly depthKm: number;
  readonly latitude: number;
  readonly longitude: number;
  /** Rakes of the preferred moment tensor's nodal planes, or null
   *  without one. */
  readonly rakes: readonly number[] | null;
  readonly faultType: 'strike-slip' | 'reverse' | 'normal' | 'all';
  /** NCEI deaths and missing, the earthquake's own; zero where none are
   *  listed. */
  readonly deaths: number;
  readonly missing: number;
}}

export interface UnmatchedRecord {{
  readonly ncei: number;
  readonly date: string;
  readonly place: string;
  readonly deaths: number;
  readonly missing: number;
}}

export interface RulePlumeRow {{
  readonly ivespa: string;
  readonly volcano: string;
  readonly phase: string;
  /** Start of the phase, UTC. */
  readonly start: string;
  readonly style: string;
  readonly morphology: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ventAltitudeM: number;
  /** Best estimates: duration, total erupted mass, ash plume top. */
  readonly durationH: number;
  readonly temKg: number;
  readonly plumeTopKmAsl: number;
  readonly plumeTopUncertaintyKm: number;
}}

export const RULE_READ_ON = {ts(read_on)};

export const NCEI_EARTHQUAKE_ROWS: readonly RuleEarthquakeRow[] = {ts(quakes)};

export const NCEI_UNMATCHED: readonly UnmatchedRecord[] = {ts(unmatched)};

export const IVESPA_PLUME_ROWS: readonly RulePlumeRow[] = {ts(eruptions)};
"""
    )
    print(f"wrote {OUT.relative_to(ROOT)}: {len(quakes)} earthquakes, {len(unmatched)} unmatched, {len(eruptions)} plumes")


if __name__ == "__main__":
    main()
