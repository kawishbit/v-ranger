import type { App, Plugin } from 'vue'
import Ranger from './Ranger.vue'

export { Ranger }

// Spec 4.6 fixes the public surface. The axis types stay internal to the
// package until something outside it needs to name one.
export { gradients } from './gradients'
export type { Gradient } from './gradients'
export type { Stop } from './types'
export type { Resolved } from './axis'

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
