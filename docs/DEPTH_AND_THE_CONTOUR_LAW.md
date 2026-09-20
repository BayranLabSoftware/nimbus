# Why the depth does nothing, and what it would cost to fix

20 September 2026. Written after measuring, before any law is adopted:
the decision at the end is not one this investigation can take on its
own, because the two criteria the project already uses disagree.

## The defect, measured

A scenario's hypocentre depth does not enter the shaking at all below
70 km. Same magnitude, same fault, same ground:

|  Mw | depth | MMI at epicentre | MMI VII | MMI VIII |
| --: | ----: | ---------------: | ------: | -------: |
| 7.0 |  3 km |             8.22 | 12.1 km |   3.1 km |
| 7.0 | 15 km |             8.22 | 12.1 km |   3.1 km |
| 7.0 | 30 km |             8.22 | 12.1 km |   3.1 km |
| 7.0 | 65 km |             8.22 | 12.1 km |   3.1 km |

Identical to the last digit. A Mw 7.0 at 65 km does not shake the
surface the way one at 3 km does, and the panel has had to say so in a
note since the model notes were gathered.

Above 70 km the depth does enter, through `deepLawFor` and rule 67's
intraslab law — so this is a gap in the crustal range, which is where
almost every destructive earthquake happens.

## Why

The rings are drawn by Boore et al. 2014, in Joyner–Boore distance.
`R_jb` is the horizontal distance to the surface projection of the
rupture, so under the epicentre it is zero whatever the depth, and the
equation's own saturation term — a constant of the model, not the
scenario's depth — sets the maximum. The equation has no `Z_tor` and no
hypocentral term. It is not a bug in the implementation: the model does
not carry depth, by construction.

## The law that would fix it is already here

`allen2012Hypocentral` — Allen, Wald & Worden (2012), the hypocentral
form — carries how deep the source is. With it, the same table reads:

|  Mw | depth | MMI at epicentre | MMI VII |
| --: | ----: | ---------------: | ------: |
| 6.0 |  3 km |             8.11 | 12.1 km |
| 6.0 | 15 km |             6.77 |    none |
| 6.0 | 65 km |             4.82 |    none |
| 7.0 |  3 km |             8.27 | 34.3 km |
| 7.0 | 65 km |             6.21 |    none |

Which is the behaviour physics asks for.

## And rule 59 already adopts it — once B-078 is fixed

B-078: where the MEDIAN scenario reaches nobody at a lethal intensity,
`compareWithRecord` returned a band of [0, 0] and stopped, scoring the
model as saying "nobody dies, certainly" when its two hundred
realisations had said no such thing. Two rows of 408 turn on it, and
rule 59's choice between the two laws was decided by exactly those two.

With the fix in place the generator refuses to run, which is the guard
working:

```
Error: Rule 59 adopts allen2012HypocentralBelowMw7.5;
       the simulator still draws Boore et al. 2014
```

## What adopting it costs — the two measurements that disagree

**Rule 59, on tolls no rule had read: Allen wins.** That is the
generator's own verdict, quoted above.

**Rules 18 and 19, on the published ShakeMaps: Boore wins, clearly.**
Ten bands where both laws and a ShakeMap all exist:

| law                              | geometric mean of area ratio |       scatter |
| -------------------------------- | ---------------------------: | ------------: |
| `boore2014`                      |                    **0.81×** | σ_ln **1.32** |
| `allen2012HypocentralBelowMw7.5` |                        1.43× |     σ_ln 1.57 |
| `allen2012Hypocentral`           |                        2.58× |     σ_ln 1.39 |

And Allen loses a band outright: at Northridge it never reaches MMI VIII,
where the ShakeMap measures 823 km² and Boore draws 68.

**P-MONO-MW, the monotonicity property: the adopted variant breaks it.**
`allen2012HypocentralBelowMw7.5` switches law at Mw 7.5, and the two
laws are nowhere near each other there:

|  Mw | `boore2014` | `allen2012HypocentralBelowMw7.5` |
| --: | ----------: | -------------------------------: |
| 7.4 |     14.2 km |                      **50.9 km** |
| 7.5 |     15.0 km |                      **15.0 km** |

A tenth of a magnitude, and the MMI VII radius falls by two thirds. Over
a grid of 101 magnitudes from 4 to 9: `boore2014` 0 inversions,
`allen2012Hypocentral` 0 inversions, `allen2012HypocentralBelowMw7.5`
**one inversion, 38.8 km deep**.

That is not a rounding artefact. It says the two laws disagree by a
factor of three about the same earthquake, and neither rule that chose
between them looked at that.

## The decision, and why it is not this investigation's to take

Three options, none of them free:

1. **Adopt `allen2012HypocentralBelowMw7.5`**, as rule 59 says. Depth
   enters; the areas get worse (0.81× → 1.43×, and a lost band); the
   monotonicity property fails, and amending a property to let a
   candidate through is exactly what this project's protocol forbids.
2. **Adopt `allen2012Hypocentral` everywhere.** Depth enters, continuity
   is kept — but the areas get worse still (2.58×), and Allen's
   equation is fitted to Mw 5.0–7.9, so every megathrust it would then
   draw is outside the range it was fitted on.
3. **Neither yet.** Keep Boore's rings, keep B-078 unfixed until the law
   question is settled with it — the two cannot be separated, because
   fixing B-078 alone stops the report generating — and put the depth
   into a crustal law that has it: `Z_tor` in Campbell & Bozorgnia 2014
   or Chiou & Youngs 2014, both NGA-West2, both fitted on the same data
   Boore et al. 2014 was. That is a new equation to write from its
   publication, and a round of its own.

The measurements above are all that is needed to choose. What is not
available is a criterion that ranks "the dead, held out" against "the
areas, on 370 ShakeMaps" against "a property that holds at every
magnitude" — and inventing one here, after seeing which option each
would favour, is the one thing that would make the answer worthless.

The working patch for B-078 and the adoption is kept out of the tree
until the choice is made: on its own it leaves the report ungenerable,
which is the guard, not a fault.
