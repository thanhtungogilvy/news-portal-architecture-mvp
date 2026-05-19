<script setup lang="ts">
const { categories } = useCategoryList()
</script>

<template>
  <footer class="bg-navy-950">
    <!-- Main footer content -->
    <div class="flex items-start justify-between px-12 pt-16 pb-12">
      <!-- Brand -->
      <div class="flex w-[360px] flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="size-7 rounded-full bg-white/20" />
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
    <div class="mx-12 h-px bg-white/10" />

    <!-- Bottom bar -->
    <div class="flex items-center justify-between px-12 py-6 text-sm leading-[1.5] text-white/50">
      <p>© {{ new Date().getFullYear() }} Verdana Health Media. Bảo lưu mọi quyền.</p>
      <p>Quy chuẩn biên tập · Đính chính · Đường dây mật báo</p>
    </div>
  </footer>
</template>
