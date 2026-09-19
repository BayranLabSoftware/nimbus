import type {
  KilogramPerCubicMeter,
  Kilograms,
  Meters,
  MetersPerSecond,
  Pascals,
} from './units.js';

// Speed of light in vacuum. NIST/BIPM SI brochure (2019 redefinition), m/s.
export const SPEED_OF_LIGHT = 299_792_458 as MetersPerSecond;

// Newtonian gravitational constant. CODATA 2018, m^3 kg^-1 s^-2.
export const GRAVITATIONAL_CONSTANT = 6.674_30e-11;

// Earth mean radius. IUGG GRS80 / IERS, m.
export const EARTH_RADIUS = 6_371_000 as Meters;

// Earth mass. IAU 2015 nominal solar values / GM_E from SI redefinition, kg.
export const EARTH_MASS = 5.972e24 as Kilograms;

// Standard gravity. ISO 80000-3 (originally CIPM 1901), m/s^2.
export const STANDARD_GRAVITY = 9.806_65;

// Seawater surface density. UNESCO/IOC 1981, kg/m^3.
export const SEAWATER_DENSITY = 1_025 as KilogramPerCubicMeter;

// Crustal rock average density. Turcotte & Schubert, Geodynamics
// (2nd ed., 2002), Table 4.1, kg/m^3.
export const CRUSTAL_ROCK_DENSITY = 2_700 as KilogramPerCubicMeter;

// Ordinary chondrite (stony asteroid) bulk density — default impactor
// density for Collins/Melosh/Marcus 2005 pi-group scaling.
// Consolmagno, Britt & Macke (2008), Chemie der Erde 68(1), Table 1, kg/m^3.
export const CHONDRITIC_DENSITY = 3_000 as KilogramPerCubicMeter;

// Iron-meteorite bulk density (Meteor Crater impactor class).
// Consolmagno, Britt & Macke (2008), Chemie der Erde 68(1), Table 1, kg/m^3.
export const IRON_METEORITE_DENSITY = 7_800 as KilogramPerCubicMeter;

// Simple-to-complex crater transition diameter on Earth (competent rock).
// Below this craters are bowl-shaped; above, they collapse into central
// peaks and terraces.
// Collins, Melosh & Marcus (2005), MAPS 40(6), Eq. 28.
// DOI: 10.1111/j.1945-5100.2005.tb00157.x. Units: m.
export const SIMPLE_COMPLEX_TRANSITION_EARTH = 3_200 as Meters;

// Specific energy of TNT. 1 kt ≡ 4.184e12 J by definition (NIST).
// J/kg.
export const TNT_SPECIFIC_ENERGY = 4.184e6;

// Sea-level pressure. ICAO Standard Atmosphere (Doc 7488-CD, 1993) / ISO 2533, Pa.
export const SEA_LEVEL_PRESSURE = 101_325 as Pascals;

// Thermal partition of a low-altitude nuclear detonation: fraction of
// total yield radiated as thermal EM (UV–visible–IR), the rest being
// blast, neutrons, and prompt gamma.
// Glasstone & Dolan (1977), §1.24–1.25 (35 % for an air burst below
// about 40 000 ft); a contact surface burst behaves as 0.18 (§7.101),
// see thermalPartitionForHeight. Dimensionless.
export const NUCLEAR_THERMAL_PARTITION = 0.35;

// Luminous efficiency of a cosmic-impact fireball — fraction of the
// impactor's KE radiated as thermal light reaching the ground. Much
// lower than the nuclear partition because most impact energy goes into
// crater excavation and shock work before the fireball forms.
// Collins, Melosh & Marcus (2005), "Thermal radiation": η = 3e-3 as a
// first-order estimate within 1e-4–1e-2 (after Ortiz et al. 2000).
// Dimensionless.
export const IMPACT_LUMINOUS_EFFICIENCY = 3e-3;

// Atmospheric blast coupling efficiency for a cosmic impact —
// fraction of the impactor's kinetic energy that is delivered to the
// air-shock wave (and therefore drives the over-pressure damage rings
// at ground level). The remainder goes into cratering work, ejecta
// kinetic energy, ground-coupled seismic waves, melt/vapour formation
// and the thermal pulse already accounted for via
// IMPACT_LUMINOUS_EFFICIENCY. Pierazzo (1997, "Hydrocode simulations
// of vertical impacts") and Collins, Melosh & Marcus (2005, "Earth
// Impact Effects Program") both anchor the value near 0.5; we adopt
// 0.5 as the canonical popular-science envelope.
//
// Without this factor, applying the Kinney-Graham over-pressure law
// directly to the impactor's full KE over-states blast radii by
// ≈ √(1/0.5) ≈ 1.41 × at every threshold — exactly the +42 % we saw
// on the Tunguska 1 psi (71 km vs 50 km observed forest blowdown)
// and Chicxulub 1 psi (8 510 km vs 6 000 km Collins-Melosh-Marcus
// envelope) rings. Applying 0.5 brings both inside ±15 %.
export const IMPACT_BLAST_COUPLING = 0.5;

