<script setup lang="ts">
const { categories } = useCategoryList()

const {
  email: newsletterEmail,
  emailError: newsletterError,
  loading: newsletterLoading,
  success: newsletterSuccess,
  submit: submitNewsletter,
} = useNewsletterSubscribe()
</script>

<template>
  <!-- Newsletter -->
  <section
    id="newsletter-section"
    class="flex flex-col gap-8 bg-navy-900 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-16"
  >
    <div class="flex flex-1 flex-col gap-4">
      <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-sage-600 uppercase">
        Bản tin hàng tuần
      </p>
      <h2 class="font-vietnam font-semibold text-2xl leading-[1.25] text-white">
        Báo chí sức khỏe, gửi tới hộp thư bạn mỗi thứ Hai.
      </h2>
      <p class="text-base leading-[1.6] text-white/70">
        Tin tức được biên tập viên chọn lọc. Không spam, không nhảm. Hủy đăng ký chỉ với một cú nhấp.
      </p>
    </div>
    <div class="flex w-full flex-col gap-2 lg:w-[540px] lg:shrink-0">
      <Transition name="fade" mode="out-in">
        <p v-if="newsletterSuccess" class="py-3 text-base font-medium text-sage-600">
          ✓ Đã đăng ký thành công! Chúng tôi sẽ gửi bản tin sớm nhất.
        </p>
        <form v-else class="flex items-start gap-3" novalidate @submit.prevent="submitNewsletter">
          <div class="flex flex-1 flex-col gap-1.5">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="email-cua-ban@email.com"
              :disabled="newsletterLoading"
              :class="[
                'h-12 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-500 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sage-600 disabled:opacity-60',
                newsletterError ? 'border-red-400' : 'border-slate-200',
              ]"
            >
            <p v-if="newsletterError" class="text-xs text-red-400">{{ newsletterError }}</p>
          </div>
          <button
            type="submit"
            :disabled="newsletterLoading"
            class="flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-red-500 px-7 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {{ newsletterLoading ? 'Đang gửi…' : 'Đăng ký' }}
          </button>
        </form>
      </Transition>
    </div>
  </section>

  <footer class="bg-navy-950">
    <!-- Main footer grid -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-10 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:px-12 lg:pt-16 lg:pb-12">
      <!-- Brand -->
      <div class="col-span-2 flex flex-col gap-4 lg:col-span-1">
        <div class="flex items-center gap-2">
          <IconLogoMark class="size-7 text-white/20" aria-hidden="true" />
          <span class="font-vietnam font-medium text-base leading-[1.35] text-white">Verdana News</span>
        </div>
        <p class="text-base leading-[1.6] text-white/65">
          Báo chí độc lập về sức khỏe, thể chất và khoa học chăm sóc bản thân.
        </p>
      </div>

      <!-- Sections -->
      <div class="flex flex-col gap-3">
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-white/50 uppercase">Chuyên mục</p>
        <div class="h-1" />
        <NuxtLink
          to="/"
          class="text-base leading-[1.6] text-white/85 transition-colors hover:text-white"
        >
          Mới nhất
        </NuxtLink>
        <NuxtLink
          v-for="cat in categories"
          :key="cat.slug"
          :to="`/categories/${cat.slug}`"
          class="text-base leading-[1.6] text-white/85 transition-colors hover:text-white"
        >
          {{ cat.name }}
        </NuxtLink>
      </div>

      <!-- Company -->
      <div class="flex flex-col gap-3">
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-white/50 uppercase">Công ty</p>
        <div class="h-1" />
        <span
          v-for="label in ['Giới thiệu', 'Đội ngũ biên tập', 'Tuyển dụng', 'Báo chí', 'Liên hệ']"
          :key="label"
          class="text-base leading-[1.6] text-white/85 cursor-pointer hover:text-white transition-colors"
        >
          {{ label }}
        </span>
      </div>

      <!-- Legal -->
      <div class="flex flex-col gap-3">
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-white/50 uppercase">Pháp lý</p>
        <div class="h-1" />
        <span
          v-for="label in ['Quyền riêng tư', 'Điều khoản sử dụng', 'Cookies', 'Trợ năng']"
          :key="label"
          class="text-base leading-[1.6] text-white/85 cursor-pointer hover:text-white transition-colors"
        >
          {{ label }}
        </span>
      </div>

      <!-- Follow -->
      <div class="flex flex-col gap-3">
        <p class="text-xs font-medium leading-[1.4] tracking-[1px] text-white/50 uppercase">Theo dõi</p>
        <div class="h-1" />
        <span
          v-for="label in ['Twitter / X', 'LinkedIn', 'Instagram', 'Nguồn cấp RSS']"
          :key="label"
          class="text-base leading-[1.6] text-white/85 cursor-pointer hover:text-white transition-colors"
        >
          {{ label }}
        </span>
      </div>
    </div>

    <!-- Divider -->
    <div class="mx-4 h-px bg-white/10 sm:mx-6 lg:mx-12" />

    <!-- Bottom bar -->
    <div class="flex flex-col gap-1.5 px-4 py-5 text-sm leading-[1.5] text-white/50 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6 lg:px-12 lg:py-6">
      <p>© {{ new Date().getFullYear() }} Verdana Health Media. Bảo lưu mọi quyền.</p>
      <p>Quy chuẩn biên tập · Đính chính · Đường dây mật báo</p>
    </div>
  </footer>
</template>
