<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Activity, Calendar, Clock, ChevronDown, Edit2, Users, X,
} from 'lucide-vue-next'
import { monitoringApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import SlaCardSkeleton from '@/components/ui/SlaCardSkeleton.vue'
import SlaStatsSkeleton from '@/components/ui/SlaStatsSkeleton.vue'
import { usePagination } from '@/composables/usePagination'
import toast from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate, getDaysColor, getSlaStatusMeta } from '@/utils/helpers'
import { matchesPeriodFilter, periodToLabel } from '@/utils/periodFilter'
import { sanitizeApiError } from '@/utils/security'

const props = defineProps<{
  initialStatusFilter?: string
  initialPeriodFilter?: string | null
}>()

const ITEMS_PER_PAGE = 12
const STORAGE_KEY = 'filters:/monitoring'

const FILTERS = [
  { key: 'ALL', label: 'Semua', color: 'sapphire' },
  { key: 'NEED_USER_UPDATE', label: 'Perlu Update', color: 'orange' },
  { key: 'OVERDUE', label: 'Terlambat', color: 'red' },
  { key: 'CRITICAL', label: 'Kritis', color: 'red' },
  { key: 'ON_PROGRESS', label: 'Normal', color: 'sapphire' },
  { key: 'APPROVAL_DELAYED', label: 'Approval Tertunda', color: 'amber' },
  { key: 'COMPLETED', label: 'Selesai', color: 'green' },
]

function getFilterClasses(color: string, isActive: boolean): string {
  if (isActive) {
    const map: Record<string, string> = {
      sapphire: 'bg-white shadow text-sapphire',
      orange: 'bg-white shadow text-orange-600',
      red: 'bg-white shadow text-red-600',
      amber: 'bg-white shadow text-amber-600',
      green: 'bg-white shadow text-green-600',
    }
    return map[color] || 'bg-white shadow text-sapphire'
  }
  return 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
}

function getBadgeClasses(color: string): string {
  const map: Record<string, string> = {
    sapphire: 'bg-sapphire/10 text-sapphire',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
  }
  return map[color] || 'bg-sapphire/10 text-sapphire'
}

function matchesSlaItemPeriod(item: any, period: string | null): boolean {
  const dateStr = item.ui_status_tag === 'COMPLETED' ? (item.sla_completed_at || item.tpk_tanggal) : item.tpk_tanggal
  return matchesPeriodFilter(dateStr, period)
}

const auth = useAuthStore()
const router = useRouter()

const isLoading = ref(true)
const isError = ref(false)
const items = ref<any[]>([])
const summary = ref<any>({})

let _saved: any = null
try {
  _saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
} catch { /* silent */ }

const savedPage = _saved?.page ?? 1

const filter = ref<string>(_saved ? _saved.filter : (props.initialStatusFilter || 'ALL'))
const activePeriodFilter = ref<string | null>(_saved ? _saved.period : (props.initialPeriodFilter || null))
const showPeriodPicker = ref(false)

async function fetchData() {
  isLoading.value = true
  isError.value = false
  try {
    const r = await monitoringApi.slaStatus()
    items.value = r.data.data ?? []
    summary.value = r.data.summary ?? {}
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchData()
  intervalId = setInterval(fetchData, 60_000)
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})

const filtered = computed(() => {
  let result: any[]
  if (filter.value === 'ALL') result = items.value
  else if (filter.value === 'ACTIVE') result = items.value.filter(i => i.sla_status === 'CALCULATED')
  else if (filter.value === 'NEED_USER_UPDATE') result = items.value.filter(i => i.sla_is_editable === 1)
  else if (filter.value === 'APPROVAL_DELAYED') result = items.value.filter(i => i.approval_flag === 'APPROVAL_DELAYED')
  else result = items.value.filter(i => i.ui_status_tag === filter.value)

  if (activePeriodFilter.value) {
    result = result.filter(i => matchesSlaItemPeriod(i, activePeriodFilter.value))
  }

  return result
})

