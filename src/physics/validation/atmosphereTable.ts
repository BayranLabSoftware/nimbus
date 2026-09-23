import {
  FIRST_STAGE_STRENGTH,
  FIRST_STAGE_STRENGTH_RANGE,
  MAIN_STAGE_STRENGTH,
  MAIN_STAGE_STRENGTH_RANGE,
} from '../effects/atmosphericEntry.js';
import { COLLINS_EXPONENTIAL_PROFILE } from '../effects/entryIntegrated.js';
import { USSA_1976_PROFILE, ussaState } from '../effects/ussa1976Entry.js';

/**
 * Rule 913 of `entryAtmosphereRules.ts`: the table the reviewer asked for
 * before the atmosphere is compared on any fireball — Collins's density and
 * the standard's between 20 and 80 km, their ratio, the standard's pressure,
 * and the altitude at which a body not yet slowed meets each strength of the
 * two-stage law under each. Written to `docs/ATMOSPHERE_TABLE.md` by
 * `scripts/atmosphere-table.ts` and held to it by its test.
 */

/** The altitude (m) at which a profile's density falls to `rho`, by bisection
 *  between the ground and 150 km. */
function altitudeOfDensity(density: (z: number) => number, rho: number): number {
  let low = 0;
  let high = 150_000;
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (density(mid) > rho) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

const fixed = (x: number, digits: number): string => x.toFixed(digits);
const sci = (x: number): string => {
  const [m = '', e = ''] = x.toExponential(3).split('e');
  return `${m} × 10^${String(Number(e))}`;
};

export function atmosphereTableMarkdown(): string {
  const lines: string[] = [];
  lines.push('# The entry’s two atmospheres');
  lines.push('');
  lines.push(
    'Rule 913 of `src/physics/validation/entryAtmosphereRules.ts`, published before rule 914 ' +
      'compares the two branches on any fireball. Written by `scripts/atmosphere-table.ts`; ' +
      'its test holds this file to the code.'
  );
  lines.push('');
  lines.push(
    '- **Collins**: Collins, Melosh & Marcus (2005), Eq. 5 — ρ = ρ0 e^(−z/H), ρ0 = 1 kg/m³, ' +
      'H = 8 km (the legacy branch A).'
  );
  lines.push(
    '- **USSA 1976**: the U.S. Standard Atmosphere 1976 (NOAA-S/T 76-1562), from its defining ' +
      'constants below 86 km, as `src/physics/effects/ussa1976Entry.ts` computes it; its test ' +
      'holds it to the standard’s printed Table I within the last printed digit.'
  );
  lines.push('');
  lines.push('## Density and pressure, 20 to 80 km (geometric altitude)');
  lines.push('');
  lines.push(
    '| Altitude (km) | Collins ρ (kg/m³) | USSA ρ (kg/m³) | Collins / USSA | USSA P (Pa) |'
  );
  lines.push('| ---: | ---: | ---: | ---: | ---: |');
  for (let km = 20; km <= 80; km += 5) {
    const z = km * 1_000;
    const collins = COLLINS_EXPONENTIAL_PROFILE.density(z);
    const s = ussaState(z);
    lines.push(
      `| ${String(km)} | ${sci(collins)} | ${sci(s.density)} | ${fixed(collins / s.density, 3)} | ${sci(s.pressure)} |`
    );
  }
  lines.push('');
  lines.push('## Where the dynamic pressure reaches the strengths (km)');
  lines.push('');
  lines.push(
    'The altitude at which ρ v² equals the strength S for a body not yet slowed (ρ = S / v²): ' +
      'S1, the first stage of the two-stage law (0.04–0.12 MPa, midpoint 0.069 MPa), and S2, ' +
      'the second (0.9–5 MPa, midpoint 2.12 MPa), Borovička, Spurný & Shrbený (2020).'
  );
  lines.push('');
  lines.push('| Strength | v (km/s) | Collins | USSA 1976 | Collins − USSA |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');
  const strengths: [string, number][] = [
    ['S1 low', FIRST_STAGE_STRENGTH_RANGE[0]],
    ['S1 mid', FIRST_STAGE_STRENGTH],
    ['S1 high', FIRST_STAGE_STRENGTH_RANGE[1]],
    ['S2 low', MAIN_STAGE_STRENGTH_RANGE[0]],
    ['S2 mid', MAIN_STAGE_STRENGTH],
    ['S2 high', MAIN_STAGE_STRENGTH_RANGE[1]],
  ];
  for (const [name, s] of strengths) {
    for (const v of [15, 20, 30]) {
      const rho = s / (v * 1_000) ** 2;
      const a = altitudeOfDensity(COLLINS_EXPONENTIAL_PROFILE.density, rho) / 1_000;
      const b = altitudeOfDensity(USSA_1976_PROFILE.density, rho) / 1_000;
      lines.push(
        `| ${name} (${fixed(s / 1e6, 3)} MPa) | ${String(v)} | ${fixed(a, 2)} | ${fixed(b, 2)} | ${fixed(a - b, 2)} |`
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}
