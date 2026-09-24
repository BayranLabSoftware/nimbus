# FCM round 1 — the observational development

Rule 1156 (`src/physics/validation/fcmRound1Rules.ts`), run by `scripts/fcm-dev-runs.ts`. Every declared
development case — rule 961’s nine, the third set’s six, W18’s three — 200 draws each (or one input with
200 parameter draws), under both structures and both clouds, paired with the baseline on the same
input draws. The judgement is the rule’s, fixed before any run: a release favourable where its median’s
distance to the observed interval is smaller by at least 1 km, unfavourable where larger by 1 km; a share
favourable or unfavourable by 0.10; «no crater» unfavourable only. «—» is not assessable. None of it is a
blind test: every case is development, several were read and tuned on before.

The aggregated tail: none verified (rule 1150) — draws past the bound stay not completed.

## The tally, over every case and observable

| Configuration | favourable | unfavourable | equal | not assessable |
| ------------- | ---------- | ------------ | ----- | -------------- |
| M1/unlimited  | 21         | 2            | 19    | 48             |
| M1/capped     | 20         | 2            | 20    | 48             |
| M2/unlimited  | 21         | 0            | 21    | 48             |
| M2/capped     | 21         | 0            | 21    | 48             |

A recorded mass contradicted (the branch’s 95th percentile below it): none.

## Case by case

### Chelyabinsk (rule 961)

Draws: one run at the preset's inputs; the first 1. Documented: recovery (W18 p. 8, after Popova et al. (2013): fallen masses of 4 000–6 000 kg); no crater.

Baseline: burst in 1 of the draws, median 27.12 km; first event 68.6 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 33.06 (33.06–33.06)    | 42.95            | 1                    | 0           | 24200 · 24200             | —          | —           | favourable | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 27.91 (27.91–27.91)    | 36.44            | 1                    | 0           | 452800 · 452800           | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 30.15 (30.15–30.15)    | 61.28            | 1                    | 0           | 425000 · 425000           | —          | —           | favourable | equal     | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 33.2 (33.2–33.2)       | 59.63            | 1                    | 0           | 382500 · 382500           | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 5.29 km, first break 24.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 36.58          | 47.57            | 1                    | 0           | 25030              | —          |
| C_disp 0.1                | 26.37          | 42.95            | 1                    | 0           | 24200              | —          |
| 3 fragments per break     | 33.08          | 42.95            | 1                    | 0           | 63860              | —          |
| 4 fragments per break     | 32.98          | 42.95            | 1                    | 0           | 92040              | —          |
| strength scaled with size | 58.33          | 57.83            | 1                    | 0           | 3369               | —          |

### Tunguska (rule 961)

Draws: one run at the preset's inputs; the first 1. Documented: no crater.

Baseline: burst in 1 of the draws, median 8.158 km; first event 64.68 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 40.39 (40.39–40.39)    | 39.89            | 1                    | 0           | 857000 · 857000           | —          | —           | —        | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 34.91 (34.91–34.91)    | 34.42            | 1                    | 0           | 763.6 · 763.6             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 37.92 (37.92–37.92)    | 63.17            | 1                    | 0           | 911200 · 911200           | —          | —           | —        | equal     | —      |
| M2/capped     | 0 / 0 / 0 / 1                | 0          | null (null–null)       | null             | 0                    | 0           | null · null               | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 5.48 km, first break 28.75 km, pieces at the ground 1, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 44.55          | 44.05            | 1                    | 1           | 874000             | —          |
| C_disp 0.1                | 40.39          | 39.89            | 1                    | 0           | 857000             | —          |
| 3 fragments per break     | 40.39          | 39.89            | 1                    | 0           | 1542000            | —          |
| 4 fragments per break     | 40.39          | 39.89            | 1                    | 0           | 1988000            | —          |
| strength scaled with size | 87.26          | 86.77            | 1                    | 0           | 5013               | —          |

### 2008 TC3 (rule 961)

Draws: level B's first round: level-b-2026-09-23/2008 TC3/scored, 1000 draws; the first 200. Documented: main flare 36.5–37.5 km; first event 43.5–45.5 km (not counted before); recovery (borovicka2009, Sect. 5: "only small meteorites (≤283 g) were found"); no crater.

