import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      // Two pages: `.` + `v-ranger/style.css` (index.html), and `v-ranger/full`
      // alone (full.html) — the two ways the acceptance criteria names.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        full: fileURLToPath(new URL('./full.html', import.meta.url)),
      },
    },
  },
})
