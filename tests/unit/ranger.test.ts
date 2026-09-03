import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ranger } from '../../src/index'

const moods = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Expressionless' },
  { value: 'wow', label: 'Astonished' },
  { value: 'ugh', label: 'Confounded' },
  { value: 'okay', label: 'Okay?' },
  { value: 'blush', label: 'Blush' },
]

type Wrapper = ReturnType<typeof mount>

/** Drives the engine the way a browser does: move it, then tell the component. */
async function driveEngine(wrapper: Wrapper, engineValue: number) {
  const input = wrapper.get('input[type="range"]')
  ;(input.element as HTMLInputElement).value = String(engineValue)
  await input.trigger('input')
}

/** ...and then release, which is what a native range input calls a commit. */
async function commit(wrapper: Wrapper) {
  await wrapper.get('input[type="range"]').trigger('change')
}

function engineOf(wrapper: Wrapper) {
  return wrapper.get('input[type="range"]').element as HTMLInputElement
}

function positionOf(wrapper: Wrapper) {
  return wrapper.element.getAttribute('style')?.match(/--ranger-position:\s*([^;]+)/)?.[1]
}

beforeEach(() => {
  // The axis core complains about half-specified props by design; this suite
  // asserts behaviour, and issue 06 owns the warnings themselves.
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('structure', () => {
  it('renders a presentation layer and one engine', () => {
    const wrapper = mount(Ranger, { props: { stops: moods } })

    expect(wrapper.classes()).toContain('ranger')
    expect(wrapper.findAll('.ranger__track')).toHaveLength(1)
    expect(wrapper.findAll('.ranger__fill')).toHaveLength(1)
    expect(wrapper.findAll('.ranger__thumb')).toHaveLength(1)
    expect(wrapper.findAll('input[type="range"]')).toHaveLength(1)
  })

  it('gives the stop list one marker per stop', () => {
    const wrapper = mount(Ranger, { props: { stops: moods } })

    expect(wrapper.findAll('.ranger__stop')).toHaveLength(6)
  })

  it('hides every decorative node from assistive tech, leaving only the engine', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'wow' } })

    for (const selector of ['.ranger__track', '.ranger__stops', '.ranger__thumb']) {
      expect(wrapper.get(selector).attributes('aria-hidden')).toBe('true')
    }

    expect(wrapper.get('input[type="range"]').attributes('aria-hidden')).toBeUndefined()
  })

  it('has no `id` anywhere: the vlider bug that forced one is gone (ADR-0001)', () => {
    const wrapper = mount(Ranger, { props: { stops: moods } })

    expect(wrapper.html()).not.toMatch(/\sid=/)
  })
})

describe('attribute routing', () => {
  it('puts `class` and `style` on the root and everything else on the engine', () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods },
      attrs: { 'aria-label': 'Mood', class: 'custom', style: 'color: red', required: true },
    })

    expect(wrapper.classes()).toContain('custom')
    expect(wrapper.attributes('style')).toContain('color: red')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('required')).toBeUndefined()

    const engine = wrapper.get('input[type="range"]')
    expect(engine.attributes('aria-label')).toBe('Mood')
    expect(engine.attributes('required')).toBeDefined()
    expect(engine.classes()).not.toContain('custom')
  })

  it('merges its own style bindings with a consumer style attribute', () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, modelValue: 'blush' },
      attrs: { style: 'color: red' },
    })

    expect(positionOf(wrapper)).toBe('1')
    expect(wrapper.attributes('style')).toContain('color: red')
  })

  it('carries `name` on the engine, so a Ranger participates in a form', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, name: 'mood' } })

    expect(engineOf(wrapper).name).toBe('mood')
  })
})

describe('the engine, on an ordinal axis', () => {
  it('counts stops, so the value it carries is an index and v-model never is', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'wow' } })
    const engine = engineOf(wrapper)

    expect(engine.min).toBe('0')
    expect(engine.max).toBe('5')
    expect(engine.step).toBe('1')
    expect(engine.value).toBe('2')
  })

  it('puts the thumb where the axis says, at every stop', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })
    const expected = ['0', '0.2', '0.4', '0.6', '0.8', '1']

    for (const [index, stop] of moods.entries()) {
      await wrapper.setProps({ modelValue: stop.value })

      expect(positionOf(wrapper)).toBe(expected[index])
      expect(engineOf(wrapper).value).toBe(String(index))
    }
  })
})

