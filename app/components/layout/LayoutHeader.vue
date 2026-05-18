<template>
  <header class="sticky top-0 z-40 border-b border-border bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="text-xl font-bold text-title tracking-tight">
        News Portal
      </NuxtLink>
      <nav class="flex items-center gap-4 text-sm font-medium text-body">
        <NuxtLink to="/" class="hover:text-title transition-colors" active-class="text-blue font-semibold">
          Home
        </NuxtLink>
        <NuxtLink to="/news" class="hover:text-title transition-colors" active-class="text-blue font-semibold">
          Tin tức
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
