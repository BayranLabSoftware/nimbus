/**
 * The constants of Collins, Melosh & Marcus (2005)'s atmospheric entry,
 * shared by its closed forms (`atmosphericEntry.ts`) and by the same model
 * integrated on a profile of the atmosphere (`entryIntegrated.ts`, rules 908
 * to 918 of validation/entryAtmosphereRules.ts).
 */

/** Surface atmospheric density, as Collins et al. take it (kg/m³). */
export const RHO_0 = 1;
/** Atmospheric scale height (m). */
export const H_SCALE = 8_000;
/** Drag coefficient. */
export const DRAG_COEFFICIENT = 2;
/** Pancake factor: the spread, as a multiple of the body's diameter, at
 *  which the fragments go their own ways and the airburst is declared. */
export const PANCAKE_FACTOR = 7;
/** Standard gravity, for the terminal velocity (m/s²). */
export const GRAVITY = 9.81;
