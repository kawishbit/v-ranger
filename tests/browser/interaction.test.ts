import { mount } from '@vue/test-utils'
import { userEvent } from 'vitest/browser'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { blockWithIcon, blockWithLabel } from './harness'
import { clickOn, drag, moveTo, press, release, touchDrag } from './mouse'

/**
 * Issue 09's own matrix. `ranger.test.ts`, `labels.test.ts`, `states.test.ts`
 * and `a11y.test.ts` each cover the one claim that needed a real browser for
 * their own subject and leave the rest here, as their comments say: the full
 * drag, touch and click-to-jump matrix, RTL reversal, two instances, and SSR
 * hydration.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

let wrappers: ReturnType<typeof mount>[] = []
let hosts: HTMLElement[] = []

function host(attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement('div')
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  document.body.append(element)
  hosts.push(element)

  return element
}

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown>, into: HTMLElement = document.body) {
  const wrapper: ReturnType<typeof mount> = mount(Ranger, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: unknown) => void wrapper.setProps({ modelValue: value }),
    },
    attrs: { 'aria-label': 'Mood' },
    attachTo: into,
  })
  wrappers.push(wrapper)

  return wrapper
}

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  for (const element of hosts) element.remove()
  wrappers = []
  hosts = []
})

function engineOf(ranger: ReturnType<typeof mount>) {
  return ranger.get('input[type="range"]').element as HTMLInputElement
}

/**
 * A point along the engine's own box, which is what a native input maps a
 * click or drag position from - clamped off the very edge, which some
 * platforms refuse to register as landing inside the element at all.
 */
function pointAt(ranger: ReturnType<typeof mount>, fraction: number) {
  const box = engineOf(ranger).getBoundingClientRect()

  return {
    x: box.x + Math.min(Math.max(fraction * box.width, 1), box.width - 1),
    y: box.y + box.height / 2,
  }
}

describe('drag', () => {
  it('tracks the pointer continuously and commits once on release, on the ordinal axis', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })

    await press(pointAt(ranger, 0))
    await moveTo(pointAt(ranger, 0.4))

    // Read mid-drag, before the pointer has gone anywhere near its final
    // position: the value it reports has to be where the pointer is *now*, not
    // a preview of where the drag will end.
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('wow')

    for (const fraction of [0.6, 0.8, 1]) await moveTo(pointAt(ranger, fraction))
    await release(pointAt(ranger, 1))

    const updates = ranger.emitted('update:modelValue')?.map(([value]) => value) ?? []

    // More than one, because the whole point is that the value follows the
    // pointer rather than only reporting where it let go.
    expect(updates.length).toBeGreaterThan(1)
    expect(updates.at(-1)).toBe('blush')
    expect(ranger.emitted('change')).toHaveLength(1)
    expect(ranger.emitted('change')?.[0]?.[0]).toMatchObject({ value: 'blush', index: 5 })
  })

  it('tracks the pointer continuously and commits once on release, on the numeric axis', async () => {
    const ranger = mountBound({ min: 0, max: 100, step: 5, modelValue: 0 })

    await press(pointAt(ranger, 0))
    await moveTo(pointAt(ranger, 0.5))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(50)

    for (const fraction of [0.75, 1]) await moveTo(pointAt(ranger, fraction))
    await release(pointAt(ranger, 1))

    const updates = ranger.emitted('update:modelValue')?.map(([value]) => value) ?? []

    expect(updates.length).toBeGreaterThan(1)
    expect(updates.at(-1)).toBe(100)
    expect(ranger.emitted('change')).toHaveLength(1)
  })

  it('leaves an unset Ranger with a real answer once the drag ends', async () => {
    const ranger = mountBound({ stops: moods, modelValue: null })
    expect(ranger.attributes('data-unset')).toBe('')

    await drag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')
    expect(ranger.emitted('change')).toHaveLength(1)
    expect(ranger.attributes('data-unset')).toBeUndefined()
  })

  it('sets data-dragging only between press and release, on the ordinal axis', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    expect(ranger.attributes('data-dragging')).toBeUndefined()

    await press(pointAt(ranger, 0))
    expect(ranger.attributes('data-dragging')).toBe('')

    await moveTo(pointAt(ranger, 0.5))
    expect(ranger.attributes('data-dragging')).toBe('')

    await release(pointAt(ranger, 0.5))
    expect(ranger.attributes('data-dragging')).toBeUndefined()
  })

  it('sets data-dragging only between press and release, on the numeric axis', async () => {
    const ranger = mountBound({ min: 0, max: 100, step: 5, modelValue: 50 })

    await press(pointAt(ranger, 0))
    expect(ranger.attributes('data-dragging')).toBe('')

    await release(pointAt(ranger, 0))
    expect(ranger.attributes('data-dragging')).toBeUndefined()
  })

  it('sets data-dragging only between press and release, from unset', async () => {
    const ranger = mountBound({ stops: moods, modelValue: null })

    await press(pointAt(ranger, 0))
    expect(ranger.attributes('data-dragging')).toBe('')

    await release(pointAt(ranger, 0))
    expect(ranger.attributes('data-dragging')).toBeUndefined()
  })
})

