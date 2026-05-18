<script setup lang="ts">
// Passes all attrs (including class) to the root element
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div v-bind="$attrs" class="animate-pulse rounded bg-smoke-200" />
</template>
