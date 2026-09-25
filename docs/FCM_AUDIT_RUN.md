# FCM survival–light round — the cascade audit (rule 1189)

Rules 1189 (a) to (c) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by
`scripts/fcm-audit-run.ts` on the same 18 development cases and the same input and parameter streams as
H1, H3 and H5 — all four configurations this time, not only M1/unlimited. No new physics, no hypothesis
tested: a measurement, reported by case and by configuration throughout.

## Pooled overview (weighted by each run’s own accounted mass — never a substitute for the tables below)

Break pressure ratio: every case-configuration’s own median sits at 1 (the bisection’s own precision — a sanity check, not a result).

Where the body’s mass ends up, pooled across every case and configuration that completed:

|                                                   | share       |
| ------------------------------------------------- | ----------- |
| Landed, solid                                     | 3.253 %     |
| Landed, cloud                                     | 3.538 %     |
| **Settled mid-flight (never reaches the ground)** | **93.21 %** |
| Turned to dust (mass floor / non-physical step)   | 4.588e-7 %  |

The great majority of the body’s original mass, pooled, never reaches the ground at all: it settles
as an airborne cloud once its fall slows to terminal speed (rule 1138 (c)), well above the surface, and
the engine stops integrating it there. What H1, H3 and H5 call "landed mass" — the quantity with an
excess against the references of rule 1178 (a) — is already a small remainder of the entry mass by the
time it reaches the ground; this audit does not change that finding, only places it beside the much
larger settled-mass pool for the first time.

## By case and configuration

### Chelyabinsk (rule 961)

**M1/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 50.51 % of parent mass (median), cloud 50.51 %, 3 distinct children (median).
Later breaks: 263 events, largest child 50.51 % of parent mass (median), cloud 50.51 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 0.3494 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 99.65 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0 %                  | —                        | —                         |
| 5+         | 0.3494 %             | 0.579723                 | 28064                     |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 24.61 %                | 0.590254                 | 24870–28040        |
| mid                                    | 34.23 %                | 0.579722                 | 28040–28440        |
| high                                   | 41.16 %                | 0.566382                 | 28440–29130        |

**M1/capped** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 41.75 % of parent mass (median), cloud 41.75 %, 3 distinct children (median).
Later breaks: 57 events, largest child 41.75 % of parent mass (median), cloud 41.75 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 4.251 %, **landed** cloud 41.75 %, **settled mid-flight (never reaches the ground)** 54 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0 %                  | —                        | —                         |
| 5+         | 4.251 %              | 0.854886                 | 17712.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 26.23 %                | 0.868188                 | 14690–16750        |
| mid                                    | 29.97 %                | 0.854886                 | 16760–17750        |
| high                                   | 43.8 %                 | 0.844971                 | 17750–22080        |

**M2/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 90.83 % of parent mass (median), cloud 0.01549 %, 4 distinct children (median).
Later breaks: 585 events, largest child 51.92 % of parent mass (median), cloud 27.94 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 4.859 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 95.14 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0.07423 %            | 0.764334                 | 22969.2                   |
| 5+         | 4.785 %              | 0.733615                 | 22619.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 23.72 %                | 0.775858                 | 19810–21330        |
| mid                                    | 31.24 %                | 0.731819                 | 22210–23600        |
| high                                   | 45.04 %                | 0.6997                   | 23600–27960        |

**M2/capped** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 81.54 % of parent mass (median), cloud 0.1279 %, 4 distinct children (median).
Later breaks: 699 events, largest child 56.03 % of parent mass (median), cloud 25.45 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 6.137 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 93.86 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0.157 %              | 0.584323                 | 23947.1                   |
| 5+         | 5.98 %               | 0.597314                 | 22500.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 26.83 %                | 0.614783                 | 20160–22240        |
| mid                                    | 25.12 %                | 0.596792                 | 22240–24720        |
| high                                   | 48.05 %                | 0.534709                 | 24720–29310        |

### Tunguska (rule 961)

**M1/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 69.6 % of parent mass (median), cloud 69.6 %, 3 distinct children (median).
Later breaks: 19 events, largest child 69.6 % of parent mass (median), cloud 69.6 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 0.2777 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 99.72 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0.02344 %            | 0.72894                  | 21107.2                   |
| 4          | 0.1348 %             | 0.745788                 | 15558.7                   |
| 5+         | 0.1194 %             | 0.755732                 | 14788.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 27.72 %                | 0.758185                 | 14010–14820        |
| mid                                    | 27.47 %                | 0.748144                 | 14820–15470        |
| high                                   | 44.81 %                | 0.728217                 | 15560–21110        |

**M1/capped** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 84.17 % of parent mass (median), cloud 84.17 %, 3 distinct children (median).
Later breaks: 120 events, largest child 84.17 % of parent mass (median), cloud 84.17 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 0.000232 %, **landed** cloud 11.15 %, **settled mid-flight (never reaches the ground)** 88.85 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0 %                  | —                        | —                         |
| 5+         | 0.000232 %           | 0.833414                 | 28047.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 15.58 %                | 0.846727                 | 27200–27990        |
| mid                                    | 27.02 %                | 0.833413                 | 27990–28460        |
| high                                   | 57.39 %                | 0.827059                 | 28490–29220        |

**M2/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 87.03 % of parent mass (median), cloud 0.0987 %, 4 distinct children (median).
Later breaks: 49 events, largest child 61.76 % of parent mass (median), cloud 61.76 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 0.4068 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 99.59 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0.009417 %           | 0.302967                 | 18291.9                   |
| 4          | 0.08975 %            | 0.34109                  | 16759.6                   |
| 5+         | 0.3077 %             | 0.348826                 | 14342.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 20.3 %                 | 0.396109                 | 11730–14220        |
| mid                                    | 32.28 %                | 0.348826                 | 14230–16240        |
| high                                   | 47.42 %                | 0.302967                 | 16760–21760        |

**M2/capped** — 0 draws produced, pressure ratio at the break null (median, null–null)

First break: 0 events, largest child — of parent mass (median), cloud —, null distinct children (median).
Later breaks: 0 events, largest child — of parent mass (median), cloud —, null distinct children (median).

Where the body's mass ends up — **landed** solid 0 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 0 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0 %                  | —                        | —                         |
| 5+         | 0 %                  | —                        | —                         |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 0 %                    | —                        | —                  |
| mid                                    | 0 %                    | —                        | —                  |
| high                                   | 0 %                    | —                        | —                  |

