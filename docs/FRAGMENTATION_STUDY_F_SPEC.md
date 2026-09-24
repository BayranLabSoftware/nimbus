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

## Completed before the code (rules 1078 to 1083)

- **Budgets, defined.** Mass: fragments, clouds, pieces on the ground and dust below the floor sum
  to the body's, the dust written where it formed. Energy: the entry's kinetic energy plus gravity's
  work equals what is laid down in the air (the dust's at its birth) plus what is on the ground and
  in flight. Momentum along each path: the entry's plus gravity's impulse minus drag's impulse to
  the air equals what is in flight and on the ground. Each to 10⁻¹², or the run is void.
- **The break, once.** The parent's path ends at the break; two fragments and a cloud start there at
  its speed and angle, with the stated masses and strengths; each lays down its own energy on its
  own path; a child already past its strength breaks at once, at the same altitude.
- **Convergence on what counts.** Release altitude and the largest piece's median mass within 1 %,
  the share of draws with a survivor within 0.01; the floor's sensitivity shows where the mass below
  it went; a quantity that does not converge is not published as a result.
- **The baseline's limit.** Clouds are closed by the very code of the baseline's pancake; with
  f_c = 1, burst and breakup altitudes, energy to the ground and regime equal within 10⁻⁹ relative
  (10⁻⁶ m absolute where zero), each profile bin within 10⁻⁹ of the total energy.
- **Priors, attributed.** The sources support the structure, the strength's scaling with its
  ceiling, two-fragment splits and the single events' fitted values; the uniform laws, their bounds
  and their independence are Nimbus's choices, which the sources do not justify.
- **What F cannot claim.** No strewn field, no place of recovery, no ablation's loss in its masses;
  a run past 10⁵ components is declared not completed and enters no comparison.

## Made verifiable (rules 1085 to 1088)

- **The dust below 1 g** leaves flight at once: its mass to the dust's account at its altitude,
  its kinetic energy laid down there as E_dust, its momentum given to the air as an impulse J_dust,
  each apart from drag's energy and impulse.
- **The budgets' exact quantities:** mass within 10⁻¹² m0; energy E0 + W_g against E_drag + E_dust +
  E_ground + E_flight within 10⁻¹² (E0 + |W_g|); momentum as a vector in the entry's vertical plane
  (all paths lie in it), p0 + J_g − J_drag − J_dust against what is in flight and on the ground,
  within 10⁻¹² |p0|. Denominators are the entry's values; a failed budget voids the run.
- **Cascades** resolved breadth-first at one altitude; every component ever created counts toward
  10⁵, within a cascade too. **Convergence** on the same paired draws, the step or floor alone
  changed; a relative criterion against the finer run, and where that value is zero or absent, both
  must be.
- **The baseline's limit at the same event:** the main fragmentation found by the baseline's own
  function, the pancake started from the identical state, profiles on the same bins, zeros with
  their own absolute tolerances. A regression check, not a validation against observations.

## The code's three checks (rule 1090)

- Energy and momentum at the ground are each piece's at the instant before contact, after the
  terminal floor; nothing rests on the ground, so no energy or impulse of contact is left out.
- The vector balance decides: F keeps each path on the entry's straight line (gravity only through
  the terminal floor, along that line), and that the vector test equals the projection is checked,
  not assumed.
- The bound of 10⁵ components is checked at every creation, so it stops a cascade that does not
  end; that draw is declared not completed.

## The flight solved exactly (rule 1091)

With no ablation a fragment's diameter never changes, so its drag equation on the exponential
atmosphere has an exact solution — Collins's Eq. 8 started from its own state — used in place of
Runge–Kutta, and checked against it to 10⁻⁹; a break is found by bisection where ρv² reaches the
fragment's strength. Convergence is then read on the profile's 100 m bin, halved and doubled, and on
the floor. F reports its release altitude (the bin where the air receives the most energy), its
regime (intact, complete airburst, partial), its share of energy at the ground, and beside them the
baseline's burst altitude.

## What the first verification showed the checks lack (rule 1092)

On the 90 verification bodies of 0.3–30 m no piece fell below 1 g, so the floor was never exercised:
a second set of 90 bodies of 0.05–0.5 m checks the budgets with the dust in them and the floor at
0.1 g. The baseline has no profile of its own: the one compared at f_c = 1 is built from its outputs
(Eq. 8 to its breakup, Eq. 17 to its burst or the ground, the rest at its burst) by a loop separate
from F's. The momentum is summed by its two components in the entry's plane, the norm deciding. A
draw whose release altitude moves by 1 % or more is named with its profile's competing maxima; no
definition changes before the reviewer reads it.

## The run on the development cases (rules 1094–1096)

The reviewer authorized one run on the development cases alone, in rule 1073's order and with rule
1072's words. F's release altitude keeps its definition (the peak bin) and is published draw by draw
at 50, 100 and 200 m with its two largest maxima and whether it converges, per case with the number
of draws that do not converge; no aggregated release altitude of F is published as a comparable
result, and none earns credit. The peak of the energy given to the air is not the peak of observed
brightness, a photometric observable: m2 stays a proxy. For each floor the run publishes how many
completed draws it acts on, the mass and energy that go below it, and the differences on the paired
draws where it acts; where it acts on none, «the floor's sensitivity not exercised», never
"converged". Every draw started is counted: completed, not completed, void. F's priors are drawn on
the rounds' stream seeded "study F/" and the case's name; the f_c = 1 limit is checked on every
draw; S's row at f1 = 0.50 is read from its record.

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

The verification of F's code, before any case, is in
[FRAGMENTATION_STUDY_F_VERIFICATION.md](FRAGMENTATION_STUDY_F_VERIFICATION.md).

The one run on the development cases (rules 1094–1096) is in
[FRAGMENTATION_STUDY_F.md](FRAGMENTATION_STUDY_F.md).
