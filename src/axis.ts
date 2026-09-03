import type { Stop } from './types'

/**
 * Everything this module can complain about. A closed set, so a typo in a code
 * is a type error rather than a diagnostic nobody ever sees.
 */
export type DiagnosticCode =
  | 'no-axis'
  | 'incomplete-range'
  | 'invalid-step'
  | 'numeric-stop-without-at'
  | 'stop-outside-range'
  | 'duplicate-stop-value'
  | 'ordinal-stop-with-at'
  | 'ordinal-stop-without-value'
  | 'value-not-in-stops'
  | 'value-out-of-range'
  | 'value-off-step'

/**
 * A complaint about the props or the value, returned as data rather than
 * written to the console, so this module stays pure and testable. `warn()` is
 * the only part that prints, and the only part stripped from production builds.
 */
export interface Diagnostic {
  code: DiagnosticCode
  /** Index into the stops the consumer passed, where the complaint is about one. */
  index?: number
}

interface AxisBase<V> {
  stops: Stop<V>[]
  diagnostics: Diagnostic[]
}

/** _n_ stops, evenly spaced; position comes from the index (ADR-0002). */
export interface OrdinalAxis<V> extends AxisBase<V> {
  kind: 'ordinal'
}

/** A stop that has survived normalisation onto a numeric axis: `at` is certain. */
export type PinnedStop<V> = Stop<V> & { at: number }

/** A continuous range; stops are optional ticks pinned at `at` (ADR-0002). */
export interface NumericAxis<V> extends AxisBase<V> {
  kind: 'numeric'
  stops: PinnedStop<V>[]
  min: number
  max: number
  step: number
}

export type Axis<V> = OrdinalAxis<V> | NumericAxis<V>

export interface AxisProps<V> {
  stops?: Stop<V>[]
  min?: number
  max?: number
  step?: number
}

export interface Resolved<V> {
  value: V | null
  /** The selected stop, or `null` when unset. */
  stop: Stop<V> | null
  /** Index of the selected stop; `-1` when unset. */
  index: number
  /** `0..1`. Unset shares the start with the first stop, so read `unset` to tell them apart. */
  position: number
  /** No choice has been made. Never inferred from `position` (ADR-0003). */
  unset: boolean
  /**
   * The stop closest to `position`, selected or not - what the thumb tint and
   * `aria-valuetext` fall back to between numeric ticks. `null` while unset, so
   * an unanswered slider never presents a stop as the answer (ADR-0003).
   */
  nearest: { stop: Stop<V>; index: number } | null
  /** Complaints about this value, as data. See `Diagnostic`. */
  diagnostics: Diagnostic[]
}

function isPinned<V>(stop: Stop<V>): stop is PinnedStop<V> {
  return stop.at !== undefined
}

