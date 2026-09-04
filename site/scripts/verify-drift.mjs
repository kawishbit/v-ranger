// Issue 11's acceptance criterion: "Every prop, event, slot and token in the
// spec appears in the docs; a test or script fails on drift." The spec is
// the source of truth (the same rule `tests/unit/tokens.test.ts` follows for
// tokens alone) — this just widens that check to props, events and slots,
// and points it at the docs site instead of the stylesheet.
import { readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteDir = fileURLToPath(new URL('..', import.meta.url))
const specPath = fileURLToPath(new URL('../../.scratch/ranger-v1/spec.md', import.meta.url))
const spec = readFileSync(specPath, 'utf8')

/** The body of one `### N.M Heading` section, up to the next `###` or `##`. */
function section(heading) {
  const pattern = new RegExp(`### ${heading}\\r?\\n([\\s\\S]*?)\\r?\\n#{2,3} `)
  const match = spec.match(pattern)
  if (!match) throw new Error(`spec section "${heading}" not found`)
  return match[1]
}

/** The names a spec table publishes: one per row, in backticks, first column. */
function tableNames(text) {
  return [...text.matchAll(/^\|\s*`([a-zA-Z:.-]+)`/gm)].map(([, name]) => name)
}

function tokenNames() {
  const match = spec.match(/## 6\. Tokens\r?\n([\s\S]*?)\r?\n## 7\./)
  if (!match) throw new Error('spec §6 not found')
  return [...new Set(match[1].match(/--ranger-[a-z-]+/g) ?? [])]
}

const props = tableNames(section('4\\.3 Props'))
const events = tableNames(section('4\\.4 Events'))
const slots = tableNames(section('4\\.5 Slots'))
const tokens = tokenNames()

/** Every `.md` file under `site/`, excluding VitePress's own build output. */
function docPages() {
  const pages = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.vitepress' || entry.name === 'node_modules') continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (extname(entry.name) === '.md') pages.push(path)
    }
  }

  walk(siteDir)
  return pages
}

const docsText = docPages()
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

function missing(names) {
  return names.filter((name) => !docsText.includes(`\`${name}\``))
}

const gaps = {
  props: missing(props),
  events: missing(events),
  slots: missing(slots),
  tokens: missing(tokens),
}

const failures = Object.entries(gaps)
  .filter(([, list]) => list.length > 0)
  .map(([kind, list]) => `${kind}: ${list.join(', ')}`)

if (failures.length > 0) {
  console.error(
    `verify:drift failed — mentioned nowhere in site/**/*.md:\n${failures.map((line) => `  - ${line}`).join('\n')}`,
  )
  process.exitCode = 1
} else {
  console.log(
    `verify:drift passed — ${props.length} props, ${events.length} events, ${slots.length} slots and ${tokens.length} tokens all appear in the docs`,
  )
}
