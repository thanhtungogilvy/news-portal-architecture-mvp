<template>
  <div class="flex min-h-screen flex-col bg-smoke-200 text-title">
    <LayoutHeader />
    <main class="flex-1 pb-16">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
