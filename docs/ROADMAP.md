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

### P0 — A half-kilotonne explosion drowns 77 000 people

Beirut 2020 on the globe reads 77 000 coastal dead from a detonation
whose real wave was about a metre inside the harbour. Two things were
missing and one was mis-scoped; the first two are fixed and the third
needs a decision.

**Missing, now fixed: explosions had no sea coupling.** For an impact
the physics works out what fraction of the energy reaches the water —
the crater rim, the cavity, the ejecta beyond the shore. A surface
burst was handed its whole yield as a water source no matter how far
away the sea was. That law now lives in one place,
`src/physics/effects/seaCoupling.ts`, and both events call it: one
law, two callers, and the McGetchin r⁻³ blanket term it rests on was
always an explosion-crater law as much as an impact one. An event with
no ejecta model passes no ejecta reach and the law stops at the
crater, without needing to know it has been simplified.

**Missing, now fixed: the store never told the explosion how far the
sea was.** It searched for water, found a depth, and passed only the
depth. Both event types now use the same search and both carry the
distance.

**Mis-scoped, and this is the one that still reads 77 000.** The
coupling constant is eight per cent, and its own comment says it is
"tuned so that 1 Mt at optimum depth reproduces Glasstone Table
6.50's ≈ 180 m source amplitude". Scale that anchor down as E^(1/4)
and a 0.5 kt charge gives 26.9 m; the model produces 26.1 m, so it is
doing exactly what it was built to do. But optimum depth for half a
kilotonne is 3.2 m under the surface, and the Beirut charge sat at
zero on a quay. The eight per cent belongs to a submerged burst and
is being spent on one that was not.

The file already knows this. Twenty lines above the branch it says
underwater bursts "are out of scope for this branch — the simulator
does not currently model the depth-of-burst pressure-amplification
regime (z/W^(1/3) ≈ −4 m/kt¹ᐟ³ optimum, Glasstone §6.40)". The
airburst end of that curve is modelled and gives zero above 30 m. The
optimum-depth end is modelled and gives eight per cent. Everything
between them — which is where every shipped preset actually sits — is
not, and takes the optimum-depth value by default.

Three ways out, and none should be taken quietly:

1. **Model the venting.** At the surface the fireball opens to the
   atmosphere and most of the energy leaves; that is why an airburst
   couples nothing. Putting a curve between the two anchors is the
   real fix and needs a source for its shape, not a guess.
2. **Gate to submerged bursts**, which is what the scope comment
   already claims. Honest, and it silently drops the waves Castle
   Bravo and Ivy Mike really did make from surface bursts on shallow
   reefs.
3. **Say it on the label.** Keep the number, mark the surface-burst
   wave as an unmodelled regime wherever it is shown.

Until one is chosen the shipped Beirut, and any surface burst near
water, overstates its wave by roughly the ratio between an optimum
submerged burst and a vented surface one.

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

### P2 — The two amplitude laws

The globe's veil spreads geometrically; a compact source's published
far-field row carries dispersion. Both are right where they are used
and neither survives in the other's territory, which is why forcing
them together was measured and reverted. The real fix is dispersion
inside the amplitude field with a scale length set by the source's
wavelength rather than the fixed 2 500 km calibrated for megathrusts.
Would move: Anak Krakatau's coastal toll, 8 700 against a recorded 437.

### P3 — Caps the scalar path does not have

The field clamps run-up at four times the arriving amplitude and the
rim wave at the water depth; the scalar path clamps neither. A
Chicxulub on Rome prints a source amplitude of 1 362 m in 200 m of
water, and a coastal run-up of 495 m from a 40 m wave. Would move: two
rows in every report of an impact into shallow water.

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
