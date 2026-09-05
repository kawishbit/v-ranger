<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { gapped, moods } from '../data'
import source from './StatesExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#fef9c3">
    <h2>States</h2>
    <p>Unset — a flat track and a parked, untinted thumb, not a neutral answer</p>
    <Ranger :stops="moods" :model-value="null" aria-label="Unset" />

    <p><code>disabled</code> — the whole Ranger dims and takes no input</p>
    <Ranger :stops="moods" model-value="wow" disabled aria-label="Disabled" />

    <p><code>readonly</code> — full strength, still focusable, refuses every change</p>
    <Ranger :stops="moods" model-value="wow" readonly aria-label="Readonly" />

    <p>One stop disabled — struck through, and skipped by key, drag and click</p>
    <Ranger :stops="gapped" model-value="a" aria-label="One stop disabled" />
  </ExampleCard>
</template>
