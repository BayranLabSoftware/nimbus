# The third set — the one paired run under version 2

> Terzo insieme, versione 2 del giudice: S non adottabile secondo la versione 2: meno di due osservabili decisivi migliorano. Nessuna adozione prima della lettura del revisore; nessuna classe B da questo insieme.

Rule 1126 (`src/physics/validation/thirdSetRunRules.ts`), run once by `scripts/third-set-run.ts` on the
table of rules 1120–1125, judged by rules 1100–1119. The baseline and S decide; F is a diagnostic only,
and cannot be adopted in this round. Winchcombe is a control, counted in no decision. Nothing here
adopts a model: the reviewer reads this account first. No class B can come from this set.

> **F’s warning (rule 1097)** goes with its readings below: its masses carry no ablation and are not
> comparable with a recovered mass; its release altitude is no comparable result (rule 1094).

> **Closed (rule 1127).** The reviewer confirmed the verdict; the audit re-derives it from this record
> apart from the judge’s functions (`thirdSetAudit.ts`, tested on every commit).

## The verdict (rules 1115, 1119)

- **O1**: comparable on 4 bodies of the priors’ domain (Golden, Madura Cave, Hamburg, Traspena) — assessable; S gains 0 (none) and loses 0 (none) — improves: no, worsens: no.
- **The ground outcome**: D1 on 5 bodies, gain 57.1 %; J admissible on 0; worsening by arrivals at the law’s speeds: no — improves: yes, worsens: no.
- **S**: non adottabile secondo la versione 2: meno di due osservabili decisivi migliorano.

## O1, body by body (rules 1104, 1111, 1125, 1126 (d))

| Body                 | Interval (km) | Model    | Produced · excluded · not produced · not convergent | 5–95 % band (km) | Compatible | Paired produced | Comparable | Width on the paired draws (km) |
| -------------------- | ------------- | -------- | --------------------------------------------------- | ---------------- | ---------- | --------------- | ---------- | ------------------------------ |
| Winchcombe (control) | 34.5–35.5     | baseline | 1000 · 0 · 0 · 0                                    | 57.27–61.77      | no         | 460             | yes        | 3.76                           |
|                      |               | S        | 460 · 0 · 540 · 0                                   | 35.30–36.70      | yes        |                 |            | 1.40                           |
| Golden               | 29.5–34.5     | baseline | 1000 · 0 · 0 · 0                                    | 37.53–37.89      | yes        | 1000            | yes        | 0.36                           |
|                      |               | S        | 1000 · 0 · 0 · 0                                    | 38.47–39.26      | yes        |                 |            | 0.79 (voids the gain)          |
| Madura Cave          | 25.75–35.85   | baseline | 831 · 0 · 169 · 0                                   | 29.23–32.60      | yes        | 831             | yes        | 3.38                           |
|                      |               | S        | 1000 · 0 · 0 · 0                                    | 35.91–36.81      | yes        |                 |            | 0.84                           |
| Hamburg              | 21.65–24.15   | baseline | 1000 · 0 · 0 · 0                                    | 35.15–35.78      | no         | 1000            | yes        | 0.62                           |
|                      |               | S        | 1000 · 0 · 0 · 0                                    | 36.50–37.59      | no         |                 |            | 1.09 (voids the gain)          |
| Traspena             | 28.535–35.325 | baseline | 1000 · 0 · 0 · 0                                    | 34.67–35.75      | yes        | 1000            | yes        | 1.08                           |
|                      |               | S        | 1000 · 0 · 0 · 0                                    | 35.05–36.06      | yes        |                 |            | 1.01                           |
| Cavezzo              | 30.65–32.65   | baseline | 0 · 0 · 1000 · 0                                    | —                | no         | 0               | no         | —                              |
|                      |               | S        | 883 · 0 · 117 · 0                                   | 34.23–35.96      | yes        |                 |            | —                              |

## The ground, body by body (rules 1103, 1108–1110, 1116, 1117)

D1 is the share of draws on which material arrives; J — not admissible here — is published beside; the
last share is of draws with an arrival at the crater law’s speeds (a crater, or for S and F a fast
arrival), not a share of craters; D3 describes, over the arriving draws, those in dark flight.

| Body        | Model          | D1      | J (beside) | Arrivals at the law’s speeds | Computed craters · draws in the law’s domain | D3 (description) | Classes: draws with crater · fast · between · dark flight |
| ----------- | -------------- | ------- | ---------- | ---------------------------- | -------------------------------------------- | ---------------- | --------------------------------------------------------- |
| Winchcombe  | baseline       | 0.0 %   | 0.0 %      | 0.0 %                        | 0 · 1000                                     | not assessable   | 0.0 % · 0.0 % · 0.0 % · 0.0 %                             |
|             | S              | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
| Golden      | baseline       | 0.0 %   | 0.0 %      | 0.0 %                        | 0 · 1000                                     | not assessable   | 0.0 % · 0.0 % · 0.0 % · 0.0 %                             |
|             | S              | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
| Madura Cave | baseline       | 16.9 %  | 16.9 %     | 0.0 %                        | 0 · 831                                      | not assessable   | 0.0 % · 0.0 % · 0.0 % · 16.9 %                            |
|             | S              | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
| Hamburg     | baseline       | 0.0 %   | 0.0 %      | 0.0 %                        | 0 · 1000                                     | not assessable   | 0.0 % · 0.0 % · 0.0 % · 0.0 %                             |
|             | S              | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
| Traspena    | baseline       | 0.0 %   | 0.0 %      | 0.0 %                        | 0 · 1000                                     | not assessable   | 0.0 % · 0.0 % · 0.0 % · 0.0 %                             |
|             | S              | 2.3 %   | 2.3 %      | 0.0 %                        | 0 · 977                                      | not assessable   | 0.0 % · 0.0 % · 0.0 % · 2.3 %                             |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
| Cavezzo     | baseline       | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | S              | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |
|             | F (diagnostic) | 100.0 % | 100.0 %    | 0.0 %                        | 0 · 0                                        | 100.0 %          | 0.0 % · 0.0 % · 0.0 % · 100.0 %                           |

