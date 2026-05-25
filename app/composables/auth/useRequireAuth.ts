export function useRequireAuth() {
  const { user, isAdmin } = useAdminAccess()
  const router = useRouter()

  watch(
    user,
    (newUser) => {
      if (!newUser) {
        router.push('/admin/login')
        return
      }

      if (!isAdmin.value) {
        router.push('/')
      }
    },
    { immediate: true },
  )

  return { user }
}
