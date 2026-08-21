import { computed, ref } from 'vue'

export type SupportedTheme = 'dark' | 'light'

const THEME_KEY = 'apt-mgr:theme'

// §5.2 de la identidad cromática: en las aplicaciones internas la norma se
// invierte y la tinta profunda pasa a fondo. El oscuro es el tema por defecto.
const DEFAULT_THEME: SupportedTheme = 'dark'

// Se lee al cargar el módulo, así que no puede dar por hecho que haya
// localStorage: en los tests el entorno no siempre lo provee.
function readStoredTheme(): SupportedTheme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : DEFAULT_THEME
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

  function setTheme(next: SupportedTheme) {
    theme.value = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Sin almacenamiento el tema se aplica igual, solo no sobrevive a la recarga.
    }
    applyTheme(next)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { currentTheme, setTheme, toggleTheme }
}

export { theme }
