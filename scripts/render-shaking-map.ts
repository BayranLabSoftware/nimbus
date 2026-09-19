/**
 * An earthquake drawn as a field, to an SVG you can open in a browser.
 *
 *   pnpm exec tsx scripts/render-shaking-map.ts [preset...] [--out dir]
 *
 * This is NOT the globe. It is the same data the globe would draw — the
 * intensity field of `physics/events/earthquake/shakingField.ts`, on the
 * ground the browser reads, with the contours `scene/globe/shakingOverlay.ts`
 * extracts — rendered flat and standalone, so that how it LOOKS can be
 * argued about before anything is wired into the scene.
 *
 * Why a picture at all: the globe draws an earthquake as three circles, and
 * every agency in the world draws it as an irregular patch whose edges bend
 * with the ground and with the rupture. The pieces to do the same have been
 * in this repository for days without being joined up.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
} from '../src/physics/events/earthquake/simulate.js';
import {
  evaluateShakingField,
  frameToGeographic,
  type RuptureFootprint,
  type ShakingField,
} from '../src/physics/events/earthquake/shakingField.js';
import {
  INTENSITY_BANDS,
  fieldBounds,
  shakingContours,
} from '../src/scene/globe/shakingOverlay.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';

/** Where each preset happened, since a preset carries no epicentre. */
const WHERE: Record<string, { lat: number; lon: number; title: string }> = {
  TOHOKU_2011: { lat: 38.297, lon: 142.373, title: 'Tōhoku 2011 — Mw 9.1' },
  NEPAL_2015: { lat: 28.231, lon: 84.731, title: 'Gorkha (Nepal) 2015 — Mw 7.8' },
  NORTHRIDGE_1994: { lat: 34.213, lon: -118.537, title: 'Northridge 1994 — Mw 6.7' },
  L_AQUILA_2009: { lat: 42.3476, lon: 13.38, title: "L'Aquila 2009 — Mw 6.3" },
  KUNLUN_2001: { lat: 35.95, lon: 92.91, title: 'Kokoxili (Kunlun) 2001 — Mw 7.8' },
};

const WIDTH = 900;

