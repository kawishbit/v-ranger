import { createApp, h, ref } from 'vue'
import { Ranger } from 'v-ranger'
import 'v-ranger/style.css'

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
