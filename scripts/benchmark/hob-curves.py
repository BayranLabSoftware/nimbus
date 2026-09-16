#!/usr/bin/env python3
"""The height-of-burst curves of rule 169 of src/physics/validation/hobRules.ts,
read from the page of Glasstone & Dolan (1977) that draws them.

Figure 3.73c gives, for a 1-kiloton burst, the peak overpressure on the ground
as contours over the distance from ground zero (0 to 7 500 ft) and the height
of burst (0 to 5 000 ft): seven curves, at 1, 2, 4, 6, 8, 10 and 15 psi. This
reads all seven from the public scan of the book.

How. The page is rotated to put the distance along x. Every grid line — sixteen
vertical, eleven horizontal, one every 500 ft — is located on the page, and a
smooth map from pixels to feet is fitted on all of them at once. The grid is
then taken off the ink, the small pieces (dashes of the triple-point line,
labels, text) are dropped, and the gaps the scan leaves in the curves are
closed; what remains cuts the plot into regions, one between each pair of
curves, and each region is given its pressure level by a point the script
names. Along every ray from ground zero — a line of constant angle of
incidence, on which the overpressure falls as the scaled slant range grows —
the ray is walked in from the frame, and where it passes from one level to
the next the centre of the ink it crosses is the curve.

What it checks before it writes anything, and it refuses to write if any fails:

  (a) the grid map fits every grid line to within 2 px in rms;
  (b) the seven curves are nested on every ray, save where the figure draws
      two of them touching (at most five rays);
  (c) the book's worked example of Figure 3.73c: the farthest reach of 4 psi is
      2 600 ft, at a burst height of about 1 100 ft — within 3 % in distance
      and 10 % in height;
  (d) the 10 and 15 psi curves agree with the same two curves as Figure 3.73b
      draws them, read from that page by the same grid map, within 6 % in
      distance at every height where both are read below their knees.

    python3 scripts/benchmark/hob-curves.py <the book's PDF>

The PDF is the public scan of the report the book was issued as (DTIC
ADA087568, archive.org item DTIC_ADA087568); printed page 113 is page 121 of
that scan and page 115 is page 123, counted from zero. Needs numpy, Pillow and
pypdf. Nothing here runs Nimbus.
"""

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src' / 'physics' / 'events' / 'explosion' / 'hobCurvesData.ts'

PSI = [1, 2, 4, 6, 8, 10, 15]
# A point in each region of Figure 3.73c (distance ft, height ft), by the level
# of the region: 0 outside 1 psi, 1 between 1 and 2 psi, ..., 7 inside 15 psi.
# The regions of 4 to 15 psi come in two pieces, above and below the
# triple-point line, where the figure draws adjacent curves touching.
LEVEL_SEEDS = {
    0: [(7300, 4800), (7300, 300)],
    1: [(3000, 3000), (6000, 1000)],
    2: [(3000, 800), (1500, 2200)],
    3: [(500, 1900), (1950, 600)],
    4: [(200, 1500), (1480, 400)],
    5: [(100, 1330), (1540, 846)],
    6: [(100, 1150), (1070, 300)],
    7: [(300, 300)],
}
THETA_STEP = 0.25


def page_image(reader, page):
    data = reader.pages[page].images[0].data
    grey = np.array(Image.open(io.BytesIO(data)).convert('L').rotate(-90, expand=True))
    return grey < 128


def disk(r):
    ys, xs = np.mgrid[-r:r + 1, -r:r + 1]
    m = (xs ** 2 + ys ** 2) <= r * r + 0.5
    return list(zip(ys[m], xs[m]))


def erode_dilate(mask, r, op):
    H, W = mask.shape
    pad = np.pad(mask, r, constant_values=False)
    out = np.ones_like(mask) if op == 'erode' else np.zeros_like(mask)
    for dy, dx in disk(r):
        view = pad[r + dy:r + dy + H, r + dx:r + dx + W]
        out = (out & view) if op == 'erode' else (out | view)
    return out


