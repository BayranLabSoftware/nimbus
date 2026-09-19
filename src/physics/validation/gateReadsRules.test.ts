import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AUDIT_ARTEFACTS,
  auditGateProblems,
  terrainGateProblems,
  type GlobeAuditArtefact,
  type TerrainDerivationArtefact,
} from './gateReadsRules.js';

/**
 * Rule 277: the gate, fed each thing in turn.
 *
 * The rules were fixed and pushed (commit 6f94ce9) before the candidate was
 * written.
 */

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

const cleanGlobe: GlobeAuditArtefact = {
  base: 'http://localhost:5178',
  rows: [{ scenario: 'impact-tiny-land', family: 'impact', checked: 4 }],
  findings: [],
  silences: [{ scenario: 'slide-tiny', what: 'the slide’s own length is published' }],
};

const cleanTerrain: TerrainDerivationArtefact = {
  base: 'http://localhost:5178',
  rows: [
    {
      name: 'Miami',
      latitude: 25.79,
      longitude: -80.226,
      shoreDistanceM: 5_060,
      waterDepthM: 4.2,
      shoreInsideBounds: true,
      depthInsideBounds: true,
    },
  ],
};

/** The newest artefact of a kind, as the generator reads it. */
function newest(prefix: string): { file: string; data: unknown } | null {
  const dir = join(REPO_ROOT, AUDIT_ARTEFACTS.globe.directory);
  const names = readdirSync(dir)
    .filter((n) => n.startsWith(prefix) && n.endsWith('.json'))
    .sort();
  const file = names[names.length - 1];
  if (file === undefined) return null;
  return { file, data: JSON.parse(readFileSync(join(dir, file), 'utf8')) };
}

describe('rules 274 to 278 — the gate reads what the audits write', () => {
  it('rule 277(a): a finding on the globe blocks, and is named', () => {
    const withFinding: GlobeAuditArtefact = {
      ...cleanGlobe,
      findings: [
        {
          scenario: 'impact-iron-ground',
          what: 'a ring is captioned with a number it does not draw',
        },
      ],
    };
    const problems = auditGateProblems(withFinding, cleanTerrain);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('impact-iron-ground');
    expect(problems[0]).toContain('captioned');
  });

  it('rule 277(b): a terrain row outside its bounds blocks, and says which bound', () => {
    const badShore: TerrainDerivationArtefact = {
      ...cleanTerrain,
      rows: [{ ...(cleanTerrain.rows[0] ?? cleanTerrain.rows[0]!), shoreInsideBounds: false }],
    };
    const badDepth: TerrainDerivationArtefact = {
      ...cleanTerrain,
      rows: [{ ...(cleanTerrain.rows[0] ?? cleanTerrain.rows[0]!), depthInsideBounds: false }],
    };
    expect(terrainGateProblems(badShore)[0]).toContain("rule 243's bounds");
    expect(terrainGateProblems(badDepth)[0]).toContain("rule 250(b)'s bound");
    expect(auditGateProblems(cleanGlobe, badShore)).toHaveLength(1);
    // Both wrong at once is two problems, not one.
    const both: TerrainDerivationArtefact = {
      ...cleanTerrain,
      rows: [
        {
          ...(cleanTerrain.rows[0] ?? cleanTerrain.rows[0]!),
          shoreInsideBounds: false,
          depthInsideBounds: false,
        },
      ],
    };
    expect(terrainGateProblems(both)).toHaveLength(2);
  });

  it('rule 277(c): no artefact at all blocks — a gate that cannot see is the point', () => {
    expect(auditGateProblems(null, cleanTerrain)).toHaveLength(1);
    expect(auditGateProblems(cleanGlobe, null)).toHaveLength(1);
    expect(auditGateProblems(null, null)).toHaveLength(2);
    expect(auditGateProblems(null, null).join(' ')).toContain('to read');
  });

  it('rule 275: a silence does not block', () => {
    expect(cleanGlobe.silences.length).toBeGreaterThan(0);
    expect(auditGateProblems(cleanGlobe, cleanTerrain)).toHaveLength(0);
  });

  it('rule 277(d): the artefacts as they stand, read from the tree, give the gate nothing', () => {
    const globeRead = newest(AUDIT_ARTEFACTS.globe.prefix);
    const terrainRead = newest(AUDIT_ARTEFACTS.terrain.prefix);
    const globe =
      globeRead === null
        ? null
        : { file: globeRead.file, data: globeRead.data as GlobeAuditArtefact };
    const terrain =
      terrainRead === null
        ? null
        : { file: terrainRead.file, data: terrainRead.data as TerrainDerivationArtefact };
    expect(globe, 'a globe audit is committed').not.toBeNull();
    expect(terrain, 'a terrain derivation is committed').not.toBeNull();
    const problems = auditGateProblems(globe?.data ?? null, terrain?.data ?? null);
    expect(problems, problems.join('; ')).toHaveLength(0);
    // And they are the real thing, not a stub.
    expect(globe?.data.rows.length).toBe(30);
    expect(terrain?.data.rows.length).toBeGreaterThanOrEqual(4);
    console.log(
      `\nrule 277(d): ${globe?.file ?? '—'} — ${globe?.data.rows.length.toString() ?? '0'} scenarios, ${globe?.data.findings.length.toString() ?? '0'} findings, ${globe?.data.silences.length.toString() ?? '0'} silences; ${terrain?.file ?? '—'} — ${terrain?.data.rows.length.toString() ?? '0'} points, all inside their bounds.`
    );
  });
});
