# FCM survival–light round — H1 and H3, the package

Rule 1183: the package at the end of H1 and H3, and the decision on H2, written before any code of it.
The mechanical results: `docs/FCM_SURVIVAL_LIGHT.md`, `src/physics/validation/fcmSurvivalLight.json`,
produced by `scripts/fcm-survival-light.ts` from the fixed law of rule 1180 (a). Nothing here proposes
adoption; round 3's candidate stays frozen (rule 1162).

## H1: not supported, and why

The synthetic light peak coincides with the mechanical deposit peak on the great majority of the 18
development cases (72 case–configuration pairs): only 2 of 72 show it moving even slightly closer to
the documented main flare, by a fraction of a kilometre (2022 WJ1's two unlimited-cloud
configurations, 0.18–0.26 km). Everywhere else the two peaks are identical to four figures.

The reason is structural, not a near-miss of the literature values: a component's whole flight is
almost always on one side of its first break by the time the peak of deposition occurs — R17's
progressive breakup and the cascade both concentrate the bulk of the deposited energy after the first
break, in the single region rule 1180 (a) gives one constant efficiency (4.24 %). Scaling every bin of
that region by the same number cannot move where its maximum sits. H1 as declared — one switch, at
the _first_ break — does not test the reviewer's diagnosis; it fails to engage it at all. **Not
supported: the hypothesis is inconclusive by construction, not falsified.**

What the round 3 diagnostic actually compared the mechanical peak to was not the onset of
fragmentation but the _end flare_ (Hd) — the disruption of the last surviving mass, late in the
cascade, not its first break. A light law keyed to the _last_ significant disruption, or to the
locally decreasing survivor mass, is the natural next form; it is not tested here, so as not to
retrofit H1 into agreement after seeing that the first-break form fails (rule 1181). It is named as a
candidate for a future, separately preregistered hypothesis — not run now.

## H3: where the excess mass sits

Under M1 with clouds unlimited, every one of the 18 cases lands its excess mass as **solid pieces**,
not as unablated cloud (100 % at the median; a settled cloud reaches the ground in none of them). The
largest single piece usually carries a modest share of the total — 5 to 25 % on most cases, several
below 20 % — so the excess is generally **spread across many discrete fragments**, each individually
surviving with too little ablation, rather than concentrated in one piece that should have kept
breaking. Two exceptions carry most of their landed mass in one piece (Winchcombe M1/capped, 100 %;
Cavezzo, around 70 %), both very small bodies.

**A capped-cloud finding, outside this**: under M1 with clouds capped at ten radii, the two
single-draw presets (Chelyabinsk, Tunguska — both far above the 10 m bound of round 3's domain) land
most of their mass as an _unablated cloud_: 4.4 t and 36.7 t, none of it counted by round 1's
`landedKg` (deviation D16). A capped cloud's area, and so its ablation rate (∝ area), stops growing
once the cap is reached; for a large, fast body the remaining mass cannot ablate away in the time
left. No case at or below 10 m shows it. This is a distinct failure mode from the main one above, and
does not change round 3's proposal, which never claimed above 10 m.

## The decision on H2

H3 points to solid, discrete fragments surviving with insufficient ablation as the main channel of
the excess — not unablated clouds (except above 10 m, under capping). H2 proceeds, in this declared
form: whether a single ablation coefficient, drawn once per draw and held constant for every piece and
every altitude (rule 1152 (f)), understates the mass loss of an already-separated solid fragment late
in flight, where Jenniskens (2026) places most of a chondrite's mass loss (the plateau phase, shear-
melt reaching a steady state, distinct from and prior to the catastrophic fragmentation events the
branch models). The test: an ablation coefficient that may differ between a component still part of
its parent's first generation and one several breaks removed, or between altitude regimes — its form
fixed and cited before any run, never chosen to move a landed mass toward a target (rule 1181). Not
coded in this commit.

The capped-cloud finding is set aside from H2's main test (it is a >10 m effect, orthogonal to the
solid-fragment channel that dominates below it) and named for whoever next works above 10 m.

## H2: run, and not supported

`docs/FCM_H2_RUN.md`, `src/physics/validation/fcmH2Run.json`, from `scripts/fcm-h2-run.ts` (the H2
engine, `fcmBranchH2.ts`, a fork of the sealed candidate — rule 1162 untouched). Same 18 cases, same
input and parameter draws as H3; only the ablation representation differs, and its first, broken form
(σ per individual fragment) was corrected to σ per break before any of this ran (rule 1186's own text
says so).

