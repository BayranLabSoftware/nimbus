# FCM round 1 — the development runs under tuning T1 (rule 1160)

The priors of rule 1152 with cloudShare uniform on 0.5–0.85; nothing else changed, the same streams. The untuned runs: docs/FCM_DEV_RUNS.md. No sensitivities under a tuning.

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
| M1/unlimited  | 20         | 2            | 20    | 48             |
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
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 31.39 (31.39–31.39)    | 42.95            | 1                    | 0           | 5139 · 5139               | —          | —           | favourable | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 28.25 (28.25–28.25)    | 36.44            | 1                    | 0           | 141000 · 141000           | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 29.24 (29.24–29.24)    | 61.28            | 1                    | 0           | 60310 · 60310             | —          | —           | favourable | equal     | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 31.51 (31.51–31.51)    | 59.63            | 1                    | 0           | 43360 · 43360             | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 3.26 km, first break 24.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Tunguska (rule 961)

Draws: one run at the preset's inputs; the first 1. Documented: no crater.

Baseline: burst in 1 of the draws, median 8.158 km; first event 64.68 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 40.39 (40.39–40.39)    | 39.89            | 1                    | 0           | 626700 · 626700           | —          | —           | —        | equal     | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 34.91 (34.91–34.91)    | 34.42            | 1                    | 0           | 621.9 · 621.9             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 37.92 (37.92–37.92)    | 63.17            | 1                    | 0           | 553400 · 553400           | —          | —           | —        | equal     | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 20.44 (20.44–20.44)    | 57.42            | 1                    | 0           | 250200 · 250200           | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 19.95 km, first break 28.75 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2008 TC3 (rule 961)

Draws: level B's first round: level-b-2026-09-23/2008 TC3/scored, 1000 draws; the first 200. Documented: main flare 36.5–37.5 km; first event 43.5–45.5 km (not counted before); recovery (borovicka2009, Sect. 5: "only small meteorites (≤283 g) were found"); no crater.

Baseline: burst in 1 of the draws, median 48.22 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.52 (25.44–34.48)    | 31.93            | 1                    | 0           | 3064 · 10230              | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 30.14 (25.42–34.37)    | 31.68            | 1                    | 0           | 3128 · 9770               | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30 (25.19–34.39)       | 57.2             | 1                    | 0           | 6224 · 17490              | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 1          | 30.29 (25.32–34.62)    | 57               | 1                    | 0           | 5702 · 17480              | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.52 km, first break 25.52 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2018 LA (rule 961)

Draws: level B's first round: level-b-2026-09-23/2018 LA/scored, 1000 draws; the first 200. Documented: main flare 28.65–28.75 km; first event 26.9–28.7 km; recovery (jenniskens2021: twenty-three meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 36.79 km; first event 66.65 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 34.75 (29.49–39.65)    | 35.68            | 1                    | 0           | 79.8 · 485.5              | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 35.31 (29.63–39.56)    | 36.2             | 1                    | 0           | 82.41 · 367.5             | favourable | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 34.27 (29.47–39.42)    | 61.69            | 1                    | 0           | 189.8 · 750.2             | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 1          | 34.96 (29.72–39.66)    | 62.19            | 1                    | 0           | 154.5 · 634.8             | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 1.04 km, first break 26.51 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2022 EB5 (rule 961)

Draws: one run at the body I2 reads from its CNEOS row (rule 77); the first 1. Documented: main flare 33.25–33.35 km.

Baseline: burst in 1 of the draws, median 31.05 km; first event 66.87 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 1 / 0 / 0 / 0                | 0          | 32.01 (32.01–32.01)    | 35.81            | 1                    | 0           | 43.89 · 43.89             | equal      | —           | —        | —         | —      |
| M1/capped     | 1 / 0 / 0 / 0                | 0          | 31.69 (31.69–31.69)    | 36.02            | 1                    | 0           | 619.8 · 619.8             | equal      | —           | —        | —         | —      |
| M2/unlimited  | 1 / 0 / 0 / 0                | 0          | 30.18 (30.18–30.18)    | 64.71            | 1                    | 0           | 773.8 · 773.8             | equal      | —           | —        | —         | —      |
| M2/capped     | 1 / 0 / 0 / 0                | 0          | 35.02 (35.02–35.02)    | 63.5             | 1                    | 0           | 424.7 · 424.7             | equal      | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 4.84 km, first break 28.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2023 CX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2023 CX1, 1000 draws; the first 200. Documented: main flare 27.05–28.15 km; first event 29.35–29.45 km; recovery (egal2025: Saint-Pierre-le-Viger meteorites recovered); no crater.

