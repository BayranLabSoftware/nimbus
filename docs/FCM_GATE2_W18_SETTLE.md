# FCM round, gate 2 (c) — W18’s structured bodies

Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (d) — development only, beside the sealed engine’s run of `docs/FCM_GATE2_W18.md`.

Rule 1142 (c) (`src/physics/validation/fcmRoundRules.ts`), run by `scripts/fcm-gate2-w18.ts` —
development, begun before the reviewer has read the round’s dossier (rule 1147). W18’s figures, which
hold the groups’ exact shares and strengths, are images and are not read: each structure is rebuilt
from W18’s text. Where the text gives a range, the case is run at the middle (the nominal) and at
every corner of the ranges; where it is silent, a choice is listed, or — for a parameter that matters —
a declared development range is explored like W18’s. Each row is a partial comparison (rule 1142
(d)): whether the branch, given the structure W18 describes, can behave as W18 says its own did —
the flares’ altitudes within 1 km on the 1 km profile, the peak, the landed mass.

Rule 1159’s reading: **W18 partial, with its discrepancies named** — rebuilding W18’s groups from its text
and trying the corners of its ranges is a study of sensitivity, not a reproduction with W18’s parameters,
which W18 does not print. No corner is selected afterwards: every one is counted below, and the few that
meet a case’s targets together may inform the development tuning, never stand for the gate.

The uncertainty of reading: W18 gives its flares in words («around 37 km», «near 53 km», «around 32 and 36
km»), read here ±1 km; its figures are not read at all. Where several peaks, the figures’ resolution or the
parameters W18 leaves unsaid do not let the 1 km criterion decide, it is **not applicable**, and the
comparison says what the branch does, not whether it passes. The Chelyabinsk band 67–109 kt/km is derived
from W18’s luminous efficiencies (13–21 % about 17 %), not printed by W18.

## Košice

What W18 states:

- 3 500 kg, 15.0 km/s, 60°, bulk 2 500 kg/m³ and 1.388 m, rubble 3 400 kg/m³;
- disrupted at 1.8–2 kPa into four groups, no debris;
- the main piece ~80 %, breaking at ~1.15 MPa, α 0.3, cloud 50 %;
- two pieces of ~2–4 % each (4–6 % together), at 35–40 kPa (α 0.1) and 55–70 kPa (α 0.6–0.8);
- 300–600 pieces, 14–16 %, α 2, cloud 0.2 %, breaking at the top of the profile;
- cloud 40–60 % (50 % shown), splits ~80/20, σ 1·10⁻⁸ s²/m², C_disp 2;
- the large lower flare at ~37 km, the smaller upper flare near 53 km;

Explored at the ends of their ranges:

- each small piece’s share (2–4 %, 4–6 % together): 0.02 to 0.03;
- the weaker small piece’s strength (Pa): 35000 to 40000;
- the stronger small piece’s strength (Pa): 55000 to 70000;
- the stronger small piece’s α: 0.6 to 0.8;
- the cloud share of the main flares’ breaks: 0.4 to 0.6;
- the rubble’s share: 0.14 to 0.16;
- the rubble’s pieces: 300 to 600;

Chosen where W18 is silent:

- disruption at 1.9 kPa; the main piece the remainder of the shares (≈ 78–82 %), as «no debris» asks;
- the rubble’s strength the disruption’s, 1.9 kPa («at the top of the observed profile»);
- two fragments per break (not stated for Košice);

The nominal: 3500 kg, 0.09412 kt at entry, 0.09465 kt deposited; 48631 components; the main peak 0.02184 kt/km at 35.5 km; the flares (1 km profile, above 5 % of the peak): 0.0218 at 35.5 km.

The groups’ first breaks, nominal, in the order above: 38.3 km, 64.9 km, 60.9 km, 84.8 km.

Over the 128 corners and the nominal: the peak 0.0187–0.0227 kt/km at 35.5–35.5 km; landed 177–232 kg; the largest piece 2.91–3.69 kg.

W18’s flares: 37 km — nominal **not within 1 km**, found within 1 km in 0 of 128 corners; 53 km — nominal **not within 1 km**, found within 1 km in 0 of 128 corners.

Every count at once — the flares within 1 km: the nominal **does not**; 0 of 128 corners do.

Every corner, as a distribution (128 corners):

| Quantity           | least  | first quartile | median | third quartile | most   |
| ------------------ | ------ | -------------- | ------ | -------------- | ------ |
| main peak (kt/km)  | 0.0187 | 0.0194         | 0.0213 | 0.022          | 0.0227 |
| its altitude (km)  | 35.5   | 35.5           | 35.5   | 35.5           | 35.5   |
| landed (kg)        | 177    | 199            | 209    | 211            | 232    |
| largest piece (kg) | 2.91   | 2.99           | 3.02   | 3.02           | 3.1    |

