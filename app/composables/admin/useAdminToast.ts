interface ToastMessage {
  text: string
  type: 'success' | 'error'
}

// Module-level ref — shared across all composable calls within the same app instance
const message = ref<ToastMessage | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

export function useAdminToast() {
  function show(text: string, type: 'success' | 'error' = 'success') {
    if (timer) clearTimeout(timer)
    message.value = { text, type }
    timer = setTimeout(() => {
      message.value = null
      timer = null
    }, 4000)
  }

  function clear() {
    if (timer) clearTimeout(timer)
    timer = null
    message.value = null
  }

  return { message: readonly(message), show, clear }
}
