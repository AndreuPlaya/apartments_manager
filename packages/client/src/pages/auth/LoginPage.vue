<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/client'
import { setCachedConfig } from '../../router'

const router = useRouter()
const { t } = useI18n()

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
    else errorMsg.value = t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <h1 class="auth-page__title">{{ t('auth.signIn') }}</h1>
      <p class="auth-page__subtitle">{{ t('auth.appName') }}</p>
      <form @submit.prevent="login">
        <div class="form-group">
          <label>{{ t('auth.username') }}</label>
          <input v-model="username" type="text" autocomplete="username" required autofocus />
        </div>
        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="errorMsg" class="text-danger text-sm" style="margin: 0 0 0.75rem">{{ errorMsg }}</p>
        <button class="btn btn--primary btn--full btn--lg" type="submit" :disabled="loading">
          {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
        </button>
      </form>
    </div>
  </div>
</template>