describe('the engine, on a numeric axis', () => {
  it('takes the range itself', () => {
    const wrapper = mount(Ranger, { props: { min: 0, max: 100, step: 5, modelValue: 45 } })
    const engine = engineOf(wrapper)

    expect(engine.min).toBe('0')
    expect(engine.max).toBe('100')
    expect(engine.step).toBe('5')
    expect(engine.value).toBe('45')
    expect(positionOf(wrapper)).toBe('0.45')
  })

  it('renders pinned ticks and nothing else in the stop list', () => {
    const wrapper = mount(Ranger, {
      props: {
        min: 0,
        max: 100,
        stops: [
          { at: 0, label: 'Cold' },
          { at: 100, label: 'Hot' },
        ],
      },
    })

    expect(wrapper.findAll('.ranger__stop')).toHaveLength(2)
  })

  it('never disagrees with the engine about an off-grid value', () => {
    // 43 is not a value a step-5 input can hold. The engine wins, and the thumb
    // follows it rather than painting a position the engine is not at.
    const wrapper = mount(Ranger, { props: { min: 0, max: 100, step: 5, modelValue: 43 } })

    expect(engineOf(wrapper).value).toBe('45')
    expect(positionOf(wrapper)).toBe('0.45')
  })

  it('tells the developer when it had to move an off-grid value', async () => {
    // A fresh module, so the "already said that" memory in `warn` starts empty:
    // the test above already tripped this same complaint.
    vi.resetModules()
    const { Ranger: fresh } = await import('../../src/index')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(fresh, { props: { min: 0, max: 100, step: 5, modelValue: 43 } })

    // Correcting it silently would mean emitting on a prop change, which
    // ADR-0003 forbids - so the developer is told instead.
    expect(warn.mock.calls.some(([message]) => String(message).includes('value-off-step'))).toBe(
      true,
    )
  })
})

describe('state, as data attributes', () => {
  it('reports the axis it inferred', () => {
    expect(mount(Ranger, { props: { stops: moods } }).attributes('data-axis')).toBe('ordinal')
    expect(mount(Ranger, { props: { min: 0, max: 10 } }).attributes('data-axis')).toBe('numeric')
  })

  it('reports size, disabled and readonly', () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, size: 'lg', disabled: true, readonly: true },
    })

    expect(wrapper.attributes('data-size')).toBe('lg')
    expect(wrapper.attributes('data-disabled')).toBeDefined()
    expect(wrapper.attributes('data-readonly')).toBeDefined()
    expect(engineOf(wrapper).disabled).toBe(true)
  })

  it('refuses every value change while readonly, but stays focusable', async () => {
    const wrapper = mount(Ranger, {
      props: { stops: moods, readonly: true, modelValue: 'angry' },
      attachTo: document.body,
    })

    await driveEngine(wrapper, 4)
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(engineOf(wrapper).value).toBe('0')

    // Unlike `disabled`, it can still be reached and announced (spec 5.2).
    expect(engineOf(wrapper).disabled).toBe(false)
    engineOf(wrapper).focus()
    expect(document.activeElement).toBe(engineOf(wrapper))

    wrapper.unmount()
  })

  it('defaults to `md` and carries no state attribute it has no state for', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh' } })

    expect(wrapper.attributes('data-size')).toBe('md')
    expect(wrapper.attributes('data-disabled')).toBeUndefined()
    expect(wrapper.attributes('data-readonly')).toBeUndefined()
    expect(wrapper.attributes('data-unset')).toBeUndefined()
    expect(wrapper.attributes('data-dragging')).toBeUndefined()
  })

  it('disables an axis that is neither stops nor a range, so there is nothing to drag', () => {
    const wrapper = mount(Ranger)

    expect(wrapper.attributes('data-disabled')).toBeDefined()
    expect(engineOf(wrapper).disabled).toBe(true)
  })

  it('marks a drag while the pointer is down, and stops when it is released', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods }, attachTo: document.body })

    await wrapper.get('input[type="range"]').trigger('pointerdown')
    expect(wrapper.attributes('data-dragging')).toBeDefined()

    window.dispatchEvent(new Event('pointerup'))
    await nextTick()
    expect(wrapper.attributes('data-dragging')).toBeUndefined()

    wrapper.unmount()
  })
})

describe('the unset state (ADR-0003)', () => {
  it('parks at the start rather than the midpoint, and says so', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: null } })

    // vlider handed null to a native input, which coerced it to the midpoint:
    // an unanswered question rendered as a deliberate neutral answer.
    expect(engineOf(wrapper).value).toBe('0')
    expect(positionOf(wrapper)).toBe('0')
    expect(wrapper.attributes('data-unset')).toBeDefined()
  })

  it('is distinguishable from having chosen the first stop', () => {
    const chosen = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    expect(positionOf(chosen)).toBe('0')
    expect(chosen.attributes('data-unset')).toBeUndefined()
  })

  it('renders unset on a numeric axis too, without parking at the midpoint', () => {
    const wrapper = mount(Ranger, { props: { min: 20, max: 80, modelValue: null } })

    expect(wrapper.attributes('data-unset')).toBeDefined()
    expect(engineOf(wrapper).value).toBe('20')
    expect(positionOf(wrapper)).toBe('0')
  })
})