Baseline: burst in 1 of the draws, median 33.57 km; first event 63.6 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.14 (27.04–36.35)    | 33.32            | 1                    | 0           | 53.06 · 195.5             | favourable | favourable  | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 32.65 (27.32–36.48)    | 33.9             | 1                    | 0           | 47.56 · 227.9             | equal      | favourable  | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.52 (27.1–36.59)     | 59.4             | 1                    | 0           | 99.54 · 262.4             | favourable | favourable  | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 32.09 (27.09–36.79)    | 59.22            | 1                    | 0           | 102 · 339.7               | favourable | favourable  | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.56 km, first break 26.08 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2024 BX1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2024 BX1, 1000 draws; the first 200. Documented: main flare 33.85–35.25 km; first event 54.5–55.5 km; recovery (spurny2024: meteorites recovered in the predicted strewn field); no crater.

Baseline: burst in 1 of the draws, median 34.94 km; first event 64.86 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.39 (28.02–37.94)    | 34.28            | 1                    | 0           | 9.545 · 38.98             | equal      | **unfavourable** | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 33.21 (28.11–38.17)    | 34.03            | 1                    | 0           | 12.31 · 38.79             | equal      | **unfavourable** | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.16 (27.83–38.08)    | 60.38            | 1                    | 0           | 20.59 · 56.35             | equal      | favourable       | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 33.39 (28.42–38.12)    | 60.32            | 1                    | 0           | 19.07 · 52.73             | equal      | favourable       | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.23 km, first break 26.35 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### 2022 WJ1 (rule 961)

Draws: level B's second round: level-b2-2026-09-23/2022 WJ1, 1000 draws; the first 200. Documented: main flare 33.995–38.655 km; no crater.

Baseline: burst in 0.045 of the draws, median 30.18 km; first event 63.46 km; something at the ground in 0.955, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.11 (24.44–37.24)    | 32.94            | 1                    | 0           | 30.48 · 118.4             | —          | —           | —        | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 32.44 (24.9–37.33)     | 33.41            | 1                    | 0           | 26.75 · 110.9             | —          | —           | —        | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.89 (24.91–36.99)    | 58.55            | 1                    | 0           | 46.05 · 130               | —          | —           | —        | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 31.73 (25.81–36.85)    | 58.64            | 1                    | 0           | 40.58 · 118.1             | —          | —           | —        | equal     | —      |

Structural spread over the four configurations: main peak 1.55 km, first break 25.7 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Carancas (rule 961)

Draws: level B's second round: level-b2-2026-09-23/Carancas, 1000 draws; the first 200. Documented: a crater.

Baseline: burst in 1 of the draws, median 33.1 km; first event 64.09 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.3 (26.65–35.58)     | 33.57            | 1                    | 0           | 98.11 · 491.5             | —          | —           | —        | —         | equal  |
| M1/capped     | 200 / 0 / 0 / 0              | 1          | 31.52 (26.95–35.74)    | 33.58            | 1                    | 0           | 91.04 · 506.2             | —          | —           | —        | —         | equal  |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.46 (27.06–35.95)    | 59.53            | 1                    | 0           | 220.1 · 690.3             | —          | —           | —        | —         | equal  |
| M2/capped     | 200 / 0 / 0 / 0              | 4          | 30.96 (26–35.59)       | 59.4             | 1                    | 0           | 241.4 · 852.4             | —          | —           | —        | —         | equal  |

Structural spread over the four configurations: main peak 0.56 km, first break 25.96 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Winchcombe (third set)

Draws: rule 1126's stream third-set-v2/Winchcombe; the first 200. Documented: recovery (pp. 927–928: meteorites recovered, dropped by the fireball); no crater.

Baseline: burst in 1 of the draws, median 59.47 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.49 (26.89–36.83)    | 34.44            | 1                    | 0           | 3.786 · 12.18             | —          | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 30.06 (26.91–36.49)    | 33.66            | 1                    | 0           | 4.368 · 11.93             | —          | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.11 (28.1–36.85)     | 58.38            | 1                    | 0           | 4.186 · 11.14             | —          | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 30.79 (27.94–36.35)    | 58.47            | 1                    | 0           | 5.359 · 12.12             | —          | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 2.05 km, first break 24.81 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Golden (third set)

