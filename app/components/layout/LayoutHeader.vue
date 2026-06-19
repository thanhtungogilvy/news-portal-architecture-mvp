<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
const route = useRoute()
const router = useRouter()
const { categories } = useCategoryList()

const searchQuery = ref('')
const mobileMenuOpen = ref(false)

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchQuery.value = ''
  mobileMenuOpen.value = false
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

watch(() => route.path, closeMobileMenu)

// Scroll lock
const scrollLocked = useScrollLock(import.meta.client ? document.documentElement : null)
watch(mobileMenuOpen, val => (scrollLocked.value = val))

onUnmounted(() => { scrollLocked.value = false })
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-30 bg-black/20 xl:hidden"
        aria-hidden="true"
        @click="closeMobileMenu"
      />
    </Transition>
  </Teleport>

  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
    <div class="flex items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-12 lg:py-5">
      <!-- Left: Logo + Desktop Nav -->
      <div class="flex min-w-0 flex-1 items-center gap-8 xl:gap-10 2xl:gap-12">
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0" @click="closeMobileMenu">
          <IconLogoMark class="size-7 text-navy-900" aria-hidden="true" />
          <span class="font-vietnam font-medium text-base leading-[1.35] text-navy-900">
            Verdana News
          </span>
        </NuxtLink>

        <nav class="hidden min-w-0 items-center gap-5 xl:flex 2xl:gap-8" aria-label="Main navigation">
          <NuxtLink
            to="/"
            class="shrink-0 whitespace-nowrap text-base leading-[1.6] transition-colors hover:text-sage-600"
            :class="route.path === '/' ? 'text-sage-600' : 'text-navy-900'"
          >
            Mới nhất
          </NuxtLink>
          <NuxtLink
            v-for="cat in categories"
            :key="cat.slug"
            :to="`/categories/${cat.slug}`"
            class="shrink-0 whitespace-nowrap text-base leading-[1.6] transition-colors hover:text-sage-600"
            :class="route.path === `/categories/${cat.slug}` ? 'text-sage-600' : 'text-navy-900'"
          >
            {{ cat.name }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Desktop actions + Mobile controls -->
      <div class="flex shrink-0 items-center gap-2 xl:gap-3 2xl:gap-4">
        <!-- Desktop search -->
        <form class="hidden xl:flex" novalidate @submit.prevent="submitSearch">
          <label for="header-search" class="sr-only">Tìm kiếm bài viết</label>
          <div class="flex h-[42px] w-[220px] items-center rounded-lg border border-slate-200 bg-white px-3.5 transition-colors focus-within:border-sage-600 focus-within:ring-1 focus-within:ring-sage-600 2xl:w-[280px]">
            <IconSearch class="mr-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="header-search"
              v-model="searchQuery"
              type="search"
              placeholder="Tìm kiếm bài viết"
              class="flex-1 bg-transparent text-sm text-navy-900 placeholder:text-slate-400 outline-none"
            >
          </div>
        </form>

        <!-- Desktop chat icon -->
        <NuxtLink
          to="/chat"
          class="hidden size-10 items-center justify-center rounded-lg text-navy-900 transition-colors hover:bg-slate-100 xl:flex"
          aria-label="Hỏi đáp tin tức"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </NuxtLink>

        <!-- Desktop subscribe -->
        <a
          href="#newsletter-section"
          class="hidden min-h-[42px] items-center justify-center rounded-lg bg-navy-900 px-[22px] py-2.5 text-sm font-medium leading-none text-white transition-opacity hover:opacity-90 2xl:flex"
        >
          Đăng ký
        </a>

        <!-- Mobile search icon -->
        <NuxtLink
          to="/search"
          class="flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-slate-100 xl:hidden"
          aria-label="Tìm kiếm"
        >
          <IconSearch class="h-5 w-5" />
        </NuxtLink>

        <!-- Mobile hamburger -->
        <button
          class="flex size-9 flex-col items-center justify-center gap-1.5 rounded-lg text-navy-900 hover:bg-slate-100 xl:hidden"
          :aria-label="mobileMenuOpen ? 'Đóng menu' : 'Mở menu'"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span
            class="block h-0.5 w-5 bg-navy-900 transition-all duration-200 origin-center"
            :class="mobileMenuOpen ? 'translate-y-2 rotate-45' : ''"
          />
          <span
            class="block h-0.5 w-5 bg-navy-900 transition-opacity duration-200"
            :class="mobileMenuOpen ? 'opacity-0' : ''"
          />
          <span
            class="block h-0.5 w-5 bg-navy-900 transition-all duration-200 origin-center"
            :class="mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''"
          />
        </button>
      </div>
    </div>

    <!-- Mobile menu dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="mobileMenuOpen" class="border-t border-slate-200 bg-white xl:hidden">
        <nav class="flex flex-col px-4 pt-2 pb-4 sm:px-6" aria-label="Mobile navigation">
          <NuxtLink
            to="/"
            class="rounded-lg px-3 py-3 text-base leading-[1.6] transition-colors hover:bg-slate-50"
            :class="route.path === '/' ? 'font-medium text-sage-600' : 'text-navy-900'"
            @click="closeMobileMenu"
          >
            Mới nhất
          </NuxtLink>
          <NuxtLink
            v-for="cat in categories"
            :key="cat.slug"
            :to="`/categories/${cat.slug}`"
            class="rounded-lg px-3 py-3 text-base leading-[1.6] transition-colors hover:bg-slate-50"
            :class="route.path === `/categories/${cat.slug}` ? 'font-medium text-sage-600' : 'text-navy-900'"
            @click="closeMobileMenu"
          >
            {{ cat.name }}
          </NuxtLink>

          <!-- Mobile chat link -->
          <NuxtLink
            to="/chat"
            class="flex items-center gap-3 rounded-lg px-3 py-3 text-base leading-[1.6] text-navy-900 transition-colors hover:bg-slate-50"
            @click="closeMobileMenu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Hỏi đáp tin tức
          </NuxtLink>

          <!-- Mobile search form -->
          <div class="mt-3 border-t border-slate-100 pt-4">
            <form novalidate @submit.prevent="submitSearch">
              <div class="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 transition-colors focus-within:border-sage-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-sage-600">
                <IconSearch class="mr-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  v-model="searchQuery"
                  type="search"
                  placeholder="Tìm kiếm bài viết"
                  class="flex-1 bg-transparent text-sm text-navy-900 placeholder:text-slate-400 outline-none"
                >
              </div>
            </form>
          </div>

          <!-- Mobile subscribe -->
          <div class="mt-3">
            <a
              href="#newsletter-section"
              class="flex h-11 w-full items-center justify-center rounded-lg bg-navy-900 text-sm font-medium text-white transition-opacity hover:opacity-90"
              @click="closeMobileMenu"
            >
              Đăng ký nhận tin
            </a>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>
