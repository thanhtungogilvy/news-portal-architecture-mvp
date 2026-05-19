<script setup lang="ts">
import clsx from 'clsx'

const props = defineProps<{
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}>()

const badgeClass = computed(() =>
  clsx('inline-flex items-center rounded-full px-3 py-1 text-[12px] font-normal tracking-[-0.12px]', {
    'bg-smoke-100 text-[#7A7A7A]': !props.color || props.color === 'default',
    'bg-smoke-100 text-blue-600': props.color === 'primary',
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
