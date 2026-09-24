/**
 * Rule 1158 (src/physics/validation/fcmRound1Rules.ts): round 2's
 * reconnaissance of candidates for the fourth set — titles, abstracts and
 * metadata only, from OpenAlex's open catalogue; no file is downloaded. Writes
 * the raw register to the path given (a scratch file, not the repository): the
 * events are then named by hand into src/physics/validation/fourthSetRegister.ts.
 *
 *   pnpm exec tsx scripts/fourth-set-reconnaissance.ts <out.json>
 *
 * To keep the analyst's exposure small, an abstract is never printed nor
 * stored: only flags of what it mentions (a flare, a light curve, a
 * deposition, a trajectory, a recovery, a crater) and whether it shows a
 * number that could be a target — an altitude in km, a mass in kg or g, a
 * pressure in MPa — without the number. Such an abstract counts as an
 * exposure of that observable (rule 1158).
 */

import { writeFileSync } from 'node:fs';

const QUERIES = [
  'meteorite fall fireball trajectory',
  'instrumentally observed meteorite fall',
  'fireball network meteorite recovery',
  'bolide light curve fragmentation meteorite',
  'meteoroid atmospheric fragmentation energy deposition',
  'fireball dark flight strewn field meteorites',
  'asteroid impact atmosphere entry observed fireball',
  'superbolide meteorite',
];

interface Work {
  id: string;
  doi: string | null;
  title: string;
  publication_year: number;
  primary_location?: { source?: { display_name?: string } | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

const abstractOf = (w: Work): string => {
  const idx = w.abstract_inverted_index;
  if (idx === null || idx === undefined) return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx)) for (const p of positions) words[p] = word;
  return words.join(' ');
};

const FLAGS: Record<string, RegExp> = {
  flare: /\bflares?\b/i,
  lightCurve: /light ?curves?|radiometer|photometr/i,
  deposition: /energy deposition|deposited energy|energy release/i,
  trajectory: /trajector|triangulat|atmospheric path/i,
  fragmentation: /fragment/i,
  recovery: /recover|meteorites? (were|was)? ?found|strewn/i,
  crater: /\bcrater/i,
  infrasound: /infrasound/i,
};
const TARGETS: Record<string, RegExp> = {
  altitudeKm: /\b\d+(?:\.\d+)?\s?(?:±\s?\d+(?:\.\d+)?\s?)?km\b/i,
  massKgG: /\b\d+(?:\.\d+)?\s?(?:kg|g|tons?|t)\b/i,
  pressureMPa: /\b\d+(?:\.\d+)?\s?(?:MPa|kPa)\b/i,
};

async function search(q: string, page: number): Promise<Work[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=from_publication_date:2008-01-01,type:article&per-page=50&page=${String(page)}&mailto=anonymous@example.org`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OpenAlex ${String(r.status)}`);
  return ((await r.json()) as { results: Work[] }).results;
}

const seen = new Map<string, unknown>();
for (const q of QUERIES)
  for (let page = 1; page <= 4; page++) {
    const works = await search(q, page);
    for (const w of works) {
      if (seen.has(w.id)) continue;
      const a = abstractOf(w);
      seen.set(w.id, {
        id: w.id,
        doi: w.doi,
        title: w.title,
        year: w.publication_year,
        venue: w.primary_location?.source?.display_name ?? null,
        hasAbstract: a.length > 0,
        mentions: Object.fromEntries(Object.entries(FLAGS).map(([k, re]) => [k, re.test(a)])),
        // Whether a number that could be a target shows — never the number.
        showsNumber: Object.fromEntries(Object.entries(TARGETS).map(([k, re]) => [k, re.test(a)])),
        query: q,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1_100));
  }
const out = process.argv[2];
if (out === undefined) throw new Error('give the output path');
writeFileSync(out, JSON.stringify([...seen.values()], null, 1));
console.log(`${String(seen.size)} works`);
