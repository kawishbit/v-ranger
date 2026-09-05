# 28: Fix the Tokens section: sliders won't drag, and the dark island's label is unreadable

**What to build:** Two bugs in `TokensExample.vue`, the playground's token-showcase
section:

- Neither Ranger in this section responds to drag or click the way every other slider in
  the playground does. Both must become interactive again.
- The nested `data-theme="dark"` island (a dark `ExampleCard` nested inside the section's
  own light-themed `ExampleCard`) renders its selected label in the dark palette's colour,
  and it currently doesn't: the label stays dark-on-dark and is unreadable. The root cause
  is a CSS specificity tie in `src/ranger.css`: `[data-theme='dark'] .ranger` and
  `[data-theme='light'] .ranger` have identical specificity, so when a dark island is
  nested inside a light ancestor (both selectors match the same `.ranger`), the
  later-declared rule in the stylesheet wins the cascade regardless of which ancestor is
  actually nearest in the DOM. Fix the selectors so the nearest `data-theme` ancestor
  always wins, not whichever rule happens to be declared last.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Both Rangers in the Tokens section (the retokened one and the dark island) respond
      to drag and click, updating their value like every other playground slider.
- [x] The dark island's selected label renders in the dark palette's colour
      (`--_dark-label-selected`), readable against its own dark background, regardless of
      the light-themed ancestor it's nested inside.
- [x] A Ranger inside a `data-theme` ancestor still correctly picks up that ancestor's
      theme when it is the *only* themed ancestor (i.e. the non-nested case in every other
      playground section is unaffected).
- [x] `npm run test:browser` (or the relevant token/theme suite) covers a Ranger nested
      inside two opposite-theme `data-theme` ancestors and asserts the nearest one wins.
- [x] `npm run dev` confirms both fixes visually in the Tokens section, with no console
      errors.
- [x] `npm run typecheck`, `npm run lint`, and `npm run test` stay clean.

## Comments

**Resolved.** The drag bug: both Rangers used a static (unbound) `model-value`, which
means `props.modelValue` is always defined and never `undefined` — so `Ranger`'s
`current` computed never falls back to its internal, self-managed ref, and every drag or
click gets visually reverted the same tick by `syncEngine()` snapping the native input
back to the frozen prop value. Fixed by giving `TokensExample.vue` two local refs
(`retokened`, `darkIsland`) and switching both Rangers to `v-model`.

The label-colour bug: `[data-theme='dark'] .ranger` and `[data-theme='light'] .ranger`
tie on specificity, so when a dark island nests inside a light ancestor, both descendant
selectors match the same `.ranger` and the cascade falls back to source order — the
later-declared rule (`light`) always won, regardless of which ancestor was actually
nearer in the DOM. Replaced both with `@container style(--_theme: dark)` /
`@container style(--_theme: light)` blocks, keyed off a `--_theme` custom property set
directly on the `[data-theme]` element itself (`container-type: normal` opts it in as a
query container, no size/layout containment). A container style query asks its nearest
matching ancestor by construction — proximity-correct for any nesting depth, not only the
two-level case this ticket named. Recorded as ADR-0006 (amending ADR-0005, which had
explicitly deferred this exact fix to "when style queries are Baseline Widely Available").

Updated `tests/unit/tokens.test.ts`'s selector-shape checks for the new CSS (the file's
hand-rolled rule-reader flattens `@container`-wrapped `.ranger` blocks the same way it
already flattened `@media`-wrapped ones — verified by running the suite, not just by
reading it) and added a new browser test in `tests/browser/tokens.test.ts` mounting a
Ranger inside two nested opposite-theme ancestors both directions, asserting the nearer
one wins.

`npm run typecheck`, `npm run lint`, and the full unit + token/theme browser suite are
clean. (`npm run test:browser`'s full run has one pre-existing, unrelated flaky failure in
`tests/browser/interaction.test.ts`'s touch-drag test — confirmed present on `main` before
this change too, in a file this diff never touches.)