describe('click on the track', () => {
  it('jumps straight to the nearest stop on the ordinal axis', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    // 0.36 sits closer to "wow" (0.4) than to "meh" (0.2).
    const point = pointAt(ranger, 0.36)

    await drag(point, point)

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe('wow')
  })

  it('jumps straight to the nearest step on the numeric axis', async () => {
    const ranger = mountBound({ min: 0, max: 100, step: 5, modelValue: 0 })
    const point = pointAt(ranger, 0.61)

    await drag(point, point)

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe(60)
  })

  it('jumps from an unset start too', async () => {
    const ranger = mountBound({ stops: moods, modelValue: null })
    const point = pointAt(ranger, 0.36)

    await drag(point, point)

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe('wow')
    expect(ranger.attributes('data-unset')).toBeUndefined()
  })
})

describe('disabled', () => {
  it('never moves on a real drag, start to end, mouse or touch (issue 16)', async () => {
    const mouse = mountBound({ stops: moods, modelValue: 'angry', disabled: true })
    await drag(pointAt(mouse, 0), pointAt(mouse, 1))

    expect(mouse.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(mouse).value).toBe('0')

    const touch = mountBound({ stops: moods, modelValue: 'angry', disabled: true })
    await touchDrag(pointAt(touch, 0), pointAt(touch, 1))

    expect(touch.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(touch).value).toBe('0')
  })

  it('never moves on a slow drag with intermediate moves either', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry', disabled: true })

    await press(pointAt(ranger, 0))
    for (const fraction of [0.25, 0.5, 0.75, 1]) await moveTo(pointAt(ranger, fraction))
    await release(pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(ranger).value).toBe('0')
    expect(ranger.attributes('data-dragging')).toBeUndefined()
  })

  // Re-verified alongside the drag fix, even though neither was reported
  // broken, since both share the same `disabled` check (issue 16).
  it('still refuses a click-to-jump on a label', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry', disabled: true })
    const label = blockWithLabel(ranger.element, 'Blush')

    // A real click, rather than `userEvent.click`, which waits for its target
    // to become clickable — and whether a disabled block ever does is exactly
    // what this test is asking.
    await clickOn(label)
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(ranger).value).toBe('0')
  })

  it('still cannot be reached by the keyboard', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry', disabled: true })
    const engine = engineOf(ranger)

    engine.focus()
    expect(document.activeElement).not.toBe(engine)
  })
})

describe('click-to-jump on a label and an icon', () => {
  it('jumps when the label itself is clicked, and returns focus to the engine', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const label = blockWithLabel(ranger.element, 'Blush').querySelector('.ranger__label')!

    await userEvent.click(label)
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe('blush')
    expect(ranger.emitted('change')?.[0]?.[0]).toMatchObject({ value: 'blush', index: 5 })
    expect(document.activeElement).toBe(engineOf(ranger))
  })

  it('jumps when the icon itself is clicked, and returns focus to the engine', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const icon = blockWithIcon(ranger.element, '😊').querySelector('.ranger__icon')!

    await userEvent.click(icon)
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe('blush')
    expect(document.activeElement).toBe(engineOf(ranger))
  })

  it('jumps on a numeric axis tick label too', async () => {
    const ranger = mountBound({
      min: 0,
      max: 100,
      step: 5,
      stops: [
        { at: 0, label: 'Cold', icon: '🥶' },
        { at: 100, label: 'Hot', icon: '🥵' },
      ],
      modelValue: 0,
    })
    const label = blockWithLabel(ranger.element, 'Hot').querySelector('.ranger__label')!

    await userEvent.click(label)
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe(100)
    expect(document.activeElement).toBe(engineOf(ranger))
  })

  it('jumps from an unset start too', async () => {
    const ranger = mountBound({ stops: moods, modelValue: null })
    const label = blockWithLabel(ranger.element, 'Blush').querySelector('.ranger__label')!

    await userEvent.click(label)
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.[0]?.[0]).toBe('blush')
    expect(document.activeElement).toBe(engineOf(ranger))
  })
})

describe('keyboard paging', () => {
  it('moves further than a single step, in each direction, on the ordinal axis', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'wow' })
    engineOf(ranger).focus()
    const indexOf = (value: unknown) => moods.findIndex((stop) => stop.value === value)

    await userEvent.keyboard('{PageUp}')
    const afterUp = indexOf(ranger.emitted('update:modelValue')?.at(-1)?.[0])
    expect(afterUp).toBeGreaterThan(indexOf('wow'))

    await userEvent.keyboard('{PageDown}')
    const afterDown = indexOf(ranger.emitted('update:modelValue')?.at(-1)?.[0])
    expect(afterDown).toBeLessThan(afterUp)
  })
})

