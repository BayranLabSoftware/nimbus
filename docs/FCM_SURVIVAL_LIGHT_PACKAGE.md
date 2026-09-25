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
open, and its next candidate account (the prior's own scale, or a mechanism outside σ entirely, such
as the branch's break condition itself) is for a later, separately preregistered round: not decided
here, and not tested by narrowing what already failed.