### 2008 TC3 (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.49 % of parent mass (median), cloud 45.21 %, 3 distinct children (median).
Later breaks: 4575 events, largest child 52.31 % of parent mass (median), cloud 18.69 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 22.17 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 77.83 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.6133 %             | 0.799608                 | 28193.8                   |
| 2          | 5.16 %               | 0.714269                 | 24929.4                   |
| 3          | 4.554 %              | 0.771972                 | 24821.4                   |
| 4          | 5.364 %              | 0.763943                 | 24823.8                   |
| 5+         | 6.481 %              | 0.838966                 | 27103.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 69.03 %                | 0.819419                 | 17480–25480        |
| mid                                    | 21.07 %                | 0.769348                 | 25480–27760        |
| high                                   | 9.895 %                | 0.889406                 | 27760–33660        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.36 % of parent mass (median), cloud 47.13 %, 3 distinct children (median).
Later breaks: 4394 events, largest child 53.03 % of parent mass (median), cloud 20.93 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 20.1 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 79.9 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.409 %              | 0.660887                 | 27273.9                   |
| 2          | 4.641 %              | 0.766892                 | 24967.2                   |
| 3          | 3.332 %              | 0.776393                 | 24280.3                   |
| 4          | 4.386 %              | 0.826711                 | 24423.7                   |
| 5+         | 6.329 %              | 0.829666                 | 27633.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 66.12 %                | 0.825282                 | 16690–25540        |
| mid                                    | 25.91 %                | 0.844035                 | 25540–28110        |
| high                                   | 7.97 %                 | 0.817259                 | 28110–34610        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.69 % of parent mass (median), cloud 0.1512 %, 4 distinct children (median).
Later breaks: 12561 events, largest child 49.34 % of parent mass (median), cloud 7.086 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 28.03 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 71.97 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 6.168 %              | 0.749273                 | 56994.2                   |
| 2          | 3.205 %              | 0.785549                 | 27391                     |
| 3          | 4.143 %              | 0.801676                 | 25631.8                   |
| 4          | 4.308 %              | 0.79091                  | 25694.6                   |
| 5+         | 10.2 %               | 0.839865                 | 30272.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 62.84 %                | 0.825639                 | 16800–27660        |
| mid                                    | 12.44 %                | 0.780305                 | 27660–31340        |
| high                                   | 24.72 %                | 0.850539                 | 31340–61450        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.08 % of parent mass (median), cloud 0.141 %, 4 distinct children (median).
Later breaks: 4973 events, largest child 56.44 % of parent mass (median), cloud 17.85 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 24.38 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 75.62 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 5.811 %              | 0.745754                 | 57215.1                   |
| 2          | 2.864 %              | 0.844509                 | 28028.6                   |
| 3          | 4.022 %              | 0.822708                 | 26002.2                   |
| 4          | 4.119 %              | 0.835549                 | 24555.5                   |
| 5+         | 7.566 %              | 0.770746                 | 27951.1                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 53.76 %                | 0.811115                 | 15910–26470        |
| mid                                    | 15.92 %                | 0.664335                 | 26470–28980        |
| high                                   | 30.33 %                | 0.816475                 | 28980–61400        |

### 2018 LA (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 55.41 % of parent mass (median), cloud 46.93 %, 3 distinct children (median).
Later breaks: 3130 events, largest child 58.38 % of parent mass (median), cloud 25.39 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 20.51 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 79.49 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.452 %              | 0.639651                 | 31214.5                   |
| 2          | 5.731 %              | 0.686146                 | 28869.1                   |
| 3          | 4.179 %              | 0.703445                 | 29830                     |
| 4          | 3.551 %              | 0.689268                 | 30075.4                   |
| 5+         | 4.596 %              | 0.829779                 | 33573.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 73.38 %                | 0.732212                 | 22090–30140        |
| mid                                    | 22.15 %                | 0.78744                  | 30140–33710        |
| high                                   | 4.477 %                | 0.846163                 | 33730–37770        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 53.85 % of parent mass (median), cloud 40.81 %, 3 distinct children (median).
Later breaks: 3797 events, largest child 53.39 % of parent mass (median), cloud 19.54 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 22.39 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 77.61 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.012 %              | 0.536917                 | 31094.6                   |
| 2          | 4.919 %              | 0.581239                 | 29385.6                   |
| 3          | 5.387 %              | 0.685405                 | 29962.1                   |
| 4          | 3.99 %               | 0.601954                 | 29766.5                   |
| 5+         | 6.082 %              | 0.526993                 | 32598                     |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 74.91 %                | 0.632237                 | 21640–30530        |
| mid                                    | 20.42 %                | 0.530505                 | 30530–33110        |
| high                                   | 4.667 %                | 0.506601                 | 33110–39050        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.66 % of parent mass (median), cloud 0.1393 %, 4 distinct children (median).
Later breaks: 4539 events, largest child 51.26 % of parent mass (median), cloud 14.11 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 33.87 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 66.13 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 6.876 %              | 0.571463                 | 61835.7                   |
| 2          | 3.851 %              | 0.702861                 | 32546.4                   |
| 3          | 5.896 %              | 0.675758                 | 30306.5                   |
| 4          | 6.388 %              | 0.6662                   | 28873                     |
| 5+         | 10.86 %              | 0.666701                 | 32298.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 59.48 %                | 0.729867                 | 22780–31100        |
| mid                                    | 13.41 %                | 0.7511                   | 31100–33280        |
| high                                   | 27.11 %                | 0.593206                 | 33280–66220        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.49 % of parent mass (median), cloud 0.1654 %, 4 distinct children (median).
Later breaks: 5813 events, largest child 51.46 % of parent mass (median), cloud 10.43 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 30.89 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 69.11 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 6.621 %              | 0.577012                 | 62406.5                   |
| 2          | 2.482 %              | 0.666684                 | 32914.5                   |
| 3          | 5.786 %              | 0.671095                 | 29933.4                   |
| 4          | 5.058 %              | 0.670858                 | 29623.4                   |
| 5+         | 10.94 %              | 0.783622                 | 33199.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 64.29 %                | 0.713086                 | 22180–31850        |
| mid                                    | 8.515 %                | 0.802412                 | 31850–33620        |
| high                                   | 27.19 %                | 0.77051                  | 33620–66240        |

### 2022 EB5 (rule 961)

**M1/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 39.18 % of parent mass (median), cloud 34.07 %, 3 distinct children (median).
Later breaks: 1374 events, largest child 39.18 % of parent mass (median), cloud 34.07 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 1.234 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 98.77 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 0 %                  | —                        | —                         |
| 5+         | 1.234 %              | 0.454917                 | 29912.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 23.03 %                | 0.492894                 | 28770–29420        |
| mid                                    | 32.07 %                | 0.454835                 | 29420–30110        |
| high                                   | 44.89 %                | 0.437133                 | 30110–30790        |

**M1/capped** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 56.46 % of parent mass (median), cloud 23.42 %, 3 distinct children (median).
Later breaks: 57 events, largest child 56.46 % of parent mass (median), cloud 23.42 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 17.21 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 82.79 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0 %                  | —                        | —                         |
| 3          | 0 %                  | —                        | —                         |
| 4          | 2.001 %              | 0.211226                 | 24316.4                   |
| 5+         | 15.21 %              | 0.309378                 | 19290.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 29.96 %                | 0.331465                 | 17670–19020        |
| mid                                    | 33.55 %                | 0.303958                 | 19040–21770        |
| high                                   | 36.49 %                | 0.233907                 | 21810–24350        |

**M2/unlimited** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 94.52 % of parent mass (median), cloud 0.03832 %, 4 distinct children (median).
Later breaks: 100 events, largest child 47.05 % of parent mass (median), cloud 47.05 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 1.823 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 98.18 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0.1631 %             | 0.795132                 | 20116.9                   |
| 3          | 0.3357 %             | 0.843633                 | 17088.9                   |
| 4          | 0.05674 %            | 0.770617                 | 28981.4                   |
| 5+         | 1.267 %              | 0.788786                 | 24395.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 40.24 %                | 0.811419                 | 17090–24200        |
| mid                                    | 24.46 %                | 0.786627                 | 24220–25580        |
| high                                   | 35.3 %                 | 0.758487                 | 25580–30620        |

