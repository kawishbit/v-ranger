<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'
import GradientPresetsExample from './examples/GradientPresetsExample.vue'
import LabelsIconsExample from './examples/LabelsIconsExample.vue'
import NumericAxisExample from './examples/NumericAxisExample.vue'
import OrdinalAxisExample from './examples/OrdinalAxisExample.vue'
import OtherShapesExample from './examples/OtherShapesExample.vue'
import RtlExample from './examples/RtlExample.vue'
import SizesExample from './examples/SizesExample.vue'
import SlotsExample from './examples/SlotsExample.vue'
import StatesExample from './examples/StatesExample.vue'
import TokensExample from './examples/TokensExample.vue'
import UncontrolledExample from './examples/UncontrolledExample.vue'
</script>

<template>
  <SpeedInsights />
  <main>
    <h1>ranger — dev playground</h1>

    <OrdinalAxisExample />
    <NumericAxisExample />
    <UncontrolledExample />
    <LabelsIconsExample />
    <SlotsExample />
    <GradientPresetsExample />
    <OtherShapesExample />
    <SizesExample />
    <StatesExample />
    <TokensExample />
    <RtlExample />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

main {
  max-inline-size: 48rem;
  margin-inline: auto;
  padding-block: 3rem;
  padding-inline: 1.5rem;
}

section {
  margin-block-end: 2.5rem;
}

/*
 * A stop block hangs half its own slice outside the Ranger at either end, by
 * design (src/ranger.css) — a consumer whose layout clips that overflow is
 * not the component's problem to solve. A slice is `1 / stop-count` wide, so
 * the fewer stops a demo has, the more room its edge labels need: 15% covers
 * this playground's narrowest demo (three stops, a 16.7%-of-Ranger overhang
 * each side) with margin to spare, whatever the viewport width.
 */
.label-overhang-guard {
  padding-inline: 15%;
}
</style>
