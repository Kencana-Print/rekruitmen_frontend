import api from './axios'

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: { username: string; password: string; expiredDays?: number }) =>
    api.post('/auth/login', body),
  me: () => api.get('/auth/me'),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', body),
  logout: () => api.post('/auth/logout'),
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: (period?: string | null) => api.get('/dashboard/stats', { params: { period } }),
  summary: () => api.get('/monitoring/dashboard-summary'),
}

// ── MASTER DATA ───────────────────────────────────────────────────────────────
export const masterApi = {
  jabatan: (search?: string) => api.get('/master/jabatan', { params: { search } }),
  bagian: (search?: string) => api.get('/master/bagian', { params: { search } }),
  jabatanRules: () => api.get('/recruitment/jabatan-rules'),
  holidays: (year?: number | string) => api.get('/master/holidays', year ? { params: { year } } : {}),

  // ── Bagian Master (HRD Management) ────────────────────────────────────────
  getBagianList: () => api.get('/master/bagian/list'),
  createBagian: (body: unknown) => api.post('/master/bagian', body),
  updateBagian: (id: number | string, body: unknown) => api.patch(`/master/bagian/${id}`, body),

  // ── Approval Mapping (HRD Management) ────────────────────────────────────
  getApprovalMapping: () => api.get('/master/approval-mapping'),
  addApprovalMapping: (body: unknown) => api.post('/master/approval-mapping', body),
  updateApprovalMapping: (id: number | string, body: unknown) =>
    api.patch(`/master/approval-mapping/${id}`, body),
  deleteApprovalMapping: (id: number | string) => api.delete(`/master/approval-mapping/${id}`),

  // ── Bypass Users (HRD Management) ────────────────────────────────────────
  getBypassUsers: () => api.get('/master/bypass-users'),
  addBypassUser: (body: unknown) => api.post('/master/bypass-users', body),
  updateBypassUser: (nik: string, body: unknown) => api.patch(`/master/bypass-users/${nik}`, body),
  deleteBypassUser: (nik: string) => api.delete(`/master/bypass-users/${nik}`),
  getKaryawanByNik: (nik: string) => api.get(`/master/karyawan/${nik}`),
}

// ── RECRUITMENT ───────────────────────────────────────────────────────────────
export const recruitmentApi = {
  list: () => api.get('/recruitment/my-requests'),
  detail: (nomor: string) => api.get('/recruitment/detail', { params: { nomor } }),
  save: (body: unknown) => api.post('/recruitment/save', body),
  complete: (body: unknown) => api.post('/recruitment/complete', body),
  batchDelete: (body: unknown) => api.delete('/recruitment/batch-delete', { data: body }),
  log: (nomor: string) => api.get(`/recruitment/log/${encodeURIComponent(nomor)}`),
  hiredCandidates: (nomor: string) =>
    api.get(`/recruitment/${encodeURIComponent(nomor)}/hired-candidates`),
  cancelCandidate: (nomor: string, body: unknown) =>
    api.post(`/recruitment/${encodeURIComponent(nomor)}/cancel-candidate`, body),
  setEditable: (nomor: string, body: unknown) =>
    api.patch(`/recruitment/${encodeURIComponent(nomor)}/editable`, body),
  syncManual: () => api.post('/recruitment/sync-manual').catch(() => null),
}

// ── APPROVAL ──────────────────────────────────────────────────────────────────
export const approvalApi = {
  listAtasan: (status?: string) => api.get('/recruitment/approval/atasan', { params: { status } }),
  actionAtasan: (body: unknown) => api.post('/recruitment/approval/atasan/action', body),
  listHrd: (status?: string) => api.get('/recruitment/approval/hrd', { params: { status } }),
  actionHrd: (body: unknown) => api.post('/recruitment/approval/hrd/action', body),
}

// ── MONITORING ────────────────────────────────────────────────────────────────
export const monitoringApi = {
  slaStatus: () => api.get('/monitoring/sla-status'),
  slaDetail: (nomor: string) => api.get(`/monitoring/sla-detail/${encodeURIComponent(nomor)}`),
  kpiHrd: (period?: string) => api.get('/monitoring/kpi-hrd', { params: { period } }),
  kpiApprover: (period?: string) => api.get('/monitoring/kpi-approver', { params: { period } }),
}

// ── CLIENT LOGS (public) ──────────────────────────────────────────────────────
export const logsApi = {
  send: (body: unknown) => api.post('/logs', body),
}
