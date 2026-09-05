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

**Status:** ready-for-agent

- [ ] Every one of the eleven playground sections shows a codeblock of its own source directly alongside its live demo.
- [ ] The displayed code is pulled from the real `.vue` file at build/dev time (no hand-copied duplicate string that can go stale).
- [ ] Running `npm run dev` and opening the playground shows both the code and the working demo for every section, with no console errors.
- [ ] `npm run build:playground` still produces a working standalone build with the codeblocks present.
- [ ] `npm run typecheck` and `npm run lint` stay clean.
