<!--
  Not run, not mounted — only ever type-checked, by `npm run verify:types`
  (`scripts/verify-types.mjs`), and against `../dist`, not `../src`: the
  ticket asks for types "verified from a consumer's perspective," which means
  the emitted declarations a real `npm install` hands out, not the source
  they were generated from. Run `npm run build` first. The claim this file
  exists to make is spec §4.2's: props, emits and slots all infer from a
  consumer's own generic, with no cast anywhere below.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../dist'
import type { Resolved, Stop } from '../dist'

type Mood = 'angry' | 'meh' | 'wow'

const stops: Stop<Mood>[] = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Meh', icon: '😑' },
  { value: 'wow', label: 'Wow', icon: '😲' },
]

// `v-model` narrows to `Mood | null` from `stops` alone - nothing here names
// `Mood` a second time for the component to agree with.
const mood = ref<Mood | null>(null)

function onUpdate(value: Mood | number) {
  const narrowed: Mood | number = value
  void narrowed
}

function onChange(resolved: Resolved<Mood | number>) {
  const narrowed: Mood | number | null = resolved.value
  void narrowed
}
</script>

<template>
  <Ranger
    v-model="mood"
    :stops="stops"
    aria-label="Mood"
    @update:model-value="onUpdate"
    @change="onChange"
  >
    <template #label="{ stop, selected, disabled, index, position }">
      {{ stop.label }} {{ selected }} {{ disabled }} {{ index }} {{ position }}
    </template>
    <template #icon="{ stop }">{{ stop.icon }}</template>
    <template #thumb="{ position, stop, unset }"
      >{{ position }} {{ stop?.label }} {{ unset }}</template
    >
  </Ranger>
</template>
