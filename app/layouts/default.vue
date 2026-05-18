<template>
  <div class="flex min-h-screen flex-col bg-smoke-50">
    <LayoutHeader />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
