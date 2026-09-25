# FCM survival–light round — H1 and H3, on the development cases

Rules 1180 (a), 1180 (c), 1182 (a), 1182 (b) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by
`scripts/fcm-survival-light.ts` on the same input and parameter streams as round 1’s development runs
(`fcmDevRuns.json`) — 18 cases, four configurations, 200 draws each. The light law’s two values are fixed
at 8.367 % above a component’s first break and
4.243 % at or below it (McFadden et al. 2021,
cited by Jenniskens 2026), before any comparison.

**H1**: on the 13 cases with a documented main-flare interval, the synthetic light peak sits
closer to it than the mechanical deposit peak in 3 % of the case-configuration pairs on average.
**H3**: at the median, 100 % of the landed mass under M1/unlimited is solid pieces, the rest settled cloud.

**H3, a capped-cloud finding**: round 1's `landedKg` summed solid pieces only, silently leaving out any
cloud mass that settles at the ground (D16). Where a cloud is capped at ten radii, its area — and so
its ablation rate — stops growing once the cap is reached; on the two single-draw presets this leaves
most of the body's mass unablated:

| Case        | Configuration | Solid landed (kg) | Cloud landed (kg) | Total (kg) |
| ----------- | ------------- | ----------------- | ----------------- | ---------- |
| Chelyabinsk | M1/capped     | 452800            | 4446000           | 4899000    |
| Tunguska    | M1/capped     | 763.6             | 36680000          | 36680000   |

Both are far above 10 m, outside round 3's tested domain, and neither the third set's nor the drawn
cases show it — a candidate mechanism for H2 (ablation by regime), extended to ablation by cloud
confinement: written here for when H2 is tested, not coded now.

## By case

### Chelyabinsk (rule 961)

No documented main-flare interval.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 33.06                | 33.06           | —                   | —                   | —            | 24200             | 0                 | 131.8        | 1 %           |
| M1/capped     | 27.91                | 27.91           | —                   | —                   | —            | 452800            | 4446000           | 18070        | 0 %           |
| M2/unlimited  | 30.15                | 30.15           | —                   | —                   | —            | 425000            | 0                 | 2564         | 1 %           |
| M2/capped     | 33.2                 | 33.2            | —                   | —                   | —            | 382500            | 0                 | 2938         | 1 %           |

### Tunguska (rule 961)

No documented main-flare interval.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 40.39                | 40.39           | —                   | —                   | —            | 857000            | 0                 | 72340        | 8 %           |
| M1/capped     | 34.91                | 34.91           | —                   | —                   | —            | 763.6             | 36680000          | 18.24        | 0 %           |
| M2/unlimited  | 37.92                | 37.92           | —                   | —                   | —            | 911200            | 0                 | 33840        | 4 %           |
| M2/capped     | —                    | —               | —                   | —                   | —            | —                 | —                 | —            | —             |

### 2008 TC3 (rule 961)

Documented main flare: 36.5–37.5 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 30.73                | 30.73           | 5.77                | 5.77                | 2 %          | 7119              | 0                 | 1035         | 16 %          |
| M1/capped     | 30.36                | 30.36           | 6.19                | 6.19                | 1 %          | 6999              | 0                 | 1044         | 18 %          |
| M2/unlimited  | 30.06                | 30.06           | 6.44                | 6.44                | 0 %          | 10500             | 0                 | 1291         | 16 %          |
| M2/capped     | 30.32                | 30.32           | 6.23                | 6.23                | 0 %          | 10040             | 0                 | 1324         | 16 %          |

### 2018 LA (rule 961)

Documented main flare: 28.65–28.75 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 35.02                | 35.02           | 6.27                | 6.27                | 0 %          | 170.6             | 0                 | 32.45        | 21 %          |
| M1/capped     | 35.25                | 35.25           | 6.5                 | 6.5                 | 0 %          | 163.7             | 0                 | 29.33        | 19 %          |
| M2/unlimited  | 34.22                | 34.22           | 5.47                | 5.47                | 0 %          | 331.9             | 0                 | 49.78        | 15 %          |
| M2/capped     | 34.88                | 34.88           | 6.13                | 6.13                | 0 %          | 276.2             | 0                 | 37.88        | 15 %          |

### 2022 EB5 (rule 961)

