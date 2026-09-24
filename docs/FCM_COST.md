# FCM round 1 — the cost on this machine

Measured by `scripts/fcm-domain-map.ts` on 2026-09-24, Apple M5, Node v22.20.0, one run at a time per process: the wall time of a map run — the reference and, where it completed, its three variations and three tails (seven flights), or the retries and tails where it did not. Not deterministic, and not part of any validation output.

| Median | 90th percentile | 99th percentile | Largest    | Total over 1028 runs |
| ------ | --------------- | --------------- | ---------- | -------------------- |
| 645 ms | 46338 ms        | 1307595 ms      | 3025615 ms | 50993 s              |
