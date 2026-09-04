// The other resolution the acceptance criteria names: `v-ranger/full` alone,
// no explicit `v-ranger/style.css` anywhere in this entry's graph. This is
// exactly the entry Webpack's `sideEffects` field tree-shook to 0 bytes
// before `package.json` listed `dist/full.js`/`dist/full.cjs` explicitly —
// mounting a real component here, not just importing the binding, is what
// makes that regression visible again if it comes back.
import { createApp, h, ref } from 'vue'
import { Ranger } from 'v-ranger/full'

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Meh', icon: '😑' },
  { value: 'wow', label: 'Wow', icon: '😲' },
]

createApp({
  setup() {
    // Not null: an unset Ranger deliberately paints no gradient (ADR-0003),
    // and this app exists to prove the stylesheet applied.
    const mood = ref('wow')

    return () =>
      h(Ranger, {
        modelValue: mood.value,
        'onUpdate:modelValue': (value) => {
          mood.value = value
        },
        stops: moods,
        'aria-label': 'Mood',
      })
  },
}).mount('#app')
