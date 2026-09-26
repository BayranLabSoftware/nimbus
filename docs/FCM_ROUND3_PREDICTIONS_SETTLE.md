# FCM round 3 — the predictions, before any target

Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (e)(3) — beside the sealed engine’s predictions of `docs/FCM_ROUND3_PREDICTIONS.md`, never against round 3’s targets.

Rule 1168 (d) (`src/physics/validation/fcmRound3Charter.ts`), run by `scripts/fcm-round3-predict.ts` from the
inputs of `fcmRound3Sources.ts` alone, pushed before any target is extracted. The sealed candidate (rule
1162), 200 input draws per event; the release is the main peak on the 1 km window, robust draws only
(rule 1163 (c)); medians with their 5th–95th percentiles, in km. Benenitra is not here: its kind fell
(rule 1176 (c)). For Grimsby, Bunburra Rockhole, Mason Gully and Neuschwanstein the analyst has seen
their targets before these predictions (rule 1177 (a)); the predictions are the script’s, from inputs alone.

## Aguas Zarcas

Inputs: diameter 0.609 (0.4933–0.7377) m, speed 14.53 (13.57–15.57) km/s, angle 81.1 (78.76–83.57)°, density 2200 (2200–2200) kg/m³ — in the domain.

| Configuration              | produced | not robust | release, 1976 (km)  | release, exponential (km) |
| -------------------------- | -------- | ---------- | ------------------- | ------------------------- |
| M1/unlimited               | 1        | 0.035      | 32.52 (27.51–37.27) | 34.98 (28.61–41.13)       |
| M1/capped                  | 1        | 0.025      | 32.88 (27.18–37.78) | 35.67 (27.98–41.6)        |
| M2/unlimited               | 1        | 0.015      | 33.14 (27.16–37.77) | 36.03 (27.91–41.7)        |
| M2/capped                  | 1        | 0.03       | 33.38 (27.15–37.58) | 36.3 (28.12–41.47)        |
| **mixture, equal weights** |          |            | 32.97 (27.16–37.63) | 35.73 (28.05–41.57)       |

Weights: M1/unlimited at 0.55: 32.86 (27.17–37.59); M1/capped at 0.55: 32.93 (27.16–37.76); M2/unlimited at 0.55: 33.05 (27.16–37.76); M2/capped at 0.55: 33.09 (27.16–37.59); the monolith alone 32.68 (27.19–37.63); the structured body alone 33.22 (27.14–37.67).

Baseline (Collins): bursts in 1 of the draws, at 55.34 (54.24–56.55) km.

## Grimsby

Inputs: diameter 0.2533 (0.212–0.3186) m, speed 20.9 (20.9–20.9) km/s, angle 55.2 (55.2–55.2)°, density 3370 (3370–3370) kg/m³ — in the domain.

| Configuration              | produced | not robust | release, 1976 (km)  | release, exponential (km) |
| -------------------------- | -------- | ---------- | ------------------- | ------------------------- |
| M1/unlimited               | 1        | 0.015      | 37.4 (32.4–42.87)   | 41.11 (34.55–47.53)       |
| M1/capped                  | 1        | 0.025      | 37.29 (31.98–42.74) | 40.98 (34.09–47.51)       |
| M2/unlimited               | 1        | 0.015      | 36.22 (32.11–42.75) | 39.87 (34.27–47.46)       |
| M2/capped                  | 1        | 0.03       | 36.99 (31.93–42.9)  | 40.74 (34.14–47.85)       |
| **mixture, equal weights** |          |            | 37.01 (32.1–42.84)  | 40.7 (34.23–47.55)        |

Weights: M1/unlimited at 0.55: 37.13 (32.25–42.87); M1/capped at 0.55: 37.12 (32.01–42.82); M2/unlimited at 0.55: 36.8 (32.04–42.82); M2/capped at 0.55: 37.01 (32.01–42.87); the monolith alone 37.33 (32.14–42.83); the structured body alone 36.69 (32.03–42.87).

Baseline (Collins): bursts in 1 of the draws, at 40.26 (39.97–40.44) km.

## Bunburra Rockhole

Inputs: diameter 0.2526 (0.202–0.3066) m, speed 13.3 (13.3–13.3) km/s, angle 31.2 (31.2–31.2)°, density 2700 (2700–2700) kg/m³ — in the domain.

