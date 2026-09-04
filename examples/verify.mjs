// The packaging half of issue 10's acceptance criteria that a unit test
// cannot make: does `npm install v-ranger` actually work, outside this
// monorepo, in the three shapes spec §8 promises — a Vite + Vue 3 app, a
// Nuxt 3 app (SSR), and a plain `<script src>` page with no bundler at all.
//
// Each example depends on `file:../v-ranger-local.tgz`, a packed tarball
// under the same rule the real `npm install v-ranger` would follow — not a
// workspace symlink, which would paper over a packaging mistake a real
// consumer would still hit.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, renameSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const examplesDir = fileURLToPath(new URL('.', import.meta.url))
const tarball = join(examplesDir, 'v-ranger-local.tgz')

const shell = process.platform === 'win32'

// `shell: true` with a separate args array is deprecated (args are not
// escaped); every argument here is a literal this script wrote, never
// consumer input, so the fix is just to stop tripping the warning: build one
// command string ourselves instead of handing Node the two together.
function spawnCommand(command, args, options) {
  return shell
    ? spawnSync([command, ...args].join(' '), { shell: true, ...options })
    : spawnSync(command, args, { ...options })
}

function run(command, args, options = {}) {
  const result = spawnCommand(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed in ${options.cwd ?? process.cwd()} (exit ${result.status})`,
    )
  }
}

function capture(command, args, options = {}) {
  const result = spawnCommand(command, args, { encoding: 'utf8', ...options })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr}`)
  return result.stdout
}

/** A minimal static file server, so the CDN example loads over HTTP the way a
 * real page does — `file://` gives every asset an opaque origin, which
 * breaks the very module loading this example exists to prove works. */