Over the 71 case–configuration pairs with a landed mass in both runs, the median ratio of H2's to H3's
is **1.009** — essentially unchanged. 18 pairs land more than H3 by over 10 %, 10 land less, 43 stay
within 10 % either way: no systematic reduction. Letting σ vary between breaks, drawn from the same
unnarrowed prior, is not, by itself, the missing process — the prior's own range, not just its point
of redraw, may be too low for what H3 found, but rule 1181 forbids narrowing or shifting it to test
that now; it would need its own citation and its own preregistered rule.

One case shows a large, non-representative drop: Chelyabinsk's M1/capped falls to 5 % of H3's landed
mass, because that configuration's landed mass was almost entirely the capped-cloud pathology of D16
(an unablated cloud, not a solid fragment) — there, a single high-drawn σ for that one break consumed
most of it. This is consistent with D16's own diagnosis (ablation rate ∝ area, and a capped cloud's
area stops growing) and not a general effect of H2: the other three Chelyabinsk configurations still
land 0.72 to 0.92 of H3's mass, and no other case's capped configuration shows anything like it.

**H2, as declared, is not supported.** The excess landed mass is not explained by treating the
ablation coefficient as varying between breaks rather than fixed for the whole cascade. The channel
H3 found — solid fragments, spread across many, each surviving with too little ablation — remains
open, and its next candidate account, the prior's own scale, is H4 below (rule 1187, declared before
this section was written).

## H4: run, and not supported — it overshoots by orders of magnitude

`docs/FCM_H4_RUN.md`, `src/physics/validation/fcmH4Run.json`, from `scripts/fcm-h4-run.ts` (a copy of
`scripts/fcm-h2-run.ts`; the engine, `fcmBranchH2.ts`, is unchanged — H4 is the same fork with a
degenerate σ range). Same 18 cases, same input and parameter draws as H3 and H2; every solid
component's σ fixed at 3.5·10⁻⁷ s²/m², the sensitivity rule 1131 named and set apart, from the dynamics
of Chelyabinsk's own small late-cascade fragments (Borovička et al. 2013b) — 22 times the top of the
prior H2 already tried and found wanting.

Over the same 71 case–configuration pairs, **the median ratio of H4's landed mass to H3's is 0**: every
one of the 71 pairs lands under 10 % of H3's mass — in fact all 71 round to exactly zero kilograms at
four decimal places (`fcmH4Run.json`'s own numbers), for cases as different as Chelyabinsk's single
massive body and 2008 TC3's 200-draw ensemble, under every configuration. This is not a null result
in the H2 sense (a coefficient too weak to matter); it is the opposite failure, and a clean one: a
value this high, applied for the whole flight rather than only its late, already-decelerated phase,
ablates away essentially all of a body's mass in the hypersonic phase alone, well before deceleration
or breakup does any of the work the branch's mechanics are meant to describe. A rough closed-form
check confirms it is not a numerical artefact: at Chelyabinsk's entry speed, losing even a third of it
to drag before any break gives `σ·Δv²/2 ≈ 3.5e-7 × 3.75e8 / 2 ≈ 66`, and `exp(-66)` is some 29 orders
of magnitude below any floating-point mass in kilograms.

**H4, as declared, is not supported.** Rule 1131's sensitivity was derived from fragments already slow
and small, late in a cascade; applied here, before this round asked it to, to every component from the
unbroken body onward, it overcorrects catastrophically rather than closing the gap H3 found. The
excess-mass channel — solid fragments surviving with too little ablation — is not resolved by scaling
up σ uniformly, whether redrawn per break (H2) or fixed at the one published extreme (H4). What is
left unexplored, and not decided here: a σ that depends on regime (Jenniskens's own account: shear-melt
plateau against catastrophic fragmentation) rather than one constant for the whole flight — closer to
H2's original framing than either run so far tested, and requiring its own preregistered form. This
round's three tested hypotheses (H1, H3's diagnostic aside) and H4 all close without adopting anything
into the frozen candidate (rule 1162, still untouched).

## H5: the excess is dominated by genealogy, not ablation

