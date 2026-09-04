import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

// Every live example on the site imports `v-ranger` and `v-ranger/style.css`
// by name, exactly as a real consumer would — these two aliases are the only
// thing standing between that and the actual source in `../../src`, so the
// docs demo the real thing rather than a snapshot of it (issue 11's scope).
const src = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url))

export default defineConfig({
  title: 'v-ranger',
  description: 'A colourful, emotive range slider for Vue 3.',
  cleanUrls: true,
  lastUpdated: true,

  vite: {
    resolve: {
      alias: [
        { find: 'v-ranger/style.css', replacement: src('ranger.css') },
        { find: 'v-ranger', replacement: src('index.ts') },
      ],
    },
  },

  themeConfig: {
    nav: [
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Playground', link: '/playground' },
      { text: 'Tokens', link: '/tokens' },
      { text: 'GitHub', link: 'https://github.com/kawishbit/ranger' },
    ],

    sidebar: [
      {
        text: 'Get started',
        items: [
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Ordinal vs numeric', link: '/ordinal-vs-numeric' },
          { text: 'Live playground', link: '/playground' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Stops, icons and slots', link: '/stops-icons-slots' },
          { text: 'Gradients', link: '/gradients' },
          { text: 'Tokens', link: '/tokens' },
          { text: 'Recipes', link: '/recipes' },
          { text: 'Accessibility', link: '/accessibility' },
          { text: 'SSR and Nuxt 3', link: '/ssr-nuxt' },
        ],
      },
      {
        text: 'Migrating',
        items: [{ text: 'From vlider', link: '/migrating-from-vlider' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/kawishbit/ranger' }],

    search: { provider: 'local' },
  },
})
