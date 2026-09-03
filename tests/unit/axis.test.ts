import { describe, expect, it, vi } from 'vitest'
import {
  engineRange,
  engineToPosition,
  isEmptyAxis,
  placeStops,
  positionToEngine,
  positionToValue,
  resolve,
  resolveAxis,
} from '../../src/axis'

const moods = ['angry', 'meh', 'wow', 'ugh', 'okay', 'blush'].map((value) => ({ value }))

describe('resolveAxis', () => {
  it('infers an ordinal axis from stops alone', () => {
    const axis = resolveAxis({ stops: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] })

    expect(axis.kind).toBe('ordinal')
    expect(axis.stops).toHaveLength(3)
    expect(axis.diagnostics).toEqual([])
  })
})

describe('resolve, ordinal axis', () => {
  it('spaces six stops evenly from 0 to 1', () => {
    const axis = resolveAxis({ stops: moods })

    const positions = moods.map((stop) => resolve(axis, stop.value).position)

    expect(positions).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })
})

describe('resolve, edge cases', () => {
  it('puts a single stop at the start rather than dividing by zero', () => {
    const axis = resolveAxis({ stops: [{ value: 'only' }] })

    expect(resolve(axis, 'only').position).toBe(0)
  })
})

describe('resolve, the unset value', () => {
  it('never invents a selection, and stays distinguishable from the first stop', () => {
    const axis = resolveAxis({ stops: moods })

    const unset = resolve(axis, null)
    expect(unset.value).toBeNull()
    expect(unset.stop).toBeNull()
    expect(unset.index).toBe(-1)
    expect(unset.unset).toBe(true)

    // vlider handed null to a native input, which parked the thumb at the
    // midpoint: an unanswered question that looked answered (ADR-0003).
    expect(unset.position).toBe(0)

    // Unset and "first stop chosen" share a position, so the position alone
    // cannot tell them apart. Something else has to.
    const first = resolve(axis, 'angry')
    expect(first.position).toBe(0)
    expect(first.unset).toBe(false)
    expect(first.index).toBe(0)
    expect(first.stop).toEqual({ value: 'angry' })
  })

  it('treats a value matching no stop as unset, keeps the value, and complains', () => {
    const axis = resolveAxis({ stops: moods })

    const stray = resolve(axis, 'nonexistent')

    expect(stray.unset).toBe(true)
    expect(stray.index).toBe(-1)
    expect(stray.stop).toBeNull()
    // The consumer's value is theirs; we render unset rather than guessing,
    // but we do not silently rewrite what they passed (ADR-0003).
    expect(stray.value).toBe('nonexistent')
    expect(stray.diagnostics).toEqual([{ code: 'value-not-in-stops' }])
  })
})

describe('positionToValue, ordinal axis', () => {
  it('snaps a position to the nearest stop', () => {
    // Six stops sit at 0, .2, .4, .6, .8, 1 — so the boundaries are the
    // midpoints .1, .3, .5, .7, .9.
    const axis = resolveAxis({ stops: moods })

    expect(positionToValue(axis, 0)).toBe('angry')
    expect(positionToValue(axis, 0.09)).toBe('angry')
    expect(positionToValue(axis, 0.11)).toBe('meh')
    expect(positionToValue(axis, 0.43)).toBe('wow')
    expect(positionToValue(axis, 1)).toBe('blush')
  })
})

describe('positionToValue, disabled stops', () => {
  // Three stops at 0, .5, 1 with the middle one disabled.
  const gapped = [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }]

  it('skips a disabled stop in the direction of travel', () => {
    const axis = resolveAxis({ stops: gapped })

    expect(positionToValue(axis, 0.5, 'a')).toBe('c')
    expect(positionToValue(axis, 0.5, 'c')).toBe('a')
  })

  it('falls back to the nearest enabled stop when there is no previous value', () => {
    const axis = resolveAxis({ stops: gapped })

    // No previous value means no direction of travel, so "nearest" is the only
    // sensible reading: .4 is closer to a (0) than to c (1).
    expect(positionToValue(axis, 0.4, null)).toBe('a')
    expect(positionToValue(axis, 0.6, null)).toBe('c')
  })

  it('does not move when nothing enabled lies in that direction', () => {
    const axis = resolveAxis({
      stops: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c', disabled: true }],
    })

    expect(positionToValue(axis, 0.5, 'a')).toBe('a')
    expect(positionToValue(axis, 1, 'a')).toBe('a')
  })
})

