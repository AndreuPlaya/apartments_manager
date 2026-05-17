<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { setCachedConfig } from '../router'

const router = useRouter()

const username = ref('')
const password = ref('')
const fullName = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function setup() {
  errorMsg.value = ''
  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters'
    return
  }
  loading.value = true
  try {
    await api.auth.setup({ username: username.value, password: password.value, full_name: fullName.value })
    // Log in with the new admin account
    const res = await api.auth.login({ username: username.value, password: password.value })
    setCachedConfig({ ok: true, is_admin: res.is_admin, username: res.username })
    router.push('/')
  } catch (e: unknown) {
    if (e instanceof Error) errorMsg.value = e.message
    else errorMsg.value = 'Setup failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <h1 class="auth-page__title">First-run setup</h1>
      <p class="auth-page__subtitle">Create the administrator account to get started.</p>
      <form @submit.prevent="setup">
        <div class="form-group">
          <label>Full name</label>
          <input v-model="fullName" type="text" autocomplete="name" required autofocus />
        </div>
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" autocomplete="new-password" required minlength="8" />
          <span class="text-muted text-sm">Minimum 8 characters</span>
        </div>
        <p v-if="errorMsg" class="text-danger text-sm" style="margin: 0 0 0.75rem">{{ errorMsg }}</p>
        <button class="btn btn--primary btn--full btn--lg" type="submit" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create admin account' }}
        </button>
      </form>
    </div>
  </div>
</template>
