# FCM round 1 — the registered tuning (rule 1160)

Rule 1160 (`src/physics/validation/fcmRound1Rules.ts`), written after the untuned development runs and
before any tuned one; read by `scripts/fcm-tuning-verdict.ts` from the three runs. The objective: the median
landed mass of Chelyabinsk within 1 667–15 000 kg and of Tagish Lake within 60–1 300 kg, in the same
configuration; the constraint: no case’s main flare worse than untuned. T1: the cloud share on 0.5–0.85;
T2: the same and α on 0.05–0.3.

| Configuration | Untuned: Chelyabinsk · Tagish Lake | T1: Chelyabinsk · Tagish Lake | T1 meets                                                  | T2: Chelyabinsk · Tagish Lake | T2 meets                                                  |
| ------------- | ---------------------------------- | ----------------------------- | --------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| M1/unlimited  | 24200 kg · 6754 kg                 | 5139 kg · 2712 kg ✗           | **no** (main flare worse: 2022 EB5 (favourable to equal)) | 1444 kg ✗ · 1325 kg ✗         | **no**                                                    |
| M1/capped     | 452800 kg · 6747 kg                | 141000 kg ✗ · 3023 kg ✗       | **no** (main flare worse: 2022 EB5 (favourable to equal)) | 30060 kg ✗ · 1317 kg ✗        | **no** (main flare worse: 2022 EB5 (favourable to equal)) |
| M2/unlimited  | 425000 kg · 8608 kg                | 60310 kg ✗ · 5045 kg ✗        | **no**                                                    | 23440 kg ✗ · 3768 kg ✗        | **no**                                                    |
| M2/capped     | 382500 kg · 10040 kg               | 43360 kg ✗ · 5330 kg ✗        | **no**                                                    | 17110 kg ✗ · 4168 kg ✗        | **no**                                                    |

Neither candidate meets the objective in any configuration. By rule 1160 (d) the untuned priors stay, the ground outcome is declared **not credible in mass**, and the proposal limits the claim to the atmosphere. Both candidates are kept as the record of what was tried. The main flare: worse than untuned for 2022 EB5 (favourable to equal) under T1 M1/unlimited; 2022 EB5 (favourable to equal) under T1 M1/capped; 2022 EB5 (favourable to equal) under T2 M1/capped; no other case worse.
