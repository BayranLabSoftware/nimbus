# Release checklist — v1.0.0

Pre-flight for cutting a public release. Every item must be checked
or have a written reason in the release PR before pushing the
`v1.0.0` tag.

> **What only the maintainer can do** (everything else below can be
> prepared by anyone, and most of it is): sign and push the tag (it
> needs your signing key), enable Zenodo on your account, find the
> scientific reviewer in §5, name a real security contact, and choose the
> analytics domain. The tag is the one irreversible step — a published
> release and a minted DOI cannot be withdrawn, only superseded.

> **One-time vs per-release.** This file is the **one-time** pre-flight
> for the first public release (identity, copy, content, scientific
> sign-off, deploy wiring). For the **per-release** classifier
> (GO / CONDITIONAL GO / NO-GO) run before every tag, see
> [`RELEASE_READINESS.md`](RELEASE_READINESS.md) and
> `pnpm release:check`. Both must be clean before pushing `v1.0.0`.

## 1. Identity

- [x] Project name resolved — **Nimbus** (display) / **Nuclear & Impact Modeling & Blast Understanding System**
      (long form) / **nimbus** (technical).
- [x] All `PROJECT_NAME` / `Project Name` / `project-name` placeholders
      substituted.
- [x] All `GITHUB_USERNAME` placeholders substituted (repo:
      `BayranLabSoftware/nimbus` — the repository the code is pushed to;
      the landing page linked a different, unreachable one until
      14 September 2026).
- [x] `TBD` copyright holder replaced in `LICENSE` and `NOTICE`.
- [x] Placeholder contact addresses replaced in `CODE_OF_CONDUCT.md`
      and `SECURITY.md`.
- [ ] `PROJECT_TAGLINE` in `docs/DEVELOPMENT.md` updated to the final wording.

## 2. CI / deploy

- [ ] `.github/workflows/ci.yml` green on `main`.
- [ ] `.github/workflows/e2e.yml` matrix (chromium / firefox / webkit /
      mobile-chrome / mobile-safari) green on `main`.
- [ ] `.github/workflows/lighthouse.yml` reports accessibility = 1.0
      and current LCP / TBT / CLS on `main`.
- [ ] The production site serves the latest `main`. Today that is
      GitHub Pages (`.github/workflows/pages.yml`,
      https://bayranlabsoftware.github.io/nimbus/); the live bundle carries
      the commit it was built from, so check it rather than assume it.
- [ ] Cloudflare Pages, if it is to replace or join GitHub Pages;
      preview links open from every PR.

      The deploy job is gated on `ENABLE_CF_DEPLOY=true`. Before
      flipping it:

      1. Create a Pages project called `nimbus`.
      2. Add repo secrets `CLOUDFLARE_API_TOKEN` (Pages → Edit) and
         `CLOUDFLARE_ACCOUNT_ID`.
      3. Set `ENABLE_CF_DEPLOY=true` (Settings → Variables).
      4. Re-run the latest deploy workflow.

## 3. Analytics & privacy

- [ ] `VITE_PLAUSIBLE_DOMAIN` set in the Pages production environment
      (not preview, not dev).
      Register a free domain-restricted key on stadiamaps.com and add
      the deploy domain to it. The wiring in `Globe.tsx` is done: the
      key is appended to the basemap URL when the variable is set, and
      the URL stays keyless when it is not, so local development is
      untouched. Without the key on a public origin the tiles come
      back unauthorised and the globe renders black — silently, with
      nothing in the console.
- [ ] Plausible dashboard receives pageviews within 10 minutes of a
      deploy.
- [ ] Privacy / analytics note in the footer or About dialog.
- [ ] `SECURITY.md` lists a real disclosure channel.

## 4. Content

- [ ] Every preset renders with no TODO strings or placeholder
      captions, in IT and EN.
- [ ] `docs/ASSETS.md` matches `public/`. Every CC-BY asset has an
      in-app attribution line.
- [ ] `README.md` screenshots updated to the final branding.
- [ ] `docs/ART_DIRECTION.md` palette tokens match the production
      CSS custom properties.

## 5. Scientific review

- [ ] A scientifically-literate reviewer has signed off on the
      physics modules in the last 30 days. Earth scientist for the
      M3 modules, physicist or engineer for impact / explosion.
      Give them the validation page and `docs/VALIDATION_REPORT.md`
      first: the misses and their causes are the fastest way into
      where the model is weakest, and a review that starts there is
      worth more than one that starts from the formulas.
- [ ] Every citation in `docs/SCIENCE.md`, the citation tooltips,
      and the glossary points at a real paper or textbook chapter.

## 6. Release mechanics

- [ ] Promote `[Unreleased]` in `CHANGELOG.md` to a dated `[1.0.0]`
      heading. The section is months long; open it with the summary in
      [`RELEASE_NOTES_v1.0.0.md`](RELEASE_NOTES_v1.0.0.md), which is what
      the release workflow will put at the top of the GitHub release.
- [x] The validation report is current. Not a box to tick by hand any
      more: since 14 September 2026 CI fails any push whose committed
      `docs/VALIDATION_REPORT.md` differs from what the code generates.
- [ ] In the same commit: `CITATION.cff` gains `version: 1.0.0` and
      `date-released: <the tag's date>`.
- [ ] Enable the Zenodo GitHub integration for `BayranLabSoftware/nimbus`
      on zenodo.org (free; maintainer's account) **before** pushing the
      tag, so the release is archived and given a DOI. Zenodo reads
      `CITATION.cff`. Afterwards add the DOI to `CITATION.cff` as an
      `identifiers` entry and to the README.
- [ ] Tag: `git tag -s v1.0.0 -m "Release v1.0.0"` then
      `git push bayran v1.0.0` (the remote is `bayran`). Signed only.
- [ ] Create a GitHub release from the tag with the `[1.0.0]`
      changelog section as the body.
- [ ] Publish the announcement post on whichever channels you own.
- [ ] Pin the `v1.0.0` release on the repo homepage.

## 7. First 24 h

- [ ] Watch the Plausible dashboard (404s on `/cesium/*` are the
      most common regression).
- [ ] Watch the issues queue.
- [ ] Have a `v1.0.1` branch ready for hot-fixes.
