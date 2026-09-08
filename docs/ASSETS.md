# Assets inventory

Every binary or creative asset shipped in `public/` is listed here
with author, licence, source URL, and the date it was added. **No
asset is added without a row in this file.**

## Licence policy

- **Models, textures, HDRIs** — CC0 only.
- **Icons, SVGs** — MIT or CC0.
- **Fonts** — OFL or similar, served via `@fontsource` (bundled).
- **No logos, trademarks, or copyrighted architectural likenesses**
  unless an explicit licence is documented.

A CC-BY (or similar attribution-required) asset may occasionally be
warranted. If so, the attribution must appear both here and in the
in-app credits surface (`footer.credits` key in
`src/i18n/locales/*.json`).

## Inventory

### Fonts

| Name           | Version | Licence | Source                             | Added      |
| -------------- | ------- | ------- | ---------------------------------- | ---------- |
| Inter          | 4.0+    | OFL-1.1 | https://rsms.me/inter/             | 2026-04-22 |
| JetBrains Mono | 2.304+  | OFL-1.1 | https://www.jetbrains.com/lp/mono/ | 2026-04-22 |

Delivered via `@fontsource/inter` and `@fontsource/jetbrains-mono`.
Bundled by Vite, no external CDN at runtime.

### 3D models

| File         | Subject | Author | Licence | Source URL | Added |
| ------------ | ------- | ------ | ------- | ---------- | ----- |
| _(none yet)_ |         |        |         |            |       |

The Stage scene (now retired from the rendering path but still in
the codebase as `src/scene/stage/`) composed scale landmarks from
Three.js primitives — no external asset files. CC0 swaps tracked as
post-v1.0 work:

- Human: a CC0 "everyperson" mesh from Sketchfab. Target ≤ 2 kTris.
- Tower: a CC0 low-poly skyscraper, ≤ 8 kTris.
- HDRI: a Poly Haven 1K dusk/sunset exterior HDRI, applied via
  `@react-three/drei` `<Environment>`.

### Textures & HDRIs

| File         | Subject | Author | Licence | Source URL | Added |
| ------------ | ------- | ------ | ------- | ---------- | ----- |
| _(none yet)_ |         |        |         |            |       |

### LUTs / colour grading

| File         | Purpose | Author | Licence | Source URL | Added |
| ------------ | ------- | ------ | ------- | ---------- | ----- |
| _(none yet)_ |         |        |         |            |       |

### Data

| File                      | Purpose                                     | Author        | Licence       | Source URL                                                                                     | Added      |
| ------------------------- | ------------------------------------------- | ------------- | ------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| `public/data/cities.json` | City dots + names on the globe, city search | Natural Earth | Public domain | https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/ (v5.1.x) | 2026-09-08 |

Derived from the Natural Earth 1:10m Populated Places shapefile by
`scripts/build-cities.ts` (`pnpm cities:build`): every place above
100 000 inhabitants, every national capital, and the regional
reference points Natural Earth labels at zoom ≤ 6, with the English
and Italian name columns, position, population and Natural Earth's own
label zoom tier. Served as a static asset (≈ 175 KB, ≈ 60 KB gzipped),
not bundled. Natural Earth requires no attribution; the credit here is
a courtesy.

### Icons & SVGs

| File                 | Purpose      | Author  | Licence | Source URL | Added      |
| -------------------- | ------------ | ------- | ------- | ---------- | ---------- |
| `public/favicon.svg` | Site favicon | Project | MIT     | in-house   | 2026-04-22 |

### Network services

| Service                   | Purpose                      | Licence / terms                         | Source URL                                                                | Added      |
| ------------------------- | ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| Esri World Imagery raster | Globe basemap in `Globe.tsx` | Free with attribution (Esri tile terms) | https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9 | 2026-08-27 |
| AWS Terrain Tiles         | Bathymetry / DEM samples     | CC0                                     | https://registry.opendata.aws/terrain-tiles/                              | 2026-04-23 |
| WorldPop 2020 1 km mosaic | Population exposure (COG)    | CC-BY-4.0 (academic, attribution req'd) | https://www.worldpop.org/                                                 | 2026-04-23 |

World Imagery compliance:

- Attribution `Esri, Maxar, Earthstar Geographics, and the GIS User
Community` is shown in the Cesium credit overlay (wired via
  `UrlTemplateImageryProvider.credit`).
- Chosen for the satellite-documentary art direction: the globe reads
  as orbital photography rather than cartography, and the tiles are
  served keyless from any origin, so the deployed site and the dev
  server share one look with zero configuration. (The previous
  Stadia/Stamen basemap needed an API key outside localhost.)
- Web Mercator stops at ±85°; the polar gap this leaves in both the
  imagery and the ArcGIS DEM is covered by two ice-cap entities drawn
  in `Globe.tsx`.

## Adding a new asset

1. Drop the file into the appropriate `public/` subfolder.
2. Add a row to the relevant table with author, licence, source URL,
   today's date.
3. If the source has no stable licence URL, also include a screenshot
   under `docs/references/<asset>-licence.png`.
4. Open the PR — reviewers check both the file and the row.

## In-app attribution

The `footer.credits` translation key currently reads:

> Inspired by MetaBallStudios · Assets from Poly Haven and Sketchfab CC0 · Science from peer-reviewed literature

When a CC-BY asset is added, append its attribution to this line in
both `en.json` and `it.json`.
