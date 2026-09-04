<script setup lang="ts" generic="V = unknown">
/**
 * A real `<input type="range">` — the **interaction engine** — laid over a
 * **presentation layer** built from ordinary elements. The engine owns keyboard,
 * pointer, touch, focus and form participation; the presentation layer owns
 * everything visible and holds no state of its own. See
 * docs/adr/0001-hybrid-native-range-input.md, and CONTEXT.md for the vocabulary.
 *
 * All value logic lives in `./axis`, so this file decides nothing about where a
 * thumb goes — including which kind of axis it is looking at, which it never
 * asks.
 */
import { computed, onBeforeUnmount, nextTick, shallowRef, useAttrs, watchEffect } from 'vue'
import type { StyleValue } from 'vue'
import {
  engineRange,
  engineToPosition,
  isEmptyAxis,
  placeStops,
  positionToEngine,
  positionToValue,
  resolve,
  resolveAxis,
  type Resolved,
} from './axis'
import { warn } from './diagnostics'
import { resolveGradient, tintAt, type Gradient } from './gradients'
import type { Stop } from './types'

defineOptions({ name: 'Ranger', inheritAttrs: false })

/** What `v-model` carries: a stop's own value, a number, or nothing (ADR-0003). */
type Model = V | number | null

const props = withDefaults(
  defineProps<{
    /**
     * `null` is unset, and `undefined` is "no `v-model`" — the difference is
     * what lets an unbound Ranger track its own value while a bound one that
     * starts at `null` stays controlled.
     */
    modelValue?: Model
    stops?: Stop<V>[]
    min?: number
    max?: number
    step?: number
    /**
     * A preset name, a list of colours, or any CSS gradient string. Left
     * `undefined` rather than defaulting to `'mood'` in so many words: the
     * stylesheet already paints mood, and not writing the token inline is what
     * keeps a consumer's own `--ranger-gradient` working (ADR-0004).
     */
    gradient?: Gradient
    disabled?: boolean
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
    name?: string
  }>(),
  {
    modelValue: undefined,
    stops: () => [],
    min: undefined,
    max: undefined,
    step: undefined,
    gradient: undefined,
    disabled: false,
    readonly: false,
    size: 'md',
    name: undefined,
  },
)

const emit = defineEmits<{
  /** Live, on every engine `input` — mid-drag included. Mirrors native. */
  'update:modelValue': [value: V | number]
  /** On commit. Carries the whole resolution, so nobody re-searches the stops. */
  change: [resolved: Resolved<V | number>]
}>()

const attrs = useAttrs()

/** Only used when there is no `v-model` to hold the value for us (ADR-0003). */
const internal = shallowRef<Model>(null)

const current = computed<Model>(() =>
  props.modelValue === undefined ? internal.value : props.modelValue,
)

// `V | number` throughout: an ordinal axis carries the stop's own value and a
// numeric one carries a number, and the model may be either.
const axis = computed(() =>
  resolveAxis<V | number>({
    stops: props.stops,
    min: props.min,
    max: props.max,
    step: props.step,
  }),
)

const resolved = computed(() => resolve(axis.value, current.value))

// Nothing to choose from means nothing to drag, so the engine is disabled too
// rather than being an empty control that still takes focus (spec §5.1).
const isDisabled = computed(() => props.disabled || isEmptyAxis(axis.value))

const range = computed(() => engineRange(axis.value))

/**
 * The engine cannot hold a value that is off its own grid, so this is where an
 * off-grid model value gets corrected — and the position the presentation layer
 * paints comes back out of the engine rather than around it, so the two can
 * never disagree (ADR-0001).
 */
const engineValue = computed(() => positionToEngine(axis.value, resolved.value.position))
const position = computed(() => engineToPosition(axis.value, engineValue.value))

const placed = computed(() => placeStops(axis.value))

/**
 * The whole colour system, as two strings. Nothing here reaches for the DOM, so
 * a Ranger is as colourful on the server as in the browser and no stylesheet is
 * ever generated — the vlider bug ADR-0001 exists to kill.
 */
const gradient = computed(() =>
  resolveGradient(
    props.gradient,
    placed.value.map((place) => ({ position: place.position, color: place.stop.color })),
  ),
)

/**
 * What the thumb tints to. Left unset while unset: there is no answer yet, so
 * there is nothing to tint from (ADR-0003).
 */
const activeColor = computed(() =>
  resolved.value.unset
    ? undefined
    : tintAt(gradient.value, position.value, resolved.value.nearest?.stop.color),
)

// Printing is the one thing the pure modules will not do for themselves, so
// that they stay pure and their diagnostics stay assertable as data.
watchEffect(() =>
  warn([...axis.value.diagnostics, ...resolved.value.diagnostics, ...gradient.value.diagnostics]),
)

