/**
 * The blast solver's GPU runs (rule 1270 of
 * `src/physics/validation/blastSolverRules.ts`): bundles
 * `src/physics/solvers/blast2d/gpu/browserEntry.ts`, serves it on localhost
 * and runs it in headless Chrome on this machine's GPU
 * (`--enable-unsafe-webgpu --use-angle=metal`).
 *
 *   pnpm exec tsx scripts/blast2d-gpu.ts rest '<case>' <steps>
 *   pnpm exec tsx scripts/blast2d-gpu.ts conserve '<case>' <steps>
 *   pnpm exec tsx scripts/blast2d-gpu.ts run '<case>' <out.json>
 *   pnpm exec tsx scripts/blast2d-gpu.ts runs <cases.json> <cache dir>
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium, type Page } from 'playwright';
import { build } from 'vite';

const OUT = join(tmpdir(), 'nimbus-blast2d-gpu');

async function bundle(): Promise<string> {
  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: OUT,
      emptyOutDir: true,
      minify: false,
      target: 'es2022',
      lib: {
        entry: 'src/physics/solvers/blast2d/gpu/browserEntry.ts',
        formats: ['es'],
        fileName: () => 'entry.js',
      },
    },
  });
  return readFileSync(join(OUT, 'entry.js'), 'utf8');
}

export async function withGpuPage<T>(work: (page: Page) => Promise<T>): Promise<T> {
  return withGpuPages(1, (pages) => {
    const page = pages[0];
    if (page === undefined) throw new Error('no page');
    return work(page);
  });
}

/** Several pages, each with its own GPU device, in one browser. */
export async function withGpuPages<T>(n: number, work: (pages: Page[]) => Promise<T>): Promise<T> {
  const code = await bundle();
  const server = createServer((request, response) => {
    if (request.url === '/entry.js') {
      response.writeHead(200, { 'content-type': 'text/javascript' });
      response.end(code);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(
      '<!doctype html><title>blast2d gpu</title><script type="module" src="/entry.js"></script>'
    );
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
  try {
    const pages: Page[] = [];
    for (let k = 0; k < n; k++) {
      const page = await browser.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning')
          console.error('[page]', m.type(), m.text());
      });
      await page.goto(`http://localhost:${String(port)}/`);
      await page.waitForFunction(() => window.blast2dGpu !== undefined);
      pages.push(page);
    }
    return await work(pages);
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1]?.endsWith('blast2d-gpu.ts')) {
  const [mode, a, b] = process.argv.slice(2);
  await withGpuPage(async (page) => {
    if (mode === 'rest' || mode === 'conserve') {
      const c: unknown = JSON.parse(a ?? '{}');
      const steps = Number(b ?? 200);
      const out = await page.evaluate(
        async ([m, cc, s]) =>
          m === 'rest'
            ? window.blast2dGpu?.restCheck(cc as never, s)
            : window.blast2dGpu?.conservationCheck(cc as never, s),
        [mode, c, steps] as const
      );
      console.log(JSON.stringify(out));
    } else if (mode === 'run') {
      const c: unknown = JSON.parse(a ?? '{}');
      const out = await page.evaluate(async (cc) => window.blast2dGpu?.runCaseGpu(cc as never), c);
      if (b !== undefined) writeFileSync(b, `${JSON.stringify(out)}\n`);
      else console.log(JSON.stringify(out).slice(0, 400));
    } else if (mode === 'runs') {
      const cases = JSON.parse(readFileSync(a ?? '', 'utf8')) as { key: string; case: unknown }[];
      const dir = b ?? 'scripts/tmp/blast2d-gpu-cache';
      mkdirSync(dir, { recursive: true });
      for (const [n, item] of cases.entries()) {
        const file = join(dir, `${item.key}.json`);
        if (existsSync(file)) continue;
        const out = await page.evaluate(
          async (cc) => window.blast2dGpu?.runCaseGpu(cc as never),
          item.case
        );
        writeFileSync(file, `${JSON.stringify(out)}\n`);
        const o = out as { steps?: number; seconds?: number };
        console.log(
          `${String(n + 1)}/${String(cases.length)} ${item.key} ${String(o.steps)} steps ${String(o.seconds?.toFixed(1))} s`
        );
      }
    } else throw new Error(`unknown mode ${String(mode)}`);
  });
}
