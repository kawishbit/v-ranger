import { mount } from '@vue/test-utils'
import { userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { clickOn } from './mouse'

/**
 * Click-to-jump (spec §5.3), in a real browser because the claim is about
 * focus: a click on a label has to move the value and then leave the keyboard
 * where it started, on the engine. jsdom would let a wrong answer pass.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

let wrapper: ReturnType<typeof mount> | null = null

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown>) {
  wrapper = mount(Ranger, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: unknown) => void wrapper?.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

function engineOf(ranger: ReturnType<typeof mount>) {
  return ranger.get('input[type="range"]').element as HTMLInputElement
}

/** The stop block for one stop, found the way a reader finds it: by its text. */
function blockWithLabel(ranger: ReturnType<typeof mount>, label: string) {
  const block = [...ranger.element.querySelectorAll('.ranger__stop-block')].find((candidate) =>
    candidate.querySelector('.ranger__label')?.textContent?.includes(label),
  )

  if (!block) throw new Error(`no stop labelled ${label}`)
  return block as HTMLElement
}

describe('click-to-jump', () => {
  it('moves the value to the clicked stop and commits it', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })

    await userEvent.click(blockWithLabel(ranger, 'Astonished'))
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toEqual([['wow']])
    expect(ranger.emitted('change')?.[0]?.[0]).toMatchObject({ value: 'wow', index: 2 })

    // The engine is the source of truth, so it has to have moved too (ADR-0001).
    expect(engineOf(ranger).value).toBe('2')
  })

  it('leaves focus on the engine rather than on the label that was clicked', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry' })
    const block = blockWithLabel(ranger, 'Blush')

    await userEvent.click(block)

    // A browser focuses a button it is clicked on, so this is a real risk: the
    // next arrow key has to move the Ranger, not do nothing (spec §5.3).
    expect(document.activeElement).toBe(engineOf(ranger))
    expect(block.contains(document.activeElement)).toBe(false)

    await userEvent.keyboard('{ArrowLeft}')
    await nextTick()

    expect(ranger.emitted('update:modelValue')?.at(-1)?.[0]).toBe('okay')
  })

  it('does not respond to a click on a disabled stop', async () => {
    const ranger = mountBound({
      stops: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ],
      modelValue: 'a',
    })

    await clickOn(blockWithLabel(ranger, 'B'))
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(ranger.emitted('change')).toBeUndefined()
    expect(engineOf(ranger).value).toBe('0')
  })

  it('refuses the jump while readonly, but still hands focus to the engine', async () => {
    const ranger = mountBound({ stops: moods, modelValue: 'angry', readonly: true })

    await userEvent.click(blockWithLabel(ranger, 'Blush'))
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(ranger).value).toBe('0')
    expect(document.activeElement).toBe(engineOf(ranger))
  })
})
