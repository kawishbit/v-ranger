import type { Diagnostic } from './diagnostics'

/**
 * Colour, expressed separately from data (ADR-0004). Nothing here touches the
 * DOM or a stylesheet: the whole module is string arithmetic over a ramp, and
 * its one output is the value of `--ranger-gradient` on the component root.
 * That is what removed vlider's generated `<style>` element, and with it the
 * `id` prop and the global-state bug behind it (ADR-0001).
 */

/** A preset name, a CSS gradient string, or a list of colours (spec 4.2). */
export type Gradient = string | string[]

/**
 * The ramps that ship with the package, so a Ranger is colourful with no
 * configuration. `mood` is vlider's own demo ramp, colour for colour, so the
 * component people recognise is still the one they get by default.
 */
export const gradients = {
  mood: ['#ffc300', '#ffb0fe', '#ff6bd6', '#ff9d76', '#51eaea', '#fb3569'],
  sunset: ['#ffcf70', '#ff9f5a', '#ff6f61', '#c94b8c', '#5f2c82'],
  ocean: ['#0b3d91', '#1268b3', '#2196c9', '#4fc3d9', '#a8e6ea'],
  heat: ['#1b1464', '#7b2cbf', '#e63946', '#f77f00', '#ffd60a'],
  mono: ['#e5e7eb', '#9ca3af', '#4b5563', '#111827'],
  // A ramp of no colours is not a ramp. Saying so in the type is what spares
  // every reader below a fallback for a case that cannot happen.
} satisfies Record<string, readonly [string, ...string[]]>

export type GradientPreset = keyof typeof gradients

/** What an unconfigured Ranger paints, and what an unusable `gradient` falls back to. */
export const DEFAULT_GRADIENT: GradientPreset = 'mood'

/** One colour and where on the track it sits, `0..1`. */
export interface RampStop {
  color: string
  position: number
}

/** One stop's slice of the ramp: where it sits, and the colour it wants there. */
export interface StopSlice {
  position: number
  color?: string
}

export interface ResolvedGradient {
  /**
   * The value for `--ranger-gradient`, or `null` when the stylesheet's own
   * default already says exactly this. Leaving the token unset in that case is
   * what keeps it overridable from CSS, which is the whole restyling story
   * (ADR-0004) - an inline style would beat any stylesheet a consumer wrote.
   */
  css: string | null
  /**
   * The ramp as colour stops, for sampling the thumb's tint out of. `null` when
   * the consumer handed us a CSS gradient string, which we cannot read.
   */
  ramp: RampStop[] | null
  /** Complaints about the `gradient` prop, as data. See `Diagnostic`. */
  diagnostics: Diagnostic[]
}

/** At most two decimals, and never a trailing `.0`, so the output stays readable. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

function isPreset(name: string): name is GradientPreset {
  return Object.hasOwn(gradients, name)
}

/**
 * An actual gradient function, or a `var()` standing in for one. Matching the
 * grammar rather than just looking for a bracket is what makes a typo -
 * `linear-gradiant(...)` - a complaint instead of a track that silently paints
 * nothing. A lone colour (`red`, `#f00`) is a complaint too: it is neither a
 * preset name nor a ramp.
 */
