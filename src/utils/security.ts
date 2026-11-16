/**
 * security.ts — Utilitas keamanan terpusat
 *
 *  - sanitizeApiError()        → filter pesan error API sebelum ditampilkan ke user
 *  - saveUsernameToHistory()   → simpan username dengan obfuskasi ke localStorage
 *  - loadUsernameHistory()     → baca daftar username yang tersimpan
 *  - clearUsernameHistory()    → hapus riwayat username
 *  - saveUserToStorage()       → simpan data user minimal ke sessionStorage
 *  - loadUserFromStorage()     → baca data user dari sessionStorage
 *  - clearUserFromStorage()    → hapus data user dari storage
 */

import type { User } from '@/types'

// ── API Error Sanitizer ───────────────────────────────────────────────────────
const INTERNAL_ERROR_PATTERNS = [
  /sql/i,
  /syntax error/i,
  /column ['"`]?.+['"`]? doesn't exist/i,
  /table ['"`]?.+['"`]? doesn't exist/i,
  /connection refused/i,
  /ECONNREFUSED/,
  /stack trace/i,
  /at Object\./,
  /\.js:\d+:\d+/,
  /Cannot read propert/i,
  /undefined is not/i,
]

/**
 * Filter pesan error API agar tidak bocorkan info internal ke user.
 */
export function sanitizeApiError(
  axiosError: any,
  fallback = 'Terjadi kesalahan. Silakan coba lagi.'
): string {
  const raw = axiosError?.response?.data?.message ?? ''

  if (!raw || typeof raw !== 'string') return fallback

  // Pesan terlalu panjang → kemungkinan dump internal
  if (raw.length > 200) return fallback

  // Mengandung pola error internal → jangan tampilkan
  const isInternal = INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))
  if (isInternal) return fallback

  return raw
}

// ── Username History ──────────────────────────────────────────────────────────
// Obfuskasi sederhana agar username tidak terbaca plain text di localStorage.
// Bukan enkripsi kriptografis — attacker targeted tetap bisa reverse.

const _UH_KEY = '_pkar_uh'
const _UH_SHIFT = 13

function _encodeUsername(str: string): string | null {
  try {
    return btoa(
      encodeURIComponent(str)
        .split('')
        .map((c) => String.fromCharCode(c.charCodeAt(0) + _UH_SHIFT))
        .join('')
    )
  } catch {
    return null
  }
}

function _decodeUsername(str: string): string | null {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => String.fromCharCode(c.charCodeAt(0) - _UH_SHIFT))
        .join('')
    )
  } catch {
    return null
  }
}

/** Simpan username ke riwayat dengan obfuskasi. */
export function saveUsernameToHistory(username: string): void {
  if (!username?.trim()) return
  try {
    const cleanName = username.trim()
    const raw = localStorage.getItem(_UH_KEY)
    const decoded: string[] = raw
      ? (JSON.parse(raw) as string[]).map(_decodeUsername).filter(Boolean) as string[]
      : []
    const prev = decoded.filter((u) => u !== cleanName)
    const next = [cleanName, ...prev].slice(0, 8)
    localStorage.setItem(
      _UH_KEY,
      JSON.stringify(next.map(_encodeUsername).filter(Boolean))
    )
  } catch {
    /* silent */
  }
}

/** Baca riwayat username (sudah di-decode). */
export function loadUsernameHistory(): string[] {
  try {
    const raw = localStorage.getItem(_UH_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as string[]).map(_decodeUsername).filter(Boolean) as string[]
  } catch {
    return []
  }
}

/** Hapus seluruh riwayat username. */
export function clearUsernameHistory(): void {
  localStorage.removeItem(_UH_KEY)
}

// ── User Session Storage ──────────────────────────────────────────────────────
// Data user disimpan di sessionStorage (bukan localStorage):
//   - auto-clear saat tab/browser ditutup
//   - key tidak deskriptif mempersulit script oportunistik
//   - hanya field yang diperlukan untuk display UI

const _USER_KEY = '_pkar_u'

interface StoredUser {
  n?: string
  b?: string | null
  k?: string
  r?: number
}

/** Simpan data user minimal ke sessionStorage. */
export function saveUserToStorage(userData: User | null | undefined): void {
  if (!userData) return
  try {
    const minimal: StoredUser = {
      n: userData.nama,
      b: userData.bagian,
      k: userData.kode,
      r: userData.is_hrd,
    }
    sessionStorage.setItem(_USER_KEY, JSON.stringify(minimal))
    localStorage.removeItem('user')
  } catch {
    /* silent */
  }
}

/** Baca data user dari sessionStorage, kembalikan dengan field nama asli. */
export function loadUserFromStorage(): User | null {
  try {
    const raw = sessionStorage.getItem(_USER_KEY)
    if (raw) {
      const d = JSON.parse(raw) as StoredUser
      return {
        nama: d.n ?? '',
        bagian: d.b ?? null,
        kode: d.k ?? '',
        is_hrd: d.r ?? 0,
      }
    }
    // Fallback: localStorage lama (akan di-migrate saat login berikutnya)
    const legacy = localStorage.getItem('user')
    if (legacy) return JSON.parse(legacy) as User
    return null
  } catch {
    return null
  }
}

/** Hapus data user dari semua storage. */
export function clearUserFromStorage(): void {
  try {
    sessionStorage.removeItem(_USER_KEY)
    localStorage.removeItem('user')
  } catch {
    /* silent */
  }
}
