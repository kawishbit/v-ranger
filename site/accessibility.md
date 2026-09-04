<script setup lang="ts">
import { ref } from 'vue'

const mood = ref<'angry' | 'meh' | 'wow' | null>('wow')
const stops = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Meh', icon: '😑', disabled: true },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]
</script>

# Accessibility

A Ranger's interaction engine is a real `<input type="range">` — everything a native
range input already does correctly, it still does. Everything a native range input
cannot say on its own is what the rest of this page covers.

## What a screen reader actually says

Tab to the Ranger below (or click it, then press <kbd>Home</kbd>) and turn on a screen
reader if you have one running.

<div class="ranger-demo">
  <Ranger v-model="mood" :stops="stops" aria-label="Mood" />
</div>

A native range input announces a number. That is not an answer, so the component
overrides it with `aria-valuetext`:

- Set: **"Wow, 3 of 3"** — the stop's own label, then its position among the choices.
- Unset: **"No selection"**.
- On a numeric axis between ticks: the number itself, since there is no stop label to
  read instead — e.g. **"62"**, or **"Cold, 0"** exactly on a tick.
- Disabled stop, reached by a screen reader's own browsing (not by the Ranger's
  keyboard path, which skips it): **"Meh, unavailable, 2 of 3"**.

## Keyboard

Entirely the platform's own: <kbd>←</kbd>/<kbd>→</kbd>/<kbd>↑</kbd>/<kbd>↓</kbd> step by
one, <kbd>Home</kbd>/<kbd>End</kbd> jump to the extremes, <kbd>Page Up</kbd>/<kbd>Page
Down</kbd> take a larger step. A disabled stop is skipped in the direction of travel; if
none is enabled that way, the value does not move. Under `dir="rtl"`, the arrow keys
reverse to match the visual direction, exactly as a native range input already does.

## Naming the control

A Ranger with no name announces as "slider" and nothing else — the one failure the
component cannot fix on your behalf, because the name has to come from outside. Set one
of:

```vue
<Ranger v-model="mood" :stops="moods" aria-label="Mood" />
<Ranger v-model="mood" :stops="moods" aria-labelledby="mood-heading" />
<label>Mood <Ranger v-model="mood" :stops="moods" /></label>
```

A Ranger with none of the three warns about it in development.

## Contrast

Every colour pairing the focus ring can land on — the default surface, the default
track, and each of the six default ramp colours — clears WCAG 2.2's 3:1 non-text
contrast requirement, at every size. This is why the ring's default is the colour
scheme's own extreme (near-black on light, near-white on dark) rather than an accent
colour: an accent has to be checked against a ramp it does not control, and a Ranger's
ramp is arbitrary. If your own `--ranger-focus-color` or gradient defeats this, that
combination is yours to re-check.

A disabled stop is never marked by colour alone either — its label is struck through, in
addition to the fade.

## Motion

`prefers-reduced-motion: reduce` turns off every transition on a Ranger, not only the
thumb's colour — vlider's original hardcoded a 400ms transition on everything, with no
way to ask it to stop.

## Touch targets

Every stop's label/icon block is at least 24×24px, the WCAG 2.2 target size — even where
the slices are narrower than that, in which case neighbouring blocks begin to touch
rather than leaving a stop unreachable.
