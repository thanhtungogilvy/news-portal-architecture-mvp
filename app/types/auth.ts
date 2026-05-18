export interface AuthUser {
  id: string
  email: string
  role: string | null
  isAdmin: boolean
}