describe('emitting', () => {
  it('emits nothing on mount', () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: null } })

    expect(wrapper.emitted()).toEqual({})
  })

  it('emits nothing when the value changes from outside', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: null } })

    await wrapper.setProps({ modelValue: 'wow' })

    expect(wrapper.emitted()).toEqual({})
  })

  it('emits the stop value live, on every engine input', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await driveEngine(wrapper, 2)

    expect(wrapper.emitted('update:modelValue')).toEqual([['wow']])
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('emits a resolved payload on commit', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await driveEngine(wrapper, 5)
    await wrapper.setProps({ modelValue: 'blush' })
    await commit(wrapper)

    expect(wrapper.emitted('change')?.[0]?.[0]).toMatchObject({
      value: 'blush',
      index: 5,
      position: 1,
      unset: false,
      stop: { value: 'blush', label: 'Blush' },
    })
  })

  it('commits the value the interaction produced, not the one the props still hold', async () => {
    // Keyboard fires input and change back to back, before a parent's prop
    // update has had any chance to flush.
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await driveEngine(wrapper, 3)
    await commit(wrapper)

    expect(wrapper.emitted('change')?.[0]?.[0]).toMatchObject({ value: 'ugh', index: 3 })
  })

  it('emits nothing on commit when no interaction moved the value', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'meh' } })

    await commit(wrapper)

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('emits a number, not an index, on a numeric axis', async () => {
    const wrapper = mount(Ranger, { props: { min: 0, max: 100, step: 5, modelValue: 0 } })

    await driveEngine(wrapper, 45)

    expect(wrapper.emitted('update:modelValue')).toEqual([[45]])
  })
})

describe('uncontrolled use', () => {
  it('starts unset and then tracks its own value', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods } })

    expect(wrapper.attributes('data-unset')).toBeDefined()

    await driveEngine(wrapper, 4)

    expect(wrapper.attributes('data-unset')).toBeUndefined()
    expect(positionOf(wrapper)).toBe('0.8')
    expect(engineOf(wrapper).value).toBe('4')
  })
})

describe('the engine is the only source of truth', () => {
  it('snaps back when a controlled parent refuses the change', async () => {
    const wrapper = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await driveEngine(wrapper, 4)
    await nextTick()

    // The parent never wrote the emitted value back, so the model still says
    // `angry`. The engine must not be left sitting at 4.
    expect(engineOf(wrapper).value).toBe('0')
    expect(positionOf(wrapper)).toBe('0')
  })

  it('settles a drag that lands on a disabled stop, and moves the engine with it', async () => {
    const gapped = [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }]
    const wrapper = mount(Ranger, { props: { stops: gapped, modelValue: 'a' } })

    await driveEngine(wrapper, 1)
    await wrapper.setProps({ modelValue: 'c' })
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    expect(engineOf(wrapper).value).toBe('2')
  })

  it('stays put when nothing enabled lies in the direction of travel', async () => {
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

describe('two Rangers on one page', () => {
  it('do not interfere, and write nothing to document.head (ADR-0001)', async () => {
    const headBefore = document.head.innerHTML

    const first = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })
    const second = mount(Ranger, { props: { stops: moods, modelValue: 'angry' } })

    await driveEngine(first, 5)
    await first.setProps({ modelValue: 'blush' })

    expect(positionOf(first)).toBe('1')
    expect(positionOf(second)).toBe('0')
    expect(second.emitted()).toEqual({})
    expect(document.head.innerHTML).toBe(headBefore)
  })
})

describe('server rendering', () => {
  it('renders to a string with no DOM access at all', async () => {
    const app = createSSRApp({
      render: () => h(Ranger, { stops: moods, modelValue: 'wow', 'aria-label': 'Mood' }),
    })

    const html = await renderToString(app)

    expect(html).toContain('type="range"')
    expect(html).toContain('data-axis="ordinal"')
    expect(html).toContain('--ranger-position:0.4')
    expect(html).toContain('aria-label="Mood"')
    expect(html).toContain('value="2"')
  })
})

describe('the stylesheet', () => {
  // Read from disk rather than imported: vitest stubs CSS imports out, and the
  // point of these three is the text of the stylesheet itself. Comments are
  // stripped, so a rule these tests forbid cannot pass by being explained.
  const css = readFileSync(join(process.cwd(), 'src/ranger.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )

  it('uses logical properties only, so RTL works without a second stylesheet', () => {
    expect(css).not.toMatch(/(^|[^-])\b(left|right):/m)
  })

  it('keeps the engine invisible without making it unfocusable (ADR-0001)', () => {
    expect(css).toMatch(/opacity:\s*0/)
    expect(css).not.toMatch(/display:\s*none/)
    expect(css).not.toMatch(/visibility:\s*hidden/)
  })

  it('takes the pointer away from the decorative nodes', () => {
    expect(css).toMatch(/pointer-events:\s*none/)
  })
})
