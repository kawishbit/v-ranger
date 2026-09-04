# SSR / Nuxt 3

No `window` or `document` access happens during setup or render, so server rendering and
hydration are both safe with no special handling. `renderToString` produces the full
markup, including inline `--ranger-*` styles and the gradient, entirely from props.

## Plain Vue SSR

```ts
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Ranger } from 'v-ranger'

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'wow', label: 'Wow', icon: '😲' },
]

const app = createSSRApp({
  render: () => h(Ranger, { stops: moods, modelValue: 'wow', 'aria-label': 'Mood' }),
})

const html = await renderToString(app)
```

## Nuxt 3

Register the stylesheet as global CSS in `nuxt.config.ts`, rather than importing it
inside a component — that way it is present on the very first server-rendered response,
instead of arriving after hydration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['v-ranger/style.css'],
})
```

Then use `<Ranger>` in any page or component, exactly as in a plain Vue app:

```vue
<!-- app.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from 'v-ranger'

const mood = ref<'angry' | 'meh' | 'wow' | null>(null)
const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Meh', icon: '😑' },
  { value: 'wow', label: 'Wow', icon: '😲' },
]
</script>

<template>
  <Ranger v-model="mood" :stops="moods" aria-label="Mood" />
</template>
```

No `<ClientOnly>` wrapper needed. A real Nuxt 3 app built from exactly this shape,
installing `v-ranger` from a packed tarball rather than a workspace link, is one of this
project's own packaging smoke tests (`examples/nuxt/`) — its server-rendered HTML is
diffed against the client's hydrated DOM on every run, and the build fails on a mismatch.

## Why this works with no extra configuration

- `resolveAxis`, `resolve` and every other value computation are pure functions over
  props — no DOM, no `window`, callable identically on the server.
- The gradient and every geometry value are written as inline `--ranger-*` custom
  properties, computed from props alone — nothing waits for a browser to paint.
- The one thing a native `<input>`'s hydration depends on — its `value` attribute
  matching what the client will compute — is derived the same way on both sides, from
  the same axis math.
