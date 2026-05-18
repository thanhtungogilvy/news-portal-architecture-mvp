<script setup lang="ts">
import clsx from 'clsx'

const props = defineProps<{
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}>()

const badgeClass = computed(() =>
  clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
    'bg-smoke-200 text-body': !props.color || props.color === 'default',
    'bg-blue-50 text-blue-600': props.color === 'primary',
    'bg-success-light text-success-dark': props.color === 'success',
    'bg-warning-light text-warning-dark': props.color === 'warning',
    'bg-error-light text-error-dark': props.color === 'danger',
  }),
)
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
