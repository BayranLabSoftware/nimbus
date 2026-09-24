# The specification of F — fragments that slow by their own size

Rules 1063 to 1073, in `src/physics/validation/fragmentationStudyFRules.ts`; this page is their
readable form. Written on 24 September 2026, before any code, for the reviewer to read.

## What F changes

One axis. Today, where the dynamic pressure reaches S2, the whole body becomes one pancake (Collins
et al. 2005). Under F it breaks there into **two fragments and one debris cloud**; each fragment
flies on its own diameter, slows by its own size and breaks again where its own pressure reaches its
own strength, `S_child = S_parent (m_parent/m_child)^α`, never above 330 MPa. Nothing before S2
changes. With a cloud share of 1, F is the baseline.

## Sources read

- Wheeler, Mathias, Stokan & Brown, Icarus 315 (2018), preprint NTRS 20180002835 — the
  fragment-cloud model (§2, Fig. 1), Chelyabinsk's fits (§4.1), the smaller meteoroids' lower cloud
  fractions (§5). The fits are per event and not unique.
- Register, Mathias & Wheeler, Icarus 284 (2017), NTRS 20180003387 — the breakup criterion and the
  strength's scaling with its 330 MPa ceiling (§2.2), independent wakes (§2.6), the combination
  model with clouds of 3–75 % (§2.7).
- Not read: Wheeler, Register & Mathias, Icarus 295 (2017), behind a paywall.

## The model

| Piece               | F                                                                                   | Source                            |
| ------------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| A break             | two fragments (y and 1 − y of the non-cloud mass) and a cloud of share f_c          | Register §2.7; Wheeler §4.1       |
| A child's strength  | S_p (m_p/m_c)^α, ceiling 330 MPa                                                    | Register Eqs. 8–9                 |
| A fragment's flight | a sphere at the body's density, Collins's drag on its own diameter, RK4 in altitude | Wheeler Fig. 1; the product's     |
| Lateral speed       | none: no strewn field                                                               | Register §2.6                     |
| A cloud             | the product's pancake (Collins Eqs. 15–17) from the sphere of its mass              | the product's, not Hills & Goda's |
| Ablation            | none, as in the baseline and in S                                                   | an axis of its own                |
| Fragments under 1 g | not followed; energy laid down where they form (sensitivity at 0.1 g)               | Nimbus's hypothesis               |

## Priors, drawn once per draw

| Parameter          | Interval     | From                                  |
| ------------------ | ------------ | ------------------------------------- |
| cloud share f_c    | [0.05, 0.85] | Register 3–75 %, Wheeler 75–85 %      |
| larger split y     | [0.5, 0.7]   | Register even, Wheeler 60/40          |
| strength scaling α | [0.05, 0.6]  | Wheeler 0.07–0.5, Register up to 0.57 |

They come partly from fits of Chelyabinsk, a development case: F's result on Chelyabinsk is not
independent of its priors, and is labelled so.

## Verification before any case

The limit f_c = 1 gives the baseline (within 10⁻⁹); two intact fragments when nothing breaks again;
mass, energy and momentum budgets within 10⁻¹² on 90 bodies; the step halved and doubled and the
floor at 0.1 g moving the release altitude and the largest piece at the ground by less than 1 %; a
run past 10⁵ components reported, never cut.

## What is published, and the outcome

For the baseline, S and F on the development cases and the same draws: the release altitude, the
largest piece at the ground (mass, speed), the surviving mass and pieces above 1 g, the regime of
arrival and the crater's state, the budgets. The outcome's words are fixed now: F is a study, not
adopted, no class B; the decision is the independent test's (rules 1038–1062). Code only after the
reviewer has read this.
