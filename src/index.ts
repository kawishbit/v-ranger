import type { App, Plugin } from 'vue'
import Ranger from './Ranger.vue'

export { Ranger }

// Spec 4.6 fixes the public surface. `Gradient` and the `gradients` presets
// join it with issue 04, which owns `src/gradients.ts`; the axis types stay
// internal to the package until something outside it needs to name one.
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
