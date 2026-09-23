import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { atmosphereTableMarkdown } from './atmosphereTable.js';

describe('rule 913: the published table of the two atmospheres', () => {
  it('docs/ATMOSPHERE_TABLE.md is what the code writes', () => {
    const file = readFileSync(
      new URL('../../../docs/ATMOSPHERE_TABLE.md', import.meta.url),
      'utf8'
    );
    expect(file).toBe(atmosphereTableMarkdown());
  });
});
