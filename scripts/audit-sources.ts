/**
 * Check the sources this repository cites against the registries that
 * record them.
 *
 * A citation can be wrong in ways no test of the physics sees: a DOI
 * that belongs to another paper, a title that no journal printed, a
 * year off by fifteen. On 14 September 2026 the first run of these
 * checks found all three — a DOI for a Mars-seismology paper that
 * resolved to an olivine study, a Nordyke "1977" that was 1962, a
 * dispersion law credited to a paper about Papua New Guinea — so they
 * are kept here, where anyone can rerun them.
 *
 *   1. Every DOI written anywhere in the source, the docs, the README
 *      or CITATION.cff must resolve: in Crossref, in DataCite, or at
 *      least as a handle at doi.org. For those that carry metadata,
 *      the text around each use must name the first author or the
 *      year, or the DOI is probably pasted beside the wrong reference.
 *   2. Every citation on the methodology page is compared with
 *      Crossref: by its DOI when it has one (title, year and first
 *      author must agree), and by a bibliographic search when it does
 *      not, to suggest the DOI it could carry.
 *
 * It needs the network and is not part of CI: the registries are not
 * ours to make a build depend on. It prints what it finds and exits
 * non-zero if any DOI fails to resolve or any citation disagrees with
 * its DOI's record. Books, reports and datasets without DOIs are
 * listed for a person to check, not failed.
 *
 * Usage:
 *   pnpm audit:sources
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CITATIONS,
  METHODOLOGY_SECTIONS,
  type Citation,
} from '../src/ui/pages/methodologyContent.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAUSE_MS = 200;

interface DoiRecord {
  registry: 'crossref' | 'datacite' | 'handle';
  title: string;
  firstAuthor: string;
  year: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Share of the shorter title's significant words the other contains. */
