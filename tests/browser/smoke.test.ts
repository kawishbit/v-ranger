import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'

describe('browser pipeline smoke', () => {
  it('renders with real layout', () => {
    const wrapper = mount(Ranger, { attachTo: document.body })
    const engine = wrapper.get('input[type="range"]').element as HTMLInputElement

    // The entire reason this project exists alongside the unit one: jsdom has no
    // layout engine and would report 0 here, which is why drag tests must live
    // in a real browser (spec §9).
    expect(engine.getBoundingClientRect().width).toBeGreaterThan(0)

    wrapper.unmount()
  })
})
