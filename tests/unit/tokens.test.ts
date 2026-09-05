import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The token surface is public API: renaming one is a breaking change
 * (ADR-0004), and nothing in the stylesheet may paint a value a consumer
 * cannot reach. Both claims are about the text of the files rather than about
 * anything a browser does, so they are checked by reading them — the drift
 * these catch is exactly the kind a rendering test would let through.
 */

const src = join(process.cwd(), 'src')
const spec = join(process.cwd(), '.scratch/ranger-v1/spec.md')

const css = readFileSync(join(src, 'ranger.css'), 'utf8')

/** Comments explain tokens by name, and an explanation is not a declaration. */
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

const TOKEN = /--ranger-[a-z-]+/g

function tokensIn(text: string): Set<string> {
  return new Set(text.match(TOKEN) ?? [])
}

/** The names spec §6 publishes, which is the list this package may not rename. */
function documentedTokens(): Set<string> {
  // Line endings are the checkout's business, not the spec's.
  const section = readFileSync(spec, 'utf8').match(/## 6\. Tokens\r?\n([\s\S]*?)\r?\n## 7\./)?.[1]

  if (section === undefined) throw new Error('spec §6 not found')

  return tokensIn(section)
}

interface Rule {
  selector: string
  declarations: { property: string; value: string }[]
}

/**
 * Every rule in the file, flat. An `@media` wrapper contributes no rule of its
 * own — its inner rules come out at the top level, which is all these tests ask
 * about. Deliberately not a CSS parser: the file is authored under a "no
 * nesting" rule precisely so reading it stays this cheap.
 */
function rules(text: string): Rule[] {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
    selector: selector.trim().replace(/\s+/g, ' '),
    declarations: body
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const at = declaration.indexOf(':')
        return {
          property: declaration.slice(0, at).trim(),
          value: declaration
            .slice(at + 1)
            .trim()
            .replace(/\s+/g, ' '),
        }
      }),
  }))
}

const parsed = rules(stripped)

/** A literal colour: a hex, a colour function, or one of the words CSS knows. */
const COLOUR =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|\b(?:white|black|red|green|blue|grey|gray|silver|orange|purple|magenta|cyan|yellow|rebeccapurple)\b/i

/** A literal length. Zero is not one: it carries no appearance to override. */
const LENGTH =
  /(?<![\w.-])(?!0(?:[a-z]+)?(?![\d.]))\d*\.?\d+(?:px|rem|em|ch|ex|vh|vw|vmin|vmax|pt|cm|mm|in)\b/i

