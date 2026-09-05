<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import source from './TokensExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#f5f5f4">
    <h2>Tokens</h2>
    <p>One token on an ancestor, no rebuild and no <code>!important</code></p>
    <div style="--ranger-track-height: 1rem; --ranger-thumb-size: 2rem">
      <Ranger :stops="moods" model-value="okay" aria-label="Retokened" />
    </div>

    <p>
      An explicit <code>data-theme="dark"</code> island, beating whatever the page's scheme says
    </p>
    <ExampleCard theme="dark" background="#0a0a0a">
      <Ranger :stops="moods" model-value="okay" aria-label="Dark island" />
    </ExampleCard>
  </ExampleCard>
</template>