Baseline: burst in 1 of the draws, median 48.22 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 5          | 30.73 (25.47–34.75)    | 31.93            | 1                    | 0           | 7079 · 32270              | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 2          | 30.34 (25.46–34.39)    | 31.68            | 1                    | 0           | 6975 · 25520              | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 3          | 30.06 (25.29–34.5)     | 57.2             | 1                    | 0           | 10350 · 36560             | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 6          | 30.3 (25.29–34.59)     | 57               | 1                    | 0           | 10040 · 31980             | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.67 km, first break 25.52 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 33.03          | 34.26            | 1                    | 0           | 8202               | favourable |
| C_disp 0.1                | 29.06          | 31.93            | 1                    | 0           | 7079               | favourable |
| 3 fragments per break     | 30.72          | 31.93            | 1                    | 0           | 8945               | favourable |
| 4 fragments per break     | 30.72          | 31.93            | 1                    | 0           | 9952               | favourable |
| strength scaled with size | 37.75          | 40.83            | 1                    | 0           | 2795               | favourable |

### 2018 LA (rule 961)

Draws: level B's first round: level-b-2026-09-23/2018 LA/scored, 1000 draws; the first 200. Documented: main flare 28.65–28.75 km; first event 26.9–28.7 km; recovery (jenniskens2021: twenty-three meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 36.79 km; first event 66.65 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 2          | 34.9 (29.43–39.81)     | 35.68            | 1                    | 0           | 168.5 · 923.7             | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 6          | 35.25 (29.59–39.53)    | 36.2             | 1                    | 0           | 163.3 · 1069              | favourable | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 2          | 34.2 (29.4–39.48)      | 61.69            | 1                    | 0           | 329.6 · 1564              | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 7          | 34.88 (29.71–39.64)    | 62.19            | 1                    | 0           | 274.3 · 1189              | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 1.05 km, first break 26.51 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare       |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------------- |
| exponential atmosphere    | 38.2           | 38.94            | 1                    | 0           | 203.8              | **unfavourable** |
| C_disp 0.1                | 33.69          | 35.68            | 1                    | 0           | 168.5              | favourable       |
| 3 fragments per break     | 34.78          | 35.68            | 1                    | 0           | 227.3              | favourable       |
| 4 fragments per break     | 34.78          | 35.68            | 1                    | 0           | 264.2              | favourable       |
| strength scaled with size | 35.48          | 36.2             | 1                    | 0           | 152.2              | favourable       |

### 2022 EB5 (rule 961)

Draws: one run at the body I2 reads from its CNEOS row (rule 77); the first 1. Documented: main flare 33.25–33.35 km.

Baseline: burst in 1 of the draws, median 31.05 km; first event 66.87 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 32.46 (32.46–32.46)    | 35.81            | 1                    | 0           | 512.8 · 512.8             | favourable | —           | —        | —         | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 32.36 (32.36–32.36)    | 36.02            | 1                    | 0           | 3244 · 3244               | favourable | —           | —        | —         | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 30.55 (30.55–30.55)    | 64.71            | 1                    | 0           | 1414 · 1414               | equal      | —           | —        | —         | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 34.98 (34.98–34.98)    | 63.5             | 1                    | 0           | 591 · 591                 | equal      | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 4.43 km, first break 28.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 35.37          | 39.17            | 1                    | 0           | 643.9              | equal      |
| C_disp 0.1                | 31.4           | 35.81            | 1                    | 0           | 512.8              | equal      |
| 3 fragments per break     | 32.47          | 35.81            | 1                    | 0           | 1302               | favourable |
| 4 fragments per break     | 32.44          | 35.81            | 1                    | 0           | 1986               | favourable |
| strength scaled with size | 34.11          | 37.77            | 1                    | 0           | 394.7              | favourable |

### 2023 CX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2023 CX1, 1000 draws; the first 200. Documented: main flare 27.05–28.15 km; first event 29.35–29.45 km; recovery (egal2025: Saint-Pierre-le-Viger meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 33.57 km; first event 63.6 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 5          | 32.22 (27.07–36.61)    | 33.32            | 1                    | 0           | 127.8 · 573.5             | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 12         | 32.65 (27.26–36.54)    | 33.9             | 1                    | 0           | 107.8 · 616.9             | equal      | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 5          | 32.49 (26.98–36.69)    | 59.4             | 1                    | 0           | 166.5 · 532.7             | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 9          | 31.93 (26.98–36.86)    | 59.22            | 1                    | 0           | 180.6 · 606.5             | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.72 km, first break 26.08 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare       |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------------- |
| exponential atmosphere    | 34.86          | 36.01            | 1                    | 0           | 159                | **unfavourable** |
| C_disp 0.1                | 30.7           | 33.32            | 1                    | 0           | 127.8              | favourable       |
| 3 fragments per break     | 32.21          | 33.32            | 1                    | 0           | 170.6              | favourable       |
| 4 fragments per break     | 32.19          | 33.32            | 1                    | 0           | 176.8              | favourable       |
| strength scaled with size | 31.63          | 32.77            | 1                    | 0           | 135.2              | favourable       |

