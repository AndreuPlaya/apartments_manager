import { createApp } from 'vue'
import './styles/main.scss'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { applyTheme, theme } from './composables/useTheme'

applyTheme(theme.value)

createApp(App).use(router).use(i18n).mount('#app')
