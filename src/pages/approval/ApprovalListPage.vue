<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApprovalList } from '@/composables/useApprovalList'
import { usePagination } from '@/composables/usePagination'
import {
  matchesPeriodFilter,
  periodToLabel,
} from '@/utils/periodFilter'
import { formatDate } from '@/utils/helpers'
import { getApprovalJabatanLabel } from './approvalUtils'
import {
  CheckSquare,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-vue-next'
import ApprovalCard from './ApprovalCard.vue'
import HrdConfirmDialog from './HrdConfirmDialog.vue'
import HrdRejectDialog from './HrdRejectDialog.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import ApprovalCardSkeleton from '@/components/ui/ApprovalCardSkeleton.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import type { ApprovalRow } from '@/types'

const ITEMS_PER_PAGE = 10
const STORAGE_KEY = 'filters:/approval'

const router = useRouter()
const auth = useAuthStore()

const viewMode = ref(auth.isHrd ? 'HRD' : 'ATASAN')

// ── Restore session state ──────────────────────────────────────────────────
function loadSaved(): { tab?: string; search?: string; period?: string | null; page?: number } | null {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const saved = loadSaved()
const savedPage = saved?.page ?? 1

const tab = ref(saved?.tab ?? 'pending')
const search = ref(saved?.search ?? '')
const activePeriodFilter = ref<string | null>(saved?.period ?? null)
const showPeriodPicker = ref(false)

const {
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
} = useApprovalList(viewMode)

onMounted(() => {
  initialLoad()
})

// ── Counts ─────────────────────────────────────────────────────────────────
const pendingCount = computed(() => list.value.filter((item) => isPending(item)).length)
const approvedCount = computed(() => list.value.filter((item) => !isPending(item)).length)
const allCount = computed(() => list.value.length)
const actionableCount = computed(
  () => list.value.filter((item) => isPending(item) && canProcess(item)).length,
)

// ── Filtered list ──────────────────────────────────────────────────────────
const filteredList = computed(() => {
  let items = list.value as ApprovalRow[]

  if (tab.value === 'pending') {
    items = items.filter((item) => isPending(item))
  }
  if (tab.value === 'approved') {
    items = items.filter((item) => !isPending(item))
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter(
      (item) =>
        getApprovalJabatanLabel(item).toLowerCase().includes(q) ||
        item.tpk_nomor?.toLowerCase().includes(q) ||
        item.tpk_bagian?.toLowerCase().includes(q),
    )
  }

  if (activePeriodFilter.value) {
    items = items.filter((item) => {
      const dateToCheck =
        item.tpk_approveHRD !== 0
          ? item.tgl_approve_hrd
          : item.tpk_approveatasan !== 0
            ? item.tgl_approve_atasan
            : item.tpk_tanggal
      return matchesPeriodFilter(dateToCheck, activePeriodFilter.value!)
    })
  }

  return items
})

const filterKey = computed(() => `${tab.value}|${search.value}|${activePeriodFilter.value}`)
const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } = usePagination(
  filteredList,
  ITEMS_PER_PAGE,
  filterKey,
  savedPage,
)

// ── Persist filter state ───────────────────────────────────────────────────
watch(
  [tab, search, activePeriodFilter, currentPage],
  () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tab: tab.value,
          search: search.value,
          period: activePeriodFilter.value,
          page: currentPage.value,
        }),
      )
    } catch {
      /* silent */
    }
  },
)

// ── Empty message ──────────────────────────────────────────────────────────
const emptyMessage = computed(() => {
  const statusMsg =
    tab.value === 'pending'
      ? 'Tidak ada permintaan yang menunggu persetujuan'
      : tab.value === 'approved'
        ? 'Tidak ada permintaan yang sudah disetujui'
        : 'Tidak ada data approval'
  if (activePeriodFilter.value) return `${statusMsg}\npada periode: ${periodToLabel(activePeriodFilter.value)}`
  if (search.value) return `Tidak ada hasil untuk "${search.value}".`
  return statusMsg
})

// ── Status tabs ────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Belum Approve' },
  { key: 'approved', label: 'Sudah Approve' },
]

