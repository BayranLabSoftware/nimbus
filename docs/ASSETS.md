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

| File                                                                    | Purpose                                                               | Author                                     | Licence       | Source URL                                                                                     | Added      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| `public/data/cities.json`                                               | City dots + names on the globe, city search                           | Natural Earth                              | Public domain | https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/ (v5.1.x) | 2026-09-08 |
| `public/data/population-0p125.png` + `population-2p5/*.png` (+ `.json`) | Population under damage rings and along the coast (casualty estimate) | JRC GHSL — GHS-POP R2023A (Schiavina 2023) | CC-BY 4.0     | https://human-settlement.emergency.copernicus.eu/download.php?ds=pop                           | 2026-09-08 |

Both rasters are the JRC GHS-POP 2020 30 arc-second global grid
(GHSL R2023A) summed by `scripts/build-population.ts`
(`pnpm population:build <tif> [label] [url]`; the WorldPop 2020 1 km
mosaic is the alternative input): `population-0p125.png` is the
planet at 0.125° (≈ 14 km, 848 KB) for planetary rings, and
`population-2p5/<col>_<row>.png` are thirty 60° × 30° tiles at 2.5′
(≈ 4.6 km, 5.1 MB in all, fetched on demand, at most eight per query)
for rings up to 1 500 km and for the coast; `index.json` lists the
tiles that hold anyone. They are 8-bit RGB PNGs decoded through a 2D
canvas: R the cell population on a log scale (≈ 6.8 % quantisation
step), G the cell's land fraction, so coastal cells spread their
people over land rather than sea. Attribution required (CC-BY 4.0):
"Schiavina M., Freire S., MacManus K. (2023): GHS-POP R2023A, European
Commission, Joint Research Centre (JRC)"; the casualty panel prints
the source line of whichever backend answered. The WorldPop
zonal-statistics API credit is "WorldPop (www.worldpop.org — School of
Geography and Environmental Science, University of Southampton)".

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

| Service                       | Purpose                                                                | Licence / terms                         | Source URL                                                                | Added      |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| Esri World Imagery raster     | Globe basemap in `Globe.tsx`                                           | Free with attribution (Esri tile terms) | https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9 | 2026-08-27 |
| AWS Terrain Tiles             | Bathymetry / DEM samples                                               | CC0                                     | https://registry.opendata.aws/terrain-tiles/                              | 2026-04-23 |
| WorldPop 2020 1 km mosaic     | Population exposure (optional operator COG, `VITE_POPULATION_COG_URL`) | CC-BY-4.0 (attribution req'd)           | https://www.worldpop.org/                                                 | 2026-04-23 |
| WorldPop zonal-statistics API | Population inside every damage band ≤ 100 000 km² (casualty estimate)  | CC-BY-4.0, free, no key, CORS `*`       | https://api.worldpop.org/v1/services/stats                                | 2026-09-08 |

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

## PAGER country fatality parameters

`src/physics/pagerCountries.ts` is generated by `pnpm pager:build`
from the USGS PAGER implementation's own data file:

- Source: <https://raw.githubusercontent.com/usgs/pager/master/losspager/data/fatality.xml>
- Licence: USGS work, public domain
- Model: Jaiswal, K. S. & Wald, D. J. (2010). "An Empirical Model for
  Global Earthquake Fatality Estimation." _Earthquake Spectra_ 26 (4),
  1017–1037. DOI: 10.1193/1.3480331
- 252 countries; 28 fitted on their own earthquakes, 224 on their
  region's.

The city index (`public/data/cities.json`) carries an ISO 3166-1
alpha-2 code per place, from the same Natural Earth source as the
rest of that file, so the shaking model can find which of the 252
curves a location belongs to.

## ShakeMap intensity footprints

`src/physics/validation/shakemapFixtures.ts` is generated by
`pnpm shakemap:build` from the USGS Earthquake Hazards Program:

- Search: <https://earthquake.usgs.gov/fdsnws/event/1/query>
- Product: ShakeMap `coverage_mmi_*.covjson` per event
- Licence: USGS work, public domain
- Stored: the ground area above MMI 7, 8 and 9 for six anchored
  earthquakes, with the event id so each row can be traced back.

Nothing is fetched at runtime; the fixture is committed because the
calibration net runs without a network.
