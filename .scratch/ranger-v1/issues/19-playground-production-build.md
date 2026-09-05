# 19 — Serve the playground as the production build, in place of the docs site

Status: resolved
Blocked by: None (can start immediately)
Related: issue 11 (docs site, current `vercel.json`), issue 10 (packaging, the library's own
`dist/` output)

## Goal

`vercel.json` at the repo root currently builds and deploys `site/` (the VitePress docs
site) to a custom domain. The playground is judged enough of a showcase on its own; the
deployed Vercel project should serve it instead. `site/` stays exactly as it is for now —
this ticket is a safe, previewable swap, not a deletion (that's issue 20, blocked by this
one).

## Scope

- A production build of `playground/` (the root `index.html` + `playground/main.ts` app,
  built via Vite in ordinary app mode, not library mode) that runs standalone with no dev
  server.
- Its own output directory, distinct from the library's own `dist/` (`scripts/build.mjs`,
  issue 10) — the two builds must never collide or overwrite one another. `npm run build`
  (the library) and this playground build stay two separate, independently runnable
  commands.
- `vercel.json` updated to build and serve the playground's output directory instead of
  `site/.vitepress/dist`.
- A root `package.json` script for the playground build (e.g. alongside the existing `dev`
  script), so it's runnable and CI-checkable the same way the library build is.

## Acceptance criteria

- A fresh clone can run the new playground-build script and get a static build that opens
  and works standalone (every example interactive, no console errors) with no dev server
  running.
- That build's output directory is never the same as, and never written into, the
  library's `dist/` — running both builds back to back leaves both outputs intact.
- `vercel.json`'s `buildCommand`/`outputDirectory` point at the playground build.
- `npm run build` (the library) is unaffected — same output, same `verify:build` result as
  before this ticket.

## Out of scope

Deleting `site/` or anything wired to it — that's issue 20, which this one blocks (so the
swap can be verified, e.g. in a Vercel preview, before the old site is removed).

## Comments

**Resolved.** A new `vite.config.playground.ts` (separate from the dev-only
`vite.config.ts`, which `scripts/build.mjs` already ignores via `configFile: false`)
builds the root `index.html` + `playground/main.ts` in ordinary app mode, with
`outDir: 'playground-dist'` and `base: './'` so the build opens standalone from a plain
static file server with no absolute-path assumptions. A new root script,
`"build:playground": "vite build --config vite.config.playground.ts"`, runs it.
`vercel.json`'s `buildCommand`/`outputDirectory` now point at `build:playground` /
`playground-dist` instead of `site/`. `playground-dist/` was added to `.gitignore`.

Verified: `npm run build` (library, → `dist/`) and `npm run build:playground` (→
`playground-dist/`) run back to back with both outputs intact; `playground-dist/` served
via a static file server (`serve`) returns 200 for `index.html` and its JS asset with no
console errors; `npm run verify:build` still passes unaffected.
