/**
 * Complaints about the props, returned as data rather than written to the
 * console, so the modules that raise them stay pure and testable. `warn()` is
 * the only part that prints, and the only part stripped from production builds.
 */

/**
 * Everything the package can complain about. A closed set, so a typo in a code
 * is a type error rather than a diagnostic nobody ever sees.
 */
export type DiagnosticCode =
  | 'no-axis'
  | 'incomplete-range'
  | 'invalid-step'
  | 'numeric-stop-without-at'
  | 'stop-outside-range'
  | 'duplicate-stop-value'
  | 'ordinal-stop-with-at'
  | 'ordinal-stop-without-value'
  | 'value-not-in-stops'
  | 'value-out-of-range'
  | 'value-off-step'
  | 'invalid-gradient'
  | 'image-without-alt'

export interface Diagnostic {
  code: DiagnosticCode
  /** Index into the stops the consumer passed, where the complaint is about one. */
  index?: number
}

/** Complaints already printed, so a re-render does not repeat itself. */
const warned = new Set<string>()

/**
 * The only impure part of this module, and the only part stripped from
 * production builds: `import.meta.env.DEV` folds to `false`, leaving the body
 * as dead code the bundler drops along with these strings.
 */
export function warn(diagnostics: Diagnostic[]): void {
  /* v8 ignore next -- the production path, verified by grepping the build */
  if (!import.meta.env.DEV) return

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}:${diagnostic.index ?? ''}`
    if (warned.has(key)) continue
    warned.add(key)

    const where = diagnostic.index === undefined ? '' : ` (stop ${diagnostic.index})`
    console.warn(`[ranger] ${diagnostic.code}${where}`)
  }
}
