// Two library builds, not one: `.` (ESM + UMD, no styles injected — ADR-0004)
// and `full` (ESM + CJS, styles injected). Vite's lib mode refuses `umd`/`iife`
// once `build.lib.entry` is an object, so this stays two `build()` calls
// against one shared `outDir` rather than one multi-entry config.
import { rm, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = 'dist'

/** @param {{ entry: string, formats: import('vite').LibraryFormats[], fileName: (format: string) => string }} options */
async function buildEntry({ entry, formats, fileName }) {
  await build({
    root,
    // Not `vite.config.ts`: that file is for `vite` (the dev server, over
    // `playground/`) and carries no `build.lib` of its own, so there is
    // nothing here worth merging with it — and merging would only risk
    // reintroducing the single-entry config this script replaces.
    configFile: false,
    plugins: [vue()],
    build: {
      target: 'es2022',
      sourcemap: true,
      outDir,
      // Both calls share `dist/`; the second must not erase the first.
      emptyOutDir: false,
      lib: {
        entry: fileURLToPath(new URL(entry, import.meta.url)),
        name: 'VRanger',
        formats,
        fileName,
        // Same computed name both times, so the second build's extracted
        // stylesheet overwrites the first's with identical bytes rather than
        // shipping two.
        cssFileName: 'v-ranger',
      },
      rollupOptions: {
        // `vue` is a peer dependency; never bundle it.
        external: ['vue'],
        output: {
          globals: { vue: 'Vue' },
          // The entry has both named exports (`Ranger`) and a default (the
          // plugin), so a UMD consumer reaches them as `VRanger.Ranger` and
          // `VRanger.default`. The CDN smoke example (issue 10) uses the named
          // export directly rather than the plugin, which is the simpler and
          // more common case, so this stays as Rollup's own default shape
          // instead of a bespoke UMD entry.
          exports: 'named',
        },
      },
    },
  })
}

await rm(new URL(`../${outDir}`, import.meta.url), { recursive: true, force: true })

await buildEntry({
  entry: '../src/index.ts',
  formats: ['es', 'umd'],
  fileName: (format) => (format === 'es' ? 'v-ranger.js' : 'v-ranger.umd.cjs'),
})

await buildEntry({
  entry: '../src/full.ts',
  formats: ['es', 'cjs'],
  fileName: (format) => (format === 'es' ? 'full.js' : 'full.cjs'),
})

// The one line `full.ts`'s own comment defers to here: Rollup extracted the
// stylesheet but left no import for it, because that is exactly right for `.`
// and exactly wrong for `full`.
for (const [file, statement] of /** @type {const} */ ([
  ['full.js', "import './v-ranger.css';\n"],
  ['full.cjs', "require('./v-ranger.css');\n"],
])) {
  const path = new URL(`../${outDir}/${file}`, import.meta.url)
  const built = await readFile(path, 'utf8')
  await writeFile(path, statement + built)
}
