/**
 * The zero-config path: everything `.` exports, plus the stylesheet as a side
 * effect. ADR-0004 rejected JS style injection as the *default* — a consumer
 * who wants tree-shaking and an explicit `import 'v-ranger/style.css'` still
 * has `.` for that. This entry is the other half: `import 'v-ranger/full'` and
 * nothing else to remember.
 *
 * The side-effect import itself is not written here — Vite's library build
 * extracts a shared SFC stylesheet to its own file rather than leaving an
 * import for it in the JS output, which is exactly the behaviour `.` wants.
 * `scripts/build.mjs` adds the one line this entry actually needs, after the
 * build, to the two files this module compiles to.
 */
export * from './index'
export { default } from './index'
