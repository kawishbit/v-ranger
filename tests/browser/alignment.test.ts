import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { blockWithIcon, blockWithLabel } from './harness'

/**
 * Issue 14: every stop block centres exactly on its own stop marker — the same
 * inset travel path the thumb uses — even where that pushes the first and last
 * blocks past the component's own edges. A real browser, because the claim is
 * about geometry: jsdom returns zeroes from `getBoundingClientRect()`.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
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

function mountRanger(props: Record<string, unknown>, into: HTMLElement = document.body) {
  const wrapper = mount(Ranger, {
    props: { stops: moods, modelValue: 'angry', ...props },
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

function centreX(element: Element): number {
  const box = element.getBoundingClientRect()

  return box.x + box.width / 2
}

function stopMarkerFor(root: Element, index: number): Element {
  return [...root.querySelectorAll('.ranger__stop')][index]!
}

describe('label and icon alignment', () => {
  it('centres the first label on the first stop marker, overflowing the component', () => {
    const ranger = mountRanger({})
    const block = blockWithLabel(ranger.element, 'Angry')
    const marker = stopMarkerFor(ranger.element, 0)

    expect(centreX(block)).toBeCloseTo(centreX(marker), 0)
    // The marker sits inset half a thumb's width from the component's own
    // start edge, so a block centred on it necessarily starts left of that edge.
    expect(block.getBoundingClientRect().x).toBeLessThan(ranger.element.getBoundingClientRect().x)
  })

  it('centres the last label on the last stop marker, overflowing the component', () => {
    const ranger = mountRanger({})
    const block = blockWithLabel(ranger.element, 'Astonished')
    const marker = stopMarkerFor(ranger.element, 2)

    expect(centreX(block)).toBeCloseTo(centreX(marker), 0)
    expect(block.getBoundingClientRect().right).toBeGreaterThan(
      ranger.element.getBoundingClientRect().right,
    )
  })

  it('centres a middle label on its own stop marker too', () => {
    const ranger = mountRanger({})
    const block = blockWithLabel(ranger.element, 'Expressionless')
    const marker = stopMarkerFor(ranger.element, 1)

    expect(centreX(block)).toBeCloseTo(centreX(marker), 0)
  })

  it('centres an icon block on its stop marker the same way, edge overflow included', () => {
    const ranger = mountRanger({ labelPosition: 'below', iconPosition: 'above' })
    const block = blockWithIcon(ranger.element, '😠')
    const marker = stopMarkerFor(ranger.element, 0)

    expect(centreX(block)).toBeCloseTo(centreX(marker), 0)
    // Same as the first label: centred on the first stop means starting left
    // of the component's own edge, icon block included.
    expect(block.getBoundingClientRect().x).toBeLessThan(ranger.element.getBoundingClientRect().x)
  })

  describe('RTL', () => {
    it('mirrors the overflow direction', () => {
      const ranger = mountRanger({}, host({ dir: 'rtl' }))
      const first = blockWithLabel(ranger.element, 'Angry')
      const last = blockWithLabel(ranger.element, 'Astonished')

      expect(centreX(first)).toBeCloseTo(centreX(stopMarkerFor(ranger.element, 0)), 0)
      expect(centreX(last)).toBeCloseTo(centreX(stopMarkerFor(ranger.element, 2)), 0)

      // Mirrored from the LTR case: the first stop now overflows the trailing
      // (visual right) edge, and the last overflows the leading (visual left) one.
      expect(first.getBoundingClientRect().right).toBeGreaterThan(
        ranger.element.getBoundingClientRect().right,
      )
      expect(last.getBoundingClientRect().x).toBeLessThan(ranger.element.getBoundingClientRect().x)
    })
  })
})
