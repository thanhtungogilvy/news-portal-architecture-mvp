<script setup lang="ts">
const { loading, error } = defineProps<{
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  submit: [email: string, password: string]
}>()

const email = ref('')
const password = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})

function validate(): boolean {
  fieldErrors.value = {}
  if (!email.value) fieldErrors.value.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) fieldErrors.value.email = 'Enter a valid email address'
  if (!password.value) fieldErrors.value.password = 'Password is required'
  return Object.keys(fieldErrors.value).length === 0
}

function onSubmit() {
  if (validate()) emit('submit', email.value, password.value)
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="onSubmit">
    <UiInput
      v-model="email"
      type="email"
      label="Email"
      placeholder="admin@example.com"
      autocomplete="email"
      :error="fieldErrors.email"
    />
    <UiInput
      v-model="password"
      type="password"
      label="Password"
      placeholder="••••••••"
      autocomplete="current-password"
      :error="fieldErrors.password"
    />

    <p v-if="error" class="rounded-md bg-error-light px-4 py-3 text-sm text-error-dark">
      {{ error }}
    </p>

    <UiButton type="submit" class="w-full" :disabled="loading">
      {{ loading ? 'Signing in…' : 'Sign in' }}
    </UiButton>
  </form>
</template>
