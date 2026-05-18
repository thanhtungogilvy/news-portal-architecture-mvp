<script setup lang="ts">
const { open, title, confirmLabel, cancelLabel, confirmVariant } = defineProps<{
  open: boolean
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'destructive'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function onConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function onCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-dark/40 backdrop-blur-sm"
          @click="onCancel"
        />

        <!-- Dialog card -->
        <div class="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <h2 v-if="title" class="mb-3 text-base font-semibold text-title">{{ title }}</h2>

          <div class="mb-6 text-sm text-body">
            <slot />
          </div>

          <div class="flex justify-end gap-3">
            <UiButton variant="secondary" @click="onCancel">
              {{ cancelLabel ?? 'Cancel' }}
            </UiButton>
            <UiButton :variant="confirmVariant ?? 'primary'" @click="onConfirm">
              {{ confirmLabel ?? 'Confirm' }}
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
