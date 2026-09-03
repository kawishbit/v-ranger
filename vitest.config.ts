import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    coverage: {
      provider: 'v8',
      // The axis core is the module issue 02 requires full branch coverage of;
      // the component is covered by the browser project instead.
      include: ['src/axis.ts'],
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
    projects: [
      // Pure logic and component rendering. Fast, but jsdom has no layout —
      // anything that needs a real box goes in the browser project instead.
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      // Real Chromium. Drag, keyboard, focus and anything measuring geometry.
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
