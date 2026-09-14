# Reviewing Nimbus

For a scientist who has agreed to try to break the model. An hour is
enough to be useful, and no depth is required: one finding with its
evidence is worth more than a general impression.

## What you are looking at

Nimbus is a free browser simulator (AGPL-3.0-or-later) of asteroid
impacts, nuclear and conventional explosions, earthquakes, volcanic
eruptions, landslides and the tsunamis they raise, with casualty
estimates. It chains published analytic and empirical relations —
Collins, Melosh & Marcus 2005 for impacts, Glasstone & Dolan 1977 for
explosions, Boore et al. 2014 and USGS PAGER for earthquakes, Mastin et
al. 2009 for eruption columns, among others. There is no hydrocode and
no inundation solver.

It makes three claims, and these are what we would like tested:

1. **Every number is traced** to a source that says it, or declared as
   this project's own choice.
2. **Every death toll carries a band**: the 5th to 95th percentile of
   200 realisations drawn from the published scatter of its inputs.
3. **The model is checked in public** against recorded events, with
   every miss shown and given a cause, and with every check saying
   whether the model was set on the event it checks.

It does not claim the accuracy of a laboratory or of an operational
hazard tool, and the validation report says where it falls short.

Review a fixed commit and note its hash: the validation page and every
printed simulation report name the commit they come from.

## An hour, a day, or more