function countFor(key: string): number {
  if (key === 'all') return allCount.value
  if (key === 'pending') return pendingCount.value
  if (key === 'approved') return approvedCount.value
  return 0
}

function switchViewMode(mode: string) {
  viewMode.value = mode
  tab.value = 'pending'
}

function selectTab(key: string) {
  tab.value = key
  search.value = ''
}

function selectPeriod(val: string | null) {
  activePeriodFilter.value = val
  showPeriodPicker.value = false
}

function clearPeriod(e: MouseEvent) {
  e.stopPropagation()
  activePeriodFilter.value = null
}

function handleApprove(item: ApprovalRow) {
  if (viewMode.value === 'HRD') {
    isHrdDialogItem.value = item
  } else {
    confirmItem.value = { item, action: 'APPROVE' }
  }
}

function handleReject(item: ApprovalRow) {
  if (viewMode.value === 'HRD') {
    isHrdRejectItem.value = item
  } else {
    confirmItem.value = { item, action: 'REJECT' }
  }
}

function handleDetail(item: ApprovalRow) {
  router.push(`/recruitment/${encodeURIComponent(item.tpk_nomor)}`)
}

// ── SLA Result Dialog helper ───────────────────────────────────────────────
const slaIsSystem = computed(() => slaResultInfo.value?.sla_source === 'SYSTEM')
const slaExplanation = computed(() =>
  slaIsSystem.value
    ? 'Tanggal disesuaikan otomatis untuk memenuhi standar waktu layanan rekrutmen.'
    : (slaResultInfo.value?.explanation ?? 'Permintaan telah disetujui.'),
)
</script>