function titleOverlap(a: string, b: string): number {
  const words = (t: string): Set<string> =>
    new Set(
      normalise(t)
        .split(' ')
        .filter((w) => w.length > 3)
    );
  const A = words(a);
  const B = words(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  return shared / Math.min(A.size, B.size);
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: { family?: string }[];
  editor?: { family?: string }[];
  issued?: { 'date-parts'?: (number | null)[][] };
}

function yearOf(work: CrossrefWork): number | null {
  return work.issued?.['date-parts']?.[0]?.[0] ?? null;
}

async function lookUpDoi(doi: string): Promise<DoiRecord | null> {
  const crossref = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (crossref.ok) {
    const work = ((await crossref.json()) as { message: CrossrefWork }).message;
    return {
      registry: 'crossref',
      title: work.title?.[0] ?? '',
      firstAuthor: work.author?.[0]?.family ?? work.editor?.[0]?.family ?? '',
      year: yearOf(work),
    };
  }
  const datacite = await fetch(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`);
  if (datacite.ok) {
    const attributes = (
      (await datacite.json()) as {
        data: {
          attributes: {
            titles?: { title?: string }[];
            creators?: { familyName?: string; name?: string }[];
            publicationYear?: number;
          };
        };
      }
    ).data.attributes;
    return {
      registry: 'datacite',
      title: attributes.titles?.[0]?.title ?? '',
      firstAuthor: attributes.creators?.[0]?.familyName ?? attributes.creators?.[0]?.name ?? '',
      year: attributes.publicationYear ?? null,
    };
  }
  const handle = await fetch(`https://doi.org/api/handles/${encodeURIComponent(doi)}`);
  if (handle.ok && ((await handle.json()) as { responseCode?: number }).responseCode === 1) {
    return { registry: 'handle', title: '', firstAuthor: '', year: null };
  }
  return null;
}

/** A DOI as it is written in text, trimmed of the punctuation around it
 *  but keeping the parentheses and angle brackets old DOIs carry. */
function doisIn(line: string): string[] {
  const found: string[] = [];
  for (const match of line.matchAll(/\b(10\.\d{4,9}\/[^\s"'`\]},]+)/g)) {
    let doi = (match[1] ?? '').replace(/[.:;]+$/, '');
    const count = (re: RegExp): number => (doi.match(re) ?? []).length;
    while (doi.endsWith(')') && count(/\(/g) < count(/\)/g)) doi = doi.slice(0, -1);
    found.push(doi.replace(/[.:;]+$/, ''));
  }
  return found;
}

async function checkDoisInRepository(): Promise<number> {
  const files = execSync(
    "git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'scripts/*.ts' 'docs/*.md' 'README.md' 'CITATION.cff'",
    { cwd: ROOT, encoding: 'utf8' }
  )
    .split('\n')
    .filter((f) => f !== '' && !f.endsWith('audit-sources.ts'));
  const uses = new Map<string, { at: string; context: string }[]>();
  for (const file of files) {
    const lines = readFileSync(`${ROOT}${file}`, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const doi of doisIn(line)) {
        const key = doi.toLowerCase();
        const context = lines.slice(Math.max(0, i - 5), i + 3).join(' ');
        uses.set(key, [...(uses.get(key) ?? []), { at: `${file}:${String(i + 1)}`, context }]);
      }
    });
  }

  let failures = 0;
  console.log(`\n## DOIs in the repository (${String(uses.size)})\n`);
  for (const [doi, where] of uses) {
    const record = await lookUpDoi(doi);
    const at = where.map((w) => w.at).join(', ');
    if (record === null) {
      failures += 1;
      console.log(`UNRESOLVED  ${doi}  (${at})`);
    } else if (record.registry !== 'handle') {
      const surname = normalise(record.firstAuthor).split(' ').pop() ?? '';
      const unnamed = where.filter((w) => {
        const text = normalise(w.context);
        const namesAuthor = surname.length > 2 && text.includes(surname);
        const namesYear = record.year !== null && text.includes(String(record.year));
        return !namesAuthor && !namesYear;
      });
      if (unnamed.length > 0) {
        failures += 1;
        console.log(
          `MISPLACED?  ${doi} is ${record.firstAuthor} ${String(record.year)} "${record.title.slice(0, 80)}", not named near ${unnamed.map((w) => w.at).join(', ')}`
        );
      }
    }
    await sleep(PAUSE_MS);
  }
  if (failures === 0) console.log('Every DOI resolves and sits beside its own reference.');
  return failures;
}

async function checkMethodologyCitations(): Promise<number> {
  const citations = new Map<string, { name: string; citation: Citation }>();
  for (const [name, citation] of Object.entries(CITATIONS)) {
    citations.set(
      citation.doi ?? `${citation.authors}|${String(citation.year)}|${citation.title}`,
      {
        name,
        citation,
      }
    );
  }
  for (const section of METHODOLOGY_SECTIONS) {
    for (const entry of section.entries) {
      const c = entry.citation;
      const key = c.doi ?? `${c.authors}|${String(c.year)}|${c.title}`;
      if (!citations.has(key)) citations.set(key, { name: `card ${entry.id}`, citation: c });
    }
  }

  let failures = 0;
  console.log(`\n## Methodology citations (${String(citations.size)})\n`);
  for (const { name, citation } of citations.values()) {
    if (citation.doi !== undefined && citation.doi !== '') {
      const record = await lookUpDoi(citation.doi);
      if (record === null) {
        failures += 1;
        console.log(`UNRESOLVED  ${name}: ${citation.doi}`);
      } else if (record.registry === 'crossref') {
        const surname = normalise(record.firstAuthor).split(' ').pop() ?? '#';
        const agrees =
          titleOverlap(citation.title, record.title) >= 0.6 &&
          record.year === citation.year &&
          normalise(citation.authors).includes(surname);
        if (!agrees) {
          failures += 1;
          console.log(
            `DISAGREES   ${name}: we cite ${citation.authors} ${String(citation.year)} "${citation.title}"; ${citation.doi} is ${record.firstAuthor} ${String(record.year)} "${record.title}"`
          );
        }
      }
    } else {
      const query = encodeURIComponent(
        `${citation.authors} ${String(citation.year)} ${citation.title} ${citation.venue}`
      );
      const response = await fetch(
        `https://api.crossref.org/works?query.bibliographic=${query}&rows=1`
      );
      const best = response.ok
        ? ((await response.json()) as { message: { items?: CrossrefWork[] } }).message.items?.[0]
        : undefined;
      const match =
        best !== undefined &&
        titleOverlap(citation.title, best.title?.[0] ?? '') >= 0.8 &&
        yearOf(best) === citation.year;
      console.log(
        match
          ? `COULD CARRY ${name}: doi ${best.DOI ?? ''} ("${best.title?.[0] ?? ''}")`
          : `BY HAND     ${name}: ${citation.authors} ${String(citation.year)} "${citation.title}" — no registry match; a book, report or dataset to check in person`
      );
    }
    await sleep(PAUSE_MS);
  }
  return failures;
}

async function main(): Promise<void> {
  const failures = (await checkDoisInRepository()) + (await checkMethodologyCitations());
  console.log(`\n${String(failures)} problem(s).`);
  if (failures > 0) process.exitCode = 1;
}

await main();
