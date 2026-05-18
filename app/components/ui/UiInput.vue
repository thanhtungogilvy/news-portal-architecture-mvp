<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const { type, label, modelValue, placeholder, error } = defineProps<{
  type?: 'text' | 'email' | 'url' | 'password' | 'textarea' | 'select'
  label?: string
  modelValue?: string | null
  placeholder?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()

const inputClass =
  'block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-title placeholder-body shadow-none transition focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue disabled:cursor-not-allowed disabled:opacity-50'

const errorInputClass = 'border-error focus:border-error focus:ring-error'
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-title">{{ label }}</label>

    <textarea
      v-if="type === 'textarea'"
      v-bind="attrs"
      :class="[inputClass, error ? errorInputClass : '', 'min-h-[120px] resize-y']"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <select
      v-else-if="type === 'select'"
      v-bind="attrs"
      :class="[inputClass, error ? errorInputClass : '']"
      :value="modelValue ?? ''"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>

    <input
      v-else
      v-bind="attrs"
      :type="type ?? 'text'"
      :class="[inputClass, error ? errorInputClass : '']"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <p v-if="error" class="text-xs text-error">{{ error }}</p>
  </div>
</template>