| Configuration              | produced | not robust | release, 1976 (km)  | release, exponential (km) |
| -------------------------- | -------- | ---------- | ------------------- | ------------------------- |
| M1/unlimited               | 1        | 0.005      | 30.53 (26.01–36.12) | 32.73 (28.76–39.4)        |
| M1/capped                  | 1        | 0.005      | 30.51 (25.87–36.09) | 33.02 (28.31–39.29)       |
| M2/unlimited               | 1        | 0          | 30.63 (26.67–36.28) | 33.7 (29.66–39.55)        |
| M2/capped                  | 1        | 0.015      | 31.06 (26.95–35.92) | 34.03 (29.57–39.22)       |
| **mixture, equal weights** |          |            | 30.64 (26.31–36.12) | 33.44 (28.96–39.36)       |

Weights: M1/unlimited at 0.55: 30.56 (26.15–36.12); M1/capped at 0.55: 30.62 (26.06–36.12); M2/unlimited at 0.55: 30.64 (26.56–36.23); M2/capped at 0.55: 30.85 (26.4–36.07); the monolith alone 30.51 (25.99–36.12); the structured body alone 30.91 (26.71–36.15).

Baseline (Collins): bursts in 0 of the draws, at — km.

## Mason Gully

Inputs: diameter 0.2839 (0.2332–0.3506) m, speed 14.5 (14.5–14.5) km/s, angle 53.9 (53.9–53.9)°, density 3320 (3320–3320) kg/m³ — in the domain.

| Configuration              | produced | not robust | release, 1976 (km)  | release, exponential (km) |
| -------------------------- | -------- | ---------- | ------------------- | ------------------------- |
| M1/unlimited               | 1        | 0          | 31.57 (25.85–37.73) | 33.54 (25.9–41.56)        |
| M1/capped                  | 1        | 0.015      | 31.91 (25.73–37.94) | 33.99 (25.15–41.82)       |
| M2/unlimited               | 1        | 0.005      | 32.83 (25.37–37.95) | 35.35 (26.02–41.82)       |
| M2/capped                  | 1        | 0.01       | 32.62 (25.75–37.86) | 35.08 (25.86–41.74)       |
| **mixture, equal weights** |          |            | 32.24 (25.71–37.85) | 34.48 (25.82–41.71)       |

Weights: M1/unlimited at 0.55: 31.99 (25.81–37.81); M1/capped at 0.55: 32.06 (25.71–37.94); M2/unlimited at 0.55: 32.5 (25.56–37.94); M2/capped at 0.55: 32.4 (25.71–37.85); the monolith alone 31.75 (25.8–37.82); the structured body alone 32.73 (25.56–37.94).

Baseline (Collins): bursts in 0.845 of the draws, at 32.09 (29.72–33.15) km.

## Neuschwanstein

Inputs: diameter 0.5568 (0.444–0.6751) m, speed 21 (21–21) km/s, angle 49.7 (49.7–49.7)°, density 3490 (3490–3490) kg/m³ — in the domain.

| Configuration              | produced | not robust | release, 1976 (km)  | release, exponential (km) |
| -------------------------- | -------- | ---------- | ------------------- | ------------------------- |
| M1/unlimited               | 1        | 0.025      | 36.99 (32.35–42.3)  | 40.7 (34.97–46.97)        |
| M1/capped                  | 1        | 0.085      | 37.17 (32.36–42.43) | 41.03 (34.96–47.14)       |
| M2/unlimited               | 1        | 0.035      | 37.71 (32.78–42.25) | 41.72 (35.55–47.22)       |
| M2/capped                  | 1        | 0.055      | 37.65 (32.54–42.76) | 41.52 (35.15–47.58)       |
| **mixture, equal weights** |          |            | 37.28 (32.45–42.57) | 41.25 (35.09–47.34)       |

Weights: M1/unlimited at 0.55: 37.21 (32.38–42.44); M1/capped at 0.55: 37.2 (32.37–42.53); M2/unlimited at 0.55: 37.46 (32.57–42.44); M2/capped at 0.55: 37.46 (32.46–42.66); the monolith alone 37.07 (32.34–42.35); the structured body alone 37.67 (32.71–42.61).

Baseline (Collins): bursts in 1 of the draws, at 40.41 (40.19–40.55) km.