**M2/capped** — 1 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 1 events, largest child 83.76 % of parent mass (median), cloud 0.003556 %, 4 distinct children (median).
Later breaks: 13 events, largest child 72.16 % of parent mass (median), cloud 72.16 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 2.249 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 97.75 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0.1263 %             | 0.274771                 | 28041.4                   |
| 3          | 0.8449 %             | 0.367556                 | 25692.9                   |
| 4          | 1.034 %              | 0.28579                  | 26451.8                   |
| 5+         | 0.2436 %             | 0.290473                 | 25649.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 24.91 %                | 0.377429                 | 21340–25650        |
| mid                                    | 37.44 %                | 0.285795                 | 25690–26510        |
| high                                   | 37.66 %                | 0.271545                 | 28040–32040        |

### 2023 CX1 (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 53.43 % of parent mass (median), cloud 44.65 %, 3 distinct children (median).
Later breaks: 4721 events, largest child 46.56 % of parent mass (median), cloud 27.64 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 21.49 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 78.51 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.9274 %             | 0.564371                 | 29410.8                   |
| 2          | 4.461 %              | 0.773802                 | 26181.4                   |
| 3          | 5.041 %              | 0.70881                  | 25757.6                   |
| 4          | 3.407 %              | 0.702785                 | 27128.8                   |
| 5+         | 7.659 %              | 0.681761                 | 29424.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 73.7 %                 | 0.827672                 | 18570–26840        |
| mid                                    | 21.92 %                | 0.736456                 | 26840–30310        |
| high                                   | 4.374 %                | 0.546251                 | 30310–35110        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 55.22 % of parent mass (median), cloud 44.84 %, 3 distinct children (median).
Later breaks: 5420 events, largest child 60.72 % of parent mass (median), cloud 17.2 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 21.05 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 78.95 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.6997 %             | 0.724897                 | 29276.3                   |
| 2          | 3.214 %              | 0.756144                 | 27525.9                   |
| 3          | 7.016 %              | 0.733087                 | 25805                     |
| 4          | 3.764 %              | 0.73587                  | 27422.4                   |
| 5+         | 6.358 %              | 0.758132                 | 30708.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 79.2 %                 | 0.736443                 | 18730–27850        |
| mid                                    | 17.26 %                | 0.782659                 | 27850–31220        |
| high                                   | 3.535 %                | 0.756366                 | 31220–35280        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.51 % of parent mass (median), cloud 0.1868 %, 4 distinct children (median).
Later breaks: 4234 events, largest child 54.93 % of parent mass (median), cloud 24.13 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 25.31 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 74.69 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 5.093 %              | 0.67964                  | 59584.9                   |
| 2          | 3.049 %              | 0.767045                 | 30062.9                   |
| 3          | 4.112 %              | 0.758065                 | 27283.6                   |
| 4          | 4.756 %              | 0.754718                 | 26711.6                   |
| 5+         | 8.304 %              | 0.73388                  | 29115.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 54.31 %                | 0.785263                 | 18500–27650        |
| mid                                    | 18.45 %                | 0.75243                  | 27650–30420        |
| high                                   | 27.24 %                | 0.700319                 | 30420–63280        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.54 % of parent mass (median), cloud 0.1592 %, 4 distinct children (median).
Later breaks: 4575 events, largest child 50.22 % of parent mass (median), cloud 19.36 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 26.08 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 73.92 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 5.645 %              | 0.688447                 | 59257.6                   |
| 2          | 3.142 %              | 0.786233                 | 29462.7                   |
| 3          | 4.665 %              | 0.774634                 | 28531.6                   |
| 4          | 4.605 %              | 0.755758                 | 26575.6                   |
| 5+         | 8.026 %              | 0.859269                 | 28925.6                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 53.91 %                | 0.762711                 | 19610–27650        |
| mid                                    | 15 %                   | 0.866055                 | 27660–30060        |
| high                                   | 31.09 %                | 0.855013                 | 30060–63300        |

### 2024 BX1 (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 55.48 % of parent mass (median), cloud 48.28 %, 3 distinct children (median).
Later breaks: 2331 events, largest child 55.67 % of parent mass (median), cloud 18.12 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 24.12 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 75.88 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.446 %              | 0.601314                 | 31422.8                   |
| 2          | 6.773 %              | 0.700023                 | 27787.6                   |
| 3          | 6.5 %                | 0.704802                 | 28008.9                   |
| 4          | 4.914 %              | 0.69607                  | 28036.5                   |
| 5+         | 4.483 %              | 0.792126                 | 29974                     |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 60.11 %                | 0.751938                 | 21200–27790        |
| mid                                    | 26.8 %                 | 0.788006                 | 27790–30680        |
| high                                   | 13.09 %                | 0.775998                 | 30680–37190        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.82 % of parent mass (median), cloud 45.08 %, 3 distinct children (median).
Later breaks: 2318 events, largest child 55.26 % of parent mass (median), cloud 22.46 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 24.39 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 75.61 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.042 %              | 0.628215                 | 30745.4                   |
| 2          | 7.775 %              | 0.749587                 | 27451.8                   |
| 3          | 5.853 %              | 0.699066                 | 27701.9                   |
| 4          | 3.827 %              | 0.755232                 | 27751.3                   |
| 5+         | 4.896 %              | 0.671201                 | 30072                     |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 61.12 %                | 0.772283                 | 20960–28150        |
| mid                                    | 27.39 %                | 0.67801                  | 28150–30510        |
| high                                   | 11.49 %                | 0.615376                 | 30510–38110        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.69 % of parent mass (median), cloud 0.1525 %, 4 distinct children (median).
Later breaks: 4834 events, largest child 58.13 % of parent mass (median), cloud 12.4 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 31.99 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 68.01 %, dust 0.000003693 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 7.418 %              | 0.599423                 | 60362.5                   |
| 2          | 3.618 %              | 0.752127                 | 31726.5                   |
| 3          | 5.859 %              | 0.76098                  | 28572.5                   |
| 4          | 5.594 %              | 0.676771                 | 27892.7                   |
| 5+         | 9.505 %              | 0.814704                 | 31941.6                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 56.75 %                | 0.745245                 | 20700–29880        |
| mid                                    | 15.76 %                | 0.753482                 | 29880–33460        |
| high                                   | 27.49 %                | 0.833673                 | 33460–64510        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.99 % of parent mass (median), cloud 0.158 %, 4 distinct children (median).
Later breaks: 7012 events, largest child 72.1 % of parent mass (median), cloud 5.694 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 32.19 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 67.81 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 7.785 %              | 0.599108                 | 60583.1                   |
| 2          | 3.092 %              | 0.72358                  | 32280.8                   |
| 3          | 5.158 %              | 0.678965                 | 28441.8                   |
| 4          | 5.944 %              | 0.740246                 | 27675.8                   |
| 5+         | 10.21 %              | 0.803884                 | 33414.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 65 %                   | 0.768103                 | 20460–31540        |
| mid                                    | 8.304 %                | 0.714115                 | 31540–34030        |
| high                                   | 26.7 %                 | 0.870683                 | 34030–64460        |

