<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'standard' | 'lead' | 'compact'
}>(), {
  variant: 'standard',
})
</script>

<template>
  <div v-if="variant === 'lead'" class="grid gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center xl:gap-10">
    <UiSkeleton class="aspect-[16/10] w-full rounded-[18px] md:aspect-[5/4] lg:aspect-[4/3]" />
    <div class="space-y-5">
      <UiSkeleton class="h-5 w-28 rounded-full" />
      <UiSkeleton class="h-10 w-full sm:h-12" />
      <UiSkeleton class="h-10 w-5/6 sm:h-12" />
      <UiSkeleton class="h-6 w-full sm:h-7" />
      <UiSkeleton class="h-6 w-4/5 sm:h-7" />
      <div class="flex gap-3 pt-2">
        <UiSkeleton class="h-11 w-36 rounded-full" />
        <UiSkeleton class="h-11 w-28 rounded-full" />
      </div>
    </div>
  </div>

  <div v-else-if="variant === 'compact'" class="flex flex-col gap-4 border-b border-border bg-white pb-5 sm:flex-row">
    <UiSkeleton class="aspect-[4/3] w-full rounded-[18px] sm:aspect-square sm:w-28 sm:shrink-0" />
    <div class="flex-1 space-y-3">
      <UiSkeleton class="h-3 w-40" />
      <UiSkeleton class="h-7 w-full" />
      <UiSkeleton class="h-7 w-4/5" />
      <UiSkeleton class="h-4 w-full" />
    </div>
  </div>

  <div v-else class="overflow-hidden rounded-[18px] border border-border bg-white">
    <UiSkeleton class="aspect-[16/10] w-full" />
    <div class="space-y-4 p-5">
      <UiSkeleton class="h-3 w-36" />
      <UiSkeleton class="h-9 w-full" />
      <UiSkeleton class="h-9 w-4/5" />
      <UiSkeleton class="h-5 w-full" />
      <UiSkeleton class="h-5 w-5/6" />
    </div>
  </div>
</template>
