// Checks the claims `npm run build` cannot make about itself: that the
// diagnostics core is really gone from what ships, not merely believed gone
// because `import.meta.env.DEV` reads `false` in a dev server nobody
// packages. Issue 02 checked this once with a throwaway build, before
// anything imported the module; this is the real thing, run against the real
// entries, every time.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const entries = ['v-ranger.js', 'v-ranger.umd.cjs', 'full.js', 'full.cjs']

const failures = []

for (const entry of entries) {
  const path = new URL(entry, `file://${dist}`)
  let contents

  try {
    contents = await readFile(path, 'utf8')
  } catch {
    failures.push(`${entry}: missing — run \`npm run build\` first`)
    continue
  }

  if (contents.includes('[ranger]'))
    failures.push(`${entry}: still contains a "[ranger]" diagnostic string`)
  if (contents.includes('console.warn')) failures.push(`${entry}: still calls console.warn`)
}

if (failures.length > 0) {
  console.error('verify:build failed:\n' + failures.map((line) => `  - ${line}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`verify:build passed — no diagnostics core in ${entries.join(', ')}`)
}