describe('resolveAxis, numeric axis', () => {
  it('infers a numeric axis from min and max', () => {
    const axis = resolveAxis({ min: 0, max: 100, step: 5 })

    expect(axis.kind).toBe('numeric')
    expect(axis.diagnostics).toEqual([])
  })
})

describe('positionToValue, numeric axis', () => {
  const axis = resolveAxis({ min: 0, max: 100, step: 5 })

  it('snaps a drag to the step', () => {
    // 0.43 across 0..100 is 43; the nearest multiple of 5 is 45.
    expect(positionToValue(axis, 0.43)).toBe(45)
  })

  it('clamps a position that runs past either end', () => {
    expect(positionToValue(axis, -0.5)).toBe(0)
    expect(positionToValue(axis, 1.5)).toBe(100)
  })
})

describe('resolve, numeric axis', () => {
  const ticks = [
    { at: 0, label: 'Cold' },
    { at: 100, label: 'Hot' },
  ]
  const axis = resolveAxis({ min: 0, max: 100, step: 5, stops: ticks })

  it('positions a value across the range', () => {
    expect(resolve(axis, 0).position).toBe(0)
    expect(resolve(axis, 45).position).toBe(0.45)
    expect(resolve(axis, 100).position).toBe(1)
  })

  it('is not unset just because the value falls between pinned ticks', () => {
    const between = resolve(axis, 45)

    expect(between.unset).toBe(false)
    expect(between.value).toBe(45)
    expect(between.stop).toBeNull()
    expect(between.index).toBe(-1)
    expect(between.diagnostics).toEqual([])

    // Something still has to drive the thumb tint and aria-valuetext: 45 is
    // nearer Cold (0) than Hot (100).
    expect(between.nearest).toEqual({ stop: ticks[0], index: 0 })
  })
})

describe('resolveAxis diagnostics', () => {
  it('drops numeric stops that are not pinned, and says which', () => {
    const axis = resolveAxis({
      min: 0,
      max: 100,
      stops: [{ at: 0 }, { label: 'floating' }, { at: 100 }],
    })

    expect(axis.stops).toHaveLength(2)
    expect(axis.diagnostics).toEqual([{ code: 'numeric-stop-without-at', index: 1 }])
  })

  it('flags a tick pinned outside the range without dropping it', () => {
    const axis = resolveAxis({ min: 0, max: 100, stops: [{ at: -10 }, { at: 50 }, { at: 250 }] })

    expect(axis.stops).toHaveLength(3)
    expect(axis.diagnostics).toEqual([
      { code: 'stop-outside-range', index: 0 },
      { code: 'stop-outside-range', index: 2 },
    ])
  })

  it('flags duplicate stop values, which make value lookup ambiguous', () => {
    const axis = resolveAxis({ stops: [{ value: 'a' }, { value: 'b' }, { value: 'a' }] })

    expect(axis.diagnostics).toEqual([{ code: 'duplicate-stop-value', index: 2 }])
  })

  it('flags an axis with neither stops nor a range', () => {
    const axis = resolveAxis({})

    expect(axis.kind).toBe('ordinal')
    expect(axis.stops).toEqual([])
    expect(axis.diagnostics).toEqual([{ code: 'no-axis' }])
  })

  it('flags stops pinned with `at` when there is no range to pin them to', () => {
    const axis = resolveAxis({ stops: [{ value: 'a', at: 0 }, { value: 'b' }] })

    expect(axis.kind).toBe('ordinal')
    expect(axis.diagnostics).toEqual([{ code: 'ordinal-stop-with-at', index: 0 }])
  })
})

describe('warn', () => {
  it('prints each distinct complaint once, however often it is handed the same one', async () => {
    // A fresh module, so the "already said that" memory starts empty.
    vi.resetModules()
    const { warn } = await import('../../src/axis')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warn([{ code: 'no-axis' }])
    warn([{ code: 'no-axis' }])
    warn([{ code: 'duplicate-stop-value', index: 2 }])
    warn([])

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]?.[0]).toContain('no-axis')
    expect(spy.mock.calls[1]?.[0]).toContain('duplicate-stop-value')

    spy.mockRestore()
  })
})

