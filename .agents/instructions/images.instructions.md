---
applyTo: "app/**/*.vue, app/**/*.ts"
---

# Images và Icons

Icons dùng nuxt-svgo (auto-import). Images static để trong `/public/`. Font chỉ được xem là self-host khi file font và global CSS đã tồn tại.

## Icons (nuxt-svgo)

Đặt file `.svg` vào `app/assets/icons/`. Module tự động import với prefix `Icon`.

> Hiện tại `app/assets/icons/` chưa có SVG nào. Trước khi dùng `<Icon... />`, kiểm tra file icon thật sự tồn tại.

**Quy tắc đặt tên file SVG:** `kebab-case.svg` → `<IconPascalCase />`

### Icon inventory (app/assets/icons/)

Inventory phải được lấy từ filesystem:

```bash
find app/assets/icons -maxdepth 1 -type f -name '*.svg' -print | sort
```

Không giả định icon tồn tại chỉ vì component name hợp lý.

### Thêm icon mới

1. Kiểm tra inventory thật bằng lệnh trên
2. Nếu chưa có: đặt file `kebab-case.svg` vào `app/assets/icons/`
3. SVG phải dùng `currentColor` để Tailwind text color hoạt động
4. Sau khi thêm `briefcase.svg`, component sẽ là `<IconBriefcase />`

```svg
<!-- ✅ SVG chuẩn -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="..." />
</svg>

<!-- ❌ Hardcode màu — Tailwind class không override được -->
<svg><path fill="#374151" d="..." /></svg>
```

## ✓ Cách dùng đúng

**Icon trong template:**
```vue
<!-- Chỉ dùng sau khi app/assets/icons/briefcase.svg tồn tại -->
<IconBriefcase class="w-5 h-5 text-body" />

<!-- Chỉ dùng sau khi app/assets/icons/layers.svg tồn tại -->
<IconLayers class="w-4 h-4 text-body" />

<!-- Icon trong navigation item -->
<component :is="navItem.icon" class="w-5 h-5 shrink-0" />
```

**Icon với accessibility:**
```vue
<!-- Icon chỉ trang trí — ẩn với screen reader -->
<IconBriefcase class="w-5 h-5" aria-hidden="true" />

<!-- Icon có nghĩa — cần label -->
<button aria-label="Xóa tòa nhà">
  <IconTrash class="w-4 h-4" aria-hidden="true" />
</button>
```

**Dynamic icon qua component:**
```vue
<!-- app/components/app/AppNavItem.vue -->
<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  label: string
  to: string
  icon: Component  // truyền vào component icon đã tồn tại
}>()
</script>

<template>
  <NuxtLink :to="to" class="flex items-center gap-3 px-3 py-2">
    <component :is="icon" class="w-5 h-5 shrink-0" aria-hidden="true" />
    <span>{{ label }}</span>
  </NuxtLink>
</template>
```

**Static image trong `/public/`:**
```vue
<img src="/images/logo.png" alt="Zeno House" class="h-8 w-auto" />
<img src="/images/empty-buildings.svg" alt="" aria-hidden="true" class="w-32 h-32 mx-auto" />
```

**Font:**
```vue
<!-- Chỉ dùng font self-host sau khi font file + global CSS đã được thêm và register -->
<p class="font-sans text-sm text-body">Nội dung</p>
```

## ✗ Cách không được dùng

```vue
<!-- ✗ Đừng dùng <img> cho icon — dùng nuxt-svgo component -->
<img src="/icons/building.svg" class="w-5 h-5" />

<!-- ✗ Đừng import SVG thủ công — module đã auto-import -->
<script setup>
import BuildingIcon from '~/assets/icons/building.svg'  // không cần
</script>

<!-- ✗ Đừng đặt ảnh lớn trong app/assets/ — để trong /public/ -->
<!-- app/assets/images/banner.jpg ← sai, dùng /public/images/banner.jpg -->

<!-- ✗ Đừng load Google Fonts từ CDN — dùng local font file nếu project cần font custom -->
<!-- <link href="https://fonts.googleapis.com/css2?family=Inter..." /> -->

<!-- ✗ Đừng bỏ qua alt text cho ảnh có nghĩa -->
<img src="/images/empty.svg" />  <!-- thiếu alt -->

<!-- ✗ Đừng hardcode kích thước bằng width/height attribute khi có Tailwind -->
<IconBuilding width="20" height="20" />  <!-- dùng class="w-5 h-5" -->
```

## Config nuxt-svgo (đã có trong nuxt.config.ts)

```ts
// nuxt.config.ts — đã configured, không sửa nếu không cần
svgo: {
  autoImportPath: './assets/icons/',
  defaultImport: 'component',
  componentPrefix: 'Icon',
}
```
