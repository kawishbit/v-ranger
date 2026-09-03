# 01 — Repo scaffolding and build pipeline

Status: ready-for-agent
Blocked by: —
Spec: [../spec.md](../spec.md) §3, §8

## Goal

A repo that builds, typechecks, lints and tests an empty component, so every later issue starts from a green baseline.

## Scope

- `package.json`: name `v-ranger`, version `0.1.0`, `"type": "module"`, MIT, repo/homepage/bugs pointing at `github.com/kawishbit/ranger`, `vue: ^3.4` as a **peer** dependency (and a dev dependency), Node `>=20` in `engines`, npm as the package manager.
- Vite library mode (`vite.config.ts`) with `@vitejs/plugin-vue`, entry `src/index.ts`, ESM + UMD output (UMD global `VRanger`), `vue` externalised.
- TypeScript `strict: true`; `vue-tsc` for declaration emit and typechecking.
- ESLint 9 flat config (`eslint-plugin-vue` + `typescript-eslint`) and Prettier. No conflicts between them.
- husky + lint-staged pre-commit: format and typecheck only — tests stay in CI so commits are fast.
- Vitest configured with two projects: `unit` (node/jsdom) and `browser` (Chromium via Playwright). The browser project may be empty at this point but must run.
- Scripts: `dev`, `build`, `typecheck`, `lint`, `format`, `test`, `test:browser`.
- **No preprocessor.** Nothing in the repo may pull in Sass (ADR-0004).

## Acceptance criteria

- `npm run build` emits ESM, UMD and `.d.ts` into `dist/`.
- `npm run typecheck`, `npm run lint` and `npm test` all pass on a placeholder component.
- A staged file with bad formatting is fixed by the pre-commit hook.
- `grep -ri sass` and `grep -ri scss` over the repo return nothing outside `docs/adr/`.

## Out of scope

CI workflows and changesets (issue 12); the `exports` map and packaging verification (issue 10).
