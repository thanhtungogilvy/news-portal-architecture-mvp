<script setup lang="ts">
import type { NewsDto } from '~/types/news'
import { formatNewsDate } from '~/utils/format/news'

definePageMeta({ layout: 'default' })

const { news: featured } = useFeaturedNews()
const { news: mostViewed } = useMostViewedNews()
const { categories } = useCategoryList()
const { news: allNews } = useNewsList({ limit: 30 })

const hero = computed<NewsDto | null>(() => featured.value[0] ?? null)
const trending = computed<NewsDto[]>(() => featured.value.slice(0, 3))
const editorPicks = computed<NewsDto[]>(() => mostViewed.value.slice(0, 2))

// Build category columns: first 3 categories, each with up to 4 articles
const categoryColumns = computed(() => {
  const cols = categories.value.slice(0, 3).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    articles: allNews.value.filter(n => n.category?.slug === cat.slug).slice(0, 4),
  }))
  return cols
})

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}

const newsletterEmail = ref('')
</script>

<template>
  <div class="bg-slate-50">
    <!-- ─── Hero ─────────────────────────────────── -->
    <section class="flex gap-12 px-12 py-16">
      <!-- Hero image -->
      <div class="relative h-[480px] w-[800px] shrink-0 overflow-hidden rounded-2xl">
        <img
          v-if="hero?.thumbnailUrl"
          :src="hero.thumbnailUrl"
          :alt="hero.title"
          class="absolute inset-0 size-full object-cover"
        >
        <div v-else class="absolute inset-0 bg-slate-200" />
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-navy-900/70 rounded-2xl" />
        <p class="absolute bottom-5 left-6 text-xs font-medium leading-[1.4] text-white/70">
          Ảnh: Nghiên cứu tế bào, Verdana Labs
        </p>
      </div>

      <!-- Hero content -->
      <div class="flex flex-1 flex-col justify-center gap-6">
        <div class="inline-flex items-center rounded bg-navy-900 px-3 py-1">
          <span class="text-xs font-medium leading-[1.4] tracking-[0.5px] text-white uppercase">
            {{ hero?.category?.name ?? 'Featured' }}
          </span>
        </div>
        <NuxtLink v-if="hero" :to="`/news/${hero.slug}`">
          <h1 class="font-vietnam font-bold text-[40px] leading-[1.15] text-navy-900">
            {{ hero.title }}
          </h1>
        </NuxtLink>
        <p v-if="hero?.summary" class="text-lg leading-[1.6] text-slate-600">
          {{ hero.summary }}
        </p>
        <div v-if="hero" class="flex items-center gap-3">
          <img
            v-if="hero.authorAvatarUrl"
            :src="hero.authorAvatarUrl"
            :alt="hero.authorName ?? ''"
            class="size-9 rounded-full object-cover shrink-0"
          >
          <div v-else class="size-9 rounded-full bg-slate-300 shrink-0" />
          <div class="flex flex-col gap-0.5">
            <span class="text-base leading-[1.6] text-navy-900">{{ hero.authorName ?? 'Biên tập viên' }}</span>
            <span class="text-sm leading-[1.5] text-slate-500">
              Đọc {{ estimateReadTime(hero.content) }} phút · {{ formatNewsDate(hero.publishedAt) }}
            </span>
          </div>
        </div>
        <NuxtLink
          v-if="hero"
          :to="`/news/${hero.slug}`"
          class="inline-flex min-h-12 items-center justify-center self-start rounded-lg bg-navy-900 px-7 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
        >
          Đọc toàn bài
        </NuxtLink>
      </div>
    </section>

    <!-- ─── Trending ──────────────────────────────── -->
    <section class="flex flex-col gap-8 px-12 pb-16">
      <!-- Section header -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">Mới nhất</p>
          <h2 class="font-vietnam font-semibold text-2xl leading-[1.25] text-navy-900">Tin nổi bật vừa cập nhật</h2>
        </div>
        <NuxtLink to="/news" class="text-base leading-[1.6] text-sage-600 hover:underline">
          Xem tất cả →
        </NuxtLink>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-cols-3 gap-6">
        <NuxtLink
          v-for="item in trending"
          :key="item.id"
          :to="`/news/${item.slug}`"
          class="group flex flex-col gap-4"
        >
          <div class="relative h-60 overflow-hidden rounded-lg bg-slate-200">
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              :alt="item.title"
              class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            >
            <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-black/25 rounded-lg" />
          </div>
          <div class="flex flex-col gap-3">
            <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">
              {{ item.category?.name ?? '' }}
            </p>
            <h3 class="font-vietnam font-semibold text-xl leading-[1.3] text-navy-900 group-hover:text-sage-600 transition-colors">
              {{ item.title }}
            </h3>
            <p v-if="item.summary" class="line-clamp-2 text-base leading-[1.6] text-slate-600">
              {{ item.summary }}
            </p>
            <div class="flex items-center gap-2 text-sm leading-[1.5]">
              <span class="text-navy-900">{{ item.authorName ?? 'Biên tập viên' }}</span>
              <span class="text-slate-500">·</span>
              <span class="text-slate-500">Đọc {{ estimateReadTime(item.content) }} phút</span>
            </div>
          </div>
        </NuxtLink>

        <!-- Skeleton placeholders when loading -->
        <template v-if="trending.length === 0">
          <div v-for="i in 3" :key="i" class="flex flex-col gap-4 animate-pulse">
            <div class="h-60 rounded-lg bg-slate-200" />
            <div class="flex flex-col gap-3">
              <div class="h-3 w-24 rounded bg-slate-200" />
              <div class="h-6 rounded bg-slate-200" />
              <div class="h-4 rounded bg-slate-200" />
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ─── Categories ────────────────────────────── -->
    <section class="bg-slate-100 px-12 py-16 flex flex-col gap-8">
      <div>
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">Khám phá theo chuyên mục</p>
        <h2 class="mt-1 font-vietnam font-semibold text-2xl leading-[1.25] text-navy-900">Chủ đề đang được quan tâm</h2>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div
          v-for="col in categoryColumns"
          :key="col.slug"
          class="flex flex-col rounded-lg border border-slate-100 bg-white p-6"
        >
          <div class="flex items-center justify-between pb-4">
            <h3 class="font-vietnam font-semibold text-xl leading-[1.3] text-navy-900">{{ col.name }}</h3>
          </div>
          <div
            v-for="(article, idx) in col.articles"
            :key="article.id"
            :class="['flex gap-4 py-4', idx > 0 ? 'border-t border-slate-100' : '']"
          >
            <span class="font-vietnam font-bold text-2xl leading-none text-slate-300 shrink-0">
              {{ String(idx + 1).padStart(2, '0') }}
            </span>
            <NuxtLink :to="`/news/${article.slug}`" class="flex flex-1 flex-col gap-1.5 group">
              <p class="font-vietnam font-medium text-base leading-[1.35] text-navy-900 group-hover:text-sage-600 transition-colors">
                {{ article.title }}
              </p>
              <p class="text-sm leading-[1.5] text-slate-500">
                Đọc {{ estimateReadTime(article.content) }} phút
              </p>
            </NuxtLink>
          </div>

          <!-- Empty state -->
          <p v-if="col.articles.length === 0" class="py-4 text-sm text-slate-400">
            Chưa có bài viết.
          </p>
        </div>

        <!-- Skeleton when no categories -->
        <template v-if="categoryColumns.length === 0">
          <div v-for="i in 3" :key="i" class="flex flex-col rounded-lg border border-slate-100 bg-white p-6 animate-pulse gap-4">
            <div class="h-6 w-32 rounded bg-slate-200" />
            <div v-for="j in 4" :key="j" class="flex gap-4 py-3 border-t border-slate-100 first:border-t-0">
              <div class="h-6 w-7 rounded bg-slate-200 shrink-0" />
              <div class="flex flex-1 flex-col gap-2">
                <div class="h-4 rounded bg-slate-200" />
                <div class="h-3 w-20 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ─── Editor's Picks ────────────────────────── -->
    <section class="flex flex-col gap-8 px-12 py-16">
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">Đọc nhiều nhất</p>
          <h2 class="font-vietnam font-semibold text-2xl leading-[1.25] text-navy-900">Bài đọc được yêu thích nhất</h2>
        </div>
        <NuxtLink to="/news" class="text-base leading-[1.6] text-sage-600 hover:underline">
          Xem kho lưu trữ →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-2 gap-8">
        <NuxtLink
          v-for="item in editorPicks"
          :key="item.id"
          :to="`/news/${item.slug}`"
          class="group flex flex-col gap-6"
        >
          <div class="relative h-[360px] overflow-hidden rounded-lg bg-slate-200">
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              :alt="item.title"
              class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            >
            <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-black/40 rounded-lg" />
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3 text-xs font-medium leading-[1.4]">
              <span class="tracking-[1px] text-sage-600 uppercase">{{ item.category?.name ?? 'Điều tra' }}</span>
              <span class="text-slate-500">·</span>
              <span class="tracking-[1px] text-slate-500 uppercase">{{ formatNewsDate(item.publishedAt) }}</span>
            </div>
            <h3 class="font-vietnam font-semibold text-[28px] leading-[1.25] text-navy-900 group-hover:text-sage-600 transition-colors">
              {{ item.title }}
            </h3>
            <p v-if="item.summary" class="text-lg leading-[1.6] text-slate-600">
              {{ item.summary }}
            </p>
            <div class="flex items-center gap-3">
              <img
                v-if="item.authorAvatarUrl"
                :src="item.authorAvatarUrl"
                :alt="item.authorName ?? ''"
                class="size-8 rounded-full object-cover shrink-0"
              >
              <div v-else class="size-8 rounded-full bg-slate-300 shrink-0" />
              <span class="text-base leading-[1.6] text-navy-900">{{ item.authorName ?? 'Biên tập viên' }}</span>
              <span class="text-slate-500">·</span>
              <span class="text-base leading-[1.6] text-slate-500">
                Đọc {{ estimateReadTime(item.content) }} phút
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Skeleton -->
        <template v-if="editorPicks.length === 0">
          <div v-for="i in 2" :key="i" class="flex flex-col gap-6 animate-pulse">
            <div class="h-[360px] rounded-lg bg-slate-200" />
            <div class="flex flex-col gap-4">
              <div class="h-3 w-32 rounded bg-slate-200" />
              <div class="h-8 rounded bg-slate-200" />
              <div class="h-4 rounded bg-slate-200" />
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ─── Newsletter ─────────────────────────────── -->
    <section class="flex items-center justify-between gap-12 bg-navy-900 px-12 py-16">
      <div class="flex flex-1 flex-col gap-4">
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">Bản tin hàng tuần</p>
        <h2 class="font-vietnam font-semibold text-2xl leading-[1.25] text-white">
          Báo chí sức khỏe, gửi tới hộp thư bạn mỗi thứ Hai.
        </h2>
        <p class="text-base leading-[1.6] text-white/70">
          Tin tức được biên tập viên chọn lọc. Không spam, không nhảm. Hủy đăng ký chỉ với một cú nhấp.
        </p>
      </div>
      <div class="flex w-[540px] shrink-0 items-center gap-3">
        <input
          v-model="newsletterEmail"
          type="email"
          placeholder="email-cua-ban@email.com"
          class="h-12 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sage-600"
        >
        <button
          class="flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-red-500 px-7 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
          @click.prevent
        >
          Đăng ký
        </button>
      </div>
    </section>
  </div>
</template>
