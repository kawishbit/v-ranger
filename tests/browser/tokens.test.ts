import { mount } from '@vue/test-utils'
import { cdp } from 'vitest/browser'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'

/**
 * The token surface, as a browser resolves it. `tests/unit/tokens.test.ts`
 * reads the stylesheet and holds it to spec §6; these are the claims that only
 * a cascade can settle — that an ancestor override wins, that the colour
 * scheme changes the default appearance with no JavaScript, and that `size`
 * moves geometry and nothing else.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
]

let wrappers: ReturnType<typeof mount>[] = []
let hosts: HTMLElement[] = []

/** Mounts inside an ancestor the test can put attributes and tokens on. */
function mountIn(host: HTMLElement, props: Record<string, unknown> = {}) {
  document.body.append(host)
  hosts.push(host)

  const wrapper = mount(Ranger, {
    props: { stops: moods, modelValue: 'meh', ...props },
    attachTo: host,
  })
  wrappers.push(wrapper)

  return wrapper
}

function ancestor(style = '', attributes: Record<string, string> = {}) {
  const host = document.createElement('div')
  host.setAttribute('style', style)
  for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value)

  return host
}

/** Mounts inside two nested `data-theme` ancestors, so a test can ask which one wins. */
function mountNested(outerTheme: string, innerTheme: string) {
  const outer = ancestor('', { 'data-theme': outerTheme })
  const inner = ancestor('', { 'data-theme': innerTheme })
  outer.append(inner)
  document.body.append(outer)
  hosts.push(outer)

  const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh' }, attachTo: inner })
  wrappers.push(wrapper)

  return wrapper
}

/** What a browser paints, per part, as plain strings a test can compare. */
function painted(wrapper: ReturnType<typeof mount>) {
  const of = (selector: string) => getComputedStyle(wrapper.get(selector).element)

  const track = of('.ranger__track')
  const thumb = of('.ranger__thumb')
  const label = of('.ranger__label')

  return {
    geometry: {
      trackHeight: track.height,
      thumbSize: thumb.width,
      labelSize: label.fontSize,
      iconSize: of('.ranger__icon').fontSize,
    },
    colour: {
      track: track.backgroundColor,
      ramp: track.backgroundImage,
      thumbBorder: thumb.borderTopColor,
      label: label.color,
    },
  }
}

/** Emulates a media preference for the duration of one test. */
async function emulate(features: { name: string; value: string }[]) {
  await cdp().send('Emulation.setEmulatedMedia', { features })
}

afterEach(async () => {
  for (const wrapper of wrappers) wrapper.unmount()
  for (const host of hosts) host.remove()
  wrappers = []
  hosts = []

  await emulate([])
})

describe('overriding a token', () => {
  it('restyles a Ranger from an ancestor, with no rebuild and no !important', () => {
    const before = painted(mountIn(ancestor()))
    const after = painted(
      mountIn(ancestor('--ranger-track-height: 2rem; --ranger-label-color: rgb(1, 2, 3)')),
    )

    // The point of ADR-0004: one custom property on any ancestor, and no Sass
    // toolchain, no theme class and no `!important` anywhere in reach.
    expect(before.geometry.trackHeight).not.toBe('32px')
    expect(after.geometry.trackHeight).toBe('32px')
    expect(after.colour.label).toBe('rgb(1, 2, 3)')
  })

  it('beats the size scale, so a consumer can ignore `size` entirely', () => {
    const sized = painted(mountIn(ancestor(), { size: 'lg' }))
    const overridden = painted(mountIn(ancestor('--ranger-thumb-size: 3rem'), { size: 'lg' }))

    expect(sized.geometry.thumbSize).not.toBe('48px')
    expect(overridden.geometry.thumbSize).toBe('48px')
  })
})

describe('the size scale', () => {
  it('differs in geometry alone, and grows with the size', () => {
    const sizes = (['sm', 'md', 'lg'] as const).map((size) =>
      painted(mountIn(ancestor(), { size })),
    )

    const [small, medium, large] = sizes.map((paint) => paint.geometry)
    const pixels = (length: string) => Number.parseFloat(length)

    for (const key of ['trackHeight', 'thumbSize', 'labelSize', 'iconSize'] as const) {
      expect(pixels(small![key]), key).toBeLessThan(pixels(medium![key]))
      expect(pixels(medium![key]), key).toBeLessThan(pixels(large![key]))
    }

    // Nothing else moves: a Ranger is the same colour at every size.
    expect(sizes[0]!.colour).toEqual(sizes[1]!.colour)
    expect(sizes[2]!.colour).toEqual(sizes[1]!.colour)
  })
})

describe('the colour scheme', () => {
  it('changes the default appearance with no JavaScript at all', async () => {
    const light = painted(mountIn(ancestor()))

    await emulate([{ name: 'prefers-color-scheme', value: 'dark' }])

    // The same mounted component, restyled by nothing but the media query:
    // no theme class, no `theme` prop, no re-render (ADR-0004).
    const dark = painted(mountIn(ancestor()))

    expect(dark.colour.track).not.toBe(light.colour.track)
    expect(dark.colour.label).not.toBe(light.colour.label)

    // The ramp is the component's own colour and reads on either surface, so
    // the scheme leaves it alone.
    expect(dark.colour.ramp).toBe(light.colour.ramp)
  })

  it('lets an explicit ancestor win in both directions', async () => {
    const dark = painted(mountIn(ancestor('', { 'data-theme': 'dark' })))
    const light = painted(mountIn(ancestor('', { 'data-theme': 'light' })))

    expect(dark.colour.track).not.toBe(light.colour.track)

    // And the other way round: an explicit light island inside a dark page.
    await emulate([{ name: 'prefers-color-scheme', value: 'dark' }])

    const lightInDark = painted(mountIn(ancestor('', { 'data-theme': 'light' })))
    const darkInDark = painted(mountIn(ancestor('', { 'data-theme': 'dark' })))

    expect(lightInDark.colour).toEqual(light.colour)
    expect(darkInDark.colour).toEqual(dark.colour)
  })

  it('lets the nearest data-theme ancestor win when two disagree, not whichever is outermost', () => {
    const light = painted(mountIn(ancestor('', { 'data-theme': 'light' })))
    const dark = painted(mountIn(ancestor('', { 'data-theme': 'dark' })))

    const darkNestedInLight = painted(mountNested('light', 'dark'))
    const lightNestedInDark = painted(mountNested('dark', 'light'))

    // The nearest ancestor wins, not the one whose selector happens to be
    // declared last in the stylesheet (issue 28).
    expect(darkNestedInLight.colour).toEqual(dark.colour)
    expect(lightNestedInDark.colour).toEqual(light.colour)
  })

  it('still hands a token override to the consumer under either scheme', async () => {
    await emulate([{ name: 'prefers-color-scheme', value: 'dark' }])

    const overridden = painted(mountIn(ancestor('--ranger-track-color: rgb(4, 5, 6)')))

    expect(overridden.colour.track).toBe('rgb(4, 5, 6)')
  })
})
