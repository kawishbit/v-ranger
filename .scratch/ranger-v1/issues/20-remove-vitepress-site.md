# 20 — Remove the VitePress docs site

Status: resolved
Blocked by: 19
Related: issue 11 (docs site, being removed)

## Goal

With the playground now the deployed showcase (issue 19), the VitePress site in `site/` is
redundant. Remove it and everything that was wired to its existence, so the repo has one
showcase and no dangling references to the old one.

## Scope

- Delete `site/` entirely (its own `package.json`, VitePress config, pages, snippets, and
  scripts).
- Remove the root `package.json` scripts that only exist for it: `verify:docs-drift`,
  `verify:docs-a11y`.
- Remove README's "Documentation site" section and any other mention of the VitePress site
  or its old domain, replacing it with a short pointer at the playground as the showcase
  and at Vercel as where it deploys from.
- `package.json`'s `homepage` field currently points at the old site's domain
  (`v-ranger.kawishbit.com`); point it at the repository URL instead, since there is no
  new public domain yet — updating it again once a real one exists is a separate, later
  concern.
- No replacement for `verify:docs-drift`'s guarantee (that every prop/event/slot/token in
  spec.md is documented somewhere) is being added elsewhere. This is a deliberate drop, not
  an oversight — confirm nothing else in the repo (CI config, other scripts) still expects
  either removed script to exist.

## Acceptance criteria

- `site/` no longer exists in the repo.
- `npm run` lists no `docs-drift`/`docs-a11y` scripts, and nothing else in the repo
  (`package.json`'s own scripts, any CI config) references them or `site/`.
- README no longer mentions the VitePress site, and instead points at the playground and
  its Vercel deployment (from issue 19) as the showcase.
- `package.json`'s `homepage` points at the repository, not the old docs domain.
- `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` (the library) all
  stay clean with `site/` gone.

## Out of scope

Registering a new public domain or Vercel project — that remains the one-time human step
issue 11 already called out, just now pointed at the playground instead of the old site.

## Comments

**Resolved.** `site/` deleted entirely. `verify:docs-drift` and `verify:docs-a11y` removed
from root `package.json`, along with `'site/**'` from `eslint.config.js`'s `ignores`
(with its accompanying comment updated to stop mentioning `site/`). README's
"Documentation site" section replaced with a "Playground" section pointing at
`playground/` and its Vercel deployment. `package.json`'s `homepage` now points at
`https://github.com/kawishbit/v-ranger` instead of the old `v-ranger.kawishbit.com`
domain.

There is no `.github/` CI config in this repo to update. A repo-wide grep confirms no
remaining reference to `site/`, `docs-drift`, or `docs-a11y` outside `.scratch/`'s own
historical issue/spec docs (11, 15, 20 itself, and the frozen `spec.md`), which are left
as a record of what issue 11 originally specified rather than rewritten. `npm run`
lists no `docs-drift`/`docs-a11y` scripts; `npm run typecheck`, `lint`, `test` and
`build` all stay clean with `site/` gone.
