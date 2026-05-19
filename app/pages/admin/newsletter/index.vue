<script setup lang="ts">
import type { ApiSuccess } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Subscriber {
  id: string
  email: string
  created_at: string
}

const page = ref(1)
const { data, status, refresh } = useFetch<ApiSuccess<Subscriber[]>>('/api/admin/newsletter', {
  key: () => `admin-newsletter-${page.value}`,
  query: computed(() => ({ page: page.value, limit: 20 })),
  server: false,
  default: () => ({ data: [], meta: { total: 0, totalPages: 0 } }),
})

const subscribers = computed(() => data.value?.data ?? [])
const total = computed(() => (data.value?.meta?.total as number) ?? 0)
const totalPages = computed(() => (data.value?.meta?.totalPages as number) ?? 0)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="p-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-title">Newsletter Subscribers</h1>
        <p v-if="status !== 'pending'" class="mt-0.5 text-sm text-body">
          {{ total }} người đăng ký
        </p>
      </div>
      <UiButton variant="secondary" @click="refresh">Làm mới</UiButton>
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-12 animate-pulse rounded-lg bg-smoke-100" />
    </div>

    <!-- Empty -->
    <div v-else-if="subscribers.length === 0" class="py-16 text-center text-body">
      Chưa có người đăng ký nào.
    </div>

    <!-- Table -->
    <div v-else class="overflow-hidden rounded-xl border border-smoke-200 bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-smoke-200 bg-smoke-50">
            <th class="px-5 py-3 text-left font-medium text-body">#</th>
            <th class="px-5 py-3 text-left font-medium text-body">Email</th>
            <th class="px-5 py-3 text-left font-medium text-body">Ngày đăng ký</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(sub, idx) in subscribers"
            :key="sub.id"
            class="border-b border-smoke-100 last:border-b-0 hover:bg-smoke-50"
          >
            <td class="px-5 py-3 text-body">{{ (page - 1) * 20 + idx + 1 }}</td>
            <td class="px-5 py-3 font-medium text-title">{{ sub.email }}</td>
            <td class="px-5 py-3 text-body">{{ formatDate(sub.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
      <UiButton variant="secondary" :disabled="page <= 1" @click="page--">← Trước</UiButton>
      <span class="text-sm text-body">Trang {{ page }} / {{ totalPages }}</span>
      <UiButton variant="secondary" :disabled="page >= totalPages" @click="page++">Sau →</UiButton>
    </div>
  </div>
</template>