Each target alone: the flare near 37 km: 0 of 128; the flare near 53 km: 0 of 128.

The ledger’s worst residual over every run: 4.3e-16.

## Chelyabinsk

What W18 states:

- 19.8 m, 19.16 km/s, 18.3°; bulk 2 200–2 600 kg/m³, rubble 3 300 kg/m³; six groups;
- debris of 0.2–0.3 % released at 0.5–0.6 MPa; a weak group of 0.25 % breaking near 45 km (~0.6 MPa);
- the main group ~93 %, from 1.4–1.6 MPa, cloud 75–85 % at each break;
- 10–30 rubble pieces of ~0.1–0.3 % each, strengths 1.75–3.5 MPa;
- a strong group of ~2.4–2.5 % at 15.5 MPa, α ~0.07, cloud ~75 %, splits ~60/40;
- C_disp 1.5–2.5, σ 4–8·10⁻⁹ s²/m²; the fits inside the observed band, whose nominal peak is 83 kt/km;
- landed 5 600 kg in the case shown (5 000–6 500 over the fits), pieces from 9 g to ~340 kg;

Explored at the ends of their ranges:

- the bulk density (kg/m³): 2200 to 2600;
- C_disp: 1.5 to 2.5;
- σ (s²/m²): 4e-9 to 8e-9;
- the main group’s cloud share: 0.75 to 0.85;
- the main group’s strength (Pa): 1400000 to 1600000;
- the initial debris: 0.002 to 0.003;
- the main group’s α (W18’s Chelyabinsk values run from < 0.1 to 0.3–0.5): 0.05 to 0.3 — **not stated by W18**, a development range;
- the weak group’s α (W18’s Chelyabinsk values, < 0.1 to 0.3–0.5): 0.08 to 0.5 — **not stated by W18**, a development range;
- the weak group’s cloud share (W18’s low values of 10–30 % to the 75 % of its alternative): 0.2 to 0.75 — **not stated by W18**, a development range;

Chosen where W18 is silent:

- disruption at 0.55 MPa; the main group the remainder (≈ 93 %);
- the weak group one piece at 0.6 MPa, splits 60/40;
- the main group one piece, splits 60/40; the rubble 7, 7 and 5 pieces (0.2, 0.2, 0.26 %) at 1.75, 2.5 and 3.5 MPa with the main group’s α, cloud and split;
- the strong group three pieces of 0.8 %;

The nominal: 9755000 kg, 427.9 kt at entry, 429.6 kt deposited; 626 components; the main peak 67.79 kt/km at 32.5 km; the flares (1 km profile, above 5 % of the peak): 67.8 at 32.5 km; 5.55 at 23.5 km.

The groups’ first breaks, nominal, in the order above: 46.4 km, 39.8 km, 38.7 km, 36.3 km, 34 km, 23.8 km.

Over the 512 corners and the nominal: the peak 47.1–94.6 kt/km at 28.5–32.5 km; landed 3280–31200 kg; the largest piece 368–1520 kg.

The peak W18’s fit matched, 83 kt/km: inside the envelope.

Landed: nominal 7660 kg against W18’s 5600 kg (5000–6500 over its fits) — **outside** that range; the envelope reaches it. The largest piece: nominal 580 kg against W18’s 340 kg.

Where the landed mass comes from, W18’s shown case against the nominal:

| Group                                        | Share of the landed mass, W18 | nominal | over the corners | Share of the group’s mass landed, W18 | nominal | over the corners |
| -------------------------------------------- | ----------------------------- | ------- | ---------------- | ------------------------------------- | ------- | ---------------- |
| the weak group (0.25 %, breaking near 45 km) | ~50 %                         | 3.5 %   | 0.018 %–30 %     | ~18 %                                 | 1.1 %   | 0.011 %–13 %     |
| the main group (93 %)                        | ~40 %                         | 13 %    | 0.45 %–50 %      | ~0.04 %                               | 0.011 % | 0.00025 %–0.17 % |
| the strong group (2.4 %)                     | ~9 %                          | 63 %    | 21 %–95 %        | ~0.4 %                                | 2.1 %   | 1.4 %–3 %        |

Every count at once — the peak inside the observed band, 67.2–109 kt/km, the landed mass inside W18’s range: the nominal **does not**; 6 of 512 corners do.

Every corner, as a distribution (512 corners):