// Asteroid / comet taxonomy: Nimbus preset bulk density (kg/m^3) and
// tensile strength (Pa). Only two densities have near analogues in
// Britt & Consolmagno (2003), MAPS 38(8): 1161, whose data are
// meteorites: C-type near the CI/CM chondrites (Table 2), S-type near
// the ordinary chondrites (Table 4). Strengths: Popova et al. (2011),
// MAPS 46(10): 1525.
export const ASTEROID_TAXONOMY = {
  C_TYPE: { density: 2_000, strength: 1e5, label: 'C-type (carbonaceous)' },
  S_TYPE: { density: 3_300, strength: 2e6, label: 'S-type (stony)' },
  M_TYPE: { density: 5_300, strength: 5e7, label: 'M-type (metallic)' },
  IRON: { density: 7_800, strength: 5e7, label: 'Iron meteorite' },
  COMETARY: { density: 600, strength: 1e4, label: 'Cometary nucleus' },
} as const;

export type AsteroidTaxonomyClass = keyof typeof ASTEROID_TAXONOMY;

// Burn fluence thresholds on exposed skin (J/m^2): project values in
// cal/cm^2. Glasstone & Dolan (1977) give no fixed thresholds — the
// exposure that burns grows with yield (Fig. 12.64 draws it, for three
// degrees and three skin pigmentations, from 1 kt to 10 Mt).
//
// Since 16 September 2026 an explosion's burn rings are drawn at those
// curves instead (effects/burnExposure.ts, rules 80 to 84 of
// validation/burnRules.ts). These three are what an *impact* still draws
// its rings at: the curves are the pulse of a nuclear fireball, and what
// it takes to burn under an impact's is a gap of its own.
export const THIRD_DEGREE_BURN_FLUENCE = 3.35e5; // 8 cal/cm^2
export const SECOND_DEGREE_BURN_FLUENCE = 2.09e5; // 5 cal/cm^2 — full-thickness blistering
export const FIRST_DEGREE_BURN_FLUENCE = 8.37e4; // 2 cal/cm^2 — sunburn-like erythema

// The two fire fluences that stood here until 19 September 2026 — 10 cal/cm^2
// to ignite light kindling and 6 cal/cm^2 to sustain a fire storm — were the
// project's own, and the lower one put the fire storm outside the fire at
// every scale (B-061). They are gone: both rings now read Glasstone & Dolan's
// own Table 7.40 at the scenario's yield, in effects/ignitionExposure.ts, by
// rules 227 to 234 of validation/massFireRules.ts.

// Shear modulus (rigidity) of upper-crustal / oceanic rock — the
// classical 30 GPa used in fault-slip inversions.
// Aki & Richards (1980), Quantitative Seismology (2nd ed.), §3.3. Pa.
export const CRUSTAL_RIGIDITY = 3.0e10;

// Dense-rock-equivalent (DRE) density: silicate magma at zero porosity.
// Used to convert volcanic ejecta volumes between "tephra as deposited"
// and "magma as erupted".
// Mastin et al. (2009), JVGR 186(1-2), Table 1.
// DOI: 10.1016/j.jvolgeores.2009.01.008. kg/m^3.
export const DRE_DENSITY = 2_500 as KilogramPerCubicMeter;

// Sea-level air density, ICAO Standard Atmosphere (Doc 7488-CD, 1993) /
// ISO 2533. Drives the Taylor-Sedov blast-wave solution in
// src/physics/effects/blastWave.ts. kg/m^3.
export const SEA_LEVEL_AIR_DENSITY = 1.225 as KilogramPerCubicMeter;

// Sea-level speed of sound in dry air at 288.15 K:
//   c = sqrt(gamma * R_specific * T) = sqrt(1.4 * 287.053 * 288.15).
// ISO 2533 / ICAO Standard Atmosphere. m/s.
export const SEA_LEVEL_SOUND_SPEED = 340.29 as MetersPerSecond;

// Ratio of specific heats for dry air at ambient conditions.
// Used by the Rankine-Hugoniot normal-shock relations. Dimensionless.
export const AIR_HEAT_CAPACITY_RATIO = 1.4;