const CSS_GRADIENT = /(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(|^var\(/i

/** At least one colour, so nothing downstream has to cope with a ramp of none. */
type Colours = readonly [string, ...string[]]

/**
 * What a `gradient` names: colours we can take apart, or CSS we cannot. The two
 * are a union rather than a nullable, so the caller reads the raw string off
 * this rather than casting the prop back to one.
 */
type Source =
  { kind: 'css'; css: string } | { kind: 'colors'; colors: Colours; fromDefault: boolean }

function sourceOf(gradient: Gradient | undefined, diagnostics: Diagnostic[]): Source {
  if (gradient === undefined) {
    return { kind: 'colors', colors: gradients[DEFAULT_GRADIENT], fromDefault: true }
  }

  if (Array.isArray(gradient)) {
    const [first, ...rest] = gradient
    if (first !== undefined) return { kind: 'colors', colors: [first, ...rest], fromDefault: false }
  } else {
    const name = gradient.trim()

    if (isPreset(name)) {
      return { kind: 'colors', colors: gradients[name], fromDefault: name === DEFAULT_GRADIENT }
    }

    if (CSS_GRADIENT.test(name)) return { kind: 'css', css: name }
  }

  diagnostics.push({ code: 'invalid-gradient' })

  return { kind: 'colors', colors: gradients[DEFAULT_GRADIENT], fromDefault: true }
}

/**
 * A list of colours spread evenly across the track. Built by hand rather than
 * mapped, so the result carries the "at least one colour" the input already
 * had - which is what spares `resolveGradient` a fallback for a ramp that
 * cannot be empty.
 */
function spread(colors: Colours): [RampStop, ...RampStop[]] {
  const [first, ...rest] = colors

  return [
    { color: first, position: 0 },
    // `rest.length` is the index of the final colour, and is only ever divided
    // by where there is a rest to divide it into.
    ...rest.map((color, index) => ({ color, position: (index + 1) / rest.length })),
  ]
}

/**
 * The colour at a position, mixing the two ramp stops it falls between. The mix
 * is left to `color-mix()` rather than done here: the browser interpolates in
 * oklab, in the consumer's own colour space, over colours this module never has
 * to parse - `currentColor` and `var(--brand)` included.
 */
export function sampleRamp(ramp: readonly RampStop[], position: number): string | null {
  // `before` ends on the *last* stop at or before the position, so a hard stop
  // - two colours sharing a coordinate - hands back the one that begins there,
  // which is the colour the painted gradient shows at that pixel.
  let before: RampStop | undefined
  let after: RampStop | undefined

  for (const stop of ramp) {
    if (stop.position <= position) before = stop
    else if (!after) after = stop
  }

  // Beyond either end a gradient holds its end colour rather than running out.
  if (!before) return after?.color ?? null
  if (!after) return before.color

  if (before.position === position) return before.color

  const towards = (position - before.position) / (after.position - before.position)

  return `color-mix(in oklab, ${before.color} ${round((1 - towards) * 100)}%, ${after.color})`
}

/**
 * A `linear-gradient` in the writing direction. The direction is a custom
 * property rather than a literal `to right`, so the stylesheet can flip it
 * under RTL without this module knowing which way the page runs - it has no
 * DOM to ask, and asking would cost SSR (spec 3).
 */
function rampToCss(ramp: readonly RampStop[]): string {
  // A gradient needs two colour stops, so a lone colour paints both ends.
  const only = ramp.length === 1 ? ramp[0] : undefined
  const both = only
    ? [
        { ...only, position: 0 },
        { ...only, position: 1 },
      ]
    : ramp

  const stops = both.map((stop) => `${stop.color} ${round(stop.position * 100)}%`).join(', ')

  return `linear-gradient(var(--ranger-gradient-direction, to right), ${stops})`
}

/**
 * What to tint the thumb at a position, or `undefined` when there is nothing
 * honest to tint it with and the stylesheet's own default should stand.
 *
 * Sampled from the ramp rather than read off the nearest stop (spec 5.4). The
 * two agree wherever a stop exists to be nearest to - the ramp carries that
 * stop's colour at that stop's coordinate - and sampling also answers on a
 * numeric axis with no ticks at all, where "the nearest stop" has no answer.
 * `fallback` covers the one case the ramp cannot: a CSS gradient string, which
 * leaves the stop's own colour as the only colour we can be sure of.
 */
export function tintAt(
  gradient: ResolvedGradient,
  position: number,
  fallback?: string,
): string | undefined {
  if (!gradient.ramp) return fallback

  return sampleRamp(gradient.ramp, position) ?? fallback
}

/** A slice the consumer actually put a colour on. */
function hasColour(stop: StopSlice): stop is RampStop {
  return stop.color !== undefined
}

/** Sorted, because a gradient's colour stops have to run one way and a numeric
 * axis takes its ticks in whatever order they were written. */
function byPosition(ramp: readonly RampStop[]): RampStop[] {
  return [...ramp].sort((a, b) => a.position - b.position)
}

/**
 * Everything the component needs to know about colour at once: what to paint
 * the track with, and the ramp the thumb tints itself out of.
 *
 * Two readings of "a stop's `color` overrides its slice" (spec 5.4), and both
 * are wanted:
 *
 * - A colour on **every** stop is a ramp in its own right, and becomes the
 *   whole ramp. That is what reproduces vlider's exact ramp, at any number of
 *   stops rather than only at the six the `mood` preset happens to have.
 * - A colour on **some** stops overrides those slices of the preset and leaves
 *   the rest of it alone. Rebuilding the ramp from the stops instead would let
 *   one coloured tick on a numeric axis flatten the whole track, or squash the
 *   preset into the span its ticks happen to cover.
 */
export function resolveGradient(
  gradient: Gradient | undefined,
  stops: readonly StopSlice[],
): ResolvedGradient {
  const diagnostics: Diagnostic[] = []
  const source = sourceOf(gradient, diagnostics)

  // CSS we cannot read goes through as it came: there is no ramp to sample, and
  // no slice of it a stop could override.
  if (source.kind === 'css') return { css: source.css, ramp: null, diagnostics }

  const baseRamp = spread(source.colors)
  const coloured = stops.filter(hasColour)

  if (coloured.length === 0) {
    return { css: source.fromDefault ? null : rampToCss(baseRamp), ramp: baseRamp, diagnostics }
  }

  const own = byPosition(coloured)

  // Every stop coloured: the stops are the ramp.
  if (coloured.length === stops.length) return { css: rampToCss(own), ramp: own, diagnostics }

  // Some of them: the preset, with those coordinates repainted. A base colour
  // sharing a coordinate with an override loses it, which is what makes the
  // override an override rather than a second colour in the same place.
  const overridden = new Set(own.map((stop) => stop.position))
  const ramp = byPosition([...baseRamp.filter((stop) => !overridden.has(stop.position)), ...own])

  return { css: rampToCss(ramp), ramp, diagnostics }
}
