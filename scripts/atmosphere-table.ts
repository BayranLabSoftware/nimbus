/**
 * Rule 913: writes docs/ATMOSPHERE_TABLE.md from the code. Run with
 * `pnpm tsx scripts/atmosphere-table.ts`.
 */
import { writeFileSync } from 'node:fs';
import { atmosphereTableMarkdown } from '../src/physics/validation/atmosphereTable.js';

writeFileSync(new URL('../docs/ATMOSPHERE_TABLE.md', import.meta.url), atmosphereTableMarkdown());
console.log('Wrote docs/ATMOSPHERE_TABLE.md');
