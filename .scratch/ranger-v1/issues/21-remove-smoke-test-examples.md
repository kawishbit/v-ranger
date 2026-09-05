# 21: Remove the package-installation smoke-test examples/ folder

**What to build:** With the playground now the deployed showcase (issues 19-20), the
top-level `examples/` folder — the packed-tarball smoke-test apps for Vite, Nuxt, a plain
CDN `<script>` tag, and Webpack (issue 10) — is judged not worth its ongoing maintenance
cost. Remove it entirely, and everything wired to its existence, so the repo has one
demo surface (the playground) and no dangling references to the old verification step.

Related: issue 10 (packaging, which originally added `examples/`).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `examples/` no longer exists in the repo (cdn, nuxt, vite-vue, webpack, verify.mjs, and their lockfiles/node_modules).
- [ ] The root `package.json`'s `verify:examples` script is removed, and nothing else in the repo (other scripts, lint config's `ignores`, CI config) references `examples/` or `verify:examples`.
- [ ] README no longer mentions the smoke-test examples or `npm run verify:examples`.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` (the library) all stay clean with `examples/` gone.
- [ ] Issue 10's own ticket file is left untouched as a historical record (do not rewrite it) — this ticket supersedes it going forward.
