# Roadmap

Eight milestones from empty repo to a multi-event simulator. Every
milestone has a single exit criterion that can be checked from a fresh
clone.

---

## M0 — Setup _(complete)_

A deployable "coming soon" landing page with the full project
scaffolding: configs, docs, workflows. No physics, no 3D yet.

- Vite 6 + React 19 + TypeScript 5.7 strict.
- ESLint flat config, Prettier, Husky, lint-staged.
- Vitest split into `physics` (Node) and `ui` (jsdom). Playwright
  scaffold.
- i18n (IT + EN) wired from the first render.
- Zustand and TanStack Router installed (not yet wired).
- Branded units and core constants in `src/physics/{units,constants}.ts`,
  unit-tested.
- ESLint Layer-2 import guard (`no-restricted-imports`) in place.
- Landing page: hero, features, language switch, scale-bar decorative
  element, footer. Skip link, single H1, keyboard reachable.
- CI on Node 20: typecheck + lint + format:check + test + build +
  Playwright.
- Cloudflare Pages preview on every PR, production on `main`.

**Exit:** `pnpm install && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
all pass on a fresh clone. Landing renders correctly at 375 / 768 / 1440. IT ↔ EN toggle works. Lighthouse a11y ≥ 95. CI green on `main`.

---

## M1 — Physics engine foundations _(complete)_

Headless TypeScript physics for impacts and explosions, callable from
a Node CLI.

- Collins/Melosh/Marcus 2005 — energy, crater, seismic magnitude.
- Glasstone & Dolan 1977 — overpressure, thermal flux, cratering.
- Pike 1980 — depth-to-diameter ratio for complex craters.
- Comlink Web-Worker wrapper.
- Deterministic.
- Storybook scaffold (no components yet).

**Exit:** every formula has a test that reproduces a published value
(Chicxulub energy, Tunguska TNT-equivalent, Hiroshima 5 psi at 1 km)
within tolerance. `node scripts/simulate-impact.ts` prints a JSON
snapshot for a Chicxulub-class event.

---

## M2 — Globe + Stage rendering _(complete)_

Cesium globe and the MBS-inspired Stage scene, both reading from the
same Zustand store.

- Cesium 1.x globe with OSM imagery (no Ion token), click-to-pick,
  four damage rings.
- R3F Stage with dusk-warm scene, ground plane, 1.7 m human and
  381 m tower landmarks, scale bar.
- ~1.5 s black-crossfade Globe ↔ Stage, collapses under
  `prefers-reduced-motion`.
- Radix Dialog (About) and Tooltip (citations).

**Exit:** pick a point on the globe → simulate → crossfade into the
Stage scene at the right scale for the event radius. No console
warnings. 60 fps on a mid-tier laptop.

**Status:** feature-complete through Block 8. The Stage path was later
retired (see [docs/ART_DIRECTION.md](ART_DIRECTION.md)); the physics
paths it exercised remain.

---

## M3 — Earthquakes, tsunamis, volcanoes _(complete)_

Remaining event types and the cascade.

- Earthquakes: USGS ShakeMap attenuation; magnitude, depth, fault
  type.
- Tsunamis: Ward & Asphaug 2000 (impact), classical long-wave
  propagation (seismic, submarine landslide).
- Volcanic eruptions: Mastin 2009 plume height, pyroclastic runout.
- Cascade: an ocean impact emits crater energy, tsunami, and thermal
  pulse on a single timeline.

**Exit:** a Krakatau-scale eruption reproduces plume height and ash
radius within tolerance. A Chicxulub-class ocean impact cascades into
a plausible megatsunami without a special case.

---

## M4 — URL-serialisable state _(complete)_

Every scenario state is a URL. Copy, share, replay.

- Compact, versioned URL schema (TanStack Router search params).
- "Copy link" button.
- OG image generator deferred to post-v1.0.

**Exit:** opening a shared URL on another device reproduces the same
simulation pixel-for-pixel modulo device-specific canvas rendering.

---

## M5 — Cross-browser, mobile, a11y, performance _(complete)_

Make it work everywhere.

- Playwright matrix: Chromium, Firefox, WebKit, Pixel 7, iPhone 14.
  85 tests × 5 projects.
- `@axe-core/playwright` sweeps WCAG 2.1 AA on landing (IT + EN),
  globe mode, About, Glossary.
- Lighthouse CI: accessibility = 1.0, LCP warning at 3000 ms, TBT
  warning at 500 ms.

**Exit:** Lighthouse a11y = 100 on every primary view. All Playwright
projects green. Real-device smoke on iOS Safari and Android Chrome.

**Status:** the real-device pass is still pending a human run; the
emulated suite is green.

---

## M6 — Content, tooltips, scientific provenance _(complete)_

Make it a teaching tool.

- Tooltip on every numeric readout, with formula and source citation.
- In-app glossary for terms like "overpressure", "VEI", "runup".
- Preset gallery (Chicxulub, Tunguska, Krakatau 1883, Tōhoku 2011,
  Hiroshima, Tsar Bomba, …).
- Translator pass on IT + EN.

**Exit:** every preset renders without TODO strings. Every tooltip
cites a real paper. A non-technical reviewer can explain each number
in their own words.

---

## M7 — v1.0 release _(machinery in place; awaiting curation)_

Polish, QA, ship.

- `CHANGELOG.md` covers every milestone; the `[Unreleased]` section
  tracks the v1.0 blockers.
- `src/analytics.ts` opt-in Plausible tracker, DNT-aware, silent in
  dev.
- `docs/ANNOUNCEMENT.md` short / medium / long-form launch copy.
- `docs/RELEASE_CHECKLIST.md` seven-section pre-flight (identity, CI,
  analytics, content, science, mechanics, first-24h).
- `.github/workflows/release.yml` signed-tag-triggered release that
  reruns every quality gate.

**Exit:** `v1.0.0` ships a green CI build, a production deploy, and a
landing page that links to the announcement. Zero open P0 bugs.

**Status:** automation ready; `git tag -s v1.0.0 && git push origin
v1.0.0` runs the full pipeline. The blockers are all human work
(copyright holder, real contact addresses, Plausible domain,
announcement polish, scientific sign-off) and live in
[docs/RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). The OG-image worker
is deferred.

---

## The goal this is all for

Stated by Andrea on 8 September 2026, at the end of the day the
casualty model landed:

> Accuracy a scientific laboratory would trust what we tell it, with
> the simplicity we have today for making the public understand.

Worth writing down because the two halves are usually assumed to fight
each other, and here they do not.

A laboratory does not trust a number because it is accurate. It trusts
it because it can see where the number came from, how far it can be
wrong, and what was left out. Nimbus cannot be more accurate than the
literature it stands on — nobody can, short of a hydrocode and a
cluster — and it does not need to be. What it can be is the thing a
lab trusts: every number traceable to the paper it came from, every
band honest about the scatter that paper reports, every gap declared
rather than smoothed over. That is a discipline, not a compute budget,
and this project is already most of the way there.

The public wants one number; a laboratory wants a distribution. That
tension is presentational and not scientific, and it resolves the way
the panel already resolves it: lead with the figure, carry the band
beside it, keep the provenance one click away, and never let a
composed number wear the same confidence as a measured one. Simplicity
helps here rather than hurting — a figure with a band and a source is
simpler to trust than a bare figure with neither.

So the goal decomposes into things that can actually be done, and they
are the ones below: a net that measures the model against every event
with a recorded outcome, no contradiction left shipping, a visible
grade on every number saying how it is known, and the physics fixed
where it is wrong rather than tuned where it is convenient.

One thing on the list is not code and belongs here rather than in a
milestone: a laboratory trusts what other laboratories have checked.
The golden dataset, the replay fixtures and the validation report are
the machinery for exactly that; what is missing is an outside reader
who has never seen this repository sitting down with the methodology
page and trying to break it. That step is worth planning for.

---

## M9 — Laboratory level: how the model gets there _(open, 9 September)_

M8 is a list of things that were wrong. This is the shape of the work
that stops them recurring, written after a day of finding them by
hand, and the order is the argument.

Where the model stands on the day this was written: eleven
observational anchors within a factor of 1.5 — Hiroshima at 1.08×,
Northridge 0.67×, L'Aquila 0.73×, Tōhoku's coast 1.44×, Krakatau
0.71×, DART 0.93×, and five wave rows inside their bands. Six rows
still out by four to a hundred: Pinatubo 97×, Amatrice 0.02×, Gorkha
0.06×, Tōhoku's headline 11×, Sumatra's coast 0.011×, and the report's
own DART row 5×.

### 1. Verify the layers, not just the toll _(intensity done, 9 September)_

A death toll is the product of five models — intensity, exposure,
vulnerability, geometry, warning — and when it is wrong it does not
say which. Finding out took most of 9 September, by hand, one
instrumented run at a time.

Every intermediate quantity has a free public anchor:

| layer              | anchor                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- |
| intensity field    | USGS ShakeMap publishes the MMI polygon of every event since 2000, machine-readable, no key |
| wave amplitude     | DART buoys and tide gauges — used, but on one row                                           |
| exposed population | GHS-POP against census totals                                                               |
| vulnerability      | PAGER's 252-country table, now in the model                                                 |

**The intensity layer is anchored.** `pnpm shakemap:build` stores the
ground area above MMI VII, VIII and IX for six events, and the first
run answered the question in one shot: the model paints 180 747 km² of
Japan at MMI IX and the 2011 ShakeMap's maximum was 8.18. Four events
are shaken at intensities they never reached; Amatrice's footprint is
eighteen times too wide in area while its toll is fifty times too low.
All of it invisible while only the toll was checked. The residuals are
pinned in `shakemapFootprint.test.ts`.

The other three layers are still unanchored: exposure against census
totals, the wave on more than one buoy row, and the vulnerability
table's own scatter.

### 2. The band must be the model's own uncertainty _(done, 9 September)_

Northridge passes its gate with a band of 38 – 439 744. That span
comes from no uncertainty at all: it is the two extreme parameter
pairs, chosen. A gate that cannot fail is not a gate, and three of the
five gated rows pass that way.

The laboratory version propagates the _published_ scatter of each
input — PAGER's 252 fits carry their own `maxobs`, Koshimura's
fragility its scatter, GHS-POP its own — through the Monte Carlo this
project already has, and uses the result as the band. Then "contains
the record" means something.

**Done for the earthquake rows of the toll net.** The band is the 5th
to 95th percentile of 200 realisations drawn from the published input
scatter in `uq/conventions.ts` — magnitude σ 0.15 Mw, depth 20 %, Vs30
30 %, and the ground-motion residual σ_lnY ≈ 0.50 that dominates them
all. Northridge's band went from 13 – 139 037 to 3 – 180, four orders
of magnitude to under two, and still contains the record.

Two rows stopped passing when it narrowed: Amatrice (299 against
0 – 111) and Gorkha (8 964 against 22 – 4 924), both now declared
misses with the cause filed rather than gates that could not fail. A
new gate keeps the span under two and a half orders of magnitude so
the absolution cannot return.

**Then the rest of the net, and the product.** The four Monte-Carlo
samplers the uncertainty page already used now serve the band as well
— one law per quantity — and each of them was rebuilding its scenario
from scratch, silently dropping every input it does not draw: a
realisation of Beirut ran a nuclear device, one of Sumatra ran on the
803 km the regression gives rather than the 1 300 km observed. They
carry the whole scenario now.

Three rows read differently for it. Hiroshima went from 47 924 –
198 927 to 107 004 – 129 200 and still contains the 105 000 counted —
a device whose yield is known to ten per cent does not make a factor-
four band. Pinatubo's went from 916 – 91 641 to 32 123 – 313 870: the
old low end missed the record by eight per cent and read like a model
very nearly right, where the truth is two orders of magnitude and a
mechanism (roofs under wet ash) that is not modelled at all. And
Mount St Helens stopped containing its record: 3 – 295 was the
gentlest and harshest pyroclastic mortality in the table, and an
evacuated eruption fell inside it by accident; 120 – 692 says plainly
that a model counting everyone who was there cannot reach a toll made
by everyone having left.

**In the product too.** A visitor reads the same interval: 200 draws
per scenario, about ten milliseconds of arithmetic, and the two ends
are whole realisations rather than a column of separate percentiles —
percentiles do not add up, and the rows have to total to the figure
above them. Hiroshima on Rome reads 170 000 (150 000 – 190 000) where
the old pair spanned a factor of four; L'Aquila reads 270 (24 – 1 700),
and the record of 309 is inside it. The panel says which kind of band
it is showing and what the band does not carry — the vulnerability
function's own factor of 2–5, and the census.

The population cannot be counted once per realisation: a WorldPop band
is tens of seconds. It is counted once per ring, plus two more
footprints bracketing the radii the draws reach, and every sampled
radius is read off that curve at one density per annulus. What that
costs is measured against the raster in `recordedTolls.test.ts` rather
than assumed: without the two brackets Pinatubo's high end moved by a
factor of 2.7 — a band about the interpolation and not about the
eruption — and with them the worst row left is 1.37×.

Still to do: the wave. The coastal toll's pair is still the range of
the vulnerability parameters, and the panel says so on any scenario
where the wave reaches a coast.

### 3. One law per quantity

The veil on the globe reads 0.28 m at DART 21413 and the report prints
1.93 m for the same wave. A reviewer sees that in thirty seconds and
stops trusting the rest.

The six anchored rows blocking the unification — G-TOH-DART, the
Tōhoku replay fixture, the B-006 registry entry, the Cocos NOAA pin
and two module tests — were fitted around the law that is wrong. They
need re-anchoring, not protecting.

### 4. The MMI footprint

The 10× on the headline of every earthquake. The contours come from a
point-source attenuation inflated into a rupture stadium, and a
megathrust whose slip is concentrated does not shake its whole
rectangle at MMI IX. After (1) this is a measurement rather than a
conjecture.

### 5. Widen the anchors where the model is blind

Volcanoes have two toll rows and Pinatubo is 97× out; Merapi 2010,
Unzen 1991 and Nevado del Ruiz 1985 are all documented. And one thing
to declare permanently rather than fix: no impact in recorded history
has killed anyone, so an impact's toll will never be validated. The
envelope says so already — laboratory level means being right about
that too.

### What is not on this list, because it exists

Reproducibility (the replay fixtures), provenance in the output (the
equation cards), an independent implementation to compare against (the
GeoCLAW fixtures), and a sensitivity analysis (`scripts/sensitivity.ts`,
which is written but not surfaced). The foundations are there. It is
the _verification_ that is the weak link, which is why the first two
entries are about it.

## M8 — The toll, and what it still gets wrong _(open)_

The casualty model landed on 8 September 2026: blast, burns, mass
fire, later deaths, shaking, pyroclastic currents and the coastal toll
of the wave, swept in time by a counter in the bar. What follows is
what it does not yet do, worst first. Each item names the number it
would move.

### P0 — What the calibration net found on its first run _(9 September)_

`src/physics/validation/recordedTolls.test.ts` runs the casualty model
against every event this repository ships as a preset that also has a
counted death toll, feeds it the shipped population rasters, and asks
one question: does the model's own low–high band contain the number
that was counted? Five rows gate the suite; six are reported with a
reason they cannot.

The first run passed the gate and found three things it could not
gate, which is what the net is for.

**Beirut 2020 — a real defect, fifty times high.** Nobody was warned
and nobody evacuated, so none of the usual excuses apply: 218 died and
the model says 10 906, with a band from 4 645 that never reaches the
record. The blast bands are OTA 1979, and OTA read them off Hiroshima
and Nagasaki — a nuclear flash through light-timber cities, half the
people dead at five psi. Beirut was a chemical detonation at ground
level in reinforced concrete, no fireball to speak of, much of the
blast vented over the harbour, and the severe zone lost of the order
of one per cent. OTA does not transfer to a conventional explosion,
and until something else covers that case the shipped Beirut, Halifax
and Texas City presets read one to two orders of magnitude high.

**Pinatubo and Mount St Helens — the model working as advertised, and
that is the problem.** 97× and 4.7× the record, and both were
evacuated: Pinatubo's evacuation of sixty thousand people is one of
volcanology's great successes and is thought to have saved five to
twenty thousand lives. The label says no evacuation, so the overshoot
is the assumption speaking. But volcanoes almost always give days of
warning, and a hazard family whose central case is "nobody left" will
be wrong on nearly every real eruption. The tsunami model already
learned this and made its thresholds depend on the warning time; the
volcanic one has not.

**And the shape of the bands is upside down.** The earthquake rows
pass with bands spanning up to five orders of magnitude — a band that
wide contains almost anything, and Northridge "passes" at 220× the
record. The blast and volcano rows carry bands a third of an order
wide, and two of the three miss. The model is vague where it could be
specific — PAGER's spread is the unknown building stock, and the
simulator does know which country it is looking at — and confident
where it is wrong. Narrowing the shaking band with regional
vulnerability, and widening the blast and pyroclastic bands to admit
what they do not know, are the same piece of work.

### P0 — A half-kilotonne explosion drowned 77 000 people _(closed)_

Beirut 2020 read 77 000 coastal dead from a detonation whose real wave
was about a metre inside the harbour. Three faults wearing one number,
all three now fixed.

**Explosions had no sea coupling.** The law impacts had used for a day
— crater rim, water cavity, ejecta beyond the shore — moved into
`effects/seaCoupling.ts` and both events call it. McGetchin's r⁻³
blanket was measured on explosion craters as much as impact ones, so
it was never an impact law; and an event with no ejecta model passes
no ejecta reach and stops at its crater without being told it has been
simplified.

**The store never told the explosion how far the sea was.** It
searched, found a depth, and dropped the distance. Both event types
now use the same search and carry both numbers.

**And the coupling constant was the optimum-depth value spent on
bursts that were nowhere near it.** Eight per cent is tuned, as its
own comment says, so that 1 Mt at optimum depth reproduces Glasstone's
180 m; optimum for half a kilotonne is 3.2 m under the surface and the
Beirut charge sat at zero on a quay. There is now a curve:
`waveCouplingEfficiency` is a log-normal in the scaled depth
z/W^(1/3), peaking at the 4 m·kt^(−1/3) this file has cited from
Glasstone §6.40 since it was written, falling to nothing at the
surface where the gas globe vents to the air and falling again in
deep water where the bubble never breaks through. Each side has a
mechanism; only the width is the project's own composition, and it is
labelled as such.

The curve replaced a threshold rather than joining it. The old gate
fired for any surface burst between zero and thirty metres of height
and refused everything else, which is why underwater bursts were "out
of scope": there was no way to say how well one coupled. Now there is,
so the branch opens wherever there is water and the curve decides —
and a genuinely submerged burst can be modelled for the first time.

The record checks out at the one place it is loud. Crossroads Baker,
hung twenty-seven metres down, made the famous explosion-generated
wave; Castle Bravo on its reef and Ivy Mike on its islet are
remembered for craters and fallout and not for any wave, and the model
now agrees with both. Beirut reads 900 against 218 counted, its wave
gone entirely, from 77 000.

### P0 — Two events the coastal toll still cannot reach

The forty-kilometre grid is fixed. A local tile that contains no land
now fetches the ring around it and resamples the nine together, which
is a rule about what a grid is for — a run-up field needs a coast to
run up — and not about which event asked. Tōhoku's local tile was 120
km of open Pacific with Sanriku a degree outside it; it is now 3.3° by
4.2° with seventeen per cent land and 585 coastal cells where there
were none, and the toll went from 1 100 against 18 500 recorded to
5 710, with the record inside the band and the modelled exposure
(554 000) close to the 600 000 who lived in the zone Japan actually
lost. A pick on land fetches nothing extra.

Two things are still out of reach, and both are worth naming because
neither is a resolution problem.

**Sumatra–Andaman 2004 reads 130 against 227 898.** Two causes, and
the first is ours. The tsunami vulnerability makes its thresholds
depend on arrival time — a coast three hours away has been warned and
emptied, which is true of any modern Pacific scenario and was the
exact opposite of the Indian Ocean in 2004, where there was no warning
system at all and that is why a quarter of a million people died. The
model gives the warned pair to precisely the coasts that had no
warning. It is the same shape as the volcanic evacuation problem: an
assumption that is right for the future and wrong for the record.

**And the beam may be too narrow for a very long rupture.** The array
factor of Ben-Menahem & Rosenman treats the rupture as a coherent
line, which is fair for seven hundred kilometres and questionable for
Sumatra's thirteen hundred: that rupture took ten minutes to
propagate at two kilometres a second, so the far end was still
breaking when the near end's wave was well away. The coherent
radiating length is shorter than the geometric one, and the model
does not know it.

### P1 — The freeze has a mitigation, not a diagnosis

Andrea reports the page freezing occasionally: the panel keeps
answering, the globe stops, only a reload clears it. One cause with
that exact signature was found and closed — Cesium raises
`renderError` and sets `useDefaultRenderLoop` to false, and nothing
was listening, so nothing brought the loop back. `Globe.tsx` now
restarts it up to five times with the reason on the console, and the
close-up view is off, which removes a second WebGL context from the
page.

**That is a fix for _a_ cause, not proof it was _the_ cause.** Nobody
has yet seen the console at the moment of a freeze. Before this is
called done:

- Ship the console message somewhere Andrea can read it after the
  fact — the reason, the count, the scenario — rather than asking him
  to have devtools open when it happens.
- Watch for the other candidates the render loop cannot report: the
  1.5–2.2 s long tasks measured during a Chicxulub evaluate, memory
  growth across repeated simulations, and the tile-batch pauses on a
  cold cache.
- Reproduce it once. Until then the fix stands on a signature match.

### P2 — The two amplitude laws _(mostly closed)_

**They were never two laws.** The veil spreads as 1/√r and the
published far-field row of a compact source decays as 1/r, and
reconciling them was written up here as work to be done. It turned
out to be a misreading. On a water surface, energy over a growing
circumference gives 1/√r for any source at all — that is the geometry
and it is what the veil computes. A dispersing wave loses height a
second time because its energy also spreads along a train that
lengthens as it travels, and in the fully dispersive limit that second
spreading is itself r^(−1/2). The two together are r^(−1): the 1/r
`propagation.ts` has cited from Lamb since it was written. The
dispersion parameter is what carries a wave from one end to the other,
and with it in the field the exponent is a half because it must be
rather than because it was fitted.

Crossroads Baker, the only event measured at two ranges, agrees:
23.4 m where thirty were seen at three hundred metres, and 1.90 m
where 1.8 were seen at five and a half kilometres. Both rows gate.

**What is left is not propagation.** Tōhoku at DART is still 1.06 m
against 30 cm and nothing here can touch it: its wave is too long to
disperse, so the geometry is cylindrical and correct, and the residual
lives in the source — either the 4 m initial amplitude or the fact
that a rupture radiates across its strike rather than evenly, and DART
21413 is not on the peak axis. Krakatau's coastal toll came from 20×
the record to 5× by the same change and the same argument covers what
is left of it. Both are source questions now, not propagation ones.

### P1 — The envelope is declared _(closed, 9 September)_

The property sweep showed the laws do not break outside the
calibration net. It did not make the page say where that outside
begins. A custom magnitude 9.5 under Lisbon came out with the same
confident face as Hiroshima, and a reader had no way to tell them
apart.

The casualty panel now carries one line: which measured event is
nearest in size, whether the scenario is beside it, between two of
them, or past the largest, and by how much. It is per quantity rather
than per family, because the answer differs — a fifty-megatonne charge
sits beside Tsar Bomba if the question is the wave and three thousand
times past Hiroshima if the question is the dead, and the panel shows
the dead. Where nothing has ever been recorded it says so outright: no
impact in history left a death toll, and no landslide in the net has
one, so those counts come from the laws and from nothing else.

Nothing it does changes a computed number. What it changes is that
the calibration net — twenty-one measured events, the most credible
thing this project has and until now visible only to whoever read the
test output — is finally something a reader can see.

Left open by it: the same treatment for the wave, the crater and the
plume, each of which has its own set of anchors and its own gaps
(no volcanic wave is checked against a measurement, not even
Krakatau's, which drowned 36 000 people).

### P0 — What two random simulations found _(9 September)_

Andrea ran a Boltysh-class impact and a custom 500 Mt burst, both on
Palermo, and exported the reports. The model reproduces both PDFs
exactly, so what follows is the model, not the export.

Three defects were fixed on the spot:

- **A band with no name.** Past the second-degree burn radius there is
  an annulus where the column still ignites but nothing else reaches,
  and no rule gave it a label — the report printed the raw i18n key
  `casualties.band.b6`. It is not a corner: for the 500 Mt burst that
  annulus runs from 177 km to the fireball horizon at 365 km and holds
  4.6 M of the 6.9 M dead, and the bug fires at every yield from a
  megatonne up. A sweep now asserts every band a scenario can produce
  has a name in both languages.
- **The envelope overstated its own distance.** 500 Mt is 3.3 × 10⁴
  times Hiroshima; rounding the exponent printed "10⁵ times past".
- **Two equation cards describing a model the code had left.** The
  contact-water-burst card printed `regime === SURFACE AND waterDepth
  > 0`on a page whose own output was`false` with a SURFACE regime and
  > 200 m of water, and the underwater-burst card omitted the
  > depth-of-burst efficiency entirely — the factor that actually
  > decided there was no wave. For a report whose claim is
  > "peer-reviewed formulas", this is the defect a professor finds
  > first.

Two left open, both needing a decision rather than a fix:

- **The mortality column does not multiply out.** _(closed,
  9 September.)_ It is now total mortality, so `mortality ×
