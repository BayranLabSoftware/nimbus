# Tephra2 setup and reference generation

Track VOL of [BENCHMARK_PROTOCOL.md](BENCHMARK_PROTOCOL.md) scores Nimbus's
ash against **Tephra2**, and rule V1 of [GOLD_STANDARD.md](GOLD_STANDARD.md)
asks that the ash be "held to Tephra2 on its own grid where the model is
Tephra2's". The campaign of 15 September 2026 built it and ran it by hand, and
only the statistics survived: `benchmark/results/volcano.json` holds the
aggregates and not one reference point, so no candidate could ever be measured
against it. This page is the missing half — how to get the binary, and the
script that writes the reference file.

## Why Tephra2

[Tephra2](https://github.com/geoscience-community-codes/tephra2) is the
advection–diffusion tephra model of Connor & Connor (2006), building on
Bonadonna et al. (2005) and Suzuki (1983). It is the open reference the field
uses for fall deposits, it is what inversion studies of real isopach maps run,
and it is GPL-3.0. We use it offline, never in the browser.

## Building it on this machine

The repository ships a Boehm collector for macOS, but it is x86_64 and this
machine is arm64 without Rosetta, so the bundled library cannot be linked and
an x86_64 build cannot be run. Tephra2 calls exactly two of the collector's
functions — `GC_MALLOC` and `GC_REALLOC` — as a drop-in allocator, so a small
header that maps them to `malloc` and `realloc` builds it natively. Memory is
then never reclaimed, which for a forward run that exits in a second is of no
consequence, and no arithmetic is touched.

```bash
git clone --depth 1 https://github.com/geoscience-community-codes/tephra2.git
cd tephra2
mkdir -p shim && cat > shim/gc.h <<'EOF'
#ifndef NIMBUS_GC_SHIM_H
#define NIMBUS_GC_SHIM_H
#include <stdlib.h>
#define GC_MALLOC(n) malloc(n)
#define GC_REALLOC(p, n) realloc((p), (n))
#define GC_FREE(p) free(p)
#define GC_INIT() ((void)0)
#endif
EOF
gcc -O3 -Ishim -c forward_src/new_tephra.c -o forward_src/new_tephra.o
gcc -O3 -Ishim -c common_src/tephra2_calc.c -o forward_src/tephra2_calc.o
gcc -O3 -o tephra2_native forward_src/new_tephra.o forward_src/tephra2_calc.o -lm
```

The commit this was built from is `ff621c6`, the same one the campaign used.
`./tephra2_native` with no arguments prints its usage; with
`inputs/tephra2.conf inputs/colima.data.grid inputs/wind1` it reproduces the
Colima example.

**A vent on the datum makes it divide zero by zero.** The campaign found this
(BENCHMARK_REPORT.md, note 5) and the reference script sets the vent and the
sample points at 0.001 m.

## Writing the reference

```bash
pnpm exec tsx scripts/benchmark/tephra2-reference.ts <tephra2 binary> <out.json>
pnpm exec tsx scripts/benchmark/compare-volcano.ts <out.json>
```

The file this wrote on 16 September 2026 is kept in the repository as
`benchmark/results/tephra2-reference-2026-09-16.json`, 51 KB of the 70
eruptions' reference loadings, so the ash round can be re-run — and its refusal
re-checked — without building anything:

```bash
pnpm exec tsx scripts/benchmark/ash.ts benchmark/results/tephra2-reference-2026-09-16.json
```

The first runs Tephra2 on the 70 eruptions of `benchmark/matrices/volcano.json`
with the choices the protocol records — Nimbus's plume height (Mastin 2009 on
the case's volume rate), the case's bulk volume at Nimbus's deposit density for
the erupted mass, the case's wind held constant with height, Nimbus's four
grain classes fitted as a Gaussian in φ (mean −0.103, standard deviation
2.803), and everything Nimbus has no equivalent for taken from Tephra2's own
Colima example. The second scores Nimbus against it.

## What a faithful regeneration looks like

Regenerated on 16 September 2026, against the campaign of the day before:

| Quantity                 |            Campaign |         Regenerated |
| ------------------------ | ------------------: | ------------------: |
| Loading on the wind axis |  0.514× (σ ln 2.71) |  0.466× (σ ln 2.87) |
| Loading across the wind  | 0.008× (σ ln 31.84) | 0.008× (σ ln 31.83) |
| 1 mm isopach reach       |  0.918× (σ ln 0.54) |  0.993× (σ ln 0.54) |

The crosswind figure — the one the ash round is about — reproduces to three
decimals. The other two sit a few per cent off, which is the reference script
choosing its wind levels and its vent frame where the campaign chose by hand;
the script is the record from here on.

## Nimbus's own Tephra2, against the program

Since 16 September 2026 the deposit a scenario draws is Tephra2's forward model,
written for Nimbus in `src/physics/events/volcano/tephra2Fallout.ts` after the
program's source was read — to understand it, not to transcribe it (rules 158
to 161 of `src/physics/validation/tephra2Rules.ts`). The script that holds it to
the program writes each eruption as the program's three input files, runs the
binary once and compares every point:

```bash
# the program's own Colima example
pnpm exec tsx scripts/benchmark/tephra2-against-binary.ts example ./tephra2_native \
  inputs/tephra2.conf inputs/colima.data.grid inputs/wind1
# rule 160's forty held-out eruptions, and rule 161's verdict
pnpm exec tsx scripts/benchmark/tephra2-against-binary.ts heldout ./tephra2_native <out.json>
```

Two inputs the native build cannot be given. A wind file whose highest reading
lies below the plume top leaves the levels above it unset — the program tests a
field `malloc` does not clear — so every wind the checks write reaches past the
top. And more than a hundred grain steps overflow the array the program keeps
each point's size distribution in. Neither is a case Nimbus draws.
