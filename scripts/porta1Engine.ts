/**
 * Rule 1229 (d) (`src/physics/validation/porta1Rules.ts`): the engine a
 * committed script flies — the sealed one, or, with `--engine settle`, rule
 * 1227's corrected settle condition and nothing else changed — and the suffix
 * its outputs then take. Kept apart from `fcmRound1Common.ts`, which is one of
 * the files of the sealed candidate (rule 1162) and stays as sealed.
 */

import {
  fcmEntry,
  type FcmBody,
  type FcmOptions,
  type FcmResult,
} from '../src/physics/effects/fcmBranch.js';
import { fcmEntrySettle } from '../src/physics/effects/fcmBranchSettle.js';
import { REFERENCE } from './fcmRound1Common.js';

export function engineFromArgs(argv: readonly string[]): {
  engine: typeof fcmEntry;
  suffix: '' | '.settle';
} {
  const i = argv.indexOf('--engine');
  if (i < 0) return { engine: fcmEntry, suffix: '' };
  if (argv[i + 1] !== 'settle') throw new Error('--engine takes only «settle»');
  return { engine: fcmEntrySettle, suffix: '.settle' };
}

/** `fcmRound1Common.ts`'s `run`, on the engine given. */
export const runOn =
  (engine: typeof fcmEntry) =>
  (d: { body: FcmBody; options: FcmOptions }, extra: Partial<FcmOptions> = {}): FcmResult =>
    engine(d.body, { ...d.options, ...REFERENCE, ...extra });
