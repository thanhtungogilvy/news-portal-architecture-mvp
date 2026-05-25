export function useAdminAccess() {
  const user = useSupabaseUser()

  const role = computed(() => {
    const metadata = user.value?.app_metadata as Record<string, unknown> | undefined
    return typeof metadata?.role === 'string' ? metadata.role : null
  })

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => role.value === 'admin')

  return { user, role, isAuthenticated, isAdmin }
}
