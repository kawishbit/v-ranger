import { mount } from '@vue/test-utils'
import { userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { Ranger } from '../../src/index'
import { clickOn } from './mouse'

/**
 * What unset, disabled and readonly *look* like, and the part of "a disabled
 * stop is unreachable" only a real browser can settle: a pointer refused by a
 * disabled button, and a value that will not move. What the three states *mean*
 * is in `tests/unit/states.test.ts`.
 */

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
]

const gapped = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
]

let wrappers: ReturnType<typeof mount>[] = []

function mountRanger(props: Record<string, unknown> = {}) {
  const wrapper = mount(Ranger, {
    props: { stops: moods, ...props },
    attrs: { 'aria-label': 'Mood' },
    attachTo: document.body,
  })
  wrappers.push(wrapper)

  return wrapper
}

/** Mounts with the model wired back, which is all `v-model` really is. */
function mountBound(props: Record<string, unknown> = {}) {
  const wrapper = mountRanger({
    ...props,
    'onUpdate:modelValue': (value: unknown) => void wrapper.setProps({ modelValue: value }),
  })

  return wrapper
}

let sentinels: HTMLElement[] = []

/**
 * A tab stop of its own, before or after a Ranger. Tabbing has to land
 * somewhere, and "somewhere" must not be the browser's own chrome: a test that
 * tabs out of the document takes the next test's focus with it.
 */
function sentinel() {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'elsewhere'
  document.body.append(button)
  sentinels.push(button)

  return button
}

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  for (const button of sentinels) button.remove()
  wrappers = []
  sentinels = []
})

function styleOf(wrapper: ReturnType<typeof mount>, selector: string) {
  return getComputedStyle(wrapper.get(selector).element)
}

/** The stop block for one stop, found the way a reader finds it: by its text. */
function blockWithLabel(wrapper: ReturnType<typeof mount>, label: string) {
  const block = [...wrapper.element.querySelectorAll('.ranger__stop-block')].find((candidate) =>
    candidate.querySelector('.ranger__label')?.textContent?.includes(label),
  )

  if (!block) throw new Error(`no stop labelled ${label}`)
  return block as HTMLElement
}

describe('unset', () => {
  it('does not paint the ramp, and is not the first stop either', () => {
    const unset = mountRanger({ modelValue: null })
    const first = mountRanger({ modelValue: 'angry' })

    // Both park the thumb at the start, so the track and the thumb are the
    // whole of the difference — and there has to be one (ADR-0003).
    expect(styleOf(unset, '.ranger__track').backgroundImage).toBe('none')
    expect(styleOf(first, '.ranger__track').backgroundImage).toContain('linear-gradient')

    expect(Number(styleOf(unset, '.ranger__thumb').opacity)).toBeLessThan(1)
    expect(styleOf(first, '.ranger__thumb').opacity).toBe('1')
  })

  it('is not the middle stop either, which is the one that matters', () => {
    // A survey's whole point: an unanswered question must not read as a
    // deliberate neutral answer, which is what vlider rendered.
    const unset = mountRanger({ modelValue: null })
    const middle = mountRanger({ modelValue: 'meh' })

    const thumb = (wrapper: ReturnType<typeof mount>) =>
      wrapper.get('.ranger__thumb').element.getBoundingClientRect().x

    expect(thumb(unset)).not.toBeCloseTo(thumb(middle), 0)
    expect(styleOf(unset, '.ranger__track').backgroundImage).not.toBe(
      styleOf(middle, '.ranger__track').backgroundImage,
    )
  })

  it('leaves the flat track to a token, so an unset Ranger is restyleable too', () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, modelValue: null },
      attrs: { style: '--ranger-unset-track-color: rgb(7, 8, 9)' },
      attachTo: document.body,
    })
    wrappers.push(wrapper)

    expect(styleOf(wrapper, '.ranger__track').backgroundColor).toBe('rgb(7, 8, 9)')
  })
})

