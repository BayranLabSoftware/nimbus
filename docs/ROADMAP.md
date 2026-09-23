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
- Pike 1980 — depth-to-diameter ratio for complex craters (replaced on
  14 September 2026 by Collins et al. 2005 Eqs. 23–28, which use the
  Herrick et al. 1997 fit for complex craters).
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

What a 9 out of 10 means, domain by domain — the bias, scatter and band
a held-out set must meet, the verification every printed number needs,
and the few ceilings no model of this kind can pass — was written down
on 15 September 2026 in [GOLD_STANDARD.md](GOLD_STANDARD.md), before any
work towards it, so that the bar does not move with the work.

---

## M11 — A 9 on every domain, one domain at a time _(accepted 21 September 2026)_

Andrea asked on the morning of 21 September for a plan to a 9 on everything,
"reasoned to perfection, with no compromise", and accepted it the same
morning with two conditions, which are part of it:

- **The work goes domain by domain, and never moves to another domain without
  Andrea's explicit order.**
- **On the globe, everything is drawn with the scientific fidelity a software
  like this one owes its readers** — a domain is not done until it is (the
  list is below).

M10 stays below as it was written: its arithmetic and its three problems are
still true, and two of its claims are corrected here rather than rewritten
there. This section supersedes its order.

### The reasoning

A 9 does not come from tuning coefficients: days of it moved no grade. It
comes one way, which the rules already say: **where the field has a tool, a
bound is read against that tool on the same rows** (the amendment of
16 September). So where the model _becomes_ the field's tool, verified under
G1, every accuracy rule on that quantity closes by reading a new set, and
what is left is data. Where no tool of the field exists — the dead of an
explosion, an eruption, a tsunami — the model must earn the bound itself.
That is the real risk, and it is treated apart.

### Working rules

1. **No rule is loosened.** Not even where it would be convenient.
2. **The model becomes the field's tool** — rewritten from the publications
   and verified black-box against the real program run here. No copying.
3. **No held-out set is read before the model of that quantity is final.**
   Development happens on declared development data; each held-out set is
   read once, last.
4. **Data is counted before anything is built.** Counting rows without reading
   their values does not spend them — NCEI's run-ups were counted that way.
5. **Nothing is printed where no verified relation holds** (GOLD_STANDARD,
   the decisions of 21 September).
6. **One domain at a time**, and the next one only by Andrea's order.
7. **A domain is done only when the globe draws it faithfully.**

### The three decisions

Written in `GOLD_STANDARD.md`, "Three decisions of 21 September 2026, which
change no rule": G5 is read by its text, with the harness corrected to the
protocol's own definition and made stricter where the physics is continuous;
I3 keeps its ×3 and is met by modelling the damage instead of widening the
band; and nothing is printed where no verified relation holds.

### What this corrects

- **T2 is not a dead end.** NCEI's table holds **594 events no rule has ever
  compared with the model** — dropped on 16 September only because each had
  fewer than thirty observations (`runupSetData.ts`,
  `RUNUP_EVENTS_TOO_SMALL`). And under the re-anchored bound T2 is pending the
  reference, GeoClaw on the same coastal bins, not failed.
- **T1 has been met since 20 September** (`ec25310`: Nimbus no worse than
  GeoClaw on 93 DART records), but `goldStandardScorecard.ts` still reads it
  pending over a flat ocean, so the report counts waves from earthquakes at
  1.8 where the verdict gives 2.7. **E1's evidence line is stale too**: it
  says five scenarios, where 300 held-out ShakeMaps were read on 20 September.
  Both are the scorecard not following a verdict already written; they are
  corrected when their domain is opened, or earlier if Andrea orders it.
- **E1's 300 maps are spent.** E1 needs a new set of 300, disjoint by rule.
- **E3 has a floor set by the calendar, not by this project.** Every NCEI
  earthquake record of 2008 to 2025 of magnitude 4 or more has been read, so
  E3 can only be met on earthquakes after 15 September 2026 — about eighty a
  year, fewer with dead — or on a set before 1973, opened by rules of its own,
  with PAGER's own empirical model run on it. Both are legitimate; neither is
  quick. **No read row is ever read again to shorten this.**

### Three machines, each built in the first domain that needs it

| Machine                                                                                                              | Domains                                                         | Rules                                                           |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **Fidelity to the field's tools**                                                                                    | all                                                             | G1, I1, N1, V1, L1, and every accuracy rule read against a tool |
| **A shallow-water solver in the browser** — BROWNI shows 25 hours of propagation in 1.6 minutes on an integrated GPU | waves from earthquakes; submarine slides past every closed form | G1 of the waves, T1–T3, L1                                      |
| **Calibrated bands and measured cells**                                                                              | all                                                             | G3, G4, L3, T5, E4, E5, V6                                      |

### Domain by domain

- **Impacts, 4.0 → 9.** Already the field's tool (I1, 11 of 11). Left: G5 (the
  real monotonicity failures), I3 (damage criteria), G4 (cells from the 357
  fireballs already read), G3 (the entry altitude's band, on fireballs no rule
  has read), G6.
- **Waves from landslides, 4.5 → 9.** L1 under decision three, with the
  solver earning back the submarine regime; L3, the sampler and at least ten
  landslide waves disjoint from the forty-three read; G6.
- **Explosions, 3.3 → 9.** N2 closes on its set, since the model is Glasstone
  and Kingery–Bulmash: at least eight accidental explosions with a mapped
  damage radius. N3 has no tool of the field: a model of the dead built with
  the band the rule asks for (mortality and population, not the yield alone),
  developed on Hiroshima, Nagasaki and Beirut, read on at least ten new ones.
- **Volcanoes, 2.2 → 9.** V1 with LaharZ on real terrain; V2, V3 and V4 close
  on their sets, since the model is Mastin, Tephra2 and the energy cone; V5
  has no tool: a model of the dead developed on one part of Brown et al.
  (2017), read on at least fifteen eruptions split from it by rule before
  either is looked at.
- **Waves from earthquakes, 1.8 (2.7 by its verdicts) → 9.** The solver, held
  to GeoClaw run here and to the NTHMP benchmark cases within 1 %; a nested
  nonlinear solver at the coast for the run-up, the heaviest piece of the
  whole plan; arrivals corrected for the delay shallow water carries by
  construction. Then T3 on T1's buoys, T2 on the 594 events, T4.
- **Earthquakes, 1.0 → 9.** No more choosing between laws: the model becomes
  **ShakeMap in scenario mode** — its ground-motion models, its site terms,
  its distances, its conversion to intensity — each verified against the
  ShakeMap that runs here, and **PAGER** for the dead, its empirical model with
  its country parameters. B-083's seam goes with it, since it was a threshold
  of ours. Then E1 on a new 300, E2, and E3 as above.

### What "drawn faithfully" means on the globe

Checked for every domain before it is called done:

1. Every geometry is the model's own number — the one the panel and the
   report print and Node computes (G5's second clause), checked by the globe
   audit.
2. On the sphere: caps, geodesic polygons, horizon cuts. No planar circle
   stands in for a cap.
3. Every contour with its band once the domain has one, not a bare line.
4. Labelled with its quantity, threshold and unit; provenance one click away.
5. Outside the measured cells (G4), or outside every verified relation
   (decision three), said **on the globe**, not only in the panel.
6. Nothing decorative that reads as a physical claim — no glow that looks
   like a footprint, no colour ramp implying a gradient the model does not
   compute.
7. Every preset and a sweep of custom scenarios, audited and photographed
   headless.

### Domain 1: impacts

| Task      | What                                                                                                                                                                                                            | Closes                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **IMP-0** | Census: fireballs outside the 357 read (CNEOS since I2's reading, other networks), counted not read; every gap the report declares for impacts, classified — ceiling, closed by this domain, or work of its own | tells whether IMP-6 can happen now |
| **IMP-1** | G5's harness corrected (decision one), rules first, one run                                                                                                                                                     | —                                  |
| **IMP-2** | G5's real monotonicity failures: the one case in 408; the crater transition joined as a named departure; the seafloor cutoff; the 38 airburst magnitudes, physics or defect                                     | G5                                 |
| **IMP-3** | I3: tree-fall and glass-breakage criteria from nuclear-test and explosion data, without Tunguska or Chelyabinsk; then the check at ×3                                                                           | I3                                 |
| **IMP-4** | The band machinery, first instance, generic: model error sampled on every quantity the impact rules name                                                                                                        | —                                  |
| **IMP-5** | The cell machinery, first instance, generic: the product says for every input whether it lies in I2's measured cells; the report prints G2 and G3 cell by cell                                                  | G4                                 |
| **IMP-6** | G3: the entry altitude's band read on IMP-0's fireballs, only after IMP-4 is frozen                                                                                                                             | G3                                 |
| **IMP-7** | The globe, faithful, for everything an impact draws                                                                                                                                                             | exit                               |
| **IMP-8** | G6: every impact gap that is not a ceiling, closed                                                                                                                                                              | G6                                 |
| **IMP-9** | The verdict: the report regenerated, and impacts at 9 — or exactly what is missing, and why                                                                                                                     | —                                  |

Then the work **stops** and waits for Andrea's order. The order suggested
after impacts, each only by that order: waves from landslides, volcanoes,
explosions, waves from earthquakes, earthquakes.

#### IMP-0, done 21 September 2026: what the census found

**No held-out fireball exists today.** The 357 that I2 read were every
bolide of NASA JPL's catalogue carrying an altitude of peak brightness and a
speed on 15 September (1 072 listed, 472 without an altitude, 242 without a
speed, Chelyabinsk seen). On 21 September the catalogue lists 1 073, and
**the same 358** carry both — none gained the two numbers since, and none new
has them. Over the last year sixteen did, so new ones arrive at about
**sixteen a year**: eight rows, the smallest set G3's amendment of
18 September reads, around **March 2027**; twenty around the end of 2027.

So **G3 cannot be read on impacts before then**, and neither can the G3 half
of G4, which prints G3's figures cell by cell. Impacts cannot reach a 9
before spring 2027, whatever this domain does now. What it can close now is
everything else, and it does.

Not done, deliberately: instrumentally observed meteorite falls lie inside
the form's range and are not in the 357, but I2 names the bolides of the
CNEOS catalogue, and drawing G3's held-out set from another population would
read the rule wider than it is written. They serve instead, with the 357, as
the band's **development** data — which is also what lets IMP-4 build the
band now and freeze it before a single held-out fireball exists.

**The five gaps the report declares for impacts**, classified:

| Gap                                                                                                                                | Class                                                                                                                                                                                                                                        | Closed by |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| No impact in recorded history left a toll                                                                                          | ceiling                                                                                                                                                                                                                                      | —         |
| Climate, famine and disease outside the count                                                                                      | ceiling                                                                                                                                                                                                                                      | —         |
| The airburst drawn as round rings                                                                                                  | a ceiling **only where I3's band holds the measured footprints**                                                                                                                                                                             | IMP-3     |
| The entry bursts a body 13.7 km higher than the sky does                                                                           | the field's own miss — the program's to 0.086 %. The amendment of 16 September says a 9 "misses it too, and the validation report prints by how much", so it is printed as the field's error and not carried as a gap                        | IMP-8     |
| A ground impact's blast read from under the ground, as the program reads it — the construct that shrinks 407 rings as a body grows | work of its own: a physical surface-burst blast for the energy that reaches the ground, as a named departure from the program (G1 allows one with its reason). It is very likely most of G5's 408 as well, which IMP-2 will say ring by ring | IMP-2     |

#### IMP-2, 21 September 2026: where G5 stands on impacts

Read on the sweep's own seed, 5 000 impacts, round by round:

| Round                                                             | Rules      | Outcome                                                                  | G5 reads |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ | -------: |
| The harness corrected (IMP-1)                                     | 621 to 629 | adopted                                                                  |      465 |
| The ground blast held at its checked crossover                    | 630 to 637 | adopted, B-088 closed                                                    |      449 |
| Two causes for a shrinking blast ring                             | 638 to 646 | refused on an unseen seed: B-089, and B-090 withdrawn                    |      449 |
| The final crater joined                                           | 647 to 653 | adopted                                                                  |      447 |
| The seafloor share tapered                                        | 654 to 659 | adopted                                                                  |      445 |
| The field read as a limit                                         | 660 to 666 | adopted: ten "jumps" were slopes                                         |      435 |
| The paper's entry, to close B-089                                 | 667 to 675 | refused by the letter of 673 (e): one key G5 does not read               |        — |
| The paper's entry, asked again                                    | 676 to 682 | refused on an unseen seed: three more rings the height of burst shrinks  |        — |
| The blast rings a source moves                                    | 683 to 690 | adopted: all 396 moved by their source's altitude; B-091 found           |       39 |
| The paper's entry, read by what a wrong entry shows               | 691 to 697 | adopted: no new kind of failure, no jumping source; B-089 closed         |       39 |
| An airburst's flash where the airburst is (IMP-7's first finding) | 698 to 705 | adopted: B-094 closed; the efficiency, B-095, next                       |       39 |
| A low airburst's flash where its fireball meets the ground        | 714 to 721 | adopted: B-093 closed; B-097 and B-098 found on the unseen seed          |       38 |
| An airburst's magnitude from the air that carries it (Harkrider)  | 730 to 738 | adopted by Andrea's choice: B-092 closed; G5 met                         |    **0** |
| An impact that reaches the ground bursts at the ground            | 748 to 755 | adopted: the explained blast rings fall to the airbursts'                |    **0** |
| A low airburst digs where its kept energy strikes the ground      | 756 to 763 | adopted: B-097 closed; the harness reads a crater's birth as a contour's |    **0** |
| An iron's crater field ends where its fragments dig as one        | 764 to 771 | adopted: B-098 closed, by Bland & Artemieva's masses                     |    **0** |
| An airburst's flash from the field's model of it (ATAP)           | 772 to 779 | refused by 777 (b): the watchdog, and two rings at the V/H edge          |    **0** |
| The same, asked again with each cause answered                    | 780 to 787 | adopted: B-095 closed, G6 met; impacts at 8.0                            |    **0** |

Nothing is left on the own seed. The burn ring at the passage from a complete
airburst to a partial one is gone (B-093, rules 714 to 721), and the 38
airburst magnitudes with it (B-092, rules 730 to 738): an airburst's
magnitude is read from the air that carries its blast, Harkrider, Newton &
Flinn (1974)'s Table 4, and the falls left are its source's altitude or the
table's own period, as the blast rings' are. G5 is met on the benchmark's
draw, and impacts count 7.0. What the unseen seeds draw besides: the entry's jump B-091 (the paper's own I_f = 1, a body
that lands whole beside one that bursts; B-089, the program's doubled I_f
against the paper's, is closed), and its neighbourhood, where the breakup
rises with the body's size; a crater that opened at full size where a
complete airburst becomes a partial one (B-097), closed by rules 756 to 763:
below its own fireball an airburst digs with the share of the energy it keeps
that strikes the ground, as its flash and its magnitude already read it; and
an iron's crater that vanished at the strewn field's cut at 20 m (B-098),
which B-091 had been given, closed by rules 764 to 771: an iron's field ends
by its mass where Bland & Artemieva (2006) end it, and from 10⁷ kg its
fragments dig as one.

#### IMP-3, done 21 September 2026: I3 met

By Andrea's two decisions of that afternoon I3 is read against the field:
its width against the band Collins et al. 2017 give their own three
approximations, its shock-physics runs against the same band drawn about the
field's tool. The runs became scorable when the paper's text turned out to
print Table 2's burst altitudes (21.5, 14, 10 and 11 km). Rules 706 to 713:
the product carries the reference's band for every complete airburst's blast
rings; it holds Tunguska's felled forest over 10 to 20 kPa (4.0 to 29.4 km
against 26.5) and Chelyabinsk's windows over 0.5 to 5 kPa; it holds 27 of 43
runs, what the program's static source holds, which reads 0.71× to 1.34× of
the paper's own. Impacts count 5.0. The globe does not draw the band yet —
IMP-7's check 3.

#### IMP-5, done 21 September 2026: G4 met

Rules 722 to 729 (`validation/entryCellsRules.ts`) gave the one quantity of
an impact a held-out set measured, the entry's altitude, its cells: rule 78's
axes crossed and closed at the 357 fireballs' bounds (0.048 to 49 kt, 9.8 to
71.1 km/s), for the body the rows were run as (3 000 kg/m³, no class) at their
angles. The machinery is generic (`validation/measuredCells.ts`); the product
carries the verdict for every input (`measuredCells.entry`) and says it in the
panel, under the burst's beacon and in the legend; the report prints I2 cell
by cell, with G3's column empty until IMP-6. Every preset lies outside — the
entry was measured on bodies of 49 kt at most. Impacts count 6.0.

