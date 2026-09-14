#!/usr/bin/env python3
"""The Earth Impact Effects Program's answers on a fixed grid of impacts.

Writes src/physics/validation/eiepReference.ts: for each impact of the grid
below, what the online Earth Impact Effects Program (Collins, Melosh &
Marcus 2005; impact.ese.ic.ac.uk, run by its authors) prints — the energy,
the atmospheric entry, the crater, and the air blast at a distance — so the
simulator's impact pipeline can be held to the reference implementation of
the equations it cites, across the inputs a custom scenario can set.

The grid is fixed here and not chosen by its results. Water targets are left
out: the program puts the crater on the sea floor under the water column,
and the simulator models the water cavity instead, so the two do not answer
the same question.

Standard library only; one request every 1.5 s:

    python3 scripts/eiep-reference.py
"""

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "physics" / "validation" / "eiepReference.ts"
BASE = "https://impact.ese.ic.ac.uk/map"
EARTH_DIAMETER_FACTOR = 1.274e7 * 0.5  # the page's map radii are in these units


def grid():
    rows = []
    for d in (10, 30, 100, 300, 1000, 3000, 10000):
        for v in (12, 20, 50):
            for a in (15, 45, 90):
                rows.append((d, 3000, v, a, "sedimentary", 100))
    for rho in (1000, 1500, 8000):
        for d in (30, 300, 3000):
            rows.append((d, rho, 20, 45, "sedimentary", 100))
    for d in (100, 1000, 10000):
        rows.append((d, 3000, 20, 45, "crystalline", 100))
    for km in (10, 30, 300, 1000):
        for d in (300, 3000):
            rows.append((d, 3000, 20, 45, "sedimentary", km))
    return rows


def fetch(d, rho, v, a, target, km):
    q = urllib.parse.urlencode(
        {
            "input_method": "distanceonly",
            "distance": km,
            "distanceUnits": "km",
            "diam": d,
            "diameterUnits": "m",
            "pdens": rho,
            "vel": v,
            "velocityUnits": 1,
            "theta": a,
            "target_type": target,
        }
    )
    req = urllib.request.Request(f"{BASE}?{q}", headers={"User-Agent": "nimbus-validation"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8", "replace"), None
        except urllib.error.HTTPError as e:
            # The program itself failing on an input is an answer too:
            # recorded, not retried into the ground.
            if e.code >= 500 and attempt < 1:
                time.sleep(5)
                continue
            return None, f"HTTP {e.code}"
        except Exception:  # noqa: BLE001 — a network error is retried
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))
    return None, "no answer"


def number(text):
    """'3.1 x 10 20' or '69274.769' as a float."""
    m = re.match(r"\s*(-?[\d.]+)\s*x\s*10\s*(-?\d+)", text)
    if m:
        return float(m.group(1)) * 10 ** int(m.group(2))
    return float(re.match(r"\s*(-?[\d.]+)", text).group(1))


def metres(value, unit):
    return value * (1000.0 if unit.startswith("km") else 1.0)


