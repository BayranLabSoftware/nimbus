# Variant P of the round on fragmentation

the pancake as Collins et al.'s Eq. 14 solved, in place of Eq. 15\* (rules 992 to 1000). Run once on the draws of rule 978, beside the baseline of the development
table, version 2 (`docs/FRAGMENTATION_DEV_TABLE.md`); scored by
`src/physics/validation/fragmentationScore.ts`, pushed before the run. Written by
`scripts/fragmentation-variant.ts`. An uncounted metric is in brackets; m2 is a proxy.

## Case by case

| Case        | Run      | m1 p(first stage) | m1 altitude (km)   | m1 miss (km) | m2 p(burst) | m2 burst altitude (km) | m2 miss (km) | m3 p(observed)    | m4 energy to the ground      | Regimes                                | Crater states                  |
| ----------- | -------- | ----------------- | ------------------ | ------------ | ----------- | ---------------------- | ------------ | ----------------- | ---------------------------- | -------------------------------------- | ------------------------------ |
| Chelyabinsk | baseline | (100.0 %)         | (68.6 [68.6–68.6]) | —            | (100.0 %)   | (27.1 [27.1–27.1])     | —            | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | (100.0 %)         | (68.6 [68.6–68.6]) | —            | (100.0 %)   | (29.4 [29.4–29.4])     | —            | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| Tunguska    | baseline | (100.0 %)         | (64.7 [64.7–64.7]) | —            | (100.0 %)   | (8.2 [8.2–8.2])        | —            | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | (100.0 %)         | (64.7 [64.7–64.7]) | —            | (100.0 %)   | (9.2 [9.2–9.2])        | —            | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2008 TC3    | baseline | (0.0 %)           | (—)                | —            | 100.0 %     | 48.6 [46.9–50.4]       | 11.1         | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | (0.0 %)           | (—)                | —            | 100.0 %     | 50.5 [48.8–52.3]       | 13.0         | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2018 LA     | baseline | 100.0 %           | 66.7 [66.6–66.7]   | 38.0         | 100.0 %     | 36.8 [36.6–36.8]       | 8.0          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | 100.0 %           | 66.7 [66.6–66.7]   | 38.0         | 100.0 %     | 37.3 [36.9–37.3]       | 8.5          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2022 EB5    | baseline | (100.0 %)         | (66.9 [66.9–66.9]) | —            | 100.0 %     | 31.1 [31.1–31.1]       | 2.2          | — (reaches 0.0 %) | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | (100.0 %)         | (66.9 [66.9–66.9]) | —            | 100.0 %     | 33.0 [33.0–33.0]       | 0.3          | — (reaches 0.0 %) | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2023 CX1    | baseline | 100.0 %           | 63.6 [63.5–63.7]   | 34.1         | 100.0 %     | 33.6 [33.4–33.7]       | 5.4          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | 100.0 %           | 63.6 [63.5–63.7]   | 34.1         | 100.0 %     | 34.1 [34.0–34.2]       | 5.9          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2024 BX1    | baseline | 100.0 %           | 64.9 [64.8–64.9]   | 9.4          | 100.0 %     | 34.9 [34.8–35.0]       | 0.0          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | 100.0 %           | 64.9 [64.8–64.9]   | 9.4          | 100.0 %     | 35.3 [35.2–35.5]       | 0.1          | 100.0 %           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
| 2022 WJ1    | baseline | (100.0 %)         | (63.5 [63.4–63.5]) | —            | 8.2 %       | 29.8 [28.7–30.8]       | 4.2          | 8.2 %             | (0.0000484 [0.00–0.0000594]) | COMPLETE_AIRBURST 8.2 %, INTACT 91.8 % | none 8.2 %, outOfDomain 91.8 % |
|             | P        | (100.0 %)         | (63.5 [63.4–63.5]) | —            | 8.2 %       | 29.9 [28.8–31.0]       | 4.1          | 8.2 %             | (0.0000484 [0.00–0.0000594]) | COMPLETE_AIRBURST 8.2 %, INTACT 91.8 % | none 8.2 %, outOfDomain 91.8 % |
| Carancas    | baseline | (100.0 %)         | (63.9 [61.0–66.3]) | —            | (100.0 %)   | (32.9 [30.3–35.1])     | —            | (0.0 %)           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |
|             | P        | (100.0 %)         | (63.9 [61.0–66.3]) | —            | (100.0 %)   | (33.9 [31.2–36.1])     | —            | (0.0 %)           | (0.00 [0.00–0.00])           | COMPLETE_AIRBURST 100.0 %              | none 100.0 %                   |

## The verdict (rules 964, 975, 976, 985, 1000)

- m1: 2018 LA: 0.0 km, credited 0.0 (credited); 2023 CX1: 0.0 km, credited 0.0 (credited); 2024 BX1: 0.0 km, credited 0.0 (credited) — mean credited 0.0 km: not improved.
- m2: 2008 TC3: -1.9 km, credited -1.9 (credited); 2018 LA: -0.5 km, credited -0.5 (the band widened by more than half: a gain does not count); 2022 EB5: 1.9 km, credited 1.9 (credited); 2023 CX1: -0.5 km, credited -0.5 (credited); 2024 BX1: -0.1 km, credited -0.1 (credited); 2022 WJ1: 0.1 km, credited 0.1 (credited) — mean credited -0.2 km: not improved.
- m3: Chelyabinsk +0.000; Tunguska +0.000; 2008 TC3 +0.000; 2018 LA +0.000; 2023 CX1 +0.000; 2024 BX1 +0.000; 2022 WJ1 +0.000 — mean Δp 0.000: not improved.
- m4: counted on no case.
- The outcomes already right: Chelyabinsk 100.0 % → 100.0 %; Tunguska 100.0 % → 100.0 %; 2008 TC3 100.0 % → 100.0 %; 2018 LA 100.0 % → 100.0 %; 2023 CX1 100.0 % → 100.0 %; 2024 BX1 100.0 % → 100.0 %.
- Metrics improved: 0 of the two needed. Rule 964 (a) to (c): DO NOT HOLD — the variant is refused.
