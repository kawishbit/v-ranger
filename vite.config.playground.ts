import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Production build of the playground app (root `index.html` + `playground/main.ts`),
// in ordinary app mode — kept out of `vite.config.ts` (the dev server only) so this
// build's own `outDir` can never collide with the library's own `dist/`
// (`scripts/build.mjs`, which reads neither Vite config file).
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'playground-dist',
    emptyOutDir: true,
  },
})
