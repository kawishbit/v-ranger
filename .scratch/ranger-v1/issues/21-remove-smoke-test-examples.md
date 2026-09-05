# 21: Remove the package-installation smoke-test examples/ folder

**What to build:** With the playground now the deployed showcase (issues 19-20), the
top-level `examples/` folder — the packed-tarball smoke-test apps for Vite, Nuxt, a plain
CDN `<script>` tag, and Webpack (issue 10) — is judged not worth its ongoing maintenance
cost. Remove it entirely, and everything wired to its existence, so the repo has one
demo surface (the playground) and no dangling references to the old verification step.

Related: issue 10 (packaging, which originally added `examples/`).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `examples/` no longer exists in the repo (cdn, nuxt, vite-vue, webpack, verify.mjs, and their lockfiles/node_modules).
- [x] The root `package.json`'s `verify:examples` script is removed, and nothing else in the repo (other scripts, lint config's `ignores`, CI config) references `examples/` or `verify:examples`.
- [x] README no longer mentions the smoke-test examples or `npm run verify:examples`.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` (the library) all stay clean with `examples/` gone.
- [x] Issue 10's own ticket file is left untouched as a historical record (do not rewrite it) — this ticket supersedes it going forward.

## Comments

**Resolved.** `examples/` (cdn, nuxt, vite-vue, webpack, verify.mjs, and their
lockfiles/node_modules) deleted entirely. `verify:examples` removed from root
`package.json`; no other script, lint config, or CI config referenced it or `examples/`
(there is no `.github/` CI config in this repo). README's smoke-test mention removed.
Issue 10's ticket file left untouched.

While re-verifying this batch, found and fixed a related gap: `eslint.config.js`'s
`ignores` only listed `dist/**`, not `playground-dist/**` (issue 19's build output), so
`npm run lint` broke on a generated bundle whenever a local `playground-dist/` existed.
Added `playground-dist/**` to the ignores list. `npm run typecheck`, `lint`, `test`, and
`build` (library) all pass clean.