### 2024 BX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2024 BX1, 1000 draws; the first 200. Documented: main flare 33.85–35.25 km; first event 54.5–55.5 km; recovery (spurny2024: meteorites recovered in the predicted strewn field); no crater.

Baseline: burst in 1 of the draws, median 34.94 km; first event 64.86 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 2          | 33.58 (28.03–38.09)    | 34.28            | 1                    | 0           | 21.18 · 95.95             | equal      | **unfavourable** | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 5          | 33.19 (28.14–38.19)    | 34.03            | 1                    | 0           | 21.27 · 93.78             | equal      | **unfavourable** | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 3          | 33.14 (27.76–38.25)    | 60.38            | 1                    | 0           | 35.45 · 101.4             | equal      | favourable       | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 12         | 33.26 (28.38–38.04)    | 60.32            | 1                    | 0           | 28.74 · 115.6             | equal      | favourable       | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.44 km, first break 26.35 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare       |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------------- |
| exponential atmosphere    | 36.48          | 37.18            | 1                    | 0           | 27.64              | **unfavourable** |
| C_disp 0.1                | 32.34          | 34.28            | 1                    | 0           | 21.18              | **unfavourable** |
| 3 fragments per break     | 33.57          | 34.28            | 1                    | 0           | 26.46              | equal            |
| 4 fragments per break     | 33.56          | 34.28            | 1                    | 0           | 29.45              | equal            |
| strength scaled with size | 28.47          | 29.4             | 1                    | 0           | 34.48              | **unfavourable** |

### 2022 WJ1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2022 WJ1, 1000 draws; the first 200. Documented: main flare 33.995–38.655 km; no crater.

Baseline: burst in 0.045 of the draws, median 30.18 km; first event 63.46 km; something at the ground in 0.955, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 1          | 31.94 (24.42–37.28)    | 32.94            | 1                    | 0           | 49.55 · 150.6             | —          | —           | —        | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 32.44 (24.9–37.34)     | 33.41            | 1                    | 0           | 43.51 · 128.4             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.71 (24.91–36.99)    | 58.55            | 1                    | 0           | 61.4 · 160.8              | —          | —           | —        | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 31.74 (25.57–36.85)    | 58.64            | 1                    | 0           | 62.32 · 156.5             | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 1.73 km, first break 25.7 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 34.03          | 35.86            | 1                    | 0           | 57.93              | —          |
| C_disp 0.1                | 31.44          | 32.94            | 1                    | 0           | 49.55              | —          |
| 3 fragments per break     | 31.93          | 32.94            | 1                    | 0           | 51.75              | —          |
| 4 fragments per break     | 31.89          | 32.94            | 1                    | 0           | 52.32              | —          |
| strength scaled with size | 26.91          | 29.86            | 1                    | 0           | 85.36              | —          |

### Carancas (rule 961)

Draws: level B's second round: level-b2-2026-09-23/Carancas, 1000 draws; the first 200. Documented: a crater.

Baseline: burst in 1 of the draws, median 33.1 km; first event 64.09 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 8          | 31.55 (26.61–35.72)    | 33.57            | 1                    | 0           | 275.7 · 1985              | —          | —           | —        | —         | equal  |
| M1/capped     | 200 / 0 / 0 / 0              | 13         | 31.48 (26.71–35.94)    | 33.58            | 1                    | 0           | 235.8 · 1737              | —          | —           | —        | —         | equal  |
| M2/unlimited  | 200 / 0 / 0 / 0              | 7          | 31.36 (27.25–36.14)    | 59.53            | 1                    | 0           | 430.1 · 2083              | —          | —           | —        | —         | equal  |
| M2/capped     | 200 / 0 / 0 / 0              | 12         | 31.02 (26.04–35.46)    | 59.4             | 1                    | 0           | 450.3 · 2062              | —          | —           | —        | —         | equal  |

