<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  Clock,
  Edit2,
  Eye,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'
import { recruitmentApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import RecruitmentTableSkeleton from '@/components/ui/RecruitmentTableSkeleton.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePagination } from '@/composables/usePagination'
import toast from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { RecruitmentRow } from '@/types'
import { formatDate, getApprovalStatus, getSlaSourceMeta } from '@/utils/helpers'
import logger from '@/utils/logger'
import { matchesPeriodFilter, periodToLabel } from '@/utils/periodFilter'
import { sanitizeApiError } from '@/utils/security'

const props = defineProps<{
  initialPeriodFilter?: string | null
}>()

const STATUS_OPTS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

const ITEMS_PER_PAGE = 15
const STORAGE_KEY = 'filters:/recruitment'

const router = useRouter()
const auth = useAuthStore()

const tableWrapperRef = ref<HTMLDivElement | null>(null)

const search = ref('')
const status = ref('all')
const selected = ref<Set<string>>(new Set())
const showDeleteConfirm = ref(false)
const activePeriodFilter = ref<string | null>(props.initialPeriodFilter ?? null)
const showPeriodPicker = ref(false)
const deleting = ref(false)

const savedPage = ref(1)

onMounted(() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved) {
        search.value = saved.search ?? ''
        status.value = saved.status ?? 'all'
        if (props.initialPeriodFilter == null) {
          activePeriodFilter.value = saved.period ?? null
        }
        savedPage.value = saved.page ?? 1
      }
    }
  } catch { /* silent */ }

  recruitmentApi.syncManual().catch(err => logger.warn('Background sync failed:', err))

  const el = tableWrapperRef.value
  if (el) {
    const key = `tableScroll:${STORAGE_KEY}`
    const scrollSaved = sessionStorage.getItem(key)
    if (scrollSaved) {
      setTimeout(() => {
        if (tableWrapperRef.value) tableWrapperRef.value.scrollTop = parseInt(scrollSaved, 10)
      }, 120)
    }
  }
})

const { data: raw, isLoading, isError, reload } = useAsyncData(
  () => recruitmentApi.list().then(r => (r.data.data ?? []) as RecruitmentRow[]),
  [] as RecruitmentRow[]
)

const filtered = computed<RecruitmentRow[]>(() => {
  let list = [...raw.value]

  if (status.value === 'pending') {
    list = list.filter(r =>
      r.tpk_approveatasan !== 2 &&
      r.tpk_approveHRD !== 2 &&
      r.tpk_approveHRD !== 1
    )
  }
  if (status.value === 'approved') {
    list = list.filter(r =>
      [1, 9].includes(Number(r.tpk_approveatasan)) &&
      Number(r.tpk_approveHRD) === 1
    )
  }
  if (status.value === 'rejected') {
    list = list.filter(r => r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.jab_nama?.toLowerCase().includes(q) ||
      r.tpk_nomor?.toLowerCase().includes(q)
    )
  }

  if (activePeriodFilter.value) {
    list = list.filter(r => matchesPeriodFilter(r.tpk_tanggal, activePeriodFilter.value))
  }

  return list
})

const filterKey = computed(() => `${search.value}|${status.value}|${activePeriodFilter.value}`)

const {
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedData,
  totalItems,
} = usePagination(filtered, ITEMS_PER_PAGE, filterKey, savedPage.value)

watch([search, status, activePeriodFilter, currentPage], () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      search: search.value,
      status: status.value,
      period: activePeriodFilter.value,
      page: currentPage.value,
    }))
  } catch { /* silent */ }
})

watch(currentPage, () => {
  selected.value = new Set()
})

function handleTableScroll() {
  if (tableWrapperRef.value) {
    sessionStorage.setItem(`tableScroll:${STORAGE_KEY}`, String(tableWrapperRef.value.scrollTop))
  }
}

function toggleSelect(nomor: string, isDraft: boolean) {
  if (!isDraft) return
  const next = new Set(selected.value)
  if (next.has(nomor)) next.delete(nomor)
  else next.add(nomor)
  selected.value = next
}

function isPending(r: RecruitmentRow): boolean {
  return Number(r.tpk_approveatasan) === 0 && Number(r.tpk_approveHRD) === 0
}

function isOwner(r: RecruitmentRow): boolean {
  return r.tpk_peminta?.trim() === auth.user?.kode
}

const hasPendingItems = computed(() => raw.value.some(r => isPending(r) && isOwner(r)))

const selectableOnPage = computed(() =>
  paginatedData.value.filter(
    r => isPending(r) && isOwner(r) && Number(r.is_legacy) !== 1 && Number(r.sla_missing) !== 1
  )
)

const allCurrentPageSelected = computed(() =>
  selectableOnPage.value.length > 0 &&
  selectableOnPage.value.every(r => selected.value.has(r.tpk_nomor))
)

function handleSelectAll(checked: boolean) {
  if (checked) {
    selected.value = new Set(selectableOnPage.value.map(r => r.tpk_nomor))
  } else {
    selected.value = new Set()
  }
}

