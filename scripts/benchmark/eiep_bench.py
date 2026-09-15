#!/usr/bin/env python3
"""Benchmark track IMP: every case of benchmark/matrices/impact.json at each
of its distances, as the Earth Impact Effects Program answers it.

Reads the Earth Impact Effects Program (Collins, Melosh & Marcus 2005) at
https://impact.ese.ic.ac.uk/map, one request at a time with a pause, keeps
every page in a cache directory, and writes one JSON line per (case,
distance) with what the page says. The page parser is the one
scripts/eiep-reference.py uses, with the map's airblast and tsunami radii
added. Nothing here runs Nimbus.

    python3 scripts/benchmark/eiep_bench.py <work directory>

Resumable: a (case, distance) already in the output is not asked again.
"""

import hashlib
import importlib.util
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("eiep_reference", ROOT / "scripts" / "eiep-reference.py")
EIEP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EIEP)

BASE = "https://impact.ese.ic.ac.uk/map"
PAUSE_S = 1.0


def query(case, km):
    params = {
        "input_method": "distanceonly",
        "distance": km,
        "distanceUnits": "km",
        "diam": case["diameterM"],
        "diameterUnits": "m",
        "pdens": case["densityKgM3"],
        "vel": case["velocityKmS"],
        "velocityUnits": 1,
        "theta": case["angleDeg"],
        "target_type": case["target"],
    }
    if case["target"] == "water":
        params["wdepth"] = case["waterDepthM"]
        params["wdepthUnits"] = "m"
    return f"{BASE}?{urllib.parse.urlencode(params)}"


def fetch(url, cache):
    key = hashlib.sha256(url.encode()).hexdigest()
    path = cache / f"{key}.html"
    if path.exists():
        return path.read_text(), None
    req = urllib.request.Request(url, headers={"User-Agent": "nimbus-benchmark"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                page = r.read().decode("utf-8", "replace")
            path.write_text(page)
            time.sleep(PAUSE_S)
            return page, None
        except urllib.error.HTTPError as e:
            time.sleep(PAUSE_S)
            if e.code >= 500 and attempt < 1:
                time.sleep(5)
                continue
            return None, f"HTTP {e.code}"
        except Exception as e:  # noqa: BLE001 — network errors are retried
            if attempt == 3:
                return None, f"network: {e}"
            time.sleep(10 * (attempt + 1))
    return None, "no answer"


def extra(page):
    """The map radii scripts/eiep-reference.py does not read."""
    scripts = "\n".join(re.findall(r"<script(?![^>]*src)[^>]*>(.*?)</script>", page, re.S))
    out = {}

    def flat(name):
        m = re.search(name + r"\s*=\s*\[(.*?)\]\s*;", scripts, re.S)
        if not m:
            return None
        return [float(x) * EIEP.EARTH_DIAMETER_FACTOR for x in re.findall(r"[-\d.eE]+", m.group(1))]

    def pairs(name):
        m = re.search(name + r"\s*=\s*\[(.*?)\]\s*;", scripts, re.S)
        if not m:
            return None
        return [
            [float(a), float(b) * EIEP.EARTH_DIAMETER_FACTOR]
            for a, b in re.findall(r"\[\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\]", m.group(1))
        ]

    # impact.js labels the airblast radii largest first: 1 kPa window
    # damage, 5 kPa windows shatter, 20 kPa wood-frame collapse, then
    # steel-frame collapse and vehicles overturned.
    out["airblastRadiiM"] = flat("airblastRadii")
    out["craterRadiiM"] = flat("craterRadii")
    out["tsunamiRadiiM"] = pairs("tsunamiRadii")
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>", " ", page, flags=re.S)))
    m = re.search(r"The air blast will arrive approximately (?:(\d+) hours?,? ?)?(?:(\d+) minutes?,? ?)?(?:(\d+) seconds?)?", text)
    if m and any(m.groups()):
        h, mi, s = (int(g) if g else 0 for g in m.groups())
        out["airblastArrivalS"] = h * 3600 + mi * 60 + s
    m = re.search(r"The crater opened in the water has a diameter of ([\d.]+) (km|meters)", text)
    out["waterCraterDiameterM"] = EIEP.metres(float(m.group(1)), m.group(2)) if m else None
    m = re.search(r"The volume of the target melted or vaporised is ([\d.]+(?: x 10 -?\d+)?) km", text)
    out["meltVolumeKm3"] = EIEP.number(m.group(1)) if m else None
    return out


def main():
    work = Path(sys.argv[1])
    cache = work / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    out_path = work / "eiep.jsonl"
    done = set()
    if out_path.exists():
        for line in out_path.read_text().splitlines():
            row = json.loads(line)
            done.add((row["id"], row["distanceKm"]))
    cases = json.loads((ROOT / "benchmark" / "matrices" / "impact.json").read_text())
    total = sum(len(c["distancesKm"]) for c in cases)
    n = len(done)
    with out_path.open("a") as out:
        for case in cases:
            for km in case["distancesKm"]:
                if (case["id"], km) in done:
                    continue
                url = query(case, km)
                page, error = fetch(url, cache)
                row = {"id": case["id"], "distanceKm": km, "url": url, "error": error}
                if page is not None:
                    try:
                        row.update(EIEP.parse(page))
                        row.update(extra(page))
                    except Exception as e:  # noqa: BLE001 — a page the parser cannot read is recorded
                        row["error"] = f"parse: {e}"
                out.write(json.dumps(row) + "\n")
                out.flush()
                n += 1
                if n % 50 == 0:
                    print(f"{n}/{total}", flush=True)
    print(f"done {n}/{total}", flush=True)


if __name__ == "__main__":
    main()
