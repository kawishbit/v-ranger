import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { cdp, userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'

/**
 * Spec §7 is a hard requirement, and this is where it is held to one: a real
 * accessibility tree for `axe-core` to read, the platform's own keyboard
 * behaviour rather than a synthetic key event, and computed colours to measure
 * a contrast ratio from. None of the three exists in jsdom.
 *
 * What a reader is *told* lives in `tests/unit/announce.test.ts`.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

/** The ramp the component paints with no colour configured at all. */
const mood = ['#ffc300', '#ffb0fe', '#ff6bd6', '#ff9d76', '#51eaea', '#fb3569']

let wrappers: ReturnType<typeof mount>[] = []
let hosts: HTMLElement[] = []

function host(style = ''): HTMLElement {
  const element = document.createElement('div')
  element.setAttribute('style', style)
  document.body.append(element)
  hosts.push(element)

  return element
}

/**
 * A tab stop of its own, after whatever is mounted. Tabbing has to land
 * somewhere, and "somewhere" must not be the browser's own chrome: a test that
 * tabs out of the document takes the next test's focus with it.
 */
function sentinel() {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'elsewhere'
  document.body.append(button)
  hosts.push(button)

  return button
}

function mountIn(into: HTMLElement, props: Record<string, unknown> = {}) {
  const wrapper = mount(Ranger, {
    props: { stops: moods, ...props },
    attrs: { 'aria-label': 'Mood' },
    attachTo: into,
  })
  wrappers.push(wrapper)

  return wrapper
}

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown> = {}) {
  const wrapper = mountIn(host(), {
    ...props,
    'onUpdate:modelValue': (value: unknown) => void wrapper.setProps({ modelValue: value }),
  })

  return wrapper
}

function engineOf(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('input[type="range"]').element as HTMLInputElement
}

/** Focused the way a keyboard user gets there, so `:focus-visible` applies. */
async function tabTo(wrapper: ReturnType<typeof mount>) {
  engineOf(wrapper).focus()
  await userEvent.tab()
  await userEvent.tab({ shift: true })

  return engineOf(wrapper)
}

async function emulate(features: { name: string; value: string }[]) {
  await cdp().send('Emulation.setEmulatedMedia', { features })
}

afterEach(async () => {
  for (const wrapper of wrappers) wrapper.unmount()
  for (const element of hosts) element.remove()
  wrappers = []
  hosts = []

  await emulate([])
})

/** WCAG 2.2 AA, and nothing else: best-practice rules are not the requirement. */
const WCAG22AA = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
}

async function violations(element: Element) {
  const results = await axe.run(element, WCAG22AA)

  return results.violations.map((violation) => violation.id)
}

describe('axe-core', () => {
  it('finds nothing on the ordinal example', async () => {
    expect(await violations(mountIn(host(), { modelValue: 'wow' }).element)).toEqual([])
  })

  it('finds nothing on the numeric example', async () => {
    const numeric = mountIn(host(), {
      stops: [
        { at: 0, label: 'Cold', icon: '🥶' },
        { at: 100, label: 'Hot', icon: '🥵' },
      ],
      min: 0,
      max: 100,
      step: 5,
      modelValue: 45,
    })

    expect(await violations(numeric.element)).toEqual([])
  })

  it('finds nothing on the unset example', async () => {
    expect(await violations(mountIn(host(), { modelValue: null }).element)).toEqual([])
  })

  it('finds nothing on the disabled example', async () => {
    expect(
      await violations(mountIn(host(), { modelValue: 'meh', disabled: true }).element),
    ).toEqual([])
  })

  it('finds nothing on the readonly example', async () => {
    expect(
      await violations(mountIn(host(), { modelValue: 'meh', readonly: true }).element),
    ).toEqual([])
  })

  it('finds nothing when the name comes from a wrapping label instead', async () => {
    const label = document.createElement('label')
    label.append(document.createTextNode('Mood'))
    document.body.append(label)
    hosts.push(label)

    const wrapper = mount(Ranger, { props: { stops: moods }, attachTo: label })
    wrappers.push(wrapper)

    expect(await violations(label)).toEqual([])
  })

  it('does find a Ranger nobody named, so the checks above mean something', async () => {
    const anonymous = mount(Ranger, { props: { stops: moods }, attachTo: host() })
    wrappers.push(anonymous)

    // The same failure `no-accessible-name` warns about in development.
    expect(await violations(anonymous.element)).toContain('label')
  })
})

