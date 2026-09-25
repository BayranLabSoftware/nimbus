# FCM survival–light round — H2, per-break σ against H3’s fixed-σ baseline

Rules 1180 (b), 1186 (`src/physics/validation/fcmSurvivalLightRules.ts`), run by `scripts/fcm-h2-run.ts` on
the same 18 development cases, the same input and parameter streams as H3 (`fcmSurvivalLight.json`) —
only the ablation representation differs: H3’s one σ per whole draw against H2’s one σ per break, both
from the identical, unnarrowed prior (rule 1131).

**Landed mass, H2 against H3, 71 case–configuration pairs**: median ratio 1.009
(1 = unchanged); lower by more than 10 % on 10, higher by more than 10 % on 18, within 10 % on 43.

## By case

### Chelyabinsk (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio   |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------- |
| M1/unlimited  | 1        | 20330                | 20330         | 0             | 24200                | 0.8401  |
| M1/capped     | 1        | 229600               | 229600        | 0             | 4899000              | 0.04687 |
| M2/unlimited  | 1        | 304500               | 304500        | 0             | 425000               | 0.7165  |
| M2/capped     | 1        | 351500               | 351500        | 0             | 382500               | 0.919   |

### Tunguska (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 1        | 763100               | 763100        | 0             | 857000               | 0.8904 |
| M1/capped     | 1        | 27130000             | 560.9         | 27130000      | 36680000             | 0.7396 |
| M2/unlimited  | 1        | 1868000              | 1868000       | 0             | 911200               | 2.05   |
| M2/capped     | 0        | —                    | —             | —             | —                    | —      |

### 2008 TC3 (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 8066                 | 8066          | 0             | 7119                 | 1.133  |
| M1/capped     | 200      | 6984                 | 6984          | 0             | 6999                 | 0.9979 |
| M2/unlimited  | 200      | 10860                | 10860         | 0             | 10500                | 1.034  |
| M2/capped     | 200      | 9353                 | 9353          | 0             | 10040                | 0.9316 |

### 2018 LA (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 183                  | 183           | 0             | 170.6                | 1.073  |
| M1/capped     | 200      | 209.4                | 209.4         | 0             | 163.7                | 1.279  |
| M2/unlimited  | 200      | 319.1                | 319.1         | 0             | 331.9                | 0.9614 |
| M2/capped     | 200      | 305.3                | 305.3         | 0             | 276.2                | 1.105  |

### 2022 EB5 (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 1        | 642                  | 642           | 0             | 512.8                | 1.252  |
| M1/capped     | 1        | 9276                 | 9276          | 0             | 3244                 | 2.859  |
| M2/unlimited  | 1        | 939.4                | 939.4         | 0             | 1414                 | 0.6644 |
| M2/capped     | 1        | 1154                 | 1154          | 0             | 591                  | 1.953  |

### 2023 CX1 (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 124.4                | 124.4         | 0             | 128.5                | 0.9681 |
| M1/capped     | 200      | 106.4                | 106.4         | 0             | 108.9                | 0.977  |
| M2/unlimited  | 200      | 167.8                | 167.8         | 0             | 166.5                | 1.008  |
| M2/capped     | 200      | 174.6                | 174.6         | 0             | 180.9                | 0.9652 |

### 2024 BX1 (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 19.74                | 19.74         | 0             | 21.2                 | 0.9311 |
| M1/capped     | 200      | 22.99                | 22.99         | 0             | 21.42                | 1.073  |
| M2/unlimited  | 200      | 36.44                | 36.44         | 0             | 35.63                | 1.023  |
| M2/capped     | 200      | 32.55                | 32.55         | 0             | 28.75                | 1.132  |

### 2022 WJ1 (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 50.61                | 50.61         | 0             | 49.72                | 1.018  |
| M1/capped     | 200      | 42.74                | 42.74         | 0             | 43.58                | 0.9807 |
| M2/unlimited  | 200      | 61.91                | 61.91         | 0             | 61.55                | 1.006  |
| M2/capped     | 200      | 56.42                | 56.42         | 0             | 62.4                 | 0.9042 |

