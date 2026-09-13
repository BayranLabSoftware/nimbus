import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, renameSync, rmdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

const basePath = process.env.BASE_PATH ?? '/';

/**
 * vite-plugin-cesium builds its runtime URL as `join(base, 'cesium/')`
 * — correct — but then copies the library to that same path *inside*
 * the output directory. With a root base the two coincide and nobody
 * notices. With a sub-path base they diverge: the page asks for
 * `/nimbus/cesium/Cesium.js` while the file sits at
 * `dist/nimbus/cesium/Cesium.js`, which serves as
 * `/nimbus/nimbus/cesium/Cesium.js`. The result is a 404 on the
 * library that draws the globe — the page loads, the globe never does.
 *
 * Moving the folder back up after the bundle closes fixes it for every
 * consumer of a sub-path build, not just for one CI workflow.
 */
function relocateCesiumForSubPath(): Plugin {
  return {
    name: 'nimbus:relocate-cesium-for-sub-path',
    apply: 'build',
    closeBundle: {
      // The Cesium plugin copies in its own closeBundle. Rollup runs
      // that hook in parallel by default, so a plain handler here
      // races the copy and usually loses. `sequential` + `post` puts
      // this after every other closeBundle has finished.
      sequential: true,
      order: 'post',
      handler() {
        if (basePath === '/') return;
        const outDir = resolve(rootDir, 'dist');
        const misplaced = join(outDir, basePath, 'cesium');
        if (!existsSync(misplaced)) return;
        renameSync(misplaced, join(outDir, 'cesium'));
        const wrapper = join(outDir, basePath.split('/').filter(Boolean)[0] ?? '');
        try {
          // rmdir, not rm -rf: it throws on a non-empty directory, and
          // if anything else legitimately lives in there, leaving it
          // alone beats deleting it silently.
          rmdirSync(wrapper);
        } catch {
          // not empty, so not ours to remove
        }
      },
    },
  };
}

/**
 * The commit a build is made from, so every simulation report the
 * application prints can say which model produced it and link to the
 * validation report committed beside that model.
 *
 * CI hands over the exact SHA; anywhere else git is asked. A working
 * tree with uncommitted changes to tracked files is marked, because
 * a report stamped with a commit whose code it does not run would be
 * a precise-looking lie. The file mode bit is ignored — a checkout
 * that only flipped an executable flag runs the same model.
 */
function buildCommit(): { sha: string | null; dirty: boolean } {
  const git = (args: string): string =>
    execSync(`git ${args}`, { cwd: rootDir, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  try {
    const sha = process.env.GITHUB_SHA ?? git('rev-parse HEAD');
    const dirty = git('-c core.fileMode=false status --porcelain --untracked-files=no') !== '';
    return { sha: sha === '' ? null : sha, dirty };
  } catch {
    // No git and no CI: a tarball build. Say so rather than guess.
    return { sha: null, dirty: false };
  }
}

const commit = buildCommit();

export default defineConfig({
  // GitHub Pages serves a project site from a sub-path
  // (/<repo>/), so the built asset URLs have to carry it. The
  // workflow sets BASE_PATH; everywhere else — dev server, Cloudflare
  // Pages on a root domain — the default '/' is correct and nothing
  // downstream has to know this variable exists.
  base: basePath,
  define: {
    __NIMBUS_COMMIT__: JSON.stringify(commit.sha),
    __NIMBUS_COMMIT_DIRTY__: JSON.stringify(commit.dirty),
  },
  plugins: [react(), cesium(), relocateCesiumForSubPath()],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '@physics': resolve(rootDir, 'src/physics'),
      '@scene': resolve(rootDir, 'src/scene'),
      '@ui': resolve(rootDir, 'src/ui'),
      '@data': resolve(rootDir, 'src/data'),
      '@store': resolve(rootDir, 'src/store'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
