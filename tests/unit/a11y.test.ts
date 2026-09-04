import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ranger } from '../../src/index'

/**
 * Spec §7 as the component renders it. What a reader is *told* is pinned in
 * `announce.test.ts`, where it is a pure function; this is the wiring — that
 * the engine carries it, that the engine is the only thing carrying anything,
 * and that a Ranger nobody named says so out loud in development.
 *
 * The keyboard, the focus ring and `axe-core` are in `tests/browser/a11y.test.ts`:
 * jsdom has no layout, no `:focus-visible` and no accessibility tree.
 */

const moods = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Expressionless' },
  { value: 'wow', label: 'Astonished' },
  { value: 'ugh', label: 'Confounded' },
  { value: 'okay', label: 'Okay?' },
  { value: 'blush', label: 'Blush' },
]

type Wrapper = ReturnType<typeof mount>

function engineOf(wrapper: Wrapper) {
  return wrapper.get('input[type="range"]').element as HTMLInputElement
}

/**
 * A module nobody has warned from yet: `warn` remembers what it has already
 * said, so a second Ranger with the same complaint is silent by design.
 */
async function freshRanger() {
  vi.resetModules()
  const { Ranger: fresh } = await import('../../src/index')
  return fresh
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('what a screen reader is told', () => {
  it('announces the answer on an ordinal axis', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'wow' } })

    expect(engineOf(wrapper).getAttribute('aria-valuetext')).toBe('Astonished, 3 of 6')
  })

  it('announces the label and the number on a numeric axis', () => {
    const wrapper = mount(Ranger, {
      props: { min: 0, max: 100, step: 5, modelValue: 100, stops: [{ at: 100, label: 'Hot' }] },
    })

    expect(engineOf(wrapper).getAttribute('aria-valuetext')).toBe('Hot, 100')
  })

  it('announces no selection while unset, on either axis', () => {
    const ordinal = mount(Ranger, { props: { stops: moods, modelValue: null } })
    const numeric = mount(Ranger, { props: { min: 0, max: 100, modelValue: null } })

    expect(engineOf(ordinal).getAttribute('aria-valuetext')).toBe('No selection')
    expect(engineOf(numeric).getAttribute('aria-valuetext')).toBe('No selection')
  })

  it('still announces the value while disabled and while readonly', () => {
    // A disabled control is still read out; a readonly one is still reached.
    // Neither may go quiet just because it cannot be changed.
    const disabled = mount(Ranger, { props: { stops: moods, modelValue: 'meh', disabled: true } })
    const readonly = mount(Ranger, { props: { stops: moods, modelValue: 'meh', readonly: true } })

    expect(engineOf(disabled).getAttribute('aria-valuetext')).toBe('Expressionless, 2 of 6')
    expect(engineOf(readonly).getAttribute('aria-valuetext')).toBe('Expressionless, 2 of 6')
  })

  it('says a stop is unavailable rather than leaving it to opacity', () => {
    const wrapper = mount(Ranger, {
      props: {
        stops: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C' },
        ],
        modelValue: 'b',
      },
    })

    expect(engineOf(wrapper).getAttribute('aria-valuetext')).toBe('B, unavailable, 2 of 3')
  })

  it('follows the value as it moves', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await wrapper.setProps({ modelValue: 'blush' })

    expect(engineOf(wrapper).getAttribute('aria-valuetext')).toBe('Blush, 6 of 6')
  })

  it('leaves the min, max and now to the engine, which already reports them', () => {
    // A range input has role `slider`, so a browser reports `min`, `max` and
    // `value` as aria-valuemin/max/now on its own. Restating them would be a
    // second place for them to be wrong (ADR-0001).
    //
    // What this pins is our half — that the engine carries the right three
    // numbers on both axes, and that nothing overwrites the browser's mapping.
    // The mapping itself is the platform's, and `axe-core` reads the real
    // accessibility tree over all five examples in the browser suite.
    const ordinal = engineOf(mount(Ranger, { props: { stops: moods, modelValue: 'wow' } }))
    const numeric = engineOf(
      mount(Ranger, { props: { min: 20, max: 80, step: 5, modelValue: 45 } }),
    )

    expect([ordinal.min, ordinal.max, ordinal.value]).toEqual(['0', '5', '2'])
    expect([numeric.min, numeric.max, numeric.value]).toEqual(['20', '80', '45'])

    for (const engine of [ordinal, numeric]) {
      expect(engine.getAttribute('aria-valuenow')).toBeNull()
      expect(engine.getAttribute('aria-valuemin')).toBeNull()
      expect(engine.getAttribute('aria-valuemax')).toBeNull()
    }
  })
})

describe('the accessible name', () => {
  /** Whether the module complained about a name, whatever else it said. */
  function warnedAboutName() {
    const warn = vi.mocked(console.warn)
    return warn.mock.calls.some(([message]) => String(message).includes('no-accessible-name'))
  }

  it('warns in development when a Ranger has none', async () => {
    const fresh = await freshRanger()

    mount(fresh, { props: { stops: moods } })

    // The one accessibility failure the engine cannot fix for us: the name has
    // to come from outside, and silence would ship a control announced as
    // "slider" and nothing else.
    expect(warnedAboutName()).toBe(true)
  })

  it('is satisfied by aria-label', async () => {
    const fresh = await freshRanger()

    mount(fresh, { props: { stops: moods }, attrs: { 'aria-label': 'Mood' } })

    expect(warnedAboutName()).toBe(false)
  })

  it('is satisfied by aria-labelledby', async () => {
    const fresh = await freshRanger()

    mount(fresh, { props: { stops: moods }, attrs: { 'aria-labelledby': 'heading' } })

    expect(warnedAboutName()).toBe(false)
  })

  it('is satisfied by a wrapping label', async () => {
    const fresh = await freshRanger()
    const label = document.createElement('label')
    label.append(document.createTextNode('Mood'))
    document.body.append(label)

    const wrapper = mount(fresh, { props: { stops: moods }, attachTo: label })

    expect(warnedAboutName()).toBe(false)

    wrapper.unmount()
    label.remove()
  })

  it('reaches the engine rather than a stop block', async () => {
    const fresh = await freshRanger()
    const label = document.createElement('label')
    document.body.append(label)

    const wrapper = mount(fresh, { props: { stops: moods }, attachTo: label })

    // A `<label>` names its first labelable descendant, and a stop block is a
    // `<button>` — which is labelable. The engine is written first in the tree
    // for exactly this reason; drawn second, but named first.
    expect(label.control).toBe(engineOf(wrapper as Wrapper))

    wrapper.unmount()
    label.remove()
  })

  it('is not satisfied by an empty one', async () => {
    const fresh = await freshRanger()

    mount(fresh, { props: { stops: moods }, attrs: { 'aria-label': '  ' } })

    expect(warnedAboutName()).toBe(true)
  })
})
