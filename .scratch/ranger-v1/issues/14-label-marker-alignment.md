# 14 — Align stop labels to their dot markers, allowing edge overflow

Status: resolved
Blocked by: None (can start immediately)
Spec: [../spec.md](../spec.md) §4.3, §5.3

## Goal

Every stop's label currently sits at a different horizontal position than its own dot
marker on the track, most visibly at the first and last stops — the marker sits on the
native thumb's travel path (inset half a thumb's width from each edge), but the label
block is clamped to stay fully inside the component, pulling it inboard. The two are
meant to read as one scale; right now they visibly disagree.

## Scope

- Every `.ranger__stop-block` centers exactly on its stop's position on the same travel
  path the dot markers and thumb already use — no separate, clamped position for labels.
- Where that centering would push a label (or icon) past the component's own inline
  edges — always true for the first and last stop in a left-to-right scale — let it
  overflow past the edge via negative margins, rather than clamping it back inside. This
  matches the reference behaviour: the first label's centre sits exactly over the first
  dot even though most of the label text then sits to the left of the track's own start
  (and mirrored at the end).
- Remove the inward `clamp()` this trades away, along with its comment describing the
  old inboard-inset trade-off.
- RTL: the same rule, mirrored — the direction the labels are allowed to overflow flips
  with the writing direction, exactly as the dot markers and thumb already do.

## Acceptance criteria

- The first and last stop's label (and icon, where shown) are visually centred on their
  dot markers, not inset from them.
- A label wide enough to overflow the component's own bounds is allowed to, rather than
  wrapping or being pulled inboard to stay inside.
- A consumer whose own layout clips overflow (e.g. `overflow: hidden` on an ancestor) is
  not this ticket's problem to solve — only the Ranger's own layout no longer clips it.
- Existing layout/alignment tests (labels, icons, RTL) are updated to assert the new
  centred position instead of the old clamped one.

## Out of scope

Changing which side (`above`/`below`) a label renders on, or how many stops fit before
neighbouring blocks start to overlap — unchanged from today.

## Comments

**Resolved.** `.ranger__stop-block`'s `margin-inline-start` in `src/ranger.css` now uses the
same centring formula the stop markers and thumb already use (`--_thumb-size / 2 +
--ranger-stop-position * (100% - --_thumb-size) - --_slice / 2`), with the inward
`clamp()` and its comment removed. RTL falls out for free: the formula reads
`--ranger-stop-position` and `--_slice`, both already direction-aware, so no separate
mirroring logic was needed.

No existing test asserted the old clamped position, so there was nothing to update —
instead a new `tests/browser/alignment.test.ts` covers the first, a middle and the last
label, an icon block, and the RTL mirror, each asserting the block's centre matches its
stop marker's centre and that the edge blocks overflow the component's own bounding box in
the expected direction.

### After code review

- **The icon-block test checked centring but not the edge-overflow half of the acceptance
  criterion** ("the first and last stop's label **and icon, where shown** are visually
  centred... not inset from them"). Fixed by adding the same overflow assertion the label
  tests already carry to the icon test.
