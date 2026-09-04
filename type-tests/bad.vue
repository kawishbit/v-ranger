<!--
  The negative half of `good.vue`: proof that the inference it relies on is
  real rather than `any` in a trenchcoat. `npm run verify:types` asserts this
  file fails to type-check - if it ever starts passing, `v-model`'s narrowing
  to the stop values has quietly gone missing and `good.vue` was never testing
  anything.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../dist'
import type { Stop } from '../dist'

type Mood = 'angry' | 'meh' | 'wow'

const stops: Stop<Mood>[] = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Meh' },
  { value: 'wow', label: 'Wow' },
]

// A boolean, not one of the stop values: the mistake of reaching for `Ranger`
// as if it were a toggle. `v-model` below must refuse it.
const wrong = ref<boolean | null>(false)
</script>

<template>
  <Ranger v-model="wrong" :stops="stops" aria-label="Mood" />
</template>