<template>
  <div class="space-y-5 relative">
    <!-- STICKY HEADER -->
    <div
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5"
    >
      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">Approval</h1>

          <!-- Role toggle (HRD only) -->
          <div v-if="auth.isHrd" class="flex gap-2 mt-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              class="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              :class="
                viewMode === 'HRD'
                  ? 'bg-white shadow text-sapphire'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="switchViewMode('HRD')"
            >
              Sebagai HRD
              <span
                v-if="pendingHrdCount > 0 && viewMode !== 'HRD'"
                class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-100"
              />
            </button>

            <button
              class="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              :class="
                viewMode === 'ATASAN'
                  ? 'bg-white shadow text-sapphire'
                  : 'text-slate-500 hover:text-slate-700'
              "
              @click="switchViewMode('ATASAN')"
            >
              Sebagai Atasan
              <span
                v-if="pendingAtasanCount > 0 && viewMode !== 'ATASAN'"
                class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-100"
              />
            </button>
          </div>
          <p v-else class="text-sm text-slate-500 mt-0.5">Persetujuan Atasan</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <!-- Search -->
        <div
          v-if="!loading && !error && (list.length > 0 || search !== '')"
          class="flex-1 min-w-48 transition-all duration-300"
        >
          <SearchInput v-model="search" placeholder="Cari jabatan / nomor / bagian..." class="w-full" />
        </div>
        <div v-else class="flex-1" />

        <!-- Status tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            v-for="t in STATUS_TABS"
            :key="t.key"
            class="relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
            :class="
              tab === t.key
                ? 'bg-white shadow text-sapphire'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            "
            @click="selectTab(t.key)"
          >
            {{ t.label }}
            <span
              v-if="countFor(t.key) > 0"
              class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
              :class="
                t.key === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : t.key === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-sapphire/10 text-sapphire'
              "
            >
              {{ countFor(t.key) }}
            </span>
            <!-- Titik merah for pending tab when not active -->
            <span
              v-if="tab !== t.key && t.key === 'pending' && actionableCount > 0"
              class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white"
            />
          </button>
        </div>

        <!-- Period filter -->
        <button
          class="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300"
          :class="
            activePeriodFilter
              ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
              : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'
          "
          @click="showPeriodPicker = true"
        >
          <Calendar
            :size="13"
            :class="activePeriodFilter ? 'text-sapphire' : 'text-slate-400'"
          />
          <span class="max-w-[120px] truncate">{{ periodToLabel(activePeriodFilter) }}</span>
          <X
            v-if="activePeriodFilter"
            :size="12"
            class="hover:text-red-500 transition-colors"
            @click="clearPeriod"
          />
        </button>
      </div>
    </div>

    <!-- ── CONTENT ── -->
    <div v-if="loading" class="space-y-4">
      <ApprovalCardSkeleton v-for="i in 4" :key="i" />
    </div>
    <ErrorBox v-else-if="error" message="Gagal memuat data approval." @retry="refetch" />
    <EmptyState v-else-if="filteredList.length === 0" :message="emptyMessage" :icon="CheckSquare" />
    <div v-else class="space-y-3">
      <div class="space-y-4">
        <ApprovalCard
          v-for="item in paginatedData"
          :key="item.tpk_nomor"
          :item="item"
          :is-hrd="viewMode === 'HRD'"
          :pending="isPending(item) && canProcess(item)"
          :current-user-kode="auth.user?.kode"
          @approve="handleApprove(item)"
          @reject="handleReject(item)"
          @detail="handleDetail(item)"
        />
      </div>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="ITEMS_PER_PAGE"
        @page-change="setCurrentPage"
      />
    </div>

    <!-- Period Picker -->
    <PeriodPickerModal
      v-if="showPeriodPicker"
      :current="activePeriodFilter"
      @select="selectPeriod"
      @close="showPeriodPicker = false"
    />

    <!-- Atasan Confirm Dialog -->
    <ConfirmDialog
      v-if="confirmItem"
      open
      :title="confirmItem.action === 'APPROVE' ? 'Setujui Permintaan?' : 'Tolak Permintaan?'"
      :message="`${getApprovalJabatanLabel(confirmItem.item)} — ${confirmItem.item.tpk_bagian}\nJumlah: ${confirmItem.item.tpk_jumlah} orang`"
      :confirm-text="confirmItem.action === 'APPROVE' ? 'Setujui' : 'Tolak'"
      :danger="confirmItem.action === 'REJECT'"
      :loading="atasanActionLoading"
      @close="confirmItem = null"
      @confirm="atasanAction(confirmItem!.item.tpk_nomor, confirmItem!.action)"
    />

    <!-- HRD Confirm Dialog -->
    <HrdConfirmDialog
      v-if="isHrdDialogItem"
      :item="isHrdDialogItem"
      :loading="hrdApproveLoading"
      :error-message="hrdApproveError"
      @confirm="hrdApprove(isHrdDialogItem!.tpk_nomor)"
      @close="isHrdDialogItem = null; hrdApproveError = null"
    />

    <!-- HRD Reject Dialog -->
    <HrdRejectDialog
      v-if="isHrdRejectItem"
      :item="isHrdRejectItem"
      :loading="hrdRejectLoading"
      @confirm="(alasan: string) => hrdReject(isHrdRejectItem!.tpk_nomor, alasan)"
      @close="isHrdRejectItem = null"
    />

    <!-- SLA Result Dialog -->
    <Teleport to="body">
      <div
        v-if="slaResultInfo"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @click.self="slaResultInfo = null"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-center gap-3">
            <AnimatedIcon variant="wiggle">
              <AlertTriangle v-if="slaIsSystem" :size="24" class="text-amber-500 shrink-0" />
              <CheckCircle2 v-else :size="24" class="text-green-600 shrink-0" />
            </AnimatedIcon>
            <h3 class="font-display font-bold text-navy text-lg">Rekrutmen Dibuka!</h3>
          </div>
          <p
            class="text-xs font-bold uppercase tracking-wide"
            :class="slaIsSystem ? 'text-amber-600' : 'text-green-700'"
          >
            {{ slaIsSystem ? '⚠️ Catatan Sistem:' : '✅ SLA Mulai Berjalan:' }}
          </p>
          <p class="text-sm text-slate-600 leading-relaxed">{{ slaExplanation }}</p>
          <div
            v-if="slaResultInfo.final_target_date"
            class="bg-slate-50 rounded-xl p-4 space-y-1 border border-slate-100"
          >
            <p class="text-xs text-slate-400 font-medium">Target Rekrutmen Selesai:</p>
            <p class="text-xl font-display font-black text-sapphire">
              {{ formatDate(slaResultInfo.final_target_date) }}
            </p>
          </div>
          <button class="btn-primary w-full justify-center mt-2" @click="slaResultInfo = null">
            Mengerti
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
