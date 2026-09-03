# 10 — Packaging, entries and SSR check

Status: ready-for-agent
Blocked by: 01, 03
Spec: [../spec.md](../spec.md) §8

## Goal

`npm install v-ranger` works in Vite, Nuxt 3, Webpack and from a CDN, and the tarball contains nothing it shouldn't.

## Scope

- `exports` map: `.` (ESM + UMD + types), `./style.css`, `./full` (an entry that imports the CSS, giving a zero-config path without forcing it on anyone — ADR-0004 rejected JS style injection).
- `sideEffects` set so the CSS is never tree-shaken away while the JS still is.
- `files`: `dist/`, `README.md`, `LICENSE`. **No `src/**`** — vlider shipped source only because its SCSS had to be compiled downstream, which no longer applies.
- Types verified from a consumer's perspective: props, emits and slots all infer, and `v-model` narrows to the stop `value` union on an ordinal axis.
- Smoke tests in `examples/`, each installing from a packed tarball: a Vite + Vue 3 app, a Nuxt 3 app (SSR), and a plain `<script src>` UMD page with no build step.
- `README.md`: install, quickstart reproducing the screenshot, prop/event/slot tables, token table, and the **vlider migration table**.

## Acceptance criteria

- `npm publish --dry-run` lists only the intended files, and the tarball is small enough to justify itself.
- All three smoke apps run, and the Nuxt one renders server-side with no hydration mismatch.
- A deliberate type error in a consumer app (wrong `v-model` type against the stop values) is caught by `vue-tsc`.
- `import 'v-ranger/style.css'` and `import 'v-ranger/full'` both resolve under Vite and Webpack.

## Out of scope

Publishing itself (12).