#### IMP-4, done 21 September 2026: the entry altitude's band, frozen

Rules 739 to 747 (`validation/entryBandRules.ts`) built the band of the
quantity I2 names on the 357 fireballs IMP-0 made its development data, and
froze it before the first fireball it will be scored on exists: the burst
altitude plus the 5th and 95th percentiles of the model's error over the
fireballs of its measured cell, sampled and not fitted (the two cells above
3 kT pooled). It lies mostly below the burst — the model, like the program,
bursts a body higher than the sky does — and it is drawn in the panel and on
the burst's beacon, none outside the cells. IMP-6 scores it on the fireballs
published after 21 September 2026, from eight, and fixes with Andrea how G3's
width bound, written for a σ_ln, reads kilometres.

#### IMP-8, begun 21 September 2026: the gaps, classified

The report now says which of an impact's declared gaps are ceilings — its
toll, which no impact left; the deaths no count of the prompt effects sees;
and, since I3's band holds both footprints, an airburst's round footprint —
and prints the entry's miss of the sky in the entry's own section, beside the
program's identical miss, as the field's error and no longer as a gap (the
amendment of 16 September). Two gaps were not ceilings. An impact's air blast
read from under the ground is closed by rules 748 to 755 (Andrea's order of
that evening): a body that reaches the ground bursts at the ground, the
program's law at z₁ = 0, Collins et al. 2005's Eq. 54 — no blast ring of the
own seed falls as its body grows, and Meteor Crater's grow 4.4 times in
range, where Kring (1997) put its flattened trees. The airburst flash's
efficiency (B-095) remains, and G6 with it.

#### IMP-7, done 21 September 2026: what the globe drew that the model did not

The first pass of the seven checks, on the impact presets, found two things
the globe claimed that the model does not:

- **Burns and fire under an airburst** (check 1 read against physics, B-094):
  the flash's slant ranges were drawn as ground ranges. Fixed by rules 698 to
  705, as NASA's PAIR places an airburst's flash (Mathias et al. 2017).
- **A nuclear mushroom cloud for every impact** (check 6, B-096): a column from
  the ground and a dome from a nuclear scaling, for airbursts too. Replaced by
  the model's own fireball on the ground, and nothing for an airburst.

- **Check 3, the band, for an airburst's blast rings**: since I3 is met the
  globe draws the reference's band about each blast ring of a complete
  airburst — dotted edges at the line-source and moving-source reaches, none
  where the band closes on the ring — in place of the generic σ halo, and the
  legend says which is which (checked headless on Tunguska: the 1 psi band
  15.7 to 29.4 km, the 5 psi high edge 13.1 km).

- **Check 5, outside the measured cells**: since IMP-5 the burst's beacon
  says under its altitude whether the entry was measured there, and the
  legend says it for every impact (read headless in both languages). Where
  no relation covers a scenario, it prints no number and says why: an
  airburst's magnitude outside Harkrider's table (rules 730 to 738).
- **Check 4, provenance**: every ring of an impact names on the globe the
  relation it is drawn from, under what it means (read headless in both
  languages); the panel cites an impact's own thermal and blast relations
  where it cited an explosion's, and the visual contracts say what the model
  computes (B-101).
- **Check 4, the captions, that night**: an impact's rings carry no caption on
  the globe, by Andrea's decision — the legend names each with its quantity,
  threshold, unit and radius, and a caption only repeated it; once the flash
  of rules 780 to 787 drew Meteor Crater's third-degree burns at 8.4 km, its
  caption printed over the 5 psi ring's at 8.5 km. The tooltip keeps the
  provenance one click away, the burst's beacon keeps its note of the
  measured cells, and the globe audit's second check, on captions, has
  nothing left to read for an impact.
- **Checks 1 and 7, read on 21 September 2026**: the globe audit draws every
  radius the model publishes, captioned with its number, on the six impact
  scenarios of the sweep, and the UI track prints every impact preset as Node
  computes it, but Chicxulub at sea, where the application zeroes the fires
  and the liquefaction of an open-water strike on purpose. Photographed
  headless: Chelyabinsk, Tunguska, Meteor Crater, a 1 kt body and a 45 MT
  comet. Found on the way and closed: B-099, B-100, B-101.

- **Check 3, the band, for the entry's altitude**: since IMP-4 the burst's
  beacon draws I2's band on its shaft, inside the measured cells.

Still to do for impacts: nothing of the seven checks. The rings of an impact
other than an airburst's blast carry the generic σ halo of their published
scatter; no rule of this domain names them with a held-out set, so G3 asks
them no band.

#### IMP-7b, 22 September 2026: the impact drawn as the field's map

Andrea looked at the globe on the morning of 22 September and did not accept
it: every quantity carried two or three rings — the contour, the dashed line
of its published scatter and, for an airburst's blast, the dotted edges of
I3's band — of one colour and different radii. The impacts are not closed
until the globe draws them as he approves. Two sets of mocks followed; he
approved the second, the impact drawn **as the field's own map**, the way
ShakeMap draws shaking and Glasstone & Dolan draw a blast: one quantity at a
time as a continuous surface in its units, the model's thresholds as
isolines carrying their value, a colour scale that says what they mean, a
scale bar, and the uncertainty in a view of its own.

Looking closely for the mocks found four defects in what the globe drew,
registered as B-104 to B-107: the zones of different quantities tiled one
another, so that the zone of 5 psi — where buildings collapse — was left
unpainted at Meteor Crater, its inner edge being the larger ellipse of the
third-degree burn; an oblique impact's ring edges were drawn about the point
of impact while their zones stood about the centre the model moves
downrange, 2.24 km apart for Meteor Crater's 0.5 psi; the legend kept the
travelling shock front's row after the front had gone; and two quantities an
impact computes were not on the globe at all, its shaking (the program's
Mercalli rings, verified by rules 154 to 157) and its liquefaction, while a
third, the peak wind the program prints beside the overpressure, was not
computed.

**Decided by Andrea that day**, on the approved proposal:

- The layers, every quantity and nothing left out: **overpressure** (the
  one shown first), **wind** behind the shock front, **thermal fluence** with
  the two fire thresholds, the **ejecta blanket** with the crater,
  **shaking** with the liquefaction, and the **uncertainty view** —
  probability from the published scatter, or, for a complete airburst's
  blast, the agreement of I3's band. Tsunamis and waves stay as they are.
- **Check 4: the value on the isoline.** On a map of the field the value is
  written on its line (5 psi, 1 cm, V); this replaces, for an impact, the
  decision of 21 September to draw rings without captions.
- **Check 3, read on the approved proposal:** an isoline is the median, and
  its band is drawn on the globe in the uncertainty view rather than as more
  lines on the map of the field.
- The imagery turns to greys under an impact's map, as ShakeMap's
  topography does, so that colour belongs to the data alone.

The wind is new to the model and is verified before it is drawn: rules 788 to
792 (`validation/impactWindRules.ts`). The isolines and the field are drawn
from one geometry, the model's oblique ellipse about its downrange centre, so
that no second copy of it can drift (B-053, B-059).

**Done the same day.** The wind was refused by rules 788 to 792 on the
mechanism and adopted by rules 793 to 797 (I1's twelfth clause, `2b84a81`).
The map is `scene/globe/impactFieldMap.ts` — what is drawn, computed only from
the functions the result publishes — `impactFieldRenderer.ts`, which hands it
to Cesium, and `ui/components/ImpactFieldLegend.tsx`, which reads the same
layer the globe draws. The layers a scenario has are the ones its result
reaches: Meteor Crater six, Tunguska four (no burn and no crater),
Chelyabinsk only its shaking, Sikhote-Alin its blanket and its uncertainty.
Every isoline stands on a radius the result prints or the field reaches, and
the colour under it is read back through the same family to within 0.3 % of
Cesium's own ellipse (`impactFieldMap.test.ts`); B-104, B-105 and B-107 are
closed. A layer costs at most 9 ms to build and 26 ms to paint, Chicxulub's
planetary map included, and a layer the reader picks is framed on its own
outermost line. Photographed headless on the Mac's GPU for every layer of
Meteor Crater, Tunguska and Chicxulub, in both languages; axe finds nothing in
the legend.

Left, each named: the Monte Carlo's two halos of an impact (the crater and
the ignition, after a Monte Carlo is run) are still drawn over every layer —
whether they move into the uncertainty view is Andrea's to say; on the GPU a
straight seam of the terrain's tiles can show through a field, which the
texture itself does not carry; and two defects of the other domains were seen
and left to them — `outlinePointAtBearing` folds a bearing past 180° onto the
south for every caption that still uses it, and the legend of an explosion or
an earthquake keeps the travelling front's row after the front has gone.

#### IMP-7c, 22 September 2026: the report says what the globe says, in the reader's language

Andrea asked that afternoon for the downloadable and shareable report to follow
the new maps, and for every word of it to be in the language chosen. The
Italian report printed its rows in English, its numbers with the English
decimal point, its event and regimes as raw values, its place without
hemispheres and its time in UTC; the formulas' names and the reasons for each
source were English; the band column of the casualty table and the headers of
the timeline printed white on white; and it carried no map. A plan with mocks
followed, and he chose the same day: **map C** — the model's own map, with the
globe's photograph of the layer in its corner — on the **light paper ground**,
the **atlas** layout, the link in the **sender's language**, and **only the
impacts translated for now**.