const engine = shallowRef<HTMLInputElement | null>(null)
const dragging = shallowRef(false)

const rootStyle = computed<StyleValue>(() => [
  {
    '--ranger-position': String(position.value),
    // Both omitted rather than written empty: an inline style beats every
    // stylesheet, so a token nobody asked us to set stays the consumer's.
    '--ranger-gradient': gradient.value.css ?? undefined,
    '--ranger-active-color': activeColor.value,
  },
  attrs.style as StyleValue,
])

const stateAttrs = computed(() => ({
  'data-axis': axis.value.kind,
  'data-size': props.size,
  'data-unset': resolved.value.unset ? '' : undefined,
  'data-disabled': isDisabled.value ? '' : undefined,
  'data-readonly': props.readonly ? '' : undefined,
  'data-dragging': dragging.value ? '' : undefined,
}))

/** Everything the consumer passed except the two that belong on the root. */
const engineAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([name]) => name !== 'class' && name !== 'style'),
  ),
)

/**
 * The engine may be left holding a value we refused — a disabled stop, or a
 * change a controlled parent never wrote back. Vue will not patch it, because
 * from its point of view the bound value never changed, so it is corrected by
 * hand. The engine is the source of truth, and it is the one that loses.
 */
function syncEngine() {
  const el = engine.value
  if (el && el.value !== String(engineValue.value)) el.value = String(engineValue.value)
}

/** The value this interaction produced, boxed so `null` stays a real value. */
let pendingCommit: { value: Model } | null = null

function onInput(event: Event) {
  // `readonly` displays a value and refuses to change it, so the engine is put
  // straight back where it was. Unlike `disabled` it stays focusable and
  // announced - issue 07 owns the rest of the distinction.
  if (props.readonly) {
    void nextTick(syncEngine)
    return
  }

  const el = event.target as HTMLInputElement
  const at = engineToPosition(axis.value, el.valueAsNumber)
  const next = positionToValue(axis.value, at, current.value)

  // `null` here is "nowhere enabled to go", not "unset": interaction never
  // clears a Ranger, and `update:modelValue` never carries null.
  if (next !== null && !Object.is(next, current.value)) {
    if (props.modelValue === undefined) internal.value = next
    pendingCommit = { value: next }
    emit('update:modelValue', next)
  }

  void nextTick(syncEngine)
}

/**
 * Native `change` on a range input means "the drag ended" or "the keyboard
 * settled", so it is the commit — and it never fires on mount or on a prop
 * change, which is exactly what ADR-0003 asks for.
 */
function onChange() {
  if (!pendingCommit) return

  // Resolved from the value the interaction produced rather than from `props`,
  // which a controlled parent will not have flushed yet when a key press fires
  // `input` and `change` in the same task.
  const { value } = pendingCommit
  pendingCommit = null
  emit('change', resolve(axis.value, value))
}

/** Undoes the drag-end listeners; `null` when no drag is in flight. */
let endDrag: (() => void) | null = null

function onPointerDown() {
  if (endDrag) return

  const finish = () => {
    endDrag = null
    dragging.value = false
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
  }

  dragging.value = true
  endDrag = finish

  // A pointer can be released anywhere, so the end of a drag is a window-level
  // fact. Bound here rather than in setup, so nothing touches `window` during
  // server rendering.
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', finish)
}

onBeforeUnmount(() => endDrag?.())
</script>

<template>
  <div class="ranger" :class="attrs.class" :style="rootStyle" v-bind="stateAttrs">
    <div class="ranger__control">
      <div class="ranger__track" aria-hidden="true">
        <div class="ranger__fill" />
      </div>

      <ul class="ranger__stops" aria-hidden="true">
        <li
          v-for="place in placed"
          :key="place.index"
          class="ranger__stop"
          :style="{ '--ranger-stop-position': String(place.position) }"
        />
      </ul>

      <div class="ranger__thumb" aria-hidden="true" />

      <!--
        Order matters twice over. `v-bind` comes first so the axis owns
        min/max/step/value whatever the consumer passes; `:value` comes last so
        the browser has the range before it sanitises the value into it.
      -->
      <input
        ref="engine"
        v-bind="engineAttrs"
        type="range"
        class="ranger__engine"
        :name="name"
        :disabled="isDisabled"
        :min="range.min"
        :max="range.max"
        :step="range.step"
        :value="engineValue"
        @input="onInput"
        @change="onChange"
        @pointerdown="onPointerDown"
      />
    </div>
  </div>
</template>

<style src="./ranger.css"></style>
