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
  /** Overrides this stop's slice of the gradient. Any CSS colour. */
  color?: string
  disabled?: boolean
}
