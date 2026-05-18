<script setup lang="ts">
import { categoryCreateSchema, type CategoryCreateInput } from '~/utils/validators/category'

const props = defineProps<{
  modelValue: CategoryCreateInput
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CategoryCreateInput]
  submit: []
  cancel: []
}>()

const errors = ref<Partial<Record<keyof CategoryCreateInput, string>>>({})
const slugManuallyEdited = ref(false)

function update(field: keyof CategoryCreateInput, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
  errors.value[field] = undefined
}

function onNameInput(value: string) {
  update('name', value)
  if (!slugManuallyEdited.value) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    emit('update:modelValue', { ...props.modelValue, name: value, slug })
  }
}

function onSlugInput(value: string) {
  slugManuallyEdited.value = true
  update('slug', value)
}

function validate(): boolean {
  errors.value = {}
  const result = categoryCreateSchema.safeParse(props.modelValue)
  if (!result.success) {
    result.error.issues.forEach(issue => {
      const key = issue.path[0] as keyof CategoryCreateInput
      if (key) errors.value[key] = issue.message
    })
    return false
  }
  return true
}

function onSubmit() {
  if (validate()) emit('submit')
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <UiCard>
      <div class="space-y-5">
        <UiInput
          label="Name"
          type="text"
          placeholder="e.g. Technology"
          :model-value="modelValue.name"
          :error="errors.name"
          @update:model-value="onNameInput"
        />
        <UiInput
          label="Slug"
          type="text"
          placeholder="e.g. technology"
          :model-value="modelValue.slug"
          :error="errors.slug"
          @update:model-value="onSlugInput"
        />
      </div>
    </UiCard>

    <div class="flex items-center gap-3">
      <UiButton type="submit" :disabled="loading">
        {{ loading ? 'Saving…' : 'Save Category' }}
      </UiButton>
      <UiButton type="button" variant="secondary" @click="emit('cancel')">Cancel</UiButton>
    </div>
  </form>
</template>