### 2022 WJ1 (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 162 events, largest child 52.91 % of parent mass (median), cloud 41.72 %, 3 distinct children (median).
Later breaks: 361 events, largest child 52.28 % of parent mass (median), cloud 22.5 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 53.82 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 46.18 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 35.46 %              | 0.704803                 | 31893.5                   |
| 2          | 10.44 %              | 0.765096                 | 31311.5                   |
| 3          | 5.86 %               | 0.802704                 | 30858.9                   |
| 4          | 1.336 %              | 0.765576                 | 33395.6                   |
| 5+         | 0.7247 %             | 0.682553                 | 32619.6                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 38.93 %                | 0.823575                 | 22850–30340        |
| mid                                    | 19.81 %                | 0.765094                 | 30340–32900        |
| high                                   | 41.26 %                | 0.6286                   | 32910–100000       |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 175 events, largest child 53.24 % of parent mass (median), cloud 40.64 %, 3 distinct children (median).
Later breaks: 551 events, largest child 53 % of parent mass (median), cloud 23.17 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 46.37 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 53.63 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 27.97 %              | 0.6921                   | 31433.8                   |
| 2          | 10.48 %              | 0.775585                 | 30984.3                   |
| 3          | 3.897 %              | 0.728332                 | 32350.9                   |
| 4          | 2.353 %              | 0.775642                 | 31973.2                   |
| 5+         | 1.667 %              | 0.797371                 | 34678.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 47.96 %                | 0.824356                 | 23860–30910        |
| mid                                    | 20.43 %                | 0.780102                 | 30910–33620        |
| high                                   | 31.61 %                | 0.657389                 | 33620–100000       |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.49 % of parent mass (median), cloud 0.1688 %, 4 distinct children (median).
Later breaks: 475 events, largest child 53.65 % of parent mass (median), cloud 30.36 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 56.92 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 43.08 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 26.12 %              | 0.660012                 | 58596.1                   |
| 2          | 17.47 %              | 0.810873                 | 30422                     |
| 3          | 7.612 %              | 0.80369                  | 30879.1                   |
| 4          | 3.586 %              | 0.854449                 | 31515.3                   |
| 5+         | 2.128 %              | 0.677401                 | 32328.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 41.58 %                | 0.850987                 | 23260–31640        |
| mid                                    | 20.56 %                | 0.746872                 | 31640–56030        |
| high                                   | 37.87 %                | 0.702824                 | 56060–63280        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.67 % of parent mass (median), cloud 0.1394 %, 4 distinct children (median).
Later breaks: 449 events, largest child 54.46 % of parent mass (median), cloud 28.24 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 54.89 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 45.11 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 22.22 %              | 0.686496                 | 58584.3                   |
| 2          | 17.76 %              | 0.760287                 | 31421.2                   |
| 3          | 8.251 %              | 0.802607                 | 30962.3                   |
| 4          | 4.762 %              | 0.824961                 | 30532.9                   |
| 5+         | 1.9 %                | 0.819487                 | 31715.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 39.96 %                | 0.820104                 | 23780–31560        |
| mid                                    | 28.05 %                | 0.766037                 | 31570–56140        |
| high                                   | 31.99 %                | 0.695982                 | 56140–63250        |

### Carancas (rule 961)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.23 % of parent mass (median), cloud 43.41 %, 3 distinct children (median).
Later breaks: 22872 events, largest child 53.06 % of parent mass (median), cloud 13.34 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 14.34 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 85.66 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.1662 %             | 0.657793                 | 29134.8                   |
| 2          | 1.15 %               | 0.706764                 | 24950.3                   |
| 3          | 2.389 %              | 0.763313                 | 24397.1                   |
| 4          | 3.363 %              | 0.783617                 | 23789.3                   |
| 5+         | 7.269 %              | 0.825219                 | 30279.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 94.11 %                | 0.738376                 | 15670–28910        |
| mid                                    | 4.352 %                | 0.83181                  | 28910–31110        |
| high                                   | 1.54 %                 | 0.860122                 | 31110–33840        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 55.84 % of parent mass (median), cloud 49.62 %, 3 distinct children (median).
Later breaks: 15148 events, largest child 51.7 % of parent mass (median), cloud 16.52 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 13.21 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 86.79 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.05964 %            | 0.475442                 | 27591.5                   |
| 2          | 1.51 %               | 0.694985                 | 24526.1                   |
| 3          | 2.614 %              | 0.737001                 | 24229.8                   |
| 4          | 2.859 %              | 0.743246                 | 24251.1                   |
| 5+         | 6.166 %              | 0.795047                 | 29383.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 91.11 %                | 0.761293                 | 15810–27820        |
| mid                                    | 6.446 %                | 0.831359                 | 27820–30100        |
| high                                   | 2.441 %                | 0.790713                 | 30100–34210        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.79 % of parent mass (median), cloud 0.1366 %, 4 distinct children (median).
Later breaks: 29147 events, largest child 47.48 % of parent mass (median), cloud 11.55 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 17.55 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 82.45 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.956 %              | 0.639099                 | 59724.8                   |
| 2          | 1.823 %              | 0.774129                 | 26458                     |
| 3          | 2.041 %              | 0.772702                 | 26860.1                   |
| 4          | 2.606 %              | 0.737082                 | 25714.8                   |
| 5+         | 9.125 %              | 0.650994                 | 30912.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 82.78 %                | 0.739546                 | 16000–30070        |
| mid                                    | 2.794 %                | 0.650992                 | 30070–31170        |
| high                                   | 14.42 %                | 0.493662                 | 31170–66010        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.9 % of parent mass (median), cloud 0.1583 %, 4 distinct children (median).
Later breaks: 10677 events, largest child 63.26 % of parent mass (median), cloud 15.76 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 18.48 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 81.52 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.266 %              | 0.675565                 | 58956.3                   |
| 2          | 2.208 %              | 0.774921                 | 25870.3                   |
| 3          | 2.529 %              | 0.768618                 | 25899.7                   |
| 4          | 2.668 %              | 0.746925                 | 25647.9                   |
| 5+         | 8.804 %              | 0.707391                 | 28003.6                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 66.9 %                 | 0.748019                 | 16330–25910        |
| mid                                    | 18.54 %                | 0.727893                 | 25910–31010        |
| high                                   | 14.56 %                | 0.701255                 | 31020–65530        |