describe('touch', () => {
  it('drags the value the same way a pointer drag does, on the ordinal axis', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })

    await touchDrag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')
    expect(ranger.emitted('change')).toHaveLength(1)
  })

  it('drags the value the same way a pointer drag does, on the numeric axis', async () => {
    const ranger = mountBound({ min: 0, max: 100, step: 5, modelValue: 0 })

    await touchDrag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(100)
  })

  it('answers a touch drag from unset the same as any other', async () => {
    const ranger = mountBound({ stops: moods, modelValue: null })

    await touchDrag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')
    expect(ranger.attributes('data-unset')).toBeUndefined()
  })
})

describe('the focus ring after a mouse click', () => {
  it('stays hidden, unlike after a tab', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const thumb = ranger.get('.ranger__thumb').element

    await drag(pointAt(ranger, 0.5), pointAt(ranger, 0.5))

    expect(getComputedStyle(thumb).outlineStyle).toBe('none')
  })
})

describe('RTL', () => {
  function mountRTL(props: Record<string, unknown>) {
    return mountBound(props, host({ dir: 'rtl' }))
  }

  it('reverses the arrow keys', async () => {
    const ranger = mountRTL({ stops: moods, modelValue: 'wow' })
    engineOf(ranger).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('meh')

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('ugh')
  })

  it('reverses a drag: moving right on the screen moves the value toward the start', async () => {
    const ranger = mountRTL({ stops: moods, modelValue: 'wow' })

    await drag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('angry')
  })

  it('reverses the arrow keys on the numeric axis too', async () => {
    const ranger = mountRTL({ min: 0, max: 100, step: 5, modelValue: 50 })
    engineOf(ranger).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(45)

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(55)
  })

  it('reverses a drag on the numeric axis too', async () => {
    const ranger = mountRTL({ min: 0, max: 100, step: 5, modelValue: 50 })

    await drag(pointAt(ranger, 0), pointAt(ranger, 1))

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(0)
  })
})

describe('two Rangers on one page, in a real browser', () => {
  it('drags one without moving or waking the other', async () => {
    const first = mountBound({ stops: moods, modelValue: 'angry' })
    const second = mountBound({ stops: moods, modelValue: 'angry' })

    await drag(pointAt(first, 0), pointAt(first, 1))

    expect(first.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')
    expect(second.emitted()).toEqual({})
    expect(second.attributes('data-dragging')).toBeUndefined()
    expect(engineOf(second).value).toBe('0')
  })

  it('does not interfere across axis kinds either', async () => {
    const numeric = mountBound({ min: 0, max: 100, step: 5, modelValue: 0 })
    const ordinal = mountBound({ stops: moods, modelValue: 'angry' })

    await drag(pointAt(numeric, 0), pointAt(numeric, 1))

    expect(numeric.emitted('update:modelValue')?.at(-1)?.[0]).toBe(100)
    expect(ordinal.emitted()).toEqual({})
    expect(engineOf(ordinal).value).toBe('0')
  })
})

/**
 * Renders `props` on the server, mounts that markup on the client with the
 * same props, and hands back the container once hydration has settled - with
 * every console warning and error it produced along the way, so a caller can
 * hold it to "no mismatch" without repeating the spy dance three times.
 */
async function hydrate(props: Record<string, unknown>) {
  const messages: string[] = []
  const originalError = console.error
  const originalWarn = console.warn
  console.error = (...args: unknown[]) => void messages.push(args.map(String).join(' '))
  console.warn = (...args: unknown[]) => void messages.push(args.map(String).join(' '))

  const container = host()

  try {
    const server = createSSRApp({ render: () => h(Ranger, props) })
    container.innerHTML = await renderToString(server)

    const client = createSSRApp({ render: () => h(Ranger, props) })
    client.mount(container)
    await nextTick()
  } finally {
    console.error = originalError
    console.warn = originalWarn
  }

  return { container, messages }
}

describe('SSR', () => {
  it('hydrates the ordinal axis with no mismatch warning', async () => {
    const { container, messages } = await hydrate({
      stops: moods,
      modelValue: 'wow',
      'aria-label': 'Mood',
    })

    expect(messages.filter((message) => /hydrat/i.test(message))).toEqual([])
    expect(container.querySelector('input[type="range"]')?.getAttribute('value')).toBe('2')
  })

  it('hydrates the numeric axis with no mismatch warning', async () => {
    const { container, messages } = await hydrate({
      min: 0,
      max: 100,
      step: 5,
      modelValue: 50,
      'aria-label': 'Mood',
    })

    expect(messages.filter((message) => /hydrat/i.test(message))).toEqual([])
    expect(container.querySelector('input[type="range"]')?.getAttribute('value')).toBe('50')
  })

  it('hydrates the unset starting state with no mismatch warning', async () => {
    const { container, messages } = await hydrate({
      stops: moods,
      modelValue: null,
      'aria-label': 'Mood',
    })

    expect(messages.filter((message) => /hydrat/i.test(message))).toEqual([])
    expect(container.querySelector('.ranger')?.getAttribute('data-unset')).toBe('')
  })
})
