<template>
  <footer class="border-t border-border bg-smoke-200">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div class="border-b border-border pb-8">
        <p class="max-w-2xl text-[12px] font-semibold leading-[1.29] tracking-[-0.224px] text-[#333333]">
          News Portal
        </p>
        <p class="mt-4 max-w-3xl text-[17px] leading-[1.47] tracking-apple text-title">
          Một giao diện đọc bài yên tĩnh hơn, ít chrome hơn và ưu tiên headline, hình ảnh, cùng nhịp đọc dài.
        </p>
      </div>

      <div class="grid gap-8 py-8 md:grid-cols-3">
        <div>
          <h3 class="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-title">
            Khám phá
          </h3>
          <div class="mt-4 flex flex-col text-[17px] leading-[2.1] tracking-apple text-[#333333]">
            <NuxtLink to="/" class="transition-colors hover:text-blue-600">Trang chủ</NuxtLink>
            <NuxtLink to="/news" class="transition-colors hover:text-blue-600">Tin mới</NuxtLink>
          </div>
        </div>

        <div>
          <h3 class="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-title">
            Dòng đọc
          </h3>
          <p class="mt-4 max-w-sm text-[17px] leading-[1.47] tracking-apple text-[#333333]">
            Theo dõi các câu chuyện nổi bật, chuyên mục mới nhất và bài viết dài với cùng một nhịp trình bày nhất quán.
          </p>
        </div>

        <div>
          <h3 class="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-title">
            Điều hướng nhanh
          </h3>
          <div class="mt-4">
            <NuxtLink to="/news" class="text-[17px] leading-[1.47] tracking-apple text-blue-600 transition-colors hover:text-blue-500">
              Mở trang tin
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="border-t border-border pt-5 text-[12px] leading-none tracking-[-0.12px] text-[#7A7A7A]">
        &copy; {{ new Date().getFullYear() }} News Portal. All rights reserved.
      </div>
    </div>
  </footer>
</template>
