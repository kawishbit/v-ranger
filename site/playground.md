<script setup lang="ts">
import { ref, computed } from 'vue'

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

const value = ref<string | null>(null)
const gradient = ref('mood')
const size = ref<'sm' | 'md' | 'lg'>('md')
const labelPosition = ref<'above' | 'below'>('above')
const iconPosition = ref<'above' | 'below'>('below')
const showLabels = ref(true)
const showIcons = ref(true)
const disabled = ref(false)
const readonly = ref(false)

const lastChange = ref('—')

const props = computed(() => ({
  stops: moods,
  gradient: gradient.value,
  size: size.value,
  labelPosition: labelPosition.value,
  iconPosition: iconPosition.value,
  showLabels: showLabels.value,
  showIcons: showIcons.value,
  disabled: disabled.value,
  readonly: readonly.value,
}))
</script>

# Live playground

Every prop below drives the same Ranger. Change one, watch it react — this is a faster
way to learn the props table than reading the props table.

<div class="ranger-demo">
  <Ranger
    v-model="value"
    v-bind="props"
    aria-label="Mood"
    @change="lastChange = String($event.value)"
  />
  <p class="ranger-demo__value">
    v-model: {{ value ?? 'null (unset)' }} — last `change`: {{ lastChange }}
  </p>
</div>

<div class="ranger-demo">
  <p>
    <label><strong>gradient</strong>
      <select v-model="gradient">
        <option value="mood">mood</option>
        <option value="sunset">sunset</option>
        <option value="ocean">ocean</option>
        <option value="heat">heat</option>
        <option value="mono">mono</option>
      </select>
    </label>
  </p>

  <p>
    <label><strong>size</strong>
      <select v-model="size">
        <option value="sm">sm</option>
        <option value="md">md</option>
        <option value="lg">lg</option>
      </select>
    </label>
  </p>

  <p>
    <label><strong>labelPosition</strong>
      <select v-model="labelPosition">
        <option value="above">above</option>
        <option value="below">below</option>
      </select>
    </label>
  </p>

  <p>
    <label><strong>iconPosition</strong>
      <select v-model="iconPosition">
        <option value="above">above</option>
        <option value="below">below</option>
      </select>
    </label>
  </p>

  <p>
    <label><input type="checkbox" v-model="showLabels" /> showLabels</label>
    &nbsp;&nbsp;
    <label><input type="checkbox" v-model="showIcons" /> showIcons</label>
    &nbsp;&nbsp;
    <label><input type="checkbox" v-model="disabled" /> disabled</label>
    &nbsp;&nbsp;
    <label><input type="checkbox" v-model="readonly" /> readonly</label>
  </p>
</div>

See the [props table](./quickstart), [gradients](./gradients) and [tokens](./tokens)
pages for what each of these means and what else there is to set from CSS instead of a
prop.
