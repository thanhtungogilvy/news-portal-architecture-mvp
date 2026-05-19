<script setup lang="ts">
import clsx from 'clsx'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

const buttonClass = computed(() =>
  clsx(
    'inline-flex items-center justify-center font-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95',
    {
      'min-h-[32px] rounded-full px-3 text-xs tracking-[-0.12px]': props.size === 'sm',
      'min-h-[44px] rounded-full px-[22px] text-[17px] leading-[1.47] tracking-apple': !props.size || props.size === 'md',
      'min-h-[48px] rounded-full px-7 text-[18px] font-light leading-none': props.size === 'lg',
    },
    {
      'bg-blue-600 text-white hover:bg-blue-500':
        !props.variant || props.variant === 'primary',
      'border border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50':
        props.variant === 'secondary',
      'rounded-md px-4 text-[14px] leading-[1.29] tracking-[-0.224px] text-title hover:bg-black/5':
        props.variant === 'ghost',
      'rounded-full bg-error text-white hover:bg-error-dark':
        props.variant === 'destructive',
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
