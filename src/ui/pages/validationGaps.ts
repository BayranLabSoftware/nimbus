/**
 * What the model is known not to do, in the order the validation page
 * lists it. Each key has an `item` and a `note` under
 * `validation.gaps.<key>` in every locale; `validationPage.test.ts`
 * reads this list, so a gap cannot reach the page without words.
 *
 * The report's "Declared gaps" (scripts/generate-validation-report.ts)
 * says the same things at a reviewer's length.
 */
export const VALIDATION_GAPS = [
  'evacuation',
  'farField',
  'coastalOffline',
  'bandPhysicsOnly',
  'greatRupture',
  'subduction',
  'tunedUnsourced',
  'unread',
  'airburstShock',
  'explosionProject',
  'surfaceBurst',
  'volcanoCalibrations',
  'impactEntry',
  'impactToll',
  'outsideCount',
] as const;

export type ValidationGap = (typeof VALIDATION_GAPS)[number];
