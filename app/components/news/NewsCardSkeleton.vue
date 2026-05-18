<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
    <UiSkeleton class="aspect-video w-full" />
    <div class="flex flex-col gap-3 p-4">
      <div class="flex flex-wrap items-center gap-2">
        <UiSkeleton class="h-5 w-16 rounded-full" />
        <UiSkeleton class="h-4 w-20" />
        <UiSkeleton class="h-4 w-14" />
      </div>
      <UiSkeleton class="h-5 w-full" />
      <UiSkeleton class="h-5 w-4/5" />
      <UiSkeleton class="h-4 w-full" />
      <UiSkeleton class="h-4 w-5/6" />
    </div>
  </div>
</template>