Draws: rule 1126's stream third-set-v2/Golden; the first 200. Documented: main flare 24.5–39.5 km; recovery (pp. 8, 15–16: the finds match the dark-flight footprint and the finder’s clock); no crater.

Baseline: burst in 1 of the draws, median 37.72 km; first event 67.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 35.7 (30.26–40.07)     | 36.33            | 1                    | 0           | 4.151 · 16.64             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 34.5 (30.19–40.21)     | 35.15            | 1                    | 0           | 5.019 · 22.66             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 36.51 (30.67–40.42)    | 62.86            | 1                    | 0           | 8.165 · 27.44             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 35.36 (30.26–40.66)    | 62.99            | 1                    | 0           | 9.53 · 28.59              | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 2.01 km, first break 27.84 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Madura Cave (third set)

Draws: rule 1126's stream third-set-v2/Madura Cave; the first 200. Documented: main flare 20.75–40.85 km; recovery (pp. 8–9: found inside the dark-flight Monte Carlo cloud); no crater.

Baseline: burst in 0.8 of the draws, median 31.2 km; first event 63.51 km; something at the ground in 0.2, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.95 (25.63–37.37)    | 32.28            | 1                    | 0           | 4.982 · 16.31             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 31.84 (25.42–37.15)    | 32.39            | 1                    | 0           | 5.067 · 14.48             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.42 (25.66–37.51)    | 58.78            | 1                    | 0           | 7.668 · 19.05             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 31.75 (25.06–37.33)    | 59.15            | 1                    | 0           | 8.109 · 21.51             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.67 km, first break 26.87 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Hamburg (third set)

Draws: rule 1126's stream third-set-v2/Hamburg; the first 200. Documented: main flare 16.65–29.15 km; recovery (pp. 15–18: the finds match the dark flight and the radar’s debris); no crater.

Baseline: burst in 1 of the draws, median 35.59 km; first event 65.5 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.69 (28.27–38.77)    | 34.41            | 1                    | 0           | 5.687 · 19.65             | favourable | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 33.51 (28.26–38.82)    | 34.39            | 1                    | 0           | 5.622 · 21.43             | favourable | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.55 (28.65–38.37)    | 61.44            | 1                    | 0           | 11.38 · 34.6              | favourable | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 34.28 (28.63–38.93)    | 60.96            | 1                    | 0           | 9.17 · 29.44              | favourable | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.77 km, first break 27.05 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Traspena (third set)

Draws: rule 1126's stream third-set-v2/Traspena; the first 200. Documented: main flare 23.535–40.325 km; recovery (pp. 3865–3867: 31 m from the computed impact point, its crust fresh); no crater.

Baseline: burst in 1 of the draws, median 35.21 km; first event 66.13 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.4 (28.94–37.23)     | 35.61            | 1                    | 0           | 44.43 · 193.9             | equal      | —           | favourable | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 6          | 33.45 (29.54–37.34)    | 35.8             | 1                    | 0           | 39.04 · 206.8             | equal      | —           | favourable | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.19 (28.96–37.32)    | 61.27            | 1                    | 0           | 78.94 · 291.8             | equal      | —           | favourable | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 4          | 32.73 (28.58–37.08)    | 61.18            | 1                    | 0           | 83.21 · 349.7             | equal      | —           | favourable | equal     | —      |

Structural spread over the four configurations: main peak 0.72 km, first break 25.66 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Cavezzo (third set)

Draws: rule 1126's stream third-set-v2/Cavezzo; the first 200. Documented: main flare 25.65–37.65 km; recovery (pp. 1219, 1225: ⁴⁸V proves a fall of days before); no crater.

Baseline: burst in 0 of the draws, median null km; first event 61.92 km; something at the ground in 1, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 29.82 (25.4–36)        | 32.61            | 1                    | 0           | 1.176 · 3.331             | —          | —           | equal    | equal     | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 0          | 29.73 (25.28–35.16)    | 32.59            | 1                    | 0           | 1.151 · 3.555             | —          | —           | equal    | equal     | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 30.18 (25.96–35.92)    | 56.93            | 1                    | 0           | 1.263 · 3.697             | —          | —           | equal    | equal     | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 29.25 (26.12–35.36)    | 57.33            | 1                    | 0           | 1.499 · 3.666             | —          | —           | equal    | equal     | —      |

