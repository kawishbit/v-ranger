import DefaultTheme from 'vitepress/theme'
import { Ranger } from 'v-ranger'
import 'v-ranger/style.css'
import './custom.css'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Registered globally so every page's live examples can write
    // `<Ranger …/>` directly with no per-page import (issue 11: "every code
    // sample on the site is one a reader can paste into a fresh Vue 3 app" —
    // the samples themselves still show the import; this only saves the docs
    // pages from repeating it).
    app.component('Ranger', Ranger)
  },
} satisfies Theme
