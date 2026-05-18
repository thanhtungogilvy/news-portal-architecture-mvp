import type { AuthUser } from '~/types/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const role = deriveRole(user)

  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? '',
    role,
    isAdmin: role === 'admin',
  }

  return successResponse(authUser)
})