### Winchcombe (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 104 events, largest child 57.48 % of parent mass (median), cloud 50.48 %, 3 distinct children (median).
Later breaks: 86 events, largest child 50.27 % of parent mass (median), cloud 29.29 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 70.44 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 29.56 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 62.75 %              | 0.757125                 | 35653.4                   |
| 2          | 5.468 %              | 0.830896                 | 33277.8                   |
| 3          | 1.515 %              | 0.838073                 | 33917.6                   |
| 4          | 0.4911 %             | 0.917015                 | 33218.7                   |
| 5+         | 0.2104 %             | 0.889314                 | 32841.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 20.05 %                | 0.865949                 | 26900–33130        |
| mid                                    | 11.61 %                | 0.796199                 | 33130–35690        |
| high                                   | 68.34 %                | 0.692706                 | 35690–100000       |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 91 events, largest child 55.5 % of parent mass (median), cloud 38.6 %, 3 distinct children (median).
Later breaks: 89 events, largest child 56.23 % of parent mass (median), cloud 15.53 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 76.84 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 23.16 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 69.65 %              | 0.7967                   | 35905.3                   |
| 2          | 4.006 %              | 0.846666                 | 32767.9                   |
| 3          | 2.284 %              | 0.876156                 | 33773.5                   |
| 4          | 0.7148 %             | 0.870997                 | 34243.3                   |
| 5+         | 0.1862 %             | 0.891632                 | 33298.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 19.02 %                | 0.860797                 | 26880–32770        |
| mid                                    | 10.58 %                | 0.869403                 | 32780–35900        |
| high                                   | 70.4 %                 | 0.711507                 | 35910–100000       |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.87 % of parent mass (median), cloud 0.1574 %, 4 distinct children (median).
Later breaks: 171 events, largest child 58.1 % of parent mass (median), cloud 29.81 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 75.3 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 24.7 %, dust 0.0006057 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 51.17 %              | 0.659589                 | 58477.2                   |
| 2          | 17.71 %              | 0.767459                 | 33179.2                   |
| 3          | 4.721 %              | 0.815876                 | 32620                     |
| 4          | 1.146 %              | 0.790156                 | 33714.2                   |
| 5+         | 0.5502 %             | 0.889585                 | 34480.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 30.28 %                | 0.815129                 | 27300–36200        |
| mid                                    | 32.95 %                | 0.64973                  | 36300–58330        |
| high                                   | 36.77 %                | 0.690503                 | 58330–63040        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.97 % of parent mass (median), cloud 0.1543 %, 4 distinct children (median).
Later breaks: 135 events, largest child 54.17 % of parent mass (median), cloud 29.52 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 84.6 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 15.4 %, dust 0.0001561 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 66.71 %              | 0.698049                 | 58522.6                   |
| 2          | 11.92 %              | 0.777264                 | 34350.2                   |
| 3          | 4.561 %              | 0.848629                 | 32702.7                   |
| 4          | 0.9682 %             | 0.874586                 | 34088.6                   |
| 5+         | 0.4401 %             | 0.89681                  | 32810.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 25.35 %                | 0.820578                 | 26860–54760        |
| mid                                    | 37.7 %                 | 0.703662                 | 54780–58890        |
| high                                   | 36.94 %                | 0.683969                 | 59000–62920        |

### Golden (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.65 % of parent mass (median), cloud 41.71 %, 3 distinct children (median).
Later breaks: 4123 events, largest child 58.31 % of parent mass (median), cloud 14.01 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 26.38 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 73.62 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.942 %              | 0.496121                 | 33377.3                   |
| 2          | 6.195 %              | 0.511086                 | 30009.5                   |
| 3          | 4.658 %              | 0.550608                 | 30602                     |
| 4          | 5.764 %              | 0.62796                  | 29938.3                   |
| 5+         | 7.822 %              | 0.618369                 | 33951.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 75.43 %                | 0.737939                 | 23010–31610        |
| mid                                    | 20.98 %                | 0.599209                 | 31610–34560        |
| high                                   | 3.591 %                | 0.584216                 | 34570–40110        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.14 % of parent mass (median), cloud 39.95 %, 3 distinct children (median).
Later breaks: 3440 events, largest child 50.52 % of parent mass (median), cloud 22.94 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 27.61 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 72.39 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.939 %              | 0.469089                 | 32378.1                   |
| 2          | 7.302 %              | 0.591356                 | 29282.6                   |
| 3          | 7.162 %              | 0.631122                 | 30152.3                   |
| 4          | 5.352 %              | 0.614054                 | 30597.4                   |
| 5+         | 5.86 %               | 0.649528                 | 33816.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 74.38 %                | 0.690865                 | 22470–31020        |
| mid                                    | 21.65 %                | 0.475191                 | 31020–34270        |
| high                                   | 3.968 %                | 0.476029                 | 34280–39190        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 89.01 % of parent mass (median), cloud 0.1274 %, 4 distinct children (median).
Later breaks: 3045 events, largest child 60.45 % of parent mass (median), cloud 18.39 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 30.1 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 69.9 %, dust 0.000008269 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 7.476 %              | 0.467405                 | 62848                     |
| 2          | 3.655 %              | 0.632811                 | 34203.3                   |
| 3          | 6.937 %              | 0.649471                 | 30952.5                   |
| 4          | 5.407 %              | 0.586618                 | 30386.3                   |
| 5+         | 6.622 %              | 0.587286                 | 33070.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 51.2 %                 | 0.569614                 | 23340–31450        |
| mid                                    | 18.62 %                | 0.526164                 | 31450–34590        |
| high                                   | 30.18 %                | 0.5995                   | 34590–66940        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.83 % of parent mass (median), cloud 0.1438 %, 4 distinct children (median).
Later breaks: 3327 events, largest child 51.94 % of parent mass (median), cloud 16.93 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 32.54 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 67.46 %, dust 0.0000517 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 7.749 %              | 0.503957                 | 63132.8                   |
| 2          | 3.841 %              | 0.640864                 | 34442.8                   |
| 3          | 6.216 %              | 0.631102                 | 31101                     |
| 4          | 6.289 %              | 0.697235                 | 30497.9                   |
| 5+         | 8.445 %              | 0.830746                 | 33884.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 49.9 %                 | 0.712183                 | 23810–31440        |
| mid                                    | 21.76 %                | 0.634541                 | 31440–35600        |
| high                                   | 28.34 %                | 0.866233                 | 35600–67000        |