describe('disabled', () => {
  it('dims the whole Ranger and takes the pointer away from it', () => {
    const wrapper = mountRanger({ modelValue: 'meh', disabled: true })

    expect(Number(styleOf(wrapper, '.ranger').opacity ?? '1')).toBeLessThan(1)
    expect(styleOf(wrapper, '.ranger__engine').cursor).toBe('default')
  })

  it('does not compound its fade with a disabled stop inside it', () => {
    const whole = mountRanger({ stops: gapped, disabled: true })
    const one = mountRanger({ stops: gapped })

    const root = Number(getComputedStyle(whole.element).opacity)
    const block = Number(getComputedStyle(blockWithLabel(whole, 'B')).opacity)

    // The root fade is already on everything below it, so the block does not
    // pay for it twice — and on its own it still fades.
    expect(block).toBe(1)
    expect(root).toBeLessThan(1)
    expect(Number(getComputedStyle(blockWithLabel(one, 'B')).opacity)).toBe(root)
  })

  it('says a stop is unavailable by more than its colour', () => {
    const wrapper = mountRanger({ stops: gapped })

    // Spec §7: contrast alone may not carry meaning. The strike-through is the
    // visible half of it; `aria-valuetext` is the other.
    expect(
      getComputedStyle(blockWithLabel(wrapper, 'B').querySelector('.ranger__label')!)
        .textDecorationLine,
    ).toBe('line-through')

    expect(
      getComputedStyle(blockWithLabel(wrapper, 'A').querySelector('.ranger__label')!)
        .textDecorationLine,
    ).toBe('none')
  })

  it('refuses a real click on a disabled stop, and its cursor says so', async () => {
    const ranger = mountBound({ stops: gapped, modelValue: 'a' })
    const block = blockWithLabel(ranger, 'B')

    expect(getComputedStyle(block).cursor).toBe('default')

    await clickOn(block)
    await nextTick()

    expect(ranger.emitted('update:modelValue')).toBeUndefined()
  })

  it('cannot be reached by the keyboard at all', async () => {
    const before = sentinel()
    const ranger = mountRanger({ modelValue: 'meh', disabled: true })
    const after = sentinel()

    before.focus()
    await userEvent.tab()

    // Tab went straight past it: a disabled control is not a tab stop, and the
    // Ranger has no other one — every stop block is `tabindex="-1"`.
    expect(document.activeElement).toBe(after)
    expect(document.activeElement).not.toBe(ranger.get('input').element)
  })
})

describe('readonly', () => {
  it('looks like an ordinary Ranger rather than a faded one', () => {
    const readonly = mountRanger({ modelValue: 'meh', readonly: true })
    const ordinary = mountRanger({ modelValue: 'meh' })

    expect(getComputedStyle(readonly.element).opacity).toBe(
      getComputedStyle(ordinary.element).opacity,
    )
    expect(styleOf(readonly, '.ranger__track').backgroundImage).toBe(
      styleOf(ordinary, '.ranger__track').backgroundImage,
    )
  })

  it('promises the pointer nothing it will not do', () => {
    const readonly = mountRanger({ modelValue: 'meh', readonly: true })
    const ordinary = mountRanger({ modelValue: 'meh' })

    expect(styleOf(readonly, '.ranger__engine').cursor).toBe('default')
    expect(styleOf(readonly, '.ranger__stop-block').cursor).toBe('default')
    expect(styleOf(ordinary, '.ranger__engine').cursor).toBe('pointer')
  })

  it('still takes focus and still draws its focus ring', async () => {
    const before = sentinel()
    const ranger = mountRanger({ modelValue: 'meh', readonly: true })

    before.focus()
    await userEvent.tab()

    expect(document.activeElement).toBe(ranger.get('input').element)
    expect(styleOf(ranger, '.ranger__thumb').outlineStyle).toBe('solid')
  })
})
