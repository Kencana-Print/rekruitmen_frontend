import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import toast from '@/composables/useToast'

/**
 * useSessionTimeout — deteksi inaktivitas dan warning sebelum session expired.
 *
 * Flow:
 *   tidak aktif warningMinutes → toast warning muncul
 *   tidak aktif logoutMinutes  → auto logout + redirect /login
 *   aktivitas apapun           → timer reset
 */
export function useSessionTimeout({
  warningMinutes = 25,
  logoutMinutes = 30,
} = {}) {
  const auth = useAuthStore()
  const router = useRouter()

  let warnTimer: ReturnType<typeof setTimeout> | null = null
  let logoutTimer: ReturnType<typeof setTimeout> | null = null
  let warnToastId: number | null = null

  function clearTimers() {
    if (warnTimer) clearTimeout(warnTimer)
    if (logoutTimer) clearTimeout(logoutTimer)
    warnTimer = null
    logoutTimer = null
    if (warnToastId) {
      toast.dismiss(warnToastId)
      warnToastId = null
    }
  }

  function resetTimers() {
    if (!auth.isAuthenticated) return
    clearTimers()

    const remainingMinutes = logoutMinutes - warningMinutes

    warnTimer = setTimeout(() => {
      warnToastId = toast(
        `⏰ Sesi Anda akan berakhir dalam ${remainingMinutes} menit karena tidak ada aktivitas.`,
        {
          duration: remainingMinutes * 60 * 1000,
          icon: '⚠️',
          style: {
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
          },
        }
      )
    }, warningMinutes * 60 * 1000)

    logoutTimer = setTimeout(async () => {
      clearTimers()
      toast.error('Sesi telah berakhir. Silakan login kembali.')
      await auth.logout()
      router.replace('/login')
    }, logoutMinutes * 60 * 1000)
  }

  const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
  const handleActivity = () => resetTimers()

  onMounted(() => {
    if (!auth.isAuthenticated) return
    resetTimers()
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )
  })

  watch(
    () => auth.isAuthenticated,
    (val) => {
      if (!val) clearTimers()
      else resetTimers()
    }
  )

  onBeforeUnmount(() => {
    clearTimers()
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity))
  })
}
