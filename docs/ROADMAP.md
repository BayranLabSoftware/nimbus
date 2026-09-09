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
