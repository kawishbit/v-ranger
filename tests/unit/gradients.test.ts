import { describe, expect, it } from 'vitest'
import { gradients, resolveGradient, sampleRamp, tintAt } from '../../src/gradients'

/** The colours the original predecessor's demo shipped, in the order it shipped them. */
const predecessorRamp = ['#ffc300', '#ffb0fe', '#ff6bd6', '#ff9d76', '#51eaea', '#fb3569']

/** An ordinal axis of _n_ evenly spaced stops, the way `placeStops` places them. */
function evenStops(count: number, colors: (string | undefined)[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    position: count === 1 ? 0 : index / (count - 1),
    color: colors[index],
  }))
}

describe('the presets', () => {
  it('ships mood as the predecessor own ramp, so a migrating consumer sees no change', () => {
    expect(gradients.mood).toEqual(predecessorRamp)
  })

  it('ships the five the spec names, each of them an actual ramp', () => {
    expect(Object.keys(gradients)).toEqual(['mood', 'sunset', 'ocean', 'heat', 'mono'])

    for (const colors of Object.values(gradients)) {
      expect(colors.length).toBeGreaterThan(1)
    }
  })
})

describe('resolveGradient', () => {
  it('leaves the token alone when nothing overrides the default', () => {
    const resolved = resolveGradient(undefined, evenStops(6))

    // `null` means "the stylesheet already says this", which is what keeps
    // `--ranger-gradient` overridable from CSS (ADR-0004).
    expect(resolved.css).toBeNull()
    expect(resolved.diagnostics).toEqual([])
    expect(resolved.ramp?.map((stop) => stop.color)).toEqual(predecessorRamp)
  })

  it('spreads a preset evenly across the track', () => {
    const resolved = resolveGradient('ocean', [])

    expect(resolved.ramp).toEqual([
      { color: gradients.ocean[0], position: 0 },
      { color: gradients.ocean[1], position: 0.25 },
      { color: gradients.ocean[2], position: 0.5 },
      { color: gradients.ocean[3], position: 0.75 },
      { color: gradients.ocean[4], position: 1 },
    ])
  })

  it('leaves the token alone for the default preset asked for by name', () => {
    // Naming mood is asking for what the stylesheet already paints, so there is
    // still nothing to write inline.
    expect(resolveGradient('mood', []).css).toBeNull()
  })

  it('takes a bare list of colours', () => {
    const resolved = resolveGradient(['red', 'blue'], [])

    expect(resolved.css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), red 0%, blue 100%)',
    )
  })

  it('renders a one-colour list as a flat track rather than invalid CSS', () => {
    expect(resolveGradient(['red'], []).css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), red 0%, red 100%)',
    )
  })

  it('passes a CSS gradient string straight through', () => {
    const raw = 'radial-gradient(circle, red, blue)'
    const resolved = resolveGradient(raw, evenStops(3))

    expect(resolved.css).toBe(raw)
    // Nothing to sample: the consumer handed us colour we cannot read.
    expect(resolved.ramp).toBeNull()
    expect(resolved.diagnostics).toEqual([])
  })

  it('tells the developer about a preset that does not exist, and falls back to mood', () => {
    const resolved = resolveGradient('mooood', [])

    expect(resolved.diagnostics).toEqual([{ code: 'invalid-gradient' }])
    expect(resolved.ramp?.map((stop) => stop.color)).toEqual(predecessorRamp)
    expect(resolved.css).toBeNull()
  })

  it('treats a colour on its own as a missing preset, not a gradient', () => {
    // A single colour is not a ramp, and `#f00` is not a preset name either.
    expect(resolveGradient('#f00', []).diagnostics).toEqual([{ code: 'invalid-gradient' }])
  })

  it('catches a misspelt gradient function instead of painting nothing', () => {
    // A bracket is not enough to make something CSS. Passing this through would
    // leave `--ranger-gradient` holding a value the browser silently drops.
    expect(resolveGradient('linear-gradiant(red, blue)', []).diagnostics).toEqual([
      { code: 'invalid-gradient' },
    ])
  })

  it('accepts the gradient functions there are, and a var() standing in for one', () => {
    for (const raw of [
      'radial-gradient(red, blue)',
      'conic-gradient(red, blue)',
      'repeating-linear-gradient(red, blue 20%)',
      'var(--brand-ramp)',
    ]) {
      expect(resolveGradient(raw, []).css).toBe(raw)
    }
  })

  it('complains about an empty list rather than emitting a colourless gradient', () => {
    expect(resolveGradient([], []).diagnostics).toEqual([{ code: 'invalid-gradient' }])
    expect(resolveGradient([], []).css).toBeNull()
  })
})

