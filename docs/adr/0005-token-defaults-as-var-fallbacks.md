# ADR-0005: Token defaults are `var()` fallbacks, not declarations

- **Status:** Accepted
- **Date:** 2026-09-04
- **Amends:** [ADR-0004](./0004-css-custom-properties-over-sass.md) — one sentence of it

## Context

ADR-0004 says:

> Every adjustable value is a **`--ranger-*` custom property** declared on the component root, so it can be overridden from a stylesheet, an ancestor selector, a `data-theme` block, a `style` attribute, or at runtime from JavaScript.

Implementing the token surface (issue 08) showed those two halves cannot both be true. A custom property **declared on the component root beats the same property set on an ancestor**, whatever the specificity: inheritance only supplies a value where the element has no declaration of its own. So `.ranger { --ranger-track-color: #e5e5e5 }` makes

```css
.my-page { --ranger-track-color: rebeccapurple; }
```

do nothing — and "override one token on an ancestor" is the whole restyling story ADR-0004 exists for. It is also what issue 08's own acceptance criterion asks for: _"Overriding a single token on an ancestor restyles a Ranger with no rebuild and no `!important`."_

## Decision

**A token's default is written as a `var()` fallback, never as a declaration of the token itself.** Each one is resolved exactly once, on the component root, into a private alias the rest of the stylesheet reads:

```css
.ranger {
  --_track-color: var(--ranger-track-color, var(--_light-track));
}

.ranger__track {
  background-color: var(--_track-color);
}
```

Three consequences follow, and all three are the point:

- **`--ranger-*` is still only ever read.** The stylesheet never declares a public token, so a consumer's value always wins, from wherever they set it.
- **Defaults still live in one block on the root**, which is what ADR-0004's sentence was protecting. A use site never repeats one.
- **`--_*` aliases are not public API.** They may be renamed freely. Two are documented internals that stand for no token at all — `--_touch-target` (WCAG's 24px floor is not a preference) and `--_slice` (one stop's share of the track) — and a test holds that list to exactly those, plus the palettes below, so a hardcoded value cannot be smuggled in behind a private name.

**The light and dark palettes are declared once each, as `--_light-*` / `--_dark-*` entries**, and the scheme blocks re-point the aliases at one of them. A colour scheme therefore never restates a colour.

**The scheme is expressed three times over, by selector.** `@media (prefers-color-scheme: dark)`, `[data-theme='dark'] .ranger` and `[data-theme='light'] .ranger` all re-point the same eight aliases. The media query and the ancestor cannot be combined without losing the specificity that lets an explicit `data-theme` beat the reader's system setting in **both** directions, which ADR-0004 requires ("both overridable by an explicit ancestor"). A test asserts the three blocks declare the same list of properties, and that the light block matches the root's own defaults.

## Consequences

**Positive**

- Ancestor overrides work, which is the restyling story the package sells.
- Every default is in one block; every colour is written once.
- Use sites carry no literals at all, so a grep can prove nothing bypasses a token.

**Negative**

- One more layer of indirection to read through: `--_x` → `--ranger-x` → palette.
- Some aliases are used once, so the indirection buys uniformity rather than reuse. Inlining those would put a fallback back at a use site and split the list of defaults in two, which is the thing being avoided.
- Three selector-level copies of the scheme's alias list remain, held together by a test rather than by the language. This is the duplication ADR-0004 rejected named theme classes over — it is eight lines rather than two hundred, and it ships no appearance a consumer did not ask for, but it is the same shape and worth watching.

## Alternatives considered

**Declare the tokens on the root, as ADR-0004 says.** Rejected: it silently breaks ancestor overrides, which is a worse failure than the indirection, and the failure is invisible — nothing errors, the override simply does nothing.

**Declare defaults at each use site** (`var(--ranger-track-color, #e5e5e5)` wherever it is read). Works identically in the cascade, and is what the stylesheet did before issue 08. Rejected: the same default then appears in several rules, and the token list stops being readable in one place.

**`@supports` or a style query to pick a palette without duplicating the block.** Style queries (`@container style(--scheme: dark)`) would express it once, but the scheme has to come from a declaration the consumer can override, which puts the problem back where it started. Revisit when style queries are Baseline Widely Available.
