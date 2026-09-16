#!/usr/bin/env python3
"""The initial-radiation dose curves of rule 85 of
src/physics/validation/doseRules.ts, traced from the pages of Glasstone & Dolan
(1977) that carry them.

The book gives the initial nuclear radiation — the gamma rays and neutrons of
the first minute — as slant range against yield, one curve per absorbed dose,
in four figures: 8.33a and 8.33b for gamma rays (fission weapons, 1 to 100 kt;
thermonuclear weapons of 50 % fission yield, 0.1 to 20 Mt) and 8.64a and 8.64b
for neutrons over the same two ranges. Each carries six curves — 30, 100, 300,
1 000, 3 000 and 10 000 rads in tissue near the body surface — for a burst at
290·W^0.4 feet and an air density 0.9 of sea level.

This traces all twenty-four from the scan: it calibrates each frame against the
figure's own decade ticks, seeds one point per curve in a column clear of the
labels, and follows each curve by continuity and slope. It checks what it
traced — six curves a figure, each rising with the yield, none crossing, the
fission and thermonuclear figures agreeing within 18 % where they meet at
100 kt, and the book's own worked example at §8.34 — and writes them into
src/physics/effects/initialRadiationData.ts.

    <python with pypdf, Pillow and numpy> scripts/benchmark/dose-curves.py <the book's PDF>

The PDF is the public scan of the report the book was issued as (DTIC
ADA087568, archive.org item DTIC_ADA087568); printed page 333 is page 341 of
that scan, counted from zero. Nothing here runs Nimbus.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
YARD_M = 0.9144

# One entry per figure: the page of the scan, the frame in pixels of that
# page's own image (left, right, top, bottom), the yield at the frame's two
# sides (kt) and the slant range at its top (yards; the bottom is zero).
FIGURES = [
    ('gamma', 'fission', '8.33a', 341, (416, 1936, 290, 1657), (1.0, 100.0), 3000.0),
    ('gamma', 'thermonuclear', '8.33b', 342, (679, 2181, 419, 1783), (100.0, 20000.0), 7000.0),
    ('neutron', 'fission', '8.64a', 354, (505, 2033, 281, 1430), (1.0, 100.0), 2500.0),
    ('neutron', 'thermonuclear', '8.64b', 355, (519, 2028, 266, 1640), (100.0, 20000.0), 3500.0),
]

# The curves of every figure, from the top of the frame down.
DOSES_RAD = [30, 100, 300, 1000, 3000, 10000]
# Where each figure is read, in kiloton.
GRID_LOW = [1, 2, 3, 5, 7, 10, 20, 30, 50, 70, 100]
GRID_HIGH = [100, 200, 300, 500, 700, 1000, 2000, 3000, 5000, 7000, 10000, 20000]


def page_image(pdf: Path, page: int) -> np.ndarray:
    reader = PdfReader(str(pdf))
    images = reader.pages[page].images
    if not images:
        raise SystemExit(f'page {page} carries no image')
    tmp = ROOT / '.dose-page.tiff'
    tmp.write_bytes(images[0].data)
    grey = np.array(Image.open(tmp).convert('L'))
    tmp.unlink()
    return grey < 128


def runs(dark, x, ylo, yhi, lo=4, hi=34):
    """The centres of the dark runs down one column: the curves it crosses."""
    col = dark[ylo:yhi, x]
    out, start = [], None
    for i, on in enumerate(col):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if lo <= i - start <= hi:
                out.append((start + i - 1) / 2 + ylo)
            start = None
    if start is not None and lo <= len(col) - start <= hi:
        out.append((start + len(col) - 1) / 2 + ylo)
    return out


def track(dark, seed_x, seed_y, direction, xl, xr, ylo, yhi):
    xs, ys = [seed_x], [seed_y]
    slope, x = 0.0, seed_x
    while True:
        x += 3 * direction
        if x < xl + 4 or x > xr - 4:
            break
        predicted = ys[-1 if direction > 0 else 0] + slope * 3 * direction
        candidates = runs(dark, x, ylo, yhi)
        if not candidates:
            continue
        y = min(candidates, key=lambda c: abs(c - predicted))
        if abs(y - predicted) > 12:  # a label, a gridline: leave the gap
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


def trace(dark, frame, yields, top_yards, grid):
    xl, xr, yt, yb = frame
    klo, khi = yields
    per_decade = (xr - xl) / (np.log10(khi) - np.log10(klo))
    per_yard = (yb - yt) / top_yards

    def x_of(kt):
        return xl + per_decade * (np.log10(kt) - np.log10(klo))

    def yards_at(y):
        return (yb - y) / per_yard

    seed_x = int(xl + (xr - xl) * 0.10)
    seeds = sorted(runs(dark, seed_x, yt + 6, yb - 6))
    if len(seeds) != len(DOSES_RAD):
        raise SystemExit(f'{len(seeds)} curves at the seed column, not {len(DOSES_RAD)}')
    rows = []
    spans = []
    for seed in seeds:
        rx, ry = track(dark, seed_x, seed, +1, xl, xr, yt + 6, yb - 6)
        lx, ly = track(dark, seed_x, seed, -1, xl, xr, yt + 6, yb - 6)
        xs = np.concatenate([lx[:-1], rx])
        ys = np.concatenate([ly[:-1], ry])
        row = []
        for kt in grid:
            x = min(max(x_of(kt), xs[0]), xs[-1])
            row.append(round(float(yards_at(float(np.interp(x, xs, ys)))), 1))
        rows.append(row)
        spans.append((float(xs[0]), float(xs[-1])))
    return np.array(rows), spans


def dose_at(table, grid, kt, yards):
    """The dose (rads) one traced figure gives at a yield and a slant range."""
    ranges = [float(np.interp(np.log10(kt), np.log10(grid), row)) for row in table]
    # The curves run from the smallest dose (longest range) down.
    if yards >= ranges[0]:
        return float(DOSES_RAD[0])
    if yards <= ranges[-1]:
        return float(DOSES_RAD[-1])
    for i in range(1, len(ranges)):
        if yards >= ranges[i]:
            t = (yards - ranges[i]) / (ranges[i - 1] - ranges[i])
            lo, hi = np.log10(DOSES_RAD[i]), np.log10(DOSES_RAD[i - 1])
            return float(10 ** (lo + t * (hi - lo)))
    return float(DOSES_RAD[-1])


def main() -> None:
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else '')
    if not pdf.is_file():
        raise SystemExit(f'usage: {sys.argv[0]} <the book PDF>')
    traced = {}
    for kind, weapon, label, page, frame, yields, top in FIGURES:
        dark = page_image(pdf, page)
        grid = GRID_LOW if yields[0] == 1.0 else GRID_HIGH
        table, spans = trace(dark, frame, yields, top, grid)
        if not np.all(np.diff(table, axis=1) >= -2.0):
            raise SystemExit(f'{label}: a traced curve falls as the yield rises')
        if not np.all(np.diff(table, axis=0) < 0):
            raise SystemExit(f'{label}: two traced curves cross')
        traced[(kind, weapon)] = (table, grid, spans, label)
        print(f'{label} ({kind}, {weapon}):')
        for dose, row in zip(DOSES_RAD, table):
            print(f'  {dose:>6} rad: ' + ' '.join(f'{v:7.1f}' for v in row))

    # The fission and thermonuclear figures of one radiation meet at 100 kt.
    for kind in ('gamma', 'neutron'):
        low = traced[(kind, 'fission')]
        high = traced[(kind, 'thermonuclear')]
        for i, dose in enumerate(DOSES_RAD):
            a = low[0][i][-1]
            b = high[0][i][0]
            if abs(a / b - 1.0) > 0.18:
                raise SystemExit(
                    f'{kind}: the two figures disagree at 100 kt, '
                    f'{dose} rad: {a:.0f} against {b:.0f} yards'
                )
            print(f'  at 100 kt, {kind} {dose:>6} rad: {a:7.1f} against {b:7.1f} yards')

    # The book's own worked example, §8.34: at 2 000 yards from a 50 kt fission
    # air burst the gamma dose is "somewhat less than 300 rads ... about 250".
    table, grid, _, _ = traced[('gamma', 'fission')]
    example = dose_at(table, grid, 50.0, 2000.0)
    print(f'§8.34, 50 kt at 2 000 yards: {example:.0f} rads (the book says about 250)')
    if not 180.0 <= example <= 320.0:
        raise SystemExit(f'the trace misses the book\'s own example: {example:.0f} rads')

    lines = []
    for kind, weapon, label, _, _, _, _ in FIGURES:
        table, grid, spans, _ = traced[(kind, weapon)]
        lines.append(f"  ['{kind}', '{weapon}', '{label}',")
        lines.append('    [' + ', '.join(str(k) for k in grid) + '],')
        lines.append('    [')
        for row in table:
            lines.append('      [' + ', '.join(f'{v:.1f}' for v in row) + '],')
        lines.append('    ]],')
    body = f'''// Generated by scripts/benchmark/dose-curves.py from the public scan of
// Glasstone, S. & Dolan, P. J. (1977), The Effects of Nuclear Weapons, 3rd
// edition (DTIC ADA087568), Figures 8.33a and b (gamma rays, printed pages
// 333 and 334) and 8.64a and b (neutrons, printed pages 346 and 347). Do not
// edit by hand: rule 85 of doseRules.ts says what these are and how they were
// read.

/** The absorbed doses (rads in tissue near the body surface) the figures draw
 *  a curve for, from the smallest — and so the longest range — down. */
export const DOSE_CURVE_RADS: readonly number[] = [{', '.join(str(d) for d in DOSES_RAD)}];

/** One yard, in metres: the figures' own unit. */
export const YARD_M = {YARD_M};

/** For each figure: the radiation, the weapon it is drawn for, the figure's
 *  number, the yields (kt) it is read at, and the slant range (yards) of each
 *  of {{@link DOSE_CURVE_RADS}} at each of those yields. The figures are drawn
 *  for a burst at 290·W^0.4 feet and an air density 0.9 of sea level; the
 *  book gives them a reliability factor of 0.5 to 2 for fission weapons and
 *  0.25 to 1.5 for thermonuclear ones. The reading is good to a few yards. */
// prettier-ignore
export const DOSE_CURVES: readonly (readonly [
  'gamma' | 'neutron',
  'fission' | 'thermonuclear',
  string,
  readonly number[],
  readonly (readonly number[])[],
])[] = [
{chr(10).join(lines)}
];
'''
    out = ROOT / 'src' / 'physics' / 'effects' / 'initialRadiationData.ts'
    out.write_text(body)
    print(f'wrote {out}')


if __name__ == '__main__':
    main()