describe('a stop that brings its own colour', () => {
  it('reproduces the predecessor exactly when every stop carries one', () => {
    const resolved = resolveGradient(undefined, evenStops(6, predecessorRamp))

    expect(resolved.css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), ' +
        '#ffc300 0%, #ffb0fe 20%, #ff6bd6 40%, #ff9d76 60%, #51eaea 80%, #fb3569 100%)',
    )
  })

  it('overrides only its own slice, leaving the rest of the ramp where it was', () => {
    const resolved = resolveGradient(undefined, evenStops(6, [undefined, undefined, 'black']))

    // Six stops sit exactly where mood's six colours do, so every other slice
    // comes back as the colour it already was - no mixing needed.
    expect(resolved.ramp?.map((stop) => stop.color)).toEqual([
      '#ffc300',
      '#ffb0fe',
      'black',
      '#ff9d76',
      '#51eaea',
      '#fb3569',
    ])
  })

  it('keeps the preset between its own colours where only some stops carry one', () => {
    const resolved = resolveGradient(['red', 'blue'], evenStops(3, [undefined, undefined, 'black']))

    // The two base colours stay where they were and `black` joins them, rather
    // than the three stops becoming the ramp: overriding one slice must not
    // repaint the others.
    expect(resolved.ramp).toEqual([
      { color: 'red', position: 0 },
      { color: 'black', position: 1 },
    ])
  })

  it('overrides a slice of a preset without squashing it into the stops', () => {
    // Two ticks covering the middle of a numeric axis, one of them coloured.
    const resolved = resolveGradient(undefined, [
      { position: 0.2, color: 'black' },
      { position: 0.8 },
    ])

    expect(resolved.ramp).toEqual([
      { color: '#ffc300', position: 0 },
      { color: 'black', position: 0.2 },
      { color: '#ff6bd6', position: 0.4 },
      { color: '#ff9d76', position: 0.6 },
      { color: '#51eaea', position: 0.8 },
      { color: '#fb3569', position: 1 },
    ])
  })

  it('lets an override win the coordinate it shares with a preset colour', () => {
    const resolved = resolveGradient(undefined, [
      { position: 0.4, color: 'black' },
      { position: 1 },
    ])

    expect(resolved.ramp?.map((stop) => stop.color)).toEqual([
      '#ffc300',
      '#ffb0fe',
      'black',
      '#ff9d76',
      '#51eaea',
      '#fb3569',
    ])
  })

  it('is the whole ramp when every stop carries a colour, at any number of stops', () => {
    const resolved = resolveGradient(undefined, evenStops(3, ['red', 'white', 'blue']))

    expect(resolved.css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), red 0%, white 50%, blue 100%)',
    )
  })

  it('is ignored by a raw CSS gradient, which we cannot take apart', () => {
    const raw = 'linear-gradient(to top, red, blue)'

    expect(resolveGradient(raw, evenStops(3, ['black'])).css).toBe(raw)
  })

  it('sorts the ramp, since a numeric axis takes its ticks in any order', () => {
    const stops = [
      { position: 1, color: 'blue' },
      { position: 0, color: 'red' },
    ]

    expect(resolveGradient(undefined, stops).css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), red 0%, blue 100%)',
    )
  })

  it('paints a flat track when a lone stop is the only colour there is', () => {
    expect(resolveGradient(undefined, [{ position: 0, color: 'red' }]).css).toBe(
      'linear-gradient(var(--ranger-gradient-direction, to right), red 0%, red 100%)',
    )
  })
})

describe('sampleRamp', () => {
  const ramp = [
    { color: 'red', position: 0 },
    { color: 'blue', position: 1 },
  ]

  it('returns a colour untouched where the position lands on it', () => {
    expect(sampleRamp(ramp, 0)).toBe('red')
    expect(sampleRamp(ramp, 1)).toBe('blue')
  })

  it('mixes between the two colours the position falls between', () => {
    expect(sampleRamp(ramp, 0.5)).toBe('color-mix(in oklab, red 50%, blue)')
    expect(sampleRamp(ramp, 0.25)).toBe('color-mix(in oklab, red 75%, blue)')
  })

  it('rounds the mix rather than emitting sixteen decimal places', () => {
    expect(sampleRamp(ramp, 1 / 3)).toBe('color-mix(in oklab, red 66.67%, blue)')
  })

  it('holds the end colours beyond the ends, the way a gradient does', () => {
    expect(sampleRamp(ramp, -1)).toBe('red')
    expect(sampleRamp(ramp, 2)).toBe('blue')
  })

  it('has one answer for a ramp of one colour, and none for a ramp of none', () => {
    expect(sampleRamp([{ color: 'red', position: 0 }], 0.5)).toBe('red')
    expect(sampleRamp([], 0.5)).toBeNull()
  })

  it('finds its pair among many, not just among two', () => {
    const long = gradients.mood.map((color, index) => ({ color, position: index / 5 }))

    expect(sampleRamp(long, 0.5)).toBe('color-mix(in oklab, #ff6bd6 50%, #ff9d76)')
  })

  it('takes the later colour where two stops share a position', () => {
    const hard = [
      { color: 'red', position: 0 },
      { color: 'blue', position: 0.5 },
      { color: 'green', position: 0.5 },
      { color: 'black', position: 1 },
    ]

    expect(sampleRamp(hard, 0.5)).toBe('green')
  })
})

describe('tintAt', () => {
  it('reads the ramp at the thumb, which on a stop is that stop own colour', () => {
    const resolved = resolveGradient(undefined, evenStops(6, predecessorRamp))

    expect(tintAt(resolved, 0.4)).toBe('#ff6bd6')
  })

  it('mixes between colours where there is no stop to be nearest to', () => {
    const resolved = resolveGradient(undefined, [])

    expect(tintAt(resolved, 0.5)).toBe('color-mix(in oklab, #ff6bd6 50%, #ff9d76)')
  })

  it('falls back to the colour the stop brought when the ramp is CSS we cannot read', () => {
    const resolved = resolveGradient('linear-gradient(to top, red, blue)', [])

    expect(tintAt(resolved, 0.5, 'rebeccapurple')).toBe('rebeccapurple')
    expect(tintAt(resolved, 0.5)).toBeUndefined()
  })

  it('falls back the same way for a ramp with no colour in it', () => {
    // `resolveGradient` never builds one, but the type allows it and the answer
    // should not depend on that staying true.
    expect(tintAt({ css: null, ramp: [], diagnostics: [] }, 0.5, 'red')).toBe('red')
  })
})
