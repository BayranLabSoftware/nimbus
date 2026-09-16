#!/usr/bin/env python3
"""The burn curves of rule 80 of src/physics/validation/burnRules.ts, traced
from the page of Glasstone & Dolan (1977) that carries them.

The book gives no fixed radiant exposure for a burn: the exposure that burns
grows with the yield, because a larger explosion spreads its thermal pulse over
a longer time and the skin sheds more of the heat as it arrives. Figure 12.64
of the 1977 edition draws nine curves — first, second
and third degree, each for light, medium and dark skin — of the radiant
exposure required to produce that burn on that skin, against yields of 1 kt to
10 Mt. Its caption is "Radiant exposure required to produce skin burns for
different skin pigmentations"; it attaches no probability to a curve. The
neighbouring Figure 12.65 does — its solid lines are the exposure at which 50 %
of an average exposed population takes a burn of that degree, and its broken
lines divide the 18 % and 82 % bands — and it is not what is traced here.

This traces those nine curves from the scan: it takes the page's image, finds
the frame and the axis ticks, seeds one point per curve in a column clear of
the legend and the letters, and follows each curve by continuity and slope. It
checks what it traced — nine curves, monotone in yield, never crossing — and
writes them into src/physics/effects/burnExposureData.ts.

    <python with pypdf, Pillow and numpy> scripts/benchmark/burn-curves.py <the book's PDF> [page]

The PDF is the public scan of the report the book was issued as (DTIC
ADA087568, archive.org item DTIC_ADA087568). Page 572 of that scan, counted
from zero, is printed page 564. Nothing here runs Nimbus.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PAGE = 572
# The frame and the axis, in pixels of the scan's own image.
X_LEFT, X_RIGHT = 543.0, 1857.0  # 1 kt and 10 000 kt
Y_TOP, UNIT = 298.0, 162.7  # 13 cal/cm² and pixels per cal/cm²
SEED_X = 620
GRID_KT = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000]
DEGREES = ['third', 'second', 'first']
SKINS = ['light', 'medium', 'dark']


def page_image(pdf: Path, page: int) -> np.ndarray:
    reader = PdfReader(str(pdf))
    images = reader.pages[page].images
    if not images:
        raise SystemExit(f'page {page} carries no image')
    raw = images[0]
    tmp = ROOT / '.burn-page.tiff'
    tmp.write_bytes(raw.data)
    grey = np.array(Image.open(tmp).convert('L'))
    tmp.unlink()
    return grey < 128


def yield_at(x: float) -> float:
    return 10 ** ((x - X_LEFT) / ((X_RIGHT - X_LEFT) / 4))


def x_of(kt: float) -> float:
    return X_LEFT + ((X_RIGHT - X_LEFT) / 4) * np.log10(kt)


def exposure_at(y: float) -> float:
    return 13.0 - (y - Y_TOP) / UNIT


def runs(dark: np.ndarray, x: int, ylo: int = 310, yhi: int = 2390, maxlen: int = 26):
    """The centres of the dark runs down one column: the curves it crosses."""
    col = dark[ylo:yhi, x]
    out, start = [], None
    for i, on in enumerate(col):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if 3 <= i - start <= maxlen:
                out.append((start + i - 1) / 2 + ylo)
            start = None
    return out


def track(dark: np.ndarray, seed_y: float, direction: int):
    xs, ys = [SEED_X], [seed_y]
    slope = 0.0
    x = SEED_X
    while True:
        x += 3 * direction
        if x < int(X_LEFT) + 5 or x > int(X_RIGHT) - 5:
            break
        predicted = ys[-1 if direction > 0 else 0] + slope * 3 * direction
        candidates = runs(dark, x)
        if not candidates:
            continue
        y = min(candidates, key=lambda c: abs(c - predicted))
        if abs(y - predicted) > 9:  # a letter, a gridline: leave the gap
            continue
        if direction > 0:
            xs.append(x)
            ys.append(y)
        else:
            xs.insert(0, x)
            ys.insert(0, y)
        k = min(12, len(xs))
        window = slice(-k, None) if direction > 0 else slice(0, k)
        slope = float(np.polyfit(xs[window], ys[window], 1)[0])
    return np.array(xs, float), np.array(ys, float)


def main() -> None:
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else '')
    page = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_PAGE
    if not pdf.is_file():
        raise SystemExit(f'usage: {sys.argv[0]} <the book PDF> [page]')
    dark = page_image(pdf, page)
    seeds = sorted(runs(dark, SEED_X))
    if len(seeds) != 9:
        raise SystemExit(f'{len(seeds)} curves at the seed column, not nine')
    curves = []
    for seed in seeds:
        right = track(dark, seed, +1)
        left = track(dark, seed, -1)
        xs = np.concatenate([left[0][:-1], right[0]])
        ys = np.concatenate([left[1][:-1], right[1]])
        curves.append((xs, ys))

    table = []
    for xs, ys in curves:
        row = []
        for kt in GRID_KT:
            x = min(max(x_of(kt), xs[0]), xs[-1])
            row.append(round(float(exposure_at(float(np.interp(x, xs, ys)))), 2))
        table.append(row)
    values = np.array(table)
    # What the trace has to be: nine curves that rise with the yield and never
    # cross, in three groups of three.
    if not np.all(np.diff(values, axis=1) >= -0.02):
        raise SystemExit('a traced curve falls as the yield rises')
    if not np.all(np.diff(values, axis=0) < 0):
        raise SystemExit('two traced curves cross')
    covered = [(float(yield_at(xs[0])), float(yield_at(xs[-1]))) for xs, _ in curves]

    lines = []
    for degree_index, degree in enumerate(DEGREES):
        for skin_index, skin in enumerate(SKINS):
            row = values[degree_index * 3 + skin_index]
            lines.append(
                f"  ['{degree}', '{skin}', [" + ', '.join(f'{v:.2f}' for v in row) + ']],'
            )
    body = f'''// Generated by scripts/benchmark/burn-curves.py from the public scan of
// Glasstone, S. & Dolan, P. J. (1977), The Effects of Nuclear Weapons, 3rd
// edition (DTIC ADA087568), page 564, Figure 12.64. Do not edit by hand:
// rule 80 of burnRules.ts says what these are and how they were read.

/** The yields (kt) the curves are read at. */
export const BURN_CURVE_YIELDS_KT: readonly number[] = [{', '.join(str(k) for k in GRID_KT)}];

/** The radiant exposure (cal/cm²) required to produce a burn of that degree
 *  on that skin pigmentation, at each of {{@link BURN_CURVE_YIELDS_KT}}. The
 *  figure attaches no probability to a curve; its neighbour 12.65 does, and is
 *  not this one. Traced from the scan; the reading is
 *  good to about a tenth of a cal/cm², half the thickness of a printed
 *  curve. */
// prettier-ignore
export const BURN_CURVES: readonly (readonly [string, string, readonly number[]])[] = [
{chr(10).join(lines)}
];

/** The span of yields the trace actually covered, curve by curve (kt). */
// prettier-ignore
export const BURN_CURVE_SPAN_KT: readonly (readonly [number, number])[] = [
{chr(10).join(f'  [{lo:.2f}, {hi:.0f}],' for lo, hi in covered)}
];
'''
    out = ROOT / 'src' / 'physics' / 'effects' / 'burnExposureData.ts'
    out.write_text(body)
    print(f'wrote {out}')
    for degree_index, degree in enumerate(DEGREES):
        for skin_index, skin in enumerate(SKINS):
            row = values[degree_index * 3 + skin_index]
            print(f'{degree:>6} {skin:>6}: ' + ' '.join(f'{v:5.2f}' for v in row))


if __name__ == '__main__':
    main()
