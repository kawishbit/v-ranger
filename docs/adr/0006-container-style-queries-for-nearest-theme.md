# ADR-0006: Container style queries pick the nearest `data-theme` ancestor

- **Status:** Accepted
- **Date:** 2026-09-06
- **Amends:** [ADR-0005](./0005-token-defaults-as-var-fallbacks.md) — the `data-theme` half of its scheme

## Context

ADR-0005 expressed the colour scheme three times over: a media query, and two descendant selectors, `[data-theme='dark'] .ranger` and `[data-theme='light'] .ranger`. Both selectors have identical specificity, and a descendant combinator matches an ancestor at any distance — so when a `data-theme` island nests inside one of the opposite value, both rules matched the same `.ranger` at once, and the cascade fell back to source order. The later-declared rule always won, whichever ancestor was actually nearest in the DOM (issue 28).

ADR-0005 saw this class of problem coming and deferred it: among its rejected alternatives, "`@supports` or a style query to pick a palette without duplicating the block... Revisit when style queries are Baseline Widely Available." That day has come.

## Decision

The two `data-theme` blocks no longer set the resolved aliases on `.ranger` through a descendant selector. Instead:

```css
[data-theme='dark'],
[data-theme='light'] {
  container-type: normal;
}

[data-theme='dark'] {
  --_theme: dark;
}

[data-theme='light'] {
  --_theme: light;
}

@container style(--_theme: dark) {
  .ranger {
    --_surface: var(--ranger-surface, var(--_dark-surface));
    /* …the same seven aliases as before */
  }
}

@container style(--_theme: light) {
  .ranger {
    /* …the light palette */
  }
}
```

`container-type: normal` opts an element carrying `data-theme` into being a **query container**, with no size or layout containment attached. `--_theme` is the value it carries. A container style query then asks a different question than a descendant selector does: not "does a `dark` ancestor exist anywhere above me", but "what does my *nearest* query container say" — which is proximity by construction, for a nesting of any depth, not only the two-level case issue 28 named.

`--_theme` joins `--_touch-target` and `--_slice` as an internal alias that carries no token at all (ADR-0005) — a structural flag, not a design value smuggled behind a private name.

## Consequences

**Positive**

- The nearest `data-theme` ancestor wins, always — not whichever selector happens to be declared last, and not only for the shallowest nesting a test happens to cover.
- The palette stays exactly where ADR-0005 put it: written once, on `.ranger` itself. Nothing about where a colour is declared changed, only how the scheme is *selected*.

**Negative**

- The stylesheet now depends on container style queries rather than only a `data-theme` attribute and ordinary selectors — a newer browser feature than everything else in this file, though Baseline Widely Available as of this ADR's date.
- A fourth name for the "internal, not a token" test to track, alongside `--_touch-target` and `--_slice`.

## Alternatives considered

**Keep descendant selectors, break the tie with `:not()`/`:has()`.** Worked through by hand for a light-in-dark-in-light (three-level) nesting: excluding a `.ranger` whenever *any* ancestor of the opposite theme exists (rather than only a *nearer* one) throws out cases where the excluded theme was in fact the nearest one. There is no fixed-depth combination of `:not()`/`:has()` that generalises to arbitrary alternating nesting — proximity is exactly what selectors cannot express, and exactly what a container query is for. Rejected.

**Move the palette to `:root` and rely on plain custom-property inheritance**, re-pointing an inherited alias on `[data-theme='dark']`/`[data-theme='light']` themselves rather than on `.ranger`. This also resolves nearest-ancestor correctly (inheritance always reads the nearest ancestor's own declaration), but it requires relocating — or duplicating — the palette literals out of `.ranger`'s own block into global `:root` scope, which is the exact duplication ADR-0005 exists to avoid, and pollutes a scope a component library does not own. Rejected in favour of a mechanism that leaves the palette exactly where it was.
