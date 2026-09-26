# Porta 1 — the fragment-cloud branch's settle condition (rules 1222 to 1228)

Porta 1 of the plan (the physics of the near field) opened on 26 September 2026, as the direct
continuation of the fragment-cloud branch (FCM). Its first item was the audit's own: 93 % of the
entry mass «stops being integrated as a settled cloud» (A1; rule 1190's pooled 93.21 %). The
reviewer's boundaries of rule 1191 (g) still bind: no code from a source before its fact sheet, no
prior or `settleWithin` chosen on the development cases, the sealed candidate of round 3 untouched,
no class B, no adoption.

## What the published model does with a slowed cloud

Read again before anything was changed (open NTRS copies, fingerprints in rule 1227):

- **R17** (Register, Mathias & Wheeler 2017, NTRS 20180003387, p. 5): a cloud is flown until it
  fully ablates, slows below a limiting speed, or reaches the ground.
- **W18** (Wheeler et al. 2018, NTRS 20180002835, p. 18): the landed mass set against the meteorites
  found is the fragments', not the clouds'.
- **Wheeler et al.'s poster** (NTRS 20170000320): a debris cloud is one aggregate mass of
  particulates, and the clouds drive the deposition.

So the branch's stop is R17's own kind, and cloud mass is never meteorite mass: the published model
gives no later fate for it (item (b) of rule 1224 — its fate is not identifiable from these sources).

## The defect (rule 1227)

Rule 1138 (c) says a cloud settles where its speed is within `settleWithin` **above** its terminal
speed — the stiff last approach to it. The sealed engine tests `v ≤ 1.01 · v_terminal`, which a
fresh cloud high in thin air satisfies before it has slowed at all: at 40 km the air is too thin to
hold a compact cloud up, so its local terminal speed exceeds its speed. Measured on the development
case «Tunguska» (first draw, M1/unlimited): the first break's cloud, 69.6 % of the body's mass,
born at 39.9 km at 15.0 km/s against a local terminal speed of 22.5 km/s, was stopped at birth and
69.9 % of the entry's energy given to the air at that one altitude.

## The correction

A new version of the engine, `src/physics/effects/fcmBranchSettle.ts` — the sealed text with one
condition changed: a cloud settles once its speed has been above the band in its own flight and has
since come down into it. A cloud still below the band flies on, whether the thin air cannot yet
hold it up or the denser air is only now bringing its terminal speed down to its own. Nothing else
changes: priors, `settleWithin`, every constant as sealed. The sealed candidate (rule 1162) is
untouched; its SHA-256 test still passes.

One mistake on the way, recorded (rule 1228): a first version also settled a cloud whose speed
stood within the band from below, which the rule did not allow; it stopped Tunguska's cloud at 37.5
km with the same 69.9 %. Found by instrumenting each stop before anything was committed.

## What it changes

Development only (rule 1143), a declared sample: the first five draws of every development case,
four configurations (`docs/PORTA1_SETTLE_SAMPLE.md`, `src/physics/validation/porta1SettleSample.json`).

|                                                                        | Sealed              | Corrected                                |
| ---------------------------------------------------------------------- | ------------------- | ---------------------------------------- |
| Identical draws, every case but Tunguska                               | —                   | 60 of 60 configurations, and Chelyabinsk |
| Tunguska, energy given to the air at stops (M1/unl., M1/cap., M2/unl.) | 69.9, 84.5, 54.0 %  | ≤ 2·10⁻⁶ of E0                           |
| Tunguska, deposit peak altitude                                        | 40.4, 34.9, 37.9 km | 18.1, 13.7, 20.7 km                      |
| Tunguska, settled share                                                | 90.7, 86.2, 65.8 %  | 21.1, 2.0, 26.2 %                        |
| Ledger, worst completed draw (rule 1141 (a): 10⁻¹²)                    | —                   | 5.3·10⁻¹⁶                                |

In the M1 configurations part of Tunguska's cloud mass now reaches the ground as a swarm (48.9 % and
79.1 % of the mass) carrying 0.1 and 0.5 kt of the entry's 9 123 kt: debris already slowed, which
the sealed engine had labelled settled at birth — particulate debris by the published model's own
terms, never meteorite mass.

**Gate 2** (rule 1142): R17's four Chelyabinsk settings, both schemes, give identical results under
the two engines. W18's three events: see the line below, written when the gate's own re-run ends.

## What it means

- Round 3's candidate and verdict stand: its domain is 0.1 to 10 m (rule 1163), and every draw
  measured there is identical under the two engines.
- Rule 1190's pooled 93.21 % is weighted by mass and dominated by the one body this defect distorts;
  it is to be read beside rule 1228, not alone.
- For large bodies — whose first cloud is born high and slow for its air, the bodies the audit says
  dominate the risk — the sealed branch's deposit was its stopping rule, not its physics. Any later
  run of the branch above 10 m uses the corrected version.

## Next, in rule 1224's order

The full development run on the corrected engine; gate 1's convergence (rule 1141 (c)) on the bodies
it changes; then the branch above 10 m. The breakup criterion (Rulko et al. 2025) and the interaction
between fragments (Register et al. 2020) wait for their sources, which the publisher refuses to a
script (rule 1225).
