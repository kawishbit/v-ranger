# 08 — Token surface and size scale

Status: resolved
Blocked by: 03, 04
Spec: [../spec.md](../spec.md) §6 · [ADR-0004](../../../docs/adr/0004-css-custom-properties-over-sass.md)

## Goal

Lock the `--ranger-*` surface as public API, and make the default look good in both colour schemes without shipping a single theme class.

## Scope

- Declare every token in spec §6 on the component root with sensible defaults. Nothing hardcoded in the stylesheet may bypass a token.
- Theme-aware default: a restrained light appearance, a dark variant under `prefers-color-scheme: dark`, both overridable by an explicit ancestor (`[data-theme="dark"]`). **No theme classes ship and there is no `theme` prop** (ADR-0004).
- `size` prop (`sm`/`md`/`lg`) sets the geometry tokens only, so a consumer can ignore it and set the tokens directly.
- Read-only tokens the component sets: `--ranger-position`, `--ranger-stop-count`, `--ranger-active-color`.
- Keep the stylesheet small enough that the absence of Sass mixins never hurts.

## Acceptance criteria

- Every visual property in `ranger.css` traces to a token; a test greps for hardcoded colours and lengths outside the token declarations.
- Overriding a single token on an ancestor restyles a Ranger with no rebuild and no `!important`.
- Switching `prefers-color-scheme` changes the default appearance with no JavaScript.
- The three sizes differ only in geometry tokens.
- The token list in spec §6 matches the stylesheet exactly — a mismatch fails the test, since renaming a token is a breaking change.

## Out of scope

Publishing recipes (11).

## Comments

**Resolved.** 176 tests (146 unit, 30 browser), typecheck and lint clean.

### Decisions taken during implementation

- **Defaults are `var()` fallbacks, not declarations on the root.** The scope line says
  "declare every token on the component root with sensible defaults", and the acceptance
  criterion says an ancestor override must work with no `!important`. Those two cannot both
  be true literally: a custom property declared on `.ranger` beats the same property set on
  an ancestor whatever the specificity, because inheritance loses to any declaration on the
  element itself. So each token is resolved once, on the root, into an internal
  `--_x: var(--ranger-x, default)` alias that the rest of the file reads. The defaults still
  live in one block on the root — which is what the scope line is for — and an ancestor
  override still wins, which is what the acceptance criterion is for.
- **`--_x` aliases are not public API.** They exist so a default is written once instead of
  at every use site; a test holds each of them to reading its public token first, so an alias
  can never quietly become a value a consumer cannot reach. The two exceptions are documented
  in the stylesheet: `--_touch-target` (spec §7's 24px floor is a WCAG constant, not a
  preference) and `--_slice` (one stop's share of the track, an internal proportion).
- **`size` re-resolves five geometry aliases, and only those.** `.ranger[data-size='sm']`
  and `[data-size='lg']` re-declare track height, thumb size, gap, label size and icon size —
  each still reading the public token first, so setting `--ranger-thumb-size` anywhere above a
  Ranger beats any size. `md` needs no block: it is what the root already says.
- **The dark scheme is written twice.** `@media (prefers-color-scheme: dark) .ranger` and
  `[data-theme='dark'] .ranger` carry identical bodies, because the two cannot be combined
  without losing the specificity that lets an explicit ancestor beat the media query in both
  directions. A test asserts the two blocks declare exactly the same properties, since nothing
  else stops them drifting.
- **The ramp does not change with the scheme.** The eight colour tokens a scheme owns are
  surface, track, thumb, thumb border, both label colours, focus and the unset track. The
  gradient is the component's own colour and reads on either surface.
- **The focus colour default is the scheme's extreme** (`#171717` light, `#fafafa` dark)
  rather than an accent. Issue 06 owns the contrast proof; the reason it is not blue is that
  the ring is drawn over the reader's ramp, and only the extreme clears every colour in the
  default one at 3:1.
- **The grep test forbids literal colours and non-zero lengths in any non-custom-property
  declaration**, rather than trying to name an allowlist of "structural" values. Zero carries
  no appearance, so it is not a length for this purpose. Mutation-checked: adding
  `color: #ff0000; padding-block: 3px` to a rule fails it with both named.
- **The spec §6 list is compared against every file in `src/`,** not only the stylesheet: the
  component writes five tokens as inline custom properties and those are public API too. CSS
  comments are stripped first, since an explanation is not a declaration.
