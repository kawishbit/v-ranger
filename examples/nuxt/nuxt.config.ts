export default defineNuxtConfig({
  compatibilityDate: '2026-09-04',
  // The SSR/Nuxt recipe issue 11 documents: the stylesheet as global CSS
  // rather than an import inside a component, so it is present on the very
  // first server-rendered response.
  css: ['v-ranger/style.css'],
  devtools: { enabled: false },
})
