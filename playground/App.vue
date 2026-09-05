<script setup lang="ts">
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

pre {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f5f5f5;
  overflow: auto;
}
</style>
