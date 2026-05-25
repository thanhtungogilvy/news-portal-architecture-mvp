<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const { signOut } = useAuth()
const { message, clear } = useAdminToast()

const iconMap: Record<string, string> = {
  'grid': 'IconGrid',
  'file-text': 'IconFileText',
  'tag': 'IconTag',
  'mail': 'IconMail',
}

const navLinks = [
  { label: 'Dashboard', to: '/admin', icon: 'grid' },
  { label: 'News', to: '/admin/news', icon: 'file-text' },
  { label: 'Imports', to: '/admin/import', icon: 'file-text' },
  { label: 'Categories', to: '/admin/categories', icon: 'tag' },
  { label: 'Newsletter', to: '/admin/newsletter', icon: 'mail' },
]

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await signOut()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-smoke-50">
    <!-- Sidebar -->
    <aside class="flex w-60 flex-shrink-0 flex-col bg-dark-400 text-white">
      <!-- Logo / Brand -->
      <div class="flex h-16 items-center border-b border-dark-50 px-5">
        <span class="text-sm font-semibold tracking-wide text-white/90">News Portal</span>
        <span class="ml-2 rounded bg-blue/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-300">Admin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-0.5 px-3 py-4">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive(link.to)
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:bg-white/5 hover:text-white/90',
          ]"
        >
          <component :is="iconMap[link.icon]" class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- User / Logout -->
      <div class="border-t border-dark-50 px-4 py-4">
        <p class="mb-3 truncate text-xs text-white/50">{{ user?.email }}</p>
        <UiButton variant="ghost" class="w-full justify-start !text-white/60 hover:!text-white hover:!bg-white/5" @click="handleLogout">
          Sign out
        </UiButton>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Toast bar -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="message"
          :class="[
            'flex items-center justify-between gap-4 px-5 py-3 text-sm font-medium',
            message.type === 'success' ? 'bg-success-light text-success-dark' : 'bg-error-light text-error-dark',
          ]"
        >
          <span>{{ message.text }}</span>
          <button class="shrink-0 text-inherit opacity-60 hover:opacity-100" @click="clear">✕</button>
        </div>
      </Transition>

      <main class="flex-1 px-8 py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
