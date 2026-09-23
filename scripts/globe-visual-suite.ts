// Rule 1033 of src/scene/globe/mapGrammarRules.ts: the visual suite of the
// impact map. Photographs every layer of four fixed cases, headless, and writes
// beside the photographs what each layer's legend says.
//
//   pnpm exec tsx scripts/globe-visual-suite.ts <base url> <out dir>
//
// The photographs stay out of the repository: they are sent to the reviewer.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [base = 'http://localhost:5178', out = 'globe-suite'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

/** The fixed cases (rule 1033). */
const CASES = [
  { id: 'chicxulub', query: 'p=CHICXULUB&lat=21.3&lon=-89.5' },
  { id: 'chelyabinsk', query: 'p=CHELYABINSK&lat=54.8&lon=61.1' },
  { id: 'tunguska', query: 'p=TUNGUSKA&lat=60.886&lon=101.894' },
  {
    id: 'out-of-domain',
    query: 'p=CUSTOM&d=0.5&s=14000&a=22.5&rho=3000&trho=2700&g=9.80665&lat=43.19&lon=-79.42',
  },
];

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
const manifest: Record<string, { layers: Record<string, string>; legend?: string | null }> = {};

for (const c of CASES) {
  await page.goto(`${base}/?lng=it&m=globe&t=impact&${c.query}`, {
    waitUntil: 'networkidle',
    timeout: 180_000,
  });
  await page.getByRole('button', { name: /Avvia simulazione|Launch simulation/ }).click({
    timeout: 60_000,
  });
  const legend = page.getByTestId('impact-field-legend');
  await legend.waitFor({ timeout: 120_000 }).catch(() => undefined);
  await page.waitForTimeout(6_000);
  const tabs = await page
    .locator('[data-testid^="impact-layer-"]')
    .evaluateAll((els) =>
      els
        .map((e) => e.getAttribute('data-testid'))
        .filter((id): id is string => id !== null && id !== 'impact-layer-evidence')
    );
  const entry: { layers: Record<string, string>; legend?: string | null } = { layers: {} };
  manifest[c.id] = entry;
  if (tabs.length === 0) {
    await page.screenshot({ path: join(out, `${c.id}.png`) });
    entry.legend = (await legend.count()) > 0 ? await legend.innerText() : null;
  }
  for (const tab of tabs) {
    const layer = tab.replace('impact-layer-', '');
    await page.getByTestId(tab).click();
    await page.waitForTimeout(4_000);
    await page.screenshot({ path: join(out, `${c.id}-${layer}.png`) });
    entry.layers[layer] = await legend.innerText();
  }
}

writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${out}`, errors.length ? `errors: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