**Done the same day.** `ui/pages/report/impactReportModel.ts` builds an
impact's report — every label through the locales, every number through
`reportFormat.ts` (the language's decimal separator and grouping, a true
minus, radii exactly as the legend prints them, the date in the reader's zone,
the nearest named place and its country from the city index and the browser's
own tables), every map through `availableImpactLayers`, the same the globe
draws — and `ImpactReport.tsx` renders it as A4 sheets: the summary with the
first map, an atlas of every layer with its colour bar, its isolines and what
it cannot say (and, under the uncertainty view, every threshold at 90, 50 and
10 %), the numbers grouped by effect with the figure that draws each, the toll
and the timeline, the formulas the run used, the bibliography and the
provenance. `scene/globe/reportMap.ts` lays a layer flat in the azimuthal
equidistant plane about the point of impact — the plane the model's families
are defined in, so that a pixel's colour is the globe's for the same distance
and bearing, the isolines are the model's own curves and every distance from
the centre is true, which is what lets the page carry a scale bar — on a paper
ground of sea, land and people from the shipped GHS-POP tiles, with the
graticule, the north and the cities of the index. The photograph is taken from
the globe as the report is opened (`globeShots.ts`), each layer drawn without
its words so that it reads the same in either language; a report opened from a
link has no globe behind it, prints the model's maps alone and says so. The
link carries the language and the threshold of the uncertainty view (`lng`,
`thr`), and the report's bar switches the language. B-108 (the formulas,
`impactFormulas.ts`: each with the condition under which an impact runs it),
B-109 (the toll and the timeline on paper, in every module's report) and B-110
(the decimal comma, the globe's Italian strings included) are closed. The
other modules' reports are otherwise unchanged: their rows stay in English
until their turn comes, one module at a time.

Verified by the unit tests — the Italian report and maps of five presets carry
no English word and no decimal point, with keys for words only keys and
numbers remain, the map's isolines are the globe's to 10⁻⁵, a pixel's colour
is the globe's for its range — by the e2e — a cold link in Italian and in
English, the contrast of every printed word above 3 in the impact's report and
in an earthquake's, A4 pages — and printed on the Mac for Meteor Crater,
Tunguska and Chicxulub in both languages, with and without the globe behind.

#### IMP-7d, 22 September 2026: an impact's wave, in a tab of its own

Andrea asked that evening why Chicxulub on New Orleans raised no tsunami. It
raised one: the model computed it and the globe drew its wave map — but under
the field of the layer chosen, which since IMP-7b covers the globe whenever an
impact is drawn, with nothing to take it off (B-113). He chose **a «Tsunami»
tab in the map's legend**, which takes the field off and shows the wave map as
it was drawn before.

**Done the same day.** `impactFieldMap.ts` offers a `tsunami` layer wherever
the result raises a wave, between the shaking and the uncertainty view; it is
not a field (`isFieldLayer`), so the globe draws nothing of its own for it and
turns the imagery back to its colours, and the report, whose flat maps cannot
draw the wave, prints no figure of it. What its legend keys is what the globe
says it drew: `Globe.tsx` records, as it draws the wave map of any module,
the veil's scope and the top of its scale, the NOAA isolines that divide the
field, the hours of arrival drawn, the crest, the streaks and the tiers of the
run-up markers (`waveMapKey` in the store), and the legend reads the veil's
scale with the heatmap's own colour function (`heatmapColorAt`) and the wave
map's colours from `heatmap.ts`, where the globe now reads them too. Its notes
say what raised the wave and in how much water, how to read the veil, and
what the wave of an impact on land leaves out (rules 267 to 273).

New Orleans shows why the reader saw nothing: its source is 0.44 m, raised in
the 1.17 m of water of the nearest sea cell, and no cell of the veil passes a
metre; what is drawn is the hours of arrival, the crest, the streaks and the
run-up of two to five metres on the coast. Whether that source should rise in
the water the crater reaches rather than in the nearest cell's is the next
entry's question. Seen and left to the tsunami's own turn: with the planet's
veil drawn, the coast within 1.5° of the source gets no run-up marker (the
local tile that would carry them is drawn only without the planet's veil),
and the status line says «global + local» when only the global is drawn.
Both closed the same evening at Andrea's word (B-116, B-117).

#### IMP-7e, 22 September 2026: the water a land impact's wave rises in

Andrea chose the same evening to correct the depth New Orleans' wave was
built in (B-114). Rule 268 raises a land impact's wave in the segment of its
transient crater beyond the shore; the depth that caps the program's wave had
stayed rule 248's, the nearest sea's own cell, which since rule 268 is only
the segment's landward edge. At New Orleans the fine tile holds no sea the
shoreline search accepts, and the cell was the planetary mosaic's under the
city itself: 1.17 m, at the floor of half a cell.

**Done the same day, rules first** (rules 798 to 804,
`validation/craterWaterDepthRules.ts`, pushed in aa5a591 before the
candidate). The depth is the mean of the water within the transient crater's
radius, read on a lattice of 33 points a side, each point on the finest map
that covers it and counted as water on the shoreline search's own tests,
capped at 200 m (`waterWithinRadius` in `tsunami/sourcePlacement.ts`,
`craterWaterDepth` in the store, which runs the physics again only when the
first run raises a wave). New Orleans reads 5.76 m, all of it the mosaic's
east of the tile, and its source goes from 0.44 m to 2.14 m and its drowned
from none to twenty; Tampa barely moves; Chicxulub at Lisbon, whose crater
reaches the open Atlantic, goes from the Tagus's 2.66 m to the cap and from a
1.2 m wave to 90 m. Every output of a land impact but its wave is unchanged
to the bit. The methodology entry of the coupling, which still gave the
ejecta law of before 19 September, now gives the segment and the depth
(B-115).

What the round leaves, named in rule 799: the segment is still a straight
coast's; the ejecta's wave, the resurge and the air blast on the water are
still unsized, and at New Orleans they are most of the answer to Andrea's
question; the maps read a lake by its surface and a polder by its floor; the
explosion path keeps the shore's cell; and the Monte Carlo still runs on the
panel's inputs, without the coast.

#### IMP-7f, 22 September 2026: what the map got wrong, measured

Andrea found the crest of Chicxulub's wave starting from New York, a Texas
impact with no tsunami and two burn circles a kilometre apart, and asked for
a careful check across places and bodies. Measured the same evening, without
touching the code: 600 bodies in the pure layer builders (comet, stone and
iron; 20 m to 15 km; 12 to 70 km/s; 15° to 90°) and ten places on the real
globe (the Yucatán, Austin, Dallas, Houston, New York, Madrid, Tokyo, the
open Atlantic, Fiji across the antimeridian). Every line in order, no radius
impossible, the open ocean and the antimeridian right. Found: the crest's
frames skipping the source basin (B-118); lines the map cannot tell apart
drawn apart, and lines at the antipode (B-119); a silent globe where the
impact reaches the sea without a wave the model sizes, or where a wave has no
sea to carry it (B-120) — all three corrected that night, the drawing only.
And three that change numbers, each a round with its rules first: the wave's
seeds are found out to the ejecta's reach (856 km for Chicxulub, one of them
214 km away on another coast) though its height comes from the crater alone;
the shore search gives up near cities, whose nearest water is canals, rivers,
polders and the terrain's artefacts (Tokyo 41 km where the bay is 13; New
Orleans the mosaic's cell under the city); and the ejecta's wave, the resurge
and the air's absorption on grazing paths have no law yet.

**The two rounds that change numbers, the same night.** The wave's seeds:
rules 805 to 811 (seeds only in the sectors holding the crater's sea) were
refused by their own 807(b) — the crater reaches water in almost every
sector — and rules 819 to 825 seed the wave at the points of the crater's own
sea deep enough for the solver, else at the one nearest deep water (B-121).
The shore near cities: rules 812 to 818, every cell of a sector tried and the
mosaic vouching for a body (B-122). Left: the ejecta's wave, the resurge, the
air on grazing paths — the literature first.

#### IMP-9, 21 September 2026: the verdict — impacts at 7.0, and what is missing

_Updated that night: with G6 met by rules 780 to 787 impacts count **8.0**,
and only G3 is missing, by the calendar._

The report regenerated on `cc825ee` reads impacts at **7.0**: I1, I2, I3 and
I4, G4, G5 and G7 met, where the domain opened that morning at 5.0. Two rules
are missing, and why:

- **G3, by the calendar.** The band of the entry's altitude is built and
  frozen (IMP-4); the held-out fireballs it is scored on do not exist yet, and
  eight are expected around March 2027 (IMP-0). IMP-6 scores it then, and
  fixes with Andrea how G3's width bound, written for a σ_ln, reads
  kilometres.
- **G6, met that night.** An airburst's flash, too faint by the luminous
  efficiency of an impact's plume (B-095). Johnston & Stern's paper was read
  that evening and rules 772 to 779 drew the flash from its correlation, the
  stronger of it and the efficiency's at every range as Andrea decided, and
  were refused by their own condition (b): the harness's searches no longer
  returned within the watchdog at 6 to 12 ms a run, and two bodies reaching
  low and fast drew burn rings that shrank as they grew. Rules 780 to 787
  asked it again with each cause answered — the correlation read at its edge
  one input at a time, the footprint's area summed where the path lays its
  heat, a blast ring's cause read from runs without the integral and a
  watchdog of 10 s — and were adopted: G5 reads 0 on the own seed under both
  laws and the same 8 on a seed no run had used. What the correlation cannot
  read is drawn at PAIR's nominal, the field's own, by Andrea's decision.
  Impacts count 8.0 of 9; G3 waits for the calendar.

Open, and outside the benchmark's draw on which G5 is met: B-091, the
paper's sharp strength at I_f = 1. By Andrea's order of that evening B-097,
a crater that opened at full size where a complete airburst becomes a
partial one, is closed by rules 756 to 763, and B-098, an iron's crater that
vanished at the strewn field's cut at 20 m, by rules 764 to 771; and the
texts that went on describing the day's replaced laws (B-102) and a panel
that told an airburst no crater forms beside its crater (B-103) with them.
The work on impacts stops here and waits for Andrea's order.

### Watertight compartments _(Andrea's decision, 22 September 2026)_

The modules are to work as watertight compartments: "we reuse the same
documents, formulas, whatever is needed, but we keep everything separate",
so that work on one event can no longer break the simulations of another.
Measured the night it was asked: twenty-six physics files (~5 600 lines) are
read by at least two modules, and the globe, the store, the panel, the
report's generator and the CI are one piece. Two breakages of that single
night came through the common code — the toll band, and
`outlinePointAtBearing`, which draws every module's labels.

The order Andrea fixed, and where it stands:

1. **The seal of the impacts, to the bit** — done, 22 September, rules 826 to
   835 of `physics/validation/impactSealRules.ts`. Three hundred and eight
   scenarios (the eight presets, and three hundred drawn from a written grid
   by a fixed seed, a hundred on land, a hundred on a coast, a hundred at
   sea, alternating bodies that burst in the air with bodies that reach the
   ground), each carrying four digests: its numbers, its drawing, and its
   report's text in Italian and in English. `src/seal/` holds the reading and
   `src/seal/impactSealData.json` the seal; the test runs in five seconds on
   every commit. One unit in the last place of a density moves eleven digests
   and names them. The seal is remade only when the module is deliberately
   opened, with its reason written in the file
   (`pnpm seal:impacts --opened-by … --moved …`); no workflow ever regenerates
   it. What it does not cover, and says so: the terrain-given inputs and the
   search for the shore, which only the running app derives; the population,
   which comes from the network; the bathymetric solver's wave map; the Monte
   Carlo. **To the bit on one engine and one platform** (rules 836 and 837,
   23 September): the CI read 782 of the 1 232 digests moved and no key
   number, and the same 782 to the same values on Node 20 and on the pinned
   22.20.0 — so the cause is the platform, Linux x64 against the arm64 Mac the
   seal is taken on, not the Node release (rule 836 had guessed ICU; 837
   corrects it). The seal records its Node, ICU and platform; `.nvmrc` pins
   the Node to the patch; the CI compares the digests in a job of its own on
   GitHub's macOS arm64 runner, and elsewhere skips the comparison under a
   name that says where it is made. **Node 24 asked and refused** (rule 854,
   23 September, written before Node 24 ran a line): of the 32 911 sealed
   numbers Node 24.21.0 moves, all but one stay within the bound of one part
   in 10¹²; the first-degree flash radius of one drawn scenario moves by
   3.0 × 10⁻¹². The cause is V8 13.6's `Math.pow`, one unit in the last place
   for about one argument in eleven, carried ×23 by a log-log interpolation
   between two close exposures. No word or format of the report moved. The
   engine stays at 22.20.0 (maintained until April 2027); the next move, to
   Node 26 once it is a long-term release, sets its bound per number from
   the conditioning this run measured.
2. **The shell and the contract of a module**, written once.
3. **The impacts moved into their own module** — their physics, their slice of
   the store, their drawing as a pure description with the common Cesium
   adapter, their panel, their report, their translations, their tests and
   their seal. Three to five sessions, and the seal must read the same
   afterwards: that is what makes the move a move and not a rewrite.
4. **The boundaries held by the lint**, so a crossing is a build error and not
   a discovery.
5. **The other modules, each at its turn.** The common core stays declared:
   units, spherical geometry, the maps, the population, the casualty engine,
   the tsunami's propagation, the viewer. Never two versions of the core,
   never a copied formula — copying has already produced B-053, B-059 and
   B-086.

A seal is not a validation. It says the answer has not changed, never that it
is right, and it protects a defect as faithfully as a virtue. What says
whether an answer is right is the certification the plan of 22 September
builds on top of it.

### The site offers the impacts alone _(Andrea's decision, 22 September 2026)_

"On the site they will not be there any more, it will be only for cosmic
impacts. Then, once we are at a 9 from a laboratory, we will think about the
other modules." The first block of the plan's first phase, honesty on the
cards, and it moves no number: the seal reads the same and the validation
report was regenerated unchanged.

- **One list is the whole decision.** `store/visibleEvents.ts` names what the
  site offers — the impacts; reopening a module is adding a line there. The
  chooser disappears while there is one event, and a link to a hidden module
  opens on the impacts, keeping its place and its view.
- **The code of the other four is untouched**: their physics, presets, store
  and unit tests stay, and the codec still reads all five. Their end-to-end
  tests are skipped, each with the reason beside it, not deleted.
- **The landing page** speaks of impacts only: its presets, the models of the
  impact and of its tsunami, the kinetic energy and the transient crater among
  the formulas, and a new figure made with the simulator (Chicxulub) in place
  of the two screenshots of Tōhoku.
- **The methodology** keeps the sections an impact uses — the impact, the
  tsunami, the population, the Monte Carlo — and every entry of its list now
  names its family.
- **The validation, on the landing page and on its own page, shows the
  impacts' own evidence and says what is missing**, as Andrea chose: thirteen
  quantities of thirteen agree with the Earth Impact Effects Program run as
  its authors run it (the widest gap of a median 0.5 %), 938 comparisons on
  83 impacts; a median error of 13.7 km on the altitude of entry over the 357
  bolides of JPL's catalogue, **with the bar of 5 km written as not reached**;
  and **no impact with a recorded death toll** — the mortality is calibrated
  on explosions of the same energy, and that is an extrapolation. Beside them
  the rules of `GOLD_STANDARD.md`, eight of nine held and G3 written as not
  held, and a section on what has never been measured. The eighteen recorded tolls it showed
  before — Hiroshima, Tōhoku, Pinatubo, Beirut — calibrate engines the impacts
  share, but not one of them is an impact.

### Every number says what it rests on _(phase 1 closed, 23 September 2026)_

The astrophysicist's question — in which domain is the model reliable, with
what error, and when is it only extrapolating — is now answered on every card,
from one table: `physics/validation/evidenceClasses.ts`, beside the
calibration envelope, on his scale. **A**, implementation verified: energy,
entry, crater, air blast and ejecta, each checked against the Earth Impact
Effects Program as its authors run it, with the number of impacts, of
readings and the widest gap of any single one (5.0 % at worst, the entry's),
and a class A that says in its own words that it does not mean the equations
describe the world. **Exploratory only**: heat, burns and fire (thresholds
measured on nuclear flashes of seconds, applied to pulses of minutes),
seismic shaking (indicative: each decade of the unmeasured seismic share moves
the magnitude by 0.67), dust and climate, the tsunami (no impact wave was ever
recorded) and the toll. B, C and D are in the scale and in no row yet: the
blind tests and the hydrocode grid are phases 3 and 5. The entry carries both
its check and its miss — within 5 % of the program, and 13.7 km from the
altitudes 357 bolides were measured at, the 5 km bar not reached.

- **The globe's legend** opens every layer with its class and one sentence of
  what it rests on; the uncertainty view takes the class of the threshold it
  reads.
- **The panel** tags every figure — the section's heading where its numbers
  share a class, the row where they do not — and folds the whole table under
  the results; the validation page prints it open.
- **The report** tags every row but the reader's own inputs, and every key
  figure, and prints the table on a sheet of its own; the report's model
  carries it, so the seal covers it.
- **The toll is renamed** «exposure scenario and modelled mortality», opens
  with the warning that it is not validated for demographic estimates — no
  impact has a recorded toll — and its headline is an order of magnitude,
  one significant figure behind «≈», beside its band.
- **The entry no longer contradicts itself**: «breaks up in the air, strikes
  the ground» beside a share that is never rounded onto a whole it is not
  (> 99.9 %, and what is released in the air).
- The four drawing corrections the plan listed had closed the day before
  (B-118 to B-120).

The proof is two tests and an end-to-end check: the table's figures are
recomputed from the program's comparison and from the validation report, a
class A cannot stand over a reading past the 10 % audit bar, and on the seal's
308 scenarios, in both languages, no layer, no report row and no key figure
appears without its class; on the page, no row of an impact's results does.
**No number moved**: the seal was re-taken with its reason, and of its 1 232
digests the numbers' 308 are unchanged — only the drawing (279) and the
report's text (616) moved, carrying their classes.

### Level A: implementation verified, case by case _(phase 2, 23 September 2026)_

The plan's level A — the impact pipeline held to the reference implementation
of its equations on thousands of cases, with the reviewing astrophysicist's
bars, in every CI run — now stands. A wide grid of 1 782 cases was fixed in
`scripts/eiep-grid.py` before the program was asked (58c599f): a factorial of
ten sizes from 1 m to 30 km, comet, porous rock, rock and iron, 12 to 70 km/s,
15 to 90°; crystalline rock; every range from 1 to 20 000 km for eight bodies;
and sixteen sizes across the passage from airburst to ground impact. The bars
were written before its answers were read (`validation/levelA.ts`, 509e3d7):
under 2 % excellent, 2 to 10 % explained, over 10 % audited or a documented
difference, a constant sign flagged. The Earth Impact Effects Program was then
asked, with Andrea's leave, one request every 1.5 s; it answered 1 713 and
failed on 69 of its own (`validation/eiepGrid.json`, every printed figure and
every ring of its map kept).

With the 83 of the first grid: **1 865 cases, 18 377 readings, the simulator
failing on none.** Where the 83 had found nothing past 5 %, the wide grid
found **497 readings past 10 %, and every one is traced to a cause shown at
work on it** — recomputed, not assumed:

- **the entry's equations** (101): since rules 691 to 697 the entry runs on the
  paper's; the program doubles Eq. 12's I_f (BM-13), and slow irons break and
  burst kilometres apart. On the program's equations every such reading is
  back inside 10 %;
- **an iron's crater by its mass** (216) and **a low burst's crater** (8):
  rules 764 to 771 and 756 to 763 dig other craters than the one whose
  blanket the program's map draws;
- **the program's map** (60): it writes its own crater's radius for a blanket
  ring it would draw past about 10 000 km;
- **the program's printing** (14): winds printed to a millimetre per second;
- **the crater field** (98): where a scattered body's fragments land wider
  than its crater, the program makes a crater field and gives the largest
  fragment's crater; this model digs one crater of the whole body, twice as
  wide. **A defect of this model: B-123, open** — a physics change, for a
  round with its rules written first.

The 2–10 % band is attributed reading by reading, and none of it is left
open: the program's printed precision; the entry's equations; and, for 56
crater readings that sat just past the interval their printed figure stands
for — all below it — the crater's radii the program's own map carries
unrounded: against them the complex craters of the wide grid agree within
0.8 % and the simple ones in the median to 0.02 %.

**B-123 asked first, and refused** (rules 838 to 845, the same morning, by
Andrea's order). The program's crater field is read exactly — its criterion
from the paper, the swarm's spread L(0) against the crater the whole swarm
would dig, separating the program's 14 fields from its 887 single craters,
and its largest fragment's crater, half the whole swarm's to 0.02 % — and
under it 93 of the 98 readings agree with the program. It is refused by two of
its own clauses: the halving is not monotone in the body's size — on a seed no
run had used, a body 0.1 % larger spreads into a field and digs a crater half
as wide, and G5 reads 12 against 8 — and five ejecta readings became
one-sided, the program drawing a 10 m ring inside its own crater where the
model draws none. The law stays at `single` and B-123 stays open; a second
round wants a transition monotone in size, as an iron's field is joined by its
mass. **Asked again and adopted** (rules 846 to 853, by Andrea's choice of a
monotone transition): the crater keeps the whole swarm's up to a spread equal
to it, the program's half from twice it, and D_tc² / L between, with no step,
and a low burst below its fireball is tested the same way, so the crater rule
756 joins across the burst-to-ground switch stays joined. Of the 98 readings,
12 agree with the program, 83 follow the join to one part in 10⁹, 3 are
documented one-sided; G5 unchanged on three draws; no preset and no sealed
number moves. B-123 closed. Read after that run: level A counted only pairs both sides answer.
Closed the same morning: it now counts the readings only one side answers —
3 219, every one traced to a cause shown at work on it, two of them the
program's own: an ejecta blanket its map draws for 2 603 airbursts it has
just said dig no crater, and 107 thick rings inside its own crater.

The evidence table now states level A on both grids — share within 2 %,
readings past 10 %, each documented — and the crater's card names the crater
field it lacks. `levelA.test.ts` runs the whole comparison in every CI run
(about ten seconds here), and the validation report prints its table, the
causes past 10 % and the causes of the 2–10 % band.

### Level B: the model against what was observed, preregistered _(phase 3, 23 September 2026 — not earned)_

Rules 855 to 874 (`validation/levelBProtocolRules.ts`), written before any
source was opened for the test; the sources pinned before the model ran
(`levelBSources.ts`, rule 866 turning a source's words into intervals); the
reviewer's corrections adopted before step 3 (867–874); the predictions of
the model frozen at 2c2c2f5 committed before any observed value
(`levelBPredictions.json`, ad08138); the observed values entered where they
were pinned and scored (`levelBTargets.ts`, `levelBScore.ts`, whose test
recomputes the outcome on every commit). Preregistered, not blind: no third
party holds the targets, and the order protects the test.

The sets. Development, never counted: Chelyabinsk, Tunguska, Sikhote-Alin
(each calibrated on, or changed after a check). Seen, reported only:
2008 TC3, 2018 LA, 2022 EB5 (rows of I2's CNEOS fireballs). Entry: 2023 CX1
and 2024 BX1, bodies seen by telescopes before they entered. Crater:
Carancas. Class D: Meteor Crater.

The outcome. **Entry, not earned**: both bodies break up in the air with no
crater, as observed, but the model breaks them and deposits their energy too
high — 2023 CX1, which held until 29.4 km under 4 MPa, breaks at 47 km in
the model; the mean log ratio over the four altitudes is +0.30, past the
ln 1.3 bar, the sign the CNEOS fireballs showed. **Crater, not earned**:
Carancas digs no crater in any draw, even with its mass widened to 27 t —
the strong chondrite that reached the ground is the case one strength per
density cannot represent. **Meteor Crater, class D**: the observed diameter
and depth lie inside the model's bands over the literature's ranges.

What it names for phase 4, first: the strength of a body. One strength per
density (Collins et al. 2005, Eq. 9) cannot hold a body that yields at
0.12 MPa and one that holds 4 MPa; and the pancake's burst altitude is not
where a fragmenting body's light peaks. Coverage is not estimated on two
events; a B of the entry that generalises needs a further body seen before
impact, and a crater B a second positive case.

**The second round, frozen before phase 4** (rules 875 to 880,
`levelBSecondRules.ts`, same day). As the reviewer asked, the next list is
fixed before a line of the new physics of strength exists, and its sources
stay closed until its own step 2: 2022 WJ1 counted for the entry, 2024 XA1,
2024 UQ and 2026 RW1 counted only if a source reports an observed (not
modelled) altitude, and Sterlitamak — an iron that fell before witnesses and
dug a single crater — for the crater, if its mass can be pinned from the
recovered meteorite rather than the crater. Phase 4 may learn only from the
development and seen sets and from published statistics of other falls;
2023 CX1, 2024 BX1 and Carancas are regression cases, never fitted to.

**Phase 4, first item: a body's strength in two stages — refused, by the
letter** (rules 881 to 889, `validation/strengthTwoStageRules.ts`). Under the
candidate law the pancake starts at the second fragmentation phase's
strength (Borovička, Spurný & Shrbený 2020, 0.9–5 MPa) instead of Eq. 9's.
I2's median altitude miss over the 357 CNEOS fireballs falls from 13.7 to
5.3 km; level A does not move; G5 reads nothing on either seed. But one test
the adoption would have had to weaken fails: 200 Monte Carlo draws no longer
hold Tunguska's median firestorm ignition within 10 % — a median of a
quantity that is now zero in about half the draws. The default stays
`density`. Read after: the median is the wrong summary there (the chance of
a firestorm and its size when there is one are the right ones), and the
model's exponential atmosphere is 1.5–1.9 times too dense between 40 and
60 km, lifting every altitude by 4–5 km.

**The Monte Carlo says how often, and how large when it happens — adopted**
(rules 890 to 895, `validation/monteCarloShareRules.ts`). Every summary
gains the share of draws above zero and the percentiles of those draws; the
panel shows a quantity zero in more than a tenth of its runs as "in N % of
the runs" with them; the coverage test holds the share and those
percentiles. Nothing outside the Monte Carlo moved. Tunguska's firestorm,
which the panel gave as a median of zero, reads "in 47 % of the runs",
4.8 km when it happens.

**The two-stage strength, asked again — adopted** (rules 896 to 902,
`validation/strengthTwoStageAgainRules.ts`). The same law, the same bars;
the Monte Carlo now draws both strengths, and the tests an adoption could
update were listed before the run. A stony body's main fragmentation starts
at the second phase's strength of meteoroids (0.9–5 MPa, Borovička et al.
2020), measured on bodies of 0.2 to 1.3 m and extrapolated above. I2's
median altitude miss over the 357 fireballs: 13.7 → 5.3 km, its mean
+12.8 → +1.7 km — the systematic bias of the entry is gone, the 5 km bar is
not yet met. Level A does not move (its harness and every check against the
program stay on Eq. 9); G5 reads nothing. Tunguska bursts at 8.2 km, not
9.8, and its 1 psi ring reaches 45 km. Next, in the order the reviewer set:
the entry integrated numerically, proven on the exponential atmosphere, then
the standard atmosphere; and level B's second round, frozen before this, to
test it on bodies it has not met.

**The entry's atmosphere — refused** (rules 908 to 918,
`validation/entryAtmosphereRules.ts`). The entry integrated numerically on
any profile of the atmosphere (`effects/entryIntegrated.ts`) gives
Collins's closed forms on his exponential within 0.8 mm and 1e-5 over 4 068
cases, converges, and agrees with an independent Runge–Kutta integration;
Eq. 11's approximation of the breakup moves it 34 m on average, 40 m at most. The U.S.
Standard Atmosphere 1976 (`effects/ussa1976Entry.ts`) gives its printed
Table I within the last digit from −5 to 150 km, and
`docs/ATMOSPHERE_TABLE.md` shows Collins's exponential 1.5–1.9 times too
dense between 35 and 60 km. On I2's 357 fireballs the standard brings the
median altitude miss from 5.3 to 4.3 km and the bias from +1.7 to −1.6 km,
but the share inside the band of the strength's prior falls from 45.7 % to
42.6 %, beyond the 2 points fixed before the run: refused by its own
criterion. The product stays on the exponential; both the integration and
the standard stay in the code, verified and dormant.
The reviewer confirmed the refusal and closed the round for this phase:
no further selection on the same fireballs. The integration is labelled a
"verified numerical alternative", the standard a "diagnostic physical
alternative — not adopted"; the gap between Eq. 15 and Eq. 14 becomes a
round of its own, "the dynamics of fragmentation", after level B's second
round and on a third set of events.

### Every ceiling and gate, reviewed _(21 September 2026)_

Andrea asked, on opening the domain, whether a ceiling or a gate this
project has put in place is excessive or outdated and blocks everything for
nothing. The test applied to each: **does it protect the validity of a 9, or
does it only stop work?** A gate that protects is kept however much it
costs; one that stops work without protecting anything is a defect of the
method, and is removed or fixed.

| Ceiling or gate                                                                           | Verdict                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules written and pushed before each candidate runs                                       | **keep**                                                 | it is what makes a result a result; it costs a quarter of an hour a round                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| A held-out set is read once                                                               | **keep**                                                 | the whole meaning of "held out"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| No bound loosened after a figure has failed it                                            | **keep**                                                 | with the one exception the file already made on 16 September: re-anchoring to a _measurement of the field_, the old verdict kept beside the new                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| The report's release gate                                                                 | **keep**                                                 | it blocks only on real regressions: the globe contradicting the model, a replay or golden case failing, a gated row losing its record                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| The physical ceilings B-084, B-085, B-086, B-087                                          | **keep**                                                 | each removes an impossibility and moved no row, preset or figure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| The earthquake property gates (P-MONO)                                                    | **keep**                                                 | they are physics, and they caught B-083                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **M10's phase exit** — "no phase begins while the one before it has a rule still pending" | **retired, superseded by M11**                           | impacts' G3 waits for the calendar until spring 2027 and E3 for years; read literally it would freeze every domain behind them. A domain waiting on data does not block the next one, which opens by Andrea's order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **The harness's continuity check**                                                        | **fixed (IMP-1)**                                        | it tests every output where the protocol defines continuity at regime switches only, and no correct model passes it where a contour is born                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **The field's 5 % on a 0.1 % step** (rule 624, IMP-1)                                     | **fixed (rules 660 to 666)**                             | a bound on the slope, an elasticity of 50, not on continuity: the fireball rising over the horizon and the program's line from regular reflection to the Mach stem are steeper than that and continuous. A flagged sample is now searched by halving the step thirty times and counted only if it still jumps; on ten thousand impacts, 317 searched, none jumps. The gate that chooses what is searched went from 5 % to 1 %, which makes the check stricter                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **G5 counting every blast ring that shrinks** (the harness since 15 September)            | **fixed (rules 683 to 690)**                             | a blast ring depends on the body through its source's energy and altitude, and the height-of-burst curve is not monotone in altitude; counting the 396 rings it shrinks as failures measured Glasstone's knee, and made every change to the entry unreadable against G5 (rules 676 to 682). The harness now asks whether the source moved the ring without a step; a source that jumps still counts, and found B-091                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **I3's ×3**                                                                               | **re-anchored, 21 September 2026, by Andrea's decision** | chosen on 15 September "without measuring" (the file's words); the field's own three models spread ×3.79, and the narrowest band that holds nineteen of the twenty runs _and_ both footprints — ×0.74 to ×2.31 of the model, measured on 18 September — is ×3.12 wide, 4 % over. The amendment of 16 September states that "a rule a faithful implementation of the field cannot meet does not measure the model". Re-anchoring it to the field's measured spread would follow that amendment exactly; keeping it makes the impacts' 9 depend on modelling damage better than the field does, which a 9 does not ask. A bound that has been measured is Andrea's to change, not the plan's. Andrea decided that afternoon: re-anchored to the reference's own three-model spread (docs/GOLD_STANDARD.md, the amendment of that day); I3 stays not met until a band is drawn and the runs are scorable |
| N3, V5 and T4's σ bounds on deaths — 1.0, 1.2, 1.5                                        | **probably excessive; decided when their domains open**  | chosen without a measurement, where the best casualty model the field has, PAGER, reads σ_ln 2.55 on its own held-out rows. None has been measured on the set it names, so each can still be amended honestly — before its census, not after                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| The collapse wave's 0.4 of the depth                                                      | **unfounded; its domain decides**                        | the report says it has no source, and it _is_ the answer for two presets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Bundle size and Lighthouse in CI                                                          | **to revisit when the solver comes**                     | a shallow-water solver is heavier than anything shipped; the budget should measure harm to the reader, not the size of a new capability                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| G6's list of ceilings                                                                     | **to complete, with a source for each**                  | a limit of a whole class of models — the 0 to 15 minutes by which every shallow-water solver arrives late — is a ceiling as much as the four listed, and belongs there with its reference rather than as a gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### The risks, and what is done about each

| Risk                                   | Where               | What is done                                                                                                                 |
| -------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A model of the dead that fails its set | N3, V5, T4          | developed only on development data, frozen, read once; a failed read spends the set, so these come last                      |
| Too few events                         | N2, L3, impacts' G3 | the census says so at the start of the domain, not at the end — and for impacts' G3 it has: none today, about sixteen a year |
| The solver too heavy for a phone       | waves               | a grid that adapts to the device, verified at every resolution the product uses                                              |
| A set read and failed                  | every domain        | never read again and never tuned on: recorded, the model improved, a new set sought                                          |
| The calendar                           | E3, E4              | new earthquakes accumulate at their own pace; a set before 1973 is the other honest route                                    |

**Exit.** Every rule of `GOLD_STANDARD.md` holds at one commit, carrying no
gap but the ceilings, every domain drawn faithfully on the globe; then C1 to
C3, in that order.

---

## M10 — The road to a 9, counted rule by rule _(open, 20 September 2026; its order superseded by M11 on 21 September)_

M9 is the shape of the work. This is the arithmetic of what is left of
it, read on 20 September 2026 from the scorecard the report
regenerates, and the order in which it should be done.

**Fifteen rules of fifty-two hold.** Thirty-seven remain, and C1 to C3
beside them.

| Domain                 | Count | Hold    | Left | What actually blocks it                             |
| ---------------------- | ----: | ------- | ---: | --------------------------------------------------- |
| Waves from landslides  |   4.5 | 3 of 6  |    3 | two regimes with no worked example                  |
| Impacts                |   4.0 | 4 of 9  |    5 | everything beyond: bands, cells, the sweep          |
| Explosions             |   3.3 | 3 of 8  |    5 | no set of accidental explosions exists              |
| Volcanoes              |   2.2 | 2 of 10 |    8 | four held-out sets never acquired                   |
| Waves from earthquakes |   1.8 | 2 of 10 |    8 | GeoClaw never run on real bathymetry                |
| Earthquakes            |   1.0 | 1 of 9  |    8 | E1 at 0.46×, E2 at 0.13×, E3 short by 0.00127 in ln |

### The three families, and why only one of them is cheap

The fifty-two rules divide into three kinds of work whose costs are not
comparable, and the plan follows from that and from nothing else.

**Fidelity** — G1 and the rules that stand for it (I1, N1, V1, L1) —
asks the model to give what a tool of the field gives on the same
inputs. It closes with **code and references. It spends no data**, and
it can be repeated as often as it fails.

**Accuracy** — E1 to E3, T1 to T4, L2, I2, N2, N3, V2 to V5 — asks for
bias and scatter inside a bound on a held-out set of a named size. It
closes **only with rows nothing in the model has ever read**, and rule 5
spends the set on the first reading. There is no second attempt on the
same rows.

**Beyond** — G3, G4, G5, G6, G7 — asks for bands, a declared input
space, robustness, declared gaps and the method. It is **machinery,
built once and paid for six times**.

Today G7 holds on all six panels and almost nothing else that cuts
across them does. **G3 and G4 fail on all six**: twelve of the thirty-seven rules
left, which is very nearly a third of the remaining work, and it is one
job done six times rather than six jobs.

### Phase 0 — What can be closed without spending a single row

Nothing here reads a held-out set. It comes first because **measuring a
model that is not yet the field's tool measures noise**: a bound met by
a model that disagrees with the reference is met by luck, and the set is
spent either way.

The table is the state after the night of 20/21 September, which moved
four of the seven lines. The three sections below it say how.

| Work                          | Domain          | Where it stands, 21 September 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1, the two remaining regimes | Landslide waves | **the sources are read.** Watts et al. 2005's submarine equations and both of the manual's reservoir shapes are transcribed and verified in CI. Three candidates refused, each with its figure — 458 m on Storegga, a 21.1× seam, 336 m in a 238 m lake. What is left is a relation whose fitted range overlaps the events this product draws, and the rewiring rules 532 to 540 refused to bundle with a transcription                                                                                                             |
| G5, the sweep                 | Impacts         | 464 failures, **408 of them now explained**: G5's clause is false about the mechanism, since an impactor's size sets the burst altitude rather than being held against it. 40 had a cause already; sixteen remain                                                                                                                                                                                                                                                                                                                   |
| G5, the sweep                 | Earthquakes     | 16 failures, every one an ill-conditioned contour radius. Unchanged, and blocked on an amendment that may not be written after the figure                                                                                                                                                                                                                                                                                                                                                                                           |
| I3, the airburst's blast      | Impacts         | **measured, and not closable as written.** The felled forest sits between the two thresholds the field names, not outside one. A band from the reference's own three models holds both measured footprints and is 3.79× wide where I3 allows 3 — the rule is tighter than the spread the field reports on itself. And the ninety per cent of the runs needs a burst altitude Table 2 does not print                                                                                                                                 |
| V1, two clauses of four       | Volcanoes       | pyroclastic currents and lahars not held to LaharZ. Unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| G1, the wave relations        | Waves from eq.  | held to GeoClaw fixtures by tolerance, not within 1 % of a reference. Unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **POS, the seventh**          | every domain    | **new, and the one that paid.** Ask whether an output is POSSIBLE rather than whether it is right. Three defects in one night, all three closed — B-084, B-085 and B-086 — none of which any held-out set would catch, because they live where no event has happened and the product draws them anyway. `pnpm audit:invariants`                                                                                                                                                                                                     |
| **CONS, the eighth**          | every domain    | **the lens again, on accounting.** POS asked whether a number is geometrically possible; this asks whether the numbers ADD UP — ash against what erupted, radiated energy against the event's, a blanket against the crater, aftershocks against the mainshock, slip against the moment and the rupture. Five of seven clean over 4 000 to 9 800 scenarios each; one withdrawn as the round's own misreading; one real, B-087, closed the same night by giving the rupture area a floor of M0/(mu D_max). `pnpm audit:conservation` |

**Seven rules, no data spent.** The night of 20/21 September spent the
first item and found the seventh. What it did not do is close L1: the
sources are read and the candidates are refused, which is most of the
work and none of the rule.

#### What the night of 20/21 September did to the first item

Four rounds on L1's two regimes. **No default changed**, and that is the
result rather than a failure to reach one: the two candidates that would
have changed one were each refused by a bar written before they ran.

- **Rules 500 to 508, the submarine slide.** Watts et al. 2005's Eqs. (17)
  and (18) transcribed and held to every worked example their sources
  print. REFUSED as a default: Storegga, the only recorded submarine wave
  this project holds, lies outside the equations' own fitted range at
  d/B = 0.018 against a required 0.06, and there Eq. (17) returns 458 m
  against a record of 0.3 to 3.0 m.
- **Rules 509 to 517, the same equations inside their range only.** It
  holds Storegga, reaches a quarter of the sweep's submarine scenarios,
  and says which relation drew each number. REFUSED by rule 511: the seam
  at the threshold is **21.1×**, twice B-083's, against a limit of 2 taken
  from Tappin 2017's published scatter. The seam is independent of slide
  volume and grows with slope, so it is structural.
- **Rules 518 to 524, the manual's 2D case.** Transcribed and verified
  against the manual's own worked channel decay.
- **Rules 525 to 531, the manual's 3D propagation.** Transcribed and
  verified against eleven printed numbers of its worked Example 2.

**What changed in the diagnosis, which is the part worth keeping.** L1's
confined-basin half was described here as "a regime with no worked
example". That was wrong. The impulse wave manual is titled _Landslide-
generated Impulse Waves in Reservoirs_; its §3.2.4 is "Reservoir shape"
and splits into a 2D and a 3D extreme case, and a confined basin is the
2D one. The manual's own Example 2 generates in 3D and switches to the 2D
decay only where the reservoir narrows — so **the confined basin is a
propagation case, and this project replaced its generation**. The larger
finding behind it: Nimbus had the manual's generation and none of its
propagation, handing the generated amplitude to Ward & Asphaug's 1/r
instead. Both of the manual's shapes are now transcribed and verified,
which is what the round that rewires the branch needs.

**What L1 now costs.** Not "find a source with worked examples" — the
sources are read, transcribed and in CI. The submarine half needs a
relation whose fitted range and the events this product draws actually
overlap, and the confined-basin half needs the rewiring these rounds
deliberately refused to bundle with a transcription.

#### And what the rest of the night did, 21 September

Nine more rounds, rules 541 to 578. One defect found and closed, one
audit, and four refusals — three of them refusing a candidate I would
have shipped.

**B-084, found and closed the same night.** The fair comparison inside
the confined-basin round asked whether the SHIPPED subaerial branch did
any better on the invariant the candidate was breaking. It did not: 278
of the sweep's 1 827 subaerial scenarios drew a wave taller than their
own water, the worst at 1 102 times. The cause was dated — rule 163
removed a 0.4 h ceiling on 17 September, correctly, because the manual
reaches 0.94 h inside its own experiments, and nothing replaced it
outside that range. Rules 541 to 547 closed it with the manual's own
maximum over Table 3-3's box, 0.939651 h, derived rather than chosen.
The 278 are now none.

**The audit of rules 548 to 554.** B-084 was found by accident, so this
asks the other questions on purpose: seven invariants G5 does not read,
over the same 25 000 scenarios, with the sweep's own seeds. Every one
came back clean, and `waveInsideItsWater` — B-084's own question — reads
zero where four hours earlier it read 278. Six readings were withdrawn
as not being laws, each on grounds independent of its having failed, and
all six are printed rather than deleted. A seventh question could not be
asked at all: no result of the sweep carries a toll.

**408 of the 464 impact G5 failures are explained** (rules 555 to 562),
and the explanation is that G5's clause is false about the mechanism:
"the other inputs held" is not true of an impactor's size, which SETS
the burst altitude. The claim was refused by one scenario in 408 — one
where the body bursts higher rather than lower, the same mechanism with
its sign reversed — and it is not restated in a looser form to make it
pass.

**I3 is measured and not closed** (rules 563 to 578). Three findings.
The report's "0.43× the flattened forest" compares against one threshold
where the field names two: at 15 Mt the forest's 26.5 km sits BETWEEN
the model's 20 kPa ring at 15.71 km and its 10 kPa ring at 37.42 km, and
the bracket holds at 15 Mt and fails at 10 and 20, so the felled area
picks out an energy. A band built from Collins et al. 2017's own three
models holds both measured footprints and is 3.79× wide, where I3 allows
3 — **I3's width is tighter than the spread the field reports on its own
models**, so a band that met it would claim more precision than the
reference claims. And Table 2 was read off the page at last, from the
620 sideways glyphs no extractor returns, only to find that it carries
no burst altitude: I3's "ninety per cent of the runs" needs one more
column than the paper prints.

**What did not move.** No default, on any domain. The validation report
regenerates unchanged and the gate passes. Of the nine rounds, four were
refusals, two were transcriptions, one was an audit, one a diagnosis and
one a repair.

#### The lens that paid, and what it found — 21 September

B-084 was found by accident. Its deepest lesson was not an invariant but a
shape: **a bound removed for a good reason, or never placed, outside the
range a relation was fitted on.** Looking for more of that shape found two
more the same night, in two other domains.

- **B-085, a volcanic plume with no ceiling.** Mastin et al. 2009's
  H = 2.00 V̇^0.241 has no upper bound. At the 5×10⁶ m³/s that
  `inputSchema.ts` itself calls "the largest known eruption (Tambora
  1815)" it returns 82.3 km — above every plume ever measured, Hunga
  Tonga's 57 km included. It passes the Kármán line at 1.12×10⁷, and the
  invariant sweep's own volcano sampler draws to 9.9×10⁹, where it returns
  512.8 km. CLOSED the same night by rules 593 to 604, and not by the
  obvious repair, which was ruled out first: the paper's Table 1 tops out
  at 4×10⁸ kg/s, which is 35.9 km, so capping at the fit's own maximum —
  B-084's pattern — would cut Pinatubo and Hunga Tonga. A plume's ceiling
  has to be physical rather than statistical, so it was taken from the
  atmosphere. A plume rises because it is lighter than the air around it,
  and expanding as it rises cools it, so there is a height at which it
  stops being lighter. Computed on the US Standard Atmosphere with every
  parameter fixed in advance at the value that puts it higher — pure water
  vapour at 1 700 K, entraining nothing — that height is 71.89 km above
  the vent: 14.9 km above the highest plume ever measured, and it leaves
  Mastin untouched to the bit throughout the box it was fitted in.
- **B-086, an explosion burning past its own horizon.** CLOSED the same
  night. The flash travels in straight lines, `simulate.ts` has cut an
  impact's fire and burn radii at the fireball's horizon since
  15 September — it was B-028 and B-038 — and
  `events/explosion/simulate.ts` never got the same cut. 156 rings of the
  sweep's 5 000 explosions were outside it, the worst at 2.32×. The repair
  is the sibling's expression, unchanged.

**G5 walked past all three for the same reason**: its clauses read
finiteness, area and the antipode, and 512 km is a finite length well
inside both. One clause, three defects, two domains it had never been
pointed at.

**And the audit's seventh question is answered** (rules 586 to 592). It
could not be asked before because no result of the sweep carries a toll;
with synthetic people under it — a hundred to the square kilometre — the
casualty arithmetic holds over 11 142 plans and 33 790 bands on all five
counts. Nothing is spent: no tile read, no held-out row touched.

**What this says about the plan.** Phase 0 was written as six items of
verification. It is turning out to have a seventh that costs nothing and
pays more than any of them: **ask the model whether it can do the
impossible.** Three defects in one night, two closed, none of which any
held-out set would ever have caught, because they live where no event has
ever happened and the product draws them anyway.

### Phase 1 — The machinery built once and paid for six times

**G4 and E5 — the envelope, declared cell by cell.** The product must
say, for every input the form accepts, whether the scenario lies inside
the cells a held-out set has measured, and the report must print G2 and
G3 cell by cell. The earthquakes already name their cells (the
scorecard's magnitude cells crossed with four depth cells: to 40 km, 40
to 70, 70 to 300, deeper). Built once in general, this closes **six
rules**.

**The Monte Carlo sampler — G3, L3, T5, E4, V6.** Today a wave carries
no band, an impact carries no band, an explosion carries no band. This
closes **six rules**, but only after the matching accuracy rule has
fixed the σ its width is judged against, so it cannot be brought
forward.

Phase 0 and Phase 1 together are **twelve of the thirty-seven**, and
neither spends a row.

### Phase 2 — The data, which is where the plan becomes expensive

Each line is an acquisition the owner has to authorise, and the sets
must be disjoint from everything already read.

| Rule | Needs                                                                       | Have                                                       |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| E1   | ≥ 300 USGS ShakeMaps of every depth, held out                               | ShakeMap 4 **already runs here**; the atlas is partly read |
| E2   | ≥ 100 earthquakes with a PAGER exposure                                     | none                                                       |
| E3   | ≥ 100 earthquakes with a PAGER loss estimate                                | none, **and the 1973–2007 window is burned**               |
| T1   | ≥ 100 DART records from ≥ 10 earthquakes                                    | partial (151 deep-ocean records), NDBC files defective     |
| T2   | ≥ 500 NCEI run-up observations from ≥ 10 events                             | **the set is spent**                                       |
| T3   | reference travel times on T1's records                                      | none                                                       |
| T4   | ≥ 15 tsunamis with a counted toll                                           | none                                                       |
| N2   | ≥ 8 accidental explosions with a mapped damage radius                       | **none at all**                                            |
| N3   | ≥ 10 explosions with a counted toll, Hiroshima and Beirut excluded as tuned | two, both excluded                                         |
| V2   | ≥ 30 eruption phases **not** in IVESPA 1.0                                  | none; IVESPA is read                                       |
| V3   | ≥ 10 eruptions with a published isopach map                                 | none                                                       |
| V4   | ≥ 30 pyroclastic currents and lahars with volume and runout                 | none                                                       |
| V5   | ≥ 15 fatal eruptions                                                        | none                                                       |

**Twelve held-out sets, and the project has one and a half.** This, and
not the physics, is why the counts do not move.

### Three problems this plan does not solve

**T2 is in a dead end, and a rule of ours built it.** This file's
companion says a bound _"is never loosened after a figure has failed
it."_ T2 has been measured and failed — 3.16× under the bound as first
written, 3.69× after the dateline fix corrected a wall that had been
cancelling part of the error. So **T2 cannot be amended**, and its set
is spent. Closing it needs 500 run-up observations disjoint from those
already read. Whether NCEI still holds them is a question to settle
**before** promising T2 is reachable; if it does not, waves from
earthquakes stop at 8 of 10 permanently.

**The PAGER window is burned.** The fatality curves are calibrated on
1973–2007, so E3's hundred rows have to come from outside it or the
measurement is circular. That leaves roughly nineteen years to draw
from.

**E3 missed by 0.00127 in ln** — one part in a thousand, on the bound as
first written. Not amendable, for the same reason as T2. It closes by
improving the model, not the bound.

### Phase 3 — Citability, last

**Decided by Andrea on 20 September 2026**, against the order first
proposed:

> Citability goes last, because first we have to have software that is
> right — otherwise it is pointless.

The reasoning holds and is recorded as the decision: a DOI is a
**permanent citation target**, and minting one over a model whose
earthquake footprint is 0.46× the field's tool points other people's
papers at the wrong version for good. C1 to C3 therefore come after the
model, not beside it.

Recorded against it, because this file records disagreements rather
than settling them silently:

- C3 has a floor of March 2027 and a journal takes months beyond
  acceptance, so the lead time is long and it is spent waiting either
  way.
- The assessment in the section below is that a 9 on all six panels is
  **not reachable with the data available**. Read strictly, "first the
  software has to be right" can mean never.

The mitigation costs nothing and is already almost true: **keep C1's
machinery honest as the work goes**, since the report is already
deterministic and regenerates from its own commit. Then tagging is a
day's work whenever the owner judges the model ready, rather than a
project of its own.

### What a 9 on all six panels would actually take

Stated plainly so that no later reader mistakes the plan for a promise:

- **Impacts and landslide waves can reach 7 to 8** on Phase 0 and Phase
  1, with almost no new data.
- **Explosions and volcanoes depend entirely on acquisition.** The data
  exists in the world; nobody has fetched it.
- **Earthquakes and waves from earthquakes are months**, and T2 may
  already be closed forever by a rule this project wrote about itself.

A paper is written on that, not on a nine that is not there: _here is
what the model does as well as the field's tool, here is where it is
wrong and by how much, here is what it cannot measure and why._ That is
a publishable result, and Phase 0 brings it within reach.

**Exit:** every rule of [GOLD_STANDARD.md](GOLD_STANDARD.md) holds in
the validation report the commit regenerates, carrying no gap but the
ceilings, and C1 to C3 are met in that order after it. **Phase exit:**
a phase ends when every rule it names has a verdict in the report — met
or refused with its reason — and no phase begins while the one before
it has a rule still pending. _(Retired on 21 September 2026 by M11: read literally it would freeze every domain behind one waiting on the calendar — see "Every ceiling and gate, reviewed".)_

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

### 0. Which checks are validation _(labelled 14 September; two held-out groups run the same day)_

A check the model was built to pass says the fit holds, not that the
model is right, and until 14 September the report did not say which
rows were which. Now each quantity each anchor checks carries a role,
with the constant, input or source behind it (`CalibrationUse` in
`calibrationEnvelope.ts`, the "Which checks are validation" section of
the report, and the role column on the public page). Twelve of the
twenty-six checks are tuned on their own event, two have inputs
inferred from the record, three share their source, one is not
established, and eight are held out.

What the labels found: held out, the net has one death toll of four
inside its band and three waves of three, and three of those four
passes are zeros — Kokoxili's empty plateau, and Castle Bravo and Ivy
Mike never entering the water. The remaining one is Beirut's harbour
wave, a 0 m model inside a 0–2 m record. **No held-out row yet checks a
number the model had to get right.** Every non-trivial pass is on an
event the model was set on. That is the first thing a reviewer will
see, and the thing a paper cannot claim around.

What would change it — events outside every fit, measured, and not yet
in the net:

- **Earthquake tolls after 2007**, outside PAGER's 1973–2007 window and
  not looked at when the contour law was chosen: Christchurch 2011,
  Kumamoto 2016, Kaikōura 2016, Pohang 2017, Albania 2019. _In the net
  since 14 September, below._
- **Volcanic tolls** from eruptions no volcanic constant was set on:
  Unzen 1991 and Fuego 2018 for the pyroclastic currents, Nevado del
  Ruiz 1985 for the lahar path, whose runout was set on Mount St Helens.
- **Tsunami amplitudes at buoys** for megathrusts the coupling was not
  tuned on: Illapel 2015 at DART, and Maule 2010 only where the row does
  not lean on the aspect-ratio fallback its rupture helped set
  (`seismicTsunami.ts`). _Done on 15 September 2026 as BM-05: nine
  megathrusts from 2006 to 2025 and 113 DART records, Illapel and Maule
  among them, read to rules committed before the law ran on them; it
  reads 1.00× at the median event (docs/SCIENCE.md)._
- **A plume** from an eruption Mastin et al. 2009 did not fit, with an
  eruption rate measured independently of the column: Grímsvötn 2011,
  Calbuco 2015 — and Eyjafjallajökull 2010 only once its preset takes the
  rate from the erupted mass (Gudmundsson et al. 2012) instead of the
  column it was re-tuned to.

Each has to go in with its role written before its result is seen.

**The earthquakes, run once.** The five earthquake tolls went in on
14 September under rules committed and pushed before the model was run
on them (`heldOutEvents.ts`, commit `cacee02`): inputs from the USGS
ComCat origin and moment tensor, the record from the NCEI significant
earthquake database, no gate, no re-tuning. The result:

| event                 | recorded        | model | band       |                          |
| --------------------- | --------------- | ----- | ---------- | ------------------------ |
| Christchurch 2011     | 185             | 1     | 0 – 15     | misses, 185× under       |
| Kumamoto 2016         | 49 direct – 273 | 332   | 1 – 12 168 | inside, on 10^4.1        |
| Kaikōura 2016         | 2               | 0     | 0 – 0      | misses by two            |
| Pohang 2017           | 0               | 35    | 1 – 17 877 | misses, deaths from none |
| Durrës (Albania) 2019 | 51              | 16    | 1 – 510    | inside, at 0.31×         |

Two inside, and only Durrës on a band narrow enough to have been wrong.
What the misses share was found after they were seen and is written as
such: the fatality curve. New Zealand and South Korea have no PAGER
curve of their own and borrow their region's — New Zealand's reads about
nine deaths at Christchurch even with everyone inside the model's MMI VII
ring shaken at MMI IX, South Korea's kills one in fifteen hundred at
Pohang, where nobody died — and Japan's own is so steep (β = 0.10) that
one sigma of ground motion spans four orders of magnitude of deaths. The
toll band held the curve fixed (a declared gap), so it could not say
any of this. The next step was not to re-tune on these rows but to give
the band the curve's own uncertainty, and then to run the other lists
above under the same rules.

**The curve's scatter, drawn the same day.** Each shaking realisation
now scales its mortality by exp(N(0, G)), G being the `gnormvalue`
USGS PAGER publishes for the country and its loss module uses as the
standard deviation of ln(deaths) (SCIENCE.md, "The curve's own
scatter"). Nothing was re-tuned. Christchurch, Kaikōura and Pohang
still miss; Amatrice and Gorkha move inside, Gorkha on a band almost
five orders of magnitude wide; L'Aquila's gated span is 10^3.4 against
the gate's 10^3.5. The band is now the width PAGER's own numbers give
one earthquake, and for steep or uncertain curves that is too wide for
a pass to mean anything — which says where the next gain is: a
fatality model with less scatter, not a wider net. The population is
still fixed, and G overlaps the ground-motion residual by an amount not
separated.

**The second group, run once.** The rest of the list went in the same
day under rules 7 to 10 of `heldOutEvents.ts`, committed and pushed
(`f49cc41`) before the model was run on it:

| check                      | recorded     | model   | verdict                       |
| -------------------------- | ------------ | ------- | ----------------------------- |
| Illapel 2015 at DART 32402 | 10.9 – 11 cm | 10.6 cm | inside, 0.97×                 |
| Grímsvötn 2011, column     | 14.6 ± 4 km  | 13.8 km | inside, 0.95× (not blind)     |
| Calbuco 2015, 22 April     | 18.0 ± 3 km  | 17.2 km | inside, 0.95× (not blind)     |
| Calbuco 2015, 23 April     | 19.0 ± 3 km  | 15.7 km | inside, 0.82× (not blind)     |
| Fuego 2018, toll           | 201 – 445    | 187     | inside, for the wrong reasons |
| Unzen 1991, toll           | 40 – 43      | 10      | misses                        |

Illapel is the first held-out check of a number that is not zero to land
on its record with a band that could have missed it: the wave law's
coupling was set on Tōhoku's buoy, and on a fifteen-times smaller
earthquake at half the distance it reads 0.97×. The columns agree with
Mastin's relation, as they should, but were not blind. The volcanic tolls
say what the pyroclastic model is: a disc of L = 10 · V^⅓ about the vent.
Fuego's disc reaches 3.7 km where the current ran 11.7 km down one
ravine, and its toll lands inside only because a reach three times short
and a footprint far too wide cancel; Unzen's reaches 0.84 km against a
flow of 3.2 km, and its dead were not residents. The lahar of Nevado del
Ruiz stays out until the net has a runout quantity. What the volcanic
rows point to is a pyroclastic model with a sourced mobility and a
channelled footprint — and, for the whole programme, a held-out set
chosen by rule rather than by list: IVESPA alone has 37 eruptions since
2009 with independently estimated rates and heights.

### 0c. A scorecard for accuracy and precision _(first version 14 September; the sets held out by rule run the same day)_

What "gold standard" means for this project, as Andrea put it: not
out-doing the specialists, but being the model others cite because its
numbers are accurate and precise — for the historical events and for the
scenarios people build. `validation/scorecard.ts` measures both on the
held-out rows, per quantity, per family and per size band: bias as the
geometric mean of model over record, scatter as σ of its log, zeros
counted apart, the share of records inside a death toll's 5–95 % band
against the nine in ten it claims, and the band's width. The report prints
it at every commit and the validation page shows the held-out half
(SCIENCE.md, "The scorecard").

The first reading is the to-do list: eruption columns 0.91× with a
scatter of 0.07; earthquake death tolls 0.11× with a scatter of 2.01,
4 of 8 records inside a band two orders of magnitude wide; every cell on
too few rows. Next, in order: held-out sets chosen by rule rather than by
list (IVESPA's 37 eruptions since 2009 for columns; every shallow
crustal earthquake since 2008 with a toll in NCEI), grid verification of
each module against its reference implementation across the inputs a
custom scenario can set, and a casualty model narrow enough to be both
calibrated and sharp.

The sets chosen by rule were written down (`validation/heldOutByRule.ts`,
commit `3726ade`) and run once the same day, and they read differently
from the eight rows named by hand (SCIENCE.md, "Held out by rule"). Over
406 held-out earthquakes — every NCEI significant earthquake of 2008–2025
with magnitude 6 or more and depth to 40 km — the death toll's band holds
260 records of the 283 where there is something to hold, 92 % against the
nine in ten it claims, with a scatter of 2.32 and a band nearly three
orders of magnitude wide: calibrated, and not sharp. Below Mw 7.5 the
central figure is within a factor of 1.7 of the records; from Mw 7.5 it
is 13.85× them, and the band holds 29 of 34 only by its width. That last
figure was 0.41× on the first run, because the harness counted an
extended source's people in circles about the epicentre where the
simulator counts the rupture stadium (BUG_REGISTRY B-022, fixed the same
day): the circle had hidden the largest error in the earthquake model.
The 37 IVESPA columns since 2009 read 0.95× with a scatter of 0.44, 35
accepted. The list after the scorecard, then, in order: the shaking
footprint of great ruptures (move 4 below), which is now a measured
fourteen-fold error on the toll; a casualty band that is sharp as well as
calibrated; a set of quiet earthquakes to count false alarms on; and grid
verification against the reference implementations. The first was taken
the same day by rules 17 to 19 (move 4): the rings are Boore et al. 2014's,
and the cells read 0.69×, 0.23× and 1.92× from the smallest magnitudes up,
249 of 273 records inside.

### 0b. Every source read against its record _(done 14 September; Vaiont and explosions re-tuned, the other gaps open and declared)_

A reviewer checks citations before physics, and until 14 September
nothing here had. Two passes now exist. `pnpm audit:sources` resolves
every DOI in the repository and compares every methodology citation
with Crossref — metadata only, rerunnable by anyone, passing. And every
methodology card was read against its source and against the code, by
section, with the text of the source quoted for every finding.

What the reading fixed in the model:

- **Earthquakes.** Aftershocks drawn six times too few; steep ground read
  as soil C.
- **Impacts.** The seismic magnitude read a radiated energy as a moment,
  ≈ 2.9 units low; the ejecta thickness used the final rim radius
  (2.4–10× too thick); complex craters took a lunar depth fit (2.6× too
  deep); stratospheric dust and acid rain were ≈ 130× and ≈ 80× their
  sources.
- **Vaiont (re-tuned).** The confined-basin factor is 1.8, set on the
  wave Genevois & Ghirotti 2005 give — a crest 140 m above a dam top that
  stood 25 m above the lake — instead of 3 on the slide's thickness. The
  wave is now a gated row of the report, tuned on it.
- **Explosions (re-tuned).** A chemical charge enters the free-air blast
  fit at twice its yield for the ground's reflection (Takazawa, Kim &
  Garcés 2023), and has no burn, fire, radiation or pulse (Glasstone &
  Dolan §1.23). A nuclear burst's thermal partition falls from 0.35 in
  the air to 0.18 on the ground (§7.101). Crater coefficients take the
  book's dry-soil crater (§6.09) and the mile-wide craters of Castle Bravo
  and Ivy Mike. Beirut's toll, already four times the record, rose to
  6.6× with the larger rings: what remains is the population raster and
  the conventional mortality bands, which were not refitted.
- **The scatter of ground motion.** σ_lnY was 0.50, cited to Boore et
  al. 2014 with a τ and a φ the paper does not give; its PGA
  coefficients give 0.60 at M ≥ 5.5. The toll bands widen and no
  verdict changes; the footprint check's reference becomes a ceiling of
  0.85, with the 0.49 of the between-event part beside it.

What it found and did not change — the gaps a paper has to state, and
the candidates for re-tuning:

- **Tuned on numbers the sources do not give.** Anak Krakatau's prefactor
  was set on an 85 m source; Grilli et al. 2019 simulate a leading wave
  nearly 50 m high. Storegga's on a 5–10 m source amplitude that Bondevik
  et al. 2005 do not give.
- **An airburst's shock radii.** Replaced on 15 September 2026 by the
  Earth Impact Effects Program's own air blast (B-032, docs/SCIENCE.md),
  and Chelyabinsk's preset now flies the body Popova et al. 2013 measured
  (B-033). What stays open is the source's shape: a still point draws the
  1 kPa ring at 30 km and gives 0.7 kPa in the city where the windows say
  about 3 kPa. No analytic line source holds that close to such a trail
  (Gi, Brown & Aftosmis 2018); the next model wants a 3D solver's results
  to stand on.
- **People at each intensity, against PAGER.** The rings count people from
  MMI 7.0 where PAGER counts VII from 6.5, and their median PGA never
  converts to IX. PAGER's own chain — PGV through Worden et al. 2012, its
  bands and rates — cut the people score from 1.76 to 0.63 on 187
  earthquakes and held the dead within the margin, but scored 1.13 against
  0.97 on rule 18's ShakeMaps, so by rule 33 it is not adopted (BM-03,
  docs/SCIENCE.md). Still open: one Vs30 under the epicentre where ShakeMap
  has a site map, and rule 18's score, which credits no band rightly left
  blank. The prospective set (rules 27 to 30) chooses the rings with a
  score that does, and the PGV relation is among its candidates.
- **The rings of a subduction interface.** Two interface models beat Boore
  et al. 2014 on the ShakeMaps of 451 interface earthquakes in every reading,
  and the better, Parker et al. 2022, was not adopted: its toll band held
  too few of the recorded dead (BM-10, rules 35 to 39). An interface
  scenario below Mw 7.5 is a disc since rules 40 to 44 adopted it on
  earthquakes no rule had read. Counting the dead below MMI VII, as PAGER
  does, was tried on 298 moderate earthquakes no rule had read and brought
  the toll no nearer the record (rules 45 to 49, docs/SCIENCE.md, "The dead
  below MMI VII"); the toll in place stays. That set showed where the
  moderate toll goes wrong instead: Iran's steep national curve counts 7 587
  dead for Shiraz 2010, which killed one, and the deadliest earthquakes stand
  on the browser's 760 m/s. Drawing a disc's rings at Thompson & Worden's
  average distance to the rupture, as ShakeMap 4.0 draws a point source, and
  giving the interface models that rupture distance below Mw 7.5, was tried
  on the 421 maps of 2000 to 2007 no rule had read (rules 50 to 55,
  docs/SCIENCE.md, "A disc's distance to its rupture"). The wider rings lost
  on maps that mostly hold no strong shaking, though they came nearer where a
  map reaches MMI VIII, and Parker et al. 2022 at that distance again held too
  few of rule 11's records; nothing changes. Still open: a stadium's rupture
  distance stands on the hypocentre's depth. Both interface models, at either
  distance, are among the prospective set's candidates.
- **Rings that are always there.** Scored with the prospective set's skill
  score, which credits a band rightly left blank, on the 1 101 ShakeMaps of
  1973 to 1999 no rule had read (rules 56 to 60, docs/SCIENCE.md, "The rings
  when a silence counts"), Boore et al. 2014 has no skill at MMI VII: it draws
  the band about every earthquake of Mw 6 or more, in that set and in every set
  read before. Allen et al. 2012's hypocentral equation below Mw 7.5 won the
  maps (0.42 against 0.06) and read rule 11's dead nearer their records, but
  was not adopted: silent where the maps are silent, it also draws bands of
  [0, 0] about moderate earthquakes that killed, and its band held too few
  records below Mw 6.5. Counting the dead of its V and VI bands was tried on
  194 small and deep earthquakes no rule had read (rules 61 to 65,
  docs/SCIENCE.md, "The hypocentral equation with the dead of V and VI"): it
  read the dead nearer their records than the toll in place and fixed most of
  the small earthquakes left at [0, 0], but still held fewer than eight records
  in ten, because the hypocentral equation draws no V ring about deep
  earthquakes that killed. Nothing changes. Open: a law silent where the maps
  are silent that still rings the deep earthquakes' dead; the prospective set
  reads every candidate again.
- **Earthquakes deeper than 70 km.** Since 15 September 2026 their rings are
  drawn with Abrahamson, Gregor & Addo 2016's intraslab model, a disc at every
  magnitude, chosen on the 618 ShakeMaps of 1973 to 2025 no rule had read
  (rules 66 to 70, docs/SCIENCE.md, "The rings of an earthquake deeper than 70
  km"): a skill of 0.86 at MMI VII where Boore et al. 2014, painting VII about
  every one of them, scored 0.00, and the dead of 62 deep earthquakes read
  nearer their records (0.80 against 1.09). Its band holds fewer of those
  records, 38 against 58, most of the misses bands of [0, 0] about deep
  earthquakes that killed, Hindu Kush 2015 among them. Open: the band still
  draws Boore et al. 2014's σ of 0.60 where the model's is 0.74, and the toll
  of a deep earthquake counts no dead below MMI VII — read afterwards,
  counting the V and VI bands on these rings holds 87 of rule 61's 100
  records deeper than 40 km against 74, on a set that has been read.
- **The band's residual, drawn in two parts, was tried and not adopted.** A
  realisation draws one residual of σ 0.60 for the whole footprint, which
  counts all of the within-event scatter as if every place moved together.
  Rules 71 to 75 (docs/SCIENCE.md, "The residual in two parts") drew the
  between-event part shared and the within-event part averaged over the
  footprint with Jayaram & Baker 2009's correlation: the bands narrow by a
  factor of two and drop nine of rule 11's records, Noto 2024 among them, so
  the interval score gets worse and nothing changes. Open, and the one thing
  that could keep both: average the within-event part over the people rather
  than over the ground — a town inside a 50 km ring sees nearly one draw of it.
- **Impacts: the entry bursts higher than the sky does.** Held out until 16
  September 2026, the 357 bolides of NASA JPL's fireball catalogue that carry
  an altitude of peak brightness, a speed and an energy say the entry — Collins
  et al. 2005's, reproduced to the rounding of their own program — bursts a
  median 13.7 km above the altitude the sensors measured, and 12.8 km above it
  on average (rules 76 to 79, docs/SCIENCE.md, "The entry model against the
  bolides"). At the panel's stony class, ten times the strength, 8.3 km. The
  gap is declared; nothing is tuned on a set now read, and any choice among
  strengths belongs to a set nobody has read yet.
- **Explosions.** The thermal partition between the ground and the air is
  interpolated linearly, not read from the book's Table 7.101; the
  conventional mortality bands were composed with Beirut in view. (Three
  closed on 16 September 2026, each by reading the page the project already
  cited. The burn thresholds were fixed at 8, 5 and 2 cal/cm² where the
  book makes the exposure grow with the yield: its Figure 12.64 was traced
  and adopted — rules 80 to 84. The initial-radiation radii were a fit
  whose own anchors cited a figure the book does not have: its Figures
  8.33a/b and 8.64a/b were traced and adopted, and the rings now answer to
  the height of burst as well — rules 85 to 89. See docs/SCIENCE.md, "The
  exposure that burns, from the book's own figure" and "The initial
  radiation, from the figures the book draws". An impact still draws the
  project's burn fluences, which is a gap of its own.)
- **Volcanoes.** The PDC, ashfall, lahar and climate relations are
  project calibrations whose anchors were not rechecked.
- **Unread.** A published table of tsunami arrival times; the tests that
  need it are skipped. The Venus II chapter behind the complex-crater
  depth, read only through Collins et al. 2005. The 30 cm credited to
  Satake et al. 2013 at DART 21413 was read from the buoy's own file on
  15 September 2026 instead: it crests at 0.81 m (B-034).

Every item above is now a declared gap of the validation report and of
the public validation page, together with two the reading made plain
without being about one source: the toll band holds the population and
the fatality curves fixed, and subduction earthquakes are shaken with
crustal relations and slip on one rigidity of 30 GPa (Bilek & Lay 1999
infer it lower on shallow megathrusts), with Tōhoku's 13 m of mean slip
against about 10 inverted — the rupture area, under move 3. The page's list lives in
`src/ui/pages/validationGaps.ts`.

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

**The impact layers are held to their reference implementation**
_(14 September)_. The equations the impact pipeline cites have an
implementation run by their authors, the Earth Impact Effects Program,
and `scripts/eiep-reference.py` stores its answers on a fixed grid of 83
impacts on land. Where both codes bring a body to the ground whole, the
energy, both crater diameters, the ejecta blanket and the fireball agree
to the program's rounding, and a test gates it. Where they part the
report measured it: the simulator's atmospheric entry was a classifier
tuned on two bolides, and it burst in the air 21 of the 57 impacts the
program brings to the ground, among them a 100 m stony body that digs
1.6 km there. The same day the simulator took Collins et al.'s own entry
equations (their Eqs. 8–20, B-023): on the grid every outcome and every
kind of crater now agrees, and on the two bolides the classifier had been
tuned on Chelyabinsk bursts at 29.0 km against the 27.0 measured and
Tunguska at 9.8 km. The complex-crater depth, where the online program
prints three quarters of the paper's Eq. 28, is a question for the authors
before it is a change, and the air blast is a different fit on both
sides.

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
new gate keeps the span under three and a half orders of magnitude so
the absolution cannot return.

_14 September:_ the 0.50 was misquoted; Boore et al. 2014 give 0.60
for PGA at M ≥ 5.5, and that is drawn now (move 0b). Northridge's band
is 4 – 238, Gorkha's 13 – 6 942, and no verdict changed.

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

Still to do: the wave — and it waits on move 3 rather than on effort.
The coastal toll's pair is still the range of the vulnerability
parameters, and the panel says so on any scenario where the wave
reaches a coast. Making it predictive needs one number this project
does not yet have: the scatter of the amplitude arriving at a coast.
There are seven wave anchors, their observations are themselves
ranges, and the two laws in the code disagree with each other by a
factor of seven at DART 21413 — so any sigma picked today would be a
guess dressed as a measurement, and a narrow band on the least
settled part of the model is worse than an honest wide one. Move 3
settles which law is the law; the band follows it.

### 3. One law per quantity _(the wave's decay done, 9 September)_

**Done: the amplitude at range.** One law, in
`src/physics/tsunami/spreading.ts`, and one width under it. The four
answers are one; the veil and the row beside it now agree exactly and
a test says so. At DART 21413 the published row went from 1.93 m —
4.5× the 0.30 recorded once beamed — to 0.27 m, and the Tier-2
Saint-Venant solver, which shares nothing with that chain, reads
0.79× against the same buoy. Sumatra's coastal toll went from 2 600
to 25 700 against 227 900, because its preset had been overriding the
width to the observed 200 km for weeks and the wave had never heard
it. Full account in [SCIENCE.md](./SCIENCE.md), "One law for the
wave's decay".

**What it exposed.** Tōhoku's mean slip is now 13.0 m where the
inversions average about 10, and that same factor of 1.37 takes its
coastal toll from 1.4× the record to 2.9×. Mean slip is M₀/(μ·L·W) and
nothing else, so the obvious suspect was the rigidity — 30 GPa here,
where a whole-seismogenic-zone value is nearer 40, and 40 would give
9.8 m exactly.

**It is not the rigidity, and that was worth measuring rather than
assuming.** μ scales every wave by the same factor, and the rows
disagree about which way they need to move. At 40 GPa: DART 21413 goes
from 0.90× the record to 0.67×, Tōhoku's coast from 2.9× to about
1.5×, and Sumatra's from nine times under to about seventeen. The
log-RMS across the three gets worse, not better. No single scale
factor fixes them, so the residual is not a scale error.

**Closed: the Crossroads Baker anchors checked a law the globe does not
draw** _(found 14 September by the first regenerated validation
report; closed the same day)_. The wave harness spread an underwater
burst as A₀·√(R₀/r), without the energy normalisation of a ring the
veil has carried since 9 September, and read 23.3 m at 300 m and
1.89 m at 5.5 km — inside records of 20–45 m and 1–3 m, while the veil
drew 10.5 m and 0.72 m, outside both. It looked like a choice between
two laws that could not be made on Baker alone, because the same
normalisation is what the coastal toll of a flank collapse like Anak
Krakatau reads.

It was not a choice between laws. **The records had been read as the
wrong quantity.** Glasstone & Dolan (1977) tabulate Baker's waves as
_maximum heights, crest to trough_, at seven ranges from 330 to 4 000
yards (Table 6.57), and the model computes an amplitude — the crest
above still water, half a symmetric wave's height. The "1.8 m at
5.5 km" had no source at all: the book's figure is 6 ft, the ninth
wave, at 22 000 ft (§2.70). Read as printed, halved and held to the
book's own 35 % accuracy for explosion waves (§6.119), the globe's law
reads between 0.75 and 0.84 of every tabulated height, 0.72 of the
crest the USS Saratoga's stern measured at 400 yards (§6.58), and 0.63
of the ninth wave; the same law without the ring's energy reads
between 1.98 and 2.23 of the table, above its tolerance at every
range. So the globe was right and the gate was wrong, and Anak
Krakatau does not move: its law is the one that was already on the
globe. (Those figures are the explosion source as it stood that
morning; by evening the source was Glasstone & Dolan's own relation,
below, and Baker checks the book rather than a construct.)

The harness no longer reconstructs the veil. `veilLaw` in
`amplitudeField.ts` is the body of the field's loop, exported; the
wave rows call it on a flat sea of the measured depth, and a test draws
the whole field on a flat lagoon to prove the two agree. The globe's
misses are pinned empty. Full account in [SCIENCE.md](./SCIENCE.md),
"Crossroads Baker, read as it was printed".

**What re-reading Glasstone found next to it** _(found and closed the
same day, except where marked)_:

- **The explosion source cited pages that do not say what it said.**
  `underwaterBurst.ts` calibrated its 8 % coupling on "Glasstone
  Table 6.50 ≈ 180 m source amplitude for 1 Mt" and took its optimum
  depth of 4 m·kt^(−1/3) from "Glasstone & Dolan §6.40", and the
  methodology page repeated both. The 1977 chapter has no Table 6.50, no
  source amplitude for any yield, and its §6.40 is about buildings
  swaying in Las Vegas. The citations were corrected first (`f8fb69c`),
  and then the source itself was replaced.
- **Against the book's deep-water relation the source was five to nine
  times under at its own optimum depth, and near zero anywhere else.**
  Most of it was the wavelength — the cavity's diameter, 2.4–3.5 times
  shorter than Glasstone's peak wave — with a depth curve of the
  project's own. **Closed:** the burst's wave is now Glasstone & Dolan
  §6.119–6.121 — H·R = 40 500·W^0.54 ft² in deep water, 150·d_w·W^0.25 ft²
  in shallow, the peak wave's period 14.1·W^0.144 s, amplitude half the
  height — with the model's own choices said: a geometric bridge between
  the two relations, the amplitude held inside the Miche breaking radius
  or the gas bubble, and no wave for a burst not within the water. The
  period sets the speed: the arrival-time solver and the veil now move,
  spread and shoal an explosion's wave at the group velocity of its
  period (`tsunami/linearWaves.ts`), 30 m/s for a megatonne over the
  abyss where the long-wave speed is 198, and the veil no longer
  disperses a far field that was measured with its dispersion inside it.
  A megatonne 40 m down in 4 km of ocean now draws 7.8 m at 10 km where
  the globe drew 0.21 m. Against Baker's own table the shallow relation,
  fitted to nothing, reads 0.68–0.71 of the heights out to 2 000 yards
  (gated) and about six tenths beyond, where the maximum passes back
  into the train (declared). Deep Dive no longer runs on an explosion.
  SCIENCE.md, "The burst's wave, as Glasstone & Dolan give it".
- **Closed the same evening: the panel had no depth of burst.** It
  offers "in the air or on the surface" or "under the water" with a
  depth now, the schema refuses only a depth deeper than any ocean, and
  the result says where the burst was. Within the water it makes
  Glasstone's waves, loses its flash, fires and initial radiation
  (§2.64) and its air blast reach shortens by e^(−ρ·λ_d/126) (§6.81,
  §6.53); below the sea floor or under land it is drawn as a surface
  burst and says it is not modelled. A custom explosion — yield, height
  or depth, ground, wind, charge type — went into the shareable link the
  same night (`y`, `h`, `gt`, `ws`, `wdir`, `ct`), and a recipient's store
  rebuilds the identical input object, which is what seeds the
  predictive band. Custom earthquakes, volcanoes and landslides followed
  the same night: every field of the stored input in the link, restored
  wholesale through the validator (`restoreCustomInput`), so a recipient
  gets the identical object rather than defaults with values laid over
  them. `urlState.test.ts` sends every preset through an edit and a link
  and requires the identical object back. That sweep found two things:
  the decoder was stricter than the validator (Elm 1881's 0 m basin was
  refused), and the landslide Anak Krakatau 2018 could not be reached at
  all — it shares its id with the eruption, and `selectPreset` always
  chose the volcano, from the panel and from a link. Both fixed. The
  panel got its landslide fields on 14 September 2026 — every field the
  model reads, the optional ones empty unless set, with the model's
  defaults imported from the physics rather than retyped — and on the
  way the landslide validator was found dropping the slide density, and
  the methodology page printing a prefactor of 0.1 that no product path
  uses (the model runs 0.4 and 0.005, per regime). The same day the
  other four panels moved onto the landslide panel's `DraftNumberInput`:
  bound straight to the store, a keystroke the model refused had put the
  old value back mid-word — on Tunguska, typing 0.07 over the diameter
  stored 60.7 m — and kilometres picked up float noise on their way to
  metres. Closed, with e2e tests that type key by key. Last, impacts,
  whose link predates all of this, moved to the same path: it carried
  seven fields laid over the recipient's input, so an iron body arrived
  with the strength of whatever preset was open, the heading was lost,
  and an ocean impact's depths were written but dropped on arrival. The
  sweep now covers all five kinds.
- **Found on the way, and fixed: the explosion validator threw fields
  away.** It copied six fields into its output and the store keeps the
  output, so the panel's wind never reached the thermal ring — the
  slider sprang back — and editing anything on Beirut, Halifax or Texas
  City dropped `chargeType` and turned a chemical blast nuclear, flash
  and fires included. It now validates and keeps the charge type, the
  distance to the shore and the wind. The same sweep of every preset
  through its validator found two more: the earthquake validator dropped
  `warningIssueS`, so editing Sumatra 2004, Lisbon, Valdivia or Alaska
  gave their coasts a warning nobody could have issued, and the impact
  validator dropped the ocean Chicxulub's basin depth. Both are kept now,
  and no preset loses a field any more.
- **The globe started a burst's wave from the 4 km default basin depth,
  not the water it was fired in.** **Closed for explosions**, which now
  hand the veil the depth at the burst. **Open for impacts**, which still
  hand it `meanOceanDepth`; on a shelf that shoals the rim wave and
  lengthens its apparent path, and it wants measuring on real bathymetry
  before it is changed.
- **Open: a burst on the surface of open water makes no wave.**
  Glasstone's relations are for a burst within the water and say nothing
  about one on its surface, so the wave steps from nothing to the full
  relation as the charge goes under. The wider explosion-wave literature
  (the "upper critical depth" studies) describes surface bursts that do
  make waves; a relation should be
  taken from a source that can be read and cited, not from a summary.
  Declared in the validation report.
- **Settled on 16 September 2026: the impact path dispersed its far field
  twice.** The veil applied Kajiura's dispersion to an impact's Wünnemann
  rim wave, whose exponent the module describes as already folding in the
  dispersion of short impact waves. The impact's wave is now the Earth
  Impact Effects Program's 1/r (rules 150 to 153), which carries it, and
  the veil is told so, as it was for explosions; whether Wünnemann's fit
  contains it was never read in the paper, and no longer decides a wave.

### 3b. What the wave does at the coast, layer by layer

The toll was the only thing being checked, and it hid two different
faults behind one ratio. Measured live on 9 September, from the
run-up field the coastal toll actually reads:

| coast                         | model, median shore height | surveyed          | model toll   | counted  |
| ----------------------------- | -------------------------- | ----------------- | ------------ | -------- |
| Sanriku (Tōhoku, 100–200 km)  | 9.5 m                      | 8–15 m            | 48 500       | ~16 700  |
| Aceh (Sumatra, 100–300 km)    | 4.4 m                      | 5–15 m flow depth | 24 100       | ~130 000 |
| Thailand (~600 km)            | 1.45 m                     | 5–10 m run-up     | —            | ~8 200   |
| Sri Lanka / India (~1 600 km) | 0.72 / 0.76 m              | 3–10 m run-up     | 314 together | ~52 000  |

Two findings, and they are not the same finding.

**Tōhoku's wave is right and its toll is not.** The shore heights on
the Sanriku coast sit inside the surveyed band, and the toll is still
2.9× the record. What is left over is the assumption the model states
on its own label: nobody evacuated. Japan did, imperfectly, and the
difference is about a factor of three. That belongs to the casualty
model, not the wave.

**Sumatra's wave is too small, and increasingly so with range.** A
factor of two to three at Aceh, five at Thailand, five to ten at Sri
Lanka and India. In the open ocean the same: Jason-1 crossed the Bay
of Bengal two hours after the rupture and measured 0.6–0.8 m at about
1 600 km, where the model has 0.19 m. Tōhoku at the same range is
right. The mortality function is steep in flow depth, so 0.72 m
instead of six kills 314 people out of the 176 857 the model itself
puts inside the strip — which is the whole of the far-field deficit.

**The hypothesis the numbers point at: the far-field law has no
rupture length in it.** The spreading law treats every source as a
ring of radius W/2, and 702 km of fault and 1 300 km of fault radiate
the same wave at the same range. A line source does not: broadside,
its far-field amplitude carries L. The missing factor for Sumatra,
measured against Jason-1 and with the beam removed, is about 1.7–1.8 —
and L_Sumatra / L_Tōhoku is 1.85. That is a coincidence worth chasing,
and the shape it wants is one law that reduces to the ring when
L → W, so compact sources keep the law they already have.

It is not written tonight. The constant has to come out of the energy
of a line rather than out of Tōhoku, and seven wave anchors have to be
re-read afterwards. Written down with its numbers so the next pass
starts from a measurement.

**How to re-measure it.** The run-up field needs bathymetry, so no
offline test can reach it and the numbers above come from the browser.
Run a preset, wait for the cascade, and paste this into the console of
the dev server:

```js
const { useAppStore } = await import('/src/store/index.ts');
const bt = useAppStore.getState().bathymetricTsunami;
const cells = [...bt.runup.cells, ...(bt.global?.runup?.cells ?? [])];
// The height the casualty model reads: Green's law shoaling capped by
// the McCowan breaking index, RUNUP_EVALUATION_DEPTH_M = 10 m.
const shore = (c) => Math.min(c.runupM, (10 * 0.78) ** 0.2 * c.amplitudeM ** 0.8);
const box = (a, b, c2, d) =>
  cells.filter((c) => c.latitude > a && c.latitude < b && c.longitude > c2 && c.longitude < d);
const stat = (arr) => {
  const v = arr.map(shore).sort((x, y) => y - x);
  return v.length
    ? { n: v.length, max: +v[0].toFixed(2), p50: +v[v.length >> 1].toFixed(2) }
    : { n: 0 };
};
({
  sanriku: stat(box(36, 41, 140.5, 142.6)),
  aceh: stat(box(3, 6.5, 94.5, 96.5)),
  thailand: stat(box(6.5, 9.5, 97.5, 99)),
  sriLanka: stat(box(5.8, 10, 79.4, 82)),
  indiaEast: stat(box(8, 14, 79.5, 81.5)),
});
```

The toll's own split by arrival time is `useAppStore.getState()
.tsunamiCasualties.bands`, whose windows are minutes: everything past
about ninety is a far coast.

**Measured first, on 9 September: the fault has two widths.**
`simulateEarthquake` publishes W from the Strasser 2010 megathrust
regression — 205 km for Tōhoku, 200 for Sumatra — and everything that
draws the event uses it: the rupture stadium, the casualty polygons,
the veil's source radius. The tsunami module inside it ignores that
and re-derives W as L / aspect, with aspect a constant per fault type:
281 km for Tōhoku and **520 km for Sumatra**, wider than the whole
forearc. So the veil already spreads from one width and disperses and
beams on twice another, and the mean slip that feeds every wave in the
model is computed on the wrong area.

Passing the published width in is one line, and it was tried and
measured. Four rows move, all of them the same quantity: Tōhoku's mean
slip goes 9.5 m to 13.0 m against a gate of 7–12 (G-TOH-DART, B-006,
the replay fixture, the historical cross-bridge). 13.0 is what
M₀/(μLW) gives with μ = 30 GPa and Strasser's own L and W, and the
often-quoted 10 m corresponds to a larger assumed rupture area — so
the number is defensible and the gate was fitted around the
inconsistency.

What stops it being a one-line fix is what sits downstream: the source
amplitude goes 3.99 m to 5.46 m and the 1 000 km row 2.36 to 3.24,
because the coupling efficiency and the dip-dependent uplift factor
were both calibrated against Tōhoku's DART record **with the wrong
width absorbed into them**. Sumatra gains a factor 2.6 the same way,
which is interesting given its coastal toll is 87× under. Untangling
that means re-deriving the coupling with DART 21413 as the target, and
it is the first job of this move rather than a change made in passing.

The veil on the globe reads 0.28 m at DART 21413 and the report prints
1.93 m for the same wave. A reviewer sees that in thirty seconds and
stops trusting the rest.

The six anchored rows blocking the unification — G-TOH-DART, the
Tōhoku replay fixture, the B-006 registry entry, the Cocos NOAA pin
and two module tests — were fitted around the law that is wrong. They
need re-anchoring, not protecting.

### 3c. Who was told to leave _(volcanoes done 14 September; tsunami coasts open)_

**Volcanoes: done.** `VolcanoScenarioInput.evacuationRadiusM` is the
zone cleared before the eruption. Inside it the mortality is the one
measured at Merapi in 2010 — 367 dead among 410 388 displaced (BNPB,
in Surono et al. 2012) — and beyond it everyone a current reaches is
unwarned. A radius and not a switch, because at Mount St Helens the
closed zones reached about eight kilometres, the blast went nearly
four times further, and only three of the fifty-seven dead were inside
the red zone. Pinatubo carries PHIVOLCS's 40 km and moves from 82 477
modelled dead to 82 against 847 counted — under, because most of those
847 died under ash-loaded roofs and of disease in the camps, which the
model does not simulate. St Helens does not move, and should not: its
modelled dead are beyond the zone. The band's old "Merapi ratio" of one
per cent was that ratio rounded up ten-fold; as the centre of a cleared
zone it would have landed Pinatubo on its record by rounding.

**Tsunami coasts: open, with what the replacement needs.** A warning
does nothing in this model under half an hour of lead
(`WARNING_ONSET_S`), and Tōhoku's coast had twenty to forty minutes.
The record says a prepared coast uses them: in the joint JMA / FDMA /
Cabinet Office survey of 870 evacuees in Iwate, Miyagi and Fukushima
(July 2011), 57 % left immediately after the earthquake and 37 % later,
the strong shaking itself the most common trigger; Yun & Hamada (2015,
Earthquake Spectra 31 (3)) find evacuation efficiency dominates the
fatality ratios once height and arrival time are accounted for. That is
the whole of Tōhoku's 2.9× (move 3b). What must not happen is the
shortcut: the model's "evacuated coast" vulnerability pair was itself
read off Tōhoku's death ratios, so handing it to Tōhoku would check the
model against its own input. The replacement is a published
departure-time and travel-to-safety distribution, anchored on a coast
other than the one it came from.

### 3d. The line-source hypothesis, checked from first principles _(14 September: not in its naive form)_

Move 3b measured Sumatra's far field missing a factor of 1.7–1.8 and
noted that L_Sumatra / L_Tōhoku is 1.85. Before writing a line-source
law, the energy argument was checked, and in its naive form it refutes
itself. A source L long and W wide holds L·W of uplift against the
ring's π(W/2)², and radiates it into two main lobes about 2λ/L wide
rather than all the way round; with λ = 2W the two factors multiply to
(L/W)² in intensity, **L/W in amplitude — about 3.4 for Tōhoku**. That
would take DART 21413 from 0.90× the record to about 3×, where two
independent routes currently agree within twelve per cent.

So one of three things is true: the naive argument is wrong (a real
rupture's slip is not uniform, and its uplift is not the mean), the
DART agreement is a compensation, or Sumatra's shortfall is not
geometry at all. The next step is a derivation with a Gaussian source
of the rupture's own aspect and the dispersion-free Green's function,
checked on DART before Sumatra — not a ratio that happens to match one
event.

### 4. The MMI footprint _(open; what the fix needs, 14 September)_

The four invented bands come from Joyner–Boore 1981 at magnitudes it
was never fitted for: its data stop around Mw 7.7, and at Mw 9.1 it
paints 180 747 km² of Japan at MMI IX where the ShakeMap maximum was
8.18. Drawing the contours with NGA-West2 was tried on 9 September and
reverted, because it is a crustal model and three toll rows had been
leaning on the old footprint. What a megathrust needs is a ground-motion
model fitted to subduction-interface events up to Mw 9 — the kind USGS
itself uses for them — implemented from its published coefficient
tables and checked on this same ShakeMap anchor before any toll row is
re-read. Not from memory, and not overnight.

_Tried on 15 September 2026 (BM-10, docs/SCIENCE.md, "The rings of a
subduction interface"):_ Abrahamson, Gregor & Addo 2016 and Parker et al.
2022, coded from OpenQuake's tables and held to it, drew the ShakeMaps of
451 interface earthquakes far better than Boore et al. 2014, but Parker et
al.'s toll band held fewer than eight recorded dead in ten, so by rule 38
neither is adopted.

The 10× on the headline of every earthquake. The contours come from a
point-source attenuation inflated into a rupture stadium, and a
megathrust whose slip is concentrated does not shake its whole
rectangle at MMI IX. After (1) this is a measurement rather than a
conjecture.

And since 14 September it is measured on the toll as well. Counted as the
simulator counts it — on the stadium, which the calibration harness had
been counting as a circle about the epicentre (B-022) — the 58 held-out
earthquakes of Mw 7.5 and above in the NCEI set read 13.85× their record:
Tōhoku's shaking alone 177 033 dead where NCEI gives the earthquake's own
effects 1 474, Wenchuan 316 273 against 87 652. Choosing the replacement
on that same cell would fit the law to the set that found the fault, so
rules 17 to 19 (`validation/contourLaws.ts`, written down before any
candidate ran) choose it on shaking instead: three candidates written
beforehand — the shipped law, Boore et al. 2014 outright, and Boore et
al. 2014 from Mw 7.5 only — scored on the area each shakes at MMI VII,
VIII and IX against the USGS ShakeMap of every earthquake in the rule
set, by magnitude cell. The tolls then check the winner once, and it is
adopted only if it is no worse on them and its band still holds eight
records in ten in every cell.

Run once the same day, on 370 ShakeMaps: Boore et al. 2014 won (mean
absolute log radius bias 0.73 against 1.45 for the shipped law and 1.14
for the split one) and passed on the tolls (mean absolute log bias 0.83
against 1.06, the band holding 90 % or more in every cell), so it draws
the rings now. It takes the cell above Mw 7.5 from 13.85× the record to
1.92× and invents no intensity an earthquake never reached, but most of
its margin on the ShakeMaps is the bands it does not invent: where a
ShakeMap reaches MMI VII the new rings draw it at a median half its radius
between Mw 6.5 and 7.5, and that cell's tolls fell from 0.98× to 0.23×.
Two things follow, in order: the site under the rings (every rule-set row
and every preset stands on reference rock, and ShakeMaps count softer
ground), and a relation for long ruptures and trench earthquakes above
Mw 7.5. Both are chosen the way this one was.

The first is written down, before any row ran on it: rules 20 to 22 in
`validation/siteVs30.ts`. Reading the code for it showed that the harness
and the browser never stood on the same ground. With no Vs30 typed in,
the store gives the simulator the Vs30 of the slope under the pick; the
harness ran every earthquake on rock. So the harness takes the ground as
the browser takes it, read on the same tiles by the same code; the
ground rule is chosen on the same ShakeMaps among three written
beforehand — the browser's slope, rock, and the slope on land with rock
under the sea; and the law is chosen once more on whichever ground
stands. Two defects of the browser turned up on the way and are fixed: a
Launch that beat the new pick's tile read its Vs30 off the last pick's
(B-024), and a block of tiles next to the antimeridian ran round the
planet (B-025).

Run once the same day: rock won on the ShakeMaps (0.73 against 0.97 for
the browser's ground) and lost on the tolls (0.83 against 0.72), so the
browser's ground stands, Boore et al. 2014 stays on it, and the harness
runs every earthquake there. The held-out set reads 0.90× its record, the
middle cell 0.33×. The slope on land with rock under the sea did better on
both tests than the browser's ground but was not the ShakeMap winner, and
is not adopted on a result already seen. What the two tests disagree about
is the next thing to measure: the rings paint MMI VII about all 190
earthquakes whose ShakeMaps hold none, on any ground, and whether that is
the missing depth of the source, the maps' resolution or something else
is not known. It comes before the relation for long ruptures and trench
earthquakes, and is chosen the same way, on earthquakes not yet looked
at.

Written down the same evening, before any of those earthquakes was read:
rules 23 to 26 in `validation/depthRules.ts`. The set is every M ≥ 6
earthquake of 2008 to 2025, no deeper than 40 km, that USGS holds a
ShakeMap for and rule 11 did not take — about 1 170 of them. The
candidates are Boore et al. 2014 as it stands and Allen, Wald & Worden's
2012 intensity prediction equation in hypocentral distance, on its own
and below Mw 7.5 only, the first relation here that reads how deep a
scenario's source is. The choice is made on the set's ShakeMaps as rule
18 made it, and checked on rule 11's tolls and on the set's quiet
earthquakes, which by NCEI's criteria killed fewer than ten.

Run once: 809 of those earthquakes had a map to score on, and Boore et al.
2014 kept its place (2.00 against 2.09 and 2.25), so nothing ran on the
dead. Read afterwards: the score gives no credit for a band rightly left
blank, and on these mostly quiet maps Boore et al. 2014 paints 1 374 bands
they do not hold where the hypocentral equation paints 298. The next step is
that score, written first — hits, misses, false alarms and correct silences
at each intensity — and tried on earthquakes nobody has read yet.

Written the same night as rules 27 to 30 (`validation/prospectiveRules.ts`):
the earthquakes are the ones that happen from 15 September 2026, read thirty
days after each, and the score is the Peirce skill score over MMI VII and
VIII, run once when eighty have a map — about a year. Every ring law
committed before then is a candidate, the law in place stays unless beaten by
a tenth, and a winner still answers to the dead.

### 4b. The planet is a sphere all the way out

Asked on 14 September 2026 whether the simulator treats the Earth as a
sphere, and checked in the code. Most of it does: rings, legend and tooltips
stop at the antipode, πR ≈ 20 015 km; people are counted over spherical caps
by great-circle distance, and a radius of half the circumference counts the
whole planet; burns and fires stop at the fireball's horizon; ruptures follow
great circles; the tsunami's travel times run on a grid that narrows with the
meridians. The Earth is a sphere of 6 371 km rather than the ellipsoid, which
is half a per cent at most. What is still flat, in the order to mend it:

- **The count of people in a planetary circle (B-026, fixed 15 September
  2026).** The longitude window of the cap was ρ / cos φ₀, too narrow toward
  the poles and never every longitude when the cap held a pole: a 7 000 km
  circle about New York left out 183 million people (−12.9 %), 7 000 km
  about Delhi or Beijing and 9 000 km about Cairo 2 to 3 %. The window is now
  Δλ = asin(sin ρ / cos φ₀), every longitude over a pole, and each cell is
  judged by its own width rather than the width at the circle's centre; the
  harness picks the fine tiles as the browser does. Four caps, two over a
  pole, now match a count over every cell of the planet to a millionth.
- **A far wave spreads on a plane.** `tsunami/spreading.ts` spreads the crest
  over a ring of 2πr where the sphere has 2πR·sin(r/R): half a per cent at
  1 500 km, a quarter too small at 10 000 km, and no focusing toward the
  antipode. To change with the DART rows of the calibration net in view.
- **A blast wave scales on flat ground.** Right to hundreds of kilometres;
  for a planetary impact the curvature over thousands is not modelled, only
  the clamp at the antipode.
- **The ShakeMap areas the harness compares are πr².** Under a tenth of a per
  cent at the radii involved; stated so nobody has to find it.

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
which is written but not surfaced). And since 14 September a
validation report that cannot go stale: `docs/VALIDATION_REPORT.md`
carries the whole calibration net, CI refuses a push whose committed
copy differs from what the code generates, and every printed
simulation report names its commit and links to the report at that
commit. It had sat at 30 April for four months while CI regenerated a
throwaway copy on every push. And a public validation page that
reads that report, misses and causes included — the step the goal
section above calls "a laboratory trusts what other laboratories have
checked" made visible to anyone, before any outside reader has sat
down with it. The foundations are there. It is
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
labelled as such. _(Corrected 14 September 2026: the 180 m and the
§6.40 were never in Glasstone & Dolan — the 1977 edition has no Table
6.50 and its §6.40 is about buildings in Las Vegas — so the eight per
cent and the optimum are the project's own too; see M9 move 3.)_

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

This paragraph used to say Crossroads Baker agreed: 23.4 m where
thirty were seen at three hundred metres and 1.90 m where 1.8 were seen
at five and a half kilometres. On 14 September that turned out to be a
law the globe does not draw, set against heights from crest to trough
and a second range with no source, and by the end of that day an
explosion's wave no longer went through this parameter at all: it is
Glasstone & Dolan's measured 1/R, which carries its dispersion inside
it (M9 move 3). Baker therefore says nothing about the dispersion
exponent any more; what supports it is the derivation above.

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

### P1 — The published far-field rows are behind the veil _(megathrust closed 9 September; compact sources diverge by design)_

**Closed for the megathrust** by `95e2104`: the row and the veil now
call one spreading law in `tsunami/spreading.ts` on one width, and
agree exactly. DART 21413 reads 0.27 m against 0.30 recorded. For the
compact sources — a burst, a caldera collapse, a landslide — the
published row keeps Lamb's 1/r and the veil keeps geometric spreading,
on purpose: unifying them was tried on 8 September and put the Sunda
Strait under half a metre of water. That divergence is pinned with its
size in `fieldScalarAgreement.test.ts`. The history below is kept as
it was written.

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

### P0 — Sumatra is 87× under and nothing general explains it _(explained 10 September; see M9 move 3b)_

**Explained, and smaller.** Two things happened after this was
written. The width fix (`95e2104`) found that the wave had never heard
Sumatra's own 200 km width override, and took the coastal toll from
2 600 to 25 700 — nine times under rather than eighty-seven. Then the
coast was measured layer by layer (M9, move 3b): the near field is two
to three times under-waved and the far field five to ten, because the
far-field law has no rupture length in it. Of the 176 857 people the
model puts inside the far strip it kills 314, which is the whole of
the remaining deficit. The density-at-the-cells thread below was the
near-field half of the question and is kept as it was written.

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

**20 September 2026: the reference misses it the same way, and by
more.** ShakeMap 4 now runs on this machine, so the question the
amendment of 16 September exists to force could finally be put: what
does the reference score against those same published areas, run the way
we are run — one source, one rupture, no stations, no felt reports? It
misses them by 0.28 at Northridge, 0.33 at Gorkha, 0.34 at Kokoxili —
and by 11.06 at L'Aquila and **22.03 at Amatrice**. The Italian excess
this entry calls "wildly too generous" is, for the most part, what a
blind model does where the published map was drawn with a dense network
and thousands of felt reports.

Read as a bias and a scatter on those six rows, with the USGS ground
under every point of the footprint: 0.851× and σ 1.335 for us against
1.546× and σ 1.926 for the reference. Both clauses of the amendment
hold. So the entry's premise — "one point-source attenuation curve
inflated into a rupture stadium cannot be right at both ends of the
magnitude range" — is still true of the absolute numbers and no longer
supports the conclusion that the law must be replaced: against a
reference given the same information we are closer to the record than it
is. What remains open is the AMPLITUDE gap against the blind reference
(our MMI VII area is 0.29 of its at Mw 6 to 7, 0.77 at Mw 6.7 to 9.5),
and that is a different question from the one this entry opened.

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

### P3 — Caps the scalar path does not have _(premise corrected 14 September; display fixed, run-up law open)_

**Measured, and the remedy as written would have changed nothing.**
The field does cap run-up at four times the arriving amplitude — but
the arriving amplitude there is already shoaled, up to four times the
open-ocean wave, so the field allows about sixteen times the open-ocean
height. The scalar path lands on the same factor: Boltysh in 200 m of
sea, 19.1 m at 1 000 km, 312 m of run-up, 16×. Giving the scalar path
the field's caps would move no number.

What is actually wrong is upstream of any cap: Synolakis' run-up law is
for waves that do not break, and a 12 m wave in 10 m of water on a
1:100 beach is hundreds of times past that. Two corrections to the
entry below, from the same measurement. **The toll is not affected** —
the coastal toll reads the shore height from Green's law and McCowan's
breaking index, never this run-up, so "a quarter of the toll" is stale
from before that change. **The report was wrong where it said "source
amplitude"**: that label sat on Ward & Asphaug's figure, which has no
depth in it and read 1 362 m in 200 m of sea; the model propagates the
Wünnemann rim wave, capped at the water depth. Fixed on 14 September —
the report prints the rim wave under that label and Ward as the
reference it is — and the legend stopped listing three tsunami
wave-front rings the globe had not drawn since Phase 16.

Still open: the displayed "run-up at 1 000 km" needs a published
breaking-wave run-up law, not an invented ceiling. The history below is
kept as written.

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

### P0 — Every earthquake pointed north _(closed, 20 September)_

Three call sites read `strikeAzimuthDeg ?? 0`: the globe, the store's
stadium and the recorded tolls. Seven presets carried a published
strike; every other earthquake — every one a reader placed — was drawn
AND counted as a fault striking due north, anywhere on Earth.

Closed on 20 September by rules 286 to 328, in four rounds, two of which
were refused:

- the strike now comes from the structure under the epicentre — Slab2
  for a subduction interface, the GEM database for a crustal fault, and
  UNKNOWN where neither is in reach. Six presets of six, worst error
  11.5° against a 25° bound, north beaten on every one;
- ShakeMap, run here twice per event with the azimuth as the only
  difference, says what north cost: 18 % to 68 % of the MMI VII
  footprint on different ground at unchanged area, and Sumatra's exposed
  population from 7.35 M to 19.93 M;
- the tiles ship (2.88 MB of faults, 0.22 MB of slabs; one tile of each
  per click, nothing until an earthquake is placed) and the store
  derives the strike before it evaluates, where it already derives the
  Vs30 and the water depth;
- where no structure is in reach, no oriented rectangle is drawn and the
  toll is counted in the disc that contains the stadium at every
  orientation. Not north.

**What the calibration net could say about it: nothing.** Seven of its
eight north-pointing rows now point somewhere real and no toll moved by
one death, because those seven are point sources and a disc has no
orientation to get wrong. Twelve rows: four presets with published
strikes, seven point sources, one extended row with no dead. The net
cannot measure this, and the entry says so rather than letting
"accepted" read as "confirmed".

Still open from it: rule 290's picture — the ring of an unknown-strike
rupture drawn at the envelope rather than at the published radius — which
would put every caption a rupture-length off its ring, and belongs to a
round with the captions in it.

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
