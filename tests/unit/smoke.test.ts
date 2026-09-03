import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'

describe('pipeline smoke', () => {
  it('mounts and renders a native range input', () => {
    const wrapper = mount(Ranger)

    expect(wrapper.find('input[type="range"]').exists()).toBe(true)
  })

  it('forwards attributes to the engine rather than the root', () => {
    const wrapper = mount(Ranger, { attrs: { 'aria-label': 'Mood' } })

    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-label')).toBe('Mood')
  })
})
