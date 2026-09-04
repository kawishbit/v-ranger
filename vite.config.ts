import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The dev server only, over `playground/`. The library build is
// `scripts/build.mjs`, which needs two different `build.lib` shapes — one
// `umd`-capable, one not — that a single config here cannot express.
export default defineConfig({
  plugins: [vue()],
})
