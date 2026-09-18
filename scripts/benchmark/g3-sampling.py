#!/usr/bin/env python3
"""How often a band that is exactly right passes G3, as written and as amended.

G3 of docs/GOLD_STANDARD.md asks two things of a band on a held-out set: that it
hold about nine records in ten, and that it be no wider than a band exactly
calibrated at the quantity's sigma_ln bound, exp(3.29 sigma). The amendment of
16 September 2026 makes that sigma the reference's, read on the same rows. Both
halves are then read from a sample, and a band that is exactly right fails on
the sampling alone: the sample sigma comes out under the true one half the time,
and every record is then held by "too wide" a band.

This script draws a model that is unbiased and a band drawn at a multiple of the
true scatter, and counts how often each reading passes. It is what the amendment
of 18 September 2026 quotes; run it to check those numbers.

    python3 scripts/benchmark/g3-sampling.py
"""

import math
import random
import statistics

DRAWS = 20_000
SEED = 18_092_026
Z90 = 1.6448536269514722  # the 5-95 % band is model * exp(+- z90 * sigma)
WIDTH = 2 * Z90  # 3.29: ln of the width of a band calibrated at sigma = 1


def gammainc_lower_reg(a: float, x: float) -> float:
    """Regularized lower incomplete gamma P(a, x), series and continued fraction."""
    if x <= 0:
        return 0.0
    if x < a + 1:
        total = term = 1.0 / a
        k = a
        while True:
            k += 1
            term *= x / k
            total += term
            if abs(term) < abs(total) * 1e-15:
                break
        return total * math.exp(-x + a * math.log(x) - math.lgamma(a))
    b = x + 1 - a
    c = 1e300
    d = 1 / b
    h = d
    i = 1
    while True:
        an = -i * (i - a)
        b += 2
        d = an * d + b
        d = 1 / d if d else 1e300
        c = b + an / c if c else 1e300
        delta = d * c
        h *= delta
        i += 1
        if abs(delta - 1) < 1e-15:
            break
    return 1 - h * math.exp(-x + a * math.log(x) - math.lgamma(a))


def chi2_ppf(q: float, k: int) -> float:
    lo, hi = 0.0, 10.0 * k + 100.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if gammainc_lower_reg(k / 2, mid / 2) < q:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def width_factor(n: int) -> float:
    """One-sided 95 % upper confidence limit of a sample sigma, as a factor."""
    return math.sqrt((n - 1) / chi2_ppf(0.05, n - 1))


def binom_cdf(k: int, n: int, p: float) -> float:
    return sum(math.comb(n, i) * p**i * (1 - p) ** (n - i) for i in range(0, k + 1))


def held_interval(n: int, p: float = 0.9, alpha: float = 0.05) -> tuple[int, int]:
    """The central 1 - alpha interval of Binomial(n, p): the records a band that
    holds nine in ten may show on n rows."""
    lo = 0
    while binom_cdf(lo, n, p) < alpha / 2:
        lo += 1
    hi = n
    while 1 - binom_cdf(hi - 1, n, p) < alpha / 2:
        hi -= 1
    return lo, hi


def pass_rates(n: int, ratio: float) -> tuple[float, float, float]:
    """Share of draws that pass G3 as written, with the width alone amended, and
    as amended, for a band whose sigma is `ratio` times the true one."""
    factor = width_factor(n)
    lo, hi = held_interval(n)
    as_written = width_only = amended = 0
    for _ in range(DRAWS):
        rows = [random.gauss(0, 1) for _ in range(n)]
        sample = statistics.stdev(rows)
        held = sum(1 for v in rows if abs(v) <= Z90 * ratio)
        share = held / n
        window = (0.85 <= share <= 0.95) if n >= 20 else (share >= 0.80)
        if ratio <= sample and window:
            as_written += 1
        if ratio <= sample * factor and window:
            width_only += 1
        if ratio <= sample * factor and lo <= held <= hi:
            amended += 1
    return as_written / DRAWS, width_only / DRAWS, amended / DRAWS


def main() -> None:
    random.seed(SEED)
    print(f"{DRAWS} draws per case, seed {SEED}; the model is unbiased and the band")
    print("is drawn at `ratio` times the true scatter.\n")
    print("n     width  held      ratio  as written  width only     amended")
    for n in (8, 10, 12, 15, 20, 30, 40):
        lo, hi = held_interval(n)
        factor = width_factor(n)
        for ratio in (0.7, 1.0, 1.6):
            written, width, amended = pass_rates(n, ratio)
            held = f"{lo} to {hi}"
            head = f"{n:<5} x{factor:<5.3f} {held:<9}" if ratio == 0.7 else " " * 22
            print(
                f"{head} {ratio:<6.1f} {written * 100:8.1f} % {width * 100:10.1f} % {amended * 100:10.1f} %"
            )


if __name__ == "__main__":
    main()
