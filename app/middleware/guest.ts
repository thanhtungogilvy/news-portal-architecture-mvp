export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (user.value) {
    const redirectTo = to.path.startsWith('/admin') ? '/admin' : '/'
    return navigateTo(redirectTo)
  }
})
