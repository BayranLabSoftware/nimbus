# Porta 1 — the fragment-cloud branch's settle condition (rules 1222 to 1234)

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

|                                                                        | Sealed              | Corrected               |
| ---------------------------------------------------------------------- | ------------------- | ----------------------- |
| Identical draws, every case but Tunguska                               | —                   | 68 of 68 configurations |
| Tunguska, energy given to the air at stops (M1/unl., M1/cap., M2/unl.) | 69.9, 84.5, 54.0 %  | ≤ 2·10⁻⁶ of E0          |
| Tunguska, deposit peak altitude                                        | 40.4, 34.9, 37.9 km | 18.1, 13.7, 20.7 km     |
| Tunguska, settled share                                                | 90.7, 86.2, 65.8 %  | 21.1, 2.0, 26.2 %       |
| Ledger, worst completed draw (rule 1141 (a): 10⁻¹²)                    | —                   | 5.3·10⁻¹⁶               |

In the M1 configurations part of Tunguska's cloud mass now reaches the ground as a swarm (48.9 % and
79.1 % of the mass) carrying 0.1 and 0.5 kt of the entry's 9 123 kt: debris already slowed, which
the sealed engine had labelled settled at birth — particulate debris by the published model's own
terms, never meteorite mass.

(Corrected on 26 September 2026, rule 1229 (a): the sample's identical configurations are 68 of 68
— fifteen cases with five draws, and Chelyabinsk and 2022 EB5 with their one input each — and W18's
events are three; rule 1228 (b) first said «60 of 60 … and Chelyabinsk» and «four».)

**Gate 2** (rule 1142): R17's four Chelyabinsk settings, both schemes, give identical results under
the two engines. W18's three events (rule 1229 (b)): Košice and Benešov identical to the bit. Tagish
Lake is not — W18's fit breaks its upper share at 1 to 90 kPa, 70 to 90 km up, where the clouds born
are below their terminal speed, the very case the correction addresses: its deposit above 84 km moves
down into the bins from 64 to 84 km (the energy above 60 km, 5.30 % of the deposit before, 5.31 %
after), and nothing the gate judges moves — flares, peak (32.5 km, 0.2955 kt/km), envelope, landed
mass (50.2 kg), largest piece and every verdict identical. Gate 2 stands on the measurement.

## Every development draw, the gates and round 3 (rules 1229 and 1230)

Fixed before they ran (rule 1229), each committed script flown through a switch, `--engine settle`,
that puts the corrected engine where the script calls the sealed one and changes nothing else; the
outputs sit beside the sealed ones with the suffix `.settle`.

- **Every development draw** (`docs/PORTA1_SETTLE_FULL.md`): 12 012 draws, 12 008 identical to the
  bit. The others are Tunguska's one input in each configuration — three changed, and M2/capped
  completes under neither engine. Rule 1190's pooled overview, recomputed from the plain engines'
  ledgers: the sealed column gives back the audit's figures to their printed digits (settled 93.21
  %, landed cloud 3.538 %, landed solid 3.253 %); the corrected column is settled 49.91 %, landed
  cloud 46.65 %, landed solid 3.444 %.
- **What the 93.21 % was**: Tunguska's one input weighs 3.4·10⁸ kg against 2.0·10⁷ kg for the
  heaviest other case over its 200 draws, so its three completing configurations carry 83 % of the
  pool. For that 83 % the figure was the defect. In the seventeen other cases nothing changes: their
  clouds do slow from above to their terminal speed and are stopped there — 15 % to 99.65 % of the
  mass each still accounts for, the rest landed solid — and what that settled debris becomes is still
  not identifiable from the sources read.
- **Rule 1156's development run** (`docs/FCM_DEV_RUNS_SETTLE.md`): the tally of verdicts identical in
  every configuration, no contradiction come or gone. Tunguska's deposit is what moves: its peak from
  a single 10 m bin holding the kilometre's whole energy (ratio 99.9) to a smooth deposit (1.004),
  from 40.4, 34.9, 37.9 km to 18.1, 13.7, 20.7 km — a quantity the development table has no observed
  interval to judge.
