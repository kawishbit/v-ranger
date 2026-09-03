# 05 — Labels, icons and the stop slot

Status: ready-for-agent
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