function render(field: ShakingField, title: string, subtitle: string): string {
  const b = fieldBounds(field);
  const midLat = ((b.minLat + b.maxLat) / 2) * (Math.PI / 180);
  const lonScale = Math.cos(midLat);
  const spanLon = (b.maxLon - b.minLon) * lonScale;
  const spanLat = b.maxLat - b.minLat;
  const height = Math.round((WIDTH * spanLat) / Math.max(1e-9, spanLon));
  const px = (lon: number): number => (((lon - b.minLon) * lonScale) / spanLon) * WIDTH;
  const py = (lat: number): number => ((b.maxLat - lat) / spanLat) * height;

  const contours = shakingContours(field);
  // Outermost first, so the inner bands paint over them.
  const ordered = [...contours].sort((a, c) => a.level - c.level);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH.toString()} ${(height + 96).toString()}" width="${WIDTH.toString()}" height="${(height + 96).toString()}" font-family="ui-sans-serif, system-ui, sans-serif">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#0b1220"/>`);
  parts.push(`<g transform="translate(0,64)">`);
  parts.push(
    `<rect x="0" y="0" width="${WIDTH.toString()}" height="${height.toString()}" fill="#111a2b"/>`
  );

  for (const contour of ordered) {
    const band = INTENSITY_BANDS.find((x) => x.minValue === contour.level);
    if (band === undefined) continue;
    for (const ring of contour.rings) {
      const d = ring
        .map(
          (p, i) =>
            `${i === 0 ? 'M' : 'L'}${px(p.longitude).toFixed(1)},${py(p.latitude).toFixed(1)}`
        )
        .join(' ');
      parts.push(
        `<path d="${d} Z" fill="${band.css}" stroke="${band.lineCss}" stroke-width="1.4"/>`
      );
    }
  }

  // The rupture itself, as the model lays it down.
  const r = field.rupture;
  const corners = [
    { x: -r.halfLengthM, y: -r.halfWidthM },
    { x: r.halfLengthM, y: -r.halfWidthM },
    { x: r.halfLengthM, y: r.halfWidthM },
    { x: -r.halfLengthM, y: r.halfWidthM },
  ].map((c) => frameToGeographic(r, c));
  if (r.halfLengthM > 0) {
    const d = corners
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'}${px(p.longitude).toFixed(1)},${py(p.latitude).toFixed(1)}`
      )
      .join(' ');
    parts.push(
      `<path d="${d} Z" fill="none" stroke="#f8fafc" stroke-width="1.6" stroke-dasharray="7 5" opacity="0.85"/>`
    );
  }
  // The epicentre.
  parts.push(
    `<g transform="translate(${px(r.longitude).toFixed(1)},${py(r.latitude).toFixed(1)})">` +
      `<path d="M-9,0 L9,0 M0,-9 L0,9" stroke="#f8fafc" stroke-width="2"/>` +
      `<circle r="4.5" fill="none" stroke="#f8fafc" stroke-width="2"/></g>`
  );

  // Labels on the contours.
  for (const contour of ordered) {
    if (contour.labelAt === null) continue;
    const x = px(contour.labelAt.longitude);
    const y = py(contour.labelAt.latitude);
    parts.push(
      `<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" fill="#f8fafc" font-size="14" font-weight="600" text-anchor="middle" paint-order="stroke" stroke="#0b1220" stroke-width="3">${contour.label}</text>`
    );
  }
  parts.push(`</g>`);

  parts.push(`<text x="20" y="28" fill="#f8fafc" font-size="19" font-weight="600">${title}</text>`);
  parts.push(`<text x="20" y="50" fill="#94a3b8" font-size="13">${subtitle}</text>`);

  // Legend along the bottom.
  const shown = ordered.map((c) => INTENSITY_BANDS.find((b2) => b2.minValue === c.level));
  let lx = 20;
  const ly = height + 64 + 20;
  for (const band of shown) {
    if (band === undefined) continue;
    parts.push(
      `<rect x="${lx.toString()}" y="${(ly - 12).toString()}" width="26" height="14" fill="${band.css}" stroke="${band.lineCss}"/>`
    );
    parts.push(
      `<text x="${(lx + 32).toString()}" y="${ly.toString()}" fill="#cbd5e1" font-size="13">${band.label}</text>`
    );
    lx += 32 + 14 + band.label.length * 8;
  }
  parts.push(
    `<text x="${(WIDTH - 20).toString()}" y="${ly.toString()}" fill="#64748b" font-size="11" text-anchor="end">Mercalli intensity on the ground the browser reads · rupture dashed</text>`
  );
  parts.push(`</svg>`);
  return parts.join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  const out = outAt === -1 ? 'benchmark/results/shaking-maps' : (args[outAt + 1] ?? '.');
  const wanted = args.filter((a, i) => !a.startsWith('--') && i !== outAt + 1);
  const presets = wanted.length > 0 ? wanted : Object.keys(WHERE);
  mkdirSync(out, { recursive: true });
  // The shipped Vs30 tiles are not committed (public/data/vs30 is 7 MB and
  // the field is not wired), so this may be null. On rock the picture is
  // still the rupture's shape and the law's fall-off; what it loses is the
  // bending of the contours over soft ground, which is the whole reason a
  // real ShakeMap looks irregular. The subtitle says which one you are
  // looking at.
  const site = shippedSiteLookup();
  const ground =
    site === null ? 'reference rock, Vs30 tiles absent' : 'the ground the browser reads';

  for (const name of presets) {
    const where = WHERE[name];
    const preset = EARTHQUAKE_PRESETS[name as keyof typeof EARTHQUAKE_PRESETS];
    if (where === undefined || (preset as unknown) === undefined) {
      console.log(`  ${name}: no such preset, skipped`);
      continue;
    }
    const result = simulateEarthquake(preset.input);
    const law = intensityLawOf(result);
    if (law === null) {
      console.log(`  ${name}: no intensity law, skipped`);
      continue;
    }
    // The strike the product would use: the reader's, else the lookup's.
    const answer = shippedStrikeAnswer(
      where.lat,
      where.lon,
      (result.inputs.depth as number | undefined) ?? 10_000,
      result.ruptureLength
    );
    const strike = result.inputs.strikeAzimuthDeg ?? answer.strikeDeg ?? 0;
    const rupture: RuptureFootprint = {
      latitude: where.lat,
      longitude: where.lon,
      strikeDeg: strike,
      halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
      halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
    };
    // The field must CONTAIN what it draws. Sized on MMI VII it cut the two
    // lowest bands off at the edge of the box, and marching squares turned
    // the cut into a dozen stray slivers that look like sedimentary basins
    // and are nothing but the frame — 814 of Northridge's edge points sat
    // above MMI V. `mmi5Radius` is optional and absent on most scenarios, so
    // the distance is found from the law itself: the largest range at which
    // it still reads the lowest band drawn, by bisection on rock.
    // On SOFT ground, not on rock: the field reads the real Vs30 and soft
    // ground amplifies, so the band reaches further than a rock bisection
    // says. Asking on rock left 306 of Northridge's edge points above MMI V
    // and 61 stray rings. 180 m/s is the soft end of what the tiles carry.
    const lowestBand = INTENSITY_BANDS[0]?.minValue ?? 5;
    let near = 0;
    let far = 3_000_000;
    for (let i = 0; i < 44; i += 1) {
      const mid = (near + far) / 2;
      if (law(mid, 180) >= lowestBand) near = mid;
      else far = mid;
    }
    const halfSpanM = rupture.halfLengthM + Math.max(40_000, 1.1 * near);
    const t0 = Date.now();
    const field = evaluateShakingField({
      rupture,
      intensityAt: law,
      siteAt: (lat, lon) =>
        site === null
          ? { vs30: 760, provenance: 'rock' as const }
          : { vs30: site(lat, lon).vs30, provenance: 'grid' as const },
      halfSpanM,
    });
    let peak = 0;
    for (const v of field.mmi) if (v > peak) peak = v;
    const source =
      result.inputs.strikeAzimuthDeg !== undefined ? 'published' : `lookup (${answer.source})`;
    const subtitle =
      `strike ${Math.round(strike).toString()}° from ${source} · ` +
      `peak MMI ${peak.toFixed(2)} · ` +
      `field ${field.points.toString()}² over ${Math.round((2 * halfSpanM) / 1000).toString()} km on ${ground} · ` +
      `${(Date.now() - t0).toString()} ms`;
    const svg = render(field, where.title, subtitle);
    const path = join(out, `${name.toLowerCase().replace(/_/g, '-')}.svg`);
    writeFileSync(path, `${svg}\n`);
    console.log(`  ${path}  (${subtitle})`);
  }
}

main();