describe('axes that are barely axes', () => {
  it('fills in the other end when only one of min/max is given', () => {
    expect(resolveAxis({ min: 10 })).toMatchObject({ kind: 'numeric', min: 10, max: 100 })
    expect(resolveAxis({ max: 7 })).toMatchObject({ kind: 'numeric', min: 0, max: 7 })

    // Filling the other end in is a guess, and a guess is worth complaining about.
    expect(resolveAxis({ min: 10 }).diagnostics).toEqual([{ code: 'incomplete-range' }])
  })

  it('treats a zero-width range as a single point', () => {
    const axis = resolveAxis({ min: 5, max: 5, stops: [{ at: 5 }] })

    expect(resolve(axis, 5).position).toBe(0)
    expect(resolve(axis, 5).nearest).toEqual({ stop: { at: 5 }, index: 0 })
    expect(positionToValue(axis, 0.7)).toBe(5)
  })

  it('is unset on a numeric axis when the value is null', () => {
    const axis = resolveAxis({ min: 0, max: 100 })
    const unset = resolve(axis, null)

    expect(unset.unset).toBe(true)
    expect(unset.position).toBe(0)
    expect(unset.stop).toBeNull()
    expect(unset.index).toBe(-1)
  })

  it('leaves the value alone on an ordinal axis with no stops', () => {
    const axis = resolveAxis({ stops: [] })

    expect(positionToValue(axis, 0.5, 'kept')).toBe('kept')
  })

  it('resolves a stop carrying no value to null', () => {
    const axis = resolveAxis({ stops: [{ label: 'unnamed' }] })

    expect(positionToValue(axis, 0)).toBeNull()
  })

  it('does not move when every stop is disabled and there is no previous value', () => {
    const axis = resolveAxis({
      stops: [
        { value: 'a', disabled: true },
        { value: 'b', disabled: true },
      ],
    })

    expect(positionToValue(axis, 0.5, null)).toBeNull()
  })
})

describe('review findings', () => {
  it('cannot reach a max that is off the step grid, exactly as a native input cannot', () => {
    // Valid values are 0, 4, 8 - so dragging to the far end gives 8, not 10.
    const axis = resolveAxis({ min: 0, max: 10, step: 4 })

    expect(positionToValue(axis, 1)).toBe(8)
    expect(positionToValue(axis, 0.5)).toBe(4)
  })

  it('reports no nearest stop while unset, so nothing is tinted or announced', () => {
    const axis = resolveAxis({ stops: moods })

    // Unset sits at position 0, where the first stop also sits. Handing back a
    // nearest stop here would let the thumb tint and aria-valuetext present
    // "Angry" as the answer to a question nobody answered (ADR-0003).
    expect(resolve(axis, null).nearest).toBeNull()
    expect(resolve(axis, 'nonexistent').nearest).toBeNull()

    expect(resolve(axis, 'angry').nearest).toEqual({ stop: { value: 'angry' }, index: 0 })
  })

  it('does not skip over an enabled stop lying between here and the disabled one', () => {
    // Four stops at 0, 1/3, 2/3, 1 with the third disabled.
    const axis = resolveAxis({
      stops: [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }, { value: 'd' }],
    })

    // A drag from a to 0.6 lands nearest c. Both b and d lie forward of a, and
    // b (distance .27) is nearer than d (distance .4).
    expect(positionToValue(axis, 0.6, 'a')).toBe('b')
  })

  it('flags a numeric value outside the range instead of silently rewriting it', () => {
    const axis = resolveAxis({ min: 0, max: 100 })
    const over = resolve(axis, 150)

    expect(over.value).toBe(150)
    expect(over.position).toBe(1)
    expect(over.diagnostics).toEqual([{ code: 'value-out-of-range' }])
  })

  it('flags a step that cannot divide anything', () => {
    const axis = resolveAxis({ min: 0, max: 10, step: 0 })

    expect(axis).toMatchObject({ step: 1 })
    expect(axis.diagnostics).toContainEqual({ code: 'invalid-step' })
    expect(positionToValue(axis, 0.5)).toBe(5)
  })

  it('flags an ordinal stop with no value, which v-model could never carry', () => {
    const axis = resolveAxis({ stops: [{ value: 'a' }, { label: 'nameless' }] })

    expect(axis.diagnostics).toEqual([{ code: 'ordinal-stop-without-value', index: 1 }])
  })
})

