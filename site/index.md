---
layout: home
title: v-ranger
hero:
  name: v-ranger
  text: A colourful, emotive Ranger for Vue 3.
  tagline: Real keyboard and touch support, WCAG 2.2 AA, RTL, SSR-safe — restyleable from one CSS custom property.
  actions:
    - theme: brand
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: Live playground
      link: /playground
features:
  - icon: ⌨️
    title: A real interaction engine
    details: A native input[type=range] under the hood — full keyboard, pointer, touch and screen-reader support, for free.
  - icon: 🎨
    title: One CSS custom property
    details: No Sass, no theme classes, no build step. Restyle any part from any ancestor.
  - icon: ♿
    title: WCAG 2.2 AA
    details: Real aria-valuetext, 3:1 focus-ring contrast against every default ramp colour, and RTL support that reverses the keyboard too.
  - icon: 🌐
    title: SSR-safe
    details: No window or document access during setup or render — renderToString and hydration both just work.
---

<script setup lang="ts">
import { ref } from 'vue'

const mood = ref<'angry' | 'meh' | 'wow' | 'ugh' | 'okay' | 'blush' | null>(null)
const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Expressionless', icon: '😑' },
  { value: 'wow' as const, label: 'Astonished', icon: '😲' },
  { value: 'ugh' as const, label: 'Confounded', icon: '😖' },
  { value: 'okay' as const, label: 'Okay?', icon: '🤨' },
  { value: 'blush' as const, label: 'Blush', icon: '😊' },
]
</script>

<div style="max-width: 640px; margin: 3rem auto; padding: 0 1.5rem;">

Drag it. Tab to it and use the arrow keys. This is a live component, not a screenshot.

<div class="ranger-demo">
  <Ranger v-model="mood" :stops="moods" gradient="mood" aria-label="Mood" />
</div>

```sh
npm install v-ranger
```

</div>
