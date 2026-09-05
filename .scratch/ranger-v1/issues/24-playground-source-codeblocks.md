# 24: Show each playground example's own source code alongside its live demo

**What to build:** Every section of the playground (`OrdinalAxisExample.vue`,
`NumericAxisExample.vue`, `UncontrolledExample.vue`, `LabelsIconsExample.vue`,
`SlotsExample.vue`, `GradientPresetsExample.vue`, `OtherShapesExample.vue`,
`SizesExample.vue`, `StatesExample.vue`, `TokensExample.vue`, `RtlExample.vue`) renders a
codeblock of its own real source next to its live demo — the standard "code sample above,
running example below" pattern from Vue component documentation sites. The code shown
must be the actual file that's running, sourced at build time (e.g. via Vite's `?raw`
import suffix) rather than typed/copied separately, so the two can never drift apart.

**Blocked by:** 22 (touches the same example files 22 edits — `OtherShapesExample.vue`
and `playground/data.ts` — sequencing after avoids reworking the vlider-demo removal and
the source-display wiring in the same file twice)

**Status:** resolved

- [x] Every one of the eleven playground sections shows a codeblock of its own source directly alongside its live demo.
- [x] The displayed code is pulled from the real `.vue` file at build/dev time (no hand-copied duplicate string that can go stale).
- [x] Running `npm run dev` and opening the playground shows both the code and the working demo for every section, with no console errors.
- [x] `npm run build:playground` still produces a working standalone build with the codeblocks present.
- [x] `npm run typecheck` and `npm run lint` stay clean.

## Comments

**Resolved.** Each of the eleven `playground/examples/*.vue` files imports its own source
via Vite's `?raw` suffix (e.g. `import source from './OrdinalAxisExample.vue?raw'`) and
renders it through a new shared `playground/CodeBlock.vue` above its live demo, so the
codeblock can never drift from the running example. `npm run build:playground` produces a
working standalone build with every codeblock present; `npm run typecheck` and `lint`
stay clean.

While re-verifying this batch, found and fixed a gap left over from this work:
`eslint.config.js`'s `ignores` never picked up `playground-dist/**`, so `npm run lint`
broke on the generated bundle whenever a local `playground-dist/` build existed (as one
did, left over from this ticket's own build verification). Fixed alongside issue 21 — see
its Comments.