Structural spread over the four configurations: main peak 0.53 km, first break 25.96 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 34.18          | 36.36            | 1                    | 0           | 320.3              | —          |
| C_disp 0.1                | 29.2           | 33.57            | 1                    | 0           | 275.7              | —          |
| 3 fragments per break     | 31.48          | 33.57            | 1                    | 0           | 389.2              | —          |
| 4 fragments per break     | 31.52          | 33.57            | 1                    | 0           | 490.1              | —          |
| strength scaled with size | 33.33          | 35.97            | 1                    | 0           | 213.5              | —          |

### Winchcombe (third set)

Draws: rule 1126's stream third-set-v2/Winchcombe; the first 200. Documented: recovery (pp. 927–928: meteorites recovered, dropped by the fireball); no crater.

Baseline: burst in 1 of the draws, median 59.47 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.41 (26.87–36.61)    | 34.44            | 1                    | 0           | 5.351 · 12.18             | —          | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 30.05 (26.91–36.48)    | 33.66            | 1                    | 0           | 5.954 · 11.93             | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 1          | 32.01 (27.97–36.54)    | 58.38            | 1                    | 0           | 5.124 · 11.14             | —          | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 30.77 (27.92–36.36)    | 58.47            | 1                    | 0           | 6.284 · 12.12             | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 1.96 km, first break 24.81 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 33.92          | 37.88            | 1                    | 0           | 5.856              | —          |
| C_disp 0.1                | 31.27          | 34.44            | 1                    | 0           | 5.351              | —          |
| 3 fragments per break     | 31.38          | 34.44            | 1                    | 0           | 5.351              | —          |
| 4 fragments per break     | 31.21          | 34.44            | 1                    | 0           | 5.351              | —          |
| strength scaled with size | 28.41          | 31.99            | 1                    | 0           | 7.892              | —          |

### Golden (third set)

Draws: rule 1126's stream third-set-v2/Golden; the first 200. Documented: main flare 24.5–39.5 km; recovery (pp. 8, 15–16: the finds match the dark-flight footprint and the finder’s clock); no crater.

Baseline: burst in 1 of the draws, median 37.72 km; first event 67.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 4          | 35.72 (30.1–40.14)     | 36.33            | 1                    | 0           | 9.615 · 54.32             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 8          | 34.46 (30.18–40.24)    | 35.15            | 1                    | 0           | 9.964 · 48.7              | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 2          | 36.48 (30.35–40.48)    | 62.86            | 1                    | 0           | 13.12 · 43.2              | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 8          | 35.36 (30.33–40.7)     | 62.99            | 1                    | 0           | 15.71 · 54.15             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 2.02 km, first break 27.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 39.16          | 39.73            | 1                    | 0           | 11.32              | equal      |
| C_disp 0.1                | 34.77          | 36.33            | 1                    | 0           | 9.615              | equal      |
| 3 fragments per break     | 35.61          | 36.33            | 1                    | 0           | 12.27              | equal      |
| 4 fragments per break     | 35.57          | 36.33            | 1                    | 0           | 13.28              | equal      |
| strength scaled with size | 29.41          | 30.86            | 1                    | 0           | 17.42              | equal      |

### Madura Cave (third set)

Draws: rule 1126's stream third-set-v2/Madura Cave; the first 200. Documented: main flare 20.75–40.85 km; recovery (pp. 8–9: found inside the dark-flight Monte Carlo cloud); no crater.

Baseline: burst in 0.8 of the draws, median 31.2 km; first event 63.51 km; something at the ground in 0.2, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 2          | 31.73 (25.6–37.42)     | 32.28            | 1                    | 0           | 8.911 · 30.7              | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 31.84 (25.44–37.18)    | 32.39            | 1                    | 0           | 8.608 · 26.92             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 2          | 32.36 (25.59–37.58)    | 58.78            | 1                    | 0           | 10.75 · 30.01             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 6          | 31.69 (24.84–37.35)    | 59.15            | 1                    | 0           | 11.54 · 30.43             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.67 km, first break 26.87 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 33.88          | 34.64            | 1                    | 0           | 9.874              | equal      |
| C_disp 0.1                | 31.36          | 32.28            | 1                    | 0           | 8.911              | equal      |
| 3 fragments per break     | 31.75          | 32.28            | 1                    | 0           | 9.704              | equal      |
| 4 fragments per break     | 31.73          | 32.28            | 1                    | 0           | 9.869              | equal      |
| strength scaled with size | 23.57          | 28.28            | 1                    | 0           | 21.51              | equal      |

