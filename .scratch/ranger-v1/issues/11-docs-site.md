# 11 — VitePress docs site

Status: resolved
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

## Comments

### Implementation

- **`site/.vitepress/config.ts`** aliases `v-ranger`/`v-ranger/style.css` straight at
  `../../src/index.ts`/`ranger.css`, so every live example imports the library the way a
  real consumer would while actually running the repo's own source (the ticket's "by
  relative path" requirement).
- **Eleven pages**, matching the scope list one-to-one, plus a home page styled with the
  `mood` ramp as its hero-name gradient rather than default VitePress branding.
- **`site/scripts/verify-drift.mjs`** reads spec §4.3–4.5 and §6 the same way
  `tests/unit/tokens.test.ts` already reads §6 for the stylesheet, and fails if any
  prop/event/slot/token is mentioned nowhere in `site/**/*.md`.
- **`site/scripts/verify-a11y.mjs`** builds the site and runs the WCAG 2.2 AA `axe-core`
  check from issue 06 against all eleven pages, scoped to the page minus syntax-
  highlighted code samples (see below) — the same scope issue 06 used (the mounted
  component, not its test harness).
- **Full, pasteable examples that also have their own `<script setup>` live demo on the
  page** (`quickstart.md`, `ordinal-vs-numeric.md`, `recipes.md`) are real files under
  `site/snippets/`, included with VitePress's `<<< ./snippets/x.vue` syntax rather than
  typed inline — see "A real bug" below for why.
- Both root `package.json` (`verify:docs-drift`, `verify:docs-a11y`) and `site/package.json`
  (`verify:drift`, `verify:a11y`) can run these; `vercel.json` at the repo root builds
  `site/` and publishes `site/.vitepress/dist`.

### A real bug this caught, twice

`@vue/compiler-sfc`'s block extraction (the pass that pulls a markdown page's own
`<script setup>` out before markdown-it ever runs) is a real, fence-blind HTML tokenizer:
it finds a matching-looking tag *anywhere* in the raw file, code fences included. A
`​```vue` sample that itself contained a literal `<script setup>` — exactly what "paste
this and run it" full examples need to show — collided with the page's own live-demo
script and broke the build. So did, separately, a TypeScript generic default
(`Stop<V = unknown>`) inside a `​```ts` fence, misread the same way. The general fix for
both is the same: move any sample whose raw text could look like a tag into a real file
and `<<<`-include it, since the raw `.md` source then never contains the offending text
at all.

The deeper cause, found while chasing the second case: `.vitepress/config.ts` added its
own `@vitejs/plugin-vue` instance on top of VitePress's own internal one, double-
processing every markdown-derived virtual module. Removing the duplicate plugin fixed
the underlying corruption outright — the `<<<`-include fix for the two known trigger
cases was kept anyway, since it is also just a cleaner way to ship a real, independently
buildable example.

### Another real bug, from the a11y check earning its keep

- **A literal `<input type="range">` in the home page's frontmatter `details:` string**
  rendered as an actual, bare, unlabelled range input — the string was meant as inline
  code and needed different notation, since the `details` field is HTML/markdown-
  rendered. Caught as a `label` violation on `/`, from a second input axe found that
  wasn't the real demo.
- **The custom brand palette failed a real button's contrast**: white hero-button text
  on `--vp-c-brand-3` (`#ffb0fe`, a pastel from the `mood` ramp) measured 1.62:1.
  Fixed by giving the interactive brand tokens one WCAG-safe deep magenta
  (`#c2185b`/`#ad1457`) in both colour schemes, leaving the full-brightness ramp to the
  hero name's gradient text and the live examples themselves.
- **Two of the docs' own demo tokens failed contrast**: `tokens.md`'s restyling demo set
  `--ranger-label-color` to a ramp colour too light for its background, and `recipes.md`'s
  "dark surface" recipe set `--ranger-surface`/`--ranger-track-color` by hand but forgot
  `--ranger-label-color-selected` — which left the selected label's *light*-mode default
  sitting on the new dark background at 1.1:1. Fixed the second one by rewriting the
  recipe to set `data-theme="dark"` instead of re-deriving individual tokens, which is
  also the more correct recipe to publish.
- **`verify-a11y.mjs` excludes `[class*="language-"]`** (VitePress's own Shiki-highlighted
  code blocks) from the axe run: the default GitHub-light theme's keyword colours measure
  4.23–4.28:1 against VitePress's own code background — a hair under 4.5:1, a VitePress
  default this project doesn't style, and not what "the live examples pass" asks for.

### After code review

- **`ssr-nuxt.md`'s "Plain Vue SSR" sample now declares `moods` before using it.** It
  referenced an undeclared variable — a real "paste and run it" failure the review
  caught by actually reading the sample rather than trusting that it looked plausible.
- **The word "slider" is now "Ranger"** everywhere this ticket's pages used it in prose
  (`playground.md`, `quickstart.md`, `recipes.md`, `accessibility.md`, the home page's
  hero text), per CONTEXT.md's glossary — kept only where it is the literal ARIA role
  (`role="slider"`) or text a screen reader actually announces. `migrating-from-vlider
  .md`'s `id="mood-slider"` stayed: it is vlider's own old attribute value inside a
  "here is what the old code looked like" sample, not this project's word for its own
  component.
- **Kept, not changed: the drift check only proves a name is mentioned, not mentioned
  correctly.** The review flagged this as a real limit — `verify-drift.mjs` can't tell
  a prop name dropped into an unrelated sentence from a real explanation of it. Recorded
  rather than fixed: catching that would mean parsing the docs' prose for meaning, which
  is a different, much larger tool than "fails on drift."
- **Kept, not changed: no automated tarball-size threshold.** Issue 10's acceptance
  criterion ("small enough to justify itself") sets no number to check against; the
  `npm publish --dry-run` output (~105 kB, mostly source maps) was read by eye instead,
  which is what the wording asks for.
