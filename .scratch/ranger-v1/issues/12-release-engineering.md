# 12 — CI, changesets and the first release

Status: ready-for-human
Blocked by: 10, 11
Spec: [../spec.md](../spec.md) §11

Human-owned because it needs npm authentication, a Vercel project and DNS on `kawishbit.com` — credentials an agent should not hold. An agent can prepare every file; a human presses publish.

## Scope

- **GitHub Actions** (GitHub only, no other forge): on every PR and on `main`, run typecheck, lint, unit tests, browser tests and build. Cache npm. Install Playwright browsers.
- **Changesets** for versioning and release notes, with a PR check requiring a changeset on any change touching `src/`.
- **Release workflow** on tag: build, then `npm publish` with **provenance** via OIDC/trusted publishing.
- Verification before the first publish: `npm publish --dry-run` reviewed by a human against the file list in issue 10.
- Vercel project created and `ranger.kawishbit.com` pointed at it.
- Repo housekeeping: description and topics on GitHub, README badges once the package exists.

## Acceptance criteria

- A PR with no changeset fails the check; a PR with one passes.
- CI is green on `main` before any publish.
- `v-ranger@0.1.0` installs from the public registry and the quickstart works from a clean directory.
- The npm page shows the provenance attestation for the first automated release.
- The docs site resolves at its domain over HTTPS.

## Notes

Version starts at **`0.1.0`**, not `1.0.0`: the API is one design conversation old with no external users to validate it, and the first real consumer will find something. A fast `2.0.0` is a worse outcome than a `0.x`.
