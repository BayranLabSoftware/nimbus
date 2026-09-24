# FCM round 1 — the development runs under tuning T2 (rule 1160)

The priors of rule 1152 with cloudShare uniform on 0.5–0.85 and alpha uniform on 0.05–0.3; nothing else changed, the same streams. The untuned runs: docs/FCM_DEV_RUNS.md. No sensitivities under a tuning.

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
| M1/capped     | 19         | 2            | 21    | 48             |
| M2/unlimited  | 21         | 0            | 21    | 48             |
| M2/capped     | 21         | 0            | 21    | 48             |

A recorded mass contradicted (the branch’s 95th percentile below it): none.

## Case by case

### Chelyabinsk (rule 961)

Draws: one run at the preset's inputs; the first 1. Documented: recovery (W18 p. 8, after Popova et al. (2013): fallen masses of 4 000–6 000 kg); no crater.

Baseline: burst in 1 of the draws, median 27.12 km; first event 68.6 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 30.35 (30.35–30.35)    | 42.95            | 1                    | 0           | 1444 · 1444               | —          | —           | favourable | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 28.99 (28.99–28.99)    | 36.44            | 1                    | 0           | 30060 · 30060             | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 31.23 (31.23–31.23)    | 61.28            | 1                    | 0           | 23440 · 23440             | —          | —           | favourable | equal     | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 34.54 (34.54–34.54)    | 59.63            | 1                    | 0           | 17110 · 17110             | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 5.55 km, first break 24.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Tunguska (rule 961)

Draws: one run at the preset's inputs; the first 1. Documented: no crater.

Baseline: burst in 1 of the draws, median 8.158 km; first event 64.68 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 40.39 (40.39–40.39)    | 39.89            | 1                    | 0           | 36670 · 36670             | —          | —           | —        | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 34.91 (34.91–34.91)    | 34.42            | 1                    | 0           | 621.9 · 621.9             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 37.92 (37.92–37.92)    | 63.17            | 1                    | 0           | 81590 · 81590             | —          | —           | —        | equal     | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 20.74 (20.74–20.74)    | 57.42            | 1                    | 0           | 152800 · 152800           | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 19.65 km, first break 28.75 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2008 TC3 (rule 961)

Draws: level B's first round: level-b-2026-09-23/2008 TC3/scored, 1000 draws; the first 200. Documented: main flare 36.5–37.5 km; first event 43.5–45.5 km (not counted before); recovery (borovicka2009, Sect. 5: "only small meteorites (≤283 g) were found"); no crater.

Baseline: burst in 1 of the draws, median 48.22 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.51 (25.42–34.47)    | 31.93            | 1                    | 0           | 1429 · 6292               | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 30.06 (25.41–34.17)    | 31.68            | 1                    | 0           | 1600 · 6160               | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 29.91 (25.19–34.3)     | 57.2             | 1                    | 0           | 4566 · 12910              | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 30.3 (25.33–34.37)     | 57               | 1                    | 0           | 4096 · 12630              | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.6 km, first break 25.52 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2018 LA (rule 961)

Draws: level B's first round: level-b-2026-09-23/2018 LA/scored, 1000 draws; the first 200. Documented: main flare 28.65–28.75 km; first event 26.9–28.7 km; recovery (jenniskens2021: twenty-three meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 36.79 km; first event 66.65 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 34.67 (29.42–39.65)    | 35.68            | 1                    | 0           | 44.55 · 241.9             | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 35.16 (29.59–39.46)    | 36.2             | 1                    | 0           | 40.49 · 215.8             | favourable | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 34.27 (29.42–39.39)    | 61.69            | 1                    | 0           | 140 · 612.9               | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 34.87 (29.72–39.63)    | 62.19            | 1                    | 0           | 123.5 · 480.2             | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.89 km, first break 26.51 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2022 EB5 (rule 961)

Draws: one run at the body I2 reads from its CNEOS row (rule 77); the first 1. Documented: main flare 33.25–33.35 km.

