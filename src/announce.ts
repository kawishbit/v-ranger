import type { Axis, Resolved } from './axis'

/**
 * What a screen reader says when the thumb lands somewhere: the value of
 * `aria-valuetext` on the interaction engine, and the whole of the component's
 * user-facing text (spec §7).
 *
 * DOM-free and pure, like the rest of the value logic — a string is exactly the
 * kind of thing that is cheap to assert and expensive to eyeball.
 *
 * The words here are the reader's, not the project's: CONTEXT.md exempts
 * user-facing text from its vocabulary, because to someone listening the control
 * *is* a slider and a stop they cannot choose *is* unavailable.
 */

/**
 * Said when nothing has been chosen. Explicit, because the alternative is a
 * reader hearing the first stop's name and believing it to be the answer — the
 * bug ADR-0003 exists to kill, in the one place it cannot be seen.
 */
const NO_SELECTION = 'No selection'

/** Said of a stop that is on the scale but cannot be chosen (spec §7). */
const UNAVAILABLE = 'unavailable'

/**
 * The engine's own number, rather than the model value, on a numeric axis: it
 * is the value the control actually holds after snapping, so the announcement
 * and the thumb can never describe different numbers.
 */
export function valueText<V>(axis: Axis<V>, resolved: Resolved<V>, engineValue: number): string {
  if (resolved.unset) return NO_SELECTION

  if (axis.kind === 'numeric') {
    // A tick's label where the value sits exactly on one, and the number
    // either way: "Hot, 100" reads as an answer, "100" still reads as one.
    const label = resolved.stop?.label

    return label === undefined ? String(engineValue) : `${label}, ${engineValue}`
  }

  const stop = resolved.stop
  const name = stop?.label ?? (stop?.value === undefined ? undefined : String(stop.value))

  // "Astonished, 3 of 6" (spec §7). The count is what turns a name into a
  // position on a scale, and it is the part colour was carrying on its own.
  return [
    name,
    stop?.disabled === true ? UNAVAILABLE : undefined,
    `${resolved.index + 1} of ${axis.stops.length}`,
  ]
    .filter((part) => part !== undefined && part !== '')
    .join(', ')
}
