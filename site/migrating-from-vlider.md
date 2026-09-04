# Migrating from vlider

v-ranger reproduces vlider's look — the gradient track, the labels, the emoji icons —
with a clean-break API. Nothing here is a drop-in shim; every row below is a real change
to make.

| vlider                     | v-ranger                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vliderData` prop          | `stops` prop — same shape, same purpose                                                                                                                                          |
| `id` prop                  | Removed entirely. It existed so two vliders on one page didn't overwrite each other's generated `<style>` element; v-ranger generates none, so there is nothing to disambiguate. |
| Selection by 1-based index | Selection by the stop's own `value`, through `v-model`. Give each stop a unique `value` and bind `v-model` to it — there is no index to track yourself.                          |
| `theme` prop               | `--ranger-*` custom properties, set from any ancestor — see the [tokens reference](./tokens). No theme names to pick between; set exactly the properties you want to change.     |
| Per-item `extras`          | Whatever else you put on the stop object itself. A stop is a plain object — add fields to it and read them back from any slot's scope.                                           |
| `#bullet` slot             | `#stop` slot — scope `{ stop, index, selected, disabled, position }` — replaces the whole label + icon block, not just the marker dot.                                           |

## A worked example

vlider:

```vue
<Vlider
  id="mood-slider"
  :vlider-data="[
    { icon: '😠', text: 'Angry', theme: '#ffc300' },
    { icon: '😲', text: 'Wow', theme: '#ff6bd6' },
  ]"
  v-model="index"
/>
```

v-ranger:

```vue
<script setup lang="ts">
import { ref } from 'vue'
const mood = ref<'angry' | 'wow' | null>(null)
</script>

<template>
  <Ranger
    v-model="mood"
    :stops="[
      { value: 'angry', label: 'Angry', icon: '😠', color: '#ffc300' },
      { value: 'wow', label: 'Wow', icon: '😲', color: '#ff6bd6' },
    ]"
  />
</template>
```

The differences, line by line: no `id`; `v-model` carries `'angry' | 'wow' | null`
instead of a numeric index — `null` while nothing is chosen, which vlider had no way to
express and instead rendered as if the first item were selected; `theme` is now `color`,
read per-stop rather than parsed from a separate prop; and the component tag itself is
`<Ranger>`.

## What has no equivalent, on purpose

- **The generated `<style id="...">` element vlider wrote per instance.** Gone along
  with `id` — it was the source of the bug two same-page vliders could trigger by
  overwriting each other's stylesheet, recorded in this project's own ADR-0001.
- **An implicit "first item selected" starting state.** v-ranger starts `null` (unset)
  unless you give `v-model` a real starting value — deliberately, so an unanswered
  question never reads as a deliberate answer.
