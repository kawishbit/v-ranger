<script setup lang="ts">
import { ref } from 'vue'

const magenta = ref<'angry' | 'meh' | 'wow' | 'ugh' | 'okay' | 'blush' | null>('wow')
const magentaStops = [
  { value: 'angry' as const, label: 'Angry', icon: '😠', color: '#ffc300' },
  { value: 'meh' as const, label: 'Expressionless', icon: '😑', color: '#ffb0fe' },
  { value: 'wow' as const, label: 'Astonished', icon: '😲', color: '#ff6bd6' },
  { value: 'ugh' as const, label: 'Confounded', icon: '😖', color: '#ff9d76' },
  { value: 'okay' as const, label: 'Okay?', icon: '🤨', color: '#51eaea' },
  { value: 'blush' as const, label: 'Blush', icon: '😊', color: '#fb3569' },
]

const mono = ref<number | null>(50)
const dark = ref<'angry' | 'wow' | null>('wow')
const darkStops = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]
</script>

# Recipes

## The magenta original

vlider's exact look, colour for colour — a per-stop `color` reproducing its ramp, on the
same six-emotion scale.

<div class="ranger-demo">
  <Ranger v-model="magenta" :stops="magentaStops" aria-label="Mood" />
</div>

<<< ./snippets/recipes-magenta.vue

## Minimal monochrome

A plain numeric Ranger with the `mono` preset and no labels at all — just a track, a
thumb, and the two end ticks.

<div class="ranger-demo" style="--ranger-thumb-size: 1rem; --ranger-track-height: 0.25rem;">
  <Ranger v-model="mono" :min="0" :max="100" gradient="mono" :show-labels="false" :show-icons="false" aria-label="Volume" />
</div>

```vue
<Ranger
  v-model="volume"
  :min="0"
  :max="100"
  gradient="mono"
  :show-labels="false"
  :show-icons="false"
/>
```

## A dark surface

`data-theme="dark"` on the card, set once, is the whole recipe — every token the dark
scheme touches (surface, track, both label colours, the focus ring) resolves together
from it, the same way it would under `prefers-color-scheme: dark`. Setting the individual
colour tokens by hand instead is the mistake to avoid here: it is easy to move the
surface and the track and forget `--ranger-label-color-selected`, which leaves the
selected label's default light-mode colour sitting almost invisibly on the new dark
background.

<div class="ranger-demo" data-theme="dark" style="background: #0a0a0a; padding: 1.5rem; border-radius: 8px;">
  <Ranger v-model="dark" :stops="darkStops" aria-label="Mood" />
</div>

```vue
<div data-theme="dark" style="background: #0a0a0a;">
  <Ranger v-model="mood" :stops="moods" />
</div>
```

This is the right call for a card that is dark regardless of the reader's own OS
setting — the media query answers "what does the reader prefer", not "what colour is
this particular box." Reach for the individual tokens instead only when the card's dark
surface isn't literally `#0a0a0a`/`#262626` — the two `--ranger-*` defaults `data-theme`
resolves to.
