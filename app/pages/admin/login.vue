<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'guest' })

const { signIn } = useAuth()
const router = useRouter()

const submitting = ref(false)
const authError = ref<string | null>(null)

async function onLogin(email: string, password: string) {
  submitting.value = true
  authError.value = null
  try {
    await signIn(email, password)
    router.push('/admin')
  }
  catch (err: unknown) {
    authError.value = err instanceof Error ? err.message : 'Invalid email or password.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-smoke-50 px-4">
    <div class="w-full max-w-sm">
      <!-- Brand mark -->
      <div class="mb-8 text-center">
        <p class="text-xs font-semibold uppercase tracking-widest text-body">News Portal</p>
        <h1 class="mt-1 text-2xl font-bold text-title">Admin sign in</h1>
        <p class="mt-2 text-sm text-body">Enter your credentials to continue.</p>
      </div>

      <UiCard>
        <AuthLoginForm
          :loading="submitting"
          :error="authError"
          @submit="onLogin"
        />
      </UiCard>
    </div>
  </div>
</template>
