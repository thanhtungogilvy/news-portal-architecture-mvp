import { newsletterSubscribeSchema } from '~/utils/validators/newsletter'
import { isApiError } from '~/utils/api'

export function useNewsletterSubscribe() {
  const email = ref('')
  const emailError = ref('')
  const loading = ref(false)
  const success = ref(false)

  async function submit() {
    emailError.value = ''

    const result = newsletterSubscribeSchema.safeParse({ email: email.value })
    if (!result.success) {
      emailError.value = result.error.issues[0]?.message ?? 'Email không hợp lệ'
      return
    }

    loading.value = true
    try {
      await $fetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: result.data,
      })
      success.value = true
      email.value = ''
    }
    catch (err: unknown) {
      if (isApiError(err) && err.data.error.code === 'VALIDATION_ERROR') {
        emailError.value = 'Email không hợp lệ'
      }
      else {
        emailError.value = 'Không thể đăng ký. Vui lòng thử lại.'
      }
    }
    finally {
      loading.value = false
    }
  }

  return { email, emailError, loading, success, submit }
}