### Madura Cave (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 57.75 % of parent mass (median), cloud 47.17 %, 3 distinct children (median).
Later breaks: 699 events, largest child 53.37 % of parent mass (median), cloud 22.82 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 38.32 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 61.68 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 18.68 %              | 0.78927                  | 29014.9                   |
| 2          | 9.224 %              | 0.781236                 | 29387.4                   |
| 3          | 5.35 %               | 0.741669                 | 29876.3                   |
| 4          | 2.921 %              | 0.772093                 | 29778.9                   |
| 5+         | 2.147 %              | 0.660795                 | 31469.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 59.65 %                | 0.824322                 | 22420–28820        |
| mid                                    | 26.14 %                | 0.736529                 | 28820–31470        |
| high                                   | 14.21 %                | 0.66744                  | 31480–37790        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.23 % of parent mass (median), cloud 51.13 %, 3 distinct children (median).
Later breaks: 928 events, largest child 54.22 % of parent mass (median), cloud 17.78 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 34.92 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 65.08 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 14.28 %              | 0.746572                 | 28920.5                   |
| 2          | 9.443 %              | 0.778663                 | 29532.5                   |
| 3          | 5.237 %              | 0.838896                 | 30096                     |
| 4          | 3.587 %              | 0.846361                 | 30004.9                   |
| 5+         | 2.377 %              | 0.744881                 | 31652.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 61.7 %                 | 0.837188                 | 23310–29230        |
| mid                                    | 24.5 %                 | 0.821974                 | 29240–31610        |
| high                                   | 13.8 %                 | 0.673683                 | 31610–38530        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.48 % of parent mass (median), cloud 0.1513 %, 4 distinct children (median).
Later breaks: 1083 events, largest child 52.83 % of parent mass (median), cloud 22.36 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 45.61 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 54.4 %, dust 0.00002226 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 12.51 %              | 0.662665                 | 58768.9                   |
| 2          | 14.54 %              | 0.698816                 | 29313.8                   |
| 3          | 8.59 %               | 0.733161                 | 30023.5                   |
| 4          | 4.694 %              | 0.825958                 | 29835                     |
| 5+         | 5.278 %              | 0.843165                 | 32304.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 51.68 %                | 0.820776                 | 23750–30650        |
| mid                                    | 16.75 %                | 0.801347                 | 30650–33720        |
| high                                   | 31.57 %                | 0.696385                 | 33720–63380        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.95 % of parent mass (median), cloud 0.1641 %, 4 distinct children (median).
Later breaks: 1052 events, largest child 51.17 % of parent mass (median), cloud 25.62 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 46.51 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 53.49 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 12.73 %              | 0.674594                 | 59147.4                   |
| 2          | 14.14 %              | 0.764873                 | 28733.9                   |
| 3          | 10.36 %              | 0.76442                  | 29766.9                   |
| 4          | 5.249 %              | 0.815601                 | 30067.3                   |
| 5+         | 4.027 %              | 0.673651                 | 32443.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 53.21 %                | 0.783939                 | 22300–30510        |
| mid                                    | 16.2 %                 | 0.676848                 | 30550–33730        |
| high                                   | 30.59 %                | 0.670125                 | 33730–63290        |

### Hamburg (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 53.07 % of parent mass (median), cloud 42.82 %, 3 distinct children (median).
Later breaks: 3044 events, largest child 53.88 % of parent mass (median), cloud 22.8 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 25.38 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 74.62 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.676 %              | 0.627798                 | 30888.4                   |
| 2          | 6.793 %              | 0.77625                  | 28299.8                   |
| 3          | 5.738 %              | 0.703865                 | 29417.3                   |
| 4          | 4.741 %              | 0.753368                 | 29376.4                   |
| 5+         | 5.429 %              | 0.688347                 | 32052.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 73.82 %                | 0.761932                 | 22400–30060        |
| mid                                    | 17.69 %                | 0.674962                 | 30060–32200        |
| high                                   | 8.491 %                | 0.696825                 | 32200–37620        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.51 % of parent mass (median), cloud 49.07 %, 3 distinct children (median).
Later breaks: 3916 events, largest child 50.77 % of parent mass (median), cloud 13.67 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 23.79 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 76.21 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.499 %              | 0.687293                 | 30234.6                   |
| 2          | 6.992 %              | 0.703234                 | 28374.8                   |
| 3          | 4.751 %              | 0.691276                 | 29143.9                   |
| 4          | 4.261 %              | 0.703082                 | 29374.3                   |
| 5+         | 5.289 %              | 0.757659                 | 34220.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 84.54 %                | 0.740301                 | 22490–31070        |
| mid                                    | 12.93 %                | 0.716172                 | 31070–34560        |
| high                                   | 2.532 %                | 0.882288                 | 34560–38260        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.6 % of parent mass (median), cloud 0.1447 %, 4 distinct children (median).
Later breaks: 2330 events, largest child 50.76 % of parent mass (median), cloud 24.17 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 36.83 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 63.17 %, dust 0.000007514 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 8.581 %              | 0.591881                 | 61626.6                   |
| 2          | 4.33 %               | 0.681094                 | 32343.5                   |
| 3          | 9.186 %              | 0.643139                 | 28878.8                   |
| 4          | 7.587 %              | 0.683286                 | 28879.4                   |
| 5+         | 7.151 %              | 0.792612                 | 31645.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 53.43 %                | 0.697627                 | 21270–30100        |
| mid                                    | 18.34 %                | 0.802345                 | 30100–33010        |
| high                                   | 28.22 %                | 0.615136                 | 33020–65170        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.84 % of parent mass (median), cloud 0.1567 %, 4 distinct children (median).
Later breaks: 2419 events, largest child 51.65 % of parent mass (median), cloud 32.56 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 28.15 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 71.85 %, dust 0.000007371 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 7.079 %              | 0.602246                 | 60997.9                   |
| 2          | 3.597 %              | 0.71073                  | 32406                     |
| 3          | 6.179 %              | 0.680478                 | 29862.3                   |
| 4          | 4.237 %              | 0.744523                 | 29783.8                   |
| 5+         | 7.058 %              | 0.690335                 | 30936                     |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 44.2 %                 | 0.697689                 | 22160–29660        |
| mid                                    | 21.22 %                | 0.702864                 | 29660–32500        |
| high                                   | 34.58 %                | 0.632328                 | 32510–65190        |

### Traspena (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.55 % of parent mass (median), cloud 44.08 %, 3 distinct children (median).
Later breaks: 18217 events, largest child 56.64 % of parent mass (median), cloud 15.68 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 14.91 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 85.09 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.008463 %           | 0.204641                 | 32745.6                   |
| 2          | 1.406 %              | 0.645234                 | 27011                     |
| 3          | 2.811 %              | 0.636579                 | 25302.5                   |
| 4          | 2.852 %              | 0.679275                 | 24741.8                   |
| 5+         | 7.834 %              | 0.679579                 | 30317.1                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 87.36 %                | 0.750795                 | 18190–28400        |
| mid                                    | 10.61 %                | 0.561884                 | 28400–31040        |
| high                                   | 2.038 %                | 0.823794                 | 31040–36150        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.94 % of parent mass (median), cloud 46.43 %, 3 distinct children (median).
Later breaks: 11440 events, largest child 46.36 % of parent mass (median), cloud 25.22 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 14.63 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 85.37 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.06841 %            | 0.691469                 | 30127.4                   |
| 2          | 0.9697 %             | 0.60821                  | 26910.1                   |
| 3          | 1.945 %              | 0.665453                 | 25665.7                   |
| 4          | 4.464 %              | 0.705881                 | 25921.9                   |
| 5+         | 7.184 %              | 0.639809                 | 30737.1                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 90.45 %                | 0.714814                 | 17820–28270        |
| mid                                    | 8.143 %                | 0.696796                 | 28270–31780        |
| high                                   | 1.41 %                 | 0.484573                 | 31800–36050        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.77 % of parent mass (median), cloud 0.147 %, 4 distinct children (median).
Later breaks: 15117 events, largest child 50.81 % of parent mass (median), cloud 28.5 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 18.84 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 81.16 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 1.622 %              | 0.552309                 | 61426.7                   |
| 2          | 2.081 %              | 0.691776                 | 27314.4                   |
| 3          | 2.101 %              | 0.665192                 | 28302.3                   |
| 4          | 2.797 %              | 0.682922                 | 27213.8                   |
| 5+         | 10.24 %              | 0.739733                 | 31136.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 75.12 %                | 0.756442                 | 17920–28540        |
| mid                                    | 14.63 %                | 0.70404                  | 28540–33160        |
| high                                   | 10.25 %                | 0.73954                  | 33160–66090        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.46 % of parent mass (median), cloud 0.1662 %, 4 distinct children (median).
Later breaks: 11847 events, largest child 57.42 % of parent mass (median), cloud 20.85 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 22.04 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 77.96 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 2.118 %              | 0.507138                 | 61551.5                   |
| 2          | 2.181 %              | 0.657412                 | 27382.3                   |
| 3          | 2.214 %              | 0.648405                 | 27886                     |
| 4          | 3.408 %              | 0.619723                 | 26671                     |
| 5+         | 12.11 %              | 0.561924                 | 28962.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 70.26 %                | 0.725776                 | 17480–27660        |
| mid                                    | 12.72 %                | 0.571202                 | 27670–30030        |
| high                                   | 17.02 %                | 0.4887                   | 30030–65940        |

