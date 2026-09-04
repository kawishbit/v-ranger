import { describe, expect, it } from 'vitest'
import { valueText } from '../../src/announce'
import { resolve, resolveAxis, type Axis, type Resolved } from '../../src/axis'

/**
 * What a screen reader is told, as a string. Spec §7 is a hard requirement and
 * this is the whole of its text, so it is tested where text is cheapest to
 * assert: away from the DOM, over the real axis and the real resolution.
 */

const moods = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Expressionless' },
  { value: 'wow', label: 'Astonished' },
  { value: 'ugh', label: 'Confounded' },
  { value: 'okay', label: 'Okay?' },
  { value: 'blush', label: 'Blush' },
]

/** The engine's own number, which the component reads off `positionToEngine`. */
function speak<V>(axis: Axis<V>, value: V | null, engineValue = 0) {
  return valueText(axis, resolve(axis, value), engineValue)
}

describe('an ordinal axis', () => {
  const axis = resolveAxis({ stops: moods })

  it('reads the label and the place on the scale', () => {
    // Spec §7's own example, word for word.
    expect(speak(axis, 'wow')).toBe('Astonished, 3 of 6')
  })

  it('counts from one, the way a person does', () => {
    expect(speak(axis, 'angry')).toBe('Angry, 1 of 6')
    expect(speak(axis, 'blush')).toBe('Blush, 6 of 6')
  })

  it('falls back to the value where a stop carries no label', () => {
    const unlabelled = resolveAxis({ stops: [{ value: 'sm' }, { value: 'lg' }] })

    expect(speak(unlabelled, 'lg')).toBe('lg, 2 of 2')
  })

  it('says a disabled stop is unavailable, rather than leaving it to opacity', () => {
    // The one moment the reader can be on a stop they cannot choose: a
    // consumer set the value there. Every other route already skips it.
    const gapped = resolveAxis({
      stops: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ],
    })

    expect(speak(gapped, 'b')).toBe('B, unavailable, 2 of 2')
  })

  it('says so explicitly when nothing has been chosen', () => {
    // Never the first stop's name: a reader who cannot see the thumb would
    // take that for the answer, which is the whole of ADR-0003.
    expect(speak(axis, null)).toBe('No selection')
  })

  it('reads a value that matches no stop as no selection', () => {
    expect(speak(axis, 'nonsense' as unknown as string)).toBe('No selection')
  })
})

describe('a numeric axis', () => {
  const axis = resolveAxis({
    min: 0,
    max: 100,
    step: 5,
    stops: [
      { at: 0, label: 'Cold' },
      { at: 100, label: 'Hot' },
    ],
  })

  it('reads the tick label and the number where the value is on a tick', () => {
    expect(speak(axis, 100, 100)).toBe('Hot, 100')
  })

  it('reads the number alone between ticks', () => {
    // "Cold, 45" would be a lie: the nearest tick is not the answer here.
    expect(speak(axis, 45, 45)).toBe('45')
  })

  it('reads the number alone where a tick carries no label', () => {
    const bare = resolveAxis({ min: 0, max: 10, stops: [{ at: 5 }] })

    expect(speak(bare, 5, 5)).toBe('5')
  })

  it('reads the engine number rather than an off-grid model value', () => {
    // 43 is not a value a step-5 input can hold, so 45 is what the control
    // holds and 45 is what a reader is told (ADR-0001).
    expect(speak(axis, 43, 45)).toBe('45')
  })

  it('says so explicitly when nothing has been chosen', () => {
    expect(speak(axis, null)).toBe('No selection')
  })
})

describe('a resolution with no stop behind it', () => {
  // The component cannot produce this — on an ordinal axis "no stop" is
  // exactly what `unset` means — but the function is total, and a reader
  // should get the place on the scale rather than a stray comma.
  const axis = resolveAxis({ stops: moods })

  function stopless(overrides: Partial<Resolved<string>> = {}): Resolved<string> {
    return {
      value: null,
      stop: null,
      index: 0,
      position: 0,
      unset: false,
      nearest: null,
      diagnostics: [],
      ...overrides,
    }
  }

  it('still says where on the scale it is', () => {
    expect(valueText(axis, stopless(), 0)).toBe('1 of 6')
  })

  it('drops an empty label rather than announcing a leading comma', () => {
    expect(valueText(axis, stopless({ stop: { value: 'angry', label: '' } }), 0)).toBe('1 of 6')
  })
})
