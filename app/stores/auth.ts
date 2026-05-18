import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  function setUser(value: User | null) {
    user.value = value
  }

  return { user, isAuthenticated, setUser }
})
