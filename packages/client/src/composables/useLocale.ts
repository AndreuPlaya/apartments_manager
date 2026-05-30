import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type SupportedLocale = 'en' | 'es'
const LOCALE_KEY = 'apt-mgr:locale'

export function useLocale() {
  const { locale } = useI18n()
  const currentLocale = computed(() => locale.value as SupportedLocale)

  function setLocale(lang: SupportedLocale) {
    locale.value = lang
    localStorage.setItem(LOCALE_KEY, lang)
  }

  function toggleLocale() {
    setLocale(currentLocale.value === 'en' ? 'es' : 'en')
  }

  return { currentLocale, setLocale, toggleLocale }
}
