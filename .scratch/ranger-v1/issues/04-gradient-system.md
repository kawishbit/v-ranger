# 04 — Gradient system and thumb tinting

Status: resolved
Blocked by: 03
Spec: [../spec.md](../spec.md) §5.4 · [ADR-0004](../../../docs/adr/0004-css-custom-properties-over-sass.md)

## Goal

The component is colourful out of the box, and recolouring it is one prop or one custom property.

## Scope

- `gradient` prop accepting three shapes: a **preset name**, an **array of colours**, or a **raw CSS gradient string**. Resolved to `--ranger-gradient` on the root — no runtime stylesheet, no `document.head` (ADR-0001).
- Presets in `src/gradients.ts`, exported as `gradients`: `mood` (the magenta ramp from the original vlider demo), `sunset`, `ocean`, `heat`, `mono`.
- Per-stop `color` overrides that stop's slice of the ramp, so an ordinal axis with a colour on every stop reproduces vlider's exact ramp.
- Gradient direction follows the writing direction and flips under RTL.
- `--ranger-active-color` resolves to the nearest stop's colour; the thumb tints from it via `color-mix()` and transitions between stops, honouring `prefers-reduced-motion`.

## Acceptance criteria

- The six-stop `mood` example reproduces the original screenshot's ramp with no per-stop colours supplied.
- All three `gradient` shapes render; an invalid preset name warns in dev and falls back to `mood`.
- `dir="rtl"` on an ancestor reverses the ramp and the fill direction.
- The thumb's colour changes as the value moves and is a smooth transition, except under `prefers-reduced-motion: reduce`.
- No `<style>` element is created at runtime by any code path.

## Out of scope

The full token surface and size scale (08); documenting recipes (11).

## Comments

**Resolved.** 158 tests (138 unit, 20 browser); `axis.ts`, `diagnostics.ts` and `gradients.ts`
all at 100% branch coverage.

### The ramp, and where `mood` came from

The original vlider generated `linear-gradient(to right, c0, ..., cn)` from the per-stop
colours of its demo data. `gradients.mood` is that demo's own six colours, unchanged, and
`gradients.test.ts` pins them against an independent copy so a later tidy-up cannot quietly
restyle the component people recognise. Because vlider spread its colours evenly and an
ordinal axis spaces its stops evenly, "a colour on every stop reproduces vlider's exact
ramp" falls out rather than being arranged.

### Decisions taken during implementation

- **The gradient goes on the track at full width, and the fill paints nothing.** Issue 03
  gave `.ranger__fill` a flat `--ranger-active-color`, which would now cover the half of
  the ramp the reader has already chosen from — and the whole ramp being visible is the
  look. No token replaced it: issue 08 owns the token surface, and inventing
  `--ranger-fill-color` for a progress-shaped Ranger nothing has asked for would be
  inventing public API. The fill keeps its extent, which is what the RTL test measures.
- **`gradient` defaults to `undefined`, not `'mood'`** (spec §4.3 says `'mood'`). The two
  paint the same thing, but only `undefined` lets the component leave `--ranger-gradient`
  unwritten — and an inline style beats every stylesheet, so writing it always would make
  the token unusable from CSS, which is the restyling story ADR-0004 is built on. The cost
  is that the `mood` ramp is spelled twice, in `gradients.ts` and as the `var()` fallback
  in `ranger.css`; a test holds the two together and names itself the seam.
- **The thumb samples the ramp at its own position rather than reading the nearest stop's
  colour.** The ticket and spec §5.4 both said "the nearest stop's colour". Wherever a
  nearest stop exists the two answers are identical — the ramp carries that stop's colour
  at that stop's coordinate — but sampling also answers on a numeric axis with no ticks,
  where the nearest stop has no answer at all and the thumb would otherwise stay grey on a
  gradient track. Spec §5.4 and CONTEXT.md's "Nearest stop" were reworded to match.
- **A colour on *some* stops overrides those slices; a colour on *every* stop is the ramp.**
  The first draft rebuilt the ramp from the stop list whenever any stop had a colour, which
  let one coloured tick on a numeric axis flatten the whole track, and squashed a preset
  into whatever span the ticks happened to cover. Both readings of spec §5.4 are now
  separate paths, and both are tested.
- **`--ranger-gradient-direction` is declared by the stylesheet**, which is the one thing
  the stylesheet declares rather than reads. A gradient direction cannot be expressed
  logically — there is no `to inline-end` — and the component cannot ask the DOM which way
  the page runs without giving up SSR. `:dir(rtl)` flips it. Recorded in spec §6 and named
  as the exception in `ranger.css`'s own header.
- **A `gradient` string is CSS only if it looks like a gradient function** (or a `var()`).
  Accepting anything with a bracket meant `linear-gradiant(...)` sailed through to the
  token and painted nothing at all, with no complaint.

### Left to the tickets that own them

- **`Diagnostic` and `warn` moved to `src/diagnostics.ts`.** A refactor this ticket did not
  ask for, but `gradients.ts` needed the vocabulary and reaching into `axis.ts` for a
  warning channel would have been the wrong dependency. The coverage gate now covers all
  three DOM-free modules.
- **A consumer who sets `--ranger-gradient` from CSS does not retint the thumb**, which
  still samples the default ramp. The `gradient` prop is the route that keeps the two in
  step. Issue 11 should say so when it writes the recipes; issue 08 may prefer to have
  recipes set `--ranger-active-color` alongside.
- **Contrast is not this ticket's.** Several presets — `mono` at its light end above all —
  put a pale thumb on a pale surface. Issue 06 owns AA non-text contrast and should decide
  whether a preset can ship a ramp the thumb cannot be seen against.
- **`--ranger-stop-count` is still unset**, and the stop markers still paint
  `--ranger-surface` rather than their own colour: 05 and 07 own that conveyance.