### Carancas (rule 961)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 289.1                | 289.1         | 0             | 279.9                | 1.033 |
| M1/capped     | 200      | 253                  | 253           | 0             | 237.6                | 1.065 |
| M2/unlimited  | 200      | 465.5                | 465.5         | 0             | 430.6                | 1.081 |
| M2/capped     | 200      | 454.5                | 454.5         | 0             | 450.5                | 1.009 |

### Winchcombe (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 4.701                | 4.701         | 0             | 5.424                | 0.8667 |
| M1/capped     | 200      | 5.082                | 5.082         | 0             | 5.974                | 0.8507 |
| M2/unlimited  | 200      | 5.171                | 5.171         | 0             | 5.139                | 1.006  |
| M2/capped     | 200      | 6.216                | 6.216         | 0             | 6.298                | 0.987  |

### Golden (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 10.89                | 10.89         | 0             | 9.615                | 1.133 |
| M1/capped     | 200      | 11.4                 | 11.4          | 0             | 10.04                | 1.135 |
| M2/unlimited  | 200      | 13.81                | 13.81         | 0             | 13.23                | 1.044 |
| M2/capped     | 200      | 16.43                | 16.43         | 0             | 15.71                | 1.046 |

### Madura Cave (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 8.623                | 8.623         | 0             | 9.054                | 0.9524 |
| M1/capped     | 200      | 8.305                | 8.305         | 0             | 8.671                | 0.9578 |
| M2/unlimited  | 200      | 10.6                 | 10.6          | 0             | 10.75                | 0.986  |
| M2/capped     | 200      | 10.95                | 10.95         | 0             | 11.6                 | 0.944  |

### Hamburg (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 11.71                | 11.71         | 0             | 12.23                | 0.9575 |
| M1/capped     | 200      | 11.24                | 11.24         | 0             | 10.35                | 1.086  |
| M2/unlimited  | 200      | 17.62                | 17.62         | 0             | 17.76                | 0.9921 |
| M2/capped     | 200      | 14.91                | 14.91         | 0             | 13.07                | 1.141  |

### Traspena (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 131.3                | 131.3         | 0             | 125.4                | 1.047  |
| M1/capped     | 200      | 104.7                | 104.7         | 0             | 108                  | 0.9694 |
| M2/unlimited  | 200      | 159.1                | 159.1         | 0             | 165.9                | 0.959  |
| M2/capped     | 200      | 204.6                | 204.6         | 0             | 179                  | 1.143  |

### Cavezzo (third set)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 1.553                | 1.553         | 0             | 1.694                | 0.9168 |
| M1/capped     | 200      | 1.52                 | 1.52          | 0             | 1.743                | 0.8721 |
| M2/unlimited  | 200      | 1.56                 | 1.56          | 0             | 1.746                | 0.8935 |
| M2/capped     | 200      | 1.832                | 1.832         | 0             | 1.995                | 0.9183 |

### Košice (W18)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 264.7                | 264.7         | 0             | 248.9                | 1.063 |
| M1/capped     | 200      | 260.3                | 260.3         | 0             | 233.8                | 1.113 |
| M2/unlimited  | 200      | 414.4                | 414.4         | 0             | 385.3                | 1.076 |
| M2/capped     | 200      | 385.1                | 385.1         | 0             | 346.9                | 1.11  |

### Benešov (W18)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ----- |
| M1/unlimited  | 200      | 86.76                | 86.76         | 0             | 70.39                | 1.233 |
| M1/capped     | 200      | 93.25                | 93.25         | 0             | 82.58                | 1.129 |
| M2/unlimited  | 200      | 150.8                | 150.8         | 0             | 139.6                | 1.08  |
| M2/capped     | 200      | 125.2                | 125.2         | 0             | 104.6                | 1.197 |

### Tagish Lake (W18)

| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio  |
| ------------- | -------- | -------------------- | ------------- | ------------- | -------------------- | ------ |
| M1/unlimited  | 200      | 7411                 | 7411          | 0             | 6771                 | 1.095  |
| M1/capped     | 200      | 6690                 | 6690          | 0             | 6786                 | 0.9859 |
| M2/unlimited  | 200      | 10090                | 10090         | 0             | 8771                 | 1.15   |
| M2/capped     | 200      | 10540                | 10540         | 0             | 10080                | 1.046  |
