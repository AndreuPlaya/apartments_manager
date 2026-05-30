import { createI18n } from 'vue-i18n'
import en from './locales/en'
import es from './locales/es'

const LOCALE_KEY = 'apt-mgr:locale'

function getStartLocale(): string {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'en' || saved === 'es') return saved
    return navigator.language?.startsWith('es') ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: getStartLocale(),
  fallbackLocale: 'en',
  messages: { en, es },
})
