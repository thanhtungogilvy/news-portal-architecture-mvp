export function useRequireAuth() {
  const user = useSupabaseUser()
  const router = useRouter()

  watch(
    user,
    (newUser) => {
      if (!newUser) {
        router.push('/login')
      }
    },
    { immediate: true },
  )

  return { user }
}
