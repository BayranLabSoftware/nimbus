# Running ShakeMap here

E1 of [GOLD_STANDARD.md](GOLD_STANDARD.md) reads its reference as "a ShakeMap
scenario run on its own ground-motion models without stations, scored the same
way on the same maps", and its status said, from the day the clause was written
until 19 September 2026, "pending: the scenario mode has not been run". This is
what it took to run it, written down because two of the four obstacles cost an
hour each and neither is in ShakeMap's own documentation.

## What to install

ShakeMap is **not on PyPI** — `pip install shakemap` finds nothing. The program
lives at [`DOI-USGS/ghsc-esi-shakemap`](https://github.com/DOI-USGS/ghsc-esi-shakemap)
(the repository moved: `usgs/shakemap` is gone), and its tarball is 210 MB
compressed, 232 MB unpacked, most of it test data.

What is on PyPI is the decoupled half, and it is the half that matters here:

```bash
python3.12 -m venv venv
./venv/bin/pip install "shakemap-modules[all]" esi-shakelib
```

That pulls `openquake.engine`, `esi-shakelib`, `mapio`, `fiona`, `rasterio`,
`cartopy` and about a hundred others, **all as arm64 wheels** — nothing compiles,
and in particular there is no GDAL to build, which is where an earlier attempt at
OpenQuake on this machine stopped. It installs the command-line modules
`assemble`, `model`, `select`, `contour`, `mapping`, `info` and the rest, so the
repository's own `shake` wrapper is not needed.

## The two traps

**1. The Python version is the opposite of what the repository says.** The
repository's `pyproject.toml` pins `requires-python = ">=3.9,<3.10"`. Install on
3.9 and `assemble` dies at import with

```
ImportError: cannot import name 'UTC' from 'datetime'
```

because `shakemap-modules` 1.1.18 uses `datetime.UTC`, which arrives in Python
**3.11**. The repository's pin is stale; the modules need 3.11 or newer. On 3.12
`pip` resolves `shakemap-modules` 1.2.4 and everything imports.

**2. `model` refuses the `-n` its siblings require.** `assemble` takes
`-n <config dir>` and needs it; `model` rejects the same flag with
`unrecognized arguments`. Pass it to `assemble` and leave it off `model`.

And two smaller ones. `select` — the module that picks a GMPE set from the
tectonic regime — shells out to `strec_cfg`, which needs STREC configured and its
slab database fetched; skip it and the default `model.conf` applies, which for a
Californian scenario is `active_crustal_nshmp2014`. And every module wants a
`--logdir` that already exists: it will not create one.

## Where the configuration comes from

`shakemap_modules.utils.config.get_config_paths()` reads
`~/.shakemap/profiles.conf`, which `sm_profile` writes. Rather than put anything
in a home directory, set

```bash
export CALLED_FROM_PYTEST=<repo>/tests
```

which the same function honours: the install directory becomes
`<repo>/tests/data/install` and the event directory `<repo>/tests/data/eventdata`.
The repository's test install is a complete one — `model.conf`, `gmpe_sets.conf`,
`modules.conf`, `extent.conf`, and a California Vs30 grid, `CA_vs30.grd` — with
`gmpe = active_crustal_nshmp2014`, `gmice = WGRW12` and `ipe = Allen12IPE`. The
first two are the same Worden et al. 2012 conversion and the same NGA-West2
family Nimbus uses, which is the point: E1 compares two footprints drawn from the
same kind of law.

## Running a scenario

A scenario is an event with a source and no data: an `event.xml` and nothing
else — no `*_dat.xml`, no DYFI, no finite rupture. Then

```bash
export CALLED_FROM_PYTEST=<repo>/tests
venv/bin/python scripts/benchmark/shakemap-scenario.py \
    --work <work dir> --events <events.json> \
    --config <repo>/tests/data/install/config \
    --out benchmark/results/shakemap-scenario-<date>.json
```

`scripts/benchmark/shakemap-scenario.py` writes the `event.xml`, runs `assemble`
and `model`, and reads the MMI grid out of `shake_result.hdf` through
`esi_utils_io.smcontainers.ShakeMapOutputContainer` — the area above each
intensity and the radius of the circle with that area, which is the quantity
rule 28's score compares a ring against.
`scripts/benchmark/shakemap-against-nimbus.ts` then puts the two columns side by
side on the same sources.

Two things in that harness are choices and not ShakeMap's defaults, and they are
choices this project made: the mechanism is passed as ShakeMap's `mech`
attribute, and the cell areas are summed as `dx · dy · cos(latitude)` on a
sphere of 6 371 km rather than read from a projection.

## What it gives, on the first five scenarios

19 September 2026, `benchmark/results/shakemap-against-nimbus-2026-09-19.json`:

| scenario          |  Mw | depth | ShakeMap max MMI | ShakeMap's VII radius | ours at Vs30 760 | ours at 350 |
| ----------------- | --: | ----: | ---------------: | --------------------: | ---------------: | ----------: |
| Northridge source | 6.7 | 18 km |             7.51 |              21.05 km |         10.07 km |    15.70 km |
| synthetic         | 5.5 | 10 km |             6.67 |                  none |          6.67 km |    10.09 km |
| synthetic         | 6.5 | 10 km |             7.75 |              17.52 km |          9.68 km |    14.90 km |
| synthetic         | 7.5 | 10 km |             8.02 |              43.72 km |         15.81 km |    25.23 km |
| synthetic         | 6.5 | 40 km |             6.24 |                  none |          9.68 km |    14.90 km |

Three things, and none of them is E1's score — five scenarios are not three
hundred maps.

Where both draw a VII, our ring is **0.46 of ShakeMap's equivalent radius** at
the rock reference (0.36 to 0.55) and about 0.7 at a soft-basin Vs30. Where
ShakeMap draws no VII at all, we draw 6.7 and 9.7 km: the same false bands the
report's declared gaps count 1 374 of against published maps, reproduced here
against the tool's own scenario. And the depth blindness is starker than any
published map has shown it: at Mw 6.5 the same 9.68 km ring is drawn at 10 km
depth and at 40 km, where ShakeMap's own maximum intensity falls from 7.75 to
6.24 and its VII footprint disappears.

What is still missing for E1 is the set: three hundred held-out maps, scored with
rule 28. The atlas of 370 this project already carries was read by rules 17 to 19
when they chose the contour law, so it is spent, and which set E1 is measured on
is a decision about the shape of the 9 rather than a step of a round.
