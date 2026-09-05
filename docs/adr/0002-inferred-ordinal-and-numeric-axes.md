# ADR-0002: Two axes — ordinal and numeric — inferred from props

- **Status:** Accepted
- **Date:** 2026-09-04

## Context

"Range slider" names two different controls. The predecessor was the first: an ordered list of labelled stops, one thumb, pick one. The conventional meaning is the second: a continuous numeric domain with a step.

The emotive, colourful scale is the hero use case, and it only looks good with a handful of stops — beyond roughly eight, labels collide and the design falls apart. But a component that _only_ does labelled stops is a narrow package, and users will arrive expecting `min`/`max`/`step` to work.

So both. The open questions are how a consumer selects between them, and how much machinery the two modes share.

## Decision

One component, one **axis** abstraction, two kinds:

- **Ordinal axis** — `stops` present, no `min`/`max`. _n_ stops, evenly spaced; position derived from the selected stop's index.
- **Numeric axis** — `min`/`max`/`step`. Continuous; `stops` are optional pinned ticks, placed by an `at` coordinate.

The kind is **inferred from the props**, not declared by a `mode` prop. Contradictory props produce a loud `console.warn` in development builds only:

- `stops` carrying `at` values with no `min`/`max`
- `min`/`max` given, but stops have no `at`
- pinned stops falling outside `[min, max]`
- duplicate stop `value`s

Both kinds resolve to the same three primitives, which are pure functions with no DOM access: value → position, position → value, and value → nearest stop.

## Consequences

**Positive**

- Zero ceremony on the hero path: `<Ranger v-model="mood" :stops="moods" />` is the whole API for the common case.
- The presentation layer, gradient system, accessibility layer and most tests are written once against **position** and **nearest stop**, and are indifferent to axis kind.
- `v-model` can be typed off the `stops` array's literal types in ordinal mode and as `number` in numeric mode, without a discriminating prop.

**Negative**

- Inference is implicit: a typo (`:mim="0"`) silently changes behaviour rather than failing. The dev-only warnings exist specifically to blunt this, so they are a requirement rather than a nicety — and they must be stripped from production builds.
- Two prop sets are mutually exclusive but not expressed as such in the type system as cleanly as a discriminated union would allow.
- Documentation must lead with the distinction, because a prop table alone won't teach it.

## Alternatives considered

**An explicit `mode="stops" | "range"` prop.** Self-documenting, and it types as a clean discriminated union. Rejected because it adds required ceremony to the 90% path for the benefit of catching a typo — a job the dev warnings do without taxing every consumer. Worth reopening if the warnings prove insufficient in practice.

**Two separate components** (`<Ranger>` and `<RangerScale>`). Rejected: they would share the engine, presentation layer, gradient system, accessibility layer and roughly all of the tests, differing only in how position is computed. That is one component with two axes, described twice.

**Ordinal only, as the predecessor was.** Rejected: too narrow to justify a package, and it invites a fork the first time someone wants `0–100`.