- **Round 3** (`docs/FCM_ROUND3_PREDICTIONS_SETTLE.md`): its predictions are identical to the bit
  under the two engines — every event, configuration and atmosphere, 200 draws each. Its verdict
  (rule 1167) stands on that measurement; they were never set against its targets again.
- **Gate 1** (`docs/FCM_GATE1_CONVERGENCE_SETTLE.md`): 13 of its 48 draws change, and every one still
  passes every variation (47 of 47 compared, as before; the worst relative movement 7.65·10⁻⁴ against
  2·10⁻²). The changed draws are every structured body above 10 m (10 of 10), 2 of the 14 below it,
  and one 232 m monolith — among them a 4.6 m structured body, inside round 3's domain, whose peak
  moves from 54.4 km to 31.0 km. Tunguska's three changed draws pass round 1's variations under both
  engines (`docs/PORTA1_SETTLE_CONVERGENCE.md`).
- **Gate 2 through the switch**: R17's results identical to the copy's run and to the sealed
  engine's; W18's as the copy's run above (Tagish Lake's upper deposit moves, no judgement does).

None of rule 1229 (g)'s criteria against the correction is met: the corrected ledger closes to
6.7·10⁻¹⁶, no tolerance is broken, no judgement of gate 2 changes.

Two mistakes on the way, recorded in rule 1229: the re-reading of the map above 10 m was started
before its rule and before these steps — stopped before any result, and to be run under its own
rule; and the switch was first put in `scripts/fcmRound1Common.ts`, one of the sealed candidate's
files — restored to its sealed bytes before any commit, and every run started again from the
committed scripts.

## The branch above 10 m (rules 1231 and 1234)

Round 1's map of the perimeter re-read at every point of 10 m or more — 109 points, 436 runs, the
map's own inputs and draws, sealed beside corrected (`docs/PORTA1_MAP_ABOVE_10M.md`). 412 runs
complete under both engines, the same 24 under neither; 176 are identical to the bit, 236 change.

| Diameter  | Changed    | Runs giving > 1 % of the entry's energy to the air at stops, sealed → corrected | Median peak altitude, sealed → corrected |
| --------- | ---------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| 10–30 m   | 29 of 130  | 1 → 0                                                                           | 28.48 → 28.39 km                         |
| 30–100 m  | 70 of 134  | 27 → 0                                                                          | 22.04 → 20.37 km                         |
| 100–300 m | 137 of 148 | 124 → 0                                                                         | 37.26 → 11.48 km                         |

Between 100 and 300 m the median energy given to the air at stops falls from 50.02 % of the entry's
to nothing. At the top of the range the change is of kind: under the sealed engine no run of the map
peaks in its lowest 1.5 km or brings a tenth of its energy to the ground; under the corrected one ten
runs (bodies of 234 to 300 m, whose sealed peaks stood at 26.5 to 47.1 km) peak at the ground with
30 to 65 % of the entry's energy, and 24 runs bring a tenth or more. The corrected ledger closes to
5.0·10⁻¹⁶.

## What it means

- Round 3's candidate and verdict stand, because its own predictions are identical under the two
  engines — measured, not assumed. The defect does reach inside its 0.1–10 m domain (gate 1's 4.6 m
  structured body); no development draw there meets it.
- Rule 1190's pooled 93.21 % was, for 83 % of its weight, the defect. The rest of the settled mass is
  real slowing to terminal speed, and its fate is the open question of item (b).
- Where a cloud is born high and slow for its air — structured bodies above 10 m, most bodies above
  100 m, the bodies the audit says dominate the risk — the sealed branch's deposit was its stopping
  rule, not its physics, and at the top of the range it turned bodies that reach the ground into high
  airbursts. Any later run of the branch uses the corrected version; the product, which does not read
  the branch, is not touched.

## Next

The entry's three items are written up (rules 1236 to 1240, `docs/PORTA1_SOURCES.md`): the breakup
criterion (Rulko et al. 2025) and the interaction between fragments (Register et al. 2020) are not
identifiable from their sources; the settled mass's kind is (dust aloft for months), its share is not
(Klekociuk et al. 2005 state none). Rule 1226's condition for the blast and the heat is met; each
opens by its own rules, the blast first, when Andrea gives the word.
