# 10 — Packaging, entries and SSR check

Status: resolved
Blocked by: 01, 03
Spec: [../spec.md](../spec.md) §8

## Goal

`npm install v-ranger` works in Vite, Nuxt 3, Webpack and from a CDN, and the tarball contains nothing it shouldn't.

## Scope

**Partially landed in issue 01, and not verified:** `package.json` already carries
`main`/`module`/`types`, a two-entry `exports` map (`.` and `./style.css`), `sideEffects`
and `files`. Issue 01 needed them for the build output to resolve at all. Treat packaging
as unfinished: `./full` is missing, nothing is verified against a real consumer, and the
UMD entry currently requires `VRanger.default` for the plugin (see the note in
`vite.config.ts`).

- `exports` map: `.` (ESM + UMD + types), `./style.css`, `./full` (an entry that imports the CSS, giving a zero-config path without forcing it on anyone — ADR-0004 rejected JS style injection).
- `sideEffects` set so the CSS is never tree-shaken away while the JS still is.
- `files`: `dist/`, `README.md`, `LICENSE`. **No `src/**`** — vlider shipped source only because its SCSS had to be compiled downstream, which no longer applies.
- Types verified from a consumer's perspective: props, emits and slots all infer, and `v-model` narrows to the stop `value` union on an ordinal axis.
- Smoke tests in `examples/`, each installing from a packed tarball: a Vite + Vue 3 app, a Nuxt 3 app (SSR), and a plain `<script src>` UMD page with no build step.
- `README.md`: install, quickstart reproducing the screenshot, prop/event/slot tables, token table, and the **vlider migration table**.

Also verify, now that `axis.ts` is actually reachable from the entry, that `warn()` is
stripped: no `[ranger]` string and no `console.warn` from the axis core in `dist/`. Issue 02
checked this with a throwaway build because nothing imported the module yet.

## Acceptance criteria

- `npm publish --dry-run` lists only the intended files, and the tarball is small enough to justify itself.
- All three smoke apps run, and the Nuxt one renders server-side with no hydration mismatch.
- A deliberate type error in a consumer app (wrong `v-model` type against the stop values) is caught by `vue-tsc`.
- `import 'v-ranger/style.css'` and `import 'v-ranger/full'` both resolve under Vite and Webpack.

## Out of scope

Publishing itself (12).

## Comments

### Implementation

- **Two library builds, not one config.** `scripts/build.mjs` calls Vite's `build()` API
  twice — `.` as ES + UMD, `full` as ES + CJS — because Vite refuses `umd`/`iife` once
  `build.lib.entry` is an object, and each entry needs a different format set anyway.
  `vite.config.ts` shrank to just the dev server over `playground/`.
- **`full`'s stylesheet import is added after the build, not written in `src/full.ts`.**
  Vite's library build extracts an SFC's `<style>` to its own CSS file but does not add a
  JS-side import for it — correct for `.` (ADR-0004), wrong for `full`. `build.mjs`
  prepends the one line each of `dist/full.js`/`dist/full.cjs` needed, after the build.
- **`scripts/verify-build.mjs`** reads the four built entries and fails if `[ranger]` or
  `console.warn` survive — the real check issue 02 could only fake with a throwaway
  build, now that the axis core is actually reachable from an entry.
- **`type-tests/`** (outside `tests/` and the main tsconfig's `include`, so `vue-tsc
  --noEmit` never sweeps it up) holds `good.vue` (props/emits/slots inference, `v-model`
  narrowing) and `bad.vue` (a boolean bound to string-valued stops — the deliberate error
  a same-shape string literal turned out *not* to be: Vue's generic inference unions
  compatible candidates rather than erroring, so the mismatch has to be a type nothing
  can absorb). `scripts/verify-types.mjs` asserts each landed the way it should.
- **`examples/`** has four real smoke apps — `vite-vue`, `nuxt`, `cdn`, and `webpack` (the
  fourth is not in the ticket's app list, but the ticket's own acceptance criteria name
  Webpack resolution as a separate claim from the three-app list, and it deserved the
  same real-install treatment) — each installing `v-ranger` from a packed
  `file:../v-ranger-local.tgz`, never a workspace link. `examples/verify.mjs` packs,
  installs, builds, and — for every entry point an app used — asserts the page renders
  with the gradient actually painted, not just that the module resolved.

### A real bug this caught

The first cut of `package.json`'s `sideEffects: ["**/*.css"]` was wrong for `full`:
Webpack trusts a `sideEffects` glob at the *whole-module* level, so `dist/full.js` — a
`.js` file, not matched by `**/*.css` — was ruled side-effect-free and tree-shaken to a
literal empty file wherever nothing else used its exports, taking its `import
'./v-ranger.css'` down with it. Vite/Rollup didn't hit this (nothing in `examples/vite-
vue` exercised `full` until this was caught, at which point a second Vite entry was
added specifically to check it too). Fixed by listing `./dist/full.js` and
`./dist/full.cjs` explicitly in `sideEffects` alongside the CSS glob. Caught because
`examples/verify.mjs` checks computed styles, not just "did the bundle build" — the
build succeeded both before and after the fix; only the page actually looked wrong.

### After code review

- **Type verification now runs against `../dist`, not `../src`.** The scope line reads
  "types verified from a **consumer's perspective**"; checking the source the
  declarations are generated *from* cannot tell you whether generation itself lost
  something (a `.d.ts`-emission regression would have passed both fixtures silently).
  `good.vue`/`bad.vue` now import from the built package, the same way `examples/
  vite-vue` already did — `npm run build` has to run first, same as `verify:build`.
- **`examples/verify.mjs`'s two identical entry-checking loops (vite-vue, webpack) are
  now one `checkEntries()` helper.** The review called this out as Duplicated Code; it
  also surfaced a real latent bug the duplication was hiding — the webpack section's
  static server was never `.close()`d, unlike every other section's.
- **The word "slider" is now "Ranger" everywhere in this ticket's prose** (README,
  `examples/cdn/index.html`) except the two places CONTEXT.md's glossary exempts:
  `role="slider"` (the literal ARIA role) and text a screen reader actually announces.
  The glossary's own reasoning — "ambiguous between three different things" — is about
  *this* component's docs specifically, so copying spec.md's own pre-glossary wording
  into new prose wasn't a pass either.
- **Not changed: the CDN example still uses the named export over the plugin.** The
  review confirmed this reads as the ticket's own "may give the UMD build its own entry
  to improve that" framed as optional, not required — recorded as a decision, not
  revisited.
