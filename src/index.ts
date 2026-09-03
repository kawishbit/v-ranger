import type { App, Plugin } from 'vue'
import Ranger from './Ranger.vue'

export { Ranger }

/**
 * Optional global registration:
 *
 * ```ts
 * import RangerPlugin from 'v-ranger'
 * app.use(RangerPlugin)
 * ```
 *
 * Importing `{ Ranger }` directly is the documented default — it tree-shakes.
 */
const plugin: Plugin = {
  install(app: App) {
    app.component('Ranger', Ranger)
  },
}

export default plugin
