<script setup lang="ts">
import { categoryCreateSchema, type CategoryCreateInput } from '~/utils/validators/category'

type Row = {
  id: number
  name: string
  slug: string
  slugManuallyEdited: boolean
  errors: Partial<Record<keyof CategoryCreateInput, string>>
}

const emit = defineEmits<{
  submit: [rows: CategoryCreateInput[]]
  cancel: []
}>()

const { loading } = defineProps<{
  loading?: boolean
  serverErrors?: Record<number, string>  // index → server error message
}>()

let nextId = 1
function makeRow(): Row {
  return { id: nextId++, name: '', slug: '', slugManuallyEdited: false, errors: {} }
}

const rows = ref<Row[]>([makeRow()])

function addRow() {
  rows.value.push(makeRow())
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return
  rows.value.splice(index, 1)
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function onNameInput(index: number, value: string) {
  const row = rows.value[index]
  if (!row) return
  row.name = value
  row.errors.name = undefined
  if (!row.slugManuallyEdited) {
    row.slug = generateSlug(value)
    row.errors.slug = undefined
  }
}

function onSlugInput(index: number, value: string) {
  const row = rows.value[index]
  if (!row) return
  row.slug = value
  row.slugManuallyEdited = true
  row.errors.slug = undefined
}

function validateAll(): boolean {
  let valid = true
  for (const row of rows.value) {
    row.errors = {}
    const result = categoryCreateSchema.safeParse({ name: row.name, slug: row.slug })
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof CategoryCreateInput
        if (key) row.errors[key] = issue.message
      })
      valid = false
    }
  }
  return valid
}

function onSubmit() {
  if (!validateAll()) return
  emit('submit', rows.value.map(r => ({ name: r.name, slug: r.slug })))
}

// Expose for parent to set per-row server errors after API conflict
function setRowError(index: number, field: keyof CategoryCreateInput, message: string) {
  const row = rows.value[index]
  if (row) row.errors[field] = message
}

defineExpose({ setRowError })
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div
      v-for="(row, index) in rows"
      :key="row.id"
      class="rounded-xl border border-border bg-white p-4"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-body">Category {{ index + 1 }}</span>
        <button
          v-if="rows.length > 1"
          type="button"
          class="rounded-md p-1 text-body transition hover:bg-error-light hover:text-error"
          :aria-label="`Remove category ${index + 1}`"
          @click="removeRow(index)"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <UiInput
          label="Name"
          type="text"
          placeholder="e.g. Technology"
          :model-value="row.name"
          :error="row.errors.name"
          @update:model-value="v => onNameInput(index, v as string)"
        />
        <UiInput
          label="Slug"
          type="text"
          placeholder="e.g. technology"
          :model-value="row.slug"
          :error="row.errors.slug"
          @update:model-value="v => onSlugInput(index, v as string)"
        />

        <!-- Per-row server error (e.g. conflict) -->
        <p v-if="serverErrors?.[index]" class="text-xs text-error">
          {{ serverErrors[index] }}
        </p>
      </div>
    </div>

    <!-- Add row -->
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-body transition hover:border-blue hover:text-blue"
      :disabled="loading"
      @click="addRow"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add another category
    </button>

    <div class="flex items-center gap-3">
      <UiButton type="submit" :disabled="loading">
        {{ loading ? 'Saving…' : `Create ${rows.length > 1 ? `${rows.length} categories` : 'category'}` }}
      </UiButton>
      <UiButton type="button" variant="secondary" @click="emit('cancel')">Cancel</UiButton>
    </div>
  </form>
</template>
