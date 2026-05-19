<script setup lang="ts">
import { newsCreateSchema, type NewsCreateInput } from '~/utils/validators/news'
import type { CategoryDto } from '~/types/category'

const props = defineProps<{
  modelValue: NewsCreateInput
  loading?: boolean
  categories: CategoryDto[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NewsCreateInput]
  submit: []
  cancel: []
}>()

const errors = ref<Partial<Record<keyof NewsCreateInput, string>>>({})
const slugManuallyEdited = ref(false)

function update(field: keyof NewsCreateInput, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
  errors.value[field] = undefined
}

function onTitleInput(value: string) {
  emit('update:modelValue', { ...props.modelValue, title: value })
  errors.value.title = undefined
  if (!slugManuallyEdited.value) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    emit('update:modelValue', { ...props.modelValue, title: value, slug })
  }
}

function onSlugInput(value: string) {
  slugManuallyEdited.value = true
  update('slug', value)
}

function onSubmit() {
  // Build payload with auto-set publishedAt
  const payload: NewsCreateInput = { ...props.modelValue }
  if (payload.status === 'published' && !payload.publishedAt) {
    payload.publishedAt = new Date().toISOString()
  }

  errors.value = {}
  const result = newsCreateSchema.safeParse(payload)
  if (!result.success) {
    result.error.issues.forEach(issue => {
      const key = issue.path[0] as keyof NewsCreateInput
      if (key) errors.value[key] = issue.message
    })
    return
  }

  emit('update:modelValue', payload)
  emit('submit')
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <!-- Core fields -->
    <UiCard>
      <h2 class="mb-4 text-sm font-semibold text-title">Content</h2>
      <div class="space-y-5">
        <UiInput
          label="Title"
          type="text"
          placeholder="Article title"
          :model-value="modelValue.title"
          :error="errors.title"
          @update:model-value="onTitleInput"
        />
        <UiInput
          label="Slug"
          type="text"
          placeholder="url-safe-slug"
          :model-value="modelValue.slug"
          :error="errors.slug"
          @update:model-value="onSlugInput"
        />
        <UiInput
          label="Summary"
          type="textarea"
          placeholder="Short description shown in cards and SEO"
          :model-value="modelValue.summary ?? ''"
          :error="errors.summary"
          @update:model-value="v => update('summary', v || null)"
        />
        <ClientOnly>
          <AdminRichEditor
            :model-value="modelValue.content"
            placeholder="Article body content…"
            :error="errors.content"
            :thumbnail-url="modelValue.thumbnailUrl ?? null"
            @update:model-value="v => update('content', v)"
          />
          <template #fallback>
            <UiSkeleton class="h-[260px] w-full rounded-xl" />
          </template>
        </ClientOnly>
      </div>
    </UiCard>

    <!-- Meta fields -->
    <UiCard>
      <h2 class="mb-4 text-sm font-semibold text-title">Publishing</h2>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <UiInput
          label="Status"
          type="select"
          :model-value="modelValue.status"
          :error="errors.status"
          @update:model-value="v => update('status', v)"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </UiInput>

        <UiInput
          label="Category"
          type="select"
          :model-value="modelValue.categoryId ?? ''"
          :error="errors.categoryId"
          @update:model-value="v => update('categoryId', v || null)"
        >
          <option value="">— No category —</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </UiInput>

        <div class="sm:col-span-2">
          <p class="mb-1.5 text-sm font-medium text-title">Thumbnail</p>
          <AdminImageUpload
            :model-value="modelValue.thumbnailUrl ?? null"
            :disabled="loading"
            @update:model-value="v => update('thumbnailUrl', v)"
          />
          <p v-if="errors.thumbnailUrl" class="mt-1 text-xs text-error">{{ errors.thumbnailUrl }}</p>
        </div>

        <UiInput
          label="Author name"
          type="text"
          placeholder="Nguyễn Văn A"
          :model-value="modelValue.authorName ?? ''"
          :error="errors.authorName"
          @update:model-value="v => update('authorName', v || null)"
        />
        <UiInput
          label="Author avatar URL"
          type="text"
          placeholder="https://…/avatar.jpg"
          :model-value="modelValue.authorAvatarUrl ?? ''"
          :error="errors.authorAvatarUrl"
          @update:model-value="v => update('authorAvatarUrl', v || null)"
        />


      </div>
    </UiCard>

    <div class="flex items-center gap-3">
      <UiButton type="submit" :disabled="loading">
        {{ loading ? 'Saving…' : modelValue.status === 'published' ? 'Publish Article' : 'Save Article' }}
      </UiButton>
      <UiButton type="button" variant="secondary" @click="emit('cancel')">Cancel</UiButton>
    </div>
  </form>
</template>