def label(mask):
    """8-connected components by union-find over runs."""
    parent = []

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    prev, runs_all = [], []
    for y in range(mask.shape[0]):
        row = mask[y]
        if not row.any():
            prev = []
            continue
        diff = np.diff(np.concatenate(([0], row.astype(np.int8), [0])))
        starts = np.nonzero(diff == 1)[0]
        ends = np.nonzero(diff == -1)[0] - 1
        cur, j = [], 0
        for x0, x1 in zip(starts, ends):
            rid = len(parent)
            parent.append(rid)
            while j < len(prev) and prev[j][1] < x0 - 1:
                j += 1
            k = j
            while k < len(prev) and prev[k][0] <= x1 + 1:
                ra, rb = find(rid), find(prev[k][2])
                if ra != rb:
                    parent[max(ra, rb)] = min(ra, rb)
                k += 1
            cur.append((x0, x1, rid))
            runs_all.append((y, x0, x1, rid))
        prev = cur
    labels = np.zeros(mask.shape, np.int32)
    roots = {}
    for y, x0, x1, rid in runs_all:
        r = find(rid)
        roots.setdefault(r, len(roots) + 1)
        labels[y, x0:x1 + 1] = roots[r]
    return labels


class GridMap:
    """x = A(y) + k S(y) for the vertical lines, y = C(x) + j T(x) for the
    horizontal ones, each coefficient quadratic, fitted robustly at once."""

    def __init__(self, dark, thin, x_first, x_last, y_first, y_last, dstep, hstep):
        self.dstep, self.hstep = dstep, hstep
        vs, hs = [], []
        for k in range(16):
            ex = int(round(x_first + (x_last - x_first) * k / 15))
            src = dark if k in (0, 15) else thin
            for s in range(int(y_last) + 10, int(y_first) - 10, 25):
                prof = src[s:s + 25, ex - 9:ex + 10].sum(axis=0).astype(float)
                if prof.sum() >= 7.5:
                    vs.append((k, s + 12.5, (np.arange(ex - 9, ex + 10) * prof).sum() / prof.sum()))
        for j in range(11):
            ey = int(round(y_first + (y_last - y_first) * j / 10))
            src = dark if j in (0, 10) else thin
            for s in range(int(x_first) + 10, int(x_last) - 10, 25):
                prof = src[ey - 9:ey + 10, s:s + 25].sum(axis=1).astype(float)
                if prof.sum() >= 7.5:
                    hs.append((j, s + 12.5, (np.arange(ey - 9, ey + 10) * prof).sum() / prof.sum()))
        self.vc, self.vrms = self._fit(vs)
        self.hc, self.hrms = self._fit(hs)

    @staticmethod
    def _fit(samples):
        k = np.array([s[0] for s in samples], float)
        t = np.array([s[1] for s in samples], float) / 1000.0
        v = np.array([s[2] for s in samples], float)
        X = np.stack([t ** 0, t, t ** 2, k, k * t, k * t ** 2], axis=1)
        keep = np.ones(len(v), bool)
        for _ in range(12):
            coef, *_ = np.linalg.lstsq(X[keep], v[keep], rcond=None)
            res = np.abs(X @ coef - v)
            new = res < max(1.2, 3.0 * np.median(res[keep]))
            if (new == keep).all():
                break
            keep = new
        return coef, float(np.sqrt(np.mean(res[keep] ** 2)))

    def to_data(self, x, y):
        vc, hc = self.vc, self.hc
        ys, xs = y / 1000.0, x / 1000.0
        k = (x - (vc[0] + vc[1] * ys + vc[2] * ys ** 2)) / (vc[3] + vc[4] * ys + vc[5] * ys ** 2)
        j = (y - (hc[0] + hc[1] * xs + hc[2] * xs ** 2)) / (hc[3] + hc[4] * xs + hc[5] * xs ** 2)
        return k * self.dstep, j * self.hstep

    def to_pixel(self, d, h):
        vc, hc = self.vc, self.hc
        k, j = np.asarray(d, float) / self.dstep, np.asarray(h, float) / self.hstep
        x = np.full(k.shape, 1500.0)
        y = np.full(k.shape, 1500.0)
        for _ in range(12):
            ys = y / 1000.0
            x = (vc[0] + vc[1] * ys + vc[2] * ys ** 2) + k * (vc[3] + vc[4] * ys + vc[5] * ys ** 2)
            xs = x / 1000.0
            y = (hc[0] + hc[1] * xs + hc[2] * xs ** 2) + j * (hc[3] + hc[4] * xs + hc[5] * xs ** 2)
        return x, y


# The frame of each figure on its rotated page, in pixels, as a starting point
# only: left and right edges at 0 and the last distance, bottom and top at 0
# and the last height. The grid map fits the lines themselves.
FRAMES = {
    123: (799.6, 2993.5, 2164.0, 689.0),   # Figure 3.73c: 0-7 500 ft by 0-5 000 ft
    121: (890.8, 2932.3, 1682.5, 320.0),   # Figure 3.73b: 0-1 500 ft by 0-1 000 ft
}


