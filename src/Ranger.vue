<script setup lang="ts">
/**
 * Placeholder.
 *
 * The interaction engine and presentation layer land in issue 03, the token
 * surface in issue 08. This exists so issue 01 can prove the build, typecheck,
 * lint and test pipeline end to end against a real SFC.
 *
 * What is already true and worth keeping: `inheritAttrs: false`, so `class` and
 * `style` land on the root and everything else — `aria-label` above all — is
 * forwarded to the engine. See docs/adr/0001-hybrid-native-range-input.md.
 */
defineOptions({ name: 'Ranger', inheritAttrs: false })
</script>

<template>
  <div class="ranger">
    <input v-bind="$attrs" class="ranger__engine" type="range" />
  </div>
</template>

<style src="./ranger.css"></style>