### Cavezzo (third set)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 117 events, largest child 55.26 % of parent mass (median), cloud 44.45 %, 3 distinct children (median).
Later breaks: 124 events, largest child 51.51 % of parent mass (median), cloud 25.18 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 66.91 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 33.09 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 54.82 %              | 0.767473                 | 33563.8                   |
| 2          | 8.298 %              | 0.876852                 | 31510.1                   |
| 3          | 2.58 %               | 0.852082                 | 31799.7                   |
| 4          | 0.7399 %             | 0.872268                 | 31834.4                   |
| 5+         | 0.4685 %             | 0.942411                 | 31182.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 22.9 %                 | 0.877008                 | 25350–31050        |
| mid                                    | 14.83 %                | 0.803955                 | 31100–33280        |
| high                                   | 62.28 %                | 0.770753                 | 33290–100000       |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 114 events, largest child 53.91 % of parent mass (median), cloud 42.22 %, 3 distinct children (median).
Later breaks: 90 events, largest child 50.8 % of parent mass (median), cloud 29.51 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 69.36 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 30.64 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 60.46 %              | 0.790338                 | 33734.7                   |
| 2          | 7.013 %              | 0.862474                 | 31479.6                   |
| 3          | 1.567 %              | 0.838949                 | 31470.9                   |
| 4          | 0.2178 %             | 0.760443                 | 31705.4                   |
| 5+         | 0.1033 %             | 0.797301                 | 30600.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 22.61 %                | 0.855499                 | 25030–30810        |
| mid                                    | 13.29 %                | 0.802821                 | 30830–33480        |
| high                                   | 64.1 %                 | 0.731726                 | 33520–100000       |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.04 % of parent mass (median), cloud 0.1349 %, 4 distinct children (median).
Later breaks: 224 events, largest child 49.67 % of parent mass (median), cloud 31.84 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 72.77 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 27.23 %, dust 0.003879 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 50.24 %              | 0.74373                  | 56900.5                   |
| 2          | 15.31 %              | 0.798302                 | 31551.8                   |
| 3          | 4.474 %              | 0.85254                  | 32425.9                   |
| 4          | 1.88 %               | 0.800639                 | 32578.1                   |
| 5+         | 0.8607 %             | 0.893584                 | 31916.7                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 26.58 %                | 0.824311                 | 25960–33640        |
| mid                                    | 35.71 %                | 0.74373                  | 33670–55820        |
| high                                   | 37.72 %                | 0.745496                 | 55820–61910        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.71 % of parent mass (median), cloud 0.1422 %, 4 distinct children (median).
Later breaks: 220 events, largest child 50.51 % of parent mass (median), cloud 24.89 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 77.47 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 22.53 %, dust 0.0035 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 53.7 %               | 0.73696                  | 57344.1                   |
| 2          | 16.54 %              | 0.837457                 | 31481.9                   |
| 3          | 4.822 %              | 0.770374                 | 31190.9                   |
| 4          | 1.736 %              | 0.802612                 | 32239                     |
| 5+         | 0.6694 %             | 0.513473                 | 33395.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 27.38 %                | 0.802611                 | 26400–34040        |
| mid                                    | 33.37 %                | 0.74225                  | 34050–56910        |
| high                                   | 39.25 %                | 0.735184                 | 56910–61930        |

### Košice (W18)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.84 % of parent mass (median), cloud 46.07 %, 3 distinct children (median).
Later breaks: 14937 events, largest child 63.35 % of parent mass (median), cloud 8.603 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 19.12 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 80.88 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.2389 %             | 0.586393                 | 29874.9                   |
| 2          | 2.225 %              | 0.613815                 | 27037.5                   |
| 3          | 3.871 %              | 0.699649                 | 25911.5                   |
| 4          | 3.221 %              | 0.711086                 | 26434                     |
| 5+         | 9.569 %              | 0.721805                 | 31309.5                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 93.36 %                | 0.777945                 | 17470–29870        |
| mid                                    | 4.299 %                | 0.723592                 | 29870–31580        |
| high                                   | 2.343 %                | 0.70538                  | 31580–36460        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.88 % of parent mass (median), cloud 45.45 %, 3 distinct children (median).
Later breaks: 10203 events, largest child 61.36 % of parent mass (median), cloud 17.7 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 18.41 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 81.59 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.3932 %             | 0.457163                 | 30646.2                   |
| 2          | 3.268 %              | 0.742224                 | 25865                     |
| 3          | 2.501 %              | 0.66823                  | 26775.8                   |
| 4          | 4.228 %              | 0.732579                 | 26555.7                   |
| 5+         | 8.019 %              | 0.672852                 | 31548.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 85.9 %                 | 0.75639                  | 18010–27840        |
| mid                                    | 13.25 %                | 0.766276                 | 27850–32580        |
| high                                   | 0.8543 %               | 0.426337                 | 32580–35790        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.59 % of parent mass (median), cloud 0.1774 %, 4 distinct children (median).
Later breaks: 10753 events, largest child 52.32 % of parent mass (median), cloud 10.92 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 25.01 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 74.99 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 3.546 %              | 0.634061                 | 59727.4                   |
| 2          | 2.566 %              | 0.717855                 | 28676.8                   |
| 3          | 3.17 %               | 0.686617                 | 27241.4                   |
| 4          | 3.38 %               | 0.722841                 | 26790.8                   |
| 5+         | 12.34 %              | 0.716607                 | 31187.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 74.44 %                | 0.782483                 | 16770–29140        |
| mid                                    | 7.27 %                 | 0.72942                  | 29140–31280        |
| high                                   | 18.29 %                | 0.715155                 | 31280–64310        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.62 % of parent mass (median), cloud 0.1248 %, 4 distinct children (median).
Later breaks: 7152 events, largest child 54.33 % of parent mass (median), cloud 19.36 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 25.16 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 74.84 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 3.623 %              | 0.564915                 | 60587.2                   |
| 2          | 2.373 %              | 0.688956                 | 29343.4                   |
| 3          | 2.928 %              | 0.640765                 | 28108.5                   |
| 4          | 4.348 %              | 0.678655                 | 26877.8                   |
| 5+         | 11.89 %              | 0.6103                   | 28175.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 55.73 %                | 0.72134                  | 16180–26640        |
| mid                                    | 23.04 %                | 0.7124                   | 26640–30170        |
| high                                   | 21.23 %                | 0.358325                 | 30170–64330        |

