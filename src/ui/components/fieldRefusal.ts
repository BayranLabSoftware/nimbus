import type { ValidationCode } from '../../physics/validation/inputSchema.js';

/** Rule 1214: the fields a typed value can be refused on. */
export type RefusableField =
  | 'impactorDiameter'
  | 'impactVelocity'
  | 'impactorDensity'
  | 'targetDensity'
  | 'impactAngle';

/** Rule 1214: why a typed text is refused, or null where the field takes it
 *  — every field above zero, the angle at most 90° too. The update functions
 *  store a value only where this says null, so the words and the test are
 *  one. */
export function refusalOf(text: string, field: RefusableField): ValidationCode | null {
  const v = parseFloat(text);
  if (!Number.isFinite(v)) return 'NOT_NUMBER';
  if (v === 0) return 'ZERO_FORBIDDEN';
  if (v < 0) return 'NEGATIVE_FORBIDDEN';
  if (field === 'impactAngle' && v > 90) return 'OUT_OF_DOMAIN';
  return null;
}