const filterKey = computed(() => `${filter.value}|${activePeriodFilter.value}`)
const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
  usePagination(filtered, ITEMS_PER_PAGE, filterKey, savedPage)

watch([filter, activePeriodFilter, currentPage], () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      filter: filter.value, period: activePeriodFilter.value, page: currentPage.value,
    }))
  } catch { /* silent */ }
})

const approvalDelayedCount = computed(() => items.value.filter(i => i.approval_flag === 'APPROVAL_DELAYED').length)
const isFromDashboard = computed(() =>
  (props.initialStatusFilter || props.initialPeriodFilter) &&
  (filter.value === props.initialStatusFilter || activePeriodFilter.value === props.initialPeriodFilter)
)

function clearAllFilters() {
  filter.value = 'ALL'
  activePeriodFilter.value = null
}

const progressPercentage = computed(() =>
  ((summary.value.total_hired ?? 0) / (summary.value.total_target || 1)) * 100
)

function getFilterCount(f: { key: string }): number {
  if (f.key === 'ALL') return items.value.length
  if (f.key === 'NEED_USER_UPDATE') return summary.value.need_update ?? 0
  if (f.key === 'APPROVAL_DELAYED') return approvalDelayedCount.value
  return items.value.filter(i => i.ui_status_tag === f.key).length
}

function onFilterClick(key: string) {
  filter.value = key
  activePeriodFilter.value = null
}

function onSlaCardClick(item: any) {
  router.push(`/monitoring/${encodeURIComponent(item.tpk_nomor)}`)
}

function onSlaCardEdit(item: any) {
  router.push(`/recruitment/edit/${encodeURIComponent(item.tpk_nomor)}`)
}

function onPeriodSelect(val: string | null) {
  activePeriodFilter.value = val
  showPeriodPicker.value = false
}

function onClearPeriod(e: Event) {
  e.stopPropagation()
  activePeriodFilter.value = null
}
</script>

