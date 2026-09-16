#!/usr/bin/env python3
"""Glasstone & Dolan's Figure 12.65, traced from the page, into
src/physics/effects/burnProbabilityData.ts.

Nimbus draws its burn rings at Figure 12.64, "Radiant exposure required to
produce skin burns for different skin pigmentations", which attaches no
probability to any curve (rules 80 to 84 of src/physics/validation/burnRules.ts,
and the correction to them of 16 September 2026). The book's next figure, 12.65,
is "Skin burn probabilities for an average unshielded population taking no
evasive action as a function of explosion yield and radiant exposure": three
solid lines at 50 % for each degree and four broken ones dividing the 18 % and
82 % bands, from 1 kt to 10 Mt.

This traces all seven and writes them, so a round can draw a ring where half a
population takes a burn and a band where 18 % and 82 % do — which is a thing
the product has never had. Rule 114 of validation/burnProbabilityRules.ts says
what the table is and what this script must prove before it may write one.

The check it has to pass is the book's own worked example (§12.65), which
belongs to *this* figure: at 1 Mt a population between 4.5 and 6 cal/cm² takes
18 % second-degree burns and the rest first-degree, so the band between the
"18 % second-degree" curve and the "50 % second-degree" curve must run from
about 4.5 to about 6 there. That example is also what fixes the reading of the
labels: a curve is the exposure at which that share of the population takes
that degree, and each broken line does double duty — the "18 % second-degree,
82 % first" line is at once the 18 % line of the second degree and the 82 %
line of the first.

    <python with pypdf, Pillow and numpy> scripts/benchmark/burn-probability-curves.py <the book's PDF>

The PDF is the public scan of the report the book was issued as (DTIC
ADA087568). Printed page 565 is page 573 of that scan, counted from zero, and
the figure is printed sideways, so the page is turned a quarter before it is
read.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
PAGE = 573
# The frame, in pixels of the page turned upright.
X_LEFT, X_RIGHT = 615.0, 2884.0  # 1 kt and 10 000 kt
Y_TOP, Y_BOTTOM = 367.0, 1854.0  # 13 and 0 cal/cm²
TOP_CAL = 13.0
SEED_FRACTION = 0.03
GRID_KT = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000]

# The seven curves, from the top of the frame down, with what the book calls
# each and what the band immediately below it holds.
CURVES = [
    ('100 % third-degree', 'broken'),
    ('50 % third-degree', 'solid'),
    ('18 % third-degree, 82 % second', 'broken'),
    ('50 % second-degree', 'solid'),
    ('18 % second-degree, 82 % first', 'broken'),
    ('50 % first-degree', 'solid'),
    ('18 % first-degree, 82 % no burn', 'broken'),
]


def page_image(pdf: Path) -> np.ndarray:
    reader = PdfReader(str(pdf))
    images = reader.pages[PAGE].images
    if not images:
        raise SystemExit(f'page {PAGE} carries no image')
    tmp = ROOT / '.burn-prob-page.tiff'
    tmp.write_bytes(images[0].data)
    grey = Image.open(tmp).convert('L').rotate(270, expand=True)
    tmp.unlink()
    return np.array(grey) < 128


def runs(dark, x, lo=4, hi=34):
    col = dark[int(Y_TOP) + 8 : int(Y_BOTTOM) - 8, x]
    out, start = [], None
    for i, on in enumerate(col):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if lo <= i - start <= hi:
                out.append((start + i - 1) / 2 + Y_TOP + 8)
            start = None
    return out


def track(dark, seed_x, seed_y, direction):
    xs, ys = [seed_x], [seed_y]
    slope, x = 0.0, seed_x
    while True:
        x += 3 * direction
        if x < X_LEFT + 4 or x > X_RIGHT - 4:
            break
        predicted = ys[-1 if direction > 0 else 0] + slope * 3 * direction
        candidates = runs(dark, x)
        if not candidates:
            continue
        y = min(candidates, key=lambda c: abs(c - predicted))
        if abs(y - predicted) > 11:  # a label, a gridline, a gap in a dash
            continue
        if direction > 0:
            xs.append(x)
            ys.append(y)
        else:
            xs.insert(0, x)
            ys.insert(0, y)
        k = min(14, len(xs))
        window = slice(-k, None) if direction > 0 else slice(0, k)
        slope = float(np.polyfit(xs[window], ys[window], 1)[0])
    return np.array(xs, float), np.array(ys, float)


def main() -> None:
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else '')
    if not pdf.is_file():
        raise SystemExit(f'usage: {sys.argv[0]} <the book PDF>')
    dark = page_image(pdf)
    per_decade = (X_RIGHT - X_LEFT) / 4
    per_cal = (Y_BOTTOM - Y_TOP) / TOP_CAL
    seed_x = int(X_LEFT + (X_RIGHT - X_LEFT) * SEED_FRACTION)
    seeds = sorted(runs(dark, seed_x))
    if len(seeds) != len(CURVES):
        raise SystemExit(f'{len(seeds)} curves at the seed column, not {len(CURVES)}')

    table = []
    for seed in seeds:
        rx, ry = track(dark, seed_x, seed, +1)
        lx, ly = track(dark, seed_x, seed, -1)
        xs = np.concatenate([lx[:-1], rx])
        ys = np.concatenate([ly[:-1], ry])
        row = []
        for kt in GRID_KT:
            x = X_LEFT + per_decade * np.log10(kt)
            x = min(max(x, xs[0]), xs[-1])
            y = float(np.interp(x, xs, ys))
            row.append(round(TOP_CAL - (y - Y_TOP) / per_cal, 2))
        table.append(row)
    values = np.array(table)

    if not np.all(np.diff(values, axis=1) >= -0.03):
        raise SystemExit('a traced curve falls as the yield rises')
    if not np.all(np.diff(values, axis=0) < 0):
        raise SystemExit('two traced curves cross')

    at1mt = {name: values[i][GRID_KT.index(1000)] for i, (name, _) in enumerate(CURVES)}
    band_low = at1mt['18 % second-degree, 82 % first']
    band_high = at1mt['50 % second-degree']
    print(f'§12.65 at 1 Mt: the 18 % second-degree band runs {band_low} to {band_high} cal/cm²')
    print('   the book reads it as 4.5 to 6')
    if not (4.1 <= band_low <= 4.9 and 5.6 <= band_high <= 6.4):
        raise SystemExit("the trace misses the book's own worked example")

    head = '  ' + ''.join(f'{kt:>8}' for kt in GRID_KT)
    print(head)
    for (name, kind), row in zip(CURVES, values):
        print(f'{name:>34} ({kind:>6}): ' + ''.join(f'{v:8.2f}' for v in row))

    # Each degree's three shares, read off the labels as the worked example
    # fixes them: a broken line is the 18 % line of one degree and the 82 %
    # line of the degree below it. The third degree's upper line is 100 %, not
    # 82 %, because the figure draws no 82 % third-degree curve — declared
    # rather than invented.
    index = {name: i for i, (name, _) in enumerate(CURVES)}
    bands = [
        ('first', '18 % first-degree, 82 % no burn', '50 % first-degree',
         '18 % second-degree, 82 % first', 0.82),
        ('second', '18 % second-degree, 82 % first', '50 % second-degree',
         '18 % third-degree, 82 % second', 0.82),
        ('third', '18 % third-degree, 82 % second', '50 % third-degree',
         '100 % third-degree', 1.00),
    ]
    rows = []
    for degree, low, mid, high, upper in bands:
        lo = values[index[low]]
        md = values[index[mid]]
        hi = values[index[high]]
        if not (np.all(lo < md) and np.all(md < hi)):
            raise SystemExit(f'the {degree}-degree band is not ordered at every yield')
        rows.append((degree, upper, lo, md, hi))

    body = f'''// Generated by scripts/benchmark/burn-probability-curves.py from the public
// scan of Glasstone, S. & Dolan, P. J. (1977), The Effects of Nuclear Weapons,
// 3rd edition (DTIC ADA087568), page 565, Figure 12.65. Do not edit by hand:
// rule 114 of validation/burnProbabilityRules.ts says what these are and how
// they were read.

/** The yields (kt) the curves are read at. */
export const BURN_PROBABILITY_YIELDS_KT: readonly number[] = [{', '.join(str(k) for k in GRID_KT)}];

/**
 * The radiant exposure (cal/cm²) at which a share of an average unshielded
 * population taking no evasive action has a burn of that degree, at each of
 * {{@link BURN_PROBABILITY_YIELDS_KT}}: the 18 % line, the 50 % line, and the
 * upper line, which is 82 % for the first and second degrees and 100 % for the
 * third — the figure draws no 82 % third-degree curve. Traced from the scan;
 * the reading is good to about a tenth of a cal/cm², half the thickness of a
 * printed curve.
 */
// prettier-ignore
export const BURN_PROBABILITY_CURVES: readonly (readonly [string, number, readonly number[], readonly number[], readonly number[]])[] = [
{chr(10).join('  [' + repr(degree).replace(chr(34), chr(39)) + f', {upper:.2f}, [' + ', '.join(f'{v:.2f}' for v in lo) + '], [' + ', '.join(f'{v:.2f}' for v in md) + '], [' + ', '.join(f'{v:.2f}' for v in hi) + ']],' for degree, upper, lo, md, hi in rows)}
];

/** The book's own worked example (§12.65), as the trace reproduces it: at 1 Mt
 *  a population between these two exposures takes 18 % second-degree burns and
 *  the rest first-degree. The book reads the band as 4.5 to 6. */
export const BURN_PROBABILITY_WORKED_EXAMPLE_1MT: readonly [number, number] = [{band_low:.2f}, {band_high:.2f}];
'''
    out = ROOT / 'src' / 'physics' / 'effects' / 'burnProbabilityData.ts'
    out.write_text(body)
    print(f'wrote {out}')


if __name__ == '__main__':
    main()
