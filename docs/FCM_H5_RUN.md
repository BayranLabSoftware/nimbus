# FCM survival–light round — H5, the residual history of surviving fragments

Rules 1188 (a) to (c) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by
`scripts/fcm-h5-run.ts` on the same 18 development cases and the same input and parameter streams as
H1’s and H3’s runs — M1/unlimited only, the configuration H3 examined. No new free parameter: every
piece’s ablation follows the same fixed σ per draw as the sealed candidate.

**Pooled, mass-weighted shares of the 5784000 kg landed across all 18 cases:**

| Bucket                              | Share     | Landed (kg) |
| ----------------------------------- | --------- | ----------- |
| Early + retained (ablation channel) | 1.995 %   | 115400      |
| Late + retained (genealogy channel) | 89.49 %   | 5176000     |
| Ablated as expected (early)         | 0.1887 %  | 10910       |
| Ablated as expected (late)          | 8.241 %   | 476700      |
| Whole body, never broke             | 0.08272 % | 4785        |

**Decision (rule 1188 (c), margin 2×):** the excess is dominated by genealogy: born already large, late in the cascade. The next causal study is break conditions, mass partition and child genealogy.

## By case

| Case                    | produced | total landed (kg) | early+retained | late+retained | ablated | whole body | median generation | median retained fraction |
| ----------------------- | -------- | ----------------- | -------------- | ------------- | ------- | ---------- | ----------------- | ------------------------ |
| Chelyabinsk (rule 961)  | 1        | 24200             | 0              | 24200         | 0       | 0          | 8                 | 0.5797                   |
| Tunguska (rule 961)     | 1        | 857000            | 0              | 857000        | 0       | 0          | 5                 | 0.7491                   |
| 2008 TC3 (rule 961)     | 200      | 2095000           | 53420          | 1928000       | 112600  | 0          | 7                 | 0.8274                   |
| 2018 LA (rule 961)      | 200      | 62160             | 6372           | 49050         | 6731    | 0          | 5                 | 0.7862                   |
| 2022 EB5 (rule 961)     | 1        | 512.8             | 0              | 42.53         | 470.3   | 0          | 11                | 0.4549                   |
| 2023 CX1 (rule 961)     | 200      | 37050             | 1077           | 32260         | 3717    | 0          | 6                 | 0.6828                   |
| 2024 BX1 (rule 961)     | 200      | 6406              | 285            | 5442          | 679.2   | 0          | 5                 | 0.7729                   |
| 2022 WJ1 (rule 961)     | 200      | 12600             | 4028           | 4010          | 712.9   | 3847       | 2                 | 0.7651                   |
| Carancas (rule 961)     | 200      | 102700            | 753            | 91070         | 10930   | 0          | 11                | 0.8213                   |
| Winchcombe (third set)  | 200      | 1132              | 251.8          | 119.1         | 19.85   | 741.4      | 1                 | 0.8006                   |
| Golden (third set)      | 200      | 3135              | 174.8          | 2502          | 458.2   | 0          | 7                 | 0.61                     |
| Madura Cave (third set) | 200      | 2233              | 1040           | 1074          | 119     | 0          | 3                 | 0.7365                   |
| Hamburg (third set)     | 200      | 3585              | 309.1          | 2911          | 364.7   | 0          | 6                 | 0.7025                   |
| Traspena (third set)    | 200      | 42700             | 0              | 36570         | 6122    | 0          | 10                | 0.6792                   |
| Cavezzo (third set)     | 200      | 353.4             | 89.38          | 63.23         | 4.43    | 196.3      | 1                 | 0.8262                   |
| Košice (W18)            | 200      | 101000            | 803.6          | 90930         | 9279    | 0          | 11                | 0.7215                   |
| Benešov (W18)           | 200      | 46730             | 0              | 39280         | 7454    | 0          | 15                | 0.7622                   |
| Tagish Lake (W18)       | 200      | 2386000           | 46760          | 2011000       | 327900  | 0          | 10                | 0.5934                   |
