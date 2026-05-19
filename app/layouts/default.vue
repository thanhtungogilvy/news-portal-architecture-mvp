<template>
  <div class="flex min-h-screen flex-col bg-slate-50 font-sans text-navy-900">
    <LayoutHeader />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