Documented main flare: 33.25–33.35 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 32.46                | 32.46           | 0.79                | 0.79                | 0 %          | 512.8             | 0                 | 0.6458       | 0 %           |
| M1/capped     | 32.36                | 32.36           | 0.89                | 0.89                | 0 %          | 3244              | 0                 | 109.6        | 3 %           |
| M2/unlimited  | 30.55                | 30.55           | 2.7                 | 2.7                 | 0 %          | 1414              | 0                 | 154.8        | 11 %          |
| M2/capped     | 34.98                | 34.98           | 1.63                | 1.63                | 0 %          | 591               | 0                 | 78.27        | 13 %          |

### 2023 CX1 (rule 961)

Documented main flare: 27.05–28.15 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 32.22                | 32.22           | 4.07                | 4.07                | 1 %          | 128.5             | 0                 | 19.57        | 16 %          |
| M1/capped     | 32.66                | 32.66           | 4.51                | 4.51                | 0 %          | 108.9             | 0                 | 16.66        | 16 %          |
| M2/unlimited  | 32.49                | 32.49           | 4.34                | 4.34                | 0 %          | 166.5             | 0                 | 22.86        | 16 %          |
| M2/capped     | 31.93                | 31.93           | 3.88                | 3.88                | 0 %          | 180.9             | 0                 | 24.66        | 16 %          |

### 2024 BX1 (rule 961)

Documented main flare: 33.85–35.25 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 33.58                | 33.58           | 1.83                | 1.83                | 17 %         | 21.2              | 0                 | 4.041        | 22 %          |
| M1/capped     | 33.19                | 33.19           | 1.87                | 1.87                | 9 %          | 21.42             | 0                 | 4.958        | 26 %          |
| M2/unlimited  | 33.14                | 33.14           | 2.11                | 2.11                | 0 %          | 35.63             | 0                 | 4.668        | 15 %          |
| M2/capped     | 33.26                | 33.26           | 2.06                | 2.06                | 0 %          | 28.75             | 0                 | 4.061        | 15 %          |

### 2022 WJ1 (rule 961)

Documented main flare: 33.99–38.66 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 31.94                | 32.2            | 2.055               | 1.795               | 53 %         | 49.72             | 0                 | 24.21        | 54 %          |
| M1/capped     | 32.53                | 32.69           | 1.645               | 1.465               | 46 %         | 43.58             | 0                 | 17.56        | 52 %          |
| M2/unlimited  | 30.72                | 30.72           | 3.285               | 3.285               | 0 %          | 61.55             | 0                 | 22.96        | 40 %          |
| M2/capped     | 31.77                | 31.77           | 2.285               | 2.285               | 0 %          | 62.4              | 0                 | 21.81        | 39 %          |

### Carancas (rule 961)

No documented main-flare interval.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 31.57                | 31.57           | —                   | —                   | —            | 279.9             | 0                 | 28.17        | 11 %          |
| M1/capped     | 31.48                | 31.48           | —                   | —                   | —            | 237.6             | 0                 | 27.63        | 12 %          |
| M2/unlimited  | 31.36                | 31.36           | —                   | —                   | —            | 430.6             | 0                 | 54.88        | 12 %          |
| M2/capped     | 31.05                | 31.05           | —                   | —                   | —            | 450.5             | 0                 | 62.49        | 14 %          |

### Winchcombe (third set)

No documented main-flare interval.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 31.48                | 31.5            | —                   | —                   | —            | 5.424             | 0                 | 3.72         | 78 %          |
| M1/capped     | 30.07                | 30.15           | —                   | —                   | —            | 5.974             | 0                 | 4.51         | 100 %         |
| M2/unlimited  | 32.01                | 32.01           | —                   | —                   | —            | 5.139             | 0                 | 2.982        | 67 %          |
| M2/capped     | 30.79                | 30.79           | —                   | —                   | —            | 6.298             | 0                 | 4.602        | 85 %          |

### Golden (third set)

Documented main flare: 24.5–39.5 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 35.76                | 35.76           | 0                   | 0                   | 0 %          | 9.615             | 0                 | 1.704        | 23 %          |
| M1/capped     | 34.48                | 34.6            | 0                   | 0                   | 0 %          | 10.04             | 0                 | 1.971        | 20 %          |
| M2/unlimited  | 36.49                | 36.49           | 0                   | 0                   | 0 %          | 13.23             | 0                 | 1.748        | 17 %          |
| M2/capped     | 35.36                | 35.36           | 0                   | 0                   | 0 %          | 15.71             | 0                 | 2.092        | 18 %          |

### Madura Cave (third set)