describe('the engine coordinate space', () => {
  // The interaction engine is a native range input, so it can only hold
  // numbers. These are the two functions that let the component drive it
  // without ever asking which kind of axis it has (ADR-0001).

  it('counts stops on an ordinal axis, so one arrow key is exactly one stop', () => {
    expect(engineRange(resolveAxis({ stops: moods }))).toEqual({ min: 0, max: 5, step: 1 })
  })

  it('is the range itself on a numeric axis', () => {
    expect(engineRange(resolveAxis({ min: 20, max: 80, step: 4 }))).toEqual({
      min: 20,
      max: 80,
      step: 4,
    })
  })

  it('collapses to a single point when there is nowhere to travel', () => {
    expect(engineRange(resolveAxis({ stops: [{ value: 'only' }] }))).toEqual({
      min: 0,
      max: 0,
      step: 1,
    })
    expect(engineRange(resolveAxis({ stops: [] }))).toEqual({ min: 0, max: 0, step: 1 })
  })

  it('round-trips every stop position through the engine unchanged', () => {
    const axis = resolveAxis({ stops: moods })

    for (const stop of moods) {
      const position = resolve(axis, stop.value).position
      expect(engineToPosition(axis, positionToEngine(axis, position))).toBe(position)
    }
  })

  it('lands an ordinal position on a whole stop index', () => {
    const axis = resolveAxis({ stops: moods })

    expect(positionToEngine(axis, 0)).toBe(0)
    expect(positionToEngine(axis, 0.43)).toBe(2)
    expect(positionToEngine(axis, 1)).toBe(5)
  })

  it('snaps an off-grid numeric value onto the engine grid', () => {
    const axis = resolveAxis({ min: 0, max: 100, step: 5 })

    // A step-5 input cannot hold 43; the browser's own value sanitiser would
    // move it to 45. The presentation layer follows the engine rather than
    // disagreeing with it (ADR-0001).
    expect(positionToEngine(axis, resolve(axis, 43).position)).toBe(45)
  })

  it('cannot put the engine past the last whole step, exactly as the browser cannot', () => {
    const axis = resolveAxis({ min: 0, max: 10, step: 4 })

    expect(positionToEngine(axis, 1)).toBe(8)
  })

  it('clamps a position or an engine value that runs past either end', () => {
    const axis = resolveAxis({ min: 0, max: 100, step: 5 })

    expect(positionToEngine(axis, -1)).toBe(0)
    expect(positionToEngine(axis, 2)).toBe(100)
    expect(engineToPosition(axis, -50)).toBe(0)
    expect(engineToPosition(axis, 500)).toBe(1)
  })

  it('reads a zero-width engine range as the start rather than dividing by zero', () => {
    expect(engineToPosition(resolveAxis({ stops: [{ value: 'only' }] }), 0)).toBe(0)
  })
})

describe('placeStops', () => {
  it('hands back every ordinal stop with the position it occupies', () => {
    const axis = resolveAxis({ stops: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] })

    expect(placeStops(axis)).toEqual([
      { stop: { value: 'a' }, index: 0, position: 0 },
      { stop: { value: 'b' }, index: 1, position: 0.5 },
      { stop: { value: 'c' }, index: 2, position: 1 },
    ])
  })

  it('places a numeric tick where its `at` falls in the range', () => {
    const axis = resolveAxis({ min: 0, max: 200, stops: [{ at: 50 }] })

    expect(placeStops(axis)).toEqual([{ stop: { at: 50 }, index: 0, position: 0.25 }])
  })
})

describe('isEmptyAxis', () => {
  it('is true only when there is nothing at all to choose from', () => {
    expect(isEmptyAxis(resolveAxis({}))).toBe(true)
    expect(isEmptyAxis(resolveAxis({ stops: [] }))).toBe(true)
    expect(isEmptyAxis(resolveAxis({ stops: moods }))).toBe(false)

    // A numeric axis spans a range whether or not anyone pinned a tick to it.
    expect(isEmptyAxis(resolveAxis({ min: 0, max: 10 }))).toBe(false)
  })
})

describe('a numeric value the engine could never hold', () => {
  const axis = resolveAxis({ min: 0, max: 100, step: 5 })

  it('is reported rather than rewritten', () => {
    const off = resolve(axis, 43)

    // The value stays the consumer's. Issue 03 settled that the component does
    // not correct it either, because emitting a correction would be emitting on
    // a prop change (ADR-0003) - so the complaint is the only way to find out.
    expect(off.value).toBe(43)
    expect(off.diagnostics).toEqual([{ code: 'value-off-step' }])
  })

  it('says nothing about a value that is on the grid', () => {
    expect(resolve(axis, 45).diagnostics).toEqual([])
  })

  it('complains only once about a value that is both off-grid and out of range', () => {
    expect(resolve(axis, 143).diagnostics).toEqual([{ code: 'value-out-of-range' }])
  })
})

describe('narrowing the axis', () => {
  it('promises a number once the axis is known to be numeric', () => {
    const axis = resolveAxis({ min: 0, max: 100, step: 5 })
    if (axis.kind !== 'numeric') throw new Error('expected a numeric axis')

    // The annotation is the assertion: before the overload this needed a cast,
    // because the generic could not know a numeric axis carries numbers.
    const value: number = positionToValue(axis, 0.43)

    expect(value).toBe(45)
  })
})