def parse(page):
    scripts = "\n".join(re.findall(r"<script(?![^>]*src)[^>]*>(.*?)</script>", page, re.S))
    text = re.sub(r"<script.*?</script>", " ", page, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s+", " ", text)
    out = {}

    def grab(pattern):
        m = re.search(pattern, text)
        return m

    m = grab(r"Energy Before Atmospheric Entry ([\d.]+ x 10 -?\d+) Joules")
    out["energyJ"] = number(m.group(1)) if m else None
    m = grab(r"begins to breakup at an altitude of ([\d.]+) meters")
    out["breakupAltitudeM"] = float(m.group(1)) if m else None
    m = grab(r"bursts into a cloud of fragments at an altitude of ([\d.]+) meters")
    out["burstAltitudeM"] = float(m.group(1)) if m else None
    m = grab(r"strikes the surface at velocity ([\d.]+) km/s")
    out["impactVelocityKmS"] = float(m.group(1)) if m else None
    m = grab(r"The impact energy is ([\d.]+ x 10 -?\d+) Joules")
    out["impactEnergyJ"] = number(m.group(1)) if m else None
    m = grab(r"The energy of the airburst is ([\d.]+ x 10 -?\d+) Joules")
    out["airburstEnergyJ"] = number(m.group(1)) if m else None
    m = grab(r"Peak Overpressure ([\d.]+)(?: - ([\d.]+))? Pa")
    out["overpressurePa"] = (
        None if not m else [float(m.group(1)), float(m.group(2) or m.group(1))]
    )
    m = grab(r"Maximum Wind Velocity ([\d.]+) m/s")
    out["windMs"] = float(m.group(1)) if m else None
    m = grab(r"Transient Crater diameter: ([\d.]+) (km|meters)")
    out["transientDiameterM"] = metres(float(m.group(1)), m.group(2)) if m else None
    m = grab(r"Transient Crater Depth ([\d.]+) (km|meters)")
    out["transientDepthM"] = metres(float(m.group(1)), m.group(2)) if m else None
    m = grab(r"Final Crater diameter: ([\d.]+) (km|meters)")
    out["finalDiameterM"] = metres(float(m.group(1)), m.group(2)) if m else None
    m = grab(r"Final Crater Depth ([\d.]+) (km|meters)")
    out["finalDepthM"] = metres(float(m.group(1)), m.group(2)) if m else None
    m = grab(r"The crater formed is a (simple|complex) crater")
    out["craterType"] = m.group(1) if m else ("none" if "No crater is formed" in text else None)

    def radii(name, pairs=False):
        m = re.search(name + r"\s*=\s*\[(.*?)\]\s*;", scripts, re.S)
        if not m:
            return None
        body = m.group(1)
        if pairs:
            return [
                [float(a), float(b) * EARTH_DIAMETER_FACTOR]
                for a, b in re.findall(r"\[\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\]", body)
            ]
        return [float(x) * EARTH_DIAMETER_FACTOR for x in re.findall(r"[-\d.eE]+", body)]

    out["seismicRadiiM"] = radii("seismicRadii", pairs=True)
    out["ejectaRadiiM"] = radii("ejectaRadii", pairs=True)
    out["fireballRadiiM"] = radii("fireballRadii")
    return out


def main():
    read_on = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rows = []
    for i, (d, rho, v, a, target, km) in enumerate(grid()):
        page, error = fetch(d, rho, v, a, target, km)
        row = {
            "diameterM": d,
            "densityKgM3": rho,
            "velocityKmS": v,
            "angleDeg": a,
            "target": target,
            "distanceKm": km,
            "error": error,
        }
        if page is not None:
            row.update(parse(page))
        rows.append(row)
        print(f"{i + 1}/{len(grid())} {d} m {rho} kg/m3 {v} km/s {a} deg {target} {km} km {error or ''}", flush=True)
        time.sleep(1.5)
    OUT.write_text(
        f"""// Generated by scripts/eiep-reference.py on {read_on}. Do not edit by
// hand: the grid is fixed in the script, and a value changed by hand is a
// reference nobody computed.
//
// The Earth Impact Effects Program (Collins, Melosh & Marcus 2005,
// Meteoritics & Planetary Science 40: 817-840), as its authors run it at
// {BASE}. Map radii are converted from the page's units to metres.

export interface EiepRow {{
  readonly diameterM: number;
  readonly densityKgM3: number;
  readonly velocityKmS: number;
  readonly angleDeg: number;
  readonly target: 'sedimentary' | 'crystalline';
  readonly distanceKm: number;
  /** The program's own failure on this input, where it failed. */
  readonly error: string | null;
  readonly energyJ?: number | null;
  readonly breakupAltitudeM?: number | null;
  readonly burstAltitudeM?: number | null;
  readonly impactVelocityKmS?: number | null;
  readonly impactEnergyJ?: number | null;
  readonly airburstEnergyJ?: number | null;
  /** Low and high ends, equal where the program prints one figure. */
  readonly overpressurePa?: readonly [number, number] | null;
  readonly windMs?: number | null;
  readonly transientDiameterM?: number | null;
  readonly transientDepthM?: number | null;
  readonly finalDiameterM?: number | null;
  readonly finalDepthM?: number | null;
  readonly craterType?: 'simple' | 'complex' | 'none' | null;
  /** [Mercalli intensity, radius (m)]. */
  readonly seismicRadiiM?: readonly (readonly [number, number])[] | null;
  /** [ejecta thickness (m), radius (m)]. */
  readonly ejectaRadiiM?: readonly (readonly [number, number])[] | null;
  readonly fireballRadiiM?: readonly number[] | null;
}}

export const EIEP_READ_ON = {json.dumps(read_on)};

export const EIEP_REFERENCE: readonly EiepRow[] = {json.dumps(rows, indent=2)};
"""
    )
    print(f"wrote {OUT.relative_to(ROOT)}: {len(rows)} impacts")


if __name__ == "__main__":
    main()
