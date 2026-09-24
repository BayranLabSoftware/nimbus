# FCM round 1 — the map of the perimeter

Rules 1149 and 1150 (`src/physics/validation/fcmRound1Rules.ts`), run by `scripts/fcm-domain-map.ts`.
257 points — the sixteen corners of the perimeter (1 500–4 000 kg/m³, 0.1–300 m,
11.2–30 km/s, 15°–90°), its centre and 240 Halton points — each under both structures and both clouds,
1028 runs, each with one draw of rule 1152's priors. Every run is in its region's denominator.

The statuses: «convergent» — completed at the reference (10 m steps and bins, a floor of 1 g, a bound of
100 000 components) and every decisional quantity within rule 1141 (c)’s tolerance under the step halved,
the step doubled and bins of 100 m; «not robust» — the same, but two peaks within 95 % of each other
(rule 1151), so the peak’s altitude is no single quantity; «completed at 10⁶» — convergent, but only with
a bound of 1 000 000; «not convergent» — some quantity moves beyond its tolerance; «completed by the tail» —
past 10⁶, completed by rule 1150’s aggregated tail (an extrapolation); «not completed» — past every bound.

### All runs

| Runs | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| ---- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 1028 | 944        | 14         | 40               | 6              | 0                     | 24            |

### By configuration

| Configuration | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| ------------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| M1/unlimited  | 241        | 2          | 7                | 0              | 0                     | 7             |
| M1/capped     | 237        | 3          | 9                | 3              | 0                     | 5             |
| M2/unlimited  | 236        | 4          | 10               | 3              | 0                     | 4             |
| M2/capped     | 230        | 5          | 14               | 0              | 0                     | 8             |

### By diameter

| Diameter  | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| --------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 0.1–1 m   | 303        | 4          | 0                | 5              | 0                     | 0             |
| 1–10 m    | 273        | 6          | 1                | 0              | 0                     | 0             |
| 10–100 m  | 244        | 3          | 17               | 0              | 0                     | 12            |
| 100–300 m | 124        | 1          | 22               | 1              | 0                     | 12            |

### By speed

| Speed          | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| -------------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 11.2–17.5 km/s | 335        | 4          | 4                | 3              | 0                     | 6             |
| 17.5–23.7 km/s | 299        | 4          | 17               | 0              | 0                     | 8             |
| 23.7–30 km/s   | 310        | 6          | 19               | 3              | 0                     | 10            |

### By angle

| Angle   | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| ------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 15–40 ° | 335        | 4          | 12               | 4              | 0                     | 5             |
| 40–65 ° | 307        | 3          | 11               | 0              | 0                     | 7             |
| 65–90 ° | 302        | 7          | 17               | 2              | 0                     | 12            |

### By density

| Density           | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| ----------------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 1 500–2 750 kg/m³ | 482        | 9          | 18               | 1              | 0                     | 10            |
| 2 750–4 000 kg/m³ | 462        | 5          | 22               | 5              | 0                     | 14            |

### By diameter and speed

| Diameter · speed           | convergent | not robust | completed at 10⁶ | not convergent | completed by the tail | not completed |
| -------------------------- | ---------- | ---------- | ---------------- | -------------- | --------------------- | ------------- |
| 0.1–1 m · 11.2–17.5 km/s   | 106        | 0          | 0                | 2              | 0                     | 0             |
| 0.1–1 m · 17.5–23.7 km/s   | 95         | 1          | 0                | 0              | 0                     | 0             |
| 0.1–1 m · 23.7–30 km/s     | 102        | 3          | 0                | 3              | 0                     | 0             |
| 1–10 m · 11.2–17.5 km/s    | 93         | 3          | 0                | 0              | 0                     | 0             |
| 1–10 m · 17.5–23.7 km/s    | 94         | 2          | 0                | 0              | 0                     | 0             |
| 1–10 m · 23.7–30 km/s      | 86         | 1          | 1                | 0              | 0                     | 0             |
| 10–100 m · 11.2–17.5 km/s  | 84         | 1          | 0                | 0              | 0                     | 3             |
| 10–100 m · 17.5–23.7 km/s  | 78         | 1          | 8                | 0              | 0                     | 5             |
| 10–100 m · 23.7–30 km/s    | 82         | 1          | 9                | 0              | 0                     | 4             |
| 100–300 m · 11.2–17.5 km/s | 52         | 0          | 4                | 1              | 0                     | 3             |
| 100–300 m · 17.5–23.7 km/s | 32         | 0          | 9                | 0              | 0                     | 3             |
| 100–300 m · 23.7–30 km/s   | 40         | 1          | 9                | 0              | 0                     | 6             |

### Which quantity fails where a run does not converge

- peakKtKm: 4 runs
- peakAltitudeKm: 3 runs
- depositedShare: 0 runs
- groundEnergyShare: 0 runs
- survivalShare: 0 runs
- largestShare: 0 runs

### The aggregated tail (rule 1150)

