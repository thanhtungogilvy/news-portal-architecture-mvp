export function useAuth() {
  const supabase = useSupabaseClient()
  const store = useAuthStore()

  const user = computed(() => store.user)
  const isAuthenticated = computed(() => store.isAuthenticated)

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    store.setUser(data.user)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    store.setUser(null)
  }

  return { user, isAuthenticated, signIn, signOut }
}