Structural spread over the four configurations: main peak 0.93 km, first break 24.74 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Košice (W18)

Draws: W18's ranges on fcm-round1/Košice/inputs, 200 draws. Documented: main flare 36–38 km.

Baseline: burst in 1 of the draws, median 50.72 km; first event 64.67 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | -------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.33 (27.57–36.68)    | 34.05            | 1                    | 0           | 96.34 · 505.2             | favourable | —           | —        | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 3          | 32.45 (28.12–36.8)     | 34.33            | 1                    | 0           | 97.72 · 557.6             | favourable | —           | —        | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 31.68 (27.85–36.39)    | 59.84            | 1                    | 0           | 222.7 · 798.2             | favourable | —           | —        | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 32.41 (27.71–36.33)    | 60.45            | 1                    | 0           | 184.3 · 694.7             | favourable | —           | —        | —         | —      |

Structural spread over the four configurations: main peak 0.77 km, first break 26.4 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 53 km in 0; M1/capped 53 km in 0; M2/unlimited 53 km in 0; M2/capped 53 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Benešov (W18)

Draws: W18's ranges on fcm-round1/Benešov/inputs, 200 draws. Documented: first event 65–70 km; recovery (W18 p. 14: meteorite finds typed by Spurný et al. (2014)).

Baseline: burst in 1 of the draws, median 38.26 km; first event 70.06 km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event      | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ---------------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 35.38 (31.82–39.66)    | 39.06            | 1                    | 0           | 22.68 · 196               | —          | **unfavourable** | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 3          | 35.64 (31.49–39.85)    | 38.82            | 1                    | 0           | 22.79 · 166.2             | —          | **unfavourable** | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 1          | 35.28 (31.38–39.55)    | 65.14            | 1                    | 0           | 64.04 · 330.3             | —          | equal            | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 4          | 36.11 (31.96–40.17)    | 65.08            | 1                    | 0           | 46.42 · 237.6             | —          | equal            | favourable | —         | —      |

Structural spread over the four configurations: main peak 0.83 km, first break 26.32 km, pieces at the ground 0, at ≥ 5 km/s 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |

### Tagish Lake (W18)

Draws: W18's ranges on fcm-round1/Tagish Lake/inputs, 200 draws. Documented: main flare 31–33 km; recovery (W18 p. 18, after Hildebrand et al. (2006): 16.3 kg of recorded fragments); 16.3 kg recorded.

Baseline: burst in 1 of the draws, median 55.07 km; first event null km; something at the ground in 0, at the crater law’s speeds in 0.

| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival   | no crater | crater |
| ------------- | ---------------------------- | ---------- | ---------------------- | ---------------- | -------------------- | ----------- | ------------------------- | ---------- | ----------- | ---------- | --------- | ------ |
| M1/unlimited  | 200 / 0 / 0 / 0              | 0          | 32.01 (28.5–37.36)     | 33.41            | 1                    | 0           | 2712 · 15070              | favourable | —           | favourable | —         | —      |
| M1/capped     | 200 / 0 / 0 / 0              | 2          | 32.74 (28.44–37.5)     | 34.29            | 1                    | 0           | 3023 · 12530              | favourable | —           | favourable | —         | —      |
| M2/unlimited  | 200 / 0 / 0 / 0              | 0          | 33.53 (28.69–37.6)     | 60.66            | 1                    | 0           | 5045 · 18460              | favourable | —           | favourable | —         | —      |
| M2/capped     | 200 / 0 / 0 / 0              | 0          | 32.78 (28.55–37.89)    | 61.31            | 1                    | 0           | 5330 · 22040              | favourable | —           | favourable | —         | —      |

Structural spread over the four configurations: main peak 1.52 km, first break 27.9 km, pieces at the ground 0, at ≥ 5 km/s 0.

W18’s other flares, found within 1 km (main or secondary peak): M1/unlimited 36 km in 0.195, 47 km in 0; M1/capped 36 km in 0.175, 47 km in 0; M2/unlimited 36 km in 0.24, 47 km in 0; M2/capped 36 km in 0.195, 47 km in 0.

Sensitivities (M1, clouds unlimited, the same draws):

| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |
| ----------- | -------------- | ---------------- | -------------------- | ----------- | ------------------ | ---------- |