### Hamburg (third set)

Draws: rule 1126's stream third-set-v2/Hamburg; the first 200. Documented: main flare 16.65–29.15 km; recovery (pp. 15–18: the finds match the dark flight and the radar’s debris); no crater.

Baseline: burst in 1 of the draws, median 35.59 km; first event 65.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.71 (28.19–38.83)    | 34.41            | 1                    | 0           | 12.23 · 52.33             | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 7          | 33.51 (28.28–39.08)    | 34.39            | 1                    | 0           | 10.35 · 56.81             | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 5          | 33.63 (28.48–38.64)    | 61.44            | 1                    | 0           | 17.57 · 71.31             | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 5          | 34.25 (28.68–38.96)    | 60.96            | 1                    | 0           | 12.63 · 52.76             | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.74 km, first break 27.05 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare       |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------------- |
| exponential atmosphere    | 36.72          | 37.34            | 1                    | 0           | 14.97              | **unfavourable** |
| C_disp 0.1                | 32.68          | 34.41            | 1                    | 0           | 12.23              | favourable       |
| 3 fragments per break     | 33.71          | 34.41            | 1                    | 0           | 15.36              | favourable       |
| 4 fragments per break     | 33.71          | 34.41            | 1                    | 0           | 17.52              | favourable       |
| strength scaled with size | 27.99          | 29.81            | 1                    | 0           | 22.97              | favourable       |

### Traspena (third set)

Draws: rule 1126's stream third-set-v2/Traspena; the first 200. Documented: main flare 23.535–40.325 km; recovery (pp. 3865–3867: 31 m from the computed impact point, its crust fresh); no crater.

Baseline: burst in 1 of the draws, median 35.21 km; first event 66.13 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 3          | 33.49 (29.08–37.47)    | 35.61            | 1                    | 0           | 125.1 · 705               | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 16         | 33.55 (29.55–37.34)    | 35.8             | 1                    | 0           | 107.7 · 897.4             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 7          | 33.32 (29.07–37.48)    | 61.27            | 1                    | 0           | 165.4 · 960.6             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 14         | 32.72 (28.71–36.95)    | 61.18            | 1                    | 0           | 177.6 · 939.7             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.83 km, first break 25.66 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 36.68          | 38.9             | 1                    | 0           | 144.7              | equal      |
| C_disp 0.1                | 31.19          | 35.61            | 1                    | 0           | 125.1              | equal      |
| 3 fragments per break     | 33.51          | 35.61            | 1                    | 0           | 175.4              | equal      |
| 4 fragments per break     | 33.51          | 35.61            | 1                    | 0           | 199.7              | equal      |
| strength scaled with size | 34.31          | 36.46            | 1                    | 0           | 108.8              | equal      |

### Cavezzo (third set)

Draws: rule 1126's stream third-set-v2/Cavezzo; the first 200. Documented: main flare 25.65–37.65 km; recovery (pp. 1219, 1225: ⁴⁸V proves a fall of days before); no crater.

Baseline: burst in 0 of the draws, median null km; first event 61.92 km; something at the ground in 1, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 29.56 (25.4–35.58)     | 32.61            | 1                    | 0           | 1.686 · 3.443             | —          | —           | equal    | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 29.66 (25.28–35)       | 32.59            | 1                    | 0           | 1.737 · 3.636             | —          | —           | equal    | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.18 (25.96–35.59)    | 56.93            | 1                    | 0           | 1.745 · 3.697             | —          | —           | equal    | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 29.2 (26.12–35.37)     | 57.33            | 1                    | 0           | 1.993 · 3.687             | —          | —           | equal    | equal     | —      |

Structural spread over the four configurations: main peak 0.98 km, first break 24.74 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 32.05          | 35.92            | 1                    | 0           | 1.891              | —          |
| C_disp 0.1                | 29.52          | 32.61            | 1                    | 0           | 1.686              | —          |
| 3 fragments per break     | 29.56          | 32.61            | 1                    | 0           | 1.702              | —          |
| 4 fragments per break     | 29.56          | 32.61            | 1                    | 0           | 1.702              | —          |
| strength scaled with size | 26.48          | 29.34            | 1                    | 0           | 2.606              | —          |

### Košice (W18)

Draws: W18's ranges on fcm-round1/Košice/inputs, 200 draws. Documented: main flare 36–38 km.

