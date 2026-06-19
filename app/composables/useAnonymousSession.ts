/**
 * useAnonymousSession — generates a UUID v4 session ID on first visit and
 * persists it in a cookie (`session_id`, SameSite=Lax, 365-day expiry).
 * Subsequent visits reuse the existing ID.
 *
 * Works in both SSR and client — useCookie is Nuxt-SSR-compatible.
 */
export function useAnonymousSession() {
  const sessionCookie = useCookie('session_id', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  if (!sessionCookie.value) {
    sessionCookie.value = crypto.randomUUID()
  }

  const sessionId = computed(() => sessionCookie.value ?? '')

  return { sessionId }
}