Documented main flare: 20.75–40.85 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 31.73                | 31.87           | 0                   | 0                   | 0 %          | 9.054             | 0                 | 3.219        | 45 %          |
| M1/capped     | 31.84                | 31.87           | 0                   | 0                   | 0 %          | 8.671             | 0                 | 2.981        | 44 %          |
| M2/unlimited  | 32.37                | 32.37           | 0                   | 0                   | 0 %          | 10.75             | 0                 | 2.414        | 27 %          |
| M2/capped     | 31.71                | 31.71           | 0                   | 0                   | 0 %          | 11.6              | 0                 | 2.901        | 28 %          |

### Hamburg (third set)

Documented main flare: 16.65–29.15 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 33.71                | 33.81           | 4.56                | 4.66                | 0 %          | 12.23             | 0                 | 2.605        | 25 %          |
| M1/capped     | 33.51                | 33.51           | 4.36                | 4.36                | 0 %          | 10.35             | 0                 | 2.471        | 28 %          |
| M2/unlimited  | 33.63                | 33.63           | 4.48                | 4.48                | 0 %          | 17.76             | 0                 | 2.795        | 18 %          |
| M2/capped     | 34.25                | 34.25           | 5.1                 | 5.1                 | 0 %          | 13.07             | 0                 | 2.109        | 17 %          |

### Traspena (third set)

Documented main flare: 23.54–40.33 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 33.49                | 33.49           | 0                   | 0                   | 0 %          | 125.4             | 0                 | 11.47        | 12 %          |
| M1/capped     | 33.56                | 33.56           | 0                   | 0                   | 0 %          | 108               | 0                 | 9.033        | 9 %           |
| M2/unlimited  | 33.32                | 33.32           | 0                   | 0                   | 0 %          | 165.9             | 0                 | 21.25        | 12 %          |
| M2/capped     | 32.73                | 32.73           | 0                   | 0                   | 0 %          | 179               | 0                 | 21.22        | 12 %          |

### Cavezzo (third set)

Documented main flare: 25.65–37.65 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 29.57                | 29.89           | 0                   | 0                   | 1 %          | 1.694             | 0                 | 1.104        | 69 %          |
| M1/capped     | 29.67                | 29.88           | 0                   | 0                   | 1 %          | 1.743             | 0                 | 1.133        | 71 %          |
| M2/unlimited  | 30.18                | 30.18           | 0                   | 0                   | 0 %          | 1.746             | 0                 | 0.9559       | 55 %          |
| M2/capped     | 29.22                | 29.22           | 0                   | 0                   | 0 %          | 1.995             | 0                 | 1.205        | 64 %          |

### Košice (W18)

Documented main flare: 36–38 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 32.29                | 32.29           | 3.71                | 3.71                | 2 %          | 248.9             | 0                 | 30.16        | 14 %          |
| M1/capped     | 32.4                 | 32.4            | 3.6                 | 3.6                 | 1 %          | 233.8             | 0                 | 27.88        | 14 %          |
| M2/unlimited  | 31.64                | 31.64           | 4.44                | 4.44                | 0 %          | 385.3             | 0                 | 55.01        | 13 %          |
| M2/capped     | 31.95                | 31.95           | 4.15                | 4.15                | 0 %          | 346.9             | 0                 | 49.88        | 13 %          |

### Benešov (W18)

No documented main-flare interval.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 35.76                | 35.76           | —                   | —                   | —            | 70.39             | 0                 | 4.065        | 5 %           |
| M1/capped     | 35.75                | 35.75           | —                   | —                   | —            | 82.58             | 0                 | 3.854        | 7 %           |
| M2/unlimited  | 35.44                | 35.44           | —                   | —                   | —            | 139.6             | 0                 | 16.53        | 11 %          |
| M2/capped     | 35.97                | 35.97           | —                   | —                   | —            | 104.6             | 0                 | 8.791        | 9 %           |

### Tagish Lake (W18)

Documented main flare: 31–33 km.

| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |
| ------------- | -------------------- | --------------- | ------------------- | ------------------- | ------------ | ----------------- | ----------------- | ------------ | ------------- |
| M1/unlimited  | 32.05                | 32.05           | 1.27                | 1.27                | 1 %          | 6771              | 0                 | 892.7        | 16 %          |
| M1/capped     | 32.77                | 32.77           | 1.23                | 1.23                | 1 %          | 6786              | 0                 | 1077         | 17 %          |
| M2/unlimited  | 33.64                | 33.64           | 1.7                 | 1.7                 | 0 %          | 8771              | 0                 | 1306         | 16 %          |
| M2/capped     | 32.65                | 32.65           | 1.5                 | 1.5                 | 0 %          | 10080             | 0                 | 1333         | 15 %          |