def prepare(dark, grid, dmax, hmax, close_r):
    thick = erode_dilate(erode_dilate(dark, 2, 'erode'), 2, 'dilate')
    H, W = dark.shape
    yy, xx = np.mgrid[0:H, 0:W]
    d, h = grid.to_data(xx.astype(float), yy.astype(float))
    interior = (d > 0.0015 * dmax) & (d < 0.9985 * dmax) & (h > 0.0015 * hmax) & (h < 0.9985 * hmax)
    nogrid = dark.copy()
    for k in range(16):
        hs = np.linspace(0, hmax, 4000)
        x, y = grid.to_pixel(np.full(hs.shape, k * grid.dstep), hs)
        for xi, yi in zip(np.round(x).astype(int), np.round(y).astype(int)):
            if 0 <= yi < H:
                nogrid[yi, max(0, xi - 3):xi + 4] = False
    for j in range(11):
        ds = np.linspace(0, dmax, 6000)
        x, y = grid.to_pixel(ds, np.full(ds.shape, j * grid.hstep))
        for xi, yi in zip(np.round(x).astype(int), np.round(y).astype(int)):
            if 0 <= xi < W:
                nogrid[max(0, yi - 3):yi + 4, xi] = False
    ink = (thick | nogrid) & interior
    lab = label(ink)
    sizes = np.bincount(lab.ravel())
    big = np.isin(lab, np.nonzero(sizes >= 300)[0]) & (lab > 0)
    regions = label(interior & ~erode_dilate(big, close_r, 'dilate'))
    return big, regions


def walk(ink, levels_map, rs, xs, ys, psi_by_level):
    """Crossings of a line walked from outside in: {psi: position}."""
    xi = np.clip(np.round(xs).astype(int), 0, ink.shape[1] - 1)
    yi = np.clip(np.round(ys).astype(int), 0, ink.shape[0] - 1)
    lab = levels_map[yi, xi]
    inkv = ink[yi, xi]
    found, cur, i, n = {}, None, 0, len(rs)
    while i < n:
        if lab[i] >= 0:
            cur = lab[i] if cur is None else cur
            i += 1
            continue
        j = i
        while j < n and lab[j] < 0:
            j += 1
        if j < n and cur is not None and lab[j] > cur:
            runs, k = [], i
            while k < j:
                if inkv[k]:
                    s = k
                    while k < j and inkv[k]:
                        k += 1
                    runs.append((rs[s] + rs[k - 1]) / 2.0)
                else:
                    k += 1
            want = lab[j] - cur
            if not runs:
                runs = [(rs[i] + rs[j - 1]) / 2.0]
            # A curve the scan breaks shows as two runs a few feet apart: one.
            merged = [runs[0]]
            for r in runs[1:]:
                if abs(r - merged[-1]) <= 12.0:
                    merged[-1] = (merged[-1] + r) / 2.0
                else:
                    merged.append(r)
            runs = merged
            if len(runs) >= want:
                # The outermost run is the outermost curve and the innermost
                # the innermost; a pocket the closing left between two curves
                # adds runs in the middle, never at the ends.
                picks = [0] if want == 1 else [round(m * (len(runs) - 1) / (want - 1)) for m in range(want)]
                runs = [runs[m] for m in picks]
            else:
                runs = runs + [runs[-1]] * (want - len(runs))
            for m, r in enumerate(runs):
                found.setdefault(psi_by_level[cur + 1 + m], float(r))
        if j < n:
            cur = lab[j]
        i = j
    return found


