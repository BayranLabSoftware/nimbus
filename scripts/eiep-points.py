#!/usr/bin/env python3
"""The Earth Impact Effects Program, asked for its air blast at a list of points.

Each point names a body and a range; the program is sent it as the campaign's
scripts/eiep-reference.py sends a case, with the same fetch and the same
parser, on a sedimentary target, one request every 1.5 s. What comes back is
the printed burst altitude (null where the body reaches the ground) and the
printed overpressure, low and high ends. It runs the reference, never the
model: the scripts that write the points and read the answers are Nimbus's.

    python3 scripts/eiep-points.py <points.json> <out.json>

points.json is a list of {"key", "diameterM", "densityKgM3", "velocityKmS",
"angleDeg", "rangeKm"}.
"""

import importlib.util
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("eiep", HERE / "eiep-reference.py")
eiep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eiep)


def main():
    if len(sys.argv) < 3:
        raise SystemExit("usage: eiep-points.py <points.json> <out.json>")
    points = json.loads(Path(sys.argv[1]).read_text())
    out = []
    for i, p in enumerate(points):
        page, error = eiep.fetch(
            p["diameterM"], p["densityKgM3"], p["velocityKmS"], p["angleDeg"], "sedimentary", p["rangeKm"]
        )
        got = eiep.parse(page) if page is not None else {}
        out.append(
            {
                **p,
                "error": error,
                "burstAltitudeM": got.get("burstAltitudeM"),
                "overpressurePa": got.get("overpressurePa"),
            }
        )
        print(
            f"{i + 1}/{len(points)} {p['key']} {p['rangeKm']} km: "
            f"burst {out[-1]['burstAltitudeM']} m, {out[-1]['overpressurePa']} Pa {error or ''}",
            flush=True,
        )
        time.sleep(1.5)
    Path(sys.argv[2]).write_text(
        json.dumps(
            {
                "reference": "Earth Impact Effects Program, impact.ese.ic.ac.uk (Collins, Melosh & Marcus 2005)",
                "readOn": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "rows": out,
            },
            indent=1,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
