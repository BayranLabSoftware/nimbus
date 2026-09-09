import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build the PAGER country fatality table
 * (`src/physics/pagerCountries.ts`) from the USGS PAGER source.
 *
 * The empirical fatality model of Jaiswal & Wald (2010) fits a
 * log-normal ν(S) = Φ(ln(S/θ)/β) per country, by hindcasting the
 * deaths of every fatal earthquake since 1973. The paper's table is
 * behind a paywall; the fitted parameters themselves are not, because
 * the PAGER implementation is USGS work in the public domain and
 * ships them as data.
 *
 * The spread is the reason this table matters. At MMI VII–VIII the
 * United States (θ = 46.2) loses about fourteen people per million
 * exposed and Iran (θ = 9.3) loses several per cent — three orders of
 * magnitude, and one global average cannot stand in for both. Nimbus
 * used the median pair and read Northridge 1994 at 12 546 dead
 * against 57.
 *
 * Usage:
 *   pnpm pager:build
 *
 * Re-run only to pick up a new PAGER release; the output is
 * committed.
 */

const SOURCE_URL =
  'https://raw.githubusercontent.com/usgs/pager/master/losspager/data/fatality.xml';

interface CountryModel {
  ccode: string;
  theta: number;
  beta: number;
  /** Deaths in the largest event the fit was made against. */
  maxobs: number;
  /** `InCountry` when the country has enough fatal earthquakes of its
   *  own; `InGroup` when it borrows its neighbours' regional fit. */
  status: string;
}

function parse(xml: string): CountryModel[] {
  const out: CountryModel[] = [];
  for (const m of xml.matchAll(/<model\s([^>]*?)\/>/g)) {
    const attrs = m[1] ?? '';
    const get = (name: string): string | undefined =>
      new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    const ccode = get('ccode');
    const theta = Number(get('theta'));
    const beta = Number(get('beta'));
    if (ccode === undefined || !/^[A-Z]{2}$/.test(ccode)) continue;
    if (get('fform') !== 'lognormal') continue;
    if (!Number.isFinite(theta) || !Number.isFinite(beta) || theta <= 0 || beta <= 0) continue;
    out.push({
      ccode,
      theta,
      beta,
      maxobs: Number(get('maxobs') ?? 0),
      status: get('status') ?? '',
    });
  }
  return out.sort((a, b) => a.ccode.localeCompare(b.ccode));
}

async function main(): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`fetch ${SOURCE_URL}: ${res.status.toString()}`);
  const xml = await res.text();
  const version = /vstr="([^"]+)"/.exec(xml)?.[1] ?? 'unknown';
  const models = parse(xml);
  if (models.length < 100) throw new Error(`only ${models.length.toString()} models parsed`);

  const rows = models
    .map(
      (m) =>
        // Four decimals, then the trailing zeros dropped, so the
        // committed file is already what Prettier would write.
        `  ${m.ccode}: { theta: ${Number(m.theta.toFixed(4)).toString()}, ` +
        `beta: ${Number(m.beta.toFixed(4)).toString()}, ` +
        `own: ${(m.status === 'InCountry').toString()} },`
    )
    .join('\n');
  const own = models.filter((m) => m.status === 'InCountry').length;

  const body = `/**
 * PAGER country fatality parameters — GENERATED, do not edit by hand.
 *
 * Run \`pnpm pager:build\` to regenerate from
 * ${SOURCE_URL}
 * (USGS PAGER ${version}, public domain).
 *
 * ν(S) = Φ(ln(S/θ)/β), the empirical fatality model of Jaiswal & Wald
 * (2010), fitted per country by hindcasting the deaths of every fatal
 * earthquake since 1973. ${models.length.toString()} countries; ${own.toString()} carry their own fit and
 * the rest borrow their region's, which is what \`own\` records.
 *
 * Reference:
 *   Jaiswal, K. S. & Wald, D. J. (2010). "An Empirical Model for
 *     Global Earthquake Fatality Estimation." Earthquake Spectra
 *     26 (4), 1017–1037. DOI: 10.1193/1.3480331.
 */

export interface PagerCountryModel {
  /** Intensity at which half the exposed die. */
  theta: number;
  /** Log-normal width in ln(intensity). */
  beta: number;
  /** True when the country had enough fatal earthquakes for a fit of
   *  its own; false when it takes its region's. */
  own: boolean;
}

export const PAGER_COUNTRIES: Readonly<Record<string, PagerCountryModel>> = {
${rows}
};
`;
  const outPath = join(repoRoot, 'src', 'physics', 'pagerCountries.ts');
  writeFileSync(outPath, body);
  console.error(
    `wrote ${models.length.toString()} countries (${own.toString()} own fits) → ${outPath}`
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
