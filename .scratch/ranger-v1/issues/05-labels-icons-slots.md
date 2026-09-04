# 05 — Labels, icons and the stop slot

Status: resolved
Blocked by: 03
Spec: [../spec.md](../spec.md) §4.5, §5.3

## Goal

Reproduce the original layout — labels above, emoji below — **with no dependency of any kind**, and let consumers replace any part of it.

`Stop` in `src/types.ts` currently carries `value`, `at`, `label`, `color` and `disabled`.
`icon` and `image` are this ticket's to add - CONTEXT.md already documents them as part of
the shape.

## Scope

- Render each stop's `label` and `icon`/`image` around the track, positioned from the stop's own position value.
- `icon` accepts a **unicode string** (a text node — no emoji font, ever) or a **Vue component** (via `<component :is>`). `image` renders an `<img>` whose `alt` defaults to the stop's `label`.
- Props: `showLabels`, `showIcons`, `labelPosition` (`above`/`below`), `iconPosition` (`above`/`below`) — mapped to logical block-start/block-end.
- Slots `stop`, `label`, `icon`, `thumb` with the scopes in spec §4.5. `stop` replaces the whole label+icon block; `thumb` receives `{ position, stop, unset }`.
- **Click-to-jump** (spec §5.3): labels and icons are clickable, move the value, then return focus to the engine. They are `tabindex="-1"` — clickable, not individually focusable (ADR-0001). Disabled stops do not respond.
- Selected stop's label gets a distinct weight/colour via tokens, matching the bold "Blush" in the original.

## Acceptance criteria

- The six-emotion example from spec §4.1 renders like the original screenshot on a clean install, with **zero dependencies beyond `vue`**. This is goal 1 of the spec; vlider could not claim it.
- Clicking a label moves the value, emits `change`, and leaves focus on the engine.
- Tabbing through a page with three Rangers produces exactly three tab stops.
- The `stop` slot fully replaces the default rendering; `label`/`icon` slots replace only their part.
- An `image` with no `label` and no `alt` warns in dev.
- Long labels wrap rather than overlapping their neighbours.

## Out of scope

ARIA text and keyboard (06); disabled/readonly styling (07).

## Comments

**Resolved.** 163 tests (139 unit, 24 browser), `axis.ts` / `gradients.ts` / `diagnostics.ts`
still at 100% branch coverage, `npm run build` clean including the declaration build.

### Testing: one seam, by decision

Asked which seams to cover, the maintainer chose **browser-level click-to-jump only**, so
`tests/browser/labels.test.ts` is the whole of this ticket's new suite: the jump moves the
value and commits it, focus lands back on the engine (mutation-checked — commenting out the
`focus()` call fails the test), a disabled stop does not respond, and `readonly` refuses the
jump while still taking focus. Three acceptance criteria are therefore verified by hand
rather than by a committed test, and are the first thing to pin if that decision is revisited:

- **the three-Rangers tab-stop count** — the mechanism is `tabindex="-1"` on every block;
- **long labels wrap rather than overlap** — measured in Chromium: three blocks at
  `0–138`, `138–276`, `276–414`, exactly adjacent, heights 57 / 24 / 41, so the long two
  wrapped and neither crossed a neighbour;
- **the six-emotion example on a clean install** — `dist/v-ranger.js` imports `"vue"` and
  nothing else, `package.json` declares no `dependencies` at all, and `dist/v-ranger.css`
  contains no `@import` and no `url()`, so no font is ever fetched. That is goal 1 of the
  spec, and it is the claim vlider could not make.

### Decisions taken during implementation

- **"Stop block" is a new word, and CONTEXT.md now carries it.** One stop's label and
  icon, as one clickable box — spec §4.5's own phrase, "the whole label + icon block". It
  needed a name of its own because `.ranger__stop` was already taken by the **stop marker**,
  the dot on the track, and two unnamed per-stop families would have been exactly the
  invented vocabulary CONTEXT.md's preamble warns about. `.ranger__stop-block` in the
  stylesheet, `StopBlock` in the component.
- **The blocks are not in rails.** Labels and icons are one flat `v-for` of `<button>`s,
  placed into grid rows 1 and 3 of the component root from `data-side`. Two rail containers
  would have meant the whole block body written twice in the template. There is no
  `row-gap`: an empty side would still pay for one, and a Ranger with no labels has to be
  exactly as tall as its track (measured: 20px root, 20px control).
- **Each block is one slice of the track wide** (`calc(100% / var(--ranger-stop-count))`),
  which is what makes a long label wrap instead of overlapping. `--ranger-stop-count` is set
  here — spec §6 already listed it as component-set, and issue 03 left it unset because
  nothing read it. `--slice` stays a plain custom property, not a `--ranger-*` name: it is
  an internal proportion, and a token is public API (ADR-0004).
- **Blocks are clamped inside the component.** Centring a slice-wide block on the first stop
  put it 24px outside the root, where a consumer's `overflow: hidden` would cut it off. The
  `clamp()` costs a little centring on the end labels — they sit inboard of their stops —
  and that is how every scale with edge labels is drawn. Middle blocks still line up exactly
  with the thumb (measured: block centres 10/89/168/246/325/404 unclamped, thumb centre 404
  at the last stop).
