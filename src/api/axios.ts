import axios from 'axios'

/**
 * Instance axios terpusat.
 *
 * Token JWT TIDAK disimpan di localStorage. Autentikasi web memakai
 * httpOnly cookie yang di-set server, sehingga `withCredentials: true`
 * sudah cukup dan token tidak bisa dibaca JavaScript (kebal XSS).
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// ── Global 401 handler ───────────────────────────────────────────────────────
// Sesi berakhir di tengah pemakaian → bersihkan storage & kembalikan ke login.
const AUTH_EXEMPT = ['/auth/login', '/auth/me']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = String(err?.config?.url ?? '')

    if (status === 401 && !AUTH_EXEMPT.some((p) => url.startsWith(p))) {
      try {
        sessionStorage.removeItem('_pkar_u')
        localStorage.removeItem('user')
      } catch {
        /* silent */
      }
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    return Promise.reject(err)
  }
)

export default api