describe('the token surface', () => {
  it('matches spec §6 exactly, since renaming a token is a breaking change', () => {
    const documented = documentedTokens()
    const used = new Set<string>()

    // Every source file, not only the stylesheet: the component writes five of
    // them as inline custom properties, and those are public API too.
    for (const file of readdirSync(src)) {
      const text = file === 'ranger.css' ? stripped : readFileSync(join(src, file), 'utf8')
      for (const token of tokensIn(text)) used.add(token)
    }

    expect([...used].sort()).toEqual([...documented].sort())
  })

  it('declares a default for every token a consumer may set', () => {
    // Read out of the resolution block rather than counted: a token with no
    // default is one a Ranger renders wrongly until the consumer finds it.
    const defaulted = new Set<string>()

    for (const rule of parsed) {
      for (const { value } of rule.declarations) {
        const named = value.match(/var\(\s*(--ranger-[a-z-]+)\s*,/g) ?? []
        for (const match of named) defaulted.add(match.slice(4, -1).trim())
      }
    }

    const documented = documentedTokens()

    // The five the component sets are the exception, and the only one: a
    // read-only token has no default because the component always writes it,
    // and `--ranger-gradient-direction` is the stylesheet's own.
    const componentSet = new Set([
      '--ranger-position',
      '--ranger-stop-position',
      '--ranger-stop-count',
      '--ranger-active-color',
      '--ranger-gradient-direction',
    ])

    for (const token of documented) {
      if (componentSet.has(token)) continue
      expect(defaulted, `${token} has no default`).toContain(token)
    }
  })

  it('paints nothing a token cannot reach', () => {
    const offenders: string[] = []

    for (const rule of parsed) {
      for (const { property, value } of rule.declarations) {
        // A custom property declaration is where a default is allowed to be
        // written down; every other declaration has to read one.
        if (property.startsWith('--')) continue

        if (COLOUR.test(value) || LENGTH.test(value)) {
          offenders.push(`${rule.selector} { ${property}: ${value} }`)
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('keeps every default on the component root, where one block holds them all', () => {
    const elsewhere = parsed
      .filter((rule) => rule.declarations.some(({ property }) => property.startsWith('--_')))
      .map((rule) => rule.selector)
      // `.ranger`, plus the size variant of it and the bare `[data-theme]`
      // container blocks that carry `--_theme` for a nearest-ancestor query
      // (issue 28). A default written any deeper would be a second place to
      // look for one.
      .filter((selector) => !/^(\.ranger(\[[^\]]+\])?|\[data-theme=.[a-z]+.\])$/.test(selector))

    expect(elsewhere).toEqual([])
  })

  it('resolves every internal alias through the public token first', () => {
    // The alias exists to write a default once, never to hide a value: if
    // `--_x` did not read `--ranger-x`, setting the token would do nothing.
    // Everything not on this list has to read a token, which is what stops a
    // hardcoded value being smuggled in behind a private name — the one hole a
    // grep for literals cannot see, since a custom property is where a default
    // is allowed to live.
    const internals = new Set(['--_touch-target', '--_slice', '--_theme'])
    const palette = /^--_(light|dark)-/

    const declared = parsed.flatMap((rule) =>
      rule.declarations.filter(({ property }) => property.startsWith('--_')),
    )

    for (const { property, value } of declared) {
      if (internals.has(property) || palette.test(property)) continue

      expect(value, `${property} does not read a token`).toMatch(/^var\(\s*--ranger-[a-z-]+\s*,/)
    }

    // And the palette itself is only ever a colour, never a size or a shape:
    // the schemes own colour and nothing else.
    for (const { property, value } of declared) {
      if (!palette.test(property)) continue

      expect(value, `${property} is not a colour`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('scales the three sizes by geometry alone', () => {
    const sized = parsed.filter((rule) => /^\.ranger\[data-size=/.test(rule.selector))

    expect(sized).toHaveLength(2)

    const colour = /color|gradient|opacity|transition|surface/
    for (const rule of sized) {
      for (const { property } of rule.declarations) {
        expect(property, `${rule.selector} sets ${property}`).not.toMatch(colour)
      }
    }
  })

  it('gives every scheme block the same tokens, whichever way it is asked for', () => {
    // A media query and a `data-theme` container query cannot be combined
    // without losing the specificity (media) or the containment (container)
    // that lets the explicit one win, so the same seven aliases are re-pointed
    // in three places: `@media`, `@container style(--_theme: dark)` and
    // `@container style(--_theme: light)`. The colours behind them are written
    // once, in the palette, but nothing except this stops the *lists* drifting
    // apart (ADR-0005). The flat rule reader (deliberately not a CSS parser)
    // has no notion of an `@`-rule wrapper, so a `.ranger` block nested in one
    // comes out at the top level same as the root's own — in file order: root,
    // then the dark-scheme media block, then the two container blocks.
    const roots = parsed.filter((rule) => rule.selector === '.ranger')
    expect(roots, 'expected root, media-dark, container-dark, container-light').toHaveLength(4)

    const [base, mediaDark, containerDark, containerLight] = roots as [Rule, Rule, Rule, Rule]

    const properties = (rule: Rule) => rule.declarations.map(({ property }) => property)

    // The media query and both containers: one list of names, three blocks.
    expect(properties(containerDark)).toEqual(properties(mediaDark))
    expect(properties(containerLight)).toEqual(properties(mediaDark))

    // And the light container says exactly what the root already resolved to,
    // so `data-theme="light"` inside a dark page is the plain default again.
    const rootDefaults = new Map(base.declarations.map((d) => [d.property, d.value]))
    for (const { property, value } of containerLight.declarations) {
      expect(value, `${property} drifted from the default`).toBe(rootDefaults.get(property))
    }
  })

  it('marks every data-theme ancestor as a query container, unnamed and unsized', () => {
    // Style queries need no size or layout containment — `normal` is enough —
    // and no name, since a Ranger only ever asks for its *nearest* one.
    const container = parsed.find(
      (rule) => rule.selector === "[data-theme='dark'], [data-theme='light']",
    )

    expect(container, 'no container-type block for [data-theme]').toBeDefined()
    expect(container!.declarations).toEqual([{ property: 'container-type', value: 'normal' }])
  })
})
