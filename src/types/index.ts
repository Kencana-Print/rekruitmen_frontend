/** Tipe data bersama untuk frontend. */

export interface User {
  kode: string
  nama: string
  bagian: string | null
  is_hrd: number
  jab_kode?: string | null
  dep_kode?: string | null
  pab_kode?: string | null
}

export interface ApiEnvelope<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

/** Baris data dinamis (nama kolom mengikuti query backend). */
export type AnyRecord = Record<string, any>

export interface RecruitmentRow extends AnyRecord {}
export interface SlaRow extends AnyRecord {}
export interface ApprovalRow extends AnyRecord {}

export interface JabatanRule {
  jab_kode: string
  jab_nama?: string
  min_days: number
  is_flexible: number | boolean
  [key: string]: any
}

export interface BagianItem {
  bag_id: number
  bag_nama: string
  bag_active: number
  [key: string]: any
}

export interface DashboardStats {
  totalRequests?: number
  pendingApproval?: number
  approved?: number
  rejected?: number
  [key: string]: any
}

export interface MonitoringSummary {
  overdueRequests?: number
  needUserUpdate?: number
  [key: string]: any
}
