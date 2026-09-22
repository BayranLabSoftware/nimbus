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
  'inventedShaking',
  'subduction',
  'tunedUnsourced',
  'unread',
  'airburstShock',
  'explosionProject',
  'surfaceBurst',
  'volcanoCalibrations',
  'impactToll',
  'outsideCount',
] as const;

export type ValidationGap = (typeof VALIDATION_GAPS)[number];

/**
 * The gaps that belong to an impact — the ones the validation page lists now
 * that the site is an instrument for cosmic impacts alone
 * (store/visibleEvents.ts). The others stay above, with their modules, and
 * the report keeps printing all of them.
 *
 * `evacuation` and `unread` are here because an impact raises a wave: the
 * warning that has no effect, and the arrival times whose source cannot be
 * found, are an impact's tsunami as much as anyone's.
 */
export const IMPACT_GAPS = [
  'impactToll',
  'airburstShock',
  'coastalOffline',
  'outsideCount',
  'evacuation',
  'unread',
] as const satisfies readonly ValidationGap[];
