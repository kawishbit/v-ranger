import { mount } from '@vue/test-utils'
import { cdp, userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { drag } from './mouse'

/**
 * Real Chromium, because these are the claims jsdom cannot check: that the
 * invisible engine is still focusable and still gets the platform's own
 * keyboard behaviour, and that the visible thumb actually moves when it does.
 * The full drag, touch and click-to-jump matrix is issue 09's.
 */

const moods = ['angry', 'meh', 'wow', 'ugh', 'okay', 'blush'].map((value) => ({ value }))

let wrapper: ReturnType<typeof mount> | null = null

function mountRanger(props: Record<string, unknown>) {
  wrapper = mount(Ranger, { props, attachTo: document.body })
  return wrapper
}

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown>) {
  return mountRanger({
    ...props,
    'onUpdate:modelValue': (value: unknown) => void wrapper?.setProps({ modelValue: value }),
  })
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

/** Where the thumb actually is, in the page, in real pixels. */
function thumbCentre(root: Element) {
  const box = root.querySelector('.ranger__thumb')!.getBoundingClientRect()
  return box.x + box.width / 2
}

/**
 * Past the `--_transition` default of `160ms` (issue 17): every non-drag move
 * now glides there instead of landing instantly, so a claim about where the
 * thumb *ends up* has to wait for the glide to finish first.
 */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200))
}

/**
 * Where a position should land in pixels. The travel is inset by half a thumb
 * at each end, the same mapping a native range input uses, so the visible thumb
 * stays with the pointer instead of running ahead of it at the extremes.
 */
function expectedCentre(root: Element, position: number) {
  const track = root.querySelector('.ranger__control')!.getBoundingClientRect()
  const thumb = root.querySelector('.ranger__thumb')!.getBoundingClientRect()

  return track.x + thumb.width / 2 + position * (track.width - thumb.width)
}

