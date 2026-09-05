# 27: Stop the playground from clipping edge stop labels

**What to build:** `ranger.css`'s stop-block positioning is deliberate: a label at either
end of the axis hangs half its own width outside the Ranger's own box, by design, so the
first and last labels stay centred on their own stop marker instead of being pulled
inboard of it. The component's own comment is explicit that a consumer whose layout clips
that overflow is not the component's problem to solve — so this is a playground layout
gap, not a component bug. In `LabelsIconsExample`'s "Long labels wrap into their own slice
rather than into a neighbour" demo (and any other section wide enough for it to bite), the
leftmost and rightmost labels currently get cut off by the card/viewport edge instead of
wrapping fully visible. Give the playground's own example layout enough inline space
(padding, margin, or similar) to accommodate that overhang so no label is ever clipped.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] In `LabelsIconsExample`'s long-labels demo, the first and last stop labels wrap and
      render fully visible, with no part cut off by a container edge.
- [x] The fix lives in the playground's own layout/CSS, not in `src/ranger.css` or any
      other component-level file — the component's documented edge-overhang behaviour is
      unchanged.
- [x] Every other playground section keeps its current layout (cards stay visually
      consistent with issue 18's card system).
- [x] `npm run dev` shows no clipped labels anywhere in the playground, with no console
      errors.
- [x] `npm run typecheck` and `npm run lint` stay clean.

## Comments

**Resolved.** Used Playwright to scan every stop-block's bounding box across viewport
widths 320–1920px and found the clipping actually reproduces on exactly three Rangers —
all three-stop demos with visible labels: `UncontrolledExample`'s "Letters",
`LabelsIconsExample`'s "Long labels", and `StatesExample`'s "One stop disabled" — roughly
in the 500–950px width band, where `main`'s `max-inline-size` no longer supplies enough
outer margin to absorb the overhang but the viewport isn't yet narrow enough to shrink the
Ranger (and therefore the overhang) to fit the fixed-`rem` card padding. Six-stop demos
never clip in this playground; `NumericAxisExample`'s three numeric stops have no visible
labels, so nothing to clip.

Added a `.label-overhang-guard { padding-inline: 15% }` class to `App.vue`'s global styles
and wrapped just those three `<Ranger>`s in a `<div>` carrying it. 15% is a percentage
(scales with viewport, unlike the card's fixed `1.5rem`) chosen against the worst case
(three stops, a slice half of which — 16.7% of the Ranger's own width — hangs off each
end): re-ran the same Playwright scan after the fix across the same width range and found
zero clipped labels anywhere in the playground. `src/ranger.css` untouched.

`npm run typecheck` and `npm run lint` are clean.