## Diagnostics (rule 1126 (g)) — deciding nothing

### O2: the largest piece at the ground, beside the recovered mass (a lower bound everywhere)

| Body        | Recovered            | Model          | Draws with a piece | Median largest piece | 5–95 %            |
| ----------- | -------------------- | -------------- | ------------------ | -------------------- | ----------------- |
| Winchcombe  | 339 g, lower bound   | baseline       | 0.0 %              | —                    | —                 |
|             |                      | S              | 100.0 %            | 5.943 kg             | 4.21–8.153 kg     |
|             |                      | F (diagnostic) | 100.0 %            | 0.1879 kg            | 0.01186–0.7306 kg |
| Golden      | 1270 g, lower bound  | baseline       | 0.0 %              | —                    | —                 |
|             |                      | S              | 100.0 %            | 22.32 kg             | 17.55–26.58 kg    |
|             |                      | F (diagnostic) | 100.0 %            | 15.08 kg             | 3.272–36.37 kg    |
| Madura Cave | 1072 g, lower bound  | baseline       | 16.9 %             | 29.1 kg              | 24.67–35.89 kg    |
|             |                      | S              | 100.0 %            | 21.66 kg             | 13.98–30 kg       |
|             |                      | F (diagnostic) | 100.0 %            | 16.47 kg             | 5.374–32.14 kg    |
| Hamburg     | 102.6 g, lower bound | baseline       | 0.0 %              | —                    | —                 |
|             |                      | S              | 100.0 %            | 25.31 kg             | 16.93–32.69 kg    |
|             |                      | F (diagnostic) | 100.0 %            | 16.87 kg             | 4.726–40.65 kg    |
| Traspena    | 527 g, lower bound   | baseline       | 0.0 %              | —                    | —                 |
|             |                      | S              | 2.3 %              | 22.02 kg             | 17.22–25.14 kg    |
|             |                      | F (diagnostic) | 100.0 %            | 65.7 kg              | 6.486–234.7 kg    |
| Cavezzo     | 52.2 g, lower bound  | baseline       | 100.0 %            | 3.821 kg             | 2.57–5.454 kg     |
|             |                      | S              | 100.0 %            | 1.91 kg              | 1.285–2.727 kg    |
|             |                      | F (diagnostic) | 100.0 %            | 3.821 kg             | 2.57–5.454 kg     |

**Read with caution (rule 1127 (b)).** That S’s median largest piece is 17 to 250 times the recovered
mass measures no overestimate of the mass that reached the ground: every recovered mass is a lower
bound. It is a sign of the comparison’s limit and of the missing ablation, not a verdict of accuracy on
O2.

### O3 on Hamburg: the median number of pieces heavier than each quartile of Table 4’s 25 masses

Quartiles 6.5 g, 13.8 g, 26 g: baseline 0 · 0 · 0; S 1 · 1 · 1; F 3 · 3 · 3; recovered 18 · 12 · 6 of 25.

### F’s account and release altitude (rules 1094, 1096 (b))

| Body        | Started | Completed | Not completed | Release altitudes not converging |
| ----------- | ------- | --------- | ------------- | -------------------------------- |
| Winchcombe  | 1000    | 1000      | 0             | 0                                |
| Golden      | 1000    | 1000      | 0             | 2                                |
| Madura Cave | 1000    | 1000      | 0             | 0                                |
| Hamburg     | 1000    | 1000      | 0             | 1                                |
| Traspena    | 1000    | 1000      | 0             | 0                                |
| Cavezzo     | 1000    | 1000      | 0             | 0                                |

Every draw’s release altitude at 50, 100 and 200 m is in `thirdSetRun.json`; no aggregate of it is comparable.

## The stress run (rule 934 (c)) — reported, never scored

| Body        | Mass    | Baseline: O1 compatible · D1 | S: O1 compatible · D1 |
| ----------- | ------- | ---------------------------- | --------------------- |
| Winchcombe  | mass ×3 | no · 0.0 %                   | yes · 100.0 %         |
| Winchcombe  | mass ÷3 | no · 0.0 %                   | no · 100.0 %          |
| Golden      | mass ×3 | yes · 0.0 %                  | yes · 100.0 %         |
| Golden      | mass ÷3 | yes · 0.0 %                  | yes · 100.0 %         |
| Madura Cave | mass ×3 | yes · 0.0 %                  | yes · 100.0 %         |
| Madura Cave | mass ÷3 | yes · 98.3 %                 | yes · 100.0 %         |
| Hamburg     | mass ×3 | no · 0.0 %                   | no · 100.0 %          |
| Hamburg     | mass ÷3 | no · 0.0 %                   | no · 100.0 %          |
| Traspena    | mass ×3 | yes · 0.0 %                  | yes · 0.0 %           |
| Traspena    | mass ÷3 | yes · 0.0 %                  | yes · 98.7 %          |
| Cavezzo     | mass ×3 | no · 100.0 %                 | yes · 100.0 %         |
| Cavezzo     | mass ÷3 | no · 100.0 %                 | no · 100.0 %          |
