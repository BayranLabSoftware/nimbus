import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pgaFromMercalliIntensity } from '../../src/physics/events/earthquake/intensity.js';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import { plumeHeight } from '../../src/physics/events/volcano/plumeHeight.js';
import { DEFAULT_GRAIN_SPECTRUM } from '../../src/physics/events/volcano/ashfall.js';
import { STANDARD_GRAVITY } from '../../src/physics/constants.js';
import { m } from '../../src/physics/units.js';

/**
 * What the reference programs need from Nimbus to be asked the same
 * question: the megathrust sources Nimbus builds for the tsunami matrix,
 * the plume height, erupted mass and grain sizes it uses for each
 * eruption, and the accelerations it takes for each intensity. Nimbus's
 * own parameters, computed before any reference is run; no reference
 * output is read here.
 *
 * Usage:
 *   pnpm exec tsx scripts/benchmark/agent-inputs.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (name: string): unknown =>
  JSON.parse(readFileSync(join(ROOT, 'benchmark', 'matrices', `${name}.json`), 'utf8'));

interface TsunamiCase {
  id: string;
  kind: 'gaussian' | 'megathrust';
  magnitude?: number;
}
interface VolcanoCase {
  id: string;
  volumeEruptionRate: number;
  totalEjectaVolume: number;
  windSpeed: number;
}

const megathrusts = (read('tsunami') as TsunamiCase[])
  .filter((c) => c.kind === 'megathrust')
  .map((c) => {
    const r = simulateEarthquake({
      magnitude: c.magnitude ?? 0,
      depth: m(20_000),
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(4_000),
    });
    const t = r.tsunami;
    return {
      id: c.id,
      magnitude: c.magnitude,
      ruptureLengthM: r.ruptureLength,
      ruptureWidthM: (t?.ruptureWidth as number | undefined) ?? r.ruptureWidth,
      meanSlipM: (t?.meanSlip as number | undefined) ?? null,
      seafloorUpliftM: (t?.seafloorUplift as number | undefined) ?? null,
      initialAmplitudeM: (t?.initialAmplitude as number | undefined) ?? null,
      note: 'Nimbus lifts the sea floor by 0.6 × slip over the rupture and couples 0.7 of that into the wave (seismicTsunami.ts).',
    };
  });

// Pyle 1989's four classes as Nimbus carries them, and their moments in φ.
const phi = DEFAULT_GRAIN_SPECTRUM.map((g) => ({
  phi: -Math.log2(g.diameter * 1_000),
  w: g.massFraction,
}));
const meanPhi = phi.reduce((a, g) => a + g.w * g.phi, 0);
const stdPhi = Math.sqrt(phi.reduce((a, g) => a + g.w * (g.phi - meanPhi) ** 2, 0));

const eruptions = (read('volcano') as VolcanoCase[]).map((c) => ({
  id: c.id,
  plumeHeightAboveVentM: plumeHeight({ volumeEruptionRate: c.volumeEruptionRate }),
  eruptedMassKg: c.totalEjectaVolume * 1_000,
  windSpeedMs: c.windSpeed,
}));

const out = {
  written: 'Nimbus parameters for the benchmark references, before any reference ran',
  megathrusts,
  tephra: {
    depositDensityKgM3: 1_000,
    particleDensityKgM3: 1_000,
    grainClasses: DEFAULT_GRAIN_SPECTRUM.map((g, i) => ({
      diameterM: g.diameter,
      phi: phi[i]?.phi,
      massFraction: g.massFraction,
    })),
    medianPhi: meanPhi,
    stdPhi,
    note: 'Nimbus uses these four classes at a single particle density of 1 000 kg/m³ and a Suzuki release profile; the φ moments are for a program that takes a Gaussian distribution.',
  },
  eruptions,
  earthquake: {
    pgaThresholdsG: Object.fromEntries(
      [7, 8, 9].map((mmi) => [mmi, (pgaFromMercalliIntensity(mmi) as number) / STANDARD_GRAVITY])
    ),
    note: 'Worden et al. 2012, as Nimbus inverts it for the ring thresholds.',
  },
};

mkdirSync(join(ROOT, 'benchmark', 'nimbus'), { recursive: true });
const file = join(ROOT, 'benchmark', 'nimbus', 'agent-inputs.json');
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.error(`wrote ${file}`);