def main():
    if len(sys.argv) != 2:
        raise SystemExit('usage: hob-curves.py <DTIC ADA087568 PDF>')
    reader = PdfReader(sys.argv[1])

    # --- Figure 3.73c: the seven curves --------------------------------------
    dark = page_image(reader, 123)
    left, right, bottom, top = FRAMES[123]
    thin = dark & ~erode_dilate(erode_dilate(dark, 2, 'erode'), 2, 'dilate')
    grid = GridMap(dark, thin, left, right, bottom, top, 500.0, 500.0)
    checks = {'gridRmsPx': max(grid.vrms, grid.hrms)}
    big, regions = prepare(dark, grid, 7500.0, 5000.0, 9)

    level_of = np.full(regions.max() + 1, -1, int)
    for level, seeds in LEVEL_SEEDS.items():
        for dd, hh in seeds:
            x, y = grid.to_pixel(np.array([dd]), np.array([hh]))
            comp = regions[int(round(y[0])), int(round(x[0]))]
            if comp > 0:
                level_of[comp] = level
    levels_map = np.where(regions > 0, level_of[regions], -2)
    psi_by_level = {i + 1: p for i, p in enumerate(PSI)}

    thetas = np.arange(THETA_STEP, 90.0, THETA_STEP)
    rho = {p: np.full(len(thetas), np.nan) for p in PSI}
    for i, th in enumerate(thetas):
        t = np.radians(th)
        rmax = min(7488 / np.cos(t), 4988 / np.sin(t))
        rs = np.arange(rmax, 10.0, -1.0)
        xs, ys = grid.to_pixel(rs * np.cos(t), rs * np.sin(t))
        for p, r in walk(big, levels_map, rs, xs, ys, psi_by_level).items():
            rho[p][i] = r

    broken = [float(th) for i, th in enumerate(thetas)
              if any(rho[a][i] <= rho[b][i] for a, b in zip(PSI, PSI[1:])
                     if not (np.isnan(rho[a][i]) or np.isnan(rho[b][i])))]
    checks['raysNotNested'] = broken

    # Farthest reach at each height, straight from the page, for the check.
    heights = np.arange(20.0, 4981.0, 20.0)
    reach = {p: np.zeros(len(heights)) for p in PSI}
    ds = np.arange(7488.0, 8.0, -1.0)
    for i, hv in enumerate(heights):
        xs, ys = grid.to_pixel(ds, np.full(ds.shape, hv))
        for p, dcen in walk(big, levels_map, ds, xs, ys, psi_by_level).items():
            reach[p][i] = dcen
    i4 = int(np.argmax(reach[4]))
    checks['example4psi'] = {'reachFt': float(reach[4][i4]), 'heightFt': float(heights[i4])}

    # --- Figure 3.73b: the same 10 and 15 psi curves ---------------------------
    dark_b = page_image(reader, 121)
    lb, rb, bb, tb = FRAMES[121]
    thin_b = dark_b & ~erode_dilate(erode_dilate(dark_b, 2, 'erode'), 2, 'dilate')
    grid_b = GridMap(dark_b, thin_b, lb, rb, bb, tb, 100.0, 100.0)
    checks['gridRmsPxB'] = max(grid_b.vrms, grid_b.hrms)
    big_b, _ = prepare(dark_b, grid_b, 1500.0, 1000.0, 9)
    cross = []
    ds_b = np.arange(1495.0, 5.0, -0.5)
    # The two outermost curves of Figure 3.73b, read as the first two runs of
    # ink from the right; a run is kept only where it continues the one read 20
    # ft lower, since the scan breaks a curve at a few heights and the next run
    # in is then another curve.
    last = [None, None]
    for hv in np.arange(20.0, 581.0, 20.0):
        xs, ys = grid_b.to_pixel(ds_b, np.full(ds_b.shape, hv))
        xi = np.clip(np.round(xs).astype(int), 0, big_b.shape[1] - 1)
        yi = np.clip(np.round(ys).astype(int), 0, big_b.shape[0] - 1)
        inkv = big_b[yi, xi]
        runs, k = [], 0
        while k < len(ds_b):
            if inkv[k]:
                s = k
                while k < len(ds_b) and inkv[k]:
                    k += 1
                if k - s >= 4:
                    runs.append((ds_b[s] + ds_b[k - 1]) / 2.0)
            else:
                k += 1
        i = int(round((hv - 20.0) / 20.0))
        if len(runs) < 2:
            continue
        continues = all(prev is None or abs(r - prev) <= 40.0 for r, prev in zip(runs[:2], last))
        if not continues:
            continue
        last = [runs[0], runs[1]]
        if reach[10][i] > 0 and reach[15][i] > 0:
            cross.append((float(hv), runs[0] / reach[10][i], runs[1] / reach[15][i]))
    checks['crossFigure'] = {
        'heights': len(cross),
        'worst10': float(max(abs(r - 1) for _, r, _ in cross)),
        'worst15': float(max(abs(r - 1) for _, _, r in cross)),
    }

    passes = (
        checks['gridRmsPx'] <= 2.0 and checks['gridRmsPxB'] <= 2.0
        and len(broken) <= 5
        and abs(checks['example4psi']['reachFt'] / 2600 - 1) <= 0.03
        and abs(checks['example4psi']['heightFt'] / 1100 - 1) <= 0.10
        and checks['crossFigure']['heights'] >= 20
        and checks['crossFigure']['worst10'] <= 0.06
        and checks['crossFigure']['worst15'] <= 0.06
    )
    print(json.dumps(checks, indent=1))
    if not passes:
        raise SystemExit('a check failed: nothing written')

    # --- The table -----------------------------------------------------------
    # Every other ray, each the median of it and its four nearest neighbours
    # (1.25 degrees in all); the ends of each curve on the two axes come from
    # the page as well.
    table = {}
    grid_theta = np.arange(0.0, 90.01, 0.5)
    for p in PSI:
        v = rho[p].copy()
        med = np.array([np.nanmedian(v[max(0, i - 2):i + 3]) for i in range(len(v))])
        fin = ~np.isnan(med)
        vals = np.interp(grid_theta, thetas[fin], med[fin])
        # On the ground (0 deg) the curve is its farthest reach at the lowest
        # height read; overhead (90 deg) it is where it meets the height axis.
        vals[0] = reach[p][0]
        table[p] = vals
    # The 1 psi curve leaves the frame through its top edge, nearly level with
    # it: beyond the last ray it is read on, it is carried to the height axis
    # along h = h0 - c d^2 fitted to its farthest reach between 4 600 and
    # 4 900 ft, which is the one reading here that is not on the page.
    top = [(reach[1][i], heights[i]) for i in range(len(heights))
           if reach[1][i] > 0 and 4600 <= heights[i] <= 4900]
    dd = np.array([q[0] for q in top])
    hh = np.array([q[1] for q in top])
    A = np.stack([np.ones(len(dd)), -dd ** 2], axis=1)
    (h0, cc), *_ = np.linalg.lstsq(A, hh, rcond=None)
    checks['onePsiApexFt'] = float(h0)
    last = np.nanmax(thetas[~np.isnan(rho[1])])
    for i, th in enumerate(grid_theta):
        if th > last:
            tt = np.tan(np.radians(th)) if th < 90 else np.inf
            if np.isinf(tt):
                table[1][i] = float(h0)
            else:
                droot = (-tt + np.sqrt(tt * tt + 4 * cc * h0)) / (2 * cc)
                table[1][i] = float(np.hypot(droot, h0 - cc * droot ** 2))
    # (e) No curve jumps by more than 5 % between rays half a degree apart,
    # away from the triple-point bends the figure draws between 30 and 40 deg.
    jumps = []
    for p in PSI:
        v = table[p]
        for i in range(1, len(v)):
            if 30.0 <= grid_theta[i] <= 40.5:
                continue
            rel = abs(v[i] / v[i - 1] - 1)
            if rel > 0.05:
                jumps.append((p, float(grid_theta[i]), float(rel)))
    checks['jumpsOver5Percent'] = jumps
    print(json.dumps({'jumpsOver5Percent': jumps}))
    if jumps:
        raise SystemExit('check (e) failed: nothing written')
    lines = [
        '// Generated by scripts/benchmark/hob-curves.py from the public scan of',
        '// Glasstone & Dolan (1977), Figure 3.73c (DTIC ADA087568, printed page 115).',
        '// Do not edit by hand: rule 169 of src/physics/validation/hobRules.ts says',
        '// how these were read and what they were checked against.',
        '',
        '/** The overpressures of the curves, in psi. */',
        f'export const HOB_CURVE_PSI = {json.dumps(PSI)} as const;',
        '',
        '/** Angle of incidence at the ground of each ray, in degrees from the',
        ' *  ground: 0 along it, 90 straight overhead. */',
        f'export const HOB_CURVE_THETA_DEG = [{", ".join(f"{t:g}" for t in grid_theta)}] as const;',
        '',
        '/** Scaled slant range from ground zero (ft per cube-root kiloton) at which',
        ' *  each curve crosses each ray, one row per curve. */',
        'export const HOB_CURVE_RHO_FT: readonly (readonly number[])[] = [',
    ]
    for p in PSI:
        lines.append(f'  // {p} psi')
        lines.append('  [' + ', '.join(f'{v:.0f}' for v in table[p]) + '],')
    lines += [
        '];',
        '',
        '/** What the trace was checked against (rule 169). */',
        'export interface HobCurveChecks {',
        '  gridRmsPx: number;',
        '  raysNotNested: readonly number[];',
        '  example4psi: { reachFt: number; heightFt: number };',
        '  gridRmsPxB: number;',
        '  crossFigure: { heights: number; worst10: number; worst15: number };',
        '  onePsiApexFt: number;',
        '  jumpsOver5Percent: readonly (readonly [number, number, number])[];',
        '}',
        '',
        f'export const HOB_CURVE_CHECKS: HobCurveChecks = {json.dumps(checks)};',
        '',
    ]
    OUT.write_text('\n'.join(lines))
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
