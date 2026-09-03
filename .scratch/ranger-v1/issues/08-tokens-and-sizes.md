# 08 — Token surface and size scale

Status: ready-for-agent
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
