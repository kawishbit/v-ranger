# 03 — Component shell: interaction engine + presentation layer

Status: resolved
Blocked by: 01, 02
Spec: [../spec.md](../spec.md) §4, §5 · [ADR-0001](../../../docs/adr/0001-hybrid-native-range-input.md)

## Goal

`<Ranger>` renders and works: a real range input driving a visually separate presentation layer, on both axes.

## Already landed in issue 01

`src/index.ts` (named `Ranger` export, default plugin with `install()`) and
`inheritAttrs: false` with attrs forwarded to the engine both exist already — issue 01
needed them to prove the build and the UMD global. Extend them; don't rewrite them. The
engine is still visible (`opacity: 0` is this ticket's job) and `src/ranger.css` is an
empty placeholder.

## Worth reassessing here

`src/axis.ts` branches on `axis.kind` in five places. As the module's first real consumer,
this ticket is where to judge whether two axis strategy objects would be clearer, or
whether the branching is fine at this size. Also: `positionToValue` returns `onGrid as V`
because the generic cannot know that a numeric axis carries `number`. Component-level
overloads are the honest fix.

## Scope

- `src/Ranger.vue`, `<script setup lang="ts">`, `inheritAttrs: false` — `class`/`style` to the root, all other attrs to the engine.
- **Interaction engine**: one `<input type="range">` absolutely positioned over the track at `opacity: 0`, `min`/`max`/`step`/`value` derived from the axis. Never `display: none` or `visibility: hidden`. Carries `name` for form participation.
- **Presentation layer**: root → track → fill → thumb, plus a stop list. Positioned from `--ranger-position`; every decorative node is `aria-hidden` with `pointer-events: none`.
- `v-model` per ADR-0003: `update:modelValue` on engine `input` (live, mid-drag), `change` with a `Resolved` payload on commit. Never emit on mount or on prop change. Uncontrolled use starts unset and tracks internally.
- Root data attributes: `data-axis`, `data-size`, `data-unset`, `data-disabled`, `data-readonly`, `data-dragging`.
- `src/index.ts`: named `Ranger` export, `gradients`, types, and a default plugin export with `install()`.
- Baseline CSS in `src/ranger.css`, plain CSS, **logical properties only** — no `left`/`right`/`margin-left` anywhere (ADR-0004).

## Acceptance criteria

- Both axes render and update; the thumb's visual position matches `valueToPosition` at every step.
- Dragging the engine moves the visible thumb; the engine's `value` is the only source of truth and the two never disagree.
- No `document`/`window` access in setup or render; `renderToString` works.
- Nothing is written to `document.head`, and no `id` prop exists. Two Rangers on one page with identical props do not interfere (the vlider bug in ADR-0001).
- `aria-label` passed to `<Ranger>` lands on the engine, not the root.
- `grep -nE '(^|[^-])\b(left|right):' src/*.css` returns nothing.

## Out of scope

Gradients (04), labels/icons (05), ARIA text and keyboard verification (06), state styling (07).

## Comments

**Resolved.** 99 tests (88 unit, 11 browser), `axis.ts` still at 100% branch coverage.

### The two judgements this ticket was handed

**Axis strategy objects: not worth it — keep the discriminated union.** Issue 02 deferred
this here as the first real consumer. The branch count actually went 5 → 6 (`engineRange`
joined them), so on a pure count the case got worse. But the count was never the right
test: a `switch` smell is about the same cascade recurring *across call sites*, and the
fix was to make sure it does not. `Ranger.vue` reads `axis.kind` exactly once, to render
`data-axis`, and never to decide anything. Everything the component needs to drive a native
input now comes from `engineRange` / `engineToPosition` / `positionToEngine`, so the
branching is contained in one module where each arm returns a genuinely different shape.
Strategy objects would also cost the narrowing that makes `NumericAxis` and `PinnedStop`
type-honest, and `resolveAxis` would still have to branch to pick a strategy. Revisit only
if a second consumer starts branching on `kind`.

**`positionToValue` overloads: added, but on `axis.ts`, not the component.** The ticket
suggested component-level overloads. The `as V` cast is gone, but the honest fix turned out
to be widening the public return to `V | number | null` — which is simply true — plus a
`NumericAxis` overload that returns `number` for callers who have narrowed. The component
deliberately does *not* narrow: doing so would reintroduce the `kind` branch the decision
above just removed, and both arms feed the same emit. The overload is exercised by a
narrowing test instead.

### Decisions taken during implementation

- **An off-grid numeric `modelValue` is not corrected.** `resolve`'s comment left this to
  issue 03. A native range input cannot hold 43 on a step of 5, so the engine and the thumb
  both show 45 — the engine is the source of truth and the two must never disagree
  (ADR-0001). Emitting a correction would be emitting on a prop change, which ADR-0003
  forbids, so instead a new `value-off-step` diagnostic tells the developer.
- **The thumb travels the same inset path as the engine.** Measured in Chromium: a native
  range input insets its value→x mapping by half its own ~16px thumb, so painting the
  presentation thumb edge to edge left it up to ~8px from the pointer at the extremes
  (`appearance: none` does *not* change this — measured). The thumb now travels
  `half-thumb → 100% - half-thumb`, which is also how every slider is drawn. Residual error
  is ~2px at the default size and grows with `--ranger-thumb-size`; erasing it entirely
  would mean sizing the native thumb through vendor pseudo-elements, which ADR-0001 forbids,
  so that is an ADR question rather than a CSS one. Pinned by a browser test.
- **A baseline `:focus-visible` ring ships here**, though issue 06 owns accessibility. Making
  the engine `opacity: 0` is this ticket's change, and ADR-0001 names the drawn ring as its
  direct consequence — shipping an intermediate state with no focus indicator at all was the
  worse option. 06 still owns proving AA contrast and setting the token default.
- **`readonly` refuses value changes** (a two-line guard in `onInput`). 07 owns the state's
  looks and its announcement, but a declared prop that silently did nothing would have been
  a trap introduced here.
- **`modelValue` defaults to `undefined`, not `null`.** Spec §4.3 says `null`; the two are
  behaviourally identical at the start, but only `undefined` distinguishes "no `v-model`"
  from "bound and unset", which is what lets uncontrolled use track internally (ADR-0003).

### Left to the tickets that own them

- **`gradients` and `type Gradient` are not exported** from `src/index.ts`, though this
  ticket's scope listed them. Issue 04 owns `src/gradients.ts` and the preset ramps;
  inventing them here to satisfy a scope bullet would have pre-empted 04's acceptance
  criteria. Everything else in spec §4.6 is exported.
- **`--ranger-stop-position`** is new, and is recorded in spec §6 under the component-set
  tokens so issue 08's "the token list matches the stylesheet exactly" test stays
  satisfiable. `--ranger-stop-count` is *not* set: nothing reads it yet, and 08 owns it.
- **`ranger.css` reads tokens with inline fallbacks** rather than declaring them on the root.
  Issue 08 owns the declaration block, the theme and the size scale; inline fallbacks keep
  the component visible in the meantime without half-committing the public surface.
- **Keyboard from unset is slightly off.** Unset parks the engine at its minimum, so on an
  ordinal axis the first ArrowRight selects the *second* stop and ArrowLeft does nothing at
  all (the engine is already at its minimum, so no `input` fires). Issue 06 owns keyboard
  behaviour and should decide whether the first key press ought to select the nearer end.
- Per-stop `data-selected` / `data-disabled` on the markers were dropped: nothing styles them
  yet, and 05 and 07 own that conveyance.