describe('the keyboard', () => {
  it('steps with the arrows, in both directions', async () => {
    const ranger = mountBound({ modelValue: 'wow' })
    engineOf(ranger).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('ugh')

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('meh')
  })

  it('jumps to the extremes with Home and End', async () => {
    const ranger = mountBound({ modelValue: 'wow' })
    engineOf(ranger).focus()

    await userEvent.keyboard('{End}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('blush')

    await userEvent.keyboard('{Home}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('angry')
  })

  it('takes a larger increment with PageUp and PageDown on a numeric axis', async () => {
    const ranger = mountBound({ stops: [], min: 0, max: 100, step: 5, modelValue: 50 })
    engineOf(ranger).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(55)

    await userEvent.keyboard('{PageUp}')
    const afterPage = ranger.emitted('update:modelValue')?.at(-1)?.[0] as number

    // Whatever the platform's page increment is, it has to be more than a step.
    expect(afterPage).toBeGreaterThan(60)

    await userEvent.keyboard('{PageDown}')
    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe(55)
  })

  it('reaches and changes every enabled stop, with the keyboard alone', async () => {
    const ranger = mountBound({ modelValue: null })
    engineOf(ranger).focus()

    await userEvent.keyboard('{Home}')
    for (let press = 1; press < moods.length; press += 1) await userEvent.keyboard('{ArrowRight}')

    expect(ranger.emitted('update:modelValue')?.map(([value]) => value)).toEqual(
      moods.map((stop) => stop.value),
    )
  })

  it('answers with the parked stop on the first press while unset', async () => {
    const ranger = mountBound({ modelValue: null })
    engineOf(ranger).focus()

    // The engine is parked at the start with nothing selected, so a key that
    // would leave it there moves nothing and fires no `input` of its own.
    await userEvent.keyboard('{ArrowLeft}')
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toEqual([['angry']])
    expect(ranger.emitted('change')).toHaveLength(1)
    expect(engineOf(ranger).value).toBe('0')

    // And from there the engine has the value, so it steps normally again.
    await userEvent.keyboard('{ArrowRight}')

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('meh')
  })

  it('skips a disabled stop rather than settling on it', async () => {
    const ranger = mountBound({
      stops: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ],
      modelValue: 'a',
    })
    engineOf(ranger).focus()

    await userEvent.keyboard('{ArrowRight}')
    await nextTick()

    // One key press, one enabled stop further on — and the engine went with it,
    // rather than being left on a stop the value refused (ADR-0001).
    expect(ranger.emitted('update:modelValue')).toEqual([['c']])
    expect(engineOf(ranger).value).toBe('2')

    await userEvent.keyboard('{ArrowLeft}')
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('a')
    expect(engineOf(ranger).value).toBe('0')
  })

  it('is not reachable at all while disabled', async () => {
    const before = sentinel()
    const ranger = mountIn(host(), { modelValue: 'meh', disabled: true })
    const after = sentinel()

    before.focus()
    await userEvent.tab()

    expect(document.activeElement).toBe(after)
    expect(document.activeElement).not.toBe(engineOf(ranger))
  })

  it('is reachable but unchangeable while readonly', async () => {
    const before = sentinel()
    const ranger = mountBound({ modelValue: 'meh', readonly: true })

    before.focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(engineOf(ranger))

    await userEvent.keyboard('{ArrowRight}')
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(ranger).value).toBe('1')
  })
})

/**
 * WCAG 2.2's non-text contrast: a focus indicator has to reach 3:1 against
 * what it sits on. The numbers are computed rather than eyeballed, because a
 * token nudged by one shade is exactly the change nobody notices.
 */
