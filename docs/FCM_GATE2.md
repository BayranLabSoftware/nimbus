# FCM round, gate 2 — reproducing R17’s Chelyabinsk

Rule 1142 (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate2.ts` — development,
begun before the reviewer has read the round’s dossier (rule 1147). R17’s inputs (19.8 m, 19.16 km/s,
18.3°, 3 300 kg/m³, from 100 km), its conventions (C_d = 1 in ½ C_d, σ = 10⁻⁸ s²/m², C_disp = 3.5, the
1976 standard atmosphere, 10 m steps) and its Table 1; profiles at 1 km. The comparison is with the
numbers R17’s text states — its figures are images, read by eye only for the peak’s altitude — so
each row is a partial comparison where no table permits more (rule 1142 (d)). The observed peak,
82–83 kt/km, is R17’s reading of Brown et al. 2013.

| Setting                                     | Scheme | Peak (kt/km) at (km) | Excess over the observed | Stated by R17                                                                    | Within the stated (±5 %) | Deposited / entry (kt) | First break (km) | Components | Ledger (mass · energy · momentum) |
| ------------------------------------------- | ------ | -------------------- | ------------------------ | -------------------------------------------------------------------------------- | ------------------------ | ---------------------- | ---------------- | ---------- | --------------------------------- |
| pancake                                     | rk4    | 125.9 at 30.5        | 52–54 %                  | about 50 % above the observed peak; W18: FCM at 3 300 kg/m³ about 123 against 83 | yes                      | 590.7 / 588.4          | 39.41            | 2          | 3.5e-17 · 0.0e+0 · 0.0e+0         |
| pancake                                     | euler  | 126 at 30.5          | 52–54 %                  | about 50 % above the observed peak; W18: FCM at 3 300 kg/m³ about 123 against 83 | yes                      | 590.7 / 588.4          | 39.41            | 2          | 3.5e-17 · 0.0e+0 · 0.0e+0         |
| combination, Fig. 7a (50/50 radius, α 0.1)  | rk4    | 97.54 at 31.5        | 18–19 %                  | within 15–17 % of the observed peak, too much energy above 30 km                 | yes                      | 590.6 / 588.4          | 39.63            | 190        | -6.8e-17 · -5.6e-17 · 1.1e-17     |
| combination, Fig. 7a (50/50 radius, α 0.1)  | euler  | 97.51 at 31.5        | 18–19 %                  | within 15–17 % of the observed peak, too much energy above 30 km                 | yes                      | 590.6 / 588.4          | 39.63            | 190        | -9.1e-17 · -8.3e-17 · 6.2e-17     |
| combination, Fig. 7b (60/40 radius, α 0.57) | rk4    | 117 at 30.5          | 41–43 %                  | about 50 % above the observed peak, a second peak appearing                      | yes                      | 590.6 / 588.4          | 39.63            | 25         | 8.6e-17 · 1.3e-16 · 1.5e-16       |
| combination, Fig. 7b (60/40 radius, α 0.57) | euler  | 117.2 at 30.5        | 41–43 %                  | about 50 % above the observed peak, a second peak appearing                      | yes                      | 590.6 / 588.4          | 39.63            | 25         | 8.7e-17 · 2.6e-16 · 1.8e-16       |
| independent wakes (50/50 mass, α 0.1)       | rk4    | 90.09 at 29.5        | 9–10 %                   | 15–22 % above the observed peak, with nearly a million fragments                 | yes                      | 590.7 / 588.4          | 39.63            | 1048575    | 3.5e-17 · 1.1e-17 · 7.4e-17       |
| independent wakes (50/50 mass, α 0.1)       | euler  | 90.19 at 29.5        | 9–10 %                   | 15–22 % above the observed peak, with nearly a million fragments                 | yes                      | 590.7 / 588.4          | 39.63            | 1048575    | 0.0e+0 · 9.1e-18 · 6.3e-17        |

Fig. 7b's second peak, below 26 km: 9.21 kt/km at 22.5 km — R17's figure, read by eye, shows about 9 kt/km near 23 km.

The collective and the non-collective wakes of R17 are not built in this round (rule 1138); the
peak’s altitude is read from R17’s figures by eye (about 29–30 km for the pancake), so it is reported
and not scored. The deposited energy exceeds the entry’s by gravity’s work on the falling mass.