| Quantity           | least | first quartile | median | third quartile | most  |
| ------------------ | ----- | -------------- | ------ | -------------- | ----- |
| main peak (kt/km)  | 47.1  | 59             | 68.5   | 78.1           | 94.6  |
| its altitude (km)  | 28.5  | 30.5           | 30.5   | 30.5           | 32.5  |
| landed (kg)        | 3280  | 6840           | 9130   | 15500          | 31200 |
| largest piece (kg) | 368   | 435            | 769    | 909            | 1520  |

Each target alone: the peak in 67.2–109 kt/km: 256 of 512; the landed mass in 5000–6500 kg: 16 of 512.

The ledger’s worst residual over every run: 5.3e-16.

## Tagish Lake

What W18 states:

- 7.8·10⁴ kg (fitted), 4.5 m at 1 640 kg/m³, 15.8 km/s, 18°; fifteen groups; C_disp 1;
- the final flare (~32 km): 48–50 % at 2.5–3.6 MPa, all debris, in three groups;
- the flare at ~36 km: ~38 % at 0.9–1.9 MPa, 98–100 % debris, in three groups; fragments α < 0.05;
- the small flare at ~47 km: 4.6 % at ~0.14 MPa, cloud 80 %, α 0.3; another 2–3 % between 45 and 40 km;
- above: 4.5–7 % breaking at 1–90 kPa, a handful of small pieces, α 0.1, two fragments, cloud 20 %;
- landed 190 kg in the case shown (100–1 000 kg over the fits), the largest 2 kg;

Explored at the ends of their ranges:

- the final flare’s share: 0.48 to 0.5;
- the debris share of the 36 km flare’s breaks: 0.98 to 1;
- the main flares’ fragments’ α (< 0.05): 0.01 to 0.05;
- the share breaking between 45 and 40 km: 0.02 to 0.03;
- the upper share, breaking at 1–90 kPa: 0.045 to 0.07;
- σ (s²/m²), the dossier’s prior (rule 1131): 1e-9 to 1.6e-8 — **not stated by W18**, a development range;

Chosen where W18 is silent:

- the final flare in three equal groups at 2.5, 3.05, 3.6 MPa; the 36 km flare, the remainder (≈ 36–40 %), at 0.9, 1.4, 1.9 MPa;
- splits 50/50 where unstated; the 2–3 % between 45 and 40 km one piece at 0.3 MPa, as the small flare’s group;
- the upper share in seven pieces at 1 to 90 kPa, log-spaced (fifteen groups in all); disruption at 1 kPa, no debris;

The nominal: 78000 kg, 2.327 kt at entry, 2.338 kt deposited; 460868 components; the main peak 0.2955 kt/km at 32.5 km; the flares (1 km profile, above 5 % of the peak): 0.296 at 32.5 km; 0.203 at 34.5 km; 0.177 at 36.5 km; 0.172 at 38.5 km; 0.0332 at 46.5 km; 0.032 at 51.5 km.

The groups’ first breaks, nominal, in the order above: 33.3 km, 31.9 km, 30.7 km, 40.5 km, 37.3 km, 35.2 km, 55.1 km, 48.6 km, 89.1 km, 84.9 km, 80.2 km, 75.3 km, 70.2 km, 64.8 km, 58.7 km.

Over the 64 corners and the nominal: the peak 0.276–0.299 kt/km at 30.5–32.5 km; landed 18.1–149 kg; the largest piece 0.48–3.16 kg.

W18’s flares: 32 km — nominal at 32.5 km, found within 1 km in 32 of 64 corners; 36 km — nominal at 36.5 km, found within 1 km in 64 of 64 corners; 47 km — nominal at 46.5 km, found within 1 km in 64 of 64 corners.

Landed: nominal 50.2 kg against W18’s 190 kg (100–1000 over its fits) — **outside** that range; the envelope reaches it. The largest piece: nominal 1.23 kg against W18’s 2 kg.

Every count at once — the flares within 1 km, the landed mass inside W18’s range: the nominal **does not**; 0 of 64 corners do.

Every corner, as a distribution (64 corners):

| Quantity           | least | first quartile | median | third quartile | most  |
| ------------------ | ----- | -------------- | ------ | -------------- | ----- |
| main peak (kt/km)  | 0.276 | 0.284          | 0.29   | 0.29           | 0.299 |
| its altitude (km)  | 30.5  | 30.5           | 32.5   | 32.5           | 32.5  |
| landed (kg)        | 18.1  | 24             | 124    | 135            | 149   |
| largest piece (kg) | 0.48  | 2.08           | 3.16   | 3.16           | 3.16  |

Each target alone: the flare near 32 km: 32 of 64; the flare near 36 km: 64 of 64; the flare near 47 km: 64 of 64; the landed mass in 100–1000 kg: 32 of 64.

The ledger’s worst residual over every run: 6.6e-16.