function serveStatic(dir) {
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.cjs': 'text/javascript',
  }

  const server = createServer((req, res) => {
    const path = req.url === '/' ? '/index.html' : req.url.split('?')[0]

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

/** Starts a long-running server and waits until `url` answers, rather than a
 * fixed delay — the Nuxt output takes a variable amount of time to come up. */
async function startServer(command, args, options, url) {
  const child = spawn(command, args, { ...options, stdio: 'pipe' })
  const output = []
  child.stdout.on('data', (chunk) => output.push(String(chunk)))
  child.stderr.on('data', (chunk) => output.push(String(chunk)))

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      await fetch(url)
      return child
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  child.kill()
  throw new Error(`server never answered ${url}:\n${output.join('')}`)
}

/**
 * Visits every `[label, path]` under `base` and checks the three things a
 * bundled example (Vite, Webpack) has to get right for both its entries: one
 * rendered engine, a gradient that actually painted, and no page error.
 * Pushes onto `failures` directly, since every caller does the same with it.
 */
async function checkEntries(browser, base, entries, failures) {
  for (const [label, path] of entries) {
    const result = await visit(browser, `${base}${path}`)

    if (result.rangeCount !== 1) {
      failures.push(`${label}: expected one input[type=range], got ${result.rangeCount}`)
    }
    if (!result.hasGradientTrack)
      failures.push(`${label}: track has no gradient — stylesheet did not apply`)
    if (result.errors.length > 0)
      failures.push(`${label}: page errors: ${result.errors.join('; ')}`)
  }
}

/** Loads a URL, collects console messages and page errors, and hands both
 * back — used to hold every example to "no console error, no page error". */
async function visit(browser, url) {
  const page = await browser.newPage()
  const consoleMessages = []
  const errors = []

  page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`))
  page.on('pageerror', (error) => errors.push(String(error)))

  await page.goto(url, { waitUntil: 'networkidle' })
  const rangeCount = await page.locator('input[type="range"]').count()
  // Whether the stylesheet actually applied, not just whether it resolved —
  // exactly the distinction the webpack `full` bug (tree-shaken CSS import,
  // module still resolved fine) would otherwise slip past.
  const hasGradientTrack = await page
    .locator('.ranger__track')
    .evaluate((element) => getComputedStyle(element).backgroundImage.includes('gradient'))
    .catch(() => false)
  await page.close()

  return { console: consoleMessages, errors, rangeCount, hasGradientTrack }
}

async function main() {
  console.log('packing v-ranger…')
  rmSync(tarball, { force: true })
  const packOutput = capture('npm', ['pack', '--silent'], { cwd: root })
  const packedName = packOutput.trim().split('\n').at(-1)
  renameSync(join(root, packedName), tarball)

  const browser = await chromium.launch()
  const failures = []

  try {
    // --- Vite + Vue 3 ----------------------------------------------------
    console.log('\n--- examples/vite-vue ---')
    const viteVue = join(examplesDir, 'vite-vue')
    run('npm', ['install'], { cwd: viteVue })
    run('npm', ['run', 'typecheck'], { cwd: viteVue })
    run('npm', ['run', 'build'], { cwd: viteVue })

    const viteServer = await serveStatic(join(viteVue, 'dist'))
    const viteAddress = viteServer.address()

    // Two pages: `.` + the explicit `v-ranger/style.css` import, and
    // `v-ranger/full` alone — both must render styled, not merely resolve.
    await checkEntries(
      browser,
      `http://localhost:${viteAddress.port}`,
      [
        ['vite-vue (. + style.css)', '/'],
        ['vite-vue (full)', '/full.html'],
      ],
      failures,
    )
    viteServer.close()

    // --- Nuxt 3 (SSR) ------------------------------------------------------
    console.log('\n--- examples/nuxt ---')
    const nuxt = join(examplesDir, 'nuxt')
    run('npm', ['install'], { cwd: nuxt })
    run('npm', ['run', 'build'], { cwd: nuxt })

    const nuxtPort = '3999'
    const nuxtUrl = `http://localhost:${nuxtPort}/`
    const nuxtServer = await startServer(
      process.execPath,
      [join(nuxt, '.output/server/index.mjs')],
      { cwd: nuxt, env: { ...process.env, PORT: nuxtPort, NITRO_PORT: nuxtPort } },
      nuxtUrl,
    )

    try {
      const ssrHtml = await (await fetch(nuxtUrl)).text()
      if (!ssrHtml.includes('type="range"'))
        failures.push('nuxt: server-rendered HTML has no range input')

      const nuxtResult = await visit(browser, nuxtUrl)
      const hydrationWarnings = nuxtResult.console.filter((line) => /hydrat/i.test(line))

      if (nuxtResult.rangeCount !== 1) {
        failures.push(`nuxt: expected one input[type=range], got ${nuxtResult.rangeCount}`)
      }
      if (hydrationWarnings.length > 0)
        failures.push(`nuxt: hydration mismatch: ${hydrationWarnings.join('; ')}`)
      if (nuxtResult.errors.length > 0)
        failures.push(`nuxt: page errors: ${nuxtResult.errors.join('; ')}`)
    } finally {
      nuxtServer.kill()
    }

    // --- CDN, no build step ------------------------------------------------
    console.log('\n--- examples/cdn ---')
    const cdn = join(examplesDir, 'cdn')
    run('npm', ['install'], { cwd: cdn })

    const cdnServer = await serveStatic(cdn)
    const cdnAddress = cdnServer.address()
    const cdnResult = await visit(browser, `http://localhost:${cdnAddress.port}/`)
    cdnServer.close()

    if (cdnResult.rangeCount !== 1) {
      failures.push(`cdn: expected one input[type=range], got ${cdnResult.rangeCount}`)
    }
    if (cdnResult.errors.length > 0)
      failures.push(`cdn: page errors: ${cdnResult.errors.join('; ')}`)

    // --- Webpack: `.` + `./style.css` and `./full` both resolve ------------
    console.log('\n--- examples/webpack ---')
    const webpack = join(examplesDir, 'webpack')
    run('npm', ['install'], { cwd: webpack })
    run('npm', ['run', 'build'], { cwd: webpack })

    const webpackServer = await serveStatic(webpack)
    const webpackAddress = webpackServer.address()

    await checkEntries(
      browser,
      `http://localhost:${webpackAddress.port}`,
      [
        ['webpack (. + style.css)', '/'],
        ['webpack (full)', '/full.html'],
      ],
      failures,
    )
    webpackServer.close()
  } finally {
    await browser.close()
  }

  if (failures.length > 0) {
    console.error(`\nverify:examples failed:\n${failures.map((line) => `  - ${line}`).join('\n')}`)
    process.exitCode = 1
  } else {
    console.log(
      '\nverify:examples passed — vite-vue, nuxt (SSR), cdn and webpack all install and run from the packed tarball',
    )
  }
}

await main()
