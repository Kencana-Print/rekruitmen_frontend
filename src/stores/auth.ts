import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/axios'
import type { User } from '@/types'
import {
  saveUserToStorage,
  loadUserFromStorage,
  clearUserFromStorage,
} from '@/utils/security'

/**
 * Auth store — mengelola state autentikasi berbasis httpOnly cookie.
 *
 *  1. Token TIDAK disimpan di localStorage (rentan XSS) → httpOnly cookie
 *  2. Data user disimpan di sessionStorage dengan key samar
 *  3. `isAuthenticated` adalah flag di memori, bukan token asli
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(loadUserFromStorage())
  const isAuthenticated = ref(false)
  const loading = ref(true)

  const isHrd = computed(() => Number(user.value?.is_hrd) === 1)

  function clearLocalState() {
    user.value = null
    isAuthenticated.value = false
    clearUserFromStorage()
    delete api.defaults.headers.common['Authorization']
  }

  /** Verifikasi sesi saat app pertama kali dimuat. */
  async function checkSession(): Promise<void> {
    loading.value = true
    try {
      const res = await api.get('/auth/me')
      if (res.data?.success && res.data?.data) {
        user.value = res.data.data as User
        isAuthenticated.value = true
        saveUserToStorage(user.value)
      } else {
        clearLocalState()
      }
    } catch {
      clearLocalState()
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string, expiredDays?: number): Promise<User> {
    const { data } = await api.post('/auth/login', { username, password, expiredDays })
    const u = data.data.user as User
    isAuthenticated.value = true
    user.value = u
    saveUserToStorage(u)
    return u
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // Lanjutkan logout meski request gagal
    }
    clearLocalState()
  }

  return {
    user,
    isAuthenticated,
    loading,
    isHrd,
    login,
    logout,
    checkSession,
    clearLocalState,
  }
})
