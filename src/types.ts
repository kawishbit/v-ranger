import type { Component } from 'vue'

/**
 * One addressable point on an axis. See CONTEXT.md for the vocabulary and
 * docs/adr/0002 for why an axis has two kinds.
 */
export interface Stop<V = unknown> {
  /** What v-model carries when this stop is selected. Ordinal axis only; must be unique. */
  value?: V
  /** Coordinate on a numeric axis. Numeric axis only. */
  at?: number
  label?: string
  /**
   * A unicode string, rendered as a text node, or a Vue component. Never a font:
   * requiring one silently is the vlider bug goal 1 of the spec exists to kill.
   */
  icon?: string | Component
  /** Image URL, rendered as an `<img>`. Takes precedence over `icon`. */
  image?: string
  /**
   * What `image` says to a reader who cannot see it. Defaults to `label`, which
   * is right whenever the image is the label — and wrong the moment it is not.
   */
  alt?: string
  /** Overrides this stop's slice of the gradient. Any CSS colour. */
  color?: string
  disabled?: boolean
}

/**
 * What every per-stop slot is handed (spec §4.5). Exported because it appears in
 * the component's generated declarations, not because spec §4.6 lists it: a
 * consumer gets this shape inferred, and never has to name it.
 */
export interface StopScope<V = unknown> {
  stop: Stop<V>
  index: number
  /** This stop is the selected stop. */
  selected: boolean
  /** Cannot be chosen: either this stop is disabled or the whole Ranger is. */
  disabled: boolean
  position: number
}
