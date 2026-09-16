#!/usr/bin/env python3
"""The Earth Impact Effects Program's entry, run on the fireballs I2 reads.

The amendment of 16 September 2026 to docs/GOLD_STANDARD.md reads I2 against
the field's own tool on the same fireballs: the model meets it when its burst
altitude is no further from the altitude the sensors saw than the Earth Impact
Effects Program's is. The model reproduces that program's burst altitude on the
benchmark grid, and nobody had run the program on the fireballs themselves.
This does.

Each fireball is built exactly as rule 77 of
src/physics/validation/fireballRules.ts builds its default body — a density of
3 000 kg/m³, the diameter that density and the measured energy and speed give,
the entry angle from the measured velocity — and sent to the program as the
campaign's scripts/eiep-reference.py sends a case, with the same fetch and the
same parser, one request every 1.5 s. It runs the reference, never the model:
the model's own burst altitude is carried alongside from the inputs file, as
rules 76 to 79 already committed it.

    <export the inputs> && python3 scripts/eiep-fireballs.py <inputs.json> <out.json>
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
        raise SystemExit("usage: eiep-fireballs.py <inputs.json> <out.json>")
    rows = json.loads(Path(sys.argv[1]).read_text())
    out = []
    for i, r in enumerate(rows):
        sent = {
            "diameterM": round(r["diameterM"], 3),
            "densityKgM3": r["densityKgM3"],
            "velocityKmS": round(r["speedKmS"], 3),
            "angleDeg": round(r["angleDeg"], 2),
        }
        page, error = eiep.fetch(
            sent["diameterM"], sent["densityKgM3"], sent["velocityKmS"], sent["angleDeg"], "sedimentary", 100
        )
        got = eiep.parse(page) if page is not None else {}
        burst = got.get("burstAltitudeM")
        out.append(
            {
                "date": r["date"],
                "sent": sent,
                "error": error,
                "observedKm": r["observedKm"],
                "nimbusBurstKm": r["nimbusBurstKm"],
                "eiepBurstKm": None if burst is None else burst / 1000.0,
                "eiepBreakupKm": None
                if got.get("breakupAltitudeM") is None
                else got["breakupAltitudeM"] / 1000.0,
                "eiepReachesGround": page is not None and burst is None,
            }
        )
        print(
            f"{i + 1}/{len(rows)} {r['date']} {sent['diameterM']} m "
            f"eiep {out[-1]['eiepBurstKm']} nimbus {r['nimbusBurstKm']} obs {r['observedKm']} {error or ''}",
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
