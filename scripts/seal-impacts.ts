/**
 * Take the seal of the impacts module — rule 833 of
 * `src/physics/validation/impactSealRules.ts`.
 *
 *   pnpm exec tsx scripts/seal-impacts.ts --opened-by "<rule or bug>" \
 *       --moved "<what moved>"
 *
 * The seal is remade only when the impacts module is deliberately opened, and
 * never by a workflow: the CI only compares. So this refuses to run without
 * both reasons, and writes them into the file with the date and the commit it
 * was taken on. A regeneration with no reason is the one thing the round
 * exists to prevent — it would turn a broken build green and leave nothing
 * behind to say what changed.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  currentEngine,
  readSeal,
  sealTranslators,
  SEAL_PLATFORM,
  SEAL_SEED,
  type SealFile,
} from '../src/seal/impactSeal.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'seal', 'impactSealData.json');

// Rule 836(d): a seal taken on another Node would be compared by the CI on the
// pinned one and read as a module that moved.
const pinned = `v${readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim()}`;
const engine = currentEngine();
if (engine.node !== pinned) {
  console.error(
    `Refusing to seal on Node ${engine.node}: the repository pins ${pinned} in .nvmrc, ` +
      'and the CI compares on that (rule 836).\n' +
      `  Seal on ${pinned}, or move .nvmrc first and give the move as the reason.`
  );
  process.exit(2);
}
// Rule 837: and on the platform the CI's seal job compares on.
if (engine.platform !== SEAL_PLATFORM) {
  console.error(
    `Refusing to seal on ${engine.platform}: the seal is taken and compared on ` +
      `${SEAL_PLATFORM} (rule 837), and the same Node gives other last bits elsewhere.`
  );
  process.exit(2);
}

function flag(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const value = process.argv[i + 1];
  return value === undefined || value.startsWith('--') ? null : value;
}

const openedBy = flag('opened-by');
const moved = flag('moved');
if (openedBy === null || moved === null) {
  console.error(
    'Refusing to re-seal without a reason (rule 833).\n' +
      '  --opened-by "<the rule or bug that opened the module>"\n' +
      '  --moved     "<what moved, or: nothing>"'
  );
  process.exit(2);
}

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT })
  .toString()
  .trim();
const date = new Date().toISOString().slice(0, 10);

let previous: SealFile | null = null;
try {
  const { default: file } = (await import('../src/seal/impactSealData.json', {
    with: { type: 'json' },
  })) as { default: SealFile };
  previous = file;
} catch {
  previous = null;
}

const started = performance.now();
const readings = readSeal(await sealTranslators());
const seconds = (performance.now() - started) / 1_000;

const file: SealFile = {
  seed: SEAL_SEED,
  engine,
  reasons: [...(previous?.reasons ?? []), { date, commit, openedBy, moved }],
  readings,
};
// One line per reading: a moved digest is then one line of the diff, with its
// key numbers beside it, and the file stays a third of the size it would be
// pretty-printed (rule 832(c)).
const text = [
  '{',
  `  "seed": ${JSON.stringify(file.seed)},`,
  `  "engine": ${JSON.stringify(file.engine)},`,
  `  "reasons": ${JSON.stringify(file.reasons, null, 4).replace(/\n/g, '\n  ')},`,
  '  "readings": [',
  file.readings.map((reading) => `    ${JSON.stringify(reading)}`).join(',\n'),
  '  ]',
  '}',
  '',
].join('\n');
writeFileSync(OUT, text);

const changed = readings.filter((reading) => {
  const was = previous?.readings.find((r) => r.id === reading.id);
  if (was === undefined) return true;
  return (['numbers', 'drawing', 'textIt', 'textEn'] as const).some(
    (what) => was.digests[what] !== reading.digests[what]
  );
}).length;

console.log(
  `Sealed ${readings.length.toString()} scenarios in ${seconds.toFixed(1)} s ` +
    `(${changed.toString()} moved since the last seal). ${OUT}`
);