The reviewer's answer to H1–H4's close (rule 1188): stop searching for a σ value on these cases, and ask
instead a mechanical question with no new free parameter — is the excess landed mass dominated by
fragments the branch creates already large and late in the cascade, or by fragments born early, with a
long residual flight, that nonetheless keep most of their birth mass? `docs/FCM_H5_RUN.md`,
`src/physics/validation/fcmH5Run.json`, from `scripts/fcm-h5-run.ts` (the H5 engine, `fcmBranchH5.ts`, a
second fork of the sealed candidate — rule 1162 still untouched, and this one carries no physics change
at all, verified to exact equality with the sealed engine's own output before any development case was
read with it). Same 18 cases, same input and parameter streams as H1 and H3, M1/unlimited only — the
configuration H3 examined.

Every landed solid piece is classified by generation (0: the whole body, never broken; 1: born at the
very first break, the earliest and highest a fragment can be created; 2 or more: born later) and by
whether it retained more than half its birth mass — four buckets, fixed before any case was read
(rule 1188 (b)), and the round's decision comes from each bucket's pooled, mass-weighted share of the
5 784 000 kg landed across all 18 cases (rule 1188 (c)):

| Bucket                                  | Share      |
| --------------------------------------- | ---------- |
| Early + retained (ablation channel)     | 2.0 %      |
| **Late + retained (genealogy channel)** | **89.5 %** |
| Ablated as expected                     | 8.4 %      |
| Whole body, never broke                 | 0.08 %     |

The late+retained bucket exceeds the early+retained bucket by 45×, far past the declared 2× margin.
**Decision: genealogy.** This holds case by case, not only pooled: on 16 of the 18 development cases the
late+retained bucket is the largest non-"ablated" share, with a median generation of 5 to 15 (these
survivors are typically many breaks deep in the cascade, not close to the first one) and a median
retained fraction of 0.58 to 0.83 (they kept well over half their birth mass despite being created late).
Two small bodies (Winchcombe, Cavezzo) lean toward early+retained or the whole-body bucket instead —
consistent with H3's earlier note that the smallest bodies in the set carry most of their landed mass in
one piece.

**What this changes:** four rounds (H1, H2, H4) tried representations of ablation — a different light
law, redrawing σ per break, fixing σ at the literature's own upper sensitivity — and none closed H3's
gap. H5 says why: the excess mass is not sitting in fragments that ablate too little given a long flight
ahead of them: it is sitting in fragments the branch's own break conditions and mass partition create
already large, late in the cascade, with comparatively little flight left regardless of how they ablate.
Changing σ again, in any form, could only ever discount a small share of the excess (the 2 % early+
retained bucket) and risks masking the larger channel rather than testing it. Per rule 1188 (e), H5
adopts nothing: it names the next causal study — break conditions, mass partition and the genealogy of
children — for a separately preregistered round, and closes the search for an ablation coefficient on
these cases.

### H5's closing, per the reviewer (25 September 2026)

The reviewer accepted H5 as closing the search for a σ value on these 18 cases, in M1/unlimited, but
declined the stronger reading: H5 locates _where_ the landed mass sits, not _which equation_ must change
to reduce it. Three qualifications, carried here unchanged, bind every later round that builds on H5:

1. "Late" means generation 2 or more, not necessarily little residual atmosphere: the rule records birth
   altitude, speed and mid-descent mass, but classifies by generation. A high-generation piece can still
   be born high enough to have had a long flight. Any causal claim about _why_ a late piece survives must
   use the recorded altitudes and the residual trajectory, not the generation label alone.
2. The decomposition is among **landed** pieces only, not among every child a break produces. Observing
   only survivors, selected on the very property (surviving) the study is trying to explain, cannot by
   itself separate a break-threshold effect from a mass-partition effect — the ledger of children that do
   _not_ land is needed too.
3. The pooled total is dominated by a few massive events (Tagish Lake ≈2.386 M kg, 2008 TC3 ≈2.095 M kg,
   of 5.784 M kg overall) — the per-case result is what matters; 89.5 % is not to be extended to the other
   three configurations or to every body size without its own run.

**The approved closing formula**: "In the M1/unlimited configuration, the landed solid mass on the
development cases is dominated by descendants of later breaks that retain more than half the mass they
were born with; this diagnosis directs the study toward genealogy, but does not yet identify whether the
break threshold, the mass partition, or the children's later evolution is at fault."
