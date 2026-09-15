#!/usr/bin/env python3
"""How far the tide fit of BM-05 (scripts/benchmark/dart-records.py) misses
the water level inside its gap, on days chosen at random: the reason the
amendment of 15 September 2026 reads a crest above the record's median and
asks it to reach 2 cm. Reads only the DART files dart-records.py cached; no
event and no model.

    python3 scripts/benchmark/dart-tide-gap.py <work dir>
"""

import gzip
import importlib.util
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("dart_records", HERE / "dart-records.py")
records = importlib.util.module_from_spec(spec)
spec.loader.exec_module(records)

PERIODS = 120  # station-periods sampled
TRIALS = 4  # gaps per station-year
WINDOW_H = 8.0
STARTS_H = (2.0, 6.0, 12.0, 20.0)  # window starts after the gap opens at -1 h


def quarter_hours(path):
    rows = []
    for line in gzip.decompress(path.read_bytes()).decode("ascii", "replace").splitlines():
        if line.startswith("#"):
            continue
        p = line.split()
        try:
            t = datetime(int(p[0]), int(p[1]), int(p[2]), int(p[3]), int(p[4]), int(p[5]), tzinfo=timezone.utc)
            kind, h = int(p[6]), float(p[7])
        except (ValueError, IndexError):
            continue
        if kind == 1 and 0 < h < 9000:
            rows.append((t, h))
    rows.sort()
    return rows


def main():
    work = Path(sys.argv[1])
    rng = random.Random(1)
    files = sorted(work.glob("*t20*.txt.gz"))
    rng.shuffle(files)
    worst, above_median = [], []
    periods = 0
    for path in files:
        rows = quarter_hours(path)
        if len(rows) < 20_000:
            continue
        t0 = rows[0][0]
        hours = np.array([(t - t0).total_seconds() / 3600.0 for t, _ in rows])
        level = np.array([h for _, h in rows])
        for _ in range(TRIALS):
            centre = rng.uniform(hours[0] + 16 * 24, hours[-1] - 16 * 24)
            near = np.abs(hours - centre) <= records.FIT_DAYS * 24
            h, y = hours[near] - centre, level[near]
            # A deployment's step, or a gappy stretch, is not a quiet day.
            if y.size < 0.9 * 2 * records.FIT_DAYS * 96 or np.max(np.abs(np.diff(y))) > 1.0:
                continue
            fit = (h < -records.EXCLUDE_BEFORE_H) | (h > records.EXCLUDE_AFTER_H)
            A = records.tide_design(h)
            coef, *_ = np.linalg.lstsq(A[fit], y[fit], rcond=None)
            err = y - A @ coef
            if np.std(err[fit]) > records.MAX_FIT_RMS_M:
                continue
            for start in STARTS_H:
                inside = (h >= start) & (h <= start + WINDOW_H)
                if inside.sum() < 20:
                    continue
                e = err[inside]
                worst.append(float(np.max(np.abs(e))))
                above_median.append(float(np.max(e - np.median(e))))
            periods += 1
        if periods >= PERIODS:
            break
    print(f"{len(worst)} windows of {WINDOW_H:g} h in {periods} station-periods")
    for q in (50, 84, 95):
        print(
            f"  {q}th percentile: largest miss {np.percentile(worst, q):.4f} m,"
            f" highest value above the median {np.percentile(above_median, q):.4f} m"
        )


if __name__ == "__main__":
    main()
