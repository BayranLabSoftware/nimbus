/**
 * Renders src/physics/validation/fourthSetRegister.ts (rule 1158) and the
 * observable kinds of rule 1164 (d) as docs/FOURTH_SET_REGISTER.md.
 *
 *   pnpm exec tsx scripts/fourth-set-register-doc.ts
 */

import { writeFileSync } from 'node:fs';
import {
  FOURTH_SET_CANDIDATES,
  FOURTH_SET_LEFT_OUT,
} from '../src/physics/validation/fourthSetRegister.js';
import { FCM_ROUND3_OBSERVABLES } from '../src/physics/validation/fcmRound3Charter.js';

const lines = [
  '# The fourth set — the register of candidates',
  '',
  'Rule 1158’s reconnaissance (`src/physics/validation/fourthSetRegister.ts`): titles, abstracts and metadata only,',
  'from OpenAlex; no file downloaded, no paper opened; no abstract printed or stored — only what each mentions',
  'and whether it shows a number that could be a target (registered as exposed, the number unread). An',
  'inventory, not the set: the list is frozen, and each source pinned by its file’s hash, only in the final',
  'preparation dossier (rule 1168). The observable kind is rule 1164 (d)’s, fixed from the metadata and able',
  'only to fall at extraction.',
  '',
  '| Event | Date | Type | Instruments | Mentioned | Exposed in an abstract | Widely reported | Kind | Status |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...FOURTH_SET_CANDIDATES.map(
    (c) =>
      `| ${c.event} | ${c.date} | ${c.type ?? '—'} | ${c.instruments ?? '—'} | ${c.mentions.join(', ')} | ${c.exposed.length === 0 ? '—' : c.exposed.join(', ')} | ${c.widelyReported ? 'yes' : '—'} | ${FCM_ROUND3_OBSERVABLES[c.event] ?? '—'} | ${c.status}${c.note === undefined ? '' : ` — ${c.note}`} |`
  ),
  '',
  '## Sources, by DOI where there is one',
  '',
  ...FOURTH_SET_CANDIDATES.flatMap((c) =>
    c.sources.map(
      (s) => `- ${c.event}: ${s.title} (${String(s.year)})${s.doi === null ? '' : `, doi:${s.doi}`}`
    )
  ),
  '',
  '## Found and left out',
  '',
  ...FOURTH_SET_LEFT_OUT.map((l) => `- ${l.event}: ${l.reason}.`),
  '',
];
writeFileSync('docs/FOURTH_SET_REGISTER.md', lines.join('\n'));