Baseline: burst in 1 of the draws, median 50.72 km; first event 64.67 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 9          | 32.29 (27.63–36.89)    | 34.05            | 1                    | 0           | 247.7 · 1827              | favourable | —           | —        | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 15         | 32.4 (28.17–36.79)     | 34.33            | 1                    | 0           | 233 · 2157                | favourable | —           | —        | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 6          | 31.6 (27.93–36.63)     | 59.84            | 1                    | 0           | 378.5 · 2331              | favourable | —           | —        | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 10         | 31.9 (27.83–36.2)      | 60.45            | 1                    | 0           | 346.4 · 2307              | favourable | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 0.8 km, first break 26.4 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 53 km in 0; M1/capped 53 km in 0; M2/unlimited 53 km in 0; M2/capped 53 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 35.36          | 36.94            | 1                    | 0           | 294.6              | favourable |
| C_disp 0.1                | 30.26          | 34.05            | 1                    | 0           | 247.7              | favourable |
| 3 fragments per break     | 32.1           | 34.05            | 1                    | 0           | 323.4              | favourable |
| 4 fragments per break     | 32.11          | 34.05            | 1                    | 0           | 383.4              | favourable |
| strength scaled with size | 34.44          | 36.43            | 1                    | 0           | 169                | favourable |

### Benešov (W18)

Draws: W18's ranges on fcm-round1/Benešov/inputs, 200 draws. Documented: first event 65–70 km; recovery (W18 p. 14: meteorite finds typed by Spurný et al. (2014)).

Baseline: burst in 1 of the draws, median 38.26 km; first event 70.06 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 199 / 1 / 0 / 0              | 7          | 35.76 (31.96–40.12)    | 39.06            | 1                    | 0           | 70.26 · 1170              | —          | **unfavourable** | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 6          | 35.75 (31.54–39.97)    | 38.82            | 1                    | 0           | 79.32 · 896.5             | —          | **unfavourable** | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 6          | 35.43 (31.44–40.16)    | 65.14            | 1                    | 0           | 135.4 · 1128              | —          | equal            | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 13         | 35.97 (31.94–40.44)    | 65.08            | 1                    | 0           | 102.3 · 1253              | —          | equal            | favourable | —         | —      |

Structural spread over the four configurations: main peak 0.54 km, first break 26.32 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 39.66          | 43.07            | 1                    | 0           | 80.51              | —          |
| C_disp 0.1                | 32.89          | 39.06            | 1                    | 0           | 70.26              | —          |
| 3 fragments per break     | 35.62          | 39.06            | 1                    | 0           | 111.2              | —          |
| 4 fragments per break     | 35.59          | 39.06            | 1                    | 0           | 128.8              | —          |
| strength scaled with size | 37.74          | 41.43            | 1                    | 0           | 53.76              | —          |

### Tagish Lake (W18)

Draws: W18's ranges on fcm-round1/Tagish Lake/inputs, 200 draws. Documented: main flare 31–33 km; recovery (W18 p. 18, after Hildebrand et al. (2006): 16.3 kg of recorded fragments); 16.3 kg recorded.

Baseline: burst in 1 of the draws, median 55.07 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 7          | 32.05 (28.55–37.47)    | 33.41            | 1                    | 0           | 6754 · 45760              | favourable | —           | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 8          | 32.75 (28.37–37.49)    | 34.29            | 1                    | 0           | 6747 · 41250              | favourable | —           | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 9          | 33.64 (28.69–38)       | 60.66            | 1                    | 0           | 8608 · 43300              | favourable | —           | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 9          | 32.65 (28.55–37.48)    | 61.31            | 1                    | 0           | 10040 · 47580             | favourable | —           | favourable | —         | —      |

Structural spread over the four configurations: main peak 1.59 km, first break 27.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 36 km in 0.205, 47 km in 0; M1/capped 36 km in 0.175, 47 km in 0; M2/unlimited 36 km in 0.235, 47 km in 0; M2/capped 36 km in 0.205, 47 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity               | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ------------------------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
| exponential atmosphere    | 34.88          | 36.12            | 1                    | 0           | 7868               | favourable |
| C_disp 0.1                | 30.45          | 33.41            | 1                    | 0           | 6754               | favourable |
| 3 fragments per break     | 32.1           | 33.41            | 1                    | 0           | 8788               | favourable |
| 4 fragments per break     | 32.04          | 33.41            | 1                    | 0           | 9662               | favourable |
| strength scaled with size | 40.74          | 44.97            | 1                    | 0           | 2272               | favourable |
