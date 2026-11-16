import { computed, ref, type Ref } from 'vue'
import { approvalApi, recruitmentApi } from '@/api/services'
import { useAuthStore } from '@/stores/auth'
import toast from '@/composables/useToast'
import { sanitizeApiError } from '@/utils/security'
import logger from '@/utils/logger'
import type { ApprovalRow } from '@/types'

export function useApprovalList(viewMode: Ref<string>) {
  const auth = useAuthStore()

  const confirmItem = ref<{ item: ApprovalRow; action: string } | null>(null)
  const isHrdDialogItem = ref<ApprovalRow | null>(null)
  const isHrdRejectItem = ref<ApprovalRow | null>(null)
  const slaResultInfo = ref<Record<string, any> | null>(null)

  const atasanData = ref<ApprovalRow[]>([])
  const atasanLoading = ref(true)
  const atasanError = ref(false)

  const hrdData = ref<ApprovalRow[]>([])
  const hrdLoading = ref(true)
  const hrdError = ref(false)

  const atasanActionLoading = ref(false)
  const hrdApproveLoading = ref(false)
  const hrdRejectLoading = ref(false)
  const hrdApproveError = ref<string | null>(null)

  async function fetchAtasan(): Promise<void> {
    atasanLoading.value = true
    atasanError.value = false
    try {
      const r = await approvalApi.listAtasan(undefined)
      atasanData.value = (r.data.data ?? []) as ApprovalRow[]
    } catch {
      atasanError.value = true
    } finally {
      atasanLoading.value = false
    }
  }

  async function fetchHrd(): Promise<void> {
    if (!auth.isHrd) {
      hrdLoading.value = false
      return
    }
    hrdLoading.value = true
    hrdError.value = false
    try {
      const r = await approvalApi.listHrd(undefined)
      hrdData.value = (r.data.data ?? []) as ApprovalRow[]
    } catch {
      hrdError.value = true
    } finally {
      hrdLoading.value = false
    }
  }

  async function initialLoad(): Promise<void> {
    await recruitmentApi.syncManual()
    await Promise.all([fetchAtasan(), fetchHrd()])
  }

  async function refetch(): Promise<void> {
    await recruitmentApi.syncManual()
    await Promise.all([fetchAtasan(), fetchHrd()])
  }

  const list = computed(() =>
    viewMode.value === 'HRD' ? hrdData.value : atasanData.value,
  )
  const loading = computed(() =>
    viewMode.value === 'HRD' ? hrdLoading.value : atasanLoading.value,
  )
  const error = computed(() =>
    viewMode.value === 'HRD' ? hrdError.value : atasanError.value,
  )

  const isPending = (item: ApprovalRow) =>
    viewMode.value === 'HRD'
      ? Number(item.tpk_approveHRD) === 0
      : Number(item.tpk_approveatasan) === 0

  const canProcess = (item: ApprovalRow) => Number(item.can_process) === 1

  const pendingAtasanCount = computed(() =>
    atasanData.value.filter(
      (item) =>
        Number(item.tpk_approveatasan) === 0 && Number(item.can_process) === 1,
    ).length,
  )

  const pendingHrdCount = computed(() =>
    hrdData.value.filter(
      (item) =>
        Number(item.tpk_approveHRD) === 0 && Number(item.can_process) === 1,
    ).length,
  )

  async function atasanAction(tpk_nomor: string, action: string): Promise<void> {
    atasanActionLoading.value = true
    try {
      await approvalApi.actionAtasan({ tpk_nomor, action })
      if (action === 'APPROVE') {
        toast.success('Permintaan disetujui! Menunggu persetujuan HRD.')
      } else {
        toast.success('Permintaan berhasil ditolak.')
      }
      confirmItem.value = null
      await refetch()
    } catch (e) {
      logger.warn('[useApprovalList] atasanAction error:', e)
      toast.error(sanitizeApiError(e, 'Gagal memproses persetujuan.'))
    } finally {
      atasanActionLoading.value = false
    }
  }

  async function hrdApprove(tpk_nomor: string): Promise<void> {
    hrdApproveLoading.value = true
    hrdApproveError.value = null
    try {
      const data = await approvalApi.actionHrd({ tpk_nomor, action: 'APPROVE' })
      const slaInfo = (data as any)?.data?.data?.sla_info
      if (slaInfo) {
        slaResultInfo.value = slaInfo
      } else {
        toast.success('Permintaan disetujui! Rekrutmen dibuka.')
      }
      isHrdDialogItem.value = null
      await refetch()
    } catch (e: any) {
      logger.warn('[useApprovalList] hrdApprove error:', e)
      const status = e?.response?.status
      const msg = e?.response?.data?.message
      if (status === 403 && msg?.includes('sendiri')) {
        hrdApproveError.value = 'Anda tidak dapat menyetujui permintaan Anda sendiri.'
      } else if (status === 403) {
        hrdApproveError.value = msg || 'Akses ditolak.'
      } else {
        toast.error(sanitizeApiError(e, 'Gagal memproses persetujuan HRD.'))
      }
    } finally {
      hrdApproveLoading.value = false
    }
  }

  async function hrdReject(tpk_nomor: string, alasan_tolak: string): Promise<void> {
    hrdRejectLoading.value = true
    try {
      await approvalApi.actionHrd({ tpk_nomor, action: 'REJECT', alasan_tolak })
      toast.success('Permintaan ditolak oleh HRD.')
      isHrdRejectItem.value = null
      await refetch()
    } catch (e) {
      logger.warn('[useApprovalList] hrdReject error:', e)
      toast.error(sanitizeApiError(e, 'Gagal memproses penolakan.'))
    } finally {
      hrdRejectLoading.value = false
    }
  }

  return {
    list,
    loading,
    error,
    refetch,
    initialLoad,
    isPending,
    canProcess,
    pendingAtasanCount,
    pendingHrdCount,
    confirmItem,
    isHrdDialogItem,
    isHrdRejectItem,
    slaResultInfo,
    hrdApproveError,
    atasanActionLoading,
    hrdApproveLoading,
    hrdRejectLoading,
    atasanAction,
    hrdApprove,
    hrdReject,
  }
}
