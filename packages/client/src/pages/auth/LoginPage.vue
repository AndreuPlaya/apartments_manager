<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api/client'
import { setCachedConfig } from '../../router'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const { error } = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await api.auth.login({ username: username.value, password: password.value })
    setCachedConfig({ ok: true, is_admin: res.is_admin, username: res.username })
    router.push('/')
  } catch (e: unknown) {
    if (e instanceof Error) errorMsg.value = e.message
    else errorMsg.value = 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <h1 class="auth-page__title">Sign in</h1>
      <p class="auth-page__subtitle">Apartments Manager</p>
      <form @submit.prevent="login">
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" autocomplete="username" required autofocus />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="errorMsg" class="text-danger text-sm" style="margin: 0 0 0.75rem">{{ errorMsg }}</p>
        <button class="btn btn--primary btn--full btn--lg" type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