- **A block is a real `<button>`, `aria-hidden`, `tabindex="-1"`, and `disabled` when its
  stop is.** Native `disabled` is what makes "disabled stops do not respond" true without a
  guard doing the work, and axe permits `aria-hidden` over content that is focusable but not
  tabbable. Hiding them is consistent with every other presentation-layer node and keeps a
  screen reader from reading the scale twice — **issue 06 should confirm that call**, since
  the alternative (exposing the labels as static text) is a defensible reading of §7 too.
- **The `stop` slot lands on the label's side.** It replaces the whole label + icon block,
  so it needs exactly one home, and `iconPosition` has nothing left to place while it is
  supplied. Confirmed with the maintainer before implementing.
- **A slot's presence is enough to give a part a block.** A `label` slot may generate text
  for a stop that carries none, so the block appears; without any slot, a stop needs its own
  `label` / `icon` / `image` to earn one. This is read on every render rather than cached in
  a computed: a parent can add or drop a slot, and a cached answer would go on drawing the
  block the consumer just took over.
- **`Stop.alt` is new**, and spec §4.2 and CONTEXT.md are amended to match. Without it the
  acceptance criterion "an `image` with no `label` and no `alt` warns in dev" could not be
  satisfied as written, and an image whose description is not its label is a real case. The
  new `image-without-alt` diagnostic is raised in the component rather than in `resolveAxis`
  — `alt` is a presentation concern the axis has no opinion about — and is indexed into the
  stops the consumer passed, not the placed ones, so the number in the message is the one
  they can count to.
- **`--ranger-label-weight` and `--ranger-label-weight-selected` are new tokens**, added to
  spec §6. The ticket asked for the selected label's distinct weight "via tokens", and §6
  had a colour pair but no weight. Issue 08's "the token list matches the stylesheet exactly"
  test stays satisfiable.
- **`StopScope` lives in `src/types.ts`**, exported. Declared inside the SFC it made
  `vue-tsc -p tsconfig.build.json` fail with TS4025 — the slot signatures appear in the
  emitted `.d.ts`, so the name has to come from a module. It is deliberately *not* re-exported
  from `src/index.ts`: spec §4.6 fixes that surface, and a consumer gets the shape inferred.
- **A unicode icon is a text node; a component icon goes through `<component :is>`;** the
  string check is `typeof icon === 'string'`, so a functional component works as well as an
  options object. `image` wins over `icon` where a stop carries both, and spec §4.2 now says
  so rather than leaving it to be discovered.
- **One door out for a new value.** `offer()` is the only place `update:modelValue` is
  emitted and the only place the uncontrolled value is written, so a click and a drag cannot
  drift apart. It answers whether anything moved, which is what tells each caller whether
  there is a commit to make.

### Raised by review, and answered rather than changed

- **`alt` is currently unreachable to a screen reader**, because every stop block is
  `aria-hidden` (see above). It is not wasted: it is what a browser renders when the image
  fails, and it is the text ARIA will need the moment 06 decides how the scale is announced.
  But both review axes flagged it independently, so it is worth saying plainly: **05 has
  pre-decided a §7 question that 06 owns.** If 06 exposes the blocks instead, the `alt`
  chain and the `image-without-alt` diagnostic start earning their keep and nothing else
  about this ticket changes.
- **The slot scope's `disabled` means "cannot be chosen"** — the whole Ranger's state or the
  stop's own, whichever applies — because that is exactly what the button's `disabled`
  attribute says, and a scope that disagreed with the control would be a trap. Nothing is
  lost: `scope.stop.disabled` is right there for anyone who needs the stop's own flag.
- **Clicking the already-selected label emits nothing.** Native `change` fires only when the
  value actually changed, and `onChange` keeps the same rule when no interaction produced a
  value; spec §4.4 lists a label click as a commit, not as an unconditional emit.
- **A `stop` slot renders its block even with `showLabels: false`.** `showLabels` and
  `showIcons` govern the default parts, and the slot has replaced them; a consumer who wants
  no blocks at all supplies no slot.
- **The test-helper duplication was worth splitting halfway.** The CDP mouse dispatch moved
  to `tests/browser/mouse.ts`, shared with issue 03's suite. The mount lifecycles did not:
  the two files need different fixtures and issue 04's colour block mounts into its own host,
  so a full harness belongs with issue 09, which owns the interaction matrix.
- **`--ranger-label-weight*` sits under §6's Geometry, not Colour**, next to `--ranger-font`
  and `--ranger-label-size`. Typography is already grouped there.

### Known limits, left as they are

- **Many stops on a narrow track can overlap.** Spec §7's 24×24 touch target is a
  `min-inline-size`, so below about 24px of slice per stop the blocks stop shrinking and
  start to meet — six stops under roughly 144px. §7 wins over "labels do not overlap": an
  unreachable control is the worse failure, and the alternative is a scroll or a rotation
  nobody has asked for.
- **Two numeric ticks pinned close together overlap regardless**, because their slices are
  centred on coordinates the consumer chose rather than on even spacing.
- **Selecting a stop reflows its label** by the weight change. Reserving the bold width up
  front would cost a hidden duplicate of every label; issue 08 owns the size scale and can
  revisit it there.
