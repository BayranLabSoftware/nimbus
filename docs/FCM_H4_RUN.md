# FCM survival–light round — H4, rule 1131’s own sensitivity σ against H3’s baseline

Rules 1180 (b), 1187 (`src/physics/validation/fcmSurvivalLightRules.ts`), run by `scripts/fcm-h4-run.ts` on
the same 18 development cases, the same input and parameter streams as H3 (`fcmSurvivalLight.json`) —
only the ablation representation differs: H3’s one σ per whole draw, drawn from rule 1131’s unnarrowed
prior, against H4’s one fixed value for every component, rule 1131’s own named sensitivity
(3.5·10⁻⁷ s²/m², Borovička et al. 2013b) — never drawn, never narrowed.

**Landed mass, H4 against H3, 71 case–configuration pairs**: median ratio 0
(1 = unchanged); lower by more than 10 % on 71, higher by more than 10 % on 0, within 10 % on 0.

## By case

### Chelyabinsk (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 1        | 0                    | 0             | 0             | 24200                | 0     |
| M1/capped     | 1        | 0                    | 0             | 0             | 4899000              | 0     |
| M2/unlimited  | 1        | 0                    | 0             | 0             | 425000               | 0     |
| M2/capped     | 1        | 0                    | 0             | 0             | 382500               | 0     |

### Tunguska (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 1        | 0                    | 0             | 0             | 857000               | 0     |
| M1/capped     | 1        | 0                    | 0             | 0             | 36680000             | 0     |
| M2/unlimited  | 1        | 0                    | 0             | 0             | 911200               | 0     |
| M2/capped     | 1        | 0                    | 0             | 0             | —                    | —     |

### 2008 TC3 (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 7119                 | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 6999                 | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 10500                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 10040                | 0     |

### 2018 LA (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 170.6                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 163.7                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 331.9                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 276.2                | 0     |

### 2022 EB5 (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 1        | 0                    | 0             | 0             | 512.8                | 0     |
| M1/capped     | 1        | 0                    | 0             | 0             | 3244                 | 0     |
| M2/unlimited  | 1        | 0                    | 0             | 0             | 1414                 | 0     |
| M2/capped     | 1        | 0                    | 0             | 0             | 591                  | 0     |

### 2023 CX1 (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 128.5                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 108.9                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 166.5                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 180.9                | 0     |

### 2024 BX1 (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 21.2                 | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 21.42                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 35.63                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 28.75                | 0     |

### 2022 WJ1 (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 49.72                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 43.58                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 61.55                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 62.4                 | 0     |

### Carancas (rule 961)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 279.9                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 237.6                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 430.6                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 450.5                | 0     |

### Winchcombe (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 5.424                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 5.974                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 5.139                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 6.298                | 0     |

### Golden (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 9.615                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 10.04                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 13.23                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 15.71                | 0     |

### Madura Cave (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 9.054                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 8.671                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 10.75                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 11.6                 | 0     |

### Hamburg (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 12.23                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 10.35                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 17.76                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 13.07                | 0     |

### Traspena (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 125.4                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 108                  | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 165.9                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 179                  | 0     |

### Cavezzo (third set)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 1.694                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 1.743                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 1.746                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 1.995                | 0     |

### Košice (W18)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 248.9                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 233.8                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 385.3                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 346.9                | 0     |

### Benešov (W18)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 70.39                | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 82.58                | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 139.6                | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 104.6                | 0     |

### Tagish Lake (W18)

| Configuration | produced | H4 total landed (kg) | H4 solid (kg) | H4 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 0                    | 0             | 0             | 6771                 | 0     |
| M1/capped     | 200      | 0                    | 0             | 0             | 6786                 | 0     |
| M2/unlimited  | 200      | 0                    | 0             | 0             | 8771                 | 0     |
| M2/capped     | 200      | 0                    | 0             | 0             | 10080                | 0     |
