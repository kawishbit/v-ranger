# ADR-0004: Plain CSS with custom properties; no Sass, no theme classes

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes:** the predecessor's SCSS variables and `theme-*` partials

## Context

The predecessor was themed in Sass: roughly 150 `!default` variables plus three theme partials (`_light.scss`, `_dark.scss`, `_purple.scss`). The partials were near-identical ~200-line copies of one another differing in about three colours each, kept in sync by hand. The published package had to include `src/**` so consumers could compile the partials themselves, and the README needed a paragraph explaining where to `@import` what.

For a consumer who merely wanted a different colour, that meant: install a Sass toolchain, import the partials in the right order, override variables before the import, rebuild. Nothing was switchable at runtime — no dark mode reacting to `prefers-color-scheme`, no theme toggle, no per-instance variation without a new class and another build.

Separately, and decisively: the maintainer no longer wants to write Sass.

## Decision

The component ships **one plain `.css` file**. There is no preprocessor anywhere in the repo — not in the library, not in the docs site.

Every adjustable value is a **`--ranger-*` custom property** declared on the component root, so it can be overridden from a stylesheet, an ancestor selector, a `data-theme` block, a `style` attribute, or at runtime from JavaScript.

**No theme classes ship, and there is no `theme` prop.** The default appearance is theme-aware: a restrained light default, a dark variant under `prefers-color-scheme: dark`, both overridable by an explicit ancestor. Distinctive looks — including the magenta appearance the component is known for — are published as **recipes**: copy-pasteable blocks of token overrides in the documentation.

Colour is expressed separately from data: the `gradient` prop takes a preset name, an array of colours, or a CSS gradient string, and a stop's own `color` overrides its slice. Because the browser baseline is Baseline Widely Available, `color-mix()` is available for interpolating the thumb's tint between stops without JavaScript.

All layout uses **logical properties** (`inset-inline-start`, `margin-inline`, `padding-block`), so RTL works from the first release and a future vertical orientation is an addition rather than a rewrite. The predecessor used physical `left`/`right` throughout, which is exactly why neither was cheap there.

## Consequences

**Positive**

- Restyling requires no build tooling: override a custom property.
- Themes become runtime-switchable, and `prefers-color-scheme` works by default.
- Consumers download one stylesheet, not three near-duplicate themes they don't use.
- The tarball ships `dist/` only; `src/**` no longer needs publishing.
- RTL is free; vertical is tractable.

**Negative**

- Custom properties are not type-checked and not discoverable from an editor. The full token list must be documented rigorously and treated as public API — renaming one is a breaking change.
- Sass conveniences are gone: no `lighten()`/`darken()` (use `color-mix()`), no mixins, no nesting beyond what native CSS nesting provides. The library's CSS must stay small enough that this doesn't hurt.
- Tokens inherit, so a token set on an ancestor for one Ranger affects every Ranger beneath it. Usually the point; occasionally a surprise.
- Anyone wanting the magenta look copies a recipe instead of setting `theme="theme-purple"` — more to paste, and a deliberate trade for not shipping dead CSS to everyone.

## Alternatives considered

**Keep SCSS variables.** Smaller output and compile-time theming, at the cost of demanding a Sass toolchain to change a colour and forfeiting all runtime theming. Rejected on both counts, and on maintainer preference.

**SCSS internally, whose variables default to custom properties.** A reasonable hybrid, but it keeps a preprocessor in the build for authoring convenience the CSS doesn't need. Rejected.

**Ship named theme classes** (`ranger--dark`, `ranger--mood`). Rejected: it re-creates the duplicated-partials maintenance problem in CSS, and ships every consumer the themes they didn't ask for. Recipes deliver the same value at documentation cost only.

**Inject styles from JavaScript** so `import Ranger from 'v-ranger'` needs no CSS import. Rejected: it breaks SSR and strict CSP, and bundlers handle `import 'v-ranger/style.css'` perfectly well. A `v-ranger/full` entry provides the zero-config path instead.
