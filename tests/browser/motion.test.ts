import { mount } from '@vue/test-utils'
import { cdp, userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { blockWithLabel } from './harness'
import { moveTo, press, release } from './mouse'

/**
 * Issue 17: the thumb (and the fill, which tracks the same value) glides to a
 * keyboard move, a click-to-jump, or an external `v-model` write, rather than
 * teleporting there — and shows no such lag during a live drag, which has to
 * track the pointer 1:1. A real browser, because a CSS transition mid-flight
 * is exactly the kind of claim jsdom cannot make good on.
 *
 * Sampled over real wall-clock time against the token's own duration, rather
 * than through `Element.getAnimations()` — whether a transition has started
 * or already finished by the time a rendered frame is inspected is a race
 * `setTimeout` settles far more reliably than `requestAnimationFrame` counting.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
]

let wrapper: ReturnType<typeof mount> | null = null

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown>) {
  wrapper = mount(Ranger, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: unknown) => void wrapper?.setProps({ modelValue: value }),
    },
    attrs: { 'aria-label': 'Mood' },
    attachTo: document.body,
  })

  return wrapper
}

afterEach(async () => {
  wrapper?.unmount()
  wrapper = null

  await cdp().send('Emulation.setEmulatedMedia', { features: [] })
})

function engineOf(ranger: ReturnType<typeof mount>) {
  return ranger.get('input[type="range"]').element as HTMLInputElement
}

function pointAt(ranger: ReturnType<typeof mount>, fraction: number) {
  const box = engineOf(ranger).getBoundingClientRect()

  return {
    x: box.x + Math.min(Math.max(fraction * box.width, 1), box.width - 1),
    y: box.y + box.height / 2,
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The thumb's own travel, in pixels, at this instant. */
function thumbX(ranger: ReturnType<typeof mount>): number {
  return ranger.get('.ranger__thumb').element.getBoundingClientRect().x
}

/** The `--_transition` default is `160ms`: partway through it, and well past it. */
const MIDWAY = 70
const SETTLED = 260

describe('gliding to a new position', () => {
  it('animates a keyboard move rather than jumping', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const start = thumbX(ranger)

    engineOf(ranger).focus()
    await userEvent.keyboard('{ArrowRight}')
    await nextTick()

    const midway = await wait(MIDWAY).then(() => thumbX(ranger))
    const settled = await wait(SETTLED - MIDWAY).then(() => thumbX(ranger))

    // Partway through, it is neither where it started nor where it lands —
    // the one shape a discrete jump could never produce.
    expect(midway).not.toBeCloseTo(start, 0)
    expect(midway).not.toBeCloseTo(settled, 0)
    expect(settled).not.toBeCloseTo(start, 0)
  })

  it('animates a click-to-jump the same way', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const start = thumbX(ranger)
    const label = blockWithLabel(ranger.element, 'Astonished').querySelector('.ranger__label')!

    await userEvent.click(label)
    await nextTick()

    const midway = await wait(MIDWAY).then(() => thumbX(ranger))
    const settled = await wait(SETTLED - MIDWAY).then(() => thumbX(ranger))

    expect(midway).not.toBeCloseTo(start, 0)
    expect(midway).not.toBeCloseTo(settled, 0)
  })

  it('animates an external v-model write the same way', async () => {
    // Unbound on purpose: this is a controlled parent rewriting the prop, not
    // the engine or a click, and never through `onUpdate:modelValue`.
    const ranger = mount(Ranger, {
      props: { stops: moods, modelValue: 'angry' },
      attrs: { 'aria-label': 'Mood' },
      attachTo: document.body,
    })
    wrapper = ranger
    const start = thumbX(ranger)

    await ranger.setProps({ modelValue: 'wow' })

    const midway = await wait(MIDWAY).then(() => thumbX(ranger))
    const settled = await wait(SETTLED - MIDWAY).then(() => thumbX(ranger))

    expect(midway).not.toBeCloseTo(start, 0)
    expect(midway).not.toBeCloseTo(settled, 0)
  })

  it('shows no such lag during a live pointer drag', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })

    await press(pointAt(ranger, 0))
    await moveTo(pointAt(ranger, 1))

    expect(ranger.attributes('data-dragging')).toBe('')

    // Read the instant the pointer arrives, and again after the token's own
    // transition duration would have elapsed: a drag has no glide to catch
    // partway through, so the two must already agree.
    const arrived = thumbX(ranger)
    const afterward = await wait(SETTLED).then(() => thumbX(ranger))

    expect(afterward).toBeCloseTo(arrived, 0)

    await release(pointAt(ranger, 1))
  })

  it('jumps instantly under prefers-reduced-motion, with no transition at all', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })

    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const thumb = ranger.get('.ranger__thumb').element

    expect(getComputedStyle(thumb).transitionDuration).toBe('0s')

    engineOf(ranger).focus()
    await userEvent.keyboard('{ArrowRight}')
    await nextTick()

    const arrived = thumbX(ranger)
    const afterward = await wait(SETTLED).then(() => thumbX(ranger))

    expect(afterward).toBeCloseTo(arrived, 0)
  })

  it('still kills the background-colour transition during a drag under prefers-reduced-motion', async () => {
    // The drag-scoped override that keeps the background-colour transition
    // alive (`:where(.ranger[data-dragging]) .ranger__thumb`) must stay
    // specificity-1, or it would outrank the reduced-motion blanket rule on
    // specificity instead of losing to it on source order — the whole trick
    // that rule's own comment documents.
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })

    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const thumb = ranger.get('.ranger__thumb').element

    await press(pointAt(ranger, 0))
    await moveTo(pointAt(ranger, 1))

    expect(ranger.attributes('data-dragging')).toBe('')
    expect(getComputedStyle(thumb).transitionDuration).toBe('0s')

    await release(pointAt(ranger, 1))
  })
})
