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
  type Placed,
  positionToEngine,
  positionToValue,
  resolve,
  resolveAxis,
  type Resolved,
} from './axis'
import { warn, type Diagnostic } from './diagnostics'
import { resolveGradient, tintAt, type Gradient } from './gradients'
import type { Stop, StopScope } from './types'

defineOptions({ name: 'Ranger', inheritAttrs: false })

/** What `v-model` carries: a stop's own value, a number, or nothing (ADR-0003). */
type Model = V | number | null

/**
 * Which side of the track something sits on. `above` and `below` are the words
 * spec §4.3 uses, and they mean the block-start and block-end edges — so a
 * Ranger in a vertical writing mode puts its labels where that mode's "above"
 * is (ADR-0004).
 */
type Side = 'above' | 'below'

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
    showLabels?: boolean
    showIcons?: boolean
    labelPosition?: Side
    iconPosition?: Side
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
    showLabels: true,
    showIcons: true,
    labelPosition: 'above',
    iconPosition: 'below',
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

/** Spec §4.5's scope, with the axis's own value type filled in. */
type Scope = StopScope<V | number>

const slots = defineSlots<{
  /** The whole label + icon block for a stop. */
  stop?: (scope: Scope) => unknown
  label?: (scope: Scope) => unknown
  icon?: (scope: Scope) => unknown
  thumb?: (scope: { position: number; stop: Stop<V | number> | null; unset: boolean }) => unknown
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

/**
 * An image with nothing to describe it. Raised here rather than in `resolveAxis`
 * because `alt` is a presentation concern the axis has no opinion about, and
 * indexed into the stops the consumer passed rather than the placed ones, so the
 * number in the message is the one they can count to.
 */
const stopDiagnostics = computed<Diagnostic[]>(() =>
  props.stops.flatMap((stop, index) =>
    stop.image !== undefined && stop.alt === undefined && stop.label === undefined
      ? [{ code: 'image-without-alt' as const, index }]
      : [],
  ),
)

// Printing is the one thing the pure modules will not do for themselves, so
// that they stay pure and their diagnostics stay assertable as data.
watchEffect(() =>
  warn([
    ...axis.value.diagnostics,
    ...resolved.value.diagnostics,
    ...gradient.value.diagnostics,
    ...stopDiagnostics.value,
  ]),
)

/**
 * One **stop block** (CONTEXT.md): one stop's label and icon on one side of the
 * track. A stop earns a block only where it has something to show, so a Ranger
 * with no labels and no icons is exactly as tall as its track.
 */
interface StopBlock {
  place: Placed<V | number>
  side: Side
  selected: boolean
  disabled: boolean
  /** Which parts this block draws. `whole` is the `stop` slot taking all of it. */
  label: boolean
  icon: boolean
  whole: boolean
}

function hasIcon(stop: Stop<V | number>): boolean {
  return stop.icon !== undefined || stop.image !== undefined
}

/**
 * Read on every render rather than cached in a computed: a parent may add or
 * drop a slot (`<template v-if="…" #stop>`), and a cached answer would go on
 * rendering the block the consumer just took over. Two calls over a handful of
 * stops is not a cost worth being wrong for.
 */
function blocksOn(side: Side): StopBlock[] {
  // The `stop` slot replaces the whole label + icon block, so the default parts
  // are off everywhere while it is supplied, and its single block goes on the
  // label's side — `iconPosition` has nothing left to place.
  const replaced = slots.stop !== undefined
  const whole = replaced && props.labelPosition === side
  const labelled = !replaced && props.showLabels && props.labelPosition === side
  const iconned = !replaced && props.showIcons && props.iconPosition === side

  return placed.value
    .map((place) => ({
      place,
      side,
      selected: place.index === resolved.value.index,
      // What the button's own `disabled` says, so the scope a consumer styles
      // from and the control they click can never disagree.
      disabled: isDisabled.value || place.stop.disabled === true,
      // A slot may draw a part the stop carries no data for, so its presence
      // is reason enough to give that part a block.
      label: labelled && (slots.label !== undefined || place.stop.label !== undefined),
      icon: iconned && (slots.icon !== undefined || hasIcon(place.stop)),
      whole,
    }))
    .filter((block) => block.whole || block.label || block.icon)
}

/** Both sides at once: the row each block lands in is CSS's business, not the
 * template's, so one loop draws them all. */
function blocks(): StopBlock[] {
  return [...blocksOn('above'), ...blocksOn('below')]
}

function scopeOf(block: StopBlock): Scope {
  return {
    stop: block.place.stop,
    index: block.place.index,
    selected: block.selected,
    // What the button's own `disabled` says, so the scope a consumer styles
    // from and the control they click can never disagree. The stop is in the
    // scope too, for anyone needing its own flag apart from the whole Ranger's.
    disabled: block.disabled,
    position: block.place.position,
  }
}

const engine = shallowRef<HTMLInputElement | null>(null)
const dragging = shallowRef(false)

const rootStyle = computed<StyleValue>(() => [
  {
    '--ranger-position': String(position.value),
    // Every label and icon block is one slice of the track wide, which is what
    // makes a long label wrap instead of running into its neighbour.
    '--ranger-stop-count': String(Math.max(1, placed.value.length)),
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

/**
 * The one door a new value leaves by, whether a drag, a key or a click brought
 * it. `null` is "nowhere enabled to go", not "unset": interaction never clears a
 * Ranger, and `update:modelValue` never carries null. Returns whether anything
 * moved, which is what both callers need before deciding to commit.
 */
function offer(next: V | number | null): boolean {
  if (next === null || Object.is(next, current.value)) return false

  if (props.modelValue === undefined) internal.value = next
  emit('update:modelValue', next)

  return true
}

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

  if (offer(next)) pendingCommit = { value: next }

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

/**
 * Click-to-jump (spec §5.3). A label or icon is a shortcut to a stop, not a
 * second control: it moves the value and hands the keyboard straight back to
 * the engine, which is the only thing on the page that owns it (ADR-0001).
 */
function jumpTo(block: StopBlock) {
  if (block.disabled) return

  // Before the readonly check: the click landed on the control, so focus
  // belongs to it either way. A readonly Ranger is focusable (spec §5.2).
  engine.value?.focus()
  if (props.readonly) return

  const next = positionToValue(axis.value, block.place.position, current.value)

  // Nothing moved, so nothing to commit — the rule native `change` keeps, and
  // the one `onChange` keeps when no interaction produced a value.
  if (!offer(next)) return

  // A click is its own commit: the engine never saw this one, so it will not
  // fire the native `change` that `onChange` is waiting for.
  emit('change', resolve(axis.value, next))

  void nextTick(syncEngine)
}

onBeforeUnmount(() => endDrag?.())
</script>

<template>
  <div class="ranger" :class="attrs.class" :style="rootStyle" v-bind="stateAttrs">
    <!--
      Decoration, like everything outside the engine: a screen reader is given
      the scale by the engine's own announcement, and reading every label a
      second time would be the noise ADR-0001 exists to avoid. `tabindex="-1"`
      keeps a block clickable without adding a tab stop (spec §5.3), and a
      disabled stop is a disabled button, so it does not respond at all.

      Both sides come out of one loop because neither is a container: the
      stylesheet puts each block in its own grid row from `data-side`.
    -->
    <button
      v-for="block in blocks()"
      :key="`${block.side}-${block.place.index}`"
      type="button"
      tabindex="-1"
      class="ranger__stop-block"
      aria-hidden="true"
      :data-side="block.side"
      :disabled="block.disabled"
      :data-selected="block.selected ? '' : undefined"
      :style="{ '--ranger-stop-position': String(block.place.position) }"
      @click="jumpTo(block)"
    >
      <slot v-if="block.whole" name="stop" v-bind="scopeOf(block)" />

      <template v-else>
        <span v-if="block.label" class="ranger__label">
          <slot name="label" v-bind="scopeOf(block)">{{ block.place.stop.label }}</slot>
        </span>

        <span v-if="block.icon" class="ranger__icon">
          <slot name="icon" v-bind="scopeOf(block)">
            <img
              v-if="block.place.stop.image !== undefined"
              :src="block.place.stop.image"
              :alt="block.place.stop.alt ?? block.place.stop.label ?? ''"
            />
            <!-- A unicode icon is a text node and nothing else: no font is
                 ever asked for, which is goal 1 of the spec. -->
            <template v-else-if="typeof block.place.stop.icon === 'string'">
              {{ block.place.stop.icon }}
            </template>
            <component
              :is="block.place.stop.icon"
              v-else-if="block.place.stop.icon !== undefined"
            />
          </slot>
        </span>
      </template>
    </button>

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

      <div class="ranger__thumb" aria-hidden="true">
        <slot name="thumb" :position="position" :stop="resolved.stop" :unset="resolved.unset" />
      </div>

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
