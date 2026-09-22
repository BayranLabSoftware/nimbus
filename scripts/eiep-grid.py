#!/usr/bin/env python3
"""The Earth Impact Effects Program's answers on the wide grid of level A.

Level A of the certification plan of 22 September 2026 ("implementation
verified") asks the impact pipeline to be held to the reference
implementation of the equations it cites on hundreds to thousands of cases:
bodies from a metre to tens of kilometres, comet to iron, every speed an
impact can have, grazing to vertical, sedimentary and crystalline targets,
proximal to antipodal ranges, and the airburst, the ground impact and the
passage between them. scripts/eiep-reference.py fixed 84 of them; this fixes
the wide grid below, before any of its answers has been read.

It asks the program as its authors run it (impact.ese.ic.ac.uk), one request
every 1.5 s, with eiep-reference.py's own fetch and parser, and keeps
everything the page states — the printed figures and every ring its map
draws, in metres — so that no later question needs the program asked again.
The pages themselves are not kept.

    python3 scripts/eiep-grid.py            # resumes where it stopped

Standard library only. Writes src/physics/validation/eiepGrid.json, one row
per line; while it runs, a .partial.jsonl beside it holds what is done.
"""

import importlib.util
import json
import re
import html
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
spec = importlib.util.spec_from_file_location("eiep", HERE / "eiep-reference.py")
eiep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eiep)

OUT = ROOT / "src" / "physics" / "validation" / "eiepGrid.json"
PARTIAL = OUT.with_suffix(".partial.jsonl")

# The levels. Fixed here, before any answer was read.
DIAMETERS_M = (1, 3, 10, 30, 100, 300, 1_000, 3_000, 10_000, 30_000)
DENSITIES = (1_000, 1_500, 3_000, 8_000)  # comet, porous rock, rock, iron
VELOCITIES_KMS = (12, 17, 25, 40, 70)
ANGLES_DEG = (15, 30, 45, 60, 90)
DISTANCES_KM = (1, 3, 10, 30, 100, 300, 1_000, 3_000, 10_000, 20_000)


def grid():
    """Every case, in a fixed order. A range is given to each body by a
    Latin rotation over the levels, so that every range meets every size,
    density, speed and angle, rather than one range per size."""
    rows = []

    def add(block, d, rho, v, a, target, km):
        rows.append(
            {
                "block": block,
                "diameterM": d,
                "densityKgM3": rho,
                "velocityKmS": v,
                "angleDeg": a,
                "target": target,
                "distanceKm": km,
            }
        )

    # A — the factorial on sedimentary rock: 10 × 4 × 5 × 5 = 1 000.
    for i, d in enumerate(DIAMETERS_M):
        for j, rho in enumerate(DENSITIES):
            for k, v in enumerate(VELOCITIES_KMS):
                for n, a in enumerate(ANGLES_DEG):
                    km = DISTANCES_KM[(i + j + k + n) % len(DISTANCES_KM)]
                    add("factorial", d, rho, v, a, "sedimentary", km)

    # B — crystalline rock: 10 × 3 × 3 × 3 = 270.
    for i, d in enumerate(DIAMETERS_M):
        for j, rho in enumerate((1_000, 3_000, 8_000)):
            for k, v in enumerate((12, 25, 70)):
                for n, a in enumerate((15, 45, 90)):
                    km = DISTANCES_KM[(i + j + k + n + 5) % len(DISTANCES_KM)]
                    add("crystalline", d, rho, v, a, "crystalline", km)

    # C — every range for eight bodies: 4 × 2 × 10 = 80.
    for d in (10, 100, 1_000, 10_000):
        for rho in (3_000, 8_000):
            for km in DISTANCES_KM:
                add("ranges", d, rho, 20, 45, "sedimentary", km)

    # D — the passage from airburst to ground impact, sixteen sizes from
    # 20 to 200 m: 16 × 3 × 3 × 3 = 432.
    for s in range(16):
        d = round(20 * 10 ** (s / 15), 3)
        for j, rho in enumerate((1_000, 3_000, 8_000)):
            for k, v in enumerate((12, 20, 40)):
                for n, a in enumerate((20, 45, 90)):
                    km = DISTANCES_KM[(s + j + k + n) % len(DISTANCES_KM)]
                    add("transition", d, rho, v, a, "sedimentary", km)
    return rows


