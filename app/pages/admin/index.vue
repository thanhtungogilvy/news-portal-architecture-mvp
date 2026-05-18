<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-title">Dashboard</h1>
      <p class="mt-1 text-sm text-body">Welcome to the News Portal admin panel.</p>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink to="/admin/news">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider text-body">Content</p>
              <h2 class="mt-1 text-lg font-semibold text-title">News Articles</h2>
              <p class="mt-1 text-sm text-body">Create, edit, and publish articles.</p>
            </div>
            <span class="text-2xl">📰</span>
          </div>
          <p class="mt-4 text-xs font-medium text-blue group-hover:underline">Manage articles →</p>
        </UiCard>
      </NuxtLink>

      <NuxtLink to="/admin/categories">
        <UiCard class="group cursor-pointer transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider text-body">Taxonomy</p>
              <h2 class="mt-1 text-lg font-semibold text-title">Categories</h2>
              <p class="mt-1 text-sm text-body">Organise content into categories.</p>
            </div>
            <span class="text-2xl">🏷️</span>
          </div>
          <p class="mt-4 text-xs font-medium text-blue group-hover:underline">Manage categories →</p>
        </UiCard>
      </NuxtLink>
    </div>
  </div>
</template>
