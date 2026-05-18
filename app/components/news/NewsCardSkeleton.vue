<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
    <UiSkeleton class="aspect-video w-full" />
    <div class="flex flex-col gap-2 p-4">
      <div class="flex items-center gap-2">
        <UiSkeleton class="h-5 w-16 rounded-full" />
        <UiSkeleton class="h-4 w-20" />
      </div>
      <UiSkeleton class="h-4 w-full" />
      <UiSkeleton class="h-4 w-3/4" />
      <UiSkeleton class="h-3 w-full" />
    </div>
  </div>
</template>