Baseline: burst in 1 of the draws, median 31.05 km; first event 66.87 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 32.27 (32.27–32.27)    | 35.81            | 1                    | 0           | 37.89 · 37.89             | favourable | —           | —        | —         | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 31.66 (31.66–31.66)    | 36.02            | 1                    | 0           | 168.4 · 168.4             | equal      | —           | —        | —         | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 31.05 (31.05–31.05)    | 64.71            | 1                    | 0           | 474.3 · 474.3             | equal      | —           | —        | —         | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 34.87 (34.87–34.87)    | 63.5             | 1                    | 0           | 152.7 · 152.7             | equal      | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 3.82 km, first break 28.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2023 CX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2023 CX1, 1000 draws; the first 200. Documented: main flare 27.05–28.15 km; first event 29.35–29.45 km; recovery (egal2025: Saint-Pierre-le-Viger meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 33.57 km; first event 63.6 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.14 (27.07–36.28)    | 33.32            | 1                    | 0           | 25.68 · 121.7             | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 32.64 (27.23–36.54)    | 33.9             | 1                    | 0           | 21.73 · 118.2             | equal      | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.46 (27.1–36.59)     | 59.4             | 1                    | 0           | 73.91 · 222.4             | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 1          | 32 (27.08–36.7)        | 59.22            | 1                    | 0           | 76.97 · 242.4             | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.64 km, first break 26.08 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2024 BX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2024 BX1, 1000 draws; the first 200. Documented: main flare 33.85–35.25 km; first event 54.5–55.5 km; recovery (spurny2024: meteorites recovered in the predicted strewn field); no crater.

Baseline: burst in 1 of the draws, median 34.94 km; first event 64.86 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.39 (28.02–37.89)    | 34.28            | 1                    | 0           | 4.937 · 22.91             | equal      | **unfavourable** | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 33.21 (28.11–38.04)    | 34.03            | 1                    | 0           | 5.605 · 23.73             | equal      | **unfavourable** | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.1 (27.83–38.1)      | 60.38            | 1                    | 0           | 15.46 · 44.64             | equal      | favourable       | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 33.31 (28.32–38.04)    | 60.32            | 1                    | 0           | 15.77 · 45                | equal      | favourable       | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.29 km, first break 26.35 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2022 WJ1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2022 WJ1, 1000 draws; the first 200. Documented: main flare 33.995–38.655 km; no crater.

Baseline: burst in 0.045 of the draws, median 30.18 km; first event 63.46 km; something at the ground in 0.955, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.11 (24.44–37.2)     | 32.94            | 1                    | 0           | 27.87 · 118.4             | —          | —           | —        | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 32.45 (24.9–37.34)     | 33.41            | 1                    | 0           | 19.72 · 110.9             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.89 (24.91–36.97)    | 58.55            | 1                    | 0           | 41.94 · 130               | —          | —           | —        | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 31.73 (25.81–36.85)    | 58.64            | 1                    | 0           | 38.65 · 116.7             | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 1.56 km, first break 25.7 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Carancas (rule 961)

Draws: level B's second round: level-b2-2026-09-23/Carancas, 1000 draws; the first 200. Documented: a crater.

Baseline: burst in 1 of the draws, median 33.1 km; first event 64.09 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.33 (26.55–35.57)    | 33.57            | 1                    | 0           | 42.6 · 215.5              | —          | —           | —        | —         | equal  |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 31.43 (26.91–35.54)    | 33.58            | 1                    | 0           | 37.53 · 198.4             | —          | —           | —        | —         | equal  |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.41 (27.06–35.88)    | 59.53            | 1                    | 0           | 136.9 · 427.2             | —          | —           | —        | —         | equal  |
| M2/capped     | 200 / 0 / 0 / 0              | 2          | 30.98 (26.01–35.58)    | 59.4             | 1                    | 0           | 168.6 · 580.4             | —          | —           | —        | —         | equal  |

Structural spread over the four configurations: main peak 0.45 km, first break 25.96 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Winchcombe (third set)

Draws: rule 1126's stream third-set-v2/Winchcombe; the first 200. Documented: recovery (pp. 927–928: meteorites recovered, dropped by the fireball); no crater.

Baseline: burst in 1 of the draws, median 59.47 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.49 (26.89–36.83)    | 34.44            | 1                    | 0           | 3.733 · 12.18             | —          | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 30.06 (26.91–36.47)    | 33.66            | 1                    | 0           | 4.327 · 11.93             | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.11 (28.1–36.85)     | 58.38            | 1                    | 0           | 4.026 · 11.14             | —          | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 30.79 (27.94–36.35)    | 58.47            | 1                    | 0           | 5.27 · 12.12              | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 2.05 km, first break 24.81 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Golden (third set)

Draws: rule 1126's stream third-set-v2/Golden; the first 200. Documented: main flare 24.5–39.5 km; recovery (pp. 8, 15–16: the finds match the dark-flight footprint and the finder’s clock); no crater.

Baseline: burst in 1 of the draws, median 37.72 km; first event 67.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 35.7 (30.26–40.05)     | 36.33            | 1                    | 0           | 2.512 · 10.66             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 34.47 (30.19–40.21)    | 35.15            | 1                    | 0           | 2.835 · 11.83             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 36.39 (30.67–40.4)     | 62.86            | 1                    | 0           | 6.681 · 20.78             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 35.36 (30.26–40.62)    | 62.99            | 1                    | 0           | 7.468 · 21.03             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 1.92 km, first break 27.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Madura Cave (third set)

Draws: rule 1126's stream third-set-v2/Madura Cave; the first 200. Documented: main flare 20.75–40.85 km; recovery (pp. 8–9: found inside the dark-flight Monte Carlo cloud); no crater.

Baseline: burst in 0.8 of the draws, median 31.2 km; first event 63.51 km; something at the ground in 0.2, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.95 (25.63–37.36)    | 32.28            | 1                    | 0           | 3.617 · 13.92             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 31.84 (25.42–37.15)    | 32.39            | 1                    | 0           | 3.369 · 13.75             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.42 (25.66–37.51)    | 58.78            | 1                    | 0           | 6.103 · 16.35             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 31.7 (25.06–37.33)     | 59.15            | 1                    | 0           | 7.034 · 17.99             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.72 km, first break 26.87 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Hamburg (third set)

Draws: rule 1126's stream third-set-v2/Hamburg; the first 200. Documented: main flare 16.65–29.15 km; recovery (pp. 15–18: the finds match the dark flight and the radar’s debris); no crater.

Baseline: burst in 1 of the draws, median 35.59 km; first event 65.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.69 (28.27–38.68)    | 34.41            | 1                    | 0           | 3.406 · 13.56             | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 33.53 (28.26–38.82)    | 34.39            | 1                    | 0           | 3.026 · 12.99             | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.55 (28.61–38.36)    | 61.44            | 1                    | 0           | 8.542 · 27.35             | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 34.26 (28.63–38.79)    | 60.96            | 1                    | 0           | 7.048 · 22.97             | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.73 km, first break 27.05 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Traspena (third set)

Draws: rule 1126's stream third-set-v2/Traspena; the first 200. Documented: main flare 23.535–40.325 km; recovery (pp. 3865–3867: 31 m from the computed impact point, its crust fresh); no crater.

Baseline: burst in 1 of the draws, median 35.21 km; first event 66.13 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.28 (28.94–37.22)    | 35.61            | 1                    | 0           | 17.76 · 86                | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 33.42 (29.53–37.23)    | 35.8             | 1                    | 0           | 14.67 · 103.3             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.19 (28.86–37.18)    | 61.27            | 1                    | 0           | 53.32 · 190.3             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 2          | 32.66 (28.58–36.94)    | 61.18            | 1                    | 0           | 59.92 · 235.2             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.76 km, first break 25.66 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Cavezzo (third set)

Draws: rule 1126's stream third-set-v2/Cavezzo; the first 200. Documented: main flare 25.65–37.65 km; recovery (pp. 1219, 1225: ⁴⁸V proves a fall of days before); no crater.

Baseline: burst in 0 of the draws, median null km; first event 61.92 km; something at the ground in 1, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 29.82 (25.4–36)        | 32.61            | 1                    | 0           | 1.089 · 3.331             | —          | —           | equal    | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 29.73 (25.28–35.16)    | 32.59            | 1                    | 0           | 1.08 · 3.555              | —          | —           | equal    | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.18 (25.96–35.92)    | 56.93            | 1                    | 0           | 1.248 · 3.697             | —          | —           | equal    | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 29.25 (26.12–35.36)    | 57.33            | 1                    | 0           | 1.477 · 3.666             | —          | —           | equal    | equal     | —      |

Structural spread over the four configurations: main peak 0.93 km, first break 24.74 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Košice (W18)

Draws: W18's ranges on fcm-round1/Košice/inputs, 200 draws. Documented: main flare 36–38 km.

Baseline: burst in 1 of the draws, median 50.72 km; first event 64.67 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.23 (27.62–36.63)    | 34.05            | 1                    | 0           | 41.61 · 248.6             | favourable | —           | —        | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 32.53 (28.09–36.77)    | 34.33            | 1                    | 0           | 43.66 · 303.6             | favourable | —           | —        | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.57 (27.8–36.41)     | 59.84            | 1                    | 0           | 170.7 · 618.1             | favourable | —           | —        | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 32.39 (27.72–36.3)     | 60.45            | 1                    | 0           | 137.1 · 539.1             | favourable | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 0.96 km, first break 26.4 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 53 km in 0; M1/capped 53 km in 0; M2/unlimited 53 km in 0; M2/capped 53 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Benešov (W18)

Draws: W18's ranges on fcm-round1/Benešov/inputs, 200 draws. Documented: first event 65–70 km; recovery (W18 p. 14: meteorite finds typed by Spurný et al. (2014)).

Baseline: burst in 1 of the draws, median 38.26 km; first event 70.06 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 35.58 (31.73–39.8)     | 39.06            | 1                    | 0           | 8.772 · 80.38             | —          | **unfavourable** | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 35.59 (31.5–39.88)     | 38.82            | 1                    | 0           | 8.346 · 48.43             | —          | **unfavourable** | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 35.31 (31.38–39.86)    | 65.14            | 1                    | 0           | 33.79 · 188.9             | —          | equal            | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 36.04 (31.88–40.32)    | 65.08            | 1                    | 0           | 25.6 · 163.6              | —          | equal            | favourable | —         | —      |

Structural spread over the four configurations: main peak 0.73 km, first break 26.32 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Tagish Lake (W18)

Draws: W18's ranges on fcm-round1/Tagish Lake/inputs, 200 draws. Documented: main flare 31–33 km; recovery (W18 p. 18, after Hildebrand et al. (2006): 16.3 kg of recorded fragments); 16.3 kg recorded.

Baseline: burst in 1 of the draws, median 55.07 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.96 (28.5–37.15)     | 33.41            | 1                    | 0           | 1325 · 7342               | favourable | —           | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 32.76 (28.43–37.38)    | 34.29            | 1                    | 0           | 1317 · 6605               | favourable | —           | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.53 (28.69–37.64)    | 60.66            | 1                    | 0           | 3768 · 13910              | favourable | —           | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 32.78 (28.53–37.62)    | 61.31            | 1                    | 0           | 4168 · 16460              | favourable | —           | favourable | —         | —      |

Structural spread over the four configurations: main peak 1.57 km, first break 27.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 36 km in 0.22, 47 km in 0; M1/capped 36 km in 0.17, 47 km in 0; M2/unlimited 36 km in 0.275, 47 km in 0; M2/capped 36 km in 0.175, 47 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
