/**
 * workday.ts
 *
 * Utilitas validasi hari kerja untuk sisi klien (browser).
 *
 * `holidays` adalah array string 'YYYY-MM-DD' dari endpoint
 * /api/master/holidays (→ hrd2.tharilibur di backend). HOLIDAYS_FALLBACK
 * hanya dipakai selama fetch awal belum selesai.
 */

import type { JabatanRule } from '@/types'

export const HOLIDAYS_FALLBACK = [
  // 2025
  '2025-01-01', '2025-01-27', '2025-01-29',
  '2025-03-29', '2025-03-31', '2025-04-01',
  '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05',
  '2025-04-18', '2025-05-01', '2025-05-12', '2025-05-29',
  '2025-06-06', '2025-06-27', '2025-08-17',
  '2025-09-05', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-16',
  '2026-02-17',
  '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22',
  '2026-03-23', '2026-03-24', '2026-03-25',
  '2026-04-03', '2026-04-05',
  '2026-05-01', '2026-05-14', '2026-05-27', '2026-05-31',
  '2026-06-01', '2026-06-16',
  '2026-08-17', '2026-08-25',
  '2026-12-25',
  // 2027 (partial — digantikan data API saat login)
  '2027-01-01',
]

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildSet(holidays?: string[] | null): Set<string> {
  return new Set(holidays && holidays.length > 0 ? holidays : HOLIDAYS_FALLBACK)
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 // hanya Minggu; HRD kerja Senin–Sabtu
}

function isHoliday(d: Date, holidaySet: Set<string>): boolean {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return holidaySet.has(`${y}-${m}-${day}`)
}

function isWorkday(d: Date, holidaySet: Set<string>): boolean {
  return !isWeekend(d) && !isHoliday(d, holidaySet)
}

// ── Exported functions ────────────────────────────────────────────────────────

/** Hitung tanggal setelah `days` hari kerja dari `startDate`. */
export function addWorkdays(
  startDate: Date,
  days: number,
  holidays: string[] | null = null
): Date {
  const hset = buildSet(holidays)
  const d = new Date(startDate)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (isWorkday(d, hset)) added++
  }
  return d
}

/** Hitung tanggal minimal yang diperbolehkan untuk tgl_butuh. */
export function getMinAllowedDate(
  jabKode: string,
  jabatanRules: JabatanRule[] | null | undefined,
  jumlah = 1,
  holidays: string[] | null = null
): Date | null {
  const rule = jabatanRules?.find((r) => r.jab_kode === jabKode)
  if (!rule || rule.is_flexible) return null

  let minDays = Number(rule.min_days ?? 7)

  // Bulk buffer — identik dengan backend
  if (jumlah > 1) {
    if (jumlah <= 3) minDays += 3
    else if (jumlah <= 5) minDays += 6
    else minDays += 6 + (jumlah - 5)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return addWorkdays(today, minDays, holidays)
}

export interface TglButuhValidation {
  valid: boolean
  message?: string
  minDate?: Date
}

/** Validasi tanggal butuh terhadap aturan jabatan. */
export function validateTglButuh(
  tglButuh: string,
  jabKode: string,
  jabatanRules: JabatanRule[] | null | undefined,
  jumlah = 1,
  isReSchedule = false,
  holidays: string[] | null = null
): TglButuhValidation {
  if (!tglButuh) return { valid: false, message: 'Pilih tanggal terlebih dahulu.' }

  const [y, m, d] = tglButuh.split('-').map(Number)
  const requested = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Re-schedule: cukup tidak di masa lalu
  if (isReSchedule) {
    return requested >= today
      ? { valid: true }
      : { valid: false, message: 'Untuk re-schedule, tanggal minimal adalah hari ini.' }
  }

  const rule = jabatanRules?.find((r) => r.jab_kode === jabKode)
  if (!rule || rule.is_flexible) return { valid: true }

  const minDate = getMinAllowedDate(jabKode, jabatanRules, jumlah, holidays)
  if (!minDate) return { valid: true }

  if (requested < minDate) {
    const fmtD = (dt: Date) =>
      `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`

    let msg = `Tanggal butuh minimal ${rule.min_days} hari kerja dari besok.`
    if (jumlah > 1) {
      const extra = jumlah <= 3 ? 3 : jumlah <= 5 ? 6 : 6 + (jumlah - 5)
      msg = `Tanggal butuh minimal ${rule.min_days} hari kerja (+${extra} hari buffer massal ${jumlah} orang).`
    }
    return { valid: false, message: `${msg} Saran: ${fmtD(minDate)}`, minDate }
  }

  return { valid: true }
}
