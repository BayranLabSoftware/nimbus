#!/usr/bin/env python3
"""Benchmark track CHEM: Kingery-Bulmash surface-burst overpressure for every
case of benchmark/matrices/chemical.json.

The reference is Swisdak's (1994) simplified Kingery-Bulmash polynomials for a
hemispherical TNT surface burst, as the MIT-licensed kingery-bulmash package
implements them (github.com/fcento100/kingery-bulmash). Before any case is
computed, the package is held to the three worked examples of IATG 01.80
(2021), Table 5. Nothing here runs Nimbus.

    python3 scripts/benchmark/kb_reference.py <kingery-bulmash checkout> <out.json>
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(sys.argv[1]) / "src"))
import kingery_bulmash as kb  # noqa: E402

# IATG 01.80:2021, Table 5: charge (kg), range (m), incident pressure (kPa).
IATG_TABLE_5 = [(1000, 50, 43.0), (10000, 50, 202.0), (100000, 50, 1150.0)]
# Nimbus's ring thresholds (kPa): 5 psi, 1 psi, 0.5 psi.
RING_KPA = {"5 psi": 34.474, "1 psi": 6.895, "0.5 psi": 3.447}


def incident_kpa(neq, distance):
    return kb.Blast_Parameters(unit_system=kb.Units.METRIC, neq=neq, distance=distance).incident_pressure


def ring(neq, kpa):
    # The package answers for scaled ranges 0.2-40 m/kg^(1/3), where every
    # parameter it computes has a fit; incident pressure falls with range.
    lo, hi = 0.2 * neq ** (1 / 3), 40 * neq ** (1 / 3)
    if incident_kpa(neq, lo) < kpa or incident_kpa(neq, hi) > kpa:
        return None
    for _ in range(100):
        mid = math.sqrt(lo * hi)
        if incident_kpa(neq, mid) > kpa:
            lo = mid
        else:
            hi = mid
    return math.sqrt(lo * hi)


def main():
    checks = []
    for neq, distance, printed in IATG_TABLE_5:
        value = incident_kpa(neq, distance)
        checks.append({"chargeKg": neq, "rangeM": distance, "iatgKpa": printed, "packageKpa": value,
                       "relative": value / printed - 1})
    cases = json.loads((ROOT / "benchmark" / "matrices" / "chemical.json").read_text())
    out_cases = []
    for case in cases:
        w = case["chargeKgTnt"]
        points = [{"scaledDistance": z, "rangeM": z * w ** (1 / 3), "incidentPressurePa": incident_kpa(w, z * w ** (1 / 3)) * 1000}
                  for z in case["scaledDistances"]]
        rings = {label: ring(w, kpa) for label, kpa in RING_KPA.items()}
        out_cases.append({"id": case["id"], "chargeKgTnt": w, "points": points, "ringRadiiM": rings})
    out = {
        "tool": "kingery-bulmash (Swisdak 1994 simplified Kingery-Bulmash, hemispherical surface burst)",
        "iatgTable5": checks,
        "cases": out_cases,
    }
    Path(sys.argv[2]).write_text(json.dumps(out, indent=1) + "\n")
    worst = max(abs(c["relative"]) for c in checks)
    print(f"IATG Table 5 worst relative difference {worst:.4f}; {len(out_cases)} cases")


if __name__ == "__main__":
    main()