<template>
  <div class="space-y-5 relative">

    <!-- STICKY HEADER -->
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">SLA Monitoring</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            <span v-if="isLoading" class="skeleton inline-block h-3.5 w-32 rounded" />
            <template v-else>{{ summary.total_active ?? 0 }} permintaan aktif</template>
          </p>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between w-full pl-6">

        <!-- Progress stats -->
        <div v-if="isLoading" class="flex items-center gap-4 shrink-0">
          <div class="skeleton h-6 w-16 rounded" />
          <div class="w-px h-6 bg-slate-200" />
          <div class="skeleton h-6 w-16 rounded" />
          <div class="hidden sm:block skeleton h-2 w-24 rounded-full ml-2" />
        </div>
        <div v-else class="flex items-center gap-4 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hired</span>
            <span class="text-lg font-black text-green-600 leading-none">{{ summary.total_hired ?? 0 }}</span>
          </div>
          <div class="w-px h-6 bg-slate-200" />
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
            <span class="text-lg font-black text-sapphire leading-none">{{ summary.total_target ?? 0 }}</span>
          </div>
          <div class="hidden sm:block w-24 ml-2">
            <ProgressBar :value="progressPercentage" color="#0F52BA" />
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-2 xl:justify-end">
          <div class="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            <template v-for="f in FILTERS" :key="f.key">
              <button
                v-if="getFilterCount(f) > 0 || f.key === 'ALL'"
                class="relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1.5"
                :class="getFilterClasses(f.color, filter === f.key)"
                @click="onFilterClick(f.key)"
              >
                {{ f.label }}
                <span
                  class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold transition-colors"
                  :class="getBadgeClasses(f.color)"
                >
                  {{ getFilterCount(f) }}
                </span>
              </button>
            </template>
          </div>

          <button
            class="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 whitespace-nowrap"
            :class="activePeriodFilter
              ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
              : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'"
            @click="showPeriodPicker = true"
          >
            <Calendar :size="13" :class="activePeriodFilter ? 'text-sapphire' : 'text-slate-400'" />
            <span class="max-w-[100px] truncate">{{ periodToLabel(activePeriodFilter) }}</span>
            <X
              v-if="activePeriodFilter"
              :size="12"
              class="hover:text-red-500 transition-colors"
              @click="onClearPeriod"
            />
            <ChevronDown v-else :size="13" class="text-slate-400" />
          </button>
        </div>
      </div>

      <div
        v-if="activePeriodFilter || (filter !== 'ALL' && !isFromDashboard)"
        class="flex items-center gap-2 mt-3"
      >
        <span class="text-xs text-[#A6C5D7] font-medium">
          {{ isFromDashboard ? 'Difilter dari Dashboard · Tap tanggal untuk ubah' : 'Filter kustom aktif' }}
        </span>
        <button
          v-if="!isFromDashboard"
          class="text-xs text-red-500 hover:underline font-semibold flex items-center gap-1"
          @click="clearAllFilters"
        >
          <X :size="12" /> Reset Filter
        </button>
      </div>
    </div>

    <!-- CONTENT -->
    <ErrorBox v-if="isError" message="Gagal memuat data monitoring." @retry="fetchData" />

    <template v-else-if="isLoading">
      <SlaStatsSkeleton />
      <div class="space-y-4 mt-4">
        <SlaCardSkeleton v-for="i in 6" :key="i" />
      </div>
    </template>

    <template v-else>
      <div
        v-if="!auth.isHrd && summary.monitoring_bawahan != null"
        class="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3"
      >
        <Activity :size="18" class="text-sapphire shrink-0" />
        <p class="text-sm font-medium text-sapphire">
          Monitoring {{ summary.monitoring_bawahan }} permintaan bawahan
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <button
          class="card py-3 px-2 text-center transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7]"
          :class="filter === 'ACTIVE' && !activePeriodFilter ? 'ring-2 ring-sapphire border-transparent shadow-sm' : ''"
          @click="onFilterClick('ACTIVE')"
        >
          <p class="text-xl font-display font-black text-sapphire">{{ summary.total_active ?? 0 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">Total Aktif</p>
        </button>
        <button
          class="card py-3 px-2 text-center transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7]"
          :class="filter === 'CRITICAL' ? 'ring-2 ring-sapphire border-transparent shadow-sm' : ''"
          @click="onFilterClick('CRITICAL')"
        >
          <p class="text-xl font-display font-black text-red-500">{{ summary.critical ?? 0 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">Kritis</p>
        </button>
        <button
          class="card py-3 px-2 text-center transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7]"
          :class="filter === 'WARNING' ? 'ring-2 ring-sapphire border-transparent shadow-sm' : ''"
          @click="onFilterClick('WARNING')"
        >
          <p class="text-xl font-display font-black text-amber-500">{{ summary.warning ?? 0 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">Warning</p>
        </button>
      </div>

      <EmptyState
        v-if="filtered.length === 0"
        :message="
          activePeriodFilter
            ? `Tidak ada data &quot;${FILTERS.find(f => f.key === filter)?.label ?? filter}&quot; pada periode ${periodToLabel(activePeriodFilter)}.`
            : 'Tidak ada data dengan filter ini.'
        "
        :icon="Activity"
      />

      <div v-else class="space-y-3 mt-4">
        <div class="space-y-4">
          <div
            v-for="item in paginatedData"
            :key="item.tpk_nomor"
            class="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300 cursor-pointer"
            @click="onSlaCardClick(item)"
          >
            <div class="flex items-start justify-between mb-3">
              <span
                class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors"
                :style="{ background: getSlaStatusMeta(item.ui_status_tag).bg, color: getSlaStatusMeta(item.ui_status_tag).text }"
              >
                {{ getSlaStatusMeta(item.ui_status_tag).label }}
              </span>

              <div class="flex items-center gap-2" @click.stop>
                <template v-if="item.ui_status_tag !== 'COMPLETED' && item.sla_is_editable === 1">
                  <div
                    v-if="item.is_bawahan === 1"
                    class="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-full px-2.5 py-1"
                  >
                    <AnimatedIcon variant="wiggle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF8F00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </AnimatedIcon>
                    <span class="text-[10px] font-bold text-amber-700">
                      Ingatkan {{ item.nama_peminta?.split(' ')[0] }}
                    </span>
                  </div>
                  <button
                    v-else
                    class="text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors"
                    :class="
                      !auth.isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1
                        ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                        : 'bg-orange-50 text-orange-500 border-orange-200 cursor-default'
                    "
                    @click="!auth.isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1 ? onSlaCardEdit(item) : undefined"
                  >
                    <AnimatedIcon v-if="!auth.isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1" variant="scale">
                      <Edit2 :size="10" />
                    </AnimatedIcon>
                    <Edit2 v-else :size="10" />
                    {{ !auth.isHrd && item.is_bawahan !== 1 && item.sla_is_editable === 1 ? 'Update Tgl' : 'Menunggu Update' }}
                  </button>
                </template>

                <span
                  v-if="item.ui_status_tag !== 'COMPLETED' && item.sla_is_editable !== 1"
                  class="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 border border-slate-100"
                  :style="{ color: getDaysColor(item.days_remaining) }"
                >
                  {{ item.days_remaining < 0
                    ? `Terlambat ${-item.days_remaining}h`
                    : item.days_remaining === 0 ? 'Hari ini!'
                    : `${item.days_remaining}h lagi` }}
                </span>
              </div>
            </div>

            <div class="mb-4">
              <p class="font-display font-bold text-navy text-base group-hover:text-sapphire transition-colors">{{ item.jab_nama }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ item.tpk_bagian }} • {{ item.tpk_nomor }}</p>

              <div class="flex items-center gap-1.5 mt-2">
                <Users :size="12" class="text-slate-400" />
                <span class="text-xs text-slate-500">{{ item.nama_peminta }}</span>
                <span
                  v-if="item.is_bawahan === 1"
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-sapphire uppercase tracking-wide"
                >Bawahan</span>
              </div>
            </div>

            <div
              v-if="item.ui_status_tag !== 'COMPLETED' && item.sla_is_editable === 1 && item.is_bawahan === 1"
              class="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8F00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div>
                <p class="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Minta Update Tanggal</p>
                <p class="text-xs text-amber-700 mt-0.5 leading-snug">
                  Ingatkan <strong>{{ item.nama_peminta }}</strong> memperbarui tanggal target.
                </p>
              </div>
            </div>

            <div
              v-if="item.approval_flag === 'APPROVAL_DELAYED'"
              class="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5"
            >
              <Clock :size="13" class="text-amber-600 shrink-0" />
              <p class="text-xs text-amber-700 font-medium">
                Approval tertunda {{ item.sla_approval_delay_days }} hari{{ item.approver_name ? ` · Atasan: ${item.approver_name}` : '' }}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-50">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Progress: {{ item.sla_hired_count }}/{{ item.target_count }}
                </span>
                <span class="text-xs font-bold text-sapphire">{{ item.progress_percentage }}%</span>
              </div>
              <ProgressBar
                :value="item.progress_percentage ?? 0"
                :color="item.ui_status_tag === 'COMPLETED' ? '#2E7D32' : '#0F52BA'"
              />
            </div>

            <div class="flex items-center gap-1.5 mt-3">
              <Calendar :size="12" class="text-slate-400" />
              <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Target: {{ formatDate(item.sla_final_target_date) }}</span>
              <span
                v-if="item.ui_status_tag === 'COMPLETED' && item.sla_completed_at"
                class="text-[10px] text-green-600 font-bold ml-auto bg-green-50 px-2 py-0.5 rounded-md"
              >
                ✓ Selesai {{ formatDate(item.sla_completed_at) }}
              </span>
            </div>
          </div>
        </div>

        <PaginationControls
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="ITEMS_PER_PAGE"
          @page-change="setCurrentPage"
        />
      </div>
    </template>

    <PeriodPickerModal
      v-if="showPeriodPicker"
      :current="activePeriodFilter"
      @select="onPeriodSelect"
      @close="showPeriodPicker = false"
    />
  </div>
</template>
