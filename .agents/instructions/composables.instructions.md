---
applyTo: "app/composables/**"
---

# Composables

Server state và domain orchestration nằm ở composable, không phải Pinia store.

## Pattern: 3 composable theo mục đích

| Composable | Mục đích | File |
|-----------|---------|------|
| `use<Domain>List` | Fetch list, pagination, filter | `useBuildingList.ts` |
| `use<Domain>Detail` | Fetch single item | `useBuildingDetail.ts` |
| `use<Domain>Form` | Form state, validation, submit | `useBuildingForm.ts` |

## Nuxt Auto-import Rules

- Composables nằm dưới `app/composables/`.
- Nuxt mặc định chỉ scan top-level files, nhưng repo này đã cấu hình `imports.dirs: ["composables/**"]`, nên pattern nested như `app/composables/buildings/useBuildingList.ts` auto-import được.
- Nếu bỏ cấu hình nested scan trong `nuxt.config.ts`, phải re-export nested composables qua `app/composables/index.ts`.
- Export named function, không export default, để tên public rõ ràng và dễ search.
- Không đặt function tên `useFetch`; đây là reserved Nuxt composable name.

## Nuxt Context & SSR Rules

- Gọi Nuxt composables (`useRoute`, `useRuntimeConfig`, `useFetch`, `useSupabaseClient`, `useSupabaseUser`, `useCookie`, `useState`) bên trong function composable, không gọi ở module top-level.
- Không tạo module-level `ref`, `reactive`, hoặc cache mutable cho dữ liệu request/user; SSR có thể share state giữa requests.
- State cần sống qua SSR/hydration dùng `useState` với key rõ ràng, hoặc để ở Pinia nếu đó là client/app state thật sự.
- Browser API (`window`, `document`, `localStorage`) chỉ dùng sau `onMounted`, trong `import.meta.client`, hoặc trong component/composable client-only.

## ✓ Cách dùng đúng

**List composable — useFetch, typed, expose computed:**
```ts
// app/composables/buildings/useBuildingList.ts
import type { Building } from '~/types/buildings'
import type { ApiSuccess } from '~/types/api'

export function useBuildingList() {
  const { data, status, error, refresh } = useFetch<ApiSuccess<Building[]>>('/api/buildings', {
    key: 'buildings-list',
    default: () => ({ data: [] }),
  })

  const buildings = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.meta?.total ?? 0)

  return { buildings, total, status, error, refresh }
}
```

**Detail composable — route param, watch khi id thay đổi:**
```ts
// app/composables/buildings/useBuildingDetail.ts
import type { Building } from '~/types/buildings'
import type { ApiSuccess } from '~/types/api'

export function useBuildingDetail(id: MaybeRef<string>) {
  const { data, status, error, refresh } = useFetch<ApiSuccess<Building>>(
    () => `/api/buildings/${toValue(id)}`,
    {
      key: () => `building-${toValue(id)}`,
      watch: [() => toValue(id)],
    }
  )

  const building = computed(() => data.value?.data ?? null)

  return { building, status, error, refresh }
}
```

**Form composable — Zod validation, submit với $fetch:**
```ts
// app/composables/buildings/useBuildingForm.ts
import { buildingSchema, type BuildingInput } from '~/utils/validators/buildings'

export function useBuildingForm(initial?: Partial<BuildingInput>) {
  const form = reactive<BuildingInput>({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
  })

  const errors = ref<Partial<Record<keyof BuildingInput, string>>>({})
  const submitting = ref(false)

  async function submit() {
    errors.value = {}
    const result = buildingSchema.safeParse(form)

    if (!result.success) {
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof BuildingInput
        errors.value[key] = issue.message
      })
      return null
    }

    submitting.value = true
    try {
      const { data } = await $fetch<ApiSuccess<Building>>('/api/buildings', {
        method: 'POST',
        body: result.data,
      })
      return data
    } finally {
      submitting.value = false
    }
  }

  return { form, errors, submitting, submit }
}
```

**Data fetching rule — chọn đúng primitive:**

| Tình huống | Dùng |
|-----------|------|
| Initial data cần SSR/hydration payload | `useFetch` hoặc `useAsyncData` |
| Query từ SDK/logic custom | `useAsyncData` |
| User action như submit/delete/export | `$fetch` |
| Không critical cho initial render | `useLazyFetch` hoặc `useFetch({ lazy: true })` |

Khi wrap `useFetch`/`useAsyncData` trong composable, prefer return trực tiếp reactive refs/result để page/component quyết định loading UI. Với shared hoặc parameterized data, đặt `key` rõ ràng để tránh cache collision và để `useNuxtData` dùng lại được.

**Dùng trong page:**
```vue
<!-- app/pages/buildings/index.vue -->
<script setup lang="ts">
const { buildings, total, status, error, refresh } = useBuildingList()
</script>
```

## ✗ Cách không được dùng

```ts
// ✗ Đừng gọi Supabase business data trực tiếp trong composable
const supabase = useSupabaseClient()
const { data } = await supabase.from('buildings').select('*')
// → Phải đi qua server/api/

// ✓ Exception: auth composable được dùng Supabase Auth client
export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  return { user, signOut: () => supabase.auth.signOut() }
}

// ✗ Đừng làm 1 composable to ôm tất cả
export function useBuildings() {
  // list + detail + form + delete + export ... = quá to, khó maintain
}

// ✗ Đừng đặt server state vào Pinia
export const useBuildingsStore = defineStore('buildings', {
  state: () => ({ list: [] as Building[] }),
  actions: {
    async fetchList() {
      this.list = await $fetch('/api/buildings') // dùng useFetch trong composable
    },
  },
})

// ✗ Đừng duplicate derived values bằng ref khi computed đủ dùng
const filteredBuildings = ref<Building[]>([])
watch(buildings, (list) => {
  filteredBuildings.value = list.filter(b => b.status === 'active')
})
// → Dùng computed: const activeBuildings = computed(() => buildings.value.filter(...))

// ✗ Đừng bỏ qua error handling khi $fetch
const data = await $fetch('/api/buildings') // không catch = silent fail
// → Wrap trong try/catch hoặc dùng useFetch với onResponseError
```

## Naming convention

- Composable phải bắt đầu bằng `use`
- Tên rõ domain + mục đích: `useBuildingList`, `useBuildingForm`, không phải `useData`
- Export named function, không export default
