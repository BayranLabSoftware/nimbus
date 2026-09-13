/**
 * Which model this build is.
 *
 * A number a laboratory can trust has to be traceable to the code that
 * produced it, and the printed simulation report is where a number
 * leaves the application. So the report carries the commit, and links
 * to the validation report committed beside it — which CI keeps
 * byte-for-byte in step with the code, so the copy at that commit
 * describes exactly the model that printed the page.
 */

/** Where the code — and every commit a report can name — lives. */
export const REPOSITORY_URL = 'https://github.com/BayranLabSoftware/nimbus';

export interface BuildInfo {
  /** Full SHA, or null when the build could not tell. */
  commit: string | null;
  /** Built from a working tree with uncommitted changes. */
  dirty: boolean;
}

export const BUILD_INFO: BuildInfo = {
  // `typeof` rather than a direct read: Vitest does not load the Vite
  // config, so under test these identifiers do not exist at all.
  commit: typeof __NIMBUS_COMMIT__ === 'string' ? __NIMBUS_COMMIT__ : null,
  dirty: typeof __NIMBUS_COMMIT_DIRTY__ === 'boolean' ? __NIMBUS_COMMIT_DIRTY__ : false,
};

/** Seven characters, the length git itself abbreviates to. */
export function shortCommit(commit: string): string {
  return commit.slice(0, 7);
}

export function commitUrl(commit: string): string {
  return `${REPOSITORY_URL}/commit/${commit}`;
}

/** The validation report for exactly this model. */
export function validationReportUrl(commit: string): string {
  return `${REPOSITORY_URL}/blob/${commit}/docs/VALIDATION_REPORT.md`;
}
