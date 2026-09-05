# 13 — Componentize the playground examples

Status: resolved
Blocked by: —
Spec: —

## Goal

`playground/App.vue` is a single ~230-line file holding every example section. Splitting it into one component per example makes each example easy to add, edit or delete in isolation, and removes the risk of examples accidentally sharing reactive state — most visibly today's `record`/`lastCommit` handler, which is wired to both the ordinal and numeric sections and reports whichever fired last in a single "Last commit" panel at the bottom of the page.

## Scope

- One component per example section (ordinal axis, numeric axis, uncontrolled, labels and icons, slots, gradient presets, the other two shapes, sizes, states, tokens, RTL, and any "last commit" style output) under `playground/`, each owning its own local `ref`s — no example reads or writes another example's state.
- `playground/App.vue` becomes a thin shell: page chrome (`<h1>`, the `<style>` block) plus a list of the example components in the same order the sections appear today.
- Each example that currently reports a `@change` payload (ordinal, numeric) gets its **own** local "last commit" output — not a shared one — so the componentization itself demonstrates the no-shared-state guarantee.
- No visual or behavioural change to any example: same props, same stops, same order on the page.
- Data shared across multiple examples only because it's genuinely the same constant (e.g. the `moods` stop list, `gradients` presets, `sizes` list) may live in a shared module and be imported by each component that needs it — that's sharing a constant, not sharing state, and stays allowed.

## Acceptance criteria

- [x] `npm run dev` (playground) renders every example exactly as before, in the same order.
- [x] No two example components reference the same `ref`/`reactive` instance; each owns its own state.
- [x] Interacting with one example (e.g. dragging the ordinal thumb) never changes what another example displays (e.g. the numeric section's own last-commit output).
- [x] `npm run typecheck`, `npm run lint` and `npm run build` (or the playground's equivalents) still pass.

## Out of scope

Adding new examples, changing the playground's build tooling, or moving the playground to a router/multi-page structure.

## Comments

**Resolved** in `c9e7ac8`. `playground/data.ts` holds the genuinely-shared constants
(`moods`, `presets`, `sizes`, `gapped`, `vliderStops`, `verbose`); one component per
example lives under `playground/examples/`, each with fully independent local state;
`App.vue` is now an 11-line-of-markup shell. The ordinal and numeric examples'
last-commit output was pulled out of the old shared handler into a small
`playground/useLastCommit.ts` composable — each call returns its own `ref`, so the two
examples still don't share state, just the (stateless) logic that formats a commit into
one. `npm run typecheck`, `lint`, `format:check`, `build` and the unit suite (189 tests)
all pass; a Playwright smoke check confirmed all 11 sections render with no console
errors and that driving the ordinal example's thumb leaves the numeric example's
last-commit panel untouched.

Code review (Standards + Spec, both parallel) found no spec gaps or scope creep. The
Standards pass flagged the ordinal/numeric handlers as duplicated code with a stale
"taken structurally" rationale (the comment justified avoiding `Resolved<V>` so one
handler could serve both axes — no longer true once each axis got its own component);
fixed by extracting `useLastCommit<V>()` and typing each call site precisely
(`Resolved<string | number>` for the ordinal axis, `Resolved<number | null>` for the
numeric axis, matching what `Ranger`'s `change` event actually emits for each).
