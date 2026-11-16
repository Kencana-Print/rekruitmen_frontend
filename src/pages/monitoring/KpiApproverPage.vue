<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Calendar, ChevronDown, ChevronRight, Clock, Gauge, Trophy, X,
} from 'lucide-vue-next'
import { monitoringApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import KpiDistributionSkeleton from '@/components/ui/KpiDistributionSkeleton.vue'
import KpiItemCardSkeleton from '@/components/ui/KpiItemCardSkeleton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePagination } from '@/composables/usePagination'
import { formatDate, getPerformanceMeta } from '@/utils/helpers'
import { periodToApiParam, periodToLabel } from '@/utils/periodFilter'

const ITEMS_PER_PAGE = 10

function getDelayColor(days: number): string {
  if (days <= 1) return '#00C853'
  if (days <= 3) return '#2E7D32'
  if (days <= 5) return '#F57C00'
  return '#D32F2F'
}

const period = ref('All Time')
const showPicker = ref(false)

const apiParam = computed(() => periodToApiParam(period.value))

const { data: rawData, isLoading, isError, reload } = useAsyncData(
  () => monitoringApi.kpiApprover(apiParam.value).then(r => r.data),
  {} as any
)

const items = computed<any[]>(() => rawData.value?.data ?? [])
const summary = computed(() => rawData.value?.summary ?? {})
const dist = computed(() => summary.value.performance_distribution ?? {})
const total = computed(() => summary.value.total_approvals ?? 0)

const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
  usePagination(items, ITEMS_PER_PAGE, apiParam)

function handlePickerSelect(val: string | null) {
  period.value = val === null ? 'All Time' : val
  showPicker.value = false
  reload()
}

function clearPeriod(e: Event) {
  e.stopPropagation()
  period.value = 'All Time'
  reload()
}

const distBars = [
  { key: 'fast_track_count', label: 'Fast Track (≤2 hari)', color: '#00C853' },
  { key: 'standard_review_count', label: 'Standard Review (3–5 hari)', color: '#0F52BA' },
  { key: 'extended_review_count', label: 'Extended Review (>5 hari)', color: '#F57C00' },
]
</script>

<template>
  <!-- Full-page skeleton -->
  <div v-if="isLoading" class="space-y-5">
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
      <div class="page-header mb-4">
        <div class="space-y-2">
          <div class="skeleton h-8 w-44 rounded" />
          <div class="skeleton h-4 w-52 rounded" />
        </div>
      </div>
      <div class="flex flex-col xl:flex-row gap-8 items-stretch w-full pl-5">
        <div class="flex items-center gap-6 shrink-0">
          <div class="text-center py-1 px-2">
            <div class="skeleton h-8 w-10 mx-auto rounded mb-1.5" />
            <div class="skeleton h-3 w-12 mx-auto rounded" />
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <div class="text-center py-1 px-2">
            <div class="skeleton h-8 w-16 mx-auto rounded mb-1.5" />
            <div class="skeleton h-3 w-16 mx-auto rounded" />
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <div class="text-center py-1 px-2">
            <div class="skeleton h-8 w-12 mx-auto rounded mb-1.5" />
            <div class="skeleton h-3 w-16 mx-auto rounded" />
          </div>
        </div>
        <div class="flex-1 flex items-center gap-3">
          <div class="skeleton w-5 h-5 rounded shrink-0" />
          <div class="space-y-1.5 flex-1">
            <div class="skeleton h-3 w-24 rounded" />
            <div class="skeleton h-3 w-full max-w-xs rounded" />
          </div>
        </div>
        <div class="flex items-center shrink-0 justify-end">
          <div class="skeleton h-9 w-36 rounded-xl" />
        </div>
      </div>
    </div>
    <KpiDistributionSkeleton :bars="3" />
    <div class="space-y-3 mt-4">
      <div class="skeleton h-4 w-36 rounded" />
      <div class="space-y-4">
        <KpiItemCardSkeleton v-for="i in 4" :key="i" />
      </div>
    </div>
  </div>

  <ErrorBox v-else-if="isError" message="Gagal memuat KPI Approver." @retry="reload" />

  <div v-else class="space-y-5 relative">

    <!-- STICKY HEADER -->
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">Rekap Approval</h1>
          <p class="text-sm text-slate-500 mt-0.5">Approval Performance — {{ periodToLabel(period) }}</p>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row gap-8 items-stretch w-full pl-5">

        <!-- KIRI: Total, Fast Rate, Avg Delay -->
        <div class="flex items-center gap-6 shrink-0">
          <div class="text-center py-1 px-2">
            <p class="text-2xl font-display font-black leading-none mb-1.5 text-sapphire">{{ total }}</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL</p>
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <div class="text-center py-1 px-2">
            <p
              class="text-2xl font-display font-black leading-none mb-1.5"
              :class="(summary.fast_approval_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'"
            >{{ summary.fast_approval_rate ?? 0 }}%</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FAST RATE</p>
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <div class="text-center py-1 px-2">
            <p
              class="text-2xl font-display font-black leading-none mb-1.5"
              :class="(summary.avg_approval_delay_days ?? 0) <= 3 ? 'text-green-600' : 'text-red-500'"
            >{{ Math.round(summary.avg_approval_delay_days ?? 0) }}d</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AVG DELAY</p>
          </div>
        </div>

        <!-- TENGAH: Target Ideal -->
        <div class="flex-1 flex items-center gap-3">
          <AnimatedIcon variant="wiggle">
            <Trophy :size="20" class="text-sapphire shrink-0" />
          </AnimatedIcon>
          <div>
            <p class="text-xs font-bold text-sapphire mb-0.5">Target Ideal</p>
            <p class="text-[11px] text-slate-600 leading-snug">
              Approval permintaan karyawan dalam <strong class="text-navy">≤3 hari kerja</strong> untuk memastikan proses rekrutmen berjalan lancar.
            </p>
          </div>
        </div>

        <!-- KANAN: Filter Kalender -->
        <div class="flex items-center shrink-0 justify-end">
          <button
            class="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 whitespace-nowrap"
            :class="period !== 'All Time'
              ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
              : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'"
            @click="showPicker = true"
          >
            <AnimatedIcon variant="scale">
              <Calendar :size="13" :class="period !== 'All Time' ? 'text-sapphire' : 'text-slate-400'" />
            </AnimatedIcon>
            <span class="max-w-[120px] truncate text-left">{{ periodToLabel(period) }}</span>
            <X
              v-if="period !== 'All Time'"
              :size="12"
              class="hover:text-red-500 transition-colors ml-0.5"
              @click="clearPeriod"
            />
            <ChevronDown v-else :size="13" class="text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Distribution -->
    <div class="card border border-slate-100 shadow-sm mt-2">
      <p class="font-display font-bold text-navy text-sm mb-4">SLA Velocity Distribution</p>
      <div class="space-y-4">
        <div v-for="bar in distBars" :key="bar.key">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-600">{{ bar.label }}</span>
            <span class="text-xs font-bold" :style="{ color: bar.color }">
              {{ dist[bar.key] ?? 0 }} ({{ total > 0 ? Math.round(((dist[bar.key] ?? 0) / total) * 100) : 0 }}%)
            </span>
          </div>
          <ProgressBar
            :value="total > 0 ? Math.round(((dist[bar.key] ?? 0) / total) * 100) : 0"
            :color="bar.color"
          />
        </div>
      </div>
    </div>

    <!-- Items -->
    <EmptyState v-if="items.length === 0" message="Belum ada data approval pada periode ini." />

    <div v-else class="space-y-3 mt-4">
      <p class="font-display font-bold text-navy text-sm">
        Approval Log ({{ totalItems }})
      </p>
      <div class="space-y-4">
        <div
          v-for="item in paginatedData"
          :key="`${item.tpk_nomor}-${item.approver_nik}`"
          class="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="font-display font-bold text-navy group-hover:text-sapphire transition-colors">{{ item.approver_name }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ item.jab_nama }}</p>
            </div>
            <span
              class="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full transition-colors"
              :style="{ background: getPerformanceMeta(item.approval_performance).bg, color: getPerformanceMeta(item.approval_performance).text }"
            >
              {{ getPerformanceMeta(item.approval_performance).label }}
            </span>
          </div>

          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between mb-3">
            <!-- DateBlock: REQUESTED -->
            <div class="text-center">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REQUESTED</p>
              <p class="text-xs font-bold mt-1 text-slate-700">{{ formatDate(item.request_date) }}</p>
            </div>
            <AnimatedIcon variant="slideRight">
              <ChevronRight :size="16" class="text-slate-300" />
            </AnimatedIcon>
            <!-- DateBlock: APPROVED -->
            <div class="text-center">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">APPROVED</p>
              <p class="text-xs font-bold mt-1 text-green-600">{{ formatDate(item.approved_date) }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-1.5">
              <AnimatedIcon variant="spin">
                <Clock :size="14" :style="{ color: getDelayColor(item.sla_approval_delay_days) }" />
              </AnimatedIcon>
              <span class="text-xs font-bold" :style="{ color: getDelayColor(item.sla_approval_delay_days) }">
                Duration: {{ item.sla_approval_delay_days }} days
              </span>
            </div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{ item.tpk_bagian }}</span>
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

    <PeriodPickerModal
      v-if="showPicker"
      :current="period === 'All Time' ? null : period"
      @select="handlePickerSelect"
      @close="showPicker = false"
    />
  </div>
</template>