**An hour.** Open the
[validation page](https://bayranlabsoftware.github.io/nimbus/?lng=en&m=validation),
then [VALIDATION_REPORT.md](VALIDATION_REPORT.md): its summary, "Which
checks are validation" and "Declared gaps". Then read the methodology
cards for the domain you know best. Two questions are enough: is a
declared gap wrong, or is one missing? And which row that contains its
record convinces you least, and why?

**A day.** Reproduce the report (below), check five to ten formulas
against their sources — the cards give the equation, section or table —
and run from the command line the events you know.

**More.** Take one domain from the questions at the end.

## Reproducing

Node 20 or later and pnpm 9.

```bash
git clone https://github.com/BayranLabSoftware/nimbus.git
cd nimbus
pnpm install
pnpm test                 # unit, integration and validation suites
pnpm validation-report    # rewrites docs/VALIDATION_REPORT.md; CI fails when it differs from the committed copy
pnpm audit:sources        # resolves every DOI and compares every citation with Crossref (needs the network)
pnpm simulate --event=earthquake --preset=NORTHRIDGE_1994
pnpm simulate --help      # every event, preset and override
```

## Where things are

| to check                                  | read                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| a formula against its source              | the cards in `src/ui/pages/methodologyContent.ts`, then the file they name  |
| whether a check was set on its own event  | `use` of each anchor in `src/physics/validation/calibrationEnvelope.ts`     |
| death tolls against the record            | `src/physics/validation/recordedTolls.ts`                                   |
| waves against the record                  | `src/physics/validation/recordedWaves.ts`                                   |
| the shaken area against USGS ShakeMap     | `src/physics/validation/shakemapFootprint.ts`                               |
| the scatter behind the bands              | `src/physics/uq/conventions.ts` and `src/physics/uq/tollBand.ts`            |
| defects found, fixed and pinned by a test | [BUG_REGISTRY.md](BUG_REGISTRY.md)                                          |
| why a choice was made, and what it cost   | the dated sections of [SCIENCE.md](SCIENCE.md) and [ROADMAP.md](ROADMAP.md) |

## What is already known

Listed so that an hour is not spent finding it again; whether the list
is complete is itself a question for you.

- **Many checks are fits, and the held-out ones are new.** Of the 36
  checks in the report, 12 were set on the event they check, 3 share a
  source with it, 2 read an input back from it, 1 is undetermined and 18
  are held out. Ten of the held-out ones were written down and pushed
  before the model was run on them (`src/physics/validation/heldOutEvents.ts`,
  two groups). Of those: five earthquake tolls, two inside on wide bands
  and three missing; Illapel 2015 at DART 32402 on its record (0.97×);
  three eruption columns inside, declared not blind; Fuego 2018's toll
  inside for the wrong reasons; Unzen 1991's missing.
- **Half the death tolls miss.** 9 of 18 fall outside their band, each
  with its cause beside it. Where an earthquake's band is four or five
  orders of magnitude wide, a record inside it has passed nothing: that
  width is what PAGER's own scatter gives a single event.
- **The declared gaps** at the end of the report: evacuation, distant
  coasts of long ruptures, the coastal toll that no offline test reaches,
  a band that holds the population and the fatality curves fixed,
  subduction earthquakes shaken with crustal relations, two wave
  calibrations on amplitudes their sources do not give, three numbers not
  traced to a source read here, the airburst altitude factor, the
  project's own choices in the explosion model, and volcanic calibrations
  that were not rechecked.
- **Every methodology card was read against its source** on
  14 September 2026; what did not match was fixed (B-011 to B-020 in the
  bug registry) or declared. `pnpm audit:sources` passes.

## Which documents are current

**Current** — regenerated at every commit, or read against the sources
on 14 September 2026: VALIDATION_REPORT.md and the validation page, the
methodology cards, the dated sections of SCIENCE.md, BUG_REGISTRY.md
and CHANGELOG.md.

**Not re-read since the spring of 2026**, to be taken as history rather
than as claims: VALIDATION.md (it opens with two corrections),
CALIBRATION_RANGES.md, GOLDEN_CASES.md, HARDENING_PLAN.md,
VERIFICATION_PLAN.md, CONSOLIDATION_AUDIT.md and RELEASE_READINESS.md.

## The questions we most want answered

### Impacts

- Collins et al. 2005 apply their atmospheric-entry model to impactors
  under 1 km across; Nimbus runs it for every size. Where does that break?
- The seismic magnitude is their Eq. 40\* on the energy coupled to the
  ground, with a seismic efficiency of 10⁻⁴ and a band of a factor of ten
  either way. Is that band honest?
- The depth of a complex crater on Earth comes from Herrick et al.'s
  relation for Venus, through Collins et al.'s Eq. 28\*. Is there a better
  terrestrial one?
- An airburst's shock radii are stretched by an altitude factor with a
  fitted exponent. Should a published treatment replace it?

### Explosions

- A chemical charge on the ground enters the Kinney & Graham free-air fit
  at twice its yield, for the ground's reflection; a nuclear burst enters
  at its yield, about half its energy going into blast (Glasstone & Dolan
  §1.25). Right?
- The thermal partition rises in a straight line from 0.18 on the ground
  to 0.35 at the height of Glasstone & Dolan's air-burst curves, where the
  book gives a table. How far off is the line?
- Burn radii use fixed fluences of 8, 5 and 2 cal/cm², where Glasstone &
  Dolan make the thresholds grow with yield. How much does it matter?
- The mortality bands for conventional explosions were composed with
  Beirut in view. Is there a published basis to replace them?

### Earthquakes

- Intensity rings come from Joyner & Boore 1981, reported accelerations
  from Boore et al. 2014, and one ground-motion scatter of σ_lnY = 0.60 is
  drawn everywhere. Acceptable for a public tool — and what should replace
  them for subduction interfaces?
- Deaths use USGS PAGER's fatality curve for the country, and Amatrice
  and Gorkha still miss by factors of about 50 and 15. Is a national curve
  the wrong unit, or is something else wrong?
- Tōhoku's mean slip is 13.0 m, from Strasser et al. 2010's rupture
  dimensions and a rigidity of 30 GPa, where inversions average about 10.
  Which should give way?

### Tsunamis and landslides

- The megathrust uplift factor, 0.6, was calibrated on the DART 21413
  record that is also its check. What independent record would test it?
- The landslide prefactors (0.4 for a rigid block, 0.005 for a submarine
  slump) were set on amplitudes their cited sources do not give, and the
  confined-basin factor, 1.8, on Vaiont alone. What should they be set on?

### Volcanoes

- Column heights come from Mastin et al. 2009, driven by preset eruption
  rates whose provenance is not always written down.
- Pyroclastic runout, ashfall, lahars and the climate response are the
  project's calibrations. Which would you trust least?

### Casualties and uncertainty

- The band samples the physics and holds the population and the fatality
  curves fixed. Is "the band contains the record" a meaningful test of
  such a band?

## How to report

In public: an issue at
<https://github.com/BayranLabSoftware/nimbus/issues>, one finding per
issue, titled "Review: …". In private, or before you are sure:
bayranlabsoftware@gmail.com.

A finding is most useful when it names:

1. the claim — the card, table row, or file and line;
2. what the source says — page, equation or table;
3. what the model does instead, and how far that moves a number a reader
   sees;
4. what you would do, if you know.

A defect becomes a row of the bug registry with a test that fails
before the fix. A limitation that cannot be fixed yet becomes a declared
gap in the report and on the validation page. Reviewers who wish it are
credited in the changelog.

## Independence

A review is worth most from someone who did not write the model, and it
asks nothing else of you. Separately: arXiv asks authors new to
physics.geo-ph for an endorsement, and after a review the maintainer may
ask whether you would be willing to give one. Saying no changes nothing
about the review.
