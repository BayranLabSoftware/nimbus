# FCM round 3 — the verdict

Rule 1168 (e): computed by `scripts/fcm-round3-verdict.ts` from the predictions pushed before any target
(`fcmRound3Predictions.json`, 361dfa4) and the targets extracted after (`fcmRound3Targets.ts`). It judges the
altitude of the atmospheric release and nothing else (rule 1167 (c)).

**Verdict: inconclusive** — 1 assessable event(s), 1 strong — rule 1167 asks at least 5 and 3.

## Assessable events

### Aguas Zarcas (proxy, quality A)

Observed interval 24.1–26.1 km. The branch’s mixture: median 32.97 km, 6.87 km from the interval, interval score 51.67. The baseline: median 55.34 km, 29.24 km away, interval score 585.1. Under the exponential atmosphere the branch's median is 35.73 km (9.63 km away, favourable). **Outcome: favourable.**

| Configuration | median (km) | distance (km) | produced | not robust | severe failure |
| ------------- | ----------- | ------------- | -------- | ---------- | -------------- |
| M1/unlimited  | 32.52       | 6.42          | 1        | 0.035      | no             |
| M1/capped     | 32.88       | 6.78          | 1        | 0.025      | no             |
| M2/unlimited  | 33.14       | 7.04          | 1        | 0.015      | **yes**        |
| M2/capped     | 33.38       | 7.28          | 1        | 0.03       | **yes**        |

## Not assessable, reported as diagnostics

- **Grimsby** — not judged: its kind is diagnostic. Against Jenniskens (2026)’s heights, not judged: HfKm 37.9 km — the branch -0.89 km, the baseline +2.36 km; HdKm 29 km — the branch +8.01 km, the baseline +11.26 km.
- **Bunburra Rockhole** — not judged: its kind is diagnostic. Against Jenniskens (2026)’s heights, not judged: HfKm 36 km — the branch -5.36 km, the baseline — (no burst); HdKm 33.9 km — the branch -3.26 km, the baseline — (no burst).
- **Mason Gully** — not judged: its kind is diagnostic. Against Jenniskens (2026)’s heights, not judged: HfKm 34.4 km — the branch -2.16 km, the baseline -2.31 km; HdKm 28.1 km — the branch +4.14 km, the baseline +3.99 km.
- **Neuschwanstein** — not judged: its kind is diagnostic. Against Jenniskens (2026)’s heights, not judged: HdKm 22.2 km — the branch +15.08 km, the baseline +18.21 km.
