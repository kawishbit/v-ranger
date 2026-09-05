<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods } from '../data'
</script>

<template>
  <section>
    <h2>Tokens</h2>
    <p>One token on an ancestor, no rebuild and no <code>!important</code></p>
    <div style="--ranger-track-height: 1rem; --ranger-thumb-size: 2rem">
      <Ranger :stops="moods" model-value="okay" aria-label="Retokened" />
    </div>

    <p>
      An explicit <code>data-theme="dark"</code> island, beating whatever the page's scheme says
    </p>
    <div data-theme="dark" style="padding: 1rem; border-radius: 0.5rem; background: #0a0a0a">
      <Ranger :stops="moods" model-value="okay" aria-label="Dark island" />
    </div>
  </section>
</template>
