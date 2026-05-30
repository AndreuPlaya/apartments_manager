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
const fullName = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function setup() {
  errorMsg.value = ''
  if (password.value.length < 8) {
    errorMsg.value = t('auth.passwordTooShort')
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
    else errorMsg.value = t('auth.setupFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__card">
      <h1 class="auth-page__title">{{ t('auth.setupTitle') }}</h1>
      <p class="auth-page__subtitle">{{ t('auth.setupSubtitle') }}</p>
      <form @submit.prevent="setup">
        <div class="form-group">
          <label>{{ t('auth.fullName') }}</label>
          <input v-model="fullName" type="text" autocomplete="name" required autofocus />
        </div>
        <div class="form-group">
          <label>{{ t('auth.username') }}</label>
          <input v-model="username" type="text" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
          <input v-model="password" type="password" autocomplete="new-password" required minlength="8" />
          <span class="text-muted text-sm">{{ t('auth.passwordHint') }}</span>
        </div>
        <p v-if="errorMsg" class="text-danger text-sm" style="margin: 0 0 0.75rem">{{ errorMsg }}</p>
        <button class="btn btn--primary btn--full btn--lg" type="submit" :disabled="loading">
          {{ loading ? t('auth.creatingAccount') : t('auth.createAdmin') }}
        </button>
      </form>
    </div>
  </div>
</template>
