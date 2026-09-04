// Issue 11's other acceptance criterion: "the live examples pass the same
// axe-core check as issue 06." Built rather than dev-served, so this checks
// what actually ships — `vitepress build` then a static server, the same
// shape `examples/verify.mjs` already uses for the packaging smoke tests.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const siteDir = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(siteDir, '.vitepress/dist')
const shell = process.platform === 'win32'

const pages = [
  '/',
  '/quickstart',
  '/ordinal-vs-numeric',
  '/playground',
  '/stops-icons-slots',
  '/gradients',
  '/tokens',
  '/recipes',
  '/accessibility',
  '/ssr-nuxt',
  '/migrating-from-vlider',
]

const WCAG22AA = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
}

function run(command, args, options = {}) {
  const result = shell
    ? spawnSync([command, ...args].join(' '), { shell: true, stdio: 'inherit', ...options })
    : spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed (exit ${result.status})`)
}

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }

function serveStatic(dir) {
  const server = createServer((req, res) => {
    let path = req.url.split('?')[0]
    if (path.endsWith('/')) path += 'index.html'
    else if (!extname(path)) path += '.html'

    try {
      const body = readFileSync(join(dir, decodeURIComponent(path)))
      res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })

  return new Promise((resolve) => server.listen(0, () => resolve(server)))
}

async function main() {
  console.log('building the docs site…')
  run('npx', ['vitepress', 'build', '.'], { cwd: siteDir })

  const server = await serveStatic(distDir)
  const { port } = server.address()
  const base = `http://localhost:${port}`

  const axeSource = readFileSync(
    fileURLToPath(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url)),
    'utf8',
  )

  const browser = await chromium.launch()
  const failures = []

  try {
    for (const path of pages) {
      const page = await browser.newPage()
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
      await page.addScriptTag({ content: axeSource })

      // The whole page, except syntax-highlighted code samples: VitePress's
      // default Shiki theme ships a couple of token colours a hair under
      // 4.5:1 (4.23-4.28:1) against its code-block background — a framework
      // default this project doesn't style and didn't introduce. Everything
      // this project actually authored, live examples included, is still
      // checked; issue 06's own axe check was scoped the same way, to the
      // mounted component rather than its surrounding test harness.
      const violations = await page.evaluate(async (options) => {
        const result = await window.axe.run(
          { include: [document.documentElement], exclude: [['[class*="language-"]']] },
          options,
        )
        return result.violations.map((v) => v.id)
      }, WCAG22AA)

      if (violations.length > 0) failures.push(`${path}: ${violations.join(', ')}`)
      await page.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  if (failures.length > 0) {
    console.error(`verify:a11y failed:\n${failures.map((line) => `  - ${line}`).join('\n')}`)
    process.exitCode = 1
  } else {
    console.log(`verify:a11y passed — ${pages.length} pages, no WCAG 2.2 AA violations`)
  }
}

await main()
