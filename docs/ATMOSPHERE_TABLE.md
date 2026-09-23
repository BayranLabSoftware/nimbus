# The entry’s two atmospheres

Rule 913 of `src/physics/validation/entryAtmosphereRules.ts`, published before rule 914 compares the two branches on any fireball. Written by `scripts/atmosphere-table.ts`; its test holds this file to the code.

- **Collins**: Collins, Melosh & Marcus (2005), Eq. 5 — ρ = ρ0 e^(−z/H), ρ0 = 1 kg/m³, H = 8 km (the legacy branch A).
- **USSA 1976**: the U.S. Standard Atmosphere 1976 (NOAA-S/T 76-1562), from its defining constants below 86 km, as `src/physics/effects/ussa1976Entry.ts` computes it; its test holds it to the standard’s printed Table I within the last printed digit.

## Density and pressure, 20 to 80 km (geometric altitude)

| Altitude (km) | Collins ρ (kg/m³) | USSA ρ (kg/m³) | Collins / USSA | USSA P (Pa) |
| ---: | ---: | ---: | ---: | ---: |
| 20 | 8.208 × 10^-2 | 8.891 × 10^-2 | 0.923 | 5.529 × 10^3 |
| 25 | 4.394 × 10^-2 | 4.008 × 10^-2 | 1.096 | 2.549 × 10^3 |
| 30 | 2.352 × 10^-2 | 1.841 × 10^-2 | 1.277 | 1.197 × 10^3 |
| 35 | 1.259 × 10^-2 | 8.463 × 10^-3 | 1.487 | 5.746 × 10^2 |
| 40 | 6.738 × 10^-3 | 3.996 × 10^-3 | 1.686 | 2.871 × 10^2 |
| 45 | 3.607 × 10^-3 | 1.966 × 10^-3 | 1.834 | 1.491 × 10^2 |
| 50 | 1.930 × 10^-3 | 1.027 × 10^-3 | 1.880 | 7.978 × 10^1 |
| 55 | 1.033 × 10^-3 | 5.681 × 10^-4 | 1.819 | 4.253 × 10^1 |
| 60 | 5.531 × 10^-4 | 3.097 × 10^-4 | 1.786 | 2.196 × 10^1 |
| 65 | 2.960 × 10^-4 | 1.632 × 10^-4 | 1.814 | 1.093 × 10^1 |
| 70 | 1.585 × 10^-4 | 8.283 × 10^-5 | 1.913 | 5.221 × 10^0 |
| 75 | 8.482 × 10^-5 | 3.992 × 10^-5 | 2.125 | 2.388 × 10^0 |
| 80 | 4.540 × 10^-5 | 1.846 × 10^-5 | 2.460 | 1.052 × 10^0 |

## Where the dynamic pressure reaches the strengths (km)

The altitude at which ρ v² equals the strength S for a body not yet slowed (ρ = S / v²): S1, the first stage of the two-stage law (0.04–0.12 MPa, midpoint 0.069 MPa), and S2, the second (0.9–5 MPa, midpoint 2.12 MPa), Borovička, Spurný & Shrbený (2020).

| Strength | v (km/s) | Collins | USSA 1976 | Collins − USSA |
| --- | ---: | ---: | ---: | ---: |
| S1 low (0.040 MPa) | 15 | 69.08 | 64.35 | 4.73 |
| S1 low (0.040 MPa) | 20 | 73.68 | 68.64 | 5.04 |
| S1 low (0.040 MPa) | 30 | 80.17 | 74.29 | 5.88 |
| S1 mid (0.069 MPa) | 15 | 64.69 | 60.05 | 4.64 |
| S1 mid (0.069 MPa) | 20 | 69.29 | 64.55 | 4.74 |
| S1 mid (0.069 MPa) | 30 | 75.78 | 70.52 | 5.25 |
| S1 high (0.120 MPa) | 15 | 60.29 | 55.53 | 4.76 |
| S1 high (0.120 MPa) | 20 | 64.89 | 60.25 | 4.64 |
| S1 high (0.120 MPa) | 30 | 71.38 | 66.52 | 4.86 |
| S2 low (0.900 MPa) | 15 | 44.17 | 39.99 | 4.18 |
| S2 low (0.900 MPa) | 20 | 48.77 | 44.03 | 4.75 |
| S2 low (0.900 MPa) | 30 | 55.26 | 50.21 | 5.05 |
| S2 mid (2.121 MPa) | 15 | 37.31 | 34.30 | 3.01 |
| S2 mid (2.121 MPa) | 20 | 41.92 | 38.08 | 3.84 |
| S2 mid (2.121 MPa) | 30 | 48.40 | 43.70 | 4.71 |
| S2 high (5.000 MPa) | 15 | 30.45 | 28.78 | 1.67 |
| S2 high (5.000 MPa) | 20 | 35.06 | 32.51 | 2.54 |
| S2 high (5.000 MPa) | 30 | 41.54 | 37.77 | 3.78 |
