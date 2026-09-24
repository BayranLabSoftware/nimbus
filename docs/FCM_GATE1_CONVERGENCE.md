# FCM round, gate 1 (c) — convergence on the same draws

Rule 1141 (c) (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate1-convergence.ts` —
development, begun before the reviewer has read the round’s dossier (rule 1147). The design of the
draws, the reference and the variations is in the script’s header, fixed before any run.

48 draws over the branch’s domain, half monoliths (M1) and half structured bodies (M2), half
with clouds unlimited and half capped at ten radii; 47 completed within the reference’s bound of
100 000 components. A quantity passes where it moves by less than 2 % of the reference, or by less
than 0.1 km, 10⁻³ of the entry’s energy (per km for the peak) or 0.01 of the mass where it is near zero.

| Variation   | Quantity                            | Draws compared | Passed | of which by the near-zero bound | Worst move (relative) | Failing draws |
| ----------- | ----------------------------------- | -------------- | ------ | ------------------------------- | --------------------- | ------------- |
| step 5 m    | peak value                          | 47             | 47     | 0                               | 0.31 %                | —             |
| step 5 m    | peak altitude                       | 47             | 47     | 0                               | 0.036 %               | —             |
| step 5 m    | deposited energy                    | 47             | 47     | 0                               | 0.00025 %             | —             |
| step 5 m    | energy at the ground                | 47             | 47     | 0                               | 0.00090 %             | —             |
| step 5 m    | survival (solid mass at the ground) | 47             | 47     | 0                               | 2.3e-8 %              | —             |
| step 5 m    | largest piece                       | 47             | 47     | 0                               | 5.5e-8 %              | —             |
| step 20 m   | peak value                          | 47             | 47     | 0                               | 0.62 %                | —             |
| step 20 m   | peak altitude                       | 47             | 47     | 0                               | 0.94 %                | —             |
| step 20 m   | deposited energy                    | 47             | 47     | 0                               | 0.00067 %             | —             |
| step 20 m   | energy at the ground                | 47             | 47     | 0                               | 0.0054 %              | —             |
| step 20 m   | survival (solid mass at the ground) | 47             | 47     | 0                               | 7.5e-8 %              | —             |
| step 20 m   | largest piece                       | 47             | 47     | 0                               | 1.4e-7 %              | —             |
| bins 100 m  | peak value                          | 47             | 47     | 0                               | 0.30 %                | —             |
| bins 100 m  | peak altitude                       | 47             | 46     | 0                               | 8.2 %                 | 26            |
| bins 100 m  | deposited energy                    | 47             | 47     | 0                               | 0.0 %                 | —             |
| bins 100 m  | energy at the ground                | 47             | 47     | 0                               | 0.0 %                 | —             |
| bins 100 m  | survival (solid mass at the ground) | 47             | 47     | 0                               | 0.0 %                 | —             |
| bins 100 m  | largest piece                       | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | peak value                          | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | peak altitude                       | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | deposited energy                    | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | energy at the ground                | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | survival (solid mass at the ground) | 47             | 47     | 0                               | 0.0 %                 | —             |
| floor 0.1 g | largest piece                       | 47             | 47     | 0                               | 0.0 %                 | —             |

Draw 26 under «bins 100 m» fails on peak altitude: the reference’s own profile, at the altitude the peak moved to, reaches 99.7 % of its peak — two peaks nearly equal, between which «the main peak» is decided by less than the tolerance, not by the integration; the altitude of the main peak is not a converged quantity where the two highest peaks differ by less than the convergence tolerance, and is to be reported as both.

The floor turned some mass to dust on 0 of the 47 completed draws: no piece and no cloud fell below 1 g, so the floor’s convergence is vacuous on these draws. On R17’s independent wakes (gate 2), 1048575 components, floors of 10 g, 1 g and 0.1 g turned nothing to dust and left the peak at 90.094, 90.094, 90.094 kt/km: the children’s strength stops the cascade first — the smallest piece there is 4.04 kg. The floor binds only where a cascade would run past it, which the priors of rule 1139 did not produce here.

The bound: on 16 completed draws a bound of 1 000 000 left every bin, the ground’s energy and the
count identical on 16. The draws the reference did not complete:

- draw 24, 15.74 m: not completed at 1 000 000 either; α 0.109, splits 0.548 of the pieces’ mass to the larger, 0.0682 to the cloud — unequal pieces, none flying as one, each generation doubling the distinct pieces; not completed without the strength ceiling either, so it is the cascade’s size, not the ceiling — a cost the bound declares (rule 1138 (b)), for the register of deviations.

The floor where it acts (rule 1155): a body built to cascade to it (0.5 m, 3 000 kg/m³, 20 km/s, 45°, 100 kPa, α 0, two equal fragments, no cloud) turns 0.995 of its mass to dust at 1 g and 0.995 at 0.1 g, the ledger closed to 0.0e+0; every decisional quantity moves by less than its tolerance between the two floors.

The balance in flight (rule 1154 (b)): the energy given to the air, set against the drag’s work and the ablated mass’s energy integrated apart, differs by 3.34e-8 of the entry’s energy at the median draw and 0.00000754 at most (summed step by step in absolute value); halving the step divides it by 2^3.99 at the median and 2^-0.381 at the least — at the balance of a break, by contrast, mass, energy and momentum close to rounding (the ledger, rule 1141 (a)).

The fixed 1 km grid’s phase: shifting its edges by half a kilometre moves the peak by 2.3 % at the
median and 45 % at most — the reason the peak is read on a sliding window.
