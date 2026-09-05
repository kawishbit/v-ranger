import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Ranger } from '../../src/index'

/**
 * Unset, disabled and readonly: the three states every other feature has to
 * account for (spec §5.2). What they *look* like is in
 * `tests/browser/states.test.ts`; this is what they mean.
 */

const moods = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Expressionless' },
  { value: 'wow', label: 'Astonished' },
]

const gapped = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
]

type Wrapper = ReturnType<typeof mount>

function engineOf(wrapper: Wrapper) {
  return wrapper.get('input[type="range"]').element as HTMLInputElement
}

/** Drives the engine the way a browser does: move it, then tell the component. */
async function driveEngine(wrapper: Wrapper, engineValue: number) {
  const input = wrapper.get('input[type="range"]')
  ;(input.element as HTMLInputElement).value = String(engineValue)
  await input.trigger('input')
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('unset', () => {
  it('emits nothing at all until somebody interacts', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods } })

    await nextTick()

    // No `v-model` at all, so there is nothing to write back to and no reason
    // to speak: the predecessor's bug ADR-0003 exists to kill.
    expect(wrapper.emitted()).toEqual({})
    expect(wrapper.attributes('data-unset')).toBeDefined()
  })

  it('never coerces null to the midpoint, on either axis', () => {
    const ordinal = mount(Ranger, { props: { stops: moods, modelValue: null } })
    const numeric = mount(Ranger, { props: { min: 0, max: 100, modelValue: null } })

    expect(engineOf(ordinal).value).toBe('0')
    expect(engineOf(numeric).value).toBe('0')
  })

  it('hands the thumb slot its own state, rather than a stop it has not got', () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, modelValue: null },
      slots: { thumb: `<template #thumb="{ unset, stop }">{{ unset }}/{{ stop }}</template>` },
    })

    expect(wrapper.get('.ranger__thumb').text()).toBe('true/')
  })

  it('leaves the state behind the moment something is chosen', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: null } })

    await driveEngine(wrapper, 2)
    await wrapper.setProps({ modelValue: 'wow' })

    expect(wrapper.attributes('data-unset')).toBeUndefined()
  })
})

describe('disabled', () => {
  it('takes the engine out of the tab order and refuses every change', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh', disabled: true } })

    expect(wrapper.attributes('data-disabled')).toBeDefined()
    expect(engineOf(wrapper).disabled).toBe(true)

    // A disabled input fires no input event of its own, but nothing may get
    // through even if one is dispatched by hand.
    await driveEngine(wrapper, 2)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disables every stop block, so no label is clickable', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, disabled: true } })

    for (const block of wrapper.findAll('.ranger__stop-block')) {
      expect((block.element as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('disables one stop without disabling the Ranger', () => {
    const wrapper = mount(Ranger, { props: { stops: gapped, modelValue: 'a' } })

    expect(wrapper.attributes('data-disabled')).toBeUndefined()
    expect(engineOf(wrapper).disabled).toBe(false)

    const blocks = wrapper.findAll('.ranger__stop-block')
    expect(blocks.map((block) => (block.element as HTMLButtonElement).disabled)).toEqual([
      false,
      true,
      false,
    ])
  })

  it('marks the disabled stop on the track as well as in its block', () => {
    // A Ranger with no labels and no icons has no blocks at all, so the marker
    // is the only thing left to carry the state.
    const wrapper = mount(Ranger, {
      props: { stops: gapped, showLabels: false, showIcons: false },
    })

    expect(wrapper.findAll('.ranger__stop-block')).toHaveLength(0)
    expect(
      wrapper
        .findAll('.ranger__stop')
        .map((stop) => stop.attributes('data-disabled') !== undefined),
    ).toEqual([false, true, false])
  })

  it('settles on the nearest enabled stop rather than the one under the pointer', async () => {
    const wrapper = mount(Ranger, { props: { stops: gapped, modelValue: 'a' } })

    await driveEngine(wrapper, 1)

    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
  })

  it('does not move at all when nothing enabled lies that way', async () => {
    const wrapper = mount(Ranger, {
      props: {
        stops: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c', disabled: true }],
        modelValue: 'a',
      },
    })

    await driveEngine(wrapper, 2)
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(wrapper).value).toBe('0')
  })
})

describe('readonly', () => {
  it('says so to assistive tech, since a range input has no readonly of its own', () => {
    // HTML's `readonly` does not apply to `type="range"`, so the only way to
    // announce it is ARIA. Without this a reader is told it can be changed.
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh', readonly: true } })

    expect(engineOf(wrapper).getAttribute('aria-readonly')).toBe('true')
    expect(engineOf(wrapper).getAttribute('readonly')).toBeNull()
  })

  it('carries no readonly claim when it is not one', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh' } })

    expect(engineOf(wrapper).getAttribute('aria-readonly')).toBeNull()
  })

  it('stays enabled, unlike disabled, and still announces its value', () => {
    const readonly = mount(Ranger, { props: { stops: moods, modelValue: 'meh', readonly: true } })
    const disabled = mount(Ranger, { props: { stops: moods, modelValue: 'meh', disabled: true } })

    expect(engineOf(readonly).disabled).toBe(false)
    expect(engineOf(disabled).disabled).toBe(true)

    expect(readonly.attributes('data-readonly')).toBeDefined()
    expect(readonly.attributes('data-disabled')).toBeUndefined()
    expect(disabled.attributes('data-readonly')).toBeUndefined()
  })

  it('refuses a value change and puts the engine back where it was', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry', readonly: true } })

    await driveEngine(wrapper, 2)
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(engineOf(wrapper).value).toBe('0')
  })

  it('refuses the unset keyboard answer too', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: null, readonly: true } })

    await wrapper.get('input[type="range"]').trigger('keydown', { key: 'Home' })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.attributes('data-unset')).toBeDefined()
  })

  it('refuses a label click, but still hands focus to the engine', async () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, modelValue: 'angry', readonly: true },
      attachTo: document.body,
    })

    await wrapper.findAll('.ranger__stop-block')[2]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    // But the click still lands on the control, so focus goes where it would
    // have gone anyway — a readonly Ranger is focusable (spec §5.2).
    expect(document.activeElement).toBe(engineOf(wrapper))

    wrapper.unmount()
  })
})
