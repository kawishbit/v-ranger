# 11 — VitePress docs site

Status: ready-for-agent
Blocked by: 08, 10
Spec: [../spec.md](../spec.md) §10

## Goal

Documentation that teaches the two axes, shows live sliders next to every prop, and hands people the magenta look as a copy-pasteable recipe.

## Scope

- VitePress in **`site/`** — not `docs/`, which belongs to agent docs and ADRs, and never a committed build output (vlider committed its built demo into `docs/`).
- Imports the library **by relative path**, so the docs always demo the real source.
- Deployed on **Vercel** at `ranger.kawishbit.com`. Build command, output directory and SPA/clean-URL settings committed as `vercel.json`; the Vercel project and DNS are a human step, noted in the README.
- Pages:
  - Quickstart — install, the six-emotion example, the screenshot look.
  - **Ordinal vs numeric**, up front, since the axis is inferred and a prop table alone won't teach it (ADR-0002).
  - Live prop playground.
  - Stops, icons and images; the `stop`/`label`/`icon`/`thumb` slots.
  - Gradients and presets.
  - **Token reference** (public API — mirrors spec §6) and **recipes**: the magenta original, a minimal monochrome, a dark surface.
  - Accessibility notes, including what the screen reader actually says.
  - SSR / Nuxt 3 recipe.
  - **Migrating from vlider**: `vliderData`→`stops`, `id`→removed, 1-based index→stop `value`, `theme`→tokens, `extras`→the stop object itself, `bullet` slot→`stop` slot.
- A landing page that looks like the component's own aesthetic rather than default VitePress.

## Acceptance criteria

- Every prop, event, slot and token in the spec appears in the docs; a test or script fails on drift.
- Every code sample on the site is one a reader can paste into a fresh Vue 3 app and run.
- The site builds clean and deploys from a push, with no build artefacts committed.
- Docs are keyboard-navigable and the live examples pass the same `axe-core` check as issue 06.

## Out of scope

Publishing the package (12).
