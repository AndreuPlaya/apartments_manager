import { computed, ref } from 'vue'

export type SupportedTheme = 'light' | 'dark'

const THEME_KEY = 'apt-mgr:theme'

// La identidad cromática se aplica tal cual la definen §2 y §3: el claro es el
// tema por defecto. El oscuro es la variante invertida de §5.2 y se elige a
// mano desde las preferencias del usuario.
const DEFAULT_THEME: SupportedTheme = 'light'

// Se lee al cargar el módulo, así que no puede dar por hecho que haya
// localStorage: en los tests el entorno no siempre lo provee.
function readStoredTheme(): SupportedTheme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

const theme = ref<SupportedTheme>(readStoredTheme())

export function applyTheme(next: SupportedTheme) {
  document.documentElement?.setAttribute('data-theme', next)
}

export function useTheme() {
  const currentTheme = computed(() => theme.value)
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(next: SupportedTheme) {
    theme.value = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Sin almacenamiento el tema se aplica igual, solo no sobrevive a la recarga.
    }
    applyTheme(next)
  }

  function setDark(next: boolean) {
    setTheme(next ? 'dark' : 'light')
  }

  function toggleTheme() {
    setDark(!isDark.value)
  }

  return { currentTheme, isDark, setTheme, setDark, toggleTheme }
}

export { theme }
