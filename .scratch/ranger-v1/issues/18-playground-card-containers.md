# 18 — Give every playground example a legible card container

Status: resolved
Blocked by: None (can start immediately)
Related: issue 13 (playground componentization), issue 08 (tokens and sizes)

## Goal

Every example in `playground/` currently renders straight onto the page's plain (default
white) background, with no explicit `data-theme`. The Ranger component itself follows the
visitor's OS `prefers-color-scheme` automatically (spec/ADR-0004), so a visitor whose OS is
in dark mode sees every example switch to the dark palette — including the selected
label's near-white text (`--_dark-label-selected: #fafafa`) — against that plain white
page. The label becomes unreadable. `TokensExample.vue` already shows the fix in
miniature, for one demo only: an explicit `data-theme="dark"` island with its own matching
background (`#0a0a0a`).

## Scope

- Wrap every example section (all 11 components under `playground/examples/`) in a card:
  a background, padding and rounded corners, consistent enough to read as one system
  across the page.
- Each card sets its own explicit `data-theme` (`light` or `dark`) rather than leaving the
  selected-label colour to follow the visitor's OS setting — the same pattern
  `TokensExample.vue`'s dark island already uses. This makes the label colour
  deterministic per card instead of accidentally following whatever the visitor's OS
  happens to be set to.
- A small varied palette across the cards (not one flat colour repeated for all 11), each
  chosen so the selected label (`--_light-label-selected: #171717` on a `light` card,
  `--_dark-label-selected: #fafafa` on a `dark` card) reads clearly against it, and so the
  card colour doesn't clash with whichever gradient preset that example is showing.
- Each card also sets `--ranger-surface` to match its own background — the stop marker dot
  and the focus ring's inner edge both paint in `--_surface`, so a card whose background
  isn't white needs to say so or those elements paint the wrong colour against it.
- `TokensExample.vue`'s existing dark island can be folded into the new card system rather
  than kept as a special case, as long as its own point (an explicit `data-theme` beating
  the page's scheme) still reads clearly on the page.

## Acceptance criteria

- Every example section in the playground renders inside a card with an explicit
  background — never the page's default.
- The selected stop's label is legible against its own card's background, regardless of
  the visitor's OS colour scheme setting — verified with the OS set to both light and dark
  while browsing the whole page.
- At least a handful of distinct card background colours are used across the 11 examples,
  not one colour repeated throughout.
- `--ranger-surface` is set on every card whose background isn't the light-mode default, so
  the stop marker and focus ring paint correctly against it.
- `npm run dev` renders all 11 sections with no visual regressions; `npm run typecheck`,
  `npm run lint` and `npm run build` stay clean.

## Out of scope

Changing which examples exist, what each one demonstrates, or the playground's build
tooling (19) — this ticket is presentation only.

## Comments

**Resolved.** A new `playground/ExampleCard.vue` renders a `<section>` with an explicit
`:data-theme="theme"`, a `background` colour, and `--ranger-surface` bound to that same
colour (plus a text colour matched to the theme, so headings and prose stay legible too).
Every one of the 11 example components now wraps its content in one, each with its own
`theme`/`background` pair rather than one flat colour repeated: `sand #fef3c7`,
`sky #dbeafe`, `charcoal #171717`, `midnight #0f172a`, `mint #d1fae5`, `plum #3b0764`,
`blush #fce7f3`, `forest #052e16`, `butter #fef9c3`, `stone #f5f5f4`, `indigo #1e1b4b` —
11 distinct backgrounds, alternating light/dark themes. `TokensExample.vue`'s dark island
is now a nested `ExampleCard theme="dark" background="#0a0a0a"` inside its own (light,
`stone`) outer card, so its original point — an explicit `data-theme` beating the page's
scheme — still reads clearly, just through the shared system instead of a bespoke `<div>`.
`RtlExample.vue`'s `dir="rtl"` falls through to `ExampleCard`'s root `<section>` via Vue's
default attribute fallthrough, since `dir` isn't a declared prop.

Verified with a Playwright screenshot of the dev playground at both `colorScheme: 'light'`
and `colorScheme: 'dark'`: the two renders are pixel-identical, since every card now
pins its own theme regardless of the OS setting — no console errors either. `npm run
typecheck`, `lint`, `format:check`, `build` and the unit suite all pass.