async function handleBatchDelete() {
  deleting.value = true
  try {
    await recruitmentApi.batchDelete({ tpkNomors: [...selected.value] })
    await recruitmentApi.syncManual()
    toast.success(`${selected.value.size} permintaan berhasil dihapus.`)
    selected.value = new Set()
    showDeleteConfirm.value = false
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menghapus.'))
  } finally {
    deleting.value = false
  }
}

function clearPeriodFilter(e: Event) {
  e.stopPropagation()
  activePeriodFilter.value = null
}

function handlePeriodSelect(val: string | null) {
  activePeriodFilter.value = val
  showPeriodPicker.value = false
}

function getStatusBadgeStyle(r: RecruitmentRow) {
  const isRejected = r.tpk_approveatasan === 2 || r.tpk_approveHRD === 2
  const isApproved = r.tpk_approveHRD === 1
  return {
    background: isRejected ? '#fef2f2' : isApproved ? '#f0fdf4' : '#fff7ed',
    color: isRejected ? '#991b1b' : isApproved ? '#166534' : '#c2410c',
  }
}
</script>

<template>
  <div class="space-y-5">

    <!-- STICKY HEADER -->
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

      <div class="page-header flex justify-between items-start">
        <div>
          <h1 class="page-title">Permintaan Rekruitmen</h1>
          <p class="text-sm text-slate-500 mt-0.5">{{ raw.length }} total permintaan</p>
        </div>
        <button class="btn-primary flex items-center gap-2" @click="router.push('/recruitment/new')">
          <AnimatedIcon variant="scale">
            <Plus :size="17" />
          </AnimatedIcon>
          Buat Permintaan
        </button>
      </div>

      <div class="flex flex-wrap gap-3 items-center mt-4">
        <div class="relative flex-1 min-w-48">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            class="input pl-9"
            placeholder="Cari jabatan / nomor..."
            :value="search"
            @input="search = ($event.target as HTMLInputElement).value"
          />
        </div>

        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            v-for="o in STATUS_OPTS"
            :key="o.value"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="status === o.value ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'"
            @click="status = o.value"
          >
            {{ o.label }}
          </button>
        </div>

        <button
          class="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-colors"
          :class="activePeriodFilter
            ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
            : 'bg-white text-slate-600 border-slate-200 hover:border-sapphire'"
          @click="showPeriodPicker = true"
        >
          <Calendar :size="13" />
          <span class="max-w-[100px] truncate">{{ periodToLabel(activePeriodFilter) }}</span>
          <X v-if="activePeriodFilter" :size="12" @click="clearPeriodFilter" />
        </button>

        <button
          v-if="selected.size > 0"
          class="btn-danger flex items-center gap-2"
          @click="showDeleteConfirm = true"
        >
          <AnimatedIcon variant="wiggle">
            <Trash2 :size="16" />
          </AnimatedIcon>
          Hapus ({{ selected.size }})
        </button>
      </div>

      <p
        v-if="hasPendingItems"
        class="w-full text-xs text-slate-400 flex items-center gap-1 mt-3"
      >
        <span>&#9757;</span> Centang permintaan Pending Atasan untuk menghapus.
        <span class="italic opacity-80">(Permintaan yang dibuat di sistem lama tidak dapat dihapus)</span>
      </p>
    </div>

    <p
      v-if="activePeriodFilter && activePeriodFilter === initialPeriodFilter"
      class="text-xs text-sapphire"
    >
      Difilter dari Dashboard · Tap tanggal untuk ubah
    </p>

    <!-- CONTENT -->
    <RecruitmentTableSkeleton v-if="isLoading" :rows="8" />
    <ErrorBox v-else-if="isError" message="Gagal memuat data." @retry="reload" />
    <EmptyState
      v-else-if="filtered.length === 0"
      :message="
        activePeriodFilter
          ? `Tidak ada permintaan pada periode: ${periodToLabel(activePeriodFilter)}`
          : 'Tidak ada permintaan yang cocok.'
      "
      :icon="Layers"
      action-label="Buat Permintaan"
      @action="router.push('/recruitment/new')"
    />
    <div v-else class="space-y-3">
      <div
        ref="tableWrapperRef"
        class="table-wrapper relative"
        @scroll="handleTableScroll"
      >
        <table class="w-full">
          <thead>
            <tr>
              <th class="w-8 sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                <input
                  type="checkbox"
                  class="accent-sapphire"
                  :checked="allCurrentPageSelected"
                  :disabled="selectableOnPage.length === 0"
                  @change="handleSelectAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Nomor</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Jabatan</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Bagian</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Tgl Permintaan</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Tgl Butuh</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Status</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">Target SLA</th>
              <th class="sticky top-0 z-20 bg-slate-50 border-b shadow-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in paginatedData"
              :key="r.tpk_nomor"
              :class="selected.has(r.tpk_nomor) ? 'bg-ice-blue/40' : 'hover:bg-slate-50 transition-colors'"
            >
              <td>
                <input
                  type="checkbox"
                  class="accent-sapphire"
                  :checked="selected.has(r.tpk_nomor)"
                  :disabled="!(isPending(r) && isOwner(r) && Number(r.is_legacy) !== 1 && Number(r.sla_missing) !== 1)"
                  @change="toggleSelect(r.tpk_nomor, isPending(r) && isOwner(r) && Number(r.is_legacy) !== 1 && Number(r.sla_missing) !== 1)"
                />
              </td>
              <td class="font-mono text-xs text-slate-500 whitespace-nowrap">{{ r.tpk_nomor }}</td>
              <td class="font-semibold text-navy">{{ r.jab_nama }}</td>
              <td>{{ r.tpk_bagian }}</td>
              <td class="whitespace-nowrap">{{ formatDate(r.tpk_tanggal) }}</td>
              <td class="whitespace-nowrap">{{ formatDate(r.tpk_tgl_butuh) }}</td>

              <td>
                <span
                  class="badge text-xs px-2 py-0.5 rounded-full font-semibold"
                  :style="getStatusBadgeStyle(r)"
                >
                  {{ getApprovalStatus(r.tpk_approveatasan, r.tpk_approveHRD).label }}
                </span>

                <div v-if="Number(r.is_legacy) === 1" class="mt-1">
                  <span
                    class="badge text-xs px-2 py-0.5 rounded-full font-semibold"
                    :style="{ background: '#f1f5f9', color: '#64748b' }"
                  >
                    &#128193; Sistem Lama
                  </span>
                </div>

                <div
                  v-if="([1, 9].includes(Number(r.tpk_approveatasan)) && r.tgl_approve_atasan) || (r.tpk_approveHRD === 1 && r.tgl_approve_hrd)"
                  class="flex flex-wrap gap-1 mt-1.5"
                >
                  <div
                    v-if="[1, 9].includes(Number(r.tpk_approveatasan)) && r.tgl_approve_atasan"
                    class="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"
                  >
                    <Clock :size="11" class="text-green-600 shrink-0" />
                    <span class="text-xs font-semibold text-green-700">Atasan &#10003;</span>
                    <span class="text-xs text-green-500">({{ formatDate(r.tgl_approve_atasan) }})</span>
                  </div>
                  <div
                    v-if="r.tpk_approveHRD === 1 && r.tgl_approve_hrd"
                    class="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"
                  >
                    <Clock :size="11" class="text-green-600 shrink-0" />
                    <span class="text-xs font-semibold text-green-700">HRD &#10003;</span>
                    <span class="text-xs text-green-500">({{ formatDate(r.tgl_approve_hrd) }})</span>
                  </div>
                </div>

                <div
                  v-if="r.sla_is_editable === 1"
                  class="flex items-center gap-1.5 mt-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5"
                >
                  <Edit2 :size="12" class="text-orange-500 shrink-0" />
                  <div>
                    <p class="text-xs font-semibold text-orange-600 leading-tight">HRD Minta Update Tanggal</p>
                    <p class="text-xs text-slate-400 leading-tight">Tap Edit untuk mengubah tanggal</p>
                  </div>
                </div>
              </td>

              <td class="whitespace-nowrap text-xs">
                <template v-if="r.sla_final_target_date">
                  <div class="flex flex-col gap-0.5">
                    <span class="flex items-center gap-1">
                      <Calendar :size="12" class="text-slate-400" />
                      {{ formatDate(r.sla_final_target_date) }}
                    </span>
                    <span
                      v-if="r.sla_source"
                      class="text-xs font-medium px-1.5 py-0.5 rounded w-fit"
                      :style="{ background: getSlaSourceMeta(r.sla_source).bg, color: getSlaSourceMeta(r.sla_source).text }"
                    >
                      {{ getSlaSourceMeta(r.sla_source).label }}
                    </span>
                  </div>
                </template>
                <template v-else>–</template>
              </td>

              <td>
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="btn-icon p-1.5"
                    title="Detail"
                    @click="router.push(`/recruitment/${encodeURIComponent(r.tpk_nomor)}`)"
                  >
                    <AnimatedIcon variant="scale">
                      <Eye :size="15" />
                    </AnimatedIcon>
                  </button>
                  <button
                    v-if="isOwner(r) && Number(r.is_legacy) !== 1 && Number(r.sla_missing) !== 1 && (isPending(r) || r.sla_is_editable)"
                    class="btn-icon p-1.5 text-sapphire"
                    title="Edit"
                    @click="router.push(`/recruitment/edit/${encodeURIComponent(r.tpk_nomor)}`)"
                  >
                    <AnimatedIcon variant="scale">
                      <Edit2 :size="15" />
                    </AnimatedIcon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="ITEMS_PER_PAGE"
        @page-change="setCurrentPage"
      />
    </div>

    <PeriodPickerModal
      v-if="showPeriodPicker"
      :current="activePeriodFilter"
      @select="handlePeriodSelect"
      @close="showPeriodPicker = false"
    />

    <ConfirmDialog
      :open="showDeleteConfirm"
      :title="`Hapus ${selected.size} Permintaan?`"
      message="Permintaan yang dihapus tidak dapat dikembalikan. Hanya permintaan yang belum disetujui atasan yang akan dihapus."
      confirm-text="Ya, Hapus"
      danger
      :loading="deleting"
      @close="showDeleteConfirm = false"
      @confirm="handleBatchDelete"
    />
  </div>
</template>
