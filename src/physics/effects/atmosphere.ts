import type { Joules, Kilograms, MetersPerSecond } from '../units.js';
import { kg } from '../units.js';

/**
 * Long-range atmospheric consequences of a large cosmic impact: the
 * sub-micrometre dust lofted to the stratosphere, the nitric acid made
 * by shock-heated air, and a qualitative climate tier. Order-of-
 * magnitude estimates from two published prescriptions, not a climate
 * model.
 */

/** One megatonne of TNT, in joules. */
const JOULES_PER_MEGATON = 4.184e15;

/** Reference impact speed of Toon et al. (1997) eq. 10, m/s. */
const TOON_REFERENCE_SPEED = 25_000;

/** Pulverized rock per megatonne at the reference speed, kg
 *  (Toon et al. 1997 eq. 10: 4 Tg per Mt). */
const PULVERIZED_ROCK_PER_MEGATON = 4e9;

/** Share of the pulverized rock that reaches the stratosphere as
 *  sub-micrometre dust (Toon et al. 1997 §8.2). */
const SUBMICROMETRE_FRACTION = 1e-3;

/**
 * Sub-micrometre dust lofted to the stratosphere.
 *
 * Toon et al. (1997) estimate the rock an impact pulverizes as
 *
 *     m_p ≈ 4 · Y · (25 km/s / v)^0.33  Tg     (Y in Mt; eq. 10)
 *
 * — about 300 times the impactor's mass at 25 km/s — and, from O'Keefe &
 * Ahrens (1982), take 0.1 % of it, some 30 % of the impactor's mass, to
 * reach the stratosphere as sub-micrometre dust (§8.2). The energy is
 * the one that forms the crater: an airburst pulverizes no target rock.
 * A Chicxulub-size impact, 10⁸ Mt at 20 km/s, lofts ≈ 4 × 10¹⁴ kg.
 *
 * Reference:
 *   Toon, O. B., Zahnle, K., Morrison, D., Turco, R. P., & Covey, C.
 *   (1997). "Environmental perturbations caused by the impacts of
 *   asteroids and comets." Reviews of Geophysics 35 (1): 41–78.
 *   DOI: 10.1029/96RG03038. §8.2 and eq. 10.
 */
export function stratosphericDustMass(
  crateringEnergy: Joules,
  impactVelocity: MetersPerSecond
): Kilograms {
  const E = crateringEnergy as number;
  const v = impactVelocity as number;
  if (!Number.isFinite(E) || E <= 0 || !Number.isFinite(v) || v <= 0) return kg(0);
  const pulverized =
    PULVERIZED_ROCK_PER_MEGATON * (E / JOULES_PER_MEGATON) * (TOON_REFERENCE_SPEED / v) ** 0.33;
  return kg(pulverized * SUBMICROMETRE_FRACTION);
}

/** Prinn & Fegley's asteroid: 5 × 10¹⁴ kg at 20 km/s, in joules. */
const PRINN_FEGLEY_ASTEROID_ENERGY = 0.5 * 5e14 * 20_000 ** 2;

/** NO molecules made by that asteroid's entry and ejecta plume. */
const PRINN_FEGLEY_ASTEROID_NO = 3e38;

const AVOGADRO = 6.02214076e23;

/** Molar mass of HNO₃, kg/mol. */
const HNO3_MOLAR_MASS = 0.063013;

/**
 * Nitric acid made by the air an impact shock-heats: the mass of HNO₃ if
 * every NO molecule became nitric acid, an upper limit.
 *
 * Scaled linearly from the asteroid of Prinn & Fegley (1987) — 5 × 10¹⁴ kg
 * at 20 km/s, 1.0 × 10²³ J — whose entry and ejecta plume make
 * 3 × 10³⁸ NO molecules, 3.1 × 10¹³ kg as HNO₃. Their comet, some 260
 * times more energetic, makes about as many molecules per joule
 * (7 × 10⁴⁰). In both, the ejecta plume's shock makes most of the NO,
 * so the energy here is the one delivered to the ground.
 *
 * Reference:
 *   Prinn, R. G. & Fegley, B. Jr. (1987). "Bolide impacts, acid
 *   rain, and biospheric traumas at the Cretaceous-Tertiary
 *   boundary." Earth and Planetary Science Letters 83 (1–4): 1–15.
 *   DOI: 10.1016/0012-821X(87)90046-X.
 */
export function shockAcidRainMass(groundEnergy: Joules): Kilograms {
  const E = groundEnergy as number;
  if (!Number.isFinite(E) || E <= 0) return kg(0);
  const molesNo = (PRINN_FEGLEY_ASTEROID_NO / AVOGADRO) * (E / PRINN_FEGLEY_ASTEROID_ENERGY);
  return kg(molesNo * HNO3_MOLAR_MASS);
}

/**
 * Qualitative classification of an event's footprint by kinetic
 * energy. The boundaries are Nimbus's own:
 *
 *   LOCAL       : below 10¹⁸ J (≈ 240 Mt).
 *   REGIONAL    : 10¹⁸ – 10²⁰ J.
 *   CONTINENTAL : 10²⁰ – 10²² J.
 *   GLOBAL      : 10²² – 10²⁴ J.
 *   EXTINCTION  : above 10²⁴ J (≈ 2.4 × 10⁸ Mt), Chicxulub-class.
 *
 * For comparison, Toon et al. (1997, abstract) find impacts below
 * 10 Mt (4 × 10¹⁶ J) negligible; blast, earthquakes and fires over
 * 10⁴–10⁵ km² up to 10⁴ Mt; global water vapour and ozone effects from
 * 10⁴ Mt; a transition from regional to global effects between 10⁵ and
 * 10⁶ Mt; light too dim for photosynthesis between 10⁶ and 10⁷ Mt; fires
 * set globally above 10⁷ Mt (4 × 10²² J).
 */
export type ClimateTier = 'LOCAL' | 'REGIONAL' | 'CONTINENTAL' | 'GLOBAL' | 'EXTINCTION';

export function climateTier(kineticEnergy: Joules): ClimateTier {
  const E = kineticEnergy as number;
  if (!Number.isFinite(E) || E <= 0) return 'LOCAL';
  if (E < 1e18) return 'LOCAL';
  if (E < 1e20) return 'REGIONAL';
  if (E < 1e22) return 'CONTINENTAL';
  if (E < 1e24) return 'GLOBAL';
  return 'EXTINCTION';
}
