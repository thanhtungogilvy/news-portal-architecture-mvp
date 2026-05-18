<script setup lang="ts">
import type { CategoryDto } from '~/types/category'

defineProps<{
  categories: CategoryDto[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-border bg-white">
    <table class="min-w-full divide-y divide-border text-sm">
      <thead>
        <tr class="bg-smoke-50">
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Name</th>
          <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-body">Slug</th>
          <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-body">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <!-- Loading skeletons -->
        <template v-if="loading">
          <tr v-for="n in 5" :key="n">
            <td class="px-5 py-3"><UiSkeleton class="h-4 w-32" /></td>
            <td class="px-5 py-3"><UiSkeleton class="h-4 w-40" /></td>
            <td class="px-5 py-3 text-right"><UiSkeleton class="ml-auto h-7 w-20" /></td>
          </tr>
        </template>

        <!-- Empty state -->
        <tr v-else-if="categories.length === 0">
          <td colspan="3" class="px-5 py-10 text-center text-sm text-body">
            No categories yet. Create one to get started.
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-for="category in categories"
          v-else
          :key="category.id"
          class="transition-colors hover:bg-smoke-50"
        >
          <td class="px-5 py-3 font-medium text-title">{{ category.name }}</td>
          <td class="px-5 py-3 font-mono text-xs text-body">{{ category.slug }}</td>
          <td class="px-5 py-3 text-right">
            <div class="inline-flex items-center gap-1">
              <!-- Edit -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-smoke-100 hover:text-title"
                title="Edit category"
                aria-label="Edit category"
                @click="emit('edit', category.id)"
              >
                <IconPencil class="h-4 w-4" />
              </button>

              <!-- Delete -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-error-light hover:text-error"
                title="Delete category"
                aria-label="Delete category"
                @click="emit('delete', category.id)"
              >
                <IconTrash class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
