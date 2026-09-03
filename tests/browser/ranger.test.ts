import { mount } from '@vue/test-utils'
import { cdp, userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'

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

/**
 * A real pointer drag. Synthetic pointer events do not move a native range
 * input — only trusted ones do — so this goes through the browser's own input
 * pipeline. The test frame sits at the page origin, so client coordinates and
 * page coordinates are the same.
 */
async function drag(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mouse = cdp()
  const button = 'left'

  await mouse.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button,
    clickCount: 1,
    ...from,
  })
  await mouse.send('Input.dispatchMouseEvent', { type: 'mouseMoved', button, buttons: 1, ...to })
  await mouse.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button,
    clickCount: 1,
    ...to,
  })
}

/** Where the thumb actually is, in the page, in real pixels. */
function thumbCentre(root: Element) {
  const box = root.querySelector('.ranger__thumb')!.getBoundingClientRect()
  return box.x + box.width / 2
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