- f_agg = 0.0001: against the exact flight on 1004 completed runs, 79 fail (first: 1 M1/unlimited; 5 M2/unlimited; 7 M1/unlimited; 9 M2/unlimited; 13 M1/capped; 13 M2/unlimited; 19 M2/capped; 23 M2/unlimited; 29 M2/unlimited; 31 M1/unlimited; 31 M1/capped; 35 M2/capped; 47 M1/capped; 53 M1/capped; 54 M2/capped; 55 M1/capped; 57 M1/unlimited; 59 M1/unlimited; 59 M2/unlimited; 61 M2/unlimited).
- f_agg = 0.00001: against the exact flight on 1004 completed runs, 26 fail (first: 1 M1/unlimited; 13 M1/capped; 13 M2/unlimited; 29 M2/unlimited; 43 M2/unlimited; 54 M2/capped; 57 M1/unlimited; 69 M2/unlimited; 71 M2/unlimited; 79 M1/capped; 93 M2/capped; 107 M1/capped; 127 M2/unlimited; 131 M1/unlimited; 143 M1/unlimited; 155 M2/unlimited; 165 M2/unlimited; 171 M1/unlimited; 173 M2/capped; 175 M1/unlimited).
- f_agg = 0.000001: against the exact flight on 1004 completed runs, 3 fail (first: 93 M2/capped; 143 M1/unlimited; 231 M2/capped).

No share passes on every exact flight: the tail is not verified, and the runs past the bound stay «not completed» — the domain ready for the test is to be restricted by a rule written before round 3.

### The runs past the bound

| Point        | Configuration | D (m) | v (km/s) | ρ (kg/m³) | θ (°) | α     | larger | cloud | Components | Status        |
| ------------ | ------------- | ----- | -------- | --------- | ----- | ----- | ------ | ----- | ---------- | ------------- |
| 9 (corner)   | M1/capped     | 300   | 11.2     | 1500      | 90    | 0.076 | 0.59   | 0.097 | 1000001    | not completed |
| 11 (corner)  | M2/capped     | 300   | 30       | 1500      | 90    | 0.07  | 0.53   | 0.5   | 1000001    | not completed |
| 15 (corner)  | M1/unlimited  | 300   | 30       | 4000      | 90    | 0.57  | 0.74   | 0.15  | 1000001    | not completed |
| 15 (corner)  | M2/capped     | 300   | 30       | 4000      | 90    | 0.054 | 0.73   | 0.3   | 1000008    | not completed |
| 63 (halton)  | M1/unlimited  | 206   | 25.4     | 2920      | 77.8  | 0.18  | 0.59   | 0.23  | 1000001    | not completed |
| 63 (halton)  | M2/capped     | 206   | 25.4     | 2920      | 77.8  | 0.14  | 0.6    | 0.18  | 1000002    | not completed |
| 75 (halton)  | M2/capped     | 97.3  | 26.3     | 3640      | 48.9  | 0.084 | 0.71   | 0.25  | 1000003    | not completed |
| 77 (halton)  | M2/capped     | 35.8  | 22.1     | 2240      | 70.3  | 0.073 | 0.79   | 0.055 | 1000001    | not completed |
| 83 (halton)  | M1/capped     | 43.2  | 20.7     | 2840      | 61.1  | 0.089 | 0.58   | 0.14  | 1000001    | not completed |
| 95 (halton)  | M1/unlimited  | 194   | 23.5     | 3560      | 42.8  | 0.065 | 0.65   | 0.3   | 1000001    | not completed |
| 103 (halton) | M2/capped     | 151   | 15.5     | 2760      | 55    | 0.05  | 0.6    | 0.07  | 1000002    | not completed |
| 155 (halton) | M1/unlimited  | 69    | 20.1     | 3700      | 87.4  | 0.15  | 0.64   | 0.068 | 1000001    | not completed |
| 155 (halton) | M1/capped     | 69    | 20.1     | 3700      | 87.4  | 0.096 | 0.62   | 0.21  | 1000001    | not completed |
| 159 (halton) | M1/unlimited  | 188   | 28.5     | 3300      | 56.8  | 0.064 | 0.54   | 0.11  | 1000001    | not completed |
| 171 (halton) | M2/unlimited  | 88.6  | 25.7     | 1620      | 27.9  | 0.098 | 0.58   | 0.14  | 1000003    | not completed |
| 201 (halton) | M2/unlimited  | 13.6  | 27.4     | 1740      | 55.5  | 0.05  | 0.79   | 0.1   | 1000001    | not completed |
| 203 (halton) | M1/capped     | 100   | 23.2     | 2740      | 76.9  | 0.17  | 0.77   | 0.18  | 1000001    | not completed |
| 205 (halton) | M2/unlimited  | 36.9  | 11.6     | 3740      | 24.8  | 0.093 | 0.75   | 0.056 | 1000001    | not completed |
| 211 (halton) | M1/unlimited  | 44.5  | 15.8     | 1940      | 89.1  | 0.055 | 0.63   | 0.056 | 1000001    | not completed |
| 211 (halton) | M2/unlimited  | 44.5  | 15.8     | 1940      | 89.1  | 0.082 | 0.52   | 0.1   | 1000004    | not completed |
| 213 (halton) | M1/unlimited  | 16.4  | 28.3     | 2940      | 26.6  | 0.05  | 0.67   | 0.21  | 1000001    | not completed |
| 215 (halton) | M1/capped     | 121   | 18.6     | 3940      | 48    | 0.073 | 0.6    | 0.17  | 1000001    | not completed |
| 227 (halton) | M2/capped     | 57.2  | 21.3     | 2260      | 29.6  | 0.061 | 0.79   | 0.086 | 1000003    | not completed |
| 247 (halton) | M2/capped     | 137   | 16.7     | 2180      | 23.5  | 0.078 | 0.61   | 0.19  | 1000001    | not completed |

The cost, deterministic: a run flies 140394 steps at the median and 897681512 at most (a step is one component, with its members, over one step). The times on this machine: docs/FCM_COST.md.
