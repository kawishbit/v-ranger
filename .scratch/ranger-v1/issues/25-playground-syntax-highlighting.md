# 25: Syntax-highlighted code and value blocks in the playground

**What to build:** Every `CodeBlock.vue` instance in the playground currently renders its
source as plain, unhighlighted text inside a bare `<pre><code>`. Wire in a popular,
well-maintained syntax-highlighting library (e.g. Shiki, Prism, or highlight.js) so the
Vue SFC source shown alongside each of the eleven demos is properly highlighted. The same
library should also highlight the JSON `lastCommit` value blocks that `OrdinalAxisExample`
and `NumericAxisExample` render via `useLastCommit` (currently a bare `<pre>{{
lastCommit }}</pre>`), so every codeblock and value block in the playground reads as one
consistent, highlighted system rather than two different unstyled `<pre>` treatments.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Every one of the eleven playground sections' `CodeBlock.vue` renders its Vue source
      with real syntax highlighting (keywords, tags, strings, etc. visually distinguished).
- [x] The `lastCommit` JSON blocks in `OrdinalAxisExample.vue` and `NumericAxisExample.vue`
      render with JSON syntax highlighting, using the same library.
- [x] Highlighting happens client-side or at build time without breaking
      `npm run build:playground`'s standalone output (no console errors opening it).
- [x] `npm run dev` shows highlighted code and value blocks for every section, with no
      console errors.
- [x] `npm run typecheck` and `npm run lint` stay clean.

## Comments

**Resolved.** Wired in Shiki via a new shared `playground/highlighter.ts`, built with
`createHighlighterCore` (from `shiki/core`) rather than the top-level `shiki` package's
bundled `createHighlighter`: the latter's `langs`/`themes` are looked up by a runtime
string, which a bundler cannot tree-shake, so it pulled in every language and theme shiki
ships (300+ chunks) as separate build output. Importing `@shikijs/langs/vue`,
`@shikijs/langs/json`, and `@shikijs/themes/github-dark` by their own module path instead
keeps the standalone build to a single JS chunk. The highlighter also uses the JS regex
engine (`shiki/engine/javascript`), never the WASM oniguruma one `shiki` defaults to, so
there is no `fetch` for a `.wasm` asset — confirmed the standalone build has zero `.wasm`
references and opens with no console errors when served (verified via `vite preview`;
opening any Vite ESM build via a bare `file://` URL is blocked by the browser's own CORS
policy on module scripts, independent of this change).

`CodeBlock.vue` now takes an optional `lang` prop (`'vue' | 'json'`, default `'vue'`) and
renders Shiki's output through `v-html`. `OrdinalAxisExample.vue` and
`NumericAxisExample.vue`'s `lastCommit` blocks now render via
`<CodeBlock :code="lastCommit" lang="json" />` instead of a bare `<pre>`, and the
now-unused global `pre { ... }` rule in `App.vue` was removed.

`npm run typecheck`, `npm run lint`, `npm run format:check`, and the full unit suite are
clean.

**Follow-up fix:** a user reported `lastCommit` staying "nothing committed yet" after
dragging the Ordinal/Numeric Axis sliders. Root cause: `CodeBlock.vue`'s `watchEffect`
read `props.code` *after* `await highlighter()` — `watchEffect` only tracks reactive reads
made synchronously, before an async callback's first `await`, so `props.code` was never
registered as a dependency and later changes to `lastCommit` never re-triggered the
highlight. Fixed by capturing `props.code`/`props.lang` into local variables before the
`await`. Reproduced the bug by temporarily reverting the fix and confirming `lastCommit`'s
rendered text stayed frozen after a real drag, then confirmed the fix updates it.