describe('the engine in a real browser', () => {
  it('is invisible but still focusable', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const engine = ranger.get('input[type="range"]').element as HTMLInputElement

    expect(getComputedStyle(engine).opacity).toBe('0')
    expect(getComputedStyle(engine).display).not.toBe('none')
    expect(getComputedStyle(engine).visibility).not.toBe('hidden')

    engine.focus()
    expect(document.activeElement).toBe(engine)
  })

  it('covers the track, so a pointer anywhere on it reaches the engine', () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const engine = ranger.get('input[type="range"]').element.getBoundingClientRect()
    const control = ranger.get('.ranger__control').element.getBoundingClientRect()

    expect(engine.width).toBeGreaterThan(0)
    expect(engine.width).toBeCloseTo(control.width, 0)
    expect(engine.height).toBeCloseTo(control.height, 0)
  })

  it('moves the visible thumb when the platform moves the engine', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const engine = ranger.get('input[type="range"]').element as HTMLInputElement

    const before = thumbCentre(ranger.element)

    engine.focus()
    await userEvent.keyboard('{ArrowRight}')
    await ranger.setProps({ modelValue: 'meh' })
    await settle()

    // Nothing here told the thumb to move: the engine moved, the value it
    // emitted came back as a prop, and the presentation layer followed.
    expect(engine.value).toBe('1')
    expect(ranger.emitted('update:modelValue')).toEqual([['meh']])
    expect(thumbCentre(ranger.element)).toBeGreaterThan(before)
  })

  it('puts the thumb where the axis says, measured in pixels', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })

    for (const [index, stop] of moods.entries()) {
      await ranger.setProps({ modelValue: stop.value })
      await settle()

      const position = index / (moods.length - 1)
      expect(thumbCentre(ranger.element)).toBeCloseTo(expectedCentre(ranger.element, position), 0)
    }
  })

  it('lands the thumb near the pointer, not half a thumb away from it', async () => {
    // The native input maps a value to an x with the travel inset by half its
    // own thumb. Painting the presentation thumb edge to edge instead puts it
    // up to a whole thumb width from the pointer at the ends; this pins that.
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const box = ranger.get('input[type="range"]').element.getBoundingClientRect()
    const y = box.y + box.height / 2

    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      const x = box.x + Math.min(Math.max(fraction * box.width, 1), box.width - 1)

      await drag({ x, y }, { x, y })
      await nextTick()

      expect(Math.abs(thumbCentre(ranger.element) - x)).toBeLessThan(
        ranger.get('.ranger__control').element.getBoundingClientRect().width / moods.length,
      )
    }
  })

  it('draws a focus ring on the thumb, since the engine itself is invisible', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const thumb = ranger.get('.ranger__thumb').element

    expect(getComputedStyle(thumb).outlineStyle).toBe('none')

    // Tabbed, not focused programmatically: `:focus-visible` is about how the
    // focus was reached, and a keyboard user is exactly who needs the ring.
    await userEvent.tab()

    expect(document.activeElement).toBe(ranger.get('input[type="range"]').element)
    expect(getComputedStyle(thumb).outlineStyle).toBe('solid')
    expect(getComputedStyle(thumb).outlineWidth).not.toBe('0px')
  })

  it('follows a real drag, and never lets the two disagree about where it ended', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const engine = ranger.get('input[type="range"]').element as HTMLInputElement
    const box = engine.getBoundingClientRect()
    const y = box.y + box.height / 2

    await drag({ x: box.x + 2, y }, { x: box.x + box.width - 2, y })
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')
    expect(ranger.emitted('change')).toHaveLength(1)
    expect(ranger.emitted('change')?.[0]?.[0]).toMatchObject({ value: 'blush', index: 5 })

    // Engine and thumb landed in the same place as the value they reported.
    expect(engine.value).toBe('5')
    expect(thumbCentre(ranger.element)).toBeCloseTo(expectedCentre(ranger.element, 1), 0)
  })

  it('refuses a drag onto a disabled stop and puts the engine back', async () => {
    const ranger = mountBound({
      stops: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c', disabled: true }],
      modelValue: 'a',
    })
    const engine = ranger.get('input[type="range"]').element as HTMLInputElement
    const box = engine.getBoundingClientRect()
    const y = box.y + box.height / 2

    await drag({ x: box.x + 2, y }, { x: box.x + box.width - 2, y })
    await nextTick()

    // Nothing enabled lies that way, so the value does not move - and the
    // engine is not left sitting where the pointer left it.
    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(engine.value).toBe('0')
    expect(thumbCentre(ranger.element)).toBeCloseTo(expectedCentre(ranger.element, 0), 0)
  })

  it('marks the root as dragging only while the pointer is down', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const box = ranger.get('input[type="range"]').element.getBoundingClientRect()
    const y = box.y + box.height / 2

    await drag({ x: box.x + 2, y }, { x: box.x + box.width / 2, y })

    expect(ranger.attributes('data-dragging')).toBeUndefined()
  })

  it('keeps an unset thumb at the start rather than the midpoint (ADR-0003)', () => {
    const ranger = mountRanger({ stops: moods, modelValue: null })

    expect(thumbCentre(ranger.element)).toBeCloseTo(expectedCentre(ranger.element, 0), 0)
  })
})

/**
 * Colour is the one part of the component a unit test can only half check: the
 * values the component writes are assertable in jsdom, but whether a browser
 * paints a ramp from them, flips it under RTL, and interpolates the thumb
 * between stops is only knowable here.
 */