describe('the focus ring', () => {
  /** sRGB relative luminance, per the WCAG definition. */
  function luminance(colour: string): number {
    const [red = 0, green = 0, blue = 0] = colour.match(/[\d.]+/g)!.map(Number)

    const channel = (value: number) => {
      const ratio = value / 255
      return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
    }

    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  }

  function contrast(one: string, other: string): number {
    const [dark, light] = [luminance(one), luminance(other)].sort((a, b) => a - b) as [
      number,
      number,
    ]

    return (light + 0.05) / (dark + 0.05)
  }

  /** A hex colour as the browser would compute it, so the two can be compared. */
  function rgb(hex: string) {
    return `rgb(${[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(', ')})`
  }

  /**
   * The ring, the track and the surface, as painted. The surface is read from
   * a probe rather than from a token string: only a browser knows which of the
   * scheme blocks won, and only a computed value comes back as rgb.
   */
  async function ringOf(wrapper: ReturnType<typeof mount>) {
    const thumb = wrapper.get('.ranger__thumb').element
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--_surface)'
    wrapper.element.append(probe)

    await tabTo(wrapper)

    return {
      ring: getComputedStyle(thumb).outlineColor,
      inner: getComputedStyle(thumb).boxShadow,
      track: getComputedStyle(wrapper.get('.ranger__track').element).backgroundColor,
      surface: getComputedStyle(probe).backgroundColor,
    }
  }

  it('clears the surface, the track and every default ramp colour in light', async () => {
    const painted = await ringOf(mountIn(host(''), { modelValue: 'wow' }))

    expect(contrast(painted.ring, painted.surface)).toBeGreaterThanOrEqual(3)
    expect(contrast(painted.ring, painted.track)).toBeGreaterThanOrEqual(3)

    // The ring crosses the ramp, so the default has to clear all six colours
    // of it — which is why the token's default is the scheme's extreme rather
    // than an accent colour.
    for (const colour of mood) {
      expect(contrast(painted.ring, rgb(colour)), colour).toBeGreaterThanOrEqual(3)
    }
  })

  it('clears the surface and the track in dark too', async () => {
    await emulate([{ name: 'prefers-color-scheme', value: 'dark' }])

    const painted = await ringOf(mountIn(host(), { modelValue: 'wow' }))

    expect(contrast(painted.ring, painted.surface)).toBeGreaterThanOrEqual(3)
    expect(contrast(painted.ring, painted.track)).toBeGreaterThanOrEqual(3)

    // No ramp claim here, and none is possible: no single colour clears both a
    // near-black surface and a light ramp. What holds instead is the ring's own
    // inner edge, painted in the surface colour it has just been measured
    // against, so there is always a known colour beside it.
    expect(painted.inner).toContain(painted.surface)
  })

  it('clears the magenta recipe, ramp colours and all', async () => {
    // The original look, as spec §10 will publish it: the mood ramp on each
    // stop, a white surface, and the ring left at its default.
    const recipe = mountIn(host('--ranger-surface: #ffffff; --ranger-label-color: #525252'), {
      stops: moods.map((stop, index) => ({ ...stop, color: mood[index] })),
      modelValue: 'wow',
    })

    const painted = await ringOf(recipe)

    expect(contrast(painted.ring, painted.surface)).toBeGreaterThanOrEqual(3)
    expect(contrast(painted.ring, painted.track)).toBeGreaterThanOrEqual(3)

    for (const colour of mood) {
      expect(contrast(painted.ring, rgb(colour)), colour).toBeGreaterThanOrEqual(3)
    }
  })

  it('is drawn only for a keyboard user, not for a pointer', async () => {
    const ranger = mountIn(host(), { modelValue: 'wow' })
    const thumb = ranger.get('.ranger__thumb').element

    expect(getComputedStyle(thumb).outlineStyle).toBe('none')

    await tabTo(ranger)

    expect(getComputedStyle(thumb).outlineStyle).toBe('solid')
  })
})

describe('a reader who asked for less motion', () => {
  it('gets none at all, from any part of a Ranger', async () => {
    const ranger = mountIn(host(), { modelValue: 'wow' })

    await emulate([{ name: 'prefers-reduced-motion', value: 'reduce' }])

    // Every element, not only the thumb: the original hardcoded
    // `transition: all 400ms` and there was no way to ask it to stop.
    for (const element of [ranger.element, ...ranger.element.querySelectorAll('*')]) {
      expect(getComputedStyle(element).transitionDuration, element.className).toBe('0s')
    }
  })
})

describe('the touch targets', () => {
  it('are at least 24 by 24, even where the stops are closer than that', () => {
    // Six stops in 120px would be 20px apiece. Spec §7's target wins and the
    // blocks begin to meet: an unreachable control is the worse failure.
    const narrow = mountIn(host('inline-size: 120px'), { modelValue: 'wow' })

    const blocks = [...narrow.element.querySelectorAll('.ranger__stop-block')]
    expect(blocks.length).toBeGreaterThan(0)

    for (const block of blocks) {
      const box = block.getBoundingClientRect()

      expect(box.width).toBeGreaterThanOrEqual(24)
      expect(box.height).toBeGreaterThanOrEqual(24)
    }
  })
})