def extra(page):
    """What eiep-reference.py's parser leaves out: the rest of the map's
    rings, and the printed lines a later reading may need."""
    scripts = "\n".join(re.findall(r"<script(?![^>]*src)[^>]*>(.*?)</script>", page, re.S))
    text = re.sub(r"<script.*?</script>", " ", page, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s+", " ", text)
    out = {}

    def ring_list(name):
        m = re.search(name + r"\s*=\s*\[(.*?)\]\s*;?\s*\n", scripts, re.S)
        if not m:
            return None
        return [float(x) * eiep.EARTH_DIAMETER_FACTOR for x in re.findall(r"[-\d.eE]+", m.group(1))]

    out["airblastRadiiM"] = ring_list("airblastRadii")
    out["craterRadiiM"] = ring_list("craterRadii")
    m = re.search(r"tsunamiRadii\s*=\s*\[(.*?)\]\s*;?\s*\n", scripts, re.S)
    out["tsunamiRadii"] = (
        None
        if not m
        else [
            [float(a), float(b) * eiep.EARTH_DIAMETER_FACTOR]
            for a, b in re.findall(r"\[\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\]", m.group(1))
        ]
    )

    def grab(pattern, cast=float):
        m = re.search(pattern, text)
        return cast(m.group(1)) if m else None

    out["condition"] = grab(r"Projectile Condition (.*?)(?: The mass| The energy| Atmospheric| Impact Energy| Air Blast|$)", str)
    out["atmosphericLossJ"] = grab(r"The energy lost in the atmosphere is ([\d.]+ x 10 -?\d+) Joules", eiep.number)
    m = re.search(r"strike the ground in an ellipse of dimension ([\d.]+) (km|meters) by ([\d.]+) (km|meters)", text)
    out["fragmentEllipseM"] = (
        None if not m else [eiep.metres(float(m.group(1)), m.group(2)), eiep.metres(float(m.group(3)), m.group(4))]
    )
    m = re.search(r"arrive approximately (?:(\d+) hours?,? )?(?:(\d+) minutes?,? )?(\d+) seconds", text)
    out["blastArrivalS"] = (
        None if not m else int(m.group(1) or 0) * 3600 + int(m.group(2) or 0) * 60 + int(m.group(3))
    )
    out["soundDb"] = grab(r"Sound Intensity ([\d.]+) dB")
    out["meltVolumeKm3"] = grab(r"melted or vaporised is ([\d.]+(?: x 10 -?\d+)?) km 3", eiep.number)
    out["richter"] = grab(r"Richter scale magnitude (-?[\d.]+)")
    out["thermalExposureJM2"] = grab(r"Thermal Exposure:? ([\d.]+ x 10 -?\d+) Joules", eiep.number)
    out["fireballVisible"] = (
        None if "fireball" not in text.lower() else ("below the horizon" not in text)
    )
    out["noCrater"] = "No crater is formed" in text
    return out


def main():
    rows = grid()
    done = {}
    if PARTIAL.exists():
        for line in PARTIAL.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                done[row["index"]] = row
    print(f"{len(rows)} cases, {len(done)} already read", flush=True)
    with PARTIAL.open("a") as sink:
        for i, case in enumerate(rows):
            if i in done:
                continue
            page, error = eiep.fetch(
                case["diameterM"],
                case["densityKgM3"],
                case["velocityKmS"],
                case["angleDeg"],
                case["target"],
                case["distanceKm"],
            )
            row = {"index": i, **case, "error": error}
            if page is not None:
                row.update(eiep.parse(page))
                row.update(extra(page))
            sink.write(json.dumps(row) + "\n")
            sink.flush()
            done[i] = row
            print(
                f"{i + 1}/{len(rows)} {case['block']} {case['diameterM']} m {case['densityKgM3']} "
                f"{case['velocityKmS']} km/s {case['angleDeg']} deg {case['target']} "
                f"{case['distanceKm']} km {error or ''}",
                flush=True,
            )
            time.sleep(1.5)

    read_on = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ordered = [done[i] for i in range(len(rows))]
    body = ",\n".join("    " + json.dumps(r, separators=(",", ":")) for r in ordered)
    OUT.write_text(
        "{\n"
        f'  "source": {json.dumps(eiep.BASE)},\n'
        f'  "readOn": {json.dumps(read_on)},\n'
        f'  "script": "scripts/eiep-grid.py",\n'
        f'  "rows": [\n{body}\n  ]\n'
        "}\n"
    )
    PARTIAL.unlink()
    print(f"wrote {OUT.relative_to(ROOT)}: {len(ordered)} cases", flush=True)


if __name__ == "__main__":
    if "--count" in sys.argv:
        from collections import Counter

        g = grid()
        print(len(g), Counter(r["block"] for r in g))
        raise SystemExit(0)
    main()
