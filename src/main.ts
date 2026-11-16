import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Verifikasi sesi (httpOnly cookie) SEBELUM router aktif agar guard akurat.
const auth = useAuthStore(pinia)

auth
  .checkSession()
  .catch(() => undefined)
  .finally(() => {
    app.use(router)
    app.mount('#app')
  })
