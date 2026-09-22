import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import sealed from './impactSealData.json' with { type: 'json' };
import {
  buildSealScenarios,
  currentEngine,
  readScenario,
  sealTranslators,
  SEAL_SEED,
  type SealFile,
  type SealKeyNumbers,
  type SealReading,
  type SealTranslators,
} from './impactSeal.js';

/**
 * The seal of the impacts module — rule 826 of
 * `physics/validation/impactSealRules.ts`.
 *
 * Three hundred and eight scenarios, four digests each: the numbers, the
 * drawing, and the report's text in Italian and in English. A commit that
 * moves any of them turns this red and says which scenario and which digest
 * moved, with the key numbers before and after.
 *
 * A red seal is not by itself a defect. It is a question: was this meant? If
 * it was, the module was opened deliberately, and the seal is remade with its
 * reason (`pnpm seal:impacts --opened-by … --moved …`, rule 833). If it was
 * not, something from another module has reached into the impacts — which is
 * what the watertight compartments exist to prevent, and what this catches.
 *
 * The rules were fixed and pushed (commit 246bfac) before the candidate was
 * written.
 */

const file = sealed as SealFile;

interface Mismatch {
  id: string;
  what: 'numbers' | 'drawing' | 'textIt' | 'textEn';
  sealed: string;
  now: string;
  keysSealed: SealKeyNumbers;
  keysNow: SealKeyNumbers;
}

function movedKeys(a: SealKeyNumbers, b: SealKeyNumbers): string[] {
  const keys = Object.keys(a) as (keyof SealKeyNumbers)[];
  return keys
    .filter((key) => !Object.is(a[key], b[key]))
    .map((key) => `${key}: ${String(a[key])} → ${String(b[key])}`);
}

describe('the seal of the impacts module', () => {
  let translators: SealTranslators;
  let now: SealReading[];

  beforeAll(async () => {
    translators = await sealTranslators();
    now = buildSealScenarios().map((scenario) => readScenario(scenario, translators));
  }, 120_000);

  it('reads the set the seal was taken on', () => {
    expect(file.seed).toBe(SEAL_SEED);
    expect(now.map((reading) => reading.id)).toEqual(file.readings.map((reading) => reading.id));
  });

  it('was taken on the Node the repository pins', () => {
    // Rule 836(b): the CI's verify job runs on `.nvmrc`, so a seal taken on
    // any other Node would be compared on an engine it was never read on.
    const pinned = `v${readFileSync(new URL('../../.nvmrc', import.meta.url), 'utf8').trim()}`;
    expect(file.engine.node, 'the seal and .nvmrc name different Node versions').toBe(pinned);
  });

  it('answers to the bit what it answered when it was sealed', () => {
    // Rule 836(c): on another engine the digests move for reasons that are not
    // the module's — ICU's formatting, V8's last bit — and listing hundreds of
    // them would only hide that.
    const engine = currentEngine();
    if (engine.node !== file.engine.node || engine.icu !== file.engine.icu) {
      throw new Error(
        `The seal was taken on Node ${file.engine.node} (ICU ${file.engine.icu}); ` +
          `this is Node ${engine.node} (ICU ${engine.icu}).\n` +
          `A seal holds to the bit only on the engine it was taken on (rule 836): ICU formats ` +
          `the report's numbers and dates, and V8 gives a Math function its last bit.\n` +
          `Run the tests on ${file.engine.node}, the version in .nvmrc — or, if the engine is ` +
          `being moved on purpose, move .nvmrc and re-seal with that as the reason.`
      );
    }

    const mismatches: Mismatch[] = [];
    for (const reading of now) {
      const was = file.readings.find((r) => r.id === reading.id);
      expect(was, `${reading.id} is not in the seal`).toBeDefined();
      if (was === undefined) continue;
      for (const what of ['numbers', 'drawing', 'textIt', 'textEn'] as const) {
        if (was.digests[what] !== reading.digests[what]) {
          mismatches.push({
            id: reading.id,
            what,
            sealed: was.digests[what],
            now: reading.digests[what],
            keysSealed: was.keys,
            keysNow: reading.keys,
          });
        }
      }
    }

    if (mismatches.length > 0) {
      const lines = mismatches.slice(0, 10).map((m) => {
        const moved = movedKeys(m.keysSealed, m.keysNow);
        return (
          `  ${m.id} — ${m.what} moved (${m.sealed.slice(0, 12)} → ${m.now.slice(0, 12)})` +
          (moved.length > 0 ? `\n      ${moved.join('\n      ')}` : '\n      no key number moved')
        );
      });
      throw new Error(
        `The impacts module answers differently than when it was sealed: ` +
          `${mismatches.length.toString()} of ${(now.length * 4).toString()} digests moved.\n` +
          lines.join('\n') +
          (mismatches.length > 10 ? `\n  … and ${(mismatches.length - 10).toString()} more` : '') +
          `\n\nIf this was meant, re-seal with its reason (rule 833):\n` +
          `  pnpm seal:impacts --opened-by "<rule or bug>" --moved "<what moved>"`
      );
    }
    expect(mismatches).toEqual([]);
  });

  it('reads the same scenario the same way twice', () => {
    // Rule 832(a). The whole set is read once above; a second reading of a few
    // scenarios is enough to catch a reading that depends on a clock, on the
    // order of a map, or on state left behind by the scenario before it.
    const scenarios = buildSealScenarios();
    for (const index of [0, 7, 42, 150, 260]) {
      const scenario = scenarios[index];
      expect(scenario).toBeDefined();
      if (scenario === undefined) continue;
      const first = readScenario(scenario, translators);
      const second = readScenario(scenario, translators);
      expect(second.digests, `${scenario.id} reads differently on a second run`).toEqual(
        first.digests
      );
    }
  });

  it('carries a reason for every seal it has been given', () => {
    // Rule 833: a seal with no reason is the thing this round exists to
    // prevent.
    expect(file.reasons.length).toBeGreaterThan(0);
    for (const reason of file.reasons) {
      expect(reason.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(reason.commit).toMatch(/^[0-9a-f]{7,40}$/);
      expect(reason.openedBy.length).toBeGreaterThan(0);
      expect(reason.moved.length).toBeGreaterThan(0);
    }
  });
});