population = deaths` on every row; `promptMortality` carries the
  immediate share for callers that want the split, and the report
  table gained a totals line so a reader can add the column up and
  find the headline at the bottom of it. Two property tests pin both
  readings.
- **Two dispersion laws are shipped at once.** _(closed,
  9 September.)_ The heuristic is gone and the derived law is the only
  one left. See P1 below for what removing it showed.

### P1 — The source wavelength of a megathrust _(closed, 9 September)_

Unifying the dispersion law (Phase 27 in SCIENCE.md) left one
question, and it is now the one that matters.

The seismic module takes the dominant source wavelength as 2·L, the
line source's first Fourier mode, cited to Satake 2013 — 1 400 km for
Tōhoku. Across strike the uplift is a hump of width W, so a wave
leaving the rupture broadside is nearer 2·W, about 400 km. The two
differ by a factor of forty in Kajiura's parameter, and they set the
directivity beam as well, since the array factor goes as L/λ.

With 2·L a megathrust is acoustically compact by construction: L/λ is
always ½, so the beam is always 0.64 along strike and 1 broadside, a
fixed 1.57 whatever the rupture. That cannot be right for a rupture
seven times longer than its own wave.

This is what stands between the model and the two declared far-field
residuals — 1.65× at DART 21413, 1.80× at Cocos Island. Both are
buoys off the ends of long ruptures, both over-predicted by an
isotropic law, and both would move under a beam that knows L/λ.

**Closed by the recorded period.** At 4 km of ocean the celerity is
198 m/s, so 2·L implies a leading wave of nearly two hours, L implies
an hour, and 2·W implies thirty-nine minutes. DART 21413 recorded
thirty to forty (Satake 2013). The wavelength is 2·W, it is now
computed once and passed to the dispersion, the beam and the printed
period alike, and the panel's period is a check a reader can make.

The beam was the point: the array factor goes as L/λ, and with λ tied
to L that ratio was frozen at one half however long the rupture. On
2·W it is the aspect ratio, and a long rupture beams like one.

It did not close the two far-field residuals, because those are the
scalar path, which has no directivity at all — see P1 below. The
coastal toll of Tōhoku moved 5 600 → 3 800 drowned and Sumatra's
130 → 100, both already far under their records for reasons written
up elsewhere in this milestone.

### P1 — The scalar path has no directivity _(closed, 9 September)_

The wave field on the globe beams; the numbers in the report do not.
`seismicTsunamiFromMegathrust` publishes "the amplitude at 1 000 km"
with no direction attached, which for a source that radiates six times
more strongly across itself than along itself is not a well-defined
quantity.

This is what is left of the two declared far-field residuals: 1.65× at
DART 21413 and 1.80× at Cocos Island, both buoys off the ends of long
ruptures, both compared against a law that radiates evenly. A hand
check with the beam the field already carries puts DART at 1.05× of
the record.

**Closed, and it split the two residuals apart.** The scalar path now
takes a strike and a receiver bearing. DART 21413 sits inside the main
lobe of the Tōhoku rupture: the beam is 0.69 there and the model goes
from 1.65× the record to **1.14×**, which is a match. Cocos Island
sits past the first null of the 2004 rupture, where the pattern says
3 % of the peak and the gauge recorded twenty times that — so the beam
is declined there and the row stays isotropic at 1.80×, an unbeamed
number with a reason rather than a beamed one from outside the
model's range.

### P2 — The slip correlation length _(closed, 9 September)_

What is left of the far-field residual, and the last thing between the
model and the record at Cocos Island.

The array factor has zeros; a fault does not. The pattern assumes a
rupture radiates one wavelength in step along its whole length, and a
real one breaks into patches that stop agreeing with each other. How
far along a rupture the seafloor really does move together — the slip
correlation length ℓ — is what fills the nulls: N = L/ℓ incoherent
pieces add as √N in amplitude where N coherent ones add as N, so the
pattern cannot fall below about √(ℓ/L) of its peak.

A draft used ℓ = λ, which put Cocos at 1.00× and DART at 1.47×. It was
rejected: the count of pieces is not set by the wavelength, and
choosing it to make two numbers come out is fitting, not deriving.
Finite-fault inversions publish slip distributions from which ℓ can be
measured — Satake 2013 for Tōhoku, Lay 2005 for Sumatra — and that
would be a measurement rather than a choice.

**Closed by a published measurement.** Melgar & Hayes (2019), via
Sepúlveda et al. (2020), put the along-strike correlation length of a
magnitude 9 rupture near 150 km on a rupture of about 700 km — a fifth
of its length — and Mai & Beroza (2002) found that length scales with
the fault, so ℓ/L is one number for every megathrust. The floor is
√(ℓ/L) ≈ 0.46.

Cocos Island went from 0.06× of the gauge under the bare pattern to
**0.83×**; DART is untouched at 1.14×, a main lobe being above the
floor by definition. Both records now sit inside the ±25–50 % spread
Synolakis 2008 gives between MOST, GeoClaw and COMCOT.

The draft that used ℓ = λ was rejected: it read better (Cocos 1.00×)
and was a fitted parameter wearing a derivation.

Tōhoku's coastal toll moved 3 800 → 6 500 drowned against about
16 700. Sumatra's moved only 100 → 120 against near 227 000, so that
row was never the beam — it is the forty-kilometre coastal grid and
the warning-time assumption, both open above.

### P1 — Sumatra's far coasts are under-waved _(closed; see P0 below, 9 September)_

With the warning fixed and the local grid widened, Sumatra 2004's
modelled coastal toll is 1 400 drowned against near 227 000. The two
things it was blamed on have been measured and are not it.

What is left is the wave. The field's mean coastal run-up for that
event is 2.9 m and its maximum 19.7 m, where the record is 5–10 m
through Sri Lanka and India and 15–30 m in Aceh. The inundation strip
goes as H^(4/3), so a factor of three in run-up is a factor of four in
the strip before the mortality function is even asked, and the
exposure comes out at 430 000 people for an event that drowned half
that many.

Would move: the worst row in the calibration net, and every far-coast
toll of every megathrust. Where to look: the amplitude the field
carries a thousand kilometres from a line source, which is the same
cylindrical law the far-field rows use, and the shoaling cap on the
way in.

### P0 — The source is a point, and a rupture is a line _(closed, 9 September)_

Sumatra 2004's coastal toll is 2 100 drowned against near 227 000,
after the amplitude and the shore height were both corrected and both
Tōhoku and Krakatau came onto their records. It is now the only
tsunami row badly out, and the reason is geometric.

The 2004 rupture ran 1 300 km north from its epicentre. Most of its
dead were in Banda Aceh, at the northern end. The model puts the
source at a single point — the epicentre, the southern end — and
measures every bearing and every distance from there, so Aceh comes
out as lying off the end of the fault and is handed the incoherent
floor of the beam, 0.46, when it is in fact beside the middle of the
rupture and squarely broadside to it.

Would move: Sumatra 2004, the worst row in the calibration net; every
long-rupture event where the coast runs alongside the fault; and the
Tōhoku geography below.

**Closed for the bearing.** It now comes from the nearest point of
the rupture. Aceh's cosine off the strike goes from 0.96 to under
0.35 — from the incoherent floor to the full beam — and Sumatra's
coastal toll from 2 100 drowned to 6 700. The distance is still
measured from the epicentre through the arrival field; seeding the FMM
along the whole line is what remains, and it matters less, because
inside R₀ the amplitude saturates anyway. Which is P0 below.

### P1 — Tōhoku's total is right and its geography is not _(closed by being wrong, 9 September)_

The coastal toll now reads 17 000 drowned against about 16 700, which
is as close as any row in this project has come. The largest single
contributor to it is Tokyo Bay, where Sanriku should be.

A right total made of wrong places is a coincidence, and it will stop
being right the moment anything else changes. What it most likely
means is the same point-source geometry as P0 — a rupture 700 km long
seen from one point puts too much wave south of where it belongs.

**It was a coincidence, and it is gone.** With the bearing taken from
the fault instead of the epicentre, Tōhoku reads 63 000 drowned
against about 16 700 — 3.8× over, where it had been 1.02×. Nothing
about the model got worse: a compensating pair came apart, and what
was being compensated for is P0 below.

### P0 — The source saturates over a disc the size of the fault _(closed, 9 September)_

`r = max(c·T, R₀)` with `R₀ = L/2`, so the field holds the full source
amplitude everywhere inside half a rupture length: for Tōhoku a disc
351 km across at 3.99 m, which is every coast in Japan. That is why
the toll reads 63 000 against 16 700 once the beam stopped
under-counting them.

The saturation radius should be the fault's across-strike half-width,
W/2 — about 102 km for Tōhoku. It is the same argument that fixed the
source wavelength: what a wave leaving the fault broadside sees is the
across-strike profile, not the along-strike length. A first estimate
puts Sanriku's amplitude down 2.8× and Tokyo Bay's down 3.3×, which
would bring the headline back without restoring the compensation,
because the beam is now right.

The catch is that the same change takes Sri Lanka down 3× as well, and
Sumatra is already 34× under. Near coasts want less and far coasts
want more, which is a statement about the _shape_ of the decay rather
than its scale, and it should be measured against both records at once
rather than tuned against either.

**Closed.** R₀ is now half the down-dip width. DART 21413 isolates
the parameter and settles it: 0.563 m against the 0.30 recorded with
half the length, 0.280 m with half the width. Tōhoku's coastal toll
goes 63 000 → 9 400 drowned against about 16 700, Krakatau does not
move, and Sumatra goes 6 700 → 320 because Banda Aceh used to sit
inside the saturation disc at full source amplitude and no longer
does. What holds Aceh down now is the density lookup below.

### P1 — The published far-field rows are behind the veil _(open, 9 September)_

`fieldScalarAgreement.test.ts` used to reimplement the field's
spreading law rather than call it, so it went on asserting agreement
after the field gained its energy normalisation and stopped computing
what the test computed. It now calls `spreadingFactor`, and the
divergence it was blind to is measured: the veil stands at a fifth of
the megathrust row, and at 1/2.66 of every compact-source row.

The veil is the one that is right. DART 21413 reads 0.280 m from the
veil's law and 0.563 m from the row's, against 0.30 recorded.

Moving the rows onto the veil's law is not a one-line change: six
anchored rows were fitted around the present one — the G-TOH-DART
golden case, the Tōhoku replay fixture, the B-006 registry entry, the
Cocos Island NOAA pin and two module tests. Passing
`seismicTsunamiFromMegathrust` the Strasser width the simulator
already holds moves it further still, because that width differs from
the aspect-ratio one the module assumes.

Would move: the far-field amplitude row of every earthquake report,
and the six rows above with it.

### P1 — The density lookup runs out of fine tiles _(closed; not the cause, 9 September)_

`populationDensityAt` gives the 2.5′ raster to the twelve tiles
holding the most coastal points and the 0.125° planet to the rest. A
tsunami field has fifteen thousand cells spread over an ocean, so
twelve tiles is a small fraction of it, and which coasts get the fine
raster depends on where the cells happen to cluster.

Banda Aceh is the case that shows it: 360 cells sit in the northern
Sumatra box with a run-up of 19.7 m against a record of 15 to 30, so
the wave is there and it is the right size. The 170 000 people who
drowned around it are not.

**Measured, and it was not the cause.** The shipped raster has the
right numbers: Banda Aceh reads 1 647 people per km² of land, Galle
1 482, Sendai 4 738. The lookup's search now grows ring by ring to
the nearest land rather than averaging over the whole radius — a
better rule, kept — and it moved almost nothing. What holds Aceh's
toll down is the extent of the fine _bathymetric_ coverage, not the
population raster. See P0 below.

### P0 — The fine coastal grid covers one tile block _(closed, 9 September)_

With the bearing, the distance and the amplitude all corrected, Banda
Aceh now reads 4.92 m of wave and 19.7 m of run-up, both right against
the 2004 record. Sumatra's coastal toll is still 1 600 drowned against
near 227 000, and what is left is exposure.

The local run-up grid is one zoom-8 tile block around the click —
about 470 km — and it resolves 74 km of the Aceh coastline at a
kilometre a cell. The coast that drowned runs the better part of a
thousand kilometres. Everything past the block falls back to the
planetary mosaic at thirty kilometres a sample, where a 1 km-wide
inundation strip on an indented coast is counted once for thirty.

Would move: Sumatra 2004, the worst row left in the calibration net,
and the far half of every large event's coast.

**Closed, and it bought less than it promised.** The grid is now a
strip along the fault, at most forty tiles, on a fixed sample budget
so the fast-marching pass costs what it did. Sumatra's block goes from
470 km at 0.9 km a sample to 780 × 1 090 km at 1.8 — four times the
area, same 63 seconds end to end — and its coastal toll from 1 600
drowned to 2 600. A factor of 1.6 where the coverage argument implied
an order of magnitude. Tōhoku drifts 22 000 → 24 000, from 1.32× of
its record to 1.44×.

### P0 — Sumatra is 87× under and nothing general explains it _(open, 9 September)_

Everything raised against that row today has been fixed and measured.
Its wave is right — Banda Aceh reads 4.92 m of amplitude and 19.7 m of
run-up against a record of fifteen to thirty. Its warning is right:
the 2004 Indian Ocean had none. Its beam, its distance and its
spreading radius are all taken from the fault. Its coast is four times
better covered. And Tōhoku, running the same physics end to end, sits
at 1.44× of its own record.

So what is left is specific to the event, not general to the model,
and there is exactly one measurement pointing anywhere: the density at
the cells. Aceh's coastal cells read 18 to 830 people per km² where
the raster holds 1 647 for Banda Aceh, and Sendai's cells read 4 738.
A city ten kilometres across on a 4.6 km raster is two or three cells,
and which of them a coastal point lands on is close to chance —
whereas Sendai's plain is dense for tens of kilometres and cannot be
missed.

Where to look: what a coastal cell should carry is the population of
the strip the wave floods, and sampling the nearest land cell is a
poor estimator of that when the population is concentrated. Summing
the people inside the inundation polygon would be the honest version.

Would move: Sumatra 2004, and every event whose dead are in one dense
place rather than spread along a shore.

### P1 — The MMI footprint: two real defects, and one that was not _(open, measured 9 September)_

**Measured against ShakeMap, and it is worse and more specific than
"too large".** The model paints 180 747 km² at MMI IX where the 2011
event reached 8.18 anywhere; Gorkha, L'Aquila and Amatrice are also
shaken at intensities they never reached. But it is too _mean_ for
Northridge (0.32× the area at MMI VII) and Kokoxili (0.36×), and
wildly too generous for the small Italian events (8.9× and 18.2×).

One point-source attenuation curve inflated into a rupture stadium
cannot be right at both ends of the magnitude range, and this is what
that looks like.

**The obvious fix was tried and reverted.** The contours come from
Joyner–Boore 1981 while the reported accelerations come from
NGA-West2, which is two attenuation laws in one module and looks like
exactly the kind of thing this project has spent a day removing.
Drawing the contours with NGA-West2 instead does empty the invented
list — every one of the four bands goes — and halves the Italian
excess. It also:

- takes Northridge's MMI VII ring to 9.9 km, where the ShakeMap grid
  puts 30 km equivalent and Wald's macroseismic survey 25;
- gives up Kokoxili's real MMI IX band;
- breaks the Amatrice toll gate, a replay fixture and a smoke test;
- and relies on a site term that the code's own comment calls "a
  Nimbus-chosen power-law SURROGATE, NOT the published BSSA14 site
  term".

So the modern law as implemented under-predicts _both_ intensity
sources, and swapping it in trades one class of error for another.
The site term has to be the published one before that swap means
anything.

**And the two sources do not agree with each other.** This was found
while building the footprint anchor and is worth its own line. There
was already a ShakeMap test in the repo — `shakemap.test.ts`, on the
MMI VII _ring radius_ — anchored on macroseismic surveys: Northridge
25 km (Wald 1999), L'Aquila 15 km (Galli & Camassi, INGV). The
instrumental ShakeMap coverage grid gives 30 km equivalent for
Northridge, which agrees, and **4.4 km for L'Aquila, which does not**
— a factor of 3.4.

That is the Worden-versus-Faenza problem the intensity module already
documents: a California-calibrated GMICE mis-predicts European
intensity, and the felt-report survey and the instrumental grid are
measuring different things there. The toll correlates with what the
buildings experienced, which is the macroseismic one. Any change to
the contours has to say which of the two it is aiming at.

### P0 — The intensity contours ignore the ground they stand on _(closed, 9 September)_

`vs30` is an input a scenario can set. It reaches the reported
accelerations through the NGA-West2 path. The MMI contours ignore it
completely: they go through `distanceForPga`, which is Joyner–Boore
1981 and takes a magnitude and nothing else. Measured — a Northridge
run at Vs30 760, 500, 400, 300 and 250 gives the same 17.0 km MMI VII
ring every time.

A simulation on soft soil draws the same rings as one on rock, and
soft soil is worth a factor of two in radius. This is not a modelling
choice; it is an input accepted and dropped.

**Closed, and not by the swap.** A contour is now the range at which
the site-amplified median reaches the threshold, using the published
BSSA14 site term. Northridge's MMI VII ring runs 17.0 km on rock,
21.6 at Vs30 400, and back to 21.0 at 250 — the non-linear half
saturating, which is correct and which the old surrogate could not
express. At the rock reference the factor is one by construction, so
nothing in the calibration net moves.

The swap itself was tried and measured, and it is not the fix. It
empties the invented-band list, which is the one thing it does well,
and then: Northridge's toll 38 → 13 against 57, L'Aquila's 227 → 40
against 309, Gorkha's 580 → 62, Amatrice out of its gate, footprint
bias 1.18 → 0.69 and scatter 0.71 → 0.86. One criterion won, the rest
lost.

What that leaves for the invented bands is a targeted fix rather than
a wholesale one, and the measurement points at the near-source
saturation: Joyner–Boore gives 0.58 g at Mw 6.7 where NGA-West2 gives
0.43, and 2.3 g at Mw 9.1, which is where Tōhoku's phantom MMI IX
comes from. JB81 is calibrated to Mw ≤ 7.7 and has no large-magnitude
saturation term at all; NGA-West2's e₆ is negative for exactly that
reason. A saturation term on the 1981 relation, rather than a new
relation, is the next thing to try.

### P1 — A national curve under-predicts a village _(open, 9 September)_

Amatrice 2016 reads 6 dead against 299 and Gorkha 2015 reads 580
against 8 964, both worse than before the country curves went in,
because Italy's and Nepal's fits are gentler than the global pair they
replaced. Both events killed in small dense historic settlements —
medieval masonry, valley brick — where a national fit made mostly on
larger and broader events under-predicts.

This is a real limit of a country-level model rather than a defect in
the table, and the honest options are a building-stock modifier
(WHE-PAGER inventories, which PAGER itself carries for the
semi-empirical model) or leaving it declared.

Would move: the two smallest, deadliest rows in the net.

### P3 — Caps the scalar path does not have

The field clamps run-up at four times the arriving amplitude and the
rim wave at the water depth; the scalar path clamps neither. A
Chicxulub on Rome prints a source amplitude of 1 362 m in 200 m of
water, and a coastal run-up of 495 m from a 40 m wave. Would move: two
rows in every report of an impact into shallow water.

The Boltysh run on Palermo puts a cost on it. Source amplitude
1 132 m in 200 m of sea, a coastal run-up of 246 m at 1 000 km, and
an inundation strip 31 km inland — the largest run-up ever recorded is
Lituya Bay's 524 m, and that was a rockfall splash inside a confined
fjord, not an open coast a thousand kilometres from its source. The
first coastal bands then die at 100 %. That chain carries 8.1 M of the
33 M dead in that report, so this is not two cosmetic rows: it is a
quarter of the toll.

### P4 — What the report says versus what the globe says

A radius larger than the planet prints as a raw number in the outputs
table where the globe's legend tags it GLOBAL, and "water depth at
impact: 200 m" reads, for a city 27 km inland, as though Rome were
submerged — it is the clamp on the tsunami basin depth, and the label
does not say so.

### P5 — Hazards still outside the count

Fallout, initial radiation, famine and disease are excluded and
declared. So is the climate collapse, which for a Chicxulub-class
impact is the mechanism that kills most of the survivors: the report
prints an EXTINCTION climate tier beside a toll that does not include
a single death from it.
