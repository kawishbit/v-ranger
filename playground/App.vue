<script setup lang="ts">
import { Ranger } from '../src/index'
</script>

<template>
  <main>
    <h1>ranger — dev playground</h1>
    <Ranger aria-label="Mood" />
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
</style>
