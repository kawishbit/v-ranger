<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods } from '../data'
</script>

<template>
  <section>
    <h2>Slots</h2>
    <p><code>#label</code> and <code>#icon</code> replace only their own part</p>
    <Ranger :stops="moods" aria-label="Label and icon slots">
      <template #label="{ stop, selected }">
        <span :style="{ textDecoration: selected ? 'underline' : 'none' }">
          {{ String(stop.label).toLowerCase() }}
        </span>
      </template>
      <template #icon="{ index }">
        <span>{{ index + 1 }}/6</span>
      </template>
    </Ranger>

    <p><code>#stop</code> replaces the whole block, and <code>#thumb</code> fills the thumb</p>
    <Ranger :stops="moods" aria-label="Stop and thumb slots">
      <template #stop="{ stop, selected, disabled }">
        <span :style="{ opacity: disabled ? 0.4 : 1, fontWeight: selected ? 700 : 400 }">
          {{ stop.icon }} {{ stop.label }}
        </span>
      </template>
      <template #thumb="{ unset }">
        <span style="font-size: 0.5rem">{{ unset ? '?' : '' }}</span>
      </template>
    </Ranger>
  </section>
</template>