describe('colour in a real browser', () => {
  const predecessorRamp = ['#ffc300', '#ffb0fe', '#ff6bd6', '#ff9d76', '#51eaea', '#fb3569']

  /** How a computed style spells a hex colour back at you. */
  function rgb(hex: string) {
    const channels = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
    return `rgb(${channels.join(', ')})`
  }

  /** Mounts inside an ancestor with a writing direction, the way a page does. */
  function mountIn(direction: 'ltr' | 'rtl', props: Record<string, unknown>) {
    const host = document.createElement('div')
    host.setAttribute('dir', direction)
    document.body.append(host)
    hosts.push(host)

    wrapper = mount(Ranger, { props, attachTo: host })
    return wrapper
  }

  let hosts: HTMLElement[] = []

  afterEach(() => {
    for (const host of hosts) host.remove()
    hosts = []
  })

  function trackRamp(root: Element) {
    return getComputedStyle(root.querySelector('.ranger__track')!).backgroundImage
  }

  it('paints the six-stop mood ramp with no colour configured at all', () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'angry' })
    const ramp = trackRamp(ranger.element)

    expect(ramp).toContain('linear-gradient(to right')

    // In order, and only these: the ramp the original predecessor demo shipped.
    const painted = [...ramp.matchAll(/rgb\([^)]*\)/g)].map(([match]) => match)
    expect(painted).toEqual(predecessorRamp.map(rgb))
  })

  it('runs the ramp and the fill the other way under an RTL ancestor', () => {
    const ranger = mountIn('rtl', { stops: moods, modelValue: 'wow' })

    expect(trackRamp(ranger.element)).toContain('linear-gradient(to left')

    const track = ranger.get('.ranger__track').element.getBoundingClientRect()
    const fill = ranger.get('.ranger__fill').element.getBoundingClientRect()

    // The travelled part grows from the inline start, which is the right-hand
    // edge here - and it is 40% of the track either way.
    expect(fill.right).toBeCloseTo(track.right, 0)
    expect(fill.width).toBeCloseTo(track.width * 0.4, 0)
  })

  it('grows the fill from the left again when the direction is left to right', () => {
    const ranger = mountIn('ltr', { stops: moods, modelValue: 'wow' })
    const track = ranger.get('.ranger__track').element.getBoundingClientRect()
    const fill = ranger.get('.ranger__fill').element.getBoundingClientRect()

    expect(trackRamp(ranger.element)).toContain('linear-gradient(to right')
    expect(fill.left).toBeCloseTo(track.left, 0)
  })

  it('tints the thumb to the stop it is on', () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'wow' })

    expect(getComputedStyle(ranger.get('.ranger__thumb').element).backgroundColor).toBe(
      rgb('#ff6bd6'),
    )
  })

  it('travels to the next stop colour rather than snapping to it', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'wow' })
    const thumb = ranger.get('.ranger__thumb').element

    // Read before the change, so the browser has a colour to travel *from*: a
    // value it never computed cannot be the start of a transition.
    expect(getComputedStyle(thumb).backgroundColor).toBe(rgb('#ff6bd6'))

    // Waited for rather than sampled mid-flight, which would be a race against
    // a 160ms clock. The predecessor could not travel at all: a pseudo-element thumb is
    // not reliably animatable, which is half of ADR-0001.
    const travelled = new Promise((resolve) =>
      thumb.addEventListener('transitionstart', resolve, { once: true }),
    )

    await ranger.setProps({ modelValue: 'blush' })
    await travelled

    await expect.poll(() => getComputedStyle(thumb).backgroundColor).toBe(rgb('#fb3569'))
  })

  it('retints when the engine moves, not just when a parent rewrites the value', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'wow' })
    const thumb = ranger.get('.ranger__thumb').element

    expect(getComputedStyle(thumb).backgroundColor).toBe(rgb('#ff6bd6'))

    // The platform's own arrow key, through the engine, the way a reader moves
    // it - `setProps` proves the binding but never proves the interaction.
    ;(ranger.get('input[type="range"]').element as HTMLInputElement).focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.poll(() => getComputedStyle(thumb).backgroundColor).toBe(rgb('#ff9d76'))
  })

  it('mixes the tint between colours where a numeric axis lands between them', () => {
    const ranger = mountRanger({ min: 0, max: 100, step: 5, modelValue: 50 })
    const tint = getComputedStyle(ranger.get('.ranger__thumb').element).backgroundColor

    // Half way between the third and fourth mood colours, so neither of them
    // and a real colour all the same - the browser resolved the `color-mix()`.
    expect(tint).not.toBe(rgb('#ff6bd6'))
    expect(tint).not.toBe(rgb('#ff9d76'))
    expect(tint).toMatch(/^(rgb|color|oklab)/)
  })

  it('moves between tints rather than snapping, unless the reader asked it not to', async () => {
    const ranger = mountRanger({ stops: moods, modelValue: 'wow' })
    const thumb = ranger.get('.ranger__thumb').element

    expect(getComputedStyle(thumb).transitionProperty).toContain('background-color')
    expect(getComputedStyle(thumb).transitionDuration).not.toBe('0s')

    const media = cdp()
    await media.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })

    try {
      expect(getComputedStyle(thumb).transitionDuration).toBe('0s')
    } finally {
      await media.send('Emulation.setEmulatedMedia', { features: [] })
    }
  })

  it('creates no stylesheet to do any of it (ADR-0001)', () => {
    const before = document.head.innerHTML

    mountRanger({ stops: moods, gradient: ['red', 'blue'], modelValue: 'wow' })

    expect(document.head.innerHTML).toBe(before)
  })
})
