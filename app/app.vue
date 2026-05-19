<script setup lang="ts">
// Pre-fetch ở app root để layout components (LayoutHeader, LayoutFooter)
// lấy được categories từ cache ngay — không bị flash empty nav
useCategoryList()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
