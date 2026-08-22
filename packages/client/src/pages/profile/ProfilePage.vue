<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../api/client'
import type { ProfileData } from '../../api/client'
import { useToast } from '../../composables/useToast'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'
import { clearCachedConfig } from '../../router'
import ProfileTextField from '../../shared/fields/ProfileTextField.vue'
import ProfilePasswordField from '../../shared/fields/ProfilePasswordField.vue'
import ProfileLangField from '../../shared/fields/ProfileLangField.vue'
import AppSwitch from '../../shared/AppSwitch.vue'

const { t } = useI18n()
const router = useRouter()
const { success, error } = useToast()
const { currentLocale, setLocale } = useLocale()
const { isDark, setDark } = useTheme()

const profile = ref<ProfileData | null>(null)
const loading = ref(true)

const account = reactive({ full_name: '', email: '', username: '' })
const pw = reactive({ current: '', next: '', confirm: '' })
const pwError = ref('')

const langModel = ref<string>(currentLocale.value)

const initials = computed(() => {
  const name = profile.value?.full_name || account.username || '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

onMounted(async () => {
  try {
    const data = await api.profile.get()
    profile.value = data
    account.full_name = data.full_name
    account.email = data.email ?? ''
    account.username = data.username
  } catch {
    error(t('errors.unexpectedError'))
  } finally {
    loading.value = false
  }
})

const { run: saveAccount, loading: savingAccount } = useAsyncOp()
async function submitAccount() {
  await saveAccount(async () => {
    const usernameChanged = account.username !== profile.value?.username
    const updated = await api.profile.update({
      full_name: account.full_name,
      email: account.email,
      username: account.username,
    })
    profile.value = updated
    success(t('profile.saved'))
    if (usernameChanged) {
      clearCachedConfig()
      router.push('/profile')
    }
  })
}

const { run: savePassword, loading: savingPassword } = useAsyncOp()
async function submitPassword() {
  pwError.value = ''
  if (pw.next !== pw.confirm) {
    pwError.value = t('profile.passwordMismatch')
    return
  }
  await savePassword(async () => {
    await api.profile.changePassword({ current_password: pw.current, password: pw.next })
    success(t('profile.passwordChanged'))
    pw.current = ''
    pw.next = ''
    pw.confirm = ''
  })
}

function onLangChange(val: string) {
  langModel.value = val
  setLocale(val as 'en' | 'es')
}

</script>

<template>
  <div class="profile-page">

    <div v-if="loading" class="profile-page__loading">{{ t('common.loading') }}</div>

    <template v-else>

      <!-- Header -->
      <div class="profile-hdr">
        <div class="profile-hdr__avatar">{{ initials }}</div>
        <div class="profile-hdr__info">
          <p class="profile-hdr__name">{{ profile?.full_name || account.username }}</p>
          <div class="profile-hdr__meta">
            <span class="profile-hdr__username">@{{ profile?.username }}</span>
            <span
              class="profile-hdr__badge"
              :class="profile?.is_admin ? 'profile-hdr__badge--admin' : 'profile-hdr__badge--user'"
            >
              {{ profile?.is_admin ? t('profile.adminBadge') : t('profile.employeeBadge') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Account information -->
      <div class="profile-panel">
        <div class="details-panel">
          <span class="panel-label">{{ t('profile.account') }}</span>
          <div class="details-grid details-grid--3col">
            <ProfileTextField
              :text="t('profile.fullName')"
              :model-value="account.full_name"
              autocomplete="name"
              @update:model-value="account.full_name = $event"
            />
            <ProfileTextField
              :text="t('profile.email')"
              :model-value="account.email"
              type="email"
              autocomplete="email"
              @update:model-value="account.email = $event"
            />
            <ProfileTextField
              :text="t('profile.username')"
              :model-value="account.username"
              autocomplete="username"
              @update:model-value="account.username = $event"
            />
          </div>
        </div>
        <div class="profile-panel__footer">
          <button class="btn btn--primary btn--sm" :disabled="savingAccount" @click="submitAccount">
            {{ savingAccount ? t('common.saving') : t('profile.saveChanges') }}
          </button>
        </div>
      </div>

      <!-- Change password -->
      <div class="profile-panel">
        <div class="details-panel">
          <span class="panel-label">{{ t('profile.security') }}</span>
          <div class="details-grid details-grid--3col">
            <ProfilePasswordField
              :text="t('profile.currentPassword')"
              :model-value="pw.current"
              autocomplete="current-password"
              @update:model-value="pw.current = $event"
            />
            <ProfilePasswordField
              :text="t('profile.newPassword')"
              :model-value="pw.next"
              autocomplete="new-password"
              :minlength="8"
              @update:model-value="pw.next = $event"
            />
            <ProfilePasswordField
              :text="t('profile.confirmPassword')"
              :model-value="pw.confirm"
              autocomplete="new-password"
              @update:model-value="pw.confirm = $event"
            />
          </div>
        </div>
        <div class="profile-panel__footer">
          <span v-if="pwError" class="text-danger text-sm">{{ pwError }}</span>
          <button class="btn btn--primary btn--sm" :disabled="savingPassword" @click="submitPassword">
            {{ savingPassword ? t('common.saving') : t('profile.changePassword') }}
          </button>
        </div>
      </div>

      <!-- Preferences -->
      <div class="profile-panel">
        <div class="details-panel">
          <span class="panel-label">{{ t('profile.preferences') }}</span>
          <div class="details-grid details-grid--3col">
            <ProfileLangField
              :text="t('profile.language')"
              :model-value="langModel"
              @update:model-value="onLangChange"
            />
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="profile-panel">
        <div class="details-panel">
          <span class="panel-label">{{ t('profile.theme') }}</span>
          <div class="pf-switch-row">
            <div class="pf-switch-row__copy">
              <span class="pf-switch-row__title">{{ t('profile.darkMode') }}</span>
              <span class="pf-switch-row__hint">{{ t('profile.darkModeHint') }}</span>
            </div>
            <AppSwitch
              :model-value="isDark"
              :label="t('profile.darkMode')"
              @update:model-value="setDark"
            />
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
