# 23: Reword predecessor-project rationale in specs, ADRs, and code comments

**What to build:** Every remaining mention of "vlider" outside README and the playground
(handled by issue 22) is design *rationale* — the reasoning behind ADR-0001 through
ADR-0004, spec.md, CONTEXT.md's glossary, and comments in `src/`, `tests/`, and
`type-tests/` that explain a decision by contrasting it with what the predecessor did.
That reasoning is worth keeping; the name isn't. Reword every such mention to describe
the predecessor generically (e.g. "the predecessor", "the original implementation",
"the prior version") without naming or linking it, while preserving the actual
explanation (what it did, why that was a problem, what this project does instead).

This covers: `spec.md`, `CONTEXT.md`, `docs/adr/0001-*.md` through `0004-*.md`,
`src/gradients.ts`, `src/types.ts`, `src/Ranger.vue`, `src/ranger.css`,
`tests/unit/*.test.ts`, `tests/browser/*.test.ts`.

Historical `.scratch/ranger-v1/issues/*.md` ticket files (02, 03, 04, 05, 06, 07, 09, 10,
11, 13) are explicitly **out of scope** — same treatment issue 20 gave issue 11: left as a
frozen record of what was originally specified, not rewritten after the fact.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `grep -ri vlider spec.md CONTEXT.md docs/ src/ tests/ type-tests/` returns nothing.
- [x] Every reworded ADR/spec passage still explains the actual design reasoning (what problem the predecessor had, what this project does differently) — no rationale is deleted, only depersonalized.
- [x] Test descriptions (`it(...)` names) that referenced vlider by name still describe what behavior they're pinning, just without the name.
- [x] `npm run typecheck`, `npm run lint`, and `npm run test` stay clean (no test description or comment changes should touch actual test logic/assertions).

## Comments

**Resolved.** Every "vlider" mention in `spec.md`, `CONTEXT.md`, `docs/adr/0001-*.md`
through `0004-*.md`, `src/gradients.ts`, `src/types.ts`, `src/Ranger.vue`,
`src/ranger.css`, and `tests/unit/*.test.ts`/`tests/browser/*.test.ts` now describes the
predecessor generically ("the predecessor", "the prior version", etc.) while keeping the
actual design reasoning intact. The historical `.scratch/ranger-v1/issues/*.md` tickets
(02–07, 09–11, 13) were left untouched as originally specified. `grep -ri vlider spec.md
CONTEXT.md docs/ src/ tests/ type-tests/` returns nothing; `npm run typecheck`, `lint`,
and `test` all pass clean.