### Benešov (W18)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.9 % of parent mass (median), cloud 44.4 %, 3 distinct children (median).
Later breaks: 73666 events, largest child 55.07 % of parent mass (median), cloud 5.787 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 12.7 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 87.3 %, dust 0.0001384 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.001485 %           | 0.0395883                | 35941.5                   |
| 2          | 0.2329 %             | 0.333789                 | 29076.9                   |
| 3          | 0.7832 %             | 0.426406                 | 27647.8                   |
| 4          | 1.01 %               | 0.437857                 | 27870.2                   |
| 5+         | 10.67 %              | 0.762303                 | 33457.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 94.25 %                | 0.575846                 | 18840–32900        |
| mid                                    | 2.539 %                | 0.77819                  | 32900–33840        |
| high                                   | 3.21 %                 | 0.76237                  | 33840–39150        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 54.93 % of parent mass (median), cloud 46.63 %, 3 distinct children (median).
Later breaks: 42734 events, largest child 55.25 % of parent mass (median), cloud 11.86 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 10.78 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 89.22 %, dust 5.361e-7 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0 %                  | —                        | —                         |
| 2          | 0.5339 %             | 0.282882                 | 29293.3                   |
| 3          | 0.8426 %             | 0.538573                 | 27251.1                   |
| 4          | 1.353 %              | 0.550916                 | 27822.6                   |
| 5+         | 8.054 %              | 0.478959                 | 32337.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 87.58 %                | 0.62862                  | 17750–30530        |
| mid                                    | 9.285 %                | 0.469418                 | 30530–32720        |
| high                                   | 3.137 %                | 0.414118                 | 32720–39710        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.59 % of parent mass (median), cloud 0.146 %, 4 distinct children (median).
Later breaks: 46177 events, largest child 50.12 % of parent mass (median), cloud 13.52 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 14.87 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 85.13 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.7979 %             | 0.348382                 | 65405.4                   |
| 2          | 1.083 %              | 0.500159                 | 28307.8                   |
| 3          | 1.545 %              | 0.504586                 | 29511                     |
| 4          | 1.669 %              | 0.480315                 | 28626                     |
| 5+         | 9.773 %              | 0.570519                 | 33722.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 87.73 %                | 0.588575                 | 17490–32750        |
| mid                                    | 4.274 %                | 0.576986                 | 32750–34650        |
| high                                   | 7.997 %                | 0.35757                  | 34650–69340        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 88.07 % of parent mass (median), cloud 0.1451 %, 4 distinct children (median).
Later breaks: 53060 events, largest child 57.82 % of parent mass (median), cloud 11.57 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 16.87 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 83.13 %, dust 0.0004923 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.6499 %             | 0.290182                 | 65061.1                   |
| 2          | 0.8751 %             | 0.471023                 | 28831.8                   |
| 3          | 1.344 %              | 0.539111                 | 29991.7                   |
| 4          | 1.396 %              | 0.479921                 | 29613.7                   |
| 5+         | 12.61 %              | 0.689647                 | 33651.2                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 87.47 %                | 0.701171                 | 18930–31680        |
| mid                                    | 7.294 %                | 0.316891                 | 31680–35260        |
| high                                   | 5.235 %                | 0.81933                  | 35260–69350        |

### Tagish Lake (W18)

**M1/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 56.2 % of parent mass (median), cloud 45.97 %, 3 distinct children (median).
Later breaks: 10391 events, largest child 57.85 % of parent mass (median), cloud 13.92 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 20.07 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 79.93 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.42 %               | 0.816513                 | 31280.3                   |
| 2          | 2.729 %              | 0.631754                 | 27159.1                   |
| 3          | 5.02 %               | 0.736107                 | 26229.8                   |
| 4          | 4.645 %              | 0.73501                  | 26406.4                   |
| 5+         | 7.254 %              | 0.563835                 | 32859.3                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 92.07 %                | 0.639218                 | 19740–30640        |
| mid                                    | 6.898 %                | 0.770828                 | 30640–33330        |
| high                                   | 1.036 %                | 0.390819                 | 33330–35710        |

**M1/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 57.55 % of parent mass (median), cloud 46.58 %, 3 distinct children (median).
Later breaks: 5348 events, largest child 55.89 % of parent mass (median), cloud 13.98 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 22.26 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 77.74 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 0.5335 %             | 0.512625                 | 31186.5                   |
| 2          | 3.678 %              | 0.643682                 | 26839.2                   |
| 3          | 4.747 %              | 0.592932                 | 26402.7                   |
| 4          | 4.868 %              | 0.735264                 | 26820                     |
| 5+         | 8.437 %              | 0.724661                 | 30378.9                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 78.1 %                 | 0.786812                 | 18650–28030        |
| mid                                    | 15.64 %                | 0.748778                 | 28030–30830        |
| high                                   | 6.26 %                 | 0.712131                 | 30840–36480        |

**M2/unlimited** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.97 % of parent mass (median), cloud 0.1538 %, 4 distinct children (median).
Later breaks: 8072 events, largest child 54.48 % of parent mass (median), cloud 15.2 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 24.49 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 75.51 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 4.445 %              | 0.575619                 | 61157.3                   |
| 2          | 2.283 %              | 0.703922                 | 30721.5                   |
| 3          | 3.4 %                | 0.643349                 | 29723.2                   |
| 4          | 3.739 %              | 0.680162                 | 28402.1                   |
| 5+         | 10.63 %              | 0.682998                 | 30779.4                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 63.77 %                | 0.753632                 | 19890–29670        |
| mid                                    | 9.828 %                | 0.6097                   | 29670–31500        |
| high                                   | 26.41 %                | 0.771932                 | 31500–65140        |

**M2/capped** — 200 draws produced, pressure ratio at the break 1 (median, 1–1)

First break: 200 events, largest child 87.58 % of parent mass (median), cloud 0.1595 %, 4 distinct children (median).
Later breaks: 16513 events, largest child 61.54 % of parent mass (median), cloud 7.7 %, 3 distinct children (median).

Where the body's mass ends up — **landed** solid 25.31 %, **landed** cloud 0 %, **settled mid-flight (never reaches the ground)** 74.69 %, dust 0 %; 0 breaks folded wholly into the aggregated tail (rule 1150).

| Generation | share of landed mass | median retained fraction | median birth altitude (m) |
| ---------- | -------------------- | ------------------------ | ------------------------- |
| 1          | 5.406 %              | 0.611789                 | 61316.1                   |
| 2          | 2.054 %              | 0.62845                  | 30801.5                   |
| 3          | 3.633 %              | 0.692979                 | 28690.8                   |
| 4          | 5.041 %              | 0.657546                 | 27371                     |
| 5+         | 9.176 %              | 0.607905                 | 33182.8                   |

| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |
| -------------------------------------- | ---------------------- | ------------------------ | ------------------ |
| low                                    | 69.28 %                | 0.793421                 | 20050–31290        |
| mid                                    | 8.386 %                | 0.764848                 | 31290–34920        |
| high                                   | 22.34 %                | 0.577485                 | 34920–65120        |
