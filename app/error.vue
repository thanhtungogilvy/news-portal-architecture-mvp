<script setup lang="ts">
// Explicitly request the default layout so LayoutHeader/LayoutFooter render around the error page.
// Nuxt 4 supports definePageMeta in error.vue for layout selection.
definePageMeta({ layout: 'default' })

const error = useError()

const title = computed(() =>
  error.value?.statusCode === 404 ? 'Page not found' : 'Something went wrong',
)

const description = computed(() =>
  error.value?.statusCode === 404
    ? 'The page you were looking for does not exist.'
    : 'An unexpected error occurred. Please try again later.',
)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p class="mb-2 text-6xl font-bold text-blue">
      {{ error?.statusCode ?? 500 }}
    </p>
    <h1 class="mb-3 text-2xl font-semibold text-title">
      {{ title }}
    </h1>
    <p class="mb-8 max-w-md text-body">
      {{ description }}
    </p>
    <UiButton @click="goHome">
      Go home
    </UiButton>
  </div>
</template>
