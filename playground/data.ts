import { gradients } from '../src/index'

/** Genuinely shared constants, not shared state — no example mutates these. */
export const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

export const presets = Object.keys(gradients)
export const sizes = ['sm', 'md', 'lg'] as const

/** One stop nobody may choose, with the two either side of it enabled. */
export const gapped = [
  { value: 'a', label: 'A', icon: '😠' },
  { value: 'b', label: 'B', icon: '😑', disabled: true },
  { value: 'c', label: 'C', icon: '😊' },
]

/** What vlider's demo shipped, spelled the way a consumer would spell it now. */
export const vliderStops = moods.map((stop, index) => ({ ...stop, color: gradients.mood[index] }))

/** Long enough that a slice cannot hold them on one line. */
export const verbose = [
  { value: 'a', label: 'Extraordinarily disappointed', icon: '😠' },
  { value: 'b', label: 'Fine', icon: '😑' },
  { value: 'c', label: 'Absolutely delighted beyond measure', icon: '😊' },
]
