#!/usr/bin/env python3
"""The Earth Impact Effects Program, asked about impacts in water.

Each body is sent to the program's /map page as the campaign's
scripts/benchmark/eiep_bench.py sends a water case — the same query, fetch and
parsers, one request at a time with its pause, pages kept in a cache — and what
comes back is the printed speed at the surface, the water crater and the wave
rings the map draws. It runs the reference, never the model.

    python3 scripts/eiep-water.py <bodies.json> <cache directory> <out.json>

bodies.json is a list of {"key", "diameterM", "densityKgM3", "velocityKmS",
"angleDeg", "waterDepthM"}.
"""

import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("bench", HERE / "benchmark" / "eiep_bench.py")
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)


def main():
    if len(sys.argv) < 4:
        raise SystemExit("usage: eiep-water.py <bodies.json> <cache> <out.json>")
    bodies = json.loads(Path(sys.argv[1]).read_text())
    cache = Path(sys.argv[2])
    cache.mkdir(parents=True, exist_ok=True)
    out = []
    for i, b in enumerate(bodies):
        case = {**b, "target": "water"}
        page, error = bench.fetch(bench.query(case, 100), cache)
        got = bench.EIEP.parse(page) if page is not None else {}
        extra = bench.extra(page) if page is not None else {}
        out.append(
            {
                **b,
                "error": error,
                "burstAltitudeM": got.get("burstAltitudeM"),
                "impactVelocityKmS": got.get("impactVelocityKmS"),
                "waterCraterDiameterM": extra.get("waterCraterDiameterM"),
                "tsunamiRadiiM": extra.get("tsunamiRadiiM"),
            }
        )
        print(f"{i + 1}/{len(bodies)} {b['key']}: {out[-1]['tsunamiRadiiM']} {error or ''}", flush=True)
    Path(sys.argv[3]).write_text(
        json.dumps(
            {
                "reference": "Earth Impact Effects Program, impact.ese.ic.ac.uk/map (Collins, Melosh & Marcus 2005)",
                "readOn": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "rows": out,
            },
            indent=1,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