/** The value a stop carries; a stop may have none. */
function valueOf<V>(stop: Stop<V>): V | null {
  return stop.value ?? null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Where `value` sits in `min..max`, unclamped. A zero-width range is one point. */
function normalise(value: number, min: number, max: number): number {
  const span = max - min
  return span === 0 ? 0 : (value - min) / span
}

/** Where the nth of `count` evenly spaced stops sits. A lone stop is at the start. */
function positionOfIndex(index: number, count: number): number {
  const last = count - 1
  return last <= 0 ? 0 : index / last
}

/**
 * Puts a number on the `min + n * step` grid, the way a native range input's
 * value sanitisation algorithm does — including its last rule: when rounding up
 * would overshoot `max`, round down instead. A range that is not a whole number
 * of steps therefore cannot reach its own `max`.
 */
function snapToStep(value: number, min: number, max: number, step: number): number {
  const clamped = clamp(value, min, max)
  const snapped = min + Math.round((clamped - min) / step) * step

  return snapped > max ? min + Math.floor((max - min) / step) * step : snapped
}

/**
 * Infers the axis from the props (ADR-0002) and normalises its stops.
 */
export function resolveAxis<V>(props: AxisProps<V>): Axis<V> {
  const stops = props.stops ?? []
  const diagnostics: Diagnostic[] = []

  if (props.min !== undefined || props.max !== undefined) {
    // Half a range is a half-specified axis. The other end is filled in so the
    // component still renders, but the consumer hears about the guess.
    if (props.min === undefined || props.max === undefined) {
      diagnostics.push({ code: 'incomplete-range' })
    }

    const min = props.min ?? 0
    const max = props.max ?? 100

    // A step of 0 - or negative, or NaN - divides by zero when snapping.
    let step = props.step ?? 1
    if (!(step > 0)) {
      diagnostics.push({ code: 'invalid-step' })
      step = 1
    }

    const pinned: PinnedStop<V>[] = []

    stops.forEach((stop, index) => {
      // A stop with no `at` has nowhere to sit on a continuous axis, so it is
      // dropped rather than silently stacked at the start (spec 5.1).
      if (!isPinned(stop)) {
        diagnostics.push({ code: 'numeric-stop-without-at', index })
        return
      }

      // One pinned off the end is kept - it is a typo we can still render - but
      // the consumer hears about it.
      if (stop.at < min || stop.at > max) diagnostics.push({ code: 'stop-outside-range', index })

      pinned.push(stop)
    })

    return { kind: 'numeric', stops: pinned, diagnostics, min, max, step }
  }

  // Nothing to render: no stops to space, and no range to span (spec 5.1).
  if (stops.length === 0) diagnostics.push({ code: 'no-axis' })

  const seen = new Set<unknown>()

  stops.forEach((stop, index) => {
    // `at` pins a stop to a coordinate, which an ordinal axis does not have.
    // Passing both prop sets is the contradiction ADR-0002 warns about.
    if (stop.at !== undefined) diagnostics.push({ code: 'ordinal-stop-with-at', index })

    // `v-model` carries the stop's own value, so a stop without one can be
    // neither selected nor reported (ADR-0003).
    if (stop.value === undefined) {
      diagnostics.push({ code: 'ordinal-stop-without-value', index })
      return
    }

    // `resolve` matches a value to a stop by identity, so two stops sharing a
    // value make the second unreachable.
    if (seen.has(stop.value)) diagnostics.push({ code: 'duplicate-stop-value', index })
    seen.add(stop.value)
  })

  return { kind: 'ordinal', stops, diagnostics }
}

/**
 * Nothing to choose from: no stops to space, and no range to span. The read-side
 * companion to the `no-axis` diagnostic `resolveAxis` raises for the same shape,
 * so a consumer never has to match on a diagnostic code to ask the question.
 */
export function isEmptyAxis<V>(axis: Axis<V>): boolean {
  return axis.kind === 'ordinal' && axis.stops.length === 0
}

/** Index of the stop a value selects, or -1. Matching is by identity, so an
 * unrelated value simply misses rather than being a type error at the seam. */
function indexOfValue<V>(axis: Axis<V>, value: unknown): number {
  return axis.stops.findIndex((stop) => Object.is(stop.value, value))
}

export interface Placed<V> {
  stop: Stop<V>
  index: number
  position: number
}

/** Every stop with the position it occupies, so nothing has to index back in. */
export function placeStops<V>(axis: Axis<V>): Placed<V>[] {
  if (axis.kind === 'numeric') {
    return axis.stops.map((stop, index) => ({
      stop,
      index,
      position: normalise(stop.at, axis.min, axis.max),
    }))
  }

  return axis.stops.map((stop, index) => ({
    stop,
    index,
    position: positionOfIndex(index, axis.stops.length),
  }))
}

/** The stop closest to a position among those the caller will accept. */
function nearestStopWhere<V>(
  axis: Axis<V>,
  position: number,
  accept: (placed: Placed<V>) => boolean,
): { stop: Stop<V>; index: number } | null {
  let best: { stop: Stop<V>; index: number } | null = null
  let bestDistance = Infinity

  for (const placed of placeStops(axis)) {
    if (!accept(placed)) continue

    const distance = Math.abs(placed.position - position)
    if (distance < bestDistance) {
      best = { stop: placed.stop, index: placed.index }
      bestDistance = distance
    }
  }

  return best
}

function valueToPosition<V>(axis: Axis<V>, value: V | null): number {
  if (axis.kind === 'numeric') {
    if (typeof value !== 'number') return 0
    return clamp(normalise(value, axis.min, axis.max), 0, 1)
  }

  const index = indexOfValue(axis, value)
  if (index === -1) return 0

  return positionOfIndex(index, axis.stops.length)
}

/**
 * Everything the component needs to know about one value at once: where the
 * thumb goes, which stop is selected, and what to announce.
 */
export function resolve<V>(axis: Axis<V>, value: V | null): Resolved<V> {
  const numeric = axis.kind === 'numeric'
  const diagnostics: Diagnostic[] = []

  // On a numeric axis a stop is a tick pinned at `at`, so a value only selects
  // one by landing exactly on it. Between ticks there is no selected stop -
  // which is not the same as no selection (ADR-0003).
  const index =
    value === null
      ? -1
      : numeric
        ? axis.stops.findIndex((stop) => Object.is(stop.at, value))
        : indexOfValue(axis, value)

  const unset = numeric ? value === null : index === -1

  if (numeric) {
    // Report rather than rewrite: the consumer's value is theirs. Issue 03
    // settled what the component does with it - nothing, because emitting a
    // correction would be emitting on a prop change (ADR-0003) - so saying so
    // is the only way the developer finds out.
    if (typeof value === 'number') {
      if (value < axis.min || value > axis.max) {
        diagnostics.push({ code: 'value-out-of-range' })
      } else if (snapToStep(value, axis.min, axis.max, axis.step) !== value) {
        // A native range input cannot hold a value off its own step grid, so
        // the engine and the thumb will both show the snapped one.
        diagnostics.push({ code: 'value-off-step' })
      }
    }
  } else if (value !== null && index === -1) {
    // On an ordinal axis, a value matching no stop is a developer error: render
    // unset rather than guessing, but leave the consumer's value alone.
    diagnostics.push({ code: 'value-not-in-stops' })
  }

  const position = valueToPosition(axis, value)

  return {
    value,
    stop: axis.stops[index] ?? null,
    index,
    position,
    unset,
    // While unset there is no answer, so there is nothing to tint or announce.
    nearest: unset ? null : nearestStopWhere(axis, position, () => true),
    diagnostics,
  }
}

/**
 * The numeric coordinate space the interaction engine works in. A native range
 * input can only hold numbers, so an ordinal axis lends it one integer per stop
 * and a numeric axis lends it the range itself. Everything the component needs
 * to drive the engine is here, so the component never asks which kind of axis
 * it has (ADR-0001).
 */
export interface EngineRange {
  min: number
  max: number
  step: number
}

/** The `min`/`max`/`step` to put on the engine. See `EngineRange`. */
export function engineRange<V>(axis: Axis<V>): EngineRange {
  if (axis.kind === 'numeric') return { min: axis.min, max: axis.max, step: axis.step }

  // One integer per stop, so the native arrow key already moves exactly one
  // stop and no keyboard handling has to be written by hand.
  return { min: 0, max: Math.max(0, axis.stops.length - 1), step: 1 }
}

/** Where the engine currently sits, as a position. */
export function engineToPosition<V>(axis: Axis<V>, engineValue: number): number {
  const { min, max } = engineRange(axis)

  return clamp(normalise(engineValue, min, max), 0, 1)
}

/**
 * Where to put the engine for a position — snapped onto the engine's own grid,
 * because a value the engine cannot hold is a value the browser would silently
 * move. Two elements express one value and must never disagree (ADR-0001), so
 * the position the presentation layer paints comes back through
 * `engineToPosition` rather than being used raw.
 */
export function positionToEngine<V>(axis: Axis<V>, position: number): number {
  const { min, max, step } = engineRange(axis)

  return snapToStep(min + position * (max - min), min, max, step)
}

/**
 * Where a drag or click lands. Takes the current value because "if no enabled
 * stop exists in that direction, the value does not move" is undecidable
 * without knowing where the thumb came from.
 *
 * A numeric axis always yields a `number`, which the generic cannot know from
 * the props alone — so narrowing the axis first is what makes the result
 * honest, rather than a cast inside.
 */
export function positionToValue<V>(
  axis: NumericAxis<V>,
  position: number,
  from?: V | number | null,
): number
export function positionToValue<V>(
  axis: Axis<V>,
  position: number,
  from?: V | number | null,
): V | number | null
export function positionToValue<V>(
  axis: Axis<V>,
  position: number,
  from: V | number | null = null,
): V | number | null {
  if (axis.kind === 'numeric') {
    return snapToStep(axis.min + position * (axis.max - axis.min), axis.min, axis.max, axis.step)
  }

  const nearest = nearestStopWhere(axis, position, () => true)
  if (!nearest) return from

  if (!nearest.stop.disabled) return valueOf(nearest.stop)

  const fromIndex = indexOfValue(axis, from)

  // No previous value means no direction of travel, so the only sensible
  // reading of "settles on the nearest enabled stop" is nearest by distance.
  if (fromIndex === -1) {
    const enabled = nearestStopWhere(axis, position, (placed) => !placed.stop.disabled)
    return enabled ? valueOf(enabled.stop) : from
  }

  // Otherwise: the nearest enabled stop among those we were heading towards.
  // Searching outwards from the disabled stop instead would skip an enabled one
  // lying between here and there.
  const forward = nearest.index >= fromIndex
  const reachable = nearestStopWhere(
    axis,
    position,
    (placed) =>
      !placed.stop.disabled && (forward ? placed.index > fromIndex : placed.index < fromIndex),
  )

  return reachable ? valueOf(reachable.stop) : from
}

/** Complaints already printed, so a re-render does not repeat itself. */
const warned = new Set<string>()

/**
 * The only impure part of this module, and the only part stripped from
 * production builds: `import.meta.env.DEV` folds to `false`, leaving the body
 * as dead code the bundler drops along with these strings.
 */
export function warn(diagnostics: Diagnostic[]): void {
  /* v8 ignore next -- the production path, verified by grepping the build */
  if (!import.meta.env.DEV) return

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}:${diagnostic.index ?? ''}`
    if (warned.has(key)) continue
    warned.add(key)

    const where = diagnostic.index === undefined ? '' : ` (stop ${diagnostic.index})`
    console.warn(`[ranger] ${diagnostic.code}${where}`)
  }
}
