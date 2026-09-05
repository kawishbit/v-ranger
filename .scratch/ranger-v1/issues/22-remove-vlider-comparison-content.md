# 22: Remove vlider mentions from README and the playground

**What to build:** Remove every mention of "vlider" — the predecessor project — from the
README and the playground. This isn't a rename: the content that exists only to claim
parity with or migration from vlider is deleted outright, not reworded.

- README's opening description currently links and names vlider ("Reproduces the
  gradient-track, labelled, emoji-iconed look of [vlider](...)"). Reword it to describe
  the component on its own terms, with no link or name.
- README's "Migrating from vlider" section (the prop/slot mapping table) is deleted
  entirely.
- The playground's `vliderStops` export in `playground/data.ts` is deleted.
- `OtherShapesExample.vue`'s third demo ("`stop.color` on every stop — vlider's own
  ramp", using `vliderStops`) is deleted. Its other two demos (array-of-colours gradient,
  CSS-gradient-string) are untouched — the file stays, just smaller.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `grep -ri vlider README.md playground/` returns nothing.
- [x] README's intro paragraph reads as a standalone description with no predecessor link or name.
- [x] `OtherShapesExample.vue` still renders its first two demos unchanged; the third demo and its `<p>` caption are gone.
- [x] `playground/data.ts` no longer exports `vliderStops`, and nothing imports it.
- [x] `npm run typecheck`, `npm run lint`, and `npm run test` stay clean.

## Comments

**Resolved.** README's intro paragraph rewords the component's description on its own
terms with no vlider link or name; the "Migrating from vlider" table is gone.
`playground/data.ts` no longer exports `vliderStops`; `OtherShapesExample.vue` keeps its
first two demos and drops the third (and its caption). `grep -ri vlider README.md
playground/` returns nothing. `npm run typecheck`, `lint`, and `test` all pass clean.
