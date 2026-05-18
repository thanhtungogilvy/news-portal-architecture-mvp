---
applyTo: "app/stores/**"
---

# Pinia Stores

Pinia **chỉ** dùng cho state thật sự global — cần ở nhiều nơi không liên quan, persistent qua route transition. Server state và domain state thuộc về composable.

## Nuxt/Pinia Rules

- Store files nằm dưới `app/stores/`; `@pinia/nuxt` auto-import stores trong Nuxt app.
- `defineStore`, `storeToRefs`, `acceptHMRUpdate`, và store composables được `@pinia/nuxt` auto-import; explicit import vẫn được nếu giúp code rõ hơn.
- Dùng setup-store style (`defineStore('name', () => { ... })`) để đồng nhất với Vue Composition API.
- Không tạo state mutable ở module top-level ngoài `defineStore`; SSR có thể share state giữa requests.
- Khi cần hydrate/init store một lần ở page/layout, dùng `callOnce` thay vì gọi action tự do trong nhiều component.
- Dùng store trong component, composable, route middleware, plugin, hoặc store action; không gọi `useStore()` ở module top-level.
- Trong async action có dùng store khác, gọi mọi `useOtherStore()` trước `await` để giữ đúng SSR context.
- Không thêm dependency mới cho store helper nếu platform API đủ dùng.
- Thêm HMR snippet cho mỗi store trong dev.

## Phân loại state

| Loại | Ở đâu | Ví dụ |
|------|-------|-------|
| Server state | composable + useFetch | danh sách buildings, chi tiết room |
| Global client state | Pinia store | session, sidebar open/closed, toast queue |
| Form state | component local hoặc composable | form.name, form.address, errors |
| Derived state | computed | filteredBuildings, totalActiveRooms |

## Stores trong v0.1

| Store | File | Giữ gì |
|-------|------|--------|
| Auth | `stores/auth.ts` | user, role, isAuthenticated |
| App UI | `stores/app.ts` | sidebarOpen, activeNav |
| Notifications | `stores/notifications.ts` | toast queue, notification count |

## ✓ Cách dùng đúng

**Auth store — session, user, role:**
```ts
// app/stores/auth.ts
import type { AuthUser } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const role = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'admin')

  function setUser(u: AuthUser | null) {
    user.value = u
  }

  function clearSession() {
    user.value = null
  }

  return { user, isAuthenticated, role, isAdmin, setUser, clearSession }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
```

**App store — UI state, sidebar:**
```ts
// app/stores/app.ts
export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const activeNavItem = ref<string | null>(null)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setActiveNav(key: string) {
    activeNavItem.value = key
  }

  return { sidebarOpen, activeNavItem, toggleSidebar, setActiveNav }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
}
```

**Notifications store — toast queue:**
```ts
// app/stores/notifications.ts
interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([])

  function addToast(toast: Omit<Toast, 'id'>) {
    toasts.value.push({ ...toast, id: crypto.randomUUID() })
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, addToast, removeToast }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot))
}
```

**Dùng store trong component:**
```vue
<script setup lang="ts">
const authStore = useAuthStore()
const appStore = useAppStore()

// ✓ Dùng storeToRefs để reactive destructure
const { user, isAdmin } = storeToRefs(authStore)
const { sidebarOpen } = storeToRefs(appStore)

// ✓ Actions destructure trực tiếp được vì đã bound vào store
const { clearSession } = authStore
</script>
```

**Init store một lần trong page/layout:**
```vue
<script setup lang="ts">
const authStore = useAuthStore()

await callOnce('auth:init', () => authStore.loadSession())
</script>
```

**Store dùng store khác — gọi trước await:**
```ts
// app/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  async function signOut() {
    const notifications = useNotificationsStore()

    await $fetch('/api/auth/logout', { method: 'POST' })
    notifications.addToast({ type: 'success', message: 'Đã đăng xuất' })
  }

  return { signOut }
})
```

**Setup store cần reset thì tự implement `$reset`:**
```ts
export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const activeNavItem = ref<string | null>(null)

  function $reset() {
    sidebarOpen.value = true
    activeNavItem.value = null
  }

  return { sidebarOpen, activeNavItem, $reset }
})
```

**Batch mutation bằng `$patch` khi update nhiều field:**
```ts
const appStore = useAppStore()

appStore.$patch({
  sidebarOpen: false,
  activeNavItem: 'settings',
})
```

**Route middleware — gọi store bên trong function:**
```ts
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

**Subscribe chỉ cho cross-cutting concern thật sự:**
```ts
const unsubscribe = notificationsStore.$onAction(({ name, onError }) => {
  onError((error) => {
    console.error(`Notification action failed: ${name}`, error)
  })
})

unsubscribe()
```

## ✗ Cách không được dùng

```ts
// ✗ Đừng dùng Pinia cho server/domain state
export const useBuildingsStore = defineStore('buildings', () => {
  const list = ref<Building[]>([])
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    list.value = await $fetch('/api/buildings')  // ← dùng composable + useFetch
    loading.value = false
  }

  return { list, loading, fetchList }
})

// ✗ Đừng control modal state trong store cho domain flow
export const useModalStore = defineStore('modal', () => {
  const buildingFormOpen = ref(false)
  // modal state thuộc về page/component, không global
})

// ✗ Đừng duplicate derived state
export const useBuildingsStore = defineStore('buildings', () => {
  const buildings = ref<Building[]>([])
  const activeBuildings = ref<Building[]>([])  // ← sai, dùng computed
  // const activeBuildings = computed(() => buildings.value.filter(b => b.status === 'active'))
})

// ✗ Đừng destructure trực tiếp mà không dùng storeToRefs (mất reactivity)
const { user } = useAuthStore()  // ← mất reactive
// → const { user } = storeToRefs(useAuthStore())

// ✓ Action thì destructure trực tiếp được
const { clearSession } = useAuthStore()

// ✗ Đừng gọi action trong store để fetch server data rồi cache trong state
// Server state cần freshness → dùng useFetch với cache control, không Pinia

// ✗ Đừng gọi store ở module top-level
const authStore = useAuthStore()
export function requireAdmin() {
  return authStore.isAdmin
}

// ✗ Đừng tạo circular dependency đọc state trong setup của 2 store
export const useAStore = defineStore('a', () => {
  const b = useBStore()
  const name = computed(() => b.name) // nếu B cũng đọc A trong setup sẽ loop
  return { name }
})

// ✗ Đừng quên return state trong setup store
export const useBadStore = defineStore('bad', () => {
  const count = ref(0)
  return {} // Pinia không track count
})
```

## Testing

- Unit test store: tạo fresh Pinia mỗi test bằng `setActivePinia(createPinia())`.
- Component test có store: dùng `@pinia/testing` nếu package đã được thêm.
- Không thêm `@pinia/testing` chỉ để viết instruction; thêm dependency khi có test thật cần mock store.

```ts
import { createPinia, setActivePinia } from 'pinia'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resets app state', () => {
    const store = useAppStore()
    store.sidebarOpen = false
    store.$reset()
    expect(store.sidebarOpen).toBe(true)
  })
})
```
