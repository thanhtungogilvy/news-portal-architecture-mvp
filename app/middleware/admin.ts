export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, isAdmin } = useAdminAccess()

  if (!isAuthenticated.value) {
    return navigateTo('/admin/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
