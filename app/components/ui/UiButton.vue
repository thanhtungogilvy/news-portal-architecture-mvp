<script setup lang="ts">
import clsx from 'clsx'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

const buttonClass = computed(() =>
  clsx(
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    {
      'px-3 py-1.5 text-xs': props.size === 'sm',
      'px-4 py-2 text-sm': !props.size || props.size === 'md',
      'px-5 py-2.5 text-base': props.size === 'lg',
    },
    {
      'bg-blue text-white hover:bg-blue-600 focus-visible:ring-blue-500':
        !props.variant || props.variant === 'primary',
      'bg-white text-title border border-border hover:bg-smoke-100 focus-visible:ring-blue-400':
        props.variant === 'secondary',
      'text-body hover:text-title hover:bg-smoke-100 focus-visible:ring-blue-400':
        props.variant === 'ghost',
    },
    {
      'opacity-50 cursor-not-allowed pointer-events-none': props.disabled,
    },
  ),
)
</script>

<template>
  <button :type="type ?? 'button'" :class="buttonClass" :disabled="disabled">
    <slot />
  </button>
</template>
