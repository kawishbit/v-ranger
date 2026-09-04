// A separate page, importing only `v-ranger/full` — no explicit
// `v-ranger/style.css` anywhere in this entry's graph. If the stylesheet's
// side effect were ever tree-shaken away (as it was under Webpack, caught by
// examples/webpack), this page renders with no gradient and no track height.
import { createApp, h, ref } from 'vue'
import { Ranger } from 'v-ranger/full'

const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Meh', icon: '😑' },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]

createApp({
  setup() {
    // Not null: an unset Ranger deliberately paints no gradient (ADR-0003),
    // and this page exists to prove the stylesheet applied.
    const mood = ref<'angry' | 'meh' | 'wow' | null>('wow')

    return () =>
      h(Ranger, {
        modelValue: mood.value,
        'onUpdate:modelValue': (value: unknown) => {
          mood.value = value as typeof mood.value
        },
        stops: moods,
        'aria-label': 'Mood',
      })
  },
}).mount('#app')
