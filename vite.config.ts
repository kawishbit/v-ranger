import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'VRanger',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'v-ranger.js' : 'v-ranger.umd.cjs'),
      cssFileName: 'v-ranger',
    },
    rollupOptions: {
      // `vue` is a peer dependency; never bundle it.
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        // The entry deliberately has both named exports (`Ranger`) and a default
        // (the plugin), so a UMD consumer reaches them as `VRanger.Ranger` and
        // `VRanger.default`. Issue 10 owns the CDN smoke test and may give the
        // UMD build its own entry to improve that; until then, be explicit
        // rather than let Rollup warn on every build.
        exports: 'named',
      },
    },
  },
})
